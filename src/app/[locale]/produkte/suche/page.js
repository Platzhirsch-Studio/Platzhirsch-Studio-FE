// /[locale]/produkte/suche?q=… – catalogue search (F6), moved off the hub in
// Runde 2 (technik P2-1) so /produkte stays static and cacheable. Served at
// /en/products/suche, /fr/produits/suche, /it/prodotti/suche as well (the
// "[category]" pathname of the proxy rewrites to this static segment).
// SEO: noindex, follow; canonical = the hub without query, never in the
// sitemap. Without q → back to the hub.
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CatalogHeader from "@/components/ShopCatalog/catalogHeader";
import { withFallback } from "@/components/ShopCatalog/copy";
import ShopCategoryGrid from "@/components/ShopCatalog/shopCategoryGrid";
import { CatalogSearchForm, CatalogSearchResults, searchCopy } from "@/components/ShopCatalog/catalogSearch";
import { normalizeQuery, searchCatalog } from "@/lib/shop/catalogSearch";
import { loadHubSections } from "@/lib/shop/hubSections";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { productsPath, ROUTES } from "@/utils/routing";

const TITLE = { de: "Produktkatalog", en: "Product Catalog", fr: "Catalogue Produits", it: "Catalogo prodotti" };
const HOME = { de: "Home", en: "Home", fr: "Accueil", it: "Home" };
const PRODUCTS = { de: "Produkte", en: "Products", fr: "Produits", it: "Prodotti" };

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const q = normalizeQuery((await searchParams)?.q);
  const c = searchCopy(locale);
  const meta = buildPageMetadata({ locale, pathByLocale: ROUTES.produkte, title: q ? c.title(q) : TITLE[locale] || TITLE.de, description: c.label });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function CatalogSearchPage({ params, searchParams }) {
  const { locale } = await params;
  const q = normalizeQuery((await searchParams)?.q);
  const hubHref = `/${locale}${productsPath(locale)}`;
  if (!q) redirect(hubHref);

  const t = await getTranslations({ locale, namespace: "shop" });
  const tMenu = await getTranslations({ locale, namespace: "ProductsMenu" });
  const tc = withFallback(t, locale, "shop");
  const basePath = productsPath(locale);
  const { categories, sections } = await loadHubSections(locale, { t, tMenu });
  const hits = await searchCatalog(q, locale, { categories });
  const crumbs = [
    { label: HOME[locale] || HOME.de, href: "/" },
    { label: PRODUCTS[locale] || PRODUCTS.de, href: basePath },
    { label: searchCopy(locale).submit },
  ];

  return (
    <div>
      <CatalogHeader crumbs={crumbs} eyebrow={tc("catalog.hubEyebrow")} title={TITLE[locale] || TITLE.de} lead={null} compact>
        <CatalogSearchForm locale={locale} q={q} />
      </CatalogHeader>
      <CatalogSearchResults locale={locale} q={q} hits={hits} basePath={basePath} />
      <ShopCategoryGrid sections={sections} locale={locale} basePath={basePath} jumpLabel={tc("catalog.jumpTo")} />
    </div>
  );
}
