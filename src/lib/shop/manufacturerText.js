// src/lib/shop/manufacturerText.js
// Render-time filter for manufacturer copy (Backoffice product texts, brand
// bios on the product page, the curated/imported data in src/lib/data/**).
// UWG / Design-Bibel §1 "Stimme": manufacturer praise ("unique", "leading",
// "unrivalled", "Luxus") would read as our own claim on our page, so the
// sentence is removed – never rewritten, never invented. Also removed:
// dealer / "official" wordings (ClassiCon excepted, CLAIM_REGISTER),
// availability and delivery promises ("Erhältlich bei …", "Lieferzeit 6
// Wochen", "in stock") and explicit price amounts.
//
// The rules themselves are central (src/lib/legal): findClaims (dealer in
// brand context + superlatives, 4 languages, claims.js) and the voice and
// delivery filter (luxury/exclusive/best, delivery/stock promises,
// legal/manufacturerText.js – moved there by R3-marken-seo).
//
// Pure module: relative imports with extension, no '@/', no 'server-only' –
// runs in Server Components, node --test and tools.
import { findClaims, toBrandSlug } from "../legal/claims.js";
import { hasDeliveryClaim, hasVoiceViolation } from "../legal/manufacturerText.js";

// Availability at a shop / delivery area promises (Katalog-Abnahme A1).
const AVAILABILITY_RE =
  /erh(?:ä|ae)ltlich (?:bei|im|in)|available (?:at|from|exclusively)|disponible (?:chez|à)|disponibil[ei] (?:da|presso)|lieferung[^.]{0,40}in ganz|delivery[^.]{0,40}throughout|livraison[^.]{0,40}dans toute|consegna[^.]{0,40}in tutta/iu;

// Delivery-time and stock promises (no lead times on the site, Bibel §11).
const DELIVERY_RE =
  /lieferzeit|liefertermin|sofort (?:lieferbar|verfügbar)|ab lager|vorrätig|lieferbar (?:in|innerhalb)|innerhalb von \d+\s*(?:tagen|wochen)|delivery time|lead time|in stock|ships? within|ready to ship|délai de livraison|en stock|livr(?:é|e)e? sous|tempi di consegna|pronta consegna|disponibile a magazzino/iu;

// Explicit amounts ("ab 2.400 €", "CHF 900", "EUR 1'200"); "Preisgruppe" stays.
const PRICE_RE = /€|(?<![\p{L}])(?:eur|euro|chf)\s?\d|\d[\d.,' ]*\s?(?:eur|euro|chf)(?![\p{L}])/iu;

// Voice additions the central lists do not cover yet: "the most iconic/
// respected …", "perfect" (Bibel-Verbotswort), "unvergleichlich".
const VOICE_EXTRA_RE = new RegExp(
  [
    String.raw`(?<![\p{L}])most (?:[\p{L}-]+ )?(?:respected|iconic|influential|prestigious|celebrated|renowned|famous|important|innovative|acclaimed|sought-after|recogni[sz]ed|luxurious|exclusive|beautiful|elegant|refined|comfortable)(?![\p{L}])`,
    String.raw`(?<![\p{L}])(?:perfekt|perfect|parfait|perfett)[\p{L}]*`,
    String.raw`(?<![\p{L}])(?:unvergleichlich|unübertroffen|unrivall?ed|unparalleled|unmatched|inégal|ineguagliabil)[\p{L}]*`,
  ].join("|"),
  "iu",
);

// Old CMS texts still say "Platzhirsch Studio" (Bibel §1: Platzhirsch Home Living).
const normalizeName = (text) => String(text ?? "").replace(/Platzhirsch[\s-]+Studio\b/g, "Platzhirsch Home Living");

/**
 * Reason one plain-text sentence must not be shown, or null.
 * @param {string} sentence
 * @param {{brand?: string}} [ctx] brand the text belongs to (dealer context)
 */
export function manufacturerClaimReason(sentence, ctx = {}) {
  const s = String(sentence ?? "");
  if (!s.trim()) return null;
  const brandSlug = ctx.brand ? toBrandSlug(ctx.brand) : undefined;
  const hits = findClaims(s, { brandSlug, brands: ctx.brand ? [ctx.brand] : [] });
  if (hits.some((h) => h.type === "dealer")) return "dealer";
  if (hits.length) return "superlative";
  if (hasVoiceViolation(s) || VOICE_EXTRA_RE.test(s)) return "superlative";
  if (AVAILABILITY_RE.test(s)) return "availability";
  if (DELIVERY_RE.test(s) || hasDeliveryClaim(s)) return "delivery";
  if (PRICE_RE.test(s)) return "price";
  return null;
}

const OPEN = "\u0001";
const CLOSE = "\u0002";
const PLACEHOLDER_RE = new RegExp(`${OPEN}\\d+${CLOSE}`, "g");

// Sentence split as in src/lib/legal/claims.js (punctuation + space + capital,
// not after "z. B.", "ca.", "Nr." …), but a sentence may start with inline-tag
// placeholders ("Weich. <strong>Ein</strong> …" -> 2 sentences).
const SPLIT_RE = new RegExp(
  `(?<=[.!?…])(?<!(?:^|[\\s(])(?:\\p{L}|bzw|ca|Nr|No|inkl|evtl|usw|etc|St|Dr|vgl|ggf)\\.)\\s+(?=(?:${OPEN}\\d+${CLOSE})*[\\p{Lu}"„«“‚(\\d])|\\n+`,
  "gu",
);
function splitSentences(text) {
  const out = [];
  let last = 0;
  for (const m of String(text).matchAll(SPLIT_RE)) {
    out.push({ text: text.slice(last, m.index), sep: m[0] });
    last = m.index + m[0].length;
  }
  out.push({ text: text.slice(last), sep: "" });
  return out;
}

const BLOCK_SPLIT_RE = /(<\/?(?:p|li|ul|ol|h[1-6]|div|br|blockquote)\b[^>]*>)/gi;
const INLINE = "strong|b|em|i|u|span|a|small|mark";
const EMPTY_INLINE_RE = new RegExp(`<(${INLINE})\\b[^>]*>\\s*</\\1>`, "gi");
const EMPTY_BLOCK_RE = /<(p|li|h[1-6]|div|blockquote)\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi;
const EMPTY_LIST_RE = /<(ul|ol)\b[^>]*>\s*<\/\1>/gi;

// One run of text between block tags: inline tags become placeholders, every
// failing sentence loses its text but keeps its tags (balanced markup).
function filterRun(run, ctx, removed) {
  if (!run.trim()) return run;
  const tags = [];
  const masked = run.replace(/<[^>]*>/g, (m) => {
    tags.push(m);
    return `${OPEN}${tags.length - 1}${CLOSE}`;
  });
  const out = splitSentences(masked)
    .map(({ text, sep }) => {
      const plain = text.replace(PLACEHOLDER_RE, "");
      const reason = manufacturerClaimReason(plain, ctx);
      if (!reason) return text + sep;
      removed.push({ reason, text: plain.trim() });
      return (text.match(PLACEHOLDER_RE) || []).join("");
    })
    .join("");
  return out.replace(PLACEHOLDER_RE, (m) => tags[Number(m.slice(1, -1))] ?? "");
}

function tidy(html) {
  let out = html;
  for (let i = 0; i < 3; i += 1) {
    out = out.replace(EMPTY_INLINE_RE, "").replace(EMPTY_BLOCK_RE, "").replace(EMPTY_LIST_RE, "");
  }
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/[ \t]+(<\/(?:p|li|h[1-6]|div|blockquote)>)/gi, "$1")
    .trim();
}

/**
 * Filters manufacturer text (plain or sanitized CMS HTML).
 * @param {string} text
 * @param {{brand?: string}} [ctx]
 * @returns {{ text: string, removed: {reason: string, text: string}[] }}
 */
export function filterManufacturerCopy(text, ctx = {}) {
  const removed = [];
  const src = normalizeName(text);
  if (!src.trim()) return { text: "", removed };
  const filtered = src
    .split(BLOCK_SPLIT_RE)
    .map((chunk, i) => (i % 2 === 1 ? chunk : filterRun(chunk, ctx, removed)))
    .join("");
  const out = tidy(filtered);
  // Nothing but tags left -> nothing to show.
  return { text: out.replace(/<[^>]*>/g, "").trim() ? out : "", removed };
}

/** String in, string out ("" if nothing survives). */
export function filterManufacturerText(text, ctx = {}) {
  return filterManufacturerCopy(text, ctx).text;
}

/** Paragraph list (CMS HTML paragraphs) -> only non-empty filtered paragraphs. */
export function filterManufacturerParagraphs(paragraphs, ctx = {}) {
  return (Array.isArray(paragraphs) ? paragraphs : []).map((p) => filterManufacturerText(p, ctx)).filter(Boolean);
}

// Text fields of the curated/imported catalog records (src/lib/data/**).
const TEXT_KEYS = new Set(["longDescription", "details", "description", "bio", "specifications", "compositions", "finishes", "text"]);

function deepFilter(value, ctx) {
  if (typeof value === "string") return filterManufacturerText(value, ctx);
  if (Array.isArray(value)) {
    return value.map((v) => deepFilter(v, ctx)).filter((v) => v !== "" && v != null);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const next = deepFilter(v, ctx);
      if (next !== "" && next != null) out[k] = next;
    }
    return out;
  }
  return value;
}

/**
 * A catalog record (STATIC_SHOP_PRODUCTS shape) with every manufacturer text
 * field filtered. Names, ids, images, keys and swatches stay untouched.
 */
export function filterManufacturerProduct(product) {
  if (!product || typeof product !== "object") return product;
  const ctx = { brand: product.brand };
  const out = { ...product };
  for (const key of Object.keys(product)) {
    if (key === "variants" && Array.isArray(product.variants)) {
      out.variants = product.variants.map((v) => {
        const nv = { ...v };
        for (const k of Object.keys(v || {})) if (TEXT_KEYS.has(k)) nv[k] = deepFilter(v[k], ctx);
        return nv;
      });
    } else if (TEXT_KEYS.has(key)) {
      out[key] = deepFilter(product[key], ctx);
    }
  }
  return out;
}

/** Brand / designer info ({ bio, … }) with a filtered bio; null if the bio is gone. */
export function filterInfoBio(info, ctx = {}) {
  if (!info) return null;
  const bio = filterManufacturerText(info.bio, ctx);
  return bio ? { ...info, bio } : null;
}

