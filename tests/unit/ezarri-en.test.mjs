// Welle 2 (Inhaber-Auftrag 29.10.2026, Nr. 13): englische Ezarri-Welt.
// Prüft, dass die englischen Copy-Module dieselbe Struktur haben wie die
// deutschen (keine fehlenden Texte → kein Absturz/kein Deutsch auf /en),
// und die Sprach-Helfer (Werte, Herstellertexte, Rechner-Übersetzung).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as DE from "../../src/lib/ezarri/copy.js";
import * as EN from "../../src/lib/ezarri/copy.en.js";
import * as KONF_DE from "../../src/lib/ezarri/konfigurator/copy.js";
import * as KONF_EN from "../../src/lib/ezarri/konfigurator/copy.en.js";
import * as RECHNER_DE from "../../src/lib/ezarri/rechner/copy.js";
import * as RECHNER_EN from "../../src/lib/ezarri/rechner/copy.en.js";
import { herstellerText, wert, dezimal, ezT } from "../../src/lib/ezarri/werte.js";
import { rechnerEn } from "../../src/lib/ezarri/rechner/en.js";
import { fehlerEn, optionEn } from "../../src/lib/ezarri/rechner/anfrage-en.js";
import { facetsFor, facetLabel } from "../../src/lib/ezarri/facets.js";
import { ezCrumbsFor } from "../../src/lib/ezarri/crumbs.js";
import { intro, kollektionDescription } from "../../src/lib/ezarri/kollektionSeo.js";

/** Pfade aller Blätter (Strings/Funktionen) eines Objekts. Listen über Index. */
function shape(v, p = "") {
  if (typeof v === "function") return [`${p}()`];
  if (Array.isArray(v)) return v.flatMap((x, i) => shape(x, `${p}[${i}]`));
  if (v && typeof v === "object") return Object.keys(v).flatMap((k) => shape(v[k], p ? `${p}.${k}` : k));
  return [p];
}

for (const [name, de, en] of [
  ["copy", DE, EN],
  ["konfigurator/copy", KONF_DE, KONF_EN],
  ["rechner/copy", RECHNER_DE, RECHNER_EN],
]) {
  test(`${name}.en.js: alle deutschen Exporte und Schlüssel vorhanden`, () => {
    for (const key of Object.keys(de)) {
      assert.ok(key in en, `${name}.en.js: Export ${key} fehlt`);
      const missing = shape(de[key]).filter((p) => !shape(en[key]).includes(p));
      assert.deepEqual(missing, [], `${name}.en.js ${key}: fehlende Schlüssel`);
    }
  });
}

test("copy.en.js: keine Preise, keine Superlative, kein Umlaut-Deutsch", () => {
  const src = fs.readFileSync("src/lib/ezarri/copy.en.js", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(src, /€|\bEUR\b/);
  assert.doesNotMatch(src, /\b(best|finest|luxury|exclusive|unique|leading)\b/i);
  for (const s of shape(EN).map((p) => p)) assert.ok(typeof s === "string");
});

test("Händler-Aussage englisch aus dem Claim-Register, mit richtigem Artikel", () => {
  assert.equal(EN.dealerClaim(true), "Platzhirsch Home Living is an Ezarri dealer.");
  assert.equal(EN.dealerClaim(false), null);
  assert.equal(EN.dealerLine(false), EN.NEUTRAL_CLAIM);
});

test("Werte und Zahlen je Sprache", () => {
  assert.equal(wert("farbe", "Grün", "en"), "Green");
  assert.equal(wert("oberflaeche", "glänzend", "en"), "gloss");
  assert.equal(wert("oberflaeche", "glänzend", "de"), "glänzend");
  assert.equal(dezimal("24,7 x 24,7 mm", "en"), "24.7 x 24.7 mm");
  assert.equal(ezT("en")("Ja", "Yes"), "Yes");
  assert.equal(facetLabel("wasser", "natur", "en"), "Natural, like a mountain lake");
  assert.equal(facetsFor("en").EINSATZ.length, facetsFor("de").EINSATZ.length);
});

test("Herstellertexte: nur englische Sachsätze, ohne Werbewörter, nur auf Englisch", () => {
  const t = "25001-C , from the M ix collection, are colour blends specially designed for swimming pools. The most exquisite combinations.";
  assert.equal(herstellerText(t, "en"), "25001-C, from the Mix collection, are colour blends specially designed for swimming pools.");
  assert.equal(herstellerText(t, "de"), null);
  assert.equal(herstellerText("Einfach zu installieren mit dem System Joint Point.", "en"), null);
  assert.equal(herstellerText("Safety or beauty? There's no need to choose.", "en"), null);
});

test("Rechner: deutsche Formeln und Meldungen → Englisch", () => {
  assert.equal(rechnerEn("Länge × Breite = 8,5 × 4"), "Length × width = 8.5 × 4");
  assert.equal(rechnerEn("Bitte einen Wert zwischen 0,5 und 50 eingeben."), "Please enter a value between 0.5 and 50.");
  assert.equal(rechnerEn("Gerade Treppe, 3 Stufen"), "Straight steps, 3 steps");
  assert.equal(fehlerEn({ name: "Bitte geben Sie Ihren Namen an." }).name, "Please enter your name.");
  assert.equal(optionEn("laender", "CH"), "Switzerland");
});

test("Brotkrumen und Kollektions-SEO englisch", () => {
  const c = ezCrumbsFor("en", { label: "Mosaics", href: "/ezarri/mosaike" });
  assert.deepEqual(c.map((x) => x.label), ["Home", "Ezarri glass mosaic", "Mosaics"]);
  assert.equal(ezCrumbsFor("de").length, 3);
  const k = { name: "Gea", linie: "Premium", formate: ["50mm", "25mm"], oberflaeche: { standard: ["matt"] } };
  assert.match(intro(k, [{ typ: "mosaik" }], "en"), /^Gea belongs to the Premium line\./);
  assert.match(kollektionDescription(k, [{ typ: "mosaik" }], 155, "en"), /Samples and advice in Lochau\.$/);
});
