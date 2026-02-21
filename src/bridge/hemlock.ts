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
  // @ts-expect-error — dynamic WASM module loaded from public/wasm at runtime
  const mod = await import("/wasm/hemlock.js");
  instance = await mod.default();
  return instance!;
}

export function getHemlock(): HemlockExports {
  if (!instance) throw new Error("Hemlock WASM not loaded — call loadHemlock() first");
  return instance;
}
