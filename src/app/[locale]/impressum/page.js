import React from 'react';
import JsonLd from "@/components/Reusable/JsonLd";
import Impressum from "@/components/Impressum/impressumbanner";
import Content from "@/components/Impressum/impressum";
import { hreflangLanguages, ogLocale, DEFAULT_OG_IMAGE } from "@/lib/seo/pageMetadata";

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
      description: "Impressum von Platzhirsch Home Living in Lochau: Anbieter, Kontakt, Firmenbuch, Gewerberecht und Offenlegung nach § 25 MedienG.",
      ogTitle: "Impressum",
      ogDescription: "Anbieter, Kontakt, Firmenbuchnummer, Geschäftsführung und Offenlegung von Platzhirsch Home Living.",
    },
    en: {
      title: "Legal Notice | Platzhirsch Home Living",
      description: "Legal notice of Platzhirsch Home Living in Lochau: provider, contact, company register, trade law and disclosure (in German).",
      ogTitle: "Legal Notice",
      ogDescription: "Here you will find all legal information about Platzhirsch Home Living, including commercial register number, management and contact options.",
    },
    fr: {
      title: "Mentions Légales | Platzhirsch Home Living",
      description: "Mentions légales de Platzhirsch Home Living à Lochau : prestataire, contact, registre du commerce, droit professionnel et publication (en allemand).",
      ogTitle: "Mentions Légales",
      ogDescription: "Vous trouverez ici toutes les informations légales concernant Platzhirsch Home Living, y compris le numéro du registre du commerce, la direction et les coordonnées.",
    },
    it: {
      title: "Note Legali | Platzhirsch Home Living",
      description: "Note legali di Platzhirsch Home Living a Lochau: fornitore, contatti, registro delle imprese, diritto commerciale e informativa (in tedesco).",
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
          url: DEFAULT_OG_IMAGE, // Rat 9,5 B5: altes Teilen-Bild ohne geklärte Rechte ersetzt
          width: 1200,
          height: 630,
          alt: "Impressum",
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