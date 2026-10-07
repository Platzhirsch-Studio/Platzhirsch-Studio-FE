// src/lib/content/brands.js
// The brands the site leads with, in order of search demand (SISTRIX 2026-10:
// "minotti" and "poliform" carry the most clicks). `slug` must equal
// generateSlug(<Marken name1 in the CMS>) — the brand pages live at
// /ueber-uns/marken/<slug>. Used by the hero, the brand wall, the footer and
// the homepage copy; the complete list of brands comes from the CMS.
import { generateSlug } from "@/lib/slugify";

export const FEATURED_BRANDS = [
  { name: "Minotti", slug: "minotti" },
  { name: "Poliform", slug: "poliform" },
  { name: "Rimadesio", slug: "rimadesio" },
  { name: "Flos", slug: "flos" },
  { name: "Paola Lenti", slug: "paola-lenti" },
  { name: "Tom Dixon", slug: "tom-dixon" },
  { name: "ClassiCon", slug: "classicon" },
  { name: "Tréca", slug: "treca" },
  { name: "Eichholtz", slug: "eichholtz" },
  { name: "Gloster", slug: "gloster" },
  { name: "Tonon", slug: "tonon" },
  { name: "next125", slug: "next125" },
];

// Rank of a CMS brand in the featured order (by slug, so spelling differences
// like "Tréca" vs "Treca" don't matter); brands not featured sort last.
export function featuredRank(cmsName) {
  const slug = generateSlug(cmsName);
  const i = FEATURED_BRANDS.findIndex((b) => b.slug === slug);
  return i === -1 ? FEATURED_BRANDS.length : i;
}

// CMS spellings that must not reach the page as-is (the backend stores the
// ASCII form; the slug keeps it, the visible name gets the real spelling).
const BRAND_DISPLAY_NAMES = { schueller: "Schüller", treca: "Tréca", "brand-van-egmond": "Brand van Egmond" };
export function displayBrandName(cmsName) {
  if (!cmsName) return cmsName;
  return BRAND_DISPLAY_NAMES[generateSlug(cmsName)] || cmsName;
}

// Imported product names carry category/variant suffixes in parentheses —
// "Twiggy (Sofas)", "Torii (Sofas 2)", "Softcase (Variant)" — that belong to the
// import, not to the product. Stripped for display only; slugs stay unchanged.
export function cleanProductName(name) {
  return String(name || "")
    .replace(/\s*\((?:[A-Za-zÄÖÜäöüß& ]+?)(?: \d+)?\)\s*$/u, "")
    .replace(/\s*\((?:variant|variante)\s*\d*\)\s*$/iu, "")
    .trim() || String(name || "").trim();
}
