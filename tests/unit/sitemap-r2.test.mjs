// node --test tests/unit/sitemap-r2.test.mjs
// R2-seo: brand × category entries (switch, only indexable), Ratgeber only
// from getIndexableRatgeber(), and — against the live dev server
// (SITEMAP_BASE, default http://localhost:3000) — that the sitemaps list
// no unreleased Ratgeber; since R3 (switch ON) brand × category URLs are listed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BRAND_CATEGORY_SITEMAP_ENABLED, toBrandCategoryEntries } from "../../src/lib/seo/sitemap/brandCategorySitemap.js";
import { buildBrandCategories } from "../../src/lib/marken/brandCategory.js";
import { toRatgeberEntries } from "../../src/lib/seo/sitemap/ratgeber.js";
import { getIndexableRatgeber, listRatgeber } from "../../src/lib/ratgeber/index.js";

// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";

const rows = (brand, category, n, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    marken: brand,
    kategories: category,
    path_field: `${category}-${brand}-${i}`.toLowerCase(),
    status: "Aktiv",
    modified: `2026-10-0${(i % 9) + 1} 10:00:00`,
    // Runde 4 P5: indexability counts models (own name + image), threshold 4.
    produkt_name: `${category} ${i}`,
    bild_anhangen: [{ bild_anhangen: `/files/${category}-${i}.webp` }],
    ...extra,
  }));

test("brand × category sitemap switch is ON since R3 wired the route", () => {
  assert.equal(BRAND_CATEGORY_SITEMAP_ENABLED, true);
});

test("toBrandCategoryEntries: only indexable combinations, 4 locales each, hreflang, no duplicates", () => {
  const brands = buildBrandCategories(
    [...rows("Minotti", "sofas-couches", 4), ...rows("Minotti", "mirrors", 3), ...rows("Minotti", "beds", 4)],
    { Minotti: [{ name: "beds" }] } // "beds" collides with a collection slug
  );
  const entries = toBrandCategoryEntries(brands, "https://platzhirsch.studio");
  assert.deepEqual(
    entries.map((e) => e.url),
    [
      "https://platzhirsch.studio/de/ueber-uns/marken/minotti/sofas-couches",
      "https://platzhirsch.studio/en/about-us/brands/minotti/sofas-couches",
      "https://platzhirsch.studio/fr/a-propos/marques/minotti/sofas-couches",
      "https://platzhirsch.studio/it/chi-siamo/marche/minotti/sofas-couches",
    ]
  );
  assert.equal(entries[0].alternates.languages["x-default"], entries[0].url);
  // lastmod = newest `modified` of the combination's products (never new Date()).
  assert.equal(String(entries[0].lastModified).slice(0, 10), "2026-10-04");
  assert.equal(new Set(entries.map((e) => e.url)).size, entries.length);
});

test("Ratgeber: getIndexableRatgeber() is the only source; today nothing is released", () => {
  const all = listRatgeber();
  assert.ok(all.length >= 1, "Ratgeber content present");
  const indexable = getIndexableRatgeber();
  assert.ok(indexable.every((a) => a.freigegeben === true));
  // Unreleased articles never reach the sitemap, even when passed by mistake.
  assert.deepEqual(toRatgeberEntries(all.filter((a) => a.freigegeben !== true)), []);
  assert.equal(toRatgeberEntries(indexable).length, indexable.length ? indexable.length + 1 : 0);
});

test("Ratgeber: once released → hub + article, German only, real lastmod", () => {
  const entries = toRatgeberEntries(
    [
      { slug: "a", freigegeben: true, updatedAt: "2026-10-26", geprueftAm: "2026-10-20" },
      { slug: "b", freigegeben: false, updatedAt: "2026-10-27" },
    ],
    "https://platzhirsch.studio"
  );
  assert.deepEqual(
    entries.map((e) => e.url),
    ["https://platzhirsch.studio/de/ratgeber", "https://platzhirsch.studio/de/ratgeber/a"]
  );
  assert.equal(entries[0].lastModified.toISOString().slice(0, 10), "2026-10-26");
});

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(240000) });
  assert.equal(res.status, 200, path);
  return res.text();
}

test("live: no unreleased Ratgeber in the sitemap; brand × category URLs listed (switch ON)", async (t) => {
  try {
    await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(10000) });
  } catch {
    t.skip(`dev server not reachable at ${BASE}`);
    return;
  }
  const [stat, marken] = await Promise.all([fetchText("/sitemap-static.xml"), fetchText("/sitemap-marken.xml")]);
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (!getIndexableRatgeber().length) assert.ok(!locs(stat).some((u) => u.includes("/ratgeber")), "Ratgeber listed although none is released");
  // R3: the route is wired and the switch is on → e.g. Minotti sofas is listed
  // in all 4 locales. Exact agreement with robots: tests/unit/r3-marken-seo.test.mjs.
  const all = new Set(locs(marken));
  for (const u of [
    "https://platzhirsch.studio/de/ueber-uns/marken/minotti/sofas-couches",
    "https://platzhirsch.studio/en/about-us/brands/minotti/sofas-couches",
    "https://platzhirsch.studio/fr/a-propos/marques/minotti/sofas-couches",
    "https://platzhirsch.studio/it/chi-siamo/marche/minotti/sofas-couches",
  ])
    assert.ok(all.has(u), `missing ${u}`);
  assert.ok(!all.has("https://platzhirsch.studio/de/ueber-uns/marken/minotti/mirrors"), "thin combination (2 products) listed");
});
