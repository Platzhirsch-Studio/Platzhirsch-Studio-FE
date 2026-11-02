// src/lib/api/newsKeywordsApi.js
import "server-only"; // Ensures this only runs on server
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { backofficeFetch } from "@/lib/api/http";

const NEWS_KEYWORDS_API_URL = `${API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.news_keywords.api.news_keywords_data`;

export async function fetchNewsKeywords() {
  try {
    const response = await backofficeFetch(NEWS_KEYWORDS_API_URL, {
      method: "GET",
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`News Keywords API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.message?.[0] || null;
  } catch (error) {
    console.error("Error fetching news keywords:", error);
    return null;
  }
}

// Helper function to get localized metadata
export function getLocalizedNewsMetadata(newsData, locale) {
  if (!newsData) return null;

  const metaTabs = {
    de: {
      ...newsData.metadata_de_tab,
      keywords: newsData.metadata_de_tab?.keywords || "",
      locale: newsData.metadata_de_tab?.metadata_locale_de,
      sitename: newsData.metadata_de_tab?.metadata_sitename_de,
      type: newsData.metadata_de_tab?.metadata_type_de,
      title: newsData.metadata_de_tab?.metadata_title_de,
      description: newsData.metadata_de_tab?.metadata_description_de,
      url: newsData.metadata_de_tab?.metadata_url_de,
    },
    en: {
      ...newsData.metadata_en_tab,
      keywords: newsData.metadata_en_tab?.keywords || "",
      locale: newsData.metadata_en_tab?.metadata_local_en,
      sitename: newsData.metadata_en_tab?.metadata_sitename_en,
      type: newsData.metadata_en_tab?.metadata_type_en,
      title: newsData.metadata_en_tab?.metadata_title_en,
      description: newsData.metadata_en_tab?.metadata_description_en,
      url: newsData.metadata_en_tab?.metadata_url_en,
    },
    it: {
      ...newsData.metadata_it_tab,
      keywords: newsData.metadata_it_tab?.keywords || "",
      locale: newsData.metadata_it_tab?.metadata_locale_it,
      sitename: newsData.metadata_it_tab?.metadata_sitename_it,
      type: newsData.metadata_it_tab?.metadata_type_it,
      title: newsData.metadata_it_tab?.metadata_title_it,
      description: newsData.metadata_it_tab?.metadata_description_it,
      url: newsData.metadata_it_tab?.metadata_url_it,
    },
    fr: {
      ...newsData.metadata_fr_tab,
      keywords: newsData.metadata_fr_tab?.keywords || "",
      locale: newsData.metadata_fr_tab?.metadata_local_fr,
      sitename: newsData.metadata_fr_tab?.metadata__sitename_fr, // note: double underscore in your API
      type: newsData.metadata_fr_tab?.metadata_type_fr,
      title: newsData.metadata_fr_tab?.metadata_title_fr,
      description: newsData.metadata_fr_tab?.metadata_description_fr,
      url: newsData.metadata_fr_tab?.metadata_url_fr,
    },
  };

  return metaTabs[locale] || metaTabs.de;
}

// Helper function to get OpenGraph image
export function getNewsOGImage(newsData) {
  if (!newsData) return null;
  
  return newsData.images_table?.[0]?.bild_anhagen
    ? `/cms${newsData.images_table[0].bild_anhagen}`
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