import { NextResponse } from "next/server";
import { fetchProdukteByKategorie, fetchProduktePaths, searchProdukte } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { fetchKategorien, fetchMarkeKategorien, getKategorieLabel, indexKategorienByKey } from "@/lib/api/fetchKategorien";
import { getActiveMarken } from "@/lib/api/fetchMarkenData";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath } from "@/utils/routing";

// Powers the navbar search dropdown: matches the query against real brands
// (Marken), shop categories, and products (same data as /produkte and
// /about-us/brands) and returns ready-to-use, locale-word hrefs (no locale
// prefix — the navbar's own localizeHref() adds that, same as every other
// nav link).

// How many matched categories get a "<category> nach Marke" group, and how
// many brands each group lists (most products first).
const CATEGORY_BRAND_GROUPS = 2;
const BRANDS_PER_CATEGORY = 8;
// Same for a brand search: "<brand> – Kategorien" groups / categories each.
const BRAND_CATEGORY_GROUPS = 2;
const CATEGORIES_PER_BRAND = 8;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const locale = ["de", "en", "fr", "it"].includes(searchParams.get("locale"))
    ? searchParams.get("locale")
    : "de";

  if (q.length < 2) {
    return NextResponse.json({ brands: [], categories: [], categoryBrands: [], brandCategories: [], products: [] });
  }

  const needle = q.toLowerCase();
  // Locale-invariant: the category/product pages only exist under the
  // German-named produkte folder (the translated /products/... would 404).
  // Translated catalogue base for this locale (/produkte, /products, …).
  const shopPath = productsPath(locale);
  const markenPath = ROUTES.marken[locale] || "/ueber-uns/marken";

  // Products are matched by the backend (search_produkte, max 6 rows) instead
  // of downloading every product and filtering here.
  const [rawProducts, paths, kategorien, marken] = await Promise.all([
    searchProdukte(q, 6),
    fetchProduktePaths(),
    fetchKategorien(),
    getActiveMarken(),
  ]);
  const shopProducts = buildShopProducts(rawProducts);
  const kategorienByKey = indexKategorienByKey(kategorien);

  const labelForCategory = (categoryKey) => {
    const cms = kategorienByKey.get(categoryKey);
    return cms ? getKategorieLabel(cms, locale) : localizeCategory(categoryKey, locale);
  };

  // Brands — matched first: a query naming a manufacturer (e.g. "Minotti")
  // should surface the brand's own page, not just its products buried in a
  // product list.
  const brands = marken
    .filter((m) => m?.name1?.toLowerCase().includes(needle))
    .slice(0, 3)
    .map((m) => ({
      name: m.name1,
      image: m.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${m.bild_anhagen[0].bild_anhagen}` : null,
      href: `${markenPath}/${generateSlug(m.name1)}`,
    }));

  const categoryKeys = new Set(paths.map((p) => (p.kategories || "").toLowerCase()).filter(Boolean));
  for (const key of kategorienByKey.keys()) categoryKeys.add(key);

  // Matched against the localized label (what's shown), the raw CMS key, and
  // the English label — the category slug in the URL is always the English
  // CMS key regardless of locale (e.g. /de/produkte/beds, not /betten),
  // so typing "Beds" while browsing in German still has to find "Betten".
  const matchedCategories = [...categoryKeys]
    .map((key) => ({
      key,
      label: labelForCategory(key),
      enLabel: localizeCategory(key, "en"),
    }))
    .filter(
      (c) =>
        (c.label && c.label.toLowerCase().includes(needle)) ||
        c.key.toLowerCase().includes(needle) ||
        (c.enLabel && c.enLabel.toLowerCase().includes(needle))
    )
    .slice(0, 5);

  const categories = matchedCategories.map((c) => ({
    label: c.label,
    href: `${shopPath}/${generateSlug(c.key)}`,
  }));

  // "Sofas nach Marke": for the best-matching categories, every brand that
  // has products there, each linking to the category page with that brand
  // pre-selected (?marke=<brand-slug>, read by ShopCatalogFromUrl). Brands are
  // derived from the category's own product list (cached per category).
  const logoByBrand = new Map(
    marken.map((m) => [m.name1, m.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${m.bild_anhagen[0].bild_anhagen}` : null])
  );
  const categoryBrands = (
    await Promise.all(
      matchedCategories.slice(0, CATEGORY_BRAND_GROUPS).map(async (c) => {
        const cms = kategorienByKey.get(c.key);
        const products = buildShopProducts(await fetchProdukteByKategorie(cms?.name || c.key));
        const countByBrand = new Map();
        for (const p of products) if (p.brand) countByBrand.set(p.brand, (countByBrand.get(p.brand) || 0) + 1);
        const categoryHref = `${shopPath}/${generateSlug(c.key)}`;
        return {
          categoryLabel: c.label,
          categoryHref,
          brands: [...countByBrand.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, BRANDS_PER_CATEGORY)
            .map(([name, count]) => ({
              name,
              count,
              image: logoByBrand.get(name) || null,
              href: `${categoryHref}?marke=${generateSlug(name)}`,
            })),
        };
      })
    )
  ).filter((group) => group.brands.length > 0);

  // Products — a brand match here is what makes brand search feel complete:
  // typing "Minotti" doesn't just link to the brand page, it also previews
  // the brand's own products right below it (see the brands section above).
  // The backend already filtered on name/brand; the sort below just keeps the
  // name-starts-with ranking stable.
  const products = shopProducts
    .sort((a, b) => {
      const aStarts = a.name?.toLowerCase().startsWith(needle) ? 0 : 1;
      const bStarts = b.name?.toLowerCase().startsWith(needle) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, 6)
    .map((p) => ({
      name: p.name,
      brand: p.brand,
      image: p.image,
      categoryLabel: labelForCategory(p.categoryKey),
      href: `${shopPath}/${generateSlug(p.categoryKey)}/${p.url_slug}`,
    }));

  // "Minotti – Kategorien": for the matched brands, every category the brand
  // has products in, each linking to that category with the brand
  // pre-selected (?marke=<brand-slug>). Most products first.
  const matchedBrandNames = marken
    .filter((m) => m?.name1?.toLowerCase().includes(needle))
    .slice(0, BRAND_CATEGORY_GROUPS)
    .map((m) => m.name1);
  const brandCategories = (
    await Promise.all(
      matchedBrandNames.map(async (brandName) => {
        const brandSlug = generateSlug(brandName);
        const kats = await fetchMarkeKategorien(brandName);
        return {
          brandName,
          brandHref: `${markenPath}/${brandSlug}`,
          categories: kats
            .filter((k) => k.category_key && Number(k.produkt_count) > 0)
            .sort((a, b) => Number(b.produkt_count) - Number(a.produkt_count))
            .slice(0, CATEGORIES_PER_BRAND)
            .map((k) => {
              const key = k.category_key.toLowerCase();
              return {
                label: getKategorieLabel(k, locale) || labelForCategory(key),
                count: Number(k.produkt_count) || 0,
                image: k.image ? `/cmx${k.image}` : null,
                href: `${shopPath}/${generateSlug(key)}?marke=${brandSlug}`,
              };
            }),
        };
      })
    )
  ).filter((group) => group.categories.length > 0);

  // A category search ("sofas") answers with that category's brands and a
  // brand search ("Minotti") with that brand's categories — not a list of
  // individual products. Products stay for other searches (e.g. a product
  // name like "Toulouse") that match neither.
  const showProducts = categoryBrands.length === 0 && brandCategories.length === 0;
  return NextResponse.json({
    brands,
    categories,
    categoryBrands,
    brandCategories,
    products: showProducts ? products : [],
  });
}
