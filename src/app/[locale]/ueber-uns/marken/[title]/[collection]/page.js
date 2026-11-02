import { notFound, permanentRedirect } from "next/navigation";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { generateSlug } from "@/lib/slugify";
import { ROUTES } from "@/utils/routing";
import { safeStaticParams } from "@/lib/marken/staticParams";
import CollectionDetail from "@/components/MarkenItems/collectionDetail";
import BrandCategoryPage from "@/components/BrandCategory/BrandCategoryPage";
import { loadCollectionPage, buildCollectionMetadata } from "@/lib/marken/collectionPage";
import { sofaplanerFamilySlug } from "@/lib/marken/sofaplanerFamily.server";
import { brandSafeTitle, collectionMetaTitle, fitMetaDescription } from "@/lib/seo/brandMeta";
import {
  generateBrandCategoryMetadata,
  getBrandCategoryAlias,
  getBrandCategoryPageData,
} from "@/lib/marken/brandCategoryLoader";

// /ueber-uns/marken/<brand>/<slug> (en/fr/it via src/proxy.js). One segment,
// two page types (R3-marken-seo, Einbau nach r2-R2-seo.md §2):
//   1. collection of the brand (wins on a slug collision),
//   2. "Marke × Kategorie" page (index from 3 products, else noindex,follow;
//      audit exclusions in @/lib/marken/brandCategoryAudit are noindex too),
//   3. unique short alias of a category ("sofas" → "sofas-couches"): 308,
//   4. otherwise 404.
// Both loaders are React-cached, so metadata and page fetch once.

// Runde 4 P5 (seo P1-1): a "Marke × Kategorie" page without a single model in
// its gallery (backoffice entries without images, e.g. Brand van Egmond
// lamps) is no page – the visitor lands on the brand page instead. Runde 5
// (r5-seo P2-2): permanentRedirect() = 308, a 307 kept the old sitemap URL in
// the index; once the backoffice has images the page renders again (ISR,
// revalidate below) and the redirect is gone by itself. Thin pages
// (1–3 models) stay reachable with noindex,follow (brandCategoryRobots).
function brandPageTarget(locale, title) {
  return `/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}/${title}`;
}
const isEmptyCategory = (data) => !data?.products?.length;

async function aliasTarget(locale, title, slug) {
  const path = await getBrandCategoryAlias(title, slug, locale);
  return path ? `/${locale}${path}` : null;
}

// Runde 3 P5 (technik P2, r3-recht-inhalt Nr. 5): title ≤ 65 with the brand
// once ("<Marke> <Kollektion> Kollektion | Platzhirsch"), description 120–155
// characters (src/lib/seo/brandMeta.js). Applied to title, Open Graph and
// Twitter alike; robots, canonical and hreflang stay as built.
function polish(meta, title, description) {
  if (!meta || typeof meta !== "object" || meta.robots?.index === false) return meta;
  const out = { ...meta, title, description };
  if (meta.openGraph) out.openGraph = { ...meta.openGraph, title, description };
  if (meta.twitter) out.twitter = { ...meta.twitter, title, description };
  return out;
}

export async function generateMetadata({ params }) {
  const { locale, title, collection } = await params;
  const data = await loadCollectionPage(title, collection, locale);
  if (data) {
    const meta = await buildCollectionMetadata(locale, title, collection);
    const brand = data.marke?.name1 || "";
    return polish(meta, collectionMetaTitle(data.collection?.name, brand, locale), fitMetaDescription(meta.description, locale, brand));
  }
  const category = await getBrandCategoryPageData(title, collection, locale);
  if (category && isEmptyCategory(category)) permanentRedirect(brandPageTarget(locale, title));
  if (category) {
    const meta = await generateBrandCategoryMetadata(title, collection, locale);
    return polish(meta, brandSafeTitle(meta.title, ""), fitMetaDescription(meta.description, locale));
  }
  const target = await aliasTarget(locale, title, collection);
  if (target) permanentRedirect(target);
  notFound();
}

export default async function CollectionPage({ params }) {
  const { locale, title, collection } = await params;

  const data = await loadCollectionPage(title, collection, locale);
  if (data) {
    // Minotti-Kollektion mit Sofa-Familie im Sofaplaner → Modell-Link (nur DE).
    const sofaFamily = await sofaplanerFamilySlug({ locale, brand: data.marke?.name1, name: data.collection?.name });
    return (
      <CollectionDetail
        marke={data.marke}
        collection={data.collection}
        products={data.products}
        otherCollections={data.otherCollections}
        locale={locale}
        sofaFamily={sofaFamily}
      />
    );
  }

  const category = await getBrandCategoryPageData(title, collection, locale);
  if (category && isEmptyCategory(category)) permanentRedirect(brandPageTarget(locale, title));
  if (category) return <BrandCategoryPage data={category} locale={locale} />;

  const target = await aliasTarget(locale, title, collection);
  if (target) permanentRedirect(target);
  notFound();
}

// Runde 3 P5 (technik P2): collection and "Marke × Kategorie" pages are
// cacheable (ISR); no searchParams or other request-time API on this route.
export const revalidate = 3600;

// Runde 4 P5 (technik P1-5): collection pages of the brand prerendered when the
// backoffice answers in time, else [] → all pages on demand (ISR). Never
// aborts the build (src/lib/marken/staticParams.js). Category pages always
// render on their first visit.
export async function generateStaticParams({ params }) {
  const title = params?.title;
  if (!title) return [];
  return safeStaticParams(
    async () => {
      const marken = await fetchRawMarkenData();
      const marke = (marken || []).find((m) => generateSlug(m?.name1) === title);
      return marke ? fetchCollectionsByMarke(marke.name1) : [];
    },
    (list) => (list || []).map((c) => ({ collection: generateSlug(c?.name) })),
    { label: "marken/[title]/[collection]" }
  );
}
export const dynamicParams = true;
