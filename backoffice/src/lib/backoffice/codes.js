// Code-Erkennung für Scanner und Palette (G-22): Was steckt in einer gescannten oder eingetippten Zeichenfolge?
// Formate exakt wie die Frappe-Apps (Backend-Import, nur gelesen):
//   Event-QR        PHE1.<event>.<zeile>.<signatur>        ph_marketing/utils/eventlogik.checkin_code
//   RKSV-QR         _R1-AT…                                 Kassenbeleg-Maschinencode (RKSV § 9)
//   Gutschein       PH-XXXX-XXXX-XXXX-XXXX (TEST-PH-… Test)  ph_shop/gutschein_code.normalisiere (32 Zeichen ohne 0/O/1/I)
//   Kundenkarte     KK-XXXXXX                               ph_core.utils.naming.referenz("KK")
//   Belegnummer     naming_series aller DocTypes            suche/<bereich>.js → nummernmuster
//   Kassenbeleg     <Kasse>-000123                          ph_kassa PHKassenbeleg.autoname
//   EAN/GTIN        8/12/13/14 Ziffern mit Prüfziffer
//   Lageretikett    <Lagerort>/<Platz>                      ph_logistik/bestand_logik.platz_code
//   Website-Link    https://…/<slug>                        ph_logistik/packtisch_logik.scan_treffer
//   Abholcode       6 Zeichen aus dem Alphabet (nur mit Option `abholcode`, sonst mehrdeutig)
// Reines, browsertaugliches Modul – keine Server-Importe.

import { nummerErkennen } from "./suche/register.js";

/** Alphabet der Kundenreferenzen, Gutschein- und Abholcodes (ph_core.utils.naming.ALPHABET). */
export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ZEICHEN = `[${ALPHABET}]`;

/**
 * @typedef {{art:"event-qr"|"kassenbeleg-qr"|"gutschein"|"kundenkarte"|"beleg"|"kassenbeleg"|"ean"|"lageretikett"|"url"|"abholcode"|"text",
 *   roh:string, wert:string, doctype?:string, name?:string, bereich?:string, test?:boolean, event?:string, zeile?:string,
 *   lagerort?:string, platz?:string|null, slug?:string}} CodeTreffer
 */

/** Gutschein-Eingabe → Normalform ('TEST' + 16 Zeichen oder 16 Zeichen) oder null (wie gutschein_code.normalisiere). */
export function normalisiereGutschein(eingabe) {
  let s = String(eingabe || "").toUpperCase().replace(/[\s-]/g, "");
  let test = false;
  if (s.startsWith("TEST")) {
    test = true;
    s = s.slice(4);
  }
  if (s.startsWith("PH")) s = s.slice(2);
  if (s.length !== 16 || [...s].some((c) => !ALPHABET.includes(c))) return null;
  return (test ? "TEST" : "") + s;
}

/** Normalform → Anzeigeform PH-XXXX-XXXX-XXXX-XXXX (Test: TEST-PH-…). */
export function gutscheinAnzeige(normalform) {
  const test = normalform.startsWith("TEST");
  const roh = test ? normalform.slice(4) : normalform;
  const gruppen = roh.match(/.{4}/g).join("-");
  return test ? `TEST-PH-${gruppen}` : `PH-${gruppen}`;
}

/** Prüfziffer EAN-8/UPC-A/EAN-13/GTIN-14 (Modulo 10, Gewichte 3/1 von rechts). */
export function eanGueltig(ziffern) {
  const s = String(ziffern || "");
  if (!/^\d{8}$|^\d{12,14}$/.test(s)) return false;
  const koerper = s.slice(0, -1);
  let summe = 0;
  for (let i = 0; i < koerper.length; i++) {
    const z = Number(koerper[koerper.length - 1 - i]);
    summe += i % 2 === 0 ? z * 3 : z;
  }
  return (10 - (summe % 10)) % 10 === Number(s.at(-1));
}

/** Abholcode-Eingabe wie ph_shop.normalisiere_abhol: groß, nur Buchstaben/Ziffern, O→0 und I→1. */
export function normalisiereAbholcode(wert) {
  return String(wert || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/I/g, "1");
}

/**
 * Zeichenfolge einordnen. Reihenfolge = Eindeutigkeit (signierte/präfixierte Codes zuerst).
 * @param {string} eingabe
 * @param {{abholcode?:boolean}} [opts] abholcode: 6-Zeichen-Codes als Abholcode werten (Packtisch, Shop-Abholung)
 * @returns {CodeTreffer}
 */
export function erkenneCode(eingabe, opts = {}) {
  const roh = String(eingabe ?? "");
  const t = roh.trim();
  const basis = { roh, wert: t };
  if (!t) return { ...basis, art: "text" };

  const ev = /^PHE1\.([^.\s]+)\.([^.\s]+)\.([^.\s]+)$/.exec(t);
  if (ev) return { ...basis, art: "event-qr", event: ev[1], zeile: ev[2] };

  if (/^_R1-AT\d*_/.test(t)) return { ...basis, art: "kassenbeleg-qr" };

  if (/^(TEST-?)?PH-?/i.test(t)) {
    const g = normalisiereGutschein(t);
    if (g) return { ...basis, art: "gutschein", wert: gutscheinAnzeige(g), test: g.startsWith("TEST") };
  }

  const kk = new RegExp(`^KK-?(${ZEICHEN}{6})$`, "i").exec(t);
  if (kk) return { ...basis, art: "kundenkarte", wert: `KK-${kk[1].toUpperCase()}`, doctype: "PH Kundenkarte", name: `KK-${kk[1].toUpperCase()}` };

  const nr = nummerErkennen(t);
  if (nr) return { ...basis, art: "beleg", wert: nr.name, doctype: nr.doctype, name: nr.name, bereich: nr.bereich };

  if (/^[A-Z0-9][A-Z0-9-]*-\d{6}$/i.test(t)) return { ...basis, art: "kassenbeleg", wert: t.toUpperCase(), doctype: "PH Kassenbeleg", name: t.toUpperCase() };

  if (/^\d+$/.test(t)) {
    if (eanGueltig(t)) return { ...basis, art: "ean", wert: t };
    return { ...basis, art: "text" };
  }

  if (/^https?:\/\//i.test(t)) {
    const ohne = t.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const slug = ohne.split("/").pop() || "";
    return { ...basis, art: "url", slug: slug.toLowerCase() };
  }

  if (t.includes("/") && !/\s\/|\/\s/.test(t)) {
    const i = t.indexOf("/");
    const lagerort = t.slice(0, i).trim();
    const platz = t.slice(i + 1).trim() || null;
    if (lagerort) return { ...basis, art: "lageretikett", lagerort, platz };
  }

  if (opts.abholcode) {
    const a = normalisiereAbholcode(t);
    if (a.length === 6) return { ...basis, art: "abholcode", wert: a };
  }

  return { ...basis, art: "text" };
}
