import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/utils/routing";
import ProduktePage from "@/app/[locale]/produkte/page";
import BeratungPage from "@/app/[locale]/beratung/page";
import NewsPage from "@/app/[locale]/news/page";
import KontaktPage from "@/app/[locale]/kontakt/page";
import MerklistePage from "@/app/[locale]/merkliste/page";
import UeberUnsPage from "@/components/Unusable/page";
import Impressum from "@/app/[locale]/impressum/page";

export default async function DynamicPage({ params }) {
  const { locale, slug } = await params;

  // Handle German default locale redirects

  const getPageType = () => {
    const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    for (const [routeKey, translations] of Object.entries(ROUTES)) {
      const translatedPath = translations[locale];
      if (!translatedPath) continue;

      const cleanPath = translatedPath.startsWith("/") ? translatedPath.slice(1) : translatedPath;

      // Exact match
      if (cleanSlug === cleanPath) {
        return routeKey;
      }

      // Subpath match (for ueber)
      if (cleanSlug.startsWith(`${cleanPath}/`) && routeKey === "ueber") {
        return routeKey;
      }
    }

    return "generic";
  };

  const pageType = getPageType();

  if (pageType === "generic") {
    return notFound();
  }

  // Component mapping
  const componentMap = {
    produkte: ProduktePage,
    beratung: BeratungPage,
    news: NewsPage,
    kontakt: KontaktPage,
    merkliste: MerklistePage,
    ueber: UeberUnsPage,
    impressum: Impressum,
  };

  const PageComponent = componentMap[pageType];
  if (!PageComponent) {
    console.error("No PageComponent found for:", pageType);
    return notFound();
  }

  return <PageComponent params={params} />;
}

// Generate static paths for all locales
export async function generateStaticParams() {
  const params = [];

  Object.entries(ROUTES).forEach(([routeKey, translations]) => {
    Object.entries(translations).forEach(([lang, path]) => {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;

      // Base path
      params.push({ locale: lang, slug: cleanPath });

      // Example subpaths for dynamic routes
      if (routeKey === "ueber") {
        params.push({ locale: lang, slug: `${cleanPath}/team` });
        params.push({ locale: lang, slug: `${cleanPath}/management` });
      }
      // Add other route subpaths as needed
    });
  });

  return params;
}

// ADD THIS - Export generateMetadata for the dynamic route
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;


  const getPageType = () => {
    const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    for (const [routeKey, translations] of Object.entries(ROUTES)) {
      const translatedPath = translations[locale];
      if (!translatedPath) continue;

      const cleanPath = translatedPath.startsWith("/") ? translatedPath.slice(1) : translatedPath;

      if (cleanSlug === cleanPath) {
        return routeKey;
      }

      if (cleanSlug.startsWith(`${cleanPath}/`)) {
        return routeKey;
      }
    }

    return "generic";
  };

  const pageType = getPageType();

  // If it's the kontakt page, call KontaktPage's generateMetadata
  if (pageType === 'kontakt') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/kontakt/page');
    return kontaktGenerateMetadata({ params });
  }

  if (pageType === 'merkliste') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/merkliste/page');
    return kontaktGenerateMetadata({ params });
  }

  if (pageType === 'produkte') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/produkte/page');
    return kontaktGenerateMetadata({ params });
  }

  if (pageType === 'beratung') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/beratung/page');
    return kontaktGenerateMetadata({ params });
  }

  if (pageType === 'ueber-uns') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/components/Unusable/page');
    return kontaktGenerateMetadata({ params });
  }
  if (pageType === 'news') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/news/page');
    return kontaktGenerateMetadata({ params });
  }

  // Fallback metadata
  return {
    title: `${slug} | Platzhirsch Studio`,
    description: `Page about ${slug}`,
  };
}