// Palette – Bereich Shop (G-01, MASTER § 3.5). Schreibt: Team B-SHO.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "PH-S-.YY.MM.DD.-.#####", doctype: "PH Bestellung" },
    { serie: "PH-ZAH-.YYYY.-.#####", doctype: "PH Zahlung" },
    { serie: "PH-GS-.YYYY.-.#####", doctype: "PH Gutschein" },
    { serie: "PH-RET-.YYYY.-.#####", doctype: "PH Retoure" },
    { serie: "PH-WID-.YYYY.-.#####", doctype: "PH Widerruf" },
    { serie: "PH-WL-.YYYY.-.#####", doctype: "PH Wunschliste" },
  ],
  hilfe: [],
};

export default eintrag;
