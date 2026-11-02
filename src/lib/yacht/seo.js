// Languages and hreflang of /yacht-interior.
// Welle 2 (team EN-Yacht-Sofa): German and English. 01.11.2026: French and
// Italian too (src/lib/yacht/content-intl.js). The 308 FR/IT → /de in
// src/lib/seo/deOnlyRedirects.cjs (FR_IT_ONLY_EXACT "yacht-interior") has to
// go with the integration, otherwise /fr|it/yacht-interior never reaches the page.
import { hreflangLanguages, localeUrl } from "../seo/pageMetadata.js";

export const YACHT_PATH = "/yacht-interior";
export const YACHT_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** hreflang of the page: the site-wide set (de, de-AT, de-CH, en, fr…, it…, x-default = de), the same on every version. */
export function yachtLanguages(path = YACHT_PATH) {
  return hreflangLanguages((locale) => localeUrl(locale, path));
}
