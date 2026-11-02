// src/components/UberUns/brandHyphen.js
// Brand names with a hyphen ("V-ZUG") must not break at the hyphen on phones
// (QM wohnen-marken 01.11.2026: the facts list wrapped "V-" / "ZUG").
// Splits a string into [text, brand, text, brand, …]: odd indices are the
// hyphenated brand names that the caller wraps in a nowrap span. The joined
// parts are always the unchanged input.
export function splitBrandHyphens(text) {
  if (typeof text !== "string" || text === "") return [text];
  return text.split(/(\b[A-Z]-[A-Z]{2,}\b)/);
}
