// Palette – Bereich Zentrale (G-01, MASTER § 3.5). Schreibt: Team B-ZEN.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [
    // Form und Reihenfolge friert tests/unit/backoffice-register.test.mjs ein (P0-1). Ziel /aufgaben?neu=1 und Recht
    // „create“ trägt L0 nach, sobald der Schnappschuss-Test angepasst ist (Übergabe B-ZEN); /d/ph-aufgabe/neu läuft weiter.
    { id: "zentrale.neue-aufgabe", titel: "Neue Aufgabe", href: "/d/ph-aufgabe/neu", recht: { aktion: "read", doctype: "PH Aufgabe" }, rang: 40 },
    { id: "zentrale.arbeitsplatz", titel: "Arbeitsplatz wechseln", href: "/arbeitsplatz", recht: { aktion: "read" }, rang: 80 },
    { id: "zentrale.geraet", titel: "Gerät registrieren", href: "/geraet", recht: { aktion: "read" }, rang: 90 },
  ],
  nummernmuster: [
    { serie: "PH-GER-.####", doctype: "PH Geraet" },
  ],
  hilfe: [],
};

export default eintrag;
