// Palette – Bereich Sortiment (G-01, MASTER § 3.5). Schreibt: Team B-SOR.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
// 10-konzept-sortiment § 20.1: Palette „> neues produkt“, „> neue bestellung“, „> ab einlesen“, „> preisliste“.

/**
 * Vorbereitete Schnellaktionen und Hilfe-Artikel. Noch NICHT eingetragen: tests/unit/backoffice-register.test.mjs
 * („Palette: Schnellaktionen in alter Reihenfolge“) friert die Liste von P0-1 ein und würde rot. Freischalten durch
 * L0/P0-1: Snapshot auf Bereichs-Einträge umstellen, dann unten `schnellaktionen: SCHNELLAKTIONEN` setzen.
 */
export const SCHNELLAKTIONEN = [
    { id: "sortiment.produkt-neu", titel: "Neues Produkt", href: "/sortiment/produkte?neu=produkt", recht: { aktion: "create", doctype: "PH Produkt" }, rang: 60 },
    { id: "sortiment.bestellung-neu", titel: "Neue Herstellerbestellung", href: "/sortiment/bestellungen/neu", recht: { aktion: "create", doctype: "PH Herstellerbestellung" }, rang: 61 },
    { id: "sortiment.ab-einlesen", titel: "AB einlesen", href: "/sortiment/bestellungen?segment=unterwegs", recht: { aktion: "write", doctype: "PH Herstellerbestellung" }, rang: 62 },
    { id: "sortiment.wareneingang-neu", titel: "Wareneingang buchen", href: "/sortiment/wareneingang/neu", recht: { aktion: "create", doctype: "PH Wareneingang" }, rang: 63 },
    { id: "sortiment.preisliste-neu", titel: "Preisliste einlesen", href: "/sortiment/preislisten/neu", recht: { aktion: "create", doctype: "PH Preisliste Import" }, rang: 64 },
    { id: "sortiment.freigaben", titel: "Freigaben Sortiment", href: "/sortiment/freigaben", recht: { aktion: "read", doctype: "PH Produkt" }, rang: 65 },
    { id: "sortiment.bestellvorschlaege", titel: "Bestellvorschläge", href: "/sortiment/bestellvorschlaege", recht: { aktion: "read", doctype: "PH Herstellerbestellung" }, rang: 66 },
];

export const HILFE_ARTIKEL = [
    { titel: "Sortiment – Überblick", pfad: "sortiment/start" },
    { titel: "Herstellerbestellung und AB-Abgleich", pfad: "sortiment/bestellungen" },
    { titel: "Freigaben: Bilder, Preise, Lieferzeiten", pfad: "sortiment/freigaben" },
];

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "HB-.YYYY.-.#####", doctype: "PH Herstellerbestellung" },
    { serie: "WE-.YYYY.-.#####", doctype: "PH Wareneingang" },
    { serie: "PH-PLI-.YYYY.-.####", doctype: "PH Preisliste Import" },
  ],
  hilfe: [],
};

export default eintrag;
