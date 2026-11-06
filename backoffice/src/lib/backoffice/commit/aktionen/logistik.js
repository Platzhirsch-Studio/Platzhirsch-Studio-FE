// Commit-Aktionen des Bereichs „logistik“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "logistik.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "logistik.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
// Verzögert laufen (10-konzept-logistik § 3.3, E1): Gepackt (auch Abholbereit), Übergeben, Tour freigeben.

import { alsGepackt, tourMethode, uebergeben } from "../../logistik/dienst.js";

const NAME = /^[A-Za-z0-9 .:/_-]{1,80}$/;

function name(x) {
  return typeof x === "string" && NAME.test(x);
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "logistik.gepackt": async ({ client, args, revalidiere }) => {
    if (!name(args?.lieferschein)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    const r = await alsGepackt(client, { lieferschein: args.lieferschein });
    revalidiere("/logistik/lieferscheine");
    revalidiere(`/logistik/lieferscheine/${args.lieferschein}`);
    revalidiere("/packtisch");
    return r;
  },
  "logistik.uebergeben": async ({ client, args, revalidiere }) => {
    const namen = Array.isArray(args?.namen) ? args.namen.filter(name) : [];
    if (!namen.length) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    const an = ["Dienstleister", "Spedition", "Kunde", "Fahrer"].includes(args.an) ? args.an : "Dienstleister";
    let n = 0;
    for (const l of namen) {
      await uebergeben(client, { lieferschein: l, an });
      if (args.override) await client.kommentar("PH Lieferschein", l, `Anzahlungs-Sperre überschrieben: ${String(args.override).slice(0, 300)}`, "Comment");
      n++;
    }
    revalidiere("/logistik/lieferscheine");
    return { uebergeben: n };
  },
  "logistik.tour-freigeben": async ({ client, args, revalidiere }) => {
    if (!name(args?.name)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.override) await client.kommentar("PH Tour", args.name, `Anzahlungs-Sperre überschrieben: ${String(args.override).slice(0, 300)}`, "Comment");
    const r = await tourMethode(client, { name: args.name, methode: "freigeben" });
    revalidiere("/logistik/touren");
    revalidiere(`/logistik/touren/${args.name}`);
    return { status: r?.status || "Freigegeben" };
  },
};

export default aktionen;
