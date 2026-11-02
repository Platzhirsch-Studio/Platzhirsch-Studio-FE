// src/lib/stilfinder/seo.js – Metadaten und JSON-LD des Stil-Finders in
// DE, EN, FR, IT (Mehrsprachigkeit 01.11.2026, Muster wie src/lib/hotel/seo.js).
//
// /<locale>/stil-finder: eigene Canonical je Sprache, hreflang de (+ de-AT,
// de-CH), en, fr (+ -FR, -CH), it (+ -IT, -CH) und x-default (= de) – auf jeder
// Fassung derselbe Satz (reziprok, hreflangLanguages()). og:image = die
// Palettenkarte /og/stil-finder.jpg (ohne Text, sprachneutral).
// /<locale>/stil-finder/ergebnis/<profil>: noindex, follow, Canonical ohne ?a=,
// kein hreflang (Runde 5 P6: kein hreflang auf noindex-Seiten). Teilen-Bild aus
// opengraph-image.js / twitter-image.js.
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, hreflangLanguages, localeUrl, ogLocale, seoAlternates, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, graph } from "@/lib/seo/structuredData";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { fmt } from "@/components/Labs/Stilfinder/localize";
import { frenchSpacing } from "@/lib/hotel/content-intl";
import { stilfinderCopy } from "./intl";

export const STILFINDER_PATH = "/stil-finder";

// titleWithSuffix()/clampDescription() normalisieren jedes \s zu " " – das
// nähme dem Französischen die geschützten Leerzeichen vor ? ! : ; wieder weg.
const typo = (locale, text) => (locale === "fr" ? frenchSpacing(text) : text);
const title60 = (locale, text) => typo(locale, titleWithSuffix(text));
const fit60 = (locale, text) => typo(locale, fitTitle(text));
const desc150 = (locale, text) => typo(locale, clampDescription(text));
export const OG_IMAGE = `${SITE_URL}/og/stil-finder.jpg`;

export const stilfinderUrl = (locale) => localeUrl(locale, STILFINDER_PATH);

/** hreflang-Satz der Quiz-Seite (alle vier Sprachen + x-default). */
export const stilfinderLanguages = () => hreflangLanguages(stilfinderUrl);

/** generateMetadata() der Quiz-Seite /<locale>/stil-finder ({} bei unbekannter Sprache). */
export function stilfinderMetadata(locale) {
  const copy = stilfinderCopy(locale);
  if (!copy) return {};
  const { meta, schema } = copy.page;
  const url = stilfinderUrl(locale);
  const title = title60(locale, meta.title);
  const description = desc150(locale, meta.description);
  const shareTitle = fit60(locale, meta.ogTitle);
  const robots = { index: true, follow: true };
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: schema.alt };
  return {
    title,
    description,
    robots,
    alternates: seoAlternates({ canonical: url, languages: stilfinderLanguages(), robots }),
    openGraph: { type: "website", url, title: shareTitle, description, siteName: SITE_NAME, locale: ogLocale(locale), images: [image] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [image.url] },
  };
}

/** generateMetadata() einer Ergebnisseite (profile = mit Text-Overlay der Sprache). */
export function stilfinderResultMetadata(locale, profile) {
  const copy = stilfinderCopy(locale);
  if (!copy || !profile) return { robots: { index: false, follow: false } };
  const { meta } = copy.page;
  const url = localeUrl(locale, `${STILFINDER_PATH}/ergebnis/${profile.slug}`);
  const robots = { index: false, follow: true };
  const title = fit60(locale, fmt(meta.resultTitle, { name: profile.name }));
  const description = desc150(locale, `${profile.tagline} ${profile.text}`);
  const shareTitle = fit60(locale, fmt(meta.resultOgTitle, { name: profile.name }));
  return {
    title,
    description,
    robots,
    alternates: seoAlternates({ canonical: url, robots }),
    openGraph: { type: "website", url, title: shareTitle, description: profile.tagline, siteName: SITE_NAME, locale: ogLocale(locale) },
    twitter: { card: "summary_large_image", title: shareTitle, description: profile.tagline },
  };
}

/** JSON-LD-Graph der Quiz-Seite: WebPage + BreadcrumbList + WebApplication. */
export function stilfinderSchema(locale) {
  const copy = stilfinderCopy(locale);
  if (!copy) return null;
  const { meta, schema } = copy.page;
  const url = stilfinderUrl(locale);
  const description = desc150(locale, meta.description);
  const crumbs = [{ name: homeCrumbLabel(locale), url: `/${locale}` }, ...(schema.overview ? [schema.overview] : []), { name: schema.name }];
  const page = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: schema.name,
    description,
    inLanguage: IN_LANGUAGE[locale] || locale,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": `${url}#app` },
  };
  const app = {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: schema.name,
    url,
    applicationCategory: "LifestyleApplication",
    operatingSystem: schema.os,
    browserRequirements: schema.browser,
    inLanguage: IN_LANGUAGE[locale] || locale,
    isAccessibleForFree: true,
    image: OG_IMAGE,
    description,
    provider: { "@id": ORGANIZATION_ID },
  };
  return graph(page, breadcrumbList(crumbs, `${url}#breadcrumb`), app);
}
