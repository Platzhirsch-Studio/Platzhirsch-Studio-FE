// src/lib/concierge/config.js
// Settings of the KI-Concierge (labs). Everything that is a policy decision
// (model, limits, consent text version) lives here, nowhere else.
import "server-only";

// Claude Opus 5.5 – the current default model. Thinking is always on for this
// model (adaptive); depth is steered only through `effort`. Chat answers do
// well at "low"; raise via env after measuring on real questions.
export const MODEL = "claude-opus-5-5";
export const EFFORT = ["low", "medium", "high"].includes(process.env.CONCIERGE_EFFORT)
  ? process.env.CONCIERGE_EFFORT
  : "low";
// Streaming request, so a generous cap is fine; the system prompt asks for
// short answers anyway. Keeps one runaway answer from costing a fortune.
export const MAX_TOKENS = 8000;
// Tool rounds per user message (search → brand details → answer is 3).
export const MAX_TOOL_ROUNDS = 5;

// Server-side refusal fallback (beta). "default" lets Anthropic route a
// declined request to the recommended model per refusal category.
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Input limits (checked with zod in the route).
export const LIMITS = {
  userChars: 800,
  assistantChars: 6000,
  historyMessages: 20,
  totalChars: 24000,
};

const envInt = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Rate limits (in memory, per server instance).
// - burst/daily: per client IP (see clientIp() for which header is trusted)
// - session: per consent token (sid) over its lifetime – a key that a forged
//   X-Forwarded-For header cannot rotate
// - global: all chat requests of this instance per calendar day (UTC). Hard
//   cost cap for the model; when reached, everybody gets the team handoff.
export const RATE = {
  burst: { max: 8, windowMs: 2 * 60 * 1000 },
  daily: { max: 60, windowMs: 24 * 60 * 60 * 1000 },
  session: { max: envInt("CONCIERGE_MAX_PER_SESSION", 40), windowMs: 12 * 60 * 60 * 1000 },
  globalPerDay: envInt("CONCIERGE_GLOBAL_DAILY", 1500),
  consent: { max: 10, windowMs: 10 * 60 * 1000 },
};

// Reverse proxies in front of Next (nginx = 1). The client IP is the
// X-Forwarded-For entry this many hops from the END; entries further left
// were sent by the client itself and can be forged.
export const TRUSTED_PROXY_HOPS = envInt("CONCIERGE_PROXY_HOPS", 1);

// Optional stored transcripts are deleted after this many days (30, Rechtspaket
// 4.6). Lives in retention.js so the client consent text shows the same value.
export { RETENTION_DAYS } from "./retention";

// Bump when the consent text in the UI changes – old tokens become invalid.
// 2026-10-27: the text now mentions the page data the sitewide concierge sends.
// 2026-10-27b: deletion period 30 instead of 90 days, short consent + details.
export const CONSENT_VERSION = "2026-10-27b";
export const CONSENT_TTL_MS = 12 * 60 * 60 * 1000;

export const IS_PROD = process.env.NODE_ENV === "production";

// "live"       – ANTHROPIC_API_KEY set (and CONCIERGE_MOCK not forcing mock)
// "mock"       – CONCIERGE_MOCK=1: fixed sample answers, real catalogue lookups
// "unavailable"– no key, no mock: the UI shows a friendly notice
export function getMode() {
  if (process.env.CONCIERGE_MOCK === "1") return "mock";
  if (process.env.ANTHROPIC_API_KEY) return "live";
  return "unavailable";
}

// Runtime kill switch (server): CONCIERGE_DISABLED=1 → GET reports
// enabled:false (the panel shows the contact card), POST answers 503. Works
// without a rebuild, unlike NEXT_PUBLIC_CONCIERGE_SITEWIDE.
export function isDisabled() {
  return process.env.CONCIERGE_DISABLED === "1";
}

// In development the UI can switch to mock mode per request (button in the
// notice) so the feature is testable without restarting the dev server.
export function allowDevMock() {
  return !IS_PROD;
}

// Fix-Runde 1 (F2): Ist der Concierge wirklich nutzbar? Nur mit API-Schlüssel
// (live) oder ausdrücklichem Mock und ohne Not-Aus. Sonst blendet der Launcher
// sich aus und /de/concierge zeigt Kontakt/Termin statt „nicht verfügbar“ (noindex).
export function isAvailable() {
  if (isDisabled()) return false;
  const mode = getMode();
  return mode === "live" || mode === "mock";
}

// Runde 4 (ux P0-1, Concierge-Gating): Kunden sehen den Concierge nur, wenn
// er mit echter KI läuft – ANTHROPIC_API_KEY gesetzt, kein erzwungener Mock,
// kein Not-Aus. Ohne das rendern Hub (/de/leistungen, Startseite) und Footer
// keinen Concierge-Link, und /de/concierge zeigt den Hinweis mit „Termin
// anfragen“. Gilt in JEDER Umgebung, auch im Dev-Server mit CONCIERGE_MOCK=1
// (der Mock ist ein Testmodus, nichts für Kunden). Der seitenweite Knopf
// (components/Concierge/Launcher.js) bleibt im Dev-Server als Testwerkzeug.
export function conciergeLive() {
  return !isDisabled() && getMode() === "live";
}

// Runde 2 (technik P1-7, seo P1-3): /de/concierge is index,follow exactly when
// this is true – the same rule for page robots, sitemap and llms.txt.
// Development keeps the page indexable (no key needed to work on it).
export function conciergeIndexable() {
  return !IS_PROD || isAvailable();
}
