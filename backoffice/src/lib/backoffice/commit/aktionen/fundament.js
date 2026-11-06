// Allgemeine Commit-Aktionen des Fundaments (G-03, Team P0-3).
// Bereiche planen sie wie eigene Aktionen; Rechte prüft die planende Action vorher, Frappe beim Ausführen erneut.
//
//   fundament.workflow  Workflow-Übergang      args { doctype, name, aktion, pfad? }
//   fundament.methode   Dokumentmethode        args { doctype, name, methode, args?, pfad? }
//   fundament.demo      nur Mock: Demo/E2E      args { fehler?: boolean }

const TEXT_GRENZE = /^[\w .:@/+-]{1,140}$/u;

function pruefe(args, felder) {
  for (const f of felder) {
    if (typeof args?.[f] !== "string" || !TEXT_GRENZE.test(args[f])) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
  }
  return null;
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "fundament.workflow": async ({ client, args, revalidiere }) => {
    const f = pruefe(args, ["doctype", "name", "aktion"]);
    if (f) return f;
    await client.workflowAction(args.doctype, args.name, args.aktion);
    if (args.pfad) revalidiere(args.pfad);
    return { name: args.name };
  },

  "fundament.methode": async ({ client, args, revalidiere }) => {
    const f = pruefe(args, ["doctype", "name", "methode"]);
    if (f) return f;
    const r = await client.runDocMethod(args.doctype, args.name, args.methode, args.args && typeof args.args === "object" ? args.args : {});
    if (args.pfad) revalidiere(args.pfad);
    return r ?? null;
  },

  "fundament.demo": async ({ client, args, quelle }) => {
    if (client?.modus === "frappe") return { ok: false, code: "forbidden", message: "Nur im Testmodus." };
    if (args?.fehler) return { ok: false, code: "conflict", message: "Die Anfrage wurde inzwischen von jemand anderem bearbeitet" };
    return { gespeichert: true, quelle };
  },
};

export default aktionen;
