import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import MarkenClient from "@/components/MarkenClient/Marken";
import fetchMarkenData from "@/lib/api/fetchMarkenData";
import {
  fetchBrandsKeywords,
  getLocalizedBrandsMetadata,
  getBrandsOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchBrandsKeywords";
import { ROUTES } from "@/utils/routing";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getMarkenPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/marche`;
    case "en":
      return `${baseUrl}/about-us/brands`;
    case "fr":
      return `${baseUrl}/a-propos/marques`;
    case "de":
      return `${baseUrl}/ueber-uns/marken`;
    default:
      return `${baseUrl}/ueber-uns/marken`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Le Nostre Marche | Design Esclusivo da Platzhirsch Studio";
    case "en": return "Our Brands | Exclusive Design Labels at Platzhirsch Studio";
    case "fr": return "Nos Marques | Design Exclusif chez Platzhirsch Studio";
    default: return "Unsere Marken | Exklusives Design bei Platzhirsch Studio";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Scopri le nostre marche di design esclusivo. Qualità e stile per la tua casa e ufficio.";
    case "en": return "Discover our exclusive design brands. Quality and style for your home and office.";
    case "fr": return "Découvrez nos marques de design exclusif. Qualité et style pour votre maison et bureau.";
    default: return "Entdecken Sie unsere exklusiven Designmarken. Qualität und Stil für Ihr Zuhause und Büro.";
  }
};

// ✅ DYNAMIC METADATA FUNCTION
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getMarkenPageUrl(locale);

  try {
    const brandsKeywords = await fetchBrandsKeywords();

    if (!brandsKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: {
            'de': getMarkenPageUrl('de'),
            'en': getMarkenPageUrl('en'),
            'fr': getMarkenPageUrl('fr'),
            'it': getMarkenPageUrl('it'),
          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Studio",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/default-og-image.jpg", width: 1200, height: 630, alt: "Designermarken – Platzhirsch Studio" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/default-og-image.jpg"],
        },
      };
    }

    const meta = getLocalizedBrandsMetadata(brandsKeywords, locale);
    const image = getBrandsOGImage(brandsKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de': getMarkenPageUrl('de'),
          'en': getMarkenPageUrl('en'),
          'fr': getMarkenPageUrl('fr'),
          'it': getMarkenPageUrl('it'),
          'x-default': getMarkenPageUrl('de'),

        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: image ? image : "/Images/Home/download.jpg",
            width: 1200,
            height: 630,
            alt: "Designermarken – Platzhirsch Studio",
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

// ✅ PAGE COMPONENT
export default async function Home({ params }) {
  const { locale } = await params;

  const linkNameOne = locale === "it" ? "SU DI NOI" : locale === "en" ? "ABOUT US" : locale === "fr" ? "À PROPOS" : "ÜBER UNS";
  const linkNameTwo = locale === "it" ? "Marche" : locale === "en" ? "Brands" : locale === "fr" ? "Marques" : "Marken";
  const homeName = locale === "it" ? "Casa" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getMarkenPageUrl(locale);

  const markenPath = ROUTES.marken[locale] ? `${ROUTES.marken[locale]}` : `/ueber-uns/marken`;
  // Fetch keywords for image
  const brandsKeywords = await fetchBrandsKeywords();
  const image = getBrandsOGImage(brandsKeywords);

  const BannerInfo = {
    image: image || "/Images/Home/download.jpg",
    links: [
      { linkName: homeName, link: `/` }, // Fixed: use locale prefix
      { linkName: linkNameOne },
      { linkName: linkNameTwo, link: markenPath },
    ],
    title: linkNameTwo,
  };

  const marken = await fetchMarkenData();

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: "Exklusive Designmarken bei Platzhirsch Studio - Qualität und Stil für Ihr Zuhause und Büro.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-DE",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeName, item: `/${locale}` },
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
      <MarkenClient marken={marken} />
    </div>
  );
}

export const revalidate = 3600;