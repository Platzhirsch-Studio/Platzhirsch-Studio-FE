// src/app/api/known-slugs/route.js – Technik R7 (r6-technik P0-1).
// The slugs that exist on the backoffice-driven routes, for the check in
// src/proxy.js (rules: src/lib/seo/knownSlugs.js). Same fetchers and the same
// data cache as the pages and sitemaps (revalidate 3600 + tags, so the
// backoffice webhooks under src/app/revalidate/* refresh this list too).
//
// Every section carries `ok`. A section that could not be loaded is ok:false
// and the proxy lets its URLs through unchanged (fail-open): a slow or broken
// backoffice must never turn real pages into 404s. Public data only (the same
// slugs as the sitemaps), read-only, cached as one ISR entry.
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchProdukteNewByMarke, fetchProduktePaths } from "@/lib/api/fetchAllProdukte";
import { fetchKategorien } from "@/lib/api/fetchKategorien";
import { fetchNewsData } from "@/lib/api/fetchNewsData";
import { fetchKarriereData } from "@/lib/api/fetchKarrierData";
import { visibleJobs } from "@/components/Karriere/glbg";
import { buildBrandCategories } from "@/lib/marken/brandCategory";
import { withoutNonProducts } from "@/lib/marken/brandCategoryAudit";
import { CATEGORY_ALIASES } from "@/lib/shop/categoryAliases";
import { categoryAliasPrefixes } from "@/lib/seo/knownSlugs";
import { generateSlug } from "@/lib/slugify";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";

export const revalidate = 300;

const uniq = (list) => [...new Set(list.filter(Boolean))].sort();
const section = (ok, list) => (ok ? { ok: true, list: uniq(list) } : { ok: false });

async function brandSections() {
  let marken;
  try {
    marken = await fetchRawMarkenData();
  } catch {
    return { brands: { ok: false }, brandSegs: {}, active: [] };
  }
  const active = (marken || []).filter((m) => m?.status === "Aktiv" && m?.name1);
  if (!active.length) return { brands: { ok: false }, brandSegs: {}, active: [] };

  const perBrand = await Promise.all(
    active.map(async (m) => {
      const [rows, collections] = await Promise.all([
        fetchProdukteNewByMarke(m.name1).catch(() => null),
        fetchCollectionsByMarke(m.name1).catch(() => null),
      ]);
      return { slug: generateSlug(m.name1), name: m.name1, rows, collections };
    })
  );
  // The product fetcher answers [] on errors as well. Not one brand with a
  // product = the backoffice failed, not an empty catalogue → fail-open.
  const anyProducts = perBrand.some((b) => Array.isArray(b.rows) && b.rows.length);

  const brandSegs = {};
  for (const b of perBrand) {
    if (!anyProducts || b.rows === null || b.collections === null) {
      brandSegs[b.slug] = null; // unknown → the proxy lets it through
      continue;
    }
    // Same shaping as loadBrandSummary() (src/lib/marken/brandCategoryLoader.js).
    const summaries = buildBrandCategories(withoutNonProducts(b.rows), { [b.name]: b.collections });
    const categories = summaries.flatMap((s) => s.categories.map((c) => c.slug));
    const collections = b.collections.map((c) => generateSlug(c?.name));
    brandSegs[b.slug] = uniq([...collections, ...categories, ...categoryAliasPrefixes(categories)]);
  }
  return { brands: section(true, active.map((m) => generateSlug(m.name1))), brandSegs, active };
}

function menuCategorySlugs() {
  return [de, en, fr, it].flatMap((m) =>
    (m?.ProductsMenu?.groups || []).flatMap((g) => (g?.items || []).map((i) => generateSlug(i?.key)))
  );
}

export async function GET() {
  const [brandData, kategorien, paths, news, jobs] = await Promise.all([
    brandSections(),
    fetchKategorien().catch(() => []),
    fetchProduktePaths().catch(() => []),
    fetchNewsData().catch(() => []),
    // Rat 9,5 A13 (GlBG): Stellen ohne Entgeltangabe sind nicht veröffentlicht
    // (Detailseite 404); in der Vorschau (Dev, KARRIERE_PREVIEW=1) erreichbar.
    fetchKarriereData().then((j) => visibleJobs(j)).catch(() => []),
  ]);
  const backofficeUp = brandData.brands.ok;
  const pathList = Array.isArray(paths) ? paths : [];
  const productsOk = pathList.length > 0;
  const categoriesOk = productsOk && Array.isArray(kategorien) && kategorien.length > 0 && backofficeUp;

  const payload = {
    v: 1,
    generatedAt: new Date().toISOString(),
    brands: brandData.brands,
    brandSegs: brandData.brandSegs,
    // produkte/[category]: CMS categories, categories of products, the menu
    // keys, the short aliases (308) and brand slugs (308 to the brand page).
    categories: section(categoriesOk, [
      ...kategorien.map((k) => generateSlug(k?.category_key)),
      ...pathList.map((p) => generateSlug(String(p?.kategories || "").toLowerCase())),
      ...menuCategorySlugs(),
      ...Object.keys(CATEGORY_ALIASES),
      ...brandData.active.map((m) => generateSlug(m.name1)),
    ]),
    // path_field → category slug (generateStaticParams of the product page).
    products: productsOk
      ? {
          ok: true,
          map: Object.fromEntries(
            pathList
              .map((p) => [p?.path_field, generateSlug(String(p?.kategories || "").toLowerCase())])
              .filter(([path, category]) => path && category)
          ),
        }
      : { ok: false },
    // News and jobs answer [] on errors too: trust an empty list only while
    // the backoffice demonstrably answers (brand list loaded).
    news: section(
      backofficeUp || (Array.isArray(news) && news.length > 0),
      (Array.isArray(news) ? news : []).filter((n) => n?.status === "Aktiv").map((n) => generateSlug(n.name1))
    ),
    jobs: section(
      // Statische Stellen (src/lib/karriere/stellen.js) sind immer da – sie
      // allein belegen nicht, dass das Backoffice geantwortet hat.
      backofficeUp || (Array.isArray(jobs) && jobs.some((j) => !j?.statisch)),
      (Array.isArray(jobs) ? jobs : []).flatMap((j) => [generateSlug(j?.title), j?.slug])
    ),
  };
  return Response.json(payload, { headers: { "X-Robots-Tag": "noindex" } });
}
