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
import { IN_LANGUAGE, ORGANIZATION_ID, absoluteUrl, breadcrumbList, graph } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";

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
    const BRAND = "Platzhirsch Home Living";
    const MAX_LENGTH = 58; // adjust to 65 if you want a bit more room

    const truncateTitle = (title) => {
      const suffix = ` | ${BRAND}`;
      const maxTitleLength = MAX_LENGTH - suffix.length;

      if (title.length <= maxTitleLength) {
        return `${title}${suffix}`;
      }

      // Truncate at the last full word to avoid cutting mid-word
      const truncated = title.slice(0, maxTitleLength - 1).trim();
      const lastSpace = truncated.lastIndexOf(" ");
      const cleanTruncated = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;

      return `${cleanTruncated}${suffix}`;
    };

    const getLocalizedTitle = () => {
      switch (locale) {
        case "en": return truncateTitle(news.name_en);
        case "it": return truncateTitle(news.name_it);
        case "fr": return truncateTitle(news.name_fr);
        default: return truncateTitle(news.name1);
      }
    };

    const getLocalizedDescription = () => {
      switch (locale) {
        case "en": return news?.metadata_description_en || news?.metadata_description_de || `Read more about ${news.name1} at Platzhirsch Home Living. Latest news and updates from the world of exclusive design.`;
        case "it": return news?.metadata_description_it || news?.metadata_description_de || `Leggi di più su ${news.name1} presso Platzhirsch Home Living. Ultime notizie e aggiornamenti dal mondo del design esclusivo.`;
        case "fr": return news?.metadata_description_fr || news?.metadata_description_de || `En savoir plus sur ${news.name1} chez Platzhirsch Home Living. Dernières actualités et mises à jour du monde du design exclusif.`;
        default: return news?.metadata_description_de || `Erfahren Sie mehr über ${news.name1} bei Platzhirsch Home Living. Aktuelle Neuigkeiten und Updates aus der Welt des exklusiven Designs.`;
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
      description: getLocalizedDescription(), robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: {
          'de-AT': getNewsDetailPageUrl('de', title),
          'de': getNewsDetailPageUrl('de', title),
          'en': getNewsDetailPageUrl('en', title),
          'fr-FR': getNewsDetailPageUrl('fr', title),
          'it-IT': getNewsDetailPageUrl('it', title),
          'x-default': getNewsDetailPageUrl('de', title),
        }
      },
      openGraph: {
        type: "article",
        url: PAGE_URL,
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        siteName: "Platzhirsch Home Living",
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
        authors: ["Platzhirsch Home Living"],
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

  // ✅ JSON-LD: NewsArticle + BreadcrumbList.
  // Structured-data URLs must be absolute — JSON-LD is parsed independently of the page.
  const DOMAIN = "https://platzhirsch.studio";
  const newsImageAbs = absoluteUrl(getNewsImage());

  // Real CMS dates only — no "today" fallback, which would tell Google the
  // article changes on every rebuild. `daten` is the field the news list
  // sorts by (fetchNewsData.js); `date` is the older name.
  const toIsoOrNull = (value) => {
    const parsed = value ? new Date(value) : null;
    return parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
  };
  const publishedAt = toIsoOrNull(news?.daten || news?.date);
  const modifiedAt = toIsoOrNull(news?.modified) || publishedAt;

  // Localized headline/description, German when the translation is empty.
  const localizedHeadline = (locale !== "de" && news?.[`name_${locale}`]) || news?.name1;
  const localizedDescription =
    (locale !== "de" && news?.[`metadata_description_${locale}`]) ||
    news?.metadata_description_de ||
    `Erfahren Sie mehr über ${news?.name1} bei Platzhirsch Home Living.`;

  const articleSchema = {
    "@type": "NewsArticle",
    "@id": `${DOMAIN}${PAGE_URL}#article`,
    headline: String(localizedHeadline || "").slice(0, 110),
    description: localizedDescription,
    image: newsImageAbs,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(modifiedAt ? { dateModified: modifiedAt } : {}),
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Platzhirsch Home Living", url: DOMAIN },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${DOMAIN}${PAGE_URL}` },
  };

  const breadcrumbSchema = breadcrumbList(
    [
      { name: Home, url: `${DOMAIN}/${locale}` },
      { name: titleOne, url: `${DOMAIN}${newsBaseUrl}` },
      { name: localizedHeadline, url: `${DOMAIN}${PAGE_URL}` },
    ],
    `${DOMAIN}${PAGE_URL}#breadcrumb`
  );

  return (
    <div>
      <JsonLd data={graph(articleSchema, breadcrumbSchema)} />
      <NewsItemBanner info={BannerInfo} />
      <ArticleDetail data={news} />
    </div>
  );
}

export const revalidate = 3600;