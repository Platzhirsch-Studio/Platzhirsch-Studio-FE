// src/lib/einblicke/gate.js – darf hier gemessen werden?
// Alles muss zutreffen (Konzept §2.1):
//   - Schalter an (config.einblickeOn)
//   - Einwilligung in den eigenen Dienst "Besucher-Einblicke" (Cookie-Schlüssel
//     "einblicke", Kategorie Statistik): einblickeConsentOf(readConsent(document.cookie))
//     aus src/lib/attribution.js – die EINZIGE Einwilligungsquelle; unabhängig
//     von Google Analytics (QA Recht P1-1, P2-4)
//   - kein Do-Not-Track (navigator.doNotTrack / window.doNotTrack === "1")
//   - kein Global Privacy Control (navigator.globalPrivacyControl === true)
//   - Route nicht ausgeschlossen (Portal, Upload, Zahlung, Vorschau, Postausgang)
// Rein und ohne "@/": node --test prüft die Kopplung (tests/unit/einblicke.test.mjs).
import { einblickeConsentOf, readConsent } from "../attribution.js";
import { einblickeOn, routeExcluded } from "./config.js";

/** true, wenn der Browser DNT oder GPC meldet. */
export function privacySignal(nav, win) {
  try {
    if (nav && (nav.doNotTrack === "1" || nav.doNotTrack === "yes" || nav.globalPrivacyControl === true)) return true;
    if (win && win.doNotTrack === "1") return true;
  } catch {
    return true;
  }
  return false;
}

/** Einblicke-Einwilligung aus dem Consent-Cookie (oder einem übergebenen Objekt). */
export const einblickeAllowed = (cookieOrConsent) =>
  einblickeConsentOf(typeof cookieOrConsent === "string" ? readConsent(cookieOrConsent) : cookieOrConsent);

/**
 * darfMessen({ consent | cookie, nav, win, path, on }) → boolean
 * `consent` (Objekt aus ph-consent-change) hat Vorrang vor `cookie`.
 */
export function darfMessen({ consent, cookie = "", nav, win, path, on = einblickeOn() } = {}) {
  if (!on) return false;
  if (!einblickeAllowed(consent !== undefined ? consent : cookie)) return false;
  if (privacySignal(nav, win)) return false;
  return !routeExcluded(path);
}

/** Bequemer Aufruf im Browser. */
export function darfMessenHier(win = typeof window !== "undefined" ? window : undefined, consent) {
  if (!win) return false;
  return darfMessen({ consent, cookie: win.document?.cookie || "", nav: win.navigator, win, path: win.location?.pathname });
}
