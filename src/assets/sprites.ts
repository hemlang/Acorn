/**
 * Built-in starter sprites for Acorn.
 *
 * Each sprite is a simple shape generated via canvas, provided as data URLs.
 * These serve as placeholders for Phase 1; proper pixel art sprites
 * will be added in later phases.
 */

import { SpriteData, generateId } from "../project/format.js";

interface StarterSprite {
  name: string;
  color: string;
  shape: "square" | "circle" | "triangle" | "diamond" | "star";
  size: number;
}

const STARTERS: StarterSprite[] = [
  // Characters
  { name: "Player", color: "#4a90d9", shape: "square", size: 32 },
  { name: "Player 2", color: "#3a70b9", shape: "square", size: 32 },
  { name: "Enemy", color: "#e05555", shape: "triangle", size: 32 },
  { name: "Enemy 2", color: "#c03030", shape: "diamond", size: 32 },
  { name: "Boss", color: "#b01010", shape: "star", size: 48 },

  // Objects
  { name: "Coin", color: "#f0c040", shape: "circle", size: 24 },
  { name: "Gem", color: "#40d0f0", shape: "diamond", size: 24 },
  { name: "Heart", color: "#ff6688", shape: "circle", size: 20 },
  { name: "Star", color: "#ffe040", shape: "star", size: 28 },
  { name: "Key", color: "#ffa040", shape: "diamond", size: 20 },

  // Environment
  { name: "Wall", color: "#808080", shape: "square", size: 32 },
  { name: "Block", color: "#a0522d", shape: "square", size: 32 },
  { name: "Platform", color: "#608040", shape: "square", size: 32 },
  { name: "Spike", color: "#c0c0c0", shape: "triangle", size: 32 },

  // Projectiles
  { name: "Bullet", color: "#f0f040", shape: "circle", size: 8 },
  { name: "Arrow", color: "#c0a070", shape: "triangle", size: 16 },
  { name: "Fireball", color: "#ff6020", shape: "circle", size: 16 },

  // Effects
  { name: "Particle", color: "#ffffff", shape: "circle", size: 6 },
  { name: "Explosion", color: "#ff8800", shape: "star", size: 32 },

  // UI
  { name: "Button", color: "#7c5cfc", shape: "square", size: 48 },
  { name: "Cursor", color: "#ffffff", shape: "triangle", size: 16 },
];

/** Generate a data URL for a starter sprite. */
function generateSpriteDataUrl(starter: StarterSprite): string {
  const canvas = document.createElement("canvas");
  canvas.width = starter.size;
  canvas.height = starter.size;
  const ctx = canvas.getContext("2d")!;

  const cx = starter.size / 2;
  const cy = starter.size / 2;
  const r = starter.size / 2 - 1;

  ctx.fillStyle = starter.color;
  ctx.strokeStyle = darken(starter.color);
  ctx.lineWidth = 1;

  switch (starter.shape) {
    case "square":
      ctx.fillRect(1, 1, starter.size - 2, starter.size - 2);
      ctx.strokeRect(1, 1, starter.size - 2, starter.size - 2);
      break;

    case "circle":
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case "triangle":
      ctx.beginPath();
      ctx.moveTo(cx, 1);
      ctx.lineTo(starter.size - 1, starter.size - 1);
      ctx.lineTo(1, starter.size - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "diamond":
      ctx.beginPath();
      ctx.moveTo(cx, 1);
      ctx.lineTo(starter.size - 1, cy);
      ctx.lineTo(cx, starter.size - 1);
      ctx.lineTo(1, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "star": {
      const spikes = 5;
      const outerR = r;
      const innerR = r * 0.45;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const radius = i % 2 === 0 ? outerR : innerR;
        const sx = cx + radius * Math.cos(angle);
        const sy = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  // Add a subtle label initial
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `bold ${Math.max(8, starter.size * 0.35)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(starter.name[0], cx, cy);

  return canvas.toDataURL("image/png");
}

/** Darken a hex color by 30%. */
function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
}

/** Get all built-in starter sprites (generates images on first call). */
let cachedStarters: StarterSprite[] | null = null;
let cachedDataUrls: Map<string, string> | null = null;

function ensureGenerated(): void {
  if (cachedStarters) return;
  cachedStarters = STARTERS;
  cachedDataUrls = new Map();
  for (const s of STARTERS) {
    cachedDataUrls.set(s.name, generateSpriteDataUrl(s));
  }
}

/** Get the list of starter sprite names and their preview data URLs. */
export function getStarterSprites(): Array<{ name: string; dataUrl: string }> {
  ensureGenerated();
  return STARTERS.map((s) => ({
    name: s.name,
    dataUrl: cachedDataUrls!.get(s.name)!,
  }));
}

/** Create a SpriteData from a starter sprite name. */
export function createStarterSprite(name: string): SpriteData | null {
  ensureGenerated();
  const starter = STARTERS.find((s) => s.name === name);
  if (!starter) return null;

  const dataUrl = cachedDataUrls!.get(name)!;
  return {
    id: generateId(),
    name: starter.name,
    frames: [
      {
        width: starter.size,
        height: starter.size,
        dataUrl,
      },
    ],
    originX: starter.size / 2,
    originY: starter.size / 2,
    blocklyState: null,
    properties: {},
  };
}

/** Create a SpriteData from a user-uploaded image file. */
export async function createSpriteFromFile(file: File): Promise<SpriteData> {
  const dataUrl = await readFileAsDataUrl(file);
  const { width, height } = await getImageSize(dataUrl);
  const name = file.name.replace(/\.[^.]+$/, "") || "Sprite";

  return {
    id: generateId(),
    name,
    frames: [{ width, height, dataUrl }],
    originX: Math.floor(width / 2),
    originY: Math.floor(height / 2),
    blocklyState: null,
    properties: {},
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getImageSize(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
