// src/lib/forms/selfReport.js
// Selbstauskunft "Wie sind Sie auf uns aufmerksam geworden?" (Masterplan AP3
// Nr. 3, Bericht 11 F1). OPTIONAL select in the lead forms (R5-leads-perf).
//
// - The browser sends only a stable CODE; selfReportLabel() maps it to the
//   German backoffice label, which goes as "Selbstauskunft: …" into the
//   existing Herkunft text block (leadPayload.js). No new API field: the
//   route allowlist (schemas.js) and the backoffice format stay the same.
// - Unknown codes or free text are dropped (nothing typed by a visitor or a
//   script lands in that line).
// - It is information the visitor gives on purpose, not tracking: it is sent
//   with and without cookie consent; the consent boundary of the other lines
//   (R4, "ohne Ads-Einwilligung nur der Kanal") is unchanged.
// - UI texts: forms.selfReport.* in src/messages (merged R6), SELF_REPORT_TEXT
//   below is only a German safety net.
// No "@/..." imports: tested directly with `node --test`.

/** Name of the <select> (never part of the JSON payload). */
export const SELF_REPORT_NAME = "selbstauskunft";

// Order = order in the select. Options from Bericht 11 (Zeile 125).
export const SELF_REPORT_OPTIONS = [
  { code: "google", label: "Google-Suche" },
  { code: "maps", label: "Google Maps" },
  { code: "ki", label: "KI-Assistent" },
  { code: "instagram", label: "Instagram" },
  { code: "empfehlung", label: "Empfehlung Freund/Kunde" },
  { code: "architekt", label: "Architekt/Planer" },
  { code: "event", label: "Veranstaltung/Café" },
  { code: "vorbeigefahren", label: "Vorbeigefahren" },
  { code: "presse", label: "Presse" },
  { code: "sonstiges", label: "Sonstiges" },
];

export const SELF_REPORT_CODES = SELF_REPORT_OPTIONS.map((o) => o.code);

const BY_CODE = Object.fromEntries(SELF_REPORT_OPTIONS.map((o) => [o.code, o.label]));
const has = (key) => Object.prototype.hasOwnProperty.call(BY_CODE, key);
const LABELS = new Set(SELF_REPORT_OPTIONS.map((o) => o.label));

/**
 * German backoffice label for a code (an exact label is accepted too, for
 * callers that already mapped it), else undefined.
 */
export function selfReportLabel(value) {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v) return undefined;
  if (has(v)) return BY_CODE[v];
  return LABELS.has(v) ? v : undefined;
}

/** Code chosen in a <form> (its `selbstauskunft` select), or undefined. */
export function selfReportFrom(form) {
  const field = form?.elements?.namedItem?.(SELF_REPORT_NAME);
  const value = field && typeof field.value === "string" ? field.value : "";
  return has(value) ? value : undefined;
}

// Thin safety net (R6-leads): the UI texts live in src/messages/*.json under
// forms.selfReport.* (merged by R6-i18n from messages-r5-leads.json, checked
// by tests/unit/r5-leads.test.mjs). Only German stays here, for a key that
// goes missing; every locale falls back to it. Keys = forms.selfReport.*.
export const SELF_REPORT_TEXT = {
  de: {
    label: "Wie sind Sie auf uns aufmerksam geworden?",
    empty: "Bitte wählen",
    options: {
      google: "Google-Suche",
      maps: "Google Maps",
      ki: "KI-Assistent (z. B. ChatGPT)",
      instagram: "Instagram",
      empfehlung: "Empfehlung von Freunden oder Kunden",
      architekt: "Architekt oder Planer",
      event: "Veranstaltung oder Café",
      vorbeigefahren: "Vorbeigefahren",
      presse: "Presse",
      sonstiges: "Anderes",
    },
  },
  en: {},
  fr: {},
  it: {},
};
