// Bereich Sortiment – Fähigkeiten (G-04, Q-A7; 10-konzept-sortiment § 16.3 „bis dahin“-Verhalten, 51-backend-luecken).
// Probe gegen Backend-Import (Mock) bzw. getMeta (Frappe). Fachlich erwartet → Knopf sichtbar, deaktiviert mit
// „Noch nicht verfügbar – {Ersatzweg}“. Nie ein Knopf, der mit Fehler endet.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const SORTIMENT = definiereFaehigkeiten("sortiment", {
  exportieren: { titel: "Exportdatei IWOfurn/EDI/CSV", probe: { doctype: "PH Herstellerbestellung", docmethode: "exportieren" }, ersatz: { titel: "per E-Mail senden" } },
  uebermittlung: { titel: "Übermittlung markieren", probe: { doctype: "PH Herstellerbestellung", docmethode: "uebermittlung_setzen" }, ersatz: { titel: "Kommentar im Verlauf" } },
  "ab-merker": { titel: "AB-Merker je Position", probe: { doctype: "PH Herstellerbestellung Position", feld: "ab_merker" }, ersatz: { titel: "Abgleich-Tabelle" } },
  storno: { titel: "Storno beim Hersteller anfragen (AS18)", probe: { doctype: "PH Herstellerbestellung", docmethode: "storno_anfragen" }, ersatz: { titel: "Leitung bitten", href: "/sortiment/bestellungen" } },
  "rest-stornieren": { titel: "Rest stornieren (AS19)", probe: { doctype: "PH Herstellerbestellung", docmethode: "rest_stornieren" }, ersatz: { titel: "Leitung bitten" } },
  strecke: { titel: "Lieferung beim Kunden bestätigen (AS23)", probe: { doctype: "PH Herstellerbestellung", docmethode: "lieferung_bestaetigen" }, ersatz: { titel: "Leitung bitten" } },
  ruecksendung: { titel: "Rücksendung an Lieferant (AS20)", probe: { doctype: "PH Lieferantenretoure" }, ersatz: { titel: "Aufgabe an Sortiment" } },
  preisbasis: { titel: "Preisbasis im Preislisten-Import (AS5)", probe: { doctype: "PH Preisliste Import", feld: "preisbasis" }, ersatz: { titel: "Preisart Herstellerpreis wählen" } },
  tiefstpreis: { titel: "Niedrigster Preis 30 Tage aus der App (AS24)", probe: { doctype: "PH Produkt", feld: "tiefstpreis_30_tage_cent" }, ersatz: { titel: "Berechnung in der Oberfläche" } },
  "ust-saetze": { titel: "USt-Sätze 20/13/10/0 (AS8)", probe: { doctype: "PH Kategorie", feld: "ust_satz" }, ersatz: { titel: "Klasse normal/ermäßigt" } },
  katalogimport: { titel: "Katalog-Import", probe: { methode: "ph_sortiment.importer.katalog.importieren_aus_anhang" }, ersatz: { titel: "Import im Frappe-Desk" }, recht: { bereich: "sortiment", aktion: "delete" } },
  vorschlaege: { titel: "Bestellvorschläge lesen (Leserecht Sortiment, ph_logistik)", probe: { doctype: "PH Bestellvorschlag" }, ersatz: { titel: "Logistik bittet um Bestellung" } },
  "aus-vorschlaegen": { titel: "Herstellerbestellung aus Vorschlägen", probe: { methode: "ph_logistik.ph_logistik.nachbestellung.bestellungen_aus_vorschlaegen" }, ersatz: { titel: "Bestellung von Hand anlegen", href: "/sortiment/bestellungen/neu" } },
});
