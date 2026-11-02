// src/lib/concierge/catalog.js
// Read-only adapter between the concierge tools and the Frappe backoffice.
// It only calls the existing fetchers in src/lib/api (all allow_guest GET
// endpoints, cached by Next's data cache) and maps their rows into the small
// shapes the model and the product cards need. No writes, no prices – the
// backoffice has no price field, and the concierge must not invent any.
//
// Sitewide (concierge-sitewide-architektur.md §7): every function takes the
// page locale, so card links and category labels come in the page language
// (/fr/produits/…). Default "de" keeps the Labs page unchanged.
//
// Frappe endpoints used (via src/lib/api):
//   produkte_new.api.search_produkte          – name/brand search
//   produkte_new.api.get_produkte_by_kategorie – one category
//   produkte_new.api.get_all_kategorien       – categories with counts
//   produkte_new.api.get_kategorien_by_marke  – categories of one brand
//   produkte_new.api.get_collections          – collections of one brand
//   marken.api.marken_data                    – brands
import "server-only";
import { searchProdukte, fetchProdukteByKategorie, fetchKategorienWithCounts } from "@/lib/api/fetchAllProdukte";
import { getActiveMarken } from "@/lib/api/fetchMarkenData";
import { fetchMarkeKategorien, getKategorieLabel } from "@/lib/api/fetchKategorien";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath } from "@/utils/routing";

const LOCALES = ["de", "en", "fr", "it"];
const loc = (l) => (LOCALES.includes(l) ? l : "de");
const withLocale = (locale, path) => `/${locale}${path}`;

// Products the concierge has shown (id → card data). Proposals ("open",
// "save") may only name these: they came from the catalogue, so they exist
// and are active. Survives HMR via globalThis; capped (LRU-ish).
const SEEN_MAX = 3000;
const seen = (globalThis.__phConciergeSeen ||= new Map());
function remember(p) {
  if (!p?.id) return;
  seen.delete(p.id);
  seen.set(p.id, p);
  if (seen.size > SEEN_MAX) seen.delete(seen.keys().next().value);
}
export function seenProduct(id) {
  return seen.get(String(id)) || null;
}

async function categoryLabels() {
  const rows = await fetchKategorienWithCounts();
  return new Map((rows || []).map((k) => [String(k.category_key || k.name || "").toLowerCase(), k]));
}

function toCard(p, labels, locale) {
  const cms = labels.get(p.categoryKey);
  const categorySlug = generateSlug(p.categoryKey);
  const card = {
    id: String(p.id || p.url_slug),
    name: p.name,
    brand: p.brand || null,
    category: cms ? getKategorieLabel(cms, locale) : p.categoryKey,
    image: p.image || null,
    href: withLocale(locale, productsPath(locale, categorySlug, p.url_slug)),
  };
  remember({ id: card.id, name: p.name, brand: p.brand || null, categoryKey: p.categoryKey, categorySlug, urlSlug: p.url_slug, image: p.image || null });
  return card;
}

// Products whose name or brand contains `query` (backend search, max `limit`).
export async function searchProducts(query, limit = 6, locale = "de") {
  const l = loc(locale);
  const [rows, labels] = await Promise.all([searchProdukte(query, limit), categoryLabels()]);
  return buildShopProducts(rows).slice(0, limit).map((p) => toCard(p, labels, l));
}

// Every category with active products: label, key, count, link.
export async function listCategories(locale = "de") {
  const l = loc(locale);
  const rows = await fetchKategorienWithCounts();
  return (rows || [])
    .filter((k) => Number(k.produkt_count) > 0)
    .map((k) => {
      const key = String(k.category_key || k.name).toLowerCase();
      return {
        key,
        label: getKategorieLabel(k, l) || key,
        count: Number(k.produkt_count) || 0,
        href: withLocale(l, productsPath(l, generateSlug(key))),
      };
    });
}

// Category by key OR by its URL slug → { key, slug, label, cms } | null.
export async function findCategory(keyOrSlug, locale = "de") {
  const wanted = String(keyOrSlug || "").toLowerCase();
  if (!wanted) return null;
  const labels = await categoryLabels();
  let key = labels.has(wanted) ? wanted : null;
  if (!key) for (const k of labels.keys()) if (generateSlug(k) === wanted) key = k;
  if (!key) return null;
  const cms = labels.get(key);
  return { key, slug: generateSlug(key), label: getKategorieLabel(cms, loc(locale)) || key, cms };
}

// All active products of one category (shop shape).
export async function categoryProducts(cat) {
  return buildShopProducts(await fetchProdukteByKategorie(cat.cms?.name || cat.key));
}

// Product on the page (category slug + url_slug) → { id, name, brand } and
// remembered for proposals.
export async function productBySlug(categorySlug, urlSlug, locale = "de") {
  const cat = await findCategory(categorySlug, locale);
  if (!cat) return null;
  const p = (await categoryProducts(cat)).find((x) => x.url_slug === urlSlug);
  if (!p) return null;
  remember({ id: String(p.id), name: p.name, brand: p.brand || null, categoryKey: p.categoryKey, categorySlug: cat.slug, urlSlug: p.url_slug, image: p.image || null });
  return { id: String(p.id), name: p.name, brand: p.brand || null };
}

// Products of one category, optionally narrowed to one brand. Also returns
// how many products each brand has there, so the model can name options.
export async function productsInCategory(categoryKey, brand, limit = 6, locale = "de") {
  const l = loc(locale);
  const key = String(categoryKey || "").toLowerCase();
  const labels = await categoryLabels();
  const cms = labels.get(key);
  if (!cms) return { found: false, message: `Kategorie "${categoryKey}" unbekannt – erst list_categories aufrufen.` };

  const products = buildShopProducts(await fetchProdukteByKategorie(cms.name || key));
  const brandCounts = {};
  for (const p of products) if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;

  const wanted = brand ? generateSlug(brand) : null;
  const filtered = wanted ? products.filter((p) => generateSlug(p.brand) === wanted) : products;
  const href = withLocale(l, productsPath(l, generateSlug(key))) + (wanted ? `?marke=${wanted}` : "");

  return {
    found: true,
    category: getKategorieLabel(cms, l),
    total: filtered.length,
    brandCounts,
    href,
    products: filtered.slice(0, limit).map((p) => toCard(p, labels, l)),
  };
}

export async function listBrands(locale = "de") {
  const l = loc(locale);
  const marken = await getActiveMarken();
  return marken
    .filter((m) => m?.name1)
    .map((m) => ({
      name: m.name1,
      href: withLocale(l, `${ROUTES.marken[l]}/${generateSlug(m.name1)}`),
    }));
}

// Brand slug (from the page URL) → display name, or null.
export async function brandNameBySlug(slug) {
  const marken = await getActiveMarken();
  return marken.find((m) => m?.name1 && generateSlug(m.name1) === slug)?.name1 || null;
}

// Categories and collections of one brand (fuzzy name match on the CMS list).
export async function brandOverview(brand, locale = "de") {
  const l = loc(locale);
  const marken = await getActiveMarken();
  const wanted = generateSlug(brand);
  const marke = marken.find((m) => generateSlug(m.name1) === wanted) ||
    marken.find((m) => generateSlug(m.name1).includes(wanted) || wanted.includes(generateSlug(m.name1)));
  if (!marke) return { found: false, message: `Marke "${brand}" ist nicht im Katalog – list_brands zeigt alle Marken.` };

  const [kats, collections] = await Promise.all([
    fetchMarkeKategorien(marke.name1),
    fetchCollectionsByMarke(marke.name1),
  ]);
  const slug = generateSlug(marke.name1);
  return {
    found: true,
    name: marke.name1,
    href: withLocale(l, `${ROUTES.marken[l]}/${slug}`),
    categories: (kats || [])
      .filter((k) => k.category_key && Number(k.produkt_count) > 0)
      .map((k) => ({
        key: k.category_key.toLowerCase(),
        label: getKategorieLabel(k, l),
        count: Number(k.produkt_count) || 0,
        href: withLocale(l, productsPath(l, generateSlug(k.category_key))) + `?marke=${slug}`,
      })),
    collections: (collections || []).map((c) => ({ name: c.name, count: Number(c.produkt_count) || 0 })),
  };
}
