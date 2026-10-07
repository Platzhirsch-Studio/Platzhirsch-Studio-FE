// src/lib/api/fetchSubKategorien.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";

// Subcategory options (e.g. Chandeliers -> wall-mounted/ceiling-mounted/
// floor-standing) for the /produkte/[category] filter panel. See
// frappe-integration/platzhirsch_studio/doctype/sub_kategorie — text-only
// (no image), each row scoped to its parent Produkte Kategorie via
// `kategorie`. Not yet deployed to the production SERVER, so this calls
// NEW_API_BASE_URL instead (see src/lib/apiBaseUrl.js), same as fetchKategorien.js.
export async function fetchSubKategorien() {
  const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.sub_kategorie.api.get_all_sub_kategorien_api`;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["sub-kategorien"] },
    });

    if (!response.ok) {
      console.error(`Sub Kategorien API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error("Error fetching Sub Kategorien:", error);
    return [];
  }
}

const NAME_FIELD_BY_LOCALE = { de: "name_de", en: "name_en", fr: "name_fr", it: "name_it" };

export function getSubKategorieLabel(subKategorie, locale = "de") {
  if (!subKategorie) return "";
  return subKategorie[NAME_FIELD_BY_LOCALE[locale] || NAME_FIELD_BY_LOCALE.de] || subKategorie.name_de || subKategorie.category_key || "";
}

// Sub Kategorie rows belonging to one parent categoryKey, as {value, label}
// filter options — ready for ShopCatalog's subCategory filter group.
export function getSubKategorienForCategory(subKategorien, categoryKey, locale = "de") {
  return (subKategorien || [])
    .filter((row) => row.kategorie === categoryKey)
    .map((row) => ({ value: row.category_key, label: getSubKategorieLabel(row, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
