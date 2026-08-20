import React from "react";
import KontaktSecond from "@/components/Kontakt/kontakt";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import {
  fetchContactKeywords,
  getLocalizedContactMetadata,
  getContactOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchKontaktKeywords";
import { ROUTES } from "@/utils/routing";
import KontaktLastSection from "@/components/Kontakt/KontaktLastSection";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getKontaktPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/contatto`;
    case "en":
      return `${baseUrl}/contact`;
    case "fr":
      return `${baseUrl}/contact`;
    case "de":
      return `${baseUrl}/kontakt`;
    default:
      return `${baseUrl}/kontakt`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Contattaci | Consulenza Design da Platzhirsch Studio";
    case "en": return "Contact Us | Design Consultation at Platzhirsch Studio";
    case "fr": return "Contactez-Nous | Conseil Design chez Platzhirsch Studio";
    default: return "Kontakt | Designberatung bei Platzhirsch Studio";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Contattate Platzhirsch Studio per consulenze di design, progetti personalizzati e informazioni sui prodotti.";
    case "en": return "Contact Platzhirsch Studio for design consultations, custom projects and product information.";
    case "fr": return "Contactez Platzhirsch Studio pour des consultations en design, des projets personnalisés et des informations sur les produits.";
    default: return "Kontaktieren Sie Platzhirsch Studio für Designberatungen, individuelle Projekte und Produktinformationen.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getKontaktPageUrl(locale);

  try {
    const contactKeywords = await fetchContactKeywords();

    if (!contactKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: {
            'de': getKontaktPageUrl('de'),
            'en': getKontaktPageUrl('en'),
            'fr': getKontaktPageUrl('fr'),
            'it': getKontaktPageUrl('it'),
            'x-default': getKontaktPageUrl('de'),
          }
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Studio",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Kontakt/questionmark.png", width: 1200, height: 630, alt: "Kontakt – Platzhirsch Studio" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Kontakt/questionmark.png"],
        },
      };
    }

    const meta = getLocalizedContactMetadata(contactKeywords, locale);
    const image = getContactOGImage(contactKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        languages: {
          'de': getKontaktPageUrl('de'),
          'en': getKontaktPageUrl('en'),
          'fr': getKontaktPageUrl('fr'),
          'it': getKontaktPageUrl('it'),
          'x-default': getKontaktPageUrl('de'),
        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Studio",
        images: [{
          url: image ? image : "/Images/Kontakt/questionmark.png",
          width: 1200,
          height: 630,
          alt: "Kontakt – Platzhirsch Studio",
        },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Kontakt/questionmark.png"],
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

  const titleOne = locale == "it" ? "Contatto" : locale == "en" ? "Contact" : locale == "fr" ? "Contact" : "Kontakt";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getKontaktPageUrl(locale);

  // Fetch keywords for image
  const contactKeywords = await fetchContactKeywords();
  const image = getContactOGImage(contactKeywords);

  const kontaktPath = ROUTES.kontakt[locale] ? `${ROUTES.kontakt[locale]}` : `/kontakt`;

  const BannerInfo = {
    image: image || "/Images/Newsletter/room.jpg",
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: titleOne, link: kontaktPath },
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
    description: "Kontaktieren Sie Platzhirsch Studio für Designberatungen, individuelle Projekte und Produktinformationen.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-DE",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `/${locale}` },
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
      <KontaktSecond />
      <KontaktLastSection />
    </div>
  );
}

export const revalidate = 3600;