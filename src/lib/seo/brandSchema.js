// src/lib/seo/brandSchema.js
// Shared JSON-LD helpers for the two brand-facing pages — the brand-story page
// (/ueber-uns/marken/[title]) and the commercial product-listing page
// (/produkte/[title]). Both emit the SAME Brand node under one canonical,
// locale-independent @id so Google merges every reference (both pages, all four
// languages) into a single strong entity. That merged Brand entity, tied via
// `sameAs` to the brand's official site, is the core signal for the brand-dealer
// cluster ([brand], [brand] österreich/händler/kaufen) — our biggest lever.

const DOMAIN = "https://platzhirsch.studio";

// Locale-independent identity anchor for a brand, shared across the brand-story
// page, the product-listing page and all four locales. Uses the route slug
// (generateSlug(name1)) so the same brand always resolves to the same @id.
export function brandNodeId(slug) {
  return `${DOMAIN}/#brand/${slug}`;
}

// Normalize the CMS `firmenlink` (sometimes a deep link with tracking params) down
// to the official site's origin, so `sameAs` points at the brand entity's home,
// not an arbitrary sub-page. Returns null for empty / non-http values.
function officialBrandUrl(firmenlink) {
  if (!firmenlink || typeof firmenlink !== "string") return null;
  try {
    const u = new URL(firmenlink.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return `${u.origin}/`;
  } catch {
    return null;
  }
}

// Most recent CMS content-change date (YYYY-MM-DD) for the brand, taken from the
// max `modified` timestamp across its image sub-records. A REAL freshness signal —
// unlike new Date() it only moves when the content actually changes, so Google
// keeps trusting it. Returns null when no valid timestamp exists (caller omits
// dateModified rather than emitting a fabricated one).
export function brandModifiedDate(marke) {
  const dates = (marke?.bild_anhagen || [])
    .map((b) => (typeof b?.modified === "string" ? b.modified.slice(0, 10) : null))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ""));
  if (!dates.length) return null;
  return dates.sort().at(-1);
}

// The shared Brand node: stable identity only (name, logo, sameAs) — no localized
// prose. The human-readable description stays on the page-level
// AboutPage/CollectionPage node, so every language emits an identical Brand node
// under the same @id and the entity merges cleanly.
export function buildBrandNode(marke, slug) {
  const node = {
    "@type": "Brand",
    "@id": brandNodeId(slug),
    name: marke?.name1,
  };
  const sameAs = officialBrandUrl(marke?.firmenlink);
  if (sameAs) node.sameAs = [sameAs];
  if (marke?.logo) node.logo = `${DOMAIN}/cmx${marke.logo}`;
  return node;
}
