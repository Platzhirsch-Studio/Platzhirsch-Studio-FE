// JSON-LD for the Ratgeber (Article + BreadcrumbList + FAQPage, hub as
// CollectionPage). Pure module: the site URL and ids are passed in.
//
// Author rule: no invented person. Until reviewedBy is set, the author is the
// organisation itself. FAQPage only from the (already filtered) FAQ section.

// Runde 5 P6 (seo R4-offen): the first breadcrumb step is "Startseite" in
// German (HOME_CRUMB, the same word as the visible trail), not "Home".
import { homeCrumbLabel } from "../seo/breadcrumbs.js";

export const RATGEBER_PATH = "/de/ratgeber";

function breadcrumb(items, id) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

// Rat 9,5 B14 (T6): a reviewer with a profile page is referenced by the SAME
// Person @id as the team/profile page (TEAM_PEOPLE in src/lib/seo/
// structuredData.js, /de/ueber-uns/team/harald-menghin). Only used when the
// article's reviewedBy really names that person – nothing is assumed.
export const REVIEWER_PROFILES = Object.freeze({
  "Harald Menghin": Object.freeze({ id: "/#person-harald-menghin", path: "/de/ueber-uns/team/harald-menghin" }),
});

export function reviewerNode(name, siteUrl) {
  if (!name) return null;
  const profile = REVIEWER_PROFILES[name];
  return profile
    ? { "@type": "Person", "@id": `${siteUrl}${profile.id}`, name, url: `${siteUrl}${profile.path}` }
    : { "@type": "Person", name };
}

export function articleSchema(article, { siteUrl, organizationId, websiteId, locale = "de" }) {
  const url = `${siteUrl}${RATGEBER_PATH}/${article.slug}`;
  const organization = { "@type": "Organization", "@id": organizationId, name: "Platzhirsch Home Living", url: siteUrl };
  const author = reviewerNode(article.reviewedBy, siteUrl) || organization;

  const nodes = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      url,
      headline: article.heading.length <= 110 ? article.heading : article.heading.slice(0, 107) + "…",
      name: article.title,
      ...(article.description ? { description: article.description } : {}),
      inLanguage: "de-AT",
      ...(article.datum ? { datePublished: article.datum } : {}),
      ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
      author,
      publisher: { "@id": organizationId },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      isPartOf: { "@id": websiteId },
      articleSection: article.rubrik,
      ...(article.keywords.length ? { keywords: article.keywords.join(", ") } : {}),
      ...(article.quellen.length ? { citation: article.quellen } : {}),
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: article.title,
      inLanguage: "de-AT",
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    breadcrumb(
      [
        { name: homeCrumbLabel(locale), url: `${siteUrl}/de` },
        { name: "Ratgeber", url: `${siteUrl}${RATGEBER_PATH}` },
        { name: article.heading },
      ],
      `${url}#breadcrumb`
    ),
  ];

  if (article.faq.length) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "de-AT",
      mainEntity: article.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function hubSchema(articles, { siteUrl, websiteId, locale = "de" }) {
  const url = `${siteUrl}${RATGEBER_PATH}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: "Ratgeber",
        inLanguage: "de-AT",
        isPartOf: { "@id": websiteId },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: articles.map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${url}/${a.slug}`,
            name: a.heading,
          })),
        },
      },
      breadcrumb([{ name: homeCrumbLabel(locale), url: `${siteUrl}/de` }, { name: "Ratgeber" }], `${url}#breadcrumb`),
    ],
  };
}
