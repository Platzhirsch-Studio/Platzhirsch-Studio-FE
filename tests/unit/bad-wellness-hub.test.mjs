// tests/unit/bad-wellness-hub.test.mjs – Lokal-SEO Bad & Wellness (31.10.2026):
// Title/H1 „Whirlpool, Sauna & Bad in Vorarlberg“, Abschnitte Whirlpool
// (Aquavia Spa) und Außensauna (Starpool, Soleum), FAQ mit FAQPage.
// Run: node --test --test-reporter=tap tests/unit/bad-wellness-hub.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BW_HUB, hubText } from "../../src/components/BadWellness/badWellnessHub.js";
import { findClaims, dealerStatementList } from "../../src/lib/legal/claims.js";
import { faqItemsFrom, faqPageSchema } from "../../src/lib/seo/faqSchema.js";
import { META_TITLE_MAX, META_DESCRIPTION_MAX, fitTitle } from "../../src/lib/seo/pageMetadata.js";
import { DEALER_MARKEN } from "../../src/lib/wellness/marken.js";
import { markePath } from "../../src/lib/katalog/welten.js";
import * as AQUAVIA from "../../src/lib/katalog/marken/aquavia-spa.js";
import * as STARPOOL from "../../src/lib/katalog/marken/starpool.js";
import * as SOLEUM from "../../src/lib/katalog/marken/soleum.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leaves(v, p));
    else out.push([p, v]);
  }
  return out;
}

// Wie tests/unit/bad-wellness.test.mjs / seo-faq.test.mjs.
const DEALER_WORD = /händler|haendler|dealer|revendeur|rivenditore|retailer|distribut|concessionari|vertragspartner|vertriebspartner|offiziell|official|autorisiert|exklusiv|exclusive/i;
const SUPERLATIVE = /\bbeste[nrs]?\b|\bbest\b|führend|leading|\bnr\.?\s*1\b|meilleur|migliore|einzigartig|\bunique\b|größte|largest|perfekt|perfect|parfait|perfett/i;
const PRICE = /€|\bEUR\b|\bCHF\b|euro\b|franken\b|kostenlos|gratis|free of charge|gratuit|preis|price|prix|prezz/i;
const SHOWROOM = /showroom|ausstellung|ausgestellt|exposition|esposizion|exhibit|on display|vorführ|ausprobier|probeliegen|try out|essayer|provare|schauraum/i;
const HEALTH =
  /gesund|heil(?:t|en|ung|end)|therap|terap|thérap|immun|regenerat|rigenera|stärkt|strengthen|lindert|relieve|soulage|allevia|schmerz|\bpain\b|douleur|dolore|stress|\bschlaf|\bsleep|sommeil|sonno|detox|entgift|health|santé|salute|hilft bei|helps with/i;
// Keine Fahr- oder Lieferzeiten, keine Energie-/Verbrauchsangaben außer Katalogwerten.
const TIME = /\bminuten\b|\bminutes?\b|\bminuti\b|\bstunden?\b|\bhours?\b|\bheures?\b|\bore\b|\bwochen\b|\bweeks?\b|\bsemaines?\b|\bsettimane\b|kwh/i;

test("vier Sprachen: gleiche Schlüssel, nichts leer, FAQ 3–4 Fragen", () => {
  const deKeys = leaves(BW_HUB.de).map(([k]) => k).sort();
  for (const l of LOCALES) {
    const entries = leaves(BW_HUB[l]);
    assert.deepEqual(entries.map(([k]) => k).sort(), deKeys, l);
    for (const [k, v] of entries) assert.ok(typeof v === "string" && v.trim(), `${l}.${k} leer`);
    const n = BW_HUB[l].faq.items.length;
    assert.ok(n >= 3 && n <= 4, `${l}: ${n} Fragen`);
  }
  assert.equal(hubText("xx", "title"), BW_HUB.de.title);
  assert.equal(hubText("fr", "sauna.title"), BW_HUB.fr.sauna.title);
});

test("Title ≤ 60 ungekürzt mit Hausendung, Description 120–150, H1 mit Suchbegriffen", () => {
  for (const l of LOCALES) {
    const { title, description } = BW_HUB[l].meta;
    assert.ok(title.length <= META_TITLE_MAX, `${l}: ${title.length}`);
    assert.equal(fitTitle(title), title, `${l}: würde gekürzt`);
    assert.match(title, / \| Platzhirsch$/, `${l}: Hausendung`);
    assert.ok(description.length >= 120 && description.length <= META_DESCRIPTION_MAX, `${l}: Description ${description.length}`);
    assert.match(BW_HUB[l].title, /Vorarlberg/, l);
    assert.match(BW_HUB[l].title, /sauna/i, l);
    assert.ok(title.startsWith(BW_HUB[l].title), `${l}: Title = H1 + Endung`);
  }
  assert.equal(BW_HUB.de.title, "Whirlpool, Sauna & Bad in Vorarlberg");
  assert.match(BW_HUB.de.whirlpool.title, /^Whirlpool kaufen in Vorarlberg$/);
  assert.match(BW_HUB.de.sauna.title, /^Außensauna für Garten und Haus$/);
});

test("Wortregeln: kein Händlerwort, kein Superlativ, kein Preis, keine Showroom-/Heil-Aussage, keine Zeiten", () => {
  for (const l of LOCALES) {
    for (const [k, v] of leaves(BW_HUB[l])) {
      assert.doesNotMatch(v, DEALER_WORD, `${l}.${k}`);
      assert.doesNotMatch(v, SUPERLATIVE, `${l}.${k}`);
      assert.doesNotMatch(v, PRICE, `${l}.${k}`);
      assert.doesNotMatch(v, SHOWROOM, `${l}.${k}`);
      assert.doesNotMatch(v, HEALTH, `${l}.${k}`);
      assert.doesNotMatch(v, TIME, `${l}.${k}`);
      assert.doesNotMatch(v, /!/, `${l}.${k}`);
      assert.deepEqual(findClaims(v, { locale: l }), [], `${l}.${k}`);
    }
  }
});

test("Fakten aus dem Katalog: Linien, Modelle und Zahlen stehen in den Markendateien", () => {
  const aq = JSON.stringify(AQUAVIA.PRODUKTE);
  for (const line of ["City Line", "Premium Line", "Aqualife Line", "Tiled Line", "Für innen und außen geeignet", "Einbau", "Gegenstromanlage", "Kaltwasserbecken"]) assert.ok(aq.includes(line), line);
  const serenity = AQUAVIA.PRODUKTE.find((p) => p.name === "Serenity Hot Tub");
  assert.ok(JSON.stringify(serenity).includes("1.687 kg"), "Serenity: Gewicht gefüllt");
  const sp = Object.fromEntries(STARPOOL.PRODUKTE.map((p) => [p.name, JSON.stringify(p)]));
  assert.match(sp["Nature Sauna personal"], /Außensauna für Garten oder Terrasse zu Hause/);
  assert.match(sp["Nature Sauna personal"], /Holzofen samt Kamin/);
  assert.match(sp["Nature Sauna personal"], /400 VAC/);
  assert.match(sp["Nature Soft Sauna"], /Außenbereich.*milder Wärme.*Drei Größen/);
  const ellipse = JSON.stringify(SOLEUM.PRODUKTE.find((p) => p.name === "ELLIPSE"));
  assert.match(ellipse, /Garten, Terrasse oder neben dem Pool/);
  assert.match(ellipse, /anschlussfertig mit Glas/);
  assert.match(ellipse, /vier Personen/);
  // Jede Zahl der Texte steht wörtlich im Katalog (Sprachformat: 1.687 / 1,687 / 1 687 / 1687).
  const catalog = JSON.stringify([AQUAVIA.PRODUKTE, STARPOOL.PRODUKTE, SOLEUM.PRODUKTE]);
  for (const l of LOCALES) {
    for (const [k, v] of leaves(BW_HUB[l])) {
      for (const n of v.match(/\d[\d.,  ]*\d|\d/g) || []) {
        if (n === "3") continue; // „in 3D“
        const plain = n.replace(/[.,  ]/g, "");
        assert.ok(catalog.includes(n.replace(/[  ]/g, " ")) || catalog.includes(`${plain.slice(0, -3)}.${plain.slice(-3)}`) || catalog.includes(plain), `${l}.${k}: Zahl ${n} nicht im Katalog`);
      }
    }
  }
});

test("Händlersatz nur über den Claim-Guard; FAQ-Platzhalter gefüllt; FAQPage aus denselben Einträgen", () => {
  const page = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.ok(page.includes("dealerStatementList(a.marken.map((m) => HUB_NAMES[m.slug]), locale)"));
  assert.ok(page.includes('items={hubText(locale, "faq.items")}'));
  assert.equal((page.match(/<SeoFaq\b/g) || []).length, 1, "genau ein FAQPage-Block");
  for (const l of LOCALES) {
    assert.match(dealerStatementList(["Aquavia Spa"], l), /Aquavia Spa/, l);
    const items = faqItemsFrom(BW_HUB[l].faq.items, { markenSatz: dealerStatementList(DEALER_MARKEN, l) });
    assert.equal(items.length, BW_HUB[l].faq.items.length, l);
    for (const it of items) assert.doesNotMatch(it.q + it.a, /\{\w+\}/, l);
    assert.doesNotMatch(items.map((i) => i.a).join(" "), /Agape/, `${l}: keine Agape-Händleraussage`);
    const schema = faqPageSchema(`https://platzhirsch.studio/${l}/bad-wellness`, l, items);
    assert.equal(schema["@type"], "FAQPage");
    assert.deepEqual(schema.mainEntity.map((q) => q.name), items.map((i) => i.q));
    // Elektroanschluss durch befugte Fachbetriebe.
    assert.match(BW_HUB[l].faq.items[2].a, /befugt|licensed|habilitée|abilitata/, l);
  }
});

test("Links: Markenseiten im Katalog mit Produkten, Ratgeber vorhanden, Title/H1 aus dem Hub", () => {
  assert.equal(markePath("bad-wellness", "aquavia-spa"), "/bad-wellness/marke/aquavia-spa");
  for (const m of [AQUAVIA, STARPOOL, SOLEUM]) assert.ok(m.PRODUKTE.length > 0, m.MARKE.slug);
  for (const slug of ["sauna-zuhause-planen", "whirlpool-swimspa-garten-planen"]) {
    assert.ok(fs.existsSync(path.join(ROOT, `src/content/ratgeber/${slug}.md`)), slug);
  }
  const page = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.match(page, /saunaRatgeber: \{ href: "\/ratgeber\/sauna-zuhause-planen", langs: \["de"\]/);
  // QM R1: H1 mit weichen Trennstellen (fitHeading), Text weiter aus dem Hub.
  assert.match(page, /\{fitHeading\(hubText\(locale, "title"\)\)\}/);
  const route = read("src/app/[locale]/bad-wellness/page.js");
  assert.match(route, /title: hubText\(locale, "meta\.title"\)/);
  assert.match(route, /description: hubText\(locale, "meta\.description"\)/);
  assert.doesNotMatch(stripComments(read("src/components/BadWellness/badWellnessHub.js")), /from "@\//, "keine @-Importe");
});
