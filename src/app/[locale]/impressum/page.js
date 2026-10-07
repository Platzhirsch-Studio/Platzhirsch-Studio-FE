import React from 'react';
import JsonLd from "@/components/Reusable/JsonLd";
import Impressum from "@/components/Impressum/impressumbanner";
import Content from "@/components/Impressum/impressum";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getImpressumPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/impressum`;
    case "en":
      return `${baseUrl}/impressum`;
    case "fr":
      return `${baseUrl}/impressum`;
    case "de":
    default:
      return `${baseUrl}/impressum`;
  }
}

// Helper function to get localized metadata
function getLocalizedMetadata(locale) {
  const metadataMap = {
    de: {
      title: "Impressum | Platzhirsch Home Living",
      description: "Informationen, Kontaktangaben und Unternehmensdaten des Platzhirsch Home Livings in Lochau. Transparenz & Vertrauen stehen bei uns an erster Stelle.",
      ogTitle: "Impressum",
      ogDescription: "Hier finden Sie alle rechtlichen Informationen zum Platzhirsch Home Living, inklusive Firmenbuchnummer, Geschäftsführung und Kontaktmöglichkeiten.",
    },
    en: {
      title: "Legal Notice | Platzhirsch Home Living",
      description: "Legal information, contact details and company data of Platzhirsch Home Living in Lochau. Transparency & trust are our top priorities.",
      ogTitle: "Legal Notice",
      ogDescription: "Here you will find all legal information about Platzhirsch Home Living, including commercial register number, management and contact options.",
    },
    fr: {
      title: "Mentions Légales | Platzhirsch Home Living",
      description: "Informations légales, coordonnées et données d'entreprise de Platzhirsch Home Living à Lochau. La transparence et la confiance sont nos priorités.",
      ogTitle: "Mentions Légales",
      ogDescription: "Vous trouverez ici toutes les informations légales concernant Platzhirsch Home Living, y compris le numéro du registre du commerce, la direction et les coordonnées.",
    },
    it: {
      title: "Note Legali | Platzhirsch Home Living",
      description: "Informazioni legali, contatti e dati aziendali di Platzhirsch Home Living a Lochau. Trasparenza e fiducia sono le nostre priorità.",
      ogTitle: "Note Legali",
      ogDescription: "Qui troverete tutte le informazioni legali su Platzhirsch Home Living, incluso il numero del registro delle imprese, la direzione e le opzioni di contatto.",
    },
  };

  return metadataMap[locale] || metadataMap.de;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getImpressumPageUrl(locale);
  const localizedMeta = getLocalizedMetadata(locale);

  return {
    title: localizedMeta.title,
    description: localizedMeta.description,
    // Legal page: must stay reachable, but noindex is standard hygiene (it was
    // pulling junk/competitor-name rankings). follow keeps equity flowing.
    robots: { index: false, follow: true },
    alternates: {
      canonical: PAGE_URL,
      languages: hreflangLanguages((l) => getImpressumPageUrl(l))
    },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      siteName: "Platzhirsch Home Living",
      images: [
        {
          url: "/Images/fallback-og.jpg",
          width: 1200,
          height: 630,
          alt: "Impressum",
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

  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getImpressumPageUrl(locale);

  const localizedMeta = getLocalizedMetadata(locale);

  const homeName = locale === "it" ? "Home" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const pageName = locale === "it" ? "Note Legali" : locale === "en" ? "Legal Notice" : locale === "fr" ? "Mentions Légales" : "Impressum";

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: pageName,
    description: localizedMeta.description,
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeName, item: `https://platzhirsch.studio/${locale}` },
        { "@type": "ListItem", position: 2, name: pageName, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <Impressum />
      <Content />
    </div>
  );
}

export const revalidate = 3600;