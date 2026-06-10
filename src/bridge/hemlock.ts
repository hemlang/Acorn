/**
 * Hemlock WASM interpreter bridge.
 *
 * Wraps the raw C exports (hemlock_context_create, hemlock_context_eval, etc.)
 * in a typed TypeScript API. The WASM module is loaded from /wasm/hemlock.js.
 */

export interface HemlockExports {
  hemlock_eval(source: string): number;
  hemlock_version(): string;
  hemlock_context_create(): number;
  hemlock_context_eval(handle: number, source: string): number;
  hemlock_context_destroy(handle: number): void;
  hemlock_context_get(handle: number, varname: string): string | null;
  hemlock_context_set(handle: number, varname: string, json: string): void;
  hemlock_context_last_error(handle: number): string | null;
  hemlock_compile_script(source: string): number;
  hemlock_run_script(ctxHandle: number, scriptHandle: number): number;
  hemlock_free_script(scriptHandle: number): void;
}

let instance: HemlockExports | null = null;

export async function loadHemlock(): Promise<HemlockExports> {
  if (instance) return instance;

  // The prebuilt hemlock.js module (from Hemlock GitHub releases) exposes an
  // init function that loads the .wasm file and returns the exports.
  // The path is built at runtime so Vite/Rollup leave the import dynamic;
  // the file lives in public/wasm and is not part of the bundle.
  const modulePath = "/wasm/hemlock.js";
  const mod = await import(/* @vite-ignore */ modulePath);
  instance = await mod.default();
  return instance!;
}

/**
 * Load the Hemlock WASM interpreter if the binary is present, or return
 * null without throwing. Used by the engine to decide between WASM
 * execution and the built-in TypeScript interpreter.
 */
export async function tryLoadHemlock(): Promise<HemlockExports | null> {
  if (instance) return instance;
  try {
    // Probe before importing: the Vite dev server answers missing paths
    // with the SPA index.html (status 200), so check the content type too.
    const probe = await fetch("/wasm/hemlock.js", { method: "HEAD" });
    if (!probe.ok) return null;
    const type = probe.headers.get("content-type") ?? "";
    if (type.includes("text/html")) return null;

    return await loadHemlock();
  } catch (err) {
    console.warn("Hemlock WASM unavailable, using built-in interpreter:", err);
    return null;
  }
}

export function getHemlock(): HemlockExports {
  if (!instance) throw new Error("Hemlock WASM not loaded — call loadHemlock() first");
  return instance;
}
