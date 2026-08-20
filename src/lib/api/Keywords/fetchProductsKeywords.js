// src/lib/api/productsKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

const PRODUCTS_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.products_keywords.api.products_keywords_data`;

export async function fetchProductsKeywords() {
  try {
    const response = await fetch(PRODUCTS_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Products Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching products keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedProductsMetadata(productsData, locale) {
  if (!productsData) return null;

  const metaTabs = {
    de: {
      ...productsData.metadata_de_tab,
      keywords: productsData.metadata_de_tab?.keywords || "",
      locale: productsData.metadata_de_tab?.metadata_locale_de,
      sitename: productsData.metadata_de_tab?.metadata_sitename_de,
      type: productsData.metadata_de_tab?.metadata_type_de,
      title: productsData.metadata_de_tab?.metadata_title_de,
      description: productsData.metadata_de_tab?.metadata_description_de,
      url: productsData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...productsData.metadata_en_tab,
      keywords: productsData.metadata_en_tab?.keywords || "",
      locale: productsData.metadata_en_tab?.metadata_local_en,
      sitename: productsData.metadata_en_tab?.metadata_sitename_en,
      type: productsData.metadata_en_tab?.metadata_type_en,
      title: productsData.metadata_en_tab?.metadata_title_en,
      description: productsData.metadata_en_tab?.metadata_description_en,
      url: productsData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...productsData.metadata_it_tab,
      keywords: productsData.metadata_it_tab?.keywords || "",
      locale: productsData.metadata_it_tab?.metadata_locale_it,
      sitename: productsData.metadata_it_tab?.metadata_sitename_it,
      type: productsData.metadata_it_tab?.metadata_type_it,
      title: productsData.metadata_it_tab?.metadata_title_it,
      description: productsData.metadata_it_tab?.metadata_description_it,
      url: productsData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...productsData.metadata_fr_tab,
      keywords: productsData.metadata_fr_tab?.keywords || "",
      locale: productsData.metadata_fr_tab?.metadata_local_fr,
      sitename: productsData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: productsData.metadata_fr_tab?.metadata_type_fr,
      title: productsData.metadata_fr_tab?.metadata_title_fr,
      description: productsData.metadata_fr_tab?.metadata_description_fr,
      url: productsData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getProductsOGImage(productsData) {
  if (!productsData) return null;
  
  return productsData.images_table?.[0]?.bild_anhagen
    ? `/cms${productsData.images_table[0].bild_anhagen}`
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