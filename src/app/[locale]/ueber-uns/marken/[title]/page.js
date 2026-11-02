import { notFound } from "next/navigation"; // To handle 404 page
import JsonLd from "@/components/Reusable/JsonLd";
import BrandPage from "@/components/MarkenItems/markenitems";
import { generateSlug } from "@/lib/slugify";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData"
import { fetchKategorienByMarke } from "@/lib/api/fetchKategorien";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { getTranslations } from "next-intl/server";
import { makeTr } from "@/components/MarkenItems/copy";
import { brandFacts, brandMetaText, brandSchemaText } from "@/components/MarkenItems/brandData";
import { displayBrandName } from "@/lib/content/brands";
import { buildBrandNode } from "@/lib/seo/brandSchema";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { ROUTES } from "@/utils/routing";
import { brandPageTitle } from "@/lib/marken/brandTitle";
import { brandSafeTitle, fitMetaDescription } from "@/lib/seo/brandMeta";
import { safeStaticParams } from "@/lib/marken/staticParams";
import { brandGuide } from "@/lib/content/brandGuides";

// SSG of the brand pages (Runde 4 P5, technik P1-5): backoffice list with
// try/catch + timeout (src/lib/marken/staticParams.js). On a timeout the list
// is empty and the pages render on their first visit (dynamicParams below),
// so a slow backoffice never aborts the build.
export async function generateStaticParams() {
  return safeStaticParams(
    () => fetchRawMarkenData(),
    (data) => (data || []).map((marke) => ({ title: generateSlug(marke?.name1) })),
    { label: "marken/[title]" }
  );
}

// Brands missing from the build list (timeout, new brand) render on demand.
export const dynamicParams = true;

// Titles make no dealer claim (Runde 2, seo P0-2): no "Showroom Österreich/
// Austria/Lochau", no "Händler/dealer" – except the verified dealer brands
// ClassiCon and Ezarri ("Vertragshändler"). One rule: src/lib/marken/brandTitle.js.
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
  // Runde 3 P5 (technik P2): brand once, ≤ 65 (src/lib/seo/brandMeta.js).
  // SEO-Team A (AP-7): brands with an own guide text (brandGuides.js) carry
  // "<Marke> in Vorarlberg – <Produktart> | Platzhirsch" – only for brands
  // WITHOUT a dealer claim; dealer brands and Minotti keep the claim-driven title.
  const guide = brandGuide(brandSlug, locale, displayBrandName(marke.name1));
  const pageTitle = brandSafeTitle(guide?.title || brandPageTitle(displayBrandName(marke.name1), locale), displayBrandName(marke.name1));

  // CMS metadata_description_<locale> → CMS intro → neutral sentence; page
  // language only, without dealer (UWG, ClassiCon excepted) or luxury /
  // superlative wordings (QA Runde 1, P1-1 + P2-5). See brandData.js.
  const t = await getTranslations({ locale, namespace: "marken" });
  const tr = makeTr(t, locale, "marken");
  const metaText = brandMetaText(marke, locale, tr, brandFacts(marke, locale, displayBrandName(marke.name1)));

  const metadata = {
    title: pageTitle,
    // 120–155 characters in the page language (brandMeta.js, r3-seo P2-3).
    description: fitMetaDescription(guide?.description || metaText, locale, displayBrandName(marke.name1)),
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
          url: marke.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${marke.bild_anhagen[0].bild_anhagen}` : DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: marke.name1,
        },
      ],
      locale: ogLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: "",
      images: [marke.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${marke.bild_anhagen[0].bild_anhagen}` : DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangLanguages((l) => `https://platzhirsch.studio/${l}${ROUTES.marken[l]}/${brandSlug}`),
    },
  };

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

  // Category names, collections and the brand's products (chapters per
  // category), fetched server-side. Every fetcher returns [] on errors.
  const [kategorien, collections, products] = await Promise.all([
    fetchKategorienByMarke(marke.name1),
    fetchCollectionsByMarke(marke.name1),
    fetchProdukteNewByMarke(marke.name1).catch(() => []),
  ]);

  const linkNameTwo =
    locale == "it"
      ? "Marche"
      : locale == "en"
        ? "Brands"
        : locale == "fr"
          ? "Marques"
          : "Marken";
  // "Startseite" / "Home" / "Accueil" / "Home" – same as the visible trail.
  const Home = homeCrumbLabel(locale);

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
  // Page language only, same UWG + voice filter as the visible page; no
  // German fallback on /en, /fr, /it – the field is left out (QA P1-1).
  const brandDesc = brandSchemaText(marke, locale);
  const brandImage = marke.bild_anhagen?.[0]?.bild_anhagen
    ? `${DOMAIN}/cmx${marke.bild_anhagen[0].bild_anhagen}`
    : `${DOMAIN}${DEFAULT_OG_IMAGE}`;

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
    <>
      <JsonLd data={brandSchema} />
      <BrandPage marke={marke} locale={locale} kategorien={kategorien} collections={collections} products={products} />
    </>
  );
}
// Runde 3 P5 (technik P2): brand pages are cacheable (ISR, like the brand
// index): no request-time API on this route, the data fetchers cache 1 h.
export const revalidate = 3600;
