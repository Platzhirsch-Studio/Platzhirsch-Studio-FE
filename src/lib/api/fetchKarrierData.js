import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { generateSlug } from "../slugify";

export async function fetchKarriereData() {
  try {
    const response = await fetch(
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