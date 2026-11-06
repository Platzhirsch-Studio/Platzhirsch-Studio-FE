// Commit-Aktionen des Bereichs Service für den verzögerten Commit (G-03, 10-konzept-service §4.2, §4.6).
// Vorgesehen für lib/backoffice/commit/aktionen/service.js (Teildatei des Bereichs, außerhalb des B-SER-Schreibbereichs):
//   export { default } from "../../service/commit-aktionen.js";
// Solange diese Zeile fehlt, führen die Service-Actions sofort aus (ohne „Rückgängig“) – siehe planeOderSofort().
// Unterschied zu fundament.methode/workflow: Mock-Pfad mit Wirkung (dienst.methode) und Umlaute im Aktionsnamen.

import { methode } from "./dienst.js";

const DOCTYPES = new Set(["PH Servicefall", "PH Serviceeinsatz", "PH Lieferantenregress", "PH Ersatzteilbestellung", "PH Pflege Abo", "PH Serviceauftrag", "PH Ersatzteil"]);
const NAME = /^[A-Za-z0-9 ._-]{1,80}$/;
const TEXT = /^[\p{L}\p{N} .,:;!?()/'"„“–+@_-]{1,140}$/u;

function pruefe(args, mitText) {
  if (!DOCTYPES.has(args?.doctype) || !NAME.test(String(args?.name || ""))) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
  if (mitText && !TEXT.test(String(args?.[mitText] || ""))) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
  return null;
}

/** @type {Record<string, (ctx: {client:any, args:any, revalidiere:(p:string)=>void}) => Promise<any>>} */
const aktionen = {
  "service.methode": async ({ client, args, revalidiere }) => {
    const f = pruefe(args, "methode");
    if (f) return f;
    const r = await methode(client, args.doctype, args.name, args.methode, args.args && typeof args.args === "object" ? args.args : {});
    for (const p of [].concat(args.pfad || [])) revalidiere(p);
    return r ?? null;
  },
  "service.workflow": async ({ client, args, revalidiere }) => {
    const f = pruefe(args, "aktion");
    if (f) return f;
    await client.workflowAction(args.doctype, args.name, args.aktion);
    for (const p of [].concat(args.pfad || [])) revalidiere(p);
    return { name: args.name };
  },
};

export const SERVICE_COMMIT_NAMEN = Object.keys(aktionen);
export default aktionen;
