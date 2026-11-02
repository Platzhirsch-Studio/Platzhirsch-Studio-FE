// src/lib/service/winterlager/schema.js – URLs, hreflang, Brotkrumen und JSON-LD
// der Seite /[locale]/outdoor-winterservice (Service Nr. 3, DE/EN).
// WebPage + BreadcrumbList + Service (ohne Preis/Offer, bis der Inhaber Preise
// festlegt; kein areaServed in km, solange radiusKm leer ist). Kein Review.
// IDs wie src/lib/seo/structuredData.js. Rein (node --test).
import { WINTERLAGER_LOCALES, winterlagerCopy } from "./copy.js";

export const PATH = "/outdoor-winterservice";
export const SITE_URL = "https://platzhirsch.studio";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const IN_LANGUAGE = Object.freeze({ de: "de-AT", en: "en" });

export const pageUrl = (locale = "de") => `${SITE_URL}/${WINTERLAGER_LOCALES.includes(locale) ? locale : "de"}${PATH}`;

/** hreflang nur für die zwei Sprachen der Seite (+ x-default = de). */
export function languages() {
  return { de: pageUrl("de"), en: pageUrl("en"), "x-default": pageUrl("de") };
}

/**
 * Brotkrumen. Die Outdoor-Planung gibt es nur auf Deutsch, deshalb steht sie
 * nur in der deutschen Spur (EN: Home → Seite).
 */
export function crumbs(locale = "de") {
  const c = winterlagerCopy(locale);
  const home = { label: locale === "de" ? "Startseite" : "Home", href: "/" };
  return locale === "de" ? [home, { label: c.crumbs.section, href: "/outdoor-gartenplanung" }, { label: c.crumbs.page }] : [home, { label: c.crumbs.page }];
}

export function winterlagerSchema(locale = "de") {
  const loc = WINTERLAGER_LOCALES.includes(locale) ? locale : "de";
  const c = winterlagerCopy(loc);
  const url = pageUrl(loc);
  const lang = IN_LANGUAGE[loc];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: c.meta.title,
        description: c.meta.description,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs(loc).map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.label,
          ...(crumb.href ? { item: `${SITE_URL}/${crumb.href === "/outdoor-gartenplanung" ? "de" : loc}${crumb.href === "/" ? "" : crumb.href}` } : {}),
        })),
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: c.meta.title,
        serviceType: loc === "de" ? "Einlagerung und Pflege von Outdoor-Möbeln" : "Storage and care of outdoor furniture",
        description: c.meta.description,
        provider: { "@id": ORGANIZATION_ID },
        url,
        inLanguage: lang,
      },
    ],
  };
}
