// src/lib/api/fetchAllProdukte.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";
import { cleanProductName, displayBrandName } from "@/lib/content/brands";

// "Produkte New" fetchers for the /produkte category-hub, category-listing
// and product-detail pages and the navbar search. The real doctype on the dev
// server is "Produkte New" (not "Produkte" — a different, older doctype the
// rest of the site still uses against the production SERVER). All endpoints
// are whitelisted allow_guest methods, no credentials needed.
//
// There is deliberately no "fetch every product" helper anymore: the old
// get_all_produkte_api response was >2MB, which Next's data cache refuses to
// store, so every page re-downloaded it and the build timed out. Each page
// now asks only for the slice it shows (one category, one product, a few
// search hits), all small enough to be cached.
const PRODUKTE_NEW_API = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api`;

async function getMessage(url, { fallback, label, init }) {
  try {
    const response = await fetch(url, {
      method: "GET",
      ...(init || { next: { revalidate: 3600, tags: ["products"] } }),
      // Never hang a render on a stalled backend (a dev run once took 4.7 min).
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`Produkte New ${label} API returned ${response.status}`);
      return fallback;
    }

    const data = await response.json();
    return data.message || fallback;
  } catch (error) {
    console.error(`Error fetching Produkte New ${label}:`, error);
    return fallback;
  }
}

// Active products of ONE category (card shape, first image only) — the
// /produkte/[category] listing. `kategories` is the Produkte Kategorie
// docname the products link to. Same row shape get_all_produkte_api used to
// return, so buildShopProducts() works on it unchanged.
export async function fetchProdukteByKategorie(kategories) {
  if (!kategories) return [];
  return getMessage(
    `${PRODUKTE_NEW_API}.get_produkte_by_kategorie?kategories=${encodeURIComponent(kategories)}`,
    { fallback: [], label: "by-Kategorie" }
  );
}

// Active products of ONE brand (card shape) — the home page's "trending
// products" strip. Same row shape as fetchProdukteByKategorie().
export async function fetchProdukteNewByMarke(marken) {
  if (!marken) return [];
  return getMessage(
    `${PRODUKTE_NEW_API}.get_produkte_by_marke_api?marken=${encodeURIComponent(marken)}`,
    { fallback: [], label: "by-Marke" }
  );
}

// Navbar search: up to `limit` active products whose name or brand contains
// `q` (name-starts-with ranked first by the backend). Not cached by default —
// every query string is different, and the search route is dynamic anyway.
// `cached: true` (legacy-URL redirect resolver) stores the result for a day so
// repeated hits on the same old URL don't reach the backend again.
export async function searchProdukte(q, limit = 6, { cached = false } = {}) {
  if (!q || q.trim().length < 2) return [];
  const query = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  return getMessage(`${PRODUKTE_NEW_API}.search_produkte?${query}`, {
    fallback: [],
    label: "search",
    init: cached ? { next: { revalidate: 86400, tags: ["products"] } } : { cache: "no-store" },
  });
}

// Every category with at least one active product, incl. `produkt_count` —
// the /produkte hub only needs these counts, not the products themselves.
export async function fetchKategorienWithCounts() {
  return getMessage(`${PRODUKTE_NEW_API}.get_all_kategorien`, {
    fallback: [],
    label: "Kategorien-with-counts",
    init: { next: { revalidate: 3600, tags: ["products", "kategorien"] } },
  });
}

// Full detail for ONE "Produkte New" record — powers the
// /produkte/[category]/[product] detail page. Returns the child tables too
// (bild_anhangen/pdf_produkte/additional_information), plus the localized
// beschreibung/mehr_beschreibung/metadata_description fields.
export async function fetchProduktNewByPathField(path_field, locale = "de") {
  if (!path_field) return null;
  return getMessage(
    `${PRODUKTE_NEW_API}.get_produkt_by_path_field_api?path_field=${encodeURIComponent(path_field)}&lang=${encodeURIComponent(locale)}`,
    { fallback: null, label: "detail" }
  );
}

// Just the URL parts ({path_field, kategories, modified}) of every active,
// category-bearing product — for generateStaticParams and for knowing which
// categories have products. If the endpoint isn't deployed yet this returns
// [], and the pages are then rendered on first visit (ISR) instead of at
// build time.
export async function fetchProduktePaths() {
  return getMessage(`${PRODUKTE_NEW_API}.get_produkte_paths`, { fallback: [], label: "paths" });
}

// "You may also like" for the detail page — same brand (same category first),
// excluding the current product. related_products returns bild_anhangen as a
// flat string (first gallery image), so it's mapped to the shop card shape here.
export async function fetchRelatedProdukteNew({ marken, kategories, path_field, limit = 3 }) {
  if (!marken || !kategories || !path_field) return [];

  const query = new URLSearchParams({
    marken,
    kategories,
    currentProductPath: path_field,
    limit: String(limit),
  });
  const rows = await getMessage(`${PRODUKTE_NEW_API}.related_products?${query}`, {
    fallback: [],
    label: "related",
  });

  return rows
    .filter((p) => p?.path_field && p?.kategories)
    .map((p) => ({
      id: p.name || p.path_field,
      name: cleanProductName(p.produkt_name),
      brand: displayBrandName(p.marken),
      categoryKey: p.kategories.toLowerCase(),
      image: p.bild_anhangen ? `/cmx${p.bild_anhangen}` : null,
      url_slug: p.path_field,
    }));
}
