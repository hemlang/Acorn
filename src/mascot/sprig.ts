/**
 * Sprig the Squirrel — error display placeholder.
 *
 * Phase 1: Simple error bar with squirrel emoji.
 * Phase 3: Full animated mascot with emotes and dialogue.
 */

export class SprigError {
  private container: HTMLElement | null = null;

  /** Show the error bar inside a parent element. */
  mount(parent: HTMLElement): void {
    this.container = document.createElement("div");
    this.container.className = "game-error-bar";
    this.container.style.display = "none";
    parent.appendChild(this.container);
  }

  /** Show an error message. */
  show(message: string): void {
    if (!this.container) return;
    this.container.style.display = "flex";
    this.container.innerHTML = "";

    const icon = document.createElement("span");
    icon.className = "sprig-icon";
    icon.textContent = "\uD83D\uDC3F\uFE0F"; // chipmunk emoji as squirrel placeholder
    this.container.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = message;
    this.container.appendChild(text);
  }

  /** Hide the error bar. */
  hide(): void {
    if (!this.container) return;
    this.container.style.display = "none";
  }

  /** Remove from DOM. */
  unmount(): void {
    this.container?.remove();
    this.container = null;
  }
}

/**
 * Debug output console for print() statements.
 */
export class DebugConsole {
  private container: HTMLElement;
  private lines: string[] = [];
  private maxLines = 100;

  constructor() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      bottom: 50px;
      right: 10px;
      width: 300px;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      border: 1px solid #3a3a54;
      border-radius: 6px;
      padding: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #e0e0e8;
      z-index: 1001;
      display: none;
    `;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  log(message: string): void {
    this.lines.push(message);
    if (this.lines.length > this.maxLines) {
      this.lines.shift();
    }
    this.render();
  }

  clear(): void {
    this.lines = [];
    this.render();
  }

  show(): void {
    this.container.style.display = "block";
  }

  hide(): void {
    this.container.style.display = "none";
  }

  unmount(): void {
    this.container.remove();
  }

  private render(): void {
    this.container.innerHTML = this.lines
      .map((line) => `<div style="margin-bottom: 2px;">&gt; ${this.escapeHtml(line)}</div>`)
      .join("");
    this.container.scrollTop = this.container.scrollHeight;

    if (this.lines.length > 0) {
      this.container.style.display = "block";
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
