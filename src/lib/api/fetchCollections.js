// src/lib/api/fetchCollections.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

// Collections of one brand (Produkte New doctype): [{ name, produkt_count, image }].
// `image` is a "/files/..." path on NEW_API_SERVER — render it via the /cmx proxy.
// Used by the brand story page (/ueber-uns/marken/[title]) for "Ausgewählte Produkte".
export async function fetchCollectionsByMarke(markenName) {
  if (!markenName) return [];

  const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_collections?marken=${encodeURIComponent(markenName)}`;

  try {
    const response = await backofficeFetch(API_URL, {
      method: "GET",
      next: { revalidate: 3600, tags: ["collections"] },
    });

    if (!response.ok) {
      console.error(`Collections API returned ${response.status} for "${markenName}"`);
      return [];
    }

    const data = await response.json();
    return data.message || [];
  } catch (error) {
    console.error(`Error fetching Collections for Marke "${markenName}":`, error);
    return [];
  }
}
