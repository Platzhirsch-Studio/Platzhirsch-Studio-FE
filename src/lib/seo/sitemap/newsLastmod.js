// src/lib/seo/sitemap/newsLastmod.js
// <lastmod> of a news article in /sitemap-news.xml (Runde 5 P6, Inhaber-offen
// Nr. 47: 25 of 28 articles carry the migration date 2025-01-14).
//
// Rule: a date that is only the import/migration day is no change date. The
// sitemap then leaves <lastmod> OUT (better none than a wrong one) until the
// real dates are entered in the backoffice. Untrusted days:
//   - MIGRATION_DATES and every `daten` day shared by more than MAX_SAME_DAY
//     articles (untrustedNewsDays(), the same rule as datePublished on the page),
//   - every `modified` day shared by more than MAX_SAME_DAY articles (a bulk
//     update/import touches all records on one day).
// Candidates in order: `modified`, then `daten`/`date`.
//
// Pure module (relative imports only), so node --test can load it.
import { MAX_SAME_DAY, untrustedNewsDays } from "../../news/newsCopy.js";

function dayOf(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/**
 * Days that are no real change date for the given news records.
 * @param {object[]} items fetchNewsData()
 * @returns {Set<string>} YYYY-MM-DD
 */
export function untrustedNewsChangeDays(items) {
  const list = Array.isArray(items) ? items : [];
  const out = untrustedNewsDays(list);
  const count = new Map();
  for (const item of list) {
    const day = dayOf(item?.modified);
    if (day) count.set(day, (count.get(day) || 0) + 1);
  }
  for (const [day, n] of count) if (n > MAX_SAME_DAY) out.add(day);
  return out;
}

/**
 * Change date of one article for the sitemap, or null (→ no <lastmod>).
 * @param {object} item one record
 * @param {Set<string>} untrusted untrustedNewsChangeDays(all records)
 * @returns {Date|null}
 */
export function newsLastModified(item, untrusted) {
  for (const value of [item?.modified, item?.daten || item?.date]) {
    const day = dayOf(value);
    if (day && !untrusted.has(day)) return new Date(value);
  }
  return null;
}
