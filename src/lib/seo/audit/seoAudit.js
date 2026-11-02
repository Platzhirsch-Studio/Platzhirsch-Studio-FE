// src/lib/seo/audit/seoAudit.js
// Pure checks for the R4-seo audit (sitemaps ↔ pages): parsing of sitemap XML
// and page <head> output, hreflang reciprocity, noindex-in-sitemap and a
// minimal Rich-Results validation of the JSON-LD types Google shows as rich
// results here (Product, FAQPage, BreadcrumbList, LocalBusiness).
//
// No I/O, no "@/" imports, so node --test can load it
// (tests/unit/r4-seo.test.mjs). The crawler that feeds it is ./crawl.mjs.
//
// The validation is a stand-in for Google's Rich Results Test, not a copy of
// it: it checks the fields Google lists as required (and the ones this site
// promises, e.g. opening hours on the LocalBusiness), so a regression shows up
// in the unit/live test instead of weeks later in Search Console.

const decode = (s) =>
  String(s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'");

/** <loc> values of a <urlset> or <sitemapindex>, in order. */
export function parseLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => decode(m[1]));
}

/** [{ loc, lastmod }] of a <urlset>. */
export function parseUrlset(xml) {
  return [...String(xml || "").matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const loc = /<loc>\s*([^<]+?)\s*<\/loc>/.exec(m[1]);
    const lastmod = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(m[1]);
    return { loc: loc ? decode(loc[1]) : null, lastmod: lastmod ? lastmod[1] : null };
  });
}

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? decode(m[1] ?? m[2]) : null;
};

/**
 * Robots, canonical, hreflang alternates and JSON-LD blocks of a rendered page.
 * Reads the whole document: Next may stream metadata tags into <body>.
 * @returns {{ robots: string|null, canonical: string|null,
 *   hreflang: Record<string,string>, jsonLd: any[], jsonLdErrors: number }}
 */
export function parseHead(html) {
  const doc = String(html || "");
  let robots = null;
  for (const [tag] of doc.matchAll(/<meta\b[^>]*>/gi)) {
    if ((attr(tag, "name") || "").toLowerCase() === "robots") robots = attr(tag, "content");
  }
  let canonical = null;
  const hreflang = {};
  for (const [tag] of doc.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attr(tag, "rel") || "").toLowerCase();
    if (rel === "canonical" && !canonical) canonical = attr(tag, "href");
    if (rel === "alternate") {
      const lang = attr(tag, "hreflang");
      if (lang) hreflang[lang] = attr(tag, "href");
    }
  }
  const jsonLd = [];
  let jsonLdErrors = 0;
  for (const m of doc.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(m[1]));
    } catch {
      jsonLdErrors += 1;
    }
  }
  return { robots, canonical, hreflang, jsonLd, jsonLdErrors };
}

/** true when a robots value forbids indexing ("noindex", "none"). */
export const isNoindex = (robots) => /\b(noindex|none)\b/i.test(String(robots || ""));

/** Every JSON-LD node (flattening @graph and arrays), with its @type list. */
export function jsonLdNodes(blocks) {
  const out = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    if (node["@graph"]) visit(node["@graph"]);
    if (node["@type"]) out.push(node);
  };
  visit(blocks);
  return out;
}

const typesOf = (node) => [].concat(node?.["@type"] || []);
const filled = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== "");

// schema.org LocalBusiness subtypes used on this site (FurnitureStore, Store …).
const LOCAL_BUSINESS_TYPES = new Set(["LocalBusiness", "FurnitureStore", "Store", "HomeGoodsStore", "CafeOrCoffeeShop"]);

/** Rich-result kind of a node: "Product" | "FAQPage" | "BreadcrumbList" | "LocalBusiness" | null. */
export function richResultKind(node) {
  const types = typesOf(node);
  if (types.includes("Product")) return "Product";
  if (types.includes("FAQPage")) return "FAQPage";
  if (types.includes("BreadcrumbList")) return "BreadcrumbList";
  if (types.some((t) => LOCAL_BUSINESS_TYPES.has(t))) return "LocalBusiness";
  return null;
}

/**
 * Problems (strings) of one rich-result node; [] = valid. Required fields per
 * Google Search Central (Product snippet without offers is allowed for a
 * catalogue; FAQ answers need text; breadcrumb items need position + name and
 * an item URL except on the last one).
 */
export function validateRichResult(node) {
  const kind = richResultKind(node);
  const problems = [];
  if (kind === "Product") {
    if (!filled(node.name)) problems.push("Product.name fehlt");
    if (node.offers && !filled(node.offers.price) && !filled(node.offers.lowPrice)) problems.push("Product.offers ohne Preis");
    if (node.brand && !filled(node.brand.name ?? node.brand)) problems.push("Product.brand ohne Namen");
  } else if (kind === "FAQPage") {
    const qs = [].concat(node.mainEntity || []);
    if (!qs.length) problems.push("FAQPage.mainEntity leer");
    qs.forEach((q, i) => {
      if (!typesOf(q).includes("Question")) problems.push(`FAQ ${i + 1}: kein Question`);
      if (!filled(q?.name)) problems.push(`FAQ ${i + 1}: name fehlt`);
      if (!filled(q?.acceptedAnswer?.text)) problems.push(`FAQ ${i + 1}: acceptedAnswer.text fehlt`);
    });
  } else if (kind === "BreadcrumbList") {
    const items = [].concat(node.itemListElement || []);
    if (!items.length) problems.push("BreadcrumbList leer");
    items.forEach((it, i) => {
      if (it?.position !== i + 1) problems.push(`Breadcrumb ${i + 1}: position ${it?.position}`);
      if (!filled(it?.name)) problems.push(`Breadcrumb ${i + 1}: name fehlt`);
      const url = typeof it?.item === "string" ? it.item : it?.item?.["@id"];
      if (i < items.length - 1 && !filled(url)) problems.push(`Breadcrumb ${i + 1}: item fehlt`);
      if (filled(url) && !/^https:\/\//.test(url)) problems.push(`Breadcrumb ${i + 1}: item nicht absolut`);
    });
  } else if (kind === "LocalBusiness") {
    if (!filled(node.name)) problems.push("LocalBusiness.name fehlt");
    const a = node.address || {};
    for (const f of ["streetAddress", "postalCode", "addressLocality", "addressCountry"]) {
      if (!filled(a[f])) problems.push(`LocalBusiness.address.${f} fehlt`);
    }
    const hours = [].concat(node.openingHoursSpecification || []);
    if (!hours.length) problems.push("LocalBusiness.openingHoursSpecification fehlt");
    hours.forEach((h, i) => {
      if (!filled(h?.dayOfWeek) || !/^\d{2}:\d{2}$/.test(h?.opens || "") || !/^\d{2}:\d{2}$/.test(h?.closes || "")) {
        problems.push(`Öffnungszeit ${i + 1} unvollständig`);
      }
    });
  }
  return problems;
}

/**
 * Recommended-but-optional gaps (strings) of one rich-result node. A Product
 * without offers/review/aggregateRating is valid structured data but gets no
 * product snippet — deliberate here (no published prices, no reviews).
 */
export function richResultWarnings(node) {
  const kind = richResultKind(node);
  const warnings = [];
  if (kind === "Product") {
    if (!filled(node.image)) warnings.push("Product.image fehlt");
    if (!node.offers && !node.review && !node.aggregateRating) warnings.push("kein Produkt-Snippet (ohne offers/review, bewusst)");
  }
  return warnings;
}

/**
 * Pages whose hreflang alternates are not answered by the target page.
 * `pages`: Map(url → { hreflang: {lang: url} }) — only crawled pages are
 * judged; a target that was not crawled is reported as `unchecked`.
 * Rules: every page lists itself; every target page lists the source back
 * (under any language code); x-default is not required to be reciprocal
 * beyond pointing at a crawled page that lists it.
 * @returns {{ errors: Array<{url, lang, target, problem}>, unchecked: number, pairs: number }}
 */
export function checkHreflangReciprocity(pages) {
  const errors = [];
  let unchecked = 0;
  let pairs = 0;
  for (const [url, page] of pages) {
    const alts = page?.hreflang || {};
    const targets = Object.entries(alts);
    if (!targets.length) continue;
    if (!Object.values(alts).includes(url)) errors.push({ url, lang: "-", target: url, problem: "kein Selbstverweis" });
    for (const [lang, target] of targets) {
      if (target === url) continue;
      const other = pages.get(target);
      if (!other) {
        unchecked += 1;
        continue;
      }
      pairs += 1;
      if (other.status && other.status !== 200) {
        errors.push({ url, lang, target, problem: `Ziel liefert ${other.status}` });
      } else if (!Object.values(other.hreflang || {}).includes(url)) {
        errors.push({ url, lang, target, problem: "Ziel verweist nicht zurück" });
      }
    }
  }
  return { errors, unchecked, pairs };
}

/** Deterministic, evenly spread sample of `n` items (no randomness → reproducible runs). */
export function spreadSample(list, n) {
  if (!Array.isArray(list) || n >= list.length) return [...(list || [])];
  if (n <= 0) return [];
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
}

/** URLs only in `before` (lost) and only in `after` (new). */
export function diffUrlSets(before, after) {
  const a = new Set(before);
  const b = new Set(after);
  return { lost: [...a].filter((u) => !b.has(u)), added: [...b].filter((u) => !a.has(u)) };
}
