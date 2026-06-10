/**
 * Hemlock WASM execution backend for the game engine.
 *
 * Implements the architecture's execution path: per handler run, the engine
 * serializes instance state into a Hemlock context, runs the precompiled
 * handler script via hemlock_run_script, and reads the mutated state back.
 *
 * Construction is all-or-nothing: if the prelude or any handler script fails
 * to compile, create() returns null and the engine falls back to the
 * built-in TypeScript interpreter, so a project never runs half-and-half.
 */

import { HemlockExports } from "../bridge/hemlock.js";
import { CompiledSprite, GameInstance } from "./types.js";
import {
  HEMLOCK_PRELUDE,
  generateHandlerSource,
  collectVariableNames,
  sanitizeIdentifier,
} from "./hemlock-codegen.js";

export interface HandlerRunResult {
  output: string[];
  creations: Array<{ spriteId: string; x: number; y: number }>;
  error: string | null;
}

interface SpriteScripts {
  /** Compiled script handle per handler index. */
  handles: number[];
  /** Variable names referenced anywhere in this sprite's handlers. */
  variableNames: string[];
}

export class HemlockRunner {
  private hemlock: HemlockExports;
  private ctx: number;
  private sprites: Map<string, SpriteScripts>;

  private constructor(
    hemlock: HemlockExports,
    ctx: number,
    sprites: Map<string, SpriteScripts>
  ) {
    this.hemlock = hemlock;
    this.ctx = ctx;
    this.sprites = sprites;
  }

  /**
   * Create a runner for a set of compiled sprites. Returns null if the
   * context, prelude, or any handler script fails to compile.
   */
  static create(
    hemlock: HemlockExports,
    compiledSprites: CompiledSprite[]
  ): HemlockRunner | null {
    let ctx = 0;
    const sprites = new Map<string, SpriteScripts>();

    const cleanup = () => {
      for (const scripts of sprites.values()) {
        for (const handle of scripts.handles) {
          if (handle) hemlock.hemlock_free_script(handle);
        }
      }
      if (ctx) hemlock.hemlock_context_destroy(ctx);
    };

    try {
      ctx = hemlock.hemlock_context_create();
      if (!ctx) return null;

      hemlock.hemlock_context_eval(ctx, HEMLOCK_PRELUDE);
      const preludeError = hemlock.hemlock_context_last_error(ctx);
      if (preludeError) {
        console.warn("Hemlock prelude failed:", preludeError);
        cleanup();
        return null;
      }

      for (const sprite of compiledSprites) {
        const handles: number[] = [];
        for (const handler of sprite.handlers) {
          const source = generateHandlerSource(handler);
          const handle = hemlock.hemlock_compile_script(source);
          if (!handle) {
            console.warn(
              `Hemlock failed to compile a "${handler.event}" handler for sprite ${sprite.spriteId}:\n${source}`
            );
            cleanup();
            return null;
          }
          handles.push(handle);
        }
        sprites.set(sprite.spriteId, {
          handles,
          variableNames: collectVariableNames(sprite.handlers),
        });
      }

      return new HemlockRunner(hemlock, ctx, sprites);
    } catch (err) {
      console.warn("Hemlock runner initialization failed:", err);
      cleanup();
      return null;
    }
  }

  /**
   * Run one handler for one instance. Mutates the instance in place from
   * the state Hemlock writes back. Returns null if no script exists for
   * this sprite/handler.
   */
  runHandler(
    spriteId: string,
    handlerIndex: number,
    instance: GameInstance
  ): HandlerRunResult | null {
    const scripts = this.sprites.get(spriteId);
    const handle = scripts?.handles[handlerIndex];
    if (!scripts || !handle) return null;

    const h = this.hemlock;
    const result: HandlerRunResult = { output: [], creations: [], error: null };

    // Serialize state into the context
    h.hemlock_context_set(
      this.ctx,
      "inst",
      JSON.stringify({
        x: instance.x,
        y: instance.y,
        direction: instance.direction,
        speed: instance.speed,
        visible: instance.visible,
        size: instance.size,
        destroyed: false,
      })
    );
    for (const name of scripts.variableNames) {
      h.hemlock_context_set(
        this.ctx,
        sanitizeIdentifier(name),
        JSON.stringify(instance.variables[name] ?? 0)
      );
    }
    h.hemlock_context_set(this.ctx, "__out", "[]");
    h.hemlock_context_set(this.ctx, "__new", "[]");

    // Execute
    h.hemlock_run_script(this.ctx, handle);
    const error = h.hemlock_context_last_error(this.ctx);
    if (error) {
      result.error = error;
      return result;
    }

    // Read state back
    const inst = this.getJson(this.ctx, "inst") as Record<string, unknown> | null;
    if (inst) {
      instance.x = toNumber(inst.x, instance.x);
      instance.y = toNumber(inst.y, instance.y);
      instance.direction = toNumber(inst.direction, instance.direction);
      instance.speed = toNumber(inst.speed, instance.speed);
      instance.visible = Boolean(inst.visible);
      instance.size = toNumber(inst.size, instance.size);
      if (inst.destroyed) instance.destroyed = true;
    }

    for (const name of scripts.variableNames) {
      const value = this.getJson(this.ctx, sanitizeIdentifier(name));
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "boolean"
      ) {
        instance.variables[name] = value;
      }
    }

    const out = this.getJson(this.ctx, "__out");
    if (Array.isArray(out)) {
      result.output = out.map((v) => String(v));
    }

    const created = this.getJson(this.ctx, "__new");
    if (Array.isArray(created)) {
      for (const item of created) {
        if (item && typeof item === "object") {
          const c = item as Record<string, unknown>;
          result.creations.push({
            spriteId: String(c.sprite ?? ""),
            x: toNumber(c.x, 0),
            y: toNumber(c.y, 0),
          });
        }
      }
    }

    return result;
  }

  /** Free all compiled scripts and destroy the context. */
  dispose(): void {
    for (const scripts of this.sprites.values()) {
      for (const handle of scripts.handles) {
        if (handle) this.hemlock.hemlock_free_script(handle);
      }
    }
    this.sprites.clear();
    this.hemlock.hemlock_context_destroy(this.ctx);
    this.ctx = 0;
  }

  private getJson(ctx: number, name: string): unknown {
    const raw = this.hemlock.hemlock_context_get(ctx, name);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
