// src/lib/shop/shopProducts.js
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
    name: p.produkt_name,
    brand: p.marken,
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
  return (rawProducts || [])
    .filter((p) => p?.status === "Aktiv" && p?.path_field && p?.kategories)
    .map(toShopProduct)
    .filter((p) => p.categoryKey);
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

// CMS rich-text fields come through with literal tab runs (copy/pasted from
// Word) and inconsistent blank-line spacing — collapse both before splitting
// into paragraphs for display.
function toParagraphs(text) {
  return (text || "")
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

  const descriptionParagraphs = [
    ...toParagraphs(localizedField(detail, "beschreibung", locale)),
    ...toParagraphs(localizedField(detail, "mehr_beschreibung", locale)),
  ];

  const infoRow = (detail.additional_information || [])[0] || null;

  return {
    id: detail.name,
    name: detail.produkt_name,
    brand: detail.marken,
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
