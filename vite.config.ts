import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (WASM threads) if needed in the future
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
