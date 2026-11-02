// src/lib/seo/sitemap/xml.js
// XML serialization for the split sitemaps (see src/lib/seo/sitemapEntries.js,
// which re-exports everything here). Pure module: no "server-only", no "@/"
// imports, so node --test can load it (tests/unit/sitemap*.test.mjs).

export const BASE_URL = "https://platzhirsch.studio";

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toW3CDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// <urlset> with just <loc> + <lastmod> per URL, the same shape as the index.
// Deliberately no xhtml:link hreflang alternates: every page already declares
// them in its own <head> (Google accepts either place), and XHTML-namespaced
// elements make browsers render the sitemap as run-together text instead of
// the XML tree. changefreq/priority are left out too — Google ignores both.
// Bilder-SEO (31.10.2026): entries with `images` (absolute URLs, see
// ./images.js) get <image:image><image:loc> blocks after <lastmod> – Google
// image sitemap, max. MAX_IMAGES_PER_URL per <url>. The image namespace is
// only declared when at least one entry has images (files without images
// stay byte-identical). <image:loc> is not matched by /<loc>/ parsers.
export const IMAGE_NS = "http://www.google.com/schemas/sitemap-image/1.1";
export const MAX_IMAGES_PER_URL = 1000;

export function imageXml(images = []) {
  const seen = new Set();
  return images
    .filter((u) => typeof u === "string" && /^https?:\/\//.test(u) && !seen.has(u) && seen.add(u))
    .slice(0, MAX_IMAGES_PER_URL)
    .map((u) => `\n<image:image>\n<image:loc>${escapeXml(u)}</image:loc>\n</image:image>`)
    .join("");
}

export function toUrlsetXml(entries) {
  let anyImages = false;
  const urls = entries
    .map((entry) => {
      const lastmod = toW3CDate(entry.lastModified);
      const images = Array.isArray(entry.images) && entry.images.length ? imageXml(entry.images) : "";
      if (images) anyImages = true;
      return `<url>\n<loc>${escapeXml(entry.url)}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}${images}\n</url>`;
    })
    .join("\n");

  const ns = anyImages ? ` xmlns:image="${IMAGE_NS}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}>\n${urls}\n</urlset>\n`;
}

// <sitemapindex> listing the child sitemaps. `sitemaps` = [{ path, lastModified }].
export function toSitemapIndexXml(sitemaps) {
  const items = sitemaps
    .map(({ path, lastModified }) => {
      const lastmod = lastModified ? toW3CDate(lastModified) : null;
      return `<sitemap>\n<loc>${escapeXml(`${BASE_URL}${path}`)}</loc>${lastmod ? `\n<lastmod>${lastmod}</lastmod>` : ""}\n</sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

// Newest lastModified among entries — the index's <lastmod> for that file.
export function latestLastModified(entries) {
  let latest = null;
  for (const entry of entries) {
    const date = new Date(entry.lastModified);
    if (!isNaN(date.getTime()) && (!latest || date > latest)) latest = date;
  }
  return latest;
}

export function xmlResponse(xml) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
