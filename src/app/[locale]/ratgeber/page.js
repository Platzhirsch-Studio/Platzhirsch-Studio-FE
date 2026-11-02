// /de/ratgeber – Ratgeber hub (German only; other locales 404).
// noindex until at least one article is released (freigegeben: true in
// src/content/ratgeber/*.md). Sitemap, llms.txt and the navigation may only
// use getIndexableRatgeber() (released articles only; drafts stay noindex).
// Docs: Marktresearch/digital/teamleiter/r1-R1-ratgeber.md
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import RatgeberHub from "@/components/Ratgeber/RatgeberHub";
import { getIndexableRatgeber, groupByRubrik, listPublicRatgeber } from "@/lib/ratgeber";
import { hubSchema, RATGEBER_PATH } from "@/lib/ratgeber/schema";
import { SITE_URL, SITE_NAME, deOnlyLanguages, ogLocale, seoAlternates, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { WEBSITE_ID } from "@/lib/seo/structuredData";

const TITLE = "Ratgeber: Designmöbel, Küche, Pflege und Lieferung";
// ≤ 65 with suffix (Runde 2): "Ratgeber Designmöbel und Küche | Platzhirsch Home Living".
const META_TITLE = "Ratgeber Designmöbel und Küche";
const DESCRIPTION =
  "Ratgeber von Platzhirsch Home Living aus Lochau: Maße, Materialien, Pflege, Lieferzeiten und Preise von Designmöbeln und Küchen, mit Quellen belegt.";

// Runde 4 (r4-technik P2-2, Fix-Team P6): a real 404 while no Ratgeber article is released.
// notFound() during the BUILD (static prerender) made Next 16 store the empty
// shell <html id="__next_error__"> (no lang, no h1) with s-maxage=3600 –
// checked in the production copy (build r4-fix6). The same notFound() at
// REQUEST time renders the 404 page (src/app/not-found.js: lang, h1,
// noindex, status 404, Cache-Control no-store). So the switched-off branch
// first calls connection(): prerendering stops there, the path is rendered
// per request, and nothing is cached. While the page is on, connection() is
// never called and the page stays static (ISR, revalidate below).
// (A page-level generateStaticParams/dynamicParams does not work here: the
// page has no own dynamic segment, Next ignores both – build r4-fix6.)

export async function generateMetadata({ params }) {
  const { locale } = await params;
  // Off: 404 from the metadata step already, before anything streams – a
  // notFound() only in the page body sent the empty __next_error__ shell
  // (build r4-fix6b). connection(): rendered per request, never cached.
  if (locale !== "de" || !listPublicRatgeber().length) {
    await connection();
    notFound();
  }
  const url = `${SITE_URL}${RATGEBER_PATH}`;
  const robots = { index: getIndexableRatgeber().length > 0, follow: true };
  return {
    title: titleWithSuffix(META_TITLE),
    description: DESCRIPTION,
    robots,
    // German only: hreflang de + x-default like the other DE-only pages
    // (deOnlyMetadata); seoAlternates drops it while the hub is noindex.
    alternates: seoAlternates({ canonical: url, languages: deOnlyLanguages("/ratgeber"), robots }),
    openGraph: { type: "website", url, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: ogLocale("de") },
  };
}

export default async function RatgeberPage({ params }) {
  const { locale } = await params;
  // Production: 404 until an article is released (Runde 2, recht P1-5) –
  // rendered per request, see the note above.
  const articles = locale === "de" ? listPublicRatgeber() : [];
  if (!articles.length) {
    await connection();
    notFound();
  }
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={hubSchema(articles, { siteUrl: SITE_URL, websiteId: WEBSITE_ID, locale })} />
      <RatgeberHub groups={groupByRubrik(articles)} />
    </>
  );
}
