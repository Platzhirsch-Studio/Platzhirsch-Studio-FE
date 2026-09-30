import React from "react";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import PresseSecond from "@/components/Presse/presse";
import PresseArticle from "@/components/Presse/pressearticle";
import {
  fetchPressKeywords,
  getLocalizedPressMetadata,
  getPressOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchPressKeywords";
import { ROUTES } from "@/utils/routing";

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

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Stampa & News | Rassegna Stampa di Platzhirsch Home Living";
    case "en": return "Press & News | Media Coverage of Platzhirsch Home Living";
    case "fr": return "Presse & Actualités | Platzhirsch Home Living dans les Médias";
    default: return "Presse & News | Pressestimmen zu Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Rassegna stampa e comunicati di Platzhirsch Home Living. News e aggiornamenti dal mondo del design esclusivo.";
    case "en": return "Press releases and news from Platzhirsch Home Living. Updates from the world of exclusive design.";
    case "fr": return "Communiqués de presse et actualités de Platzhirsch Home Living. Nouvelles du monde du design exclusif.";
    default: return "Pressemitteilungen und Neuigkeiten von Platzhirsch Home Living. Aktuelles aus der Welt des exklusiven Designs.";
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
          languages: {
            'de-AT': getPressePageUrl('de'),
            'de': getPressePageUrl('de'),
            'en': getPressePageUrl('en'),
            'fr-FR': getPressePageUrl('fr'),
            'it-IT': getPressePageUrl('it'),
            'x-default': getPressePageUrl('de'),

          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Presse/cool-living-room.jpg", width: 1200, height: 630, alt: "Presse – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Presse/cool-living-room.jpg"],
        },
      };
    }

    const meta = getLocalizedPressMetadata(pressKeywords, locale);
    const image = getPressOGImage(pressKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de-AT': getPressePageUrl('de'),
          'de': getPressePageUrl('de'),
          'en': getPressePageUrl('en'),
          'fr-FR': getPressePageUrl('fr'),
          'it-IT': getPressePageUrl('it'),
          'x-default': getPressePageUrl('de'),
        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/Presse/cool-living-room.jpg",
            width: 1200,
            height: 630,
            alt: "Presse – Platzhirsch Home Living",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Presse/cool-living-room.jpg"],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL },
    };
  }
}

export default async function Page({ params }) {
  const { locale } = await params;

  const linkNameOne = locale == "it" ? "SU DI NOI" : locale == "en" ? "ABOUT US" : locale == "fr" ? "À PROPOS" : "ÜBER UNS";
  const linkNameTwo = locale == "it" ? "Stampa" : locale == "en" ? "Press" : locale == "fr" ? "Presse" : "Presse";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getPressePageUrl(locale);

  // Fetch keywords for image
  const pressKeywords = await fetchPressKeywords();
  const image = getPressOGImage(pressKeywords);

  const pressePath = ROUTES.presse[locale] ? `${ROUTES.presse[locale]}` : `/ueber-uns/presse`;

  const BannerInfo = {
    image: image || "/Images/Presse/cool-living-room.jpg",
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: linkNameOne},
      { linkName: linkNameTwo, link: pressePath },
    ],
    title: linkNameTwo,
  };

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: "Pressebereich von Platzhirsch Home Living - Aktuelle News, Pressemitteilungen und Medienkontakt.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <SinglePageBanner info={BannerInfo} />
      <PresseSecond />
      <PresseArticle />
    </div>
  );
}

export const revalidate = 3600;