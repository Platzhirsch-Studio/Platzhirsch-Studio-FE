import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CatalogHeader from "@/components/ShopCatalog/catalogHeader";
import { withFallback } from "@/components/ShopCatalog/copy";
import { Container, Heading } from "@/components/ui";
import { getCategoryImage } from "@/lib/shop/categoryImages";
import { categoryAlias } from "@/lib/shop/categoryAliases";
import ShopCatalog from "@/components/ShopCatalog/shopCatalog";
import { fetchProdukteByKategorie, fetchProduktePaths } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts, compactShopProduct } from "@/lib/shop/shopProducts";
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
import { findBrandBySlug } from "@/lib/seo/legacyProductRedirects";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { PRODUCTS_PER_PAGE } from "@/lib/shop/catalogQuery";
import { typoQuotes } from "@/lib/shop/format";

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
// Brands of a category ordered by product count — used for the meta
// description AND the visible intro sentence, so both name the same brands.
function topBrandsOf(products) {
  const counts = new Map();
  for (const p of products) if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([brand]) => brand);
}

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
  const { title, description } = categorySeo(locale, { label, count: products.length, brands: topBrandsOf(products), key: categorySlug });
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
  if (!category) {
    // Old short slug with exactly one current category (/produkte/sofas ->
    // /produkte/sofas-couches): permanent redirect, only if the target exists.
    const alias = categoryAlias(categorySlug);
    if (alias && (await resolveCategory(locale, alias))) {
      permanentRedirect(`/${locale}${productsPath(locale, alias)}`);
    }
    // Legacy catalogue URL /produkte/{brand} (the old site listed products by
    // brand here, ~35 indexed URLs per locale): send it permanently to the
    // brand story page, which is where that intent lives now.
    const brand = await findBrandBySlug(categorySlug);
    if (brand) {
      permanentRedirect(`/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}/${generateSlug(brand.name1)}`);
    }
    notFound();
  }

  const { categoryKey, products, label: categoryLabel } = category;
  // Sourced from the Sub Kategorie CMS list, not derived by counting products
  // (same reasoning as the category hub itself) — so the subcategory filter
  // shows up immediately, before any product has actually been tagged with one.
  const subCategoryOptions = getSubKategorienForCategory(subKategorien, categoryKey, locale);
  // Colors/materials are global (not scoped to one category, unlike
  // subcategories) — same CMS-list-not-product-counts reasoning as above.
  const colorOptions = getFarbenOptions(farben, locale);
  const materialOptions = getMaterialienOptions(materialien, locale);

  // R9-P5 (seo P2-1): one home label per language, visible and in JSON-LD (DE „Startseite“).
  const Home = homeCrumbLabel(locale);
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  const productPath = productsPath(locale);

  // Visible trail; the BreadcrumbList JSON-LD stays in the graph below.
  const crumbs = [{ label: Home, href: "/" }, { label: productsLabel, href: productPath }, { label: categoryLabel }];
  const tc = withFallback(await getTranslations({ locale, namespace: "shop" }), locale, "shop");

  // Room picture between the tiles (Bibel §6: after every 6–9 products):
  // only the category's own picture – the CMS image or its mapped room shot.
  // No neutral/foreign room shots any more (QA P2-7: coloured glass objects
  // in "Sofas"); later pauses are text bands. getCategoryImage() rotates
  // generic shots for unmapped slugs – those don't count as "own".
  const cmsImage = category.cms?.image ? `/cmx${category.cms.image}` : null;
  const mappedImage = getCategoryImage(categorySlug, 0) === getCategoryImage(categorySlug, 1) ? getCategoryImage(categorySlug, 0) : null;
  const interludeImages = [cmsImage || mappedImage].filter(Boolean);
  const seo = categorySeo(locale, { label: categoryLabel, count: products.length, brands: topBrandsOf(products), key: categorySlug });
  const topBrands = topBrandsOf(products).slice(0, 3);
  // Short lead (≤ 2 lines on a phone, QA P2-6): filter bar and first tile
  // move into the first screen; the full SEO sentence sits below the grid.
  const shortLead = tc("catalog.categoryLead", { brands: topBrands.join(", "), hasBrands: topBrands.length ? "yes" : "no" });

  const catalogProps = {
    // Without empty fields (R6-produkt-perf: smaller RSC payload).
    products: products.map(compactShopProduct),
    excludeGroups: ["category"],
    subCategoryOptions,
    colorOptions,
    materialOptions,
    interludeImages,
    // Public URL of this category (translated path), for the real
    // "?seite=n+1" link of "Mehr Produkte anzeigen".
    basePath: `/${locale}${productsPath(locale, categorySlug)}`,
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
      <CatalogHeader
        crumbs={crumbs}
        eyebrow={tc("catalog.categoryEyebrow", { count: products.length })}
        title={categoryLabel}
        lead={shortLead}
        compact
      />

      {/* The catalogue reads ?marke= (brand pages link here with it) and its
          own ?typ=…&seite=… after hydration; the prerendered HTML is the
          unfiltered first batch for crawlers. R6-produkt-perf: no
          useSearchParams any more – it made the whole catalogue bail out to
          client rendering on every load. No Suspense boundary around the grid: React 19 outlines large
          boundaries out of <main> (hidden until JS runs). */}
      <ShopCatalog {...catalogProps} />

      {/* The same sentence as the meta description (brands, showroom,
          service area) – what Google shows is on the page, below the grid. */}
      {products.length > 0 && (
        <Container className="pb-section">
          <section aria-labelledby="category-about" className="border-t border-line pt-10 lg:grid lg:grid-cols-12 lg:gap-grid lg:pt-14">
            <Heading id="category-about" level={2} size="title" className="lg:col-span-4">
              {tc("catalog.aboutCategory")}
            </Heading>
            <p className="mt-4 max-w-measure text-body text-text-soft lg:col-span-8 lg:mt-0">{seo.description}</p>
          </section>
        </Container>
      )}

      {/* R9-P5 (seo P2-13 aus r5-seo, R4 P2-2): ?seite=n is only a view state
          of this one document (client-side, canonical = this page, robots.js
          keeps /*?* closed). So that no product beyond the first batch
          depends on that URL, every product of the category is linked here in
          the server HTML – a plain A–Z list, folded on every screen size. */}
      {products.length > PRODUCTS_PER_PAGE && (
        <Container className="pb-section">
          <details className="group/details border-t border-line pt-6">
            {/* QM wm-fix3: own marker instead of the browser's ▶ (list-none + WebKit marker hidden). */}
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-2 text-body text-text-soft underline-offset-4 hover:underline focus-visible:underline [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center border border-line-strong text-small leading-none text-text transition-transform duration-(--duration-micro) group-open/details:rotate-45">
                +
              </span>
              {tc("catalog.allModels", { count: products.length })}
            </summary>
            <ul className="mt-4 grid gap-x-grid gap-y-2 text-small sm:grid-cols-2 lg:grid-cols-3">
              {/* Endtest 29.10.: variants share one url_slug – link each product URL once
                  (duplicate React keys / duplicate links, smoke /de/produkte/lamps). */}
              {[...new Map(products.map((p) => [`${p.categoryKey}/${p.url_slug}`, p])).values()]
                .sort((a, b) => `${a.brand || ""} ${a.name}`.localeCompare(`${b.brand || ""} ${b.name}`, locale))
                .map((p) => (
                  <li key={`${p.categoryKey}/${p.url_slug}`}>
                    <a
                      href={`/${locale}${productsPath(locale, generateSlug(p.categoryKey), p.url_slug)}`}
                      className="inline-block py-1 text-text underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {typoQuotes(p.brand ? `${p.brand} ${p.name}` : p.name, locale)}
                    </a>
                  </li>
                ))}
            </ul>
          </details>
        </Container>
      )}
    </div>
  );
}
