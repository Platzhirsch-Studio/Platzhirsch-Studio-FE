import { notFound } from "next/navigation"; // To handle 404 page
import BrandPage from "@/components/MarkenItems/markenitems";
import MarkenItemBanner from "@/components/MarkenItems/markenItemBanner";
import { generateSlug } from "@/lib/slugify";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData"
import { ROUTES } from "@/utils/routing";

// Fetch the paths dynamically from your API for SSG (Static Site Generation)
export async function generateStaticParams() {

  const data = await fetchRawMarkenData();

  // Extract paths from the data for each dynamic route
  return data?.map((marke) => ({
    title: generateSlug(marke?.name1),
  }));
}

// Fetch data for each dynamic page
export async function generateMetadata(context) {
  const { params } = await context;
  const { title, locale } = await params;

  const data = await fetchRawMarkenData();

  const marke = data?.find((m) => generateSlug(m?.name1) === title);

  if (!marke) {
    return {
      title: "Brand Not Found | Platzhirsch Studio",
      description: "The requested brand could not be found.",
    };
  }

  const brandSlug = generateSlug(marke?.name1);

  // Define the base path for the brand page

  // Define localized paths for each language
  const localizedPaths = {
    de: `/de/ueber-uns/marken/${brandSlug}`,
    en: `/en/about-us/brands/${brandSlug}`,
    fr: `/fr/a-propos/marques/${brandSlug}`,
    it: `/it/chi-siamo/marche/${brandSlug}`,
  };

  const canonicalUrl = `https://platzhirsch.studio${localizedPaths[locale] || localizedPaths.de}`;

  // Brand-story title, localized and distinct from the commercial product-listing page.
  const brandWord = { en: "Brand", fr: "Marque", it: "Marchio" }[locale] || "Marke";
  const pageTitle = `${marke.name1} – ${brandWord} | Platzhirsch Studio`;

  const metadata = {
    title: pageTitle,
    description: marke?.produkte || "", // Fallback description
    // All four locales are genuinely translated and indexed — Italy + Switzerland
    // (fr/it) are target markets. hreflang below maps each locale to its counterpart.
    robots: { index: true, follow: true },
    openGraph: {
      title: pageTitle,
      description: `Learn more about ${marke.name}`,
      url: canonicalUrl,
      siteName: "Platzhirsch Studio",
      images: [
        {
          url: `/cms${marke.bild_anhagen[0].bild_anhagen}`,
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
      description: `Learn more about ${marke.name}`,
      images: [`/cms${marke.bild_anhagen[0].bild_anhagen}`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'de': `https://platzhirsch.studio/de/ueber-uns/marken/${brandSlug}`,
        'en': `https://platzhirsch.studio/en/about-us/brands/${brandSlug}`,
        'fr': `https://platzhirsch.studio/fr/a-propos/marques/${brandSlug}`,
        'it': `https://platzhirsch.studio/it/chi-siamo/marche/${brandSlug}`,
        'x-default': `https://platzhirsch.studio/de/ueber-uns/marken/${brandSlug}`,

      }
    },
  };

  // Handle language-specific metadata
  switch (locale) {
    case "en":
      if (marke?.metadata_description_en) {
        metadata.description = marke?.metadata_description_en;
      }
      break;

    case "it":
      if (marke?.metadata_description_it) {
        metadata.description = marke?.metadata_description_it;
      }
      break;
    case "fr":
      if (marke?.metadata_description_fr) {
        metadata.description = marke?.metadata_description_fr;
      }
      break;
    default:
      if (marke?.metadata_description_de) {
        metadata.description = marke?.metadata_description_de;
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

  const linkNameOne =
    locale == "it"
      ? "SU DI NOI"
      : locale == "en"
        ? "ABOUT US"
        : locale == "fr"
          ? "À PROPOS"
          : "ÜBER UNS";
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
      ? "Casa "
      : locale == "en"
        ? "Home"
        : locale == "fr"
          ? "Accueil"
          : "Home";


  const markenPath = ROUTES.marken[locale] ? `${ROUTES.marken[locale]}` : `/ueber-uns/karriere`;

  const BannerInfo = {
    image: marke.bild_anhagen?.[0]?.bild_anhagen
      ? `/cms${marke.bild_anhagen[0].bild_anhagen}`
      : "/Images/fallback-banner.jpg",
    links: [
      {
        linkName: Home,
        link: "/",
      },
      {
        linkName: linkNameOne,
      },
      {
        linkName: linkNameTwo,
        link: markenPath, // ✅ Has link
      },
      {
        linkName: marke?.name1,
        link: `${markenPath}/${generateSlug(marke.name1)}`
      },
    ],
    title: marke?.name1, // Added title property
  };
  return (
    <div className="">
      <MarkenItemBanner info={BannerInfo} />
      <BrandPage marke={marke} />
    </div>
  );
}