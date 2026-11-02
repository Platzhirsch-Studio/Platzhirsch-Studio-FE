// src/lib/marken/brandCategoryCopy.js
// Texts of the "Marke × Kategorie" page (namespace `brandCategory`).
//
// Round 5 (R5-i18n): the module copy is gone. The single source is
// src/messages/{de,en,fr,it}.json → brandCategory.* (IT in the tu-form).
// BRAND_CATEGORY_COPY is a thin re-export of that namespace, so callers
// without a next-intl translator (unit tests, metadata helpers) read the
// same text as the page. Server only: the JSON imports must stay out of
// client bundles (no client component imports this file).
//
// Voice rules (Design-Bibel, Rechtspaket): no dealer claim, no superlative,
// no promise about which pieces stand in the showroom — only facts the
// backoffice proves (brand, category, number of pieces, origin, year) plus
// the neutral formula "<Marke> in unserer Ausstellung in Lochau".
//
// Plurals use the ICU subset next-intl understands:
// {count, plural, one {…} other {…}}, # = count.
//
// Relative imports only, so node --test can load it.
import de from "../../messages/de.json" with { type: "json" };
import en from "../../messages/en.json" with { type: "json" };
import fr from "../../messages/fr.json" with { type: "json" };
import it from "../../messages/it.json" with { type: "json" };

export const BRAND_CATEGORY_NAMESPACE = "brandCategory";

export const BRAND_CATEGORY_COPY = Object.freeze({
  de: de[BRAND_CATEGORY_NAMESPACE],
  en: en[BRAND_CATEGORY_NAMESPACE],
  fr: fr[BRAND_CATEGORY_NAMESPACE],
  it: it[BRAND_CATEGORY_NAMESPACE],
});

const LOCALES = ["de", "en", "fr", "it"];
const PLURAL_RE = /\{(\w+), plural, ((?:[^{}]|\{[^{}]*\})*)\}/g;

/** Minimal ICU formatter: {name} and {count, plural, one {…} other {…}} (# = count). */
export function formatCopy(template, values = {}, locale = "de") {
  const rules = new Intl.PluralRules(LOCALES.includes(locale) ? locale : "de");
  // Simple {name} placeholders first (also inside plural options), then plurals.
  const simple = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (values[k] != null ? String(values[k]) : m));
  let out = simple(String(template ?? "")).replace(PLURAL_RE, (match, name, body) => {
    const n = Number(values[name]);
    if (!Number.isFinite(n)) return match;
    const options = Object.fromEntries([...body.matchAll(/(=\d+|\w+)\s*\{([^{}]*)\}/g)].map((m) => [m[1], m[2]]));
    const chosen = options[`=${n}`] ?? options[rules.select(n)] ?? options.other ?? "";
    return chosen.replace(/#/g, String(n));
  });
  return out;
}

/**
 * Translator: next-intl `t` (getTranslations with the namespace
 * "brandCategory") when given, else the same messages via BRAND_CATEGORY_COPY.
 * `t` may be omitted (unit tests, metadata without a translator).
 */
export function makeBrandCategoryTr(t, locale = "de") {
  const loc = LOCALES.includes(locale) ? locale : "de";
  const local = BRAND_CATEGORY_COPY[loc];
  return (key, values) => {
    try {
      if (t?.has?.(key)) return t(key, values);
    } catch {
      /* fall back to BRAND_CATEGORY_COPY (same messages) */
    }
    return formatCopy(local[key] ?? BRAND_CATEGORY_COPY.de[key] ?? key, values, loc);
  };
}
