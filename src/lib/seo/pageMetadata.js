// src/lib/seo/pageMetadata.js
// Shared generateMetadata() builder: title/description, canonical, hreflang
// for all four locales (+ x-default = German), Open Graph and Twitter. Same
// hreflang codes the rest of the site already uses (see news/[title]/page.js).

export const SITE_URL = "https://platzhirsch.studio";
export const SITE_NAME = "Platzhirsch Home Living";
export const LOCALES = ["de", "en", "fr", "it"];

const OG_LOCALE = { de: "de_DE", en: "en_US", fr: "fr_FR", it: "it_IT" };
const DEFAULT_OG_IMAGE = "/Images/Home/aboutHome.jpg";

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

// Plain-text, single-line, ≤ maxLength (cut at a word boundary) — for meta
// descriptions built from CMS rich text.
export function toMetaDescription(text, maxLength = 160) {
  const clean = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function buildPageMetadata({
  locale,
  pathByLocale,
  title,
  description,
  image,
  imageAlt,
  type = "website",
  index = true,
}) {
  const path = typeof pathByLocale === "string" ? pathByLocale : pathByLocale[locale] ?? pathByLocale.de;
  const url = localeUrl(locale, path);
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    robots: { index, follow: true },
    alternates: {
      canonical: url,
      languages: hreflangAlternates(pathByLocale),
    },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] || OG_LOCALE.de,
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
