// tests/unit/ezarri-basis.test.mjs – Grundlage der Ezarri-Welt: Schalter (config.js),
// Filter (facets.js) und Lese-API (data.js). Konzept:
// Marktresearch/digital/features/ezarri-konzept.md
// Run: node --test tests/unit/ezarri-basis.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return next(specifier, context);
  },
});

let C, F, D;
before(async () => {
  C = await import(pathToFileURL(path.join(SRC, "lib/ezarri/config.js")).href);
  F = await import(pathToFileURL(path.join(SRC, "lib/ezarri/facets.js")).href);
  D = await import(pathToFileURL(path.join(SRC, "lib/ezarri/data.js")).href);
});

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9) + Nr. 7: EZARRI_PUBLIC steht jetzt standardmäßig an; „aus“ bleibt
// über den Parameter prüfbar (Abschalten = false in config.js).
test("Schalter: Standard an; aus → robots noindex/nofollow, nicht in Sitemap/Menü, keine Händler-Aussage", () => {
  assert.equal(C.EZARRI_PUBLIC, true);
  assert.deepEqual(C.ezarriRobots(), { index: true, follow: true });
  assert.equal(C.ezarriInSitemap(), true);
  assert.equal(C.ezarriInNavigation(), true);
  assert.equal(C.ezarriDealerClaimVisible(), true);
  assert.deepEqual(C.ezarriRobots(false), { index: false, follow: false, googleBot: { index: false, follow: false } });
  assert.equal(C.ezarriInSitemap(false), false);
  assert.equal(C.ezarriInNavigation(false), false);
  assert.equal(C.ezarriDealerClaimVisible(false), false);
  assert.equal(C.ezarriRobotsUtility(false).index, false);
  assert.equal(C.ezarriRobotsUtility(false).follow, false);
});

test("Schalter an: indexierbar; Hilfsseiten bleiben noindex, follow", () => {
  assert.deepEqual(C.ezarriRobots(true), { index: true, follow: true });
  assert.deepEqual(C.ezarriRobotsUtility(true), { index: false, follow: true });
  assert.equal(C.ezarriInSitemap(true), true);
  assert.equal(C.ezarriDealerClaimVisible(true), true);
  const m = C.withEzarriRobots({ title: "x", robots: { index: true, follow: true } }, { isPublic: false });
  assert.equal(m.robots.index, false);
  assert.equal(m.title, "x");
});

test("config.js ist rein (kein server-only, keine Aliase), data.js ist server-only", () => {
  const cfg = fs.readFileSync(path.join(SRC, "lib/ezarri/config.js"), "utf8");
  const fac = fs.readFileSync(path.join(SRC, "lib/ezarri/facets.js"), "utf8");
  assert.doesNotMatch(cfg, /^import /m);
  assert.doesNotMatch(fac, /^import /m);
  assert.match(fs.readFileSync(path.join(SRC, "lib/ezarri/data.js"), "utf8"), /^import "server-only";$/m);
});

test("Pfade und Sprachen", () => {
  assert.equal(C.ezarriPath(), "/ezarri");
  assert.equal(C.ezarriPath("mosaike", "dune"), "/ezarri/mosaike/dune");
  assert.equal(C.ezarriLocaleEnabled("de"), true);
  // Welle 2 (Inhaber-Auftrag 29.10.2026, Nr. 13): Englisch freigeschaltet, fr/it nicht.
  assert.equal(C.ezarriLocaleEnabled("en"), true);
  assert.equal(C.ezarriLocaleEnabled("fr"), false);
  assert.equal(C.ezarriLocaleEnabled("it"), false);
  assert.match(C.ezarriCredit("bild"), /Ezarri/);
  assert.equal(C.ezarriCredit("bild", "en"), "Image: Ezarri, ezarri.com");
  assert.equal(C.ezarriUrlFor("https://www.ezarri.com/de/dune", "en"), "https://www.ezarri.com/en/dune");
  assert.equal(C.ezarriUrlFor("https://www.ezarri.com/de/kollektionen?chk_colecciones-Gea=on", "en"), "https://www.ezarri.com/en/collections?chk_colecciones-Gea=on");
  assert.equal(C.ezarriUrlFor("https://www.ezarri.com/de/dune", "de"), "https://www.ezarri.com/de/dune");
});

test("Filter: URL hin und zurück, ungültige Werte fallen weg", () => {
  const f = F.parseFilters(new URLSearchParams("farbfamilie=blau,gruen,lila&format=25mm&safe=1&farbe=2E618C&q=  dune &kollektion=gea,../x"));
  assert.deepEqual(f.farbfamilie, ["blau", "gruen"]);
  assert.deepEqual(f.format, ["25mm"]);
  assert.equal(f.safe, true);
  assert.equal(f.farbe, "#2e618c");
  assert.equal(f.q, "dune");
  assert.deepEqual(f.kollektion, ["gea"]);
  assert.equal(F.serializeFilters(f), "q=dune&kollektion=gea&farbfamilie=blau,gruen&farbe=2e618c&format=25mm&safe=1");
  assert.equal(F.countActiveFilters(f), 7);
  assert.deepEqual(F.parseFilters({ format: ["25mm", "hexa"] }).format, ["25mm", "hexa"]);
});

test("Farbnähe: gleiche Farbe 0, Blau nah an Blau, fern von Gelb", () => {
  assert.equal(F.colorDistance("#2e618c", "#2e618c"), 0);
  assert.ok(F.colorDistance("#2e618c", "#2a436b") < F.COLOR_MATCH_MAX_DE);
  assert.ok(F.colorDistance("#2e618c", "#d8b54a") > F.COLOR_MATCH_MAX_DE);
  assert.equal(F.colorDistance(null, "#000000"), Infinity);
});

test("Daten: Umfang wie im Index (402 Referenzen, 21 Kollektionen, 1010 Galerie, 201 Mosaike, 7 Fugen, 20 Patterns)", () => {
  assert.equal(D.getReferenceIds().length, 402);
  assert.equal(D.getCollections().length, 21);
  assert.equal(D.getGallery({}, { perPage: 2000 }).total, 1010);
  assert.equal(D.getConfiguratorPalette().length, 201);
  assert.equal(D.getGrouts().length, 7);
  assert.equal(D.getPatterns().length, 20);
  assert.equal(D.MAX_MIX, 4);
});

test("Daten: Karten sind schlank, mit Quelle, ohne Herstellertext und ohne Preise", () => {
  const idx = D.getReferenceIndex();
  const json = JSON.stringify(idx);
  const gz = zlib.gzipSync(json).length;
  assert.ok(gz < 20_000, `Index gzip ${gz} B`);
  assert.doesNotMatch(json, /text_ezarri|beschreibung_en|preis/i);
  for (const c of idx) assert.match(c.quelle, /^https:\/\/www\.ezarri\.com\//, c.id);
});

test("Daten: Filter, Varianten, Spezialteile, Galerie, Rezept, Verpackung", () => {
  const blauSafe = D.getReferences({ farbfamilie: ["blau"], safe: true });
  assert.ok(blauSafe.length > 0);
  assert.ok(blauSafe.every((r) => r.farbfamilien.includes("blau")));
  const bergsee = D.getReferences({ wasser: ["natur"] });
  assert.ok(bergsee.length > 0, "Wasserwirkung als Liste");
  assert.ok(D.getGallery({ wasser: ["tuerkisblau"] }).total > 0);
  const dune = D.getReference("dune");
  assert.ok(dune);
  assert.ok(D.getVariants(dune).some((v) => v.id === "dune-50"));
  assert.deepEqual(D.getSpecialPieces(dune).map((r) => r.id), ["corner-dune"]);
  const g = D.getGallery({ einsatz: ["pool-privat"] }, { page: 2, perPage: 24 });
  assert.equal(g.page, 2);
  assert.equal(g.items.length, 24);
  assert.ok(g.pages > 2);
  assert.deepEqual(D.parseRecipe({ cf_mosaico: "66;117;125", mischanteil: "85;10;5" }), [
    { mosaikId: "66", anteil: 85 },
    { mosaikId: "117", anteil: 10 },
    { mosaikId: "125", anteil: 5 },
  ]);
  assert.equal(D.parseRecipe({ cf_mosaico: null }), null);
  const pack = D.getPackaging("25001-c");
  assert.equal(pack.m2ProKarton, 2);
  assert.equal(pack.kgProM2, 9.4);
  const src = D.imageSources(dune.bilder.mosaik[0]);
  assert.match(src.avif, /-600\.avif 600w, .*-1600\.avif 1600w$/);
});

test("Rutschhemmung: vertauschte Datenblatt-Felder werden nach Wert sortiert", () => {
  const all = D.getReferenceIds().map((id) => D.getSlipResistance(id)).filter(Boolean);
  assert.ok(all.length > 100);
  for (const s of all) {
    if (s.schuh) assert.match(s.schuh, /^R\d/);
    if (s.barfuss) assert.doesNotMatch(s.barfuss, /^R\d/);
  }
  assert.ok(all.some((s) => s.korrigiert));
});
