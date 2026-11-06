// Commit-Aktionen des Bereichs „kassa“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "kassa.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "kassa.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {};

export default aktionen;
