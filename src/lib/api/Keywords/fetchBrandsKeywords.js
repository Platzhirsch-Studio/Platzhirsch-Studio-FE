// src/lib/api/brandsKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

const BRANDS_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.brands_keywords.api.brand_keywords_data`;

export async function fetchBrandsKeywords() {
  try {
    const response = await fetch(BRANDS_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Brands Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching brands keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedBrandsMetadata(brandsData, locale) {
  if (!brandsData) return null;

  const metaTabs = {
    de: {
      ...brandsData.metadata_de_tab,
      keywords: brandsData.metadata_de_tab?.keywords || "",
      locale: brandsData.metadata_de_tab?.metadata_locale_de,
      sitename: brandsData.metadata_de_tab?.metadata_sitename_de,
      type: brandsData.metadata_de_tab?.metadata_type_de,
      title: brandsData.metadata_de_tab?.metadata_title_de,
      description: brandsData.metadata_de_tab?.metadata_description_de,
      url: brandsData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...brandsData.metadata_en_tab,
      keywords: brandsData.metadata_en_tab?.keywords || "",
      locale: brandsData.metadata_en_tab?.metadata_local_en,
      sitename: brandsData.metadata_en_tab?.metadata_sitename_en,
      type: brandsData.metadata_en_tab?.metadata_type_en,
      title: brandsData.metadata_en_tab?.metadata_title_en,
      description: brandsData.metadata_en_tab?.metadata_description_en,
      url: brandsData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...brandsData.metadata_it_tab,
      keywords: brandsData.metadata_it_tab?.keywords || "",
      locale: brandsData.metadata_it_tab?.metadata_locale_it,
      sitename: brandsData.metadata_it_tab?.metadata_sitename_it,
      type: brandsData.metadata_it_tab?.metadata_type_it,
      title: brandsData.metadata_it_tab?.metadata_title_it,
      description: brandsData.metadata_it_tab?.metadata_description_it,
      url: brandsData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...brandsData.metadata_fr_tab,
      keywords: brandsData.metadata_fr_tab?.keywords || "",
      locale: brandsData.metadata_fr_tab?.metadata_local_fr,
      sitename: brandsData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: brandsData.metadata_fr_tab?.metadata_type_fr,
      title: brandsData.metadata_fr_tab?.metadata_title_fr,
      description: brandsData.metadata_fr_tab?.metadata_description_fr,
      url: brandsData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getBrandsOGImage(brandsData) {
  if (!brandsData) return null;
  
  return brandsData.images_table?.[0]?.bild_anhagen
    ? `/cms${brandsData.images_table[0].bild_anhagen}`
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