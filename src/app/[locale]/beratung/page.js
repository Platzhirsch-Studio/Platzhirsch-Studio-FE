import Advice from "@/components/Beratung/advice";
import JsonLd from "@/components/Reusable/JsonLd";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import { Suspense } from "react";
import BeratungClient from "@/components/BeratungClient/BeratungClient";
import {
  fetchConsultationKeywords,
  getLocalizedConsultationMetadata,
  getConsultationOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchBeratungKeywords";
import { ROUTES } from "@/utils/routing";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

// Helper functions for URL generation
function getBaseUrl(locale) {
  // Always include the locale in the URL, even for 'de'
  return `/${locale}`;
}

function getBeratungPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/consulenza`;
    case "en":
      return `${baseUrl}/consultation`;
    case "fr":
      return `${baseUrl}/conseil`;
    case "de":
      return `${baseUrl}/beratung`;
    default:
      return `${baseUrl}/beratung`;
  }
}

// Fallback metadata (the CMS consultation keywords win when set). Targets the
// "interior design" cluster (SISTRIX AT: 1,250 clicks/month, "innenarchitekt" 300).
const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Interior Design & Consulenza d'arredo in Vorarlberg | Platzhirsch";
    case "en": return "Interior Design & Consulting in Vorarlberg | Platzhirsch Home Living";
    case "fr": return "Interior Design & Conseil en aménagement au Vorarlberg | Platzhirsch";
    default: return "Interior Design & Einrichtungsberatung in Vorarlberg | Platzhirsch";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Interior design e consulenza d'arredo per casa, appartamento e spazi commerciali: progettazione di mobili, cucine e luce dallo showroom di Lochau sul Lago di Costanza – in tutta l'Austria, Germania e Svizzera.";
    case "en": return "Interior design and consulting for houses, apartments and commercial spaces: planning of furniture, kitchens and lighting from the showroom in Lochau on Lake Constance – across Austria, Germany and Switzerland.";
    case "fr": return "Interior design et conseil en aménagement pour maison, appartement et espaces professionnels : planification du mobilier, des cuisines et de l'éclairage depuis le showroom de Lochau, lac de Constance – Autriche, Allemagne, Suisse.";
    default: return "Innenarchitektur und Einrichtungsberatung für Haus, Wohnung und Objekt: Planung von Designermöbeln, Küchen und Licht aus dem Showroom in Lochau am Bodensee – in Vorarlberg, ganz Österreich, Deutschland und der Schweiz.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getBeratungPageUrl(locale);

  try {
    const consultationKeywords = await fetchConsultationKeywords();


    if (!consultationKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getBeratungPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Home/download.jpg", width: 1200, height: 630, alt: "Beratung – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Home/download.jpg"],
        },
      };
    }

    const meta = getLocalizedConsultationMetadata(consultationKeywords, locale);
    const image = getConsultationOGImage(consultationKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getBeratungPageUrl(l))
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/Home/download.jpg",
            width: 1200,
            height: 630,
            alt: "Beratung – Platzhirsch Home Living",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Home/download.jpg"],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getBeratungPageUrl(l)) },
    };
  }
}

export default async function Home({ params }) {
  const { locale } = await params;

  const titleOne = locale == "it" ? "Consulenza" : locale == "en" ? "Consulting" : locale == "fr" ? "Conseil" : "Beratung";
  const Home = locale == "it" ? "Home" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getBeratungPageUrl(locale);

  // Fetch keywords for image
  const consultationKeywords = await fetchConsultationKeywords();

  const image = getConsultationOGImage(consultationKeywords);
  const beratungPath = ROUTES.beratung[locale] ? `${ROUTES.beratung[locale]}` : `/beratung`;

  const BannerInfo = {
    image: image || "/Images/Home/download.jpg",
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: titleOne, link: beratungPath },
    ],
    title: titleOne,
  };

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://platzhirsch.studio${PAGE_URL}#webpage`,
    url: `https://platzhirsch.studio${PAGE_URL}`,
    name: titleOne,
    description: "Professionelle Beratung für exklusives Design bei Platzhirsch Home Living - Maßgeschneiderte Lösungen für Ihr Zuhause und Büro.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `https://platzhirsch.studio/${locale}` },
        { "@type": "ListItem", position: 2, name: titleOne, item: `https://platzhirsch.studio${PAGE_URL}` },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <SinglePageBanner info={BannerInfo} />
      <Advice />
      {/* Suspense: the wizard reads ?produkt= via useSearchParams. */}
      <Suspense fallback={null}>
        <BeratungClient />
      </Suspense>
    </div>
  );
}

export const revalidate = 3600;