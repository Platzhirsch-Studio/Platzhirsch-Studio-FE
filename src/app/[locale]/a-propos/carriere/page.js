import React from "react";
import KarriereSecond from "@/components/Karriere/karriere";
import KarrierePosition from "@/components/Karriere/karriereposition";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { ROUTES } from "@/utils/routing";
import {
  fetchCareerKeywords,
  getLocalizedCareerMetadata,
  getCareerOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchKarrierKeywords";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getKarrierePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/carriera`;
    case "en":
      return `${baseUrl}/about-us/career`;
    case "fr":
      return `${baseUrl}/a-propos/carriere`;
    case "de":
      return `${baseUrl}/ueber-uns/karriere`;
    default:
      return `${baseUrl}/ueber-uns/karriere`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Carriera | Lavora con Noi da Platzhirsch Home Living";
    case "en": return "Careers | Join the Platzhirsch Home Living Design Team";
    case "fr": return "Carrière | Rejoignez Platzhirsch Home Living";
    default: return "Karriere | Werden Sie Teil von Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Opportunità di carriera in Platzhirsch Home Living. Lavora con noi nel settore del design esclusivo.";
    case "en": return "Career opportunities at Platzhirsch Home Living. Work with us in exclusive design.";
    case "fr": return "Opportunités de carrière chez Platzhirsch Home Living. Travaillez avec nous dans le design exclusif.";
    default: return "Karrieremöglichkeiten bei Platzhirsch Home Living. Arbeiten Sie mit uns im exklusiven Design.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getKarrierePageUrl(locale);

  try {
    // Use the new API function
    const careerKeywords = await fetchCareerKeywords();

    if (!careerKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: {
            'de-AT': getKarrierePageUrl('de'),
            'de': getKarrierePageUrl('de'),
            'en': getKarrierePageUrl('en'),
            'fr-FR': getKarrierePageUrl('fr'),
            'it-IT': getKarrierePageUrl('it'),
            'x-default': getKarrierePageUrl('de'),
          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/UberUns/livingroom-view.jpg", width: 1200, height: 630, alt: "Karriere bei Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/UberUns/livingroom-view.jpg"],
        },
      };
    }

    const meta = getLocalizedCareerMetadata(careerKeywords, locale);
    const image = getCareerOGImage(careerKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/UberUns/livingroom-view.jpg",
            width: 1200,
            height: 630,
            alt: "Karriere bei Platzhirsch Home Living",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/UberUns/livingroom-view.jpg"],
      },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de-AT': getKarrierePageUrl('de'),
          'de': getKarrierePageUrl('de'),
          'en': getKarrierePageUrl('en'),
          'fr-FR': getKarrierePageUrl('fr'),
          'it-IT': getKarrierePageUrl('it'),
          'x-default': getKarrierePageUrl('de'),

        }
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

  const linkNameOne =
    locale == "it"
      ? "SU DI NOI"
      : locale == "en"
        ? "ABOUT US"
        : locale == "fr"
          ? "À PROPOS"
          : "ÜBER UNS";
  const linkNameTwo =
    locale == "it"
      ? "Carriera"
      : locale == "en"
        ? "Career"
        : locale == "fr"
          ? "Carrière"
          : "Karriere";
  const Home =
    locale == "it"
      ? "Casa "
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";

  const karriere = await fetchKarriereData();

  const careerKeywords = await fetchCareerKeywords();

  const image = getCareerOGImage(careerKeywords);

  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getKarrierePageUrl(locale);

  const karrierePath = ROUTES.karriere[locale] ? `${ROUTES.karriere[locale]}` : `/ueber-uns/karriere`;

  const BannerInfo = {
    image: image,
    links: [
      {
        linkName: Home,
        link: "/",
      },
      {
        linkName: linkNameOne,
      },
      {
        linkName: linkNameTwo,
        link: karrierePath,
      },
    ],
    title: linkNameTwo,
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: "Karrieremöglichkeiten bei Platzhirsch Home Living - Arbeiten Sie mit uns im exklusiven Designbereich.",
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
      <KarriereSecond />
      <KarrierePosition karriere={karriere} />
    </div>
  );
}

export const revalidate = 3600;