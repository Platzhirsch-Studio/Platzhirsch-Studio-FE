// src/lib/api/pressKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

const PRESS_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.press_keywords.api.press_keywords_data`;

export async function fetchPressKeywords() {
  try {
    const response = await backofficeFetch(PRESS_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Press Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching press keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedPressMetadata(pressData, locale) {
  if (!pressData) return null;

  const metaTabs = {
    de: {
      ...pressData.metadata_de_tab,
      keywords: pressData.metadata_de_tab?.keywords || "",
      locale: pressData.metadata_de_tab?.metadata_locale_de,
      sitename: pressData.metadata_de_tab?.metadata_sitename_de,
      type: pressData.metadata_de_tab?.metadata_type_de,
      title: pressData.metadata_de_tab?.metadata_title_de,
      description: pressData.metadata_de_tab?.metadata_description_de,
      url: pressData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...pressData.metadata_en_tab,
      keywords: pressData.metadata_en_tab?.keywords || "",
      locale: pressData.metadata_en_tab?.metadata_local_en,
      sitename: pressData.metadata_en_tab?.metadata_sitename_en,
      type: pressData.metadata_en_tab?.metadata_type_en,
      title: pressData.metadata_en_tab?.metadata_title_en,
      description: pressData.metadata_en_tab?.metadata_description_en,
      url: pressData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...pressData.metadata_it_tab,
      keywords: pressData.metadata_it_tab?.keywords || "",
      locale: pressData.metadata_it_tab?.metadata_locale_it,
      sitename: pressData.metadata_it_tab?.metadata_sitename_it,
      type: pressData.metadata_it_tab?.metadata_type_it,
      title: pressData.metadata_it_tab?.metadata_title_it,
      description: pressData.metadata_it_tab?.metadata_description_it,
      url: pressData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...pressData.metadata_fr_tab,
      keywords: pressData.metadata_fr_tab?.keywords || "",
      locale: pressData.metadata_fr_tab?.metadata_local_fr,
      sitename: pressData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: pressData.metadata_fr_tab?.metadata_type_fr,
      title: pressData.metadata_fr_tab?.metadata_title_fr,
      description: pressData.metadata_fr_tab?.metadata_description_fr,
      url: pressData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getPressOGImage(pressData) {
  if (!pressData) return null;
  
  return pressData.images_table?.[0]?.bild_anhagen
    ? `/cms${pressData.images_table[0].bild_anhagen}`
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