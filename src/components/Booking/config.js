// src/components/Booking/config.js
// Switch for the online appointment (Masterplan AP3 Nr. 4, E7 open).
//   BOOKING_PROVIDER = "none" (default) → nothing is rendered
//                    = "link"           → a link to BOOKING_URL (Google
//                                         Terminplanung, Microsoft Bookings …)
//                    = "frappe"         → own online calendar /[locale]/termin
//                                         (backoffice via FRAPPE_BOOKING_*, see
//                                         src/lib/booking/config.js terminMode;
//                                         without keys the page runs the mock
//                                         in dev and refers to /beratung in
//                                         production)
// Anything else (e.g. "calcom" before the AVV and the package exist) counts
// as "none". BOOKING_URL must be an https URL, otherwise "none" as well.
// Server only (process.env without NEXT_PUBLIC_): the page passes the result
// as props, nothing of it reaches the client bundle unless shown. The
// FRAPPE_BOOKING_* keys are never part of this result.
// No "@/..." imports: tested with `node --test` (tests/unit/r4-leads.test.mjs,
// tests/unit/booking-termin.test.mjs).

import { terminActive } from "../../lib/booking/config.js";

export const BOOKING_PROVIDERS = ["none", "link", "frappe"];

/**
 * Eigener Online-Kalender (/termin) nutzbar? true bei terminMode "frappe" oder
 * "mock" (Dev/Test), false in Produktion ohne vollständige Konfiguration.
 * Steuert die CTA-Ziele in Kopf, Footer und MobileCtaBar (sonst /beratung)
 * und den Einstieg „Termin online wählen“ oben auf /beratung.
 */
export function ownCalendarActive(env = typeof process !== "undefined" ? process.env : {}) {
  try {
    return terminActive(env);
  } catch {
    return false;
  }
}

/** Ziel der CTAs „Termin anfragen“: /termin bei aktivem Kalender, sonst die Beratungsseite der Sprache. */
export function terminCtaPath(locale, beratungRoutes, env) {
  return ownCalendarActive(env) ? "/termin" : beratungRoutes[locale] || beratungRoutes.de;
}

/** @returns {{ provider: "none" } | { provider: "link", url: string, host: string } | { provider: "frappe", path: "/termin" }} */
export function bookingConfig(env = typeof process !== "undefined" ? process.env : {}) {
  const provider = String(env?.BOOKING_PROVIDER || "none").trim().toLowerCase();
  if (provider === "frappe") return { provider: "frappe", path: "/termin" };
  if (provider !== "link") return { provider: "none" };
  try {
    const url = new URL(String(env?.BOOKING_URL || "").trim());
    if (url.protocol !== "https:" || !url.hostname) return { provider: "none" };
    return { provider: "link", url: url.toString(), host: url.hostname.replace(/^www\./, "") };
  } catch {
    return { provider: "none" };
  }
}
