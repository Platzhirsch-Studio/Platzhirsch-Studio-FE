// Text-Leser für Portal, Upload und Labs (R5-portal-labs).
//
// Die Texte stehen bis zur Übernahme in src/messages/*.json nur im Code (DE).
// tx() liest den Schlüssel über next-intl, wenn es ihn gibt, und fällt sonst
// auf den bisherigen deutschen Text zurück. So funktioniert jede Seite VOR und
// NACH der Übernahme durch R5-i18n (messages-r4-portal.json, messages-r5-portal.json):
// fehlt ein Schlüssel, bleibt alles wie bisher; ist er da, kommt er aus den Messages.
//
// `t` ist ein Übersetzer ohne Namensraum (useTranslations() im Client oder in
// synchronen Server-Komponenten, await getTranslations() in async Seiten);
// `key` ist der volle Pfad, z. B. "Portal.docs.apply".
// Kein Pfad für Schlüssel aus Nutzereingaben: nur feste Literale übergeben.

/**
 * @param {((key: string, values?: object) => string) & { has?: (key: string) => boolean }} t
 * @param {string} key
 * @param {string} fallback  bisheriger DE-Text
 * @param {Record<string, string | number>} [values]  ICU-Werte; ersetzen {name} auch im Fallback
 */
export function tx(t, key, fallback, values) {
  try {
    if (t && typeof t.has === "function" && t.has(key)) return t(key, values);
  } catch {
    // Fehlerhafte Message (z. B. ICU-Syntax) → nie die Seite brechen, DE-Text zeigen.
  }
  if (!values) return fallback;
  return fallback.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}
