// src/lib/seo/sitemapEntries.js
// Builds the entries for the split sitemaps. /sitemap.xml is a sitemap index
// (src/app/sitemap.xml/route.js) pointing at one file per section:
//   /sitemap-static.xml   home, about/hub pages, open jobs   → getStaticEntries()
//   /sitemap-marken.xml   brand story + collection pages     → getBrandEntries()
//   /sitemap-news.xml     news articles                      → getNewsEntries()
//   /sitemap-produkte.xml product categories + product pages → getProductEntries()
// Each URL belongs to exactly one section. The XML lists only <loc> +
// <lastmod> (see toUrlsetXml); hreflang lives in each page's own <head>.
import "server-only";
import { LANDING_PAGES, landingPagePath } from "@/lib/content/landingPages";
import { generateSlug } from "@/lib/slugify";
import { productsPathByLocale } from "@/utils/routing";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import { fetchProduktePaths, fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { collectionPath } from "@/lib/marken/collections";

export const BASE_URL = "https://platzhirsch.studio";
// <lastmod> must be the date the content really changed — never new Date():
// a value that changes on every deploy is a freshness signal search engines
// learn to ignore. Where it comes from:
//   static pages   → `lastModified` in STATIC_PAGES_CONFIG (bump on copy change);
//                    hub pages that list backend data also take the newest
//                    item (products hub ← newest product, news hub ← newest article …)
//   landing pages  → `lastModified` in src/lib/content/landingPages.js
//   products/news/jobs → their backend `modified`
//   brands/collections → newest of BRAND_TEMPLATE_LAST_MODIFIED and the
//                    `modified` of the brand's (collection's) products —
//                    marken_data has no `modified` of its own
// STATIC_LAST_MODIFIED is only the last-resort fallback when none of these exist.
const STATIC_LAST_MODIFIED = "2026-07-08";
// Last change of the brand / collection page templates (page.js, MarkenItems,
// collectionDetail, brandSchema, collectionPage) — a template change changes
// every brand page, and brands without products have no other date. Bump it
// when you change those files.
const BRAND_TEMPLATE_LAST_MODIFIED = "2026-10-07";

// Supported locales
const LOCALES = ['de', 'en', 'fr', 'it'];

// Path patterns for about-us related pages (multiple variants per locale)
const ABOUT_US_PATH_PATTERNS = {
  // About Us main page
  platzhirsch: {
    de: ['/ueber-uns/platzhirsch'],
    en: ['/about-us/platzhirsch'],
    fr: ['/a-propos/platzhirsch',],
    it: ['/chi-siamo/platzhirsch'],
  },
  // Brands page
  brands: {
    de: ['/ueber-uns/marken',],
    en: ['/about-us/brands',],
    fr: ['/a-propos/marques',],
    it: ['/chi-siamo/marche'],
  },
  // Team page
  team: {
    de: ['/ueber-uns/team',],
    en: ['/about-us/team',],
    fr: ['/a-propos/equipe',],
    it: ['/chi-siamo/team'],
  },
  // Career page
  career: {
    de: ['/ueber-uns/karriere',],
    en: ['/about-us/career',],
    fr: ['/a-propos/carriere',],
    it: ['/chi-siamo/carriera'],
  },
  // Partners page
  partners: {
    de: ['/ueber-uns/partner'],
    en: ['/about-us/partners',],
    fr: ['/a-propos/partenaires',],
    it: ['/chi-siamo/partner'],
  },
  // Press page
  press: {
    de: ['/ueber-uns/presse',],
    en: ['/about-us/press',],
    fr: ['/a-propos/presse',],
    it: ['/chi-siamo/stampa'],
  },
};

// Single paths for all other pages (per locale)
const STATIC_PAGE_TRANSLATIONS = {
  de: {
    '/': '/',
    '/produkte': '/produkte',
    '/beratung': '/beratung',
    '/kontakt': '/kontakt',
    '/news': '/news',
    '/newsletter': '/newsletter',
    '/merkliste': '/merkliste',
    '/impressum': '/impressum',
    '/datenschutz': '/datenschutz',
  },
  en: {
    '/': '/',
    '/produkte': '/products',
    '/beratung': '/consultation',
    '/kontakt': '/contact',
    '/news': '/news',
    '/newsletter': '/newsletter',
    '/merkliste': '/wishlist',
    '/impressum': '/impressum',
    '/datenschutz': '/datenschutz',
  },
  fr: {
    '/': '/',
    '/produkte': '/produits',
    '/beratung': '/conseil',
    '/kontakt': '/contact',
    '/news': '/nouvelles',
    '/newsletter': '/newsletter',
    '/merkliste': '/liste-de-souhaits',
    '/impressum': '/impressum',
    '/datenschutz': '/datenschutz',
  },
  it: {
    '/': '/',
    '/produkte': '/prodotti',
    '/beratung': '/consulenza',
    '/kontakt': '/contatto',
    '/news': '/notizie',
    '/newsletter': '/newsletter',
    '/merkliste': '/lista-desideri',
    '/impressum': '/impressum',
    '/datenschutz': '/datenschutz',
  },
};

// Static pages configuration. `lastModified` = date the page's own code/copy
// last changed (from git history) — bump it when you change that page.
const STATIC_PAGES_CONFIG = [
  { key: 'home', path: '/', changeFrequency: "weekly", priority: 1.0, lastModified: "2026-10-08" },
  { key: 'platzhirsch', path: '/ueber-uns/platzhirsch', changeFrequency: "monthly", priority: 0.9, lastModified: "2026-10-07" },
  { key: 'brands', path: '/ueber-uns/marken', changeFrequency: "weekly", priority: 0.9, lastModified: "2026-10-07" },
  { key: 'team', path: '/ueber-uns/team', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'career', path: '/ueber-uns/karriere', changeFrequency: "weekly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'partners', path: '/ueber-uns/partner', changeFrequency: "monthly", priority: 0.7, lastModified: "2026-10-07" },
  { key: 'press', path: '/ueber-uns/presse', changeFrequency: "monthly", priority: 0.7, lastModified: "2026-10-07" },
  { key: 'products', path: '/produkte', changeFrequency: "weekly", priority: 0.9, lastModified: "2026-10-07" },
  { key: 'consulting', path: '/beratung', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'contact', path: '/kontakt', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'news', path: '/news', changeFrequency: "weekly", priority: 0.8, lastModified: "2026-10-07" },
  // newsletter / merkliste / impressum / datenschutz are noindex → intentionally
  // excluded here (don't advertise pages we ask Google not to index).
];

// Local landing pages (src/app/[locale]/<slug>/page.js) — German only, indexable,
// no hreflang (the other locales 404 on purpose). Listed from LANDING_PAGES in
// src/lib/content/landingPages.js, which also holds each page's lastModified.

// ------------------------------------------------------------------
// DATA FETCHERS
// ------------------------------------------------------------------
async function fetchBrands() {
  try {
    const marken = await fetchRawMarkenData();
    const active = marken.filter(m => m.status === "Aktiv");
    return active;
  } catch (error) {
    console.error("Error fetching brands for sitemap:", error);
    return [];
  }
}

async function fetchNews() {
  try {
    const news = await fetchNewsData();
    return news || [];
  } catch (error) {
    console.error("Error fetching news for sitemap:", error);
    return [];
  }
}

// Active, category-bearing "Produkte New" products ({path_field, kategories,
// modified}) — the same list the /produkte/[category]/[product] pages are
// built from, so every URL listed here actually resolves.
async function fetchProductPaths() {
  try {
    return (await fetchProduktePaths()).filter((p) => p.path_field && p.kategories);
  } catch (error) {
    console.error("Error fetching product paths for sitemap:", error);
    return [];
  }
}

// Active jobs, each with its `slug` (see fetchKarrierData.js).
async function fetchJobs() {
  try {
    return await fetchKarriereData();
  } catch (error) {
    console.error("Error fetching jobs for sitemap:", error);
    return [];
  }
}

async function fetchCategoryKeys() {
  try {
    return (await fetchKategorien()).map((k) => k.category_key).filter(Boolean);
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
    return [];
  }
}

// Newest valid date among the given values (strings/Dates/null, arrays are
// flattened), or null when there is none.
function newest(...values) {
  let best = null;
  for (const value of values.flat()) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime()) && (!best || date > best)) best = date;
  }
  return best;
}

// Per brand (by name1): { brand, collections } with the newest `modified` of the
// brand's products and of each collection's products. marken_data and
// get_collections carry no change date, so the products are the best signal
// that a brand or collection page changed. One cached call per brand (the same
// call the brand pages make).
async function fetchBrandDates(brands) {
  const pairs = await Promise.all(
    brands.map(async (brand) => {
      const products = await fetchProdukteNewByMarke(brand.name1);
      const collections = new Map();
      for (const product of products || []) {
        if (!product.collection) continue;
        collections.set(product.collection, newest(collections.get(product.collection), product.modified));
      }
      const brandDate = newest(BRAND_TEMPLATE_LAST_MODIFIED, brand.modified, (products || []).map((p) => p.modified));
      for (const [name, date] of collections) collections.set(name, newest(BRAND_TEMPLATE_LAST_MODIFIED, date));
      return [brand.name1, { brand: brandDate, collections }];
    })
  );
  return new Map(pairs);
}

// Helper to add entry. `pathByLocale` ({ de, en, fr, it } → path after the
// locale prefix) adds hreflang alternates, matching the pages' own tags.
function addEntry(entries, url, lastModified, changeFrequency, priority, pathByLocale) {
  const entry = {
    url,
    lastModified: lastModified || STATIC_LAST_MODIFIED,
    changeFrequency: changeFrequency || "monthly",
    priority: priority || 0.6,
  };
  if (pathByLocale) {
    const languages = {};
    for (const locale of LOCALES) languages[locale] = `${BASE_URL}/${locale}${pathByLocale[locale]}`;
    languages["x-default"] = languages.de;
    entry.alternates = { languages };
  }
  entries.push(entry);
}

// Same path in every locale (category/product/news pages).
const samePath = (path) => Object.fromEntries(LOCALES.map((locale) => [locale, path]));

function dedupe(entries) {
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}

// ------------------------------------------------------------------
// 1. STATIC PAGES (home, about pages, hub pages) — /sitemap-static.xml
// ------------------------------------------------------------------
export async function getStaticEntries() {
  const entries = [];

  // Hub pages list backend data, so they also change when that data changes:
  // the newest item counts as well as the page's own lastModified.
  const [productPaths, news, jobs, brands] = await Promise.all([fetchProductPaths(), fetchNews(), fetchJobs(), fetchBrands()]);
  const brandDates = await fetchBrandDates(brands);
  const hubDataDate = {
    products: newest(productPaths.map((p) => p.modified)),
    news: newest(news.filter((n) => n.status === "Aktiv").map((n) => n.modified || n.daten)),
    career: newest(jobs.map((j) => j.modified || j.posted)),
    brands: newest([...brandDates.values()].map((d) => d.brand)),
  };

  for (const config of STATIC_PAGES_CONFIG) {
    const lastModified = newest(config.lastModified, hubDataDate[config.key]);
    // Check if this is an about-us related page
    const aboutUsKeys = ['platzhirsch', 'brands', 'team', 'career', 'partners', 'press'];
    // deOnly pages (career list) are noindex for non-DE, so list them DE-only —
    // the sitemap must not advertise URLs we ask Google not to index.
    const locales = config.deOnly ? ['de'] : LOCALES;

    if (aboutUsKeys.includes(config.key)) {
      // Generate ALL path variants for about-us pages
      for (const locale of locales) {
        const pathVariants = ABOUT_US_PATH_PATTERNS[config.key][locale];
        for (const pathVariant of pathVariants) {
          const url = `${BASE_URL}/${locale}${pathVariant === '/' ? '' : pathVariant}`;
          const alternates = config.deOnly
            ? null
            : Object.fromEntries(LOCALES.map((l) => [l, ABOUT_US_PATH_PATTERNS[config.key][l][0]]));
          addEntry(
            entries,
            url,
            lastModified,
            config.changeFrequency,
            config.priority,
            alternates
          );
        }
      }
    } else {
      // Normal pages - single path per locale
      for (const locale of locales) {
        const localizedPath = STATIC_PAGE_TRANSLATIONS[locale][config.path];
        const alternates = Object.fromEntries(
          LOCALES.map((l) => {
            const p = STATIC_PAGE_TRANSLATIONS[l][config.path];
            return [l, p === '/' ? '' : p];
          })
        );
        addEntry(
          entries,
          `${BASE_URL}/${locale}${localizedPath === '/' ? '' : localizedPath}`,
          lastModified,
          config.changeFrequency,
          config.priority,
          alternates
        );
      }
    }
  }

  for (const page of LANDING_PAGES) {
    addEntry(entries, `${BASE_URL}/de${landingPagePath(page.slug)}`, page.lastModified, "monthly", 0.8);
  }

  // Open job postings (/…/karriere/<slug>, translated career path per locale)
  // — indexable, with JobPosting data for Google Jobs.
  for (const job of jobs) {
    if (!job.slug) continue;
    const pathByLocale = Object.fromEntries(
      LOCALES.map((l) => [l, `${ABOUT_US_PATH_PATTERNS.career[l][0]}/${job.slug}`])
    );
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}${pathByLocale[locale]}`,
        job.modified ? new Date(job.modified) : job.posted ? new Date(job.posted) : STATIC_LAST_MODIFIED,
        "weekly",
        0.6,
        pathByLocale
      );
    }
  }

  return dedupe(entries);
}

// ------------------------------------------------------------------
// 2. BRAND STORY PAGES — /sitemap-marken.xml
// ------------------------------------------------------------------
export async function getBrandEntries() {
  const entries = [];
  const brands = await fetchBrands();
  const brandDates = await fetchBrandDates(brands);
  const BRAND_STORY_BASE = { de: '/ueber-uns/marken', en: '/about-us/brands', fr: '/a-propos/marques', it: '/chi-siamo/marche' };
  for (const brand of brands) {
    const slug = generateSlug(brand.name1);
    if (!slug) continue;
    // Brand story pages are genuinely translated → indexed on all locales.
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}${BRAND_STORY_BASE[locale]}/${slug}`,
        brandDates.get(brand.name1)?.brand,
        "monthly",
        0.7,
        Object.fromEntries(LOCALES.map((l) => [l, `${BRAND_STORY_BASE[l]}/${slug}`]))
      );
    }
  }

  // Collection pages (/…/marken/<brand>/<collection>), every collection of
  // every active brand — the same list get_collections gives the pages, so
  // each URL resolves. Collections have no `modified` of their own: the
  // newest of their products is used, else the brand's.
  const collectionsByBrand = await Promise.all(
    brands.map(async (brand) => [brand, await fetchCollectionsByMarke(brand.name1).catch(() => [])])
  );
  for (const [brand, collections] of collectionsByBrand) {
    for (const collection of collections) {
      if (!collection?.name) continue;
      const pathByLocale = Object.fromEntries(
        LOCALES.map((l) => [l, collectionPath(l, brand.name1, collection.name)])
      );
      const dates = brandDates.get(brand.name1);
      const collectionDate = dates?.collections.get(collection.name) || dates?.brand;
      for (const locale of LOCALES) {
        addEntry(
          entries,
          `${BASE_URL}/${locale}${pathByLocale[locale]}`,
          collectionDate,
          "monthly",
          0.6,
          pathByLocale
        );
      }
    }
  }

  return dedupe(entries);
}

// ------------------------------------------------------------------
// 3. PRODUCT CATEGORY + PRODUCT DETAIL PAGES — /sitemap-produkte.xml
// ------------------------------------------------------------------
export async function getProductEntries() {
  const entries = [];
  const [productPaths, cmsCategoryKeys] = await Promise.all([fetchProductPaths(), fetchCategoryKeys()]);

  // Category pages at their translated path (/produkte/<category>, /products/…). Only
  // categories that actually have products: empty ones are noindex (see
  // produkte/[category]/page.js).
  const lastModifiedByCategory = new Map();
  for (const p of productPaths) {
    const key = p.kategories.toLowerCase();
    const modified = p.modified ? new Date(p.modified) : null;
    const current = lastModifiedByCategory.get(key);
    if (!current || (modified && modified > current)) lastModifiedByCategory.set(key, modified);
  }
  const categoryKeys = new Set(
    [...cmsCategoryKeys.map((k) => k.toLowerCase()), ...lastModifiedByCategory.keys()]
      .filter((key) => lastModifiedByCategory.has(key))
  );
  for (const key of categoryKeys) {
    const pathByLocale = productsPathByLocale(generateSlug(key));
    for (const locale of LOCALES) {
      addEntry(entries, `${BASE_URL}/${locale}${pathByLocale[locale]}`, lastModifiedByCategory.get(key), "weekly", 0.8, pathByLocale);
    }
  }

  // Product detail pages at their translated path (/de/produkte/…,
  // /en/products/…, /fr/produits/…, /it/prodotti/…); hreflang between them.
  for (const product of productPaths) {
    const pathByLocale = productsPathByLocale(generateSlug(product.kategories.toLowerCase()), product.path_field);
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}${pathByLocale[locale]}`,
        product.modified ? new Date(product.modified) : STATIC_LAST_MODIFIED,
        "monthly",
        0.6,
        pathByLocale
      );
    }
  }

  return dedupe(entries);
}


// ------------------------------------------------------------------
// 4. NEWS ARTICLES (/news/<slug> in every locale) — /sitemap-news.xml
// ------------------------------------------------------------------
export async function getNewsEntries() {
  const entries = [];
  const news = await fetchNews();

  for (const newsItem of news) {
    // Only active articles: the article route 404s anything else
    // (news/[title]/page.js), so a deactivated one must not be listed.
    if (newsItem.status !== "Aktiv") continue;
    // Same slug the route matches on (generateSlug(name1)) — a different
    // source here would list URLs that 404.
    const slug = generateSlug(newsItem.name1);
    if (!slug) continue;

    // lastmod: the article's own change date, else its publication date.
    const changed = newsItem.modified || newsItem.daten;
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}/news/${slug}`,
        changed ? new Date(changed) : STATIC_LAST_MODIFIED,
        "weekly",
        0.6,
        samePath(`/news/${slug}`)
      );
    }
  }

  return dedupe(entries);
}

// ------------------------------------------------------------------
// XML serialization
// ------------------------------------------------------------------
function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toW3CDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// <urlset> with just <loc> + <lastmod> per URL, the same shape as the index.
// Deliberately no xhtml:link hreflang alternates: every page already declares
// them in its own <head> (Google accepts either place), and XHTML-namespaced
// elements make browsers render the sitemap as run-together text instead of
// the XML tree. changefreq/priority are left out too — Google ignores both.
export function toUrlsetXml(entries) {
  const urls = entries
    .map((entry) => {
      const lastmod = toW3CDate(entry.lastModified);
      return `<url>\n<loc>${escapeXml(entry.url)}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}\n</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// <sitemapindex> listing the child sitemaps. `sitemaps` = [{ path, lastModified }].
export function toSitemapIndexXml(sitemaps) {
  const items = sitemaps
    .map(({ path, lastModified }) => {
      const lastmod = lastModified ? toW3CDate(lastModified) : null;
      return `<sitemap>\n<loc>${escapeXml(`${BASE_URL}${path}`)}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}\n</sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

// Newest lastModified among entries — the index's <lastmod> for that file.
export function latestLastModified(entries) {
  let latest = null;
  for (const entry of entries) {
    const date = new Date(entry.lastModified);
    if (!isNaN(date.getTime()) && (!latest || date > latest)) latest = date;
  }
  return latest;
}

export function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

// The child sitemaps, in the order the index lists them.
export const SITEMAP_SECTIONS = [
  { path: "/sitemap-static.xml", getEntries: getStaticEntries },
  { path: "/sitemap-marken.xml", getEntries: getBrandEntries },
  { path: "/sitemap-news.xml", getEntries: getNewsEntries },
  { path: "/sitemap-produkte.xml", getEntries: getProductEntries },
];