// src/lib/api/markenApi.js
import "server-only";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";

// Base fetch function (private - not exported)
export async function fetchRawMarkenData() {
  const response = await fetch(`${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.marken.api.marken_data`, {
    next: { revalidate: 3600, tags: ["marken"] },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error("Fehler beim Abrufen der Marken Daten");
  }

  const data = await response.json();
  return data.message || [];
}

// Get marken by name/slug
export async function getMarkenByName(name) {
  try {
    const marken = await fetchRawMarkenData();
    return marken.find((marke) =>
      marke.name1?.toLowerCase() === name?.toLowerCase() ||
      marke.name1?.toLowerCase().replace(/\s+/g, '-') === name?.toLowerCase()
    ) || null;
  } catch (error) {
    console.error("Error fetching marken by name:", error);
    return null;
  }
}

// Get active marken (filtered by status)
export async function getActiveMarken() {
  try {
    const marken = await fetchRawMarkenData();
    return marken.filter((marke) => marke.status === "Aktiv");
  } catch (error) {
    console.error("Error fetching active marken:", error);
    return [];
  }
}

// Default export - for simple marken display (logos only)
export default async function fetchMarkenData() {
  try {
    const marken = await fetchRawMarkenData();

    return marken
      .filter((marke) => marke.status === "Aktiv")
      .slice()
      .reverse()
      .map((marke) => ({
        title: marke.name1,
        images: marke.logo,
        status: marke.status,
      }));
  } catch (error) {
    console.error("Fehler beim Abrufen der Marken Daten:", error);
    return [];
  }
}

// For products page - includes full product data with multi-language support
export async function fetchMarkenWithProducts() {
  try {
    const marken = await fetchRawMarkenData();

    return marken
      .filter((item) =>
        item.status === "Aktiv" &&
        (item.es_gibt_produkte === 1 || item.es_gibt_produkte === "1")
      )
      .map((item) => ({
        title: item.name1,
        description: item.produkte,
        produkte: item.produkte,
        produkte_en: item.produkte_en,
        produkte_fr: item.produkte_fr,
        produkte_it: item.produkte_it,
        image: item.bild_anhagen,
        status: item.status,
      }));
  } catch (error) {
    console.error("Error fetching marken with products:", error);
    return [];
  }
}

// Get single marke with full data by name (for products page)
export async function getMarkeWithProductsByName(markenName) {
  try {

    const marken = await fetchRawMarkenData();
    const marke = marken.find((m) =>
      m.name1 === markenName ||
      m.name1?.replace(/\s+/g, '-') === markenName
    );

    if (!marke || marke.status !== "Aktiv") {
      return null;
    }

    return {
      ...marke,
      hasProducts: marke.es_gibt_produkte === 1 || marke.es_gibt_produkte === "1",
    };
  } catch (error) {
    console.error("Error fetching marke with products by name:", error);
    return null;
  }
}