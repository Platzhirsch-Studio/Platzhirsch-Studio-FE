// src/lib/ideenboard/mode.js — wann das Teilen des Ideenboards möglich ist.
// Wie die Wunschliste (src/lib/wunschliste/mode.js): in der Entwicklung immer
// (.data/ideenboard), in Produktion nur mit IDEENBOARD_LOCAL_DIR (dauerhaftes,
// gesichertes Volume). IDEENBOARD_MODE=off schaltet das Teilen ab (das Board
// im Browser bleibt). Keine "@/..."-Importe (node --test).
// DSE-Sperre (Rat 9,5 B3, QA Recht −0,3): In Produktion zusätzlich erst, wenn
// der Abschnitt „Ideenboard teilen“ (#ideenboard) freigegeben ist
// (src/lib/legal/dseSections.js). Das Board im Browser bleibt immer.
import { DSE_SECTIONS, dseGateOpen } from "../legal/dseSections.js";

export const isProd = (env = process.env) => env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

export function ideenboardShareAvailable(env = process.env, sections = DSE_SECTIONS) {
  if (String(env.IDEENBOARD_MODE || "").trim().toLowerCase() === "off") return false;
  if (!dseGateOpen("ideenboard", env, sections)) return false;
  return !isProd(env) || Boolean(env.IDEENBOARD_LOCAL_DIR);
}

/**
 * Übernimmt die Terminbuchung (bzw. die Beratungsanfrage) schon
 * ?ideenboard=<shareId>? Erst dann zeigt das Board „Termin mit Ideenboard
 * buchen“ (QA Technik P0). Das Termin-Team setzt IDEENBOARD_TERMIN=on, sobald
 * /termin bzw. /beratung den Parameter liest (ideenboard-anbindung.md §2).
 * Bis dahin: Teilen-Link + Hinweis, ihn in die Anfrage zu kopieren.
 */
// Rat 9,5 B2 (Auftrag T1 → T5, 30.10.2026): /termin und /beratung lesen
// ?ideenboard= jetzt – der Knopf kommt, sobald Teilen verfügbar ist (DSE-Sperre
// und Volume wie ideenboardShareAvailable). IDEENBOARD_TERMIN=off schaltet ab.
export function ideenboardTerminConnected(env = process.env, sections = DSE_SECTIONS) {
  if (String(env.IDEENBOARD_TERMIN || "").trim().toLowerCase() === "off") return false;
  return ideenboardShareAvailable(env, sections);
}
