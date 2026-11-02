import { getTranslations } from "next-intl/server";
import CatalogHeader from "@/components/ShopCatalog/catalogHeader";
import { withFallback } from "@/components/ShopCatalog/copy";
import ShopCategoryGrid from "@/components/ShopCatalog/shopCategoryGrid";
import { loadHubSections } from "@/lib/shop/hubSections";
import { ROUTES } from "@/utils/routing";
import { buildPageMetadata, localeUrl } from "@/lib/seo/pageMetadata";
import { breadcrumbList, collectionPageSchema, graph } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { hubSeo } from "@/lib/seo/shopSeoCopy";
import { CatalogSearchForm } from "@/components/ShopCatalog/catalogSearch";
import LegacySearchRedirect from "@/components/ShopCatalog/legacySearchRedirect";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";


const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Catalogo prodotti";
    case "en": return "Product Catalog";
    case "fr": return "Catalogue Produits";
    default: return "Produktkatalog";
  }
};

// Indexable in every locale, each at its translated hub path (/de/produkte,
// /en/products, …) with hreflang between them.
// Runde 2 (technik P2-1): the hub is static/ISR again – it no longer reads
// searchParams. The search (?q=, F6) has its own page /produkte/suche
// (noindex, follow; canonical = hub). Old links /produkte?q=… (navbar Enter)
// are forwarded on the client by LegacySearchRedirect.

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { title, description } = hubSeo(locale);
  return buildPageMetadata({ locale, pathByLocale: ROUTES.produkte, title, description });
}

// Category hub: each category gets its own dedicated page (better for SEO and for
// showcasing the products, instead of one long filtered list) — this page is the
// directory linking into /produkte/[category], grouped like the navbar's
// Produkte mega-menu (ProductsMenu.groups in messages/*.json).
// QM wm-r4: room photo for the hub head on wide screens – the first tile
// picture of a later group (the first group's photo is the tiles' LCP image).
function hubHeaderMedia(sections) {
  const list = Array.isArray(sections) ? sections : [];
  const tile = [...list.slice(1), ...list.slice(0, 1)].map((s) => s?.tiles?.find((c) => c?.image)).find(Boolean);
  return tile ? { src: tile.image, alt: tile.alt || tile.label || "" } : null;
}

export default async function ShopPage({ params }) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "shop" });
  const tMenu = await getTranslations({ locale, namespace: "ProductsMenu" });

  const title = getLocalizedTitle(locale);
  // R9-P5 (seo P2-1): one home label per language, visible and in JSON-LD (DE „Startseite“).
  const Home = homeCrumbLabel(locale);
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  const productPath = ROUTES.produkte[locale] ? `${ROUTES.produkte[locale]}` : `/produkte`;
  // Category links use the translated catalogue path (/products/…, /produits/…).
  const basePath = productPath;

  // Breadcrumb trail (visible); the BreadcrumbList JSON-LD stays in the
  // CollectionPage graph below.
  const crumbs = [{ label: Home, href: "/" }, { label: productsLabel }];
  const tc = withFallback(t, locale, "shop");

  const { categories, sections } = await loadHubSections(locale, { t, tMenu });

  // CollectionPage + ItemList of the category pages shown as tiles.
  const pageUrl = localeUrl(locale, productPath);
  const structuredData = graph(
    collectionPageSchema({
      url: pageUrl,
      name: title,
      description: hubSeo(locale).description,
      locale,
      items: sections.flatMap((s) => s.tiles).map((c) => ({
        name: c.label,
        url: localeUrl(locale, `${basePath}/${c.slug}`),
      })),
      breadcrumb: breadcrumbList([{ name: Home, url: localeUrl(locale) }, { name: productsLabel }]),
    })
  );

  return (
    <div>
      <JsonLd data={structuredData} />
      <LegacySearchRedirect locale={locale} />
      <CatalogHeader crumbs={crumbs} eyebrow={tc("catalog.hubEyebrow")} title={title} lead={hubSeo(locale).description} media={hubHeaderMedia(sections)}>
        <CatalogSearchForm locale={locale} />
      </CatalogHeader>
      {/* R6-produkt-perf (Fix): no Suspense boundary here – React 19 outlines large boundaries into a hidden <div id="S:0"> after </main>, so without JS the content was missing. */}
      <ShopCategoryGrid sections={sections} locale={locale} basePath={basePath} jumpLabel={tc("catalog.jumpTo")} />
    </div>
  );
}
