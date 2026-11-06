// Kassa – Fähigkeiten (Team B-KAS, Konzept §0.4, G-04). Was das Backend (noch) nicht kann, zeigt die
// Kassa ehrlich: Knopf sichtbar, deaktiviert, Grund als Text – nie ein Knopf, der mit Fehler endet.
// Proben laufen im Mock gegen Backend-Import (DocType-JSON, Feld, @frappe.whitelist), im Frappe-Modus über
// getMeta. Stand der Proben am 04.11.2026 im Übergabeprotokoll 8x-uebergabe-B-KAS.md.
// Schalter im Mock: BACKOFFICE_MOCK_FAEHIGKEITEN („alle“, „keine“, „-kassa.retoure“ …).

import { definiereFaehigkeiten, faehigkeiten } from "../faehigkeiten.js";

export const P = "ph_kassa.ph_kassa.page.ph_kassa.ph_kassa";

const VERWALTUNG = { titel: "Kassa-Verwaltung", href: "/kassa/verwaltung" };
const NAECHSTER_STAND = "Kommt mit dem nächsten Backend-Stand";

export const KASSA = definiereFaehigkeiten("kassa", {
  bediener_sitzung: { titel: "Freigabe mit PIN in der Sitzung der Leitung", probe: { methode: "ph_core.api.bediener.sitzung_mit_pin" }, grund: "Freigabe vorerst mit Passwort der Leitung", ersatz: { titel: "Leitung gibt mit Passwort frei" } },
  idempotenz: { titel: "Doppelbuchung ausgeschlossen", probe: { doctype: "PH Kassenbeleg", feld: "idempotency_key" }, ersatz: { titel: "Tastensperre 300 ms" } },
  training_server: { titel: "Trainingsmodus nur vom Server", grund: "Server nimmt das Trainings-Kennzeichen noch vom Aufruf an", ersatz: { titel: "Kassa sendet das Kennzeichen nie; Schalter nur für die Leitung" } },
  regeln_server: { titel: "Fachregeln am Server", probe: { methode: `${P}.leitung_freigabe_pruefen` } },
  rechnung_snapshot: { titel: "Rechnungsempfänger am Beleg festhalten", probe: { doctype: "PH Kassenbeleg", feld: "empfaenger_name" }, grund: "Empfänger wird als Kontakt angelegt, nicht am Beleg festgehalten", ersatz: { titel: "Rechnung auf Firma über Kontakt" } },
  kunde_anlegen: { titel: "Rechnungsempfänger an der Kassa anlegen", probe: { methode: `${P}.kunde_anlegen` }, ersatz: { titel: "Neue Firmenkunden legt das Büro an – Beleg kommt per E-Mail" } },
  gutschein_verkauf: { titel: "Gutschein verkaufen", probe: [{ doctype: "PH Gutschein" }, { methode: "ph_shop.api.backoffice.sell_voucher" }] },
  retoure: { titel: "Rücknahme mit Originalbeleg", probe: [{ methode: `${P}.retoure_vorbereiten` }, { doctype: "PH Kassenbeleg Position", feld: "bezug_zeile" }], ersatz: { titel: "Leitung: Beleg korrigieren", href: "/kassa/belege" } },
  rabattfelder: { titel: "Rabatt je Position", probe: { doctype: "PH Kassenbeleg Position", feld: "rabatt_promille" } },
  storno_ursprung: { titel: "Storno von Anzahlungen", probe: { doctype: "PH Kassenbeleg Position", feld: "ursprungsart" }, grund: "Diesen Beleg storniert die Buchhaltung" },
  terminal_erstatten: { titel: "Kartenzahlung zurückerstatten", probe: { doctype: "PH Kassenbeleg Zahlung", feld: "terminal_refund" }, grund: "Kartenbelege erst mit Terminal-Erstattung stornierbar" },
  storno_mitarbeiter: { titel: "Storno ohne Leitung bis zur Grenze", probe: { doctype: "PH Kassa Einstellungen", feld: "storno_mitarbeiter_bis_cent" } },
  abschoepfung: { titel: "Abschöpfen beim Abschluss", probe: { methode: `${P}.abschluss_abschliessen` } },
  anfang_server: { titel: "Anfangsbestand vom Server", probe: { doctype: "PH Kassenabschluss", feld: "bargeld_ende_cent" }, grund: "Anfangsbestand wird aus dem letzten Abschluss gerechnet" },
  kassenbuch_barbelege: { titel: "Bar-Belege im Kassenbuch", probe: { doctype: "PH Kassenbuch", feld: "beleg" } },
  abschluss_oeffnen: { titel: "Abschluss wieder öffnen", probe: { doctype: "PH Kassenabschluss", docmethode: "oeffnen" }, ersatz: { titel: "Korrektur über das Kassenbuch", href: "/kassa/verwaltung/kassenbuch" } },
  kassenbuch_zweck: { titel: "Zweck und Beleg an der Buchung", probe: { doctype: "PH Kassenbuch", feld: "zweck" }, grund: "Zweck steht vorerst im Grund", ersatz: { titel: "Zweck als Text im Grund" } },
  kassenbuch_projekt: { titel: "Barausgabe einem Projekt zuordnen", probe: { doctype: "PH Kassenbuch", feld: "projekt" }, grund: NAECHSTER_STAND, ersatz: { titel: "Projektnummer steht vorerst im Grund" } },
  ueberweisung: { titel: "Zahlung per Überweisung", grund: NAECHSTER_STAND, ersatz: { titel: "Auftragsbestätigung oder Rechnung über die Faktura" } },
  bestellung_kassieren: { titel: "Shop-Bestellung kassieren", grund: NAECHSTER_STAND, ersatz: { titel: "Status sichtbar, Leitung ist informiert" } },
  vorteil_zuruecknehmen: { titel: "Vorteil bei Storno zurücknehmen", probe: { methode: "ph_kundenkarte.api.cancel_redemption" } },
  code_erkennen: { titel: "Scan-Erkennung am Server", probe: { methode: `${P}.code_erkennen` } },
  tageswechsel: { titel: "Geschäftstag mit Tageswechsel-Uhrzeit", probe: { doctype: "PH Kassa Einstellungen", feld: "tageswechsel_uhrzeit" } },
  vortag_page: { titel: "Abschluss vom Vortag nachholen", probe: { methode: `${P}.abschluss_laden` } },
  standard_terminal: { titel: "Standard-Terminal am Gerät", probe: { doctype: "PH Geraet", feld: "standard_terminal" }, grund: "Terminal wird je Gerät lokal gemerkt" },
  bedienerkarte: { titel: "Anmelden mit Bedienerkarte", erwartet: false, probe: { methode: "ph_core.api.bediener.verify_badge" } },
  notbetrieb: { titel: "Verkauf ohne Netz (Notbetrieb)", grund: "Aus, bis Server, Gerät und Steuerberater bereit sind", ersatz: { titel: "Bei Netzausfall steht die Kassa" } },
  chf: { titel: "Bargeld in CHF annehmen", grund: "Wartet auf die Entscheidung des Inhabers" },
  dep_export: { titel: "DEP-Export erzeugen", probe: { doctype: "PH Kasse", docmethode: "dep_exportieren" }, ersatz: VERWALTUNG },
  kundendisplay: { titel: "Kundendisplay", probe: { doctype: "PH Kassa Einstellungen", feld: "kundendisplay_aktiv" } },
});

export const IDS = Object.freeze(Object.keys(KASSA));

/** Pflicht für „Training aus“ (Echtbetriebs-Schranke §0.4). */
export const ECHTBETRIEB_PFLICHT = Object.freeze(["kassa.bediener_sitzung", "kassa.idempotenz", "kassa.training_server", "kassa.rechnung_snapshot"]);

/** Alle Kassa-Fähigkeiten → { kurzname: status } (kurzname ohne „kassa.“). */
export async function kassaFaehigkeiten(session, opts = {}) {
  const alle = await faehigkeiten(session, IDS, { katalog: KASSA, ...opts });
  return Object.fromEntries(Object.entries(alle).map(([id, s]) => [id.replace(/^kassa\./, ""), { an: s.an, grund: s.grund, ersatz: s.ersatz?.titel || null, titel: s.titel, erwartet: s.erwartet }]));
}

/** Echtbetriebs-Schranke: fehlende Pflicht-Fähigkeiten + offene Checklisten-Punkte. */
export function echtbetriebFehlt(faehig = {}, checkliste = []) {
  const fehlt = ECHTBETRIEB_PFLICHT.map((id) => id.replace(/^kassa\./, "")).filter((k) => !faehig[k]?.an).map((k) => faehig[k]?.titel || k);
  for (const c of checkliste) if (!c.erledigt) fehlt.push(c.titel);
  return fehlt;
}
