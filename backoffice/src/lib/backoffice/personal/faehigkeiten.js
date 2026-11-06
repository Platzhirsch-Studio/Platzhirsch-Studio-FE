// Fähigkeiten des Bereichs Personal (G-04, Q-A7) – die „Schalter“ aus Konzept § 3.9 als Probe gegen das Backend.
// Fehlt die App-Funktion, erscheint die Oberfläche nicht oder mit ehrlichem Ersatzweg („Leitung bitten“).
// Mock: Probe gegen Backend-Import bzw. Schalter BACKOFFICE_MOCK_FAEHIGKEITEN / Cookie ph_bo_faehigkeiten
// („alle“, „keine“, „personal.*“, „alle,-personal.konten“). Reines Modul.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const PERSONAL = definiereFaehigkeiten("personal", {
  konten: {
    titel: "Stundensaldo, Urlaubstage und Resturlaub (Konzept E4, Backend A5–A8)",
    probe: [{ methode: "ph_personal.api.urlaubskonto" }, { doctype: "PH Zeitabschluss" }, { doctype: "PH Urlaubsanspruch" }],
    erwartet: false,
    grund: "Konten erscheinen, sobald Feiertage und Arbeitszeitmodelle hinterlegt sind",
  },
  saldo_laufender_monat: {
    titel: "Saldo bis gestern im laufenden Monat (Backend A3: monatsuebersicht mit Stichtag)",
    probe: { methode: "ph_personal.api.monatsuebersicht_bis" },
    erwartet: false,
  },
  team_selbstservice: {
    titel: "Teamkalender im Selbstservice (A11a)",
    probe: { methode: "ph_personal.api.teamkalender" },
    erwartet: false,
  },
  vertretung_selbstservice: {
    titel: "Vertretung im Urlaubsantrag wählen (A11b)",
    probe: { methode: "ph_personal.api.vertretung_vorschlaege" },
    erwartet: false,
  },
  zeitnachweis_selbst: {
    titel: "Zeitnachweis als PDF im Selbstservice (A11c)",
    probe: { methode: "ph_personal.api.zeitnachweis_pdf" },
    grund: "Zeitnachweis über die Leitung anfordern",
    ersatz: { titel: "Zeitnachweis anfordern" },
  },
  korrektur_antrag: {
    titel: "Korrektur einer Buchung beantragen (A11d)",
    probe: { methode: "ph_personal.api.korrektur_beantragen" },
    grund: "Korrektur als Aufgabe an die Leitung",
  },
  storno_genehmigt_selbst: {
    titel: "Genehmigten Antrag vor Beginn selbst stornieren (A11e)",
    probe: { doctype: "PH Abwesenheit", feld: "verkuerzt_von" },
    erwartet: false,
  },
  krankmeldung: {
    titel: "Krankmeldung als eigener Datensatz ohne Genehmigung (A9)",
    probe: [{ doctype: "PH Krankmeldung" }, { methode: "ph_personal.api.krank_melden" }],
    grund: "Krankmeldung telefonisch an die Leitung",
  },
  gleich_genehmigen: {
    titel: "„Anlegen und genehmigen“ für die Leitung (A12, Genehmiger für Anträge der Leitung)",
    probe: { doctype: "PH Personal Einstellungen", feld: "genehmiger_fuer_leitung" },
    erwartet: false,
  },
  kiosk_andere_person: {
    titel: "Kiosk: andere Person stempelt mit PIN (Fundament F4)",
    probe: { methode: "ph_core.api.bediener.sitzung_mit_pin" },
    erwartet: false,
  },
  monatsabschluss: {
    titel: "Monatsabschluss mit Sperre (A4)",
    probe: [{ doctype: "PH Zeitabschluss" }, { methode: "ph_personal.api.monate_abschliessen" }],
    erwartet: false,
  },
});

export const FAEHIGKEIT_IDS = Object.freeze(Object.keys(PERSONAL));
