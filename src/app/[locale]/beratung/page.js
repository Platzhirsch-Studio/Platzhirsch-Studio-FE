import Advice from "@/components/Beratung/advice";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import BeratungClient from "@/components/BeratungClient/BeratungClient";
import {
  fetchConsultationKeywords,
  getLocalizedConsultationMetadata,
  getConsultationOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchBeratungKeywords";
import { ROUTES } from "@/utils/routing";

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

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Consulenza Design | Platzhirsch Home Living Lochau";
    case "en": return "Design Consulting | Platzhirsch Home Living Lochau";
    case "fr": return "Conseil en Design | Platzhirsch Home Living Lochau";
    default: return "Designberatung | Platzhirsch Home Living Lochau";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Consulenza esperta per il design della tua casa e ufficio. Soluzioni personalizzate per i tuoi spazi.";
    case "en": return "Expert consulting for your home and office design. Personalized solutions for your spaces.";
    case "fr": return "Conseil d'expert pour l'aménagement de votre maison et bureau. Solutions personnalisées pour vos espaces.";
    default: return "Expertenberatung für Ihr Zuhause und Büro. Maßgeschneiderte Lösungen für Ihre Räume.";
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
          languages: {
            'de-AT': getBeratungPageUrl('de'),
            'de': getBeratungPageUrl('de'),
            'en': getBeratungPageUrl('en'),
            'fr-FR': getBeratungPageUrl('fr'),
            'it-IT': getBeratungPageUrl('it'),
            'x-default': getBeratungPageUrl('de'),
          }
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
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de-AT': getBeratungPageUrl('de'),
          'de': getBeratungPageUrl('de'),
          'en': getBeratungPageUrl('en'),
          'fr-FR': getBeratungPageUrl('fr'),
          'it-IT': getBeratungPageUrl('it'),
          'x-default': getBeratungPageUrl('de'),

        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
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
      alternates: { canonical: PAGE_URL },
    };
  }
}

export default async function Home({ params }) {
  const { locale } = await params;

  const titleOne = locale == "it" ? "Consulenza" : locale == "en" ? "Consulting" : locale == "fr" ? "Conseil" : "Beratung";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

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
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: titleOne,
    description: "Professionelle Beratung für exklusives Design bei Platzhirsch Home Living - Maßgeschneiderte Lösungen für Ihr Zuhause und Büro.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: titleOne, item: PAGE_URL },
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
      <Advice />
      <BeratungClient />
    </div>
  );
}

export const revalidate = 3600;