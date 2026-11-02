import React from "react";
import JsonLd from "@/components/Reusable/JsonLd";
import KarriereSecond from "@/components/Karriere/karriere";
import KarrierePosition from "@/components/Karriere/karriereposition";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { publishableJob } from "@/components/Karriere/glbg";
import { hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { shareImageMeta } from "@/components/Karriere/shareImage";
import {
  fetchCareerKeywords,
  getLocalizedCareerMetadata,
  validateOGType
} from "@/lib/api/Keywords/fetchKarrierKeywords";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getKarrierePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/carriera`;
    case "en":
      return `${baseUrl}/about-us/career`;
    case "fr":
      return `${baseUrl}/a-propos/carriere`;
    case "de":
      return `${baseUrl}/ueber-uns/karriere`;
    default:
      return `${baseUrl}/ueber-uns/karriere`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Carriera | Lavora con Noi da Platzhirsch Home Living";
    case "en": return "Careers | Join the Platzhirsch Home Living Design Team";
    case "fr": return "Carrière | Rejoignez Platzhirsch Home Living";
    default: return "Karriere | Werden Sie Teil von Platzhirsch Home Living";
  }
};

// Description (updated 31.10.2026 for the 8 jobs, no unconfirmed full/part time): our own, factual text wins over the CMS (QA Runde 1, P2-2:
// the CMS text still says "exklusiv"). The CMS keeps title and type.
const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Posizioni aperte da Platzhirsch Home Living a Lochau: progettazione, interior design, vendita, montaggio, piastrelle e impiantistica.";
    case "en": return "Open positions at Platzhirsch Home Living in Lochau: planning, interior design, sales, installation, tiling and building services.";
    case "fr": return "Postes ouverts chez Platzhirsch Home Living à Lochau : conception, design d’intérieur, vente, montage, carrelage et technique du bâtiment.";
    default: return "Offene Stellen bei Platzhirsch Home Living in Lochau: Planung, Interior Design, Verkauf, Montage, Fliesen und Haustechnik.";
  }
};

// Share image (r4-seo P2-7): the CMS image was arbeiten.avif, which Facebook,
// LinkedIn and WhatsApp do not show. Now a PNG 1200 × 630 (typographic, no
// third-party image rights) at <career URL>/share-image, see
// src/components/Karriere/shareImage.js.
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getKarrierePageUrl(locale);

  try {
    // Use the new API function
    const careerKeywords = await fetchCareerKeywords();

    if (!careerKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getKarrierePageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [shareImageMeta(PAGE_URL, locale)],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: [shareImageMeta(PAGE_URL, locale).url],
        },
      };
    }

    const meta = getLocalizedCareerMetadata(careerKeywords, locale);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [shareImageMeta(PAGE_URL, locale)],
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        images: [shareImageMeta(PAGE_URL, locale).url],
      },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getKarrierePageUrl(l))
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getKarrierePageUrl(l)) },
    };
  }
}

export default async function Page({ params }) {
  const { locale } = await params;

  const linkNameTwo =
    locale == "it"
      ? "Carriera"
      : locale == "en"
        ? "Career"
        : locale == "fr"
          ? "Carrière"
          : "Karriere";
  const Home =
    locale == "it"
      ? "Home"
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";

  const karriere = await fetchKarriereData();


  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getKarrierePageUrl(locale);



  // Real freshness signal from the most recent active job posting, not new Date()
  // (which changed every deploy → Google ignored it). Omitted when no jobs are open.
  const jobDates = (Array.isArray(karriere) ? karriere : [])
    // GlBG § 9 Abs 2 (Rat 9,5 A13): nur veröffentlichbare Stellen (Karriere/glbg.js).
    .filter((j) => publishableJob(j) && j?.posted)
    .map((j) => String(j.posted).slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const lastModified = jobDates.length ? jobDates.sort().at(-1) : null;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: getLocalizedDescription(locale),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    // Site-wide WebSite node lives at the apex #website — never locale-scoped.
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    ...(lastModified ? { dateModified: lastModified } : {}),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        // Absolute item URLs — JSON-LD is parsed independently of the page.
        { "@type": "ListItem", position: 1, name: Home, item: BASE_URL },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: PAGE_URL },
      ],
    },
  };

  return (
    <div>
      <JsonLd data={webPageSchema} />
      <KarriereSecond />
      <KarrierePosition karriere={karriere} />
    </div>
  );
}

export const revalidate = 3600;