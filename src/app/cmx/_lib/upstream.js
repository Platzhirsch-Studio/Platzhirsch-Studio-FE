// src/app/cmx/_lib/upstream.js — R4-plattform-ci (AP1.4)
// fetch() mit Timeout NUR bis zu den Antwort-Headern. AbortSignal.timeout()
// würde auch den Body abbrechen: Ein großes Video, das länger als der Timeout
// braucht, risse mitten im Stream ab. Rein, mit node --test prüfbar.

/**
 * → { response } | { error, timedOut }
 * fetchImpl ist nur für Tests austauschbar.
 */
export async function fetchWithHeaderTimeout(url, timeoutMs, { fetchImpl = fetch, init = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("upstream timeout", "TimeoutError")),
    timeoutMs
  );
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    return { response };
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || controller.signal.reason?.name === "TimeoutError";
    return { error, timedOut };
  } finally {
    clearTimeout(timer);
  }
}
