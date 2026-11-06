// Bereich Marketing – Fähigkeiten S1–S17 (10-konzept-marketing § 0.3, § 11.2; G-04, Q-A7).
// Probe gegen Backend-Import (Mock) bzw. getMeta (Frappe). Fachlich erwartet → sichtbar, deaktiviert mit
// „Noch nicht verfügbar – {Ersatzweg}“. Im Mock schaltet BACKOFFICE_MOCK_FAEHIGKEITEN bzw. das Cookie
// ph_bo_faehigkeiten jede Fähigkeit einzeln („alle“, „keine“, „marketing.*“, „alle,-marketing.gutschein“).
// Stand Backend 04.11.2026: api/backoffice.py liefert Anmeldung (L1), Stapel (L3), Empfänger (L2), Check-in (A1),
// Trockenlauf (L5), Auftragsquelle (L15); PH Event hat nachruecken_jetzt, absage_senden; PH Kampagne kennzahlen_import.

import { definiereFaehigkeiten, faehigkeiten } from "../faehigkeiten.js";
import { SPERRE } from "./texte.js";

const BO = "ph_marketing.api.backoffice";

export const MARKETING = definiereFaehigkeiten("marketing", {
  // S1 – Newsletter-Anmeldung im Backoffice (A7/L1)
  anmeldung: { titel: "Newsletter-Anmeldung im Backoffice", probe: { methode: `${BO}.create_subscription` }, ersatz: { titel: SPERRE.anmeldung } },
  // S2 – Einwilligung per Telefon/Showroom/E-Mail mit Bestätigungsmail (P0-3)
  "einwilligung-kanaele": { titel: "Einwilligung per Telefon, Showroom oder E-Mail", probe: { methode: `${BO}.record_consent` }, ersatz: { titel: SPERRE.kanaele } },
  // S3 – Einladungs-Schalter und Einladung an Zielgruppe (P0-1/P0-2)
  einladungen: { titel: "Einladungen an Zielgruppe", probe: { doctype: "PH Event Anmeldung", feld: "einladungen_ok" }, ersatz: { titel: SPERRE.einladung } },
  // S4 – Check-in mit Code, Uhrzeit und Personen (A1)
  checkin: { titel: "Check-in mit Code", probe: { methode: `${BO}.event_check_in` }, ersatz: { titel: SPERRE.checkin } },
  // S5 – Nachrücken (A2)
  nachruecken: { titel: "Nachrücken von der Warteliste", probe: { doctype: "PH Event", docmethode: "nachruecken_jetzt" }, ersatz: { titel: SPERRE.nachruecken } },
  // S6 – Absage-Mail (A3), Verschieben und Personen ändern (P1-5)
  absage: { titel: "Absage mit Mail an die Gäste", probe: { doctype: "PH Event", docmethode: "absage_senden" }, ersatz: { titel: SPERRE.absage } },
  verschieben: { titel: "Event verschieben", probe: { doctype: "PH Event", docmethode: "verschieben" }, ersatz: { titel: SPERRE.absage } },
  "personen-aendern": { titel: "Personen einer Anmeldung ändern", probe: { doctype: "PH Event", docmethode: "personen_aendern" }, ersatz: { titel: "am Eingang über „Personen …“" } },
  // S7 – Gutschein senden (P0-8 + P0-9 + A8)
  gutschein: { titel: "Empfehlungsgutschein senden", probe: [{ doctype: "PH Empfehlung", feld: "gutschein" }, { methode: "ph_shop.api.gutschein_aktion_anlegen" }], ersatz: { titel: SPERRE.gutschein } },
  // S8 – Grundlage Bestandskunde und Werbehinweis-Chip (P0-4)
  bestandskunde: { titel: "Grundlage Bestandskunde", probe: { doctype: "PH Kontakt", feld: "werbehinweis_am" }, ersatz: { titel: SPERRE.bestandskunde } },
  // S9 – Trockenlauf Kundenreise (L5/U13)
  trockenlauf: { titel: "Trockenlauf Kundenreise", probe: { methode: `${BO}.journey_dry_run` }, ersatz: { titel: SPERRE.trockenlauf } },
  // S10 – Adresse ändern (P-M4)
  adresse: { titel: "Adresse ändern", probe: { doctype: "PH Newsletter Abo", docmethode: "adresse_aendern" }, ersatz: { titel: SPERRE.adresse } },
  // S11 – Ideenleiste Social (P1-12: Datum im Status Idee optional) – ohne Funktion kein Weg, daher ausgeblendet
  ideen: { titel: "Ideen ohne Datum", erwartet: false, ersatz: { titel: SPERRE.ideen } },
  // S12 – Social-Prüfungen als Felder (P1-12)
  "social-felder": { titel: "Kundenprojekt und Kennzeichnung als Felder", probe: { doctype: "PH Social Beitrag", feld: "kommerziell" }, ersatz: { titel: SPERRE.socialFelder } },
  // S13 – Kosten belegt, Währung/Kurs (P1-8)
  "kosten-belegt": { titel: "Kosten aus Eingangsrechnungen", probe: { doctype: "PH Eingangsrechnung", feld: "ph_marketing_kampagne" }, ersatz: { titel: SPERRE.kostenBelegt } },
  // S14 – ROI netto (P1-10)
  "roi-netto": { titel: "Kampagnen-ROI netto", ersatz: { titel: SPERRE.roi } },
  // S15 – Event-Telefonanmeldung ohne E-Mail (P1-6 / L23)
  "ohne-email": { titel: "Anmeldung ohne E-Mail", ersatz: { titel: SPERRE.ohneEmail } },
  // S16 – Datenschutz-Anfrage mit Frist (P1-14, CRM)
  dsgvo: { titel: "Datenschutz-Anfrage mit Frist", probe: { doctype: "PH Datenschutzanfrage" }, ersatz: { titel: SPERRE.dsgvo, href: "/datenschutz" } },
  // S17 – Freigabe-Status Social im Workflow (L22/A9)
  "social-freigabe": { titel: "Freigabe-Status für Social-Beiträge", ersatz: { titel: SPERRE.socialFreigabe } },
  // weitere Backend-Stände (nicht im Konzept nummeriert, aber Bedingung für Bereitschaft/Bedienung)
  "bestaetigung-stapel": { titel: "Bestätigungsmail für mehrere Adressen", probe: { methode: `${BO}.resend_doi_bulk` }, ersatz: { titel: "einzeln in der Personen-Akte" } },
  "abmelden-stapel": { titel: "Mehrere Adressen abmelden", probe: { methode: `${BO}.unsubscribe_bulk` }, ersatz: { titel: "einzeln in der Personen-Akte" } },
  empfaengerliste: { titel: "Empfängerliste einer Ausgabe", probe: { methode: `${BO}.list_recipients` }, ersatz: { titel: "Zahl im Kopf der Ausgabe" } },
  "csv-import": { titel: "Kennzahlen aus CSV", probe: { doctype: "PH Kampagne", docmethode: "kennzahlen_import" }, ersatz: { titel: SPERRE.csv } },
  widerspruch: { titel: "Widerspruch in einem Aufruf (Kontaktsperre, globale Abmeldung)", probe: { methode: `${BO}.widerspruch_erfassen` }, ersatz: { titel: "Abmeldung und Widerrufe einzeln" } },
  "testmail-intern": { titel: "Server prüft interne Testadressen", probe: { doctype: "PH Marketing Einstellungen", feld: "test_domains" }, ersatz: { titel: "Prüfung im Backoffice" } },
  "abmelde-token": { titel: "Abmeldelink je Versandzeile", probe: { doctype: "PH Newsletter Versand", feld: "abmelde_token_hash" }, ersatz: { titel: "Abmeldelink am Abo" } },
  "stopp-regeln": { titel: "Stopp bei Storno und Retoure vor jeder Mail", ersatz: { titel: "Laufzeittabelle zeigt die Regel als „kommt“" } },
  auftragsquelle: { titel: "Prüfung der Auftragsdaten", probe: { methode: `${BO}.check_order_source` }, ersatz: { titel: "Feldzuordnung von Hand prüfen" } },
});

export const S = Object.freeze({
  anmeldung: "marketing.anmeldung",
  kanaele: "marketing.einwilligung-kanaele",
  einladungen: "marketing.einladungen",
  checkin: "marketing.checkin",
  nachruecken: "marketing.nachruecken",
  absage: "marketing.absage",
  verschieben: "marketing.verschieben",
  personenAendern: "marketing.personen-aendern",
  gutschein: "marketing.gutschein",
  bestandskunde: "marketing.bestandskunde",
  trockenlauf: "marketing.trockenlauf",
  adresse: "marketing.adresse",
  ideen: "marketing.ideen",
  socialFelder: "marketing.social-felder",
  kostenBelegt: "marketing.kosten-belegt",
  roiNetto: "marketing.roi-netto",
  ohneEmail: "marketing.ohne-email",
  dsgvo: "marketing.dsgvo",
  socialFreigabe: "marketing.social-freigabe",
  bestaetigungStapel: "marketing.bestaetigung-stapel",
  abmeldenStapel: "marketing.abmelden-stapel",
  empfaengerliste: "marketing.empfaengerliste",
  csv: "marketing.csv-import",
  widerspruch: "marketing.widerspruch",
  testmailIntern: "marketing.testmail-intern",
  abmeldeToken: "marketing.abmelde-token",
  stoppRegeln: "marketing.stopp-regeln",
  auftragsquelle: "marketing.auftragsquelle",
});

/** Alle Marketing-Fähigkeiten für eine Sitzung (Server; Cookie-Überschreibung im Mock vom Aufrufer). */
export async function marketingFaehigkeiten(session, { client, ueberschreibung } = {}) {
  return faehigkeiten(session, Object.keys(MARKETING), { katalog: MARKETING, client, ueberschreibung });
}

/** Kurzform: { id: boolean } plus Statusobjekte (serialisierbar für Client-Komponenten). */
export function kurzform(status) {
  const an = {};
  for (const [k, id] of Object.entries(S)) an[k] = !!status?.[id]?.an;
  return an;
}
