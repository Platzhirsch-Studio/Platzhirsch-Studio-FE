// src/lib/seo/newsRedirects.cjs
// News redirects for next.config.js (Runde 3 P5, seo P1-6 and P2-8,
// qa-screenshots/fertig/r3-seo.md).
//
// 1. Ended promotions (UWG): the three withheld articles of
//    src/lib/news/withheldNews.js (WITHHELD_NEWS) were indexed in four
//    languages (12 URLs). Instead of a noindex "Diese Aktion ist beendet." page
//    they answer with ONE 308 to the news hub of their language. The slug list
//    here must equal WITHHELD_NEWS (tests/unit/r8-seo-redirects.test.mjs); the page
//    itself also redirects any other withheld article (discount net), see
//    src/app/[locale]/news/[title]/page.js.
// 2. The FR/IT hub lives at /fr/nouvelles and /it/notizie, the articles at
//    /<locale>/news/<slug>. /fr/nouvelles/<slug> and /it/notizie/<slug> were
//    404 → one 308 to the article URL (withheld slugs straight to the hub).
//
// Redirects run before the proxy and the filesystem (docs 01-next-config-js/
// redirects.md), `permanent: true` = 308. CommonJS so next.config.js can
// require it; pure, no imports.

const WITHHELD_NEWS_SLUGS = Object.freeze([
  "platzhirsch-lagerabverkauf-kuechen-betten-und-sofas",
  "sortimentswechsel-stuehle-sessel-und-accessoires",
  "sommer-inspiration-fuer-ihren-aussenbereich",
]);

// Hub path per locale (same as ROUTES.news in src/utils/routing.js).
const NEWS_HUB = Object.freeze({ de: "/news", en: "/news", fr: "/nouvelles", it: "/notizie" });

// Article slugs: no dot (no file), one segment.
const SLUG = "([^./]+)";

function newsRedirects() {
  const out = [];
  for (const [locale, hub] of Object.entries(NEWS_HUB)) {
    for (const slug of WITHHELD_NEWS_SLUGS) {
      out.push({ source: `/${locale}/news/${slug}`, destination: `/${locale}${hub}`, permanent: true });
      if (hub !== "/news") out.push({ source: `/${locale}${hub}/${slug}`, destination: `/${locale}${hub}`, permanent: true });
    }
  }
  for (const [locale, hub] of Object.entries(NEWS_HUB)) {
    if (hub === "/news") continue;
    out.push({ source: `/${locale}${hub}/:slug${SLUG}`, destination: `/${locale}/news/:slug`, permanent: true });
  }
  return out;
}

module.exports = { newsRedirects, WITHHELD_NEWS_SLUGS, NEWS_HUB };
