// src/lib/marken/brandCategoryLoader.js
// Data loader + generateMetadata helper for the "Marke × Kategorie" page
// (/ueber-uns/marken/<brand>/<category>, en/fr/it equivalents).
//
// getBrandCategoryPageData(brandSlug, categorySlug, locale) → data | null
//   null = unknown/inactive brand or no active product of that brand in that
//   category → the page calls notFound().
// The same backoffice calls the brand page makes (fetchRawMarkenData,
// fetchProdukteNewByMarke, fetchCollectionsByMarke, fetchKategorien), all
// cached by Next's data cache (revalidate 3600) and read-only. React cache()
// de-duplicates the work between generateMetadata and the page.
//
// Wired into ueber-uns/marken/[title]/[collection]/page.js (R3) AFTER the
// collection lookup (collections win on a slug collision); a unique short
// alias ("sofas" → "sofas-couches") is answered with a permanent redirect
// (getBrandCategoryAlias). Excluded combinations (./brandCategoryAudit.js)
// render, but noindex. Entries that are no products (NON_PRODUCT_PATHS) are
// left out of counts and gallery.
import "server-only";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { displayBrandName } from "@/lib/content/brands";
import { generateSlug } from "@/lib/slugify";
import { brandFacts, groupProductsByCategory } from "@/components/MarkenItems/brandData";
import { probeImageSize } from "@/components/MarkenItems/imageSize";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import {
  buildBrandCategories,
  brandCategoryHref,
  brandCategorySlug,
  findBrandCategoryAlias,
  indexableBrandCategoryHref,
} from "@/lib/marken/brandCategory";
import { brandCategoryExclusion, withoutNonProducts } from "@/lib/marken/brandCategoryAudit";
import { BRAND_CATEGORY_NAMESPACE } from "@/lib/marken/brandCategoryCopy";
import { buildBrandCategoryMetadata } from "@/lib/marken/brandCategoryPage";

const LOCALES = ["de", "en", "fr", "it"];

// Brand row, its products (without non-products) and the category summary.
const loadBrandSummary = cache(async (brandSlug) => {
  const marken = await fetchRawMarkenData().catch(() => []);
  const marke = (marken || []).find((m) => generateSlug(m?.name1) === brandSlug);
  if (!marke || marke.status !== "Aktiv") return null;
  const [rows, collections] = await Promise.all([
    fetchProdukteNewByMarke(marke.name1).catch(() => []),
    fetchCollectionsByMarke(marke.name1).catch(() => []),
  ]);
  const products = withoutNonProducts(rows);
  // Counts, indexability, collision, exclusion, lastModified (pure, unit-tested).
  const [summary] = buildBrandCategories(products, { [marke.name1]: collections });
  return { marke, products, summary };
});

/**
 * Canonical path (no locale prefix) for a unique short alias of a category
 * slug ("sofas" → "/ueber-uns/marken/minotti/sofas-couches"), else null.
 */
export async function getBrandCategoryAlias(brandSlug, slug, locale = "de") {
  const base = await loadBrandSummary(brandSlug);
  const target = base?.summary ? findBrandCategoryAlias(base.summary.categories, slug) : null;
  return target ? brandCategoryHref(base.marke.name1, target, LOCALES.includes(locale) ? locale : "de") : null;
}

/**
 * For the product page breadcrumb (R4-produkt): path (no locale prefix) of the
 * product's brand × category page when it is indexable, else null → link the
 * brand page. Same cached backoffice calls as the brand page.
 * `brandName` = Produkte New `marken`, `categoryKey` = `kategories`.
 */
export async function getIndexableBrandCategoryHref(brandName, categoryKey, locale = "de") {
  const base = await loadBrandSummary(generateSlug(brandName));
  if (!base?.summary) return null;
  return indexableBrandCategoryHref(base.summary.categories, base.marke.name1, categoryKey, LOCALES.includes(locale) ? locale : "de");
}

// Hero: the first landscape image among the first gallery images, in its own
// aspect ratio (QA R2 P3-1: no grey bars from a fixed 3:2 box with contain).
const HERO_CANDIDATES = 4;
const HERO_MIN_RATIO = 1.2;
async function pickHero(products) {
  const candidates = products.filter((p) => p.image).slice(0, HERO_CANDIDATES);
  const sized = await Promise.all(
    candidates.map(async (p) => {
      const path = String(p.image).replace(/^\/cmx/, "");
      const size = await probeImageSize(`${NEW_API_SERVER}${encodeURI(path)}`);
      return { src: p.image, alt: p.alt, ratio: size ? size.width / size.height : null };
    })
  );
  return sized.find((i) => i.ratio && i.ratio >= HERO_MIN_RATIO) || sized[0] || null;
}

async function loadBrandCategory(brandSlug, categorySlug, locale) {
  const l = LOCALES.includes(locale) ? locale : "de";
  const base = await loadBrandSummary(brandSlug);
  if (!base) return null;
  const { marke, products, summary } = base;
  const entry = summary?.categories.find((c) => c.slug === categorySlug);
  if (!entry) return null;
  const kategorien = await fetchKategorien().catch(() => []);

  // Tiles + localized labels (same shaping as the brand page's chapters).
  const chapters = groupProductsByCategory(products, kategorien, l).list;
  const labelOf = (slug) => chapters.find((c) => brandCategorySlug(c.key) === slug)?.label || slug;
  const chapter = chapters.find((c) => brandCategorySlug(c.key) === categorySlug);

  const display = displayBrandName(marke.name1);
  const facts = brandFacts(marke, l, display);

  return {
    brand: {
      name: marke.name1,
      display,
      slug: generateSlug(marke.name1),
      country: facts.country || "",
      founded: facts.founded || "",
    },
    category: { key: entry.key, slug: entry.slug, label: labelOf(entry.slug) },
    count: entry.count,
    models: entry.models,
    indexable: entry.indexable,
    collision: entry.collision,
    excluded: Boolean(entry.excluded),
    exclusionReason: brandCategoryExclusion(summary.brandSlug, entry.slug),
    lastModified: entry.lastModified,
    hero: await pickHero(chapter?.items || []),
    products: (chapter?.items || []).map((p) => ({
      slug: p.slug,
      name: p.name,
      href: p.href,
      image: p.image,
      hoverImage: p.hoverImage,
      alt: p.alt,
    })),
    otherCategories: summary.categories
      .filter((c) => c.slug !== entry.slug)
      .map((c) => ({
        key: c.key,
        slug: c.slug,
        label: labelOf(c.slug),
        count: c.count,
        // Same number the linked page shows (its gallery's model count).
        modelCount: chapters.find((ch) => brandCategorySlug(ch.key) === c.slug)?.items?.length ?? c.count,
        indexable: c.indexable,
      })),
  };
}

/** Page data, or null (→ notFound()). Cached per request. */
export const getBrandCategoryPageData = cache(loadBrandCategory);

/** next-intl translator of the brandCategory namespace, or null while the keys are not merged. */
export async function getBrandCategoryTranslator(locale) {
  try {
    return await getTranslations({ locale, namespace: BRAND_CATEGORY_NAMESPACE });
  } catch {
    return null;
  }
}

/**
 * generateMetadata helper: `return generateBrandCategoryMetadata(title, collection, locale)`.
 * `opts.robots` overrides robots (the preview route forces noindex).
 */
export async function generateBrandCategoryMetadata(brandSlug, categorySlug, locale, opts) {
  const [data, t] = await Promise.all([
    getBrandCategoryPageData(brandSlug, categorySlug, locale),
    getBrandCategoryTranslator(locale),
  ]);
  return buildBrandCategoryMetadata(data, locale, t, opts);
}
