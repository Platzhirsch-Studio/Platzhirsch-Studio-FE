import { notFound } from "next/navigation"; // To handle 404 page
import JsonLd from "@/components/Reusable/JsonLd";
import BrandPage from "@/components/MarkenItems/markenitems";
import { generateSlug } from "@/lib/slugify";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData"
import { fetchKategorienByMarke } from "@/lib/api/fetchKategorien";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { buildBrandNode } from "@/lib/seo/brandSchema";
import { hreflangLanguages, toMetaDescription } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/utils/routing";

// Fetch the paths dynamically from your API for SSG (Static Site Generation)
export async function generateStaticParams() {

  const data = await fetchRawMarkenData();

  // Extract paths from the data for each dynamic route
  return data?.map((marke) => ({
    title: generateSlug(marke?.name1),
  }));
}

const BRAND_TITLE_OVERRIDES = {
  minotti: {
    de: "Minotti Händler Vorarlberg | Platzhirsch Home Living",
    en: "Minotti Dealer Vorarlberg | Platzhirsch Home Living",
    fr: "Minotti Revendeur Vorarlberg | Platzhirsch Home Living",
    it: "Minotti Rivenditore Vorarlberg | Platzhirsch Home Living",
  },
  poliform: {
    de: "Poliform Händler Vorarlberg | Platzhirsch Home Living",
    en: "Poliform Dealer Vorarlberg | Platzhirsch Home Living",
    fr: "Poliform Revendeur Vorarlberg | Platzhirsch Home Living",
    it: "Poliform Rivenditore Vorarlberg | Platzhirsch Home Living",
  },
  tonon: {
    de: "Tonon Händler Vorarlberg | Platzhirsch Home Living",
    en: "Tonon Dealer Vorarlberg | Platzhirsch Home Living",
    fr: "Tonon Revendeur Vorarlberg | Platzhirsch Home Living",
    it: "Tonon Rivenditore Vorarlberg | Platzhirsch Home Living",
  },
  "paola-lenti": {
    de: "Paola Lenti Showroom Österreich | Platzhirsch Home Living",
    en: "Paola Lenti Showroom Austria | Platzhirsch Home Living",
    fr: "Paola Lenti Showroom Autriche | Platzhirsch Home Living",
    it: "Paola Lenti Showroom Austria | Platzhirsch Home Living",
  },
  next125: {
    de: "Next125 Küchen Händler Vorarlberg | Platzhirsch Home Living",
    en: "Next125 Kitchen Dealer Vorarlberg | Platzhirsch Home Living",
    fr: "Next125 Revendeur Cuisines Vorarlberg | Platzhirsch Home Living",
    it: "Next125 Rivenditore Cucine Vorarlberg | Platzhirsch Home Living",
  },
};
// Fetch data for each dynamic page
export async function generateMetadata(context) {
  const { params } = await context;
  const { title, locale } = await params;

  const data = await fetchRawMarkenData();

  const marke = data?.find((m) => generateSlug(m?.name1) === title);
  if (!marke) {
    return {
      title: "Brand Not Found | Platzhirsch Home Living",
      description: "The requested brand could not be found.",
      robots: { index: false, follow: true },
    };
  }


  const brandSlug = generateSlug(marke?.name1);

  // Define the base path for the brand page
  const basePath = '/ueber-uns/marken';

  // Define localized paths for each language
  const localizedPaths = {
    de: `/de/ueber-uns/marken/${brandSlug}`,
    en: `/en/about-us/brands/${brandSlug}`,
    fr: `/fr/a-propos/marques/${brandSlug}`,
    it: `/it/chi-siamo/marche/${brandSlug}`,
  };
  const canonicalUrl = `https://platzhirsch.studio${localizedPaths[locale] || localizedPaths.de}`;

  // Brand-story title, localized and distinct from the commercial product-listing
  // page (/produkte/[marke]) so the two pages don't collide on <title>.
  const brandWord = { en: "Design Brand", fr: "Marque de design", it: "Marchio di design" }[locale] || "Designmarke";
  const pageTitle =
    BRAND_TITLE_OVERRIDES[brandSlug]?.[locale] ||
    `${marke.name1} – ${brandWord} | Platzhirsch Home Living`;

  const metadata = {
    title: pageTitle,
    // Fallback: the brand intro, trimmed to snippet length (the CMS
    // metadata_description_<locale> below wins where it exists).
    description: toMetaDescription(marke?.produkte || ""),
    // All four locales are genuinely translated and indexed — Italy + Switzerland
    // (fr/it) are target markets. hreflang below maps each locale to its counterpart.
    robots: { index: true, follow: true },
    openGraph: {
      title: pageTitle,
      description: "",
      url: canonicalUrl,
      siteName: "Platzhirsch Home Living",
      images: [
        {
          url: marke.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${marke.bild_anhagen[0].bild_anhagen}` : "/Images/fallback-banner.jpg",
          width: 1200,
          height: 630,
          alt: marke.name1,
        },
      ],
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_AT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: "",
      images: [marke.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${marke.bild_anhagen[0].bild_anhagen}` : "/Images/fallback-banner.jpg"],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangLanguages((l) => `https://platzhirsch.studio/${l}${ROUTES.marken[l]}/${brandSlug}`),
    },
  };

  // Handle language-specific metadata
  switch (locale) {
    case "en":
      if (marke?.metadata_description_en) {
        metadata.description = toMetaDescription(marke.metadata_description_en);
      }
      break;

    case "it":
      if (marke?.metadata_description_it) {
        metadata.description = toMetaDescription(marke.metadata_description_it);
      }
      break;
    case "fr":
      if (marke?.metadata_description_fr) {
        metadata.description = toMetaDescription(marke.metadata_description_fr);
      }
      break;
    default:
      if (marke?.metadata_description_de) {
        metadata.description = toMetaDescription(marke.metadata_description_de);
      }
      break;
  }

  // Update OpenGraph and Twitter descriptions with the localized description
  // metadata.description = metadata.description;
  metadata.openGraph.description = metadata.description;
  metadata.twitter.description = metadata.description;

  return metadata;
}

export default async function MarkenDetailPage(props) {
  // Wait for params to resolve
  const { title, locale } = await props.params;

  const data = await fetchRawMarkenData();

  const marke = data?.find((m) => generateSlug(m?.name1) === title);
  if (!marke) {
    notFound();
  }

  // Check if brand is active - if not, show 404
  if (marke.status !== "Aktiv") {
    notFound();
  }

  // Category tiles + collections ("Ausgewählte Produkte") for this brand, fetched server-side.
  const [kategorien, collections] = await Promise.all([
    fetchKategorienByMarke(marke.name1),
    fetchCollectionsByMarke(marke.name1),
  ]);

  const linkNameTwo =
    locale == "it"
      ? "Marche"
      : locale == "en"
        ? "Brands"
        : locale == "fr"
          ? "Marques"
          : "Marken";
  const Home =
    locale == "it"
      ? "Home"
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";

  // JSON-LD for the brand-story page: an AboutPage whose mainEntity is the Brand,
  // plus a BreadcrumbList. URLs are absolute (JSON-LD is parsed independently).
  const DOMAIN = "https://platzhirsch.studio";
  const storyPaths = {
    de: `/de/ueber-uns/marken/${title}`,
    en: `/en/about-us/brands/${title}`,
    fr: `/fr/a-propos/marques/${title}`,
    it: `/it/chi-siamo/marche/${title}`,
  };
  const markenBase = {
    de: `${DOMAIN}/de/ueber-uns/marken`,
    en: `${DOMAIN}/en/about-us/brands`,
    fr: `${DOMAIN}/fr/a-propos/marques`,
    it: `${DOMAIN}/it/chi-siamo/marche`,
  };
  const pageUrl = `${DOMAIN}${storyPaths[locale] || storyPaths.de}`;
  const brandWord = { en: "Design Brand", fr: "Marque de design", it: "Marchio di design" }[locale] || "Designmarke";
  const brandDesc =
    marke[`metadata_description_${locale}`] || marke.metadata_description_de ||
    marke[`beschreibung_${locale}`] || marke.beschreibung || "";
  const brandImage = marke.bild_anhagen?.[0]?.bild_anhagen
    ? `${DOMAIN}/cmx${marke.bild_anhagen[0].bild_anhagen}`
    : `${DOMAIN}/Images/fallback-banner.jpg`;

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}/#webpage`,
    url: pageUrl,
    name: `${marke.name1} – ${brandWord}`,
    // Localized prose lives on the page node; the Brand node (mainEntity) stays a
    // stable, language-independent identity so it merges across locales + pages.
    ...(brandDesc ? { description: brandDesc } : {}),
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": `${DOMAIN}/#website` },
    primaryImageOfPage: brandImage,
    mainEntity: buildBrandNode(marke, title),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: `${DOMAIN}/${locale}` },
        { "@type": "ListItem", position: 2, name: linkNameTwo, item: markenBase[locale] || markenBase.de },
        { "@type": "ListItem", position: 3, name: marke.name1, item: pageUrl },
      ],
    },
  };

  return (
    <div className="">
      <JsonLd data={brandSchema} />
      <BrandPage marke={marke} kategorien={kategorien} collections={collections} />
    </div>
  );
}