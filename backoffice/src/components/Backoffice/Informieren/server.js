import "server-only";
// Server-Teil von „Kunden informieren“ (G-18) und „Leitung bitten“ (G-05) – Team P0-5c.
// Nur aus Server Components und Server Actions importieren.
//
//   const darf = await darfLeitungBitten(session);              // Seite: <LeitungBitten erlaubt={darf} …/>
//   const versand = await informierenVersand(session);          // Seite: <Informieren versand={versand} …/>
//
// Mailweg (Entscheidung Nr. 52 + MASTER G-18): zuerst Exchange über ph_microsoft.api.mail_senden (Postfach des
// Benutzers), sonst die Sende-Methode des Bereichs am Dokument (läuft über ph_core.utils.mail.sende → Mailkonto des
// Frappe-Servers, Resend). Der Exchange-Weg braucht die Commit-Aktion „fundament.mail“ im Register
// lib/backoffice/commit/aktionen/fundament.js (Besitzer P0-3): `"fundament.mail": mailSendenCommit` – bis sie
// eingetragen ist, bleibt er aus und der Bereichsweg gilt.

import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { definiereFaehigkeiten, faehigkeit } from "@/lib/backoffice/faehigkeiten";
import { commitAktion } from "@/lib/backoffice/commit/aktionen/index";
import { DEMO_BENUTZER } from "@/lib/backoffice/auth/mockUsers";
import { leitungsRolle, textZuHtml } from "./logik";

export const MAIL_AKTION = "fundament.mail";

/** Fähigkeit „Mail aus dem eigenen Postfach“ (Probe gegen ph_microsoft). Nicht erwartet → ohne Hinweis ausgeblendet. */
export const INFORMIEREN_FAEHIGKEITEN = definiereFaehigkeiten("informieren", {
  exchange: {
    titel: "E-Mail aus dem eigenen Postfach",
    probe: { methode: "ph_microsoft.api.mail_senden" },
    erwartet: false,
  },
});

/** Darf die Sitzung eine Aufgabe für die Leitung anlegen? (G-05: ohne create auf PH Aufgabe Knopf ausblenden.) */
export async function darfLeitungBitten(session, client = backoffice(session)) {
  try {
    const meta = await ladeMeta(client, "PH Aufgabe");
    return darfDoc(session, meta, "create") && darfDoc(session, meta, "read");
  } catch {
    return false;
  }
}

/**
 * Versandwege für das Informieren-Sheet. Serialisierbar (geht als Prop an den Client).
 * @returns {Promise<{exchange:boolean}>}
 */
export async function informierenVersand(session) {
  if (!commitAktion(MAIL_AKTION)) return { exchange: false };
  const s = await faehigkeit(session, "informieren.exchange", { katalog: INFORMIEREN_FAEHIGKEITEN });
  return { exchange: !!s.an };
}

/**
 * Wer ist Leitung des Bereichs? Mock: Demo-Benutzer mit der Rolle. Frappe: „Has Role“ lesen (gelingt nur mit
 * Leserecht auf Benutzerrollen); sonst bleibt die Aufgabe ohne Zuständigkeit und erscheint in der Glocke unter
 * „Team“ (P0-7). Nie raten.
 * @returns {Promise<string|null>} User-ID
 */
export async function leitungFinden(client, rollenName) {
  const rolle = leitungsRolle(rollenName);
  if (!rolle) return null;
  if (client.modus !== "frappe") return DEMO_BENUTZER.find((u) => u.roles.includes(rolle))?.email || null;
  try {
    const zeilen = await client.getList("Has Role", { fields: ["parent"], filters: [["role", "=", rolle], ["parenttype", "=", "User"]], limit: 5 });
    return zeilen.find((z) => z.parent && z.parent !== "Administrator")?.parent || null;
  } catch {
    return null;
  }
}

/**
 * Commit-Aktion „fundament.mail“ (zur Eintragung durch P0-3): Mail aus dem Postfach des Benutzers.
 * args { an, betreff, nachricht, pfad? }; objekt = Bezug. Mock: nur Kommentar „nicht versendet“, keine Außenwirkung.
 * @param {import("@/lib/backoffice/commit/aktionen/index").CommitKontext} ctx
 */
export async function mailSendenCommit({ client, args, objekt, revalidiere }) {
  const an = String(args?.an || "");
  const betreff = String(args?.betreff || "");
  if (!an || !betreff || !objekt?.doctype || !objekt?.name) return { ok: false, code: "invalid", message: "Unvollständige Angaben." };
  const html = textZuHtml(args?.nachricht || "");
  if (client.modus !== "frappe") {
    await client.kommentar(objekt.doctype, objekt.name, `E-Mail an ${an} „${betreff}“ (Testdaten, nicht versendet)`, "Info");
    if (args?.pfad) revalidiere(args.pfad);
    return { kanal: "exchange", an, testmodus: true };
  }
  const r = await client.call("ph_microsoft.api.mail_senden", { an, betreff, html, bezug_doctype: objekt.doctype, bezug_name: objekt.name });
  if (args?.pfad) revalidiere(args.pfad);
  return { kanal: "exchange", an, von: r?.von || null, testmodus: !!r?.testmodus, communication: r?.communication || null };
}
