#!/usr/bin/env node

/**
 * Downloads the prebuilt Hemlock WASM interpreter from a GitHub release.
 *
 * Usage:
 *   node scripts/fetch-wasm.mjs [version]
 *
 * If no version is specified, fetches the latest release.
 * Files are written to public/wasm/hemlock.{js,wasm}.
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "wasm");
const REPO = "hemlang/hemlock";

const version = process.argv[2] || "latest";

async function fetchRelease() {
  const apiUrl =
    version === "latest"
      ? `https://api.github.com/repos/${REPO}/releases/latest`
      : `https://api.github.com/repos/${REPO}/releases/tags/${version}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function downloadAsset(url, dest) {
  const res = await fetch(url, {
    headers: { Accept: "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`  -> ${dest} (${buf.length} bytes)`);
}

async function main() {
  console.log(`Fetching Hemlock WASM interpreter (${version})...`);

  const release = await fetchRelease();
  console.log(`Release: ${release.tag_name}`);

  mkdirSync(OUT_DIR, { recursive: true });

  const jsAsset = release.assets.find((a) => a.name === "hemlock.js");
  const wasmAsset = release.assets.find((a) => a.name === "hemlock.wasm");

  if (!jsAsset || !wasmAsset) {
    console.error("Release is missing hemlock.js or hemlock.wasm assets.");
    console.error(
      "Available assets:",
      release.assets.map((a) => a.name)
    );
    process.exit(1);
  }

  await downloadAsset(jsAsset.url, join(OUT_DIR, "hemlock.js"));
  await downloadAsset(wasmAsset.url, join(OUT_DIR, "hemlock.wasm"));

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
