// Sprach-Integration 01.11.2026: die neu übersetzten Seiten sind in den geteilten
// Listen viersprachig (kein 308 auf /de, keine Proxy-404, Sitemap mit hreflang).
//   node --test tests/unit/sprach-integration.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { EXTRA_PAGES, MULTILINGUAL_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { pageLocales } from "../../src/lib/content/landingKern/links.js";
import { FEATURES, featuresFor } from "../../src/lib/features.js";

const require = createRequire(import.meta.url);
const deOnly = require("../../src/lib/seo/deOnlyRedirects.cjs");
const ALL = ["de", "en", "fr", "it"];

const VIERSPRACHIG = [
  "ezarri", "yacht-interior", "sofaplaner", "kuechenplaner", "stil-finder",
  "kuechen-vorarlberg", "interior-design-vorarlberg", "wohnzimmer-einrichten-vorarlberg",
  "outdoor-gartenplanung", "leistungen", "dreilaender-rechner", "einkaufen-aus-der-schweiz",
  "architekten", "pflege-service",
];

test("deOnlyRedirects: keine viersprachige Seite wird umgeleitet", () => {
  const listed = [...deOnly.DE_ONLY_EXACT, ...deOnly.DE_ONLY_TREE, ...deOnly.FR_IT_ONLY_EXACT, ...deOnly.FR_IT_ONLY_TREE];
  for (const seg of VIERSPRACHIG) assert.ok(!listed.includes(seg), seg);
  // Leere Listen erzeugen keine Regel mit leerer Gruppe.
  for (const r of deOnly.deOnlyRedirects()) assert.doesNotMatch(r.source, /\(\)/, r.source);
  assert.deepEqual([...deOnly.FR_IT_TO_EN_EZARRI_TOOLS], ["custom-mix", "anfrage"]);
});

test("Proxy: keine FR/IT-Sperre mehr für Pflege-Service/Architekten, Küchenplaner-Druck frei", () => {
  const src = fs.readFileSync("src/proxy.js", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(src, /FR_IT_ONLY_404/);
  assert.doesNotMatch(src, /kuechenplaner\\\/druck/);
});

test("Linkziele (landingKern pageLocales): eigene Sprache für alle viersprachigen Seiten", () => {
  for (const seg of VIERSPRACHIG) assert.deepEqual(pageLocales(`/${seg}`), ALL, seg);
  assert.deepEqual(pageLocales("/ezarri/custom-mix"), ["de", "en"]);
  assert.deepEqual(pageLocales("/bodensee-licht"), ["de"]);
});

test("Sitemap-Register: Sprachen je Seite (hreflang reziprok über dieselbe Liste)", () => {
  const byPath = Object.fromEntries([...EXTRA_PAGES, ...MULTILINGUAL_PAGES].map((p) => [p.path, p]));
  for (const p of ["/yacht-interior", "/sofaplaner", "/kuechenplaner", "/stil-finder", "/leistungen", "/dreilaender-rechner", "/architekten"]) {
    assert.deepEqual(byPath[p]?.locales, ALL, p);
    assert.ok(byPath[p].en?.label && byPath[p].en?.llms, `${p}: englische llms-Zeile`);
  }
  // Ezarri: Sprachen je URL (data.js ezarriLocalesFor; data.js ist server-only, daher Quelltext).
  const sm = fs.readFileSync("src/lib/seo/sitemapEntries.js", "utf8");
  assert.match(sm, /getEzarriEntriesByLocale\(\)/);
  assert.doesNotMatch(sm, /getEzarriEntriesAllLocales\(/);
  // Küchen/Interior/Wohnzimmer: je Sprache mit hreflang, Regionsseiten nur Deutsch.
  assert.match(sm, /const locales = pageLocales\(path\);/);
});

test("Menü-Features: Planer und Services in EN/FR/IT", () => {
  for (const l of ["en", "fr", "it"]) {
    const ids = featuresFor(l, FEATURES).map((f) => f.id);
    for (const id of ["kuechenplaner", "sofaplaner", "stilfinder", "yacht", "ezarri", "dreilaender", "pflege"]) assert.ok(ids.includes(id), `${l}: ${id}`);
    for (const id of ["licht", "arviewer", "concierge"]) assert.ok(!ids.includes(id), `${l}: ${id} bleibt nur Deutsch`);
  }
});
