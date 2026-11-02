// German micro-typography for backoffice news copy (Optik QA content-legal).
// Pure, no "@/" imports (node --test: tests/unit/optik-content-legal.test.mjs).
// Only German text is touched; the words stay exactly as the editors wrote them.
import { NBSP, typoDe } from "../ui/typo.js";

const MONTHS = "Januar|Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
// "4. September" never breaks after the day.
const DAY_MONTH_RE = new RegExp(String.raw`\b(\d{1,2})\.[ ](?=(?:${MONTHS})\b)`, "gu");
// „Birds Zyklus" – a German opening quote closed with a straight one.
const MIXED_QUOTE_RE = /„([^"“”\n]+)"/gu;

/**
 * @param {string} text
 * @param {string} locale
 * @returns {string}
 */
export function newsTypo(text, locale) {
  if (locale !== "de" || typeof text !== "string" || !text) return text;
  return typoDe(text.replace(MIXED_QUOTE_RE, "„$1“"), { quotes: true }).replace(DAY_MONTH_RE, `$1.${NBSP}`);
}
