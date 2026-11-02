// src/lib/hotel/seo.js – Metadaten und JSON-LD der Seite /<locale>/hotel-objekt.
//
// Vier Sprachen (DE, EN, FR, IT – FR/IT seit Inhaber-Entscheidung 01.11.2026):
// eigene Canonical je Sprache, hreflang de (+ de-AT, de-CH), en, fr, it und
// x-default (= de), auf jeder Sprachfassung derselbe Satz (reziprok).
// og:image = die typografische Karte der Seite (./opengraph-image.js), kein
// Foto ohne dokumentierte Rechte.
// JSON-LD: WebPage + BreadcrumbList + Service + FAQPage, Organisation per @id.
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, ogLocale, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { ORGANIZATION_ID, WEBSITE_ID, IN_LANGUAGE, graph } from "@/lib/seo/structuredData";
import { breadcrumbSchemaItems, homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { PATH, hotelCopy } from "./content";

export const pageUrl = (locale) => `${SITE_URL}/${locale}${PATH}`;

export function hotelLanguages() {
  const de = pageUrl("de");
  return { de, "de-AT": de, "de-CH": de, en: pageUrl("en"), fr: pageUrl("fr"), it: pageUrl("it"), "x-default": de };
}

export function hotelMetadata(locale) {
  const copy = hotelCopy(locale);
  if (!copy) return {};
  const url = pageUrl(locale);
  // Rat 9,5 A15: Titel ≤ 60, Description ≤ 150 als ganzer Satz (ohne „…“).
  const title = titleWithSuffix(copy.meta.title);
  const description = clampDescription(copy.meta.description);
  const image = { url: `${url}/opengraph-image`, width: 1200, height: 630, alt: `${copy.meta.ogTitle} – ${SITE_NAME}` };
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages: hotelLanguages() },
    openGraph: {
      type: "website",
      url,
      title: fitTitle(copy.meta.title),
      description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

/** Breadcrumb-Einträge wie die sichtbare Leiste: Startseite › Hotel & Objekt. */
export function hotelCrumbs(locale) {
  const copy = hotelCopy(locale);
  return [{ label: homeCrumbLabel(locale), href: "/" }, { label: copy.hero.crumb }];
}

export function hotelSchema(locale) {
  const copy = hotelCopy(locale);
  const url = pageUrl(locale);
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: copy.hero.title,
      description: copy.meta.description,
      inLanguage: IN_LANGUAGE[locale] || locale,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": `${url}#service` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbSchemaItems(hotelCrumbs(locale), `${SITE_URL}/${locale}`),
    },
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: copy.schema.serviceName,
      serviceType: copy.schema.serviceType,
      description: copy.schema.description,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: copy.schema.areaServed.map((name) => ({ "@type": "AdministrativeArea", name })),
      url,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: copy.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }
  );
}
