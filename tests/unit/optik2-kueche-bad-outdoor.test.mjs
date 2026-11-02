// tests/unit/optik2-kueche-bad-outdoor.test.mjs – Optik-QA Küche/Bad/Outdoor, Runde 2 (01.11.2026).
// Run: node --test --test-reporter=tap tests/unit/optik2-kueche-bad-outdoor.test.mjs
//
// Prüft: (1) Landing/typoLanding.js – „St. Gallen“ bricht nicht zwischen Abkürzung
// und Ortsnamen, Gedankenstrich bleibt in Überschriften am Wort davor;
// (2) Katalog/produktTitel.js für Konfigurator-Optionen (Maß + Einheit gebunden);
// (3) Quelltext-Regeln der Fixes (Katalograster 2-spaltig am Handy, Galerie-Ansichten
// 2-spaltig, Vorschau-/Bildhöhe an die Bildschirmhöhe gebunden, Bad-&-Wellness-Hero
// ohne w-auto, Kartenband ab sm 5:1).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const NBSP = " ";

test("bindAbbreviations: St. bleibt beim Ortsnamen, nur Leerzeichen ändern sich", async () => {
  const { bindAbbreviations } = await load("src/components/Landing/typoLanding.js");
  assert.equal(bindAbbreviations("Designermöbel für St. Gallen"), `Designermöbel für St.${NBSP}Gallen`);
  assert.equal(bindAbbreviations("über St. Margrethen und St. Georgen"), `über St.${NBSP}Margrethen und St.${NBSP}Georgen`);
  assert.equal(bindAbbreviations("St. Anton am Arlberg"), `St.${NBSP}Anton am Arlberg`);
  assert.equal(bindAbbreviations("etwa z. B. Eiche"), `etwa z.${NBSP}B. Eiche`);
  // Satzende „… Platz. Danach“ und Kleinbuchstaben bleiben unberührt
  assert.equal(bindAbbreviations("Ein Ort am See. Danach"), "Ein Ort am See. Danach");
  assert.equal(bindAbbreviations("Fast. und"), "Fast. und");
  assert.equal(bindAbbreviations(""), "");
  assert.equal(bindAbbreviations(undefined), undefined);
  const s = "Von St. Gallen nach Lochau, z. B. über St. Margrethen";
  assert.equal(bindAbbreviations(s).replace(/ /g, " "), s);
});

test("bindHeading: Gedankenstrich hängt am Wort davor, Ergänzungsstrich bleibt gebunden", async () => {
  const { bindHeading } = await load("src/components/Landing/typoLanding.js");
  assert.equal(
    bindHeading("Möbel und Designermöbel für St. Gallen – ein Einkauf über die Grenze"),
    `Möbel und Designermöbel für St.${NBSP}Gallen${NBSP}– ein Einkauf über die Grenze`
  );
  assert.equal(bindHeading("Fragen zur Hotel- und Gastroeinrichtung"), `Fragen zur Hotel-${NBSP}und Gastroeinrichtung`);
  assert.equal(bindHeading("Bad – das tägliche Ritual"), `Bad${NBSP}– das tägliche Ritual`);
  assert.equal(bindHeading(undefined), undefined);
});

test("produktTitel: Konfigurator-Optionen – Maß und Einheit am Zeilenende zusammen", async () => {
  const { produktTitel } = await load("src/components/Katalog/produktTitel.js");
  const o = "AVAS1099_ – freistehend, L 184 × B 85 × H 57 cm";
  assert.ok(produktTitel(o).endsWith(`H${NBSP}57${NBSP}cm`));
  assert.match(produktTitel(o), new RegExp(`L${NBSP}184 × B${NBSP}85 ×`));
  // Namen mit Buchstabe + Zahl ohne Maßbedeutung bleiben bis auf Leerzeichen gleich
  assert.equal(produktTitel("Backofen 60 x 60 cm GO 250").replace(/ /g, " "), "Backofen 60 x 60 cm GO 250");
  assert.equal(produktTitel(o).replace(/ /g, " "), o);
});

test("Quelltext: Raster, Bildhöhen und Kartenband der Fixes", () => {
  const liste = src("src/components/Katalog/KatalogListe.js");
  assert.match(liste, /const GRID = "grid grid-cols-2 [^"]*lg:grid-cols-3"/, "Katalogliste am Handy zweispaltig");
  assert.match(liste, /sizes=\{KACHEL_SIZES\}/);
  const detail = src("src/components/Katalog/ProduktDetail.js");
  assert.match(detail, /data-kat-ansichten=\{p\.slug\}/);
  // QM R1: zweispaltig ab zwei Ansichten, eine einzelne Ansicht in voller Breite.
  assert.match(detail, /grid \$\{rest\.length > 1 \? "grid-cols-2" : "grid-cols-1"\} gap-4 sm:gap-6`\} data-kat-ansichten/, "Ansichten am Handy zweispaltig");
  // QM R3: Höhe über die Breite begrenzt (keine Leinen-Streifen), Breite ≤ Original ÷ 1,5.
  assert.match(detail, /maxH = "min\(34rem,80svh\)"/);
  assert.match(detail, /maxH="min\(42rem,80svh\)"/);
  // QM R4: Breite als Variable `breite` (Figur mittig, Bildunterschrift bündig)
  assert.match(detail, /const breite = `min\(100%, \$\{maxW\}px, calc\(\$\{maxH\} \* /);
  const konfig = src("src/components/Katalog/Konfigurator.js");
  // QM R3: Vorschau klein neben der Zusammenfassung statt groß zwischen Titel und Knöpfen.
  // QM R4: Rahmen im Seitenverhältnis des Optionsbilds (Quadrat nur ohne Maße), Weiß verschmilzt
  assert.match(konfig, /relative aspect-square w-full bg-linen" style=\{bild\.w && bild\.h \? \{ aspectRatio:/, "Vorschau im Bildformat");
  assert.match(konfig, /object-contain mix-blend-multiply/);
  assert.match(konfig, /text-left text-ui/, "lange Optionen linksbündig");
  assert.match(konfig, /\{produktTitel\(o\.name\)\}/);
  const bw = src("src/components/BadWellness/BadWellnessPage.js");
  assert.doesNotMatch(bw, /mx-auto block h-auto max-h-\[26rem\] w-auto/, "Hero-Bild ohne w-auto (CLS)");
  assert.match(bw, /block h-auto max-h-\[26rem\] w-full object-contain/);
  const schema = src("src/components/Landing/schema/StudioSchema.js");
  // QM R3: ab sm 5:2 (iPad hoch), 5:1 nur Telefon quer, ab lg 4:3
  assert.match(schema, /aspect-\[3\/1\][^"]*sm:aspect-\[5\/2\][^"]*max-height:30rem\)\]:aspect-\[5\/1\]![^"]*lg:aspect-\[4\/3\]/);
  const map = src("src/components/Landing/schema/StadtMap.js");
  assert.match(map, /ratio=\{2\.5\}[^/]*scale=\{0\.45\}[^/]*sm:block lg:hidden/);
  assert.match(map, /ratio=\{5\}[^/]*scale=\{0\.45\}[^/]*max-height:30rem\)\]:block!/);
  const parts = src("src/components/Landing/parts.js");
  // QM R1 (optik4): fitHeading = bindHeading + weiche Trennstellen.
  assert.match(parts, /\{fitHeading\(title\)\}/);
  assert.match(parts, /title: bindAbbreviations\(item\.q\)/);
});
