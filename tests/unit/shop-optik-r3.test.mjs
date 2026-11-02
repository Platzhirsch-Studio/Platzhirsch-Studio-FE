// tests/unit/shop-optik-r3.test.mjs
// Optik-QA Shop r2 → Fixes (01.11.2026, dritte Runde): Zalto-Kachelbilder, Grundpreis nur bei Pflicht,
// Preisformat, Versalien, Umbrüche, Plural-Kategorien, Fußnote „USt.“, Auswahlfelder, Rechtstexte.
// node --test tests/unit/shop-optik-r3.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const NB = " ";
const WJ = "⁠";

test("Zalto: Kachel, Warenkorb und Zuletzt angesehen nutzen die helle „-frei“-Fassung", async () => {
  const { studioFassung } = await import("../../src/components/Katalog/studioFond.js");
  assert.equal(studioFassung("/Images/Wellness/produkte/zalto/zalto-cask-1.webp", "zalto", "frei"), "/Images/Wellness/produkte/zalto/zalto-cask-1-frei.webp");
  assert.match(read("src/lib/shop/catalog.js"), /studioFassung\(p\.bilder\?\.\[0\]\?\.src, p\.marke, "frei"\)/);
  assert.match(read("src/components/Katalog/ReservierenSlot.js"), /studioFassung\(roh, p\.marke, "frei"\)/);
  assert.match(read("src/components/Katalog/ShopProduktDetail.js"), /image: studioFassung\(/);
});

test("Warenkorb: Grundpreis nur bei Grundpreis-Pflicht (kein „€ … / 1 l“ beim Weinglas)", async () => {
  const { priceCart } = await import("../../src/lib/shop/cart.js");
  const glas = { slug: "test-glas", marke: "riedel", name: "Glas", kategorie: "glas", bilder: [], preis: { art: "verkaufspreis", stand: "2026-10-31", quelle: "https://example.invalid", betrag: 54.1 }, inhaltMl: 960 };
  const out = priceCart([{ slug: "test-glas", variante: "standard", menge: 1 }], { heute: "2026-11-01", mode: "test", produkte: [glas], testartikel: [] });
  if (out.zeilen.length) assert.equal(out.zeilen[0].grundpreis, null);
  assert.match(read("src/lib/shop/cart.js"), /grundpreis: item\.grundpreisPflicht \? grundpreis\(/);
});

test("Preisformat im Shop: „€ 119“ ohne ,00 (wie Produktseite und Kachel), Cent nur wenn vorhanden", async () => {
  const { euroKurz, euro } = await import("../../src/lib/shop/format.js");
  assert.equal(euroKurz(11900).replace(/\s/g, " "), "€ 119");
  assert.equal(euroKurz(4610).replace(/\s/g, " "), "€ 46,10");
  assert.equal(euro(11900).replace(/\s/g, " "), "€ 119,00", "euro() bleibt für Mail/Rechnung");
  for (const f of ["src/components/Shop/MiniCart.js", "src/components/Shop/ShopCart.js"]) assert.ok(read(f).includes('import { euroKurz as euro } from "@/lib/shop/format";'), f);
});

test("Mini-Warenkorb: Bestätigung mit gemischter Schreibung, Zeile bleibt bei Ladefehler, Zeitlimit", () => {
  const m = read("src/components/Shop/MiniCart.js");
  assert.ok(m.includes("fill(c.drawerAdded, { name: shopTitel(zeile.name) })"));
  assert.ok(m.includes("(!ready || state.failed) && cart.length > 0 && added.vorschau"));
  assert.ok(m.includes("PREIS_TIMEOUT_MS = 15000"));
  assert.ok(m.includes("varianteZeile(zeile.varianteName)"));
  const c = read("src/components/Shop/ShopCart.js");
  assert.ok(c.includes('post("/api/shop/versand", { cart, locale }, PREIS_TIMEOUT_MS)'));
  assert.doesNotMatch(c, /post\("\/api\/shop\/checkout"[^)]*PREIS_TIMEOUT_MS/, "Bestellung ohne Zeitlimit");
});

test("Versalien: bekannte dreibuchstabige Wörter und Genitiv-S, Kürzel bleiben", async () => {
  const { shopTitel, ohneVersalien } = await import("../../src/components/Katalog/shopTitel.js");
  assert.equal(shopTitel("Duftkerze I LOVE SKI"), "Duftkerze I Love Ski");
  assert.equal(shopTitel("EAGLE'S PRIDE SITTING BULL"), "Eagle's Pride Sitting Bull");
  assert.equal(shopTitel("FAR WEST Duftkerze"), "Far West Duftkerze");
  assert.equal(shopTitel("Calamity Jane THE PLAINS"), "Calamity Jane The Plains");
  assert.equal(ohneVersalien("MAX 16 LED USB-C MFB"), "MAX 16 LED USB-C MFB");
  assert.equal(ohneVersalien("CLASSIQUE: Höhe 10 cm"), "Classique: Höhe 10 cm");
});

test("Umbrüche: „2er-Karton“, „Hersteller-Shop“, „E-Mail“, „z. B.“ bleiben zusammen", async () => {
  const { shopTitel, keinBindestrichUmbruch } = await import("../../src/components/Katalog/shopTitel.js");
  assert.equal(shopTitel("2er-Karton"), `2er-${WJ}Karton`);
  assert.equal(keinBindestrichUmbruch("Preis laut Hersteller-Shop Österreich"), `Preis laut Hersteller-${WJ}Shop Österreich`);
  const { rechtUmbruch } = await import("../../src/components/Shop/keinUmbruch.js");
  assert.equal(rechtUmbruch("per E-Mail (z. B. Brief)"), `per E-${WJ}Mail (z.${NB}B. Brief)`);
  const d = read("src/components/Katalog/ShopProduktDetail.js");
  assert.ok(d.includes("keinBindestrichUmbruch(t(\"preis.stand\""), "kein doppeltes „Preis Österreich · Preis laut …“");
  assert.doesNotMatch(d, /\$\{pt\.land\} · \$\{t\("preis\.stand"/);
});

test("Kategorien im Plural, Fußnote „USt.“ mit Bildband-Satz, Beratungstext statt Hero-Lead", async () => {
  const { kategoriePlural, startCopy } = await import("../../src/lib/shop/startCopy.js");
  assert.equal(kategoriePlural("de", "duftkerze", "Duftkerze"), "Duftkerzen");
  assert.equal(kategoriePlural("en", "glas", "Glass"), "Glasses");
  assert.equal(kategoriePlural("de", "sauna", "Sauna"), "Sauna", "fremde Welten: Katalog-Bezeichnung");
  for (const l of ["de", "en", "fr", "it"]) {
    const c = startCopy(l);
    assert.ok(c.preiseHinweis.includes("10"), `${l}: ermäßigter Satz genannt`);
    assert.ok(c.beratungTextMarke.includes("{marke}"), l);
    assert.doesNotMatch(c.beratungText + c.beratungTextMarke, /händler|dealer|revendeur|rivenditore|offiziell|best|beste/i, l);
  }
  assert.doesNotMatch(startCopy("de").preiseHinweis, /MwSt/);
  const liste = read("src/components/Katalog/AccessoiresListe.js");
  assert.ok(liste.includes("{sc.preiseHinweis}"));
  assert.doesNotMatch(liste, /hinweis\.preiseAccessoires/);
  assert.doesNotMatch(liste, /text=\{t\(`\$\{wk\}\.produkteLead`\)\}/);
  const start = read("src/components/ShopStart/ShopStartseite.js");
  assert.ok(start.includes("{c.preiseHinweis}"));
  assert.doesNotMatch(start, /hinweis\.preiseAccessoires/);
});

test("Shop-Startseite: Kachelbilder Parfum/Geschenke gesetzt, „Für den Tisch“ zählt das Linkziel", async () => {
  const { ABTEILUNG_BILD, abteilungen, edits } = await import("../../src/lib/shop/shopStart.js");
  const g = abteilungen();
  for (const [id, slug] of Object.entries(ABTEILUNG_BILD)) {
    const a = g.find((x) => x.id === id);
    if (a) assert.equal(a.bildProdukt?.slug, slug, id);
  }
  const geschenke = edits().find((e) => e.id === "geschenke");
  if (geschenke) assert.notEqual(g.find((x) => x.id === "geschenke")?.bildProdukt?.slug, geschenke.produkte[0]?.slug, "nicht dasselbe Bild wie die erste Geschenk-Kachel");
  assert.ok(read("src/components/ShopStart/ShopStartseite.js").includes("c.editMehr(katPlural(tischZiel(e)), zahl(alle.filter((p) => p.kategorie === tischZiel(e)).length))"));
});

test("Auswahlfelder eckig in WebKit (appearance-none, eigener Pfeil)", async () => {
  const { AUSWAHL_KLASSE } = await import("../../src/components/Shop/AuswahlFeld.js").catch(() => ({ AUSWAHL_KLASSE: read("src/components/Shop/AuswahlFeld.js") }));
  assert.match(AUSWAHL_KLASSE, /appearance-none rounded-none/);
  assert.doesNotMatch(read("src/components/Shop/ShopCart.js"), /<select/);
  assert.doesNotMatch(read("src/components/Katalog/ShopGrid.js").replace(/^\s*\/\/.*$/gm, ""), /<select/);
  assert.ok(read("src/components/ShopStart/ShopSubHeader.js").includes("[&::-webkit-search-cancel-button]:appearance-none"));
});

test("Warenkorb: Schritt 1 bis zur ersten Lieferangabe, keine klebende Leiste bei ≤ 500 px Höhe", () => {
  const c = read("src/components/Shop/ShopCart.js");
  assert.ok(c.includes("const schritt = !lieferungBegonnen ? 1 : !lieferungFertig ? 2 : !angabenFertig ? 3 : 4;"));
  assert.ok(c.includes("lg:hidden [@media(max-height:500px)]:hidden"));
});

test("Rechtstexte: Datum deutsch, Platzhalter als markierte Lücke, keine hängende Klammer", () => {
  const p = read("src/app/[locale]/shop/recht/[slot]/page.js");
  assert.ok(p.includes('Stand {formatDatum(s.stand, "de")}'));
  assert.ok(p.includes("data-shop-recht-luecke"));
  assert.ok(p.includes("[hanging-punctuation:none]"));
});
