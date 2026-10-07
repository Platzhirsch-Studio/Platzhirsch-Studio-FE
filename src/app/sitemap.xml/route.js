// /sitemap.xml — sitemap index pointing at the per-section sitemaps
// (see src/lib/seo/sitemapEntries.js). Stays at the URL robots.txt and
// Search Console already use. Rebuilt at most once an hour.
import { SITEMAP_SECTIONS, latestLastModified, toSitemapIndexXml, xmlResponse } from "@/lib/seo/sitemapEntries";

export const revalidate = 3600;

export async function GET() {
  const sitemaps = await Promise.all(
    SITEMAP_SECTIONS.map(async ({ path, getEntries }) => ({
      path,
      lastModified: latestLastModified(await getEntries()),
    }))
  );
  return xmlResponse(toSitemapIndexXml(sitemaps));
}
