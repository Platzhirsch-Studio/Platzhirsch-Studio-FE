// Commit-Aktionen des Bereichs „kundenkarte“ (G-03). Nur dieser Bereich schreibt hier.
// Name = "kundenkarte.<vorgang>", Wert = async ({ session, client, args, objekt, quelle, revalidiere }) => ergebnis
// (oder { ok: false, code, message }). Geplant wird in der eigenen Server Action über
// planeCommit(session, { action: "kundenkarte.<vorgang>", args, schluessel, objekt, titel }) aus "@/lib/backoffice/commit/server".
// Die Aktion läuft mit der Sitzung des Benutzers (Frappe prüft die Rechte erneut) – auch im Nachlauf.
//
// Variante A (verzögerter Commit, Konzept §4.3): Vorteil einlösen, Übergabe aktivieren, Sperren.
// Methoden über ../../kundenkarte/methoden.js (Frappe: run_doc_method; Mock: gleiche Regeln in der Mock-DB).

import { methode } from "../../kundenkarte/methoden.js";

const KARTE = "PH Kundenkarte";
const NR = /^KK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

function nr(args) {
  return typeof args?.karte === "string" && NR.test(args.karte) ? args.karte : null;
}

async function sicher(fn) {
  try {
    return await fn();
  } catch (err) {
    return { ok: false, code: err?.code || "unavailable", message: err?.message || "Nicht gespeichert." };
  }
}

function pfade(revalidiere, karte) {
  revalidiere(`/kundenkarte/karten/${karte}`);
  revalidiere("/kundenkarte/karten");
  revalidiere("/kundenkarte");
}

/** @type {Record<string, (ctx: import("./index.js").CommitKontext) => Promise<any>>} */
const aktionen = {
  "kundenkarte.einloesen": async ({ client, args, revalidiere }) => {
    const karte = nr(args);
    if (!karte || typeof args.vorteil !== "string") return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      const name = await methode(client, KARTE, karte, "vorteil_einloesen", {
        vorteil: args.vorteil,
        bezug_doctype: args.bezug_doctype || null,
        bezug: args.bezug || null,
        kommentar: args.kommentar || null,
        ort: args.ort || "Showroom",
      });
      pfade(revalidiere, karte);
      revalidiere("/kundenkarte/einloesungen");
      return { name };
    });
  },

  "kundenkarte.uebergabe": async ({ client, args, revalidiere }) => {
    const karte = nr(args);
    if (!karte) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      const r = await methode(client, KARTE, karte, "karte_uebergeben", { ort: args.ort || "Showroom" });
      pfade(revalidiere, karte);
      return { status: r };
    });
  },

  "kundenkarte.sperren": async ({ client, args, revalidiere }) => {
    const karte = nr(args);
    if (!karte || typeof args.art !== "string") return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
    return sicher(async () => {
      const r = await methode(client, KARTE, karte, "sperren", { grund: args.text || null, sperrgrund_art: args.art });
      pfade(revalidiere, karte);
      return { status: r };
    });
  },
};

export default aktionen;
