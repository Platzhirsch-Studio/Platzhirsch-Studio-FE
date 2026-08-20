// src/app/sitemap.js
import { generateSlug } from "@/lib/slugify";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import { fetchAllProductsForSitemap } from "@/lib/api/fetchProdukteDimension";

const BASE_URL = "https://platzhirsch.studio";
// Hardcoded, NOT new Date(): a lastModified that changes on every deploy is a
// freshness signal search engines learn to ignore. Bump this only when the static
// pages' content actually changes. Dynamic entries (brands/products/news/jobs) below
// use their real backend `modified` timestamp and fall back to this when missing.
const STATIC_LAST_MODIFIED = "2026-07-08";

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

// Static pages configuration
const STATIC_PAGES_CONFIG = [
  { key: 'home', path: '/', changeFrequency: "weekly", priority: 1.0 },
  { key: 'platzhirsch', path: '/ueber-uns/platzhirsch', changeFrequency: "monthly", priority: 0.9 },
  { key: 'brands', path: '/ueber-uns/marken', changeFrequency: "weekly", priority: 0.9 },
  { key: 'team', path: '/ueber-uns/team', changeFrequency: "monthly", priority: 0.8 },
  { key: 'career', path: '/ueber-uns/karriere', changeFrequency: "weekly", priority: 0.8, deOnly: true },
  { key: 'partners', path: '/ueber-uns/partner', changeFrequency: "monthly", priority: 0.7 },
  { key: 'press', path: '/ueber-uns/presse', changeFrequency: "monthly", priority: 0.7 },
  { key: 'products', path: '/produkte', changeFrequency: "weekly", priority: 0.9 },
  { key: 'consulting', path: '/beratung', changeFrequency: "monthly", priority: 0.8 },
  { key: 'contact', path: '/kontakt', changeFrequency: "monthly", priority: 0.8 },
  { key: 'news', path: '/news', changeFrequency: "weekly", priority: 0.8 },
  // newsletter / merkliste / impressum / datenschutz are noindex → intentionally
  // excluded here (don't advertise pages we ask Google not to index).
];

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

async function fetchProducts() {
  try {
    const products = await fetchAllProductsForSitemap();

    if (products.length > 0) {
      const sample = products[0];
    }

    let active = products;
    if (products.length > 0 && products[0].main_details_tab?.status !== undefined) {
      active = products.filter(p => p.main_details_tab?.status === "Aktiv");
    } else {
    }
    return active;
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    return [];
  }
}

// Helper to add entry
function addEntry(entries, url, lastModified, changeFrequency, priority) {
  entries.push({
    url,
    lastModified: lastModified || STATIC_LAST_MODIFIED,
    changeFrequency: changeFrequency || "monthly",
    priority: priority || 0.6,
  });
}

// ------------------------------------------------------------------
// MAIN SITEMAP GENERATOR
// ------------------------------------------------------------------
export default async function sitemap() {
  const entries = [];

  // ------------------------------------------------------------------
  // 1. STATIC PAGES (with multiple paths for about-us pages)
  // ------------------------------------------------------------------
  for (const config of STATIC_PAGES_CONFIG) {
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
          addEntry(
            entries,
            url,
            config.lastModified || STATIC_LAST_MODIFIED,
            config.changeFrequency,
            config.priority
          );
        }
      }
    } else {
      // Normal pages - single path per locale
      for (const locale of locales) {
        const localizedPath = STATIC_PAGE_TRANSLATIONS[locale][config.path];
        addEntry(
          entries,
          `${BASE_URL}/${locale}${localizedPath === '/' ? '' : localizedPath}`,
          config.lastModified || STATIC_LAST_MODIFIED,
          config.changeFrequency,
          config.priority
        );
      }
    }
  }

  // Fetch all dynamic data
  const [brands, news, products] = await Promise.all([
    fetchBrands(),
    fetchNews(),
    fetchProducts(),
  ]);

  // ------------------------------------------------------------------
  // 2. BRAND DETAIL PAGES (ALL path variants for about-us)
  // ------------------------------------------------------------------
  const BRAND_STORY_BASE = { de: '/ueber-uns/marken', en: '/about-us/brands', fr: '/a-propos/marques', it: '/chi-siamo/marche' };
  for (const brand of brands) {
    const slug = generateSlug(brand.name1);
    if (!slug) continue;
    // Brand story pages are genuinely translated → indexed on all locales.
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}${BRAND_STORY_BASE[locale]}/${slug}`,
        brand.modified ? new Date(brand.modified) : STATIC_LAST_MODIFIED,
        "monthly",
        0.7
      );
    }
  }

  // ------------------------------------------------------------------
  // 3. BRAND PRODUCT LISTING PAGES
  // ------------------------------------------------------------------
  for (const brand of brands) {
    const slug = generateSlug(brand.name1);
    if (!slug) continue;
    // Brand product-listing pages are indexed on all locales (localized title/chrome).
    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}/produkte/${slug}`,
        brand.modified ? new Date(brand.modified) : STATIC_LAST_MODIFIED,
        "weekly",
        0.8
      );
    }
  }

  // Job detail pages are noindex → intentionally NOT listed in the sitemap.

  // ------------------------------------------------------------------
  // 5. NEWS PAGES (single path - /news for all locales)
  // ------------------------------------------------------------------
  for (const newsItem of news) {
    const slug = newsItem.slug || generateSlug(newsItem.name1 || newsItem.title);
    if (!slug) continue;

    for (const locale of LOCALES) {
      addEntry(
        entries,
        `${BASE_URL}/${locale}/news/${slug}`,
        newsItem.modified ? new Date(newsItem.modified) : STATIC_LAST_MODIFIED,
        "weekly",
        0.6
      );
    }
  }

  // ------------------------------------------------------------------
  // 6. PRODUCT DETAIL PAGES (single path for products)
  // ------------------------------------------------------------------
  let productCount = 0;
  for (const product of products) {
    let markenSlug = null;
    let productSlug = null;

    const brandName = product.marken;
    const pathFieldValue = product.path_field;

    if (brandName) {
      markenSlug = generateSlug(brandName);
    }
    if (pathFieldValue) {
      productSlug = pathFieldValue;
    }

    if (markenSlug && productSlug) {
      // Product detail pages indexed on all locales for it/fr reach (localized
      // chrome/FAQ; CMS beschreibung still German-only). hreflang maps each locale.
      for (const locale of LOCALES) {
        addEntry(
          entries,
          `${BASE_URL}/${locale}/produkte/${markenSlug}/${productSlug}`,
          product.modified ? new Date(product.modified) : STATIC_LAST_MODIFIED,
          "monthly",
          0.6
        );
      }
      productCount++;
    }
  }

  // Remove duplicates
  const uniqueEntries = Array.from(
    new Map(entries.map(entry => [entry.url, entry])).values()
  );


  return uniqueEntries;
}

export const revalidate = 3600;