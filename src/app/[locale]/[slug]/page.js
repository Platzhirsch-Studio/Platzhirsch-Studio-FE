import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/utils/routing";
import ProduktePage from "@/app/[locale]/produkte/page";
import BeratungPage from "@/app/[locale]/beratung/page";
import NewsPage from "@/app/[locale]/news/page";
import KontaktPage from "@/app/[locale]/kontakt/page";
import MerklistePage from "@/app/[locale]/merkliste/page";
import NotFoundContent from "@/components/NotFound/NotFoundContent";

// Same ISR window as the pages this route serves (they export revalidate = 3600,
// but that export doesn't travel with the imported component).
export const revalidate = 3600;

// F5 (Runde 1, 404 mit lang + Server-Rendering): only the slugs from
// generateStaticParams() below exist. Any other single segment
// (/de/gibt-es-nicht) gets the prerendered 404 (src/app/not-found.js,
// <html lang="de">, full HTML) instead of an on-demand notFound() render,
// which Next 16 sends as an empty client-rendered shell
// (<html id="__next_error__">, no lang; reproduced with 16.3.8, 16.4.1 and
// 16.4.3, release-check.md F5).
export const dynamicParams = false;

// Same segment as NOT_FOUND_SEGMENT in src/proxy.js (target of its 404 rewrites).
const NOT_FOUND_SEGMENT = "seite-nicht-gefunden";
// Tempo & A11y (Konsolidierung, Technikprüfung „404 EN/FR/IT mit lang="de"“):
// for EN/FR/IT this segment is a real, prerendered page – the localized 404
// body INSIDE the locale layout, so the server HTML says <html lang="en|fr|it">.
// It never answers 200: src/proxy.js serves it only by rewrite with status
// 404 and no-store (also when the URL is requested directly). German keeps
// the global 404 (src/app/not-found.js, lang="de", links to EN/FR/IT).
// No notFound() here: a build-time notFound() is stored as Next 16's empty
// <html id="__next_error__"> shell (measured in platzhirsch-prodtest).
const LOCALIZED_404 = new Set(["en", "fr", "it"]);

export default async function DynamicPage({ params }) {
  const { locale, slug } = await params;

  if (slug === NOT_FOUND_SEGMENT && LOCALIZED_404.has(locale)) {
    return <NotFoundContent locale={locale} />;
  }

  // Handle German default locale redirects

  const getPageType = () => {
    const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    for (const [routeKey, translations] of Object.entries(ROUTES)) {
      const translatedPath = translations[locale];
      if (!translatedPath) continue;

      const cleanPath = translatedPath.startsWith("/") ? translatedPath.slice(1) : translatedPath;

      if (cleanSlug === cleanPath) {
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

  // Only single-segment translated slugs that this route actually serves
  // (/en/consultation, /it/contatto, …). German paths and nested About paths
  // are real folders under [locale] and must not be emitted here.
  const SERVED = new Set(["produkte", "beratung", "news", "kontakt", "merkliste"]);
  Object.entries(ROUTES).forEach(([routeKey, translations]) => {
    if (!SERVED.has(routeKey)) return;
    Object.entries(translations).forEach(([lang, path]) => {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      if (lang === "de" || cleanPath.includes("/") || cleanPath === translations.de.slice(1)) return;
      params.push({ locale: lang, slug: cleanPath });
    });
  });

  // The localized 404 target of src/proxy.js (see LOCALIZED_404 above).
  for (const lang of LOCALIZED_404) params.push({ locale: lang, slug: NOT_FOUND_SEGMENT });

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

  if (pageType === 'news') {
    // Import and call the KontaktPage's generateMetadata
    const { generateMetadata: kontaktGenerateMetadata } = await import('@/app/[locale]/news/page');
    return kontaktGenerateMetadata({ params });
  }


  // Anything else renders notFound() above — give it the translated 404 title,
  // not "<slug> | …", and keep it out of the index.
  const t = await getTranslations({ locale, namespace: "error404" });
  return {
    title: `${t("headline")} | Platzhirsch Home Living`,
    description: t("description"),
    robots: { index: false, follow: true },
  };
}