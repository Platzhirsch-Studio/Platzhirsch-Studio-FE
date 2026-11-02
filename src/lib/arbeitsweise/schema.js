// src/lib/arbeitsweise/schema.js – JSON-LD der Seite /de/arbeitsweise (Konzept §8).
// WebPage + BreadcrumbList + FAQPage (dieselben 8 Fragen wie sichtbar, gleiche
// Reihenfolge) + Person „Harald Menghin“ (ohne jobTitle bis zur Bestätigung,
// image nur mit echtem Porträt). Kein HowTo, kein Review, kein AggregateRating.
// Rein, ohne Pakete (node --test). IDs wie src/lib/seo/structuredData.js.
// R5-fix P2: je Sprache (/<locale>/arbeitsweise), Texte aus arbeitsweiseCopy().
import { PATH, arbeitsweiseCopy } from "./copy.js";
import { MEDIA } from "./media.js";

export const SITE_URL = "https://platzhirsch.studio";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PAGE_URL = `${SITE_URL}/de${PATH}`;
export const IN_LANGUAGE = Object.freeze({ de: "de-AT", en: "en", fr: "fr-FR", it: "it-IT" }); // wie src/lib/seo/structuredData.js
/** Kanonische Adresse der Seite in `locale` (gleicher Pfad in allen Sprachen). */
export const pageUrl = (locale = "de") => `${SITE_URL}/${IN_LANGUAGE[locale] ? locale : "de"}${PATH}`;

const abs = (p) => (p ? `${SITE_URL}${p}` : undefined);

export function arbeitsweiseSchema(media = MEDIA, locale = "de") {
  const { CRUMBS, FAQ, HARALD, HERO, META, locale: l } = arbeitsweiseCopy(locale);
  const PAGE_URL = pageUrl(l);
  const lang = IN_LANGUAGE[l];
  const hero = media.rendering || media.handzeichnung;
  const crumbs = CRUMBS.map((c) => ({
    "@type": "ListItem",
    name: c.label,
    ...(c.href ? { item: c.href === "/" ? `${SITE_URL}/${l}` : `${SITE_URL}/${l}${c.href}` } : {}),
  })).map((c, i) => ({ ...c, position: i + 1 }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: HERO.title.replace(/\.$/, ""),
        description: META.description,
        inLanguage: lang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
        mentions: { "@id": `${PAGE_URL}#harald-menghin` },
        ...(hero?.src ? { primaryImageOfPage: abs(hero.src) } : {}),
      },
      { "@type": "BreadcrumbList", "@id": `${PAGE_URL}#breadcrumb`, itemListElement: crumbs },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        inLanguage: lang,
        mainEntity: FAQ.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@type": "Person",
        "@id": `${PAGE_URL}#harald-menghin`,
        name: HARALD.name,
        worksFor: { "@id": ORGANIZATION_ID },
        ...(media.portrait?.src ? { image: abs(media.portrait.src) } : {}),
      },
    ],
  };
}
