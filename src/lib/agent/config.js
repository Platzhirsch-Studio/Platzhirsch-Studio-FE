// src/lib/agent/config.js – N3 „Platzhirsch für KI-Assistenten“ (MCP-Server + WebMCP).
// Doku: Marktresearch/digital/features/neuland.md §4 (Abschnitt „Umsetzung“).
//
// Rein: keine Pakete, kein "server-only", keine "@/"-Aliase. Server, Client
// und node --test dürfen es importieren. Jede Funktion nimmt ihre Eingaben
// (env, NODE_ENV) als Parameter, damit Tests alle Zustände prüfen können.

export const SITE_ORIGIN = "https://platzhirsch.studio";

/** Öffentliche Seite des Features (nur Deutsch, wie /de/arbeitsweise). */
export const PAGE_PATH = "/de/ki-assistenten";
/** Bestätigungsseite des Double-Opt-in (noindex). */
export const CONFIRM_PATH = "/de/ki-assistenten/bestaetigen";
/** MCP-Endpunkt (Streamable HTTP, zustandslos). */
export const MCP_PATH = "/api/agent/mcp";
/** Double-Opt-in-Bestätigung (POST, nur von der Bestätigungsseite). */
export const CONFIRM_API_PATH = "/api/agent/confirm";
/** Server-Beschreibung (Format ist noch kein Standard, siehe route.js). */
export const CARD_PATH = "/.well-known/mcp.json";

export const MCP_URL = `${SITE_ORIGIN}${MCP_PATH}`;

export const SERVER_INFO = Object.freeze({
  name: "platzhirsch-home-living",
  title: "Platzhirsch Home Living",
  version: "1.0.0",
  websiteUrl: `${SITE_ORIGIN}${PAGE_PATH}`,
});

/**
 * MCP-Protokollversionen, die dieser Server spricht (neueste zuerst).
 * Der Server nutzt nur initialize, ping, tools/list und tools/call; die
 * Unterschiede zwischen diesen Versionen betreffen ihn nicht.
 */
export const PROTOCOL_VERSIONS = Object.freeze(["2025-11-25", "2025-06-18", "2025-03-26"]);
export const LATEST_PROTOCOL = PROTOCOL_VERSIONS[0];

/** Gewünschte Version → unterstützte (sonst die neueste, Spec „Version Negotiation“). */
export function negotiateProtocol(requested) {
  return PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL;
}

// ---------------------------------------------------------------------------
// Terminwunsch über Assistenten (request_appointment)

/**
 * Datenschutztext „Anfragen über KI-Assistenten“ freigegeben? Bewusst eine
 * Konstante im Code wie EZARRI_PUBLIC: Der Schritt auf `live` ist eine
 * sichtbare, prüfbare Änderung in genau dieser Zeile – erst mit Deploy-OK
 * des Inhabers und der anwaltlich freigegebenen Datenschutzerklärung
 * (Textvorschlag: neuland.md §4, „Datenschutz“).
 */
export const PRIVACY_TEXT_APPROVED = false;

export const APPOINTMENT_MODES = Object.freeze(["off", "dryrun", "live"]);

/**
 * Wirksamer Modus für request_appointment.
 *   off    → nur Übergabe-Link zur Terminanfrage, keine Daten verarbeitet;
 *            Standard in Produktion. request_appointment steht dann NICHT in
 *            tools/list, und die Seite beschreibt nur die Terminanfrage
 *            (r1-recht-inhalt P1-1: kein „Testbetrieb“ auf einer indexierbaren Seite)
 *   dryrun → Standard in Entwicklung und Test: prüft die Angaben, gibt eine
 *            Referenz zurück, sendet NICHTS. In Produktion nie (→ off).
 *   live   → Double-Opt-in-Mail an die Person; ans Team erst nach ihrer Bestätigung
 * `live` gilt nur, wenn ALLES erfüllt ist: AGENT_APPOINTMENT_MODE=live,
 * NODE_ENV=production, PRIVACY_TEXT_APPROVED, AGENT_SECRET (≥ 32 Zeichen)
 * und eine vollständige Mail-Anbindung. Fehlt etwas, wird es `off` (nie ein
 * halber Livebetrieb). In Entwicklung und Test ist `live` unmöglich.
 * @returns {{ mode: "off"|"dryrun"|"live", requested: string, reason?: string }}
 */
export function appointmentMode(env = {}, { nodeEnv = env.NODE_ENV, privacyApproved = PRIVACY_TEXT_APPROVED } = {}) {
  const production = nodeEnv === "production";
  const fallback = production ? "off" : "dryrun";
  const raw = String(env.AGENT_APPOINTMENT_MODE || fallback).trim().toLowerCase();
  const requested = APPOINTMENT_MODES.includes(raw) ? raw : fallback;
  if (requested === "dryrun" && production) return { mode: "off", requested, reason: "dryrun_not_public" };
  if (requested !== "live") return { mode: requested, requested };
  if (nodeEnv !== "production") return { mode: "dryrun", requested, reason: "not_production" };
  if (!privacyApproved) return { mode: "off", requested, reason: "privacy_text_pending" };
  if (!secretFrom(env, nodeEnv)) return { mode: "off", requested, reason: "secret_missing" };
  if (!mailConfigured(env)) return { mode: "off", requested, reason: "mail_missing" };
  return { mode: "live", requested };
}

/** Wird request_appointment angeboten (tools/list, Seite, Server-Beschreibung)? */
export function appointmentOffered(mode) {
  return mode === "live" || mode === "dryrun";
}

const DEV_SECRET = "dev-only-agent-secret-do-not-use-in-production-0000";

/** Geheimnis für Bestätigungs-Token. Produktion: nur AGENT_SECRET (≥ 32), sonst null. */
export function secretFrom(env = {}, nodeEnv = env.NODE_ENV) {
  const s = env.AGENT_SECRET;
  if (typeof s === "string" && s.length >= 32) return s;
  return nodeEnv === "production" ? null : DEV_SECRET;
}

/** Mail-Anbindung für den Double-Opt-in: signierter Webhook (n8n/Make/SMTP-Relay). */
export function mailConfigured(env = {}) {
  return /^https:\/\//.test(env.AGENT_MAIL_WEBHOOK_URL || "") && String(env.AGENT_MAIL_WEBHOOK_SECRET || "").length >= 32;
}

/** Gültigkeit des Bestätigungslinks. */
export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Rate-Limit (pro IP; Logik: src/lib/concierge/limiter.js)

export const RATE = Object.freeze({
  // Jede JSON-RPC-Nachricht (initialize, tools/list, tools/call …)
  burst: { max: 60, windowMs: 60 * 1000 },
  daily: { max: 1500, windowMs: 24 * 60 * 60 * 1000 },
  // request_appointment zusätzlich
  appointmentHour: { max: 5, windowMs: 60 * 60 * 1000 },
  appointmentDay: { max: 12, windowMs: 24 * 60 * 60 * 1000 },
  // Bestätigungsseite (Vorschau + Bestätigen)
  confirm: { max: 20, windowMs: 60 * 60 * 1000 },
  // Globales Tagesbudget für Terminwünsche (alle IPs zusammen)
  appointmentsPerDay: 300,
});

/** Größe einer JSON-RPC-Anfrage (Bytes). */
export const MAX_BODY_BYTES = 32 * 1024;

/** Feste Preisangabe: Platzhirsch nennt online keine Preise. */
export const PRICE = "auf Anfrage";
