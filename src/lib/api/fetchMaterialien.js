// src/lib/api/fetchMaterialien.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";

// Material options for the /produkte/[category] filter panel. See
// frappe-integration/platzhirsch_studio/doctype/produkte_material.
export async function fetchMaterialien() {
  const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_material.api.get_all_materialien_api`;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["materialien"] },
    });

    if (!response.ok) {
      console.error(`Materialien API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error("Error fetching Materialien:", error);
    return [];
  }
}

const NAME_FIELD_BY_LOCALE = { de: "name_de", en: "name_en", fr: "name_fr", it: "name_it" };

export function getMaterialLabel(material, locale = "de") {
  if (!material) return "";
  return material[NAME_FIELD_BY_LOCALE[locale] || NAME_FIELD_BY_LOCALE.de] || material.name_de || material.material_key || "";
}

// {value, label} filter options, ready for ShopCatalog's material filter group.
export function getMaterialienOptions(materialien, locale = "de") {
  return (materialien || [])
    .map((row) => ({ value: row.material_key, label: getMaterialLabel(row, locale) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
