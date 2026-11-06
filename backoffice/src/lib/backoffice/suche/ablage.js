// Palette – Bereich Ablage (G-01, MASTER § 3.5). Schreibt: Team B-ABL.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
//
// B-ABL: Die Schnellaktionen sind vorbereitet, aber nicht eingetragen – die Liste ist im Fundament-Test eingefroren
// (backoffice-register.test.mjs „Palette … alter Reihenfolge“). Freigabe bei L0 angefragt (Übergabe B-ABL);
// danach SCHNELL_VORBEREITET übernehmen. Hochladen läuft über die Ablage-Seite (?hochladen=1), nicht über ein
// generisches Neu-Formular.

export const SCHNELL_VORBEREITET = Object.freeze([
  { id: "ablage.hochladen", titel: "Datei hochladen", href: "/ablage?hochladen=1", recht: { aktion: "create", doctype: "PH Datei" }, rang: 70 },
  { id: "ablage.papierkorb", titel: "Papierkorb öffnen", href: "/ablage/papierkorb", recht: { aktion: "read", doctype: "PH Datei" }, rang: 71 },
  { id: "ablage.freigaben", titel: "Freigabelinks prüfen", href: "/ablage/freigaben", recht: { aktion: "read", doctype: "PH Datei Freigabelink" }, rang: 72 },
]);

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "PH-DAT-.YYYY.-.######", doctype: "PH Datei" },
    { serie: "PH-ORD-.######", doctype: "PH Ordner" },
  ],
  hilfe: [],
};

export default eintrag;
