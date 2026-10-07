import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchNewsData() {
    try {
        const response = await fetch(`${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data`, {
            next: { revalidate: 3600, tags:["news"] }, // 3600 seconds = 1 hour
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


export async function fetchSlicedNewsData() {
    try {
        const response = await fetch(`${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data`, {
            // Tagged so /revalidate/news also refreshes the home page news block.
            next: { revalidate: 3600, tags: ["news"] },
        });

        if (!response.ok) {
            throw new Error("Fehler beim Abrufen der News Daten");
        }

        const data = await response.json();

        const formattedPosts = data.message
            .filter((post) => post.status === "Aktiv")
            .sort((a, b) => new Date(b.daten) - new Date(a.daten))
            .slice(0, 3);

        if (formattedPosts.length > 0) {
            formattedPosts[0].featured = true;
        }

        return formattedPosts;
    } catch (error) {
        console.error("Fehler beim Abrufen der News Daten:", error);
        return [];
    }
}