// src/app/api/legacy-product/route.js – Technik R7 (r6-technik P0-1).
// Resolver for product URLs of the previous site, /{locale}/produkte/{brand}/
// {old-slug}. src/proxy.js rewrites such a URL here (visible URL unchanged)
// once it knows that {brand} is a brand and {old-slug} no current product
// (src/lib/seo/knownSlugs.js, action "legacy").
//
// Before, the product page (ISR) answered these itself, so every guessed
// old slug left a route-cache entry (the 308) plus a data-cache entry (the
// old-record lookup) on disk. Here nothing is cached: dynamic route, old
// lookup with cache: "no-store" (src/lib/seo/legacyProductRedirects.js).
// Answer: 308 to the matching new product, else to the brand page – the
// same targets as the page's redirectLegacyProductUrl().
import { resolveLegacyProductUrl } from "@/lib/seo/legacyProductRedirects";
import { matchKnownRoute } from "@/lib/seo/knownSlugs";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath } from "@/utils/routing";

export const dynamic = "force-dynamic";

const LOCALES = new Set(["de", "en", "fr", "it"]);
const SLUG = /^[a-z0-9-]{1,120}$/;

function permanent(location) {
  return new Response(null, { status: 308, headers: { Location: location, "Cache-Control": "no-store" } });
}

function notFound(locale) {
  // Only when the brand vanished since the proxy's list was loaded (≤ 5 min):
  // temporary hop to the prerendered 404 the proxy uses for unknown slugs.
  return new Response(null, {
    status: 307,
    headers: { Location: `/${locale}/seite-nicht-gefunden`, "Cache-Control": "no-store" },
  });
}

// After the proxy's rewrite, request.url can still be the visible URL
// (/de/produkte/<brand>/<old-slug>), so that is read first; the query form
// (?locale=&brand=&slug=) is the rewrite target and the direct call.
function legacyParams(request) {
  const url = new URL(request.url);
  const route = matchKnownRoute(url.pathname);
  if (route?.kind === "product") return { locale: route.locale, brand: route.segs[0], slug: route.segs[1] };
  const q = url.searchParams;
  return { locale: q.get("locale"), brand: q.get("brand") || "", slug: q.get("slug") || "" };
}

export async function GET(request) {
  const params = legacyParams(request);
  const locale = LOCALES.has(params.locale) ? params.locale : "de";
  const { brand, slug } = params;
  if (!SLUG.test(brand) || !SLUG.test(slug)) return notFound(locale);

  const target = await resolveLegacyProductUrl(brand, slug, { cacheable: false });
  if (!target) return notFound(locale);
  if (target.type === "product") {
    return permanent(`/${locale}${productsPath(locale, generateSlug(target.categoryKey), target.pathField)}`);
  }
  return permanent(`/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}/${target.brandSlug}`);
}
