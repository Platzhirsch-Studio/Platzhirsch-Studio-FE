import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import PartnerSecond from "@/components/Partner/partner";
import { hreflangLanguages, ogLocale, DEFAULT_OG_IMAGE } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import {
  fetchPartnersKeywords,
  getLocalizedPartnersMetadata,
  validateOGType
} from "@/lib/api/Keywords/fetchPartnersKeywords";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getPartnerPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/partner`;
    case "en":
      return `${baseUrl}/about-us/partners`;
    case "fr":
      return `${baseUrl}/a-propos/partenaires`;
    case "de":
      return `${baseUrl}/ueber-uns/partner`;
    default:
      return `${baseUrl}/ueber-uns/partner`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    // Runde 2 (recht P2-7): plain "Partner", no advertising phrase – and the
    // CMS title ("Starke Partnerschaften") no longer overrides it.
    // Runde 5 P6 (seo): 30–60 characters, says what the page lists
    // (Partnerbetriebe in Vorarlberg), still without superlatives.
    case "it": return "Aziende partner in Vorarlberg | Platzhirsch Home Living";
    case "en": return "Partner companies in Vorarlberg | Platzhirsch Home Living";
    case "fr": return "Entreprises partenaires au Vorarlberg | Platzhirsch";
    default: return "Partnerbetriebe in Vorarlberg | Platzhirsch Home Living";
  }
};

// Description: our own, factual text wins over the CMS (QA Runde 1, P2-2:
// the CMS text still says "exklusiv"). The CMS keeps title, image and type.
const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Le aziende con cui Platzhirsch Home Living collabora in Vorarlberg e sul Lago di Costanza: immobili, costruzione, tecnica e gastronomia.";
    case "en": return "The companies Platzhirsch Home Living works with in Vorarlberg and around Lake Constance: real estate, building, technology and hospitality.";
    case "fr": return "Les partenaires de Platzhirsch Home Living au Vorarlberg et autour du lac de Constance : immobilier, construction, technique et restauration.";
    default: return "Mit diesen Unternehmen arbeitet Platzhirsch Home Living in Vorarlberg und am Bodensee zusammen: Immobilien, Bau, Technik und Gastronomie.";
  }
};

// The partners keyword endpoint has hung for ~30s under crawl (Sistrix
// load_time_too_high). Cap it so a slow backend degrades to the hardcoded fallback
// metadata instead of blocking page generation; the page body is static regardless.
const withTimeout = (promise, ms) =>
  Promise.race([
    Promise.resolve(promise).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getPartnerPageUrl(locale);

  try {
    // Use the new API function (capped at 5s so a slow backend can't hang the page).
    const partnersKeywords = await withTimeout(fetchPartnersKeywords(), 5000);

    if (!partnersKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getPartnerPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Partner – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: [DEFAULT_OG_IMAGE],
        },
      };
    }

    const meta = getLocalizedPartnersMetadata(partnersKeywords, locale);
    const safeType = validateOGType(meta?.type);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getPartnerPageUrl(l))
      },
      openGraph: {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            // Rat 9,5 B5: own OG image only; the CMS image has no documented rights (bildrechte.csv).
            url: DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            alt: "Partner – Platzhirsch Home Living",
          },
        ],
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        images: [DEFAULT_OG_IMAGE],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getPartnerPageUrl(l)) },
    };
  }
}

export default async function Page({ params }) {
  const { locale } = await params;


  const linkNameTwo =
    locale == "it"
      ? "Partner"
      : locale == "en"
        ? "Partner"
        : locale == "fr"
          ? "Partenaire"
          : "Partner";
  const Home = homeCrumbLabel(locale);

  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getPartnerPageUrl(locale);




  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: getLocalizedDescription(locale),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: BASE_URL },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <PartnerSecond />
    </div>
  );
}

export const revalidate = 3600;