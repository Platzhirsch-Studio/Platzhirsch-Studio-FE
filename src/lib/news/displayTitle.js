// Moved to src/lib/news/displayTitle.js (pure, relative imports) in Runde 2 so
// the meta title (newsTitle.js) and node --test use the same casing.
import { KNOWN_BRANDS } from "../legal/claims.js";

// Display-only casing for CMS news titles (QA Runde 1, P3-5): the backoffice
// writes brand names in capitals ("TRECA PARIS, MINOTTI, POLIFORM",
// "CLASSICON"). Versalien are reserved for the overline (Bibel §5), so words
// of 4+ capital letters are shown in their usual spelling. Slugs, metadata
// and JSON-LD keep the CMS value – this only changes what is painted.
const SPELLING = new Map();
for (const name of KNOWN_BRANDS) {
  const key = name.toLowerCase();
  if (!SPELLING.has(key)) SPELLING.set(key, name);
}
// Brands/words in the news that are not in the claims brand list.
SPELLING.set("treca", "Tréca");
for (const name of ["ClassiCon", "Platzhirsch", "Bora", "Frost", "Solpuri", "Heatsail", "Quasar", "Alonpi", "Cucine"]) {
  SPELLING.set(name.toLowerCase(), name);
}

const CAPS_WORD = /(?<![\p{L}\p{N}])(\p{Lu}[\p{Lu}\p{N}]{3,})(?![\p{L}\p{N}])/gu;

/** "TRECA PARIS, MINOTTI – Schlafkomfort" → "Treca Paris, Minotti – Schlafkomfort" */
export function displayTitle(title) {
  if (typeof title !== "string" || !title) return title;
  return title.replace(CAPS_WORD, (word) => {
    if (!/\p{Ll}/u.test(word) && /\p{L}{2}/u.test(word)) {
      const known = SPELLING.get(word.toLowerCase());
      if (known) return known;
      return word[0] + word.slice(1).toLowerCase();
    }
    return word;
  });
}

// QM shell-home r2: the backoffice mixes quotation marks ("Vernissage „Birds
// Zyklus" von M. Fohn" – German opening, straight closing). Display only:
// a straight " that closes an open typographic quote becomes its partner,
// remaining straight pairs become the locale's marks. Unbalanced leftovers
// stay as they are (no guessing).
const QUOTES = {
  de: ["„", "“"],
  en: ["“", "”"],
  fr: ["« ", " »"],
  it: ["«", "»"],
};
const CLOSE_OF = { "„": "“", "“": "”", "«": "»", "‘": "’", "‚": "‘" };

/** "Vernissage „Birds Zyklus\" von M. Fohn" → "Vernissage „Birds Zyklus“ von M. Fohn" */
export function balanceQuotes(text, locale = "de") {
  if (typeof text !== "string" || !text.includes('"')) return text;
  // 1. typographic opening mark … straight closing mark → matching close.
  let out = text.replace(/([„“«‚‘])([^"„“”«»]*?)"/gu, (m, open, inner) => `${open}${inner}${CLOSE_OF[open]}`);
  // 2. remaining straight pairs → the locale's marks.
  const [o, c] = QUOTES[locale] || QUOTES.de;
  out = out.replace(/"([^"]+)"/g, (m, inner) => `${o}${inner.trim()}${c}`);
  return out;
}
