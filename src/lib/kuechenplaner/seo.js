// src/lib/kuechenplaner/seo.js – Metadaten und JSON-LD von /<locale>/kuechenplaner
// (DE, EN, FR, IT seit 01.11.2026; Muster: src/lib/hotel/seo.js).
//
// Eigene Canonical je Sprache, hreflang de (+ de-AT, de-CH), en, fr, it und
// x-default (= de), auf jeder Sprachfassung derselbe Satz (reziprok).
// og:image = die eigene Ansicht des Werkzeugs (public/og/kuechenplaner.jpg, ein
// Grundriss mit Modul-Kürzeln, ohne Sprachtext) – Alt-Text je Sprache.
// JSON-LD: WebPage + BreadcrumbList + WebApplication (wie werkzeugSeo.js), dazu
// FAQPage in PlanerGuide.js. Die Druckansicht ist nie indexiert.
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, ogLocale, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, graph } from "@/lib/seo/structuredData";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { PATH, kpPageCopy } from "./content";

export const pageUrl = (locale) => `${SITE_URL}/${locale}${PATH}`;
export const OG_IMAGE = `${SITE_URL}/og/kuechenplaner.jpg`;

export function kpLanguages() {
  const de = pageUrl("de");
  return { de, "de-AT": de, "de-CH": de, en: pageUrl("en"), fr: pageUrl("fr"), it: pageUrl("it"), "x-default": de };
}

/** <title> der Sprache (≤ 60 Zeichen): DE wie bisher (fitTitle), sonst mit Marken-Zusatz. */
export function kpTitle(locale) {
  const copy = kpPageCopy(locale);
  if (!copy) return "";
  return locale === "de" ? fitTitle(copy.meta.title) : titleWithSuffix(copy.meta.title);
}

export function kpMetadata(locale) {
  const copy = kpPageCopy(locale);
  if (!copy) return {};
  const url = pageUrl(locale);
  const title = kpTitle(locale);
  const description = clampDescription(copy.meta.description);
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: copy.meta.imageAlt };
  const ogTitle = fitTitle(copy.meta.ogTitle);
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages: kpLanguages() },
    openGraph: { type: "website", url, title: ogTitle, description, siteName: SITE_NAME, locale: ogLocale(locale), images: [image] },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: [image.url] },
  };
}

/** JSON-LD-Graph: WebPage, BreadcrumbList (Startseite › [Planen & Erleben, nur DE] › Küchenplaner), WebApplication. */
export function kpSchema(locale) {
  const copy = kpPageCopy(locale);
  const url = pageUrl(locale);
  const lang = IN_LANGUAGE[locale] || locale;
  const crumbs = [
    { name: homeCrumbLabel(locale), url: `/${locale}` },
    ...(copy.crumbs.overview ? [{ name: copy.crumbs.overview, url: "/de/leistungen" }] : []),
    { name: copy.meta.appName },
  ];
  const page = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: copy.meta.appName,
    description: copy.meta.description,
    inLanguage: lang,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": `${url}#app` },
  };
  const app = {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: copy.meta.appName,
    url,
    applicationCategory: "DesignApplication",
    operatingSystem: "Webbrowser",
    browserRequirements: copy.meta.browser,
    inLanguage: lang,
    isAccessibleForFree: true,
    image: OG_IMAGE,
    featureList: copy.meta.features,
    description: copy.meta.description,
    provider: { "@id": ORGANIZATION_ID },
  };
  return graph(page, breadcrumbList(crumbs, `${url}#breadcrumb`), app);
}
