// src/lib/api/contactKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";

const CONTACT_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.contact_keywords.api.contact_keywords_data`;

export async function fetchContactKeywords() {
  try {
    const response = await fetch(CONTACT_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Contact Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching contact keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedContactMetadata(contactData, locale) {
  if (!contactData) return null;

  const metaTabs = {
    de: {
      ...contactData.metadata_de_tab,
      keywords: contactData.metadata_de_tab?.keywords || "",
      locale: contactData.metadata_de_tab?.metadata_locale_de,
      sitename: contactData.metadata_de_tab?.metadata_sitename_de,
      type: contactData.metadata_de_tab?.metadata_type_de,
      title: contactData.metadata_de_tab?.metadata_title_de,
      description: contactData.metadata_de_tab?.metadata_description_de,
      url: contactData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...contactData.metadata_en_tab,
      keywords: contactData.metadata_en_tab?.keywords || "",
      locale: contactData.metadata_en_tab?.metadata_local_en,
      sitename: contactData.metadata_en_tab?.metadata_sitename_en,
      type: contactData.metadata_en_tab?.metadata_type_en,
      title: contactData.metadata_en_tab?.metadata_title_en,
      description: contactData.metadata_en_tab?.metadata_description_en,
      url: contactData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...contactData.metadata_it_tab,
      keywords: contactData.metadata_it_tab?.keywords || "",
      locale: contactData.metadata_it_tab?.metadata_locale_it,
      sitename: contactData.metadata_it_tab?.metadata_sitename_it,
      type: contactData.metadata_it_tab?.metadata_type_it,
      title: contactData.metadata_it_tab?.metadata_title_it,
      description: contactData.metadata_it_tab?.metadata_description_it,
      url: contactData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...contactData.metadata_fr_tab,
      keywords: contactData.metadata_fr_tab?.keywords || "",
      locale: contactData.metadata_fr_tab?.metadata_local_fr,
      sitename: contactData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: contactData.metadata_fr_tab?.metadata_type_fr,
      title: contactData.metadata_fr_tab?.metadata_title_fr,
      description: contactData.metadata_fr_tab?.metadata_description_fr,
      url: contactData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getContactOGImage(contactData) {
  if (!contactData) return null;
  
  return contactData.images_table?.[0]?.bild_anhagen
    ? `/cms${contactData.images_table[0].bild_anhagen}`
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