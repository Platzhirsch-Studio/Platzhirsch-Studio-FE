// src/lib/forms/errorKey.js
// Contract code → text key "error.<…>" (R5-leads-perf, TBT /de/kontakt).
// Same mapping as errorKey() in src/lib/forms/i18n.js, but without the
// four-language text tables of that file, so the client bundles of the forms
// no longer carry them. tests/unit/r5-leads.test.mjs keeps both equal.
// `failed` (newsletter) and `internal` read like `upstream`; the newsletter's
// `invalid_email` like `invalid`. Unknown codes fall back to `upstream`.
// No "@/..." imports: tested with `node --test`.
export const CODE_KEYS = {
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
  return `error.${Object.prototype.hasOwnProperty.call(CODE_KEYS, code) ? CODE_KEYS[code] : "upstream"}`;
}
