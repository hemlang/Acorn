/**
 * Canvas 2D renderer for the game runtime.
 *
 * Draws all visible game instances onto a canvas element.
 */

import { GameInstance, GameState } from "./types.js";
import { SpriteData } from "../project/format.js";

/** Cached sprite images keyed by data URL. */
const imageCache = new Map<string, HTMLImageElement>();

/** Preload a sprite image into the cache. */
export function preloadImage(dataUrl: string): Promise<void> {
  if (imageCache.has(dataUrl)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(dataUrl, img);
      resolve();
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${dataUrl.slice(0, 50)}...`));
    };
    img.src = dataUrl;
  });
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Map<string, SpriteData> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D rendering context");
    this.ctx = ctx;
  }

  /** Set the sprite definitions for lookup during rendering. */
  setSprites(sprites: SpriteData[]): void {
    this.sprites.clear();
    for (const s of sprites) {
      this.sprites.set(s.id, s);
    }
  }

  /** Set canvas dimensions. */
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /** Preload all sprite images. */
  async preloadAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const sprite of this.sprites.values()) {
      for (const frame of sprite.frames) {
        promises.push(preloadImage(frame.dataUrl));
      }
    }
    await Promise.all(promises);
  }

  /** Clear the canvas and draw all instances. */
  render(state: GameState, backgroundColor: string): void {
    const { ctx } = this;

    // Clear
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw instances in order (first created = back)
    for (const instance of state.instances) {
      if (!instance.visible || instance.destroyed) continue;
      this.drawInstance(instance);
    }
  }

  private drawInstance(instance: GameInstance): void {
    const sprite = this.sprites.get(instance.spriteId);
    if (!sprite || sprite.frames.length === 0) {
      // Draw a placeholder rectangle
      this.drawPlaceholder(instance);
      return;
    }

    const frameIndex = Math.floor(instance.imageIndex) % sprite.frames.length;
    const frame = sprite.frames[frameIndex];
    const img = imageCache.get(frame.dataUrl);

    if (!img) {
      this.drawPlaceholder(instance);
      return;
    }

    const { ctx } = this;
    ctx.save();

    // Position at instance center
    ctx.translate(instance.x, instance.y);

    // Apply rotation
    if (instance.direction !== 0) {
      ctx.rotate((instance.direction * Math.PI) / 180);
    }

    // Apply scale
    if (instance.size !== 1) {
      ctx.scale(instance.size, instance.size);
    }

    // Draw image centered on origin
    const ox = sprite.originX;
    const oy = sprite.originY;
    ctx.drawImage(img, -ox, -oy, frame.width, frame.height);

    ctx.restore();
  }

  private drawPlaceholder(instance: GameInstance): void {
    const { ctx } = this;
    const size = 32 * instance.size;
    ctx.save();
    ctx.translate(instance.x, instance.y);

    if (instance.direction !== 0) {
      ctx.rotate((instance.direction * Math.PI) / 180);
    }

    // Colored rectangle with label
    ctx.fillStyle = "#7c5cfc";
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(8, size * 0.3)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = instance.spriteName.slice(0, 3);
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }
}
