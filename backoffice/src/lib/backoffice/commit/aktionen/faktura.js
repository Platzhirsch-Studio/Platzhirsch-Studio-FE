// Commit-Aktionen des Bereichs „faktura“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "faktura.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "faktura.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
// B-FAK: Inhalt liegt im Bereich (lib/backoffice/faktura/commit-aktionen.js); hier nur der Re-Export.

export { default } from "../../faktura/commit-aktionen.js";
