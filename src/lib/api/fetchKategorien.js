// src/lib/api/fetchKategorien.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";

// CMS-managed category tiles (Produkte Kategorie doctype) for the
// /produkte hub. See
// frappe-integration/platzhirsch_studio/doctype/produkte_kategorie — replaces
// the static CATEGORY_I18N map + getShopCategories() tile image with real
// data. Not yet deployed to the production SERVER, so this calls
// NEW_API_BASE_URL instead (see src/lib/apiBaseUrl.js).
export async function fetchKategorien() {
  const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_kategorie.api.get_all_kategorien_api`;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["kategorien"] },
    });

    if (!response.ok) {
      console.error(`Kategorien API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error("Error fetching Kategorien data:", error);
    return [];
  }
}

const PRODUKTE_NEW_API = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api`;

// One representative product image per category for a brand: the first gallery
// image of the brand's most recently modified active product in that category
// that has one. Returns a Map(kategories -> "/files/...").
async function fetchProductImageByKategorie(markenName) {
  try {
    const response = await fetch(
      `${PRODUKTE_NEW_API}.get_produkte_by_marke_api?marken=${encodeURIComponent(markenName)}`,
      { method: "GET", next: { revalidate: 3600, tags: ["products", "kategorien"] } }
    );

    if (!response.ok) {
      console.error(`Produkte-by-Marke API returned ${response.status} for "${markenName}"`);
      return new Map();
    }

    const data = await response.json();
    const products = (data.message || [])
      .filter((p) => p.status === "Aktiv" && p.kategories)
      .sort((a, b) => String(b.modified).localeCompare(String(a.modified)));

    const imageByKategorie = new Map();
    for (const p of products) {
      const image = p.bild_anhangen?.[0]?.bild_anhangen;
      if (image && !imageByKategorie.has(p.kategories)) imageByKategorie.set(p.kategories, image);
    }
    return imageByKategorie;
  } catch (error) {
    console.error(`Error fetching product images for Marke "${markenName}":`, error);
    return new Map();
  }
}

// Categories that actually have products for one brand (Produkte New doctype),
// incl. `produkt_count`, plus `product_image`: an image of one of that brand's
// products in the category (or null) — the category's own `image` is shared by
// every brand and often empty. Used by the brand story page
// (/ueber-uns/marken/[title]).
export async function fetchKategorienByMarke(markenName) {
  if (!markenName) return [];

  try {
    const [response, imageByKategorie] = await Promise.all([
      fetch(`${PRODUKTE_NEW_API}.get_kategorien_by_marke?marken=${encodeURIComponent(markenName)}`, {
        method: "GET",
        next: { revalidate: 3600, tags: ["kategorien"] },
      }),
      fetchProductImageByKategorie(markenName),
    ]);

    if (!response.ok) {
      console.error(`Kategorien-by-Marke API returned ${response.status} for "${markenName}"`);
      return [];
    }

    const data = await response.json();
    return (data.message || []).map((k) => ({
      ...k,
      product_image: imageByKategorie.get(k.name) || imageByKategorie.get(k.category_key) || null,
    }));
  } catch (error) {
    console.error(`Error fetching Kategorien for Marke "${markenName}":`, error);
    return [];
  }
}

// Just get_kategorien_by_marke (no extra product-image request): the
// categories a brand has active products in, with `produkt_count` and
// `image` (a /files path of one of that brand's products — serve via /cmx).
// Used by the navbar search ("Minotti" → Minotti's categories).
export async function fetchMarkeKategorien(markenName) {
  if (!markenName) return [];
  try {
    const response = await fetch(
      `${PRODUKTE_NEW_API}.get_kategorien_by_marke?marken=${encodeURIComponent(markenName)}`,
      { method: "GET", next: { revalidate: 3600, tags: ["kategorien"] } }
    );
    if (!response.ok) {
      console.error(`Kategorien-by-Marke API returned ${response.status} for "${markenName}"`);
      return [];
    }
    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error(`Error fetching Kategorien for Marke "${markenName}":`, error);
    return [];
  }
}

const NAME_FIELD_BY_LOCALE ={ de: "name_de", en: "name_en", fr: "name_fr", it: "name_it" };
const ALT_FIELD_BY_LOCALE = { de: "alt_text_de", en: "alt_text_en", fr: "alt_text_fr", it: "alt_text_it" };

export function getKategorieLabel(kategorie, locale = "de") {
  if (!kategorie) return "";
  return kategorie[NAME_FIELD_BY_LOCALE[locale] || NAME_FIELD_BY_LOCALE.de] || kategorie.name_de || "";
}

export function getKategorieAlt(kategorie, locale = "de") {
  if (!kategorie) return "";
  return kategorie[ALT_FIELD_BY_LOCALE[locale] || ALT_FIELD_BY_LOCALE.de] || getKategorieLabel(kategorie, locale);
}

// name/alt override + CMS image (falling back to the locally derived image) for
// one categoryKey, keyed for O(1) lookup while building the shop-hub tile list.
export function indexKategorienByKey(kategorien) {
  return new Map((kategorien || []).map((k) => [k.category_key, k]));
}
