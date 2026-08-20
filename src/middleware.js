import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/config";

// Lives at src/middleware.js so Next.js actually loads it. The previous file at
// src/middleware/middleware.js was never picked up (wrong location) AND imported
// "./i18n/config" from a path that doesn't resolve there — it was dead code.
//
// next-intl owns locale negotiation: with localePrefix "always" and detection off
// it redirects "/" (and any unprefixed path like /produkte) to the default locale
// (/de) and maps "/{locale}/..." onto the [locale] segment.
const intlMiddleware = createMiddleware({
  ...routing,
  localePrefix: "always",
  alternateLinks: false,
});

export function middleware(request) {
  const response = intlMiddleware(request);

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
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
