// src/lib/dreilaender/seo.js – Metadaten und JSON-LD von /<locale>/dreilaender-rechner
// in EN, FR und IT (Sprachen-Ausbau 01.11.2026, Gruppe schweiz-service).
//
// DE bleibt bei werkzeugMetadata()/WerkzeugJsonLd (src/components/Labs/werkzeugSeo.js),
// bekommt aber denselben hreflang-Satz wie die übrigen Sprachen (reziprok):
// de (+ de-AT, de-CH), en, fr, it und x-default (= de). Jede Sprache hat ihre
// eigene Canonical. og:image wie DE: /og/dreilaender-rechner.jpg (eigene Ansicht
// des Werkzeugs, ohne Text in einer Sprache außer Ortsnamen).
import { SITE_NAME, SITE_URL, clampDescription, cutTitle, ogLocale, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID, breadcrumbList, graph } from "@/lib/seo/structuredData";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { PATH, dreilaenderCopy } from "./copy-intl";

export const pageUrl = (locale) => `${SITE_URL}/${locale}${PATH}`;
const OG_IMAGE = `${SITE_URL}/og/dreilaender-rechner.jpg`;

export function dreilaenderLanguages() {
  const de = pageUrl("de");
  return { de, "de-AT": de, "de-CH": de, en: pageUrl("en"), fr: pageUrl("fr"), it: pageUrl("it"), "x-default": de };
}

/** Metadaten der EN/FR/IT-Fassung; {} für DE und unbekannte Sprachen. */
export function dreilaenderMetadata(locale) {
  const copy = dreilaenderCopy(locale);
  if (!copy) return {};
  const url = pageUrl(locale);
  const title = titleWithSuffix(copy.meta.title);
  const description = clampDescription(copy.meta.description);
  const shareTitle = cutTitle(copy.meta.ogTitle);
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: `${copy.meta.name} – ${SITE_NAME}` };
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages: dreilaenderLanguages() },
    openGraph: { type: "website", url, title: shareTitle, description, siteName: SITE_NAME, locale: ogLocale(locale), images: [image] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [image.url] },
  };
}

/** JSON-LD (WebPage + BreadcrumbList + WebApplication) der EN/FR/IT-Fassung. */
export function dreilaenderSchema(locale) {
  const copy = dreilaenderCopy(locale);
  if (!copy) return null;
  const url = pageUrl(locale);
  const lang = IN_LANGUAGE[locale] || locale;
  const description = clampDescription(copy.meta.description);
  const app = {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: copy.meta.name,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web browser",
    inLanguage: lang,
    isAccessibleForFree: true,
    image: OG_IMAGE,
    featureList: copy.meta.appFeatures,
    description,
    provider: { "@id": ORGANIZATION_ID },
  };
  const page = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: copy.meta.name,
    description,
    inLanguage: lang,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": app["@id"] },
  };
  const crumbs = [{ name: homeCrumbLabel(locale), url: `/${locale}` }, { name: copy.meta.crumb }];
  return graph(page, breadcrumbList(crumbs, `${url}#breadcrumb`), app);
}
