// app/[locale]/layout.js
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/config";
import { notFoundTitle } from "@/i18n/detectLocale";

import "../globals.css";

import LoaderWrapper from "./LoaderWrapper";
import JsonLd from "@/components/Reusable/JsonLd";
import { bodoni, bodoniItalic, instrument } from "@/components/Reusable/fonts";
import Navbar from "@/components/Navbar/navbar";
import Footer from "@/components/Reusable/Footer";
import { WordmarkSprite } from "@/components/Brand";
import { pickClientMessages } from "@/components/Reusable/clientMessages";
import { siteSchema } from "@/lib/seo/structuredData";
import { ogLocale } from "@/lib/seo/pageMetadata";
import { openingHoursSpecification } from "@/lib/site";
import { fetchLayoutData } from "@/lib/api/Keywords/fetchLayoutKeywords"
import { fetchKategorienWithCounts } from "@/lib/api/fetchAllProdukte";
import { pinterestVerificationMetadata } from "@/lib/pinterest/config";

// Type system of the Neuauftritt (Design-Bibel §5): Bodoni Moda (display,
// italic not preloaded) and Instrument Sans (text/UI), self-hosted by
// next/font. R5 (technik P1-3): legacy Montserrat no longer on <html> – no
// file in src/ reads --font-montserrat any more (its @font-face rules and the
// class left the shell). Defined ONCE in Reusable/fonts.js (font
// definitions file) so the global 404 and global-error.js use the same files
// (R6-shell-perf).

// Site-wide structured data (Organization + FurnitureStore, WebSite) comes
// from ONE builder, siteSchema() in src/lib/seo/siteSchema.js: name, legal
// name, postal data, phone, geo, business times, service area and real
// profiles (sameAs) are read from src/lib/site.js; `brand` only lists
// brands that pass the dealer filter of src/lib/legal (today ClassiCon), all
// other showroom brands stay neutral under knowsAbout. No aggregateRating.
// The business times are handed in explicitly from site.js (r3-shell
// contract: the layout shows where they come from); siteSchema() accepts no
// other override. Built once per server process – the inputs are constants.
const SITE_SCHEMA = siteSchema({
  "openingHoursSpecification": openingHoursSpecification(),
});

// Site-wide DEFAULTS only. Canonical, hreflang and og:url are deliberately
// NOT set here: every page sets its own, and a layout value would be inherited
// by any page (or error branch) that doesn't — pointing it at the homepage.
// metadataBase is returned in every branch so relative image/canonical URLs
// on the pages always resolve.
const METADATA_BASE = new URL("https://platzhirsch.studio");

export async function generateMetadata({ params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    // Not a locale (e.g. /wp-login.php): the page becomes the global 404 in
    // src/app/not-found.js, which is German. No cookies()/headers() here: the
    // tree is static, and reading request data turned these 404s into 500s in
    // the production build (R4-release, errors.spec.js).
    return { metadataBase: METADATA_BASE, title: await notFoundTitle(routing.defaultLocale) };
  }

  const defaults = {
    metadataBase: METADATA_BASE,
    title: "Platzhirsch Home Living",
    openGraph: {
      siteName: "Platzhirsch Home Living",
      // Same map as every page (pageMetadata.js OG_LOCALE).
      locale: ogLocale(locale),
      type: "website",
      images: [{ url: "/Images/Home/aboutHome.jpg", alt: "Platzhirsch Home Living" }],
    },
    twitter: { card: "summary_large_image", images: ["/Images/Home/aboutHome.jpg"] },
    // Rich Pins (Inhaber-Entscheidung Nr. 14): <meta name="p:domain_verify">
    // nur, wenn PINTEREST_DOMAIN_VERIFY gesetzt ist (leer = kein Tag).
    ...pinterestVerificationMetadata(),
  };

  try {
    const layoutData = (await fetchLayoutData()) || {};
    const cms = layoutData[`metadata_${locale}_tab`] || {};
    const title = cms[`metadata_title_${locale}`];
    const description = cms[`metadata_description_${locale}`];

    return {
      ...defaults,
      ...(title ? { title } : {}),
      // Only when the CMS has one — never an empty description.
      ...(description ? { description } : {}),
      openGraph: {
        ...defaults.openGraph,
        ...(cms[`metadata_sitename_${locale}`] ? { siteName: cms[`metadata_sitename_${locale}`] } : {}),
      },
    };
  } catch (err) {
    console.error("Metadata fetch error:", err);
    return defaults;
  }
}

// Only the four locales exist. Runde 5 (r5-technik P0-1): NO
// `dynamicParams = false` here any more. Next 16.4 combines the segment
// configs of a route with every() (build/static-paths/app.js: "dynamic params
// should be allowed to be granular per segment but …"), so a `false` on this
// layout closed EVERY route below it: marken/[title]/[collection] got
// `fallback: false` and all brand × category / collection pages answered 404
// in the production build, although the page sets `dynamicParams = true`.
// Unknown first segments (/wp-login.php, /foo.html) are rewritten instead to
// an unknown single segment of the default locale (next.config.js,
// UNKNOWN_LOCALE_REWRITE, afterFiles) – that hits [locale]/[slug] with its
// own `dynamicParams = false` and gets the same prerendered 404 of
// src/app/not-found.js (lang="de", server-rendered) as before. notFound()
// below stays as a second line of defence.
// Regression test: tests/unit/r9-p1-prerender-manifest.test.mjs.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enable next-intl static rendering for this locale (prevents ENVIRONMENT_FALLBACK).
  setRequestLocale(locale);

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }

  // Category keys that currently have products — the navbar's product menu
  // hides every other category (empty categories are noindex dead ends).
  // null when the backend is unreachable: the navbar then shows its full
  // menu instead of an empty one. Cached 1h, flushed by /revalidate/produkte.
  const kategorienWithCounts = await fetchKategorienWithCounts();
  const activeCategoryKeys = kategorienWithCounts.length
    ? kategorienWithCounts
        .filter((k) => k.produkt_count > 0 && k.category_key)
        .map((k) => k.category_key.toLowerCase())
    : null;

  // The locale is now correctly set from params
  return (
    <html lang={locale} dir="ltr" className={`${bodoni.variable} ${bodoniItalic.variable} ${instrument.variable}`}>
      <head>
        {/* Google Consent Mode v2 default lives in Cookies/cookiecomponent.js
            (ensureGtag): no Google tag loads before consent, and a raw <script>
            here was re-created by React on every client-side language switch
            ("Encountered a script tag while rendering React component"). */}
        <meta name="ahrefs-site-verification" content="7c9d1c48de554cc2567eb6db64f49352c141ab335b8573e9366103bc7aaa9587" />
        {/* No <noscript> override needed: the reveal motion is pure CSS, nothing is
            hidden before hydration (R4-shell-perf). */}
      </head>
      <body>
        {/* Tempo & A11y (Konsolidierung): the one copy of the wordmark outline
            that the header and footer lockups draw with <use> (Brand/Logo.js). */}
        <WordmarkSprite />
        <JsonLd data={SITE_SCHEMA} />
        {/* Header and footer are Server Components (R4-shell-perf, TBT): their
            markup and link data arrive as HTML; only the small islands inside
            (menus, search, language, consent button, calm view) ship
            JavaScript. They are handed to the client shell as slots, so
            ClientLayout can still leave them out on the slim /upload shell. */}
        <LoaderWrapper
          messages={pickClientMessages(messages)}
          locale={locale}
          header={<Navbar activeCategoryKeys={activeCategoryKeys} />}
          footer={<Footer activeCategoryKeys={activeCategoryKeys} />}
        >
          {children}
        </LoaderWrapper>
      </body>
    </html>
  );
}