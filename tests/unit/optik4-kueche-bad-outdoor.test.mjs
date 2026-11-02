// tests/unit/optik4-kueche-bad-outdoor.test.mjs – QM-Abnahme Küche/Bad/Outdoor R1 → Fix R2 (01.11.2026).
// Run: node --test tests/unit/optik4-kueche-bad-outdoor.test.mjs
//
// Prüft die Logik der Fixes: weiche Trennstellen in Überschriften (silben.js, fitHeading),
// Kachelbild-Wahl (kachelBild.js), Konfigurator (gekoppelte Gruppen, Codes ohne „_“,
// Klammer bei Farbcodes, Zeilen-Zusammenfassung, Vorschau ≠ Hauptbild), Anzeigename im
// Katalog, Bildunterschrift je Studio-Grafik.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const SHY = "­";
const NBSP = " ";
const show = (s) => s.replaceAll(SHY, "-");

test("silben: lange Wörter bekommen weiche Trennstellen an Silben-/Fugengrenzen", async () => {
  const { hyphenateWord, softHyphenate } = await load("src/components/Landing/silben.js");
  const cases = {
    Einbaugeräte: "Ein-bau-geräte",
    Gaggenau: "Gag-genau",
    Ausstattungslinien: "Aus-stat-tungs-linien",
    Gastroeinrichtung: "Gastro-ein-rich-tung",
    Musterwohnung: "Muster-wohnung",
    Küchenstudio: "Küchen-studio",
    Vorarlberg: "Vor-arl-berg",
    Designerküchen: "Designer-küchen",
    Herstellerbezeichnung: "Her-steller-be-zeich-nung",
    Konstanz: "Kon-stanz",
    Liechtenstein: "Liechten-stein",
  };
  for (const [w, want] of Object.entries(cases)) assert.equal(show(hyphenateWord(w)), want, w);
  // kurze Wörter, Modellcodes, Versalien unverändert; Text sonst gleich
  for (const w of ["Lochau", "Küche", "AVAS1100", "GAGGENAU", "CKA2AB"]) assert.equal(hyphenateWord(w), w);
  const t = "Einbaugeräte von Gaggenau bis Quooker";
  assert.equal(softHyphenate(t).replaceAll(SHY, ""), t);
});

test("fitHeading: Bindewort am Wort davor, Ergänzungsstrich gebunden, weiche Trennstellen", async () => {
  const { fitHeadingText: fitHeading, H1_FIT } = await load("src/components/Landing/typoLanding.js");
  assert.equal(show(fitHeading("Musterwohnung und Ausstattungslinien")), `Muster-wohnung${NBSP}und Aus-stat-tungs-linien`);
  assert.equal(show(fitHeading("Fragen zur Hotel- und Gastroeinrichtung")), `Fragen zur Hotel-${NBSP}und Gastro-ein-rich-tung`);
  assert.equal(fitHeading(undefined), undefined);
  assert.match(H1_FIT, /min\(var\(--text-display-l\),19vw\)/);
  assert.match(H1_FIT, /orientation:landscape/);
});

test("kachelBild: Dornbracht-Freisteller, Querformat statt schmalem Hochformat", async () => {
  const { kachelBild } = await load("src/components/Katalog/kachelBild.js");
  const b = (src, width, height) => ({ src, width, height });
  assert.equal(kachelBild({ marke: "dornbracht", bilder: [b("neon", 1600, 1179), b("frei", 1600, 1600)] }).src, "frei");
  assert.equal(kachelBild({ marke: "dornbracht", bilder: [b("neon", 1600, 1179)] }).src, "neon");
  assert.equal(kachelBild({ marke: "agape", bilder: [b("hoch", 1105, 1600), b("quer", 1600, 1067)] }).src, "quer");
  assert.equal(kachelBild({ marke: "agape", bilder: [b("hoch", 1105, 1600), b("hoch2", 1000, 1600)] }).src, "hoch");
  assert.equal(kachelBild({ bilder: [] }), null);
});

test("Konfigurator: Montageart + Artikel gekoppelt, Codes ohne Unterstrich, Klammer bei Farbcodes", async () => {
  const { konfiguratorDaten, koppleGruppen, klammerCode, sauberCode } = await load("src/lib/katalog/ausfuehrung.js");
  const { PRODUKTE } = await load("src/lib/katalog/marken/agape.js");
  const d = konfiguratorDaten(PRODUKTE.find((p) => p.slug === "agape-cenote-badewanne"), "de");
  assert.equal(d.gruppen.length, 2, "Artikel-Gruppe eingefaltet");
  assert.deepEqual(d.gruppen[0].optionen.map((o) => `${o.name} ${o.code}`), ["Einbau AVAS1100", "freistehend AVAS1099", "teilversenkt AVAS1101"]);
  assert.equal(d.standard.length, 2);
  for (const g of d.gruppen) for (const o of g.optionen) assert.doesNotMatch(`${o.name} ${o.code || ""}`, /_(\s|$)/);
  assert.ok(d.gruppen[1].optionen.some((o) => o.name === "Gelcoat bordeaux red (NCS S 6030-Y80R)"));
  assert.equal(klammerCode("Gelcoat blue NCS S 1", "NCS S 1"), "Gelcoat blue (NCS S 1)");
  assert.equal(klammerCode("Gelcoat blue (NCS S 1)", "NCS S 1"), "Gelcoat blue (NCS S 1)");
  assert.equal(sauberCode("AVAS1100_"), "AVAS1100");
  // unterschiedliche Zusatzangaben bleiben als detail erhalten
  const k = koppleGruppen(
    [
      { name: "Art", optionen: [{ id: "a", name: "rund" }, { id: "b", name: "eckig" }] },
      { name: "Artikel", optionen: [{ id: "x", name: "X1_ – rund, Ø 80 cm", code: "X1_" }, { id: "y", name: "Y2_ – eckig, 80 × 80 cm", code: "Y2_" }] },
    ],
    ["a", "x"]
  );
  assert.equal(k.gruppen.length, 1);
  assert.deepEqual(k.gruppen[0].optionen.map((o) => [o.code, o.detail]), [["X1", "Ø 80 cm"], ["Y2", "80 × 80 cm"]]);
  // unabhängige Gruppen bleiben
  const u = koppleGruppen([{ name: "Holz", optionen: [{ id: "e", name: "Eiche" }, { id: "n", name: "Nuss" }] }, { name: "Stoff", optionen: [{ id: "1", name: "Blau" }, { id: "2", name: "Grau" }] }], ["e", "1"]);
  assert.equal(u.gruppen.length, 2);
});

test("Konfigurator: Vorschau nur mit eigenem Optionsbild ≠ Hauptbild; Zeilen statt Bandwurm", async () => {
  const { optionsVorschau, auswahlZeilen } = await load("src/lib/katalog/konfiguratorLogik.js");
  const daten = {
    gruppen: [{ name: "Ausführung", optionen: [{ id: "s", name: "Standard", code: "CKA2", bild: { src: "/1.webp" } }, { id: "b", name: "All Black", code: "CKA2AB", bild: { src: "/2.webp" } }] }],
    start: { src: "/1.webp" },
  };
  assert.equal(optionsVorschau(daten, ["s"], null, "/1.webp"), null, "gleich dem Hauptbild → keine Vorschau");
  assert.equal(optionsVorschau(daten, ["b"], 0, "/1.webp").src, "/2.webp");
  assert.equal(optionsVorschau({ gruppen: [{ name: "Farbe", optionen: [{ id: "w", name: "weiß" }] }], start: { src: "/s.webp" } }, ["w"], 0, "/h.webp"), null, "ohne Optionsbild keine Vorschau");
  assert.deepEqual(auswahlZeilen(daten, ["b"]), [{ name: "Ausführung", wert: "All Black (CKA2AB)" }]);
  const zwei = { gruppen: [daten.gruppen[0], { name: "Farbe", optionen: [{ id: "w", name: "weiß" }] }] };
  assert.deepEqual(auswahlZeilen(zwei, ["s", "w"]), [{ name: "Ausführung", wert: "Standard (CKA2)" }, { name: "Farbe", wert: "weiß" }]);
});

test("anzeigeName: Marke nicht doppelt, Versalien normal – außer Versal-Marken und Typkürzeln", async () => {
  const { anzeigeName } = await load("src/components/Katalog/produktTitel.js");
  assert.equal(anzeigeName("DORNBRACHT PIUR", { name: "Dornbracht", slug: "dornbracht" }), "Piur");
  // QM R4: Dornbracht in normaler Schreibweise, Kurznamen bis 3 Buchstaben bleiben Versal.
  assert.equal(anzeigeName("TARA ULTRA", { name: "Dornbracht", slug: "dornbracht" }), "Tara Ultra");
  assert.equal(anzeigeName("MEM", { name: "Dornbracht", slug: "dornbracht" }), "MEM");
  assert.equal(anzeigeName("LISSÉ", { name: "Dornbracht", slug: "dornbracht" }), "Lissé");
  assert.equal(anzeigeName("SWOP 2L SOFT", { name: "Starpool", slug: "starpool" }), "Swop 2L Soft");
  assert.equal(anzeigeName("ROSE RED", { name: "Agape", slug: "agape" }), "Rose Red");
  assert.equal(anzeigeName("GO 250", { name: "Gaggenau", slug: "gaggenau" }), "GO 250");
  assert.equal(anzeigeName("Flying Carpet", { name: "Soleum", slug: "soleum" }), "Flying Carpet");
  assert.equal(anzeigeName("Dornbracht", { name: "Dornbracht" }), "Dornbracht");
});

test("Studio-Grafik: Beschriftung je Art statt „Schema des Studios“ (Karte mit Ortsnamen)", async () => {
  const { kindCaption, SCHEMA_TEXT } = await load("src/components/Landing/schema/text.js");
  assert.match(kindCaption("kueche", "de"), /Küche/);
  assert.match(kindCaption("hotel", "de"), /Hotelflur/);
  assert.match(kindCaption("architekten", "de"), /Haus/);
  assert.equal(kindCaption("stadt", "de", false, "Lindau"), "Kartenskizze: Lindau und unser Studio in Lochau (Luftlinie)");
  assert.equal(kindCaption("termin", "de"), SCHEMA_TEXT.de.caption);
  for (const l of ["en", "fr", "it"]) assert.doesNotMatch(kindCaption("stadt", l, false, "X"), /\{ort\}/);
  assert.doesNotMatch(kindCaption("stadt", "de", true, "St. Gallen"), /ß/);
});

test("Konfigurator: ohne Vorschaubild entfällt der Vorschau-Satz im Hinweis", async () => {
  const { ohneVorschauSatz } = await load("src/lib/katalog/konfiguratorLogik.js");
  const h = "Vorschau der gewählten Ausführung. Alle Ausführungen stimmen wir in der Beratung mit Ihnen ab.";
  assert.equal(ohneVorschauSatz(h, "Vorschau der gewählten Ausführung: {auswahl}"), "Alle Ausführungen stimmen wir in der Beratung mit Ihnen ab.");
  assert.equal(ohneVorschauSatz("Alle Ausführungen stimmen wir ab.", "Vorschau"), "Alle Ausführungen stimmen wir ab.");
  // QM R3: echter Text aus de.json („Vorschau: {auswahl}“, Doppelpunkt am ersten Wort)
  assert.equal(ohneVorschauSatz(h, "Vorschau: {auswahl}"), "Alle Ausführungen stimmen wir in der Beratung mit Ihnen ab.");
});

test("Konfigurator R3: Name mit Klammer + Code ohne doppelte Klammer, immer Zeilenliste", async () => {
  const { mitCode, auswahlZeilen } = await load("src/lib/katalog/konfiguratorLogik.js");
  assert.equal(mitCode("Standard (Edelstahl)", "CKA2"), "Standard (Edelstahl) · CKA2");
  assert.equal(mitCode("All Black", "CKA2AB"), "All Black (CKA2AB)");
  assert.equal(mitCode("Einbau AVAS1100", "AVAS1100"), "Einbau AVAS1100");
  const d = { gruppen: [{ name: "Ausführung", optionen: [{ id: "s", name: "Standard (Edelstahl)", code: "CKA2" }] }] };
  assert.deepEqual(auswahlZeilen(d, ["s"]), [{ name: "Ausführung", wert: "Standard (Edelstahl) · CKA2" }]);
});
