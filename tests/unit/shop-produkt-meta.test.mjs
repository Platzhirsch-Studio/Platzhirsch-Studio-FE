// node --test tests/unit/shop-produkt-meta.test.mjs
// Shop-Produktseiten /accessoires/produkte/<slug> (Crawl 01.11.2026):
// eindeutige <title> bei gleichnamigen Artikeln, Meta-Descriptions ≥ 70 Zeichen
// nur aus Katalogdaten (src/app/[locale]/accessoires/produkte/[slug]/shopMeta.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { metaBeschreibung, shopTitel, titelZusatz } from "../../src/app/[locale]/accessoires/produkte/[slug]/shopMeta.js";
import { markeBySlug, produktBySlug, produkteByWelt } from "../../src/lib/katalog/index.js";
import { KATALOG_LOCALES, kategorieKey, textOf } from "../../src/lib/katalog/schema.js";
import { META_DESCRIPTION_MAX, META_TITLE_MAX, fitTitle } from "../../src/lib/seo/pageMetadata.js";

const LISTE = produkteByWelt("accessoires");
const msgs = Object.fromEntries(KATALOG_LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(new URL(`../../src/messages/${l}.json`, import.meta.url), "utf8"))]));

const kat = (locale) => (p) => msgs[locale].katalog.kategorie[kategorieKey(p.kategorie)];
const titelVon = (locale) => shopTitel(LISTE, { markeName: (p) => markeBySlug(p.marke).name, kategorie: kat(locale) });
const beschreibung = (p, locale) => metaBeschreibung({ kurz: textOf(p.kurz, locale), name: p.name, merkmale: (p.merkmale || []).map((x) => textOf(x, locale)), locale });

test("Riedel Merlot Dekanter: Einzelstück ohne Zusatz, Restaurant-Set mit „Restaurant“", () => {
  assert.equal(titelZusatz(produktBySlug("riedel-merlot-dekanter"), LISTE), "");
  assert.equal(titelZusatz(produktBySlug("riedel-merlot-dekanter-maschinell-gefertigt-restaurant"), LISTE), "Restaurant");
  assert.equal(titelZusatz(produktBySlug("riedel-all-american-bourbon-glas-vinum-restaurant"), LISTE), "Restaurant");
  assert.equal(titelZusatz(produktBySlug("cire-trudon-kleine-duftkerzen-set-belles-matieres"), LISTE), "Belles Matieres");
  assert.equal(titelZusatz(produktBySlug("baobab-collection-scented-candle-likaah"), LISTE), "");
});

test("keine doppelten Titel im Shop, in keiner Sprache, alle ≤ 60 Zeichen und stabil unter fitTitle", () => {
  for (const locale of KATALOG_LOCALES) {
    const titel = titelVon(locale);
    assert.equal(titel.size, LISTE.length);
    const seen = new Map();
    for (const [slug, t] of titel) {
      assert.ok(!seen.has(t), `${locale}: „${t}“ bei ${seen.get(t)} und ${slug}`);
      assert.ok(t.length <= META_TITLE_MAX, `${locale} ${slug}: ${t.length}`);
      assert.equal(fitTitle(t), t, "buildPageMetadata kürzt nicht weiter");
      seen.set(t, slug);
    }
  }
  const de = titelVon("de");
  assert.equal(de.get("riedel-merlot-dekanter-maschinell-gefertigt-restaurant"), "Riedel Merlot Dekanter Restaurant – Karaffe | Platzhirsch");
  assert.equal(de.get("assouline-bahrain-pearls-treasures-from-the-land-of-two-seas-ultimate"), "Assouline Bahrain Pearls (Ultimate)");
  assert.equal(de.get("assouline-bahrain-pearls-treasures-from-the-land-of-the-two-seas"), "Assouline Bahrain Pearls (Classic)");
});

test("jede Meta-Description hat 70–150 Zeichen", () => {
  for (const locale of KATALOG_LOCALES) {
    for (const p of LISTE) {
      const d = beschreibung(p, locale);
      assert.ok(d.length >= 70 && d.length <= META_DESCRIPTION_MAX, `${locale} ${p.slug}: ${d.length} „${d}“`);
    }
  }
});

test("metaBeschreibung: langer Kurztext bleibt unverändert, kurzer bekommt Name, Merkmale, Schlusssatz", () => {
  const lang = "Duftkerze aus der Linie Sand von Baobab Collection. Duftfamilie holzig, mit Zedernholz.";
  assert.equal(metaBeschreibung({ kurz: lang, name: "X", locale: "de" }), lang);
  assert.equal(
    metaBeschreibung({ kurz: "Streichhölzer von Baobab Collection.", name: "Matches Paris", locale: "de" }),
    "Matches Paris: Streichhölzer von Baobab Collection. Produktdetails und Herstellerangaben bei Platzhirsch Home Living."
  );
  const mitMerkmal = metaBeschreibung({ kurz: "Set aus drei Reisekerzen von Baobab Collection.", name: "Trio", merkmale: ["Höhe 6 cm · bis zu 20 Stunden Brenndauer"], locale: "de" });
  assert.equal(mitMerkmal, "Trio: Set aus drei Reisekerzen von Baobab Collection. Höhe 6 cm · bis zu 20 Stunden Brenndauer.");
  assert.match(metaBeschreibung({ kurz: "Allumettes de Baobab Collection.", name: "Matches Brussels", locale: "fr" }), /chez Platzhirsch Home Living\.$/);
});
