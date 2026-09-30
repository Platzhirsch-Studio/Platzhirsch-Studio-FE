// /sitemap-produkte.xml — product category pages and product detail pages
// (see src/lib/seo/sitemapEntries.js).
import { getProductEntries, toUrlsetXml, xmlResponse } from "@/lib/seo/sitemapEntries";

export const revalidate = 3600;

export async function GET() {
  return xmlResponse(toUrlsetXml(await getProductEntries()));
}
