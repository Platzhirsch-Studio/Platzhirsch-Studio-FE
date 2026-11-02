// src/components/Wunschliste/landingCopy.js
// Rat 9,5 A17 (T2): Texte der Einstiegsseite /<locale>/wunschliste stehen
// unter wunschliste.landing.* in src/messages (übernommen aus
// rat95-t2-messages.json am 30.10.2026; die frühere Rückfall-Tabelle ist
// entfernt). Nur Aussagen, die die gebaute Funktion erfüllt. Keine
// "@/..."-Importe (node --test).

/** landingText(t, locale, key, values) – t = getTranslations("wunschliste"). */
export function landingText(t, _locale, key, values) {
  return t(`landing.${key}`, values);
}
