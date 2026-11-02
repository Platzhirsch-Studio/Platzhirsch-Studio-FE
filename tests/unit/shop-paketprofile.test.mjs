// tests/unit/shop-paketprofile.test.mjs — Paketprofile (Agenten-Schätzung 31.10.2026):
// Polster-Regel, Größenklassen aus Produktdaten, Gefahrgut-Sperre, Volumengewicht
// und das Gate „Schätzung nur im Testmodus, live nur geprueft: true“.
// Run: node --test --test-reporter=tap tests/unit/shop-paketprofile.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PAKETTYPEN,
  POLSTER_CM,
  WAND_CM,
  PROFIL_QUELLE_SCHAETZUNG,
  GESPERRT_GEFAHRGUT,
  abrechnungsGewichtG,
  artikelDaten,
  masseAusProdukt,
  masseAusText,
  pakettypOf,
  paketprofileUngeprueft,
  passtStandardpaket,
  profilNutzbar,
  volumengewichtG,
} from "../../src/lib/shop/paketprofile.js";
import { paketeOf, profilOf, profilVollstaendig } from "../../src/lib/commerce/shipping/config.js";
import { versandTarif } from "../../src/lib/commerce/shipping/index.js";
import { createMockShippingAdapter } from "../../src/lib/commerce/shipping/mock.js";

const NOW = Date.parse("2026-10-31T10:00:00Z");
const ZIEL = { land: "AT", plz: "6900", ort: "Bregenz" };

test("jedes Profil: Schätzung markiert, geprueft false, Karton ≥ Inhalt + 2 × Polster + Wand, Standardpaket", () => {
  for (const [id, t] of Object.entries(PAKETTYPEN)) {
    assert.equal(t.quelle, PROFIL_QUELLE_SCHAETZUNG, id);
    assert.equal(t.geprueft, false, `${id}: erst der Inhaber setzt geprueft: true`);
    const box = [t.laengeCm, t.breiteCm, t.hoeheCm];
    assert.deepEqual(box, [...box].sort((a, b) => b - a), `${id}: L ≥ B ≥ H`);
    t.inhaltCm.forEach((x, i) => assert.ok(box[i] >= x + 2 * t.polsterCm + WAND_CM, `${id}[${i}]`));
    t.einzelMaxCm.forEach((x, i) => assert.ok(x <= t.inhaltCm[i], `${id}: Einzelstück passt in den Inhalt`));
    assert.ok(t.gewichtG > t.maxArtikelGewichtG && t.tareG > 0, `${id}: Gewicht inkl. Tara`);
    assert.ok(passtStandardpaket(t), `${id}: ≤ 120 × 60 × 60 cm, ≤ 31,5 kg`);
  }
  assert.equal(PAKETTYPEN["glas-1"].polsterCm, POLSTER_CM.zerbrechlich);
  assert.equal(PAKETTYPEN["kerze-klein"].polsterCm, 5);
  assert.equal(PAKETTYPEN.diffuser.polsterCm, 5);
  assert.equal(PAKETTYPEN["bildband-mittel"].polsterCm, 3);
  for (const id of ["geschirr-klein", "parfum", "geschenkset", "wohnaccessoire-mittel", "vase-mittel", "glas-3er-set", "kerze-3er-set"]) assert.ok(PAKETTYPEN[id], id);
});

test("Gefahrgut: Parfum (UN 1266) und Akku-Leuchte (UN 3481) gesperrt – auch im Test und im Mock", () => {
  assert.match(PAKETTYPEN.parfum.versandGesperrt, new RegExp(GESPERRT_GEFAHRGUT));
  assert.equal(PAKETTYPEN.parfum.gefahrgut.un, "UN 1266");
  assert.equal(PAKETTYPEN.leuchte.gefahrgut.un, "UN 3481");
  for (const z of [
    { kategorie: "parfum", name: "Aphélie", varianteName: "100 ml" },
    { kategorie: "tragbare-leuchte", name: "Bellhop Unplugged", versandGewichtG: 750, versandMasseCm: [30, 20, 20] },
    { kategorie: "geschenkset", name: "Eaux de Parfum Gift Set", varianteName: "3 × 15 ml", versandGewichtG: 400 },
  ]) {
    for (const mode of ["test", "live"]) {
      const p = profilOf(z, { mode, mock: true });
      assert.ok(p.gesperrt, `${z.name} ${mode}`);
      assert.equal(profilVollstaendig(p), false, `${z.name} ${mode}: nur Abholung`);
    }
  }
  assert.equal(profilNutzbar(PAKETTYPEN.leuchte, "test"), false);
  assert.deepEqual(paketeOf([{ kategorie: "tragbare-leuchte", menge: 1 }], { mode: "test", mock: true }).gesperrt, ["leuchte"]);
  assert.ok(PAKETTYPEN.diffuser.gefahrgutPruefen && PAKETTYPEN.raumspray.gefahrgutPruefen, "Duftöle: SDB Abschnitt 14 prüfen");
});

test("Gate: Schätzung nur im Testmodus; live erst mit geprueft: true", () => {
  const z = { kategorie: "glas", name: "Vinum Riesling", varianteName: { de: "2er-Set" }, masse: [{ key: "hoehe", wert: "215 mm" }, { key: "durchmesser", wert: "85 mm" }], menge: 1 };
  const t = profilOf(z, { mode: "test" });
  assert.equal(t.pakettyp, "glas-2er-set");
  assert.equal(t.quelle, "pakettyp-schaetzung");
  assert.equal(t.geprueft, false);
  assert.equal(profilVollstaendig(t), true);
  assert.equal(profilVollstaendig(profilOf(z, { mode: "live" })), false, "live: Schätzung zählt nicht");
  assert.equal(profilVollstaendig(profilOf(z)), false, "ohne Modus streng wie live");
  assert.equal(profilVollstaendig(profilOf(z, { mode: "off" })), false);
  assert.equal(profilNutzbar({ ...PAKETTYPEN["glas-2er-set"], geprueft: true }, "live"), true);
  assert.equal(profilNutzbar(PAKETTYPEN["glas-2er-set"], "live"), false);
  assert.ok(paketprofileUngeprueft().includes("glas-2er-set"));
  assert.ok(!paketprofileUngeprueft().includes("parfum"), "gesperrte Typen sind kein Mess-Punkt");
  assert.equal(paketprofileUngeprueft({ x: { geprueft: true } }).length, 0);
  // Variantengewicht + Tara des geschätzten Kartons
  const g = profilOf({ ...z, versandGewichtG: 600 }, { mode: "test" });
  assert.equal(g.gewichtG, 600 + PAKETTYPEN["glas-2er-set"].tareG);
  // vollständige Herstellerangabe gilt auch live
  const v = profilOf({ ...z, versandGewichtG: 900, versandMasseCm: [30, 20, 15] }, { mode: "live" });
  assert.equal(v.quelle, "variante");
  assert.equal(v.gewichtG, 900);
});

test("versandTarif: Testmodus versandfähig mit Schätzung, live → profil_fehlt", async () => {
  const zeilen = [{ kategorie: "duftkerze", name: "Duftkerze SKI", varianteName: "CLASSIQUE · 10 cm · 500 g", versandGewichtG: 1300, menge: 1 }];
  const mock = createMockShippingAdapter();
  const t = await versandTarif({ adapter: mock, zeilen, ziel: ZIEL, warenwertCent: 11900, now: NOW, mode: "test" });
  assert.equal(t.ok, true);
  assert.deepEqual(t.pakete[0], { gewichtG: 1300 + PAKETTYPEN["kerze-klein"].tareG, laengeCm: 22, breiteCm: 22, hoeheCm: 22, menge: 1, inhalt: "Duftkerze SKI" });
  const abgeleitet = await versandTarif({ adapter: mock, zeilen, ziel: ZIEL, warenwertCent: 11900, now: NOW });
  assert.equal(abgeleitet.ok, true, "Mock-Adapter ⇒ Testmodus");
  const live = await versandTarif({ adapter: { mock: false, umgebung: "live", quote: async () => assert.fail("kein Aufruf") }, zeilen, ziel: ZIEL, warenwertCent: 11900, now: NOW, mode: "live" });
  assert.equal(live.ok, false);
  assert.equal(live.fehler, "profil_fehlt");
  assert.deepEqual(live.kategorien, ["kerze-klein"]);
});

test("Maße lesen: Variantentext und Katalogfeld masse", () => {
  assert.deepEqual(masseAusText("H 15,5 cm · Bernstein").dims, [15.5]);
  assert.deepEqual(masseAusText("Ø19 cm · Blau").dims, [19, 19]);
  assert.deepEqual(masseAusText("28.5x22.5 cm").dims, [28.5, 22.5]);
  assert.deepEqual(masseAusText("500ml · 40 cm"), { dims: [40], ml: 500, g: null });
  assert.deepEqual(masseAusText("2L · 60 cm"), { dims: [60], ml: 2000, g: null });
  assert.equal(masseAusText("GRANDE · 24 cm · 3 kg").g, 3000);
  assert.equal(masseAusText("Classic 270 g").g, 270);
  assert.equal(masseAusText("25 cl · Weiß").ml, 250);
  assert.deepEqual(masseAusProdukt([{ key: "hoehe", wert: "121 mm" }, { key: "durchmesser", wert: "95 mm" }]).dims, [12.1, 9.5, 9.5]);
  assert.deepEqual(masseAusProdukt([{ key: "abmessung", wert: "41 × 48 × 9 cm (W × L × D)" }, { key: "gewicht", wert: "10,401 kg" }]), { dims: [41, 48, 9], gewichtG: 10401 });
  assert.equal(masseAusProdukt([{ key: "gewicht", wert: "3 × 0,08 kg" }]).gewichtG, 240);
  // Produktmaße gelten nicht, wenn die Varianten eigene Größen nennen
  const a = artikelDaten({ name: "Kerze", varianteName: "Great 2,8 kg", varianten: [{ name: "Small 70 g" }, { name: "Great 2,8 kg" }], masse: [{ key: "hoehe", wert: "10,5 cm" }] });
  assert.equal(a.bbox, null);
  assert.equal(a.inhaltG, 2800);
});

test("Zuordnung je Kategorie + Größe (konservativ: passt nichts → null = Abholung)", () => {
  const glas = (vn, extra = {}) => pakettypOf({ kategorie: "glas", varianteName: vn, ...extra });
  assert.equal(glas("Einzeln"), "glas-1");
  assert.equal(glas("Einzeln im Geschenkkarton"), "glas-1");
  assert.equal(glas("3er-Set"), "glas-3er-set");
  assert.equal(glas({ de: "Set of 6" }), "glas-6er-set");
  assert.equal(glas("6er-Karton"), "glas-6er-set");
  assert.equal(glas("Vorteilspack 8 Stück (8 kaufen, 6 bezahlen)"), null, "8 Gläser: kein Profil");
  assert.equal(glas("Jubiläumsset"), null, "Set ohne Stückzahl");
  assert.equal(glas("Einzeln", { masse: [{ key: "hoehe", wert: "325 mm" }] }), null, "über 30 cm");

  const kerze = (vn, extra = {}) => pakettypOf({ kategorie: "duftkerze", varianteName: vn, ...extra });
  assert.equal(kerze("CLASSIQUE · 10 cm · 500 g"), "kerze-klein");
  assert.equal(kerze("SIGNATURE · 16 cm · 1,1 kg"), "kerze-mittel");
  assert.equal(kerze("GRANDE · 24 cm · 3 kg"), "kerze-gross");
  assert.equal(kerze("MONUMENT · 35 cm · 6,5 kg"), null);
  assert.equal(kerze("Classic 270 g"), "kerze-klein");
  assert.equal(kerze("Intermezzo 800 g"), "kerze-mittel");
  assert.equal(kerze("Klein"), "kerze-klein");
  assert.equal(kerze("Schachtel mit 6 Kerzen"), null);
  assert.equal(pakettypOf({ kategorie: "geschenkset", name: "TRIO TRAVEL Kerzen ASPEN", varianteName: "6 cm · 3 × 0,08 kg", versandGewichtG: 690 }), "kerze-3er-set");

  assert.equal(pakettypOf({ kategorie: "diffuser", varianteName: "500ml · 40 cm" }), "diffuser");
  assert.equal(pakettypOf({ kategorie: "diffuser", varianteName: "500ml" }), "diffuser", "Nachfüllflasche");
  assert.equal(pakettypOf({ kategorie: "diffuser", varianteName: "2L · 60 cm" }), null);
  assert.equal(pakettypOf({ kategorie: "raumduft", varianteName: "180ml" }), "raumspray");
  assert.equal(pakettypOf({ kategorie: "raumduft", varianteName: "Schachtel mit 4 Kameen" }), null);

  assert.equal(pakettypOf({ kategorie: "vase", varianteName: "H13 cm" }), "vase-klein");
  assert.equal(pakettypOf({ kategorie: "vase", varianteName: "H21 cm" }), "vase-mittel");
  assert.equal(pakettypOf({ kategorie: "vase", varianteName: "H31 cm" }), null, "Würfel 31 cm > groß");
  assert.equal(pakettypOf({ kategorie: "vase", varianteName: "groß" }), "vase-gross");
  assert.equal(pakettypOf({ kategorie: "vase", name: "Vase", varianteName: "Weiß" }), null, "ohne Maß und Größenwort");

  assert.equal(pakettypOf({ kategorie: "geschirr", name: "Colore Becher", masse: [{ key: "hoehe", wert: "9 cm" }, { key: "breite", wert: "12,50 cm" }, { key: "durchmesser", wert: "9 cm" }] }), "geschirr-klein");
  assert.equal(pakettypOf({ kategorie: "geschirr", name: "Colore Teller", varianteName: "Ø19 cm · Apple rose" }), "geschirr-mittel", "Teller flach");
  assert.equal(pakettypOf({ kategorie: "geschirr", name: "Hammershøi Teller", varianteName: "Ø27 cm" }), "geschirr-gross");
  assert.equal(pakettypOf({ kategorie: "geschirr", name: "Etagere", masse: [{ key: "hoehe", wert: "30 cm" }, { key: "durchmesser", wert: "28 cm" }] }), null);

  assert.equal(pakettypOf({ kategorie: "bildband", masse: [{ key: "abmessung", wert: "41 × 48 × 9 cm (W × L × D)" }], versandGewichtG: 10401 }), "bildband-gross");
  assert.equal(pakettypOf({ kategorie: "bildband", masse: [{ key: "abmessung", wert: "25 × 33 × 4 cm (W × L × D)" }], versandGewichtG: 2000 }), "bildband-mittel");
  assert.equal(pakettypOf({ kategorie: "bildband" }), null, "Bildband ohne Maße");

  assert.equal(pakettypOf({ kategorie: "wohnaccessoire", name: "Glas Glocke", masse: [{ key: "hoehe", wert: "24 cm" }, { key: "durchmesser", wert: "14 cm" }] }), "wohnaccessoire-mittel");
  // Review 31.10.2026: Streichhölzer sind Gefahrgut (UN 1944/1945) → eigener, immer gesperrter Pakettyp.
  assert.equal(pakettypOf({ kategorie: "wohnaccessoire", name: "Streichhölzer", varianteName: "Matches", versandGewichtG: 70 }), "streichhoelzer", "Gefahrgut, nur Abholung");
  assert.equal(pakettypOf({ kategorie: "geschenkset", name: "Geschenkbox", versandGewichtG: 1850 }), "geschenkset");
  assert.equal(pakettypOf({ kategorie: "geschenkset", name: "Adventskalender", versandGewichtG: 7300 }), null);
  assert.equal(pakettypOf({ kategorie: "karaffe", name: "Boa Dekanter", masse: [{ key: "hoehe", wert: "350 mm" }, { key: "durchmesser", wert: "186 mm" }] }), "karaffe");
  assert.equal(pakettypOf({ kategorie: "karaffe", name: "Amadeo Magnum Dekanter" }), null);
  assert.equal(pakettypOf({ kategorie: "tragbare-leuchte" }), "leuchte");
});

test("Volumengewicht: L × B × H / 5000, aufgerundet; Abrechnung = Maximum", () => {
  const p = { laengeCm: 47, breiteCm: 47, hoeheCm: 32, gewichtG: 1800 };
  assert.equal(volumengewichtG(p), 15000); // 70 688 cm³ / 5000 = 14,14 → 15 kg
  assert.equal(volumengewichtG(p, "ups"), 15000);
  assert.equal(volumengewichtG(p, "dhl-paket"), 0, "DHL Paket: kein Volumengewicht");
  assert.equal(abrechnungsGewichtG(p), 15000);
  assert.equal(abrechnungsGewichtG({ ...p, gewichtG: 20000 }), 20000);
  assert.equal(passtStandardpaket({ laengeCm: 121, breiteCm: 10, hoeheCm: 10, gewichtG: 100 }), false);
});

test("PAKETPROFILE.md: Messzeile je Pakettyp", () => {
  const md = fs.readFileSync("qa-screenshots/shop/PAKETPROFILE.md", "utf8");
  for (const id of Object.keys(PAKETTYPEN)) assert.ok(md.includes("`" + id + "`"), `PAKETPROFILE.md: ${id}`);
  assert.match(md, /geprueft: true/);
  assert.match(md, /UN 3481/);
});
