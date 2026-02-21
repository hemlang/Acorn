/**
 * Top toolbar: file operations, project name, run/stop.
 */

export interface ToolbarCallbacks {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onRun: () => void;
  onStop: () => void;
}

export class Toolbar {
  readonly element: HTMLElement;
  private nameSpan: HTMLSpanElement;
  private runBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;

  constructor(callbacks: ToolbarCallbacks) {
    this.element = document.createElement("div");
    this.element.className = "acorn-toolbar";

    // File buttons
    this.element.appendChild(this.makeButton("New", callbacks.onNew));
    this.element.appendChild(this.makeButton("Open", callbacks.onOpen));
    this.element.appendChild(this.makeButton("Save", callbacks.onSave));

    // Separator
    const sep = document.createElement("div");
    sep.className = "toolbar-separator";
    this.element.appendChild(sep);

    // Project name
    this.nameSpan = document.createElement("span");
    this.nameSpan.className = "toolbar-project-name";
    this.nameSpan.textContent = "Untitled";
    this.element.appendChild(this.nameSpan);

    // Separator
    const sep2 = document.createElement("div");
    sep2.className = "toolbar-separator";
    this.element.appendChild(sep2);

    // Run / Stop
    this.runBtn = this.makeButton("\u25B6 Run", callbacks.onRun);
    this.runBtn.classList.add("toolbar-run");
    this.element.appendChild(this.runBtn);

    this.stopBtn = this.makeButton("\u25A0 Stop", callbacks.onStop);
    this.stopBtn.classList.add("toolbar-stop");
    this.stopBtn.style.display = "none";
    this.element.appendChild(this.stopBtn);
  }

  setProjectName(name: string): void {
    this.nameSpan.textContent = name;
  }

  setRunning(running: boolean): void {
    this.runBtn.style.display = running ? "none" : "";
    this.stopBtn.style.display = running ? "" : "none";
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }
}
