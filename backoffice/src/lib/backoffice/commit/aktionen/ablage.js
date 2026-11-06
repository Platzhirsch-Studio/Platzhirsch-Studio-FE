// Commit-Aktionen des Bereichs „ablage“ (G-03). Nur dieser Bereich schreibt hier (Team B-ABL).
// Name = "ablage.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "ablage.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// Variante A (verzögerter Commit, Konzept 10-konzept-ablage §4): Portal-Freigabe/-Rücknahme (Außenwirkung beim Kunden).

import { ablage } from "../../ablage/methoden.js";

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "ablage.portal": async ({ client, args, revalidiere }) => {
    if (!NAME_RE.test(String(args?.datei || ""))) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    try {
      const r = await ablage(client, "portal_freigeben", {
        datei: args.datei,
        freigeben: args.freigeben ? 1 : 0,
        bis: args.bis || undefined,
        titel: args.titel || undefined,
      });
      revalidiere(`/ablage/datei/${args.datei}`);
      revalidiere("/ablage/freigaben");
      revalidiere("/ablage");
      return r;
    } catch (err) {
      return { ok: false, code: err?.code || "unavailable", message: err?.message || "Nicht gespeichert." };
    }
  },
};

export default aktionen;
