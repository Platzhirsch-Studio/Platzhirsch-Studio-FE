// Commit-Aktionen des Bereichs „sortiment“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "sortiment.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "sortiment.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// 10-konzept-sortiment § 7 / MASTER Q-C3: alles mit Außenwirkung (Website, Hersteller) und jeder Workflow-Übergang
// läuft verzögert – die Website und der Hersteller sehen vor Ablauf der 8 s nichts.

import { abNachfragen, abweichungKlaeren, bildfreigabeAnfordern, freigabeSetzen, perEmailSenden, preisHinzufuegen, preislisteMethode, produktWorkflow, uebermittlungSetzen } from "../../sortiment/methoden.js";
import { istLeitung } from "../../sortiment/rollen.js";

const TEXT = /^[\p{L}\p{N} .,:;@/+&()'"„“–_-]{0,500}$/u;

function fehlerText(err) {
  return { ok: false, code: err?.code || "unavailable", message: err?.message || "Nicht ausgeführt." };
}

function namenOk(namen) {
  return Array.isArray(namen) && namen.length > 0 && namen.length <= 200 && namen.every((n) => typeof n === "string" && n.length <= 140);
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  /** Produkt-Workflow für eine oder mehrere Zeilen; gesperrte werden übersprungen und gemeldet. */
  "sortiment.produkt-workflow": async ({ session, client, args, revalidiere }) => {
    if (!namenOk(args?.namen) || typeof args.aktion !== "string") return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    const erledigt = [];
    const fehler = [];
    for (const name of args.namen) {
      try {
        await produktWorkflow(client, name, args.aktion, { leitung: istLeitung(session) });
        erledigt.push(name);
      } catch (err) {
        fehler.push({ name, message: err?.message || "nicht möglich" });
      }
    }
    revalidiere("/sortiment/produkte");
    revalidiere("/sortiment");
    if (!erledigt.length) return { ok: false, code: "invalid", message: fehler[0]?.message || "Nicht ausgeführt." };
    return { erledigt, fehler };
  },

  /** Bild-, Preis- oder Lieferzeitfreigabe (Leitung). */
  "sortiment.freigabe": async ({ session, client, args, revalidiere }) => {
    if (!istLeitung(session)) return { ok: false, code: "forbidden", message: "Freigaben erteilt die Leitung Sortiment." };
    try {
      const r = await freigabeSetzen(client, { art: args?.art, ziele: args?.ziele || [], entscheidung: args?.entscheidung, grund: args?.grund || "" });
      revalidiere("/sortiment/freigaben");
      return r;
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Preis mit Freigabe (Leitung) – die Website zeigt ihn erst nach Ablauf. */
  "sortiment.preis": async ({ client, args, revalidiere }) => {
    try {
      const r = await preisHinzufuegen(client, args.produkt, { ...args.preis, freigegeben: 1 });
      revalidiere(`/sortiment/produkte/${encodeURIComponent(args.produkt)}`);
      return { name: r?.name || args.produkt };
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Bestellung per E-Mail an den Hersteller. */
  "sortiment.senden": async ({ client, args, revalidiere }) => {
    if (typeof args?.name !== "string" || (args.nachricht && !TEXT.test(args.nachricht.replace(/\n/g, " ")))) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    try {
      await perEmailSenden(client, args.name, { empfaenger: args.empfaenger || "", nachricht: args.nachricht || "" });
      revalidiere(`/sortiment/bestellungen/${encodeURIComponent(args.name)}`);
      return { name: args.name };
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Übermittlung markieren (übermittelt / Eingang bestätigt / Fehler). */
  "sortiment.uebermittlung": async ({ client, args, revalidiere }) => {
    try {
      await uebermittlungSetzen(client, args.name, { status: args.status, hinweis: args.hinweis || "" });
      revalidiere(`/sortiment/bestellungen/${encodeURIComponent(args.name)}`);
      return { name: args.name };
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Rückfrage beim Hersteller (Mail) bzw. beim Verkauf (Aufgabe). */
  "sortiment.klaeren": async ({ session, client, args, revalidiere }) => {
    try {
      await abweichungKlaeren(client, args.name, { zeile: args.zeile, aktion: args.aktion, text: args.text || "" }, { leitung: istLeitung(session) });
      revalidiere(`/sortiment/bestellungen/${encodeURIComponent(args.name)}`);
      return { name: args.name };
    } catch (err) {
      return fehlerText(err);
    }
  },

  "sortiment.ab-nachfragen": async ({ client, args }) => {
    try {
      return await abNachfragen(client, args.name, { nachricht: args.nachricht || "" });
    } catch (err) {
      return fehlerText(err);
    }
  },

  "sortiment.bildfreigabe-anfordern": async ({ client, args }) => {
    try {
      return await bildfreigabeAnfordern(client, args.marke, { empfaenger: args.empfaenger || "", nachricht: args.nachricht || "" });
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Preisliste übernehmen (Leitung, Preise werden freigegeben – Website folgt). */
  "sortiment.preisliste-uebernehmen": async ({ session, client, args, revalidiere }) => {
    try {
      const r = await preislisteMethode(client, args.name, "uebernehmen", { leitung: istLeitung(session) });
      revalidiere(`/sortiment/preislisten/${encodeURIComponent(args.name)}`);
      return r;
    } catch (err) {
      return fehlerText(err);
    }
  },

  /** Sichtbarkeit (Ausblenden/Einblenden, Im Shop an/aus) – Außenwirkung. */
  "sortiment.produkt-feld": async ({ client, args, revalidiere }) => {
    const felder = { website_sichtbar: [0, 1], verkauf_online: [0, 1] };
    if (!namenOk(args?.namen) || !felder[args.feld] || !felder[args.feld].includes(args.wert)) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    for (const name of args.namen) await client.setValue("PH Produkt", name, args.feld, args.wert);
    revalidiere("/sortiment/produkte");
    return { erledigt: args.namen };
  },
};

export default aktionen;
