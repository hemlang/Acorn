/**
 * Acorn — Main entry point.
 *
 * Wires together the UI, block editor, game runtime, asset management,
 * and project persistence into a working application.
 */

import "./ui/styles.css";

import { createLayout } from "./ui/layout.js";
import { Toolbar } from "./ui/toolbar.js";
import { AssetPanel, AssetSelection } from "./ui/asset-panel.js";
import { PropertiesPanel } from "./ui/properties-panel.js";
import { BlockWorkspace } from "./editor/workspace.js";
import { CodePreview } from "./editor/code-preview.js";
import { RoomEditor } from "./assets/room-editor.js";
import { showSpritePicker } from "./assets/sprite-picker.js";
import { ProjectManager } from "./project/manager.js";
import { GameEngine } from "./runtime/engine.js";
import { SprigError, DebugConsole } from "./mascot/sprig.js";

class AcornApp {
  private projectManager: ProjectManager;
  private toolbar: Toolbar;
  private assetPanel: AssetPanel;
  private propertiesPanel: PropertiesPanel;
  private blockWorkspace: BlockWorkspace;
  private codePreview: CodePreview;
  private roomEditor: RoomEditor;
  private engine: GameEngine | null = null;
  private sprigError: SprigError;
  private debugConsole: DebugConsole;

  // Layout elements
  private workspaceContent: HTMLElement;
  private workspaceTabs: HTMLElement;
  private currentTab: "blocks" | "room" = "blocks";
  private gameOverlay: HTMLElement | null = null;

  constructor() {
    const app = document.getElementById("app")!;
    const layout = createLayout(app);

    this.projectManager = new ProjectManager();

    // Initialize toolbar
    this.toolbar = new Toolbar({
      onNew: () => this.handleNew(),
      onOpen: () => this.handleOpen(),
      onSave: () => this.handleSave(),
      onRun: () => this.handleRun(),
      onStop: () => this.handleStop(),
    });
    layout.toolbar.appendChild(this.toolbar.element);

    // Initialize asset panel
    this.assetPanel = new AssetPanel({
      onSelect: (sel) => this.handleAssetSelect(sel),
      onAddSprite: () => this.handleAddSprite(),
      onAddRoom: () => this.handleAddRoom(),
      onDeleteSprite: (id) => this.handleDeleteSprite(id),
      onDeleteRoom: (id) => this.handleDeleteRoom(id),
      onRenameSprite: (id, name) => this.handleRenameSprite(id, name),
      onRenameRoom: (id, name) => this.handleRenameRoom(id, name),
    });
    layout.assetPanel.appendChild(this.assetPanel.element);

    // Initialize properties panel
    this.propertiesPanel = new PropertiesPanel({
      onSpritePropertyChange: (id, prop, val) =>
        this.handleSpritePropertyChange(id, prop, val),
      onRoomPropertyChange: (id, prop, val) =>
        this.handleRoomPropertyChange(id, prop, val),
    });
    layout.propertiesPanel.appendChild(this.propertiesPanel.element);

    // Initialize block workspace
    this.blockWorkspace = new BlockWorkspace();
    this.codePreview = new CodePreview(layout.codePreviewBody);
    this.workspaceContent = layout.workspaceContent;
    this.workspaceTabs = layout.workspaceTabs;

    // Initialize room editor
    this.roomEditor = new RoomEditor({
      onInstancesChange: (roomId, instances) => {
        const room = this.projectManager.getRoom(roomId);
        if (room) {
          room.instances = instances;
        }
      },
    });

    // Sprig error display
    this.sprigError = new SprigError();
    this.debugConsole = new DebugConsole();

    // Set up workspace tabs
    this.setupWorkspaceTabs();

    // Block workspace change listener → update code preview
    this.blockWorkspace.onChange(() => {
      this.updateCodePreview();
      this.saveBlockState();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.blockWorkspace.resize();
    });
  }

  /** Initialize the app by loading a project. */
  async init(): Promise<void> {
    const project = await this.projectManager.loadLastOrNew();
    this.toolbar.setProjectName(project.name);
    this.assetPanel.refresh(project);

    // Load block states from project
    for (const sprite of project.sprites) {
      if (sprite.blocklyState) {
        this.blockWorkspace.setState(sprite.id, sprite.blocklyState);
      }
    }

    // Select first sprite or room
    if (project.sprites.length > 0) {
      this.assetPanel.setSelection({
        type: "sprite",
        id: project.sprites[0].id,
      });
    } else if (project.rooms.length > 0) {
      this.assetPanel.setSelection({
        type: "room",
        id: project.rooms[0].id,
      });
    }
  }

  // === Event Handlers ===

  private handleNew(): void {
    if (
      this.projectManager.isDirty() &&
      !confirm("Discard unsaved changes?")
    ) {
      return;
    }

    const name = prompt("Project name:", "My Game");
    if (!name) return;

    const project = this.projectManager.newProject(name);
    this.blockWorkspace.clearAll();
    this.toolbar.setProjectName(project.name);
    this.assetPanel.refresh(project);
    this.propertiesPanel.showEmpty();
    this.updateCodePreview();

    if (project.rooms.length > 0) {
      this.assetPanel.setSelection({
        type: "room",
        id: project.rooms[0].id,
      });
    }
  }

  private async handleOpen(): Promise<void> {
    if (
      this.projectManager.isDirty() &&
      !confirm("Discard unsaved changes?")
    ) {
      return;
    }

    const project = await this.projectManager.showOpenDialog();
    if (!project) return;

    this.blockWorkspace.clearAll();
    for (const sprite of project.sprites) {
      if (sprite.blocklyState) {
        this.blockWorkspace.setState(sprite.id, sprite.blocklyState);
      }
    }

    this.toolbar.setProjectName(project.name);
    this.assetPanel.refresh(project);
    this.propertiesPanel.showEmpty();
    this.updateCodePreview();

    if (project.sprites.length > 0) {
      this.assetPanel.setSelection({
        type: "sprite",
        id: project.sprites[0].id,
      });
    }
  }

  private async handleSave(): Promise<void> {
    // Ensure block states are saved to project
    this.saveAllBlockStates();
    await this.projectManager.save();
  }

  private async handleRun(): Promise<void> {
    const project = this.projectManager.getProject();

    if (project.rooms.length === 0) {
      alert("No rooms to run. Add a room first.");
      return;
    }

    // Save block states before compilation
    this.saveAllBlockStates();

    // Create game overlay
    this.gameOverlay = document.createElement("div");
    this.gameOverlay.className = "acorn-game-overlay";

    // Game toolbar
    const gameToolbar = document.createElement("div");
    gameToolbar.className = "game-toolbar";
    const stopBtn = document.createElement("button");
    stopBtn.className = "toolbar-stop";
    stopBtn.textContent = "\u25A0 Stop";
    stopBtn.addEventListener("click", () => this.handleStop());
    gameToolbar.appendChild(stopBtn);
    this.gameOverlay.appendChild(gameToolbar);

    // Canvas wrapper
    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "game-canvas-wrapper";
    const canvas = document.createElement("canvas");
    canvas.className = "game-canvas";
    canvas.width = project.settings.gameWidth;
    canvas.height = project.settings.gameHeight;
    canvasWrapper.appendChild(canvas);
    this.gameOverlay.appendChild(canvasWrapper);

    // Sprig error bar
    this.sprigError.mount(this.gameOverlay);
    this.debugConsole.mount(this.gameOverlay);

    document.body.appendChild(this.gameOverlay);
    this.toolbar.setRunning(true);

    // Create and start engine
    this.engine = new GameEngine(canvas, {
      onError: (msg) => this.sprigError.show(msg),
      onOutput: (msg) => this.debugConsole.log(msg),
      onStop: () => this.handleStop(),
    });

    try {
      await this.engine.start(project, this.blockWorkspace);
    } catch (err) {
      this.sprigError.show(
        `Failed to start: ${err instanceof Error ? err.message : err}`
      );
    }

    // Focus canvas for keyboard input
    canvas.tabIndex = 0;
    canvas.focus();
  }

  private handleStop(): void {
    if (this.engine) {
      this.engine.stop();
      this.engine = null;
    }

    this.sprigError.unmount();
    this.debugConsole.hide();
    this.debugConsole.unmount();
    this.debugConsole.clear();
    this.toolbar.setRunning(false);
    this.gameOverlay?.remove();
    this.gameOverlay = null;
  }

  private handleAssetSelect(selection: AssetSelection): void {
    if (!selection) {
      this.propertiesPanel.showEmpty();
      return;
    }

    const project = this.projectManager.getProject();

    if (selection.type === "sprite") {
      const sprite = this.projectManager.getSprite(selection.id);
      if (sprite) {
        this.propertiesPanel.showSpriteProperties(sprite);
        this.showBlocksTab();
        this.blockWorkspace.loadSprite(sprite.id, sprite.blocklyState);
        this.updateCodePreview();

        // Set room editor to place this sprite
        this.roomEditor.setPlacingSprite(sprite.id);
      }
    } else {
      const room = this.projectManager.getRoom(selection.id);
      if (room) {
        this.propertiesPanel.showRoomProperties(room);
        this.showRoomTab();
        this.roomEditor.loadRoom(room, project.sprites);
      }
    }
  }

  private async handleAddSprite(): Promise<void> {
    const sprite = await showSpritePicker();
    if (!sprite) return;

    this.projectManager.addSprite(sprite);
    this.assetPanel.refresh(this.projectManager.getProject());
    this.assetPanel.setSelection({ type: "sprite", id: sprite.id });
  }

  private handleAddRoom(): void {
    const room = this.projectManager.addRoom();
    this.assetPanel.refresh(this.projectManager.getProject());
    this.assetPanel.setSelection({ type: "room", id: room.id });
  }

  private handleDeleteSprite(id: string): void {
    if (!confirm("Delete this sprite and all its instances?")) return;
    this.blockWorkspace.removeState(id);
    this.projectManager.removeSprite(id);
    this.assetPanel.refresh(this.projectManager.getProject());
    this.propertiesPanel.showEmpty();
  }

  private handleDeleteRoom(id: string): void {
    const project = this.projectManager.getProject();
    if (project.rooms.length <= 1) {
      alert("Cannot delete the last room.");
      return;
    }
    if (!confirm("Delete this room?")) return;
    this.projectManager.removeRoom(id);
    this.assetPanel.refresh(project);
    this.propertiesPanel.showEmpty();
  }

  private handleRenameSprite(id: string, name: string): void {
    this.projectManager.renameSprite(id, name);
    this.assetPanel.refresh(this.projectManager.getProject());
    const sprite = this.projectManager.getSprite(id);
    if (sprite) {
      this.propertiesPanel.showSpriteProperties(sprite);
    }
  }

  private handleRenameRoom(id: string, name: string): void {
    this.projectManager.renameRoom(id, name);
    this.assetPanel.refresh(this.projectManager.getProject());
    const room = this.projectManager.getRoom(id);
    if (room) {
      this.propertiesPanel.showRoomProperties(room);
    }
  }

  private handleSpritePropertyChange(
    id: string,
    prop: string,
    value: string
  ): void {
    this.projectManager.updateSpriteProperty(id, prop, value);
    this.assetPanel.refresh(this.projectManager.getProject());
  }

  private handleRoomPropertyChange(
    id: string,
    prop: string,
    value: string
  ): void {
    this.projectManager.updateRoomProperty(id, prop, value);
    this.assetPanel.refresh(this.projectManager.getProject());

    // Refresh room editor if currently showing this room
    const sel = this.assetPanel.getSelection();
    if (sel?.type === "room" && sel.id === id) {
      const room = this.projectManager.getRoom(id);
      if (room) {
        this.roomEditor.loadRoom(
          room,
          this.projectManager.getProject().sprites
        );
      }
    }
  }

  // === Workspace Tab Management ===

  private setupWorkspaceTabs(): void {
    this.workspaceTabs.innerHTML = "";

    const blocksTab = document.createElement("div");
    blocksTab.className = "workspace-tab active";
    blocksTab.textContent = "Blocks";
    blocksTab.dataset.tab = "blocks";
    blocksTab.addEventListener("click", () => this.showBlocksTab());
    this.workspaceTabs.appendChild(blocksTab);

    const roomTab = document.createElement("div");
    roomTab.className = "workspace-tab";
    roomTab.textContent = "Room";
    roomTab.dataset.tab = "room";
    roomTab.addEventListener("click", () => this.showRoomTab());
    this.workspaceTabs.appendChild(roomTab);

    // Default to blocks view
    this.showBlocksTab();
  }

  private showBlocksTab(): void {
    this.currentTab = "blocks";
    this.updateTabHighlight();

    this.workspaceContent.innerHTML = "";
    this.blockWorkspace.unmount();
    this.blockWorkspace.mount(this.workspaceContent);

    // Reload current sprite's blocks
    const sel = this.assetPanel.getSelection();
    if (sel?.type === "sprite") {
      const sprite = this.projectManager.getSprite(sel.id);
      if (sprite) {
        this.blockWorkspace.loadSprite(sprite.id, sprite.blocklyState);
      }
    }

    this.blockWorkspace.resize();
  }

  private showRoomTab(): void {
    this.currentTab = "room";
    this.updateTabHighlight();

    this.blockWorkspace.unmount();
    this.workspaceContent.innerHTML = "";
    this.workspaceContent.appendChild(this.roomEditor.element);

    // Load current room
    const sel = this.assetPanel.getSelection();
    if (sel?.type === "room") {
      const room = this.projectManager.getRoom(sel.id);
      if (room) {
        this.roomEditor.loadRoom(
          room,
          this.projectManager.getProject().sprites
        );
      }
    } else {
      // Show first room
      const project = this.projectManager.getProject();
      if (project.rooms.length > 0) {
        this.roomEditor.loadRoom(project.rooms[0], project.sprites);
      }
    }
  }

  private updateTabHighlight(): void {
    const tabs = this.workspaceTabs.querySelectorAll(".workspace-tab");
    for (const tab of tabs) {
      const el = tab as HTMLElement;
      el.classList.toggle(
        "active",
        el.dataset.tab === this.currentTab
      );
    }
  }

  private updateCodePreview(): void {
    const code = this.blockWorkspace.generateCode();
    this.codePreview.update(code);
  }

  private saveBlockState(): void {
    const spriteId = this.blockWorkspace.getCurrentSpriteId();
    if (!spriteId) return;
    const state = this.blockWorkspace.getState(spriteId);
    const sprite = this.projectManager.getSprite(spriteId);
    if (sprite && state) {
      sprite.blocklyState = state;
    }
  }

  private saveAllBlockStates(): void {
    const project = this.projectManager.getProject();
    for (const sprite of project.sprites) {
      const state = this.blockWorkspace.getState(sprite.id);
      if (state) {
        sprite.blocklyState = state;
      }
    }
  }
}

// === Bootstrap ===

const acorn = new AcornApp();
acorn.init().catch((err) => {
  console.error("Failed to initialize Acorn:", err);
  const app = document.getElementById("app");
  if (app) {
    app.textContent = `Failed to load Acorn: ${err}`;
  }
});
