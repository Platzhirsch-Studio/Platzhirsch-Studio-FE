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
  // Own world on the site, not a CMS brand page (SITE_BRANDS below).
  { name: "Ezarri", slug: "ezarri", href: "/ezarri", locales: ["de"] },
  { name: "Tréca", slug: "treca" },
  { name: "Eichholtz", slug: "eichholtz" },
  { name: "Gloster", slug: "gloster" },
  { name: "Tonon", slug: "tonon" },
  { name: "next125", slug: "next125" },
];

// Brands with their own world on the site instead of a CMS brand page
// (owner decision 7: Ezarri dealer). Same row shape as the CMS Marken rows;
// `href` replaces /ueber-uns/marken/<slug>. Added to the brand index only
// while the CMS has no active row of the same slug.
export const SITE_BRANDS = [{ name1: "Ezarri", status: "Aktiv", herkunftsland: "Spanien", href: "/ezarri", locales: ["de"] }];

// The Ezarri world is German only so far, so other locales leave it out.
const inLocale = (b, locale) => !b.locales || b.locales.includes(locale);
export function featuredBrands(locale) {
  return FEATURED_BRANDS.filter((b) => inLocale(b, locale));
}

export function withSiteBrands(rows, locale = "de") {
  const present = new Set((rows || []).filter((m) => m?.status === "Aktiv" && m?.name1).map((m) => generateSlug(m.name1)));
  return [...(rows || []), ...SITE_BRANDS.filter((b) => inLocale(b, locale) && !present.has(generateSlug(b.name1)))];
}

// Link of a featured or CMS brand: its own page when it has one, else
// <brand index>/<slug>.
export function brandHref(b, base) {
  return b.href || `${base}/${b.slug}`;
}

// Rank of a CMS brand in the featured order (by slug, so spelling differences
// like "Tréca" vs "Treca" don't matter); brands not featured sort last.
export function featuredRank(cmsName) {
  const slug = generateSlug(cmsName);
  const i = FEATURED_BRANDS.findIndex((b) => b.slug === slug);
  return i === -1 ? FEATURED_BRANDS.length : i;
}

// CMS spellings that must not reach the page as-is (the backend stores the
// ASCII form; the slug keeps it, the visible name gets the real spelling).
// QM wm-fix2: antoniolupi and next125 write themselves in lower case (as the
// Bad & Wellness section and FEATURED_BRANDS already do); the CMS stores
// "Antoniolupi"/"Next125", so the A–Z list showed two spellings on one page.
const BRAND_DISPLAY_NAMES = {
  schueller: "Schüller",
  treca: "Tréca",
  "brand-van-egmond": "Brand van Egmond",
  antoniolupi: "antoniolupi",
  next125: "next125",
};
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
