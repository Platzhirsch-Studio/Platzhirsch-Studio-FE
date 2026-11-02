// src/lib/shop/catalogSearch.js
// Server-side catalogue search for /<locale>/produkte?q=… (F6, 28.10.2026).
// Until now ?q= (the Enter key in the navbar search, SearchSheet.js) landed on
// the unfiltered hub. Same data and matching as /api/shop-search (backend
// search_produkte for products; brands and categories by label), but more
// products and no client JavaScript: the hub renders the hits as tiles.
// SEO: the page with ?q= is "noindex, follow" and its canonical stays the hub
// without query (generateMetadata in src/app/[locale]/produkte/page.js).
import { searchProdukte } from "@/lib/api/fetchAllProdukte";
import { getActiveMarken } from "@/lib/api/fetchMarkenData";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { generateSlug } from "@/lib/slugify";
import { ROUTES } from "@/utils/routing";

export const MAX_QUERY_CHARS = 100;
export const SEARCH_PRODUCT_LIMIT = 48;

/** Normalised query from searchParams.q ("" when shorter than 2 characters). */
export function normalizeQuery(raw) {
  const q = String(Array.isArray(raw) ? raw[0] : raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_CHARS)
    .trim();
  return q.length >= 2 ? q : "";
}

/** Does `text` contain every word of the query (case- and accent-insensitive)? */
export function matchesQuery(text, q) {
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const hay = norm(text);
  return norm(q).split(" ").filter(Boolean).every((w) => hay.includes(w));
}

/**
 * @param {string} q normalised query
 * @param {{ categories?: Array<{slug,label,count}> }} [hub] the hub's category tiles (for label matches)
 * @returns {Promise<{ products: Array, brands: Array<{name, href}>, categories: Array<{slug,label,count}> }>}
 */
export async function searchCatalog(q, locale, { categories = [] } = {}) {
  if (!q) return { products: [], brands: [], categories: [] };
  const [raw, marken] = await Promise.all([
    searchProdukte(q, SEARCH_PRODUCT_LIMIT, { cached: true }).catch(() => []),
    getActiveMarken().catch(() => []),
  ]);
  const markenPath = ROUTES.marken?.[locale] || "/ueber-uns/marken";
  const products = buildShopProducts(raw).sort((a, b) => {
    const as = matchesQuery(a.name, q) ? 0 : 1;
    const bs = matchesQuery(b.name, q) ? 0 : 1;
    return as - bs;
  });
  const brands = (marken || [])
    .filter((m) => m?.name1 && matchesQuery(m.name1, q))
    .slice(0, 6)
    .map((m) => ({ name: m.name1, href: `${markenPath}/${generateSlug(m.name1)}` }));
  const matchedCategories = categories.filter((c) => matchesQuery(`${c.label} ${c.slug}`, q)).slice(0, 6);
  return { products, brands, categories: matchedCategories };
}
