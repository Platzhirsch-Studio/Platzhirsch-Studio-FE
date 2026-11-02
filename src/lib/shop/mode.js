// src/lib/shop/mode.js
// Schalter des Onlineshops der Accessoire-Welt (Inhaber-Entscheidung Nr. 29).
//
//   SHOP_MODE  off | test | live
//     Standard: "off" in Produktion (NODE_ENV/VERCEL_ENV production),
//               "test" außerhalb (lokaler Entwicklungsserver, Tests).
//   SHOP_PREVIEW=1  "test" auch in einem Produktions-Build (Vorschau-Server),
//                   NIE auf VERCEL_ENV=production.
//
// "off":  Warenkorb-, Kassen- und Bestellseiten sowie /api/shop/* liefern 404,
//         Produktseiten zeigen „Im Showroom erhältlich – Verfügbarkeit anfragen“.
// "test": Warenkorb + Checkout mit Stripe-TESTschlüsseln (sk_test_) oder dem
//         Mock (src/lib/payments), Versand über den LetMeShip-Mock bzw. die
//         LetMeShip-Testumgebung. Sichtbares Testmodus-Banner, keine Mails,
//         kein Backoffice. Ein Live-Schlüssel wird im Test NIE benutzt.
// "live": nur, wenn (1) die Freigabe-Checkliste release.js vollständig belegt
//         ist, (2) alle Rechts-Slots legal.js freigegeben sind, (3) ein
//         Stripe-LIVE-Schlüssel und (4) ein Mail-Dienst konfiguriert sind,
//         (5) jede Lieferzeit freigegeben ist und einen Termin hat (lieferzeit.js),
//         (6) die USt-Grundlagen belegt sind (ust.js ustOffen: Regeln, Fernverkäufe/OSS).
//         Fehlt etwas → "off" (nicht "test": nie ein Testshop auf der echten Seite).
// Jeder andere Wert gilt als "off".
// Werte werden zur Anfragezeit gelesen (Seiten rufen connection() auf).
// Keine "@/"-Importe (node --test). NIE in eine Client-Komponente importieren.
import { isProduction, mailProviderReady, stripeKeyKind } from "../payments/config.js";
import { SHOP_RELEASE, releaseComplete, releaseOpen } from "./release.js";
import { SHOP_LEGAL, legalOpen } from "./legal.js";
// Lieferzeit je Land/Bestand muss freigegeben sein (FAGG § 4 Abs 1 Z 7, Art. 246a § 1 Abs 1 Nr 7 EGBGB) – lieferzeit.js.
import { LIEFERZEIT, lieferzeitOffen } from "./lieferzeit.js";
// USt-Grundlagen (Fernverkaufsschwelle/OSS, Art. 59c MwStSystRL) – ust.js, Review 31.10.2026.
import { ustOffen } from "./ust.js";

export const SHOP_MODES = Object.freeze(["off", "test", "live"]);

/** Gesetzter Wert (ohne Freigabe-Kopplung); leer → Standard je Umgebung. */
export function shopModeRequested(env = process.env) {
  const raw = String(env.SHOP_MODE ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return isProduction(env) ? "off" : "test";
  return SHOP_MODES.includes(raw) ? raw : "off";
}

/** Was fehlt für "live"? (nur Namen, nie Werte) */
export function liveBlockers(env = process.env, { release = SHOP_RELEASE, legal = SHOP_LEGAL, lieferzeit = LIEFERZEIT, ust } = {}) {
  const out = [];
  if (!releaseComplete(release)) out.push(...releaseOpen(release).map((id) => `freigabe:${id}`));
  out.push(...legalOpen(legal).map((id) => `recht:${id}`));
  out.push(...lieferzeitOffen(lieferzeit).map((id) => `lieferzeit:${id}`));
  out.push(...ustOffen(ust).map((id) => `ust:${id}`));
  if (stripeKeyKind(env) !== "live") out.push("technik:stripe-live-schluessel");
  if (!mailProviderReady(env)) out.push("technik:mail-dienst");
  return out;
}

/**
 * Wirksamer Modus "off" | "test" | "live".
 * @param {object} env
 * @param {{ release?: object[], legal?: object[], lieferzeit?: object, ust?: object }} [opts]  nur Tests
 */
export function shopMode(env = process.env, opts = {}) {
  const requested = shopModeRequested(env);
  if (requested === "off") return "off";
  if (requested === "test") {
    if (env.VERCEL_ENV === "production") return "off";
    if (isProduction(env) && env.SHOP_PREVIEW !== "1") return "off";
    return "test";
  }
  return liveBlockers(env, opts).length === 0 ? "live" : "off";
}

export const shopActive = (env = process.env, opts) => shopMode(env, opts) !== "off";
export const shopTest = (env = process.env, opts) => shopMode(env, opts) === "test";
