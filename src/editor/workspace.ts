/**
 * Blockly workspace management.
 *
 * Handles creating, switching, and serializing Blockly workspaces
 * for different sprites.
 */

import * as Blockly from "blockly";
import { TOOLBOX_CONFIG } from "./toolbox.js";
import { registerBlocks } from "./blocks.js";
import { createHemlockGenerator } from "./generators.js";

let blocksRegistered = false;

export class BlockWorkspace {
  private workspace: Blockly.WorkspaceSvg | null = null;
  private container: HTMLElement | null = null;
  private hemlockGen: Blockly.Generator;
  private currentSpriteId: string | null = null;
  /** Saved workspace states keyed by sprite ID. */
  private savedStates: Map<string, object> = new Map();
  private changeCallback: (() => void) | null = null;

  constructor() {
    if (!blocksRegistered) {
      registerBlocks();
      blocksRegistered = true;
    }
    this.hemlockGen = createHemlockGenerator();
  }

  /** Mount the Blockly workspace into a container element. */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create the Blockly div
    const blocklyDiv = document.createElement("div");
    blocklyDiv.className = "blockly-container";
    container.appendChild(blocklyDiv);

    this.workspace = Blockly.inject(blocklyDiv, {
      toolbox: TOOLBOX_CONFIG,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#333350",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 2,
        minScale: 0.3,
        scaleSpeed: 1.1,
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: false,
      },
      renderer: "zelos",
      theme: this.createTheme(),
    });

    // Listen for changes
    this.workspace.addChangeListener(
      (event: Blockly.Events.Abstract) => {
        if (
          event.type === Blockly.Events.BLOCK_MOVE ||
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE
        ) {
          this.changeCallback?.();
        }
      }
    );
  }

  /** Unmount and dispose of the Blockly workspace. */
  unmount(): void {
    if (this.workspace) {
      this.saveCurrentState();
      this.workspace.dispose();
      this.workspace = null;
    }
    if (this.container) {
      this.container.innerHTML = "";
      this.container = null;
    }
  }

  /** Switch to editing a specific sprite's blocks. */
  loadSprite(spriteId: string, savedState?: unknown): void {
    if (!this.workspace) return;

    // Save current sprite's state
    this.saveCurrentState();

    this.currentSpriteId = spriteId;
    this.workspace.clear();

    // Load from provided state or saved state
    const state = savedState || this.savedStates.get(spriteId);
    if (state && typeof state === "object") {
      Blockly.serialization.workspaces.load(
        state as Blockly.serialization.blocks.State,
        this.workspace
      );
    }
  }

  /** Save the current workspace state for the current sprite. */
  saveCurrentState(): void {
    if (!this.workspace || !this.currentSpriteId) return;
    const state = Blockly.serialization.workspaces.save(this.workspace);
    this.savedStates.set(this.currentSpriteId, state);
  }

  /** Get the serialized state for a specific sprite. */
  getState(spriteId: string): object | undefined {
    // If it's the current sprite, save first
    if (spriteId === this.currentSpriteId) {
      this.saveCurrentState();
    }
    return this.savedStates.get(spriteId);
  }

  /** Set the saved state for a sprite (used when loading projects). */
  setState(spriteId: string, state: unknown): void {
    if (state && typeof state === "object") {
      this.savedStates.set(spriteId, state as object);
    }
  }

  /** Remove saved state for a deleted sprite. */
  removeState(spriteId: string): void {
    this.savedStates.delete(spriteId);
    if (this.currentSpriteId === spriteId) {
      this.currentSpriteId = null;
      this.workspace?.clear();
    }
  }

  /** Generate Hemlock source code from the current workspace. */
  generateCode(): string {
    if (!this.workspace) return "";
    return this.hemlockGen.workspaceToCode(this.workspace);
  }

  /** Get the raw Blockly workspace (for compilation). */
  getWorkspace(): Blockly.WorkspaceSvg | null {
    return this.workspace;
  }

  /** Get the current sprite ID being edited. */
  getCurrentSpriteId(): string | null {
    return this.currentSpriteId;
  }

  /** Register a callback for workspace changes. */
  onChange(cb: () => void): void {
    this.changeCallback = cb;
  }

  /** Resize the workspace to fit its container. */
  resize(): void {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  }

  /** Clear all saved states. */
  clearAll(): void {
    this.savedStates.clear();
    this.currentSpriteId = null;
    this.workspace?.clear();
  }

  private createTheme(): Blockly.Theme {
    return Blockly.Theme.defineTheme("acorn", {
      name: "acorn",
      base: Blockly.Themes.Zelos,
      componentStyles: {
        workspaceBackgroundColour: "#1e1e2e",
        toolboxBackgroundColour: "#252536",
        toolboxForegroundColour: "#e0e0e8",
        flyoutBackgroundColour: "#2d2d44",
        flyoutForegroundColour: "#e0e0e8",
        flyoutOpacity: 0.95,
        scrollbarColour: "#3a3a54",
        scrollbarOpacity: 0.6,
        insertionMarkerColour: "#7c5cfc",
      },
      fontStyle: {
        family: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        size: 11,
        weight: "normal",
      },
    });
  }
}
