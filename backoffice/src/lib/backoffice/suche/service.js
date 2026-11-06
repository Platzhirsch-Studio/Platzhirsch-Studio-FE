// Palette – Bereich Service (G-01, MASTER § 3.5). Schreibt: Team B-SER.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  // Reihenfolge und Form der ersten Schnellaktion prüft backoffice-register.test.mjs („alte Reihenfolge“); weitere
  // Service-Aktionen (Melden-Sheet, Einsatz planen) bietet die Bereichsseite selbst an – Antrag an P0-1 im Übergabeprotokoll.
  schnellaktionen: [
    { id: "service.neuer-servicefall", titel: "Neuer Servicefall", href: "/d/ph-servicefall/neu", recht: { aktion: "create", doctype: "PH Servicefall" }, rang: 70 },
  ],
  nummernmuster: [
    { serie: "PH-SRV-.YYYY.-.#####", doctype: "PH Servicefall" },
    { serie: "PH-SA-.YYYY.-.#####", doctype: "PH Serviceauftrag" },
    { serie: "PH-SRE-.YYYY.-.#####", doctype: "PH Serviceeinsatz" },
    { serie: "PFL-.YYYY.-.#####", doctype: "PH Pflege Abo" },
    { serie: "PH-ET-.#####", doctype: "PH Ersatzteil" },
    { serie: "PH-ETB-.YYYY.-.#####", doctype: "PH Ersatzteilbestellung" },
    { serie: "PH-REG-.YYYY.-.#####", doctype: "PH Lieferantenregress" },
  ],
  hilfe: [],
};

export default eintrag;
