// Unbedingt nötige Speicher, die der Dialog unter „Essenziell“ einzeln nennt
// (Rat 9,5 A13, QA Recht 8: Cookie-Dialog nennt NEXT_LOCALE/preferredLocale).
// Gleiche Angaben wie die freigegebene Datenschutzerklärung, Abschnitt
// „Cookies und Einwilligung“ (src/components/Datenschutz/datenschutz.js):
// cookieConsent 12 Monate; NEXT_LOCALE (Cookie, 12 Monate) und
// preferredLocale (Browser-Speicher) nur beim aktiven Sprachwechsel
// (src/components/Navbar/LanguageSwitcher.js rememberLocale).
// Die Heatmap-Kennung ph_eb steht beim Dienst „Besucher-Einblicke“ unter
// Statistik (src/lib/legal/services.js), nicht hier: sie braucht Einwilligung.
//
// Texte: Cookies.essentialStorage.<key> in src/messages (übernommen aus
// Marktresearch/digital/features/rat95-t5-messages.json am 30.10.2026).

export const ESSENTIAL_STORAGE = Object.freeze([
  { key: "cookieConsent", names: ["cookieConsent"] },
  { key: "locale", names: ["NEXT_LOCALE", "preferredLocale"] },
]);

/** Text für `key` (title | cookieConsent | locale) aus Cookies.essentialStorage. */
export function essentialText(t, key) {
  return t(`essentialStorage.${key}`);
}
