// src/app/[locale]/page.js
import dynamic from "next/dynamic";
import Hero from "@/components/Home/Hero";
import BrandWall from "@/components/Home/BrandWall";
import CategoryTiles from "@/components/Home/CategoryTiles";
import RegionLinks from "@/components/Home/RegionLinks";
import ShowroomCta from "@/components/Home/ShowroomCta";
import SeoIntro from "@/components/Home/SeoIntro";
import { homeSeo } from "@/lib/content/homeSeo";
import About from "@/components/Home/about";
import BlogSection from "@/components/Home/blog";
import { fetchSlicedNewsData } from "@/lib/api/fetchNewsData";
import { fetchHomepage } from "@/lib/api/fetchHomepage";
import { fetchProdukteNewByMarke, fetchKategorienWithCounts } from "@/lib/api/fetchAllProdukte";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { hreflangLanguages } from "@/lib/seo/pageMetadata";

// Dynamically import non-critical components
const TrendingProducts = dynamic(() => import("@/components/ProuductSectionHome/ProuductSectionHome"));
const WhyChooseUsSectionHome = dynamic(() => import("@/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome"));

const BASE_URL = "https://platzhirsch.studio";


const FALLBACK_META_BY_LOCALE = {
  de: {
    title: "Designermöbel & Interior Design in Vorarlberg | Platzhirsch Home Living",
    description: "Exklusive Designermöbel & Interior Design in Vorarlberg – Marken wie Poliform, Rimadesio & Minotti. Persönliche Einrichtungsberatung für ganz Österreich.",
  },
  en: {
    title: "Designer Furniture & Interior Design in Vorarlberg | Platzhirsch Home Living",
    description: "Exclusive designer furniture & interior design in Vorarlberg, Austria – brands like Poliform, Rimadesio & Minotti. Personal interior consulting across Austria.",
  },
  fr: {
    title: "Mobilier design & Interior Design au Vorarlberg | Platzhirsch Home Living",
    description: "Mobilier design exclusif & interior design au Vorarlberg (Autriche) – marques comme Poliform, Rimadesio & Minotti. Conseil en aménagement personnalisé dans toute l'Autriche.",
  },
  it: {
    title: "Mobili di design & Interior Design in Vorarlberg | Platzhirsch Home Living",
    description: "Mobili di design esclusivi & interior design in Vorarlberg (Austria) – marchi come Poliform, Rimadesio & Minotti. Consulenza d'arredo personalizzata in tutta l'Austria.",
  },
};

function getFallbackMeta(locale) {
  return FALLBACK_META_BY_LOCALE[locale] || FALLBACK_META_BY_LOCALE.de;
}

// Complete metadata when the CMS is unavailable: canonical, hreflang and robots
// must not disappear just because the backend hiccuped (the layout deliberately
// sets none of them, so a title-only fallback left the page without a canonical).
function fallbackMetadata(locale) {
  const meta = getFallbackMeta(locale);
  const canonical = `${BASE_URL}/${locale}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical, languages: hreflangLanguages((l) => `${BASE_URL}/${l}`) },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url: canonical, title: meta.title, description: meta.description },
  };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;

  try {
    const [apiData] = await Promise.all([
      fetchHomepage(),
    ]);

    const home = apiData?.[0];


    if (!home) return fallbackMetadata(locale);

    // Safely extract localized metadata fields
    const metaTabs = {
      de: {
        locale: home.metadata?.metadata_local_de || "de_AT",
        sitename: home.metadata?.metadata_sitename_de || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_de || "website",
        title: home.metadata?.metadata_title_de || getFallbackMeta("de").title,
        description: home.metadata?.metadata_description_de || getFallbackMeta("de").description,
        url: home.metadata?.metadata_url_de || BASE_URL,
      },
      en: {
        locale: home.metadata?.metadata_local_en || "en_GB",
        sitename: home.metadata?.metadata_sitename_en || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_en || "website",
        title: home.metadata?.metadata_title_en || getFallbackMeta("en").title,
        description: home.metadata?.metadata_description_en || getFallbackMeta("en").description,
        url: home.metadata?.metadata_url_en || BASE_URL,
      },
      it: {
        locale: home.metadata?.metadata_local_it || "it_IT",
        sitename: home.metadata?.metadata_sitename_it || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_it || "website",
        title: home.metadata?.metadata_title_it || getFallbackMeta("it").title,
        description: home.metadata?.metadata_description_it || getFallbackMeta("it").description,
        url: home.metadata?.metadata_url_it || BASE_URL,
      },
      fr: {
        locale: home.metadata?.metadata_local_fr || "fr_FR",
        sitename: home.metadata?.metadata_sitename_fr || "Platzhirsch Home Living",
        type: home.metadata?.metadata_type_fr || "website",
        title: home.metadata?.metadata_title_fr || getFallbackMeta("fr").title,
        description: home.metadata?.metadata_description_fr || getFallbackMeta("fr").description,
        url: home.metadata?.metadata_url_fr || BASE_URL,
      },
    };

    const meta = metaTabs[locale] || metaTabs.de;

    // Validate OpenGraph type
    const validOGTypes = [
      "website", "article", "book", "profile", "video.movie",
      "video.episode", "video.tv_show", "video.other",
      "music.song", "music.album", "music.playlist", "music.radio_station",
    ];
    const safeType = validOGTypes.includes(meta.type) ? meta.type : "website";

    // Social preview image (og:image / twitter:image): the CMS image for this
    // locale, falling back to the German one, then to a static image. CMS
    // files live on the backoffice and are served through the /cms rewrite —
    // without the /cms prefix the URL 404s.
    const cmsImagePath =
      home.metadata?.[`metadata_images_${locale}`]?.[0]?.bild_anhagen ||
      home.metadata?.metadata_images_de?.[0]?.bild_anhagen;
    const image = cmsImagePath
      ? `https://platzhirsch.studio/cms${cmsImagePath.replace(/ /g, "%20")}`
      : "https://platzhirsch.studio/Images/Home/aboutHome.jpg";
    const canonical = `${BASE_URL}/${locale}`;

    const languages = hreflangLanguages((l) => `${BASE_URL}/${l}`);

    return {
      title: meta.title,
      description: meta.description, alternates: { canonical: canonical, languages: languages, },
      robots: { index: true, follow: true },
      openGraph: {
        type: safeType,
        url: canonical,
        siteName: meta.sitename,
        title: meta.title,
        description: meta.description,
        images: [{ url: image, alt: "Designermarken – Platzhirsch Home Living" }],
        locale: meta.locale,
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        images: [image],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);
    return fallbackMetadata(locale);
  }
}

export default async function Home({ params }) {
  const { locale } = await params;

  // Fetch all data in parallel
  const [apiData, newsData, produkte, brands, kategorienWithCounts, kategorien] = await Promise.all([
    fetchHomepage(),
    fetchSlicedNewsData(),
    fetchProdukteNewByMarke("Minotti"),
    // Brand wall + category tiles: cached 1h like everything else; a backend
    // hiccup hides the section instead of failing the page.
    fetchRawMarkenData().catch(() => []),
    fetchKategorienWithCounts(),
    fetchKategorien(),
  ]);
  // Shop card shape (categoryKey/url_slug/image) so the strip links to the
  // live /produkte/<category>/<product> pages; only 8 are shown.
  // Newest Minotti products first (the API returns alphabetical order).
  const trendingProducts = buildShopProducts(
    [...(produkte || [])].sort((a, b) => String(b.modified || "").localeCompare(String(a.modified || "")))
  ).slice(0, 8);

  const homeContent = apiData?.[0];
  const metaData = apiData?.[0];

  const title = metaData?.metadata?.[`metadata_title_${locale}`] || getFallbackMeta(locale).title;
  const description = metaData?.metadata?.[`metadata_description_${locale}`] || getFallbackMeta(locale).description;

  // Schema.org structured data for SEO
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/${locale}/#webpage`,
    url: `${BASE_URL}/${locale}`,
    name: title,
    description: description,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    isPartOf: { "@id": WEBSITE_ID },
    // The business itself (Organization + FurnitureStore) is defined once,
    // site-wide, in [locale]/layout.js — referenced here, not repeated.
    about: { "@id": ORGANIZATION_ID },
    datePublished: "2026-06-01",
  };
  // The homepage FAQ (SeoIntro) as FAQPage, same questions and answers.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}/${locale}/#faq`,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    mainEntity: homeSeo(locale).faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div>
      {/* Structured Data Scripts */}
      <JsonLd data={webPageSchema} />
      <JsonLd data={faqSchema} />
      {/* Page order follows the visitor's questions: what is this (hero), which
          brands (the strongest search demand), what can I buy (categories),
          who are you (About), what's new (products, news), why you (benefits),
          where/when (regions, showroom). All sections except About/products/
          benefits/news are server components — no carousel JS on the homepage. */}
      <Hero locale={locale} />
      <BrandWall locale={locale} brands={brands} />
      <CategoryTiles locale={locale} kategorienWithCounts={kategorienWithCounts} kategorien={kategorien} />
      <About data={homeContent?.second_content} />
      <TrendingProducts data={trendingProducts} />
      <WhyChooseUsSectionHome data={homeContent?.below_products} />
      <SeoIntro locale={locale} />
      <RegionLinks locale={locale} />
      <BlogSection data={newsData} />
      <ShowroomCta locale={locale} data={homeContent?.above_footer} />
    </div>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;