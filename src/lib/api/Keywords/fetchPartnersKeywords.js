// src/lib/api/partnersKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

const PARTNERS_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.partners_keywords.api.partners_keywords_data`;

export async function fetchPartnersKeywords() {
  try {
    const response = await backofficeFetch(PARTNERS_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Partners Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching partners keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedPartnersMetadata(partnersData, locale) {
  if (!partnersData) return null;

  const metaTabs = {
    de: {
      ...partnersData.metadata_de_tab,
      keywords: partnersData.metadata_de_tab?.keywords || "",
      locale: partnersData.metadata_de_tab?.metadata_locale_de,
      sitename: partnersData.metadata_de_tab?.metadata_sitename_de,
      type: partnersData.metadata_de_tab?.metadata_type_de,
      title: partnersData.metadata_de_tab?.metadata_title_de,
      description: partnersData.metadata_de_tab?.metadata_description_de,
      url: partnersData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...partnersData.metadata_en_tab,
      keywords: partnersData.metadata_en_tab?.keywords || "",
      locale: partnersData.metadata_en_tab?.metadata_local_en,
      sitename: partnersData.metadata_en_tab?.metadata_sitename_en,
      type: partnersData.metadata_en_tab?.metadata_type_en,
      title: partnersData.metadata_en_tab?.metadata_title_en,
      description: partnersData.metadata_en_tab?.metadata_description_en,
      url: partnersData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...partnersData.metadata_it_tab,
      keywords: partnersData.metadata_it_tab?.keywords || "",
      locale: partnersData.metadata_it_tab?.metadata_locale_it,
      sitename: partnersData.metadata_it_tab?.metadata_sitename_it,
      type: partnersData.metadata_it_tab?.metadata_type_it,
      title: partnersData.metadata_it_tab?.metadata_title_it,
      description: partnersData.metadata_it_tab?.metadata_description_it,
      url: partnersData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...partnersData.metadata_fr_tab,
      keywords: partnersData.metadata_fr_tab?.keywords || "",
      locale: partnersData.metadata_fr_tab?.metadata_local_fr,
      sitename: partnersData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: partnersData.metadata_fr_tab?.metadata_type_fr,
      title: partnersData.metadata_fr_tab?.metadata_title_fr,
      description: partnersData.metadata_fr_tab?.metadata_description_fr,
      url: partnersData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getPartnersOGImage(partnersData) {
  if (!partnersData) return null;
  
  return partnersData.images_table?.[0]?.bild_anhagen
    ? `/cms${partnersData.images_table[0].bild_anhagen}`
    : null;
}

// Helper function to validate OpenGraph type
export function validateOGType(type) {
  const validOGTypes = [
    "website",
    "article",
    "book",
    "profile",
    "video.movie",
    "video.episode",
    "video.tv_show",
    "video.other",
    "music.song",
    "music.album",
    "music.playlist",
    "music.radio_station",
  ];
  return validOGTypes.includes(type) ? type : "website";
}

// Helper function to parse keywords
export function parseKeywords(keywordsString) {
  if (!keywordsString) return [];
  return keywordsString.split(",").map(k => k.trim());
}