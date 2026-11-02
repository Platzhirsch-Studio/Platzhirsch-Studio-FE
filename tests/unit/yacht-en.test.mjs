// node --test tests/unit/yacht-en.test.mjs
// Welle 2 (team EN-Yacht-Sofa, 29.10.2026): /en/yacht-interior in English.
// - page copy, concepts, zones, products, AI image alts and Navetta captions English
// - same facts as the German page: same structure, same products, no prices,
//   no dealer claim, AI label on every concept image
import { test } from "node:test";
import assert from "node:assert/strict";
import concepts from "../../src/lib/yacht/concepts.json" with { type: "json" };
import renders from "../../src/lib/yacht/renders.json" with { type: "json" };
import { buildConcepts, islandConcepts } from "../../src/lib/yacht/model.js";
import { CONCEPTS_EN, MODEL_EN, RENDERS_EN, localizeConcepts, productPathEn } from "../../src/lib/yacht/concepts-en.js";
import { CONTENT_EN, META_EN } from "../../src/lib/yacht/content-en.js";
import { YACHT_UI, yachtUi } from "../../src/lib/yacht/ui.js";
import { navettaCopy, NAVETTA_IMAGES } from "../../src/lib/yacht/navetta.js";
import { YACHT_LOCALES, yachtLanguages } from "../../src/lib/yacht/seo.js";

// German words that must not appear in English copy (proper names allowed: Landstraße, Pfänder, Baden-Württemberg)
const GERMAN = /\b(und|oder|mit|für|nicht|nur|der|die|das|Werft|Sattler|Bootssattler|Polster|Kissen|Leuchte|Tisch|Decke|Teppich|Steg|Bettwäsche|Hinweis|Beispielkonzept|Konzept)\b/;
const UMLAUT_OK = /Landstraße|Pfänder|Baden-Württemberg|Bergère/g;

function strings(o, path = "", out = []) {
  if (typeof o === "string") out.push([path, o]);
  else if (Array.isArray(o)) o.forEach((x, i) => strings(x, `${path}.${i}`, out));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) strings(v, `${path}.${k}`, out);
  return out;
}

const SKIP_KEYS = /\.(id|slug|swatch|href|path|image|lqip|avif|webp|brand|name|imageKind|imageFit|eignung|model|zone|format|tone|initial|hex|label)$|\.featured\.|\.(1200|2400)$|\.excluded\./;

test("Seitentexte EN: keine deutschen Wörter, gleiche Struktur wie DE", () => {
  for (const [p, s] of strings(CONTENT_EN)) {
    if (/\.(slug|swatch|href|name|initial|mailSubject)$|featured/.test(p)) continue;
    assert.doesNotMatch(s.replace(UMLAUT_OK, ""), /[äöüß]/, `${p}: ${s}`);
    assert.doesNotMatch(s, GERMAN, `${p}: ${s}`);
  }
  assert.equal(CONTENT_EN.faq.items.length, 13); // texte-seo-ki 31.10.2026: 9 → 13, same questions as DE
  assert.equal(CONTENT_EN.course.items.length, 6);
  assert.equal(CONTENT_EN.brands.groups.flatMap((g) => g.items).length, 12);
  assert.equal(CONTENT_EN.cta.href, "/consultation?thema=yacht");
  assert.ok(META_EN.description.length <= 165 && META_EN.title.length <= 65);
});

test("Keine Preise, keine Händler- oder Spitzen-Aussagen", () => {
  const all = strings(CONTENT_EN).map(([, s]) => s).join(" ");
  assert.doesNotMatch(all, /€|EUR|\bprice|dealer|partner of|authori[sz]ed|No\. ?1|leading|\bbest (?!time)|certified|refit from a single source/i);
});

test("Konzepte EN: alle sichtbaren Felder englisch, Produkte wie DE", () => {
  const de = buildConcepts(concepts, renders).filter((c) => c.model !== "superyacht");
  const en = localizeConcepts(de, "en");
  assert.equal(en.length, 5);
  for (const [i, c] of en.entries()) {
    assert.ok(CONCEPTS_EN[c.id], c.id);
    assert.deepEqual(c.products.map((p) => p.id), de[i].products.map((p) => p.id), `${c.id}: gleiche Produkte`);
    for (const [p, s] of strings(c)) {
      if (SKIP_KEYS.test(p)) continue;
      assert.doesNotMatch(s.replace(UMLAUT_OK, ""), /[äöüß]/, `${c.id}${p}: ${s}`);
      assert.doesNotMatch(s, GERMAN, `${c.id}${p}: ${s}`);
    }
    for (const img of c.images) {
      // 02.11.2026: AI images keep the AI label, Blender renderings carry the caption
      assert.equal(img.label, img.kiGenerated === false ? MODEL_EN.renderLabel : MODEL_EN.kiLabel, img.id);
      if (img.kiGenerated === false) assert.equal(MODEL_EN.renderLabel, "Visualisation (rendering)");
      assert.ok(RENDERS_EN[img.id], `${img.id}: englischer Alt-Text`);
    }
    for (const p of c.products) {
      assert.doesNotMatch(p.path, /^\/produkte/);
      assert.doesNotMatch(p.href, /^\/de\//);
    }
  }
  // the island (Werfthalle) takes the same English views
  const island = islandConcepts(en);
  assert.equal(island[0].zones[0].label, en[0].zones[0].label);
  assert.equal(productPathEn("/produkte/decor/x"), "/products/decor/x");
});

test("Deutsch bleibt unverändert", () => {
  const de = buildConcepts(concepts, renders);
  assert.equal(localizeConcepts(de, "de"), de);
  assert.equal(yachtUi("de").start3d, "Boot in 3D ansehen");
  assert.equal(navettaCopy("de").images, NAVETTA_IMAGES);
});

test("UI-Strings: DE und EN mit denselben Schlüsseln", () => {
  assert.deepEqual(Object.keys(YACHT_UI.en).sort(), Object.keys(YACHT_UI.de).sort());
  const en = yachtUi("en");
  for (const [k, v] of Object.entries(en)) if (typeof v === "string") assert.doesNotMatch(v, /[äöüß]/, k);
  assert.equal(en.products(1), "1 product");
  assert.equal(en.products(3), "3 products");
});

test("Navetta EN: Bildnachweis und Hinweis, alle Fotos mit englischem Alt-Text", () => {
  const n = navettaCopy("en");
  assert.equal(n.images.length, NAVETTA_IMAGES.length);
  for (const img of n.images) assert.doesNotMatch(img.alt + img.title, /[äöüß]|\b(und|mit)\b/);
  assert.match(n.credit, /Courtesy of Custom Line/);
  assert.match(n.disclaimer, /not furnished by Platzhirsch/);
});

// 01.11.2026: FR/IT dazu – hreflang ist jetzt der seitenweite Satz (tests/unit/yacht-intl.test.mjs).
test("hreflang: de, en (+ fr, it), x-default", () => {
  assert.ok(YACHT_LOCALES.includes("de") && YACHT_LOCALES.includes("en"));
  const h = yachtLanguages();
  assert.equal(h.de, "https://platzhirsch.studio/de/yacht-interior");
  assert.equal(h.en, "https://platzhirsch.studio/en/yacht-interior");
  assert.equal(h["x-default"], "https://platzhirsch.studio/de/yacht-interior");
});
