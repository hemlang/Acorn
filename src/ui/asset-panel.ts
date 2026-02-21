/**
 * Left-side asset panel: sprite list and room list with add/select/delete.
 */

import { AcornProject, SpriteData, RoomData } from "../project/format.js";

export type AssetSelection =
  | { type: "sprite"; id: string }
  | { type: "room"; id: string }
  | null;

export interface AssetPanelCallbacks {
  onSelect: (selection: AssetSelection) => void;
  onAddSprite: () => void;
  onAddRoom: () => void;
  onDeleteSprite: (id: string) => void;
  onDeleteRoom: (id: string) => void;
  onRenameSprite: (id: string, name: string) => void;
  onRenameRoom: (id: string, name: string) => void;
}

export class AssetPanel {
  readonly element: HTMLElement;
  private spriteList: HTMLUListElement;
  private roomList: HTMLUListElement;
  private selection: AssetSelection = null;

  constructor(private callbacks: AssetPanelCallbacks) {
    this.element = document.createElement("div");
    this.element.className = "acorn-asset-panel";

    // Sprites section
    const spriteSection = document.createElement("div");
    spriteSection.className = "asset-section";

    const spriteHeader = document.createElement("div");
    spriteHeader.className = "asset-section-header";
    spriteHeader.innerHTML = `<span>Sprites</span>`;
    const addSpriteBtn = document.createElement("button");
    addSpriteBtn.textContent = "+";
    addSpriteBtn.title = "Add Sprite";
    addSpriteBtn.addEventListener("click", callbacks.onAddSprite);
    spriteHeader.appendChild(addSpriteBtn);
    spriteSection.appendChild(spriteHeader);

    this.spriteList = document.createElement("ul");
    this.spriteList.className = "asset-list";
    spriteSection.appendChild(this.spriteList);
    this.element.appendChild(spriteSection);

    // Rooms section
    const roomSection = document.createElement("div");
    roomSection.className = "asset-section";

    const roomHeader = document.createElement("div");
    roomHeader.className = "asset-section-header";
    roomHeader.innerHTML = `<span>Rooms</span>`;
    const addRoomBtn = document.createElement("button");
    addRoomBtn.textContent = "+";
    addRoomBtn.title = "Add Room";
    addRoomBtn.addEventListener("click", callbacks.onAddRoom);
    roomHeader.appendChild(addRoomBtn);
    roomSection.appendChild(roomHeader);

    this.roomList = document.createElement("ul");
    this.roomList.className = "asset-list";
    roomSection.appendChild(this.roomList);
    this.element.appendChild(roomSection);
  }

  refresh(project: AcornProject): void {
    this.renderSpriteList(project.sprites);
    this.renderRoomList(project.rooms);
  }

  getSelection(): AssetSelection {
    return this.selection;
  }

  setSelection(sel: AssetSelection): void {
    this.selection = sel;
    this.highlightSelected();
    this.callbacks.onSelect(sel);
  }

  private renderSpriteList(sprites: SpriteData[]): void {
    this.spriteList.innerHTML = "";
    for (const sprite of sprites) {
      const li = document.createElement("li");
      li.className = "asset-item";
      li.dataset.id = sprite.id;
      if (
        this.selection?.type === "sprite" &&
        this.selection.id === sprite.id
      ) {
        li.classList.add("selected");
      }

      const preview = document.createElement("div");
      preview.className = "asset-item-preview";
      if (sprite.frames.length > 0) {
        const img = document.createElement("img");
        img.src = sprite.frames[0].dataUrl;
        img.alt = sprite.name;
        preview.appendChild(img);
      }
      li.appendChild(preview);

      const name = document.createElement("span");
      name.className = "asset-item-name";
      name.textContent = sprite.name;
      li.appendChild(name);

      li.addEventListener("click", () => {
        this.setSelection({ type: "sprite", id: sprite.id });
      });

      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showContextMenu(e, sprite.id, "sprite", sprite.name);
      });

      this.spriteList.appendChild(li);
    }
  }

  private renderRoomList(rooms: RoomData[]): void {
    this.roomList.innerHTML = "";
    for (const room of rooms) {
      const li = document.createElement("li");
      li.className = "asset-item";
      li.dataset.id = room.id;
      if (
        this.selection?.type === "room" &&
        this.selection.id === room.id
      ) {
        li.classList.add("selected");
      }

      const preview = document.createElement("div");
      preview.className = "asset-item-preview";
      preview.style.background = room.backgroundColor;
      li.appendChild(preview);

      const name = document.createElement("span");
      name.className = "asset-item-name";
      name.textContent = room.name;
      li.appendChild(name);

      li.addEventListener("click", () => {
        this.setSelection({ type: "room", id: room.id });
      });

      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showContextMenu(e, room.id, "room", room.name);
      });

      this.roomList.appendChild(li);
    }
  }

  private highlightSelected(): void {
    const items = this.element.querySelectorAll(".asset-item");
    for (const item of items) {
      item.classList.remove("selected");
    }
    if (!this.selection) return;

    const lists =
      this.selection.type === "sprite" ? this.spriteList : this.roomList;
    const target = lists.querySelector(`[data-id="${this.selection.id}"]`);
    target?.classList.add("selected");
  }

  private showContextMenu(
    e: MouseEvent,
    id: string,
    assetType: "sprite" | "room",
    currentName: string
  ): void {
    // Remove any existing context menu
    document.querySelector(".context-menu")?.remove();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const renameItem = document.createElement("div");
    renameItem.className = "context-menu-item";
    renameItem.textContent = "Rename";
    renameItem.addEventListener("click", () => {
      menu.remove();
      const newName = prompt("Rename:", currentName);
      if (newName && newName !== currentName) {
        if (assetType === "sprite") {
          this.callbacks.onRenameSprite(id, newName);
        } else {
          this.callbacks.onRenameRoom(id, newName);
        }
      }
    });
    menu.appendChild(renameItem);

    const deleteItem = document.createElement("div");
    deleteItem.className = "context-menu-item danger";
    deleteItem.textContent = "Delete";
    deleteItem.addEventListener("click", () => {
      menu.remove();
      if (assetType === "sprite") {
        this.callbacks.onDeleteSprite(id);
      } else {
        this.callbacks.onDeleteRoom(id);
      }
    });
    menu.appendChild(deleteItem);

    document.body.appendChild(menu);

    const closeMenu = () => {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    };
    // Defer so this click doesn't immediately close it
    requestAnimationFrame(() => {
      document.addEventListener("click", closeMenu);
    });
  }
}
