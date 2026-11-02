// src/lib/text/hyphenateDe.js – SERVER ONLY (≈ 370 KB patterns, never import
// from a client component). QM content-legal r3 (200 % text, WebKit): body text
// of the Ratgeber broke long compounds mid-word without a hyphen
// („mehrwertsteuerpfl/ichtig“, „Speditionssendun/g“) – WebKit on several
// platforms has no hyphenation dictionary, so `hyphens: auto` does nothing.
// Soft hyphens (U+00AD, invisible unless the line breaks there) at the
// syllable points of the TeX German patterns (de-1996, Liang) give every
// engine a proper break: „Mehr-/wert-/steu-/er-/pflich-/tig“.
//
// The patterns come with `hyphen`, already installed as a dependency of
// @react-pdf/renderer (no new package). Full file path: plain node ESM
// (node --test) does not resolve the package's directory entry points.
import hyphenator from "hyphen/de-1996/index.js";

export const SOFT_HYPHEN = "­";
/** Shorter words never need a break point (≈ 9 characters fit at 200 % on phones). */
export const MIN_WORD = 10;

// Words of ≥ MIN_WORD letters only – digits, URLs, e-mail addresses and words
// that already carry a soft hyphen stay untouched.
const LONG_WORD = new RegExp(`(^|[^\\p{L}\\p{N}@./\\u00ad])(\\p{L}{${MIN_WORD},})(?![\\p{L}\\p{N}@\\u00ad]|\\.\\p{L}|/)`, "gu");

/**
 * Soft hyphens in every long German word of `text`. Non-strings pass through.
 * @param {string} text
 * @returns {string}
 */
export function hyphenateDe(text) {
  if (typeof text !== "string" || text.length < MIN_WORD) return text;
  if (!hyphenator?.hyphenateSync) return text;
  return text.replace(LONG_WORD, (m, pre, word) => pre + hyphenator.hyphenateSync(word, { hyphenChar: SOFT_HYPHEN, minWordLength: MIN_WORD }));
}
