/**
 * Project manager: coordinates project lifecycle (new, open, save).
 *
 * Manages the current project state and integrates with storage.
 */

import {
  AcornProject,
  RoomData,
  SpriteData,
  createBlankProject,
  generateId,
} from "./format.js";
import {
  saveProject,
  loadProject,
  listProjects,
  getLastProjectName,
  importProject,
  exportProject,
} from "./storage.js";

export class ProjectManager {
  private project: AcornProject;
  private dirty: boolean = false;

  constructor() {
    this.project = createBlankProject();
  }

  /** Get the current project. */
  getProject(): AcornProject {
    return this.project;
  }

  /** Create a new blank project. */
  newProject(name?: string): AcornProject {
    this.project = createBlankProject(name);
    this.dirty = false;
    return this.project;
  }

  /** Load the last opened project, or create a new one. */
  async loadLastOrNew(): Promise<AcornProject> {
    const lastName = await getLastProjectName();
    if (lastName) {
      const saved = await loadProject(lastName);
      if (saved) {
        this.project = saved;
        this.dirty = false;
        return this.project;
      }
    }
    return this.newProject();
  }

  /** Save the current project. */
  async save(): Promise<void> {
    await saveProject(this.project);
    this.dirty = false;
  }

  /** Show a file picker to open a .acorn file. */
  async openFile(): Promise<AcornProject | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".acorn,.json";
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const project = await importProject(file);
          this.project = project;
          this.dirty = false;
          resolve(project);
        } catch (err) {
          alert(`Failed to open project: ${err}`);
          resolve(null);
        }
      });
      input.click();
    });
  }

  /** Show open dialog with list of saved projects. */
  async showOpenDialog(): Promise<AcornProject | null> {
    const saved = await listProjects();

    if (saved.length === 0) {
      // No saved projects, fall back to file picker
      return this.openFile();
    }

    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "acorn-modal-backdrop";

      const modal = document.createElement("div");
      modal.className = "acorn-modal";

      const title = document.createElement("h2");
      title.textContent = "Open Project";
      modal.appendChild(title);

      // Saved projects list
      const list = document.createElement("div");
      list.style.cssText =
        "max-height: 200px; overflow-y: auto; margin-bottom: 12px;";

      let selectedName: string | null = null;

      for (const name of saved) {
        const item = document.createElement("div");
        item.style.cssText =
          "padding: 8px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 2px;";
        item.textContent = name;
        item.addEventListener("click", () => {
          list.querySelectorAll("div").forEach((el) => {
            el.style.background = "";
          });
          item.style.background = "var(--bg-active)";
          selectedName = name;
        });
        item.addEventListener("dblclick", async () => {
          const proj = await loadProject(name);
          if (proj) {
            this.project = proj;
            this.dirty = false;
          }
          cleanup();
          resolve(proj);
        });
        list.appendChild(item);
      }
      modal.appendChild(list);

      // Actions
      const actions = document.createElement("div");
      actions.className = "modal-actions";

      const fileBtn = document.createElement("button");
      fileBtn.className = "secondary";
      fileBtn.textContent = "Open File...";
      fileBtn.addEventListener("click", async () => {
        cleanup();
        const result = await this.openFile();
        resolve(result);
      });
      actions.appendChild(fileBtn);

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "secondary";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });
      actions.appendChild(cancelBtn);

      const openBtn = document.createElement("button");
      openBtn.className = "primary";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", async () => {
        if (selectedName) {
          const proj = await loadProject(selectedName);
          if (proj) {
            this.project = proj;
            this.dirty = false;
          }
          cleanup();
          resolve(proj);
        }
      });
      actions.appendChild(openBtn);

      modal.appendChild(actions);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          cleanup();
          resolve(null);
        }
      });

      function cleanup(): void {
        backdrop.remove();
      }
    });
  }

  /** Export project as .acorn file download. */
  export(): void {
    exportProject(this.project);
  }

  // === Sprite Operations ===

  addSprite(sprite: SpriteData): void {
    this.project.sprites.push(sprite);
    this.markDirty();
  }

  removeSprite(id: string): void {
    this.project.sprites = this.project.sprites.filter((s) => s.id !== id);
    // Also remove instances from all rooms
    for (const room of this.project.rooms) {
      room.instances = room.instances.filter((i) => i.spriteId !== id);
    }
    this.markDirty();
  }

  getSprite(id: string): SpriteData | undefined {
    return this.project.sprites.find((s) => s.id === id);
  }

  renameSprite(id: string, name: string): void {
    const sprite = this.getSprite(id);
    if (sprite) {
      sprite.name = name;
      this.markDirty();
    }
  }

  // === Room Operations ===

  addRoom(): RoomData {
    const room: RoomData = {
      id: generateId(),
      name: `Room ${this.project.rooms.length + 1}`,
      width: this.project.settings.gameWidth,
      height: this.project.settings.gameHeight,
      backgroundColor: "#e8e8e8",
      instances: [],
    };
    this.project.rooms.push(room);
    this.markDirty();
    return room;
  }

  removeRoom(id: string): void {
    if (this.project.rooms.length <= 1) return; // Keep at least one room
    this.project.rooms = this.project.rooms.filter((r) => r.id !== id);
    this.markDirty();
  }

  getRoom(id: string): RoomData | undefined {
    return this.project.rooms.find((r) => r.id === id);
  }

  renameRoom(id: string, name: string): void {
    const room = this.getRoom(id);
    if (room) {
      room.name = name;
      this.markDirty();
    }
  }

  // === Property Updates ===

  updateSpriteProperty(id: string, property: string, value: string): void {
    const sprite = this.getSprite(id);
    if (!sprite) return;

    switch (property) {
      case "name":
        sprite.name = value;
        break;
      case "originX":
        sprite.originX = Number(value) || 0;
        break;
      case "originY":
        sprite.originY = Number(value) || 0;
        break;
      default:
        if (property.startsWith("prop:")) {
          const key = property.slice(5);
          const num = Number(value);
          sprite.properties[key] = isNaN(num) ? value : num;
        }
    }
    this.markDirty();
  }

  updateRoomProperty(id: string, property: string, value: string): void {
    const room = this.getRoom(id);
    if (!room) return;

    switch (property) {
      case "name":
        room.name = value;
        break;
      case "width":
        room.width = Number(value) || 800;
        break;
      case "height":
        room.height = Number(value) || 600;
        break;
      case "backgroundColor":
        room.backgroundColor = value;
        break;
    }
    this.markDirty();
  }

  isDirty(): boolean {
    return this.dirty;
  }

  private markDirty(): void {
    this.dirty = true;
  }
}
