// src/lib/shop/categoryAliases.js
// Old / short catalogue slugs that point to exactly ONE current category.
// /produkte/sofas was the old site's category and is still linked and typed
// (Abnahme Katalog R8).
//
// Rule (R4-produkt): an alias is one word-part of a compound category slug
// ("sofas" and "couches" of "sofas-couches") that occurs in exactly one
// current category with products. Checked 26.10.2026 against the 31 live
// category slugs (tests/unit/r4-produkt.test.mjs keeps that list and fails
// on a second match):
//   - "stools" (armchairs-stools, bar-stools), "daybeds" (chaise-longues-
//     daybeds, lounge-furniture-daybeds), "tables", "chairs" are ambiguous
//     → no alias, the slug stays a 404.
//   - corner-, sleeper- and leather-sofas sit in the mega menu but have no CMS
//     row and no products; if one of them goes live, "sofas" is ambiguous and
//     must be removed here.
//   - No alias equals a brand slug (the brand redirect below it would never
//     be reached).
// The category page answers with Next permanentRedirect (308, SEO-equal to a
// 301), only when the slug is not a category itself and the target resolves.
export const CATEGORY_ALIASES = Object.freeze({
  sofas: "sofas-couches",
  couches: "sofas-couches",
  armchairs: "armchairs-stools",
  sideboards: "sideboards-chests",
  chests: "sideboards-chests",
  "chaise-longues": "chaise-longues-daybeds",
  "lounge-furniture": "lounge-furniture-daybeds",
  loungers: "sun-loungers",
});

/** Target category slug for an alias, or null. */
export function categoryAlias(slug) {
  return Object.hasOwn(CATEGORY_ALIASES, slug) ? CATEGORY_ALIASES[slug] : null;
}
