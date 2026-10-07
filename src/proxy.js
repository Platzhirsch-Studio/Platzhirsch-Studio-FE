import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/config";
import { ROUTES } from "./utils/routing";

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
  team: [""],
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

export function proxy(request) {
  let response = intlMiddleware(request);

  // next-intl answers a wrong-language About/product URL with a temporary 307;
  // these moves are permanent (the canonical URL never changes), so send a 308.
  if (response.status === 307 && TRANSLATED_PATH.test(request.nextUrl.pathname)) {
    response = NextResponse.redirect(response.headers.get("location"), 308);
  }

  // Mirror the active locale into a cookie for the client-side language switcher
  // (written by the Navbar on manual switch, read in ClientLayout). Set it on the
  // response next-intl already produced — do NOT rebuild the response, that would
  // drop next-intl's internal rewrite headers.
  const localeMatch = request.nextUrl.pathname.match(/^\/(de|en|fr|it)(?:\/|$)/);
  if (localeMatch) {
    response.cookies.set("NEXT_LOCALE", localeMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  // `revalidate/` is excluded like `api`: the backend's on-demand webhooks
  // (src/app/revalidate/*/route.js) live outside [locale], so letting
  // next-intl redirect them to /de/revalidate/... would 404 every call.
  matcher: ["/((?!api|trpc|_next|_vercel|revalidate/|.*\\..*).*)"],
};
