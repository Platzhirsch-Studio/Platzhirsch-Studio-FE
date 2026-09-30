// /sitemap-marken.xml — brand story pages (see src/lib/seo/sitemapEntries.js).
import { getBrandEntries, toUrlsetXml, xmlResponse } from "@/lib/seo/sitemapEntries";

export const revalidate = 3600;

export async function GET() {
  return xmlResponse(toUrlsetXml(await getBrandEntries()));
}
