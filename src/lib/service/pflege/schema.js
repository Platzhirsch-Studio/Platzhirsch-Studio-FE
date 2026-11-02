// src/lib/service/pflege/schema.js – JSON-LD und URLs der Seite /[locale]/pflege-service.
// WebPage + BreadcrumbList + Service (ohne Preis/Offer, bis der Inhaber Preise
// festlegt) + FAQPage (dieselben Fragen wie sichtbar). Kein Review/Rating.
// IDs wie src/lib/seo/structuredData.js. Rein (node --test).
import { LOCALES, PATH } from "./copy.js";
import { pflegeCopyAll } from "./copy-intl.js";

export const SITE_URL = "https://platzhirsch.studio";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const IN_LANGUAGE = Object.freeze({ de: "de-AT", en: "en", fr: "fr", it: "it" });
const SERVICE_TYPE = Object.freeze({ de: "Möbelpflege", en: "Furniture care", fr: "Entretien de meubles", it: "Cura dei mobili" });

export const pageUrl = (locale = "de") => `${SITE_URL}/${LOCALES.includes(locale) ? locale : "de"}${PATH}`;

/** hreflang für die vier Sprachen der Seite (+ x-default = de). */
export function languages() {
  return { de: pageUrl("de"), en: pageUrl("en"), fr: pageUrl("fr"), it: pageUrl("it"), "x-default": pageUrl("de") };
}

export function pflegeSchema(locale = "de") {
  const c = pflegeCopyAll(locale);
  const url = pageUrl(c.locale);
  const lang = IN_LANGUAGE[c.locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: c.META.title,
        description: c.META.description,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: c.CRUMBS.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.label,
          ...(crumb.href ? { item: `${SITE_URL}/${c.locale}${crumb.href === "/" ? "" : crumb.href}` } : {}),
        })),
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: c.META.title,
        serviceType: SERVICE_TYPE[c.locale] || SERVICE_TYPE.de,
        description: c.META.description,
        provider: { "@id": ORGANIZATION_ID },
        url,
        inLanguage: lang,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: lang,
        mainEntity: c.FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}
