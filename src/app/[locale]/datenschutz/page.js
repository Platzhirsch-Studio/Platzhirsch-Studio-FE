import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import Datenschutz from "@/components/Datenschutz/datenbanner";
import Content from "@/components/Datenschutz/datenschutz";
import Kurzfassung from "@/components/Datenschutz/kurzfassung";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getDatenschutzPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/datenschutz`;
    case "en":
      return `${baseUrl}/datenschutz`;
    case "fr":
      return `${baseUrl}/datenschutz`;
    case "de":
    default:
      return `${baseUrl}/datenschutz`;
  }
}

// Helper function to get localized metadata
function getLocalizedMetadata(locale) {
  const metadataMap = {
    de: {
      title: "Datenschutz | Platzhirsch Home Living",
      description: "Welche Daten Platzhirsch Home Living auf der Website, bei Anfragen, im Concierge, im Kundenportal und bei Google-Diensten verarbeitet, wozu und wie lange.",
      ogTitle: "Datenschutz",
      ogDescription: "Datenverarbeitung, Cookies und Ihre Rechte bei Platzhirsch Home Living in Lochau.",
    },
    en: {
      title: "Privacy Policy | Platzhirsch Home Living",
      description: "Which data Platzhirsch Home Living processes on the website, for enquiries, in the concierge, in the customer portal and for Google services. Summary in English, full text in German.",
      ogTitle: "Privacy Policy",
      ogDescription: "Data processing, cookies and your rights at Platzhirsch Home Living in Lochau: summary in English.",
    },
    fr: {
      title: "Protection des données | Platzhirsch Home Living",
      description: "Les données que Platzhirsch Home Living traite sur le site, pour les demandes, dans le concierge, dans l'espace client et pour les services Google. Résumé en français, texte complet en allemand.",
      ogTitle: "Protection des données",
      ogDescription: "Traitement des données, cookies et vos droits chez Platzhirsch Home Living à Lochau : résumé en français.",
    },
    it: {
      title: "Privacy | Platzhirsch Home Living",
      description: "Quali dati tratta Platzhirsch Home Living sul sito, per le richieste, nel concierge, nell'area clienti e per i servizi Google. Sintesi in italiano, testo completo in tedesco.",
      ogTitle: "Privacy",
      ogDescription: "Trattamento dei dati, cookie e i vostri diritti presso Platzhirsch Home Living a Lochau: sintesi in italiano.",
    },
  };

  return metadataMap[locale] || metadataMap.de;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getDatenschutzPageUrl(locale);
  const localizedMeta = getLocalizedMetadata(locale);

  return {
    title: localizedMeta.title,
    description: localizedMeta.description,
    // Privacy policy: legal boilerplate, no organic value → noindex, follow.
    robots: { index: false, follow: true },
    alternates: {
      canonical: PAGE_URL,
      languages: hreflangLanguages((l) => getDatenschutzPageUrl(l))
    },
    openGraph: {
      type: "website",
      url: PAGE_URL,
      title: localizedMeta.ogTitle,
      description: localizedMeta.ogDescription,
      siteName: "Platzhirsch Home Living",
      images: [
        {
          // Rat 9,5 B5: eigenes OG-Bild; das frühere Foto hat in bildrechte.csv „freigabe offen“.
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Platzhirsch Home Living Datenschutz",
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
  const PAGE_URL = getDatenschutzPageUrl(locale);

  const localizedMeta = getLocalizedMetadata(locale);

  const homeName = locale === "it" ? "Home" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const pageName = locale === "it" ? "Informativa sulla privacy" : locale === "en" ? "Privacy policy" : locale === "fr" ? "Protection des données" : "Datenschutz";

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
      <Datenschutz />
      <Kurzfassung locale={locale} />
      <Content />
    </div>
  );
}

export const revalidate = 3600;