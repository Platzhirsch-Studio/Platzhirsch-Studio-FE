const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/config.js");
// Inhaber-Entscheidung Nr. 9: alte /labs-URLs → feste URLs (308), siehe Modul.
const { labsRedirects, labsAssetRedirects, LABS_MOVES, LABS_HUB_TARGET } = require("./src/lib/seo/labsMoves.cjs");
// P6 Runde 2: /(en|fr|it)/<reine DE-Seite> → ein 308 auf /de/<seite>?lang=…
const { deOnlyRedirects } = require("./src/lib/seo/deOnlyRedirects.cjs");
// Runde 3 P5 (seo P1-6, P2-8): beendete Aktions-News → 308 auf den News-Hub,
// /fr/nouvelles/<slug> und /it/notizie/<slug> → 308 auf /…/news/<slug>.
const { newsRedirects } = require("./src/lib/seo/newsRedirects.cjs");

// F5 (Runde 1): /labs/… WITHOUT a locale prefix used to take two hops
// (next-intl 307 to /de/labs/…, then the 308 of labsRedirects()). Redirects
// run before the proxy and the filesystem (docs 01-next-config-js/redirects.md),
// so these entries answer with ONE 308 straight to the target. Only paths
// without a dot: public/labs/* (textures, models, images – all with a file
// extension) stay untouched.
const NO_FILE = "([^.]+)";
function labsRootRedirects() {
  const out = [{ source: "/labs", destination: `/de${LABS_HUB_TARGET}`, permanent: true }];
  for (const m of LABS_MOVES) {
    out.push({ source: `/labs/${m.from}`, destination: `/de${m.to}`, permanent: true });
    out.push({ source: `/labs/${m.from}/:rest${NO_FILE}`, destination: `/de${m.to}/:rest`, permanent: true });
  }
  out.push({ source: `/labs/:rest${NO_FILE}`, destination: `/de${LABS_HUB_TARGET}`, permanent: true });
  return out;
}

// Runde 5 (r5-technik P0-1): [locale]/layout.js no longer exports
// `dynamicParams = false` (it closed every child route, all brand × category
// pages were 404 in the production build). A first path segment that is no
// locale and no own top-level route (/wp-login.php, /foo.html – paths with a
// dot skip src/proxy.js) is rewritten to an unknown single segment of the
// default locale: [locale]/[slug] has its own `dynamicParams = false`, so the
// visitor gets the prerendered 404 of src/app/not-found.js (status 404,
// lang="de", h1, noindex) under the unchanged URL. A plain array from
// rewrites() is `afterFiles`: public files, /_next/static and static routes
// (robots.txt, sitemap*.xml, llms.txt …) are served before this rule.
const UNKNOWN_LOCALE_REWRITE = {
  source: "/:first((?!(?:de|en|fr|it|api|cmx|cms|showroom|revalidate|_next|_vercel|trpc)(?:/|$))[^/]+)/:rest*",
  destination: "/de/seite-nicht-gefunden",
};

// F5 (Runde 1): Ezarri is not a brand page under /ueber-uns/marken (that URL
// is a 404) but its own world /de/ezarri (Inhaber-Entscheidung Nr. 7). Every
// brand-style URL for Ezarri goes there in one 308, before the generic
// "/marken/:slug" rule below.
const EZARRI_TARGET = "/de/ezarri";
const EZARRI_BRAND_SOURCES = [
  "/marken/ezarri",
  "/marke/ezarri",
  "/brand/ezarri",
  "/hersteller/ezarri",
  "/:locale(de|en|fr|it)/ueber-uns/marken/ezarri",
  "/en/about-us/brands/ezarri",
  "/fr/a-propos/marques/ezarri",
  "/it/chi-siamo/marche/ezarri",
];

// Content-Security-Policy, REPORT-ONLY (R4-release; Masterplan AP1.3, 13 F3.4).
// Nothing is blocked. F5 (Runde 1): violations are reported to the own
// endpoint /api/csp-report (report-uri for Safari/Firefox, report-to +
// Reporting-Endpoints for Chromium); it logs one line per report, stores
// nothing. That also ends the WebKit console notice "delivered in report-only
// mode, but does not specify a report-uri" on iOS. Without nonces
// on purpose: nonces force dynamic rendering (docs 02-guides/
// content-security-policy.md) and would undo the static delivery.
// Sources = the services the site really loads (code inventory 26.10.2026):
//   - Google tag (GA4 G-1YCM6K57YG, Consent Mode; Ads only once ADS_ID
//     exists): script from www.googletagmanager.com, hits to
//     *.google-analytics.com / *.analytics.google.com, Ads/consent pings
//     to *.doubleclick.net, www.google.com, www.googleadservices.com
//   - Google Maps embeds after consent (Kontakt, Ausstellung): www.google.com
//     /maps/embed and maps.google.com/maps?output=embed → frame-src
//     (YouTube is not embedded anywhere today, so it is not listed)
//   - images: backoffice (via /cmx and /_next/image, plus direct URLs),
//     brand hosts of the imported catalogues (not delivered today, see
//     remotePatterns); data:/blob: for QR codes, placeholders and the Labs
//     viewers. Unsplash removed in R5-release (grep 0 in src/tests/tools/
//     scripts, 0 in the rendered HTML).
//   - Labs (3D/AR): blob: workers and WebAssembly decoders
// Production only: the dev server needs eval for React's debugging tools
// and would flood the console with report-only messages.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://backoffice.platzhirsch.studio https://brandvanegmond.com https://www.next125.com https://www.treca-paris.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.g.doubleclick.net https://www.google.com https://www.google.at https://www.googleadservices.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.g.doubleclick.net https://www.google.com https://www.googleadservices.com",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");
// Reporting API endpoint named in "report-to csp" (Chromium). Same origin.
const REPORTING_ENDPOINTS = 'csp="/api/csp-report"';
// The PDF preview route of the portal may be framed by the own origin (see
// its entry below): same policy with frame-ancestors 'self' – only so the
// report-only console stays quiet there; its enforced headers are unchanged.
const CSP_REPORT_ONLY_SELF_FRAME = CSP_REPORT_ONLY.replace("frame-ancestors 'none'", "frame-ancestors 'self'");
const IS_PROD = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  // Dev only (02.11.2026): appends ?dpl= to every asset URL, so browsers that
  // still hold chunks cached "immutable" by the earlier header rule are forced
  // to fetch fresh ones. Production keeps the deploy pipeline's own id
  // (NEXT_DEPLOYMENT_ID), so nothing is set here for IS_PROD.
  ...(IS_PROD ? {} : { deploymentId: "dev-2026-11-02" }),
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  // Kein Next.js-Entwickler-Symbol unten links (nur Dev, z. B. für Vorführungen).
  devIndicators: false,

  // F5 (Runde 1, Build): folders the server never reads at runtime stay out
  // of the file traces (.nft.json) of every route. Dynamic fs calls in shared
  // modules (Freigaben/data.server.js, fixed with turbopackIgnore;
  // raumzwilling/store.js, payments/mailer.js, raumzwilling/assets-node.mjs –
  // other packages, release-check.md F5) otherwise pulled 10 000–42 000 files
  // per route into the trace. Route glob "/**" = all routes
  // (docs 05-config/01-next-config-js/output.md). `next start` (deploy.sh)
  // runs from the full release folder, so runtime file access is unchanged.
  outputFileTracingExcludes: {
    "/**": [
      "./Marktresearch/**/*",
      "./qa-screenshots/**/*",
      "./Herstellermaterial/**/*",
      "./docs/**/*",
      "./tests/**/*",
      "./tools/**/*",
      "./scripts/**/*",
      "./target/**/*",
      "./.git/**/*",
      "./.next/cache/**/*",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    // P6 Runde 2: upper bound for the optimizer's disk cache (default: 50 % of
    // the free disk, checked once at start). LRU-evicted above 1 GB.
    maximumDiskCacheSize: 1_000_000_000,
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    qualities: [50, 75, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backoffice.platzhirsch.studio",
        pathname: "/**",
      },
      // Brand image hosts for the imported product data in
      // src/lib/data/importedProducts/ (see staticShopProducts.js).
      // R5-release, checked 26.10.2026: no route renders those static files.
      // The live BvE/next125/Treca pages come from the backoffice ("Produkte
      // New") and load images only via /cmx or the local fallback: 0 brand
      // host URLs in the HTML of catalogue and product pages (release-check.md
      // §R5.2). brandvanegmond.com is therefore deliberately NOT added (no
      // image release either); next125/Treca stay until the image releases
      // are settled. images.unsplash.com removed (grep 0 outside this file).
      {
        protocol: "https",
        hostname: "www.next125.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.treca-paris.com",
        pathname: "/**",
      },
    ],

    // R4-release: SVG through the optimizer is OFF. next 16.3.x has a critical
    // RCE for SVG via sharp < 0.35.5 (GHSA-2464-fhr4-w9xw, fixed in 16.4.1).
    // Checked before switching off: no next/image src is an SVG (grep over
    // src/; crawl of 270 pages on the prod build: 3 361 /_next/image URLs,
    // 0 × .svg, all local or /cmx). Local SVGs use unoptimized or <img>.
    dangerouslyAllowSVG: false,
    // Defence in depth for everything the optimizer serves (Next docs,
    // images.md: contentSecurityPolicy / contentDispositionType).
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: "attachment",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // X-XSS-Protection removed (R4-release, AP1.3): obsolete, modern
          // browsers ignore it; the CSP (report-only below) replaces it.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          ...(IS_PROD
            ? [
                { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
                { key: "Reporting-Endpoints", value: REPORTING_ENDPOINTS },
              ]
            : []),
        ],
      },
      // Route-exact exceptions to the global policy above. They must come
      // AFTER the global entry: for the same key the last matching entry wins.
      {
        // Customer portal, planning page (VoiceRecorder): voice notes need the
        // microphone on this page only. Everything else as in the global value.
        source: "/de/portal/projekte/:id",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
          },
        ],
      },
      {
        // Raumzwilling (N2): Kommentar als Sprachnachricht an einem Raumpunkt.
        // Nur die Projektansicht, nicht /bearbeiten (Team-Werkzeug).
        source: "/de/portal/raum/:projekt((?!link$|team$)[^/]+)",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
          },
        ],
      },
      // Expertenrat P0-8 (Integration 28.10.2026): pages and files that show
      // manufacturer images without a written image release stay indexable as
      // pages, but their images do not go into the image index.
      ...["/de/3d-ansicht/:path*", "/de/sofaplaner/:path*", "/de/stil-finder/:path*", "/labs/ar-viewer/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noimageindex" }],
      })),
      {
        // SEO (Sofaplaner-Team seo-inhalte): the JSON catalogue and the share
        // endpoint are data, not pages. The config header above wins over the
        // route's own "noindex, nofollow" (last matching entry overrides), so
        // the full value is set here, after the noimageindex entries.
        source: "/de/sofaplaner/:sub(katalog|teilen)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" }],
      },
      {
        // Customer portal, document file (PdfPreview <iframe> on
        // /de/portal/dokumente): framing by the own origin only. Not for the
        // sibling routes /kalender and /pass/:id (they keep DENY).
        source: "/api/portal/dokumente/:id((?!kalender$|pass$)[^/]+)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          ...(IS_PROD ? [{ key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY_SELF_FRAME }] : []),
        ],
      },
      {
        // Cache static images for 1 year – except /cmx/* (R4-release, request
        // from R4-plattform-ci): a config header wins over the route's own, so
        // 404/429/502/504 of the backoffice proxy were cached "immutable" for a
        // year. src/app/cmx/[...path]/route.js sets immutable on 200 itself
        // and no-store on 429/502/504 (404: no header, see the js/css rule).
        source:
          "/((?!cmx/|cms/|api/).*)\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
        // Cache JS/CSS files for 1 year. /cmx/* is excluded here and in the
        // video rule below for the same reason as above (R5-release): a missing
        // /cmx/files/x.mp4 got 404 with "max-age=31536000, must-revalidate".
        // A "no-store" default for /cmx/* in this file does NOT work: the
        // config header also overrides the route's "immutable" on 200 (tested
        // against `next start`, release-check.md §R5.2). So /cmx/* gets no
        // Cache-Control from here at all: 200 → immutable (route), 429/502/504
        // → no-store (route), 404 → none (not cached long; nginx adds no-store,
        // tools/ci/nginx-platzhirsch.conf.example).
        //
        // Production only (02.11.2026): in `next dev` the Turbopack chunks have
        // path-based names without a content hash, so "immutable" made the
        // browser keep stale chunks for a year – a TypeError on a renamed
        // export (attribution.js) and a navbar without its gap classes were
        // served from the browser cache, not from the server.
        ...(IS_PROD
          ? [
              {
                source: "/((?!cmx/|cms/|api/).*)\\.(js|css)",
                headers: [
                  {
                    key: "Cache-Control",
                    value: "public, max-age=31536000, immutable",
                  },
                ],
              },
            ]
          : []),
      {
        // Cache video files with byte-range support for streaming
        source: "/((?!cmx/|cms/|api/).*)\\.(mp4|webm|ogg|mov|m4v)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, must-revalidate",
          },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },

  // Add rewrites for API proxying
  async rewrites() {
    return [
      // F5 (Runde 1, Expertenrat security P1): /cms/files/* no longer proxies
      // straight to the backoffice. That transparent rewrite served ANY public
      // Frappe file (HTML, SVG …) under the main domain, without extension
      // allowlist or own Content-Type – an uploaded HTML/SVG would have been
      // XSS on platzhirsch.studio. News, Journal and the home page still build
      // `/cms${path}` URLs, so /cms/files/* now goes through the own file
      // route /cmx/files/* (extension allowlist, Content-Type from the
      // extension, nosniff, sandbox for SVG, rate limit, no-store on errors).
      {
        source: "/cms/files/:path*",
        destination: "/cmx/files/:path*",
      },
      // Runde 5 (r5-technik P0-1): unknown first segment → prerendered 404.
      UNKNOWN_LOCALE_REWRITE,

      // No /cmx entry here — Next's own rewrite proxying straight to
      // NEW_API_SERVER hangs ~20s then 500s on every real file (reproducible,
      // unrelated to the file/backend itself), and interpolating the
      // catch-all segment into a rewrite destination's query string didn't
      // work either. /cmx/* is instead handled directly by
      // src/app/cmx/[...path]/route.js (a real catch-all route, no rewrite
      // needed), which proxies via a plain fetch() — confirmed to work
      // instantly and correctly against the same backend.
    ];
  },

  // Legacy WordPress → Next.js 301 redirects. The old (pre-migration) WP URLs return
  // 404 and lose backlink/ranking signals; map the known legacy patterns to their new
  // /de/ equivalents so any residual authority is consolidated. (www→apex and
  // http→https stay at nginx — not re-added here.)
  async redirects() {
    return [
      ...EZARRI_BRAND_SOURCES.map((source) => ({ source, destination: EZARRI_TARGET, permanent: true })),
      ...labsRootRedirects(),
      ...deOnlyRedirects(),
      ...newsRedirects(),
      // P6 Runde 2 (r2-technik P2-2): the About hub has no index page – these
      // URLs were 404 (and /ueber-uns took a 307 first). One 308 each.
      { source: "/ueber-uns", destination: "/de/ueber-uns/platzhirsch", permanent: true },
      { source: "/de/ueber-uns", destination: "/de/ueber-uns/platzhirsch", permanent: true },
      { source: "/en/about-us", destination: "/en/about-us/platzhirsch", permanent: true },
      { source: "/fr/a-propos", destination: "/fr/a-propos/platzhirsch", permanent: true },
      { source: "/it/chi-siamo", destination: "/it/chi-siamo/platzhirsch", permanent: true },
      // Specific legacy brand URLs first — "/marken/:slug" below would
      // otherwise catch them and forward to a brand slug that doesn't exist.
      // No trailing slash: with trailingSlash:false Next strips it before matching.
      {
        source: "/index.php/marken/brand-van-egmond",
        destination: "/de/ueber-uns/marken/brand-van-egmond",
        permanent: true,
      },
      {
        source: "/marken/https-platzhirsch-studio-marken-umbrosa",
        destination: "/de/ueber-uns/marken/umbrosa",
        permanent: true,
      },
      {
        source: "/marken/:slug",
        destination: "/de/ueber-uns/marken/:slug",
        permanent: true,
      },
      {
        source: "/marke/:slug",
        destination: "/de/ueber-uns/marken/:slug",
        permanent: true,
      },
      {
        source: "/brand/:slug",
        destination: "/de/ueber-uns/marken/:slug",
        permanent: true,
      },
      { source: "/outdoor", destination: "/de/produkte", permanent: true },
      {
        source: "/outdoor/:path*",
        destination: "/de/produkte",
        permanent: true,
      },
      {
        source: "/indoor/:path*",
        destination: "/de/produkte",
        permanent: true,
      },
      {
        source: "/produkt-kategorie/:path*",
        destination: "/de/produkte",
        permanent: true,
      },
      { source: "/new/:path*", destination: "/de/news", permanent: true },
      { source: "/thema/:path*", destination: "/de", permanent: true },
      // Second batch (verified still 404 live 2026-07-14 from GSC "Not found" export):
      // old "über-uns" spelled with one 'e', manufacturer/press/single-product/shop paths,
      // a backlinked brand-local URL, and old local-intent landing pages.
      {
        source: "/uber-uns",
        destination: "/de/ueber-uns/platzhirsch",
        permanent: true,
      },
      {
        source: "/uber-uns/:path*",
        destination: "/de/ueber-uns/:path*",
        permanent: true,
      },
      {
        source: "/hersteller/:slug",
        destination: "/de/ueber-uns/marken/:slug",
        permanent: true,
      },
      {
        source: "/presse/:path*",
        destination: "/de/ueber-uns/presse",
        permanent: true,
      },
      {
        source: "/produkt/:path*",
        destination: "/de/produkte",
        permanent: true,
      },
      { source: "/sale", destination: "/de/produkte", permanent: true },
      { source: "/shop", destination: "/de/produkte", permanent: true },
      // QM shell-home 01.11.2026: /xx/shop had no page (only warenkorb,
      // bestellung … below it) and answered 404. The shop start is
      // /xx/accessoires (Menüpunkt „Shop“). Temporary, in case /shop gets a
      // page of its own later.
      { source: "/:locale(de|en|fr|it)/shop", destination: "/:locale/accessoires", permanent: false },
      { source: "/sales/:path*", destination: "/de/produkte", permanent: true },
      {
        source: "/wohndesign/:path*",
        destination: "/de/produkte",
        permanent: true,
      },
      // Was /de/produkte/minotti — not a category, so it 404'd.
      {
        source: "/minotti-moebelstudio-lochau",
        destination: "/de/ueber-uns/marken/minotti",
        permanent: true,
      },
      // Old local-intent landing pages → their dedicated successors
      // (src/app/[locale]/<slug>/page.js), so the local keyword equity lands on
      // the page that actually targets that query.
      {
        source: "/interior-design-beratung-planung-vorarlberg",
        destination: "/de/interior-design-vorarlberg",
        permanent: true,
      },
      {
        source: "/exklusive-kuechen-vorarlberg",
        destination: "/de/kuechen-vorarlberg",
        permanent: true,
      },
      {
        source: "/wohnkonzepte-wohnzimmer-vorarlberg",
        destination: "/de/wohnzimmer-einrichten-vorarlberg",
        permanent: true,
      },
      // Labs aufgelöst (Inhaber-Entscheidung Nr. 9, 28.10.2026): /{locale}/labs/…
      // → /de/kuechenplaner, /de/sofaplaner, /de/stil-finder, /de/3d-ansicht, …
      // Nur mit Sprachpräfix: public/labs/* (Texturen, Modelle) bleibt unberührt.
      ...labsRedirects(),
      // Rat 9,5 B20 (T6): Teilen-Bilder /labs/og/<id>.jpg → /og/<id>.jpg (EIN 308, ohne Sprachpräfix).
      ...labsAssetRedirects(),
      { source: "/", destination: "/de", permanent: true },
    ];
  },
};

// Add environment-specific overrides
const devConfig =
  process.env.NODE_ENV === "development"
    ? {
        experimental: {
          workerThreads: false,
        },
      }
    : {};

const prodConfig =
  process.env.NODE_ENV === "production"
    ? {
        compress: true,
        images: {
          ...baseConfig.images,
          formats: ["image/webp", "image/avif"],
        },
      }
    : {};

const mergedConfig = {
  ...baseConfig,
  ...devConfig,
  ...prodConfig,
};

module.exports = withNextIntl(mergedConfig);
