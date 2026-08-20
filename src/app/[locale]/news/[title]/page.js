import { notFound } from "next/navigation";
import ArticleDetail from "@/components/NewsItem/newsitem";
import NewsItemBanner from "@/components/NewsItem/newsItemBanner";
import { generateSlug } from "@/lib/slugify";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import {
  fetchNewsKeywords,
  getNewsOGImage,
} from "@/lib/api/Keywords/fetchNewsKeywords";
import { ROUTES } from "@/utils/routing";

// Helper functions for URL generation
function getBaseUrl(locale) {
  // Always include the locale in the URL, even for 'de'
  return `/${locale}`;
}

function getNewsPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/news`;
    case "en":
      return `${baseUrl}/news`;
    case "fr":
      return `${baseUrl}/news`;
    case "de":
      return `${baseUrl}/news`;
    default:
      return `${baseUrl}/news`;
  }
}

function getNewsDetailPageUrl(locale, newsSlug) {
  const newsBaseUrl = getNewsPageUrl(locale);

  return `${newsBaseUrl}/${newsSlug}`;
}

// Function to generate static paths for all locales
export async function generateStaticParams() {
  const data = await fetchNewsData();
  const locales = ['de', 'en', 'fr', 'it'];
  const params = [];

  for (const locale of locales) {
    for (const news of data || []) {
      if (news.status === "Aktiv") {
        params.push({
          locale,
          title: generateSlug(news.name1),
        });
      }
    }
  }

  return params;
}

// Function to generate metadata for SEO
export async function generateMetadata(context) {
  const { params } = await context;
  const { title, locale = "de" } = await params;

  try {
    const data = await fetchNewsData();
    const news = data?.find((n) => generateSlug(n.name1) === title);

    if (!news || news.status !== "Aktiv") notFound();

    const PAGE_URL = getNewsDetailPageUrl(locale, title);


    // Fetch default image
    const newsKeywords = await fetchNewsKeywords();
    const defaultImage = getNewsOGImage(newsKeywords);

    // Get localized title, description, and keywords
    const getLocalizedTitle = () => {
      switch (locale) {
        case "en": return `${news.name_en} |  News EN`;
        case "it": return `${news.name_it} |  News IT`;
        case "fr": return `${news.name_fr} |  News FR`;
        default: return `${news.name1} | News DE`;
      }
    };

    const getLocalizedDescription = () => {
      switch (locale) {
        case "en": return news?.metadata_description_en || news?.metadata_description_de || `Read more about ${news.name1} at Platzhirsch Studio. Latest news and updates from the world of exclusive design.`;
        case "it": return news?.metadata_description_it || news?.metadata_description_de || `Leggi di più su ${news.name1} presso Platzhirsch Studio. Ultime notizie e aggiornamenti dal mondo del design esclusivo.`;
        case "fr": return news?.metadata_description_fr || news?.metadata_description_de || `En savoir plus sur ${news.name1} chez Platzhirsch Studio. Dernières actualités et mises à jour du monde du design exclusif.`;
        default: return news?.metadata_description_de || `Erfahren Sie mehr über ${news.name1} bei Platzhirsch Studio. Aktuelle Neuigkeiten und Updates aus der Welt des exklusiven Designs.`;
      }
    };

    const getNewsImage = () => {
      const image = news?.bild_anhagen
        ? `/cms${news.bild_anhagen}`
        : news?.artikel_table?.[0]?.bild_anhagen
          ? `/cms${news.artikel_table[0].bild_anhagen}`
          : defaultImage || "/Images/Home/orionMinoti.jpg";
      return image;
    };

    // Guard against invalid/unparseable dates — new Date("bad").toISOString() throws.
    const toISO = (value) => {
      const parsed = value ? new Date(value) : new Date();
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    };

    const imageUrl = getNewsImage();
    const formattedDate = toISO(news?.date);

    return {
      title: getLocalizedTitle(),
      description: getLocalizedDescription(),      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: {
          'de': getNewsDetailPageUrl('de', title),
          'en': getNewsDetailPageUrl('en', title),
          'fr': getNewsDetailPageUrl('fr', title),
          'it': getNewsDetailPageUrl('it', title),
          'x-default': getNewsDetailPageUrl('de', title),
        }
      },
      openGraph: {
        type: "article",
        url: PAGE_URL,
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: news.name1,
          },
        ],
        locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
        publishedTime: formattedDate,
        modifiedTime: formattedDate,
        authors: ["Platzhirsch Studio"],
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        images: [imageUrl],
      },
    };
  } catch (error) {
    // A transient PvOne outage must NOT noindex a real article — that actively
    // de-indexes it. Re-throw so the route returns a retriable HTTP 500 (Google
    // retries 5xx and keeps the URL). NEXT_ control-flow signals propagate the same
    // way; genuine not-found is handled by the not-found branch above.
    console.error("News metadata generation failed:", error);
    throw error;
  }
}

// Page Component
export default async function NewsDetailPage(props) {
  const { title, locale = "de" } = await props.params;

  const data = await fetchNewsData();
  const news = data?.find((n) => generateSlug(n.name1) === title);

  if (!news || news.status !== "Aktiv") {
    notFound();
  }

  const titleOne = locale == "it" ? "Notizie" : locale == "en" ? "News" : locale == "fr" ? "Actualités" : "News";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const PAGE_URL = getNewsDetailPageUrl(locale, title);
  const newsBaseUrl = getNewsPageUrl(locale);
  const newsPath = ROUTES.news[locale] ? `${ROUTES.news[locale]}` : `/news`;


  // Get image for banner
  const getNewsImage = () => {
    return news?.bild_anhagen
      ? `/cms${news?.bild_anhagen}`
      : news?.artikel_table?.[0]?.bild_anhagen
        ? `/cms${news.artikel_table[0]?.bild_anhagen}`
        : news?.artikel_table?.[1]?.bild_anhagen
          ? `/cms${news.artikel_table[1].bild_anhagen}`
          : "/Images/Home/orionMinoti.jpg";
  };


  // Get localized title, description, and keywords
  const getLocalizedTitle = () => {
    switch (locale) {
      case "en": return `${news.name_en}`;
      case "it": return `${news.name_it}`;
      case "fr": return `${news.name_fr}`;
      default: return `${news.name1}`;
    }
  };

  const BannerInfo = {
    image: getNewsImage(),
    links: [
      { linkName: Home, link: `/` },
      { linkName: titleOne, link: newsPath },
      { linkName: getLocalizedTitle(), link: `/news/${title}` },
    ],
    title: getLocalizedTitle(),
  };

  // ✅ JSON-LD Structured Data for Article
  const formattedDate = news?.date ? new Date(news.date).toISOString() : new Date().toISOString();

  // Structured-data URLs must be absolute — JSON-LD is parsed independently of the page.
  const DOMAIN = "https://platzhirsch.studio";
  const newsImageAbs = `${DOMAIN}${getNewsImage()}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${DOMAIN}${PAGE_URL}/#article`,
    headline: news?.name1,
    description: news?.metadata_description_de || `Erfahren Sie mehr über ${news?.name1} bei Platzhirsch Studio.`,
    image: newsImageAbs,
    datePublished: formattedDate,
    dateModified: formattedDate,
    author: {
      "@type": "Organization",
      name: "Platzhirsch Studio",
      url: DOMAIN,
    },
    publisher: {
      "@type": "Organization",
      name: "Platzhirsch Studio",
      logo: {
        "@type": "ImageObject",
        url: `${DOMAIN}/Images/Navbar/Logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${DOMAIN}${PAGE_URL}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${DOMAIN}${PAGE_URL}/#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: Home, item: `${DOMAIN}/${locale}` },
      { "@type": "ListItem", position: 2, name: titleOne, item: `${DOMAIN}${newsBaseUrl}` },
      { "@type": "ListItem", position: 3, name: news?.name1, item: `${DOMAIN}${PAGE_URL}` },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <NewsItemBanner info={BannerInfo} />
      <ArticleDetail data={news} />
    </div>
  );
}

export const revalidate = 3600;