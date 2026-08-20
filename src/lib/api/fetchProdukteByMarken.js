// src/lib/api/trendingProductsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchProdukte(marken = "Minotti") {
  const API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.get_produkte_by_marke_api?marken=${marken}`;
  
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["products"] }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}