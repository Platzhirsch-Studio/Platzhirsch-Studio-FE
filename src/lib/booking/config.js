// src/lib/booking/config.js – Online-Kalender (/[locale]/termin), Schalter und Grenzen.
//
// Betriebsart (terminMode):
//   "frappe" BOOKING_PROVIDER=frappe + FRAPPE_BOOKING_URL/KEY/SECRET gesetzt
//            + Mailversand der Website (BOOKING_MAIL_API_KEY + BOOKING_MAIL_FROM,
//            Resend wie die Zahlungsstrecke) + BOOKING_LINK_SECRET >= 32 Zeichen
//            in Produktion. Slots, Buchungen und Videoräume macht das Backoffice
//            (Spezifikation Marktresearch/digital/features/online-termin-video.md,
//            Teil B). Die Kundenmails (Bestätigungslink, Buchung mit
//            Verwaltungslink, Absage, Umbuchung) schickt die WEBSITE, weil nur
//            sie die signierten Links bauen kann (QA Recht P1-2).
//   "mock"   BOOKING_MOCK=1 (nur außerhalb der Produktion, QA Recht P3-1),
//            ODER außerhalb von NODE_ENV=production immer dann,
//            wenn "frappe" nicht vollständig ist. Lokale Slots aus den
//            Öffnungszeiten (src/lib/site.js), Feiertage AT, Daten in
//            .data/booking/ (gitignored), Mails nur in den Dev-Postausgang.
//            Jede Seite zeigt dann „Testbetrieb“. Im Dev ohne Neustart aktiv.
//   "off"    Produktion ohne vollständige Konfiguration, ODER BOOKING_PROVIDER
//            ausdrücklich "none"/"link" (auch im Dev, außer BOOKING_MOCK=1):
//            Der Schalter greift überall (Freigabe-Prüfung r4-leads:201) –
//            kein Einstieg auf /beratung, CTAs auf /beratung, die Seite
//            verweist auf das Anfrageformular und das Telefon. Ohne
//            BOOKING_PROVIDER läuft der Dev-Server im Testbetrieb (mock).
// DSE-Sperre (Rat 9,5 B3, QA Recht −0,5): In Produktion zusätzlich erst, wenn
// der Abschnitt „Online-Terminbuchung und Videoberatung“ (#termin) von der
// Kanzlei freigegeben ist (src/lib/legal/dseSections.js, status). Ohne ihn
// ist der Kalender "off", auch mit vollständigen Frappe-Schlüsseln.
// Schlüssel nur serverseitig (kein NEXT_PUBLIC_), nie in Props an den Client.
// Keine "@/..."-Importe: node --test lädt die Datei direkt.
import path from "node:path";
import { DSE_SECTIONS, dseGateOpen } from "../legal/dseSections.js";

export { TIME_ZONE, LEAD_HOURS, HORIZON_DAYS, SLOT_STEP_MIN, MAX_RANGE_DAYS, CONSENT_VERSION, VERIFY_TTL_MIN, MEET_OPEN_MIN } from "./constants.js";

const truthy = (v) => v === "1" || String(v).toLowerCase() === "true";

export function isProduction(env = process.env) {
  return env.NODE_ENV === "production";
}

/** Zugangsdaten Backoffice (nur Server). null, wenn unvollständig. */
export function frappeCredentials(env = process.env) {
  const url = String(env.FRAPPE_BOOKING_URL || "").trim().replace(/\/+$/, "");
  const key = String(env.FRAPPE_BOOKING_KEY || "").trim();
  const secret = String(env.FRAPPE_BOOKING_SECRET || "").trim();
  if (!url || !key || !secret) return null;
  try {
    if (new URL(url).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url, key, secret, methodBase: String(env.FRAPPE_BOOKING_METHOD_BASE || "platzhirsch_studio.termin.api").trim() };
}

const DEV_LINK_SECRET = "dev-only-booking-link-secret-NICHT-PRODUKTIV-0000";

/** HMAC-Schlüssel der Verwaltungslinks. Produktion: BOOKING_LINK_SECRET >= 32 Zeichen, sonst null. */
export function linkSecret(env = process.env) {
  const s = String(env.BOOKING_LINK_SECRET || "");
  if (s.length >= 32) return s;
  return isProduction(env) ? null : DEV_LINK_SECRET;
}

/** Mailversand der Website für den Frappe-Betrieb (Resend). null, wenn unvollständig. */
export function bookingMailConfig(env = process.env) {
  const apiKey = String(env.BOOKING_MAIL_API_KEY || "").trim();
  const from = String(env.BOOKING_MAIL_FROM || "").trim();
  return apiKey && from ? { apiKey, from } : null;
}

/**
 * "frappe" | "mock" | "off" (siehe Kopf).
 * @param {object} [sections] DSE-Register (Tests), Standard src/lib/legal/dseSections.js
 */
export function terminMode(env = process.env, sections = DSE_SECTIONS) {
  const prod = isProduction(env);
  if (prod && !linkSecret(env)) return "off";
  // Datenschutz zuerst: ohne freigegebenen Abschnitt #termin kein Kalender in Produktion.
  if (!dseGateOpen("termin", env, sections)) return "off";
  if (!prod && truthy(env.BOOKING_MOCK)) return "mock";
  const provider = String(env.BOOKING_PROVIDER || "").trim().toLowerCase();
  // Ausdrücklich abgeschaltet (oder fremder Anbieter per Link): kein eigener Kalender.
  if (provider && provider !== "frappe") return "off";
  if (provider === "frappe" && frappeCredentials(env) && bookingMailConfig(env)) return "frappe";
  return prod ? "off" : "mock";
}

/** Online-Kalender nutzbar (frappe oder mock)? Steuert CTA-Ziele, /beratung-Einstieg, MCP-Slots. */
export const terminActive = (env = process.env, sections = DSE_SECTIONS) => terminMode(env, sections) !== "off";

/** Ordner der Mock-Daten und des Postausgangs (gitignored /.data/). */
export function dataDir(env = process.env) {
  return env.BOOKING_DATA_DIR ? path.resolve(env.BOOKING_DATA_DIR) : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "booking");
}

/** Dev-Postausgang im Browser ansehbar? Nie in Produktion (auch nicht im Mock eines Prüfservers). */
export function outboxVisible(env = process.env) {
  return !isProduction(env);
}
