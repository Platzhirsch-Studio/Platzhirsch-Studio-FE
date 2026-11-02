// src/lib/seo/sitemap/brandCategorySitemap.js
// Switch + pure entry builder for the "Marke × Kategorie" URLs in
// /sitemap-marken.xml (R2-seo).
//
// BRAND_CATEGORY_SITEMAP_ENABLED: switched on in R3 (R3-marken-seo) together
// with the route ueber-uns/marken/[title]/[collection]/page.js, which now
// renders these pages (collection first, then category). Deliberately a
// constant, not an env var: a stray variable must not list dead URLs.
//
// Only indexable combinations (>= 3 active products, no collision with a
// collection slug, not on the audit list src/lib/marken/brandCategoryAudit.js)
// are listed — exactly the pages whose robots is
// index,follow (brandCategoryRobots in src/lib/marken/brandCategoryPage.js).
//
// Pure module (relative imports only), so node --test can load it.
import { brandCategoryHref } from "../../marken/brandCategory.js";
import { BASE_URL } from "./xml.js";

export const BRAND_CATEGORY_SITEMAP_ENABLED = true;

const LOCALES = ["de", "en", "fr", "it"];
// Fallback when no product carries a `modified` (never new Date()).
export const BRAND_CATEGORY_FALLBACK_LAST_MODIFIED = "2026-10-26";

/**
 * @param {Array} brands buildBrandCategories() results (one or several brands)
 * @returns sitemap entries ({ url, lastModified, changeFrequency, priority,
 *   alternates.languages }), one per indexable combination and locale.
 */
export function toBrandCategoryEntries(brands, baseUrl = BASE_URL) {
  const entries = new Map();
  for (const brand of brands || []) {
    for (const category of brand?.categories || []) {
      if (!category.indexable) continue;
      const pathByLocale = Object.fromEntries(LOCALES.map((l) => [l, brandCategoryHref(brand.brand, category, l)]));
      if (LOCALES.some((l) => !pathByLocale[l])) continue;
      const languages = Object.fromEntries(LOCALES.map((l) => [l, `${baseUrl}/${l}${pathByLocale[l]}`]));
      languages["x-default"] = languages.de;
      for (const locale of LOCALES) {
        const url = `${baseUrl}/${locale}${pathByLocale[locale]}`;
        entries.set(url, {
          url,
          lastModified: category.lastModified || BRAND_CATEGORY_FALLBACK_LAST_MODIFIED,
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: { languages },
        });
      }
    }
  }
  return [...entries.values()];
}
