// src/lib/news/newsCopy.js
// R3-inhalt: one place that decides what of the backoffice news reaches a
// visitor, a search engine or the sitemap.
//
//   1. Withheld (old discount promotions, „bis zu 60 %“ – PAngV/UWG):
//      isWithheldNews() in ./withheldNews.js. Never listed, never in the
//      sitemap, the detail URL answers noindex with only „Diese Aktion ist
//      beendet.“ (no prices in the HTML).
//   2. All other news: the advertising words of the backoffice copy
//      („Luxus“, „luxuriös“, „exklusiv“, „einzigartig“, „größte“ …) are
//      defused when RENDERED – presentNews() returns a sanitized copy. The
//      backoffice data is not changed (editorial list:
//      Marktresearch/digital/redesign/inhaltsseiten.md §9).
//      Superlatives and dealer claims: sanitizeClaims() from src/lib/legal
//      (owner R3-marken-seo, only imported). House-voice words that the
//      legal filter does not cover (Luxus, exklusiv): HOUSE_VOICE below.
//   3. Sitemap: newsSitemapEntries() – the only list the sitemap needs
//      (slug + lastModified), consistent with list and detail page. For
//      src/lib/seo/sitemapEntries.js (R3-marken-seo), see
//      Marktresearch/digital/teamleiter/r3-R3-inhalt.md.
//
// Pure logic with relative imports: runs in server components, in the
// sitemap and in node --test (tests/unit/r3-inhalt.test.mjs). Slugs are
// ALWAYS computed from the raw backoffice title – a sanitized title must
// never change a URL.

import { generateSlug } from "../slugify.js";
import { findClaims, sanitizeClaims } from "../legal/claims.js";
import { isWithheldNews } from "./withheldNews.js";
import { itVoi } from "../seo/shopSeoCopy.js";

export { isWithheldNews, publicNews, WITHHELD_NEWS } from "./withheldNews.js";

const LOCALES = ["de", "en", "fr", "it"];
const L = "\\p{L}\\p{N}";
const pre = `(?<![${L}])`;
const post = `(?![${L}-])`;

// Groß-/Kleinschreibung des Originals übernehmen.
function keepCase(original, replacement) {
  if (!replacement) return replacement;
  if (original === original.toUpperCase() && /\p{L}{2}/u.test(original)) return replacement.toUpperCase();
  const first = original.charAt(0);
  const upper = first === first.toUpperCase() && first !== first.toLowerCase();
  return (upper ? replacement.charAt(0).toUpperCase() : replacement.charAt(0).toLowerCase()) + replacement.slice(1);
}

// House voice (Design-Bibel §1, UWG audit P3): words that sell instead of
// describe. `drop` removes the word (an adjective in front of a noun:
// „die exklusive Kollektion“ → „die Kollektion“); otherwise a neutral word of
// the same grammatical form replaces it.
const HOUSE_VOICE = {
  de: [
    { re: `exklusivit(?:ä|ae)t`, to: "Eigenständigkeit" },
    { re: `einzigartigkeit`, to: "Eigenständigkeit" },
    { re: `exklusiv(?:e[nmrs]?)?`, drop: true },
    { re: `luxuri(?:ö|oe)s(e[nmrs]?)?`, to: (m, s) => "hochwertig" + (s || "") },
    // Compounds: „Luxusmöbel“ → „Möbel“, „Luxusmöbel-Design“ → „Möbel-Design“.
    { re: `luxus(\\p{Ll}[\\p{L}-]*)`, raw: true, to: (m, rest) => rest.charAt(0).toUpperCase() + rest.slice(1) },
    // Noun (masculine, same article): „den Luxus des Designs“ → „den Stil des Designs“.
    { re: `luxus`, to: "Stil" },
    // Runde 3 P5 (recht P2, r3-recht-inhalt Nr. 4): manufacturer claims in the
    // house voice – „weltweit trendbestimmenden …“, „weltweit für … bekannt“,
    // „Ästhetik und Komfort perfekt vereint“. „weltweit“ and the adverb
    // „perfekt“ are dropped; the adjective becomes „passend“.
    { re: `weltweit(?:e[nmrs]?)?`, drop: true },
    // Runde 4 (r4-recht-inhalt P1-4): „weltbekannt“, „weltberühmt“ and the
    // attributive „unvergleichlich“ („ein unvergleichliches Wohnerlebnis“ →
    // „ein Wohnerlebnis“); the predicative form „… ist unvergleichlich.“
    // removes the whole sentence (SENTENCE_DROP below).
    { re: `weltbekannt(?:e[nmrs]?)?`, drop: true },
    { re: `weltber(?:ü|ue)hmt(?:e[nmrs]?)?`, drop: true },
    { re: `unvergleichlich(?:e[nmrs]?)?`, drop: true },
    // QM content-legal r3: superlatives in our voice („als innovativste und
    // revolutionärste Beleuchtungsmarke“ → „als Beleuchtungsmarke“).
    { re: `(?:innovativst|revolution(?:ä|ae)rst)e[nmrs]?(?: und (?:innovativst|revolution(?:ä|ae)rst)e[nmrs]?)?`, drop: true },
    // QM content-legal r3 (news list): the intensifier in „Auffallend innovatives
    // Lichtdesign“ → „Innovatives Lichtdesign“.
    { re: `auffallend(?=\\s+innovativ)`, drop: true },
    { re: `perfekt(e[nmrs]?)`, to: (m, s) => "passend" + s },
    { re: `perfekt`, drop: true },
  ],
  en: [
    { re: `exclusivity`, to: "character" },
    { re: `uniqueness`, to: "character" },
    { re: `exclusive(?:ly)?`, drop: true },
    { re: `luxurious(ly)?`, to: (m, ly) => (ly ? "with care" : "high-quality") },
    { re: `luxury`, to: "quality" },
    { re: `worldwide`, drop: true },
    { re: `world-(?:renowned|famous)`, drop: true },
    { re: `all over the world`, drop: true },
    { re: `incomparabl[ey]`, drop: true },
    { re: `perfectly`, drop: true },
    { re: `perfect`, to: "fitting" },
  ],
  fr: [
    { re: `exclusivité(s)?`, to: (m, s) => "caractère" + (s ? "s" : "") },
    { re: `exclusi(?:f|ve|fs|ves|vement)`, drop: true },
    // „luxueux“ is singular and plural – „de qualité“ fits every form.
    { re: `luxueu(?:x|se|ses)`, to: "de qualité" },
    { re: `de luxe`, to: "haut de gamme" },
    { re: `luxe`, to: "raffinement" },
    { re: `mondialement`, drop: true },
    // „reconnue dans le monde entier pour …“ → „reconnue pour …“.
    { re: `dans le monde entier`, drop: true },
    { re: `incomparables?`, drop: true },
    { re: `parfaitement`, drop: true },
    { re: `parfait(e?s?)`, to: (m, s) => "adapté" + (s || "") },
  ],
  it: [
    { re: `esclusività`, to: "carattere" },
    { re: `esclusiv(?:[oaie]|amente)`, drop: true },
    { re: `lussuos([oaie])`, to: (m, s) => "raffinat" + s },
    { re: `di lusso`, to: "di qualità" },
    { re: `lusso`, to: "comfort" },
    // „noto in tutto il mondo per …“ → „noto per …“.
    { re: `in tutto il mondo`, drop: true },
    { re: `incomparabil[ei]`, drop: true },
    { re: `perfettamente`, drop: true },
    { re: `perfett([oaie])`, to: (m, s) => "adatt" + s },
  ],
};

// Runde 4 (r4-recht-inhalt P1-4, UWG § 2): sentences that promise something in
// our own voice are removed as a whole, word removal would leave a broken or
// still misleading sentence:
//   - a guarantee given by us („können wir garantiert erfüllen“, „We can
//     guarantee“, „Nous vous garantissons“, „Garantiamo“),
//   - a delivery promise with a month („schon im April“, „as early as April“,
//     „dès avril“, „già ad aprile“) – the delivery sentence goes without
//     replacement,
//   - the predicative „ist unvergleichlich.“ / „is incomparable.“ /
//     „est incomparable.“ / „è incomparabile.“ (nothing left to say once the
//     adjective is gone).
// Manufacturer statements such as „Materialien … garantieren Möbel, die …“
// or „eine Garantie für Qualität“ are not a promise of ours and stay.
//
// Runde 9 (P5, r5-recht-inhalt P1-2, UWG § 2 Irreführung durch
// Alleinstellung): a sentence that claims a sole position goes as a whole –
// „Kein anderer Hersteller bietet …“, „wie kein anderer“, „niemand sonst“,
// „nur bei uns“, „als Einziger“, „no other manufacturer“, „aucun autre
// fabricant“, „nessun altro produttore“ … Removing one word would leave the
// claim standing. „einzigartig“/„unique“/„unico“ alone is defused word by
// word by sanitizeClaims (src/lib/legal/claims.js → „besonders“ …), the
// attributive „unvergleichlich“ by HOUSE_VOICE; only the predicative form
// („ist unvergleichlich“, „is unmatched“) drops the sentence.
const SOLE_NOUN = {
  de: "Hersteller|Anbieter|Marke|Unternehmen|Firma|Studio|Designer(?:in)?|Möbel\\p{L}*|Produkt\\p{L}*|Material\\p{L}*|Kollektion|Sofa|Tisch|Stuhl|Küche",
  en: "manufacturers?|makers?|brands?|compan(?:y|ies)|dealers?|suppliers?|studios?|showrooms?|stores?|shops?|designers?|products?|pieces?|collections?|furniture",
  fr: "fabricants?|marques?|entreprises?|maisons?|showrooms?|magasins?|designers?|produits?|meubles?|collections?|pièces?",
  it: "produttor[ei]|marchi?|aziend[ae]|rivenditor[ei]|showroom|negozi?|designer|prodott[oi]|mobili?|collezion[ei]|pezz[oi]",
};
const SOLE_CLAIM = {
  de: [
    `kein(?:e|en|er|es)? (?:\\p{L}+ )?ander(?:e|er|es|en) (?:\\p{L}+ )?(?:${SOLE_NOUN.de})`,
    `wie kein(?:e|er|es)? ander(?:e|er|es)`,
    `kein(?:e|er|es)? zweit(?:e|er|es)`,
    `niemand(?:em|en)? sonst`,
    `sonst niemand`,
    `nirgend(?:wo|s) sonst`,
    `nur (?:hier )?bei uns`,
    `als einzig(?:e|er|es|en)`,
    `(?:der|die|das) einzig(?:e|en) (?:\\p{L}+ )?(?:${SOLE_NOUN.de})`,
    `(?:sucht|suchen) (?:ihresgleichen|seinesgleichen)`,
  ],
  en: [
    `no other (?:\\p{L}+ )?(?:${SOLE_NOUN.en})`,
    `like no other`,
    `no one else`,
    `nobody else`,
    `nowhere else`,
    `only (?:here )?(?:at|with) us`,
    `(?:the|our) (?:only|sole) (?:\\p{L}+ )?(?:${SOLE_NOUN.en})`,
    `(?:is|are) (?:truly )?(?:unparalleled|unrivall?ed|unmatched|second to none)`,
  ],
  fr: [
    `aucune? autres? (?:\\p{L}+ )?(?:${SOLE_NOUN.fr})`,
    `comme aucune? autre`,
    `personne d['’]autre`,
    `nulle part ailleurs`,
    `(?:uniquement|seulement) chez nous`,
    `(?:le|la|les) seule?s? (?:\\p{L}+ )?(?:${SOLE_NOUN.fr})`,
    `(?:est|sont) sans (?:égal|égale|égaux|pareil|pareille)s?`,
  ],
  it: [
    `nessun(?:o|a)? altr[oa] (?:\\p{L}+ )?(?:${SOLE_NOUN.it})`,
    `nessun['’]altra (?:\\p{L}+ )?(?:${SOLE_NOUN.it})`,
    `come nessun(?:o|a)? altr[oa]`,
    `nessun(?:o|a)? (?:\\p{L}+ )?(?:${SOLE_NOUN.it}) (?:al mondo|oltre a)`,
    `da nessun['’] ?altra parte`,
    `solo da noi`,
    `(?:l['’]|il |la |gli |le |i )(?:unic[oaih]e?|sol[oaie]) (?:\\p{L}+ )?(?:${SOLE_NOUN.it})`,
    `(?:è|sono) senza (?:pari|eguali|uguali)`,
  ],
};
const MONTHS = {
  de: "Januar|Jänner|Februar|Feber|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember",
  en: "January|February|March|April|May|June|July|August|September|October|November|December",
  fr: "janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre",
  it: "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre",
};
const SENTENCE_DROP = {
  de: [
    `(?:wir|ich) (?:\\p{L}+ )?garantier(?:en|e)`,
    `garantiert`,
    `garantieren wir`,
    `(?:schon|bereits) (?:im|ab|Anfang|Ende|Mitte) (?:${MONTHS.de})`,
    `(?:ist|sind) unvergleichlich`,
    ...SOLE_CLAIM.de,
  ],
  en: [`we (?:can |will )?guarantee`, `guaranteed`, `as early as (?:${MONTHS.en})`, `(?:is|are) incomparable`, ...SOLE_CLAIM.en],
  fr: [`nous (?:vous )?garantissons`, `garanti(?:e|s|es)? (?:de|que)`, `dès (?:le mois d'|le mois de )?(?:${MONTHS.fr})`, `(?:est|sont) incomparables?`, ...SOLE_CLAIM.fr],
  it: [`garantiamo`, `vi garantiamo`, `già (?:a|ad|in|a partire da) (?:${MONTHS.it})`, `(?:è|sono) incomparabil[ei]`, ...SOLE_CLAIM.it],
};
const SENTENCE_RULES = Object.fromEntries(
  LOCALES.map((locale) => [locale, new RegExp(`${pre}(?:${SENTENCE_DROP[locale].join("|")})${post}`, "iu")])
);

// Plain spelling fixes in the backoffice copy (formal address „Sie … Ihren“).
const SPELLING = {
  de: [
    [new RegExp(`${pre}ihren Outdoorbereich${post}`, "gu"), "Ihren Outdoorbereich"],
    // Runde 9 (P5, r5-recht-inhalt P1-2): hyphen left from a line break.
    [new RegExp(`${pre}Ankleide-schr(ä|ae)nke`, "gu"), "Ankleideschr$1nke"],
    // QM content-legal r3 (ClassiCon): typo and the old spelling of the house name.
    [new RegExp(`${pre}Jeds Jahr${post}`, "gu"), "Jedes Jahr"],
    [new RegExp(`${pre}Home\\.Living${post}`, "gu"), "Home Living"],
  ],
};

// Opening/closing quotation marks a removed sentence may carry.
const OPEN_QUOTE = /^[„“"«‹‚]/u;
const CLOSE_QUOTE = /[“”"»›‘’]$/u;

/**
 * Splits plain text into sentences, keeping every character (the pieces join
 * back to the input). A sentence ends at . ! ? (plus a closing quote) followed
 * by a blank; not after a number („am 6. Mai“) or a one/two-letter
 * abbreviation („z. B.“).
 */
function splitSentences(text) {
  const out = [];
  let start = 0;
  const end = /[.!?…]+[“”"»›’]?(\s+)/gu;
  let m;
  while ((m = end.exec(text))) {
    const before = text.slice(start, m.index);
    const lastWord = before.match(/(\S+)$/u)?.[1] || "";
    if (/\d$/u.test(before) || /^\p{L}{1,2}$/u.test(lastWord.replace(/^[(„“"«]/u, ""))) continue;
    out.push(text.slice(start, m.index + m[0].length));
    start = m.index + m[0].length;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

/** Removes whole sentences with an own-voice promise (SENTENCE_DROP). */
export function dropPromiseSentences(text, locale = "de") {
  if (typeof text !== "string" || !text) return text ?? "";
  const rule = SENTENCE_RULES[locale] || SENTENCE_RULES.de;
  if (!rule.test(text)) return text;
  const sentences = splitSentences(text);
  let carryQuote = "";
  const kept = [];
  for (const sentence of sentences) {
    if (rule.test(sentence)) {
      const body = sentence.trim();
      // „Satz eins. Satz zwei.“ – removing the first sentence must not take
      // the opening quote with it, removing the last not the closing one.
      if (OPEN_QUOTE.test(body) && !CLOSE_QUOTE.test(body.replace(/[.!?…\s]+$/u, ""))) carryQuote += body.charAt(0);
      if (CLOSE_QUOTE.test(body) && !OPEN_QUOTE.test(body) && kept.length) {
        const last = kept.length - 1;
        kept[last] = kept[last].replace(/(\s*)$/u, `${body.slice(-1)}$1`);
      }
      continue;
    }
    if (carryQuote) {
      kept.push(sentence.replace(/^(\s*)/u, `$1${carryQuote}`));
      carryQuote = "";
    } else kept.push(sentence);
  }
  return kept.join("").replace(/\s+$/u, (tail) => (/\s$/u.test(text) ? tail : ""));
}

function fixSpelling(text, locale) {
  let out = text;
  for (const [re, to] of SPELLING[locale] || []) out = out.replace(re, to);
  return out;
}

const VOICE_RULES = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    HOUSE_VOICE[locale].map((rule) => ({
      ...rule,
      regex: new RegExp(`${pre}${rule.re}${rule.raw ? `(?![${L}])` : post}`, "giu"),
    })),
  ])
);

// Marks left by a dropped word: DROP = "a word was removed here",
// CAP = "upper-case the next letter" (the dropped word began a sentence).
const DROP = "\u0001";
const CAP = "\u0002";

// Articles that must change once the adjective after them is gone:
// „an exclusive selection“ → „a selection“, „gli esclusivi mobili“ → „i mobili“.
const ARTICLE_FIX = {
  en: [[new RegExp(`${pre}([Aa])n ${DROP}(?=${CAP}?[b-df-hj-np-tv-z])`, "giu"), "$1 "]],
  it: [[new RegExp(`${pre}([Gg])li ${DROP}(?=${CAP}?(?:[b-df-hj-np-rtvw]|s[aeiou]))`, "giu"), (m, g) => (g === "G" ? "I " : "i ")]],
};

/** Removes or replaces the house-voice words of one language in plain text. */
export function defuseHouseVoice(text, locale = "de") {
  if (typeof text !== "string" || !text) return text ?? "";
  const lang = VOICE_RULES[locale] ? locale : "de";
  let out = text;
  for (const rule of VOICE_RULES[lang]) {
    if (rule.drop) {
      // Word plus the following blank.
      out = out.replace(new RegExp(`${rule.regex.source}[ \t\u00a0]*`, "giu"), (match, ...args) => {
        const offset = args[args.length - 2];
        const next = args[args.length - 1].charAt(offset + match.length);
        const capital = match.charAt(0) !== match.charAt(0).toLowerCase();
        return DROP + (capital && /\p{L}/u.test(next) ? CAP : "");
      });
      continue;
    }
    rule.regex.lastIndex = 0;
    out = out.replace(rule.regex, (match, ...groups) => {
      const value = typeof rule.to === "function" ? rule.to(match, ...groups) : rule.to;
      return rule.raw ? value : keepCase(match, value);
    });
  }
  if (out === text) return text;
  for (const [re, to] of ARTICLE_FIX[lang] || []) out = out.replace(re, to);
  return (
    out
      .replace(new RegExp(`${CAP}(.)`, "gsu"), (m, c) => c.toUpperCase())
      .replaceAll(CAP, "")
      // A dropped word in front of punctuation leaves a blank: „sind exklusiv.“
      .replace(new RegExp(`[ \t]*${DROP}(?=[.,])`, "g"), "")
      .replaceAll(DROP, "")
      .replace(/(\S)[ \t]{2,}/g, "$1 ")
  );
}

// sanitizeClaims normalises blanks before punctuation; French typography
// needs them („Sur la photo : …“). Restored only where a blank follows.
function restoreFrenchSpacing(original, sanitized) {
  if (!/\s[:;!?]/.test(original)) return sanitized;
  return sanitized.replace(/([\p{L}\p{N}»)])([:;!?])(?=\s|$)/gu, "$1\u00a0$2").replace(/\u00a0/g, original.includes("\u00a0") ? "\u00a0" : " ");
}

/**
 * Backoffice news text as it may be shown: dealer claims and superlatives
 * via sanitizeClaims (src/lib/legal), then the house-voice words.
 * Paragraphs (blank lines) are kept; a paragraph without findings is
 * returned exactly as written.
 */
export function sanitizeNewsText(text, locale = "de", { sentences = true } = {}) {
  if (typeof text !== "string" || !text.trim()) return text ?? "";
  const lang = LOCALES.includes(locale) ? locale : "de";
  return text
    .split(/(\n\s*\n)/)
    .map((part, i) => {
      if (i % 2 === 1 || !part.trim()) return part;
      // Own-voice promises go sentence by sentence first (Runde 4, P1-4).
      const promiseFree = sentences ? dropPromiseSentences(part, lang) : part;
      if (!promiseFree.trim()) return "";
      let out = promiseFree;
      if (findClaims(promiseFree, { locale: lang }).length > 0) {
        const lead = promiseFree.match(/^\s*/)[0];
        const tail = promiseFree.match(/\s*$/)[0];
        out = lead + sanitizeClaims(promiseFree, undefined, { locale: lang }) + tail;
        if (lang === "fr") out = restoreFrenchSpacing(promiseFree, out);
      }
      // R9-P5 (recht P1-1): IT backoffice copy in the voi form of the site.
      return itVoi(fixSpelling(defuseHouseVoice(out, lang), lang), lang);
    })
    .join("");
}

// Text fields of a news record and the language they are written in.
// German fields: name1, beschreibung, metadata_description_de (+ table rows).
// (`name` alone is the backoffice record id, `keywords_*` are not shown.)
const GERMAN_FIELD = /^(?:name1|beschreibung|alt_text|metadata_description_de)$/;
const TRANSLATED_FIELD = /^(?:name|beschreibung|alt_text|metadata_description)_(en|fr|it)$/;
const TABLE_FIELD = /^artikel_table(?:_(en|fr|it))?$/;
// Row fields that are copy (artikel_name and unternehmen are product and
// brand names – they stay as the manufacturer writes them).
const ROW_TEXT = ["beschreibung"];

function languageOfField(key) {
  if (GERMAN_FIELD.test(key)) return "de";
  const m = key.match(TRANSLATED_FIELD);
  return m ? m[1] : null;
}

/**
 * Display copy of a backoffice news record: every text field sanitized in
 * its own language, `slug` from the RAW title (the URL never changes).
 * Withheld items are returned with `withheld: true` and are not rewritten –
 * their body is not rendered at all.
 * @param {object} item record from fetchNewsData()
 * @returns {object|null}
 */
export function presentNews(item) {
  if (!item || typeof item !== "object") return null;
  const slug = generateSlug(item.name1);
  const withheld = isWithheldNews(item);
  if (withheld) return { ...item, slug, withheld: true };
  const out = { ...item, slug, withheld: false };
  for (const [key, value] of Object.entries(item)) {
    const lang = languageOfField(key);
    if (lang && typeof value === "string") {
      // Headlines are never dropped as a sentence (an empty H1/<title>).
      out[key] = sanitizeNewsText(value, lang, { sentences: !/^name/.test(key) });
      continue;
    }
    const table = key.match(TABLE_FIELD);
    if (table && Array.isArray(value)) {
      const rowLang = table[1] || "de";
      out[key] = value.map((row) => {
        if (!row || typeof row !== "object") return row;
        const copy = { ...row };
        for (const field of ROW_TEXT) if (typeof copy[field] === "string") copy[field] = sanitizeNewsText(copy[field], rowLang);
        return copy;
      });
    }
  }
  return out;
}

/** Active, not withheld, with a slug – the articles a search engine may see. */
export function isIndexableNews(item) {
  return Boolean(item && item.status === "Aktiv" && !isWithheldNews(item) && generateSlug(item.name1));
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Runde 4 (r4-seo P1-5): 28 of 31 backoffice news carry `daten` 2025-01-14,
// the day of the data migration, not the day they were published. Such a
// date must not reach Google as datePublished (NewsArticle, og:article) or be
// shown. Rule: the known migration date, and any day shared by more than
// MAX_SAME_DAY articles, is no publication date. The sitemap lastmod is not
// affected (src/lib/seo/sitemapEntries.js: `modified || daten` is when the
// record last changed, which the migration did) – until the real dates are
// entered in the backoffice (owner/backoffice team).
export const MIGRATION_DATES = Object.freeze(["2025-01-14"]);
export const MAX_SAME_DAY = 3;

function dayOf(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}

/**
 * Days that are no real publication date: the migration date(s) plus every
 * day used by more than MAX_SAME_DAY records of `items`.
 * @param {object[]} items fetchNewsData()
 * @returns {Set<string>} YYYY-MM-DD
 */
export function untrustedNewsDays(items) {
  const count = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const day = dayOf(item?.daten || item?.date);
    if (day) count.set(day, (count.get(day) || 0) + 1);
  }
  const out = new Set(MIGRATION_DATES);
  for (const [day, n] of count) if (n > MAX_SAME_DAY) out.add(day);
  return out;
}

/**
 * Publication and modification date of one article as they may be published
 * (JSON-LD, Open Graph, visible), ISO strings or null. An untrusted `daten`
 * gives null for both, unless the record has its own `modified`.
 * @param {object} item one record
 * @param {object[]} items all records (to detect the shared day)
 * @returns {{published: string|null, modified: string|null}}
 */
export function newsDates(item, items) {
  const raw = toDate(item?.daten || item?.date);
  const trusted = raw && !untrustedNewsDays(items).has(raw.toISOString().slice(0, 10)) ? raw : null;
  const published = trusted ? trusted.toISOString() : null;
  const modified = toDate(item?.modified)?.toISOString() || published;
  return { published, modified };
}

/**
 * Sitemap input for /sitemap-news.xml and the news hub lastmod (R3-marken-seo).
 * Same rule as the list (/news) and the detail page (index vs. noindex):
 * active, not withheld, unique slug. lastModified = `modified`, else the
 * publication date `daten`/`date`, else null (the caller picks its static date).
 * @param {object[]} items fetchNewsData()
 * @returns {{slug: string, path: string, lastModified: Date|null}[]}
 */
export function newsSitemapEntries(items) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (!isIndexableNews(item)) continue;
    const slug = generateSlug(item.name1);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, path: `/news/${slug}`, lastModified: toDate(item.modified) || toDate(item.daten || item.date) });
  }
  return out;
}
