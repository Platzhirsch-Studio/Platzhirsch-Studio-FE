// src/components/Shop/ruhigeBewegung.js
// true, wenn Bewegung aus sein soll: System „Bewegung reduzieren“ ODER
// „Ruhige Ansicht“ (html[data-motion="reduced"], Alias "calm" – wie in
// globals.css). Für JS-Entscheidungen, die CSS nicht abdeckt: sanftes
// Scrollen, Aushängen erst nach der Ausgangs-Transition (MiniCart).
// Ohne window (Server) = ruhig.
export function ruhigeBewegung(win = typeof window !== "undefined" ? window : null) {
  if (!win) return true;
  const m = win.document?.documentElement?.getAttribute?.("data-motion");
  if (m === "reduced" || m === "calm") return true;
  try {
    return Boolean(win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  } catch {
    return false;
  }
}
