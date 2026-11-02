// src/lib/forms/reveal.js
// Rat 9,5 A3 (UX2, R6 P1-1): after a successful send the confirmation must be
// SEEN, also on an iPhone where the visitor stood at the end of a long form.
// focus() alone scrolls only as far as needed (the heading stayed above the
// viewport). Here: focus without scrolling, then bring the box to the top of
// the viewport – the element carries a scroll-margin for the fixed header
// (scroll-mt-* class). Smooth only without reduced motion (prefers-reduced-
// motion or the "Ruhige Ansicht", html[data-motion=reduced]).
// Used by BeratungClient, KontaktForm and the Termin wizard; other teams'
// forms (Hotel, Architekten) can import it the same way.

/** true when motion should be reduced (system setting or "Ruhige Ansicht"). */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  try {
    if (document.documentElement.dataset.motion === "reduced") return true;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  } catch {
    return true;
  }
}

/** Focus `el` (role="status"/tabIndex=-1 box or heading) and scroll it to the top of the viewport. */
export function revealConfirmation(el) {
  if (!el || typeof el.focus !== "function") return;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  try {
    el.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  } catch {
    el.scrollIntoView?.();
  }
}
