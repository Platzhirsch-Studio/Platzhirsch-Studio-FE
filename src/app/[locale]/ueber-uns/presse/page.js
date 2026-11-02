import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import PresseSecond from "@/components/Presse/presse";
import PresseArticle from "@/components/Presse/pressearticle";
import {
  fetchPressKeywords,
  getLocalizedPressMetadata,
  validateOGType
} from "@/lib/api/Keywords/fetchPressKeywords";
import { hreflangLanguages, ogLocale, DEFAULT_OG_IMAGE } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getPressePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/stampa`;
    case "en":
      return `${baseUrl}/about-us/press`;
    case "fr":
      return `${baseUrl}/a-propos/presse`;
    case "de":
      return `${baseUrl}/ueber-uns/presse`;
    default:
      return `${baseUrl}/ueber-uns/presse`;
  }
}

// Runde 5 P6 (seo): 30–60 characters, what the page holds (press articles +
// press contact), no superlatives. Our own title wins over the CMS title
// (like the partner page) – the CMS may carry advertising phrases.
const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Rassegna stampa e contatti | Platzhirsch Home Living";
    case "en": return "Press coverage and press contact | Platzhirsch Home Living";
    case "fr": return "Articles de presse et contact presse | Platzhirsch";
    default: return "Presseberichte und Pressekontakt | Platzhirsch Home Living";
  }
};

// Description: our own, factual text wins over the CMS (QA Runde 1, P2-2:
// the CMS text still says "exklusiv"). The CMS keeps title, image and type.
const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Articoli di stampa su Platzhirsch Home Living, studio d’arredamento con caffè a Lochau, e contatto per la stampa.";
    case "en": return "Press coverage of Platzhirsch Home Living, the interior studio with café in Lochau, and our press contact.";
    case "fr": return "Articles de presse sur Platzhirsch Home Living, studio d’aménagement avec café à Lochau, et contact presse.";
    default: return "Presseberichte über Platzhirsch Home Living, das Einrichtungsstudio mit Café in Lochau, und unser Pressekontakt.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getPressePageUrl(locale);

  try {
    const pressKeywords = await fetchPressKeywords();

    if (!pressKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getPressePageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Presse – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: [DEFAULT_OG_IMAGE],
        },
      };
    }

    const meta = getLocalizedPressMetadata(pressKeywords, locale);
    const safeType = validateOGType(meta?.type);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getPressePageUrl(l))
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
            alt: "Presse – Platzhirsch Home Living",
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
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getPressePageUrl(l)) },
    };
  }
}

export default async function Page({ params }) {
  const { locale } = await params;

  const linkNameTwo = locale == "it" ? "Stampa" : locale == "en" ? "Press" : locale == "fr" ? "Presse" : "Presse";
  const Home = homeCrumbLabel(locale);

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getPressePageUrl(locale);





  // ✅ JSON-LD Structured Data
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
      <PresseSecond />
      <PresseArticle />
    </div>
  );
}

export const revalidate = 3600;