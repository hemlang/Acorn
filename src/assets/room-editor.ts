/**
 * Basic room editor: place and position sprite instances in a room.
 *
 * Renders the room as a canvas. Click to place the currently selected
 * sprite. Right-click instances to delete. Drag to reposition.
 */

import {
  RoomData,
  InstancePlacement,
  SpriteData,
  generateId,
} from "../project/format.js";

export interface RoomEditorCallbacks {
  onInstancesChange: (roomId: string, instances: InstancePlacement[]) => void;
}

export class RoomEditor {
  readonly element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private room: RoomData | null = null;
  private sprites: Map<string, SpriteData> = new Map();
  private spriteImages: Map<string, HTMLImageElement> = new Map();
  private placingSpriteId: string | null = null;
  private callbacks: RoomEditorCallbacks;
  private dragTarget: InstancePlacement | null = null;
  private dragOffset = { x: 0, y: 0 };
  private gridSize = 16;

  constructor(callbacks: RoomEditorCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement("div");
    this.element.className = "room-editor-container";

    this.canvas = document.createElement("canvas");
    this.canvas.className = "room-editor-canvas";
    this.element.appendChild(this.canvas);

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context for room editor");
    this.ctx = ctx;

    // Mouse events
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /** Load a room for editing. */
  loadRoom(room: RoomData, sprites: SpriteData[]): void {
    this.room = room;
    this.sprites.clear();
    for (const s of sprites) {
      this.sprites.set(s.id, s);
    }

    this.canvas.width = room.width;
    this.canvas.height = room.height;

    // Preload sprite images
    this.preloadImages().then(() => this.render());
  }

  /** Set which sprite will be placed on click. */
  setPlacingSprite(spriteId: string | null): void {
    this.placingSpriteId = spriteId;
    this.canvas.style.cursor = spriteId ? "crosshair" : "default";
  }

  /** Redraw the room. */
  render(): void {
    if (!this.room) return;
    const { ctx, room } = this;

    // Background
    ctx.fillStyle = room.backgroundColor;
    ctx.fillRect(0, 0, room.width, room.height);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < room.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, room.height);
      ctx.stroke();
    }
    for (let y = 0; y < room.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(room.width, y);
      ctx.stroke();
    }

    // Draw instances
    for (const inst of room.instances) {
      this.drawInstance(inst);
    }
  }

  private drawInstance(inst: InstancePlacement): void {
    const sprite = this.sprites.get(inst.spriteId);
    const { ctx } = this;

    if (sprite && sprite.frames.length > 0) {
      const img = this.spriteImages.get(sprite.frames[0].dataUrl);
      if (img) {
        ctx.drawImage(
          img,
          inst.x - sprite.originX,
          inst.y - sprite.originY,
          sprite.frames[0].width,
          sprite.frames[0].height
        );
      } else {
        this.drawPlaceholder(inst, sprite);
      }
    } else {
      this.drawPlaceholder(inst, sprite ?? null);
    }

    // Selection indicator
    if (this.dragTarget === inst) {
      const size = sprite?.frames[0]?.width || 32;
      const ox = sprite?.originX || size / 2;
      const oy = sprite?.originY || size / 2;
      ctx.strokeStyle = "#7c5cfc";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(inst.x - ox - 2, inst.y - oy - 2, size + 4, size + 4);
      ctx.setLineDash([]);
    }
  }

  private drawPlaceholder(
    inst: InstancePlacement,
    sprite: SpriteData | null
  ): void {
    const { ctx } = this;
    const size = 32;
    ctx.fillStyle = "#7c5cfc";
    ctx.fillRect(inst.x - size / 2, inst.y - size / 2, size, size);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(inst.x - size / 2, inst.y - size / 2, size, size);
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      (sprite?.name || "?").slice(0, 4),
      inst.x,
      inst.y
    );
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.room) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 2) {
      // Right-click: delete instance
      const hit = this.hitTest(x, y);
      if (hit) {
        this.room.instances = this.room.instances.filter((i) => i !== hit);
        this.callbacks.onInstancesChange(this.room.id, this.room.instances);
        this.render();
      }
      return;
    }

    // Left-click: drag existing or place new
    const hit = this.hitTest(x, y);
    if (hit) {
      this.dragTarget = hit;
      this.dragOffset = { x: x - hit.x, y: y - hit.y };
      this.render();
    } else if (this.placingSpriteId) {
      // Place new instance
      const snappedX = Math.round(x / this.gridSize) * this.gridSize;
      const snappedY = Math.round(y / this.gridSize) * this.gridSize;

      const newInst: InstancePlacement = {
        id: generateId(),
        spriteId: this.placingSpriteId,
        x: snappedX,
        y: snappedY,
      };
      this.room.instances.push(newInst);
      this.callbacks.onInstancesChange(this.room.id, this.room.instances);
      this.render();
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragTarget || !this.room) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.dragOffset.x;
    const y = e.clientY - rect.top - this.dragOffset.y;

    this.dragTarget.x = Math.round(x / this.gridSize) * this.gridSize;
    this.dragTarget.y = Math.round(y / this.gridSize) * this.gridSize;
    this.render();
  }

  private onMouseUp(_e: MouseEvent): void {
    if (this.dragTarget && this.room) {
      this.callbacks.onInstancesChange(this.room.id, this.room.instances);
    }
    this.dragTarget = null;
    this.render();
  }

  private hitTest(x: number, y: number): InstancePlacement | null {
    if (!this.room) return null;

    // Search in reverse order (topmost first)
    for (let i = this.room.instances.length - 1; i >= 0; i--) {
      const inst = this.room.instances[i];
      const sprite = this.sprites.get(inst.spriteId);
      const size = sprite?.frames[0]?.width || 32;
      const ox = sprite?.originX || size / 2;
      const oy = sprite?.originY || size / 2;

      if (
        x >= inst.x - ox &&
        x <= inst.x - ox + size &&
        y >= inst.y - oy &&
        y <= inst.y - oy + size
      ) {
        return inst;
      }
    }
    return null;
  }

  private async preloadImages(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      for (const frame of sprite.frames) {
        if (this.spriteImages.has(frame.dataUrl)) continue;
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.spriteImages.set(frame.dataUrl, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = frame.dataUrl;
        });
      }
    }
  }
}
