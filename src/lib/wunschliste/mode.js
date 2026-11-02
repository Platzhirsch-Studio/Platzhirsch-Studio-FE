// src/lib/wunschliste/mode.js — wann die Wunschliste was anbietet.
// Keine "@/..."-Importe (node --test, tests/unit/wunschliste.test.mjs).
//
// wunschlisteAvailable(): Teilen ist möglich, wenn ein dauerhafter Speicher
//   da ist – in der Entwicklung immer (.data/wunschliste), in Produktion nur
//   mit WUNSCHLISTE_LOCAL_DIR (persistentes, gesichertes Volume) oder dem
//   freigeschalteten Frappe-Adapter. Schalter WUNSCHLISTE_MODE=off schaltet
//   alles ab (Knopf weg, Links 404). Standard: an (Inhaber-Entscheidung 9).
//   In Produktion zusätzlich erst, wenn die DSE-Ergänzung freigegeben ist
//   (config.js DATENSCHUTZ_WUNSCHLISTE).
// contributionChannel(voucherMode):
//   "stripe"  Gutschein-Kauf ist online wirksam UND der Gemeinschafts-
//             Gutschein ist freigegeben und angebunden (config.js
//             GEMEINSCHAFTS_GUTSCHEIN) → Weg über /de/gutscheine
//   "anfrage" Beitrag als Anfrage speichern, das Studio meldet sich
//   "kontakt" Produktion ohne Frappe: eine Anfrage käme im Studio nicht an,
//             deshalb nur Telefon/E-Mail mit dem Kurzzeichen der Liste.
//   "aus"     Produktion, Gutscheine nicht freigegeben (VOUCHER_MODE wirksam
//             "off", /de/gutscheine 404): kein Beitrags-Abschnitt, die API
//             antwortet 409 (QA Technik P2-5). In der Entwicklung bleibt der
//             Anfrage-Weg sichtbar, damit er geprüft werden kann.
import { frappeWunschlisteReady } from "./frappeAdapter.js";
import { DATENSCHUTZ_WUNSCHLISTE, GEMEINSCHAFTS_GUTSCHEIN } from "./config.js";

export const isProd = (env = process.env) => env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

export function storageKind(env = process.env) {
  if (frappeWunschlisteReady(env)) return "frappe";
  if (!isProd(env) || env.WUNSCHLISTE_LOCAL_DIR) return "local";
  return null;
}

export function wunschlisteAvailable(env = process.env, dseStatus = DATENSCHUTZ_WUNSCHLISTE) {
  if (String(env.WUNSCHLISTE_MODE || "").trim().toLowerCase() === "off") return false;
  // Produktion erst mit ergänzter Datenschutzerklärung (Art. 13 DSGVO, QA Recht P1-6).
  if (isProd(env) && dseStatus !== "freigegeben") return false;
  return storageKind(env) !== null;
}

/** Gemeinschafts-Gutschein online kaufbar? (Ergänzung B freigegeben + Kaufstrecke angebunden) */
export const groupVoucherStripeReady = (g = GEMEINSCHAFTS_GUTSCHEIN) => g.bedingungenStatus === "freigegeben" && g.stripeAngebunden === true;

export function contributionChannel(voucherMode, env = process.env, group = GEMEINSCHAFTS_GUTSCHEIN) {
  if (voucherMode === "stripe" && groupVoucherStripeReady(group)) return "stripe";
  if (isProd(env) && voucherMode !== "stripe" && voucherMode !== "anfrage") return "aus";
  // Anfragen erreichen das Studio nur über Frappe; in der Entwicklung bleiben sie lokal.
  if (isProd(env) && storageKind(env) !== "frappe") return "kontakt";
  return "anfrage";
}
