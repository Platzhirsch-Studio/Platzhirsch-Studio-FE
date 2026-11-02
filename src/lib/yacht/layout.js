// src/lib/yacht/layout.js
// Grid rules of the yacht page (QA round 2, P2.2: no row more than a third
// empty on any device). Pure, so node --test can check them.

/**
 * Columns of a concept's zone row for n products (from 640 px):
 * 1 → one wide row tile, 2–4 → n columns, more → 4, 3 or 5, whichever
 * leaves the least empty space in the last row.
 */
export function zoneCols(n) {
  if (n <= 4) return n;
  const empty = (c) => (n % c ? (c - (n % c)) / c : 0);
  return [4, 3, 5].reduce((best, c) => (empty(c) < empty(best) ? c : best));
}

/**
 * Brand shelf: columns (≥ 1280 px) for a group of n brands and the span of
 * its last card, so the last row is filled: 4, 3 or 2 columns when they
 * divide n, else 3 with the last card stretched. From 768 px two columns, an
 * odd last card spans both.
 */
export function shelfLayout(n) {
  const xl = n <= 2 ? 2 : [4, 3, 2].find((c) => n % c === 0) || 3;
  const rest = n % xl;
  return { xl, lastSpanXl: rest ? xl - rest + 1 : 1, lastSpanMd: n % 2 ? 2 : 1 };
}

/**
 * QM r2 (desktop): ONE 12-column system for all brand groups from 1280 px
 * instead of 2-, 4- and 3-column grids under each other. Span of each card
 * (out of 12): up to 4 brands share the row evenly (6/4/3); more than four
 * go in rows of three (4), a remainder of 2 gets 6 each, a remainder of 1
 * makes the last four cards 6 each – every row ends flush.
 */
export function shelfSpans12(n) {
  if (n <= 0) return [];
  if (n <= 4) return Array.from({ length: n }, () => 12 / n);
  const rest = n % 3;
  return Array.from({ length: n }, (_, i) => ((rest === 2 && i >= n - 2) || (rest === 1 && i >= n - 4) ? 6 : 4));
}
