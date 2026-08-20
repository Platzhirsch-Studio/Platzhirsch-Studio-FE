import OutdoorSection from "@/components/Outdoor/outdoor";
import BannerSlider from "@/components/Reusable/bannerSlider";
import WohnenClient from "@/components/WohnenClient/wohnenClient";
import {
  fetchProductsKeywords,
  getLocalizedProductsMetadata,
  getProductsOGImage,
  validateOGType
} from "@/lib/api/Keywords/fetchProductsKeywords";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { ROUTES } from "@/utils/routing";

function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getProductsPageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/prodotti`;
    case "en":
      return `${baseUrl}/products`;
    case "fr":
      return `${baseUrl}/produits`;
    case "de":
      return `${baseUrl}/produkte`
    default: // German
      return `${baseUrl}/produkte`;
  }
}

// Direct API call function for indoor/marken data
async function fetchIndoorData() {
  try {
    const res = await fetchRawMarkenData();

    // ✅ Filter by status "Aktiv"
    const activeItems = res?.filter(
      (item) => item.status === "Aktiv" && (item.es_gibt_produkte === 1 || item.es_gibt_produkte === "1")
    );

    return activeItems.map((item) => ({
      title: item.name1,
      description: item.produkte,
      produkte: item.produkte,
      produkte_en: item.produkte_en,
      produkte_fr: item.produkte_fr,
      produkte_it: item.produkte_it,
      image: item.bild_anhagen,
      status: item.status,
    }));
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Prodotti | Marchi di Design Esclusivi – Platzhirsch Studio";
    case "en": return "Products | Exclusive Designer Brands – Platzhirsch Studio";
    case "fr": return "Produits | Marques de Design Exclusives – Platzhirsch Studio";
    default: return "Produkte | Exklusive Designermarken – Platzhirsch Studio";
  }
};

const getLocalizedDescription = (locale) => {
  switch (locale) {
    case "it": return "Marchi di design esclusivi per un living e working elegante. Scopri l'assortimento di mobili e complementi d'arredo di Platzhirsch Studio.";
    case "en": return "Exclusive designer brands for stylish living and working. Explore Platzhirsch Studio's curated furniture and interior accessories collection.";
    case "fr": return "Marques de design exclusives pour un habitat et un travail élégants. Découvrez la sélection de mobilier de Platzhirsch Studio.";
    default: return "Exklusive Designermarken für stilvolles Wohnen und Arbeiten. Entdecken Sie die kuratierte Möbel- und Einrichtungsauswahl von Platzhirsch Studio.";
  }
};

export async function generateMetadata({ params }) {
  const { locale } = await params;

  const PAGE_URL = getProductsPageUrl(locale);

  try {
    const contactKeywords = await fetchProductsKeywords();

    if (!contactKeywords) {
      return {
        title: getLocalizedTitle(locale),
        description: getLocalizedDescription(locale),
        robots: { index: true, follow: true },
        alternates: {
          canonical: getProductsPageUrl(locale),
          languages: {
            'de': getProductsPageUrl('de'),
            'en': getProductsPageUrl('en'),
            'fr': getProductsPageUrl('fr'),
            'it': getProductsPageUrl('it'),
            'x-default': getProductsPageUrl('de'),
          }
        },
        openGraph: {
          type: "website",
          url: getProductsPageUrl(locale),
          title: getLocalizedTitle(locale),
          description: getLocalizedDescription(locale),
          siteName: "Platzhirsch Studio",
          locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
          images: [{ url:"/Images/Wohnen/bannerImage2.jpg", width: 1200, height: 630, alt:"Produkte Main Page" }],
        },
      };
    }

    const meta = getLocalizedProductsMetadata(contactKeywords, locale);
    const image = getProductsOGImage(contactKeywords);
    const safeType = validateOGType(meta?.type);

    return {
      title: meta?.title || getLocalizedTitle(locale),
      description: meta?.description || getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: {
        canonical: meta?.url || PAGE_URL,
        // ✅ Add hreflang for multilingual SEO
        languages: {
          'de': getProductsPageUrl('de'),
          'en': getProductsPageUrl('en'),
          'fr': getProductsPageUrl('fr'),
          'it': getProductsPageUrl('it'),
          'x-default': getProductsPageUrl('de'),

        }
      },
      openGraph: {
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        url: meta?.url || PAGE_URL,
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: image ? image : "/Images/Wohnen/bannerImage2.jpg",
            width: 1200,
            height: 630,
            alt: "Designermarken – Platzhirsch Studio",
          },
        ],
        locale: meta?.locale || (locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE"),
        type: safeType,
      },
      twitter: {
        card: "summary_large_image",
        title: meta?.title || getLocalizedTitle(locale),
        description: meta?.description || getLocalizedDescription(locale),
        images: [image ? image : "/Images/Wohnen/bannerImage2.jpg"],
      },
    };
  } catch (error) {
    console.error("❌ Metadata fetch error:", error);

    return {
      title: getLocalizedTitle(locale),
      description: getLocalizedDescription(locale),
      robots: { index: true, follow: true },
      alternates: { canonical: PAGE_URL },
    };
  }
}


export default async function Home({ params }) {
  const { locale } = await params;

  const images = [
    "/Images/Wohnen/bannerImage2.jpg",
    "/Images/Arbeiten/bannerImageArbeiten2.jpg",
    "/Images/Kuche/bannerImageKuche1.jpg",
    "/Images/Accessories/bannerImageAccessories1.jpg",
    "/Images/Outdoor/bannerImage5.jpg",
  ];

  const data = await fetchIndoorData();

  const SecondPart = {
    image: "/Images/Outdoor/bannerImage5.jpg",
  };

  const title = locale == "it" ? "Prodotti" : locale == "en" ? "Products" : locale == "fr" ? "Produits" : "Produkte";
  const productPath = ROUTES.produkte[locale] ? `${ROUTES.produkte[locale]}` : `/produkte`;

  const Home = locale == "it" ? "Casa " : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  const PAGE_URL = getProductsPageUrl(locale);
  const BASE_URL = getBaseUrl(locale);

  // ✅ Add JSON-LD structured data with correct URLs
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: title,
    description: "Exklusive Designermarken für stilvolles Wohnen und Arbeiten.",
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-DE",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    dateModified: new Date().toISOString().split("T")[0],
    // ✅ Add breadcrumb with correct locale paths
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: BASE_URL },
        { "@type": "ListItem", position: 2, name: title, item: PAGE_URL },
      ],
    },
  };


  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <BannerSlider
        title={title}
        links={[
          { link: "/", linkName: Home },
          { link: productPath, linkName: title },
        ]}
        images={images}
      />
      <OutdoorSection second={SecondPart} />
      <WohnenClient data={data} />
    </div>
  );
}

export const revalidate = 3600;