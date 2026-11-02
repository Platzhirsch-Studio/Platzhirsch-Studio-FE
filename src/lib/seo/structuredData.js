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

// A product page as ItemPage + mainEntity Thing (Runde 2, seo P1-5 / technik
// P2-5; same pattern as the Ezarri mosaics, src/components/Ezarri/Welt/schema.js).
// Before: "Product" without offers/review/aggregateRating – Google reports that
// as an invalid product snippet, and prices stay "auf Anfrage" (no offers with
// an invented price). No sku: the backoffice id is the product name, not an
// article number. Facts that schema.org only allows on Product (brand,
// material, colour, measures) are named on the page node (about → Brand) and
// in the description text. `product` = toShopProductDetail() output,
// `measures` = dimensionsJsonLd() result ({width, height, depth, weight}).
const FACT_LABEL = {
  de: { width: "Breite", height: "Höhe", depth: "Tiefe", weight: "Gewicht", design: "Design", material: "Material", color: "Farbe", price: "Preis auf Anfrage" },
  en: { width: "Width", height: "Height", depth: "Depth", weight: "Weight", design: "Design", material: "Material", color: "Colour", price: "Price on request" },
  fr: { width: "Largeur", height: "Hauteur", depth: "Profondeur", weight: "Poids", design: "Design", material: "Matériau", color: "Couleur", price: "Prix sur demande" },
  it: { width: "Larghezza", height: "Altezza", depth: "Profondità", weight: "Peso", design: "Design", material: "Materiale", color: "Colore", price: "Prezzo su richiesta" },
};

export function productSchema({ product, url, description, categoryLabel, measures = {}, locale = "de" }) {
  const L = FACT_LABEL[locale] || FACT_LABEL.de;
  const images = (product.images || []).map(absoluteUrl).filter(Boolean);
  const facts = [
    product.designer ? `${L.design}: ${product.designer}` : "",
    product.materialRaw ? `${L.material}: ${product.materialRaw}` : "",
    product.colorRaw ? `${L.color}: ${product.colorRaw}` : "",
    ...Object.entries(measures || {})
      .filter(([k, v]) => ["width", "height", "depth", "weight"].includes(k) && v && v.value != null)
      .map(([k, v]) => `${L[k]}: ${v.value} ${v.unitText || ""}`.trim()),
    L.price,
  ].filter(Boolean);
  const text = [description, facts.join(". ") + "."].filter(Boolean).join(" ");
  return {
    "@type": "ItemPage",
    "@id": `${url}#webpage`,
    url,
    name: product.brand ? `${product.brand} ${product.name}` : product.name,
    isPartOf: { "@id": WEBSITE_ID },
    ...(product.brand ? { about: { "@type": "Brand", name: product.brand } } : {}),
    ...(categoryLabel ? { genre: categoryLabel } : {}),
    ...(images.length ? { primaryImageOfPage: { "@type": "ImageObject", contentUrl: images[0] } } : {}),
    mainEntity: {
      "@type": "Thing",
      "@id": `${url}#product`,
      name: product.name,
      description: text,
      ...(images.length ? { image: images } : {}),
      url,
    },
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
  // Static jobs (src/lib/karriere/stellen.js): localized title, valid_through,
  // salary per month or year. baseSalary only once a salary is entered.
  const unitText = job.salary_unit === "YEAR" ? "YEAR" : "MONTH";
  const validThrough = toIsoDate(job.valid_through);
  const ownTitle = job[`title_${locale}`];

  return {
    "@type": "JobPosting",
    "@id": `${url}#job`,
    url,
    title: (typeof ownTitle === "string" && ownTitle.trim()) || job.title,
    description: localizedJobDescription(job, locale) || job.title,
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
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
        streetAddress: "Landstraße 11",
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
              ? { "@type": "QuantitativeValue", minValue: salaryMin, maxValue: salaryMax, unitText }
              : { "@type": "QuantitativeValue", value: salaryMin, unitText },
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

// Site-wide Organization/FurnitureStore + WebSite (R4-seo): business facts and
// opening hours from src/lib/site.js, brand list through the dealer filter of
// src/lib/legal (ClassiCon is the only `brand`, all others `knowsAbout`).
// The layout should render `siteSchema()` instead of its inline copy.
export { siteSchema, organizationNode, websiteNode, splitBrandsByDealerFilter, SHOWROOM_BRANDS } from "./siteSchema.js";

// ---------------------------------------------------------------------------
// Person nodes of the team page (Runde 2, seo P2-6). Only facts the team page
// shows: name, role ONLY if confirmed there (inhalt.team.roles – Harald has no
// role yet, so no jobTitle), the note as description, worksFor → #organization.
// knowsAbout = the Kern-USP (Inhaber-Entscheidung Nr. 8).
export const TEAM_PEOPLE = Object.freeze({
  "Harald Menghin": Object.freeze({
    id: `${SITE_URL}/#person-harald-menghin`,
    knowsAbout: Object.freeze({
      de: ["Handzeichnung", "Raummodelle", "Einrichtungsplanung"],
      en: ["Hand drawing", "Scale room models", "Interior planning"],
      fr: ["Dessin à la main", "Maquettes de pièces", "Aménagement intérieur"],
      it: ["Disegno a mano", "Modelli in scala degli ambienti", "Progettazione d'interni"],
    }),
  }),
});

/**
 * @param {{name: string, locale?: string, pageUrl: string, jobTitle?: string, description?: string}} p
 * @returns {object|null} Person node, null for people without an entry in TEAM_PEOPLE
 */
export function teamPersonSchema({ name, locale = "de", pageUrl, jobTitle, description }) {
  const entry = TEAM_PEOPLE[name];
  if (!entry) return null;
  return {
    "@type": "Person",
    "@id": entry.id,
    name,
    ...(jobTitle ? { jobTitle } : {}),
    ...(description ? { description } : {}),
    worksFor: { "@id": ORGANIZATION_ID },
    knowsAbout: entry.knowsAbout[locale] || entry.knowsAbout.de,
    ...(pageUrl ? { url: pageUrl } : {}),
  };
}
