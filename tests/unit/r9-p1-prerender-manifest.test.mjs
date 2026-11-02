// tests/unit/r9-p1-prerender-manifest.test.mjs – R5-Fix P1 (r5-technik P0-1).
// Regression: all "Marke × Kategorie" and collection pages answered 404 in the
// production build. Cause: `dynamicParams = false` in [locale]/layout.js –
// Next 16.4 combines the segment configs of a route with every(), so the
// layout closed marken/[title]/[collection] (prerender-manifest: fallback:
// false, 0 paths) although the page sets dynamicParams = true.
//
// 1. Source: no dynamicParams=false on the layout; both marken segments keep
//    dynamicParams = true; unknown first segments are rewritten to the
//    prerendered 404 (next.config.js UNKNOWN_LOCALE_REWRITE), matched with
//    Next's own path-to-regexp.
// 2. Build artefact (only when PRERENDER_MANIFEST points to a production
//    .next/prerender-manifest.json, e.g. the copy in platzhirsch-prodtest):
//    the marken routes must not have `fallback: false`; [slug] and the
//    catch-all keep their prerendered 404 (fallback: false).
//      PRERENDER_MANIFEST=../platzhirsch-prodtest/.next/prerender-manifest.json npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const MARKEN = "src/app/[locale]/ueber-uns/marken";

test("Quelle: Layout ohne dynamicParams=false, Marken-Segmente mit dynamicParams=true", () => {
  assert.doesNotMatch(read("src/app/[locale]/layout.js"), /^export const dynamicParams\s*=\s*false/m);
  assert.match(read("src/app/[locale]/layout.js"), /export function generateStaticParams\(\)/);
  for (const f of [`${MARKEN}/[title]/page.js`, `${MARKEN}/[title]/[collection]/page.js`]) {
    assert.match(read(f), /^export const dynamicParams = true;/m, f);
  }
  // The other closed segments keep their own prerendered 404.
  assert.match(read("src/app/[locale]/[slug]/page.js"), /^export const dynamicParams = false;/m);
  assert.match(read("src/app/[locale]/[...rest]/page.js"), /^export const dynamicParams = false;/m);
});

test("Rewrite: unbekanntes erstes Segment → /de/seite-nicht-gefunden, Sprachen und eigene Routen nicht", async () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const file = path.join(ROOT, "next.config.js");
  delete require.cache[file];
  let cfg;
  try {
    cfg = require(file);
  } finally {
    process.env.NODE_ENV = prev;
    delete require.cache[file];
  }
  const rewrites = await cfg.rewrites();
  const list = Array.isArray(rewrites) ? rewrites : rewrites.afterFiles || [];
  assert.ok(Array.isArray(rewrites), "plain array = afterFiles (after public files and static routes)");
  const rule = list.find((r) => r.destination === "/de/seite-nicht-gefunden");
  assert.ok(rule, "rewrite present");
  const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
  const re = pathToRegexp(rule.source, [], { strict: true, sensitive: false, delimiter: "/" });
  for (const p of ["/wp-login.php", "/foo.html", "/xx/kontakt", "/denken", "/dex/a/b"]) assert.ok(re.test(p), `rewritten: ${p}`);
  for (const p of ["/", "/de", "/de/x", "/en/about-us/brands/minotti", "/fr", "/it/chi-siamo", "/api/newsletter_subscribe", "/cmx/files/a.jpg", "/cms/files/a.jpg", "/showroom/_testszene/a", "/_next/static/x.js", "/revalidate/produkte"]) {
    assert.ok(!re.test(p), `not rewritten: ${p}`);
  }
  // [slug] really is a single unknown segment that 404s (no page of that name).
  assert.ok(!fs.existsSync(path.join(ROOT, "src/app/[locale]/seite-nicht-gefunden")));
});

const MANIFEST = process.env.PRERENDER_MANIFEST;
test(
  "Build-Artefakt: Marken-Routen ohne fallback:false (sonst 404 für alle nicht vorgerenderten Seiten)",
  { skip: MANIFEST ? false : "PRERENDER_MANIFEST nicht gesetzt (Pfad zu .next/prerender-manifest.json eines Produktions-Builds)" },
  () => {
    const m = JSON.parse(fs.readFileSync(path.resolve(ROOT, MANIFEST), "utf8"));
    const dyn = m.dynamicRoutes || {};
    for (const route of ["/[locale]/ueber-uns/marken/[title]", "/[locale]/ueber-uns/marken/[title]/[collection]"]) {
      assert.ok(dyn[route], `${route} im Manifest`);
      assert.notEqual(dyn[route].fallback, false, `${route}: fallback ${JSON.stringify(dyn[route].fallback)}`);
    }
    // Brand pages are still prerendered when the backoffice answered (4 locales).
    const brandPages = Object.keys(m.routes || {}).filter((r) => /^\/(de|en|fr|it)\/ueber-uns\/marken\/[^/]+$/.test(r));
    assert.ok(brandPages.length >= 4, `vorgerenderte Markenseiten: ${brandPages.length}`);
    // Unknown single segments and the catch-all keep the prerendered 404.
    for (const route of ["/[locale]/[slug]", "/[locale]/[...rest]"]) {
      if (dyn[route]) assert.equal(dyn[route].fallback, false, route);
    }
  }
);
