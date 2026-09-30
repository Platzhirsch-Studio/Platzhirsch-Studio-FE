import React from "react";
import Datenschutz from "@/components/Datenschutz/datenbanner";
import Content from "@/components/Datenschutz/datenschutz";

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
      title: "Datenschutz & Cookies bei Platzhirsch – DSGVO-konform",
      description: "Erfahren Sie, wie Platzhirsch Ihre Daten schützt (DSGVO), Cookies nutzt und Google Analytics einsetzt. Newsletter Datenschutz inklusive.",
      ogTitle: "Datenschutz – Ihre Privatsphäre",
      ogDescription: "Sicherheit & Transparenz: Alles über die Datenverarbeitung, Cookie-Nutzung und Webanalyse bei Platzhirsch Home Living.",
    },
    en: {
      title: "Privacy & Cookies at Platzhirsch – GDPR Compliant",
      description: "Learn how Platzhirsch protects your data (GDPR), uses cookies and Google Analytics. Newsletter privacy included.",
      ogTitle: "Privacy – Your Privacy Matters",
      ogDescription: "Security & Transparency: Everything about data processing, cookie usage and web analytics at Platzhirsch Home Living.",
    },
    fr: {
      title: "Confidentialité & Cookies chez Platzhirsch – Conforme RGPD",
      description: "Découvrez comment Platzhirsch protège vos données (RGPD), utilise les cookies et Google Analytics. Confidentialité des newsletters incluse.",
      ogTitle: "Confidentialité – Votre vie privée",
      ogDescription: "Sécurité & Transparence : Tout sur le traitement des données, l'utilisation des cookies et l'analyse web chez Platzhirsch Home Living.",
    },
    it: {
      title: "Privacy & Cookies presso Platzhirsch – Conforme GDPR",
      description: "Scopri come Platzhirsch protegge i tuoi dati (GDPR), utilizza cookie e Google Analytics. Privacy della newsletter inclusa.",
      ogTitle: "Privacy – La tua privacy",
      ogDescription: "Sicurezza & Trasparenza: Tutto sul trattamento dei dati, l'uso dei cookie e l'analisi web presso Platzhirsch Home Living.",
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
      languages: {
        'de-AT': getDatenschutzPageUrl('de'),
        'de': getDatenschutzPageUrl('de'),
        'en': getDatenschutzPageUrl('en'),
        'fr-FR': getDatenschutzPageUrl('fr'),
        'it-IT': getDatenschutzPageUrl('it'),
        'x-default': getDatenschutzPageUrl('de'),

      }
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
          alt: "Platzhirsch Home Living Datenschutz",
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
  const PAGE_URL = getDatenschutzPageUrl(locale);

  const localizedMeta = getLocalizedMetadata(locale);

  const homeName = locale === "it" ? "Casa" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const pageName = locale === "it" ? "Privacy" : locale === "en" ? "Privacy Policy" : locale === "fr" ? "Confidentialité" : "Datenschutz";

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: pageName,
    description: localizedMeta.description,
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeName, item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: pageName, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Datenschutz />
      <Content />
    </div>
  );
}

export const revalidate = 3600;