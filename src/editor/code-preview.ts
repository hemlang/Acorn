/**
 * Code preview panel: displays generated Hemlock source code.
 */

export class CodePreview {
  private body: HTMLElement;

  constructor(bodyElement: HTMLElement) {
    this.body = bodyElement;
  }

  /** Update the displayed code. */
  update(code: string): void {
    if (!code.trim()) {
      this.body.textContent =
        "// Add event blocks and drag action blocks to see generated code";
      return;
    }

    // Simple syntax highlighting via spans
    this.body.innerHTML = "";
    const lines = code.split("\n");
    for (const line of lines) {
      const lineEl = document.createElement("div");
      lineEl.innerHTML = this.highlightLine(line);
      this.body.appendChild(lineEl);
    }
  }

  private highlightLine(line: string): string {
    // Comments
    if (line.trimStart().startsWith("//")) {
      return `<span style="color:#6a9955">${this.escapeHtml(line)}</span>`;
    }

    let result = this.escapeHtml(line);

    // Keywords
    result = result.replace(
      /\b(if|else|for|while|in|return|and|or|not|true|false|range)\b/g,
      '<span style="color:#c586c0">$1</span>'
    );

    // Built-in functions
    result = result.replace(
      /\b(print|create|destroy|random|abs|round|floor|ceil|sqrt|sin|cos)\b/g,
      '<span style="color:#dcdcaa">$1</span>'
    );

    // inst. properties
    result = result.replace(
      /\b(inst)\.(x|y|direction|speed|visible|size)\b/g,
      '<span style="color:#9cdcfe">$1</span>.<span style="color:#4fc1ff">$2</span>'
    );

    // Numbers
    result = result.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span style="color:#b5cea8">$1</span>'
    );

    // Strings
    result = result.replace(
      /(&quot;[^&]*&quot;)/g,
      '<span style="color:#ce9178">$1</span>'
    );

    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
