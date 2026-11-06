// Palette – Bereich Projekte (G-01, MASTER § 3.5). Schreibt: Team B-PRJ.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [
    { id: "projekte.neues-projekt", titel: "Neues Projekt", href: "/d/ph-projekt/neu", recht: { aktion: "create", doctype: "PH Projekt" }, rang: 50 },
  ],
  nummernmuster: [
    { serie: "PH-PRJ-.YYYY.-.####", doctype: "PH Projekt" },
    { serie: "PH-NK-.YYYY.-.####", doctype: "PH Projekt Nachkalkulation" },
    { serie: "PH-PLN-.YYYY.-.####", doctype: "PH Planung" },
    { serie: "PH-MON-.YYYY.-.####", doctype: "PH Montageauftrag" },
    { serie: "PH-ABN-.YYYY.-.####", doctype: "PH Abnahme" },
    { serie: "PH-AFM-.YYYY.-.####", doctype: "PH Aufmass" },
    { serie: "PH-GEW-.YYYY.-.####", doctype: "PH Fremdgewerk" },
    { serie: "PH-NT-.YYYY.-.####", doctype: "PH Nachtrag" },
    { serie: "PH-PP-.YYYY.-.#####", doctype: "PH Produktpass" },
    { serie: "PH-PAU-.YYYY.-.#####", doctype: "PH Projekt Aufgabe" },
    { serie: "PH-DOK-.YYYY.-.#####", doctype: "PH Projekt Dokument" },
    { serie: "PH-NAC-.YYYY.-.#####", doctype: "PH Projekt Nachricht" },
    { serie: "PH-PZT-.YYYY.-.#####", doctype: "PH Projektzeit" },
    { serie: "PH-REN-.YYYY.-.####", doctype: "PH Rendering" },
    { serie: "PH-FB-.YYYY.-.#####", doctype: "PH Rendering Feedback" },
  ],
  hilfe: [],
};

export default eintrag;
