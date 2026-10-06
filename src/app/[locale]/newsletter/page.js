import React from 'react';
import Newsletter from "@/components/Newsletter/newsletterbanner";
import Content from "@/components/Newsletter/newsletter";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getNewsletterPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/newsletter`;
    case "en":
      return `${baseUrl}/newsletter`;
    case "fr":
      return `${baseUrl}/newsletter`;
    case "de":
    default:
      return `${baseUrl}/newsletter`;
  }
}

// Helper function to get localized metadata
function getLocalizedMetadata(locale) {
  const metadataMap = {
    de: {
      title: "Newsletter | Wohnideen & Angebote – Platzhirsch Home Living",
      description: "Melden Sie sich zum Platzhirsch Home Living Newsletter an und erhalten Sie regelmäßig Einblicke, Inspiration und exklusive Angebote rund ums Interior Design.",
      ogTitle: "Newsletter – Exklusive Wohnideen & Angebote",
      ogDescription: "Bleiben Sie informiert mit dem Newsletter von Platzhirsch Home Living: Designtrends, Rabatte, Events & mehr direkt in Ihr Postfach.",
    },
    en: {
      title: "Newsletter | Exclusive Living Ideas – Platzhirsch Home Living",
      description: "Sign up for the Platzhirsch Home Living newsletter and receive regular insights, inspiration and exclusive offers on interior design.",
      ogTitle: "Newsletter – Exclusive Living Ideas & Offers",
      ogDescription: "Stay informed with the Platzhirsch Home Living newsletter: design trends, discounts, events & more straight to your inbox.",
    },
    fr: {
      title: "Newsletter | Idées Exclusives – Platzhirsch Home Living",
      description: "Inscrivez-vous à la newsletter de Platzhirsch Home Living et recevez des idées, de l'inspiration et des offres exclusives sur le design.",
      ogTitle: "Newsletter – Idées d'habitat exclusives & Offres",
      ogDescription: "Restez informé avec la newsletter de Platzhirsch Home Living : tendances design, réductions, événements et plus directement dans votre boîte aux lettres.",
    },
    it: {
      title: "Newsletter | Idee Esclusive – Platzhirsch Home Living",
      description: "Iscriviti alla newsletter di Platzhirsch Home Living e ricevi regolarmente approfondimenti, ispirazione e offerte esclusive sul design d'interni.",
      ogTitle: "Newsletter – Idee esclusive per la casa & Offerte",
      ogDescription: "Rimani informato con la newsletter di Platzhirsch Home Living: tendenze del design, sconti, eventi e altro ancora direttamente nella tua casella di posta.",
    },
  };

  return metadataMap[locale] || metadataMap.de;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getNewsletterPageUrl(locale);
  const localizedMeta = getLocalizedMetadata(locale);

  return {
    title: localizedMeta.title,
    description: localizedMeta.description,
    // Thin sign-up utility page with no organic search value → noindex, follow.
    robots: { index: false, follow: true },
    alternates: {
      canonical: PAGE_URL,
      languages: hreflangLanguages((l) => getNewsletterPageUrl(l))
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
          alt: "Newsletter Anmeldung Platzhirsch Home Living",
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
  const PAGE_URL = getNewsletterPageUrl(locale);

  const localizedMeta = getLocalizedMetadata(locale);

  const homeName = locale === "it" ? "Casa" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const pageName = "Newsletter"; // Same across all locales

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Newsletter />
      <Content />
    </div>
  );
}

export const revalidate = 3600;