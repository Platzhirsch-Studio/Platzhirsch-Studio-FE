import { notFound } from "next/navigation";
import BrandCategoryPage from "@/components/BrandCategory/BrandCategoryPage";
import { generateBrandCategoryMetadata, getBrandCategoryPageData } from "@/lib/marken/brandCategoryLoader";
import { brandCategoryRobots, brandCategoryUrl } from "@/lib/marken/brandCategoryPage";

// QA preview of the "Marke × Kategorie" page (R2-seo) with real backoffice
// data (read only), before round 3 wires it into
// ueber-uns/marken/[title]/[collection]. Same pattern as preview/fehler:
// only in development, or in a production build with
// BRAND_CATEGORY_PREVIEW=1 (or ERROR_PREVIEW=1); otherwise a normal 404.
// Always noindex,nofollow, no canonical/hreflang (the target URL 404s today).
//   /de/preview/marke-kategorie/minotti/sofas-couches
//   /en/preview/marke-kategorie/minotti/sofas-couches …
export const dynamic = "force-dynamic";

const enabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.BRAND_CATEGORY_PREVIEW === "1" ||
  process.env.ERROR_PREVIEW === "1";

const PREVIEW_ROBOTS = { index: false, follow: false };

export async function generateMetadata({ params }) {
  if (!enabled()) return { robots: PREVIEW_ROBOTS };
  const { locale, brand, category } = await params;
  const meta = await generateBrandCategoryMetadata(brand, category, locale, { robots: PREVIEW_ROBOTS });
  const rest = { ...meta };
  delete rest.alternates;
  return { ...rest, title: `Vorschau: ${meta.title}`, robots: PREVIEW_ROBOTS };
}

export default async function BrandCategoryPreviewPage({ params }) {
  if (!enabled()) notFound();
  const { locale, brand, category } = await params;
  const data = await getBrandCategoryPageData(brand, category, locale);
  if (!data) notFound();

  const robots = brandCategoryRobots(data);
  return (
    <>
      {/* Dev-only QA strip (German only, never public): what the live page will declare. */}
      <aside aria-label="Vorschau-Hinweis" className="border-b border-line bg-surface-band px-gutter py-3 text-small text-text">
        <p>
          <strong className="font-medium">Vorschau, nicht indexiert.</strong> Live-URL ab Runde 3:{" "}
          <code className="break-all">{brandCategoryUrl(data.brand.name, data.category.slug, locale)}</code> · robots dort:{" "}
          <code>{robots.index ? "index, follow" : "noindex, follow"}</code> · {data.count} aktive Produkte
          {data.collision ? " · Kollision mit Collection-Slug (Route zeigt die Collection)" : ""}
        </p>
      </aside>
      <BrandCategoryPage data={data} locale={locale} basePath="/preview/marke-kategorie" />
    </>
  );
}
