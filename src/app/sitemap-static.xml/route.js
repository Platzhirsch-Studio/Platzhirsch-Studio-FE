// /sitemap-static.xml — home, about pages and hub pages (see src/lib/seo/sitemapEntries.js).
import { getStaticEntries, toUrlsetXml, xmlResponse } from "@/lib/seo/sitemapEntries";

export const revalidate = 3600;

export async function GET() {
  return xmlResponse(toUrlsetXml(await getStaticEntries()));
}
