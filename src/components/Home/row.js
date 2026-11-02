// Shared bits of the mobile scroll rows (R3-startseite: page length).
// Server-side module: plain strings and a helper, no client code (constants
// exported from the "use client" ScrollRow would arrive as client references).

/**
 * Mobile: one horizontal scroll-snap row that bleeds to the screen edge and
 * keeps the gutter as scroll padding; the next card peeks in as a cue.
 * From `sm`: back to a grid (the caller adds the column classes).
 */
export const ROW_MOBILE =
  "-mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto overscroll-x-contain px-gutter pb-2 " +
  "sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0";

/** Width of one card in the mobile row (`w-[…]` + snap). */
export const ROW_ITEM = "shrink-0 snap-start sm:w-auto sm:max-w-none";

/** Labels for <ScrollRow>; position keeps its placeholders for the client. */
export function scrollLabels(t) {
  return {
    prev: t("scroll.prev"),
    next: t("scroll.next"),
    position: t("scroll.position", { current: "{current}", total: "{total}" }),
  };
}

/**
 * Vertical section rhythm of the homepage: 40 px on phones instead of the
 * 96 px token (page length; the sections alternate surfaces, so the bands
 * still read as chapters), the token (96/128 px) on tablets. Desktop
 * (Runde 2, Fix-Team P2, ux P2-1): 80 px per side, so two chapters stand
 * 160 px apart instead of 352 px (page height −15 % without cutting content).
 * Use with <Section spacing="none" className={SECTION_Y}>.
 */
// QM shell-home r5 (phone-quer 844 × 390): the tablet token (96 px per side)
// left up to 2/3 of the short screen empty between chapters – on short
// landscape screens below lg the phone rhythm applies.
export const SECTION_Y = "py-10 sm:py-section lg:py-20 max-lg:[@media(orientation:landscape)_and_(max-height:500px)]:py-10";

/**
 * Motion shell-home (01.11.2026): the cards of a row/grid arrive one after
 * another while it scrolls into view (globals.css .reveal-group: transform
 * only, at most four steps, nothing is ever hidden; off under reduced motion
 * and the "Ruhige Ansicht"). 16 px instead of the 24 px default – the H2
 * above already lifts 8 px, the cards answer quietly. On phones the row is a
 * horizontal scroller: the cards' view() timeline has no block-axis scroll
 * there, so they simply stand (verified in Chromium, 390 px).
 */
export const ROW_REVEAL = "reveal-group [--reveal-y:16px]";
