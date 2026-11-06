// Schalter des Bereichs Faktura (10-konzept-faktura § 2.7, E6) als Fähigkeiten des Fundaments (G-04, MASTER § 3.5:
// „schalter.js → <bereich>/faehigkeiten.js“). Standard aus, bis die Voraussetzung erfüllt ist; die Probe prüft
// die echten Backend-Dateien (Mock) bzw. getMeta (Frappe). Im Mock einzeln umschaltbar über das Cookie
// `ph_bo_faehigkeiten` (z. B. „faktura.*“ oder „-faktura.guthaben“) – Abnahme ohne Neustart.
// Rein (keine "@/"-Importe).

import { definiereFaehigkeiten } from "../faehigkeiten.js";

const ersatz = (titel, href) => ({ titel, href });

export const FAKTURA = definiereFaehigkeiten("faktura", {
  // E1 Go-Live-Sperre: echte Belege erst nach P-01…P-12 und StB 1/2/3/5/9 – Betrieb schaltet frei.
  echtbelege: { titel: "Echte Belege stellen", grund: "Testbetrieb – echte Belege erst nach Freigabe durch Backend und Steuerberatung", ersatz: ersatz("Testmandant") },
  "stripe-link": { titel: "Zahlungslink (Stripe Link)", grund: "Zahlungslink erst nach Klärung durch die Steuerberatung", probe: { doctype: "PH Angebot", docmethode: "anzahlungslink" }, erwartet: false },
  "zuordnung-loesen": { titel: "Zuordnung lösen", probe: { doctype: "PH Bankumsatz", docmethode: "zuordnung_loesen" }, ersatz: ersatz("Leitung bitten") },
  guthaben: { titel: "Rest als Guthaben", probe: { doctype: "PH Kundenguthaben" }, erwartet: false },
  differenz: { titel: "Skonto oder Kleindifferenz buchen", probe: { doctype: "PH Rechnung", docmethode: "differenz_buchen" }, ersatz: ersatz("Differenz bleibt offen") },
  mahnspesen: { titel: "Mahnspesen und Verzugszinsen", probe: { doctype: "PH Mahnung", feld: "spesen_offen_cent" }, erwartet: false },
  uneinbringlich: { titel: "Als uneinbringlich buchen", probe: { doctype: "PH Rechnung", docmethode: "uneinbringlich" }, grund: "Folgt – Steuerberichtigung fehlt noch", recht: { bereich: "faktura", aktion: "cancel" } },
  fagg: { titel: "Rücktrittsfrist nach FAGG", probe: { doctype: "PH Auftragsbestaetigung", docmethode: "ruecktritt_fagg" }, erwartet: false },
  "korrektur-mit-zahlung": { titel: "Rechnung korrigieren mit Zahlungen", probe: { doctype: "PH Rechnung", docmethode: "korrigieren" }, ersatz: ersatz("nur Rechnungen ohne Zahlung") },
  monatsabschluss: { titel: "Monat abschließen", probe: { doctype: "PH Faktura Einstellungen", feld: "gesperrt_bis" }, grund: "Sperre folgt mit dem Backend (gesperrt_bis)" },
  stichtag: { titel: "Offene Posten zum Stichtag", probe: { doctype: "PH Rechnung", docmethode: "op_stichtag" }, grund: "Stichtagsauswertung folgt" },
  ausfuhr: { titel: "Ausfuhrnachweise", probe: { doctype: "PH Rechnung", feld: "ausfuhr_mrn" }, erwartet: false },
  "rest-aufloesen": { titel: "Rest auflösen (Schlussrechnung)", probe: { doctype: "PH Rechnung", docmethode: "rest_aufloesen" }, ersatz: ersatz("Leitung bitten") },
  abschlag: { titel: "Abschlag statt Teilrechnung", probe: { doctype: "PH Auftragsbestaetigung", feld: "abschlag" }, erwartet: false },
  "post-versand": { titel: "Versand per Post vermerken", probe: { doctype: "PH Rechnung", docmethode: "als_gesendet_markieren" } },
  "lieferanten-gutschrift": { titel: "Lieferanten-Gutschrift", probe: { doctype: "PH Eingangsrechnung", feld: "belegart" }, erwartet: false },
  "angebot-ablaufen": { titel: "Angebot ablaufen lassen", probe: { doctype: "PH Angebot", docmethode: "ablaufen" }, erwartet: false },
  "uva-korrektur": { titel: "Korrektur-Auswertung", probe: { doctype: "PH UVA Auswertung", feld: "korrektur_zu" }, ersatz: ersatz("Mit Steuerberater abstimmen") },
  "kette-pruefen": { titel: "Buchungen auf Veränderung prüfen", probe: { methode: "ph_faktura.api.journal_kette_pruefen" }, recht: { bereich: "faktura", aktion: "cancel" } },
  kostenzuordnung: { titel: "Kostenzuordnung", probe: { doctype: "PH Eingangsrechnung", feld: "zuordnung_modus" } },
  umbuchen: { titel: "Kosten umbuchen", probe: { doctype: "PH Eingangsrechnung", docmethode: "zuordnung_umbuchen" }, recht: { bereich: "faktura", aktion: "cancel" } },
  sepa: { titel: "SEPA-Datei für den Zahllauf", probe: { methode: "ph_faktura.api.sepa_zahllauf" }, erwartet: false },
});

export const SCHALTER_IDS = Object.keys(FAKTURA);

/** Kurzname (camelCase wie § 2.7) → volle ID („stripeLink“ → „faktura.stripe-link“). */
export const SCHALTER = Object.fromEntries(SCHALTER_IDS.map((id) => [id.replace(/^faktura\./, "").replace(/-([a-z])/g, (_, b) => b.toUpperCase()), id]));

/** Status-Map { kurz: boolean } aus faehigkeiten()-Ergebnis. */
export function schalterAn(stati = {}) {
  return Object.fromEntries(Object.entries(SCHALTER).map(([kurz, id]) => [kurz, !!stati[id]?.an]));
}
