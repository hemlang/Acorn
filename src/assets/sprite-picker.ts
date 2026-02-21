/**
 * Sprite picker dialog: lets the user choose from built-in sprites
 * or upload a custom image.
 */

import { SpriteData } from "../project/format.js";
import {
  getStarterSprites,
  createStarterSprite,
  createSpriteFromFile,
} from "./sprites.js";

/**
 * Show a modal dialog for the user to pick a sprite.
 * Returns the chosen SpriteData, or null if cancelled.
 */
export function showSpritePicker(): Promise<SpriteData | null> {
  return new Promise((resolve) => {
    const starters = getStarterSprites();
    let selectedName: string | null = null;

    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "acorn-modal-backdrop";

    // Modal
    const modal = document.createElement("div");
    modal.className = "acorn-modal";

    const title = document.createElement("h2");
    title.textContent = "Add Sprite";
    modal.appendChild(title);

    // Grid of starter sprites
    const grid = document.createElement("div");
    grid.className = "sprite-picker-grid";

    for (const starter of starters) {
      const item = document.createElement("div");
      item.className = "sprite-picker-item";
      item.dataset.name = starter.name;

      const img = document.createElement("img");
      img.src = starter.dataUrl;
      img.alt = starter.name;
      item.appendChild(img);

      const label = document.createElement("span");
      label.textContent = starter.name;
      item.appendChild(label);

      item.addEventListener("click", () => {
        // Deselect previous
        grid
          .querySelectorAll(".sprite-picker-item.selected")
          .forEach((el) => el.classList.remove("selected"));
        item.classList.add("selected");
        selectedName = starter.name;
      });

      item.addEventListener("dblclick", () => {
        const sprite = createStarterSprite(starter.name);
        cleanup();
        resolve(sprite);
      });

      grid.appendChild(item);
    }

    modal.appendChild(grid);

    // Upload option
    const uploadRow = document.createElement("div");
    uploadRow.style.cssText =
      "margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);";

    const uploadLabel = document.createElement("span");
    uploadLabel.textContent = "Or upload an image: ";
    uploadLabel.style.fontSize = "12px";
    uploadRow.appendChild(uploadLabel);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png, image/jpeg, image/gif, image/webp";
    fileInput.style.fontSize = "12px";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const sprite = await createSpriteFromFile(file);
        cleanup();
        resolve(sprite);
      } catch (err) {
        alert(`Failed to load image: ${err}`);
      }
    });
    uploadRow.appendChild(fileInput);
    modal.appendChild(uploadRow);

    // Actions
    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });
    actions.appendChild(cancelBtn);

    const addBtn = document.createElement("button");
    addBtn.className = "primary";
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", () => {
      if (selectedName) {
        const sprite = createStarterSprite(selectedName);
        cleanup();
        resolve(sprite);
      }
    });
    actions.appendChild(addBtn);

    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        cleanup();
        resolve(null);
      }
    });

    // Close on Escape
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        resolve(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    function cleanup(): void {
      backdrop.remove();
      document.removeEventListener("keydown", onKeyDown);
    }
  });
}
