// src/lib/seo/sitemapEntries.js
// Builds the entries for the split sitemaps. /sitemap.xml is a sitemap index
// (src/app/sitemap.xml/route.js) pointing at one file per section:
//   /sitemap-static.xml   home, about/hub pages, open jobs   → getStaticEntries()
//   /sitemap-marken.xml   brand story + collection pages     → getBrandEntries()
//                         (+ brand × category, switch off until round 3)
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
import { isWithheldNews } from "@/lib/news/withheldNews";
import { fetchProduktePaths, fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { publishableJobs } from "@/components/Karriere/glbg";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { collectionPath } from "@/lib/marken/collections";
import { MULTILINGUAL_PAGES, katalogSitemapPages, visibleExtraPages } from "@/lib/seo/sitemap/extraPages";
import { shopStartSitemapPage } from "@/lib/shop/shopStart";
import { conciergeIndexable, conciergeLive } from "@/lib/concierge/config";
import { getEzarriEntriesByLocale } from "@/lib/ezarri/data";
import { pageLocales } from "@/lib/content/landingKern/links";

// Tag, an dem die Kern-Landingpages EN/FR/IT bekamen (Sprach-Integration).
const KERN_INTL_DATE = "2026-11-01";
import { showroomSitemapPaths } from "@/lib/showroom/config";
import { REGION_FACTS, REGION_FACTS_DATE, passesDoorwayAudit } from "@/lib/seo/sitemap/doorwayAudit";
import { REGION_LINKS_DATE } from "@/lib/seo/regionen";
import { PROFILE_LOCALES, profilePath, profileUrl } from "@/components/Team/haraldProfil";
import { wunschlisteAvailable } from "@/lib/wunschliste/mode";

const WUNSCHLISTE_LAST_MODIFIED = "2026-10-30";

// Profilseite Harald Menghin: Datum der letzten Änderung von page.js (30.10.2026).
const PROFILE_LAST_MODIFIED = "2026-10-31";
import { BASE_URL } from "@/lib/seo/sitemap/xml";
import { withImages } from "@/lib/seo/sitemap/images";
import { newsLastModified, untrustedNewsChangeDays } from "@/lib/seo/sitemap/newsLastmod";
import { getIndexableRatgeber } from "@/lib/ratgeber";
import { toRatgeberEntries } from "@/lib/seo/sitemap/ratgeber";
import { BRAND_CATEGORY_SITEMAP_ENABLED } from "@/lib/seo/sitemap/brandCategorySitemap";
import { getBrandCategoryEntries } from "@/lib/seo/sitemap/brandCategoryEntries";
import { terminMode } from "@/lib/booking/config";

// /termin: content date of the booking page (bump on copy change).
const TERMIN_LAST_MODIFIED = "2026-10-29";

export { BASE_URL };

/** Concierge in sitemap/llms only while the page itself is index (Footer rule). */
export function conciergeAvailableForSeo() {
  return conciergeIndexable() && conciergeLive();
}
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
  { key: 'home', path: '/', changeFrequency: "weekly", priority: 1.0, lastModified: "2026-10-28" }, // Neuauftritt: page.js + components/Home (Hero, Process, Services) zuletzt am 28.10.2026 geändert
  { key: 'platzhirsch', path: '/ueber-uns/platzhirsch', changeFrequency: "monthly", priority: 0.9, lastModified: "2026-10-07" },
  { key: 'brands', path: '/ueber-uns/marken', changeFrequency: "weekly", priority: 0.9, lastModified: "2026-10-07" },
  { key: 'team', path: '/ueber-uns/team', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'career', path: '/ueber-uns/karriere', changeFrequency: "weekly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'partners', path: '/ueber-uns/partner', changeFrequency: "monthly", priority: 0.7, lastModified: "2026-10-07" },
  { key: 'press', path: '/ueber-uns/presse', changeFrequency: "monthly", priority: 0.7, lastModified: "2026-10-07" },
  { key: 'products', path: '/produkte', changeFrequency: "weekly", priority: 0.9, lastModified: "2026-10-28" }, // serverseitige Suche (F6)
  { key: 'consulting', path: '/beratung', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'contact', path: '/kontakt', changeFrequency: "monthly", priority: 0.8, lastModified: "2026-10-07" },
  { key: 'news', path: '/news', changeFrequency: "weekly", priority: 0.8, lastModified: "2026-10-07" },
  // newsletter / merkliste / impressum / datenschutz are noindex → intentionally
  // excluded here (don't advertise pages we ask Google not to index).
];

// Local landing pages (src/app/[locale]/<slug>/page.js) — German only, indexable,
// no hreflang (the other locales 404 on purpose). Listed from LANDING_PAGES in
// src/lib/content/landingPages.js, which also holds each page's lastModified,
// plus EXTRA_PAGES (src/lib/seo/sitemap/extraPages.js) for indexable pages
// that are not in LANDING_PAGES yet.

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

// Active jobs, each with its `slug` (see fetchKarrierData.js). Rat 9,5 A13
// (GlBG § 9 Abs 2): only jobs with a salary are published (glbg.js).
async function fetchJobs() {
  try {
    return publishableJobs(await fetchKarriereData());
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

// Same path in some locales only (Welle 2: DE/EN pages). `only` limits the
// entries written to one locale (Ezarri list is already one row per locale).
function addLocalizedEntries(entries, path, locales, lastModified, changeFrequency, priority, only = null) {
  const languages = Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`]));
  languages["x-default"] = languages.de || Object.values(languages)[0];
  for (const locale of only ? [only] : locales) {
    entries.push({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: lastModified || STATIC_LAST_MODIFIED,
      changeFrequency: changeFrequency || "monthly",
      priority: priority || 0.6,
      alternates: { languages },
    });
  }
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
    // Only real change dates (no migration day, Inhaber-offen Nr. 47).
    news: newest(news.filter((n) => n.status === "Aktiv" && !isWithheldNews(n)).map((n) => newsLastModified(n, untrustedNewsChangeDays(news)))),
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

  const landingPaths = new Set();
  for (const page of LANDING_PAGES) {
    landingPaths.add(landingPagePath(page.slug));
    // Region pages below the doorway rule (< 4 own facts) are not listed
    // (src/lib/seo/sitemap/doorwayAudit.js). Since Runde 3 P5 (28.10.2026)
    // Bregenz, Dornbirn, Lindau, Friedrichshafen and St. Gallen pass; their
    // lastmod is at least the day their facts were added (REGION_FACTS_DATE).
    const path = landingPagePath(page.slug);
    if (!passesDoorwayAudit(path)) continue;
    // Rat 9,5 B15: every region page got the /regionen crumb and the cross
    // links on REGION_LINKS_DATE (src/lib/seo/regionen.js).
    const lastModified = newest(REGION_FACTS[path] ? newest(page.lastModified, REGION_FACTS_DATE) : page.lastModified, REGION_LINKS_DATE);
    // Sprach-Integration 01.11.2026: Küchen, Interior Design und Wohnzimmer gibt
    // es in DE/EN/FR/IT (landingKern) → je Sprache mit hreflang wie die Seiten
    // (withKernLanguages; Quelle pageLocales = deOnlyRedirects.cjs). Regionsseiten
    // bleiben nur Deutsch.
    const locales = pageLocales(path);
    if (locales.length > 1) addLocalizedEntries(entries, path, locales, newest(lastModified, KERN_INTL_DATE), "monthly", 0.8);
    else addEntry(entries, `${BASE_URL}/de${path}`, lastModified, "monthly", 0.8);
  }

  // Indexable German-only pages not (yet) in LANDING_PAGES — new region pages
  // that passed the doorway audit and /yacht-interior (src/lib/seo/sitemap/
  // extraPages.js). A page already in LANDING_PAGES is skipped, so it is never
  // listed twice. No hreflang: the other locales 404.
  // Rule pages (Runde 2): /arbeitsweise once index,follow, /concierge only
  // while the concierge answers (otherwise the page is noindex, technik P1-7).
  // Runde 5 P6 (seo P2, recht P2): the SAME rule as the page robots and the
  // footer (Footer.js) – conciergeIndexable() && conciergeLive(). Without an
  // ANTHROPIC_API_KEY (or with mock/kill switch) /concierge is noindex and
  // not listed, also in development.
  // Welle 2 (Inhaber Nr. 13): pages with `locales` (Yacht, Sofaplaner) and the
  // MULTILINGUAL_PAGES (Hotel & Objekt, Architekten; seit 31.10.2026 auch
  // /kuechengeraete in allen vier Sprachen) once per listed locale,
  // with hreflang for exactly those locales + x-default (= de), like the pages.
  for (const page of visibleExtraPages({ conciergeAvailable: conciergeAvailableForSeo() })) {
    if (landingPaths.has(page.path) || !passesDoorwayAudit(page.path)) continue;
    if (page.locales) addLocalizedEntries(entries, page.path, page.locales, page.lastModified, "monthly", 0.7);
    else addEntry(entries, `${BASE_URL}/de${page.path}`, page.lastModified, "monthly", 0.7);
  }
  for (const page of MULTILINGUAL_PAGES) addLocalizedEntries(entries, page.path, page.locales, page.lastModified, "monthly", 0.7);
  // Herstellerkatalog (31.10.2026): /bad-wellness/produkte, /…/marke/<marke>,
  // /…/produkte/<slug> (und /kuechengeraete/…, sobald Produkte da sind) je Sprache.
  for (const page of katalogSitemapPages()) addLocalizedEntries(entries, page.path, page.locales, page.lastModified, "monthly", page.typ === "produkt" ? 0.5 : 0.6);
  // Shop-Startseite /accessoires (Accessoires-Shop) je Sprache, über den Listen (0.7).
  {
    const shop = shopStartSitemapPage();
    if (shop) addLocalizedEntries(entries, shop.path, shop.locales, shop.lastModified, "weekly", 0.7);
  }

  // Rat 9,5 (T4 → T6): Profilseite Harald Menghin (index, follow), seit
  // 31.10.2026 in allen vier Sprachen unter den übersetzten Pfaden
  // (/en/about-us/team/…, PROFILE_LOCALES) mit hreflang-Satz.
  {
    const pathByLocale = Object.fromEntries(LOCALES.map((l) => [l, profilePath(l)]));
    for (const locale of PROFILE_LOCALES) addEntry(entries, profileUrl(locale), PROFILE_LAST_MODIFIED, "monthly", 0.6, pathByLocale);
  }

  // Rat 9,5 (T2 → T6): Wunschliste-Einstieg /wunschliste, in allen vier
  // Sprachen unter demselben Pfad – nur solange die Seite index ist
  // (wunschlisteAvailable(): Produktion erst mit freigegebener DSE-Ergänzung).
  if (wunschlisteAvailable()) addLocalizedEntries(entries, "/wunschliste", LOCALES, WUNSCHLISTE_LAST_MODIFIED, "monthly", 0.5);

  // Ezarri world (Inhaber-Entscheidung Nr. 7; Welle 2: German and English):
  // hub, worlds, collections and base mosaics – [] while EZARRI_PUBLIC is
  // false (src/lib/ezarri/data.js getEzarriEntriesByLocale, lastmod = data stand).
  // Sprach-Integration 01.11.2026: Sprachen je URL (ezarriLocalesFor) – Welt,
  // Konfigurator und Rechner in DE/EN/FR/IT, Custom Mix nur DE/EN.
  for (const e of getEzarriEntriesByLocale()) {
    addLocalizedEntries(entries, e.path, Object.keys(e.alternates), e.lastmod, "monthly", e.path === "/ezarri" ? 0.8 : 0.6, e.locale);
  }

  // Showroom tour (N1, all four languages, same path): only once the real,
  // released recording is there (showroomSitemapPaths() is [] until then).
  for (const p of showroomSitemapPaths()) {
    const alternates = Object.fromEntries(LOCALES.map((l) => [l, p]));
    for (const locale of LOCALES) addEntry(entries, `${BASE_URL}/${locale}${p}`, STATIC_LAST_MODIFIED, "monthly", 0.7, alternates);
  }

  // Online-Kalender /termin (all four languages, same path): only while the
  // page is index, i.e. terminMode() === "frappe" (mock/off are noindex,
  // src/app/[locale]/termin/page.js). Confirm/manage pages are never listed.
  if (terminMode() === "frappe") {
    const alternates = Object.fromEntries(LOCALES.map((l) => [l, "/termin"]));
    for (const locale of LOCALES) addEntry(entries, `${BASE_URL}/${locale}/termin`, TERMIN_LAST_MODIFIED, "monthly", 0.8, alternates);
  }

  // Ratgeber (German only): hub + released articles from getIndexableRatgeber()
  // — never listRatgeber(). Empty until an article has freigegeben: true; the
  // pages are noindex until then (src/lib/seo/sitemap/ratgeber.js).
  let ratgeber = [];
  try {
    ratgeber = getIndexableRatgeber();
  } catch (error) {
    console.error("Error reading Ratgeber for sitemap:", error);
  }
  for (const entry of toRatgeberEntries(ratgeber, BASE_URL)) entries.push(entry);

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

  // Bilder-SEO (31.10.2026): Bild-Einträge (image:image) für Katalog, Bad & Wellness,
  // Küchengeräte und eigene Fotos (src/lib/seo/sitemap/images.js) – nur an
  // Einträgen dieser Datei, keine eigene Bilder-Sitemap (jede URL einmal).
  return withImages(dedupe(entries));
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

  // "Marke × Kategorie" pages (/…/marken/<brand>/<category>) — behind a switch
  // that is OFF until round 3 wires the page into [title]/[collection]
  // (src/lib/seo/sitemap/brandCategorySitemap.js). Only indexable combinations.
  if (BRAND_CATEGORY_SITEMAP_ENABLED) {
    for (const entry of await getBrandCategoryEntries()) entries.push(entry);
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
  // Imported catalogues (Brand van Egmond, Treca, Next125) are listed here
  // like every other brand: they are "Produkte New" records in the backoffice
  // (R4-seo, 26.10.2026: 111 + 96 + 13 active, all in this list). The ids of
  // src/lib/data/importedProducts/* ("bve-15", "n125-3", "treca-1") are NOT
  // URLs — no route renders that static file — so they are never listed.
  // Checked live by src/lib/seo/audit/crawl.mjs --imported (200, index).
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
  const untrusted = untrustedNewsChangeDays(news);

  for (const newsItem of news) {
    // Only active articles: the article route 404s anything else
    // (news/[title]/page.js), so a deactivated one must not be listed.
    if (newsItem.status !== "Aktiv") continue;
    // UWG: ended discount promotions are noindex and stay out of the sitemap
    // (src/lib/news/withheldNews.js).
    if (isWithheldNews(newsItem)) continue;
    // Same slug the route matches on (generateSlug(name1)) — a different
    // source here would list URLs that 404.
    const slug = generateSlug(newsItem.name1);
    if (!slug) continue;

    // lastmod: the article's own change date, else its publication date –
    // but never the migration/import day (Runde 5 P6, Inhaber-offen Nr. 47):
    // without a real date the entry has NO <lastmod> (src/lib/seo/sitemap/
    // newsLastmod.js), not the import day and not STATIC_LAST_MODIFIED.
    const changed = newsLastModified(newsItem, untrusted);
    for (const locale of LOCALES) {
      addEntry(entries, `${BASE_URL}/${locale}/news/${slug}`, changed, "weekly", 0.6, samePath(`/news/${slug}`));
      if (!changed) entries[entries.length - 1].lastModified = undefined;
    }
  }

  return dedupe(entries);
}

// ------------------------------------------------------------------
// XML serialization — lives in the pure module ./sitemap/xml.js (unit-tested
// with node --test); re-exported here so the routes keep one import.
// ------------------------------------------------------------------
export { toUrlsetXml, toSitemapIndexXml, latestLastModified, xmlResponse } from "@/lib/seo/sitemap/xml";

// The child sitemaps, in the order the index lists them.
export const SITEMAP_SECTIONS = [
  { path: "/sitemap-static.xml", getEntries: getStaticEntries },
  { path: "/sitemap-marken.xml", getEntries: getBrandEntries },
  { path: "/sitemap-news.xml", getEntries: getNewsEntries },
  { path: "/sitemap-produkte.xml", getEntries: getProductEntries },
];