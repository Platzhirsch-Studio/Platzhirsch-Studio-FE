// src/lib/api/productApi.js
import "server-only";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchProductByPathField(path_field, locale = "de") {
  try {
    const response = await fetch(
      `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.get_produkt_by_path_field_api`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path_field, lang: locale }),
        next: { revalidate: 3600, tags: ["products"] },
      }
    );

    if (!response.ok) {
      console.error(`Product API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function fetchAllProducts() {
  try {
    const response = await fetch(
      `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.produkte_data_short_list`,
      {
        method: "GET",
        next: { revalidate: 3600, tags: ["products"] },
      }
    );

    if (!response.ok) {
      console.error(`Products API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Filter only active products and map to the required format
    return (data.message || [])
      .filter((item) => item.status === "Aktiv")
      .map((item) => ({
        marken: item.marken,
        path_field: item.path_field,
        produkt_name: item.produkt_name, // Optional: include if needed elsewhere
        name: item.name, // Optional: include if needed elsewhere
      }));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}