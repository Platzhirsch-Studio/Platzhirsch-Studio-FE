// src/lib/api/dimensionsApi.js
import "server-only";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { generateSlug } from "@/lib/slugify";


export async function fetchProductDimensions({ name, produkt_name, path_field }) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (produkt_name) params.append('produkt_name', produkt_name);
    if (path_field) params.append('path_field', path_field);

    const response = await fetch(
      `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.product_dimensions_data?${params.toString()}`,
      {
        method: "GET",
        next: { revalidate: 3600, tags: ["products"] },
      }
    );

    if (!response.ok) {
      console.error(`Product Dimensions Data API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // The API returns dimensions array directly
    const dimensions = Array.isArray(data) ? data : (Array.isArray(data?.message) ? data.message : []);

    return dimensions;
  } catch (error) {
    console.error("Error fetching product dimensions data:", error);
    return [];
  }
}

// Fetch all products for sitemap
export async function fetchAllProductsForSitemap() {
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
    const products = Array.isArray(data?.message) ? data.message : [];

    // Filter only active products
    const activeProducts = products.filter(
      (product) =>
        product.status === "Aktiv" &&
        product.marken &&
        product.path_field
    );

    return activeProducts.map((product) => ({
      marken: product.marken,
      markenSlug: generateSlug(product.marken),
      path_field: product.path_field,
      status: product.status,
      modified: product.modified, // If this field exists in your new response
    }));
  } catch (error) {
    console.error("Error fetching all products for sitemap:", error);
    return [];
  }
}