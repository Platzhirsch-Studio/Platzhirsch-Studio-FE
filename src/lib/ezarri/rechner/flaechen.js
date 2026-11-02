// src/lib/ezarri/rechner/flaechen.js – Flächen eines Beckens für den Mosaik-Rechner (Team C).
//
// Ein Modell, das man nachrechnen kann. Jede Teilfläche kommt mit ihrer Formel
// zurück (`teile[].formel`), die Oberfläche zeigt sie 1:1 an.
//
// Grundmodell (identisch mit Ezarri für das Rechteck):
//   Boden        Grundfläche der Form
//   Wände        Rechteck: 2 · L · Ø-Tiefe + B · Tiefe flach + B · Tiefe tief
//                (bei Ø = (flach + tief) / 2 gleich Ezarris (2L + 2B) · Ø)
//                L-Form, rund/oval, frei: Umfang · Ø-Tiefe
//   Ø-Tiefe      automatisch (flach + tief) / 2, oder eigener Wert (z. B. bei Knick im Boden)
//
// Einbauten (Treppe, Bank) sind feste Blöcke im Becken: Ihre Tritt-, Sitz- und
// Frontflächen ersetzen genau die Boden- und Wandfläche, die sie verdecken.
// Neu dazu kommen nur die freien Seitenflächen (Wangen). Die römische Treppe
// liegt in einer halbrunden Nische außerhalb des Grundrisses: Nische (Tritte)
// plus Setzstufen minus Wandöffnung.
//
// Rinne: Überlaufrinne = Rinnen-Länge · Abwicklung (Boden + Seiten der Rinne),
// Infinity-Kante = Kantenlänge · Abwicklung (Außenwand + Auffangrinne).
//
// Spezialteile (lfm):
//   Corner (Kantenstück)  Beckenkopf (= Umfang) + Stufenkanten + Sitzkante
//   Cove (Hohlkehle)      Boden-Wand-Fuge (= Umfang) + senkrechte Innenecken · Ø-Tiefe
//
// Vertrag: liefert dieselbe Form wie geometry.areas() von Team B
//   {boden, waende, treppe, bank, rinne, gesamt, kantenLfm:{corner, cove}}
// plus `teile`, `umfang`, `tiefeMittel`, `hinweise`.
// Rein, keine Imports außer core.js.
import { clampNumber, formatZahl, round } from "./core.js";

export const FORMEN = Object.freeze(["rechteck", "l", "rund", "frei"]);
export const TREPPEN = Object.freeze(["keine", "gerade", "ecke", "roemisch"]);
export const RINNEN = Object.freeze(["skimmer", "ueberlauf", "infinity"]);

/** Grenzen der Eingaben (m). Auch Grundlage der Fehlermeldungen in der Oberfläche. */
export const GRENZEN = Object.freeze({
  l: [1, 50],
  b: [1, 25],
  lAus: [0.5, 49],
  bAus: [0.5, 24],
  flaecheFrei: [1, 1000],
  umfangFrei: [4, 300],
  tFlach: [0.3, 5],
  tTief: [0.3, 5],
  tMittel: [0.3, 5],
  marge: [0, 50],
  treppeBreite: [0.5, 25],
  stufen: [1, 12],
  auftritt: [0.2, 1],
  steigung: [0.1, 0.4],
  bankLaenge: [0, 50],
  bankTiefe: [0.25, 1],
  bankUnterWasser: [0.2, 1.2],
  rinneLfm: [0, 300],
  rinneAbwicklung: [0.1, 2],
  ecken: [0, 30],
});

/** Startwerte = Ezarris Beispiel (10 × 5 m, 1 / 2 m, 10 %). */
export const STANDARD = Object.freeze({
  form: "rechteck",
  format: "25",
  l: 10,
  b: 5,
  lAus: 4,
  bAus: 2,
  flaecheFrei: 40,
  umfangFrei: 28,
  ecken: 0,
  tFlach: 1,
  tTief: 2,
  tMittel: null,
  marge: 10,
  boden: true,
  waende: true,
  treppe: "keine",
  treppeBreite: 2,
  stufen: 4,
  auftritt: 0.3,
  steigung: 0.2,
  bankLaenge: 0,
  bankTiefe: 0.4,
  bankUnterWasser: 0.5,
  rinne: "skimmer",
  rinneLfm: null,
  rinneAbwicklung: null,
  spezial: true,
});

/** Abwicklung je Rinnentyp in m (Annahme, im Feld änderbar). */
export const RINNE_ABWICKLUNG = Object.freeze({ skimmer: 0, ueberlauf: 0.4, infinity: 0.9 });

const num = (v) => (typeof v === "string" ? Number.parseFloat(v.replace(",", ".")) : Number(v));
const m = (v) => formatZahl(round(v, 2), 2);
const qm = (v) => `${formatZahl(round(v, 2), 2)} m²`;

/**
 * Eingaben säubern: Zahlen aus Strings mit Komma, Grenzen prüfen, Auswahlwerte prüfen.
 * Ungültige Zahlen → Fehlertext je Feld und Startwert für die Rechnung.
 * @returns {{werte: object, fehler: Record<string,string>, hinweise: string[]}}
 */
export function normalizeEingabe(input = {}) {
  const fehler = {};
  const hinweise = [];
  const w = { ...STANDARD };
  const pick = (key, list) => {
    if (input[key] !== undefined && list.includes(input[key])) w[key] = input[key];
  };
  pick("form", FORMEN);
  pick("treppe", TREPPEN);
  pick("rinne", RINNEN);
  if (["25", "50", "hexa"].includes(String(input.format))) w.format = String(input.format);
  for (const key of ["boden", "waende", "spezial"]) if (typeof input[key] === "boolean") w[key] = input[key];

  const field = (key, { optional = false } = {}) => {
    const raw = input[key];
    if (raw === undefined || raw === null || raw === "") {
      if (optional) w[key] = null;
      return;
    }
    const n = num(raw);
    const [lo, hi] = GRENZEN[key];
    if (!Number.isFinite(n)) {
      fehler[key] = "Bitte eine Zahl eingeben, z. B. 1,5.";
      return;
    }
    if (n < lo || n > hi) {
      fehler[key] = `Bitte einen Wert zwischen ${formatZahl(lo)} und ${formatZahl(hi)} eingeben.`;
      return;
    }
    w[key] = n;
  };
  for (const key of ["l", "b", "lAus", "bAus", "flaecheFrei", "umfangFrei", "ecken", "tFlach", "tTief", "marge", "treppeBreite", "stufen", "auftritt", "steigung", "bankLaenge", "bankTiefe", "bankUnterWasser"]) field(key);
  for (const key of ["tMittel", "rinneLfm", "rinneAbwicklung"]) field(key, { optional: true });
  w.stufen = Math.round(w.stufen);
  w.ecken = Math.round(w.ecken);

  if (w.tFlach > w.tTief) {
    [w.tFlach, w.tTief] = [w.tTief, w.tFlach];
    hinweise.push("Tiefe flach war größer als Tiefe tief, die Werte wurden getauscht.");
  }
  if (w.tMittel !== null && (w.tMittel < w.tFlach - 1e-9 || w.tMittel > w.tTief + 1e-9)) {
    fehler.tMittel = "Die durchschnittliche Tiefe liegt zwischen Tiefe flach und Tiefe tief.";
    w.tMittel = null;
  }
  if (w.form === "l") {
    if (w.lAus >= w.l) fehler.lAus = "Die Aussparung muss kürzer sein als die Gesamtlänge.";
    if (w.bAus >= w.b) fehler.bAus = "Die Aussparung muss schmaler sein als die Gesamtbreite.";
    if (fehler.lAus || fehler.bAus) {
      w.lAus = Math.min(w.lAus, w.l / 2);
      w.bAus = Math.min(w.bAus, w.b / 2);
    }
  }
  if (w.form === "frei") {
    // Kein Grundriss hat bei gegebener Fläche einen kleineren Umfang als der Kreis.
    const minU = 2 * Math.sqrt(Math.PI * w.flaecheFrei);
    if (w.umfangFrei < minU - 0.01) fehler.umfangFrei = `Bei ${m(w.flaecheFrei)} m² Fläche ist der Umfang mindestens ${m(minU)} m (Kreis).`;
  }
  if (w.treppe !== "keine") {
    const hoehe = w.stufen * w.steigung;
    if (hoehe > w.tFlach + 1e-9) {
      fehler.stufen = `${w.stufen} Stufen à ${m(w.steigung)} m sind höher als die flache Tiefe (${m(w.tFlach)} m).`;
    }
    const maxBreite = w.form === "rund" ? Math.min(w.l, w.b) : w.form === "frei" ? Math.sqrt(w.flaecheFrei) : w.b;
    if (w.treppeBreite > maxBreite + 1e-9) fehler.treppeBreite = `Die Treppe ist breiter als das Becken (${m(maxBreite)} m).`;
  }
  if (w.bankLaenge > 0 && w.bankUnterWasser >= (w.tMittel ?? (w.tFlach + w.tTief) / 2)) {
    fehler.bankUnterWasser = "Die Sitzfläche liegt tiefer als der Beckenboden.";
  }
  return { werte: w, fehler, hinweise };
}

/** Ellipsen-Umfang (Ramanujan II, Fehler < 0,01 % für Pool-Proportionen). */
export function ellipseUmfang(achseL, achseB) {
  const a = achseL / 2;
  const b = achseB / 2;
  const h = ((a - b) / (a + b)) ** 2;
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * Flächen eines Beckens.
 * @param {object} input Eingaben (Strings mit Komma oder Zahlen), siehe STANDARD
 * @returns {{
 *   form:string, umfang:number, tiefeMittel:number, tiefeAuto:boolean,
 *   teile:Array<{id:string,label:string,m2:number,formel:string}>,
 *   boden:number, waende:number, treppe:number, bank:number, rinne:number, gesamt:number,
 *   kantenLfm:{corner:number, cove:number}, kantenFormel:{corner:string, cove:string},
 *   fehler:Record<string,string>, hinweise:string[], werte:object
 * }}
 */
export function poolFlaechen(input = {}) {
  const { werte: w, fehler, hinweise } = normalizeEingabe(input);
  const tAuto = (w.tFlach + w.tTief) / 2;
  const tm = w.tMittel ?? tAuto;
  const teile = [];
  let boden = 0;
  let waende = 0;
  let umfang = 0;
  let innenEcken = 0; // senkrechte Ecken für Cove
  let bodenFormel = "";
  let wandFormel = "";

  if (w.form === "rechteck") {
    boden = w.l * w.b;
    umfang = 2 * (w.l + w.b);
    waende = 2 * w.l * tm + w.b * w.tFlach + w.b * w.tTief;
    innenEcken = 4;
    bodenFormel = `Länge × Breite = ${m(w.l)} × ${m(w.b)}`;
    wandFormel = `2 × Länge × Ø-Tiefe + Breite × (flach + tief) = 2 × ${m(w.l)} × ${m(tm)} + ${m(w.b)} × (${m(w.tFlach)} + ${m(w.tTief)})`;
    if (w.tMittel !== null && Math.abs(w.tMittel - tAuto) > 1e-9)
      hinweise.push("Ø-Tiefe von Hand gesetzt: Die Längswände rechnen mit Ø, die Stirnwände mit ihrer echten Höhe (flach und tief). Ezarris Rechner nimmt Ø für alle vier Wände und kommt hier auf etwas weniger Fläche.");
  } else if (w.form === "l") {
    boden = w.l * w.b - w.lAus * w.bAus;
    umfang = 2 * (w.l + w.b);
    waende = umfang * tm;
    innenEcken = 6;
    bodenFormel = `Länge × Breite − Aussparung = ${m(w.l)} × ${m(w.b)} − ${m(w.lAus)} × ${m(w.bAus)}`;
    wandFormel = `Umfang × Ø-Tiefe = 2 × (${m(w.l)} + ${m(w.b)}) × ${m(tm)}`;
  } else if (w.form === "rund") {
    boden = (Math.PI * w.l * w.b) / 4;
    umfang = ellipseUmfang(w.l, w.b);
    waende = umfang * tm;
    innenEcken = 0;
    const kreis = Math.abs(w.l - w.b) < 1e-9;
    bodenFormel = kreis ? `π × (Durchmesser / 2)² = π × (${m(w.l)} / 2)²` : `π × Länge/2 × Breite/2 = π × ${m(w.l / 2)} × ${m(w.b / 2)}`;
    wandFormel = `Umfang × Ø-Tiefe = ${m(umfang)} × ${m(tm)}${kreis ? "" : " (Umfang der Ellipse nach Ramanujan)"}`;
  } else {
    boden = w.flaecheFrei;
    umfang = w.umfangFrei;
    waende = umfang * tm;
    innenEcken = w.ecken;
    bodenFormel = `Grundfläche laut Plan = ${m(w.flaecheFrei)}`;
    wandFormel = `Umfang × Ø-Tiefe = ${m(w.umfangFrei)} × ${m(tm)}`;
  }

  if (w.boden) teile.push({ id: "boden", label: "Boden", m2: round(boden, 2), formel: `${bodenFormel} = ${qm(boden)}` });
  if (w.waende) teile.push({ id: "waende", label: "Wände", m2: round(waende, 2), formel: `${wandFormel} = ${qm(waende)}` });
  if (!w.boden) boden = 0;
  if (!w.waende) waende = 0;

  // Treppe ------------------------------------------------------------------
  let treppe = 0;
  let cornerTreppe = 0;
  let treppeFormel = "";
  if (w.treppe !== "keine") {
    const n = w.stufen;
    const a = w.auftritt;
    const h = w.steigung;
    const wange = (a * h * n * (n + 1)) / 2; // Stufenprofil einer Seite
    if (w.treppe === "gerade") {
      // Über die ganze Beckenbreite: keine freie Wange. Teilbreite: 2 Wangen.
      const vollbreite = w.form !== "frei" && Math.abs(w.treppeBreite - (w.form === "rund" ? Math.min(w.l, w.b) : w.b)) < 0.05;
      const seiten = vollbreite ? 0 : 2;
      treppe = seiten * wange;
      cornerTreppe = n * w.treppeBreite;
      treppeFormel = vollbreite
        ? "Treppe über die ganze Breite: Tritt- und Setzstufen ersetzen die verdeckte Boden- und Wandfläche, keine freien Seiten = 0 m²"
        : `2 Wangen × Auftritt × Steigung × n(n+1)/2 = 2 × ${m(a)} × ${m(h)} × ${(n * (n + 1)) / 2}`;
    } else if (w.treppe === "ecke") {
      treppe = wange;
      cornerTreppe = n * w.treppeBreite;
      treppeFormel = `1 Wange × Auftritt × Steigung × n(n+1)/2 = ${m(a)} × ${m(h)} × ${(n * (n + 1)) / 2}`;
    } else {
      // Römisch: halbrunde Nische mit Radius r = Breite / 2, Stufenradien r, r − a, …
      const r = w.treppeBreite / 2;
      const radien = Array.from({ length: n }, (_, i) => Math.max(0, r - i * a));
      const nische = (Math.PI * r * r) / 2;
      const setz = radien.reduce((s, ri) => s + Math.PI * ri * h, 0);
      const oeffnung = w.treppeBreite * n * h;
      treppe = Math.max(0, nische + setz - oeffnung);
      cornerTreppe = radien.reduce((s, ri) => s + Math.PI * ri, 0);
      treppeFormel = `Nische π·r²/2 + Setzstufen Σ π·rᵢ·h − Wandöffnung Breite·n·h = ${m(nische)} + ${m(setz)} − ${m(oeffnung)}`;
    }
    teile.push({ id: "treppe", label: treppeLabel(w.treppe, n), m2: round(treppe, 2), formel: `${treppeFormel} = ${qm(treppe)}` });
  }

  // Sitzbank ----------------------------------------------------------------
  let bank = 0;
  let cornerBank = 0;
  if (w.bankLaenge > 0) {
    const hb = Math.max(0, tm - w.bankUnterWasser); // Höhe der Bank über dem Boden
    bank = 2 * w.bankTiefe * hb;
    cornerBank = w.bankLaenge;
    teile.push({
      id: "bank",
      label: `Sitzbank ${m(w.bankLaenge)} m`,
      m2: round(bank, 2),
      formel: `Sitz und Front ersetzen verdeckte Fläche; 2 Wangen × Sitztiefe × Höhe = 2 × ${m(w.bankTiefe)} × ${m(hb)} = ${qm(bank)}`,
    });
  }

  // Rinne -------------------------------------------------------------------
  let rinne = 0;
  let rinneLfm = 0;
  if (w.rinne !== "skimmer") {
    rinneLfm = w.rinneLfm ?? (w.rinne === "ueberlauf" ? umfang : w.form === "rund" ? umfang / 2 : w.l);
    const abw = w.rinneAbwicklung ?? RINNE_ABWICKLUNG[w.rinne];
    rinne = rinneLfm * abw;
    teile.push({
      id: "rinne",
      label: w.rinne === "ueberlauf" ? "Überlaufrinne" : "Infinity-Kante",
      m2: round(rinne, 2),
      formel: `Länge × Abwicklung = ${m(rinneLfm)} × ${m(abw)} = ${qm(rinne)}`,
    });
  }

  const gesamt = teile.reduce((s, t) => s + t.m2, 0);
  const corner = w.spezial ? umfang + cornerTreppe + cornerBank : 0;
  const cove = w.spezial && w.boden && w.waende ? umfang + innenEcken * tm : 0;

  return {
    form: w.form,
    format: w.format,
    margeProzent: w.marge,
    umfang: round(umfang, 2),
    tiefeMittel: round(tm, 3),
    tiefeAuto: w.tMittel === null,
    teile,
    boden: round(boden, 2),
    waende: round(waende, 2),
    treppe: round(treppe, 2),
    bank: round(bank, 2),
    rinne: round(rinne, 2),
    rinneLfm: round(rinneLfm, 2),
    gesamt: round(gesamt, 2),
    kantenLfm: { corner: round(corner, 1), cove: round(cove, 1) },
    kantenFormel: {
      corner: w.spezial
        ? `Beckenkopf ${m(umfang)}${cornerTreppe ? ` + Stufenkanten ${m(cornerTreppe)}` : ""}${cornerBank ? ` + Sitzkante ${m(cornerBank)}` : ""} = ${m(corner)} lfm`
        : "",
      cove: cove ? `Boden-Wand-Kante ${m(umfang)}${innenEcken ? ` + ${innenEcken} Ecken × ${m(tm)}` : ""} = ${m(cove)} lfm` : "",
    },
    fehler,
    hinweise,
    werte: w,
  };
}

function treppeLabel(typ, n) {
  const art = { gerade: "Gerade Treppe", ecke: "Ecktreppe", roemisch: "Römische Treppe" }[typ] || "Treppe";
  return `${art}, ${n} ${n === 1 ? "Stufe" : "Stufen"}`;
}
