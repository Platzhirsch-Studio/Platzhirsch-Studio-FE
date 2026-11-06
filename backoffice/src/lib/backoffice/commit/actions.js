"use server";
// Server Actions des verzögerten Commits (G-03, Team P0-3). Aufgerufen vom Client-Queue (Toast.js) –
// Bereiche rufen sie nicht selbst, sondern planen über planeCommit() (commit/server.js).
// Rückgabe immer serialisierbar: { ok, ergebnisse:[{ token, ok, status, code?, message?, ergebnis? }] } – nie werfen.

import { backofficeMode } from "../config.js";
import { getSession } from "../auth/dal.js";
import { istAdmin } from "../auth/rechte.js";
import { COMMIT_TEXTE } from "./texte.js";
import { TOKENS_MAX, istToken } from "./konstanten.js";
import { commitStatus, fuehreCommitsAus, planeCommit, verwerfeCommits } from "./server.js";

function tokensAus(eingabe) {
  const roh = Array.isArray(eingabe?.tokens) ? eingabe.tokens : eingabe?.token ? [eingabe.token] : [];
  const tokens = [...new Set(roh)];
  return tokens.length && tokens.length <= TOKENS_MAX && tokens.every(istToken) ? tokens : null;
}

const ohneSitzung = { ok: false, code: "auth", message: COMMIT_TEXTE.nichtAngemeldet, ergebnisse: [] };
const ungueltig = { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig, ergebnisse: [] };

/** Vorgemerkte Änderungen jetzt ausführen (Timer abgelaufen, „Jetzt ausführen“, flush). */
export async function commitAction(eingabe) {
  const session = await getSession();
  if (!session) return ohneSitzung;
  const tokens = tokensAus(eingabe);
  if (!tokens) return ungueltig;
  const ergebnisse = await fuehreCommitsAus(session, tokens, "client");
  return { ok: ergebnisse.every((r) => r.ok), ergebnisse };
}

/** Rückgängig: vorgemerkte Änderungen verwerfen. */
export async function verwerfeCommit(eingabe) {
  const session = await getSession();
  if (!session) return ohneSitzung;
  const tokens = tokensAus(eingabe);
  if (!tokens) return ungueltig;
  const ergebnisse = await verwerfeCommits(session, tokens);
  return { ok: ergebnisse.every((r) => r.ok), ergebnisse };
}

/** Zustand eigener Tokens (Demo, Wiederaufnahme nach Netzfehler). */
export async function commitStatusAction(eingabe) {
  const session = await getSession();
  if (!session) return ohneSitzung;
  const tokens = tokensAus(eingabe);
  if (!tokens) return ungueltig;
  return { ok: true, ergebnisse: await commitStatus(session, tokens) };
}

/** Nur Mock + Admin: Demo-Änderung vormerken (Baustein-Demo „commit“, E2E). */
export async function planeDemoCommit(eingabe = {}) {
  const session = await getSession();
  if (!session) return ohneSitzung;
  if (backofficeMode() !== "mock" || !istAdmin(session)) return { ok: false, code: "forbidden", message: COMMIT_TEXTE.nurMock };
  const name = typeof eingabe.name === "string" && /^[\w-]{1,40}$/.test(eingabe.name) ? eingabe.name : "DEMO-1";
  const ms = Number(eingabe.ms) > 0 ? Number(eingabe.ms) : undefined;
  try {
    return await planeCommit(session, {
      action: "fundament.demo",
      args: { fehler: !!eingabe.fehler },
      schluessel: eingabe.schluessel ? `demo:${name}:${String(eingabe.schluessel).slice(0, 40)}` : undefined,
      objekt: { doctype: "Demo", name, titel: typeof eingabe.titel === "string" ? eingabe.titel.slice(0, 80) : name },
      titel: typeof eingabe.titel === "string" ? `Annehmen von ${eingabe.titel.slice(0, 80)}` : `Annehmen von ${name}`,
      ms,
    });
  } catch (err) {
    console.error("[backoffice] Demo-Commit nicht geplant", err?.name || err);
    return { ok: false, code: "unavailable", message: COMMIT_TEXTE.unerwartet };
  }
}
