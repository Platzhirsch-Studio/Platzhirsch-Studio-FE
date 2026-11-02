// Main bar fit (Inhaber 01.11.2026: Hauptnavigation ab 1280 px in allen vier
// Sprachen in EINER Zeile). Instead of a fixed per-locale breakpoint, the
// header measures what the list really needs and picks the most generous
// density that fits between logo and icon row (Navbar.module.css, data-nav):
//
//   "0"  16 px, 10 px padding (the regular bar, e.g. DE/EN at 1440 px)
//   "1"  16 px,  6 px
//   "2"  15 px,  6 px
//   "3"  14 px,  6 px (FR/IT at 1280 px: 12 px between the words; QM r2 –
//        4 px read as "Living Cucina Bagno" crammed together)
//   "4"  14 px,  4 px (last resort before the menu)
//   "menu" nothing fits (e.g. WCAG 1.4.12 text spacing, 200 % text):
//          the bar is hidden (visibility, keeps the layout) and the menu
//          button takes over – only then, not for everyone.
//
// Everything is measured synchronously in one frame (no flicker); a
// ResizeObserver on the slot and the list re-runs it when the window, the
// fonts or the text spacing change. Switching levels never changes the slot
// width (flex-1, basis 0), the menu button's width is added back when
// leaving "menu" – so the result is stable and cannot oscillate.

export const NAV_LEVELS = ["0", "1", "2", "3", "4"];

/** First level whose list width fits `avail`; "menu" when none does. */
export function chooseNavLevel(needs, avail) {
  const i = needs.findIndex((need) => need <= avail);
  return i === -1 ? "menu" : NAV_LEVELS[i];
}

/** Space the list may take: the slot, plus the menu button while it is shown. */
export function availableWidth(slotWidth, burgerWidth = 0, gap = 0) {
  return slotWidth + (burgerWidth > 0 ? burgerWidth + gap : 0);
}

/**
 * Measures the header and sets header.dataset.nav. Returns the chosen level
 * (or null when the bar is not used at this width / not in the DOM).
 */
export function fitNav(header) {
  const slot = header?.querySelector("[data-nav-slot]");
  const list = slot?.querySelector("ul");
  if (!slot || !list || getComputedStyle(slot).display === "none") return null;
  const burger = header.querySelector("[data-nav-burger]");
  const burgerWidth = burger ? burger.getBoundingClientRect().width : 0;
  const gap = burger?.parentElement ? parseFloat(getComputedStyle(burger.parentElement).columnGap) || 0 : 0;
  const avail = availableWidth(slot.clientWidth, burgerWidth, gap);
  const before = header.dataset.nav;
  const needs = [];
  for (const level of NAV_LEVELS) {
    header.dataset.nav = level;
    const need = Math.ceil(list.scrollWidth);
    needs.push(need);
    if (need <= avail) break; // most generous fit found
  }
  const level = chooseNavLevel(needs, avail);
  header.dataset.nav = level;
  if (before !== level) header.dispatchEvent(new CustomEvent("ph-nav-fit", { detail: level }));
  return level;
}
