import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import CartPage from "@/components/CartPage/CartPage";
import { shopActive } from "@/lib/shop/mode";
import { shopCopy } from "@/lib/shop/copy";
// Service 10: „Als Wunschliste teilen“ (src/components/Wunschliste, Doku
// qa-screenshots/service/wunschliste-bau.md). Rendert nichts bei leerer Merkliste.
import ShareFromMerkliste from "@/components/Wunschliste/ShareFromMerkliste";
import { wunschlisteAvailable } from "@/lib/wunschliste/mode";
import { retentionMonths } from "@/lib/wunschliste/config";
import { ROUTES } from "@/utils/routing";
import { hreflangLanguages, ogLocale, DEFAULT_OG_IMAGE } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { getTranslations } from "next-intl/server";
import { selectionText } from "@/components/CartPage/selectionCopy";

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
      title: "Merkliste | Platzhirsch Home Living",
      description: "Verwalten Sie Ihre Lieblings-Möbel und Designprodukte in Ihrer persönlichen Merkliste bei Platzhirsch Home Living. Sammeln Sie Inspirationen für Ihr Zuhause.",
      ogTitle: "Merkliste | Platzhirsch Home Living",
      ogDescription: "Sammeln Sie Ihre Lieblings-Designprodukte und planen Sie Ihre Traumeinrichtung mit der Platzhirsch Home Living Merkliste.",
    },
    en: {
      title: "Wishlist | Furniture Favorites – Platzhirsch Home Living",
      description: "Manage your favorite furniture and design products in your personal wishlist at Platzhirsch Home Living. Collect inspiration for your home.",
      ogTitle: "Wishlist | Platzhirsch Home Living",
      ogDescription: "Collect your favorite design products and plan your dream interior with the Platzhirsch Home Living wishlist.",
    },
    fr: {
      title: "Liste de Souhaits | Platzhirsch Home Living",
      description: "Gérez vos meubles et produits de design préférés dans votre liste de souhaits chez Platzhirsch Home Living. Collectez l'inspiration pour votre maison.",
      ogTitle: "Liste de souhaits | Platzhirsch Home Living",
      ogDescription: "Collectez vos produits de design préférés et planifiez votre intérieur de rêve avec la liste de souhaits Platzhirsch Home Living.",
    },
    it: {
      title: "Lista dei Desideri | Platzhirsch Home Living",
      description: "Gestite i vostri mobili e prodotti di design preferiti nella vostra lista dei desideri di Platzhirsch Home Living. Raccogliete ispirazione per la vostra casa.",
      ogTitle: "Lista dei desideri | Platzhirsch Home Living",
      ogDescription: "Raccogliete i vostri prodotti di design preferiti e pianificate i vostri interni con la lista dei desideri di Platzhirsch Home Living.",
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
      languages: hreflangLanguages((l) => getMerklistePageUrl(l))
    },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      siteName: "Platzhirsch Home Living",
      images: [
        {
          url: DEFAULT_OG_IMAGE, // Rat 9,5 B5: altes Teilen-Bild ohne geklärte Rechte ersetzt
          width: 1200,
          height: 630,
          alt: "Platzhirsch Home Living Merkliste",
        },
      ],
      locale: ogLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;

  // Rat 9,5 B9 (T2): eine Überschrift „Ihre Auswahl“ (H1), CartPage hat keine zweite mehr.
  const tCart = await getTranslations({ locale, namespace: "cart" });
  const titleOne = selectionText(tCart, locale, "title") || (locale == "it" ? "Lista dei desideri" : locale == "en" ? "Wishlist" : locale == "fr" ? "Liste de souhaits" : "Merkliste");
  const Home = homeCrumbLabel(locale);

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getMerklistePageUrl(locale);

  const merklistePath = ROUTES.merkliste[locale] || ROUTES.merkliste.de;


  // Runde 5 (ux P2-9): no photo in the head any more. The former room photo
  // (/Images/Newsletter/room-1600.jpg) has no documented origin (bildrechte.csv:
  // "Herstellerbild oder eigene Aufnahme – unbekannt") and looks like a
  // manufacturer shot; next to it the empty list sat below the first screen
  // ("linke Spalte leer"). Without the image the server-rendered empty state
  // ("Noch nichts gemerkt.", CartPage) is in the first screen, nothing moves
  // after hydration (CLS 0) and the LCP is text.
  const BannerInfo = {
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: titleOne, link: merklistePath },
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
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `https://platzhirsch.studio/${locale}` },
        { "@type": "ListItem", position: 2, name: titleOne, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <SinglePageBanner info={BannerInfo} />
      <CartPage shop={shopActive()} shopLabel={shopCopy(locale).cartTab} />
      {wunschlisteAvailable() && <ShareFromMerkliste retentionMonths={retentionMonths()} />}
    </div>
  );
}

export const revalidate = 3600;