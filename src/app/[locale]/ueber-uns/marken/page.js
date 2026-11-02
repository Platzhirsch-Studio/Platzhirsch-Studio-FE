import JsonLd from "@/components/Reusable/JsonLd";
import MarkenClient from "@/components/MarkenClient/Marken";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { generateSlug } from "@/lib/slugify";
import { displayBrandName, withSiteBrands } from "@/lib/content/brands";
import {
  fetchBrandsKeywords,
  getLocalizedBrandsMetadata,
  getBrandsOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchBrandsKeywords";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { ROUTES } from "@/utils/routing";
import { itemListElements } from "@/lib/marken/indexGroups";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getMarkenPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/chi-siamo/marche`;
    case "en":
      return `${baseUrl}/about-us/brands`;
    case "fr":
      return `${baseUrl}/a-propos/marques`;
    case "de":
      return `${baseUrl}/ueber-uns/marken`;
    default:
      return `${baseUrl}/ueber-uns/marken`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    // Rat 9,5 A15: ≤ 60, ein Trenner vor dem Suffix.
    case "it": return "Marchi di design a Lochau | Platzhirsch Home Living";
    case "en": return "Design brands in Lochau | Platzhirsch Home Living";
    case "fr": return "Marques de design à Lochau | Platzhirsch Home Living";
    default: return "Designmarken in Lochau | Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Mobili, cucine, luci e outdoor di produttori europei e statunitensi – presentati e progettati nella nostra esposizione a Lochau, sul Lago di Costanza.";
    case "en": return "Furniture, kitchens, lighting and outdoor pieces by makers from Europe and the USA – shown and planned in our showroom in Lochau, Lake Constance.";
    case "fr": return "Mobilier, cuisines, luminaires et extérieur de fabricants d’Europe et des États-Unis – présentés et planifiés dans notre espace d’exposition à Lochau.";
    default: return "Möbel, Küchen, Leuchten und Outdoor von Herstellern aus Europa und den USA – gezeigt und geplant in unserer Ausstellung in Lochau am Bodensee.";
  }
};

// ✅ DYNAMIC METADATA FUNCTION
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getMarkenPageUrl(locale);

  try {
    const brandsKeywords = await fetchBrandsKeywords();

    if (!brandsKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getMarkenPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: "/Images/fallback-og.jpg", width: 2048, height: 1228, alt: "Designermarken – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/fallback-og.jpg"],
        },
      };
    }

    // Title and description: our own texts win over the CMS (QA Runde 1,
    // P2-5: the CMS still says "Exklusivität"). The CMS only supplies OG
    // image, type and locale.
    const meta = getLocalizedBrandsMetadata(brandsKeywords, locale);
    const image = getBrandsOGImage(brandsKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getMarkenPageUrl(l))
      },
      openGraph: {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            alt: "Designermarken – Platzhirsch Home Living",
          },
        ],
        // One og:locale map for the site; the CMS value ("en_EN") is not used.
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        images: [image ? image : DEFAULT_OG_IMAGE],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getMarkenPageUrl(l)) },
    };
  }
}

// ✅ PAGE COMPONENT
export default async function Home({ params }) {
  const { locale } = await params;

  const linkNameTwo = locale === "it" ? "Marche" : locale === "en" ? "Brands" : locale === "fr" ? "Marques" : "Marken";
  const homeName = homeCrumbLabel(locale);

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getMarkenPageUrl(locale);

  // Raw rows: the index shows origin and founding year, not only the logo.
  let marken = [];
  try {
    marken = await fetchRawMarkenData();
  } catch (error) {
    console.error("Marken index: backoffice unavailable", error);
  }
  // Same A–Z order as the visible list (QA Runde 1, P3-8).
  const active = withSiteBrands(marken, locale)
    .filter((m) => m?.status === "Aktiv" && m?.name1)
    .sort((a, b) => displayBrandName(a.name1).localeCompare(displayBrandName(b.name1), locale, { sensitivity: "base" }));

  const markenPath = ROUTES.marken[locale] || ROUTES.marken.de;
  const items = itemListElements(
    active.map((m) => ({
      slug: generateSlug(m.name1),
      name: m.name1,
      url: m.href ? `${BASE_URL}${m.href}` : `${PAGE_URL}/${generateSlug(m.name1)}`,
    })),
    (path) => `${BASE_URL}${path}`,
    locale,
    { markenPath }
  );

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: linkNameTwo,
    description: getLocalizedDescription(locale),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeName, item: BASE_URL },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: PAGE_URL },
      ],
    },
    // The index itself: one ListItem per brand page (same URLs as the sitemap),
    // then the static groups Bad & Wellness and Küchengeräte (lib/marken/indexGroups.js).
    // Each brand once, Brand @id via brandNodeId (same entity as the brand pages).
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items,
    },
  };

  return (
    <>
      <JsonLd data={webPageSchema} />
      <MarkenClient marken={active} locale={locale} />
    </>
  );
}

export const revalidate = 3600;