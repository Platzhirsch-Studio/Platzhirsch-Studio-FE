import { weekdayName } from "@/lib/site";

// Texts of the contact page (Neuauftritt) live in src/messages/*.json as
// `contact.<key>` in all four locales; contactCopy() is a plain t().
// Round 5 (R5-i18n): the data copy KONTAKT_COPY is gone. It stays as an empty
// per-locale object only because src/app/[locale]/kontakt/page.js (other
// owner) still imports it as a `t.has` fallback; every key is in the messages
// (tests/unit/forms-leads.test.mjs, tests/unit/r5-i18n.test.mjs).
// Tone: Gastgeber, Sie-Form (IT: tu), facts, no superlatives, no promises on times.
/** @deprecated no texts any more – read `contact.*` from src/messages. */
export const KONTAKT_COPY = Object.freeze({ de: {}, en: {}, fr: {}, it: {} });

/** contact.<key> from the messages (namespace "contact"). `locale` stays for the callers' signature. */
export function contactCopy(t, locale, key) {
  return t(key);
}

// Opening hours: the single source is src/lib/site.js (Bibel §9 OpeningLine);
// re-exported here so kontakt.js keeps its imports.
// Weekdays: 0 = Sunday … 6 = Saturday.
export { OPENING_HOURS } from "@/lib/site";

export function weekday(locale, day) {
  return weekdayName(locale, day);
}

export function countryName(locale, code) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
