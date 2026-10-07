import { getTranslations } from "next-intl/server";
import BreadcrumbBar from "@/components/Reusable/breadcrumbBar";
import ShopCategoryGrid from "@/components/ShopCatalog/shopCategoryGrid";
import { fetchKategorienWithCounts } from "@/lib/api/fetchAllProdukte";
import { fetchKategorien, getKategorieLabel, getKategorieAlt } from "@/lib/api/fetchKategorien";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { getCategoryImage } from "@/lib/shop/categoryImages";
import { ROUTES } from "@/utils/routing";
import { buildPageMetadata, localeUrl } from "@/lib/seo/pageMetadata";
import { breadcrumbList, collectionPageSchema, graph } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { hubSeo } from "@/lib/seo/shopSeoCopy";


const getLocalizedTitle = (locale) => {
  switch (locale) {
    case "it": return "Catalogo Prodotti";
    case "en": return "Product Catalog";
    case "fr": return "Catalogue Produits";
    default: return "Produktkatalog";
  }
};

// Indexable in every locale, each at its translated hub path (/de/produkte,
// /en/products, …) with hreflang between them.
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { title, description } = hubSeo(locale);
  return buildPageMetadata({ locale, pathByLocale: ROUTES.produkte, title, description });
}

// Category hub: each category gets its own dedicated page (better for SEO and for
// showcasing the products, instead of one long filtered list) — this page is the
// directory linking into /produkte/[category], grouped like the navbar's
// Produkte mega-menu (ProductsMenu.groups in messages/*.json).
export default async function ShopPage({ params }) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "shop" });
  const tMenu = await getTranslations({ locale, namespace: "ProductsMenu" });

  const title = getLocalizedTitle(locale);
  const Home = locale === "it" ? "Home" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  const productPath = ROUTES.produkte[locale] ? `${ROUTES.produkte[locale]}` : `/produkte`;
  // Category links use the translated catalogue path (/products/…, /produits/…).
  const basePath = productPath;

  const breadcrumbLinks = [
    { linkName: Home, link: "/" },
    { linkName: productsLabel, link: productPath },
  ];

  const [kategorienWithCounts, kategorien] = await Promise.all([fetchKategorienWithCounts(), fetchKategorien()]);
  // Active-product count per category, straight from the backend (the hub
  // doesn't need the products themselves). Keyed by category_key, the same key
  // the CMS list and the /produkte/[category] slugs use.
  const countByKey = new Map(
    kategorienWithCounts
      .filter((k) => k.category_key)
      .map((k) => [k.category_key.toLowerCase(), Number(k.produkt_count) || 0])
  );

  // The Produkte Kategorie CMS list is the source of truth for which tiles show
  // up (it's curated on purpose, independent of what happens to have products
  // today) — the counts only decide which tiles have products. Falls back to
  // the counted categories alone if the Kategorien API is empty/unreachable,
  // so the hub never goes blank just because one of the two calls failed.
  const categorySource = kategorien.length
    ? kategorien.map((cms) => ({ categoryKey: cms.category_key, cms }))
    : [...countByKey.keys()].map((categoryKey) => ({ categoryKey, cms: null }));

  const categories = categorySource
    .map(({ categoryKey, cms }, index) => {
      const label = cms ? getKategorieLabel(cms, locale) : localizeCategory(categoryKey, locale);
      const count = countByKey.get(String(categoryKey || "").toLowerCase()) || 0;
      const slug = generateSlug(categoryKey);
      return {
        slug,
        label,
        alt: cms ? getKategorieAlt(cms, locale) : label,
        count,
        countLabel: t("resultsCount", { count }),
        // CMS image first, else a matching room photo (a room shot reads better
        // on this overview than a product cut-out, and keeps the tiles uniform).
        image: cms?.image ? `/cmx${cms.image}` : getCategoryImage(slug, index),
      };
    })
    // Only categories that actually have products get a tile.
    .filter((c) => c.count > 0);

  // Group the tiles like the navbar mega-menu (same order, same translated
  // titles). Categories the menu doesn't list yet land in a trailing
  // "more categories" group, so nothing the CMS adds is ever hidden.
  const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));
  const placed = new Set();
  const groups = (tMenu.raw("groups") || []).map((group, i) => {
    const items = group.items
      .map((item) => categoriesBySlug.get(generateSlug(item.key)))
      .filter(Boolean);
    items.forEach((c) => placed.add(c.slug));
    return { id: `group-${i + 1}`, title: group.title, items };
  });
  const rest = categories
    .filter((c) => !placed.has(c.slug))
    .sort((a, b) => a.label.localeCompare(b.label));
  if (rest.length) groups.push({ id: "group-more", title: t("moreCategories"), items: rest });

  const sections = groups
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      id: g.id,
      title: g.title,
      tiles: g.items,
      countLabel: t("resultsCount", { count: g.items.reduce((sum, c) => sum + c.count, 0) }),
    }));

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
      <BreadcrumbBar links={breadcrumbLinks} title={title} subtitle={hubSeo(locale).description} />
      <ShopCategoryGrid
        sections={sections}
        locale={locale}
        basePath={basePath}
      />
    </div>
  );
}
