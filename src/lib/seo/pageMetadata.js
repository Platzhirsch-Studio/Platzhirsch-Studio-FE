// src/lib/seo/pageMetadata.js
// Shared generateMetadata() builder: title/description, canonical, hreflang
// for all four locales (+ x-default = German), Open Graph and Twitter. Same
// hreflang codes the rest of the site already uses (see news/[title]/page.js).

export const SITE_URL = "https://platzhirsch.studio";
export const SITE_NAME = "Platzhirsch Home Living";
export const LOCALES = ["de", "en", "fr", "it"];

// og:locale – ONE map for the whole site (R5-shell-seo, Masterplan AP6 Nr. 3
// "OG-Locale einheitlich"): German is Austrian German (same as the JSON-LD
// inLanguage "de-AT" and the home page), English is British English (home page).
export const OG_LOCALE = Object.freeze({ de: "de_AT", en: "en_GB", fr: "fr_FR", it: "it_IT" });
/** og:locale of a site locale (falls back to German). */
export const ogLocale = (locale) => OG_LOCALE[locale] || OG_LOCALE.de;
// Runde 2 (seo P1-8): the default share image is the typographic card
// (src/app/og-standard.png/route.js → ogDefaultImageResponse in ogCard.js),
// no longer /Images/Home/aboutHome.jpg – its origin is not documented
// (Marktresearch/recht/bildrechte.csv: "offen").
export const DEFAULT_OG_IMAGE = "/og-standard.png";

// Absolute URL of a page. `path` is the path after the locale prefix
// ("/produkte/beds"), or "" for the locale home.
export function localeUrl(locale, path = "") {
  return `${SITE_URL}/${locale}${path}`;
}

// The site-wide hreflang set. Every page uses this, so the codes can't drift:
//   de, de-AT, de-CH        → German page
//   en                      → English page
//   fr, fr-FR, fr-CH        → French page
//   it, it-IT, it-CH        → Italian page
//   x-default               → German page
// Plain "fr"/"it" catch speakers in any other country; the -CH variants serve
// Switzerland (and Liechtenstein) in each language.
// `urlForLocale(locale)` returns the page's absolute URL in that locale.
export function hreflangLanguages(urlForLocale) {
  const de = urlForLocale("de");
  const en = urlForLocale("en");
  const fr = urlForLocale("fr");
  const it = urlForLocale("it");
  return {
    de,
    "de-AT": de,
    "de-CH": de,
    en,
    fr,
    "fr-FR": fr,
    "fr-CH": fr,
    it,
    "it-IT": it,
    "it-CH": it,
    "x-default": de,
  };
}

// hreflang alternates from paths. `pathByLocale` is either one path shared by
// every locale or a { de, en, fr, it } map of translated paths.
export function hreflangAlternates(pathByLocale) {
  const pathFor = (locale) => (typeof pathByLocale === "string" ? pathByLocale : pathByLocale[locale] ?? pathByLocale.de);
  return hreflangLanguages((locale) => localeUrl(locale, pathFor(locale)));
}

// ---------------------------------------------------------------------------
// Rat 9,5 A15 (T6): snippet rules for the whole site.
//   - Title ≤ META_TITLE_MAX (60) with the suffix " | Platzhirsch Home Living",
//     or the short " | Platzhirsch" when the long one does not fit; separator
//     always "|". Too long → cut at a separator or word, never with "…".
//   - Description ≤ META_DESCRIPTION_MAX (150) as whole sentences, never "…".
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 150;

const SENTENCE_END = /[.!?»“"”)]$/u;
const plain = (text) =>
  String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const closeSentence = (t) => {
  const out = t.replace(/[\s,;:–—…-]+$/u, "").trim();
  return SENTENCE_END.test(out) ? out : out + ".";
};

/**
 * Meta description from any text (also CMS rich text): plain, one line,
 * ≤ max characters, whole sentences. If even the first sentence is longer,
 * it is shortened at a clause boundary (", ", "; ", " – ") or a word and
 * closed with a full stop – never with "…".
 */
export function clampDescription(text, max = META_DESCRIPTION_MAX) {
  const clean = plain(text);
  if (!clean) return "";
  if (clean.length < max) return closeSentence(clean);
  const sentences = clean.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/gu) || [clean];
  let out = "";
  for (const raw of sentences) {
    const next = out ? out + " " + raw.trim() : raw.trim();
    if (next.length > max) break;
    out = next;
  }
  if (out && out.length >= max * 0.4) return closeSentence(out);
  // The first (remaining) sentence is too long: clause boundary, else word.
  const head = out ? out + " " : "";
  const window = clean.slice(head.length, max - 1);
  const clause = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" – "), window.lastIndexOf(" — "), window.lastIndexOf(": "));
  const cut = clause > window.length * 0.45 ? window.slice(0, clause) : window.slice(0, Math.max(window.lastIndexOf(" "), 1));
  return closeSentence(head + cut);
}

// Plain-text, single-line meta description built from CMS rich text:
// ≤ maxLength (default 150) as whole sentences (clampDescription).
export function toMetaDescription(text, maxLength = META_DESCRIPTION_MAX) {
  return clampDescription(text, maxLength);
}

const SUFFIXES = [" | Platzhirsch Home Living", " | Platzhirsch"];
const OLD_SUFFIX = /\s+[|·–-]\s+Platzhirsch(?: Home Living)?(?: Lochau)?$/u;

/** Title without "…": cut at a separator (" – ", " | ", ": ", ", ", " & ") or a word. */
export function cutTitle(base, max = META_TITLE_MAX) {
  const clean = String(base || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const window = clean.slice(0, max);
  const at = Math.max(window.lastIndexOf(" – "), window.lastIndexOf(" | "), window.lastIndexOf(": "), window.lastIndexOf(", "), window.lastIndexOf(" & "));
  const cut = at > max * 0.3 ? window.slice(0, at) : window.slice(0, Math.max(window.lastIndexOf(" "), 1));
  return cut.replace(/[\s,;:–|&-]+$/u, "").trim();
}

/**
 * <title> within META_TITLE_MAX: an existing house suffix ("| Platzhirsch",
 * "· Platzhirsch", "| Platzhirsch Home Living") is normalised to the rule
 * above; a title without suffix is only shortened, no suffix is added.
 */
export function fitTitle(title, max = META_TITLE_MAX) {
  const clean = String(title || "").replace(/\s+/g, " ").trim();
  if (!OLD_SUFFIX.test(clean)) return cutTitle(clean, max);
  return titleWithSuffix(clean.replace(OLD_SUFFIX, ""), max);
}

// ---------------------------------------------------------------------------
// Runde 5 P6 (seo R4-offen): NO hreflang alternates on noindex pages. A
// noindex page that names its language versions sends contradictory signals
// (hreflang targets must be indexable, canonical pages). The builders below
// apply this themselves; pages that assemble `alternates` by hand use
// seoAlternates() with the same robots object they return.

/** True when `robots` (Next metadata robots object, string or boolean) allows indexing. */
export function isIndexable(robots) {
  if (robots === undefined || robots === null) return true;
  if (typeof robots === "string") return !/\bnoindex\b/i.test(robots);
  if (typeof robots === "boolean") return robots;
  return robots.index !== false;
}

/**
 * `alternates` for generateMetadata(): canonical always, `languages` only
 * when the page is indexable.
 * @param {{canonical:string, languages?:object, robots?:object|string}} o
 */
export function seoAlternates({ canonical, languages, robots }) {
  return isIndexable(robots) && languages ? { canonical, languages } : { canonical };
}

export function buildPageMetadata({
  locale,
  pathByLocale,
  title: rawTitle,
  description: rawDescription,
  image,
  imageAlt,
  type = "website",
  index = true,
}) {
  // Rat 9,5 A15: snippet rules (≤ 60 / ≤ 150, whole sentences, one suffix).
  const title = fitTitle(rawTitle);
  const description = rawDescription ? clampDescription(rawDescription) : rawDescription;
  const path = typeof pathByLocale === "string" ? pathByLocale : pathByLocale[locale] ?? pathByLocale.de;
  const url = localeUrl(locale, path);
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    robots: { index, follow: true },
    alternates: seoAlternates({ canonical: url, languages: hreflangAlternates(pathByLocale), robots: { index } }),
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      // No width/height: product/category images come from the CMS in any size.
      images: [{ url: ogImage, alt: imageAlt || title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ---------------------------------------------------------------------------
// German-only pages (landing pages, Yacht, Outdoor, Ezarri, the integrated
// tools) – F6, 28.10.2026. ONE builder, so hreflang and og:image cannot drift:
//   - hreflang only `de` + `x-default` (the other locales 404 on purpose; no
//     de-AT/de-CH duplicates, no links to 404 URLs – lesson of commit 6de7c13)
//   - canonical = the page itself (no query)
//   - og:image only with documented rights:
//       a) `image` passed by the page (e.g. Ezarri material, released by
//          Ezarri – Inhaber-Entscheidung Nr. 7), or
//       b) the typographic share card of the page (OG_CARDS below, rendered
//          by src/lib/seo/ogCard.js via the page's opengraph-image.js). No
//          photo: the /Images files have no documented release yet
//          (Marktresearch/recht/bildrechte.csv: "offen"), and Yacht must not
//          show Minotti/Custom-Line photos before the written release
//          (Inhaber-Entscheidung Nr. 9).
//       Neither → no og:image (better than an unreleased photo).
//   - title ≤ 60 and description ≤ 150 characters (Rat 9,5 A15: fitTitle,
//     clampDescription – whole sentences, never "…"). MAX_TITLE/MAX_DESCRIPTION
//     stay exported (65/165) for the callers that still clamp by hand.
// Other teams (F2) use deOnlyMetadata() read-only; to give a page a card, add
// it to OG_CARDS and put the two-line opengraph-image.js next to its page.js.

export const MAX_TITLE = 65;
export const MAX_DESCRIPTION = 165;
export const OG_CARD_SIZE = Object.freeze({ width: 1200, height: 630 });

/** Typographic share cards per German-only path: eyebrow + title (+ line). */
export const OG_CARDS = Object.freeze({
  "/yacht-interior": { eyebrow: "Boote · Yachten · Bootshäuser", title: "Yacht-Interieur am Bodensee", line: "Nehmen Sie Platz – an Bord." },
  "/outdoor-gartenplanung": { eyebrow: "Garten · Terrasse · Pool", title: "Gartenplanung und Outdoor am Bodensee" },
  "/kuechen-vorarlberg": { eyebrow: "Küchenplanung", title: "Designerküchen in Vorarlberg" },
  "/interior-design-vorarlberg": { eyebrow: "Interior Design", title: "Interior Design in Vorarlberg" },
  "/wohnzimmer-einrichten-vorarlberg": { eyebrow: "Wohnen", title: "Wohnzimmer einrichten in Vorarlberg" },
  "/moebel-bodensee": { eyebrow: "Designermöbel", title: "Designermöbel am Bodensee" },
  "/designermoebel-appenzell": { eyebrow: "Appenzellerland", title: "Designermöbel für Appenzell" },
  "/designermoebel-arlberg": { eyebrow: "Lech · Zürs · Warth · St. Anton", title: "Designermöbel für Chalets am Arlberg" },
  "/designermoebel-bregenz": { eyebrow: "Bregenz", title: "Designermöbel für Bregenz" },
  "/designermoebel-dornbirn": { eyebrow: "Dornbirn", title: "Designermöbel für Dornbirn" },
  "/designermoebel-feldkirch": { eyebrow: "Feldkirch · Oberland", title: "Designermöbel für Feldkirch" },
  "/designermoebel-friedrichshafen": { eyebrow: "Friedrichshafen", title: "Designermöbel für Friedrichshafen" },
  "/designermoebel-kempten": { eyebrow: "Kempten · Allgäu", title: "Designermöbel für Kempten" },
  "/designermoebel-konstanz": { eyebrow: "Konstanz · westlicher Bodensee", title: "Designermöbel für Konstanz" },
  "/designermoebel-liechtenstein": { eyebrow: "Vaduz · Schaan · Unterland", title: "Designermöbel für Liechtenstein" },
  "/designermoebel-lindau": { eyebrow: "Lindau", title: "Designermöbel für Lindau" },
  "/designermoebel-ravensburg": { eyebrow: "Ravensburg · Oberschwaben", title: "Designermöbel für Ravensburg" },
  "/designermoebel-rheintal": { eyebrow: "Widnau · Heerbrugg · Altstätten", title: "Designermöbel für das Rheintal" },
  "/designermoebel-st-gallen": { eyebrow: "St. Gallen · Ostschweiz", title: "Designermöbel für St. Gallen" },
  "/ki-assistenten": { eyebrow: "MCP-Server · WebMCP", title: "Platzhirsch für KI-Assistenten", line: "Katalog, Showroom und Arbeitsweise abfragen" },
});

/** Common line of every card (Kern-USP, Inhaber-Entscheidung Nr. 8). */
export const OG_CARD_FOOTER = "Von Hand gezeichnet, in 3D geplant · Showroom & Café in Lochau am Bodensee";

/** Default card (every page without a documented image). */
export const OG_DEFAULT_CARD = Object.freeze({
  eyebrow: "Designermöbel · Interior Design",
  title: "Platzhirsch Home Living",
  line: "Einrichtungsstudio mit Café am Bodensee",
});

/** Absolute URL of the page's typographic card, or null if it has none. */
export function ogCardUrl(path) {
  return OG_CARDS[path] ? `${localeUrl("de", path)}/opengraph-image` : null;
}

/**
 * "<title> | Platzhirsch Home Living" when it fits in max (Rat 9,5 A15: 60),
 * else the short " | Platzhirsch", else the title alone, cut at a separator or
 * a word boundary (no "…"). Runde 2.
 */
export function titleWithSuffix(title, max = META_TITLE_MAX) {
  const base = String(title || "").replace(/\s+/g, " ").trim();
  for (const suffix of SUFFIXES) if (base.length + suffix.length <= max) return base + suffix;
  return cutTitle(base, max);
}

/** Plain-text ≤ max characters, cut at a word boundary with "…". */
export function clampText(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–-]+$/, "")}…`;
}

/** hreflang of a German-only page: de + x-default → the German URL. */
export function deOnlyLanguages(path) {
  const de = localeUrl("de", path);
  return { de, "x-default": de };
}

/** og:image entry of the default card (absolute URL, with size and alt). */
export function defaultOgImage(alt = SITE_NAME) {
  return { url: `${SITE_URL}${DEFAULT_OG_IMAGE}`, ...OG_CARD_SIZE, alt };
}

/** og:image list for a German-only page (see the rules above). */
export function deOnlyOgImages(path, { image, imageAlt, title } = {}) {
  if (image) return [{ url: image, alt: imageAlt || title }];
  const card = ogCardUrl(path);
  return card ? [{ url: card, ...OG_CARD_SIZE, alt: imageAlt || OG_CARDS[path].title }] : [];
}

/**
 * generateMetadata() result for a German-only page.
 * @param {{path:string, title:string, description:string, image?:string, imageAlt?:string,
 *          robots?:object, canonicalUrl?:string, ogLocale?:string, ogTitle?:string, type?:string}} o
 *   title = the full <title> (suffix included); ogTitle = optional shorter share title.
 */
export function deOnlyMetadata({ path, title, description, image, imageAlt, robots = { index: true, follow: true }, canonicalUrl, ogLocale: ogLoc, ogTitle, type = "website" }) {
  const url = canonicalUrl || localeUrl("de", path);
  const fullTitle = fitTitle(title);
  const desc = clampDescription(description);
  const shareTitle = ogTitle ? cutTitle(ogTitle) : fullTitle;
  const images = deOnlyOgImages(path, { image, imageAlt, title: shareTitle });
  return {
    title: fullTitle,
    description: desc,
    robots,
    alternates: seoAlternates({ canonical: url, languages: deOnlyLanguages(path), robots }),
    openGraph: {
      type,
      url,
      title: shareTitle,
      description: desc,
      siteName: SITE_NAME,
      locale: ogLoc || ogLocale("de"),
      ...(images.length ? { images } : {}),
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: shareTitle,
      description: desc,
      ...(images.length ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
