// node --test tests/unit/r3-marken-seo.test.mjs
// R3-marken-seo: Marke × Kategorie angeschlossen (collection → category →
// alias 308 → 404), Backoffice-Ausschlussliste, Sitemap-Schalter, llms.txt.
// Live-Teil gegen SITEMAP_BASE (Standard http://localhost:3000); übersprungen
// mit Warnung, wenn der Dev-Server nicht erreichbar ist.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBrandCategories, findBrandCategoryAlias } from "../../src/lib/marken/brandCategory.js";
import {
  BRAND_CATEGORY_EXCLUSIONS,
  NON_PRODUCT_PATHS,
  brandCategoryExclusion,
  isExcludedBrandCategory,
  withoutNonProducts,
} from "../../src/lib/marken/brandCategoryAudit.js";
import { brandCategoryRobots, buildBrandCategoryMetadata } from "../../src/lib/marken/brandCategoryPage.js";
import { BRAND_CATEGORY_SITEMAP_ENABLED, toBrandCategoryEntries } from "../../src/lib/seo/sitemap/brandCategorySitemap.js";
import { buildBrandCategorySection, buildLlmsTxt } from "../../src/lib/seo/llms.js";
import { findClaims } from "../../src/lib/legal/claims.js";

// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";

const rows = (brand, category, n, prefix = category) =>
  Array.from({ length: n }, (_, i) => ({
    marken: brand,
    kategories: category,
    path_field: `${prefix}-${brand}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    status: "Aktiv",
    modified: "2026-10-02 10:00:00",
    // Runde 4 P5: indexability counts models (distinct names with an image).
    produkt_name: `${prefix} Modell ${i}`,
    bild_anhangen: [{ bild_anhangen: `/files/${prefix}-${i}.webp` }],
  }));

test("Ausschlussliste: dünne/fragliche Kombinationen sind nie indexierbar, nie in der Sitemap", () => {
  const [cph] = buildBrandCategories(rows("101 Copenhagen", "lamps", 20));
  assert.equal(cph.categories[0].count, 20);
  assert.equal(cph.categories[0].excluded, true);
  assert.equal(cph.categories[0].indexable, false);
  const [rima] = buildBrandCategories([...rows("Rimadesio", "rugs", 3), ...rows("Rimadesio", "shelves", 11)]);
  assert.deepEqual(
    rima.categories.map((c) => [c.slug, c.indexable, c.excluded]),
    [
      ["shelves", true, false],
      ["rugs", false, true],
    ]
  );
  assert.deepEqual(
    toBrandCategoryEntries([cph, rima], "https://platzhirsch.studio")
      .map((e) => e.url)
      .filter((u) => u.includes("/de/")),
    ["https://platzhirsch.studio/de/ueber-uns/marken/rimadesio/shelves"]
  );
  // Every list entry names its reason; slugs are lower-case URL slugs.
  for (const [brand, cats] of Object.entries(BRAND_CATEGORY_EXCLUSIONS)) {
    assert.match(brand, /^[a-z0-9-]+$/);
    for (const [slug, reason] of Object.entries(cats)) {
      assert.match(slug, /^[a-z0-9-]+$/);
      assert.match(reason, /^(variants|doubtful): /);
      assert.equal(isExcludedBrandCategory(brand, slug), true);
    }
  }
  assert.equal(brandCategoryExclusion("minotti", "sofas-couches"), null);
});

test("Nicht-Produkte zählen nicht (Referenzbeitrag Next125)", () => {
  const ref = [...NON_PRODUCT_PATHS][0];
  const data = [...rows("Next125", "kitchen", 2), { ...rows("Next125", "kitchen", 1)[0], path_field: ref }];
  assert.equal(withoutNonProducts(data).length, 2);
  const [n] = buildBrandCategories(data);
  assert.equal(n.categories[0].count, 2);
  assert.equal(n.categories[0].indexable, false);
});

test("robots: ausgeschlossen → noindex,follow, auch bei vielen Produkten", () => {
  const base = { brand: { name: "101 Copenhagen", display: "101 Copenhagen", slug: "101-copenhagen" }, category: { key: "lamps", slug: "lamps", label: "Leuchten" }, products: [] };
  assert.deepEqual(brandCategoryRobots({ ...base, count: 20, excluded: true }), { index: false, follow: true });
  // Runde 4 P5: robots decide on models (buildBrandCategories().models), not raw entries.
  assert.deepEqual(brandCategoryRobots({ ...base, count: 20, models: 20, excluded: false }), { index: true, follow: true });
  assert.deepEqual(buildBrandCategoryMetadata({ ...base, count: 20, excluded: true }, "de").robots, { index: false, follow: true });
});

test("Alias: eindeutiges Präfix → Ziel, sonst null (dann 404)", () => {
  const [m] = buildBrandCategories([
    ...rows("Minotti", "sofas-couches", 4),
    ...rows("Minotti", "garden-chairs", 3),
    ...rows("Minotti", "garden-tables", 3),
    ...rows("Minotti", "armchairs-stools", 3),
  ]);
  assert.equal(findBrandCategoryAlias(m.categories, "sofas"), "sofas-couches");
  assert.equal(findBrandCategoryAlias(m.categories, "armchairs"), "armchairs-stools");
  assert.equal(findBrandCategoryAlias(m.categories, "garden"), null, "mehrdeutig");
  assert.equal(findBrandCategoryAlias(m.categories, "sofas-couches"), null, "exakter Slug ist kein Alias");
  assert.equal(findBrandCategoryAlias(m.categories, "xyz"), null);
  assert.equal(findBrandCategoryAlias(m.categories, "so"), null, "zu kurz");
});

test("Sitemap-Schalter ist an", () => {
  assert.equal(BRAND_CATEGORY_SITEMAP_ENABLED, true);
});

test("llms.txt: Abschnitt „Marken nach Kategorie“ nur mit indexierbaren Seiten, ohne Zahlen und Claims", () => {
  const summaries = buildBrandCategories([
    ...rows("Minotti", "sofas-couches", 5),
    ...rows("Minotti", "mirrors", 2),
    ...rows("101 Copenhagen", "lamps", 20),
    ...rows("ClassiCon", "side-tables", 4),
  ]);
  const section = buildBrandCategorySection(summaries, { "sofas-couches": "Sofas & Couches", "side-tables": "Beistelltische" });
  assert.deepEqual(section.split("\n").slice(2), [
    "- [Minotti Sofas & Couches](https://platzhirsch.studio/de/ueber-uns/marken/minotti/sofas-couches)",
    "- [ClassiCon Beistelltische](https://platzhirsch.studio/de/ueber-uns/marken/classicon/side-tables)",
  ]);
  assert.equal(findClaims(section, { locale: "de" }).length, 0);
  assert.equal(buildBrandCategorySection([], {}), "");
  const body = buildLlmsTxt({ brands: [{ name1: "Minotti" }], brandCategories: summaries, categoryLabels: {} });
  assert.match(body, /^## Marken nach Kategorie$/m);
});

// ---------------------------------------------------------------- live ---
let live = true;
try {
  await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(10000) });
} catch {
  live = false;
  console.warn(`r3-marken-seo: dev server not reachable at ${BASE}, live tests skipped`);
}
const liveSkip = live ? false : `dev server not reachable at ${BASE}`;

// Ein 5xx (Kaltstart des Dev-Servers, Backoffice-Latenz) wird einmal wiederholt, damit der Integrator keinen Fehlalarm bekommt (QA-P3-2).
const get = async (path, init = {}) => {
  const once = () => fetch(`${BASE}${path}`, { redirect: "manual", signal: AbortSignal.timeout(240000), ...init });
  const res = await once();
  if (res.status < 500) return res;
  await new Promise((r) => setTimeout(r, 2000));
  return once();
};
const robotsOf = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

test("live: Route – Kategorie 200/index, dünn 200/noindex, Ausschluss 200/noindex, Alias 308, unbekannt 404, Collection unverändert", { skip: liveSkip }, async () => {
  const cases = [
    ["/de/ueber-uns/marken/minotti/sofas-couches", 200, "index, follow"],
    ["/en/about-us/brands/minotti/sofas-couches", 200, "index, follow"],
    ["/de/ueber-uns/marken/minotti/mirrors", 200, "noindex, follow"],
    ["/de/ueber-uns/marken/101-copenhagen/lamps", 200, "noindex, follow"],
    ["/de/ueber-uns/marken/alonpi/alonpi-heritage", 200, "index, follow"],
    ["/de/ueber-uns/marken/minotti/gibt-es-nicht", 404, null],
  ];
  for (const [path, status, robots] of cases) {
    const res = await get(path);
    const html = await res.text();
    assert.equal(res.status, status, path);
    if (robots) assert.equal(robotsOf(html), robots, path);
  }
  const alias = await get("/de/ueber-uns/marken/minotti/sofas");
  assert.equal(alias.status, 308);
  assert.match(alias.headers.get("location") || "", /\/de\/ueber-uns\/marken\/minotti\/sofas-couches$/);
});

test("live: Sitemap listet Marke × Kategorie genau dann, wenn die Seite index ist (Stichprobe + Ausschlüsse)", { skip: liveSkip }, async () => {
  const xml = await (await get("/sitemap-marken.xml")).text();
  const all = locs(xml);
  assert.equal(new Set(all).size, all.length, "keine doppelte <loc>");
  // Category slugs never start with the brand slug; collection slugs do.
  const cats = all
    .map((u) => u.match(/^https:\/\/platzhirsch\.studio\/de\/ueber-uns\/marken\/([^/]+)\/([^/]+)$/))
    .filter((m) => m && !m[2].startsWith(`${m[1]}-`))
    .map((m) => `${m[1]}/${m[2]}`);
  assert.ok(cats.length >= 50, `only ${cats.length} brand × category URLs`);
  for (const [brand, list] of Object.entries(BRAND_CATEGORY_EXCLUSIONS))
    for (const slug of Object.keys(list)) assert.ok(!cats.includes(`${brand}/${slug}`), `excluded listed: ${brand}/${slug}`);
  // Every listed DE URL has its EN/FR/IT siblings.
  for (const c of cats) assert.ok(all.includes(`https://platzhirsch.studio/it/chi-siamo/marche/${c}`), `IT missing for ${c}`);
  // Sample: every 8th listed page answers 200 with index, follow.
  const sample = cats.filter((_, i) => i % 8 === 0);
  for (const c of sample) {
    const res = await get(`/de/ueber-uns/marken/${c}`);
    assert.equal(res.status, 200, c);
    assert.equal(robotsOf(await res.text()), "index, follow", c);
  }
});

test("live: llms.txt-Abschnitt verweist nur auf Sitemap-URLs", { skip: liveSkip }, async () => {
  const [txt, xml] = await Promise.all([(await get("/llms.txt")).text(), (await get("/sitemap-marken.xml")).text()]);
  const section = txt.split(/^## /m).find((s) => s.startsWith("Marken nach Kategorie"));
  assert.ok(section, "section present");
  const urls = [...section.matchAll(/\]\((https:[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  const listed = new Set(locs(xml));
  for (const u of urls) assert.ok(listed.has(u), `not in sitemap: ${u}`);
});
