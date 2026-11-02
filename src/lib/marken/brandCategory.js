// src/lib/marken/brandCategory.js
// "Marke × Kategorie" (masterplan AP5 Nr. 1), prepared in R1 for round 2:
// which brand/category combinations exist, how many active products each has,
// its URL slug and whether it may be indexed.
//
// URL: /ueber-uns/marken/<brand>/<category> (en/fr/it equivalents), i.e. the
// route ueber-uns/marken/[title]/[collection]. Since R3 it resolves in the
// fixed order collection → category slug → unique short alias (308) → 404; a
// category whose slug equals one of the brand's collection slugs is never
// reached, so it is flagged as a `collision` and is never indexable.
// Combinations on the audit list (./brandCategoryAudit.js) are `excluded`:
// reachable, but noindex and not in the sitemap.
//
// Pure module: relative imports only (no "server-only", no "@/"), so
// node --test can load it (tests/unit/brandCategory.test.mjs).
import { generateSlug } from "../slugify.js";
import { ROUTES } from "../../utils/routing.js";
import { NON_PRODUCT_PATHS, isExcludedBrandCategory } from "./brandCategoryAudit.js";

// A brand × category page is indexable from this many MODELS on (Runde 4 P5,
// seo P1-1): the tiles of its gallery, i.e. distinct product names that carry
// at least one image — the same rule as groupProductsByCategory() in
// src/components/MarkenItems/brandData.js. Raw backoffice entries do not count
// (Brand van Egmond lamps: entries without images = an empty gallery).
// Below that: noindex,follow and not in the sitemap; with 0 models the route
// sends the visitor to the brand page.
export const BRAND_CATEGORY_MIN_MODELS = 4;
// Kept as the public name used by tests/sitemap docs (same value).
export const BRAND_CATEGORY_MIN_PRODUCTS = BRAND_CATEGORY_MIN_MODELS;

// Model key of a row, null without image (cleanProductName in
// src/lib/content/brands.js, replicated because this module stays pure).
export function brandCategoryModelKey(row) {
  const imgs = (Array.isArray(row?.bild_anhangen) ? row.bild_anhangen : []).filter((i) => i?.bild_anhangen);
  if (!imgs.length) return null;
  const raw = String(row?.produkt_name || row?.name || "");
  const name =
    raw
      .replace(/\s*\((?:[A-Za-zÄÖÜäöüß& ]+?)(?: \d+)?\)\s*$/u, "")
      .replace(/\s*\((?:variant|variante)\s*\d*\)\s*$/iu, "")
      .trim() || raw.trim();
  return name ? name.toLowerCase() : String(row?.path_field || "") || null;
}

/** Indexable from BRAND_CATEGORY_MIN_MODELS models on, never on collision/audit list. */
export const isIndexableBrandCategory = ({ models, collision, excluded }) =>
  Number(models) >= BRAND_CATEGORY_MIN_MODELS && !collision && !excluded;

const brandNameOf = (brand) => (typeof brand === "string" ? brand : brand?.name1 || brand?.name || "");

// Same slug the product/category URLs use (getProductEntries in
// sitemapEntries.js: generateSlug(kategories.toLowerCase())).
export const brandCategorySlug = (categoryKey) => generateSlug(String(categoryKey || "").toLowerCase());

// "/ueber-uns/marken/minotti/sofas-couches" (no locale prefix — Link from
// @/i18n/navigation adds it, like collectionPath in ./collections.js).
// `category` is a category key ("sofas-couches"), or an entry from
// buildBrandCategories ({ slug }).
export function brandCategoryHref(brand, category, locale = "de") {
  const brandSlug = generateSlug(brandNameOf(brand));
  const categorySlug = typeof category === "string" ? brandCategorySlug(category) : category?.slug || brandCategorySlug(category?.key);
  if (!brandSlug || !categorySlug) return null;
  return `${ROUTES.marken[locale] || ROUTES.marken.de}/${brandSlug}/${categorySlug}`;
}

/**
 * Breadcrumb/link target for a product's "Marke × Kategorie" (R4-produkt):
 * brandCategoryHref() only when that combination is indexable in
 * `categories` (buildBrandCategories()[i].categories), else null — a link to a
 * noindex page (< 3 products, collision, audit list) would leak link equity
 * and show a thin page; the caller then links the brand page instead.
 */
export function indexableBrandCategoryHref(categories, brand, category, locale = "de") {
  const slug = typeof category === "string" ? brandCategorySlug(category) : category?.slug || brandCategorySlug(category?.key);
  const entry = (categories || []).find((c) => c?.slug === slug);
  return entry?.indexable ? brandCategoryHref(brand, slug, locale) : null;
}

// Collection slugs per brand (by brand slug). `collections` is either
// { [brandName]: [{ name }] } (one get_collections answer per brand) or a flat
// array of { name, marken } rows.
function collectionSlugsByBrand(collections) {
  const result = new Map();
  const add = (brandName, collection) => {
    const brandSlug = generateSlug(brandNameOf(brandName));
    const slug = generateSlug(typeof collection === "string" ? collection : collection?.name);
    if (!brandSlug || !slug) return;
    if (!result.has(brandSlug)) result.set(brandSlug, new Set());
    result.get(brandSlug).add(slug);
  };
  if (Array.isArray(collections)) {
    for (const c of collections) add(c?.marken || c?.brand, c);
  } else if (collections && typeof collections === "object") {
    for (const [brandName, list] of Object.entries(collections)) for (const c of list || []) add(brandName, c);
  }
  return result;
}

const newer = (a, b) => {
  const db = b ? new Date(b) : null;
  if (!db || isNaN(db.getTime())) return a;
  return !a || db > a ? db : a;
};

// products: "Produkte New" rows ({ marken, kategories, path_field, status,
// modified }) of one or several brands — e.g. fetchProdukteNewByMarke().
// Only active rows with path_field and kategories count (the same filter the
// product and collection pages use), each path_field once.
// Returns [{ brand, brandSlug, total, categories: [{ key, slug, count,
// indexable, collision, href, lastModified }] }], brands A–Z, categories by
// count (desc) then slug.
export function buildBrandCategories(products, collections = {}) {
  const taken = collectionSlugsByBrand(collections);
  const brands = new Map();

  for (const p of products || []) {
    if (!p || (p.status && p.status !== "Aktiv")) continue;
    const brand = String(p.marken || "").trim();
    const key = String(p.kategories || "").trim();
    if (!brand || !key || !p.path_field || NON_PRODUCT_PATHS.has(p.path_field)) continue;
    const brandSlug = generateSlug(brand);
    const slug = brandCategorySlug(key);
    if (!brandSlug || !slug) continue;

    if (!brands.has(brandSlug)) brands.set(brandSlug, { brand, brandSlug, paths: new Set(), categories: new Map() });
    const b = brands.get(brandSlug);
    b.paths.add(p.path_field);
    if (!b.categories.has(slug)) b.categories.set(slug, { key, slug, paths: new Set(), models: new Set(), lastModified: null });
    const c = b.categories.get(slug);
    if (c.paths.has(p.path_field)) continue;
    c.paths.add(p.path_field);
    const model = brandCategoryModelKey(p);
    if (model) c.models.add(model);
    c.lastModified = newer(c.lastModified, p.modified);
  }

  return [...brands.values()]
    .sort((a, b) => a.brand.localeCompare(b.brand, "de"))
    .map((b) => {
      const collectionSlugs = taken.get(b.brandSlug) || new Set();
      const categories = [...b.categories.values()]
        .map((c) => {
          const count = c.paths.size;
          const models = c.models.size;
          const collision = collectionSlugs.has(c.slug);
          const excluded = isExcludedBrandCategory(b.brandSlug, c.slug);
          return {
            key: c.key,
            slug: c.slug,
            count,
            models,
            indexable: isIndexableBrandCategory({ models, collision, excluded }),
            collision,
            excluded,
            href: brandCategoryHref(b.brand, c.slug),
            lastModified: c.lastModified ? c.lastModified.toISOString() : null,
          };
        })
        .sort((x, y) => y.count - x.count || x.slug.localeCompare(y.slug));
      return { brand: b.brand, brandSlug: b.brandSlug, total: b.paths.size, categories };
    });
}

/**
 * Short alias of a category slug ("sofas" → "sofas-couches"): the one category
 * of the brand whose slug starts with `<slug>-` ("armchairs" → "armchairs-stools"). null
 * when none or several match ("garden" → garden-chairs/garden-tables) — the
 * route then answers 404. Used for a permanent redirect only.
 * @param {Array<{slug: string}>} categories buildBrandCategories()[i].categories
 */
export function findBrandCategoryAlias(categories, slug) {
  const s = String(slug || "").toLowerCase();
  if (!s || s.length < 3) return null;
  const list = categories || [];
  if (list.some((c) => c.slug === s)) return null;
  const hits = list.filter((c) => c.slug.startsWith(`${s}-`));
  return hits.length === 1 ? hits[0].slug : null;
}
