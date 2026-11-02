// src/lib/seo/legacyProductRedirects.js
// The previous site (still live on `main`) published the catalogue as
//   /{locale}/produkte/{brand}              (brand listing, e.g. /de/produkte/minotti)
//   /{locale}/produkte/{brand}/{old-slug}   (product, e.g. /de/produkte/solpuri/classic-esstisch-tables-solpuri)
// — about 3,200 indexed URLs with rankings and backlinks. The new catalogue is
// /{locale}/produkte/{category}/{path_field} from the "Produkte New" doctype,
// whose slugs differ from the old "Produkte" doctype. Without a mapping every
// one of those URLs 404s in the new build and the ranking signals are lost.
//
// This module resolves a legacy URL to its best new target:
//   1. /produkte/{brand}            → the brand story page /ueber-uns/marken/{brand}
//   2. /produkte/{brand}/{old-slug} → the old "Produkte" record (still served by
//      the production backoffice) gives the product name + brand; the new
//      catalogue is searched for the same name under the same brand →
//      /produkte/{category}/{path_field}. If nothing matches, fall back to the
//      brand page so the link equity still lands on the right entity.
// Callers issue a 308 (permanentRedirect) with the result.
import "server-only";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { searchProdukte } from "@/lib/api/fetchAllProdukte";
import { generateSlug } from "@/lib/slugify";
import { mappedLegacyProduct } from "@/lib/seo/legacyProductMap";

const OLD_PRODUKTE_API = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api`;

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// The active brand whose slug (generateSlug(name1)) equals `slug`, or null.
// Exact slug only: a fuzzy (normalized) match would turn every spelling of a
// brand name into a distinct URL that reaches the resolver below, i.e. an
// unbounded set of cache-missing requests against the backends.
// A Marken backend failure is NOT swallowed: the callers would otherwise turn
// every legacy URL into a soft 404 during an outage (which search engines may
// de-index), whereas a thrown error becomes a retriable 500.
export async function findBrandBySlug(slug) {
  if (!slug || !/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const marken = await fetchRawMarkenData();
  return marken.find((m) => m?.status === "Aktiv" && generateSlug(m?.name1) === slug) || null;
}

// The old "Produkte" record for a legacy slug ({ produkt_name, marken, kategories }), or null.
// Slug shape is validated first so only plausible legacy slugs reach the backoffice.
// Technik R7 (r6-technik P0-1): `cacheable: false` (the uncached resolver
// src/app/api/legacy-product/route.js) keeps the lookup out of the data cache
// – the old slug comes straight from the URL, so a cache entry per guessed
// slug grew .next/cache/fetch-cache without limit. The product page (ISR)
// keeps the cached lookup: a no-store fetch there makes the page dynamic at
// runtime (Next: "Page changed from static to dynamic", HTTP 500).
async function fetchLegacyProdukt(oldSlug, { cacheable = true } = {}) {
  if (!oldSlug || !/^[a-z0-9-]{1,120}$/.test(oldSlug)) return null;
  try {
    const response = await fetch(
      `${OLD_PRODUKTE_API}.get_produkt_by_path_field_api?path_field=${encodeURIComponent(oldSlug)}`,
      cacheable
        ? { next: { revalidate: 86400, tags: ["legacy-products"] }, signal: AbortSignal.timeout(8000) }
        : { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const produkt = data?.message;
    return produkt && produkt.produkt_name ? produkt : null;
  } catch (error) {
    // JSON.stringify: the slug comes from the URL — never interpolate it raw into a log line.
    console.error(`Legacy redirect: old Produkte lookup failed for ${JSON.stringify(oldSlug)}:`, error);
    return null;
  }
}

// Search the new catalogue for `name` under `brand`: only an exact (normalized)
// name match counts — a "closest" product would be a permanent redirect to the
// wrong piece, and the brand page is the better fallback. At most two queries
// per slug (full name, then the first word), both through the cached search
// (24h), so a legacy URL can't be used to fan out requests against the backend.
async function findNewProduct(name, brand) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  const wantBrand = normalize(brand);
  const wantName = normalize(name);

  const queries = [...new Set([words.join(" "), words[0]].filter((q) => q && q.length >= 2))];
  for (const query of queries) {
    const rows = (await searchProdukte(query, 10, { cached: true })) || [];
    const exact = rows.find(
      (p) =>
        p?.path_field && p?.kategories && p?.status === "Aktiv" &&
        normalize(p.marken) === wantBrand && normalize(p.produkt_name) === wantName
    );
    if (exact) return exact;
  }
  return null;
}

// Best new target for a legacy product URL:
//   { type: "product", categoryKey, pathField, brandSlug } |
//   { type: "brand", brandSlug } | null
export async function resolveLegacyProductUrl(brandSlug, oldSlug, options) {
  const brand = await findBrandBySlug(brandSlug);
  if (!brand) return null;
  const targetBrandSlug = generateSlug(brand.name1);

  // Feste Zuordnung zuerst (die alte "Produkte"-API gibt es nicht mehr).
  const mapped = mappedLegacyProduct(brandSlug, oldSlug);
  if (mapped) return { type: "product", ...mapped, brandSlug: targetBrandSlug };

  const legacy = await fetchLegacyProdukt(oldSlug, options);
  if (legacy) {
    const match = await findNewProduct(legacy.produkt_name, legacy.marken || brand.name1);
    if (match) {
      return {
        type: "product",
        categoryKey: match.kategories.toLowerCase(),
        pathField: match.path_field,
        brandSlug: targetBrandSlug,
      };
    }
  }
  return { type: "brand", brandSlug: targetBrandSlug };
}
