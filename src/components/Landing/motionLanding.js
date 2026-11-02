// Motion helpers for the area "Küche, Bad & Outdoor" (Motion-Runde 01.11.2026):
// landing template, region pages, Outdoor, Hotel & Objekt, Architekten,
// Bad & Wellness, Küchengeräte and the manufacturer catalogue (Katalog/*).
// Only the shared tokens of globals.css (MOTION-FUNDAMENT):
//   - section/grid reveals: `.reveal` per item + staggerStyle(index, columns)
//     (per column, so every row arrives left → right), or `.reveal-group` on
//     a short list (≤ 4 stages). Scroll-driven, transform only, nothing is
//     hidden without support; still under prefers-reduced-motion and
//     html[data-motion="reduced"|"calm"].
//   - image hover inside a fixed, overflow-hidden frame: IMAGE_HOVER
//     (2 %, --duration-morph, ease-drift, motion-safe:).
//   - LINK_EASE: underline/colour change of text links in --duration-micro
//     on ease-quiet (colour only – stays in the calm view, like .ph-radio).
// The H1 and the LCP image of a page never get any of these classes.
// Relative path with extension: also loadable by node --test (no @/ alias there).
export { IMAGE_HOVER, staggerStyle } from "../ShopCatalog/motion.js";

export const LINK_EASE = "transition-colors duration-(--duration-micro) ease-quiet";

/**
 * Filter islands hide server-rendered tiles with `hidden`. A tile that comes
 * BACK gets `.ph-arrive` first (opacity 0.6 → 1 in --duration-ui via
 * @starting-style when display returns) – only tiles that were hidden, never
 * on the first pass, so nothing fades in on page load.
 * @param {Element} el
 * @param {boolean} show
 * @param {boolean} firstPass
 * @returns {boolean} whether the tile is shown
 */
export function setTileVisible(el, show, firstPass) {
  if (show && el.hidden && !firstPass) el.classList.add("ph-arrive");
  el.hidden = !show;
  return show;
}
