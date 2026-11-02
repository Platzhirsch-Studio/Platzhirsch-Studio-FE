// tests/unit/shop-kachel-rahmen.test.mjs
// Shop-Kachel: gleicher 4:5-Rahmen für alle; Marken mit eigenem Studiogrund (Zalto) ohne
// Innenabstand/multiply, damit kein graues Rechteck in der Kachel steht. Bilder unbeschnitten.
// node --test tests/unit/shop-kachel-rahmen.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../../src/components/Katalog/ShopKachel.js", import.meta.url), "utf8");

test("einheitlicher 4:5-Rahmen", () => {
  assert.match(src, /relative aspect-\[4\/5\] overflow-hidden/);
});

test("Studiogrund-Marken (Zalto): helle „-frei“-Fassung wie ein Freisteller (Optik-QA r2), Bühne 5:4", async () => {
  const { STUDIO_FOND, studioFassung } = await import("../../src/components/Katalog/studioFond.js");
  assert.ok(STUDIO_FOND.has("zalto"));
  const z = "/Images/Wellness/produkte/zalto/zalto-burgunder-1.webp";
  assert.equal(studioFassung(z, "zalto", "4x5"), "/Images/Wellness/produkte/zalto/zalto-burgunder-1-4x5.webp");
  assert.equal(studioFassung(z, "zalto", "5x4"), "/Images/Wellness/produkte/zalto/zalto-burgunder-1-5x4.webp");
  assert.equal(studioFassung("/Images/Wellness/produkte/zalto/zalto-axium-2.webp", "zalto", "4x5"), null, "nur Hauptbilder");
  assert.equal(studioFassung("/Images/Wellness/produkte/riedel/x-1.webp", "riedel", "4x5"), null);
  assert.equal(studioFassung(null, "zalto", "4x5"), null);
  assert.equal(studioFassung(z, "zalto", "frei"), "/Images/Wellness/produkte/zalto/zalto-burgunder-1-frei.webp");
  // Jede Zalto-Hauptdatei hat beide Fassungen auf der Platte, exakt 4:5 bzw. 5:4 breit.
  const dir = new URL("../../public/Images/Wellness/produkte/zalto/", import.meta.url);
  const haupt = fs.readdirSync(dir).filter((f) => f.endsWith("-1.webp"));
  assert.ok(haupt.length >= 22);
  for (const f of haupt) for (const fmt of ["4x5", "5x4", "frei"]) assert.ok(fs.existsSync(new URL(f.replace(".webp", `-${fmt}.webp`), dir)), `${f} → ${fmt}`);
  for (const s of [
    'const BILD_STUDIO = "object-contain mix-blend-multiply";',
    'const BILD_FREI = "object-contain p-[6%] mix-blend-multiply";',
    'studioFassung(original, e.m, "frei") || original',
    "${bildKlasse(false)}",
  ])
    assert.ok(src.includes(s), s);
});

test("Badges: nie auf der Bildfläche (Optik-QA r3), Textzeile unter dem Bild auf allen Breiten; Preiszeile reserviert", () => {
  assert.ok(!src.includes("absolute top-2 left-2"), "kein Overlay über dem Produkt");
  assert.doesNotMatch(src, /className="[^"]*line-clamp/, "Namen nie gekappt (WebKit kappte nach dem ersten Block)");
  for (const s of [
    'className="min-h-[1lh] text-small text-text-soft" data-kat-badges=""',
    '{badges.join(" · ") || null}',
    "e.a && !ohneAuswahl ? copy.badgeAuswahl : null",
    "const preisZeile = preis || (e.o === 0 ? copy.badgeAnfrage : null)",
    "min-h-[1lh] tabular",
  ])
    assert.ok(src.includes(s), s);
});

test("shopTitel: Versalien gemischt, Markenschreibweisen bleiben, Gedankenstrich", async () => {
  const { shopTitel, ohneVersalien } = await import("../../src/components/Katalog/shopTitel.js");
  assert.equal(shopTitel("Duftkerze SAND SILOLI"), "Duftkerze Sand Siloli");
  assert.equal(shopTitel("GESCHENKBOX-ZUBEHÖR KERZENLÖSCHER DOCHTSCHERE SCHWARZ"), "Geschenkbox-Zubehör Kerzenlöscher Dochtschere Schwarz");
  assert.equal(ohneVersalien("GRAPE@RIEDEL Martini"), "GRAPE@RIEDEL Martini");
  assert.equal(ohneVersalien("FATTO A MANO BY RIEDEL Syrah"), "FATTO A MANO BY RIEDEL Syrah");
  assert.equal(ohneVersalien("Cognac VSOP · LED · USB-C · MFB"), "Cognac VSOP · LED · USB-C · MFB");
  assert.equal(ohneVersalien(null), null);
});

test("shopTitel: freistehender Strich nie am Zeilenanfang, Zeichen unverändert", async () => {
  const { shopTitel } = await import("../../src/components/Katalog/shopTitel.js");
  const NB = " ";
  assert.equal(shopTitel("Die klassische Kerze - Cabinet des miroirs"), `Die klassische Kerze${NB}– Cabinet des miroirs`, "Halbgeviertstrich, nie am Zeilenanfang");
  assert.equal(shopTitel("Buch – Heart of Glass"), `Buch${NB}– Heart of Glass`);
  assert.equal(shopTitel("Geschenkbox-Zubehör"), "Geschenkbox-Zubehör", "Bindestrich im Wort bleibt");
  assert.equal(shopTitel("Karaffe 60 x 60 cm").replace(/ /g, " "), "Karaffe 60 x 60 cm");
  assert.equal(shopTitel(""), "");
  // Optik-QA r2: Kachel und H1 setzen den Zusatz nach „ – “ in eine eigene Zeile (titelTeile).
  const { titelTeile } = await import("../../src/components/Katalog/shopTitel.js");
  assert.deepEqual(titelTeile("Die klassische Kerze - Cabinet des miroirs"), { haupt: "Die klassische Kerze", zusatz: "Cabinet des miroirs" });
  assert.deepEqual(titelTeile("Geschenkbox-Zubehör"), { haupt: "Geschenkbox-Zubehör", zusatz: null });
  assert.match(src, /const titel = titelTeile\(e\.n\);/);
  assert.ok(src.includes('<span className="sr-only"> – </span>'));
});

test("trennerSchutz: Mittelpunkt-Trenner in Merkmalen nie am Zeilenanfang", async () => {
  const { trennerSchutz } = await import("../../src/components/Katalog/shopTitel.js");
  const out = trennerSchutz("CLASSIQUE: Höhe 10 cm · 4 Dochte · Gewicht 500 g");
  assert.equal(out.replace(/ /g, "_"), "CLASSIQUE: Höhe 10 cm_· 4 Dochte_· Gewicht 500 g");
  assert.equal(trennerSchutz(null), null);
});

test("shopTitel: Zahl und Einheit bleiben zusammen (Kaufbox-Ausführungen)", async () => {
  const { shopTitel } = await import("../../src/components/Katalog/shopTitel.js");
  assert.equal(shopTitel("MONUMENT · 35 cm · 6,5 kg").replace(/ /g, "_"), "Monument_· 35_cm_· 6,5_kg");
  assert.equal(shopTitel("CLASSIQUE · 10 cm · 500 g").replace(/ /g, "_"), "Classique_· 10_cm_· 500_g");
  assert.equal(shopTitel("Glas 960 ml").replace(/ /g, "_"), "Glas 960_ml");
});

test("rechtUmbruch: FN, Telefon, § und Abs bleiben zusammen", async () => {
  const { rechtUmbruch } = await import("../../src/components/Shop/keinUmbruch.js");
  const u = (s) => rechtUmbruch(s).replace(/ /g, "_");
  assert.equal(u("FN 443753 d, Telefon +43 5574 46255"), "FN_443753_d, Telefon +43_5574_46255");
  assert.equal(u("(§ 8 Abs 2 FAGG; DE § 312j Abs 3 BGB)"), "(§_8 Abs_2 FAGG; DE §_312j Abs_3 BGB)");
  assert.equal(u("FAGG §§ 11–18, Art. 6"), "FAGG §§_11–18, Art._6");
  assert.equal(rechtUmbruch(null), null);
});
