// tests/unit/r7-technik-known-slugs.test.mjs – Technik R7 (r6-technik P0-1).
// Unknown slugs on the backoffice routes are answered by src/proxy.js with the
// prerendered 404 (no render, no ISR cache entry); upper case → 308 to lower
// case; a section without list passes (fail-open). Rules:
// src/lib/seo/knownSlugs.js. The production proof (200 random slugs per route,
// no growth of .next/server and .next/cache) is in
// qa-screenshots/r7-technik/cache-probe.md.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categoryAliasPrefixes, decideKnownPath, indexKnownSlugs, matchKnownRoute } from "../../src/lib/seo/knownSlugs.js";
import { findBrandCategoryAlias } from "../../src/lib/marken/brandCategory.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const PAYLOAD = {
  v: 1,
  brands: { ok: true, list: ["minotti", "flos"] },
  brandSegs: { minotti: ["sofas-couches", "sofas", "seymour"], flos: null },
  categories: { ok: true, list: ["lamps", "sofas-couches", "sofas", "minotti"] },
  products: { ok: true, map: { "lamps-2097-18": "lamps" } },
  news: { ok: true, list: ["sommerfest"] },
  jobs: { ok: true, list: [] },
};
const known = indexKnownSlugs(PAYLOAD);
const act = (p, k = known) => decideKnownPath(p, k);

test("Routen: nur die Backoffice-Routen werden geprüft, statische Geschwister nicht", () => {
  assert.equal(matchKnownRoute("/de/ueber-uns/marken/minotti").kind, "brand");
  assert.equal(matchKnownRoute("/it/chi-siamo/marche/minotti/sofas").kind, "brandSeg");
  assert.equal(matchKnownRoute("/fr/a-propos/carriere/x").kind, "job");
  assert.equal(matchKnownRoute("/en/products/lamps").kind, "category");
  assert.equal(matchKnownRoute("/en/products/lamps/x").kind, "product");
  assert.equal(matchKnownRoute("/de/news/x").kind, "news");
  assert.equal(matchKnownRoute("/de/3d-ansicht/x").kind, "ar");
  for (const p of ["/de", "/de/ueber-uns/marken", "/de/produkte", "/de/news", "/de/kontakt", "/de/ezarri/mosaike/x"]) {
    assert.equal(matchKnownRoute(p), null, p);
  }
  for (const p of ["/de/produkte/suche", "/de/ueber-uns/karriere/share-image", "/de/3d-ansicht/uebergabe"]) {
    assert.deepEqual(act(p), { action: "pass" }, p);
  }
});

test("bekannt → durch, unbekannt → 404 ohne Render", () => {
  for (const p of [
    "/de/ueber-uns/marken/minotti",
    "/en/about-us/brands/minotti/sofas-couches",
    "/de/ueber-uns/marken/minotti/sofas",
    "/de/produkte/lamps",
    "/de/produkte/minotti", // brand slug → 308 in the page
    "/de/produkte/lamps/lamps-2097-18",
    "/de/news/sommerfest",
    "/de/3d-ansicht/lamps-2097-18",
  ]) assert.deepEqual(act(p), { action: "pass" }, p);
  for (const p of [
    "/de/ueber-uns/marken/zz-probe",
    "/de/ueber-uns/marken/zz-probe/sofas",
    "/de/ueber-uns/marken/minotti/zz-probe",
    "/de/produkte/zz-probe",
    "/de/produkte/zz-probe/zz-probe",
    "/de/news/zz-probe",
    "/de/ueber-uns/karriere/zz-probe",
    "/de/3d-ansicht/zz-probe",
    "/de/news/a%C3%A4", // never a slug
    "/de/news/a.b",
  ]) assert.deepEqual(act(p), { action: "notFound" }, p);
});

test("Produkte: falsche Kategorie → 308 im Proxy, Altsite-URL → Resolver ohne Cache", () => {
  assert.deepEqual(act("/de/produkte/sofas-couches/lamps-2097-18"), { action: "redirect", pathname: "/de/produkte/lamps/lamps-2097-18" });
  assert.deepEqual(act("/it/prodotti/zz-probe/lamps-2097-18"), { action: "redirect", pathname: "/it/prodotti/lamps/lamps-2097-18" });
  assert.deepEqual(act("/de/produkte/minotti/old-legacy-slug"), { action: "legacy", brand: "minotti", slug: "old-legacy-slug" });
  assert.deepEqual(act("/de/produkte/lamps/zz-probe"), { action: "notFound" });
  // product list missing → the page decides (fail-open)
  assert.deepEqual(act("/de/produkte/lamps/zz-probe", indexKnownSlugs({ ...PAYLOAD, products: { ok: false } })), { action: "pass" });
  const route = read("src/app/api/legacy-product/route.js");
  assert.match(route, /export const dynamic = "force-dynamic";/);
  assert.ok(route.includes("resolveLegacyProductUrl(brand, slug, { cacheable: false })"));
  assert.ok(read("src/proxy.js").includes('new URL("/api/legacy-product", request.url)'));
});

test("Großbuchstaben → 308 auf Kleinschreibung (Minotti überschrieb minotti)", () => {
  assert.deepEqual(act("/de/ueber-uns/marken/Minotti"), { action: "redirect", pathname: "/de/ueber-uns/marken/minotti" });
  assert.deepEqual(act("/de/ueber-uns/marken/Minotti/Minotti"), { action: "redirect", pathname: "/de/ueber-uns/marken/minotti/minotti" });
  assert.deepEqual(act("/en/products/LAMPS/Lamps-2097-18"), { action: "redirect", pathname: "/en/products/lamps/lamps-2097-18" });
  // also without a list (cheap shape check)
  assert.deepEqual(act("/de/news/Sommerfest", null), { action: "redirect", pathname: "/de/news/sommerfest" });
});

test("fail-open: ohne Liste, Abschnitt nicht ok oder Marke ohne Daten → durch", () => {
  assert.deepEqual(act("/de/ueber-uns/marken/zz-probe", null), { action: "pass" });
  const partial = indexKnownSlugs({ ...PAYLOAD, news: { ok: false }, brands: { ok: false } });
  assert.deepEqual(act("/de/news/zz-probe", partial), { action: "pass" });
  assert.deepEqual(act("/de/ueber-uns/marken/zz-probe", partial), { action: "pass" });
  assert.deepEqual(act("/de/ueber-uns/marken/flos/zz-probe"), { action: "pass" }, "flos: Daten fehlten");
  assert.equal(indexKnownSlugs({ v: 2 }), null);
  assert.equal(indexKnownSlugs(null), null);
});

test("Kurz-Aliase = genau die Fälle von findBrandCategoryAlias (308 der Seite)", () => {
  const slugs = ["sofas-couches", "chaise-longues-daybeds", "garden-chairs", "garden-tables", "side-tables", "sideboards-chests", "lamps"];
  const aliases = new Set(categoryAliasPrefixes(slugs));
  const cats = slugs.map((slug) => ({ slug }));
  const candidates = new Set();
  for (const s of slugs) for (let i = 1; i <= s.length; i++) candidates.add(s.slice(0, i));
  for (const c of candidates) {
    assert.equal(aliases.has(c), findBrandCategoryAlias(cats, c) !== null, c);
  }
  assert.ok(aliases.has("chaise") && aliases.has("chaise-longues") && aliases.has("sofas"));
  assert.ok(!aliases.has("garden"), "mehrdeutig → 404");
});

test("Verdrahtung: Proxy prüft vor allem anderen, Endpunkt ausserhalb des Matchers, lokale Listen geschlossen", () => {
  const proxy = read("src/proxy.js");
  assert.match(proxy, /const knownCheck = await checkKnownSlug\(request\);\s*if \(knownCheck\) return knownCheck;/);
  assert.match(proxy, /\/api\/known-slugs/);
  assert.match(proxy, /"\/\(\(\?!api\|/, "matcher excludes /api (no loop)");
  assert.match(read("src/app/api/known-slugs/route.js"), /export const revalidate = 300;/);
  for (const f of [
    "src/app/[locale]/ezarri/kollektionen/[kollektion]/page.js",
    "src/app/[locale]/ezarri/mosaike/[referenz]/page.js",
  ]) assert.match(read(f), /^export const dynamicParams = false;/m, f);
  // projekte/[slug] renders per request since the Projekt-Tagebuch
  // (connection(), nothing prerendered or cached) – no cache entry either.
  assert.match(read("src/app/[locale]/projekte/[slug]/page.js"), /await connection\(\);/);
  // No data-cache entry per guessed slug.
  assert.match(read("src/lib/api/fetchAllProdukte.js"), /if \(await isUnknownProductPath\(path_field\)\) return null;/);
  assert.ok(read("src/lib/seo/legacyProductRedirects.js").includes(': { cache: "no-store", signal: AbortSignal.timeout(8000) }'));
});
