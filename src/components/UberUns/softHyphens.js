// src/components/UberUns/softHyphens.js – rein, ohne Importe (node:test).
// Soft hyphens (U+00AD, invisible unless the line breaks) at known German
// compound joints. WebKit without a hyphenation dictionary cut long words
// without a hyphen at 200 % text size („Immobilienver|waltung“, „Designma|rken“,
// QM wm-fix3, WCAG 1.4.4/1.4.10); a soft hyphen gives every engine a proper
// break point „Immobilien-/verwaltung“. Only before at least four lowercase
// letters, so „Designer“ alone or „Wohn-“ at a word end stay untouched.
export const SOFT_HYPHEN = "\u00ad";
// wm-fix4: + Hintergrund (Presse „Hintergrundinformationen“), Veröffent|lichung.
// wm-r4: + Küchen (Küchen-/geräte), Kollektiv, Beschäftigungs, Vorstellungs
// (Karriere at 200 %: „Kollektivvertra|gliches“ broke without a hyphen).
const COMPOUND_JOINTS = /(Einrichtungs|Designer|Design|Datenschutz|Immobilien|Hintergrund|Küchen|Kollektiv|Beschäftigungs|Vorstellungs|Wohn|Veröffent(?=lich))(?=\p{Ll}{4,})/gu;

/** Strings get soft hyphens at the joints; anything else (JSX) passes through. */
export function softHyphens(text) {
  if (typeof text !== "string") return text;
  return text.replace(COMPOUND_JOINTS, `$1${SOFT_HYPHEN}`);
}

// QM wm-r4 (iPhone SE, FAQ): „(Di–|Fr 10:00 …“ – a line may break after an en
// dash. Ranges without spaces (Di–Fr, 10:00–18:00) get a word joiner (U+2060,
// invisible, no break) on both sides of the dash.
export const WORD_JOINER = String.fromCharCode(0x2060);
export function keepRanges(text) {
  if (typeof text !== "string") return text;
  return text.replace(/(\S)–(?=\S)/g, `$1${WORD_JOINER}–${WORD_JOINER}`);
}

/** keepRanges for every string value of a placeholder map (FAQ/facts vars). */
export function keepRangesIn(vars) {
  return Object.fromEntries(Object.entries(vars || {}).map(([k, v]) => [k, keepRanges(v)]));
}
