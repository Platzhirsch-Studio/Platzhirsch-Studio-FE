const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/config.js");

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    deviceSizes: [
      320,
      420,
      640,
      750,
      828,
      1080,
      1200,
      1920,
    ],
    imageSizes: [
      16,
      32,
      48,
      64,
      96,
      128,
      256,
      384,
      512,

    ],
    qualities: [50, 75, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backoffice.platzhirsch.studio",
        pathname: "/**",
      },
    ],

    dangerouslyAllowSVG: true,

  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
        ],
      },
      {
        // Cache static images for 1 year
        source: "/(.*)\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache JS/CSS files for 1 year
        source: "/(.*)\\.(js|css)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache video files with byte-range support for streaming
        source: "/(.*)\\.(mp4|webm|ogg|mov|m4v)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, must-revalidate" },
          { key: "Accept-Ranges", value: "bytes" }
        ],
      },
    ];
  },

  // Add rewrites for API proxying
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backoffice.platzhirsch.studio/api/method/:path*',
      },
      {
        source: "/cms/:path*",
        destination: "https://backoffice.platzhirsch.studio/:path*",
      },
    ];
  },

  // Legacy WordPress → Next.js 301 redirects. The old (pre-migration) WP URLs return
  // 404 and lose backlink/ranking signals; map the known legacy patterns to their new
  // /de/ equivalents so any residual authority is consolidated. (www→apex and
  // http→https stay at nginx — not re-added here.)
  async redirects() {
    return [
      { source: "/marken/:slug", destination: "/de/ueber-uns/marken/:slug", permanent: true },
      { source: "/marke/:slug", destination: "/de/ueber-uns/marken/:slug", permanent: true },
      { source: "/brand/:slug", destination: "/de/ueber-uns/marken/:slug", permanent: true },
      { source: "/outdoor", destination: "/de/produkte", permanent: true },
      { source: "/outdoor/:path*", destination: "/de/produkte", permanent: true },
      { source: "/indoor/:path*", destination: "/de/produkte", permanent: true },
      { source: "/produkt-kategorie/:path*", destination: "/de/produkte", permanent: true },
      { source: "/new/:path*", destination: "/de/news", permanent: true },
      { source: "/thema/:path*", destination: "/de", permanent: true },
      // Second batch (verified still 404 live 2026-07-14 from GSC "Not found" export):
      // old "über-uns" spelled with one 'e', manufacturer/press/single-product/shop paths,
      // a backlinked brand-local URL, and old local-intent landing pages.
      { source: "/uber-uns", destination: "/de/ueber-uns/platzhirsch", permanent: true },
      { source: "/uber-uns/:path*", destination: "/de/ueber-uns/:path*", permanent: true },
      { source: "/hersteller/:slug", destination: "/de/ueber-uns/marken/:slug", permanent: true },
      { source: "/presse/:path*", destination: "/de/ueber-uns/presse", permanent: true },
      { source: "/produkt/:path*", destination: "/de/produkte", permanent: true },
      { source: "/sale", destination: "/de/produkte", permanent: true },
      { source: "/shop", destination: "/de/produkte", permanent: true },
      { source: "/sales/:path*", destination: "/de/produkte", permanent: true },
      { source: "/wohndesign/:path*", destination: "/de/produkte", permanent: true },
      { source: "/minotti-moebelstudio-lochau", destination: "/de/produkte/minotti", permanent: true },
      // Local-intent landing pages (Vorarlberg keywords) — reclaim link equity now;
      // recreating these as real localized pages is a high-value local-SEO follow-up.
      { source: "/interior-design-beratung-planung-vorarlberg", destination: "/de/beratung", permanent: true },
      { source: "/exklusive-kuechen-vorarlberg", destination: "/de/produkte", permanent: true },
      { source: "/wohnkonzepte-wohnzimmer-vorarlberg", destination: "/de/produkte", permanent: true },
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