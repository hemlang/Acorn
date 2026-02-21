/**
 * Keyboard input handling for the game runtime.
 *
 * Tracks which keys are held, just pressed, and just released each frame.
 */

import { KeyboardState } from "./types.js";

export class InputManager {
  private state: KeyboardState = {
    held: new Set(),
    justPressed: new Set(),
    justReleased: new Set(),
  };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
  }

  /** Start listening for keyboard events. */
  attach(): void {
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  /** Stop listening for keyboard events. */
  detach(): void {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.state.held.clear();
    this.state.justPressed.clear();
    this.state.justReleased.clear();
  }

  /** Get the current keyboard state. Call once per frame. */
  getState(): KeyboardState {
    return this.state;
  }

  /**
   * Clear per-frame transient state (justPressed, justReleased).
   * Call at the END of each frame after all events have been processed.
   */
  endFrame(): void {
    this.state.justPressed.clear();
    this.state.justReleased.clear();
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Prevent default for game keys to avoid scrolling, etc.
    if (this.isGameKey(e.key)) {
      e.preventDefault();
    }

    if (!this.state.held.has(e.key)) {
      this.state.justPressed.add(e.key);
    }
    this.state.held.add(e.key);
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (this.isGameKey(e.key)) {
      e.preventDefault();
    }

    this.state.held.delete(e.key);
    this.state.justReleased.add(e.key);
  }

  private isGameKey(key: string): boolean {
    return (
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === " "
    );
  }
}
