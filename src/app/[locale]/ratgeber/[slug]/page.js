// /de/ratgeber/<slug> – one Ratgeber article (German only, statically
// generated from src/content/ratgeber/*.md; unknown slugs and other locales
// 404). robots noindex until the article has freigegeben: true.
// Review filter: src/lib/ratgeber/review.js ("[prüfen]" passages and internal
// sections never render). Docs: Marktresearch/digital/teamleiter/r1-R1-ratgeber.md
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import RatgeberArticle from "@/components/Ratgeber/RatgeberArticle";
import { getPublicRatgeber, listPublicRatgeber } from "@/lib/ratgeber";
import { articleSchema, RATGEBER_PATH } from "@/lib/ratgeber/schema";
import { SITE_URL, SITE_NAME, clampDescription, deOnlyLanguages, ogLocale, seoAlternates, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { routing } from "@/i18n/config";
import { notFoundTitle } from "@/i18n/detectLocale";

// Statically generated with ISR (R4-release): the 8 German articles are
// prerendered from generateStaticParams. The R3 stop-gap `force-dynamic` is
// gone since src/app/not-found.js no longer reads cookies()/headers() (that
// made every page dynamic, release-check.md §3.1). `dynamicParams` stays at
// its default: an unknown slug or another locale renders on demand and gets a
// 404 from notFound() below (with `dynamicParams = false` and an empty
// prerender list every slug was a 404 in R3).

// Full params (locale + slug), independent of the parent segment, like
// news/[title]: the 8 German articles only. The former variant returned [] for
// the en/fr/it parent params, which Next passes through as incomplete
// combinations – the build then prerendered none of the articles (R4
// prod-check lauf2c/2d: route ● with 0 paths, articles only on demand).
// Other locales and unknown slugs: rendered on demand → notFound() → 404.
// Runde 4 (r4-technik P2-2): dynamicParams = false – an unreleased or
// unknown slug and every other locale get the prerendered 404 page instead
// of the empty __next_error__ shell of an on-demand notFound(). The list is
// complete (all public articles of the build), so nothing real is lost.
export const dynamicParams = false;

export function generateStaticParams() {
  return listPublicRatgeber().map((a) => ({ locale: "de", slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  // 404 branches: same title as /{locale}/<unknown> (no request data read).
  const nf = async () => ({
    title: await notFoundTitle(routing.locales.includes(locale) ? locale : routing.defaultLocale),
    robots: { index: false, follow: true },
  });
  if (locale !== "de") return nf();
  const article = getPublicRatgeber(slug);
  if (!article) return nf();
  const url = `${SITE_URL}${RATGEBER_PATH}/${article.slug}`;
  const robots = { index: article.freigegeben === true, follow: true };
  return {
    title: titleWithSuffix(article.seoTitle),
    // Rat 9,5 A15: ganze Sätze ≤ 150 (die Frontmatter-Description darf länger sein).
    description: clampDescription(article.description),
    ...(article.keywords.length ? { keywords: article.keywords } : {}),
    robots,
    // German only: hreflang de + x-default (as deOnlyMetadata); none while noindex.
    alternates: seoAlternates({ canonical: url, languages: deOnlyLanguages(`/ratgeber/${article.slug}`), robots }),
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.description,
      siteName: SITE_NAME,
      locale: ogLocale("de"),
      ...(article.datum ? { publishedTime: article.datum } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      section: article.rubrik,
    },
  };
}

export default async function RatgeberArticlePage({ params }) {
  const { locale, slug } = await params;
  if (locale !== "de") notFound();
  setRequestLocale(locale);

  // Production: only released articles (Runde 2, recht P1-5), else 404.
  const article = getPublicRatgeber(slug);
  if (!article) notFound();

  return (
    <>
      <JsonLd data={articleSchema(article, { siteUrl: SITE_URL, organizationId: ORGANIZATION_ID, websiteId: WEBSITE_ID, locale })} />
      <RatgeberArticle article={article} />
    </>
  );
}
