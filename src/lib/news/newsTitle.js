// src/lib/news/newsTitle.js
// <title> of a news article (Runde 2, seo P1-2). Rules:
// - the headline in the spelling of the H1 (displayTitle: no Versalien),
// - ≤ 65 characters in total,
// - cut only at a word boundary, never before a dangling article/preposition
//   ("Möbeldesign von |"), never a cut "|" – a cut headline ends with "…" and
//   gets no suffix,
// - the suffix " | Platzhirsch Home Living" (or the short " | Platzhirsch")
//   only when it fits and the headline does not already name Platzhirsch
//   (no "Vernissage: Platzhirsch Home Living | Platzhirsch Home Living").
// Pure module: runs in the page and in node --test.
import { displayTitle } from "./displayTitle.js";

export const NEWS_TITLE_MAX = 65;
const SUFFIXES = [" | Platzhirsch Home Living", " | Platzhirsch"];

// Words a title must not end on (DE/EN/FR/IT articles, prepositions, conjunctions).
const STOP_WORDS = new Set(
  (
    "der die das den dem des ein eine einen einem einer eines und oder von vom zu zum zur im in am an auf für mit bei aus nach über unter vor durch als wie " +
    "the a an and or of to in on at for with by from as " +
    "le la les l un une des et ou de du au aux à en pour avec par sur " +
    "il lo gli i uno una e o di da del della dei delle al alla nel nella per con su tra fra"
  ).split(/\s+/)
);

const clean = (s) =>
  String(s || "")
    .replace(/\s*\|\s*/g, " – ")
    .replace(/\s+/g, " ")
    .trim();

/** Cuts at a word boundary to ≤ max characters (incl. "…"), without a dangling stop word. */
export function cutAtWord(text, max) {
  if (text.length <= max) return text;
  let words = text.slice(0, max).split(" ");
  if (text.charAt(max) !== " " && text.charAt(max) !== "") words.pop(); // last word was cut
  const strip = () => {
    while (words.length > 1) {
      const last = words[words.length - 1].replace(/[\s,;:–—\-.!?"“”„«»]+$/u, "");
      if (!last || STOP_WORDS.has(last.toLowerCase())) words.pop();
      else {
        words[words.length - 1] = last;
        break;
      }
    }
  };
  strip();
  while (words.length > 1 && words.join(" ").length + 1 > max) {
    words.pop();
    strip();
  }
  return `${words.join(" ")}…`;
}

/**
 * @param {string} raw backoffice headline (localized)
 * @param {{max?: number}} [opts]
 * @returns {string}
 */
export function newsMetaTitle(raw, { max = NEWS_TITLE_MAX } = {}) {
  const title = clean(displayTitle(clean(raw)));
  if (!title) return "Platzhirsch Home Living";
  const named = /platzhirsch/i.test(title);
  if (!named) {
    for (const suffix of SUFFIXES) if (title.length + suffix.length <= max) return title + suffix;
  }
  if (title.length <= max) return title;
  return cutAtWord(title, max);
}
