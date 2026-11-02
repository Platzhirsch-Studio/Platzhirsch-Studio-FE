// src/lib/booking/format.js – Platzhalter und Datumsformate (Lochauer Zeit),
// ohne Texttabellen: klein genug für das Browser-Bundle. copy.js exportiert weiter.

/** "{n} frei" → "3 frei". */
export function fill(text, vars = {}) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

const LANG_TAG = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };
export const langTag = (locale) => LANG_TAG[locale] || "de-AT";

/** „Dienstag, 3. November 2026“ in Lochauer Zeit. */
export function formatDate(iso, locale, opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(langTag(locale), { timeZone: "Europe/Vienna", ...opts }).format(new Date(iso));
}

export function formatTime(iso, locale) {
  return new Intl.DateTimeFormat(langTag(locale), { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
