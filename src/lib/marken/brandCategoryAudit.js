// src/lib/marken/brandCategoryAudit.js
// Backoffice-Prüfung "Marke × Kategorie" (R3-marken-seo, 26.10.2026), nur
// lesend: get_produkte_by_marke_api + get_collections für alle 36 aktiven
// Marken. 151 Kombinationen, davon 112 mit >= 3 Einträgen. Bericht:
// Marktresearch/digital/teamleiter/r3-R3-marken-seo.md §2.
//
// Eine Kombination auf dieser Liste ist nie indexierbar (noindex,follow) und
// steht nicht in der Sitemap, die Seite bleibt erreichbar. buildBrandCategories
// (./brandCategory.js) liest die Liste, damit Seite (robots), Sitemap und
// interne Links dieselbe Entscheidung treffen.
//
// Gründe:
//  - "variants": >= 3 Einträge, aber weniger als 3 eigene Modelle (Farb-/
//    Größenvarianten eines Stücks) → dünne Seite.
//  - "doubtful": Zuordnung im Backoffice fraglich, genau an der Schwelle.
// Eintrag entfernen, sobald das Backoffice bereinigt ist bzw. genug eigene
// Modelle hat (dann erscheint die Seite automatisch in der Sitemap).
//
// Reines Modul (keine Imports), node --test lädt es.

export const BRAND_CATEGORY_AUDIT_DATE = "2026-10-26";

/** { [brandSlug]: { [categorySlug]: Grund } } */
export const BRAND_CATEGORY_EXCLUSIONS = Object.freeze({
  "101-copenhagen": Object.freeze({
    lamps: "variants: 20 Einträge, eine Familie (Drop Chandelier in Farben/Größen + Deckenplatte)",
    decor: "variants: Baburu Bowl und Brick Candle Holder in Farben, dazu das Brand Book",
    "dining-chairs": "variants: 6 Einträge, 2 Modelle (Brutus, Brutus Slim)",
    "armchairs-stools": "variants: 4 Einträge, 1 Modell (Toe Armchair)",
    "kitchen-accessories": "variants: Buttermesser, Stäbchenhalter, Tasse – keine eigene Kategorie-Seite",
    "side-tables": "variants: 3 Einträge, 1 Modell (Artist Side Table)",
    "small-furniture": "variants: 3 Einträge, 2 Modelle (Arc Bench, Arc Console)",
  }),
  rimadesio: Object.freeze({
    rugs: "doubtful: genau 3 Einträge (Kanji, Kita, Miglio), Teppich-Zuordnung bei Rimadesio im Backoffice zu prüfen",
  }),
});

/**
 * Einträge, die im Backoffice als Produkt angelegt sind, aber keins sind
 * (Referenz-/Projektbeiträge). Sie zählen nicht für die Indexierbarkeit und
 * erscheinen nicht in der Galerie der Marke × Kategorie-Seite.
 */
export const NON_PRODUCT_PATHS = Object.freeze(new Set(["kitchen-the-modern-kitchen-in-a-period-property"]));

/** Grund, wenn die Kombination ausgeschlossen ist, sonst null. */
export function brandCategoryExclusion(brandSlug, categorySlug) {
  return BRAND_CATEGORY_EXCLUSIONS[brandSlug]?.[categorySlug] || null;
}

export const isExcludedBrandCategory = (brandSlug, categorySlug) => Boolean(brandCategoryExclusion(brandSlug, categorySlug));

/** Backoffice-Zeilen ohne die Nicht-Produkte. */
export const withoutNonProducts = (rows) => (rows || []).filter((r) => !r || !NON_PRODUCT_PATHS.has(r.path_field));
