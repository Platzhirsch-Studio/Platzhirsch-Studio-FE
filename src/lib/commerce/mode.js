// src/lib/commerce/mode.js
// Schalter für AP9 (Masterplan Welle 1, Paket R5-commerce).
//
//   VOUCHER_MODE    off (Standard) | anfrage | stripe
//   ATELIER_MODE    off (Standard) | anfrage
//   ANZAHLUNG_MODE  off (Standard) | anfrage | stripe
//   COMMERCE_PREVIEW=1           Vorschau /de/preview/commerce auch im Produktions-Build
//
// "off": Seiten /gutscheine, /gutscheinbedingungen, /atelierverkauf und die
// APIs /api/gutschein_anfrage, /api/atelier_reservierung liefern 404; kein
// Navigations-, Sitemap- oder llms-Eintrag (es gibt keinen).
// "anfrage": Formular schickt eine ANFRAGE als Text ans Backoffice. Es wird
// kein Geld angenommen, es kommt kein Vertrag online zustande.
// "stripe" (Stripe Checkout, src/lib/payments): Kauf mit Zahlung. Wirkt nur,
// wenn STRIPE_SECRET_KEY und STRIPE_WEBHOOK_SECRET gesetzt sind (oder der
// Mock aktiv ist, nie in Produktion) UND bei Gutscheinen zusätzlich
// Gutscheinbedingungen und Widerrufsbelehrung "freigegeben" sind. Sonst
// fällt "stripe" auf "anfrage" zurück (Gutscheine: ohne freigegebene
// Bedingungen weiter "off"). Jeder andere Wert (auch das alte "stripe_link")
// gilt als "off".
//
// Die Werte werden zur Anfragezeit gelesen (Seiten rufen connection() auf),
// eine Änderung der Umgebungsvariable braucht also keinen neuen Build, nur
// einen Neustart des Servers.
// Kopplung an die Freigabe (QA-Feedback R5 P2): Solange die
// Gutscheinbedingungen Entwurf sind (voucherTerms.js TERMS_STATUS !==
// "freigegeben"), zählt VOUCHER_MODE immer als "off". So können die Seiten,
// die Bedingungen mit Platzhaltern und die API nicht durch ein gesetztes
// VOUCHER_MODE=anfrage öffentlich werden, bevor die Kanzlei freigibt.
// Zusätzlich (QA Stripe P2-3): "stripe" nur, wenn die Inhaberfragen 2
// (VOUCHER_TAX Einzweck/Mehrzweck) und 3 (VOUCHER_VALIDITY) in voucherTerms.js
// entschieden sind, sonst "anfrage". In Produktion zählt "stripe" außerdem
// nur mit echtem Mail-Anbieter (config.js paymentsReady, QA P1).
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { TERMS_STATUS, voucherDecisions, voucherDecisionsOpen } from "./voucherTerms.js";
import { WITHDRAWAL_STATUS } from "./withdrawalText.js";
import { adminSecret, linkSecret, mockActive, paymentsReady } from "../payments/config.js";

export const TERMS_RELEASED = "freigegeben";

export const MODES = Object.freeze(["off", "anfrage"]);
export const PAYMENT_MODES = Object.freeze(["off", "anfrage", "stripe"]);

function readMode(value, allowed = MODES) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return allowed.includes(v) ? v : "off";
}

/** Gesetzter Wert von VOUCHER_MODE ohne Freigabe-Kopplung (nur Anzeige in der Vorschau). */
export function voucherModeRequested(env = process.env) {
  return readMode(env.VOUCHER_MODE, PAYMENT_MODES);
}

/** Gesetzter Wert von ANZAHLUNG_MODE (Anzeige). */
export function anzahlungModeRequested(env = process.env) {
  return readMode(env.ANZAHLUNG_MODE, PAYMENT_MODES);
}

/** Sind die Gutscheinbedingungen freigegeben? */
export const voucherTermsReleased = (termsStatus = TERMS_STATUS) => termsStatus === TERMS_RELEASED;

/** Ist die Widerrufsbelehrung für den Online-Kauf freigegeben? */
export const withdrawalReleased = (status = WITHDRAWAL_STATUS) => status === TERMS_RELEASED;

/**
 * Wirksamer Modus "off" | "anfrage" | "stripe": nur mit freigegebenen
 * Gutscheinbedingungen, im Entwurf immer "off". "stripe" zusätzlich nur mit
 * freigegebener Widerrufsbelehrung und Stripe-Schlüsseln (bzw. Mock), sonst
 * "anfrage".
 * @param {object} env
 * @param {string} termsStatus
 * @param {{ withdrawalStatus?: string, signal?: { header?: string|null, query?: string|null }, decisions?: { tax: string|null, validity: string|null } }} [opts]
 */
export function voucherMode(env = process.env, termsStatus = TERMS_STATUS, { withdrawalStatus = WITHDRAWAL_STATUS, signal, decisions = voucherDecisions() } = {}) {
  if (!voucherTermsReleased(termsStatus)) return "off";
  const requested = readMode(env.VOUCHER_MODE, PAYMENT_MODES);
  if (requested !== "stripe") return requested;
  return withdrawalReleased(withdrawalStatus) && voucherDecisionsOpen(decisions).length === 0 && paymentsReady(env, signal) ? "stripe" : "anfrage";
}

/**
 * Wirksamer Modus der Anzahlungen "off" | "anfrage" | "stripe". "stripe"
 * braucht Stripe-Schlüssel (bzw. Mock), PAYMENTS_ADMIN_SECRET und den
 * Link-Schlüssel, sonst "anfrage" (Anzahlung per Rechnung wie bisher).
 */
export function anzahlungMode(env = process.env, signal) {
  const requested = readMode(env.ANZAHLUNG_MODE, PAYMENT_MODES);
  if (requested !== "stripe") return requested;
  return paymentsReady(env, signal) && adminSecret(env) && linkSecret(env) ? "stripe" : "anfrage";
}

/**
 * Entwicklungs-Ansicht der Kaufstrecke auf /de/gutscheine?zahlung=mock:
 * nur im Entwicklungsserver (NODE_ENV=development, nie Produktion), auch
 * solange die Bedingungen Entwurf sind. Die Seite zeigt dann ein Banner.
 */
export const voucherDevMock = (env = process.env, query = null) =>
  env.NODE_ENV === "development" && query === "mock" && mockActive(env, { query });

/** "off" | "anfrage" */
export function atelierMode(env = process.env) {
  return readMode(env.ATELIER_MODE);
}

export const voucherEnabled = (env = process.env, termsStatus = TERMS_STATUS) => voucherMode(env, termsStatus) !== "off";
export const atelierEnabled = (env = process.env) => atelierMode(env) !== "off";

/**
 * Vorschau /de/preview/commerce: in der Entwicklung oder mit
 * COMMERCE_PREVIEW=1 in einem Vorschau-Build. Nie auf einer Vercel-
 * Produktionsumgebung (gleiche Regel wie die Rechtstext-Vorschau).
 */
export function commercePreviewEnabled(env = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.COMMERCE_PREVIEW === "1";
}

/** robots-Metadaten für alles, was nicht in den Index darf. */
export const NOINDEX = Object.freeze({
  index: false,
  follow: false,
  nocache: true,
  googleBot: Object.freeze({ index: false, follow: false }),
});
