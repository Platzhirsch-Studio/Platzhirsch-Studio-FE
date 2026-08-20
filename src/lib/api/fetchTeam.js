import { API_BASE_URL } from "@/lib/apiBaseUrl";

export async function fetchTeamData() {
  try {
    const response = await fetch(`${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.team_platzhirsch.api.team_platzhirsch_data`, {
      next: { revalidate: 3600, tags: ["team"] }, // 3600 seconds = 1 hour
    });

    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Team Daten");
    }

    const data = await response.json();

    return data.message
      .filter((member) => member.status === "Aktiv")
      .slice()
      .reverse()
      .map((member) => ({
        title: member.name1,
        role: member.positionsart,
        image: member.bild_anhagen,
        email: member.e_mail,
        status: member.status,
      }));

  } catch (error) {
    console.error("Fehler beim Abrufen der Team Daten:", error);
    return [];
  }
}
