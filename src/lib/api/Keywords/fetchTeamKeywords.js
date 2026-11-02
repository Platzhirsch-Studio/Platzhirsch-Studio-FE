// src/lib/api/teamKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

const TEAM_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.team_keywords.api.team_keywords_data`;

export async function fetchTeamKeywords() {
  try {
    const response = await backofficeFetch(TEAM_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Team Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching team keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedTeamMetadata(teamData, locale) {
  if (!teamData) return null;

  const metaTabs = {
    de: {
      ...teamData.metadata_de_tab,
      keywords: teamData.metadata_de_tab?.keywords || "",
      locale: teamData.metadata_de_tab?.metadata_locale_de,
      sitename: teamData.metadata_de_tab?.metadata_sitename_de,
      type: teamData.metadata_de_tab?.metadata_type_de,
      title: teamData.metadata_de_tab?.metadata_title_de,
      description: teamData.metadata_de_tab?.metadata_description_de,
      url: teamData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...teamData.metadata_en_tab,
      keywords: teamData.metadata_en_tab?.keywords || "",
      locale: teamData.metadata_en_tab?.metadata_local_en,
      sitename: teamData.metadata_en_tab?.metadata_sitename_en,
      type: teamData.metadata_en_tab?.metadata_type_en,
      title: teamData.metadata_en_tab?.metadata_title_en,
      description: teamData.metadata_en_tab?.metadata_description_en,
      url: teamData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...teamData.metadata_it_tab,
      keywords: teamData.metadata_it_tab?.keywords || "",
      locale: teamData.metadata_it_tab?.metadata_locale_it,
      sitename: teamData.metadata_it_tab?.metadata_sitename_it,
      type: teamData.metadata_it_tab?.metadata_type_it,
      title: teamData.metadata_it_tab?.metadata_title_it,
      description: teamData.metadata_it_tab?.metadata_description_it,
      url: teamData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...teamData.metadata_fr_tab,
      keywords: teamData.metadata_fr_tab?.keywords || "",
      locale: teamData.metadata_fr_tab?.metadata_local_fr,
      sitename: teamData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: teamData.metadata_fr_tab?.metadata_type_fr,
      title: teamData.metadata_fr_tab?.metadata_title_fr,
      description: teamData.metadata_fr_tab?.metadata_description_fr,
      url: teamData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getTeamOGImage(teamData) {
  if (!teamData) return null;

  return teamData.images_table?.[0]?.bild_anhagen
    ? `/cms${teamData.images_table[0].bild_anhagen}`
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


export function parseKeywords(keywordsString) {
  if (!keywordsString) return [];
  return keywordsString.split(",").map(k => k.trim());
}