// src/lib/forms/i18n.js
// Form contract helpers (R1-formulare): the four supported locales and the
// mapping of the form routes' error `code`s to the text key shown.
//
// Round 5 (R5-i18n): the text tables FORM_TEXT / FORM_TEXT_R3 and the
// helpers formText() / formErrorText() / interpolate() are gone. All texts
// live in src/messages/{de,en,fr,it}.json under `forms.*` (IT in the tu-form)
// and are read with next-intl only (src/components/Forms/useFormText.js).
// FORM_TEXT and FORM_TEXT_R3 stay as empty per-locale objects only because
// tests/unit/r4-leads.test.mjs (other owner) still imports them; they hold no
// text. Coverage of every forms.* key in 4 languages: tests/unit/r5-i18n.test.mjs
// and tests/unit/forms-leads.test.mjs.
//
// No "@/..." imports: tested directly with `node --test`.

export const FORM_LOCALES = ["de", "en", "fr", "it"];

/** @deprecated no texts any more – read `forms.*` from src/messages. */
export const FORM_TEXT = Object.freeze({ de: {}, en: {}, fr: {}, it: {} });
/** @deprecated no texts any more – read `forms.*` from src/messages. */
export const FORM_TEXT_R3 = Object.freeze({ de: {}, en: {}, fr: {}, it: {} });

// Codes of the form contract (R1-formulare) → the text key shown.
// `failed` (newsletter) and `internal` read like `upstream`; the newsletter's
// `invalid_email` like `invalid`. Unknown codes fall back to `upstream`.
const CODE_KEYS = {
  invalid: "invalid",
  invalid_email: "invalid",
  too_large: "too_large",
  rate_limited: "rate_limited",
  already_subscribed: "already_subscribed",
  upstream: "upstream",
  failed: "upstream",
  internal: "upstream",
  timeout: "timeout",
  network: "network",
};

/** Error text key ("error.<…>") for a contract code. */
export function errorKey(code) {
  return `error.${Object.hasOwn(CODE_KEYS, code) ? CODE_KEYS[code] : "upstream"}`;
}

/** Contract codes with their own text (for tests and the QA tools). */
export const ERROR_CODES = Object.freeze(Object.keys(CODE_KEYS));
