// src/lib/shop/paketprofile.js
// Paketprofile für den Versand über LetMeShip (K3, 31.10.2026; Schätzungen
// ergänzt am 31.10.2026, Schätzungen bis zur Messung durch den Inhaber).
//
// Reihenfolge je Warenkorbzeile (profilOf in src/lib/commerce/shipping/config.js):
//   1. Herstellerangabe der Variante (preis.varianten[].versandGewichtG + versandMasseCm),
//   2. sonst das Profil des Pakettyps unten,
//   3. sonst nicht versandfähig → nur Abholung im Showroom.
//
// SCHÄTZUNG, NICHT GEMESSEN: Alle Werte unten sind aus den Produktdaten des
// Katalogs (src/lib/katalog/marken/*.js: masse, Variantennamen mit cm/ml/g,
// versandGewichtG) plus Polster-Regel abgeleitet. Jedes Profil trägt
//   quelle:   PROFIL_QUELLE_SCHAETZUNG
//   geprueft: false
// GATE: Ein Profil mit geprueft: false gilt NUR im Testmodus (SHOP_MODE=test,
// Mock/LetMeShip-Testumgebung). Im Live-Modus zählt ein Pakettyp erst, wenn
// der Inhaber den Karton gemessen, die Zahlen hier eingetragen und
// geprueft: true gesetzt hat (Formular: qa-screenshots/shop/PAKETPROFILE.md).
// Test: tests/unit/shop-paketprofile.test.mjs.
//
// Polster-Regel (je Seite, Innenmaß des Kartons = Artikel + 2 × Polster):
//   Glas, Karaffe, Keramik/Porzellan, Vase, Geschirr, Wohnaccessoire,
//   Geschenkset: +8 cm mit Einlage (Wabe/Steckeinsatz), Glas einzeln gefächert
//   (je Glas eine Zelle Ø + 1 cm)
//   Kerzen, Diffuser, Raumspray, Parfum, Leuchte: +5 cm
//   Bildband: +3 cm (Kantenschutz)
//   Kartonwand: +1 cm je Maß (2 × ~0,5 cm Wellpappe), auf ganze cm aufgerundet.
// Gewicht = schwerster Artikel der Klasse + Tara (Karton + Einlage, geschätzt
// 150 g + 12 g je Liter Kartonvolumen, auf 50 g aufgerundet). Hat die Variante
// ein eigenes versandGewichtG, gilt: Variantengewicht + Tara des Pakettyps.
//
// Größenklasse: aus den Abmessungen des Artikels (Variantenname vor Produkt-
// Maßen; fehlende Maße werden konservativ mit dem größten bekannten Maß
// aufgefüllt – „Würfel“), sonst aus Inhalt (ml, Wachs-g), sonst aus Größen-
// wörtern (klein/mittel/groß). Passt nichts → kein Profil → nur Abholung.
//
// Gefahrgut (versandGesperrt ≠ null → nie versandfähig, auch nicht im Test/Mock):
//   - Parfum (Eau de Parfum, ethanolhaltig, entzündbar): UN 1266
//     „Parfümerieerzeugnisse“, Klasse 3 (ADR Teil 3, Tabelle A; begrenzte
//     Mengen ADR Kap. 3.4). Rechtsgrundlage Straße: Richtlinie 2008/68/EG
//     https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32008L0068 ,
//     AT: Gefahrgutbeförderungsgesetz (GGBG)
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10012852 .
//     Ob die über LetMeShip gebuchten Carrier LQ-Sendungen ohne
//     Gefahrgutvertrag annehmen, ist ungeklärt (Post AT Gefahrgut-Broschüre:
//     https://assets.post.at/-/media/Dokumente/De/Produktblaetter-Folder-Infoblaetter/Gefahrengut_092025.pdf)
//     → nur Abholung, bis geklärt.
//   - Tragbare Akku-Leuchten (Flos, Tom Dixon): Lithium-Ionen-Batterie in
//     Ausrüstung, UN 3481 (ADR Sondervorschrift 188 für freigestellte
//     Versandstücke; Grenzen u. a. 20 Wh/Zelle, 100 Wh/Batterie). Wh-Angaben
//     der Leuchten liegen nicht vor; LetMeShip-Hinweise:
//     https://www.letmeship.com/de/versandservices/gefahrgut-versenden/lithium-batterien-versenden/
//     → „Versand erst nach Klärung Gefahrgut“, nur Abholung.
//   - Diffuser/Raumspray: Duftöle sind teils entzündbar (Flammpunkt). Vor
//     geprueft: true Abschnitt 14 des Sicherheitsdatenblatts prüfen
//     (REACH Anhang II, VO (EG) 1907/2006
//     https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32006R1907)
//     → gefahrgutPruefen: true (im Test versandfähig, live erst nach Prüfung).
//     Review 31.10.2026: Die Sperre hängt NICHT an geprueft (Kartonmaß), sondern an
//     sdbGeprueft: true (SDB Abschnitt 14 gelesen, kein Gefahrgut bzw. LQ mit Carrier
//     geklärt). Ohne sdbGeprueft ist Diffuser/Raumspray außerhalb des Testmodus
//     gesperrt – auch mit vollständigen Herstellerangaben (versandGesperrtFuer()).
//     Alkoholbasierte Raumsprays/Diffuseröle sind häufig UN 1266/UN 1993 Klasse 3,
//     Aerosole UN 1950 Klasse 2 (ADR Teil 3 Tabelle A).
//   - Streichhölzer (Trudon „parfümierte Streichhölzer“): UN 1944/1945 Klasse 4.1
//     → immer gesperrt, nur Abholung.
//
// Volumengewicht (Abrechnungsgewicht = max(Realgewicht, Volumengewicht)):
// siehe CARRIER_REGELN / abrechnungsGewichtG unten.
//
// Zerbrechlich/Versicherung (K17): aus dem Varianten-Feld `zerbrechlich`
// (Daten-Teams), sonst aus der Kategorie (KATEGORIE_HINWEISE). Zerbrechliche
// Sendungen werden bei LetMeShip versichert (Versicherungswert = Warenwert).
// Minotti/Möbel: nie Teil des Shops (VERKAUF_MARKEN), hier nicht berührt.
// Rein, ohne "@/"-Importe (node --test).

export const PROFIL_QUELLE_SCHAETZUNG = "Schätzung aus Produktdaten (31.10.2026), zu prüfen";
export const PROFIL_HINWEIS = "Schätzung, zu prüfen – bitte Karton messen und geprueft: true setzen";

/** Polster je Seite in cm (siehe Kopfkommentar). */
export const POLSTER_CM = Object.freeze({ zerbrechlich: 8, kerze: 5, duft: 5, buch: 3, akku: 5 });
export const WAND_CM = 1;

export const GESPERRT_GEFAHRGUT = "Versand erst nach Klärung Gefahrgut";
/** Sperrgrund außerhalb des Testmodus für gefahrgutPruefen ohne geprüftes Sicherheitsdatenblatt. */
export const GESPERRT_SDB = "Versand erst nach Prüfung Sicherheitsdatenblatt (Gefahrgut)";

const sortDesc = (a) => [...a].sort((x, y) => y - x);
const aufrunden50 = (g) => Math.ceil(g / 50) * 50;

/** Außenmaß des Kartons aus Innen-Inhalt und Polster: Inhalt + 2 × Polster + Wand, aufgerundet. */
export const kartonAus = (inhaltCm, polsterCm) => sortDesc(inhaltCm.map((x) => Math.ceil(x + 2 * polsterCm + WAND_CM)));
/** Tara (Karton + Einlage) in g, geschätzt aus dem Kartonvolumen. */
export const taraAus = ([l, b, h]) => aufrunden50(150 + 12 * ((l * b * h) / 1000));

/**
 * @param {string} label
 * @param {{ familie: string, inhaltCm: number[], einzelMaxCm?: number[], polsterCm: number,
 *   maxArtikelGewichtG: number, maxInhaltMl?: number, maxInhaltG?: number, minDims?: number,
 *   versandGesperrt?: string|null, gefahrgut?: object|null, gefahrgutPruefen?: boolean }} o
 */
function typ(label, o) {
  const [laengeCm, breiteCm, hoeheCm] = kartonAus(o.inhaltCm, o.polsterCm);
  const tareG = taraAus([laengeCm, breiteCm, hoeheCm]);
  return Object.freeze({
    label,
    familie: o.familie,
    gewichtG: o.maxArtikelGewichtG + tareG,
    laengeCm,
    breiteCm,
    hoeheCm,
    tareG,
    polsterCm: o.polsterCm,
    inhaltCm: Object.freeze(sortDesc(o.inhaltCm)),
    einzelMaxCm: Object.freeze(sortDesc(o.einzelMaxCm || o.inhaltCm)),
    maxArtikelGewichtG: o.maxArtikelGewichtG,
    maxInhaltMl: o.maxInhaltMl ?? null,
    maxInhaltG: o.maxInhaltG ?? null,
    minDims: o.minDims ?? 1,
    versandGesperrt: o.versandGesperrt ?? null,
    gefahrgut: o.gefahrgut ? Object.freeze(o.gefahrgut) : null,
    gefahrgutPruefen: Boolean(o.gefahrgutPruefen),
    // true erst, wenn das SDB (Abschnitt 14) geprüft ist – Inhaber/Technik, Beleg in PAKETPROFILE.md.
    sdbGeprueft: false,
    quelle: PROFIL_QUELLE_SCHAETZUNG,
    geprueft: false,
    hinweis: PROFIL_HINWEIS,
  });
}

const Z = POLSTER_CM.zerbrechlich;
// Glas: bis 30 cm hoch, Kelch/Becher bis Ø 14 cm (Katalog: p90 25 cm, max 32,5 cm);
// je Glas eine Zelle von 15 cm (Ø + 1 cm Steg). Schwerstes Glas ~ 400 g.
const GLAS_H = 30;
const ZELLE = 15;
const glas = (label, nx, ny, n) => typ(label, { familie: "glas", inhaltCm: [GLAS_H, nx * ZELLE, ny * ZELLE], einzelMaxCm: [GLAS_H, 14, 14], polsterCm: Z, maxArtikelGewichtG: n * 400 });

/**
 * Pakettypen: Gewicht inkl. Verpackung in Gramm, Außenmaße des Kartons in cm
 * (laengeCm ≥ breiteCm ≥ hoeheCm). Alle Werte GESCHÄTZT (geprueft: false).
 */
export const PAKETTYPEN = Object.freeze({
  "glas-1": glas("1 Glas", 1, 1, 1),
  "glas-2er-set": glas("Gläser, 2er-Set", 2, 1, 2),
  "glas-3er-set": glas("Gläser, 3er-Set", 3, 1, 3),
  "glas-4er-set": glas("Gläser, 4er-Set", 2, 2, 4),
  "glas-6er-set": glas("Gläser, 6er-Set", 3, 2, 6),
  karaffe: typ("Karaffe / Dekanter bis 36 cm", { familie: "karaffe", inhaltCm: [36, 22, 22], polsterCm: Z, maxArtikelGewichtG: 1800 }),
  "karaffe-gross": typ("Karaffe / Dekanter bis 45 cm", { familie: "karaffe", inhaltCm: [45, 26, 26], polsterCm: Z, maxArtikelGewichtG: 2500 }),
  "kerze-klein": typ("Kerze klein (bis 11 cm, bis 550 g Wachs)", { familie: "kerze", inhaltCm: [11, 11, 11], polsterCm: POLSTER_CM.kerze, maxArtikelGewichtG: 1400, maxInhaltG: 550 }),
  "kerze-mittel": typ("Kerze mittel (bis 17 cm, bis 1,2 kg Wachs)", { familie: "kerze", inhaltCm: [17, 17, 17], polsterCm: POLSTER_CM.kerze, maxArtikelGewichtG: 2600, maxInhaltG: 1200 }),
  "kerze-gross": typ("Kerze groß (bis 25 cm, bis 3 kg Wachs)", { familie: "kerze", inhaltCm: [25, 25, 25], polsterCm: POLSTER_CM.kerze, maxArtikelGewichtG: 5500, maxInhaltG: 3000 }),
  "kerze-3er-set": typ("Kerzen-Set bis 3 Mini-Kerzen (je bis 9 cm)", { familie: "kerze", inhaltCm: [27, 9, 9], einzelMaxCm: [9, 9, 9], polsterCm: POLSTER_CM.kerze, maxArtikelGewichtG: 900 }),
  diffuser: typ("Diffuser / Nachfüllflasche (bis 42 cm, bis 1 l)", { familie: "duft", inhaltCm: [42, 14, 14], polsterCm: POLSTER_CM.duft, maxArtikelGewichtG: 2500, maxInhaltMl: 1000, gefahrgutPruefen: true }),
  raumspray: typ("Raumspray (bis 20 cm, bis 400 ml)", { familie: "duft", inhaltCm: [20, 8, 8], polsterCm: POLSTER_CM.duft, maxArtikelGewichtG: 700, maxInhaltMl: 400, gefahrgutPruefen: true }),
  parfum: typ("Eau de Parfum (Flakon im Etui)", {
    familie: "parfum",
    inhaltCm: [15, 8, 6],
    polsterCm: POLSTER_CM.duft,
    maxArtikelGewichtG: 600,
    versandGesperrt: `${GESPERRT_GEFAHRGUT} (Parfum, UN 1266, Klasse 3)`,
    gefahrgut: { un: "UN 1266", klasse: "3", quelle: "ADR Teil 3 Tabelle A, Kap. 3.4; RL 2008/68/EG; GGBG" },
  }),
  "bildband-klein": typ("Bildband klein (bis 24 × 18 × 5 cm)", { familie: "bildband", inhaltCm: [24, 18, 5], polsterCm: POLSTER_CM.buch, maxArtikelGewichtG: 1500, minDims: 2 }),
  "bildband-mittel": typ("Bildband mittel (bis 34 × 27 × 7 cm)", { familie: "bildband", inhaltCm: [34, 27, 7], polsterCm: POLSTER_CM.buch, maxArtikelGewichtG: 4000, minDims: 2 }),
  "bildband-gross": typ("Bildband groß (bis 50 × 42 × 10 cm, z. B. Ultimate)", { familie: "bildband", inhaltCm: [50, 42, 10], polsterCm: POLSTER_CM.buch, maxArtikelGewichtG: 13000, minDims: 2 }),
  "vase-klein": typ("Vase / Gefäß klein (bis 15 cm)", { familie: "vase", inhaltCm: [15, 14, 14], polsterCm: Z, maxArtikelGewichtG: 900 }),
  "vase-mittel": typ("Vase / Gefäß mittel (bis 25 cm)", { familie: "vase", inhaltCm: [25, 22, 22], polsterCm: Z, maxArtikelGewichtG: 2200 }),
  "vase-gross": typ("Vase / Gefäß groß (bis 36 cm)", { familie: "vase", inhaltCm: [36, 28, 28], polsterCm: Z, maxArtikelGewichtG: 4000 }),
  "geschirr-klein": typ("Geschirr klein (Becher, Tasse, Eierbecher, bis 14 cm)", { familie: "geschirr", inhaltCm: [14, 12, 12], polsterCm: Z, maxArtikelGewichtG: 600 }),
  "geschirr-mittel": typ("Geschirr mittel (Teller bis Ø 24 cm, Schale, Kanne)", { familie: "geschirr", inhaltCm: [24, 24, 12], polsterCm: Z, maxArtikelGewichtG: 1800 }),
  "geschirr-gross": typ("Geschirr groß (Teller/Platte bis 35 cm, flach)", { familie: "geschirr", inhaltCm: [35, 30, 15], polsterCm: Z, maxArtikelGewichtG: 3500 }),
  "wohnaccessoire-klein": typ("Wohnaccessoire klein (bis 15 × 15 × 10 cm)", { familie: "wohnaccessoire", inhaltCm: [15, 15, 10], polsterCm: Z, maxArtikelGewichtG: 1000 }),
  "wohnaccessoire-mittel": typ("Wohnaccessoire mittel (bis 30 × 25 × 15 cm)", { familie: "wohnaccessoire", inhaltCm: [30, 25, 15], polsterCm: Z, maxArtikelGewichtG: 3000 }),
  "wohnaccessoire-gross": typ("Wohnaccessoire groß (bis 40 × 30 × 25 cm)", { familie: "wohnaccessoire", inhaltCm: [40, 30, 25], polsterCm: Z, maxArtikelGewichtG: 6000 }),
  geschenkset: typ("Geschenkset (bis 40 × 30 × 20 cm, bis 3 kg)", { familie: "geschenkset", inhaltCm: [40, 30, 20], polsterCm: Z, maxArtikelGewichtG: 3000 }),
  leuchte: typ("Tragbare Akku-Leuchte (Flos, Tom Dixon)", {
    familie: "leuchte",
    inhaltCm: [30, 15, 15],
    polsterCm: POLSTER_CM.akku,
    maxArtikelGewichtG: 1500,
    versandGesperrt: `${GESPERRT_GEFAHRGUT} (Lithium-Ionen-Akku, UN 3481)`,
    gefahrgut: { un: "UN 3481", klasse: "9", quelle: "ADR SV 188; RL 2008/68/EG; GGBG" },
  }),
  streichhoelzer: typ("Streichhölzer (Trudon)", {
    familie: "wohnaccessoire",
    inhaltCm: [15, 10, 5],
    polsterCm: POLSTER_CM.duft,
    maxArtikelGewichtG: 300,
    versandGesperrt: `${GESPERRT_GEFAHRGUT} (Streichhölzer, UN 1944/1945, Klasse 4.1)`,
    gefahrgut: { un: "UN 1944/UN 1945", klasse: "4.1", quelle: "ADR Teil 3 Tabelle A; RL 2008/68/EG; GGBG" },
  }),
});
export const PAKETTYP_IDS = Object.freeze(Object.keys(PAKETTYPEN));

/** Größenklassen je Familie, aufsteigend (erste passende gewinnt). */
const KLASSEN = Object.freeze({
  karaffe: ["karaffe", "karaffe-gross"],
  kerze: ["kerze-klein", "kerze-mittel", "kerze-gross"],
  bildband: ["bildband-klein", "bildband-mittel", "bildband-gross"],
  vase: ["vase-klein", "vase-mittel", "vase-gross"],
  geschirr: ["geschirr-klein", "geschirr-mittel", "geschirr-gross"],
  wohnaccessoire: ["wohnaccessoire-klein", "wohnaccessoire-mittel", "wohnaccessoire-gross"],
});

/** Hinweise je Katalog-Kategorie (Standard, wenn die Variante nichts angibt). */
const hinweis = (o = {}) => Object.freeze({ zerbrechlich: false, kerze: false, ...o });
export const KATEGORIE_HINWEISE = Object.freeze({
  duftkerze: hinweis({ kerze: true, zerbrechlich: true }),
  raumduft: hinweis({ zerbrechlich: true }),
  diffuser: hinweis({ zerbrechlich: true }),
  parfum: hinweis({ zerbrechlich: true }),
  geschenkset: hinweis({ zerbrechlich: true }),
  glas: hinweis({ zerbrechlich: true }),
  karaffe: hinweis({ zerbrechlich: true }),
  vase: hinweis({ zerbrechlich: true }),
  geschirr: hinweis({ zerbrechlich: true }),
  wohnaccessoire: hinweis(),
  "bar-zubehoer": hinweis(),
  bildband: hinweis(),
  "tragbare-leuchte": hinweis(),
});
export const kategorieHinweis = (kategorie) => KATEGORIE_HINWEISE[kategorie] || hinweis();

// ------------------------------------------------------------ Volumengewicht
/**
 * Abrechnungsregeln der Carrier (Volumengewicht = L × B × H [cm] / Divisor, in kg).
 * Quellen (vor Livegang erneut prüfen, Tarife ändern sich):
 *   UPS: Divisor 5000, auf volle kg aufgerundet, abgerechnet wird der höhere Wert
 *        https://www.ups.com/at/de/support/shipping-support/shipping-dimensions-weight
 *   DHL Paket (DE): kein Volumengewicht im Standard; Höchstmaß 120 × 60 × 60 cm, 31,5 kg
 *        https://www.dhl.de/dam/jcr:dce7432e-e871-441f-9cac-17de0b6d609e/dhl-paket-infoblatt-de-052026.pdf
 *   Andere (DPD, GLS, Post AT, DHL Express): nicht verifiziert → konservativ wie UPS (5000).
 * LetMeShip rechnet den Tarif selbst; diese Regeln dienen der Plausibilitätsprüfung.
 */
export const CARRIER_REGELN = Object.freeze({
  ups: Object.freeze({ divisor: 5000, aufrundenKg: true, verifiziert: true }),
  "dhl-paket": Object.freeze({ divisor: null, maxCm: Object.freeze([120, 60, 60]), maxGewichtG: 31500, verifiziert: true }),
  standard: Object.freeze({ divisor: 5000, aufrundenKg: true, verifiziert: false }),
});

/** Volumengewicht in g (Divisor 5000 Standard; auf volle kg aufgerundet). */
export function volumengewichtG(p, carrier = "standard") {
  const r = CARRIER_REGELN[carrier] || CARRIER_REGELN.standard;
  if (!r.divisor) return 0;
  const kg = (p.laengeCm * p.breiteCm * p.hoeheCm) / r.divisor;
  return (r.aufrundenKg ? Math.ceil(kg) : kg) * 1000;
}
/** Abrechnungsgewicht in g = max(Realgewicht, Volumengewicht). */
export const abrechnungsGewichtG = (p, carrier = "standard") => Math.max(p.gewichtG || 0, volumengewichtG(p, carrier));
/** Passt in ein Standardpaket (DHL Paket 120 × 60 × 60 cm, 31,5 kg)? */
export function passtStandardpaket(p) {
  const r = CARRIER_REGELN["dhl-paket"];
  const d = sortDesc([p.laengeCm, p.breiteCm, p.hoeheCm]);
  return d.every((x, i) => x > 0 && x <= r.maxCm[i]) && p.gewichtG > 0 && p.gewichtG <= r.maxGewichtG;
}

// ------------------------------------------------------------ Gate
/**
 * Sperrgrund eines Pakettyps im Modus (oder null): Gefahrgut immer; Diffuser/Raumspray
 * (gefahrgutPruefen) außerhalb des Testmodus, bis sdbGeprueft: true (GGBG, ADR, RL 2008/68/EG).
 */
export function versandGesperrtFuer(tp, mode) {
  if (!tp) return null;
  if (tp.versandGesperrt) return tp.versandGesperrt;
  if (tp.gefahrgutPruefen && tp.sdbGeprueft !== true && mode !== "test") return GESPERRT_SDB;
  return null;
}

/**
 * Darf das Profil eines Pakettyps genutzt werden?
 * - versandGesperrt (Gefahrgut) → nie,
 * - geprueft: true → immer (test + live),
 * - geprueft: false (Schätzung) → NUR im Testmodus.
 * @param {object|null} tp
 * @param {"off"|"test"|"live"} mode
 */
export function profilNutzbar(tp, mode) {
  if (!tp || versandGesperrtFuer(tp, mode)) return false;
  if (tp.geprueft === true) return true;
  return mode === "test";
}

// ------------------------------------------------------------ Produktdaten lesen
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const zahl = (s) => Number(String(s).replace(",", "."));
const textDe = (v) => (typeof v === "string" ? v : v?.de || "");

/**
 * Maße/Inhalt aus einem Text („H 15,5 cm“, „Ø19 cm · Blau“, „28.5x22.5 cm“,
 * „500ml · 40 cm“, „GRANDE · 24 cm · 3 kg“, „Classic 270 g“).
 * → { dims: number[] (cm), ml: number|null, g: number|null }
 */
export function masseAusText(text) {
  let t = ` ${String(text || "").toLowerCase().replace(/ /g, " ")} `;
  const dims = [];
  let ml = null;
  let g = null;
  const f = (u) => (u === "mm" ? 0.1 : 1);
  t = t.replace(new RegExp(String.raw`${NUM}\s*[x×]\s*${NUM}(?:\s*[x×]\s*${NUM})?\s*(mm|cm)(?![a-z])`, "g"), (_, a, b, c, u) => {
    for (const x of [a, b, c]) if (x) dims.push(zahl(x) * f(u));
    return " ";
  });
  t = t.replace(new RegExp(String.raw`(?:ø|⌀)\s*${NUM}\s*(mm|cm)(?![a-z])`, "g"), (_, a, u) => {
    dims.push(zahl(a) * f(u), zahl(a) * f(u));
    return " ";
  });
  t = t.replace(new RegExp(String.raw`${NUM}\s*(mm|cm)(?![a-z])`, "g"), (_, a, u) => {
    dims.push(zahl(a) * f(u));
    return " ";
  });
  for (const m of t.matchAll(new RegExp(String.raw`${NUM}\s*(ml|cl|l)(?![a-zäöüß])`, "g"))) {
    const v = zahl(m[1]) * (m[2] === "l" ? 1000 : m[2] === "cl" ? 10 : 1);
    ml = Math.max(ml ?? 0, v);
  }
  for (const m of t.matchAll(new RegExp(String.raw`${NUM}\s*(kg|g)(?![a-zäöüß])`, "g"))) {
    const v = zahl(m[1]) * (m[2] === "kg" ? 1000 : 1);
    g = Math.max(g ?? 0, v);
  }
  return { dims: dims.map((x) => Math.round(x * 10) / 10), ml, g };
}

/**
 * Maße aus dem Katalogfeld `masse` ([{ key, wert }]).
 * → { dims: number[] (cm), gewichtG: number|null }
 */
export function masseAusProdukt(masse) {
  const o = {};
  let gewichtG = null;
  let abm = [];
  for (const m of Array.isArray(masse) ? masse : []) {
    const w = String(m?.wert || "").toLowerCase();
    const nums = [...w.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((x) => zahl(x[1]));
    if (!nums.length) continue;
    if (m.key === "gewicht") {
      const fx = /kg/.test(w) ? 1000 : /\bg\b/.test(w) ? 1 : null;
      if (fx) gewichtG = Math.round((/[x×]/.test(w) ? nums.reduce((a, b) => a * b, 1) : Math.max(...nums)) * fx);
      continue;
    }
    const fx = /\bmm\b/.test(w) ? 0.1 : /\bcm\b/.test(w) ? 1 : /\bm\b/.test(w) ? 100 : null;
    if (!fx) continue;
    if (m.key === "abmessung") abm = nums.slice(0, 3).map((x) => x * fx);
    else o[m.key] = Math.max(...nums) * fx;
  }
  let dims;
  if (abm.length >= 2) dims = abm;
  else {
    const fp = [o.breite, o.tiefe, o.laenge].filter((x) => x > 0);
    let f1 = fp[0];
    let f2 = fp[1];
    if (o.durchmesser) {
      f1 = Math.max(o.durchmesser, f1 || 0);
      f2 = Math.max(o.durchmesser, f2 || 0);
    }
    dims = [o.hoehe, f1, f2].filter((x) => x > 0);
  }
  return { dims: dims.map((x) => Math.round(x * 10) / 10), gewichtG };
}

/** Auf drei Maße auffüllen (fehlende = größtes bekanntes Maß; flache Teile 6 cm), absteigend. */
export function bboxCm(dims, { flach = false } = {}) {
  const d = sortDesc(dims.filter((x) => x > 0)).slice(0, 3);
  if (!d.length) return null;
  while (d.length < 3) d.push(flach && d.length === 2 ? 6 : d[0]);
  return sortDesc(d);
}
const passt = (bbox, max) => bbox.every((x, i) => x <= max[i]);

const stueckzahl = (text) => {
  const t = String(text || "").toLowerCase();
  const m = t.match(/(\d+)\s*(?:er\b|-?er-?set|\s?stück|\s?stk\b|\s?pcs\b|\s?pieces\b|\s?pezzi\b|\s?pièces\b)/) || t.match(/\b(?:set|satz|coffret|lot|pack)\s*(?:of|von|de|da|mit)?\s*(\d+)\b/) || t.match(/(\d+)\s*[x×]\s*(?:mini|petite|kerzen?|candles?)\b/) || t.match(/schachtel mit (\d+)/);
  if (m) return Number(m[1]);
  if (/\btrio\b/.test(t)) return 3;
  if (/\bduo\b/.test(t)) return 2;
  return null;
};
const SET_WORT = /(?:set|pack|karton|kit|coffret|satz|lot)(?![a-zäöüß])/;
const EINZELN = /einzeln|single|à l'unité|singolo/;
const groesse = (text) => {
  const t = String(text || "").toLowerCase();
  // Kein \b nach „groß“ (ß ist für \b kein Wortzeichen) – darum Lookahead auf Buchstaben.
  const w = (re) => new RegExp(String.raw`(?:^|[^a-zäöüß])(?:${re})(?![a-zäöüß])`).test(t);
  if (w("xxl|xl|maxi|monument|magnum|doppelmagnum")) return "zu-gross";
  if (w("klein|small|petit|petite|piccol[oa]|mini")) return "klein";
  if (w("mittel|medium|signature|intermezzo")) return "mittel";
  if (w("groß|gross|large|grand|grande|great")) return "gross";
  return null;
};
const hatGroessenAngabe = (n) => {
  const m = masseAusText(n);
  return m.dims.length > 0 || m.ml != null || m.g != null || groesse(n) != null;
};
const inhaltAus = (inhalt, einheit) => {
  if (!inhalt || !(inhalt.menge > 0)) return null;
  const e = String(inhalt.einheit || "").toLowerCase();
  if (einheit === "ml") return e === "ml" ? inhalt.menge : e === "l" ? inhalt.menge * 1000 : e === "cl" ? inhalt.menge * 10 : null;
  return e === "g" ? inhalt.menge : e === "kg" ? inhalt.menge * 1000 : null;
};

/**
 * Artikeldaten einer Warenkorbzeile für die Größenklasse.
 * Variantenname vor Produktmaßen; Produktmaße nur, wenn sie für alle Varianten
 * gelten (eine Variante oder keine Variante nennt eine eigene Größe).
 */
export function artikelDaten(z) {
  const vn = textDe(z?.varianteName);
  const name = String(z?.name || "");
  const tv = masseAusText(vn);
  const namen = (Array.isArray(z?.varianten) ? z.varianten : []).map((v) => textDe(v?.name));
  const produktGilt = namen.length <= 1 || !namen.some(hatGroessenAngabe);
  const pm = produktGilt ? masseAusProdukt(z?.masse) : { dims: [], gewichtG: null };
  const tn = masseAusText(name);
  const dims = tv.dims.length ? tv.dims : pm.dims.length ? pm.dims : tn.dims;
  const flach = /teller|platte|plate|tablett|tray|untersetzer|servierbrett/i.test(name) && !/tiefe|tiefer|deep/i.test(name);
  return {
    text: `${vn} ${name}`.trim(),
    dims,
    bbox: bboxCm(dims, { flach }),
    ml: tv.ml ?? inhaltAus(z?.inhalt, "ml") ?? tn.ml,
    inhaltG: tv.g ?? inhaltAus(z?.inhalt, "g") ?? tn.g,
    gewichtG: (z?.versandGewichtG > 0 ? z.versandGewichtG : null) ?? pm.gewichtG,
    groesse: groesse(vn) || groesse(name),
    stueck: stueckzahl(vn) ?? stueckzahl(name),
  };
}

const gewichtOk = (a, tp) => !(a.gewichtG > tp.maxArtikelGewichtG);
const klasseOk = (a, id) => {
  const tp = PAKETTYPEN[id];
  if (!gewichtOk(a, tp)) return false;
  if (tp.maxInhaltMl != null && a.ml > tp.maxInhaltMl) return false;
  if (tp.maxInhaltG != null && a.inhaltG > tp.maxInhaltG) return false;
  if (a.bbox) return a.dims.length >= tp.minDims && passt(a.bbox, tp.einzelMaxCm);
  return true;
};
/** Erste passende Klasse: mit Maßen nach Maß, sonst nach Größenwort (oder Inhalt, wenn erlaubt). */
function waehle(familie, a, { ohneMasse = "wort" } = {}) {
  const ids = KLASSEN[familie];
  if (a.groesse === "zu-gross") return null;
  if (a.bbox) return ids.find((id) => klasseOk(a, id)) || null;
  if (a.groesse) {
    const id = `${familie === "karaffe" ? "karaffe" : familie}-${a.groesse}`;
    return ids.includes(id) && klasseOk(a, id) ? id : null;
  }
  if (ohneMasse === "inhalt" && (a.inhaltG != null || a.ml != null)) return ids.find((id) => klasseOk(a, id)) || null;
  return null;
}

const PARFUM_RE = /parfum|parfüm|perfume|eaux? de (?:toilette|cologne)|\bcologne\b|\bextrait\b|\bedp\b|\bedt\b/i;
// Streichhölzer zuerst (sonst „parfümierte Streichhölzer“ → parfum): UN 1944/1945.
const STREICHHOLZ_RE = /streichh[oö]lz|\bmatches\b|allumettes|fiammiferi/i;
const DUFT_RE = /diffuser|raumspray|room spray|home spray|nachfüll|refill/i;

/**
 * Pakettyp einer Warenkorbzeile oder null (dann gibt es kein Profil → nur Abholung,
 * sofern die Variante keine eigenen Versanddaten hat).
 * @param {{kategorie: string, name?: string, varianteName?: string|{de: string}, varianten?: object[],
 *   masse?: object[], inhalt?: {menge, einheit}, versandGewichtG?: number}} z
 */
export function pakettypOf(z) {
  const a = artikelDaten(z || {});
  const kat = z?.kategorie;
  const duft = () => {
    if (a.groesse === "zu-gross") return null;
    const kandidaten = kat === "raumduft" ? ["raumspray", "diffuser"] : ["diffuser"];
    if (!a.bbox && a.ml == null) return null;
    // Flaschen sind schmal: ist nur die Höhe bekannt („500ml · 40 cm“), zählt sie allein
    // (Grundfläche über die ml-Grenze der Klasse begrenzt), statt zum Würfel aufzufüllen.
    const b = a.dims.length === 1 ? { ...a, bbox: [a.dims[0], 0, 0] } : a;
    return kandidaten.find((id) => klasseOk(b, id)) || null;
  };
  const kerzenSet = () => (a.stueck >= 2 && a.stueck <= 3 && klasseOk(a, "kerze-3er-set") && (!a.bbox || passt(a.bbox, PAKETTYPEN["kerze-3er-set"].einzelMaxCm)) ? "kerze-3er-set" : null);
  switch (kat) {
    case "glas": {
      const n = a.stueck ?? (SET_WORT.test(a.text.toLowerCase()) && !EINZELN.test(a.text.toLowerCase()) ? null : 1);
      const id = { 1: "glas-1", 2: "glas-2er-set", 3: "glas-3er-set", 4: "glas-4er-set", 6: "glas-6er-set" }[n] || null;
      if (!id) return null;
      if (a.bbox && !passt(a.bbox, PAKETTYPEN[id].einzelMaxCm)) return null;
      return gewichtOk(a, PAKETTYPEN[id]) ? id : null;
    }
    case "karaffe":
      if (SET_WORT.test(a.text.toLowerCase()) && !EINZELN.test(a.text.toLowerCase())) return null;
      return a.bbox ? waehle("karaffe", a) : null;
    case "duftkerze":
      if (a.stueck != null && a.stueck > 1) return kerzenSet();
      return waehle("kerze", a, { ohneMasse: "inhalt" });
    case "diffuser":
    case "raumduft":
      return duft();
    case "parfum":
      return "parfum";
    case "bildband":
      return a.bbox ? waehle("bildband", a) : null;
    case "vase":
      return waehle("vase", a);
    case "geschirr":
      return waehle("geschirr", a);
    case "wohnaccessoire":
    case "bar-zubehoer":
      if (STREICHHOLZ_RE.test(a.text)) return "streichhoelzer";
      if (PARFUM_RE.test(a.text)) return "parfum";
      if (DUFT_RE.test(a.text)) return duft();
      return waehle("wohnaccessoire", a);
    case "geschenkset": {
      if (STREICHHOLZ_RE.test(a.text)) return "streichhoelzer";
      if (PARFUM_RE.test(a.text)) return "parfum";
      const set = kerzenSet();
      if (set) return set;
      const tp = PAKETTYPEN.geschenkset;
      if (a.bbox && a.dims.length >= 2) return passt(a.bbox, tp.einzelMaxCm) && gewichtOk(a, tp) ? "geschenkset" : null;
      // ohne belastbare Maße nur mit bekanntem, leichtem Gewicht (großzügiger Karton)
      return a.gewichtG > 0 && gewichtOk(a, tp) ? "geschenkset" : null;
    }
    case "tragbare-leuchte":
      return "leuchte";
    default:
      return null;
  }
}

/** Profil eines Pakettyps (oder null). */
export const paketProfil = (id) => (id && PAKETTYPEN[id]) || null;

/** Pakettypen, die noch nicht gemessen sind (geprueft !== true) – für die Freigabe. */
export const paketprofileUngeprueft = (typen = PAKETTYPEN) => Object.entries(typen).filter(([, t]) => t.geprueft !== true && !t.versandGesperrt).map(([id]) => id);
