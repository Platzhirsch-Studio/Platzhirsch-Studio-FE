// Palette – Bereich Kundenkarte (G-01, MASTER § 3.5). Schreibt: Team B-KKA.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
//
// B-KKA: Die Schnellaktionen „> neue karte“ und „> vorteil einlösen“ (Konzept § 2.4) sind vorbereitet, aber noch
// nicht eingetragen – die Liste ist im Fundament-Test eingefroren (backoffice-register.test.mjs „Palette: …
// alter Reihenfolge“). Freigabe bei L0 angefragt (Übergabe B-KKA); danach SCHNELL_VORBEREITET übernehmen.

export const SCHNELL_VORBEREITET = Object.freeze([
  { id: "kundenkarte.neue-karte", titel: "Neue Kundenkarte", href: "/kundenkarte/karten/neu", recht: { aktion: "create", doctype: "PH Kundenkarte" }, rang: 60 },
  { id: "kundenkarte.einloesen", titel: "Vorteil einlösen", href: "/kundenkarte/einloesungen?einloesen=1", recht: { aktion: "write", doctype: "PH Kundenkarte" }, rang: 61 },
]);

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "PH-KKA-.YYYY.-.#####", doctype: "PH Kundenkarte Antrag" },
    { serie: "PH-KKE-.YYYY.-.#####", doctype: "PH Kundenkarte Einloesung" },
    { serie: "PH-KKV-.YYYY.-.#####", doctype: "PH Kundenkarte Vorteil" },
    { regex: /^KK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, doctype: "PH Kundenkarte" }, // Kartennummer (ph_core.utils.naming.referenz("KK"))
  ],
  hilfe: [],
};

export default eintrag;
