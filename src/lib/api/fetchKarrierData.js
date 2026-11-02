import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";
import { mergeStellen } from "@/lib/karriere/stellen";
import { generateSlug } from "../slugify";

// Backoffice-Stellen (Doctype „Karriere“) plus die statischen Stellen aus
// src/lib/karriere/stellen.js (Inhaber-Auftrag 31.10.2026). Gleicher Slug →
// die Backoffice-Stelle gewinnt; ohne Backoffice-Antwort nur die statischen.
// Ob eine Stelle öffentlich erscheint, entscheidet src/components/Karriere/glbg.js.
async function fetchBackofficeKarriere() {
  try {
    const response = await backofficeFetch(
      `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.karriere.api.karriere_data`,
      {
        next: { revalidate: 3600, tags: ["career"] },
      }
    );

    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Karriere Daten");
    }

    const data = await response.json();

    const activeEntries = data.message.filter(
      (member) => member.status === "Aktiv"
    );

    return activeEntries.map((member, index) => ({
      ...member, // keep everything exactly as returned by the API
      id: index,
      slug: generateSlug(member.title),
    }));
  } catch (error) {
    console.error("Fehler beim Abrufen der Karriere-Daten:", error);
    return [];
  }
}

export async function fetchKarriereData() {
  return mergeStellen(await fetchBackofficeKarriere());
}
