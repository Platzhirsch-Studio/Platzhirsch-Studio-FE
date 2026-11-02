// tests/unit/katalog-meta.test.mjs – Snippets der Katalogseiten (Qualität 01.11.2026, Crawl).
// Run: node --test --test-reporter=tap tests/unit/katalog-meta.test.mjs
//
// Prüft: (1) Marken/Kategorien in mehreren Welten bekommen je Welt einen
// eigenen <title> (Dornbracht, „armatur“ unter /bad-wellness und
// /kuechengeraete); (2) jede Produkt-Description in Bad & Wellness und
// Küchengeräten hat in allen vier Sprachen ≥ 70 Zeichen (nach clampDescription ≤ 150).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { weltTitel, letzterSatz, produktBeschreibung, BESCHREIBUNG_MIN } = await import("../../src/components/Katalog/katalogMeta.js");
const { produkteByWelt, produkteByMarke, produkteByKategorie, markenMitProdukten, kategorienMitProdukten, markeBySlug } = await import("../../src/lib/katalog/index.js");
const { kategorieKey, textOf } = await import("../../src/lib/katalog/schema.js");
const { WELTEN, WELT_IDS } = await import("../../src/lib/katalog/welten.js");
const { fitTitle, clampDescription } = await import("../../src/lib/seo/pageMetadata.js");

const LOCALES = ["de", "en", "fr", "it"];
const msgs = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, `src/messages/${l}.json`), "utf8")).katalog]));
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
const SUFFIX = " | Platzhirsch";
const andere = (welt) => WELT_IDS.filter((w) => w !== welt);

test("weltTitel: ohne Mehrfach-Welt unverändert, sonst mit Weltname, zu lang ohne „Produkte“", () => {
  assert.equal(weltTitel({ basis: "Agape – Produkte", name: "Agape", welt: "Bad & Wellness", mehrereWelten: false }), "Agape – Produkte");
  assert.equal(weltTitel({ basis: "Dornbracht – Produkte", name: "Dornbracht", welt: "Bad & Wellness", mehrereWelten: true }), "Dornbracht – Produkte – Bad & Wellness");
  assert.equal(
    weltTitel({ basis: "Robinetterie – produits", name: "Robinetterie", welt: "Salle de bains & bien-être", seitenText: " – Page 2", mehrereWelten: true }),
    "Robinetterie – Salle de bains & bien-être – Page 2"
  );
});

test("produktBeschreibung: kurz genug bleibt, zu kurz bekommt den Zusatzsatz", () => {
  const lang = "Ein Satz, der lang genug ist und deshalb ohne jeden Zusatz als Beschreibung bleibt.";
  assert.ok(lang.length >= BESCHREIBUNG_MIN);
  assert.equal(produktBeschreibung(lang, "Zusatz."), lang);
  // erster passender Satz der Liste; zu lange (> 150) werden übersprungen
  assert.equal(produktBeschreibung("Kurz.", ["Noch kurz.", "Ein zweiter Satz, mit dem die Beschreibung die Mindestlänge von siebzig Zeichen erreicht."]), "Kurz. Ein zweiter Satz, mit dem die Beschreibung die Mindestlänge von siebzig Zeichen erreicht.");
  assert.equal(produktBeschreibung("Kurz.", ["y".repeat(160) + "."]), "Kurz.");
  assert.equal(produktBeschreibung("Miroir USB d’antoniolupi.", "Nous intégrons le bon produit à votre espace."), "Miroir USB d’antoniolupi. Nous intégrons le bon produit à votre espace.");
  assert.equal(produktBeschreibung("Ohne Punkt", "Satz."), "Ohne Punkt. Satz.");
  assert.equal(letzterSatz("A: eins. Wir planen das."), "Wir planen das.");
});

test("Titel je Welt eindeutig (Marken und Kategorien, alle Sprachen, nach fitTitle)", () => {
  for (const locale of LOCALES) {
    const m = msgs[locale];
    const seen = new Map();
    const add = (title, where) => {
      const t = fitTitle(title);
      assert.ok(!seen.has(t), `${locale}: doppelter Titel "${t}" (${seen.get(t)} / ${where})`);
      seen.set(t, where);
    };
    for (const welt of ["bad-wellness", "kuechengeraete"]) {
      const crumb = m.welt[WELTEN[welt].key].crumb;
      for (const mk of markenMitProdukten(welt)) {
        const mehr = andere(welt).some((w) => produkteByMarke(mk.slug, w).length > 0);
        add(weltTitel({ basis: fmt(m.marke.title, { marke: mk.name }), name: mk.name, welt: crumb, mehrereWelten: mehr }) + SUFFIX, `${welt}/marke/${mk.slug}`);
      }
      for (const k of kategorienMitProdukten(welt)) {
        const kat = m.kategorie[kategorieKey(k)];
        const mehr = andere(welt).some((w) => produkteByKategorie(w, k).length > 0);
        add(weltTitel({ basis: fmt(m.kategorieSeite.title, { kategorie: kat }), name: kat, welt: crumb, mehrereWelten: mehr }) + SUFFIX, `${welt}/kategorie/${k}`);
      }
    }
  }
});

test("Produkt-Descriptions Bad & Wellness / Küchengeräte: ≥ 70 und ≤ 150 Zeichen in allen Sprachen", () => {
  const kurzListe = [];
  for (const locale of LOCALES) {
    const m = msgs[locale];
    for (const welt of ["bad-wellness", "kuechengeraete"]) {
      for (const p of produkteByWelt(welt)) {
        const kat = m.kategorie[kategorieKey(p.kategorie)];
        // gleiche Sätze wie produktZusatz() in katalogRoutes.js
        const beratung = letzterSatz(fmt(m.marke.lead, { marke: markeBySlug(p.marke).name }));
        const zusatz = welt === "kuechengeraete" ? [m.liste.interlude1, m.liste.interlude3, beratung] : [letzterSatz(fmt(m.kategorieSeite.lead, { kategorie: kat })), beratung];
        // wie buildPageMetadata: danach noch einmal clampDescription
        const d = clampDescription(produktBeschreibung(textOf(p.kurz, locale), zusatz));
        if (d.length < BESCHREIBUNG_MIN || d.length > 150) kurzListe.push(`${locale} ${p.slug} (${markeBySlug(p.marke)?.name}): ${d.length}`);
      }
    }
  }
  assert.deepEqual(kurzListe, []);
});
