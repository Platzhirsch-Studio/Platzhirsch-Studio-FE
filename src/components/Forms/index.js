// Form building blocks of the lead forms (Kontakt, Beratung, Produktanfrage,
// Adventsabend). Contract and texts: src/lib/forms/client.js, src/lib/forms/i18n.js.
// Doc: Marktresearch/digital/teamleiter/r2-R2-leads.md
// Client-only pieces (FormAlert, useFormGuard) carry their own "use client".
export { default as FormPrivacyNote } from "./FormPrivacyNote";
export { default as Honeypot } from "./Honeypot";
export { default as FormField, RadioCards, FieldError, ErrorIcon, SuccessIcon, cleanLabel, describedBy, fieldBorder } from "./FormField";
export { FormAlert, FormSuccess } from "./FormAlert";
export { default as useFormGuard, focusField, useHydrated, useServerFieldError } from "./useFormGuard";
export { default as useFormText, formCopy } from "./useFormText";
