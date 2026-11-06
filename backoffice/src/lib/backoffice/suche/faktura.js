// Palette – Bereich Faktura (G-01, MASTER § 3.5). Schreibt: Team B-FAK.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [
    { id: "faktura.neues-angebot", titel: "Neues Angebot", href: "/d/ph-angebot/neu", recht: { aktion: "create", doctype: "PH Angebot" }, rang: 60 },
  ],
  nummernmuster: [
    { serie: "AN-.YYYY.-.#####", doctype: "PH Angebot" },
    { serie: "AB-.YYYY.-.#####", doctype: "PH Auftragsbestaetigung" },
    { serie: "RE-.YYYY.-.#####", doctype: "PH Rechnung" },
    { serie: "GU-.YYYY.-.#####", doctype: "PH Gutschrift" },
    { serie: "MA-.YYYY.-.#####", doctype: "PH Mahnung" },
    { serie: "ER-.YYYY.-.#####", doctype: "PH Eingangsrechnung" },
    { serie: "BU-.YYYY.-.######", doctype: "PH Bankumsatz" },
    { serie: "BI-.YYYY.-.####", doctype: "PH Bankimport" },
    { serie: "EX-.YYYY.-.####", doctype: "PH Export Lauf" },
    { serie: "UVA-.YYYY.-.###", doctype: "PH UVA Auswertung" },
    { regex: /^ENTW-\d{4}-\d{5,}$/, doctype: "PH Rechnung" }, // Rechnungsentwurf (format:ENTW-{YYYY}-{#####})
    { regex: /^ENTW-GU-\d{4}-\d{5,}$/, doctype: "PH Gutschrift" }, // Gutschrift-Entwurf (format:ENTW-GU-{YYYY}-{#####})
  ],
  hilfe: [],
};

export default eintrag;
