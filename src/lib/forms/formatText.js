// src/lib/forms/formatText.js
// R5-leads-perf (TBT /de/kontakt): use-intl compiles a message with
// intl-messageformat whenever values are passed, even for plain text. The
// form helper always passed `{ phone }`, so every label of a form
// ("optional", "requiredHint", the privacy note …) was parsed as ICU during
// hydration. formatFormText() returns a plain message (no braces, quotes or
// tags) as is – exactly what t(key) without values returns – and lets ICU run
// only for messages that really have placeholders (error texts with {phone},
// the summary with {count, plural}, the stepper) or when values are passed.
// Missing keys go through t() as before (same onError / fallback).
// No imports: tested with `node --test` against the real use-intl translator
// (tests/unit/r5-leads.test.mjs, every forms.* key in 4 languages).
const NEEDS_ICU = /[{}'<]/;

/**
 * Text of `key` in the `forms` translator `t`; `{phone}` always filled.
 * @param {Function & { has: Function, raw: Function }} t  next-intl translator
 * @param {string} key
 * @param {object} [vars]
 * @param {string} [phone]
 */
export function formatFormText(t, key, vars, phone) {
  if (!vars) {
    try {
      if (t.has(key)) {
        const raw = t.raw(key);
        if (typeof raw === "string" && !NEEDS_ICU.test(raw)) return raw;
      }
    } catch {
      // t.raw unavailable (precompiled messages): fall through to t().
    }
  }
  return t(key, { phone, ...vars });
}
