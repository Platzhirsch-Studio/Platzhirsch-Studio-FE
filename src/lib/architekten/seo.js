// src/lib/architekten/seo.js – Metadaten und JSON-LD der Seite /<locale>/architekten.
//
// DE, EN, FR und IT (FR/IT seit 01.11.2026) mit eigener Canonical; hreflang
// de (+ de-AT, de-CH), en, fr, it und x-default (= de), reziprok.
// JSON-LD: WebPage + BreadcrumbList + FAQPage (gleich den sichtbaren Fragen),
// Organisation per @id (QA Welle 2 P1-4 / P2-6). Keine Person, solange der
// Inhaber keine Ansprechperson eingetragen hat.
import { SITE_NAME, SITE_URL, clampDescription, fitTitle, ogLocale } from "@/lib/seo/pageMetadata";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID, graph } from "@/lib/seo/structuredData";
import { breadcrumbSchemaItems } from "@/lib/seo/breadcrumbs";
import { PATH, architektenCopy, isArchitektenLocale } from "./copy";

export const pageUrl = (locale) => `${SITE_URL}/${locale}${PATH}`;

export function architektenLanguages() {
  const de = pageUrl("de");
  return { de, "de-AT": de, "de-CH": de, en: pageUrl("en"), fr: pageUrl("fr"), it: pageUrl("it"), "x-default": de };
}

export function architektenMetadata(locale) {
  if (!isArchitektenLocale(locale)) return {};
  const { META } = architektenCopy(locale);
  const url = pageUrl(locale);
  // Rat 9,5 A15: Titel ≤ 60, Description ≤ 150 als ganzer Satz (ohne „…“).
  const title = fitTitle(META.title);
  const description = clampDescription(META.description);
  return {
    title, // META.title trägt den Markennamen schon
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages: architektenLanguages() },
    openGraph: { type: "website", url, title, description, siteName: SITE_NAME, locale: ogLocale(locale) },
  };
}

export function architektenSchema(locale) {
  const copy = architektenCopy(locale);
  const url = pageUrl(locale);
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: copy.HERO.title,
      description: copy.META.description,
      inLanguage: IN_LANGUAGE[locale] || locale,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbSchemaItems(copy.CRUMBS, `${SITE_URL}/${locale}`),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: copy.FAQ.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }
  );
}
