// src/lib/shop/shopProducts.js
import { cleanProductName, displayBrandName } from "@/lib/content/brands";
import { dedupeShopProducts } from "./dedupe.js";
// Turns the raw Produkte New card rows (fetchProdukteByKategorie(),
// searchProdukte()) into the shape the /produkte category-listing page and
// the navbar search need — replaces the
// static STATIC_SHOP_PRODUCTS demo catalog (src/lib/data/staticShopProducts.js).
//
// Unlike the old Produkte doctype (kategories = "{Category}-{Brand}" text),
// Produkte New's `kategories` is a Link straight to Produkte Kategorie — its
// value already IS the categoryKey, no brand-suffix stripping needed.

// `farbe`/`material`/`sub_kategorie` are Table MultiSelect fields (a product
// can have several of each) — each row links to the target doctype, but the
// exact child-row fieldname isn't verified yet (same situation `kategorie`
// on Sub Kategorie was in before testing). Tries the field's own name first
// (Frappe's usual convention), then falls back to the row's own `name`.
function extractLinkKeys(rows, fieldName) {
  return (rows || [])
    .map((row) => row?.[fieldName] || row?.name)
    .filter(Boolean);
}

function toShopProduct(p) {
  const categoryKey = (p.kategories || "").toLowerCase();
  const firstImage = p.bild_anhangen?.[0]?.bild_anhangen;
  return {
    id: p.name,
    name: cleanProductName(p.produkt_name),
    brand: displayBrandName(p.marken),
    categoryKey,
    indoorOutdoor: p.indoor_and_outdoor,
    image: firstImage ? `/cmx${firstImage}` : null,
    url_slug: p.path_field,
    // Plain Link field (unlike farbe/material/sub_kategorie below), so this
    // one is real data straight from the bulk fetch, no per-product fetch needed.
    designer: p.designer || null,
    // All three are Table MultiSelect fields, batch-fetched by the backend
    // into flat key arrays (empty when a product isn't tagged yet — filter
    // options still show, just with 0 matches).
    subCategoryKeys: p.subCategoryKeys || [],
    colorKeys: p.colorKeys || [],
    materialKeys: p.materialKeys || [],
  };
}

// Active, category-bearing products only — a product with no `kategories`
// value can't be placed in the /produkte taxonomy at all.
export function buildShopProducts(rawProducts) {
  return dedupeShopProducts(
    (rawProducts || [])
      .filter((p) => p?.status === "Aktiv" && p?.path_field && p?.kategories)
      .map(toShopProduct)
      .filter((p) => p.categoryKey)
  );
}

// Picks the locale-specific variant of a beschreibung/mehr_beschreibung/
// metadata_description field (`${baseKey}_${locale}`), falling back to the
// base (German) field when the translation column is empty — same rule the
// old "Produkte" detail page uses for its CMS text fields.
function localizedField(detail, baseKey, locale) {
  if (locale && locale !== "de") {
    const localized = detail?.[`${baseKey}_${locale}`];
    if (typeof localized === "string" && localized.trim()) return localized.trim();
  }
  return (detail?.[baseKey] || "").trim();
}

// CMS rich text is rendered with dangerouslySetInnerHTML on the product and
// collection pages, so it is reduced to a small allowlist here, on the server:
// script/style/iframe/object/embed/svg blocks are dropped, unknown tags are
// stripped (their text stays), event handlers and javascript: URLs are
// removed, and links get rel="noopener". CMS editors are trusted, but one
// compromised backoffice account must not become site-wide XSS.
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span", "h3", "h4"]);
// Expertenrat security P0: the tag rewrite alone left an unclosed tag such as
// `<img src=x onerror=…` untouched (no `>`), and React's closing `</div>`
// completed it in the SSR HTML. Every tag the sanitizer emits is therefore
// parked as a placeholder, all remaining `<`/`>` are escaped, and only then
// the emitted tags are put back.
export function sanitizeCmsHtml(html) {
  let out = String(html || "").replace(/\u0000/g, "");
  const emitted = [];
  const park = (tag) => `\u0000${emitted.push(tag) - 1}\u0000`;
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<(script|style|iframe|object|embed|svg|math|form|textarea|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<(script|style|iframe|object|embed|svg|math|form|textarea|template|noscript)\b[^>]*>/gi, "");
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g, (match, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return park(`</${tag}>`);
    if (tag !== "a") return park(`<${tag}>`);
    const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs || "");
    const url = (href && (href[1] ?? href[2] ?? href[3]) || "").trim();
    // `/\evil.com` is normalised to `//evil.com` by browsers, so a backslash
    // after the leading slash is rejected like a second slash.
    const safe = /^(https?:\/\/|mailto:|tel:|\/(?![\/\\])|#)/i.test(url)
      ? url.replace(/"/g, "%22").replace(/</g, "%3C").replace(/>/g, "%3E")
      : null;
    return park(safe ? `<a href="${safe}" rel="noopener">` : "<a>");
  });
  out = out.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => emitted[Number(i)]);
}

// CMS rich-text fields come through with literal tab runs (copy/pasted from
// Word) and inconsistent blank-line spacing — collapse both before splitting
// into paragraphs for display.
function toParagraphs(text) {
  return sanitizeCmsHtml(text)
    .replace(/[ \t]+/g, " ")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Maps the raw response of fetchProduktNewByPathField() (the per-product
// detail API) into the shape the shop product-detail page renders. `listEntry`
// is optional: this product's row from buildShopProducts(), only used as a
// fallback for `designer`/`categoryKey` when the detail endpoint lacks them.
export function toShopProductDetail(detail, locale, listEntry) {
  if (!detail) return null;

  const images = (detail.bild_anhangen || [])
    .map((row) => row?.bild_anhangen)
    .filter(Boolean)
    .map((path) => `/cmx${path}`);

  // The CMS often holds the same manufacturer text twice (beschreibung = the
  // rewritten version, mehr_beschreibung = the original) — rendered side by
  // side that is self-duplicated content. Paragraphs of the second field that
  // largely repeat the first are dropped.
  const first = toParagraphs(localizedField(detail, "beschreibung", locale));
  const firstWords = new Set(first.join(" ").toLowerCase().replace(/<[^>]*>/g, " ").split(/\W+/).filter((w) => w.length > 3));
  const second = toParagraphs(localizedField(detail, "mehr_beschreibung", locale)).filter((p) => {
    const words = p.toLowerCase().replace(/<[^>]*>/g, " ").split(/\W+/).filter((w) => w.length > 3);
    if (!words.length || !firstWords.size) return true;
    const shared = words.filter((w) => firstWords.has(w)).length / words.length;
    return shared < 0.6;
  });
  const descriptionParagraphs = [...first, ...second];

  const infoRow = (detail.additional_information || [])[0] || null;

  return {
    id: detail.name,
    name: cleanProductName(detail.produkt_name),
    brand: displayBrandName(detail.marken),
    designer: detail.designer || listEntry?.designer || null,
    categoryKey: (detail.kategories || listEntry?.categoryKey || "").toLowerCase(),
    images,
    descriptionParagraphs,
    dimensionsRaw: infoRow?.dimensions || null,
    materialRaw: infoRow?.material || null,
    colorRaw: infoRow?.farbe || null,
    weightRaw: infoRow?.gewicht || null,
  };
}

// R6-produkt-perf: the category catalogue hands every product of the
// category to the client (filters and counts need them all; 334 on
// /produkte/lamps). Empty fields (null, "", []) are left out of that payload –
// the catalogue reads all of them with a fallback (`|| []`, falsy checks).
export function compactShopProduct(p) {
  const out = {};
  for (const [key, value] of Object.entries(p || {})) {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    out[key] = value;
  }
  return out;
}
