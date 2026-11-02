// src/lib/marken/brandTitle.js
// <title> of the brand pages (/ueber-uns/marken/[title], four locales).
//
// Runde 2 (seo P0-2, P2-1; recht P2-8): a title is a SERP claim. Brands
// without a dealer agreement get NO "Showroom Österreich/Austria/Lochau",
// "Händler", "dealer", "revendeur", "rivenditore" – only the neutral pattern
// "<Marke> – Designmarke im Showroom am Bodensee". The verified dealer brands
// (claims.js: VERIFIED_DEALER_BRANDS = ClassiCon, Ezarri) say "Vertragshändler",
// without "offiziell" and without a territory that reads like exclusivity.
// Inhaber-Entscheidungen Nr. 19/21/22 (31.10.2026): Bad-&-Wellness-Marken say
// "Händler" (Liefervereinbarung); Minotti carries the studio name from the
// Minotti press release ("Minotti Studio by Platzhirsch Home Living – Lochau").
//
// Pure module (relative imports only): runs in node --test.
import { dealerStudio, dealerTitleWord, isVerifiedDealerBrand, toBrandSlug } from "../legal/claims.js";

export const BRAND_TITLE_MAX = 65;
const SUFFIX = " | Platzhirsch";

const NEUTRAL = {
  de: (b) => `${b} – Designmarke im Showroom am Bodensee`,
  en: (b) => `${b} – design brand at our Lake Constance showroom`,
  fr: (b) => `${b} – marque de design, showroom au lac de Constance`,
  it: (b) => `${b} – marchio di design, showroom sul Lago di Costanza`,
};
// Shorter fallbacks for long brand names (still no dealer claim).
const NEUTRAL_SHORT = {
  de: (b) => `${b} – Designmarke am Bodensee`,
  en: (b) => `${b} – design brand, Lake Constance`,
  fr: (b) => `${b} – marque de design, lac de Constance`,
  it: (b) => `${b} – marchio di design, Lago di Costanza`,
};

// The dealer word comes from src/lib/legal/claims.js (the only place allowed
// to hold it, eslint no-restricted-syntax).
const DEALER_PLACE = { de: "am Bodensee", en: "on Lake Constance", fr: "au lac de Constance", it: "sul Lago di Costanza" };
const DEALER = Object.fromEntries(
  Object.keys(DEALER_PLACE).map((l) => [l, (b, extra) => `${b}${extra ? ` ${extra[l]}` : ""} – ${dealerTitleWord(b, l)} ${DEALER_PLACE[l]}`])
);
// What the dealer brand is, where the name alone says little.
const DEALER_EXTRA = {
  ezarri: { de: "Glasmosaik", en: "glass mosaic", fr: "mosaïque de verre", it: "mosaico in vetro" },
};

function fit(base) {
  if (base.length + SUFFIX.length <= BRAND_TITLE_MAX) return base + SUFFIX;
  return base;
}

/**
 * @param {string} brandName display name ("Paola Lenti", "Schüller")
 * @param {"de"|"en"|"fr"|"it"} [locale]
 * @returns {string} ≤ 65 characters whenever the brand name allows it
 */
export function brandPageTitle(brandName, locale = "de") {
  const loc = NEUTRAL[locale] ? locale : "de";
  const brand = String(brandName || "").trim();
  const slug = toBrandSlug(brand);
  // The studio name already holds the company name: no " | Platzhirsch" suffix.
  const studio = dealerStudio(slug, loc);
  if (studio?.pageTitle && studio.pageTitle.length <= BRAND_TITLE_MAX) return studio.pageTitle;
  if (isVerifiedDealerBrand(slug)) {
    const withExtra = DEALER[loc](brand, DEALER_EXTRA[slug]?.[loc] ? DEALER_EXTRA[slug] : null);
    return fit(withExtra.length <= BRAND_TITLE_MAX ? withExtra : DEALER[loc](brand, null));
  }
  const long = NEUTRAL[loc](brand);
  if (long.length <= BRAND_TITLE_MAX) return fit(long);
  return fit(NEUTRAL_SHORT[loc](brand));
}
