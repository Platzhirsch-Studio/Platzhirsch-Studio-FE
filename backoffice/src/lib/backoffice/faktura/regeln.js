// Kleine Regelmodule des Bereichs Faktura in einer Datei (10-konzept-faktura § 16.1):
// kanaele (E2, R-01…R-03), datumsregeln (E7, B-04, R-09), bankanker (§ 3.5), felder (B-03), mahnvorschlag (§ 5.16).
// Rein, testbar mit node --test.

import { tageZwischen } from "./betraege.js";

// ------------------------------------------------------------------ Kanäle --

/** Backend-Werte der erlaubten Zahlkanäle (zahlung_erfassen erwartet „Ueberweisung“). */
export const KANAL = { ueberweisung: "Ueberweisung", stripe: "Stripe Link" };
export const VERBOTEN = ["Bar", "Karte", "Karte extern", "Gutschein", "Verrechnung", "Stripe Terminal", "Skonto"];

/** Erlaubte Kanäle für „Zahlung erfassen“ (E2): Überweisung, mit Schalter stripeLink zusätzlich Stripe Link. */
export function zahlKanaele({ stripeLink = false } = {}) {
  return stripeLink ? [KANAL.ueberweisung, KANAL.stripe] : [KANAL.ueberweisung];
}

/** Erstattung: nur Überweisung (Rückerstattung über Shop bei Stripe-Ursprung folgt mit ph_shop). */
export function erstattKanaele() {
  return [KANAL.ueberweisung];
}

export function kanalErlaubt(kanal, schalter = {}) {
  return zahlKanaele(schalter).includes(kanal);
}

// ------------------------------------------------------------ Datumsregeln --

/** Monat als „Oktober 2026“. */
const MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
export function monatName(iso, mitJahr = true) {
  const d = String(iso || "").slice(0, 7);
  const [j, m] = d.split("-").map(Number);
  if (!j || !m) return "";
  return mitJahr ? `${MONATE[m - 1]} ${j}` : MONATE[m - 1];
}
export function monatsEnde(isoMonat) {
  const [j, m] = String(isoMonat).slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(j, m, 0));
  return d.toISOString().slice(0, 10);
}
export function vormonat(iso) {
  const [j, m] = String(iso).slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(j, m - 2, 1));
  return d.toISOString().slice(0, 7);
}
export function folgemonat(iso) {
  const [j, m] = String(iso).slice(0, 7).split("-").map(Number);
  const d = new Date(Date.UTC(j, m, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Rechnungsdatum prüfen (E7, B-04, F-22): Standard heute; ein anderes Datum nur Leitung, nie vor der letzten
 * gestellten Rechnung und nie in einen abgeschlossenen Monat.
 * @returns {{ok:boolean, code?:string, text?:string}}
 */
export function pruefeRechnungsdatum({ datum, heute, leitung = false, letzte = null, gesperrtBis = null }) {
  const d = String(datum || heute).slice(0, 10);
  if (d !== String(heute).slice(0, 10) && !leitung) return { ok: false, code: "forbidden", text: "Anderes Rechnungsdatum nur Faktura-Leitung" };
  if (gesperrtBis && d <= String(gesperrtBis).slice(0, 10)) return { ok: false, code: "invalid", text: `${monatName(gesperrtBis)} ist abgeschlossen` };
  if (letzte?.datum && d < String(letzte.datum).slice(0, 10)) return { ok: false, code: "invalid", text: `Vor ${letzte.nummer || letzte.name} vom ${deutsch(letzte.datum)} nicht möglich` };
  return { ok: true };
}

/** Datum allgemein gegen gesperrt_bis (Gutschrift, ER-Buchungsmonat). */
export function datumGesperrt(datum, gesperrtBis) {
  return !!(gesperrtBis && String(datum).slice(0, 10) <= String(gesperrtBis).slice(0, 10));
}

/** UVA-Monat (P-09): min(Rechnungsmonat, Leistungsmonat + 1). */
export function uvaMonat(rechnungsdatum, leistungsdatum) {
  const r = String(rechnungsdatum).slice(0, 7);
  if (!leistungsdatum) return r;
  const l1 = folgemonat(leistungsdatum);
  return l1 < r ? l1 : r;
}

/** Späte Rechnung (R-09): Leistung mehr als 1 Monat vor dem Rechnungsmonat → Warnband. */
export function spaeteRechnung(rechnungsdatum, leistungsdatum) {
  if (!leistungsdatum) return null;
  const uva = uvaMonat(rechnungsdatum, leistungsdatum);
  if (uva >= String(rechnungsdatum).slice(0, 7)) return null;
  return { leistungMonat: monatName(leistungsdatum, false), rechnungMonat: monatName(rechnungsdatum, false), uvaMonat: monatName(uva, false), uva };
}

export function deutsch(iso) {
  const s = String(iso || "").slice(0, 10);
  const [j, m, t] = s.split("-");
  return j && m && t ? `${t}.${m}.${j}` : "";
}

export function plusTage(iso, n) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(n || 0));
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- Bankanker --

const MUSTER = [
  { art: "rechnung", doctype: "PH Rechnung", re: /\bRE-?(\d{4})-?(\d{5})\b/i, bau: (m) => `RE-${m[1]}-${m[2]}`, sicherheit: 100, grund: "nummer" },
  { art: "auftrag", doctype: "PH Auftragsbestaetigung", re: /\bAB-?(\d{4})-?(\d{5})\b/i, bau: (m) => `AB-${m[1]}-${m[2]}`, sicherheit: 100, grund: "ab" },
  { art: "er", doctype: "PH Eingangsrechnung", re: /\bER-?(\d{4})-?(\d{5})\b/i, bau: (m) => `ER-${m[1]}-${m[2]}`, sicherheit: 100, grund: "er" },
];

/** Belegnummern im Verwendungszweck (RE/AB/ER), in Reihenfolge des Auftretens. */
export function ankerAusZweck(text) {
  const s = String(text || "");
  const treffer = [];
  for (const m of MUSTER) {
    const g = new RegExp(m.re.source, "gi");
    let x;
    while ((x = g.exec(s))) treffer.push({ art: m.art, doctype: m.doctype, nummer: m.bau(x), sicherheit: m.sicherheit, grund: m.grund, pos: x.index });
  }
  return treffer.sort((a, b) => a.pos - b.pos).map(({ pos: _p, ...t }) => t);
}

/** Sicherheitswort aus der Zahl (nur Wort in der Liste, Zahl im Peek). */
export function sicherheitWort(zahl, { auftrag = false } = {}) {
  if (auftrag) return "Auftrag";
  const n = Number(zahl) || 0;
  if (n >= 100) return "Sicher";
  if (n >= 80) return "Wahrscheinlich";
  if (n >= 60) return "Möglich";
  if (n > 0) return "Unklar";
  return "";
}

/** Material/Ton der Sicherheit (Pille, nie Farbe allein). */
export function sicherheitMaterial(wort) {
  return { Sicher: "salbei", Wahrscheinlich: "see", Möglich: "eiche", Unklar: "stein", Auftrag: "cognac" }[wort] || "stein";
}

// ------------------------------------------------------------------- Felder --

/** Felder, die Next an gestellten Belegen schreiben darf (B-03, P-03). Alles andere nur über Methoden. */
export const SCHREIBBAR_NACH_STELLEN = Object.freeze({
  "PH Rechnung": ["mahnsperre", "mahnsperre_grund", "notiz_intern"],
  "PH Gutschrift": ["notiz_intern"],
  "PH Eingangsrechnung": ["zahllauf", "notiz"],
});

/** Prüft eine geplante Feldänderung an einem gestellten Beleg. */
export function darfFeldSchreiben(doctype, doc, felder) {
  if (Number(doc?.docstatus) !== 1 && !["Freigegeben", "Bezahlt"].includes(doc?.status)) return true;
  const erlaubt = SCHREIBBAR_NACH_STELLEN[doctype] || [];
  return Object.keys(felder || {}).every((f) => erlaubt.includes(f) || f === "name" || f === "modified");
}

// ------------------------------------------------------------ Mahnvorschlag --

/**
 * Mahnvorschlag im Client filtern (§ 5.16, F-11): nur gestellte, versandte, überfällige Rechnungen ohne Mahnsperre,
 * über dem Mindestbetrag und nach der Wartezeit. Nicht versandte und gesperrte bleiben sichtbar, aber grau.
 * @returns {Array<object & {waehlbar:boolean, grund?:string, naechste:number, tage:number, post:boolean}>}
 */
export function mahnvorschlag(rechnungen = [], { heute, karenzTage = 7, mindestCent = 1000, maxStufe = 3, abstandTage = 14 } = {}) {
  const out = [];
  for (const r of rechnungen) {
    if (Number(r.docstatus) !== 1) continue;
    if (!["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"].includes(r.status)) continue;
    const offen = Number(r.offen_cent) || 0;
    if (offen <= 0) continue;
    const tage = tageZwischen(r.faellig, heute);
    if (tage <= karenzTage) continue;
    const stufe = Number(r.mahnstufe) || 0;
    const naechste = Math.min(stufe + 1, maxStufe);
    const post = !r.email;
    let waehlbar = true;
    let grund;
    if (r.mahnsperre) {
      waehlbar = false;
      grund = "sperre";
    } else if (!r.gesendet_am && !r.versandkanal) {
      waehlbar = false;
      grund = "nichtVersandt";
    } else if (offen < mindestCent) {
      waehlbar = false;
      grund = "mindest";
    } else if (stufe >= maxStufe) {
      waehlbar = false;
      grund = "hoechste";
    } else if (r.letzte_mahnung && tageZwischen(r.letzte_mahnung, heute) < abstandTage) {
      waehlbar = false;
      grund = "abstand";
    }
    out.push({ ...r, tage, naechste, post, waehlbar, grund });
  }
  return out.sort((a, b) => Number(b.waehlbar) - Number(a.waehlbar) || b.tage - a.tage);
}

/** Nächste Mahnstufe frühestens am … (Tab „Zahlung & Mahnung“). */
export function naechsteMahnungAb(r, { karenzTage = 7, abstandTage = 14 } = {}) {
  if (!r?.faellig) return null;
  if (r.letzte_mahnung) return plusTage(r.letzte_mahnung, abstandTage);
  return plusTage(r.faellig, karenzTage + 1);
}
