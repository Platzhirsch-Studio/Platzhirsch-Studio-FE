// Fähigkeiten des Bereichs Service (G-04, 10-konzept-service „Stufen-Kennzeichnung“): Funktionen, die erst mit
// einer Anfrage an ph_service (A-S…) bzw. Faktura kommen. Konzept: fehlt Feld/Methode → Funktion AUSBLENDEN
// (erwartet: false), nie ein Knopf, der mit Fehler endet. Proben gegen die echten Dateien in Backend-Import.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const SERVICE = definiereFaehigkeiten("service", {
  "fristen-bei-meldung": { titel: "Anspruchsstand bei Meldung speichern (A-S1)", erwartet: false, probe: { doctype: "PH Servicefall", feld: "fristen_status_bei_meldung" } },
  maengelanzeige: { titel: "Mängelanzeige als eigener Schritt (A-S2)", erwartet: false, probe: { doctype: "PH Servicefall", docmethode: "maengelanzeige_senden" } },
  "kunde-informiert": { titel: "Kunde informiert per Brief/Telefon erfassen (A-S3)", erwartet: false, probe: { doctype: "PH Servicefall", docmethode: "kunde_informiert_erfassen" } },
  anerkenntnis: { titel: "Anerkenntnis des Lieferanten erfassen (A-S4)", erwartet: false, probe: { doctype: "PH Lieferantenregress", feld: "anerkenntnis_am" } },
  "gutschrift-faktura": { titel: "Gutschrift über Faktura anlegen (E4)", erwartet: false, probe: { doctype: "PH Rechnung", docmethode: "gutschrift_erstellen" }, ersatz: { titel: "Gutschrift in Faktura anlegen", href: "/d/ph-gutschrift/neu" } },
  "steuerliche-art": { titel: "Steuerliche Art des Regresses (A-S12)", erwartet: false, probe: { doctype: "PH Lieferantenregress", feld: "steuerliche_art" } },
  reststorno: { titel: "Reststorno einer Ersatzteilbestellung (A-S11)", erwartet: false, probe: { doctype: "PH Ersatzteilbestellung", docmethode: "rest_stornieren" } },
  einwilligung: { titel: "Einwilligung Nachkauf mit Nachweis (A-S17)", erwartet: false, probe: { doctype: "PH Pflege Abo", docmethode: "einwilligung_erfassen" } },
  "auftrag-abrechnen": { titel: "Serviceauftrag abrechnen (A-S8)", erwartet: false, probe: { doctype: "PH Serviceauftrag", docmethode: "rechnung_erstellen" }, ersatz: { titel: "Rechnung in Faktura erstellen" } },
  reiterzaehler: { titel: "Alle Reiterzähler in einem Aufruf (A-S15)", erwartet: false, probe: { methode: "ph_service.api.reiter_zaehler" } },
  "starten-zeit": { titel: "Ankunftszeit beim Start mitgeben (A-S10)", erwartet: false, probe: { doctype: "PH Serviceeinsatz", docmethode: "starten_mit_zeit" } },
});

export const FAEHIGKEIT_IDS = Object.keys(SERVICE);
