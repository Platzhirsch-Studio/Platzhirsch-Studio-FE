// Palette – Bereich Kassa (G-01, MASTER § 3.5). Schreibt: Team B-KAS.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "KA-.YYYY.-.#####", doctype: "PH Kassenabschluss" },
    { serie: "KB-.YYYY.-.#####", doctype: "PH Kassenbuch" },
    { serie: "PH-DEP-.YYYY.-.####", doctype: "PH DEP Export" },
    { serie: "PH-KEV-.YYYY.-.#####", doctype: "PH Kassa Ereignis" },
  ],
  hilfe: [],
};

export default eintrag;
