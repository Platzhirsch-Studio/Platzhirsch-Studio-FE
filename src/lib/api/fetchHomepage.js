import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchHomepage() {
    try {
        const response = await fetch(`${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.homepage.api.homepage_data`, {
            next: { revalidate: 3600 }, // 3600 seconds = 1 hour
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error("Fehler beim Abrufen der News Daten");
        }

        const data = await response.json();

        return data.message;
    } catch (error) {
        console.error("Fehler beim Abrufen der News Daten:", error);
        return [];
    }
}