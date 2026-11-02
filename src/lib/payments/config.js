// src/lib/payments/config.js
// Umgebungsvariablen der Online-Zahlung (Stripe). Reine Logik, keine
// "@/..."-Importe, kein "server-only": direkt mit `node --test` getestet.
// NIE in eine Client-Komponente importieren (liest Geheimnisse); der Test
// tests/unit/stripe-bundle.test.mjs prüft das.
//
//   STRIPE_SECRET_KEY        sk_live_… / sk_test_… (oder eingeschränkter Schlüssel rk_…)
//   STRIPE_WEBHOOK_SECRET    whsec_… (Signaturgeheimnis des Webhook-Endpunkts)
//   STRIPE_PAYMENT_METHOD_CONFIGURATION  optional pmc_… (sonst Standard-Konfiguration des Dashboards)
//   PAYMENTS_ADMIN_SECRET    ≥ 32 Zeichen, für /api/payments/anzahlung und /api/payments/register
//   PAYMENTS_LINK_SECRET     ≥ 32 Zeichen, signiert die Anzahlungs-Links
//   PAYMENTS_BASE_URL        optional, Standard https://platzhirsch.studio (Rücksprung-URLs)
//   PAYMENTS_DATA_DIR        optional, Standard <Projekt>/.data/payments
//   PAYMENTS_ALLOW_TEST_KEYS=1  sk_test_ auch in Produktion zulassen (nur für einen Probelauf)
//   PAYMENTS_MOCK=1          simulierter Checkout ohne Stripe (nie in Produktion)
//   PAYMENTS_MAIL_PROVIDER=resend, PAYMENTS_MAIL_API_KEY, PAYMENTS_MAIL_FROM
//                            echter Mailversand. In Produktion PFLICHT: ohne ihn
//                            wirkt "stripe" nicht (Rückfall "anfrage"), und der
//                            Postausgang (outbox) ist dort gesperrt (QA P1).
//   PAYMENTS_TEAM_EMAIL      optional, Empfänger interner Hinweise (z. B.
//                            doppelte Anzahlung), Standard info@platzhirsch.studio
//
// Produktion = NODE_ENV "production" oder VERCEL_ENV "production". Dort ist
// der Mock immer aus, egal was gesetzt ist.

import path from "node:path";

export const DEFAULT_BASE_URL = "https://platzhirsch.studio";
export const CURRENCY = "eur";
export const MIN_SECRET_LENGTH = 32;
// Signaturgeheimnis des Mocks: steht absichtlich im Code, weil es nur für
// simulierte Ereignisse gilt. Die echte Webhook-Route akzeptiert es nur bei
// aktivem Mock (nie in Produktion).
export const MOCK_WEBHOOK_SECRET = "whsec_mock_platzhirsch_nur_entwicklung";
export const MOCK_SECRET_KEY = "sk_test_mock_platzhirsch";
export const MOCK_HEADER = "x-payments-mock";

const SECRET_RE = /^(sk|rk)_(live|test)_[A-Za-z0-9_]{8,}$/;
const WEBHOOK_RE = /^whsec_[A-Za-z0-9_]{8,}$/;
const PMC_RE = /^pmc_[A-Za-z0-9]{8,}$/;

export const isProduction = (env = process.env) => env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

/** Testschlüssel? (sk_test_ / rk_test_) */
export const isTestKey = (key) => /^(sk|rk)_test_/.test(String(key ?? ""));

/**
 * Sind die Stripe-Schlüssel gesetzt und plausibel? In Produktion zählen
 * Testschlüssel nur mit PAYMENTS_ALLOW_TEST_KEYS=1.
 */
export function stripeKeysReady(env = process.env) {
  const key = String(env.STRIPE_SECRET_KEY ?? "").trim();
  const hook = String(env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!SECRET_RE.test(key) || !WEBHOOK_RE.test(hook)) return false;
  if (isProduction(env) && isTestKey(key) && env.PAYMENTS_ALLOW_TEST_KEYS !== "1") return false;
  return true;
}

/**
 * Art des gesetzten Stripe-Schlüssels ohne den Wert preiszugeben:
 * "live" (sk_live_/rk_live_), "test" (sk_test_/rk_test_) oder null (fehlt/
 * unplausibel bzw. Webhook-Geheimnis fehlt). Für den Shop-Modus (src/lib/shop/mode.js).
 */
export function stripeKeyKind(env = process.env) {
  const key = String(env.STRIPE_SECRET_KEY ?? "").trim();
  const hook = String(env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!SECRET_RE.test(key) || !WEBHOOK_RE.test(hook)) return null;
  return isTestKey(key) ? "test" : "live";
}

/**
 * Mock aktiv? Nur außerhalb der Produktion, mit PAYMENTS_MOCK=1 oder – nur im
 * Entwicklungsserver (NODE_ENV=development), weil neue Variablen dort erst
 * nach einem Neustart wirken – per Kopfzeile `x-payments-mock: 1` bzw. auf
 * der Seite per `?zahlung=mock`.
 * @param {object} env
 * @param {{ header?: string|null, query?: string|null }} [signal]
 */
export function mockActive(env = process.env, signal = {}) {
  if (isProduction(env)) return false;
  if (env.PAYMENTS_MOCK === "1") return true;
  if (env.NODE_ENV !== "development") return false;
  return signal.header === "1" || signal.query === "mock";
}

/** Mock-Signal aus einer Request (Kopfzeile). */
export const mockSignalOf = (request) => ({ header: request?.headers?.get?.(MOCK_HEADER) ?? null });

/** Ist ein echter Mail-Anbieter vollständig konfiguriert? (nur Namen, nie Werte) */
export function mailProviderReady(env = process.env) {
  const provider = String(env.PAYMENTS_MAIL_PROVIDER ?? "").trim().toLowerCase();
  return provider === "resend" && Boolean(String(env.PAYMENTS_MAIL_API_KEY ?? "").trim()) && Boolean(String(env.PAYMENTS_MAIL_FROM ?? "").trim());
}

/**
 * Bereit für Zahlungen: Mock, oder echte Schlüssel UND (in Produktion) ein
 * echter Mail-Anbieter. Ohne Mailversand bekäme die Kundin nach der Zahlung
 * keinen Gutschein (QA P1), deshalb dort Rückfall auf "anfrage".
 */
export const paymentsReady = (env = process.env, signal = {}) =>
  mockActive(env, signal) || (stripeKeysReady(env) && (!isProduction(env) || mailProviderReady(env)));

/** Empfänger interner Hinweise an das Team. */
export function teamEmail(env = process.env) {
  const v = String(env.PAYMENTS_TEAM_EMAIL ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : "info@platzhirsch.studio";
}

/** Geheimnis mit Mindestlänge oder null. */
function strongSecret(value) {
  const v = String(value ?? "");
  return v.length >= MIN_SECRET_LENGTH ? v : null;
}

/** Admin-Geheimnis (Anzahlungen, Gutscheinregister) oder null. */
export const adminSecret = (env = process.env) => strongSecret(env.PAYMENTS_ADMIN_SECRET);

/**
 * Schlüssel für die Anzahlungs-Links. In Produktion Pflicht; außerhalb gibt
 * es einen festen Entwicklungswert, damit Tests und Mock ohne Variable laufen.
 */
export function linkSecret(env = process.env) {
  const s = strongSecret(env.PAYMENTS_LINK_SECRET);
  if (s) return s;
  return isProduction(env) ? null : "dev-only-link-secret-platzhirsch-0000000000";
}

/** Grundadresse für Rücksprung-URLs (ohne Schrägstrich am Ende). */
export function baseUrl(env = process.env) {
  const raw = String(env.PAYMENTS_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(raw)) return raw;
  // http nur außerhalb der Produktion (localhost)
  if (!isProduction(env) && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) return raw;
  return isProduction(env) ? DEFAULT_BASE_URL : "http://localhost:3000";
}

/** Optionale Zahlungsarten-Konfiguration (pmc_…) aus dem Dashboard. */
export function paymentMethodConfiguration(env = process.env) {
  const v = String(env.STRIPE_PAYMENT_METHOD_CONFIGURATION ?? "").trim();
  return PMC_RE.test(v) ? v : null;
}

/** Datenordner der Datei-Ablage. */
export function dataDir(env = process.env) {
  const v = String(env.PAYMENTS_DATA_DIR ?? "").trim();
  return v ? path.resolve(v) : path.join(process.cwd(), ".data", "payments");
}

/**
 * Übersicht für Vorschau und Doku: was fehlt? Gibt NUR Namen zurück, nie Werte.
 */
export function paymentsConfigProblems(env = process.env) {
  const missing = [];
  if (!SECRET_RE.test(String(env.STRIPE_SECRET_KEY ?? "").trim())) missing.push("STRIPE_SECRET_KEY");
  if (!WEBHOOK_RE.test(String(env.STRIPE_WEBHOOK_SECRET ?? "").trim())) missing.push("STRIPE_WEBHOOK_SECRET");
  if (isProduction(env) && isTestKey(env.STRIPE_SECRET_KEY) && env.PAYMENTS_ALLOW_TEST_KEYS !== "1") missing.push("Live-Schlüssel (sk_live_) statt Testschlüssel");
  if (isProduction(env) && !mailProviderReady(env)) missing.push("PAYMENTS_MAIL_PROVIDER/PAYMENTS_MAIL_API_KEY/PAYMENTS_MAIL_FROM (Pflicht in Produktion, sonst kein Gutschein-Versand)");
  if (!adminSecret(env)) missing.push("PAYMENTS_ADMIN_SECRET (≥ 32 Zeichen, für Anzahlungen und Gutscheinregister)");
  if (isProduction(env) && !strongSecret(env.PAYMENTS_LINK_SECRET)) missing.push("PAYMENTS_LINK_SECRET (≥ 32 Zeichen)");
  return missing;
}
