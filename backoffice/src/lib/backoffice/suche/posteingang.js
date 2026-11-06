// Palette – Bereich E-Mails, Slug „posteingang“ (G-01, MASTER § 3.5). Schreibt: Team B-MAI.
// schnellaktionen: {id, titel, href, recht:{aktion, doctype?}, rang, kuerzel?} – rang ordnet über alle Bereiche.
// nummernmuster: keine – alle DocTypes von ph_microsoft heißen nach Hash, Adresse oder Benutzer.
// hilfe: {titel, pfad} – Artikel unter backoffice/hilfe/<bereich>/ (Team Q5).

/** @type {import("./index.js").SucheBereich} */
const eintrag = {
  schnellaktionen: [],
  nummernmuster: [],
  hilfe: [],
};

export default eintrag;
