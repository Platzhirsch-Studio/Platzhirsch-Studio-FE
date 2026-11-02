// tests/unit/shop-optik-r4.test.mjs
// Shop – Nachbesserung zur Optik-QA r3 (200 % Textzoom, Warenkorb-Raster, Versand-Automatik,
// Gravitas-Omega-Bild, Rechtstexte, Kopfleiste). node --test tests/unit/shop-optik-r4.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const NB = " ";

test("Gravitas Omega: keine „-frei“-Fassung (Kelchkante ging verloren), Bühne 5x4 bleibt", async () => {
  const { studioFassung } = await import("../../src/components/Katalog/studioFond.js");
  const om = "/Images/Wellness/produkte/zalto/zalto-gravitas-omega-1.webp";
  assert.equal(studioFassung(om, "zalto", "frei"), null, "Kachel/Warenkorb zeigen das Original");
  assert.equal(studioFassung(om, "zalto", "5x4"), "/Images/Wellness/produkte/zalto/zalto-gravitas-omega-1-5x4.webp");
  assert.equal(studioFassung("/Images/Wellness/produkte/zalto/zalto-burgunder-1.webp", "zalto", "frei"), "/Images/Wellness/produkte/zalto/zalto-burgunder-1-frei.webp");
});

test("shopTitel: Klammerzusatz bleibt beisammen, „NO.25“ → „No. 25“", async () => {
  const { shopTitel, klammerSchutz } = await import("../../src/components/Katalog/shopTitel.js");
  assert.ok(shopTitel("Vorteilspack 8 Stück (8 kaufen, 6 bezahlen)").endsWith(`(8${NB}kaufen,${NB}6${NB}bezahlen)`));
  assert.equal(klammerSchutz("Glas (ein sehr langer Klammerzusatz, der umbrechen darf)"), "Glas (ein sehr langer Klammerzusatz, der umbrechen darf)");
  assert.equal(shopTitel("Tealight holder NO.25"), `Tealight holder No.${NB}25`);
  assert.equal(klammerSchutz(null), null);
});

test("Rechtstexte: Postleitzahl und Ort ohne Umbruch, keine internen Notizen, keine doppelte Überschrift", async () => {
  const { rechtUmbruch } = await import("../../src/components/Shop/keinUmbruch.js");
  assert.match(rechtUmbruch("Landstraße 5, 6911 Lochau"), /, 6911[  ]Lochau$/);
  assert.match(rechtUmbruch("D-88131 Lindau"), /^D-88131[  ]Lindau$/);
  const page = read("src/app/[locale]/shop/recht/[slot]/page.js");
  assert.ok(!page.includes("Anmerkung (intern"), "interne Notiz nie sichtbar");
  assert.ok(!page.includes("Offen (vor Livegang): {"));
  assert.ok(page.includes("b.h === titel ? null"));
});

test("Warenkorb: Leiste entfällt ab 25 % Bildschirmhöhe, Tarif-Schlüssel ohne Adresszusatz", async () => {
  const src = read("src/components/Shop/ShopCart.js");
  // Reine Hilfen aus dem Quelltext prüfen (die Datei ist eine Client-Insel mit "@/"-Importen).
  const zuHoch = new Function(`return ${/export const leisteZuHoch = (\([^)]*\) => [^;]+);/.exec(src)[1]}`)();
  assert.equal(zuHoch(340, 852), true, "200 % Textzoom: ~40 %");
  assert.equal(zuHoch(90, 667), false, "normale Schrift");
  assert.equal(zuHoch(90, 0), false);
  const schluessel = new Function(`return ${/export const tarifSchluessel = (\(a\) => [^;]+);/.exec(src)[1]}`)();
  const a = { land: "AT", plz: "6900", ort: "Bregenz", strasse: "Musterstrasse", hausnr: "12", zusatz: "" };
  assert.equal(schluessel(a), schluessel({ ...a, zusatz: "Top 3" }), "Zusatz ändert den Tarif nicht");
  assert.notEqual(schluessel(a), schluessel({ ...a, plz: "6911" }));
  // Veraltete Antworten werden verworfen (sonst blieb die Kasse nach schnellen Eingaben ohne Tarif hängen).
  assert.ok(src.includes("if (key !== neuesterKey.current) return;"));
  assert.ok(src.includes("{wartetAuto ? c.shippingCalculating : c.whyDisabled}"));
  assert.ok(src.includes("{versandFehler && ("), "Knopf „Versandkosten berechnen“ nur noch als Rückfall");
  assert.ok(src.includes('lieferart === "abholung" ? c.pickupNoShipping'));
  assert.ok(src.includes("grid-cols-[min(5rem,22vw)_minmax(0,1fr)]"), "Zeilenraster, Bild max. 22vw");
  assert.ok(!src.includes("max-sm:-ml-24"), "Auswahlfeld ohne negativen Rand");
  assert.ok(src.includes('<dd className="ml-auto shrink-0 whitespace-nowrap tabular">'));
});

test("Shop-Texte: neue Schlüssel in allen Sprachen", async () => {
  const { SHOP_COPY } = await import("../../src/lib/shop/copy.js");
  for (const l of ["de", "en", "fr", "it"]) {
    assert.ok(SHOP_COPY[l].shippingCalculating, l);
    assert.ok(SHOP_COPY[l].pickupNoShipping, l);
  }
  assert.equal(SHOP_COPY.de.pickupNoShipping, "entfällt");
});

test("Kopfleiste: aktiver Chip sichtbar, Maske nur bei Überlauf, kompakt per Container-Query", async () => {
  const { scrollZiel, ueberlauf } = await import("../../src/components/ShopStart/ShopNavCurrent.js").catch(() => ({}));
  if (scrollZiel) {
    assert.equal(scrollZiel({ links: 10, rechts: 100, scrollLeft: 0, breite: 300 }), null);
    assert.equal(scrollZiel({ links: 320, rechts: 420, scrollLeft: 0, breite: 300 }), 300);
    assert.equal(ueberlauf({ scrollLeft: 0, breite: 300, gesamt: 600 }), true);
    assert.equal(ueberlauf({ scrollLeft: 300, breite: 300, gesamt: 600 }), false);
    assert.equal(ueberlauf({ scrollLeft: 0, breite: 1120, gesamt: 1150, polster: 40 }), false, "nur der Endabstand ragt hinaus");
  }
  const s = read("src/components/ShopStart/ShopSubHeader.js");
  assert.ok(s.includes("@container/shopnav"));
  assert.ok(s.includes("data-[ueberlauf]:[mask-image:linear-gradient(to_right"));
  assert.ok(s.includes("sm:[@media(min-height:501px)]:@min-[44rem]/shopnav:flex"));
  assert.ok(s.includes("[@media(max-height:500px)]:contents"), "Telefon quer: eine Zeile");
});

test("200 % Textzoom: feste Spalte im Hero, Container-Raster, Sortierfeld volle Breite, keine Silbentrennung in der H1", () => {
  const start = read("src/components/ShopStart/ShopStartseite.js");
  assert.ok(start.includes("grid grid-cols-1 gap-8 lg:mt-stack-m"));
  assert.ok(!start.includes("hyphens-auto"), "Firefox trennte „Re-gal“ in der Display-H1");
  const grid = read("src/components/Katalog/ShopGrid.js");
  assert.ok(grid.includes("grid ${RASTER_LISTE}"));
  assert.ok(grid.includes('<div className="@container" data-kat-shopgrid'));
  assert.ok(grid.includes("@max-[18rem]:w-full"));
  assert.ok(!grid.includes("bg-surface/95"), "deckende Filterleiste");
  const tabs = read("src/components/CartPage/SelectionTabs.js");
  assert.ok(tabs.includes("flex flex-wrap gap-x-6"));
});

test("Produktseite: Kategorie im Plural, Telefon quer zweispaltig, Merkmale mit Kommas", () => {
  const p = read("src/components/Katalog/ShopProduktDetail.js");
  assert.ok(p.includes("const katListe = kategoriePlural(locale, p.kategorie, kat);"));
  assert.ok(p.includes('c.mehrAus.replace("{kategorie}", katListe)'));
  assert.ok(p.includes("[@media(min-width:640px)_and_(max-height:500px)]:grid-cols-12"));
  assert.ok(p.includes("massText(textOf(m, locale))"));
});
