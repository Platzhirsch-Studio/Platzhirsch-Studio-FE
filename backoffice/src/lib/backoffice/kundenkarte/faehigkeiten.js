// Fähigkeiten des Bereichs Kundenkarte (G-04, Konzept §9.3 „Fähigkeit aus Meta“).
// Jede fehlende Backend-Fähigkeit hat eine Übergangsregel in der Oberfläche – kein Knopf endet mit Fehler.
// Probe gegen Backend-Import (Mock) bzw. getdoctype (Frappe). Mock-Schalter: BACKOFFICE_MOCK_FAEHIGKEITEN
// bzw. Cookie ph_bo_faehigkeiten (z. B. „alle“, „keine“, „kundenkarte.*“).

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const KUNDENKARTE = definiereFaehigkeiten("kundenkarte", {
  einwilligung_erteilen: {
    titel: "Einwilligung mit Nachweis als eigene Methode (P3)",
    probe: { doctype: "PH Kundenkarte", docmethode: "einwilligung_erteilen" },
    erwartet: false,
    grund: "Übergang: Speichern + Vermerk mit Nachweis",
  },
  ablehnungsgrund: {
    titel: "Ablehnungsgrund als Auswahlfeld am Antrag (P1)",
    probe: { doctype: "PH Kundenkarte Antrag", feld: "ablehnungsgrund" },
    erwartet: false,
    grund: "Übergang: Grund steht als „[Grund] Text“ in der Begründung",
  },
  antrag_ohne_email: {
    titel: "Karte ohne E-Mail (Anschrift statt E-Mail, P1)",
    probe: { doctype: "PH Kundenkarte Antrag", feld: "strasse" },
    grund: "Karten ohne E-Mail sind noch nicht möglich",
  },
  datenschutzinfo_version: {
    titel: "Datenschutzinfo- und Volljährigkeits-Felder am Antrag (P1)",
    probe: [
      { doctype: "PH Kundenkarte Antrag", feld: "datenschutzinfo_version" },
      { doctype: "PH Kundenkarte Antrag", feld: "volljaehrig_bestaetigt" },
    ],
    erwartet: false,
    grund: "Übergang: Vermerk am Antrag",
  },
  stufe_manuell_grund: {
    titel: "Grund für „Stufe von Hand“ als Feld (P9)",
    probe: { doctype: "PH Kundenkarte", feld: "stufe_manuell_grund" },
    erwartet: false,
    grund: "Übergang: Grund als Kommentar an der Karte",
  },
  einloesung_zugesagt: {
    titel: "Zusage bei Auftragsbestätigung, Erbringung bei Lieferschein/Montage (P5)",
    probe: { doctype: "PH Kundenkarte Einloesung", feld: "zugesagt_am" },
    grund: "Bei Möbeln aus einem Auftrag wird die Leistung im Auftrag vermerkt",
  },
  umsatzregeln: {
    titel: "Einstufung nach den Umsatzregeln B1–B8 (P2)",
    probe: { doctype: "PH Kundenkarte", feld: "umsatz_regelstand" },
    grund: "Berechnung im Aufbau – Anzahlungen, Gutschriften und Fremdwährung noch nicht berücksichtigt",
  },
  widerruf_leert_verlauf: {
    titel: "Widerruf leert Umsatzwerte im Verlauf (P7)",
    probe: { doctype: "PH Kundenkarte", docmethode: "einwilligung_widerrufen" },
    erwartet: false,
    grund: "Übergang: Umsatzangaben an der Karte werden gelöscht",
  },
  karten_umstufen: {
    titel: "Karten einer Stufe umstufen (P14)",
    probe: { methode: "ph_kundenkarte.api.backoffice.karten_umstufen" },
    grund: "Stufe mit Karten lässt sich noch nicht deaktivieren",
  },
  kartenleistung_kassa: {
    titel: "Kartenleistung als Bonposition vor dem Signieren (P6)",
    probe: { methode: "ph_kundenkarte.api.vorteil_pruefen" },
    grund: "Übergang: Einlösung nach dem Buchen, ohne Bonzeile",
  },
  wallet: {
    titel: "Wallet-Pässe (Apple/Google)",
    probe: { methode: "ph_kundenkarte.api.backoffice.wallet_status" },
    erwartet: false,
  },
});

export const FAEHIGKEIT_IDS = Object.freeze(Object.keys(KUNDENKARTE));
