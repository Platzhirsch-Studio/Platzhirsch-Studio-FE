// /sitemap-news.xml — news articles (see src/lib/seo/sitemapEntries.js).
import { getNewsEntries, toUrlsetXml, xmlResponse } from "@/lib/seo/sitemapEntries";

export const revalidate = 3600;

export async function GET() {
  return xmlResponse(toUrlsetXml(await getNewsEntries()));
}
