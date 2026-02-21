/**
 * .acorn project file format types.
 *
 * A project is saved as a single JSON file with all sprites, rooms,
 * and block data embedded.
 */

/** Top-level project structure. */
export interface AcornProject {
  formatVersion: "1";
  name: string;
  sprites: SpriteData[];
  rooms: RoomData[];
  settings: ProjectSettings;
}

/** A sprite definition (type, not instance). */
export interface SpriteData {
  id: string;
  name: string;
  frames: SpriteFrame[];
  originX: number;
  originY: number;
  /** Blockly workspace state (JSON serialization). */
  blocklyState: unknown;
  /** Custom properties with default values. */
  properties: Record<string, number | string | boolean>;
}

/** A single animation frame of a sprite. */
export interface SpriteFrame {
  width: number;
  height: number;
  /** Base64 data URL of the sprite image. */
  dataUrl: string;
}

/** A room (level/scene). */
export interface RoomData {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  instances: InstancePlacement[];
}

/** A sprite instance placed in a room. */
export interface InstancePlacement {
  id: string;
  spriteId: string;
  x: number;
  y: number;
}

/** Global project settings. */
export interface ProjectSettings {
  gameWidth: number;
  gameHeight: number;
  fps: number;
}

/** Create a blank project with default settings. */
export function createBlankProject(name: string = "My Game"): AcornProject {
  return {
    formatVersion: "1",
    name,
    sprites: [],
    rooms: [
      {
        id: generateId(),
        name: "Room 1",
        width: 800,
        height: 600,
        backgroundColor: "#e8e8e8",
        instances: [],
      },
    ],
    settings: {
      gameWidth: 800,
      gameHeight: 600,
      fps: 60,
    },
  };
}

/** Generate a short random ID. */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
