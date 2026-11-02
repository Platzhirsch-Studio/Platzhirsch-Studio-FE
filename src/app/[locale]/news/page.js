import GridComponent from "@/components/News/news";
import JsonLd from "@/components/Reusable/JsonLd";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import {
  fetchNewsKeywords,
  getLocalizedNewsMetadata,
  getNewsOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchNewsKeywords";
import { DEFAULT_OG_IMAGE, clampDescription, fitTitle, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { itVoi } from "@/lib/seo/shopSeoCopy";

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getNewsPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/notizie`;
    case "en":
      return `${baseUrl}/news`;
    case "fr":
      return `${baseUrl}/nouvelles`;
    case "de":
    default:
      return `${baseUrl}/news`;
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    // Rat 9,5 A15: Thema und Ort statt Sammelbegriff, ≤ 60 mit einem Suffix.
    case "it": return "Notizie dallo studio di Lochau | Platzhirsch Home Living";
    case "en": return "News from our studio in Lochau | Platzhirsch Home Living";
    case "fr": return "Actualités du studio de Lochau | Platzhirsch Home Living";
    default: return "News aus dem Studio in Lochau | Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Ultime notizie, aggiornamenti e articoli da Platzhirsch Home Living. Scoprite le tendenze del design e le novità dal nostro studio di Lochau.";
    case "en": return "Latest news, updates and articles from Platzhirsch Home Living. Current design trends and news from our studio in Lochau.";
    case "fr": return "Dernières actualités et articles de Platzhirsch Home Living. Découvrez les tendances design et les nouvelles de l'entreprise.";
    default: return "Aktuelle Neuigkeiten und Artikel von Platzhirsch Home Living. Entdecken Sie aktuelle Designtrends und Neuigkeiten aus unserem Studio.";
  }
};

const getCMSDescription = (newsKeywords, locale) => {
  switch (locale) {
    case "it": return itVoi(newsKeywords?.metadata_it_tab?.metadata_description_it); // R9-P5: voi
    case "en": return newsKeywords?.metadata_en_tab?.metadata_description_en;
    case "fr": return newsKeywords?.metadata_fr_tab?.metadata_description_fr;
    default: return newsKeywords?.metadata_de_tab?.metadata_description_de;
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const PAGE_URL = getNewsPageUrl(locale);

  try {
    const newsKeywords = await fetchNewsKeywords();

    if (!newsKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: PAGE_URL,
          languages: hreflangLanguages((l) => getNewsPageUrl(l))
        },
        openGraph: {
          type: "website",
          url: PAGE_URL,
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Home Living",
          locale: ogLocale(locale),
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "News – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: [DEFAULT_OG_IMAGE],
        },
      };
    }


    const meta = getLocalizedNewsMetadata(newsKeywords, locale);
    const image = getNewsOGImage(newsKeywords);
    const safeType = validateOGType(meta?.type);
    // Rat 9,5 A15: ganze Sätze ≤ 150, Titel ≤ 60 (auch für Backoffice-Texte).
    const description = clampDescription(meta?.description || getCMSDescription(newsKeywords, locale) || getLocalizedDescription(locale));
    const title = fitTitle(meta?.title || getLocalizedTitle(locale));

    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getNewsPageUrl(l))
      },
      openGraph: {
        title,
        description,
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : DEFAULT_OG_IMAGE,
            width: 2560,
            height: 1888,
            alt: "News – Platzhirsch Home Living",
          },
        ],
        locale: ogLocale(locale),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image ? image : DEFAULT_OG_IMAGE],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL, languages: hreflangLanguages((l) => getNewsPageUrl(l)) },
    };
  }
}

export default async function Home({ params }) {
  const { locale } = await params;

  const titleOne = locale == "it" ? "Notizie" : locale == "en" ? "News" : locale == "fr" ? "Actualités" : "News";
  // R9-P5 (seo P2-1): one home label per language, visible and in JSON-LD (DE „Startseite“).
  const Home = homeCrumbLabel(locale);

  // Dynamic URLs
  const PAGE_URL = getNewsPageUrl(locale);

  // The hero is the own studio photo (news.js, QM r3); the CMS keyword image
  // only serves as OG image (generateMetadata).
  const news = await fetchNewsData();

  // ✅ JSON-LD Structured Data
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: titleOne,
    description: "Aktuelle Neuigkeiten, Updates und Artikel von Platzhirsch Home Living. Entdecken Sie die neuesten Designtrends und Unternehmensnews.",
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
      <GridComponent items={news} />
    </div>
  );
}

export const revalidate = 3600;