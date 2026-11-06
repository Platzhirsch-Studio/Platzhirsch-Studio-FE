// src/lib/kundenkarte/config.js – Kundenkarte: Betriebsart, Schlüssel, Grenzen.
//
// Betriebsart (kundenkarteMode):
//   "frappe" KUNDENKARTE_PROVIDER=frappe + FRAPPE_KUNDENKARTE_URL/KEY/SECRET
//            (https) gesetzt; Mailversand der Website über Resend
//            (KUNDENKARTE_MAIL_API_KEY + KUNDENKARTE_MAIL_FROM, derselbe Adapter
//            wie Termin und Zahlung). Anträge, Bestätigung, Status und
//            Portal-Karte liefert die Frappe-App ph_kundenkarte
//            (Methodenbasis FRAPPE_KUNDENKARTE_METHOD_BASE, Standard
//            "ph_kundenkarte.api").
//   "mock"   KUNDENKARTE_MOCK=1 (nur außerhalb der Produktion) ODER außerhalb
//            von NODE_ENV=production immer dann, wenn "frappe" nicht
//            vollständig ist: JSON-Ablage in .data/kundenkarte/ (gitignored,
//            KUNDENKARTE_DATA_DIR überschreibt), Mails nur in den
//            Dev-Postausgang (.data/kundenkarte/outbox). Die Seite zeigt den
//            Bestätigungslink dann direkt (devConfirmUrl).
//   "off"    Produktion ohne vollständige Konfiguration oder
//            KUNDENKARTE_PROVIDER=none: Seite sichtbar, Formular meldet
//            not_configured (503), nichts wird gespeichert.
// Nur Namen der Variablen stehen hier – nie Werte. Schlüssel bleiben auf dem
// Server (kein NEXT_PUBLIC_). Keine "@/..."-Importe (node --test).
import path from "node:path";
import { resolveBackend } from "../backend/config.js";

/** Gültigkeit des Bestätigungslinks (Double-Opt-in). */
export const CONFIRM_TTL_HOURS = 48;
export const CONFIRM_TTL_MS = CONFIRM_TTL_HOURS * 60 * 60 * 1000;
/** Version des Einwilligungstexts (wandert mit jedem Antrag ins Backend). */
export const CONSENT_VERSION = "kundenkarte-2026-11-04";
export const MAX_BODY_BYTES = 8 * 1024;

const truthy = (v) => v === "1" || String(v).toLowerCase() === "true";

export function isProduction(env = process.env) {
  return env.NODE_ENV === "production";
}

/**
 * Zugangsdaten der Frappe-App (nur Server). null, wenn unvollständig oder nicht https.
 * BACKEND_GENERATION Gruppe "kundenkarte" auf ph: BACKEND_PH_URL/BACKEND_PH_TOKEN,
 * Methodenbasis ph_kundenkarte.api (KUNDENKARTE_PROVIDER=frappe bleibt der Schalter).
 */
export function frappeCredentials(env = process.env) {
  const backend = resolveBackend("kundenkarte", env);
  if (backend.generation === "ph") return backend.ph ? { ...backend.ph, methodBase: "ph_kundenkarte.api" } : null;
  const url = String(env.FRAPPE_KUNDENKARTE_URL || "").trim().replace(/\/+$/, "");
  const key = String(env.FRAPPE_KUNDENKARTE_KEY || "").trim();
  const secret = String(env.FRAPPE_KUNDENKARTE_SECRET || "").trim();
  if (!url || !key || !secret) return null;
  try {
    if (new URL(url).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url, key, secret, methodBase: String(env.FRAPPE_KUNDENKARTE_METHOD_BASE || "ph_kundenkarte.api").trim() };
}

/** Resend-Zugang für die Bestätigungsmail der Website. null, wenn unvollständig. */
export function mailConfig(env = process.env) {
  const apiKey = String(env.KUNDENKARTE_MAIL_API_KEY || "").trim();
  const from = String(env.KUNDENKARTE_MAIL_FROM || "").trim();
  return apiKey && from ? { apiKey, from } : null;
}

/** "frappe" | "mock" | "off" (siehe Kopf). */
export function kundenkarteMode(env = process.env) {
  const provider = String(env.KUNDENKARTE_PROVIDER || "").trim().toLowerCase();
  const prod = isProduction(env);
  if (!prod && truthy(env.KUNDENKARTE_MOCK)) return "mock";
  if (provider === "none" || provider === "off") return "off";
  if (provider === "frappe" && frappeCredentials(env) && mailConfig(env)) return "frappe";
  return prod ? "off" : "mock";
}

/** Ablage des Mocks (.data/kundenkarte, gitignored). */
export function dataDir(env = process.env) {
  return env.KUNDENKARTE_DATA_DIR ? path.resolve(env.KUNDENKARTE_DATA_DIR) : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "kundenkarte");
}

/** Namen aller Umgebungsvariablen (Doku/Bericht; Werte stehen nie im Code). */
export const ENV_NAMES = Object.freeze([
  "KUNDENKARTE_PROVIDER",
  "KUNDENKARTE_MOCK",
  "KUNDENKARTE_DATA_DIR",
  "FRAPPE_KUNDENKARTE_URL",
  "FRAPPE_KUNDENKARTE_KEY",
  "FRAPPE_KUNDENKARTE_SECRET",
  "FRAPPE_KUNDENKARTE_METHOD_BASE",
  "KUNDENKARTE_MAIL_API_KEY",
  "KUNDENKARTE_MAIL_FROM",
]);
