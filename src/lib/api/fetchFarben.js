// src/lib/api/fetchFarben.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

// Color options (with hex swatch) for the /produkte/[category] filter
// panel (Frappe doctype Produkte Farbe).
export async function fetchFarben() {
  const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_farbe.api.get_all_farben_api`;

  try {
    const response = await backofficeFetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["farben"] },
    });

    if (!response.ok) {
      console.error(`Farben API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error("Error fetching Farben:", error);
    return [];
  }
}

const NAME_FIELD_BY_LOCALE = { de: "name_de", en: "name_en", fr: "name_fr", it: "name_it" };

export function getFarbeLabel(farbe, locale = "de") {
  if (!farbe) return "";
  return farbe[NAME_FIELD_BY_LOCALE[locale] || NAME_FIELD_BY_LOCALE.de] || farbe.name_de || farbe.color_key || "";
}

// {value, label, hex} filter options, ready for ShopCatalog's color filter group.
export function getFarbenOptions(farben, locale = "de") {
  return (farben || [])
    .map((row) => ({ value: row.color_key, label: getFarbeLabel(row, locale), hex: row.hex_code }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
