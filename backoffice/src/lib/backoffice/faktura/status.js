// Statustöne je Beleg (10-konzept-faktura § 2.4, exakt 03 § 1.5): Farbe + Form + Wort über StatusBadge.
// „Gemahnt“ Stufe 1–2 orange mit Stufentext, Stufe 3 rot (E14). Ausgänge sind nie rot. Reines Modul.

import { wertLabel } from "./texte.js";

export const DOCTYPES = {
  angebot: "PH Angebot",
  auftrag: "PH Auftragsbestaetigung",
  rechnung: "PH Rechnung",
  gutschrift: "PH Gutschrift",
  mahnung: "PH Mahnung",
  er: "PH Eingangsrechnung",
  bank: "PH Bankumsatz",
  export: "PH Export Lauf",
  uva: "PH UVA Auswertung",
};

const T = {
  "PH Angebot": { Entwurf: "grau", Abgelaufen: "grau", Ersetzt: "grau", Gesendet: "blau", Angenommen: "gruen", Abgelehnt: "rot" },
  "PH Auftragsbestaetigung": { Offen: "blau", "In Bestellung": "tuerkis", Teilgeliefert: "orange", Geliefert: "gruen", Abgerechnet: "gruen", Storniert: "rot" },
  "PH Rechnung": { Entwurf: "grau", Gestellt: "blau", Teilbezahlt: "tuerkis", Ueberfaellig: "orange", Gemahnt: "orange", Bezahlt: "gruen", Storniert: "rot", Uneinbringlich: "rot" },
  "PH Gutschrift": { Entwurf: "grau", Erstattet: "grau", Gestellt: "blau", Verrechnet: "gruen" },
  "PH Mahnung": { Entwurf: "grau", Storniert: "grau", Gesendet: "blau", Erledigt: "gruen" },
  "PH Eingangsrechnung": { Erfasst: "blau", "Sachlich geprueft": "tuerkis", Freigegeben: "tuerkis", Bezahlt: "gruen", Abgelehnt: "rot" },
  "PH Bankumsatz": { Ignoriert: "grau", Offen: "blau", Teilweise: "tuerkis", Zugeordnet: "gruen" },
  "PH Export Lauf": { Entwurf: "grau", Erzeugt: "blau", Uebergeben: "tuerkis", Bestaetigt: "gruen" },
  "PH UVA Auswertung": { Entwurf: "grau", Berechnet: "blau", Uebergeben: "gruen" },
};

/** Statuswerte je DocType in fachlicher Reihenfolge (für Filter und Kanban). */
export const STATUS_WERTE = Object.fromEntries(Object.entries(T).map(([dt, m]) => [dt, Object.keys(m)]));

/**
 * Ton und Text eines Status.
 * @param {string} doctype
 * @param {string} status
 * @param {{mahnstufe?:number}} [zusatz]
 * @returns {{ton:string, text:string, wert:string}}
 */
export function statusAnzeige(doctype, status, { mahnstufe = 0 } = {}) {
  const wert = String(status || "");
  let ton = T[doctype]?.[wert] || "grau";
  let text = wertLabel(wert);
  if (doctype === "PH Rechnung" && wert === "Gemahnt") {
    const s = Number(mahnstufe) || 1;
    ton = s >= 3 ? "rot" : "orange";
    text = `Gemahnt · Stufe ${s}`;
  }
  return { ton, text, wert };
}

/** Ton-Tabelle für Komponenten, die nur `wert → ton` kennen (Kanban, Filter). */
export function tonTabelle(doctype) {
  return { ...(T[doctype] || {}) };
}

/** Gestellt (docstatus 1) → Schloss am Status. */
export function istGebucht(doc) {
  return Number(doc?.docstatus) === 1;
}

/** Rechnungsstatus, die als „offen“ gelten (Reiter Offen, Offene Posten). */
export const RE_OFFEN = ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"];
export const AB_LAUFEND = ["Offen", "In Bestellung", "Teilgeliefert", "Geliefert"];
export const AN_OFFEN = ["Entwurf", "Gesendet"];
