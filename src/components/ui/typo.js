// src/components/ui/typo.js – German micro-typography for copy strings
// (Designsystem 01.11.2026). Pure, no "@/" imports, server- and client-safe
// (node --test: tests/unit/designsystem-foundations.test.mjs).
//
// Use it on running text that comes from data or messages, never on URLs,
// article numbers or code:   import { typoDe } from "@/components/ui/typo";
//   typoDe("Breite 240 cm, ab € 4.900, z. B. Eiche - geölt")
//   → "Breite 240 cm, ab € 4.900, z. B. Eiche – geölt" (with protected spaces)
// Prices from Intl.NumberFormat already carry a protected space; typoDe
// leaves them as they are.

export const NBSP = " "; // geschütztes Leerzeichen
export const NNBSP = " "; // schmales geschütztes Leerzeichen (z. B., 20 %)

// Units after a number. Longest first so "mm" is not read as "m".
const UNITS = ["cm²", "m²", "m³", "mm", "cm", "km", "kg", "kW", "Wh", "dB", "°C", "ml", "cl", "m", "g", "l", "W", "V", "h", "Min.", "Std.", "%", "€", "CHF", "EUR", "Stk."];
const UNIT_RE = new RegExp(
  `(\\d)[ \\u00a0\\u202f](${UNITS.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[\\s.,;:!?)\\]/–-])`,
  "gu"
);
// Currency before the number: "€ 4.900", "CHF 1.200".
const CURRENCY_BEFORE_RE = /(€|CHF|EUR)[ ](?=\d)/gu;
// Abbreviations with an inner space: "z. B.", "d. h.", "u. a.", "z. T.", "u. U.", "i. d. R.".
const ABBR_RE = /\b(z|d|u|i|o|s)\.[  ](B|h|a|T|U|d|Ä|g)\.(?:[  ](R)\.)?/gu;
// A hyphen standing alone between words is a dash.
const SPACED_HYPHEN_RE = /(\S) - (?=\S)/gu;
// § and No./Nr. keep their number.
const SIGN_BEFORE_RE = /(§|Nr\.|No\.)[ ](?=\d)/gu;

/**
 * @param {string} text
 * @param {{ quotes?: boolean }} [opts] quotes: straight "…" pairs → „…“
 * @returns {string}
 */
export function typoDe(text, { quotes = false } = {}) {
  if (typeof text !== "string" || !text) return text;
  let s = text
    .replace(UNIT_RE, (_, d, unit) => `${d}${unit === "%" ? NNBSP : NBSP}${unit}`)
    .replace(CURRENCY_BEFORE_RE, `$1${NBSP}`)
    .replace(SIGN_BEFORE_RE, `$1${NBSP}`)
    .replace(ABBR_RE, (_, a, b, c) => `${a}.${NNBSP}${b}.${c ? `${NNBSP}${c}.` : ""}`)
    .replace(SPACED_HYPHEN_RE, `$1${NBSP}– `);
  if (quotes) s = s.replace(/"([^"\n]+)"/gu, "„$1“");
  return s;
}
