// node --test tests/unit/yacht-intl.test.mjs
// 01.11.2026: /fr/yacht-interior und /it/yacht-interior.
// - gleiche Struktur wie EN (= DE): Abschnitte, FAQ, Kurs, Marken, Konzepte, UI-Schlüssel
// - keine deutschen Reste, KI-Kennzeichnung in jeder Sprache, Navetta mit Bildnachweis
// - Claim-Guard (keine Händler-/Spitzenaussagen), keine Preise
// - französische Typografie (geschützte Leerzeichen vor : ; ? ! und in « »)
// - SEO: Titel ≤ 60 mit Suffix, Description 120–150 ohne Kürzung, hreflang reziprok
import { test } from "node:test";
import assert from "node:assert/strict";
import concepts from "../../src/lib/yacht/concepts.json" with { type: "json" };
import renders from "../../src/lib/yacht/renders.json" with { type: "json" };
import { buildConcepts } from "../../src/lib/yacht/model.js";
import { YACHT_CONCEPT_LAYERS, localizeConcepts, productPathFor } from "../../src/lib/yacht/concepts-en.js";
import { CONTENT_EN } from "../../src/lib/yacht/content-en.js";
import { YACHT_INTL } from "../../src/lib/yacht/content-intl.js";
import { YACHT_UI } from "../../src/lib/yacht/ui.js";
import { navettaCopy, NAVETTA_IMAGES } from "../../src/lib/yacht/navetta.js";
import { YACHT_LOCALES, yachtLanguages } from "../../src/lib/yacht/seo.js";
import { OG_CARD_FR, OG_CARD_IT } from "../../src/lib/yacht/ogCardsIntl.js";

const OG_CARDS = { fr: OG_CARD_FR, it: OG_CARD_IT };
import { clampDescription, titleWithSuffix } from "../../src/lib/seo/pageMetadata.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const NEW = ["fr", "it"];
const GERMAN = /\b(und|oder|mit|für|nicht|nur|der|die|das|Werft|Sattler|Bootssattler|Polster|Kissen|Leuchte|Tisch|Decke|Teppich|Steg|Bettwäsche|Hinweis|Beispielkonzept|Konzept|Außen|Innen)\b/;
const PROPER = /Landstraße|Pfänder|Baden-Württemberg/g;
// Schlüssel, deren Werte Daten/Namen sind (keine Übersetzung)
const SKIP = /\.(id|slug|swatch|href|path|image|lqip|avif|webp|brand|name|imageKind|imageFit|eignung|model|zone|format|tone|initial|hex|file|src|marke|bildtyp|reason|kicker)$|\.featured\.|\.(1200|2400)$|\.excluded\./;

function strings(o, path = "", out = []) {
  if (typeof o === "string") out.push([path, o]);
  else if (Array.isArray(o)) o.forEach((x, i) => strings(x, `${path}.${i}`, out));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) strings(v, `${path}.${k}`, out);
  return out;
}

/** Struktur ohne Texte: Schlüssel, Arraylängen, Datenwerte (slug, href-Anker, from/to). */
function shape(o) {
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ["slug", "swatch", "from", "to", "initial"].includes(k) && typeof v !== "object" ? v : shape(v)]));
  return typeof o;
}

const deViews = buildConcepts(concepts, renders).filter((c) => c.model !== "superyacht");

test("Seitentexte FR/IT: gleiche Struktur wie EN (= DE)", () => {
  for (const l of NEW) {
    const c = YACHT_INTL[l].content;
    // schema.alternateName: FR/IT wie DE (3 Namen), EN hat 2 – nicht Teil des Vergleichs
    const strip = (x) => ({ ...x, schema: { ...x.schema, alternateName: undefined } });
    assert.deepEqual(shape(strip(c)), shape(strip(CONTENT_EN)), `${l}: Struktur`);
    assert.equal(c.faq.items.length, 13);
    assert.equal(c.course.items.length, 6);
    assert.equal(c.brands.groups.flatMap((g) => g.items).length, 12);
    assert.deepEqual(c.brands.groups.flatMap((g) => g.items.map((i) => i.slug)), CONTENT_EN.brands.groups.flatMap((g) => g.items.map((i) => i.slug)));
    assert.equal(c.hero.secondary.href, "#werfthalle");
    assert.equal(c.hero.secondary.label, YACHT_UI[l].start3d, "Hero-Link und Bühnen-Knopf heißen gleich");
  }
  assert.equal(YACHT_INTL.fr.content.cta.href, "/conseil?thema=yacht");
  assert.equal(YACHT_INTL.it.content.cta.href, "/consulenza?thema=yacht");
});

test("Seitentexte FR/IT: keine deutschen Reste", () => {
  for (const l of NEW) {
    for (const [p, s] of strings(YACHT_INTL[l].content)) {
      if (/\.(slug|swatch|href|name|initial)$|featured/.test(p)) continue;
      assert.doesNotMatch(s.replace(PROPER, ""), /[äöüß]/, `${l}${p}: ${s}`);
      assert.doesNotMatch(s, GERMAN, `${l}${p}: ${s}`);
    }
  }
});

test("Claim-Guard: keine Händler- oder Spitzenaussagen, keine Preise", () => {
  for (const l of NEW) {
    const all = [
      ...strings(YACHT_INTL[l].content),
      ...strings(localizeConcepts(deViews, l)),
      ...strings(YACHT_UI[l]),
      ...strings(navettaCopy(l)),
      ...strings(OG_CARDS[l]),
    ].map(([, s]) => s);
    const findings = all.flatMap((t) => findClaims(t, { locale: l }));
    assert.deepEqual(findings, [], `${l}: ${JSON.stringify(findings)}`);
    const text = all.join(" ");
    assert.doesNotMatch(text, /€|\bEUR\b|\bCHF\b|\d+ ?(?:euros?|francs)\b/, `${l}: Preise`);
    assert.doesNotMatch(text, /\bprix (?!forfaitaires)|\bprezz[oi] (?!forfettari)/i, `${l}: Preise`);
    assert.doesNotMatch(text, /revendeur|concessionnaire|rivenditore|partenaire officiel|partner ufficiale|n[°o] ?1\b|leader|numéro un|numero uno|certifi[ée]|certificat[oa]|il migliore|le meilleur (?!moment)|la meilleure|esclusiv/i, `${l}: Aussage`);
  }
});

test("Konzepte FR/IT: alle sichtbaren Felder übersetzt, Produkte wie DE, KI-Label", () => {
  for (const l of NEW) {
    const layer = YACHT_CONCEPT_LAYERS[l];
    const views = localizeConcepts(deViews, l);
    assert.equal(views.length, 5);
    for (const [i, c] of views.entries()) {
      assert.ok(layer.concepts[c.id], `${l}: ${c.id}`);
      assert.deepEqual(c.products.map((p) => p.id), deViews[i].products.map((p) => p.id), `${l} ${c.id}: gleiche Produkte`);
      for (const [p, s] of strings(c)) {
        if (SKIP.test(p)) continue;
        assert.doesNotMatch(s.replace(PROPER, ""), /[äöüß]/, `${l} ${c.id}${p}: ${s}`);
        assert.doesNotMatch(s, GERMAN, `${l} ${c.id}${p}: ${s}`);
      }
      for (const img of c.images) {
        // 02.11.2026: KI-Bilder behalten das KI-Label, Blender-Renderings tragen die Bildunterschrift
        assert.equal(img.label, img.kiGenerated === false ? layer.model.renderLabel : layer.model.kiLabel, `${l} ${img.id}: KI-Label/Rendering`);
        if (img.kiGenerated === false) assert.equal(layer.model.renderLabel, { fr: "Visualisation (rendu 3D)", it: "Visualizzazione (rendering)" }[l]);
        assert.ok(layer.renders[img.id], `${l} ${img.id}: Alt-Text`);
      }
      for (const p of c.products) {
        assert.doesNotMatch(p.path, /^\/produkte/);
        assert.doesNotMatch(p.href, /^\/de\//);
      }
    }
    // gleiche Schlüssel wie die englische Ebene
    const en = YACHT_CONCEPT_LAYERS.en;
    assert.deepEqual(Object.keys(layer.concepts).sort(), Object.keys(en.concepts).sort());
    assert.deepEqual(Object.keys(layer.renders).sort(), Object.keys(en.renders).sort());
    assert.deepEqual(Object.keys(layer.zones).sort(), Object.keys(en.zones).sort());
    for (const id of Object.keys(en.concepts)) {
      assert.deepEqual(Object.keys(layer.concepts[id].products).sort(), Object.keys(en.concepts[id].products).sort(), `${l} ${id}: Produktschlüssel`);
      assert.equal(layer.concepts[id].palette.length, en.concepts[id].palette.length);
      assert.equal(layer.concepts[id].materials.length, en.concepts[id].materials.length);
    }
    assert.match(layer.model.kiLabel, /IA/);
  }
  assert.equal(productPathFor("/produkte/decor/x", "fr"), "/produits/decor/x");
  assert.equal(productPathFor("/produkte/decor/x", "it"), "/prodotti/decor/x");
});

test("KI-Kennzeichnung (AI Act Art. 50) in jeder Sprache", () => {
  for (const l of NEW) {
    assert.match(YACHT_INTL[l].content.concepts.aiNote, /art\. 50/i);
    assert.match(YACHT_INTL[l].content.concepts.aiNote, /IA/);
    assert.equal(YACHT_UI[l].ki, "IA");
    assert.match(YACHT_UI[l].kiLabel, /IA/);
  }
});

test("UI-Strings: FR und IT mit denselben Schlüsseln wie DE", () => {
  const keys = Object.keys(YACHT_UI.de).sort();
  for (const l of NEW) {
    assert.deepEqual(Object.keys(YACHT_UI[l]).sort(), keys, l);
    assert.deepEqual(Object.keys(YACHT_UI[l].kicker).sort(), Object.keys(YACHT_UI.de.kicker).sort());
    for (const [k, v] of Object.entries(YACHT_UI[l])) if (typeof v === "string") assert.doesNotMatch(v, /[äöüß]/, `${l}.${k}`);
    assert.match(YACHT_UI[l].faqMore, /\{n\}/);
  }
  assert.equal(YACHT_UI.fr.products(1), "1 produit");
  assert.equal(YACHT_UI.it.products(3), "3 prodotti");
  assert.equal(YACHT_UI.it.quote("x"), "«x»");
});

test("Französische Typografie: geschützte Leerzeichen vor : ; ? ! und in « »", () => {
  const fr = [
    ...strings(YACHT_INTL.fr.content),
    ...strings(localizeConcepts(deViews, "fr")),
    ...strings(YACHT_UI.fr),
    ...strings(navettaCopy("fr")),
  ].map(([, s]) => s);
  for (const s of fr) {
    assert.doesNotMatch(s, / [:;?!](?=\s|$)/, `normales Leerzeichen vor Satzzeichen: ${s}`);
    assert.doesNotMatch(s, /« | »/, `Guillemets: ${s}`);
  }
  assert.equal(YACHT_UI.fr.quote("x"), "« x »");
  assert.match(YACHT_UI.fr.note("x"), /Remarque :/);
  assert.match(YACHT_INTL.fr.content.faq.items[0].q, / \?$/);
  // IT: keine französischen Leerzeichen
  for (const [, s] of strings(YACHT_INTL.it.content)) assert.doesNotMatch(s, /[  ]/);
});

test("Navetta FR/IT: Bildnachweis, Hinweis, übersetzte Alt-Texte, Fotos unverändert", () => {
  for (const l of NEW) {
    const n = navettaCopy(l);
    assert.equal(n.images.length, NAVETTA_IMAGES.length);
    n.images.forEach((img, i) => {
      assert.equal(img.file, NAVETTA_IMAGES[i].file);
      assert.equal(img.width, NAVETTA_IMAGES[i].width);
      assert.notEqual(img.alt, NAVETTA_IMAGES[i].alt);
      assert.doesNotMatch(img.alt + img.title, /[äöüß]|\b(und|mit)\b/);
    });
    assert.match(n.credit, /Courtesy of Custom Line/);
    assert.match(n.disclaimer, /Platzhirsch/);
  }
  assert.match(navettaCopy("fr").disclaimer, /non aménagé par Platzhirsch/);
  assert.match(navettaCopy("it").disclaimer, /non arredato da Platzhirsch/);
});

test("SEO FR/IT: Titel ≤ 60, Description 120–150 ohne Kürzung", () => {
  for (const l of NEW) {
    const { meta } = YACHT_INTL[l];
    const title = titleWithSuffix(meta.title);
    assert.ok(title.length <= 60, `${l}: ${title}`);
    assert.match(title, /\| Platzhirsch/);
    const d = meta.description.replace(/[  ]/g, " ");
    assert.ok(d.length >= 120 && d.length < 150, `${l}: ${d.length}`);
    assert.equal(clampDescription(meta.description), d, `${l}: nicht gekürzt`);
    assert.ok(OG_CARDS[l].alt.length > 20);
  }
});

test("hreflang: alle vier Sprachen + x-default, auf jeder Fassung gleich", () => {
  assert.deepEqual(YACHT_LOCALES, ["de", "en", "fr", "it"]);
  const h = yachtLanguages();
  for (const l of YACHT_LOCALES) assert.equal(h[l], `https://platzhirsch.studio/${l}/yacht-interior`);
  assert.equal(h["x-default"], h.de);
  assert.equal(h["fr-CH"], h.fr);
  assert.equal(h["it-CH"], h.it);
});

// Lektorat 01.11.2026: einheitliche Begriffe wie auf den übrigen FR/IT-Seiten.
test("Lektorat FR/IT: Begriffe einheitlich, keine Lehnübersetzungen, IT durchgehend „voi“", () => {
  const layers = YACHT_CONCEPT_LAYERS;
  const all = (l) => strings({ page: YACHT_INTL[l], ui: YACHT_UI[l], layer: layers[l] }).map(([, s]) => s).join("\n");
  const fr = all("fr");
  const it = all("it");
  // „Leuchten mit Akku“ = lampes rechargeables (wie src/messages/fr.json), nicht „sans fil“
  assert.doesNotMatch(fr, /sans fil/);
  assert.match(fr, /lampes? rechargeables?/i);
  // „Beispielkonzept“ = exemple de concept (nicht „concept d’exemple“)
  assert.doesNotMatch(fr, /concepts? d’exemple/i);
  // lösungsgefärbt = teint(e) dans la masse, überall gleich
  assert.doesNotMatch(fr, /teintée? dans la masse|teinte masse/);
  assert.match(fr, /teinte dans la masse/);
  assert.doesNotMatch(fr, /antidérapance|canopée|Au bord de la rive/i);
  // IT: Wohnsortiment = collezione indoor; motoryacht maskulin; Höflichkeitsform voi
  assert.doesNotMatch(it, /collezione living|una motoryacht|\bScorri\b/);
});
