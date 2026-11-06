// Commit-Aktionen des Bereichs „personal“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "personal.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "personal.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// Variante A (verzögerter Commit, Konzept § 3.4 / E1): Kommen, Workflow-Übergänge (Bewerbung, Stelle, Abwesenheit),
// Absage senden (10 s), Gespräch absagen / nicht erschienen, Stelle verlängern, Krankmeldung-Schritte.
// Server sieht vor Ablauf nichts (keine Benachrichtigung, kein gesichtet_am). Methoden über ../../personal/methoden.js.

import { DT, M, aufruf, methode, workflow } from "../../personal/methoden.js";

async function sicher(fn) {
  try {
    return await fn();
  } catch (err) {
    return { ok: false, code: err?.code || "unavailable", message: err?.message || "Nicht gespeichert." };
  }
}

const text = (x, max = 140) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
const istName = (x) => typeof x === "string" && /^[A-Za-z0-9._@:/-]{1,140}$/.test(x);

const BEWERBUNG_AKTIONEN = ["Sichten", "Angebot erstellen", "Zurückziehen", "Zurück auf Gesichtet", "Zurück auf Eingegangen", "Zurück auf Gespräch"];
const STELLE_AKTIONEN = ["Veröffentlichen", "Pausieren", "Wieder aktivieren", "Als besetzt schließen", "Archivieren", "Zurück auf Entwurf"];
const ANTRAG_AKTIONEN = ["Genehmigen", "Ablehnen", "Stornieren"];
const KRANK_METHODEN = ["bestaetigung_erfasst", "gesund_melden", "verlaengern"];

function pfade(revalidiere, ...liste) {
  for (const p of ["/personal", ...liste]) revalidiere(p);
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "personal.kommen": async ({ client, args, revalidiere }) =>
    sicher(async () => {
      const r = await aufruf(client, M.stempeln, args?.mitarbeiter && istName(args.mitarbeiter) ? { mitarbeiter: args.mitarbeiter } : {});
      if (r && r.ok === false) return { ok: false, code: "conflict", message: r.meldung || "Nicht gebucht." };
      pfade(revalidiere, "/personal/meins", "/personal/meins/zeiten", "/personal/team");
      return { name: r?.name, meldung: r?.meldung };
    }),

  "personal.bewerbung-workflow": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !BEWERBUNG_AKTIONEN.includes(args?.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      const doc = await workflow(client, DT.bewerbung, args.name, args.aktion);
      pfade(revalidiere, "/personal/bewerbungen", `/personal/bewerbungen/${args.name}`);
      return { status: doc?.status };
    });
  },

  "personal.stelle-workflow": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !STELLE_AKTIONEN.includes(args?.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      let status;
      if (args.aktion === "Als besetzt schließen" && args.bewerbung) status = await methode(client, DT.stelle, args.name, "als_besetzt", { bewerbung: args.bewerbung });
      else status = (await workflow(client, DT.stelle, args.name, args.aktion))?.status;
      pfade(revalidiere, "/personal/stellen", `/personal/stellen/${args.name}`);
      return { status };
    });
  },

  "personal.stelle-verlaengern": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !/^\d{4}-\d{2}-\d{2}$/.test(args?.bis || "")) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      await client.setValue(DT.stelle, args.name, "gueltig_bis", args.bis);
      if (args.aktivieren) await workflow(client, DT.stelle, args.name, "Wieder aktivieren");
      pfade(revalidiere, "/personal/stellen", `/personal/stellen/${args.name}`);
      return { bis: args.bis };
    });
  },

  "personal.antrag": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !ANTRAG_AKTIONEN.includes(args?.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.aktion === "Ablehnen" && !text(args.grund, 500)) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben." };
    return sicher(async () => {
      if (args.aktion === "Ablehnen") await client.setValue(DT.abw, args.name, "ablehnungsgrund", text(args.grund, 500));
      const doc = await workflow(client, DT.abw, args.name, args.aktion);
      pfade(revalidiere, "/personal/team", "/personal/meins", "/personal/meins/urlaub");
      return { status: doc?.status };
    });
  },

  "personal.krank": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !KRANK_METHODEN.includes(args?.methode)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      const r = await methode(client, DT.krank, args.name, args.methode, args.args || {});
      pfade(revalidiere, "/personal/team", "/personal/meins");
      return { status: r };
    });
  },

  "personal.absage": async ({ client, args, revalidiere }) => {
    const namen = Array.isArray(args?.namen) ? args.namen.filter(istName).slice(0, 50) : [];
    const versand = ["E-Mail", "Post", "Telefon", "Persönlich"].includes(args?.versand) ? args.versand : "E-Mail";
    if (!namen.length) return { ok: false, code: "invalid", message: "Keine Bewerbung gewählt." };
    return sicher(async () => {
      const ergebnisse = [];
      for (const name of namen) {
        try {
          await methode(client, DT.bewerbung, name, "absage_senden", { grund: text(args.grund) || "Sonstiges", per_mail: versand === "E-Mail" ? 1 : 0 });
          if (versand !== "E-Mail") await methode(client, DT.bewerbung, name, "absage_dokumentieren", { versand });
          ergebnisse.push({ name, ok: true });
        } catch (err) {
          ergebnisse.push({ name, ok: false, message: err?.message });
        }
      }
      pfade(revalidiere, "/personal/bewerbungen", ...namen.map((n) => `/personal/bewerbungen/${n}`));
      const fehler = ergebnisse.filter((e) => !e.ok);
      if (fehler.length === namen.length) return { ok: false, code: "invalid", message: fehler[0].message || "Nicht gesendet." };
      return { ergebnisse };
    });
  },

  "personal.gespraech-status": async ({ client, args, revalidiere }) => {
    if (!istName(args?.name) || !["Abgesagt", "Nicht erschienen"].includes(args?.status)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      await client.setValue(DT.gespraech, args.name, "status", args.status);
      pfade(revalidiere, "/personal/gespraeche");
      return { status: args.status };
    });
  },
};

export default aktionen;
