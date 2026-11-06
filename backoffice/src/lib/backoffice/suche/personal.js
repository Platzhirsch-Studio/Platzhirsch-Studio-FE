// Palette – Bereich Personal (G-01, MASTER § 3.5). Schreibt: Team B-PER.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: {regex | serie, doctype} – Serien exakt wie die naming_series der DocType-JSONs (Backend-Import).
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).
//
// B-PER: Die Palette-Aktionen aus Konzept § 13.1 („> kommen“, „> gehen“, „> urlaub“, „> krank“, „> stelle“,
// „> bewerbung“) sind vorbereitet, aber nicht eingetragen – die Liste ist im Fundament-Test eingefroren
// (backoffice-register.test.mjs „Palette: … alter Reihenfolge“). Freigabe bei L0 angefragt (Übergabe B-PER).
// Kommen/Gehen öffnen bewusst nur die Stempelkarte (Bestätigung „Kommen jetzt buchen · Enter“, kein Einzeltasten-Buchen).

export const SCHNELL_VORBEREITET = Object.freeze([
  { id: "personal.kommen", titel: "Kommen oder Gehen buchen", href: "/personal/meins?stempeln=1", recht: { aktion: "read" }, rang: 70 },
  { id: "personal.urlaub", titel: "Urlaub beantragen", href: "/personal/meins?sheet=urlaub", recht: { aktion: "create", doctype: "PH Abwesenheit" }, rang: 71 },
  { id: "personal.krank", titel: "Krank melden", href: "/personal/meins?sheet=krank", recht: { aktion: "read" }, rang: 72 },
  { id: "personal.stelle", titel: "Neue Stelle", href: "/personal/stellen?neu=1", recht: { aktion: "create", doctype: "PH Stelle" }, rang: 73 },
  { id: "personal.bewerbung", titel: "Neue Bewerbung", href: "/personal/bewerbungen?neu=1", recht: { aktion: "create", doctype: "PH Bewerbung" }, rang: 74 },
]);

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [
    { serie: "PH-BEW-.YYYY.-.#####", doctype: "PH Bewerbung" },
    { serie: "PH-GSP-.YYYY.-.#####", doctype: "PH Bewerbungsgespraech" },
    { serie: "PH-MA-.####", doctype: "PH Mitarbeiter" },
    { serie: "PH-ABW-.YYYY.-.#####", doctype: "PH Abwesenheit" },
    { serie: "PH-KRANK-.YYYY.-.#####", doctype: "PH Krankmeldung" },
    { serie: "PH-ZEIT-.YYYY.-.######", doctype: "PH Zeiterfassung" },
  ],
  hilfe: [],
};

export default eintrag;
