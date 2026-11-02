// Texts of the catalogue and product pages (namespaces "shop" and "cart").
//
// Round 5 (R5-i18n): the module fallback FALLBACK (Neuauftritt, ~500 leaves)
// and R4_ATELIER (messages-r4-produkt.json) are gone. Every one of their keys
// is in src/messages/{de,en,fr,it}.json (checked before the removal and by
// tests/unit/r5-i18n.test.mjs), IT in the voi-form like the rest of it.json (R9-P5).
// withFallback() stays as a thin wrapper so the callers keep their imports;
// it is a plain next-intl translator with `has()`.

/**
 * @param {Function} t          next-intl translator (useTranslations / getTranslations)
 * @param {string} [_locale]    kept for the callers' signature
 * @param {string} [_namespace] kept for the callers' signature
 */
export function withFallback(t, _locale, _namespace) {
  const tr = (key, values) => t(key, values);
  tr.has = (key) => Boolean(t?.has?.(key));
  return tr;
}

// Optik-Runde (01.11.2026): a spaced dash never starts a line – the space
// before "–" becomes a protected one, so "In Lochau ansehen – Termin anfragen"
// breaks after the dash on narrow buttons, not before it. Text stays the same.
const DASH_RE = /(\S) ([–—])(?= )/gu;
/** @param {unknown} text */
export function glueDash(text) {
  return typeof text === "string" ? text.replace(DASH_RE, "$1 $2") : text;
}
