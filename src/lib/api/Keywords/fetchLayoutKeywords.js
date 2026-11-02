import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";


export async function fetchLayoutData() {
    const LAYOUT_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.layout_keywords.api.layout_keywords_data`;

    try {
        const res = await backofficeFetch(LAYOUT_API_URL, {
            method: "GET",
            cache: "force-cache",
            next: { revalidate: 3600 }, // Revalidate every hour
            // 2 x 7 s inside a 15 s budget: a retry, but never longer than the old single 15 s limit.
            timeoutMs: 7000,
            budgetMs: 15000,
        });

        if (!res.ok) {
            console.error(`Layout API returned ${res.status}`);
            return null;
        }

        const data = await res.json();
        return data.message;
    } catch (error) {
        console.error("Error fetching layout data:", error);
        return null;
    }
}