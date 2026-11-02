// src/lib/seo/sitemap/brandCategoryEntries.js
// "Marke × Kategorie" sitemap entries from live backoffice data. Called by
// getBrandEntries() (sitemapEntries.js) while BRAND_CATEGORY_SITEMAP_ENABLED
// (./brandCategorySitemap.js) is true (since R3, route wired).
//
// Only indexable combinations (>= 3 products, no collection-slug collision,
// not excluded by the backoffice audit, non-products not counted — the same
// buildBrandCategories() the page uses for robots);
// the page exists in all four locales like the collection pages.
import "server-only";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { buildBrandCategories } from "@/lib/marken/brandCategory";
import { withoutNonProducts } from "@/lib/marken/brandCategoryAudit";
import { toBrandCategoryEntries } from "@/lib/seo/sitemap/brandCategorySitemap";

export async function getBrandCategoryEntries() {
  let brands = [];
  try {
    brands = (await fetchRawMarkenData()).filter((m) => m?.status === "Aktiv" && m?.name1);
  } catch (error) {
    console.error("Error fetching brands for brand×category entries:", error);
    return [];
  }

  const perBrand = await Promise.all(
    brands.map(async (brand) => {
      const [rows, collections] = await Promise.all([
        fetchProdukteNewByMarke(brand.name1).catch(() => []),
        fetchCollectionsByMarke(brand.name1).catch(() => []),
      ]);
      return buildBrandCategories(withoutNonProducts(rows), { [brand.name1]: collections });
    })
  );

  return toBrandCategoryEntries(perBrand.flat());
}
