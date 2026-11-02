// tests/unit/seo-faq.test.mjs
// SEO-Team A (GEO W2/W5, 31.10.2026): Faktenblock „Auf einen Blick“ und
// FAQ-Blöcke (Über uns, Bad & Wellness, Küchengeräte, Beratung).
//   - vier Sprachen, gleiche Fragenzahl je Sprache, keine offenen Platzhalter
//   - Claim-Guard: kein Superlativ, kein unbelegtes Händlerwort (findClaims)
//   - keine Heilversprechen, keine Preise, kein „Innenarchitekt“, keine
//     Showroom-Aussage bei Wellness (Nr. 19), kein Gründungsjahr, keine Fläche
//   - FAQPage aus denselben Einträgen, Café-Daten nicht die des Showrooms
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findClaims, dealerStatementList } from "../../src/lib/legal/claims.js";
import { faqItemsFrom, faqPageSchema, fillVars } from "../../src/lib/seo/faqSchema.js";
import { aboutVars, cafeHoursLine, dealerGroups, advisoryLanguages, minottiFact } from "../../src/lib/seo/aboutFacts.js";
import { PHONE_DISPLAY, openingHoursLine } from "../../src/lib/site.js";
import { DEALER_MARKEN } from "../../src/lib/wellness/marken.js";

const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const msg = (l) => JSON.parse(read(`src/messages/${l}.json`));
const PAGES = ["about", "badWellness", "kuechengeraete"];
const HEAL = /gesund|heilt|heilen|Immunsystem|entgift|Therapie|health|heal|immune|detox|santé|guéri|immunit|salute|guarig|immunitar/i;
const PRICE = /€|\bEUR\b|\bCHF\b|kostenlos|gratis|free of charge|gratuit|gratuito/i;
const BAN = /innenarchitekt|interior architect|architecte d.\s?int[ée]rieur|architett[oi] d.\s?interni|400 ?m|gegründet|founded in|fondée? en|fondat[oa] nel/i;

const varsFor = (page, l) => (page === "about" ? aboutVars(l) : page === "badWellness" ? { markenSatz: dealerStatementList(DEALER_MARKEN, l) } : {});

test("FAQ: vier Sprachen, gleiche Fragenzahl, 3–4 Fragen, keine offenen Platzhalter", () => {
  for (const page of PAGES) {
    const n = msg("de").seoGeo.faq[page].items.length;
    assert.ok(n >= 3 && n <= 4, page);
    for (const l of LOCALES) {
      const raw = msg(l).seoGeo.faq[page];
      assert.ok(raw.title, `${l} ${page} title`);
      assert.equal(raw.items.length, n, `${l} ${page}`);
      for (const it of faqItemsFrom(raw.items, varsFor(page, l))) assert.doesNotMatch(it.q + it.a, /\{\w+\}/, `${l} ${page}`);
    }
  }
  for (const l of LOCALES) assert.equal(msg(l).inhalt.beratung.faq.items.length, 7, l);
});

test("FAQ + Fakten: Claim-Guard, keine Heilversprechen, keine Preise, kein Gründungsjahr/Fläche", () => {
  for (const l of LOCALES) {
    const texts = [];
    for (const page of PAGES) for (const it of faqItemsFrom(msg(l).seoGeo.faq[page].items, varsFor(page, l))) texts.push(it.q, it.a);
    for (const it of msg(l).inhalt.beratung.faq.items.slice(4)) texts.push(it.q, it.a);
    const f = msg(l).seoGeo.facts;
    for (const v of Object.values(f)) texts.push(fillVars(v, aboutVars(l)));
    for (const g of dealerGroups(l)) texts.push(g.text);
    for (const t of texts) {
      assert.deepEqual(findClaims(t, { locale: l }), [], `${l}: ${t}`);
      assert.doesNotMatch(t, HEAL, `${l}: ${t}`);
      assert.doesNotMatch(t, PRICE, `${l}: ${t}`);
      assert.doesNotMatch(t, BAN, `${l}: ${t}`);
      assert.doesNotMatch(t, /!/, `${l}: ${t}`);
    }
    // Wellness: keine Showroom-/Ausstellungs-Aussage (Inhaber-Entscheidung Nr. 19).
    const bw = JSON.stringify(msg(l).seoGeo.faq.badWellness);
    assert.doesNotMatch(bw, /showroom|ausstellung|exposition|esposizione/i, l);
    // Agape ohne Händlerwort: der Händlersatz kommt nur aus dem Claim-Guard.
    assert.doesNotMatch(dealerStatementList(DEALER_MARKEN, l), /Agape/, l);
  }
});

test("Café-Daten: eigene Nummer und Zeiten, nicht die des Showrooms", () => {
  const v = aboutVars("de");
  assert.equal(v.cafePhone, "+43 5574 46257");
  assert.notEqual(v.cafePhone, PHONE_DISPLAY);
  assert.equal(cafeHoursLine("de").endsWith("09:00–24:00"), true);
  assert.notEqual(cafeHoursLine("de"), openingHoursLine("de"));
  assert.equal(v.closed, "Montag");
});

test("Fakten: Sprachen aus contactPoint, Minotti mit Beleg-Link, Händlergruppen nur belegt", () => {
  assert.equal(advisoryLanguages("de"), "Deutsch, Englisch, Italienisch und Französisch");
  const m = minottiFact("de");
  assert.match(m.statement, /2019/);
  assert.match(m.evidenceUrl, /^https:\/\/www\.minotti\.com\//);
  const all = dealerGroups("de").map((g) => g.text).join(" ");
  for (const b of ["Poliform", "Rimadesio", "Agape", "Paola Lenti"]) assert.doesNotMatch(all, new RegExp(b), b);
  for (const b of ["ClassiCon", "Ezarri", "Starpool", "Gaggenau", "Riedel"]) assert.match(all, new RegExp(b), b);
});

test("FAQPage aus denselben Einträgen", () => {
  const items = faqItemsFrom([{ q: "Frage?", a: "Antwort {x}." }, { q: "", a: "leer" }], { x: "eins" });
  assert.deepEqual(items, [{ q: "Frage?", a: "Antwort eins." }]);
  const s = faqPageSchema("https://platzhirsch.studio/de/bad-wellness", "de", items);
  assert.equal(s["@type"], "FAQPage");
  assert.equal(s["@id"], "https://platzhirsch.studio/de/bad-wellness#faq");
  assert.equal(s.mainEntity[0].acceptedAnswer.text, "Antwort eins.");
  assert.equal(faqPageSchema("x", "de", []), null);
  // Einbindung: je Seite genau ein SeoFaq.
  for (const f of ["src/components/BadWellness/BadWellnessPage.js", "src/components/Kuechengeraete/KuechengeraetePage.js", "src/app/[locale]/ueber-uns/platzhirsch/page.js"]) {
    assert.equal((read(f).match(/<SeoFaq /g) || []).length, 1, f);
  }
});
