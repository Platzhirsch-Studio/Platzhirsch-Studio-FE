// src/lib/api/trendingProductsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchProdukteData({ marken }) {
    try {

        const newAPi = await fetch(`${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.get_produkte_by_marke_api`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marken: marken }),
            next: { revalidate: 3600, tags: ["products"] }
        })


        const newApiData = await newAPi.json();

        return newApiData.message;
    } catch (error) {
        console.error("Fehler beim Abrufen der Produkte Daten:", error);
        return [];
    }
}

