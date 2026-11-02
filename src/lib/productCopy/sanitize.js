// src/lib/productCopy/sanitize.js
// Pure filter rules for the researched product copy
// (Marktresearch/content/produkte/*.json -> src/content/productCopy/de.json).
// Used by the generator (build.mjs) and by the unit tests. No '@/' imports,
// no 'server-only', no dependencies.

// Open research markers. A paragraph, fact or FAQ that contains one of them
// is dropped as a whole.
export const MARKER_RE = /\[\s*prüfen|nicht angegeben|unklar/iu;

// Values the researcher only read off image file names or captions, or that
// still have to be compared with a data sheet. Dropped sentence by sentence.
export const UNVERIFIED_RE = /bilddat|bildunterschrift|abgleichen|datenblatt prüfen/iu;

// Dealer / "official" claims. Only ClassiCon may be called a dealer, and the
// product copy does not need the claim at all, so every match is dropped.
export const DEALER_RE =
  /h(?:ä|ae)ndler|offiziell|autorisiert|vertragspartner|vertriebspartner|exklusivpartner|flagship|dealer|retailer|official|authori[sz]ed/iu;

// Superlatives and words the design bible bans ("Luxus", "exklusiv", "Traum",
// "größte", "beste", ...). Word start only, so "Zeitraum" stays.
export const SUPERLATIVE_RE =
  /(?<![\p{L}])(?:gr(?:ö|oe)(?:ß|ss)t|beste[nrsm]?(?![\p{L}])|bestes|führend|fuehrend|marktführ|einzigartig|unvergleich|unübertroffen|weltweit|perfekt|ultimativ|luxus|exklusiv|traum|nr\.?\s?1(?![\d])|nummer\s?(?:1|eins))/iu;

// Prices and price hints. "Preisgruppen" (fabric categories) is not a price
// and stays.
export const PRICE_RE =
  /€|(?<![\p{L}])(?:eur|euro|chf|preis|preise|aufpreis|kostet|kosten|rabatt|günstig|angebot)(?![\p{L}])/iu;

// Delivery-time promises.
export const DELIVERY_RE =
  /lieferzeit|liefertermin|lieferbar|ab lager|sofort verfügbar|vorrätig|innerhalb von \d+\s*(?:tagen|wochen)|in \d+\s*wochen/iu;

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

/** Reason a single sentence or short string must not be published, or null. */
export function rejectReason(text) {
  const s = String(text ?? "");
  if (MARKER_RE.test(s)) return "marker";
  if (UNVERIFIED_RE.test(s)) return "unverified";
  if (DEALER_RE.test(s)) return "dealer";
  if (SUPERLATIVE_RE.test(s)) return "superlative";
  if (PRICE_RE.test(s)) return "price";
  if (DELIVERY_RE.test(s)) return "delivery";
  return null;
}

// Sentence split: ., ! or ? followed by whitespace and an upper-case letter,
// quote or digit, but not after common abbreviations ("z. B.", "u. a.", "ca.").
const SPLIT_RE =
  /(?<=[.!?])(?<!(?:^|[\s(])(?:\p{L}|bzw|ca|Nr|inkl|evtl|usw|etc|St|Dr|vgl|ggf|Jh)\.)\s+(?=[\p{Lu}"„«(\d])/u;

export function splitSentences(text) {
  return String(text ?? "")
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * One paragraph of text_de. Returns { text, dropped[] }.
 * - Open marker anywhere -> the whole paragraph is dropped.
 * - Otherwise every sentence with an unverified value, a dealer claim, a
 *   superlative, a price or a delivery promise is dropped.
 */
export function sanitizeParagraph(paragraph) {
  const p = String(paragraph ?? "").trim();
  if (!p) return { text: "", dropped: [] };
  if (MARKER_RE.test(p)) return { text: "", dropped: [{ reason: "marker", text: p }] };
  const dropped = [];
  const kept = [];
  for (const sentence of splitSentences(p)) {
    const reason = rejectReason(sentence);
    if (reason) dropped.push({ reason, text: sentence });
    else kept.push(sentence);
  }
  return { text: kept.join(" "), dropped };
}

/**
 * One fact { wert, quelle, hinweis? }. Returns { value, source } or { dropped }.
 * Price segments ("…; 2 Kabeldurchlässe gegen Aufpreis") are cut out of the
 * value; the internal research note (hinweis) is never published.
 */
export function sanitizeFact(fact) {
  const value = typeof fact?.wert === "string" ? fact.wert.trim() : "";
  const source = typeof fact?.quelle === "string" ? fact.quelle.trim() : "";
  const note = typeof fact?.hinweis === "string" ? fact.hinweis : "";
  if (!value) return { dropped: "empty" };
  if (!/^https:\/\/\S+$/u.test(source)) return { dropped: "source" };
  if (MARKER_RE.test(value) || MARKER_RE.test(note)) return { dropped: "marker" };
  if (UNVERIFIED_RE.test(value) || UNVERIFIED_RE.test(note)) return { dropped: "unverified" };
  const segments = value.split(/\s*;\s*/u).filter(Boolean);
  const kept = segments.filter((seg) => !PRICE_RE.test(seg) && !DELIVERY_RE.test(seg));
  if (!kept.length) return { dropped: "price" };
  const joined = kept.join("; ");
  const reason = rejectReason(joined);
  if (reason) return { dropped: reason };
  return { value: joined, source, trimmed: kept.length !== segments.length };
}

/** FAQ item. Dropped as a whole if question or answer fails. */
export function sanitizeFaq(item) {
  const question = String(item?.frage ?? "").trim();
  const answer = String(item?.antwort ?? "").trim();
  if (!question || !answer) return { dropped: "empty" };
  const reason = rejectReason(question) || rejectReason(answer);
  if (reason) return { dropped: reason };
  return { question, answer };
}

/** Cut at a word boundary (no ellipsis, search snippets add their own). */
export function truncateAtWord(text, max) {
  const s = String(text ?? "").replace(/\s+/gu, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return cut
    .slice(0, lastSpace > max * 0.6 ? lastSpace : max)
    .replace(/[\s,;:–|-]+$/u, "")
    .trim();
}

/** Turns a German field label into a stable key ("Maße" -> "masse"). */
export function factKey(label) {
  return String(label ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
