// Palette – Bereich Logistik (G-01, MASTER § 3.5). Schreibt: Team B-LOG.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
// Palette laut 10-konzept-logistik § 14.1: „> packen“, „> tour“, „> umlagern“, „> lieferschein“, „> zählen“.

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "LS-.YYYY.-.#####", doctype: "PH Lieferschein" },
    { serie: "PH-SND-.YYYY.-.#####", doctype: "PH Sendung" },
    { serie: "PH-TOUR-.YYYY.-.####", doctype: "PH Tour" },
    { serie: "PH-LB-.#####", doctype: "PH Lagerbestand" },
    { serie: "PH-LBW-.YYYY.-.#####", doctype: "PH Lagerbewegung" },
    { serie: "PH-INV-.YYYY.-.####", doctype: "PH Inventur" },
    { serie: "PH-SPA-.YYYY.-.####", doctype: "PH Speditionsauftrag" },
    { serie: "PH-WR-.YYYY.-.####", doctype: "PH Warenruecknahme" },
    { serie: "PH-BV-.YYYY.-.#####", doctype: "PH Bestellvorschlag" },
    { serie: "PH-IB-.YYYY.-.####", doctype: "PH Inventurbewertung" },
    { serie: "PH-MB-.#####", doctype: "PH Meldebestand" },
  ],
  hilfe: [],
};

export default eintrag;

// Vorgesehen (10-konzept-logistik § 14.1), sobald der Palettentest in tests/unit/backoffice-register.test.mjs
// neue Einträge zulässt (Fundament P0-1/L0) – dann oben eintragen.
export const VORGESEHEN_SCHNELLAKTIONEN = [
    { id: "logistik.packen", titel: "Packen am Packtisch", href: "/packtisch", recht: { aktion: "write", doctype: "PH Lieferschein" }, rang: 400 },
    { id: "logistik.tour-neu", titel: "Neue Tour", href: "/logistik/touren?neu=1", recht: { aktion: "create", doctype: "PH Tour" }, rang: 410 },
    { id: "logistik.umlagern", titel: "Umlagern", href: "/logistik/bestand?dialog=umlagern", recht: { aktion: "write", doctype: "PH Lagerbestand" }, rang: 420 },
    { id: "logistik.lieferschein", titel: "Lieferscheine", href: "/logistik/lieferscheine", recht: { aktion: "read", doctype: "PH Lieferschein" }, rang: 430 },
    { id: "logistik.inventur-neu", titel: "Inventur anlegen", href: "/logistik/inventur?dialog=anlegen", recht: { aktion: "create", doctype: "PH Inventur" }, rang: 440 },
    { id: "logistik.plantafel", titel: "Plantafel", href: "/logistik/touren", recht: { aktion: "read", doctype: "PH Tour" }, rang: 450 },
];

export const VORGESEHENE_HILFE = [
    { titel: "Packtisch: Packen per Scan", pfad: "logistik/packtisch" },
    { titel: "Touren planen auf der Plantafel", pfad: "logistik/touren" },
    { titel: "Inventur und Zählen am iPhone", pfad: "logistik/inventur" },
];
