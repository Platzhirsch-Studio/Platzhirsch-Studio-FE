// src/lib/shop/hubSections.js
// Category tiles of the /produkte hub, grouped like the navbar mega-menu.
// Shared by the hub (static/ISR) and the search page /produkte/suche
// (Runde 2, technik P2-1: the hub no longer reads searchParams).
import "server-only";
import { fetchKategorienWithCounts, fetchProdukteByKategorie } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { fetchKategorien, getKategorieLabel, getKategorieAlt } from "@/lib/api/fetchKategorien";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { getCategoryImage } from "@/lib/shop/categoryImages";

/**
 * @param {{t: Function, tMenu: Function}} translators shop + ProductsMenu namespaces
 * @returns {Promise<{categories: Array, sections: Array}>}
 */
export async function loadHubSections(locale, { t, tMenu }) {
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

  // QM wm-fix3: the backend count includes backoffice duplicates (same brand,
  // name and picture entered twice), which the category page folds into one
  // tile – "Sofas & Couches" read 105 here and 98 on its own page. The tile
  // count is therefore the length of the very list the category page shows
  // (same cached get_produkte_by_kategorie call, same buildShopProducts).
  // At most 4 requests at a time (backoffice etiquette); if a list comes back
  // empty (error/timeout) the backend count stays as the fallback.
  const listedCount = new Map();
  const withProducts = categorySource.filter(({ categoryKey }) => countByKey.get(String(categoryKey || "").toLowerCase()) > 0);
  for (let i = 0; i < withProducts.length; i += 4) {
    await Promise.all(
      withProducts.slice(i, i + 4).map(async ({ categoryKey, cms }) => {
        const listed = buildShopProducts(await fetchProdukteByKategorie(cms?.name || categoryKey)).length;
        if (listed > 0) listedCount.set(String(categoryKey).toLowerCase(), listed);
      })
    );
  }

  const categories = categorySource
    .map(({ categoryKey, cms }, index) => {
      const label = cms ? getKategorieLabel(cms, locale) : localizeCategory(categoryKey, locale);
      const key = String(categoryKey || "").toLowerCase();
      const count = listedCount.get(key) ?? (countByKey.get(key) || 0);
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
      // One category in the group (Licht → Leuchten): its tile already shows the number.
      countLabel: g.items.length > 1 ? t("resultsCount", { count: g.items.reduce((sum, c) => sum + c.count, 0) }) : null,
    }));

  return { categories, sections };
}
