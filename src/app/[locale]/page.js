// src/app/[locale]/page.js
import dynamic from "next/dynamic";
import ImageSlider from "@/components/Home/banner";
import About from "@/components/Home/about";
import BlogSection from "@/components/Home/blog";
import Choice from "@/components/Home/choice";
import { fetchSlicedNewsData } from "@/lib/api/fetchNewsData";
import { fetchHomepage } from "@/lib/api/fetchHomepage";
import { fetchProdukte } from "@/lib/api/fetchProdukteByMarken";
import { metadata } from "../layout";

// Dynamically import non-critical components
const TrendingProducts = dynamic(() => import("@/components/ProuductSectionHome/ProuductSectionHome"));
const WhyChooseUsSectionHome = dynamic(() => import("@/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome"));

const BASE_URL = "https://platzhirsch.studio";


const FALLBACK_META_BY_LOCALE = {
  de: {
    title: "Designermöbel & Interior Design in Vorarlberg | Platzhirsch Studio",
    description: "Exklusive Designermöbel & Interior Design in Vorarlberg – Marken wie Poliform, Rimadesio & Minotti. Persönliche Einrichtungsberatung für ganz Österreich.",  },
  en: {
    title: "Designer Furniture & Interior Design in Vorarlberg | Platzhirsch Studio",
    description: "Exclusive designer furniture & interior design in Vorarlberg, Austria – brands like Poliform, Rimadesio & Minotti. Personal interior consulting across Austria.",  },
  fr: {
    title: "Mobilier design & Interior Design au Vorarlberg | Platzhirsch Studio",
    description: "Mobilier design exclusif & interior design au Vorarlberg (Autriche) – marques comme Poliform, Rimadesio & Minotti. Conseil en aménagement personnalisé dans toute l'Autriche.",  },
  it: {
    title: "Mobili di design & Interior Design in Vorarlberg | Platzhirsch Studio",
    description: "Mobili di design esclusivi & interior design in Vorarlberg (Austria) – marchi come Poliform, Rimadesio & Minotti. Consulenza d'arredo personalizzata in tutta l'Austria.",  },
};

function getFallbackMeta(locale) {
  return FALLBACK_META_BY_LOCALE[locale] || FALLBACK_META_BY_LOCALE.de;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const FALLBACK_META = getFallbackMeta(locale);

  try {
    const [apiData] = await Promise.all([
      fetchHomepage(),
    ]);

    const home = apiData?.[0];


    if (!home) {
      return {
        title: FALLBACK_META.title,
        description: FALLBACK_META.description,      };
    }

    // Safely extract localized metadata fields
    const metaTabs = {
      de: {        locale: home.metadata?.metadata_local_de || "de_AT",
        sitename: home.metadata?.metadata_sitename_de || "Platzhirsch Studio",
        type: home.metadata?.metadata_type_de || "website",
        title: home.metadata?.metadata_title_de || getFallbackMeta("de").title,
        description: home.metadata?.metadata_description_de || getFallbackMeta("de").description,
        url: home.metadata?.metadata_url_de || BASE_URL,
      },
      en: {        locale: home.metadata?.metadata_local_en || "en_GB",
        sitename: home.metadata?.metadata_sitename_en || "Platzhirsch Studio",
        type: home.metadata?.metadata_type_en || "website",
        title: home.metadata?.metadata_title_en || getFallbackMeta("en").title,
        description: home.metadata?.metadata_description_en || getFallbackMeta("en").description,
        url: home.metadata?.metadata_url_en || BASE_URL,
      },
      it: {        locale: home.metadata?.metadata_local_it || "it_IT",
        sitename: home.metadata?.metadata_sitename_it || "Platzhirsch Studio",
        type: home.metadata?.metadata_type_it || "website",
        title: home.metadata?.metadata_title_it || getFallbackMeta("it").title,
        description: home.metadata?.metadata_description_it || getFallbackMeta("it").description,
        url: home.metadata?.metadata_url_it || BASE_URL,
      },
      fr: {        locale: home.metadata?.metadata_local_fr || "fr_FR",
        sitename: home.metadata?.metadata_sitename_fr || "Platzhirsch Studio",
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

    const image = home.metadata?.metadata_images_de?.[0]?.bild_anhagen
      ? `https://platzhirsch.studio${home.metadata.metadata_images_de[0].bild_anhagen}`
      : "https://platzhirsch.studio/Images/Home/aboutHome.jpg";
    const canonical = `${BASE_URL}/${locale}`;

    const languages = {
      'de': `${BASE_URL}/de`,
      'en': `${BASE_URL}/en`,
      'fr': `${BASE_URL}/fr`,
      'it': `${BASE_URL}/it`,
      'x-default': `${BASE_URL}/de`,
    };

    return {
      title: meta.title,
      description: meta.description,      alternates: { canonical: canonical, languages: languages, },
      robots: { index: true, follow: true },
      openGraph: {
        type: safeType,
        url: canonical,
        siteName: meta.sitename,
        title: meta.title,
        description: meta.description,
        images: [{ url: image, width: 1200, height: 630, alt: "Designermarken – Platzhirsch Studio" }],
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
    return {
      title: FALLBACK_META.title,
      description: FALLBACK_META.description,    };
  }
}

export default async function Home({ params }) {
  const { locale } = await params;

  // Fetch all data in parallel
  const [apiData, newsData, produkte] = await Promise.all([
    fetchHomepage(),
    fetchSlicedNewsData(),
    fetchProdukte("Minotti")
  ]);

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
    inLanguage: locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : locale === "it" ? "it-IT" : "fr-FR",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    datePublished: "2026-06-01",
    dateModified: new Date().toISOString().split("T")[0],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Platzhirsch Studio",
    url: BASE_URL,
    logo: "https://platzhirsch.studio/Images/Navbar/Logo.png",
    sameAs: [
      "https://www.instagram.com/platzhirsch.studio/",
      "https://www.facebook.com/platzhirsch.studio",
      "https://www.pinterest.com/platzhirschstudio/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+43 5574 46255",
      contactType: "customer service",
      areaServed: "AT",
      availableLanguage: ["German", "English", "Italian", "French"],
    },
  };

  return (
    <div>
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* Page Content */}
      <ImageSlider />
      <About data={homeContent?.second_content} />
      <TrendingProducts data={produkte} />
      <WhyChooseUsSectionHome data={homeContent?.below_products} />
      <BlogSection data={newsData} />
      <Choice data={homeContent?.above_footer} />
    </div>
  );
}

// Revalidate the page every hour
export const revalidate = 3600;