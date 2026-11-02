import React from 'react';
import JsonLd from "@/components/Reusable/JsonLd";
import Newsletter from "@/components/Newsletter/newsletterbanner";
import Content from "@/components/Newsletter/NewsletterContent";
import { hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { archivAusgaben } from "@/lib/kundenbetreuung/newsletter/newsletter";

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
      description: "Der Newsletter von Platzhirsch Home Living: neue Stücke in der Ausstellung in Lochau, Einladungen ins Haus und Ideen fürs Einrichten.",
      ogTitle: "Newsletter – Post aus Lochau",
      ogDescription: "Neue Stücke in der Ausstellung, Einladungen zu Abenden im Haus und Ideen fürs Einrichten – per E-Mail, jederzeit abbestellbar.",
    },
    en: {
      title: "Newsletter | Living Ideas & News – Platzhirsch Home Living",
      description: "The Platzhirsch Home Living newsletter: new pieces in our showroom in Lochau, invitations to the house and ideas for furnishing.",
      ogTitle: "Newsletter – Letters from Lochau",
      ogDescription: "New pieces in the showroom, invitations to evenings at the house and ideas for furnishing – by e-mail, unsubscribe at any time.",
    },
    fr: {
      title: "Newsletter | Idées d’intérieur & actualités – Platzhirsch Home Living",
      description: "La newsletter de Platzhirsch Home Living : nouvelles pièces dans notre showroom de Lochau, invitations à la maison et idées d’aménagement.",
      ogTitle: "Newsletter – Nouvelles de Lochau",
      ogDescription: "Nouvelles pièces au showroom, invitations aux soirées à la maison et idées d’aménagement – par e-mail, désinscription à tout moment.",
    },
    it: {
      title: "Newsletter | Idee per la casa & novità – Platzhirsch Home Living",
      description: "La newsletter di Platzhirsch Home Living: nuovi pezzi nel nostro showroom di Lochau, inviti in casa e idee per arredare.",
      ogTitle: "Newsletter – Notizie da Lochau",
      ogDescription: "Nuovi pezzi nello showroom, inviti alle serate in casa e idee per arredare – via e-mail, disiscrizione in qualsiasi momento.",
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
      locale: ogLocale(locale),
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

  const homeName = locale === "it" ? "Home" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
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
      <JsonLd data={webPageSchema} />
      <Newsletter />
      <Content archiv={archivAusgaben().length > 0} />
    </div>
  );
}

export const revalidate = 3600;