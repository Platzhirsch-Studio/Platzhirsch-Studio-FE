import { notFound, permanentRedirect } from "next/navigation";
import { newsMetaTitle } from "@/lib/news/newsTitle";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/pageMetadata";
import ArticleDetail from "@/components/NewsItem/newsitem";
import NewsItemBanner from "@/components/NewsItem/newsItemBanner";
import { probeImageSize } from "@/components/MarkenItems/imageSize";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import { generateSlug } from "@/lib/slugify";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import {
  fetchNewsKeywords,
  getNewsOGImage,
} from "@/lib/api/Keywords/fetchNewsKeywords";
import { ROUTES } from "@/utils/routing";
import { IN_LANGUAGE, ORGANIZATION_ID, absoluteUrl, breadcrumbList, graph } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { clampDescription, fitTitle, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { isIndexableNews, isWithheldNews, newsDates, presentNews } from "@/lib/news/newsCopy";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { itVoi } from "@/lib/seo/shopSeoCopy";

// Meta description of a withheld (ended) promotion – the original one quoted
// the discount. Same wording as inhalt.news.endedDescription.
const ENDED_DESCRIPTION = {
  de: "Diese Aktion von Platzhirsch Home Living ist beendet.",
  en: "This promotion by Platzhirsch Home Living has ended.",
  fr: "Cette action de Platzhirsch Home Living est terminée.",
  it: "Questa promozione di Platzhirsch Home Living è terminata.",
};

// Neutral <title> of a withheld promotion – the raw headline was cut mid-
// sentence or in capitals (QA R3 P3-3). noindex either way.
const ENDED_TITLE = {
  de: "Beendete Aktion | Platzhirsch Home Living",
  en: "Ended promotion | Platzhirsch Home Living",
  fr: "Action terminée | Platzhirsch Home Living",
  it: "Promozione terminata | Platzhirsch Home Living",
};

// Helper functions for URL generation
function getBaseUrl(locale) {
  // Always include the locale in the URL, even for 'de'
  return `/${locale}`;
}

function getNewsPageUrl(locale) {
  // Hub lives at the translated path (/fr/nouvelles, /it/notizie); articles stay under /news/.
  return `${getBaseUrl(locale)}${ROUTES.news[locale] || ROUTES.news.de}`;
}

// Articles exist only at /{locale}/news/<slug> (this route) in every locale —
// /fr/nouvelles/<slug> and /it/notizie/<slug> 404, so canonical and hreflang
// must not use the translated hub path.
function getNewsDetailPageUrl(locale, newsSlug) {
  return `${getBaseUrl(locale)}/news/${newsSlug}`;
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
    const found = data?.find((n) => generateSlug(n.name1) === title);

    if (!found || found.status !== "Aktiv") notFound();
    // Runde 3 P5 (seo P1-6): an ended promotion answers 308 to the news hub
    // of its language (next.config.js redirects the known slugs before this).
    if (isWithheldNews(found)) permanentRedirect(getNewsPageUrl(locale));
    // Title, description and image alt as they may be shown: advertising
    // words defused, slug from the raw title (src/lib/news/newsCopy.js).
    const news = presentNews(found);

    const PAGE_URL = getNewsDetailPageUrl(locale, title);


    // Fetch default image
    const newsKeywords = await fetchNewsKeywords();
    const defaultImage = getNewsOGImage(newsKeywords);

    // Title (Runde 2, seo P1-2): headline in the spelling of the H1, cut at a
    // word boundary, no cut "|", no double brand, ≤ 65 – src/lib/news/newsTitle.js.
    // Localized headline, German (name1) when the translation is missing — an
    // untranslated article must not 500 the en/fr/it URL (all are in the sitemap).
    const getLocalizedTitle = () =>
      newsMetaTitle(String((locale !== "de" && news[`name_${locale}`]) || news.name1 || ""));

    const getLocalizedDescription = () => {
      switch (locale) {
        case "en": return news?.metadata_description_en || news?.metadata_description_de || `Read more about ${news.name1} at Platzhirsch Home Living. News from our showroom in Lochau on Lake Constance.`;
        case "it": return itVoi(news?.metadata_description_it) || news?.metadata_description_de || `Leggete di più su ${news.name1} presso Platzhirsch Home Living. Notizie dal nostro showroom di Lochau sul Lago di Costanza.`;
        case "fr": return news?.metadata_description_fr || news?.metadata_description_de || `En savoir plus sur ${news.name1} chez Platzhirsch Home Living. Actualités de notre showroom à Lochau, au bord du lac de Constance.`;
        default: return news?.metadata_description_de || `Erfahren Sie mehr über ${news.name1} bei Platzhirsch Home Living. Neuigkeiten aus unserem Showroom in Lochau am Bodensee.`;
      }
    };

    const getNewsImage = () => {
      const image = news?.bild_anhagen
        ? `/cms${news.bild_anhagen}`
        : news?.artikel_table?.[0]?.bild_anhagen
          ? `/cms${news.artikel_table[0].bild_anhagen}`
          : defaultImage || DEFAULT_OG_IMAGE;
      return image;
    };

    // Article date from the backoffice field `daten` (`date` is the older
    // name). No date, an invalid one or the migration date shared by most
    // articles (r4-seo P1-5, newsDates in src/lib/news/newsCopy.js) → null,
    // and the tags are left out — never "today", which would change on every
    // rebuild.

    const imageUrl = getNewsImage();
    // UWG: ended promotions with prices/discounts stay reachable but are
    // not indexed and do not repeat the discount in snippets.
    const withheld = news.withheld;
    // Rat 9,5 A15: Description als ganze Sätze ≤ 150, Titel ≤ 60 mit einem Suffix.
    const description = clampDescription(withheld ? ENDED_DESCRIPTION[locale] || ENDED_DESCRIPTION.de : getLocalizedDescription());
    const metaTitle = fitTitle(withheld ? ENDED_TITLE[locale] || ENDED_TITLE.de : getLocalizedTitle());
    const { published: publishedTime, modified: modifiedTime } = newsDates(found, data);

    return {
      title: metaTitle,
      description,
      robots: withheld ? { index: false, follow: true } : { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: hreflangLanguages((l) => getNewsDetailPageUrl(l, title))
      },
      openGraph: {
        type: "article",
        url: PAGE_URL,
        title: metaTitle,
        description,
        siteName: "Platzhirsch Home Living",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: news.name1,
          },
        ],
        locale: ogLocale(locale),
        ...(publishedTime ? { publishedTime } : {}),
        ...(modifiedTime ? { modifiedTime } : {}),
        authors: ["Platzhirsch Home Living"],
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    // A transient PvOne outage must NOT noindex a real article — that actively
    // de-indexes it. Re-throw so the route returns a retriable HTTP 500 (Google
    // retries 5xx and keeps the URL). NEXT_ control-flow signals propagate the same
    // way; genuine not-found is handled by the not-found branch above.
    // Log only real failures – an unknown slug (notFound) is no error.
    if (!String(error?.digest || "").startsWith("NEXT_")) {
      console.error("News metadata generation failed:", error);
    }
    throw error;
  }
}

// Page Component
// Teaser data for the "more news" cards on an article page.
function buildMoreNews(allNews, current, locale) {
  const text = (item, base, germanField) =>
    (locale !== "de" && typeof item?.[`${base}_${locale}`] === "string" && item[`${base}_${locale}`].trim()) ||
    item?.[germanField] ||
    "";
  const excerpt = (value, max = 160) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()} …`; // same " …" as the overview
  };
  const time = (item) => {
    const t = new Date(item?.daten || item?.date || 0).getTime();
    return isNaN(t) ? 0 : t;
  };

  return (allNews || [])
    .filter((item) => item !== current && isIndexableNews(item))
    .sort((a, b) => time(b) - time(a))
    .slice(0, 2)
    .map(presentNews)
    .map((item) => {
      const imagePath = item.bild_anhagen || item.artikel_table?.[0]?.bild_anhagen;
      return {
        title: text(item, "name", "name1"),
        description: excerpt(text(item, "beschreibung", "beschreibung")),
        image: imagePath ? `/cms${imagePath}` : "/Images/Home/orionMinoti.jpg",
        link: `/news/${item.slug}`,
      };
    });
}

export default async function NewsDetailPage(props) {
  const { title, locale = "de" } = await props.params;

  const data = await fetchNewsData();
  const found = data?.find((n) => generateSlug(n.name1) === title);

  if (!found || found.status !== "Aktiv") {
    notFound();
  }
  // Runde 3 P5 (seo P1-6): ended promotions (UWG) are no longer a noindex
  // stub but one 308 to the news hub of the page language. The known slugs
  // already redirect in next.config.js (src/lib/seo/newsRedirects.cjs); this
  // catches any other article the discount net withholds.
  if (isWithheldNews(found)) permanentRedirect(getNewsPageUrl(locale));

  // Display copy (src/lib/news/newsCopy.js): withheld promotions keep only
  // their title (the body is not rendered), all others with defused
  // advertising words. The backoffice data stays unchanged.
  const news = presentNews(found);
  const withheld = news.withheld;

  // "Weitere Neuigkeiten": the 2 most recent other indexable articles, in the
  // page language (German fallback), linking to their real slugs.
  const moreNews = buildMoreNews(data, found, locale);

  const titleOne = locale == "it" ? "Notizie" : locale == "en" ? "News" : locale == "fr" ? "Actualités" : "News";
  // R9-P5 (seo P2-1): one home label per language, visible and in JSON-LD (DE „Startseite“).
  const Home = homeCrumbLabel(locale);

  // Dynamic URLs
  const PAGE_URL = getNewsDetailPageUrl(locale, title);
  const newsBaseUrl = getNewsPageUrl(locale);


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
  // Same fallback as the <title>: German headline when no translation exists.
  const getLocalizedTitle = () => (locale !== "de" && news[`name_${locale}`]) || news.name1 || "";


  // ✅ JSON-LD: NewsArticle + BreadcrumbList.
  // Structured-data URLs must be absolute — JSON-LD is parsed independently of the page.
  const DOMAIN = "https://platzhirsch.studio";
  const newsImageAbs = absoluteUrl(getNewsImage());

  // Real CMS dates only — no "today" fallback, which would tell Google the
  // article changes on every rebuild. `daten` is the field the news list
  // sorts by (fetchNewsData.js); `date` is the older name. r4-seo P1-5: the
  // migration date 2025-01-14 (and any day shared by more than 3 articles) is
  // no publication date → no datePublished/dateModified (newsDates()).
  const { published: publishedAt, modified: modifiedAt } = newsDates(found, data);

  // QM content-legal r3: the lead photo is shown at most at its real pixel size
  // (header bytes only, probeImageSize – memoized, ISR 1 h). Local fallback: no probe.
  const leadSrc = withheld ? null : getNewsImage();
  const leadSize = leadSrc?.startsWith("/cms/")
    ? await probeImageSize(`${NEW_API_SERVER}${encodeURI(leadSrc.slice(4))}`)
    : null;
  const lead = leadSrc ? { src: leadSrc, size: leadSize } : null;

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
      {/* Withheld (ended) promotion: no NewsArticle node, breadcrumb only. */}
      <JsonLd data={withheld ? graph(breadcrumbSchema) : graph(articleSchema, breadcrumbSchema)} />
      <NewsItemBanner title={getLocalizedTitle()} slug={title} withheld={withheld} published={publishedAt} lead={lead} />
      <ArticleDetail data={news} moreNews={moreNews} withheld={withheld} />
    </div>
  );
}

export const revalidate = 3600;