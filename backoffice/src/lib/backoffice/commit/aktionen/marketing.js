// Commit-Aktionen des Bereichs „marketing“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "marketing.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "marketing.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// 10-konzept-marketing § 2.0.6 / MASTER Q-C3: Wirkung nach außen und rückholbar → verzögerter Commit (Zur Freigabe,
// Freigeben, Verwerfen, Als ausgebucht, Pausieren/Fortsetzen, Code senden, Kalender-Datum, Versandtermin, Check-in).
// Benachrichtigungen an andere (Freigabe-Aufgaben) entstehen erst hier, also nach dem Commit.

import * as M from "../../marketing/methoden.js";
import { istLeitung } from "../../marketing/rollen.js";

const NAME = /^[\p{L}\p{N} ._@:/+&()-]{1,140}$/u;
const ISO = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

function fehlerAus(err) {
  return { ok: false, code: err?.code || "unavailable", message: err?.message || "Nicht ausgeführt." };
}

const nameOk = (n) => typeof n === "string" && NAME.test(n);
const leitungNoetig = { ok: false, code: "forbidden", message: "Das gibt die Leitung Marketing frei." };

async function versuch(fn, revalidiere, pfade = []) {
  try {
    const r = await fn();
    for (const p of pfade) revalidiere(p);
    return r ?? { ok: true };
  } catch (err) {
    return fehlerAus(err);
  }
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "marketing.ausgabe-zur-freigabe": async ({ client, args, revalidiere }) => {
    if (!nameOk(args?.name)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(async () => {
      const doc = await M.ausgabeZurFreigabe(client, args.name);
      if (client.modus === "mock") await M.freigabeAufgabeAnlegen(client, { doctype: "PH Newsletter Ausgabe", name: args.name, beschreibung: `Ausgabe ${doc.slug} wartet auf Freigabe` });
      return { name: args.name };
    }, revalidiere, ["/marketing/newsletter", "/marketing"]);
  },

  "marketing.ausgabe-freigeben": async ({ session, client, args, revalidiere }) => {
    if (!istLeitung(session)) return leitungNoetig;
    if (!nameOk(args?.name) || (args.versand_geplant && !ISO.test(args.versand_geplant))) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(async () => {
      await M.ausgabeFreigeben(client, { name: args.name, versand_geplant: args.versand_geplant });
      await M.freigabeAufgabenSchliessen(client, { doctype: "PH Newsletter Ausgabe", name: args.name });
      return { name: args.name };
    }, revalidiere, ["/marketing/newsletter", "/marketing"]);
  },

  "marketing.ausgabe-termin": async ({ session, client, args, revalidiere }) => {
    if (!istLeitung(session)) return leitungNoetig;
    if (!nameOk(args?.name) || !ISO.test(args?.termin || "")) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(() => M.ausgabeTermin(client, { name: args.name, termin: args.termin }).then(() => ({ name: args.name })), revalidiere, ["/marketing/newsletter"]);
  },

  "marketing.social-zur-freigabe": async ({ client, args, revalidiere }) => {
    if (!nameOk(args?.name)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(() => M.socialZurFreigabe(client, { name: args.name, leitung: Array.isArray(args.leitung) ? args.leitung.slice(0, 5) : [] }).then(() => ({ name: args.name })), revalidiere, ["/marketing/social", "/marketing"]);
  },

  "marketing.social-workflow": async ({ session, client, args, revalidiere }) => {
    const namen = Array.isArray(args?.namen) ? args.namen.filter(nameOk).slice(0, 200) : [];
    if (!namen.length || !["Verwerfen", "Ausarbeiten", "Zurück auf Entwurf"].includes(args.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.aktion === "Zurück auf Entwurf" && !istLeitung(session)) return leitungNoetig;
    const erledigt = [];
    const fehler = [];
    for (const n of namen) {
      try {
        await client.workflowAction("PH Social Beitrag", n, args.aktion);
        erledigt.push(n);
      } catch (err) {
        fehler.push({ name: n, message: err?.message || "nicht möglich" });
      }
    }
    revalidiere("/marketing/social");
    if (!erledigt.length) return { ok: false, code: "invalid", message: fehler[0]?.message || "Nicht ausgeführt." };
    return { erledigt, fehler };
  },

  "marketing.social-datum": async ({ client, args, revalidiere }) => {
    const ziele = Array.isArray(args?.ziele) ? args.ziele.filter((z) => nameOk(z?.name) && ISO.test(z?.datum || "")).slice(0, 200) : [];
    if (!ziele.length) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    const fehler = [];
    for (const z of ziele) {
      try {
        await M.socialDatumSetzen(client, z);
      } catch (err) {
        fehler.push({ name: z.name, message: err?.message || "nicht möglich" });
      }
    }
    revalidiere("/marketing/social");
    if (fehler.length === ziele.length) return { ok: false, code: "invalid", message: fehler[0].message };
    return { fehler };
  },

  "marketing.event-workflow": async ({ session, client, args, revalidiere }) => {
    if (!nameOk(args?.name) || !["Als ausgebucht markieren", "Wieder öffnen", "Veröffentlichen"].includes(args?.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.aktion !== "Als ausgebucht markieren" && !istLeitung(session)) return leitungNoetig;
    return versuch(() => client.workflowAction("PH Event", args.name, args.aktion).then(() => ({ name: args.name })), revalidiere, ["/marketing/events", `/marketing/events/${args.name}`]);
  },

  "marketing.kampagne-workflow": async ({ session, client, args, revalidiere }) => {
    const namen = Array.isArray(args?.namen) ? args.namen.filter(nameOk).slice(0, 200) : [];
    if (!namen.length || !["Pausieren", "Fortsetzen", "Aktivieren"].includes(args?.aktion)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    if (args.aktion === "Aktivieren" && !istLeitung(session)) return leitungNoetig;
    const erledigt = [];
    const fehler = [];
    for (const n of namen) {
      try {
        await client.workflowAction("PH Kampagne", n, args.aktion);
        erledigt.push(n);
      } catch (err) {
        fehler.push({ name: n, message: err?.message || "nicht möglich" });
      }
    }
    revalidiere("/marketing/kampagnen");
    if (!erledigt.length) return { ok: false, code: "invalid", message: fehler[0]?.message || "Nicht ausgeführt." };
    return { erledigt, fehler };
  },

  "marketing.reise-pausieren": async ({ session, client, args, revalidiere }) => {
    if (!istLeitung(session)) return leitungNoetig;
    const namen = Array.isArray(args?.namen) ? args.namen.filter(nameOk).slice(0, 50) : [];
    if (!namen.length) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(async () => {
      for (const n of namen) await M.reisePausieren(client, n);
      return { namen };
    }, revalidiere, ["/marketing/kundenreisen"]);
  },

  "marketing.code-senden": async ({ client, args, revalidiere }) => {
    const codes = Array.isArray(args?.codes) ? args.codes.filter(nameOk).slice(0, 100) : [];
    if (!codes.length) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(async () => {
      for (const c of codes) await M.codeSenden(client, c);
      return { codes };
    }, revalidiere, ["/marketing/empfehlungen"]);
  },

  "marketing.einchecken": async ({ client, args, revalidiere }) => {
    if (!nameOk(args?.event) || !nameOk(args?.zeile)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return versuch(async () => {
      const r = await M.einchecken(client, { event: args.event, zeile: args.zeile, personen: args.personen ? Number(args.personen) : undefined, mitWrapper: !!args.wrapper });
      if (r.status === "bereits") return { ok: false, code: "conflict", message: `Schon da seit ${String(r.erschienen_am || "").slice(11, 16)} (anderes Gerät)` };
      if (r.status !== "ok") return { ok: false, code: "invalid", message: "Diese Anmeldung kann nicht eingecheckt werden." };
      return r;
    }, revalidiere, [`/marketing/events/${args.event}`]);
  },
};

export default aktionen;
