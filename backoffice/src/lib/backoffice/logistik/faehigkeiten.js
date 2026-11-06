// Fähigkeiten-Register Logistik (G-04, Q-A7, 10-konzept-logistik § 1.3/§ 12.1). Was ph_logistik noch nicht kann,
// zeigt die Oberfläche als gesperrten Knopf mit Ersatzweg – nie ein Knopf, der mit Fehler endet.
// Proben gegen Backend-Import (Felder/Methoden exakt), Mock-Schalter BACKOFFICE_MOCK_FAEHIGKEITEN. Reines Modul.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

const APP = "ph_logistik.ph_logistik";

export const LOGISTIK = definiereFaehigkeiten("logistik", {
  // vorhanden (Proben gegen die echten Methoden)
  "packtisch-jtl": { titel: "Packtisch nach JTL", probe: { methode: `${APP}.packtisch_ablauf.verpacken` }, ersatz: { titel: "Pack-Ansicht ohne Abschluss-Prüfung", href: "/packtisch" } },
  "inventur-mobil": { titel: "Mobile Zählung", probe: { methode: `${APP}.inventur_mobil.zaehlen` }, ersatz: { titel: "Zählliste in der Inventur-Akte", href: "/logistik/inventur" } },
  teilinventur: { titel: "Teilinventur anlegen", probe: { methode: `${APP}.inventur_plan.teilinventur_anlegen` }, ersatz: { titel: "Inventur mit Plätzen anlegen", href: "/logistik/inventur" } },
  bewertung: { titel: "Inventurbewertung", probe: { doctype: "PH Inventurbewertung" }, ersatz: { titel: "Bericht Bestandsliste", href: "/logistik/berichte/bestandsliste" } },
  nachbestellung: { titel: "Herstellerbestellung aus Vorschlägen", probe: { methode: `${APP}.nachbestellung.bestellungen_aus_vorschlaegen` }, ersatz: { titel: "Herstellerbestellung im Sortiment", href: "/d/ph-herstellerbestellung" } },
  liefertermine: { titel: "Liefertermin vorschlagen", probe: { methode: `${APP}.doctype.ph_tour.ph_tour.liefertermine_vorschlagen` }, ersatz: { titel: "Plantafel", href: "/logistik/touren" } },
  "tour-mobil": { titel: "Tour mobil", probe: { methode: `${APP}.tour_mobil.stopp_status` }, ersatz: { titel: "Stopp-Status in der Tour-Akte", href: "/logistik/touren" } },
  // fehlen (Anfragen an ph_logistik) – erwartet, deshalb sichtbar und gesperrt
  "ab-meldung": { titel: "Liefermenge bei Zustellung an AB melden", probe: { doctype: "PH Lieferschein", feld: "ab_gemeldet_am" }, ersatz: { titel: "Aufgabe an Faktura", href: "/logistik/lieferscheine" }, grund: "Anfrage A1 an ph_logistik" },
  teilzustellung: { titel: "Teilzustellung am Stopp", probe: { doctype: "PH Lieferschein Position", feld: "menge_zugestellt" }, ersatz: { titel: "„Teilweise abgeliefert“ mit Aufgabe an Leitung" }, grund: "Anfrage A7 an ph_logistik" },
  ruecklieferung: { titel: "Neu einplanen nach Fehlversuch", probe: { doctype: "PH Lieferschein", feld: "zustellversuche" }, ersatz: { titel: "Aufgabe an Leitung" }, grund: "Anfrage A5 an ph_logistik" },
  steuernachweis: { titel: "Steuernachweis am Lieferschein", probe: { doctype: "PH Lieferschein", feld: "mrn" }, ersatz: { titel: "Aufgabe an Faktura" }, grund: "Anfrage A9 an ph_logistik" },
  "mengen-dezimal": { titel: "Mengen mit Nachkommastellen (lfm, m²)", probe: { doctype: "PH Lieferschein Position", feld: "einheit" }, ersatz: { titel: "Position über Faktura/Projekt klären" }, grund: "Anfrage A4 an ph_logistik" },
  "freigabe-zuruecknehmen": { titel: "Tour-Freigabe zurücknehmen", probe: { doctype: "PH Tour", docmethode: "freigabe_zuruecknehmen" }, ersatz: { titel: "Leitung verschiebt und gibt neu frei" }, grund: "Anfrage A8 an ph_logistik" },
  ersatzlieferung: { titel: "Ersatzlieferung zur Sendung", probe: { doctype: "PH Sendung", feld: "ersatz_fuer" }, ersatz: { titel: "Aufgabe an Leitung" }, grund: "Anfrage A24 an ph_logistik" },
  "zwei-drucker": { titel: "Zwei Drucker je Gerät (A4 + Etikett)", probe: { doctype: "PH Geraet", feld: "drucker_etikett" }, ersatz: { titel: "A4 über das Browser-Druckpanel" }, grund: "Anfrage C1 an ph_core", erwartet: false },
});
