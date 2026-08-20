// src/lib/api/relatedProductsApi.js
import "server-only";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchRelatedProducts(marken, kategories, currentProductPath) {
  try {
    // Validate required parameters
    if (!marken || !kategories || !currentProductPath) {
      console.warn("Missing required parameters for related products:", {
        marken: !!marken,
        kategories: !!kategories,
        currentProductPath: !!currentProductPath
      });
      return [];
    }

    // Build query parameters (matching the backend parameter names)
    const params = new URLSearchParams({
      marken: marken,
      kategories: kategories,
      currentProductPath: currentProductPath,
      limit: "4"  // Backend expects string, it will convert to int
    });

    const response = await fetch(
      `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.related_products?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        next: { revalidate: 3600, tags: ["products"] },
      }
    );

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Related Products API returned ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If response is not JSON, try text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (e2) { }
      }
      console.error(errorMessage);
      return [];
    }

    const data = await response.json();

    // The backend returns an array directly (not wrapped in .message)
    const products = Array.isArray(data) ? data : (Array.isArray(data?.message) ? data.message : []);

    return products;
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}