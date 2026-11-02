// src/lib/api/consultationKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

const CONSULTATION_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.consulation_keywords.api.consulation_keywords_data`;

export async function fetchConsultationKeywords() {
  try {
    const response = await backofficeFetch(CONSULTATION_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Consultation Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching consultation keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedConsultationMetadata(consultationData, locale) {
  if (!consultationData) return null;

  const metaTabs = {
    de: {
      ...consultationData.metadata_de_tab,
      keywords: consultationData.metadata_de_tab?.keywords || "",
      locale: consultationData.metadata_de_tab?.metadata_locale_de,
      sitename: consultationData.metadata_de_tab?.metadata_sitename_de,
      type: consultationData.metadata_de_tab?.metadata_type_de,
      title: consultationData.metadata_de_tab?.metadata_title_de,
      description: consultationData.metadata_de_tab?.metadata_description_de,
      url: consultationData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...consultationData.metadata_en_tab,
      keywords: consultationData.metadata_en_tab?.keywords || "",
      locale: consultationData.metadata_en_tab?.metadata_local_en,
      sitename: consultationData.metadata_en_tab?.metadata_sitename_en,
      type: consultationData.metadata_en_tab?.metadata_type_en,
      title: consultationData.metadata_en_tab?.metadata_title_en,
      description: consultationData.metadata_en_tab?.metadata_description_en,
      url: consultationData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...consultationData.metadata_it_tab,
      keywords: consultationData.metadata_it_tab?.keywords || "",
      locale: consultationData.metadata_it_tab?.metadata_locale_it,
      sitename: consultationData.metadata_it_tab?.metadata_sitename_it,
      type: consultationData.metadata_it_tab?.metadata_type_it,
      title: consultationData.metadata_it_tab?.metadata_title_it,
      description: consultationData.metadata_it_tab?.metadata_description_it,
      url: consultationData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...consultationData.metadata_fr_tab,
      keywords: consultationData.metadata_fr_tab?.keywords || "",
      locale: consultationData.metadata_fr_tab?.metadata_local_fr,
      sitename: consultationData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: consultationData.metadata_fr_tab?.metadata_type_fr,
      title: consultationData.metadata_fr_tab?.metadata_title_fr,
      description: consultationData.metadata_fr_tab?.metadata_description_fr,
      url: consultationData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getConsultationOGImage(consultationData) {
  if (!consultationData) return null;
  
  return consultationData.images_table?.[0]?.bild_anhagen
    ? `/cms${consultationData.images_table[0].bild_anhagen}`
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