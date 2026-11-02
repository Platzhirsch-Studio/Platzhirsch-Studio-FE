// src/lib/seo/brandMeta.js
// Titles and descriptions of the brand pages (/ueber-uns/marken/<marke>,
// collections and "Marke × Kategorie" under /ueber-uns/marken/<marke>/<slug>).
// Runde 3 P5 (technik P2, r3-recht-inhalt Nr. 5, r3-seo P2-3):
//   - title ≤ 65 (Rat 9,5: 60) characters, the brand named ONCE ("101 Copenhagen Arc Console
//     Kollektion – 101 Copenhagen | Platzhirsch Home Living" was 80 characters
//     with the brand twice; 110 URLs of sitemap-marken were over 65),
//     suffix " | Platzhirsch";
//   - description 120–155 (Rat 9,5: 150) characters: the page's own text, completed with a
//     neutral sentence (place, advice, prices on request) when it is too short,
//     cut at a word boundary when it is too long. No dealer claim, no
//     superlative, no price.
// Rat 9,5 A15 (T6): title ≤ 60 (META_TITLE_MAX) and description ≤ 150 as
// whole sentences (clampDescription), never cut with "…".
// Pure module (relative imports only), so node --test can load it.
import { META_DESCRIPTION_MAX, META_TITLE_MAX, clampDescription, cutTitle } from "./pageMetadata.js";

export const TITLE_MAX = META_TITLE_MAX;
export const DESC_MIN = 120;
export const DESC_MAX = META_DESCRIPTION_MAX;
const SUFFIX = " | Platzhirsch";

const COLLECTION_WORD = { de: "Kollektion", en: "collection", fr: "collection", it: "collezione" };

// Neutral completion of a short description, by locale (no dealer word, no
// price, no claim that every brand is on show): place, service, prices – each
// sentence once, added only while the description stays ≤ 155 characters.
const PLACE = {
  de: "Beratung im Showroom in Lochau am Bodensee.",
  en: "Advice at our showroom in Lochau on Lake Constance.",
  fr: "Conseil au showroom de Lochau, au bord du lac de Constance.",
  it: "Consulenza nello showroom di Lochau sul Lago di Costanza.",
};
const SERVICE = {
  de: "Planung, Lieferung und Montage auf Wunsch.",
  en: "Planning, delivery and installation on request.",
  fr: "Planification, livraison et montage sur demande.",
  it: "Progettazione, consegna e montaggio su richiesta.",
};
const PRICES = {
  de: "Preise auf Anfrage.",
  en: "Prices on request.",
  fr: "Prix sur demande.",
  it: "Prezzi su richiesta.",
};
const NAMES_PLACE = /lochau|bodensee|lake constance|lac de constance|lago di costanza/i;
// Even shorter texts: what the page shows, then the completion.
const LEAD = {
  de: (b) => `${b}: Möbel, Kollektionen und Materialien.`,
  en: (b) => `${b}: furniture, collections and materials.`,
  fr: (b) => `${b} : mobilier, collections et matériaux.`,
  it: (b) => `${b}: arredi, collezioni e materiali.`,
};

const clean = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Title ≤ max without "…" (cut at a separator or word, pageMetadata.cutTitle). */
const cut = (text, max) => cutTitle(text, max);

/** Removes a leading brand name from a collection name ("101 Copenhagen Arc" → "Arc"). */
export function stripBrand(name, brand) {
  const n = clean(name);
  const b = clean(brand);
  if (!b) return n;
  const rest = n.replace(new RegExp(`^${escapeRe(b)}\\s*[-–:]?\\s*`, "i"), "");
  return rest || n;
}

/**
 * "<Marke> <Kollektion> Kollektion | Platzhirsch" – brand once, ≤ 65.
 * Falls back to dropping the word "Kollektion", then the suffix, then a cut.
 */
export function collectionMetaTitle(collectionName, brandName, locale = "de") {
  const brand = clean(brandName);
  const coll = stripBrand(collectionName, brand);
  const word = COLLECTION_WORD[locale] || COLLECTION_WORD.de;
  const base = `${brand} ${coll} ${word}`;
  for (const candidate of [`${base}${SUFFIX}`, `${brand} ${coll}${SUFFIX}`, `${brand} ${coll}`]) {
    if (candidate.length <= TITLE_MAX) return candidate;
  }
  return cut(`${brand} ${coll}`, TITLE_MAX);
}

/**
 * Any brand-page title: the brand at most once, ≤ 65 characters. Drops a
 * second occurrence of the brand ("… – Minotti | …"), shortens the suffix
 * "| Platzhirsch Home Living" to "| Platzhirsch", then cuts.
 */
export function brandSafeTitle(title, brandName) {
  let t = clean(title);
  const brand = clean(brandName);
  if (brand) {
    const re = new RegExp(escapeRe(brand), "gi");
    const hits = t.match(re) || [];
    // "<Kollektion> – <Marke> | …": drop the trailing "– <Marke>".
    if (hits.length > 1) {
      t = t
        .replace(new RegExp(`\\s*[–-]\\s*${escapeRe(brand)}(?=\\s*(\\||$))`, "i"), "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }
  if (t.length > TITLE_MAX) t = t.replace(/\s*\|\s*Platzhirsch Home Living\s*$/, SUFFIX);
  if (t.length > TITLE_MAX) t = t.replace(/\s*\|\s*Platzhirsch\s*$/, "");
  return cut(t, TITLE_MAX);
}

/**
 * Meta description of 120–155 characters in the page language.
 * @param {string} text the page's own description (CMS or generated)
 * @param {string} locale de|en|fr|it
 * @param {string} brand display name, used when the text is very short
 */
export function fitMetaDescription(text, locale = "de", brand = "") {
  const loc = PLACE[locale] ? locale : "de";
  let d = clean(text);
  if (d.length < DESC_MIN && brand && d.length < 40) d = `${LEAD[loc](clean(brand))}${d ? ` ${d}` : ""}`;
  const pool = [NAMES_PLACE.test(d) ? null : PLACE[loc], SERVICE[loc], PRICES[loc]].filter(Boolean);
  for (const sentence of pool) {
    if (d.length >= DESC_MIN) break;
    const sep = d && !/[.!?…]$/.test(d) ? ". " : d ? " " : "";
    if (`${d}${sep}${sentence}`.length <= DESC_MAX) d = `${d}${sep}${sentence}`;
  }
  return clampDescription(d, DESC_MAX);
}
