// src/components/News/staleNews.js – pure (node --test). QM content-legal r3:
// posts tied to a past year („Gartensaison 2023“, „Salone del Mobile 2024“,
// „Broschüre 2022“) stood at the top of the list, because the backoffice gives
// most posts the same migration date. A post whose headline names only years
// at least two years back moves behind the timeless ones; the order inside
// both groups stays as delivered. Nothing is removed (the posts stay public).

const YEAR_RE = /(?<!\d)(20\d{2})(?!\d)/g;

/**
 * @param {string} title  headline (any language)
 * @param {number} currentYear
 * @returns {boolean} true when every year in the title is ≤ currentYear − 2
 */
export function isDatedPast(title, currentYear) {
  const years = [...String(title || "").matchAll(YEAR_RE)].map((m) => Number(m[1]));
  return years.length > 0 && years.every((y) => y <= currentYear - 2);
}

/**
 * Stable reorder: timeless/current posts first, past-year posts after them.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} titleOf
 * @param {number} [currentYear]
 * @returns {T[]}
 */
export function pastYearLast(items, titleOf, currentYear = new Date().getFullYear()) {
  const list = Array.isArray(items) ? items : [];
  const fresh = [];
  const past = [];
  for (const item of list) (isDatedPast(titleOf(item), currentYear) ? past : fresh).push(item);
  return [...fresh, ...past];
}
