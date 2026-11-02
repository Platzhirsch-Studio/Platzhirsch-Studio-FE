// Motion shell-home (01.11.2026): one place for the JS side of "no motion".
// CSS follows prefers-reduced-motion AND the "Ruhige Ansicht" switch
// (html[data-motion="reduced"], "calm" accepted as alias – globals.css
// MOTION-FUNDAMENT). Scripted motion (smooth scrollBy, scrollIntoView) has to
// ask the same two questions, otherwise the switch stops CSS but not JS.
// Pure: the document and window are passed in (unit-testable, SSR-safe).

const CALM = new Set(["reduced", "calm"]);

/** true → jump instantly, no smooth scroll, no scripted animation. */
export function isCalmMotion(doc = globalThis.document, win = globalThis.window) {
  if (doc?.documentElement && CALM.has(doc.documentElement.dataset?.motion)) return true;
  return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

/** "auto" or "smooth" for scrollBy / scrollTo / scrollIntoView. */
export function scrollBehavior(doc, win) {
  return isCalmMotion(doc, win) ? "auto" : "smooth";
}
