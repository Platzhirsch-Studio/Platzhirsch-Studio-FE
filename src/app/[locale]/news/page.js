import GridComponent from "@/components/News/news";
import JsonLd from "@/components/Reusable/JsonLd";
import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import {
  fetchNewsKeywords,
  getLocalizedNewsMetadata,
  getNewsOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchNewsKeywords";
import { ROUTES } from "@/utils/routing";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

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
    case "it": return "Notizie | Tendenze e Aggiornamenti da Platzhirsch Home Living";
    case "en": return "News | Design Trends & Updates from Platzhirsch Home Living";
    case "fr": return "Actualités | Tendances Design de Platzhirsch Home Living";
    default: return "News | Designtrends & Updates von Platzhirsch Home Living";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Ultime notizie, aggiornamenti e articoli da Platzhirsch Home Living. Scopri le ultime tendenze del design e le novità aziendali.";
    case "en": return "Latest news, updates and articles from Platzhirsch Home Living. Discover the latest design trends, interior inspiration, expert insights and company news today.";
    case "fr": return "Dernières actualités et articles de Platzhirsch Home Living. Découvrez les tendances design et les nouvelles de l'entreprise.";
    default: return "Aktuelle Neuigkeiten und Artikel von Platzhirsch Home Living. Entdecken Sie aktuelle Designtrends und Neuigkeiten aus unserem Studio.";
  }
};

const getCMSDescription = (newsKeywords, locale) => {
  switch (locale) {
    case "it": return newsKeywords?.metadata_it_tab?.metadata_description_it;
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
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url: "/Images/Home/download.jpg", width: 1200, height: 630, alt: "News – Platzhirsch Home Living" }],
        },
        twitter: {
          card: "summary_large_image",
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          images: ["/Images/Home/download.jpg"],
        },
      };
    }


    const meta = getLocalizedNewsMetadata(newsKeywords, locale);
    const image = getNewsOGImage(newsKeywords);
    const safeType = validateOGType(meta?.type);
    const description = meta?.description || getCMSDescription(newsKeywords, locale) || getLocalizedDescription(locale);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description,
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getNewsPageUrl(l))
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description,
        url: PAGE_URL,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: image ? image : "/Images/Home/download.jpg",
            width: 2560,
            height: 1888,
            alt: "News – Platzhirsch Home Living",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description,
        images: [image ? image : "/Images/Home/download.jpg"],
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
  const Home = locale == "it" ? "Home" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getNewsPageUrl(locale);

  // Fetch keywords for image
  const newsKeywords = await fetchNewsKeywords();
  const image = getNewsOGImage(newsKeywords);
  const newsPath = ROUTES.news[locale] ? `${ROUTES.news[locale]}` : `/news`;


  const BannerInfo = {
    image: image || "/Images/Home/download.jpg",
    links: [
      { linkName: Home, link: `/` }, // Fixed: use locale prefix
      { linkName: titleOne, link: newsPath },
    ],
    title: titleOne,
  };

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
      <SinglePageBanner info={BannerInfo} />
      <GridComponent items={news} />
    </div>
  );
}

export const revalidate = 3600;