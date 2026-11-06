// Palette – Bereich Marketing (G-01, MASTER § 3.5). Schreibt: Team B-MAR.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
//
// 10-konzept-marketing § 12.1 Zentrale: Schnellaktionen „Newsletter-Anmeldung“, „Event-Anmeldung“, „Keine Werbung mehr“.
// Wie bei B-SOR vorbereitet, aber nicht aktiv: backoffice-register.test.mjs friert die P0-1-Liste ein (Übergabe § 6).

/** Vorbereitete Schnellaktionen (Aktivierung durch L0/P0-1: `schnellaktionen: SCHNELLAKTIONEN`). */
export const SCHNELLAKTIONEN = [
  { id: "marketing.neue-ausgabe", titel: "Neue Newsletter-Ausgabe", href: "/marketing/newsletter?neu=ausgabe", recht: { aktion: "create", doctype: "PH Newsletter Ausgabe" }, rang: 60 },
  { id: "marketing.anmeldung", titel: "Newsletter-Anmeldung", href: "/marketing/empfaenger?dialog=anmeldung", recht: { aktion: "create", doctype: "PH Newsletter Abo" }, rang: 61 },
  { id: "marketing.event-anmeldung", titel: "Event-Anmeldung", href: "/marketing/events?dialog=anmeldung", recht: { aktion: "write", doctype: "PH Event" }, rang: 62 },
  { id: "marketing.keine-werbung", titel: "Keine Werbung mehr", href: "/marketing/empfaenger?dialog=keine-werbung", recht: { aktion: "write", doctype: "PH Einwilligung" }, rang: 63 },
  { id: "marketing.beitrag", titel: "Social-Beitrag planen", href: "/marketing/social?neu=beitrag", recht: { aktion: "create", doctype: "PH Social Beitrag" }, rang: 64 },
];

/** Vorbereitete Hilfe-Artikel (Team Q5 schreibt die Texte). */
export const HILFE_ARTIKEL = [
  { titel: "Newsletter: Ausgabe anlegen, freigeben, versenden", pfad: "marketing/newsletter" },
  { titel: "Empfänger: Anmeldung, Einwilligung, Keine Werbung mehr", pfad: "marketing/empfaenger" },
  { titel: "Events: Anmeldung und Check-in", pfad: "marketing/events" },
  { titel: "Social: Redaktionsplan und Bildrechte", pfad: "marketing/social" },
];

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "PH-NL-.YYYY.-.###", doctype: "PH Newsletter Ausgabe" },
    { serie: "PH-KAM-.YYYY.-.####", doctype: "PH Kampagne" },
    { serie: "PH-SOC-.YYYY.-.####", doctype: "PH Social Beitrag" },
    { serie: "PH-BWT-.YYYY.-.#####", doctype: "PH Bewertung" },
  ],
  hilfe: [],
};

export default eintrag;
