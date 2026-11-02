// Rat 9,5 A3 (ux 2, R6 P1-1): die Bestätigung nach dem Senden muss auf dem
// iPhone sichtbar sein. Nur focus() lässt Safari an der alten Stelle stehen
// (das Formular wird kürzer, die Bestätigung liegt oberhalb des Viewports).
// Darum: Fokus ohne Sprung, dann gezielt an den Anfang der Bestätigung
// scrollen (scroll-margin-top in Header-Höhe am Element), bei reduzierter
// Bewegung („Ruhige Ansicht“ oder prefers-reduced-motion) ohne Animation.
// Wird von HotelInquiryForm und ArchitektenForm genutzt (Client).

/** true bei prefers-reduced-motion oder html[data-motion="reduced"|"calm"] (Ruhige Ansicht; „calm“ wie in globals.css). */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  const motion = document.documentElement.dataset.motion;
  if (motion === "reduced" || motion === "calm") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Fokus auf die Bestätigung (ohne Scroll-Sprung) und Bestätigung an den Viewport-Anfang holen. */
export function revealConfirmation(el) {
  if (!el) return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  el.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
