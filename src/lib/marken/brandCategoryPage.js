// src/lib/marken/brandCategoryPage.js
// "Marke × Kategorie" page (masterplan AP5 Nr. 1): intro text, metadata and
// JSON-LD from the data getBrandCategoryPageData() (./brandCategoryLoader.js)
// returns. Used by the preview route and — from round 3 — by
// ueber-uns/marken/[title]/[collection]/page.js (see
// Marktresearch/digital/teamleiter/r2-R2-seo.md, "Einbau-Anleitung").
//
// Rules:
// - robots: index,follow only when the combination is indexable (>= 3 active
//   products, no collection-slug collision, not excluded by the backoffice
//   audit in ./brandCategoryAudit.js), else noindex,follow.
// - canonical = the page itself in the current locale, hreflang for all four
//   locales + x-default, like the brand pages (hreflangLanguages()).
// - The intro only uses facts the backoffice proves (brand, category, number
//   of pieces) plus the neutral showroom sentence; it runs through the
//   Claim-Guard (src/lib/legal/claims.js). No dealer claim, no superlative.
//
// Pure module: relative imports only (no "server-only", no "@/"), so
// node --test can load it (tests/unit/brandCategoryPage.test.mjs).
import { BRAND_CATEGORY_MIN_MODELS, brandCategoryHref } from "./brandCategory.js";
import { makeBrandCategoryTr } from "./brandCategoryCopy.js";
import { findClaims, sanitizeClaims } from "../legal/claims.js";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, hreflangLanguages, ogLocale, toMetaDescription } from "../seo/pageMetadata.js";
import { normalizeHomeCrumb } from "../seo/breadcrumbs.js";

export const BRAND_CATEGORY_LOCALES = ["de", "en", "fr", "it"];
const IN_LANGUAGE = { de: "de-AT", en: "en-US", fr: "fr-FR", it: "it-IT" };
// ItemList: enough for every real combination today (Minotti armchairs: 96),
// capped so a mis-tagged backoffice category can't blow up the HTML.
export const ITEM_LIST_MAX = 120;

const loc = (locale) => (BRAND_CATEGORY_LOCALES.includes(locale) ? locale : "de");

/**
 * Models that decide indexability: buildBrandCategories().models (the number
 * the sitemap decides with) when the loader passed it, else the gallery.
 */
export const brandCategoryIndexModels = (data) =>
  Number.isFinite(data?.models) ? data.models : brandCategoryModelCount(data);

/**
 * robots value for the page (Runde 4 P5): index only from
 * BRAND_CATEGORY_MIN_MODELS (4) models on, without collision and not on the
 * audit list — the same rule as the sitemap (isIndexableBrandCategory).
 */
export function brandCategoryRobots(data) {
  const indexable = Boolean(data && brandCategoryIndexModels(data) >= BRAND_CATEGORY_MIN_MODELS && !data.collision && !data.excluded);
  return { index: indexable, follow: true };
}

/** "/ueber-uns/marken/minotti/sofas-couches" per locale (no locale prefix). */
export function brandCategoryPathByLocale(brandName, categorySlug) {
  return Object.fromEntries(BRAND_CATEGORY_LOCALES.map((l) => [l, brandCategoryHref(brandName, categorySlug, l)]));
}

/** Absolute URL of the page in `locale`. */
export const brandCategoryUrl = (brandName, categorySlug, locale) =>
  `${SITE_URL}/${loc(locale)}${brandCategoryHref(brandName, categorySlug, loc(locale))}`;

const hasClaim = (text, brandSlug, locale) => findClaims(text, { brandSlug, locale }).length > 0;

/**
 * Intro paragraph(s) from proven data only. Every sentence goes through the
 * Claim-Guard; a sentence that still trips it afterwards is dropped (the
 * template is clean, so only odd backoffice names could cause that).
 * @returns {string[]} sentences, in order
 */
export function buildBrandCategoryIntro({ brand, brandSlug, category, count }, locale = "de", t) {
  const l = loc(locale);
  const tr = makeBrandCategoryTr(t, l);
  const raw = [count > 0 ? tr("introCount", { brand, category, count }) : null, tr("introShowroom")].filter(Boolean);
  return raw
    .map((s) => sanitizeClaims(s, brandSlug, { locale: l, brandName: brand }))
    .filter((s) => s && !hasClaim(s, brandSlug, l));
}

/** Title/H1 strings for the page. */
export function brandCategoryTitles(data, locale = "de", t) {
  const tr = makeBrandCategoryTr(t, loc(locale));
  const values = { brand: data.brand.display, category: data.category.label };
  return { h1: tr("h1", values), metaTitle: tr("metaTitle", values), itemListName: tr("itemListName", values) };
}

/**
 * generateMetadata() result for a resolved page (data from
 * getBrandCategoryPageData). `opts.robots` overrides robots (preview route).
 */
export function buildBrandCategoryMetadata(data, locale = "de", t, opts = {}) {
  const l = loc(locale);
  const tr = makeBrandCategoryTr(t, l);
  if (!data) return { title: tr("notFoundTitle"), robots: { index: false, follow: true } };

  const { metaTitle } = brandCategoryTitles(data, l, t);
  const description = toMetaDescription(buildBrandCategoryIntro(introInput(data), l, t).join(" "));
  const urlFor = (x) => brandCategoryUrl(data.brand.name, data.category.slug, x);
  const image = data.products.find((p) => p.image)?.image || DEFAULT_OG_IMAGE;

  return {
    title: metaTitle,
    description,
    robots: opts.robots || brandCategoryRobots(data),
    alternates: { canonical: urlFor(l), languages: hreflangLanguages(urlFor) },
    openGraph: {
      title: metaTitle,
      description,
      url: urlFor(l),
      siteName: SITE_NAME,
      images: [{ url: image, alt: `${data.brand.display} ${data.category.label}` }],
      locale: ogLocale(l),
      type: "website",
    },
    twitter: { card: "summary_large_image", title: metaTitle, description, images: [image] },
  };
}

/**
 * The ONE number the page shows (intro, facts, meta description, gallery,
 * ItemList): the models in the gallery (catalogue variants merged). The raw
 * entry count (data.count) only decides indexability (brandCategoryRobots).
 */
export const brandCategoryModelCount = (data) => (Array.isArray(data?.products) ? data.products.length : Number(data?.count) || 0);

export const introInput = (data) => ({
  brand: data.brand.display,
  brandSlug: data.brand.slug,
  category: data.category.label,
  count: brandCategoryModelCount(data),
});

/**
 * JSON-LD: BreadcrumbList (Home › Marken › Marke › Kategorie) and an ItemList
 * of the products (absolute URLs of the product pages in this locale). The
 * page renders it once; the visible Breadcrumbs therefore run without `schema`.
 */
export function buildBrandCategoryJsonLd(data, locale = "de", t) {
  if (!data) return null;
  const l = loc(locale);
  const tr = makeBrandCategoryTr(t, l);
  const pageUrl = brandCategoryUrl(data.brand.name, data.category.slug, l);
  const markenPath = (brandCategoryHref(data.brand.name, data.category.slug, l) || "").split("/").slice(0, -2).join("/");
  const { h1, itemListName } = brandCategoryTitles(data, l, t);

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: normalizeHomeCrumb(tr("breadcrumbHome"), l), item: `${SITE_URL}/${l}` },
      { "@type": "ListItem", position: 2, name: tr("breadcrumbBrands"), item: `${SITE_URL}/${l}${markenPath}` },
      { "@type": "ListItem", position: 3, name: data.brand.display, item: `${SITE_URL}/${l}${markenPath}/${data.brand.slug}` },
      { "@type": "ListItem", position: 4, name: data.category.label, item: pageUrl },
    ],
  };
  const products = data.products.filter((p) => p.href).slice(0, ITEM_LIST_MAX);
  const itemList = {
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    name: itemListName,
    numberOfItems: products.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/${l}${p.href}`,
      name: `${data.brand.display} ${p.name}`,
    })),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: h1,
        inLanguage: IN_LANGUAGE[l],
        isPartOf: { "@id": `${SITE_URL}/#website` },
        breadcrumb: { "@id": breadcrumb["@id"] },
        mainEntity: { "@id": itemList["@id"] },
      },
      breadcrumb,
      itemList,
    ],
  };
}
