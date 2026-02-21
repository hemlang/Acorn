/**
 * Game engine: manages the game loop, instances, and event dispatch.
 *
 * Per-frame flow:
 *   1. Process input
 *   2. Dispatch key_down/key_pressed/key_released events
 *   3. Dispatch step events
 *   4. Process pending creations/destructions
 *   5. Render
 */

import { AcornProject, SpriteData, RoomData, generateId } from "../project/format.js";
import {
  GameInstance,
  GameState,
  CompiledSprite,
  CompiledHandler,
  KeyboardState,
} from "./types.js";
import { InputManager } from "./input.js";
import { Renderer } from "./renderer.js";
import { executeActions } from "./interpreter.js";
import { compileWorkspace } from "../editor/compiler.js";
import { BlockWorkspace } from "../editor/workspace.js";

export interface EngineCallbacks {
  onError: (message: string) => void;
  onOutput: (message: string) => void;
  onStop: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputManager;
  private state: GameState;
  private compiledSprites: Map<string, CompiledSprite> = new Map();
  private spriteMap: Map<string, SpriteData> = new Map();
  private currentRoom: RoomData | null = null;
  private animFrameId: number = 0;
  private running: boolean = false;
  private callbacks: EngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.callbacks = callbacks;
    this.state = this.createEmptyState();
  }

  /** Start the game from a project definition. */
  async start(
    project: AcornProject,
    blockWorkspace: BlockWorkspace
  ): Promise<void> {
    if (this.running) return;

    // Build sprite map
    this.spriteMap.clear();
    for (const sprite of project.sprites) {
      this.spriteMap.set(sprite.id, sprite);
    }

    // Set up renderer
    this.renderer.setSprites(project.sprites);
    this.renderer.setSize(project.settings.gameWidth, project.settings.gameHeight);
    this.canvas.width = project.settings.gameWidth;
    this.canvas.height = project.settings.gameHeight;

    // Preload images
    await this.renderer.preloadAll();

    // Compile all sprites from their Blockly workspaces
    this.compiledSprites.clear();
    for (const sprite of project.sprites) {
      const savedState = blockWorkspace.getState(sprite.id);
      if (savedState) {
        // Create a temporary headless workspace to compile
        const tempWs = new Blockly.Workspace();
        try {
          Blockly.serialization.workspaces.load(
            savedState as Blockly.serialization.blocks.State,
            tempWs
          );
          const compiled = compileWorkspace(tempWs, sprite.id);
          this.compiledSprites.set(sprite.id, compiled);
        } finally {
          tempWs.dispose();
        }
      }
    }

    // Set up current room (first room)
    this.currentRoom = project.rooms[0] || null;
    if (!this.currentRoom) {
      this.callbacks.onError("No rooms defined in project");
      return;
    }

    // Initialize game state
    this.state = {
      instances: [],
      roomWidth: this.currentRoom.width,
      roomHeight: this.currentRoom.height,
      frame: 0,
      pendingCreations: [],
    };

    // Create instances from room placement
    for (const placement of this.currentRoom.instances) {
      this.createInstance(placement.spriteId, placement.x, placement.y);
    }

    // Fire create events for all initial instances
    this.dispatchEvent("create");

    // Start input and game loop
    this.input.attach();
    this.running = true;
    this.loop();
  }

  /** Stop the game. */
  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    this.input.detach();
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop(): void {
    if (!this.running) return;

    this.animFrameId = requestAnimationFrame(() => {
      this.update();
      this.loop();
    });
  }

  private update(): void {
    const keys = this.input.getState();

    // Dispatch key events
    this.dispatchKeyEvents(keys);

    // Dispatch step events
    this.dispatchEvent("step");

    // Process pending instance creations
    this.processPendingCreations();

    // Remove destroyed instances
    this.state.instances = this.state.instances.filter((i) => !i.destroyed);

    // Render
    this.renderer.render(
      this.state,
      this.currentRoom?.backgroundColor || "#e8e8e8"
    );

    // End frame
    this.state.frame++;
    this.input.endFrame();
  }

  private dispatchEvent(
    event: "create" | "step",
    filter?: (inst: GameInstance) => boolean
  ): void {
    const instances = filter
      ? this.state.instances.filter(filter)
      : this.state.instances;

    for (const instance of instances) {
      if (instance.destroyed) continue;

      const compiled = this.compiledSprites.get(instance.spriteId);
      if (!compiled) continue;

      for (const handler of compiled.handlers) {
        if (handler.event !== event) continue;
        const output = executeActions(handler.actions, instance, this.state);
        this.handleOutput(output);
      }
    }
  }

  private dispatchKeyEvents(keys: KeyboardState): void {
    for (const instance of this.state.instances) {
      if (instance.destroyed) continue;

      const compiled = this.compiledSprites.get(instance.spriteId);
      if (!compiled) continue;

      for (const handler of compiled.handlers) {
        if (!handler.key) continue;

        let shouldFire = false;
        switch (handler.event) {
          case "key_down":
            shouldFire = keys.justPressed.has(handler.key);
            break;
          case "key_pressed":
            shouldFire = keys.held.has(handler.key);
            break;
          case "key_released":
            shouldFire = keys.justReleased.has(handler.key);
            break;
        }

        if (shouldFire) {
          const output = executeActions(handler.actions, instance, this.state);
          this.handleOutput(output);
        }
      }
    }
  }

  private createInstance(
    spriteId: string,
    x: number,
    y: number
  ): GameInstance | null {
    const sprite = this.spriteMap.get(spriteId);
    // Also try to find by name
    let actualSpriteId = spriteId;
    let spriteName = spriteId;

    if (sprite) {
      spriteName = sprite.name;
    } else {
      // Look up by name
      for (const [id, s] of this.spriteMap) {
        if (s.name === spriteId) {
          actualSpriteId = id;
          spriteName = s.name;
          break;
        }
      }
    }

    const instance: GameInstance = {
      id: generateId(),
      spriteId: actualSpriteId,
      spriteName,
      x,
      y,
      direction: 0,
      speed: 0,
      visible: true,
      size: 1,
      imageIndex: 0,
      destroyed: false,
      variables: {},
    };

    this.state.instances.push(instance);
    return instance;
  }

  private processPendingCreations(): void {
    const creations = this.state.pendingCreations.splice(0);
    const newInstances: GameInstance[] = [];

    for (const creation of creations) {
      const inst = this.createInstance(
        creation.spriteId,
        creation.x,
        creation.y
      );
      if (inst) {
        newInstances.push(inst);
      }
    }

    // Fire create events for newly created instances
    if (newInstances.length > 0) {
      const newIds = new Set(newInstances.map((i) => i.id));
      this.dispatchEvent("create", (inst) => newIds.has(inst.id));
    }
  }

  private handleOutput(messages: string[]): void {
    for (const msg of messages) {
      if (msg.startsWith("Error:") || msg.startsWith("Warning:")) {
        this.callbacks.onError(msg);
      } else {
        this.callbacks.onOutput(msg);
      }
    }
  }

  private createEmptyState(): GameState {
    return {
      instances: [],
      roomWidth: 800,
      roomHeight: 600,
      frame: 0,
      pendingCreations: [],
    };
  }
}

// Import Blockly for headless workspace compilation
import * as Blockly from "blockly";
