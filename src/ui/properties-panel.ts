/**
 * Right-side properties panel: shows editable properties for the selected asset.
 */

import { SpriteData, RoomData } from "../project/format.js";

export interface PropertiesPanelCallbacks {
  onSpritePropertyChange: (
    spriteId: string,
    property: string,
    value: string
  ) => void;
  onRoomPropertyChange: (
    roomId: string,
    property: string,
    value: string
  ) => void;
}

export class PropertiesPanel {
  readonly element: HTMLElement;
  private content: HTMLElement;

  constructor(private callbacks: PropertiesPanelCallbacks) {
    this.element = document.createElement("div");
    this.element.className = "acorn-properties-panel";

    const header = document.createElement("div");
    header.className = "properties-header";
    header.textContent = "Properties";
    this.element.appendChild(header);

    this.content = document.createElement("div");
    this.element.appendChild(this.content);

    this.showEmpty();
  }

  showEmpty(): void {
    this.content.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "properties-empty";
    empty.textContent = "Select a sprite or room to view its properties.";
    this.content.appendChild(empty);
  }

  showSpriteProperties(sprite: SpriteData): void {
    this.content.innerHTML = "";

    // Info group
    const infoGroup = this.createGroup("Info");

    infoGroup.appendChild(
      this.createTextRow("Name", sprite.name, (val) => {
        this.callbacks.onSpritePropertyChange(sprite.id, "name", val);
      })
    );

    this.content.appendChild(infoGroup);

    // Sprite group
    const spriteGroup = this.createGroup("Sprite");

    spriteGroup.appendChild(
      this.createReadonlyRow(
        "Frames",
        String(sprite.frames.length)
      )
    );

    if (sprite.frames.length > 0) {
      spriteGroup.appendChild(
        this.createReadonlyRow(
          "Size",
          `${sprite.frames[0].width} x ${sprite.frames[0].height}`
        )
      );
    }

    spriteGroup.appendChild(
      this.createNumberRow("Origin X", sprite.originX, (val) => {
        this.callbacks.onSpritePropertyChange(sprite.id, "originX", val);
      })
    );
    spriteGroup.appendChild(
      this.createNumberRow("Origin Y", sprite.originY, (val) => {
        this.callbacks.onSpritePropertyChange(sprite.id, "originY", val);
      })
    );

    this.content.appendChild(spriteGroup);

    // Custom properties
    if (Object.keys(sprite.properties).length > 0) {
      const customGroup = this.createGroup("Variables");
      for (const [key, value] of Object.entries(sprite.properties)) {
        customGroup.appendChild(
          this.createTextRow(key, String(value), (val) => {
            this.callbacks.onSpritePropertyChange(
              sprite.id,
              `prop:${key}`,
              val
            );
          })
        );
      }
      this.content.appendChild(customGroup);
    }
  }

  showRoomProperties(room: RoomData): void {
    this.content.innerHTML = "";

    const infoGroup = this.createGroup("Info");
    infoGroup.appendChild(
      this.createTextRow("Name", room.name, (val) => {
        this.callbacks.onRoomPropertyChange(room.id, "name", val);
      })
    );
    this.content.appendChild(infoGroup);

    const sizeGroup = this.createGroup("Dimensions");
    sizeGroup.appendChild(
      this.createNumberRow("Width", room.width, (val) => {
        this.callbacks.onRoomPropertyChange(room.id, "width", val);
      })
    );
    sizeGroup.appendChild(
      this.createNumberRow("Height", room.height, (val) => {
        this.callbacks.onRoomPropertyChange(room.id, "height", val);
      })
    );
    this.content.appendChild(sizeGroup);

    const bgGroup = this.createGroup("Background");
    bgGroup.appendChild(
      this.createColorRow("Color", room.backgroundColor, (val) => {
        this.callbacks.onRoomPropertyChange(room.id, "backgroundColor", val);
      })
    );
    this.content.appendChild(bgGroup);

    const statsGroup = this.createGroup("Stats");
    statsGroup.appendChild(
      this.createReadonlyRow("Instances", String(room.instances.length))
    );
    this.content.appendChild(statsGroup);
  }

  private createGroup(title: string): HTMLElement {
    const group = document.createElement("div");
    group.className = "property-group";
    const titleEl = document.createElement("div");
    titleEl.className = "property-group-title";
    titleEl.textContent = title;
    group.appendChild(titleEl);
    return group;
  }

  private createTextRow(
    label: string,
    value: string,
    onChange: (val: string) => void
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "property-row";

    const lbl = document.createElement("label");
    lbl.className = "property-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "property-input";
    input.value = value;
    input.addEventListener("change", () => onChange(input.value));
    row.appendChild(input);

    return row;
  }

  private createNumberRow(
    label: string,
    value: number,
    onChange: (val: string) => void
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "property-row";

    const lbl = document.createElement("label");
    lbl.className = "property-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "property-input";
    input.value = String(value);
    input.addEventListener("change", () => onChange(input.value));
    row.appendChild(input);

    return row;
  }

  private createColorRow(
    label: string,
    value: string,
    onChange: (val: string) => void
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "property-row";

    const lbl = document.createElement("label");
    lbl.className = "property-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const input = document.createElement("input");
    input.type = "color";
    input.className = "property-input";
    input.value = value;
    input.style.padding = "1px";
    input.style.height = "24px";
    input.addEventListener("change", () => onChange(input.value));
    row.appendChild(input);

    return row;
  }

  private createReadonlyRow(label: string, value: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "property-row";

    const lbl = document.createElement("label");
    lbl.className = "property-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const val = document.createElement("span");
    val.style.fontSize = "12px";
    val.style.color = "var(--text-dim)";
    val.textContent = value;
    row.appendChild(val);

    return row;
  }
}
