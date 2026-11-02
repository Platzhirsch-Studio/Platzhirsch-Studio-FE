// src/lib/productCopy/core.js
// Pure lookup logic for the curated product copy. Data is injected, so this
// file runs in Next (server or client), in node --test and in tools.
// No '@/' imports, no 'server-only', no dependencies (only ./approvals.js).
//
// What the site may show is the PUBLISHED VIEW of an entry (publishedCopy):
// only fields with a valid text-hash approval (./approvals.js), FAQ only the
// approved question/answer pairs. Raw entries (drafts) never pass
// buildFaqJsonLd / metadataOverride, they need the view's marker.
import { APPROVABLE_FIELDS, approvedFaqItems, isFieldApproved } from "./approvals.js";

export const PRODUCT_COPY_LOCALES = Object.freeze(["de"]);

const PUBLISHED = Symbol.for("platzhirsch.productCopy.published");

/** true for an object returned by publishedCopy() (not a raw/draft entry). */
export function isPublishedCopy(copy) {
  return Boolean(copy && copy[PUBLISHED] === true);
}

/**
 * The publishable part of one entry, or null if nothing is approved.
 * Identity fields (brand, productName, manufacturerUrl) come along because
 * they label the approved parts; they are not shown on their own.
 */
export function publishedCopy(entry) {
  if (!entry) return null;
  const view = {
    key: entry.key,
    categorySlug: entry.categorySlug,
    productSlug: entry.productSlug,
    brand: entry.brand,
    productName: entry.productName,
    manufacturerUrl: entry.manufacturerUrl,
    catalog: entry.catalog,
    approved: true,
  };
  let any = false;
  for (const field of APPROVABLE_FIELDS) {
    if (!isFieldApproved(entry, field)) continue;
    const value = entry[field];
    const filled = Array.isArray(value) ? value.length > 0 : field === "meta" ? Boolean(value?.title || value?.description) : Boolean(value);
    if (!filled) continue;
    view[field] = value;
    any = true;
  }
  const faq = approvedFaqItems(entry);
  if (faq.length) {
    view.faq = faq;
    any = true;
  }
  if (!any) return null;
  Object.defineProperty(view, PUBLISHED, { value: true, enumerable: false });
  return Object.freeze(view);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/**
 * DEV PREVIEW ONLY (page shows it only when NODE_ENV !== "production" and
 * ?produkttext=vorschau is set): every field of the draft, flagged
 * preview:true. It carries no published marker, so buildFaqJsonLd and
 * metadataOverride ignore it – a draft never reaches JSON-LD or <title>.
 */
export function previewCopy(entry) {
  if (!entry) return null;
  return Object.freeze({ ...entry, preview: true });
}

/**
 * Builds the store for one data file ({ entries: [...] }).
 * Keys are '<kategorieSlug>/<produktSlug>' exactly as in the catalog URL.
 * If the category segment changed in the backoffice (the product page then
 * 308-redirects), the lookup falls back to the product slug, which is the
 * unique path_field of the record.
 */
export function createProductCopyStore(data, { locale = "de" } = {}) {
  const entries = deepFreeze(Array.isArray(data?.entries) ? data.entries : []);
  const byKey = new Map();
  const byProduct = new Map();
  for (const entry of entries) {
    if (!entry?.key || byKey.has(entry.key)) {
      throw new Error(`productCopy: fehlender oder doppelter Schlüssel ${entry?.key}`);
    }
    byKey.set(entry.key, entry);
    const list = byProduct.get(entry.productSlug) || [];
    list.push(entry);
    byProduct.set(entry.productSlug, list);
  }

  // -> { entry, matchedBy: 'key' | 'productSlug' } or null
  function match(categorySlug, productSlug) {
    if (!productSlug) return null;
    const exact = byKey.get(`${categorySlug}/${productSlug}`);
    if (exact) return { entry: exact, matchedBy: "key" };
    const candidates = byProduct.get(productSlug);
    return candidates && candidates.length === 1 ? { entry: candidates[0], matchedBy: "productSlug" } : null;
  }

  function find(categorySlug, productSlug) {
    return match(categorySlug, productSlug)?.entry || null;
  }

  /**
   * Published copy plus the canonical path of the page it is shown on.
   * canonicalPath is ALWAYS built from the requested (live) slugs, never from
   * entry.catalog.path: when the backoffice moves a product to another
   * category, the old URL 308-redirects, the page renders under the new
   * category and the slug fallback finds the copy (matchedBy 'productSlug',
   * staleCatalogPath true). Canonical/hreflang must then point to that live
   * 308 target, not to the URL stored in de.json.
   */
  function resolve(categorySlug, productSlug, requestedLocale) {
    if (requestedLocale !== locale) return null;
    const hit = match(categorySlug, productSlug);
    if (!hit) return null;
    const copy = publishedCopy(hit.entry);
    if (!copy) return null;
    const canonicalPath = `/produkte/${categorySlug}/${productSlug}`;
    return Object.freeze({
      copy,
      matchedBy: hit.matchedBy,
      canonicalPath,
      staleCatalogPath: hit.entry.catalog?.path !== canonicalPath,
    });
  }

  return Object.freeze({
    locale,
    /** Published view: only for the store's locale and only approved (text-hash) fields. */
    get(categorySlug, productSlug, requestedLocale) {
      return resolve(categorySlug, productSlug, requestedLocale)?.copy || null;
    },
    resolve,
    /** Draft access (preview, tests): ignores approved. Without arguments: all entries. */
    draft(categorySlug, productSlug) {
      if (categorySlug === undefined && productSlug === undefined) return entries;
      return find(categorySlug, productSlug);
    },
    keys() {
      return [...byKey.keys()];
    },
  });
}

/**
 * schema.org FAQPage for the product page.
 * MANDATORY: pass { faqVisible: true } only if the same questions and answers
 * are rendered visibly on this page (Google structured-data policy: markup
 * must match visible content). Without it, or for an unapproved entry, the
 * function returns null, so hidden FAQ markup cannot be emitted by accident.
 */
export function buildFaqJsonLd(copy, pageUrl, { faqVisible = false } = {}) {
  if (faqVisible !== true || !isPublishedCopy(copy)) return null;
  const faq = Array.isArray(copy?.faq) ? copy.faq.filter((f) => f?.question && f?.answer) : [];
  if (!faq.length) return null;
  return {
    "@type": "FAQPage",
    ...(pageUrl ? { "@id": `${pageUrl}#faq` } : {}),
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/**
 * Title/description override for generateMetadata. Returns only the fields
 * the entry actually has; the caller keeps its backoffice values otherwise.
 * Never returns alternates/canonical: those come from the live route params
 * (resolve().canonicalPath), never from the data file.
 */
export function metadataOverride(copy) {
  if (!isPublishedCopy(copy) || !copy.meta) return {};
  const out = {};
  if (copy.meta?.title) out.title = copy.meta.title;
  if (copy.meta?.description) out.description = copy.meta.description;
  return out;
}
