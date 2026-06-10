# Acorn

Visual programming environment for [Hemlock](https://github.com/hemlang/hemlock) — a browser-based game maker powered by the Hemlock WASM interpreter.

Acorn lets users drag and drop blocks to create 2D games, with real-time Hemlock code preview showing the generated source. Designed for beginners learning to program.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Fetching the Hemlock WASM Binary

The interpreter binary is not included in the repo. To fetch it from the Hemlock GitHub releases:

```bash
npm run fetch-wasm          # latest release
npm run fetch-wasm v1.9.0   # specific version
```

This downloads `hemlock.js` and `hemlock.wasm` into `public/wasm/`. Set `GITHUB_TOKEN` to authenticate the download (higher rate limits). The app is fully functional without the binary — when it is absent, game execution falls back to the built-in TypeScript interpreter.

## Architecture

```
Visual Blocks → Block AST → Hemlock Source → hemlock_context_eval() → Output
                                  ↕
                          (Code Preview panel)
```

The game runtime lives entirely in TypeScript. Hemlock only runs user-authored event handler logic. At game start the engine compiles each event handler's blocks to a Hemlock script (`hemlock_compile_script`); per frame it serializes instance state into the interpreter context, runs the handler (`hemlock_run_script`), and reads the mutated state back.

When the WASM binary is absent (or any script fails to compile), the engine automatically falls back to a built-in TypeScript interpreter that executes compiled block actions directly — same blocks, same behavior.

### Project Structure

```
src/
├── editor/       Block editor (Blockly integration, code generator, compiler)
├── runtime/      Game engine (canvas renderer, input, interpreter, types)
├── bridge/       Hemlock WASM bridge (context wrapper)
├── assets/       Starter sprites, sprite picker, room editor
├── project/      Save/load, .acorn format, IndexedDB storage
├── ui/           Layout panels, toolbar, properties
├── mascot/       Sprig the Squirrel error display (placeholder)
└── main.ts       Application entry point
```

## Features (Phase 1)

- **Block editor** — 40+ blocks across 8 categories (Events, Motion, Appearance, Control, Variables, Math, Instances, Output)
- **Real-time code preview** — generated Hemlock source with syntax highlighting
- **Game runtime** — 60fps Canvas 2D rendering with keyboard input
- **21 built-in sprites** — colored shapes as starter assets, plus image upload
- **Room editor** — grid-based instance placement with drag and right-click delete
- **Project persistence** — save/load to IndexedDB, import/export `.acorn` files

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Block Editor | [Google Blockly](https://github.com/google/blockly) |
| Build Tool | [Vite](https://vite.dev) |
| Language | TypeScript (strict mode) |
| Game Canvas | Canvas 2D API |
| Storage | IndexedDB via [idb-keyval](https://github.com/nicedoc/idb-keyval) |
| Interpreter | Hemlock WASM v1.9.0 (prebuilt binary) |

## Building

```bash
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview the production build locally
```

## License

See the Hemlock project for license details.
