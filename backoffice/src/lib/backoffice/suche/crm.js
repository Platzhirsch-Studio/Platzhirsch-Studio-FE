// Palette – Bereich CRM (G-01, MASTER § 3.5). Schreibt: Team B-CRM.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  // Liste ist im Fundament-Test eingefroren (backoffice-register.test.mjs „Palette: … alter Reihenfolge“);
  // weitere CRM-Einträge (> anruf, > Termine, > Gespräche, > Berichte, > E-Mails) stehen im Übergabeprotokoll B-CRM.
  schnellaktionen: [
    { id: "crm.neue-anfrage", titel: "Neue Anfrage", href: "/d/ph-anfrage/neu", recht: { aktion: "create", doctype: "PH Anfrage" }, rang: 10 },
    { id: "crm.neuer-kontakt", titel: "Neuer Kontakt", href: "/d/ph-kontakt/neu", recht: { aktion: "create", doctype: "PH Kontakt" }, rang: 20 },
    { id: "crm.neuer-termin", titel: "Neuer Termin", href: "/d/ph-termin/neu", recht: { aktion: "create", doctype: "PH Termin" }, rang: 30 },
  ],
  nummernmuster: [
    { serie: "PH-ANF-.YYYY.-.#####", doctype: "PH Anfrage" },
    { serie: "PH-KON-.#####", doctype: "PH Kontakt" },
    { serie: "PH-TER-.YYYY.-.#####", doctype: "PH Termin" },
    { serie: "PH-BG-.YYYY.-.#####", doctype: "PH Beratungsgespraech" },
    { serie: "PH-AUF-.YYYY.-.#####", doctype: "PH Aufgabe" },
    { serie: "PH-DSA-.YYYY.-.#####", doctype: "PH Datenschutzanfrage" },
  ],
  hilfe: [],
};

export default eintrag;
