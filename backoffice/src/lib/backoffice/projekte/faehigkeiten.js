// Fähigkeiten des Bereichs Projekte (10-konzept-projekte.md § 3.10 „Schalter“, E18; MASTER G-04/Q-A7).
// Fehlt die Backend-Voraussetzung, ist die Funktion aus: fachlich erwartet → Knopf deaktiviert mit „Noch nicht
// verfügbar – {Ersatzweg}“, sonst ausgeblendet. Nie ein Knopf, der mit Fehler endet.
// Proben gegen Backend-Import (Mock) bzw. getMeta (Frappe); Methoden ohne gefahrlose Probe → Freigabe durch den Betrieb.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const PROJEKTE = definiereFaehigkeiten("projekte", {
  kalkulation: {
    titel: "Nachkalkulation",
    probe: { methode: "ph_projekte.api.kalkulation.projekt_kalkulation_v2" },
    ersatz: { titel: "Kalkulation im Frappe-Desk" },
    recht: { bereich: "projekte", aktion: "cancel" },
  },
  summen: {
    titel: "Berechnete Projektsummen",
    probe: { doctype: "PH Projekt", docmethode: "summen_aktualisieren" },
    erwartet: false,
  },
  mengen_dezimal: {
    titel: "Dezimalmengen mit Einheit",
    probe: { doctype: "PH Projekt Position", feld: "einheit" },
    erwartet: false,
  },
  teilabnahme: {
    titel: "Abnahme je Montageauftrag",
    probe: { doctype: "PH Abnahme", feld: "art" },
    erwartet: false,
  },
  montage_kiosk_status: {
    titel: "Statusknopf für Monteure",
    probe: { doctype: "PH Montageauftrag", docmethode: "abnahme_anlegen" },
    grund: "Status meldet dein Montageleiter",
  },
  nachtrag_portal: {
    titel: "Nachtrag im Portal vorlegen",
    probe: { doctype: "PH Nachtrag", feld: "fagg_hinweis_bestaetigt" },
    erwartet: false,
  },
  kundenvorschau: {
    titel: "Kundensicht",
    probe: { methode: "ph_projekte.api.portal_project_vorschau" },
    erwartet: false,
  },
  inkasso: {
    titel: "Restzahlung über Kassa",
    erwartet: false,
    grund: "Inhaber- und Steuerberater-Entscheidung offen",
  },
  servicefall: {
    titel: "Servicefall aus Mangel",
    probe: [{ doctype: "PH Servicefall" }, { doctype: "PH Montageauftrag", docmethode: "mangel_an_service" }],
    ersatz: { titel: "im Service-Bereich anlegen", href: "/service" },
  },
  mappe_pdf: {
    titel: "Auftragsmappe als PDF",
    probe: { methode: "ph_projekte.api.auftragsmappe_pdf" },
    ersatz: { titel: "Statusbericht drucken" },
  },
  kollisionen: {
    titel: "Kollisionsprüfung Montage",
    probe: { methode: "ph_projekte.api.montage_kollisionen" },
    ersatz: { titel: "Doppelbuchungen im Kalender prüfen" },
  },
  herstellerbestellungen: {
    titel: "Herstellerbestellungen erzeugen",
    probe: [{ doctype: "PH Herstellerbestellung" }, { doctype: "PH Projekt", docmethode: "herstellerbestellungen_erzeugen" }],
    ersatz: { titel: "im Sortiment bestellen", href: "/sortiment" },
  },
});

/** IDs, die die Mappe auf einmal abfragt. */
export const MAPPE_FAEHIGKEITEN = Object.freeze(["projekte.kalkulation", "projekte.summen", "projekte.mengen_dezimal", "projekte.servicefall", "projekte.mappe_pdf", "projekte.herstellerbestellungen", "projekte.kundenvorschau"]);

/** Automationen § 9.2 – alle Standard aus, Inhaber gibt einzeln frei (Einstellungen zeigen sie als Liste). */
export const AUTOMATIONEN = Object.freeze([
  { id: "AU1", titel: "Montagetermin gesetzt oder verschoben", wirkung: "Kundennachricht als Vorschlag im Chip, nie ohne Vorschau", art: "Vertrag" },
  { id: "AU2", titel: "Tag vor Montage 16:00", wirkung: "Erinnerung an den Kunden", art: "Vertrag" },
  { id: "AU3", titel: "Montage „Unterwegs“", wirkung: "„Team ist unterwegs“ (Schalter je Projekt)", art: "Vertrag" },
  { id: "AU4", titel: "Mangelfrist erreicht", wirkung: "Aufgabe an Montageleiter oder Verantwortlichen", art: "intern" },
  { id: "AU5", titel: "Mehr als 14 Tage in „Angebot“", wirkung: "Aufgabe „Nachfassen“ an Berater", art: "intern" },
  { id: "AU6", titel: "Hersteller bestätigt Liefertermin", wirkung: "Hinweis in der Mappe zum Übernehmen", art: "intern" },
  { id: "AU7", titel: "Alle Eigenmontage-Positionen geliefert", wirkung: "Zu tun „Montage planen“", art: "intern" },
  { id: "AU8", titel: "Schlussabnahme ohne Mängel", wirkung: "Empfohlen: Schlussrechnung, Produktpässe", art: "intern" },
  { id: "AU9", titel: "3 Monate nach Übergabe", wirkung: "Zufriedenheit und Referenz-Anfrage – nur mit Einwilligung", art: "Werbung" },
  { id: "AU10", titel: "Herstellergarantie endet in 60 Tagen", wirkung: "Pflegehinweis – nur mit Einwilligung", art: "Werbung" },
  { id: "AU11", titel: "Kundeneintrag eingegangen", wirkung: "Glocke an Berater und Planer", art: "intern" },
  { id: "AU12", titel: "Kunde öffnet Rendering im Portal", wirkung: "Eintrag in der Aktivität", art: "intern" },
]);
