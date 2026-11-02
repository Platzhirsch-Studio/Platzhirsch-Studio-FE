import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/config";
import { ROUTES } from "./utils/routing";
import { showroomMode } from "./lib/showroom/config";
import { decideKnownPath, indexKnownSlugs, matchKnownRoute } from "./lib/seo/knownSlugs";

// Lives at src/proxy.js so Next.js actually loads it. The previous file at
// src/middleware/proxy.js was never picked up (wrong location) AND imported
// "./i18n/config" from a path that doesn't resolve there — it was dead code.
//
// next-intl owns locale negotiation: with localePrefix "always" and detection off
// it redirects "/" (and any unprefixed path like /produkte) to the default locale
// (/de) and maps "/{locale}/..." onto the [locale] segment.

// About section ("Über uns"): the pages exist ONCE, under the German folder
// src/app/[locale]/ueber-uns/, and serve all four languages. The public URLs
// stay translated — /en/about-us/brands/minotti, /fr/a-propos/marques/minotti,
// /it/chi-siamo/marche/minotti — via next-intl's `pathnames`: a translated URL
// is rewritten to the German folder, and a URL in the wrong language for its
// locale (/en/ueber-uns/team, /de/about-us/team) is redirected to the right one.
// Built from ROUTES, so the table can't drift from the site's links. Passed
// only to the middleware, not to src/i18n/config.js: next-intl's Link keeps
// taking the already-translated ROUTES paths as before.
const ABOUT_SECTIONS = {
  platzhirsch: [""],
  team: ["", "/harald-menghin"],
  presse: [""],
  partner: [""],
  marken: ["", "/[title]", "/[title]/[collection]"],
  karriere: ["", "/[slug]"],
};
// Product catalogue: same mechanism. The pages exist once under
// src/app/[locale]/produkte/ and are served at /en/products/…, /fr/produits/…,
// /it/prodotti/… (hub, category and product pages); /en/produkte/… etc. get a
// 308 to the translated URL. Links are built with productsPath() in
// src/utils/routing.js.
// Single pages with a translated URL (/en/consultation, /it/contatto, …): the
// wrong-language form (/en/beratung) used to answer 200 as a duplicate of the
// canonical URL — now it 308s like the About/product sections. Only the news
// hub is listed here: article URLs stay /{locale}/news/<slug> in every locale.
const TRANSLATED_SECTIONS = {
  ...ABOUT_SECTIONS,
  produkte: ["", "/[category]", "/[category]/[product]"],
  beratung: [""],
  kontakt: [""],
  merkliste: [""],
  news: [""],
};
const translatedPathnames = {};
for (const [key, suffixes] of Object.entries(TRANSLATED_SECTIONS)) {
  for (const suffix of suffixes) {
    translatedPathnames[`${ROUTES[key].de}${suffix}`] = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${ROUTES[key][locale]}${suffix}`])
    );
  }
}
const TRANSLATED_PATH =
  /^\/(de|en|fr|it)\/(?:(?:ueber-uns|about-us|a-propos|chi-siamo)\/|(?:produkte|products|produits|prodotti)(?:\/|$)|(?:beratung|consultation|conseil|consulenza|kontakt|contact|contatto|merkliste|wishlist|liste-de-souhaits|lista-desideri|news|nouvelles|notizie)$)/;

const intlMiddleware = createMiddleware({
  ...routing,
  localePrefix: "always",
  alternateLinks: false,
  pathnames: translatedPathnames,
});

// Wrong-language URLs whose translated target can redirect AGAIN inside the
// page. Only routes that really call permanentRedirect() qualify: brand ×
// collection aliases (/en/ueber-uns/marken/minotti/sofas →
// /en/about-us/brands/minotti/sofas → …/sofas-couches, marken/[title]/
// [collection]/page.js) and catalogue category / legacy product slugs
// (produkte/[category]/page.js, produkte/[category]/[product]/page.js).
// Brand hubs and job pages never redirect again, so they skip the probe
// (QM R4-shell-perf P2-2: no wait for a request that cannot gain anything).
const DYNAMIC_TRANSLATED =
  /^\/(de|en|fr|it)\/(?:(?:ueber-uns|about-us|a-propos|chi-siamo)\/(?:marken|brands|marques|marche)\/[^/]+\/[^/]+|(?:produkte|products|produits|prodotti)\/[^/]+)/;
const PROBE_HEADER = "x-ph-redirect-probe";
// A cached page answers in milliseconds; a cold render must not hold the
// visitor for long – after this the old two-hop redirect is sent (both hops
// stay correct, the second is one more round trip). QM R4-shell-perf P2-2:
// 3 s was too long on a cold page, 1 s caps the worst case.
const PROBE_TIMEOUT_MS = 1000;

/**
 * Follows the page-level redirect of `location` once, so the visitor and
 * crawlers get ONE 308 straight to the final URL (QA R3-marken-seo P3-1).
 * Asks this same server (HEAD, redirect: "manual"). Any failure, timeout or
 * non-permanent answer keeps the original target – never worse than before.
 */
async function finalTarget(request, location) {
  try {
    const target = new URL(location, request.nextUrl.origin);
    const port = process.env.PORT || request.nextUrl.port || "3000";
    // Ask the local server directly (behind nginx the public origin may not
    // loop back); keep the public Host so absolute redirects stay correct.
    const probeUrl = `http://127.0.0.1:${port}${target.pathname}${target.search}`;
    const res = await fetch(probeUrl, {
      method: "HEAD",
      redirect: "manual",
      headers: { [PROBE_HEADER]: "1", host: request.headers.get("host") || target.host },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    // Team Grün (Konsolidierung): on the FIRST (uncached) render of an ISR page
    // Next 16.4.1 sends the redirect's Location header twice; Headers.get()
    // joins them as "a, a", which became the broken target "…/a,%20a" (404 for
    // the first visitor). Keep the first value only.
    const next = (res.headers.get("location") || "").split(/,\s*(?=\/|https?:)/)[0].trim();
    if ((res.status !== 301 && res.status !== 308) || !next) return location;
    const resolved = new URL(next, target);
    // Same site only, and never back to where we started (no loops).
    if (resolved.host !== target.host || resolved.pathname === request.nextUrl.pathname) return location;
    return new URL(`${resolved.pathname}${resolved.search}`, target).toString();
  } catch {
    return location;
  }
}

// P6 Runde 2 (r2-technik P1-8, „übrige echte 404 mit lang und Überschrift“):
// pages that call notFound() at request time are answered by Next 16 with an
// empty client-rendered shell (<html id="__next_error__">, no lang, no h1,
// ~150 KB). For URLs that are ALWAYS 404 – German-only pages behind switches
// in EN/FR/IT (the always-on ones get a 308 in next.config.js, see
// src/lib/seo/deOnlyRedirects.cjs) and the design prototypes while their
// switch is off – rewrite to an unknown single segment instead: that hits
// [locale]/[slug] with dynamicParams = false and gets the prerendered 404
// (lang, h1, noindex, status 404, ~20 KB). The visible URL stays the same.
const FOREIGN_GATED_404 =
  /^\/(en|fr|it)\/(?:upload|portal|gutscheine|gutscheinbedingungen|atelierverkauf|zahlung|preview|ratgeber|adventsabend|projekte\/vorlage|ki-assistenten\/bestaetigen|newsletter\/archiv)(?:\/|$)/;
// Sprach-Integration 01.11.2026: /kuechenplaner/druck (Druckansicht, noindex)
// gibt es jetzt in allen vier Sprachen – nicht mehr in der Liste oben. Die
// FR/IT-Sperre für Pflege-Service und Architekten (FR_IT_ONLY_404) ist
// entfallen: beide Seiten sind jetzt viersprachig.
const DESIGN_PREVIEW_PATH = /^\/de\/(?:preview\/(?:buehne|galerie|dreilaendereck|unikat|kino-zeichnung|kino-film|kino-3d)|projekte\/vorlage)(?:\/|$)/;
const NOT_FOUND_SEGMENT = "seite-nicht-gefunden";

// Tempo & A11y (Konsolidierung, Technikprüfung „404 EN/FR/IT mit lang="de"“):
// for EN/FR/IT the segment is a real prerendered page – the localized 404
// inside the locale layout (src/app/[locale]/[slug]/page.js, LOCALIZED_404),
// so the server HTML carries <html lang="en|fr|it">. It is only ever served
// through this rewrite, with status 404 and no-store (Next keeps both: the
// status because the static page has none of its own, the header because it
// only sets Cache-Control when none is set). German keeps the global 404.
// Not for German-only pages (FOREIGN_GATED_404): the static
// page is prerendered for /<locale>/seite-nicht-gefunden, and the language
// switch reads usePathname() – on /en/upload it adds its "German only" note,
// which the prerendered HTML lacks (React #418, measured in prodtest; Next
// docs use-pathname.md "Avoid hydration mismatch with rewrites"). Those keep
// the global 404, whose boot script sets <html lang> before the first paint.
const LOCALIZED_404 = /^(en|fr|it)$/;
const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";
const LOCALIZED_404_PATH = /^\/(en|fr|it)\/seite-nicht-gefunden\/?$/;

function notFoundRewrite(request, locale, { localized = true } = {}) {
  if (!localized || !LOCALIZED_404.test(locale)) {
    // The global 404: /de/<segment> is no page of [locale]/[slug], so Next
    // answers with src/app/not-found.js (status 404; its boot script reads the
    // language from the browser URL). /<en|fr|it>/<segment> IS a page now.
    return NextResponse.rewrite(new URL(`/de/${NOT_FOUND_SEGMENT}`, request.url));
  }
  const url = new URL(`/${locale}/${NOT_FOUND_SEGMENT}`, request.url);
  return NextResponse.rewrite(url, { status: 404, headers: { "cache-control": NO_STORE } });
}

function designPreviewOn(env = process.env) {
  // Same rule as src/components/Preview/gate.js (designPreviewEnabled).
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.DESIGN_PREVIEW === "1";
}

// R5-Fix P1 (r5-technik P2-2, Auftrag 3): /<locale>/showroom while the tour is
// "off" (production without a released recording). notFound() in the page –
// even per request after connection() – answered with the empty
// <html id="__next_error__"> shell (no lang, no h1); the rewrite gives the
// prerendered 404 (status 404, lang, h1, noindex, no-store) under the same URL.
const SHOWROOM_ROUTE = /^\/(de|en|fr|it)\/showroom\/?$/;

// Technik R7 (r6-technik P0-1): unknown slugs on the backoffice routes
// (brands, brand × category/collection, product categories, products, news,
// jobs, 3D view) never reach a render – before, each one left a ~440 KB 404
// in the ISR route cache on disk, without limit, and /marken/Minotti replaced
// /marken/minotti on a case-insensitive file system. Rules and reasons:
// src/lib/seo/knownSlugs.js; list: src/app/api/known-slugs/route.js (asked
// on this same server like finalTarget() above). The list is kept in memory
// for KNOWN_TTL_MS; a miss refreshes it at most every KNOWN_MISS_REFRESH_MS
// (a brand-new news slug is answered within about a minute). Until a list
// is loaded – and whenever it fails – everything passes (fail-open).
const KNOWN_TTL_MS = 5 * 60_000;
const KNOWN_MISS_REFRESH_MS = 60_000;
const KNOWN_WAIT_MS = 1500;
const known = { data: null, at: 0, inflight: null, lastTry: 0 };

function loadKnownSlugs(request) {
  if (known.inflight) return known.inflight;
  known.lastTry = Date.now();
  const port = process.env.PORT || request.nextUrl.port || "3000";
  known.inflight = fetch(`http://127.0.0.1:${port}/api/known-slugs`, {
    headers: { host: request.headers.get("host") || `127.0.0.1:${port}` },
    signal: AbortSignal.timeout(20_000),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      const index = indexKnownSlugs(payload);
      if (index) {
        known.data = index;
        known.at = Date.now();
      }
      return known.data;
    })
    .catch(() => known.data)
    .finally(() => {
      known.inflight = null;
    });
  return known.inflight;
}

async function knownSlugs(request) {
  const age = Date.now() - known.at;
  if (known.data && age < KNOWN_TTL_MS) return known.data;
  if (known.data) {
    loadKnownSlugs(request); // stale: refresh in the background
    return known.data;
  }
  if (Date.now() - known.lastTry < 5_000 && !known.inflight) return null; // just failed
  const wait = new Promise((resolve) => setTimeout(() => resolve(null), KNOWN_WAIT_MS));
  return Promise.race([loadKnownSlugs(request), wait]);
}

async function checkKnownSlug(request) {
  const { pathname } = request.nextUrl;
  if (!matchKnownRoute(pathname)) return null;
  const data = await knownSlugs(request);
  let decision = decideKnownPath(pathname, data);
  // A slug the (older) list does not know yet: ask once more, at most once a minute.
  if (decision.action === "notFound" && data && Date.now() - known.at > KNOWN_MISS_REFRESH_MS) {
    const fresh = await Promise.race([
      loadKnownSlugs(request),
      new Promise((resolve) => setTimeout(() => resolve(null), KNOWN_WAIT_MS)),
    ]);
    if (fresh) decision = decideKnownPath(pathname, fresh);
  }
  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    return NextResponse.redirect(url, 308);
  }
  const locale = matchKnownRoute(pathname).locale;
  if (decision.action === "notFound") {
    return notFoundRewrite(request, locale);
  }
  if (decision.action === "legacy") {
    const target = new URL("/api/legacy-product", request.url);
    target.search = new URLSearchParams({ locale, brand: decision.brand, slug: decision.slug }).toString();
    return NextResponse.rewrite(target);
  }
  return null;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  // The localized 404 page itself never answers 200.
  const localized404 = LOCALIZED_404_PATH.exec(pathname);
  if (localized404) return notFoundRewrite(request, localized404[1]);
  const knownCheck = await checkKnownSlug(request);
  if (knownCheck) return knownCheck;
  const showroom = SHOWROOM_ROUTE.exec(pathname);
  if (showroom && showroomMode() === "off") {
    return notFoundRewrite(request, showroom[1]);
  }
  const foreign = FOREIGN_GATED_404.exec(pathname);
  if (foreign || (DESIGN_PREVIEW_PATH.test(pathname) && !designPreviewOn())) {
    const locale = foreign ? foreign[1] : "de";
    return notFoundRewrite(request, locale, { localized: false });
  }

  let response = intlMiddleware(request);

  // next-intl answers a wrong-language About/product URL with a temporary 307;
  // these moves are permanent (the canonical URL never changes), so send a 308.
  if (response.status === 307 && TRANSLATED_PATH.test(request.nextUrl.pathname)) {
    let location = response.headers.get("location");
    // One hop instead of two when the translated page redirects again
    // (R4-shell-perf). The probe request itself is never probed again.
    if (DYNAMIC_TRANSLATED.test(request.nextUrl.pathname) && !request.headers.get(PROBE_HEADER)) {
      location = await finalTarget(request, location);
    }
    response = NextResponse.redirect(location, 308);
  } else if (response.status === 307 && !/^\/(de|en|fr|it)(?:\/|$)/.test(request.nextUrl.pathname)) {
    // P6 Runde 2 (r2-technik P2-2): an unprefixed path (/produkte) gets the
    // default-locale prefix. Locale detection is off, so the target never
    // changes – a permanent 308 instead of next-intl's temporary 307.
    response = NextResponse.redirect(response.headers.get("location"), 308);
  }

  // R5 (recht P1-4, technik P2): NO locale cookie from the server. Before,
  // NEXT_LOCALE went out on the first visit, on router prefetches (the
  // prefetch check missed RSC requests) and on cached pages. localeCookie:
  // false in src/i18n/config.js stops next-intl's own cookie as well. The
  // cookie is now written only by the language switcher on an active switch
  // (src/components/Navbar/LanguageSwitcher.js); nothing on the server reads
  // it (localeDetection is off). Test: tests/e2e/r9-p1-locale-cookie.spec.js.
  return response;
}

export const config = {
  // `revalidate/` is excluded like `api`: the backend's on-demand webhooks
  // (src/app/revalidate/*/route.js) live outside [locale], so letting
  // next-intl redirect them to /de/revalidate/... would 404 every call.
  // `cmx/` (R6-release): the file proxy src/app/cmx/[...path]/route.js answers
  // every /cmx path itself. Without the exclusion an extensionless path
  // (/cmx/api/x) got a 307 to /de/cmx/api/x instead of the route's 404 no-store.
  matcher: ["/((?!api|trpc|_next|_vercel|revalidate/|cmx/|.*\\..*).*)"],
};
