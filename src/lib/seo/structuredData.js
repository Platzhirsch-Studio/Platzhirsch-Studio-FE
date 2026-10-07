// src/lib/seo/structuredData.js
// Schema.org JSON-LD builders shared by the product, category, hub, news and
// job pages. Every URL is absolute, and the site-wide Organization/
// FurnitureStore + WebSite nodes (src/app/[locale]/layout.js) are referenced
// by @id instead of being repeated per page.
import { SITE_URL, SITE_NAME } from "@/lib/seo/pageMetadata";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const IN_LANGUAGE = { de: "de-AT", en: "en", fr: "fr-FR", it: "it-IT" };

// "/cmx/files/x.jpg" or "https://…" → absolute URL.
export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${encodeURI(pathOrUrl)}`;
}

// `items` = [{ name, url }] in order, url absolute or site-relative
// ("/de/produkte"). The last item may omit url (the current page).
export function breadcrumbList(items, id) {
  return {
    "@type": "BreadcrumbList",
    ...(id ? { "@id": id } : {}),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: absoluteUrl(item.url) } : {}),
    })),
  };
}

// A product as a catalogue item — deliberately WITHOUT offers/price (prices
// aren't published). `product` = toShopProductDetail() output.
export function productSchema({ product, url, description, categoryLabel }) {
  const images = (product.images || []).map(absoluteUrl).filter(Boolean);
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: product.name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(categoryLabel ? { category: categoryLabel } : {}),
    ...(product.materialRaw ? { material: product.materialRaw } : {}),
    ...(product.colorRaw ? { color: product.colorRaw } : {}),
    ...(product.designer
      ? { additionalProperty: { "@type": "PropertyValue", name: "Designer", value: product.designer } }
      : {}),
    sku: product.id,
  };
}

// CollectionPage whose mainEntity is an ItemList of links (categories on the
// hub, products on a category page). `items` = [{ name, url, image? }].
export function collectionPageSchema({ url, name, description, locale, items, breadcrumb }) {
  return {
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    ...(breadcrumb ? { breadcrumb } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.url),
        name: item.name,
        ...(item.image ? { image: absoluteUrl(item.image) } : {}),
      })),
    },
  };
}

// Job description in the page's language, German (stellenbeschreibung) as
// fallback. The CMS uses a different field name per language.
const JOB_DESCRIPTION_FIELD = {
  de: "stellenbeschreibung",
  en: "job_description_en",
  fr: "description_de_lemploi",
  it: "jobs_description_it",
};

export function localizedJobDescription(job, locale) {
  const localized = job?.[JOB_DESCRIPTION_FIELD[locale]];
  return (typeof localized === "string" && localized.trim()) || job?.stellenbeschreibung || "";
}

// Free-text CMS "type" ("Vollzeit", "Teilzeit", "Full-time", …) → schema.org
// employmentType values Google understands.
function employmentTypes(type) {
  const value = String(type || "").toLowerCase();
  const types = [];
  if (/voll|full/.test(value)) types.push("FULL_TIME");
  if (/teil|part/.test(value)) types.push("PART_TIME");
  if (/prakt|intern/.test(value)) types.push("INTERN");
  if (/befrist|tempor/.test(value)) types.push("TEMPORARY");
  if (/frei|contract|freelanc/.test(value)) types.push("CONTRACTOR");
  return types;
}

// "2.800" / "2,800" / "2800" / "2.800,50" / "€ 2.800 – 3.200" → numbers.
// A separator followed by exactly 3 digits is a thousands separator
// (German "2.800" = 2800), otherwise it's the decimal separator.
function parseSalary(raw) {
  const tokens = String(raw ?? "").match(/\d[\d.,]*/g) || [];
  return tokens
    .map((token) => {
      const decimal = token.match(/[.,](\d{1,2})$/);
      const whole = decimal ? token.slice(0, -decimal[0].length) : token;
      return Number(`${whole.replace(/[.,]/g, "")}${decimal ? `.${decimal[1]}` : ""}`);
    })
    .filter((n) => n > 0);
}

function toIsoDate(value) {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

// JobPosting for Google Jobs. `job` = one fetchKarriereData() entry.
export function jobPostingSchema({ job, locale, url }) {
  const datePosted = toIsoDate(job.posted || job.creation);
  const types = employmentTypes(job.type);
  const [salaryMin, salaryMax] = parseSalary(job.salary);

  return {
    "@type": "JobPosting",
    "@id": `${url}#job`,
    url,
    title: job.title,
    description: localizedJobDescription(job, locale) || job.title,
    ...(datePosted ? { datePosted } : {}),
    ...(types.length ? { employmentType: types.length === 1 ? types[0] : types } : {}),
    hiringOrganization: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/Images/Navbar/Logo.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Landstraße 9",
        postalCode: "6911",
        addressLocality: "Lochau",
        addressRegion: "Vorarlberg",
        addressCountry: "AT",
      },
    },
    ...(salaryMin
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "EUR",
            value: salaryMax
              ? { "@type": "QuantitativeValue", minValue: salaryMin, maxValue: salaryMax, unitText: "MONTH" }
              : { "@type": "QuantitativeValue", value: salaryMin, unitText: "MONTH" },
          },
        }
      : {}),
    directApply: false,
  };
}

export function graph(...nodes) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

export { SITE_URL, SITE_NAME };
