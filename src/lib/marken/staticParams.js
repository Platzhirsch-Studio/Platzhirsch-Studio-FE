// src/lib/marken/staticParams.js
// Build-safe generateStaticParams for the brand routes (Runde 4 P5,
// technik P1-5): a slow or failing backoffice must not abort `next build`.
// The list is fetched with a timeout; on error/timeout the route returns []
// and every page is rendered on its first visit (ISR, dynamicParams = true,
// see node_modules/next/dist/docs/.../generate-static-params.md "All paths at
// runtime"). No Cache Components in this project, so [] is allowed.
//
// Pure module (relative imports only), so node --test can load it.

export const STATIC_PARAMS_TIMEOUT_MS = 15000;

/**
 * Runs `load()` with a timeout; returns `map(result)` or [] on any error.
 * @template T
 * @param {() => Promise<T>} load
 * @param {(value: T) => Array<object>} map
 * @param {{ timeoutMs?: number, label?: string }} [opts]
 */
export async function safeStaticParams(load, map, { timeoutMs = STATIC_PARAMS_TIMEOUT_MS, label = "static params" } = {}) {
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${timeoutMs} ms`)), timeoutMs);
    });
    const value = await Promise.race([Promise.resolve().then(load), timeout]);
    const list = map(value);
    return Array.isArray(list) ? list.filter((p) => p && Object.values(p).every((v) => typeof v === "string" && v)) : [];
  } catch (error) {
    console.warn(`[${label}] backoffice not reachable, rendering on demand:`, error?.message || error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
