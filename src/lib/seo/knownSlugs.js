// src/lib/seo/knownSlugs.js – Technik R7 (r6-technik P0-1).
//
// Unknown slugs on the backoffice-driven ISR routes (brands, brand × category /
// collection, product categories, products, news, jobs) used to be rendered on
// demand. Next 16.4 stored each notFound() result as a route-cache entry on
// disk (~440 KB per URL, no eviction), and on a case-insensitive file system
// /marken/Minotti even replaced the real /marken/minotti page with a 404.
//
// src/proxy.js now checks these paths BEFORE any render against the list of
// slugs that exist (src/app/api/known-slugs/route.js, the same backoffice data
// the pages and sitemaps use):
//   - a slug that differs from a known one only by upper case → 308 to the
//     lower-case URL (every slug is generateSlug() output: [a-z0-9-]),
//   - any other unknown slug → rewrite to the prerendered 404
//     (/<locale>/seite-nicht-gefunden: status 404, lang, h1, noindex,
//     no-store) – no render, no backoffice call, no cache entry,
//   - a section whose list is not available (backoffice down, list not loaded
//     yet) → the request goes through unchanged (fail-open: a slow backoffice
//     must never turn real pages into 404s).
//
// Pure module: no "server-only", no "@/" imports, so node --test can load it
// (tests/unit/r7-technik-known-slugs.test.mjs).

const LOCALE = "(de|en|fr|it)";
const ABOUT = "(?:ueber-uns|about-us|a-propos|chi-siamo)";
const SEG = "([^/]+)";

// Static siblings of the dynamic segments: never checked.
const RESERVED = {
  categories: new Set(["suche"]),
  jobs: new Set(["share-image"]),
  ar: new Set(["uebergabe"]),
};

const ROUTES = [
  { kind: "brandSeg", re: new RegExp(`^/${LOCALE}/${ABOUT}/(?:marken|brands|marques|marche)/${SEG}/${SEG}$`) },
  { kind: "brand", re: new RegExp(`^/${LOCALE}/${ABOUT}/(?:marken|brands|marques|marche)/${SEG}$`) },
  { kind: "job", re: new RegExp(`^/${LOCALE}/${ABOUT}/(?:karriere|career|carriere|carriera)/${SEG}$`) },
  { kind: "product", re: new RegExp(`^/${LOCALE}/(?:produkte|products|produits|prodotti)/${SEG}/${SEG}$`) },
  { kind: "category", re: new RegExp(`^/${LOCALE}/(?:produkte|products|produits|prodotti)/${SEG}$`) },
  { kind: "news", re: new RegExp(`^/${LOCALE}/news/${SEG}$`) },
  { kind: "ar", re: new RegExp(`^/${LOCALE}/3d-ansicht/${SEG}$`) },
];

const SLUG = /^[a-z0-9-]{1,200}$/;
// Alte News-Slugs → heutiger Slug (SISTRIX DE, Platz 7 am 26.10.2026; der
// Artikel heißt im Backoffice heute ohne „luxurioeser“).
export const LEGACY_NEWS_SLUGS = Object.freeze({
  "treca-paris-minotti-poliform-luxurioeser-schlafkomfort": "treca-paris-minotti-poliform-schlafkomfort",
});

/** Which checked route a pathname belongs to, or null. */
export function matchKnownRoute(pathname) {
  for (const { kind, re } of ROUTES) {
    const m = re.exec(pathname || "");
    if (m) return { kind, locale: m[1], segs: m.slice(2) };
  }
  return null;
}

/**
 * Turns the endpoint payload into Sets for fast lookups. Sections with
 * `ok !== true` stay null (= unknown → fail-open).
 */
export function indexKnownSlugs(payload) {
  if (!payload || payload.v !== 1) return null;
  const set = (section) => (section && section.ok === true && Array.isArray(section.list) ? new Set(section.list) : null);
  const brandSegs = new Map();
  for (const [brand, segs] of Object.entries(payload.brandSegs || {})) {
    brandSegs.set(brand, Array.isArray(segs) ? new Set(segs) : null);
  }
  return {
    brands: set(payload.brands),
    brandSegs,
    categories: set(payload.categories),
    // path_field → category slug of the product (its one canonical URL).
    products:
      payload.products && payload.products.ok === true && payload.products.map && typeof payload.products.map === "object"
        ? new Map(Object.entries(payload.products.map))
        : null,
    news: set(payload.news),
    jobs: set(payload.jobs),
  };
}

const PASS = Object.freeze({ action: "pass" });
const NOT_FOUND = Object.freeze({ action: "notFound" });

/**
 * Decision for one pathname.
 *   { action: "pass" }                       → normal handling
 *   { action: "notFound" }                   → rewrite to the prerendered 404
 *   { action: "redirect", pathname: "/…" }   → 308 (lower case, or a known
 *                                              product under the wrong category)
 *   { action: "legacy", brand, slug }        → old-site product URL: resolved
 *                                              by /api/legacy-product (no ISR)
 * `known` = indexKnownSlugs(...) or null (nothing loaded → only the cheap
 * shape checks run).
 */
export function decideKnownPath(pathname, known) {
  const route = matchKnownRoute(pathname);
  if (!route) return PASS;
  const { kind, segs } = route;
  if (kind === "category" && RESERVED.categories.has(segs[0])) return PASS;
  if (kind === "job" && RESERVED.jobs.has(segs[0])) return PASS;
  if (kind === "ar" && RESERVED.ar.has(segs[0])) return PASS;

  // Every slug of these routes is generateSlug() output. Upper case only →
  // one 308 to the lower-case URL (no second cache key, no FS collision);
  // anything else outside [a-z0-9-] can never exist → 404 without a render.
  const lower = segs.map((s) => s.toLowerCase());
  if (lower.some((s) => !SLUG.test(s))) return NOT_FOUND;
  if (lower.some((s, i) => s !== segs[i])) {
    // The slugs are always the last path parts (see ROUTES).
    const parts = pathname.split("/");
    parts.splice(parts.length - lower.length, lower.length, ...lower);
    return { action: "redirect", pathname: parts.join("/") };
  }
  if (!known) return PASS;

  const has = (set, value) => (set ? set.has(value) : null); // null = unknown
  const verdict = (hit) => (hit === false ? NOT_FOUND : PASS);
  switch (kind) {
    case "brand":
      return verdict(has(known.brands, segs[0]));
    case "brandSeg": {
      const brand = has(known.brands, segs[0]);
      if (brand === false) return NOT_FOUND;
      if (brand === null) return PASS;
      const list = known.brandSegs.get(segs[0]);
      if (!list) return PASS; // that brand's data failed to load
      return verdict(list.has(segs[1]));
    }
    case "category":
      return verdict(has(known.categories, segs[0]));
    case "product": {
      // The product page is ISR: every URL it answers – a 308 as well – is
      // one cache entry. So only the canonical URL reaches it:
      //  - known product, right category → page,
      //  - known product, other category segment → 308 here (the page did
      //    the same, but cached it per invented category),
      //  - unknown product under a brand slug = URL of the old site → the
      //    uncached resolver /api/legacy-product (308 to product or brand),
      //  - anything else → 404.
      const category = known.products ? known.products.get(segs[1]) : undefined;
      if (category) {
        if (category === segs[0]) return PASS;
        const parts = pathname.split("/");
        parts[parts.length - 2] = category;
        return { action: "redirect", pathname: parts.join("/") };
      }
      const brand = has(known.brands, segs[0]);
      if (!known.products || brand === null) return PASS;
      return brand ? { action: "legacy", brand: segs[0], slug: segs[1] } : NOT_FOUND;
    }
    case "ar":
      // German only (/en/3d-ansicht/… is redirected by next.config.js).
      return verdict(known.products ? known.products.has(segs[0]) : null);
    case "news": {
      // Umbenannte Artikel, die bei Google noch unter dem alten Slug ranken.
      const renamed = LEGACY_NEWS_SLUGS[segs[0]];
      if (renamed) {
        const parts = pathname.split("/");
        parts[parts.length - 1] = renamed;
        return { action: "redirect", pathname: parts.join("/") };
      }
      return verdict(has(known.news, segs[0]));
    }
    case "job":
      return verdict(has(known.jobs, segs[0]));
    default:
      return PASS;
  }
}

/**
 * Prefixes of a brand's category slugs that the brand × category page answers
 * with a 308 (findBrandCategoryAlias: ≥ 3 characters, followed by "-",
 * unique among the brand's categories, not a category itself).
 */
export function categoryAliasPrefixes(categorySlugs) {
  const slugs = [...new Set(categorySlugs || [])];
  const own = new Set(slugs);
  const count = new Map();
  for (const slug of slugs) {
    const seen = new Set();
    for (let i = slug.indexOf("-"); i !== -1; i = slug.indexOf("-", i + 1)) {
      const prefix = slug.slice(0, i);
      if (prefix.length < 3 || seen.has(prefix)) continue;
      seen.add(prefix);
      count.set(prefix, (count.get(prefix) || 0) + 1);
    }
  }
  return [...count].filter(([prefix, n]) => n === 1 && !own.has(prefix)).map(([prefix]) => prefix);
}
