// src/app/robots.js
// Next.js generates /robots.txt from this at runtime (same convention as sitemap.js).
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

const BASE_URL = "https://platzhirsch.studio";

export default function robots() {
  return {
    rules: [
      {
        userAgent: ["Googlebot", "Bingbot", "Slurp", "DuckDuckBot"],
        allow: ["/api/image", "/"],
        disallow: ["/api/"],
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "Claude-Web",
          "Claude-SearchBot",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Amazonbot",
          "Applebot",
          "Applebot-Extended",
          "YouBot",
        ],
        allow: ["/api/image", "/"],
        disallow: ["/api/"],
        crawlDelay: 2,
      },
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
          "cohere-ai",
          "ImagesiftBot",
        ],
        disallow: ["/"],
      },
      {
        userAgent: "*",
        allow: ["/_next/image", "/api/image", "/"],
        disallow: ["/api/", "/private/", "/*?*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
