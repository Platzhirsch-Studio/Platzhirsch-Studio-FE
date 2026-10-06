import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import BreadcrumbBar from "@/components/Reusable/breadcrumbBar";
import ShopCatalog from "@/components/ShopCatalog/shopCatalog";
import ShopCatalogFromUrl from "@/components/ShopCatalog/shopCatalogFromUrl";
import { fetchProdukteByKategorie, fetchProduktePaths } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { fetchKategorien, getKategorieLabel, indexKategorienByKey } from "@/lib/api/fetchKategorien";
import { fetchSubKategorien, getSubKategorienForCategory } from "@/lib/api/fetchSubKategorien";
import { fetchFarben, getFarbenOptions } from "@/lib/api/fetchFarben";
import { fetchMaterialien, getMaterialienOptions } from "@/lib/api/fetchMaterialien";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath, productsPathByLocale } from "@/utils/routing";
import { buildPageMetadata, localeUrl } from "@/lib/seo/pageMetadata";
import { breadcrumbList, collectionPageSchema, graph } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { categorySeo } from "@/lib/seo/shopSeoCopy";

// Every valid /produkte/[category] slug: the curated Produkte Kategorie
// list plus any category a real product uses that the CMS list doesn't have a
// row for yet (so a brand-new `kategories` value on a product still gets a
// reachable page instead of a 404).
// Product categories come from the lightweight get_produkte_paths list, not
// from downloading every product.
function productCategoryKeys(paths) {
  return [...new Set(paths.map((p) => (p.kategories || "").toLowerCase()).filter(Boolean))];
}

async function getAllCategoryKeys() {
  const [kategorien, paths] = await Promise.all([fetchKategorien(), fetchProduktePaths()]);
  const keys = new Set(kategorien.map((k) => k.category_key));
  for (const key of productCategoryKeys(paths)) keys.add(key);
  return [...keys];
}

export async function generateStaticParams() {
  const categoryKeys = await getAllCategoryKeys();
  const locales = ["de", "en", "fr", "it"];
  const params = [];

  for (const locale of locales) {
    for (const categoryKey of categoryKeys) {
      params.push({ locale, category: generateSlug(categoryKey) });
    }
  }

  return params;
}

// Resolves a /produkte/[category] slug to its key, CMS row, label and
// products — shared by generateMetadata and the page (the fetches are cached,
// so calling it twice per request costs nothing). Returns null for a slug
// that is neither a real category nor a curated navbar menu category.
async function resolveCategory(locale, categorySlug) {
  const [kategorien, paths] = await Promise.all([fetchKategorien(), fetchProduktePaths()]);
  const kategorienByKey = indexKategorienByKey(kategorien);

  // A category is reachable as soon as either the CMS lists it or a real
  // product uses it — not gated on products existing yet, so the page doesn't
  // 404 just because the product list hasn't caught up (see produkte/page.js).
  let categoryKey =
    [...kategorienByKey.keys()].find((key) => generateSlug(key) === categorySlug) ||
    productCategoryKeys(paths).find((key) => generateSlug(key) === categorySlug);

  if (!categoryKey) {
    // Not a real CMS/product category yet — but it might still be one of the
    // navbar mega-menu's curated categories (e.g. "candles") that's been
    // announced in the nav before any CMS row or product exists for it. Show
    // an empty catalog instead of a hard 404 so that curated link never
    // dead-ends; the moment real data shows up, the branch above takes over.
    const menuGroups = (await getTranslations({ locale, namespace: "ProductsMenu" })).raw("groups") || [];
    const knownSlugs = new Set(menuGroups.flatMap((g) => g.items.map((i) => generateSlug(i.key))));
    if (!knownSlugs.has(categorySlug)) return null;
    categoryKey = categorySlug;
  }

  // Only this category's products. Products link to the Produkte Kategorie
  // docname, so pass that when the CMS has a row for this key.
  const cms = kategorienByKey.get(categoryKey);
  const products = buildShopProducts(await fetchProdukteByKategorie(cms?.name || categoryKey));
  const label = cms ? getKategorieLabel(cms, locale) : localizeCategory(categoryKey, locale);

  return { categoryKey, cms, products, label };
}

// Indexable in every locale (same /produkte/<slug> path, hreflang between
// them). A category with no products yet stays noindex — an empty page is
// thin content — and becomes indexable automatically once products exist.
export async function generateMetadata({ params }) {
  const { locale, category: categorySlug } = await params;
  const category = await resolveCategory(locale, categorySlug);
  if (!category) return { robots: { index: false, follow: true } };

  const { label, products } = category;
  const brandCounts = new Map();
  for (const p of products) if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
  const topBrands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).map(([brand]) => brand);

  const { title, description } = categorySeo(locale, { label, count: products.length, brands: topBrands });
  return buildPageMetadata({
    locale,
    pathByLocale: productsPathByLocale(categorySlug),
    title,
    description,
    image: products.find((p) => p.image)?.image,
    imageAlt: label,
    index: products.length > 0,
  });
}

export default async function ShopCategoryPage({ params }) {
  const { locale, category: categorySlug } = await params;

  const [category, subKategorien, farben, materialien] = await Promise.all([
    resolveCategory(locale, categorySlug),
    fetchSubKategorien(),
    fetchFarben(),
    fetchMaterialien(),
  ]);
  if (!category) notFound();

  const { categoryKey, products, label: categoryLabel } = category;
  // Sourced from the Sub Kategorie CMS list, not derived by counting products
  // (same reasoning as the category hub itself) — so the subcategory filter
  // shows up immediately, before any product has actually been tagged with one.
  const subCategoryOptions = getSubKategorienForCategory(subKategorien, categoryKey, locale);
  // Colors/materials are global (not scoped to one category, unlike
  // subcategories) — same CMS-list-not-product-counts reasoning as above.
  const colorOptions = getFarbenOptions(farben, locale);
  const materialOptions = getMaterialienOptions(materialien, locale);

  const Home = locale === "it" ? "Casa" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  const productPath = productsPath(locale);

  const breadcrumbLinks = [
    { linkName: Home, link: "/" },
    { linkName: productsLabel, link: productPath },
    { linkName: categoryLabel, link: null },
  ];

  const catalogProps = {
    products,
    excludeGroups: ["category"],
    subCategoryOptions,
    colorOptions,
    materialOptions,
  };

  // CollectionPage + ItemList of every product in the category (the grid only
  // renders the first batch, so this also lists the rest for crawlers).
  const pageUrl = localeUrl(locale, productsPath(locale, categorySlug));
  const structuredData = graph(
    collectionPageSchema({
      url: pageUrl,
      name: categoryLabel,
      locale,
      items: products.map((p) => ({
        name: p.brand ? `${p.brand} ${p.name}` : p.name,
        url: localeUrl(locale, productsPath(locale, generateSlug(p.categoryKey), p.url_slug)),
        image: p.image,
      })),
      breadcrumb: breadcrumbList([
        { name: Home, url: localeUrl(locale) },
        { name: productsLabel, url: localeUrl(locale, productPath) },
        { name: categoryLabel },
      ]),
    })
  );

  return (
    <div>
      <JsonLd data={structuredData} />
      <BreadcrumbBar links={breadcrumbLinks} title={categoryLabel} />

      {/* ShopCatalogFromUrl reads ?marke= (brand pages link here with it) to
          pre-select that brand; the plain catalog is the prerendered fallback. */}
      <Suspense fallback={<ShopCatalog {...catalogProps} />}>
        <ShopCatalogFromUrl {...catalogProps} />
      </Suspense>
    </div>
  );
}
