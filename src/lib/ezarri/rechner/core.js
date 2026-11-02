// src/lib/ezarri/rechner/core.js – Mengenformel des Mosaik-Rechners (Team C).
//
// Vertrag §7.4 Nr. 3 (ezarri-konzept.md):
//   quantities({flaechen, margeProzent, packaging}) →
//   {m2, kartons, paletten, kgMosaik, kgKleber, kgFuge, lfmCorner, lfmCove, …}
//
// Herkunft der Faktoren (Ezarri-Mosaik-Rechner, https://www.ezarri.com/de/mosaik-rechner,
// Skript `form_calculator()`, gelesen am 28.10.2026):
//   Fläche   = (L·B + (2L + 2B)·Ø-Tiefe) · (1 + Marge/100), auf 2 Nachkommastellen
//   Rundung  = aufrunden auf volle Kartons (25 mm: 2 m², 50 mm: 1,45 m²)
//   Kleber   = m² · 2,5 kg, auf ganze kg gerundet
//   Fuge     = m² · 1,2 kg (25 mm) · 0,9 kg (36er-Zweig, bei uns Hexa) · 0,7 kg (50 mm)
//   Filze    = m² / 5, Schwämme = m² / 5, Litonet = m² / 8 (je gerundet)
//   Gummispachtel, Zange, Trennscheibe, Zahnspachtel 6 mm, Gummispachtel Zementfuge,
//   Mosaik-Kübel, Schleifscheibe: je 1 Stück
// Prüfwert (Ezarri-Beispiel): 10 × 5 m, Tiefe 2/1/1,5 m, 10 % → 106 m², 265 kg, 127 kg.
//
// Verpackung je Format aus den Ezarri-Produktdaten (src/lib/ezarri/references.json,
// `formate_verfuegbar`, identisch für alle Referenzen eines Formats bis auf eine
// Ausnahme; data.getPackaging() liefert die Werte je Referenz).
//
// JointPoint®: Ezarris Verbindung der Steinchen am Blatt (punktuell verklebt, ohne
// Papier/Netz). Es ist kein Zusatzmaterial; „JointPoint-Bedarf“ = Anzahl Blätter.
//
// Rein: keine Imports, kein React. Wird von Rechner, Custom Mix, Konfigurator (B)
// und node --test benutzt. Keine Preise.

/** Stand der Ezarri-Angaben. */
export const FAKTOREN_STAND = "2026-10-28";
export const FAKTOREN_QUELLE = "https://www.ezarri.com/de/mosaik-rechner";

/** Kleber je m² (Ezarri). */
export const KLEBER_KG_PRO_M2 = 2.5;

/**
 * Formate mit Verpackung (Ezarri-Produktdaten) und Fugenfaktor (Ezarri-Rechner).
 * `fugeKgProM2` für Hexa: Ezarris Skript kennt den Zweig „36“ (0,9 kg/m²), das
 * Formularmenü bietet aber nur 25/50 an → Annahme: der Zweig gilt für Hexa.
 */
export const FORMATE = Object.freeze({
  25: Object.freeze({
    id: "25",
    label: "25 mm",
    datenLabel: "25mm",
    steinMm: 24.7,
    blattCm: "31,2 × 49,5",
    steineProBlatt: "12 × 19",
    blattProKarton: 13,
    m2ProKarton: 2,
    m2ProPalette: 96,
    kgProM2: 9.4,
    dicke: "4,8 mm",
    fugeKgProM2: 1.2,
  }),
  50: Object.freeze({
    id: "50",
    label: "50 mm",
    datenLabel: "50 mm",
    steinMm: 50.7,
    blattCm: "31,2 × 47",
    steineProBlatt: "6 × 9",
    blattProKarton: 10,
    m2ProKarton: 1.45,
    m2ProPalette: 69.6,
    kgProM2: 13.4,
    dicke: "5,5 mm",
    fugeKgProM2: 0.7,
  }),
  hexa: Object.freeze({
    id: "hexa",
    label: "Hexa",
    datenLabel: "Hexa",
    steinMm: 33.4,
    blattCm: "31,5 × 47,2",
    steineProBlatt: "10 × 13",
    blattProKarton: 12,
    m2ProKarton: 1.75,
    m2ProPalette: 84,
    kgProM2: 9.58,
    dicke: "5 mm",
    fugeKgProM2: 0.9,
    fugeAnnahme: true,
  }),
});

export const FORMAT_IDS = Object.freeze(Object.keys(FORMATE));

/** Format-ID aus beliebiger Schreibweise ("25mm", "50 mm", "Hexa", 25) oder null. */
export function formatId(value) {
  const s = String(value ?? "").toLowerCase().replace(/\s|mm|safe/g, "");
  if (s === "25" || s === "50") return s;
  if (s === "hexa" || s === "hex" || s === "36") return "hexa";
  return null;
}

/**
 * Verpackung eines Formats; `override` (z. B. aus data.getPackaging einer Referenz)
 * ersetzt einzelne Werte, wenn sie gültige Zahlen sind.
 */
export function packagingFor(format, override = null) {
  const base = FORMATE[formatId(format) || "25"];
  if (!override) return base;
  const pick = (k) => (Number.isFinite(override[k]) && override[k] > 0 ? override[k] : base[k]);
  return { ...base, blattProKarton: pick("blattProKarton"), m2ProKarton: pick("m2ProKarton"), m2ProPalette: pick("m2ProPalette"), kgProM2: pick("kgProM2") };
}

// ---------------------------------------------------------------------------
// Rundung

/** Auf n Nachkommastellen (wie Number.toFixed, aber als Zahl und ohne Binärfehler bei .5). */
export function round(value, digits = 2) {
  const f = 10 ** digits;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/**
 * Anzahl Kartons für eine Fläche: aufrunden auf volle Kartons. Gerechnet in
 * ganzen cm², damit 104,00 / 2 nicht durch Binärfehler 53 Kartons ergibt.
 */
export function kartonsFuer(m2, m2ProKarton) {
  if (!(m2 > 0) || !(m2ProKarton > 0)) return 0;
  const a = Math.round(m2 * 10000);
  const k = Math.round(m2ProKarton * 10000);
  return Math.ceil(a / k);
}

// ---------------------------------------------------------------------------
// Mengen

/**
 * Mengen aus einer Netto-Fläche.
 * @param {object} p
 * @param {number|{gesamt:number, kantenLfm?:{corner?:number, cove?:number}}} p.flaechen
 *        Netto-Fläche in m² (Zahl) oder das Ergebnis von flaechen.poolFlaechen()/geometry.areas()
 * @param {number} [p.margeProzent=10] Verschnitt/Reserve in %
 * @param {string} [p.format="25"] "25" | "50" | "hexa"
 * @param {object} [p.packaging] Verpackung (packagingFor / data.getPackaging)
 * @param {Array<{id:string, anteil:number}>} [p.mix] Mischung: Kartons je Mosaik
 * @returns {{
 *   format: string, netto: number, margeProzent: number, mitMarge: number,
 *   m2: number, kartons: number, blaetter: number, paletten: number,
 *   kartonsUngemischt: number, mehrKartonsDurchMischung: number,   // mit Mischung: kartons = Σ mischung[].kartons
 *   volleKartonsPaletten: {paletten:number, kartons:number},
 *   kgMosaik: number, kgKleber: number, kgFuge: number,
 *   lfmCorner: number, lfmCove: number,
 *   mischung: Array<{id:string, anteil:number, m2:number, kartons:number, blaetter:number}>,
 *   werkzeug: Array<{id:string, label:string, stueck:number, gruppe:string}>
 * }}
 */
export function quantities({ flaechen, margeProzent = 10, format = "25", packaging, mix } = {}) {
  const fid = formatId(format) || "25";
  const pack = packaging ? { ...FORMATE[fid], ...packaging } : FORMATE[fid];
  const netto = Math.max(0, typeof flaechen === "number" ? flaechen : Number(flaechen?.gesamt) || 0);
  const marge = clampNumber(margeProzent, 0, 50, 10);
  // Ezarri: preArea = ((…) · (1 + margin/100)).toFixed(2)
  const mitMarge = round(netto * (1 + marge / 100), 2);
  const kartonsUngemischt = kartonsFuer(mitMarge, pack.m2ProKarton);

  // Mischung: jede Referenz bekommt ihren Anteil der Fläche mit Verschnitt, je auf
  // volle Kartons gerundet. Mit Mischung gilt die Summe der Einzelkartons als
  // Bestellmenge (sonst widersprechen sich Gesamtzahl und Aufteilung, QM P1-1).
  const mischung = (Array.isArray(mix) ? mix : [])
    .filter((x) => x && x.id && x.anteil > 0)
    .map((x) => {
      const teil = round((mitMarge * x.anteil) / 100, 2);
      const k = kartonsFuer(teil, pack.m2ProKarton);
      return { id: String(x.id), anteil: x.anteil, m2: round(k * pack.m2ProKarton, 2), kartons: k, blaetter: k * pack.blattProKarton };
    });
  const kartons = mischung.length ? mischung.reduce((sum, x) => sum + x.kartons, 0) : kartonsUngemischt;
  const m2 = round(kartons * pack.m2ProKarton, 2);
  const blaetter = kartons * pack.blattProKarton;
  const kartonsProPalette = Math.max(1, Math.round(pack.m2ProPalette / pack.m2ProKarton));
  const paletten = kartons ? Math.ceil(kartons / kartonsProPalette) : 0;
  const vollePaletten = Math.floor(kartons / kartonsProPalette);

  return {
    format: fid,
    netto: round(netto, 2),
    margeProzent: marge,
    mitMarge,
    m2,
    kartons,
    kartonsUngemischt,
    mehrKartonsDurchMischung: kartons - kartonsUngemischt,
    blaetter,
    paletten,
    volleKartonsPaletten: { paletten: vollePaletten, kartons: kartons - vollePaletten * kartonsProPalette },
    kartonsProPalette,
    kgMosaik: Math.round(m2 * pack.kgProM2),
    kgKleber: Math.round(m2 * KLEBER_KG_PRO_M2),
    kgFuge: Math.round(m2 * pack.fugeKgProM2),
    fugeKgProM2: pack.fugeKgProM2,
    lfmCorner: round(Number(flaechen?.kantenLfm?.corner) || 0, 1),
    lfmCove: round(Number(flaechen?.kantenLfm?.cove) || 0, 1),
    mischung,
    werkzeug: werkzeug(m2),
  };
}

/** Werkzeug und Zubehör laut Ezarri-Rechner (Stückzahlen aus der Fläche). */
export function werkzeug(m2) {
  const per = (n) => (m2 > 0 ? Math.max(1, Math.round(m2 / n)) : 0);
  const one = m2 > 0 ? 1 : 0;
  return [
    { id: "gummispachtel-epoxid", label: "Gummispachtel für Epoxidfuge", stueck: one, gruppe: "epoxid" },
    { id: "filze", label: "Filze", stueck: per(5), gruppe: "epoxid", regel: "1 je 5 m²" },
    { id: "schwaemme", label: "Schwämme", stueck: per(5), gruppe: "epoxid", regel: "1 je 5 m²" },
    { id: "litonet", label: "Litonet (Reiniger für Epoxidfuge)", stueck: per(8), gruppe: "epoxid", regel: "1 je 8 m²" },
    { id: "zange", label: "Mosaikzange", stueck: one, gruppe: "werkzeug" },
    { id: "trennscheibe", label: "Trennscheibe", stueck: one, gruppe: "werkzeug" },
    { id: "zahnspachtel", label: "Zahnspachtel 6 mm", stueck: one, gruppe: "werkzeug" },
    { id: "gummispachtel-zement", label: "Gummispachtel für Zementfuge", stueck: one, gruppe: "werkzeug" },
    { id: "kuebel", label: "Mosaik-Verlegekübel", stueck: one, gruppe: "werkzeug" },
    { id: "schleifscheibe", label: "Schleifscheibe", stueck: one, gruppe: "werkzeug" },
  ];
}

/** Zahl begrenzen; ungültig → Ersatzwert. */
export function clampNumber(value, min, max, fallback) {
  const n = typeof value === "string" ? Number.parseFloat(value.replace(",", ".")) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Zahl deutsch formatiert ("1.234,5"); ganze Zahlen ohne Nachkommastellen. */
export function formatZahl(value, digits = 2, locale = "de") {
  if (!Number.isFinite(value)) return "–";
  // Welle 2: englische Seiten mit Dezimalpunkt (en-GB).
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-AT", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
}
