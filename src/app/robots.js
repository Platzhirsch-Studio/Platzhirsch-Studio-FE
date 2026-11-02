// src/app/robots.js
// Next.js generates /robots.txt from this at runtime. The sitemap below is the
// index at src/app/sitemap.xml/route.js, which lists the per-section sitemaps.
// Do NOT also add public/robots.txt or app/robots.txt/route.js — they would conflict.
//
// Deliberate crawler policy (ported 1:1 from the previous app/robots.txt/route.js):
//   - Classic search bots (Google/Bing/Yahoo/DuckDuckGo): full crawl, only /api/ blocked.
//   - AI answer engines (ChatGPT/Claude-Web/Perplexity/Apple/You): allowed, crawl-delay 2,
//     so the site surfaces in AI search as well as classic search.
//   - Pure AI-training scrapers (GPTBot/ClaudeBot/CCBot/Bytespider/Google-Extended/…):
//     fully disallowed.
//   - Everyone else: crawl content, but block /api/, /private/ and all query-string URLs.
// The /llms.txt file complements this for LLM discoverability.
// Runde 2 (seo P2-7): one consistent rule set –
//   - Applebot-Extended is Apple's TRAINING token (like Google-Extended/GPTBot),
//     so it is in the disallow group; Applebot (search) stays allowed.
//   - Query-string URLs (/*?*) are blocked for every group that may crawl, not
//     only for "*" (canonical/noindex already cover them; this saves crawl
//     budget). /_next/image stays allowed (longer rule wins).
// /api/image (an open backoffice proxy) was removed on 26.10.2026 — masterplan
// AP0 Nr. 3 — so it is no longer allowed here; /api/ as a whole stays blocked.

const BASE_URL = "https://platzhirsch.studio";

// Runde 3 P5 (seo P2, r3-seo P2-1): /*?* stays blocked, but the parameters the
// site itself links must stay crawlable, otherwise their canonical (without
// parameters) is never seen and Search Console reports "indexed, though
// blocked by robots.txt":
//   ?lang=  – the 308 of the German-only pages (src/lib/seo/deOnlyRedirects.cjs)
//   ?thema= – appointment links with a topic (beratungHref, Landing/copy.js)
//   ?ort=   – appointment links of the region pages (same helper)
// Google and Bing apply the most specific (longest) rule, so these Allow
// lines win over Disallow /*?*. The target pages canonicalise without
// parameters.
const ALLOW_QUERY = ["/*?lang=", "/*?thema=", "/*?ort="];

// Pinterest (Inhaber-Entscheidung Nr. 14): Pinterestbot liest beim Merken
// Open Graph/schema.org der Zielseite (Rich Pins). Die Merken-Links des
// Ezarri-Konfigurators (?k=, Mischung) und des Stil-Finders (?a=, Antworten)
// zeigen auf Seiten mit Query – nur für Pinterestbot freigegeben, alle
// anderen Gruppen behalten /*?*. Die Zielseiten kanonisieren ohne Parameter.
const ALLOW_QUERY_PINTEREST = ["/*?k=", "/*?a="];

// Interne Vorschauen (Kanal-Vorschau Pinterest u. a.): Seiten /<locale>/preview/…
// sind noindex und in Produktion 404; die Bilder unter public/preview/ werden
// zusätzlich vor dem Deploy ausgeschlossen (deploy-exclude, siehe
// qa-screenshots/pinterest/website-bau.md). Hier: nicht crawlen.
const PREVIEW = ["/preview/", "/*/preview/"];

export default function robots() {
  return {
    rules: [
      {
        userAgent: ["Googlebot", "Bingbot", "Slurp", "DuckDuckBot"],
        allow: ["/_next/image", "/", ...ALLOW_QUERY],
        disallow: ["/api/", "/*?*", ...PREVIEW],
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          // GEO W8 (31.10.2026): current search/user agents. Claude-Web and
          // anthropic-ai are legacy tokens – kept, they do no harm.
          "Claude-User",
          "Claude-Web",
          "Claude-SearchBot",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Amazonbot",
          "Applebot",
          "YouBot",
          "DuckAssistBot",
          "MistralAI-User",
        ],
        allow: ["/_next/image", "/", ...ALLOW_QUERY],
        disallow: ["/api/", "/*?*", ...PREVIEW],
        crawlDelay: 2,
      },
      // Training crawlers stay blocked. Opening GPTBot, ClaudeBot,
      // Google-Extended or Apple’s training token is an open owner decision
      // (qa-screenshots/geo-ki/02-massnahmen-website.md, W8) – never silently.
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "CCBot",
          "FacebookBot",
          "Meta-ExternalAgent",
          "Bytespider",
          "Omgilibot",
          "Diffbot",
          "Google-Extended",
          "Applebot-Extended",
          "cohere-ai",
          "ImagesiftBot",
        ],
        disallow: ["/"],
      },
      {
        userAgent: "Pinterestbot",
        allow: ["/_next/image", "/", ...ALLOW_QUERY, ...ALLOW_QUERY_PINTEREST],
        disallow: ["/api/", "/private/", "/*?*", ...PREVIEW],
      },
      {
        userAgent: "*",
        allow: ["/_next/image", "/", ...ALLOW_QUERY],
        disallow: ["/api/", "/private/", "/*?*", ...PREVIEW],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
