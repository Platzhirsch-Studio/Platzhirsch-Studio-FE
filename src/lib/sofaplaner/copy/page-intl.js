// /fr/sofaplaner und /it/sofaplaner – serverseitige Seitentexte und SEO
// (Sprachen-Welle FR/IT, 01.11.2026; Muster: src/lib/hotel/content-intl.js
// und ./page-en.js). Deutsch bleibt der Mastertext (page.js, consent.js).
// Nur Server: page.js liest diese Texte und gibt sie als fertige Strings
// weiter – nichts davon landet in src/messages/*.json.
// Texte (FR mit frenchTypography(), IT mit «»): ./page-texts.js (reine Daten).
import { SITE_NAME, SITE_URL, localeUrl, ogLocale, seoAlternates } from "../../seo/pageMetadata.js";
import { ORGANIZATION_ID, WEBSITE_ID, IN_LANGUAGE, breadcrumbList, graph } from "../../seo/structuredData.js";
import { sourceCopy } from "./source.js";
import { sofaSeoIntl } from "./page-texts.js";
import { SOFA_PATH, sofaLanguages } from "./page-en.js";

export { sofaPageIntl, sofaSeoIntl } from "./page-texts.js";

export const SOFA_INTL_LOCALES = Object.freeze(["fr", "it"]);

const OG_IMAGE = `${SITE_URL}/og/sofaplaner.jpg`;

/** generateMetadata() von /fr|it/sofaplaner (robots wie die deutsche Seite). Vorher loadDict(locale). */
export function sofaMetadataIntl(locale, robots = { index: true, follow: true }) {
  const seo = sofaSeoIntl(locale);
  if (!seo) return {};
  const sc = sourceCopy(locale);
  const url = localeUrl(locale, SOFA_PATH);
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: seo.ogAlt };
  return {
    title: seo.title,
    description: seo.description,
    robots,
    // hreflang wie DE/EN (sofaLanguages, alle vier Sprachen); geteilte Pläne (noindex) ohne hreflang
    alternates: seoAlternates({ canonical: url, languages: sofaLanguages(), robots }),
    openGraph: { type: "website", url, title: sc.seoName, description: seo.description, siteName: SITE_NAME, locale: ogLocale(locale), images: [image] },
    twitter: { card: "summary_large_image", title: sc.seoName, description: seo.description, images: [image.url] },
  };
}

/** JSON-LD von /fr|it/sofaplaner: WebPage + BreadcrumbList + WebApplication (wie sofaSchemaEn). */
export function sofaSchemaIntl(locale) {
  const seo = sofaSeoIntl(locale);
  const sc = sourceCopy(locale);
  const url = localeUrl(locale, SOFA_PATH);
  const lang = IN_LANGUAGE[locale] || locale;
  const app = {
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name: sc.seoName,
    url,
    applicationCategory: "DesignApplication",
    operatingSystem: locale === "fr" ? "Navigateur web" : "Browser web",
    browserRequirements: locale === "fr" ? "Navigateur récent avec JavaScript" : "Browser aggiornato con JavaScript",
    inLanguage: lang,
    isAccessibleForFree: true,
    image: OG_IMAGE,
    description: seo.description,
    provider: { "@id": ORGANIZATION_ID },
  };
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: sc.seoName,
      description: seo.description,
      inLanguage: lang,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": app["@id"] },
    },
    breadcrumbList([{ name: seo.home, url: `/${locale}` }, { name: sc.seoName }], `${url}#breadcrumb`),
    app
  );
}
