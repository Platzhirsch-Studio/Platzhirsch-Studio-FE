import React from "react";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import CartPage from "@/components/CartPage/CartPage";
import { ROUTES } from "@/utils/routing";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getMerklistePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/lista-desideri`;
    case "en":
      return `${baseUrl}/wishlist`;
    case "fr":
      return `${baseUrl}/liste-de-souhaits`;
    case "de":
    default:
      return `${baseUrl}/merkliste`;
  }
}

// Helper function to get localized metadata
function getLocalizedMetadata(locale) {
  const metadataMap = {
    de: {
      title: "Merkliste | Platzhirsch Studio",
      description: "Verwalten Sie Ihre Lieblings-Möbel und Designprodukte in Ihrer persönlichen Merkliste bei Platzhirsch Studio. Sammeln Sie Inspirationen für Ihr Zuhause.",
      ogTitle: "Merkliste | Platzhirsch Studio",
      ogDescription: "Sammeln Sie Ihre Lieblings-Designprodukte und planen Sie Ihre Traumeinrichtung mit der Platzhirsch Studio Merkliste.",
    },
    en: {
      title: "Wishlist | Furniture Favorites – Platzhirsch Studio",
      description: "Manage your favorite furniture and design products in your personal wishlist at Platzhirsch Studio. Collect inspiration for your home.",
      ogTitle: "Wishlist | Platzhirsch Studio",
      ogDescription: "Collect your favorite design products and plan your dream interior with the Platzhirsch Studio wishlist.",
    },
    fr: {
      title: "Liste de Souhaits | Platzhirsch Studio",
      description: "Gérez vos meubles et produits de design préférés dans votre liste de souhaits chez Platzhirsch Studio. Collectez l'inspiration pour votre maison.",
      ogTitle: "Liste de souhaits | Platzhirsch Studio",
      ogDescription: "Collectez vos produits de design préférés et planifiez votre intérieur de rêve avec la liste de souhaits Platzhirsch Studio.",
    },
    it: {
      title: "Lista dei Desideri | Platzhirsch Studio",
      description: "Gestisci i tuoi mobili e prodotti di design preferiti nella tua lista dei desideri presso Platzhirsch Studio. Raccogli ispirazione per la tua casa.",
      ogTitle: "Lista dei desideri | Platzhirsch Studio",
      ogDescription: "Raccogli i tuoi prodotti di design preferiti e pianifica i tuoi interni da sogno con la lista dei desideri di Platzhirsch Studio.",
    },
  };

  return metadataMap[locale] || metadataMap.de;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getMerklistePageUrl(locale);
  const localizedMeta = getLocalizedMetadata(locale);

  return {
    title: localizedMeta.title,
    description: localizedMeta.description,
    // Wishlist is user-specific, thin, no organic value → keep it out of the index
    // but let link equity flow through (follow).
    robots: { index: false, follow: true },
    alternates: {
      canonical: PAGE_URL,
      languages: {
        'de': getMerklistePageUrl('de'),
        'en': getMerklistePageUrl('en'),
        'fr': getMerklistePageUrl('fr'),
        'it': getMerklistePageUrl('it'),
        'x-default': getMerklistePageUrl('de'),

      }
    },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      siteName: "Platzhirsch Studio",
      images: [
        {
          url: "/Images/fallback-og.jpg",
          width: 1200,
          height: 630,
          alt: "Platzhirsch Studio Merkliste",
        },
      ],
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
    },
    twitter: {
      card: "summary_large_image",
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      images: ["/Images/fallback-og.jpg"],
    },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;

  const titleOne = locale == "it" ? "Lista dei desideri" : locale == "en" ? "Wishlist" : locale == "fr" ? "Liste de souhaits" : "Merkliste";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getMerklistePageUrl(locale);

  const merkenlistPath = ROUTES.kontakt[locale] ? `${ROUTES.merkliste[locale]}` : `/merkliste`;


  const BannerInfo = {
    image: "/Images/Newsletter/room.jpg",
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: titleOne, link: merkenlistPath },
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
    description: "Verwalten Sie Ihre Lieblingsmöbel und Designprodukte in Ihrer persönlichen Merkliste.",
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
      <CartPage />
    </div>
  );
}

export const revalidate = 3600;