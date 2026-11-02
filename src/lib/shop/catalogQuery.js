// src/lib/shop/catalogQuery.js
// URL state of the category catalogue (ShopCatalog/shopCatalog.js), pure and
// testable (R6-produkt-perf; before inside the client component).
// QA Runde 1 (P1-1): filters and the "show more" step live in the query
// (?marke=minotti&typ=modulsofa&seite=2; values are slugs, several values
// comma-separated, foreign params such as utm_* are kept).
// No "@/..." imports: tested directly with `node --test`.
import { generateSlug } from "../slugify.js";

export const PAGE_PARAM = "seite";
export const PRODUCTS_PER_PAGE = 24;
// Upper bound for ?seite= (a hand-typed ?seite=9999 must not render 240 000 tiles).
export const MAX_PAGE = 50;

export const optionSlug = (value) => generateSlug(String(value ?? ""));

/** Empty selection: one Set per group key. */
export function emptySelection(groups) {
  return Object.fromEntries(groups.map((g) => [g.key, new Set()]));
}

/** "?a=b" / "a=b" / URLSearchParams → plain object. */
export function queryObject(search) {
  return Object.fromEntries(new URLSearchParams(search || ""));
}

/**
 * URL → selection: every option whose slug is listed in its group's param.
 * `allGroups` gives the keys of the (empty) Sets, `groups` the groups with
 * their options (only those can be selected).
 */
export function selectionFromQuery(query, groups, allGroups = groups) {
  const s = emptySelection(allGroups);
  for (const g of groups) {
    const raw = query?.[g.param];
    if (!raw) continue;
    const wanted = new Set(
      String(raw)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    );
    for (const o of g.options || []) if (wanted.has(optionSlug(o.value))) s[g.key].add(o.value);
  }
  return s;
}

/** ?seite=n → n (1 … MAX_PAGE), anything else → 1. */
export function pageFromQuery(query) {
  const n = parseInt(query?.[PAGE_PARAM], 10);
  return Number.isFinite(n) && n > 1 ? Math.min(n, MAX_PAGE) : 1;
}

/** Selection + page → "?…" (or ""). `ownParams` are replaced, the rest is kept. */
export function buildQuery(baseSearch, groups, selected, page, ownParams = [...groups.map((g) => g.param), PAGE_PARAM]) {
  const params = new URLSearchParams(baseSearch || "");
  for (const p of ownParams) params.delete(p);
  for (const g of groups) {
    const values = [...(selected[g.key] || [])].map(optionSlug).filter(Boolean).sort();
    if (values.length) params.set(g.param, values.join(","));
  }
  if (page > 1) params.set(PAGE_PARAM, String(page));
  const q = params.toString().replace(/%2C/g, ",");
  return q ? `?${q}` : "";
}
