import "server-only";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { getMarkenByName } from "@/lib/api/fetchMarkenData";
import { cleanProductName } from "@/lib/content/brands";
import { BASE } from "./content";

// Read-only helpers on top of the existing fetchers in src/lib/api (not
// changed). Both requests are cached by Next's data cache (1 h).

export const CATEGORY_LABELS = {
  "sofas-couches": "Sofas",
  "armchairs-stools": "Sessel & Hocker",
  "chaise-longues-daybeds": "Liegen & Daybeds",
  "dining-tables": "Esstische",
  "dining-chairs": "Esszimmerstühle",
  "coffee-tables": "Couchtische",
  "side-tables": "Beistelltische",
  beds: "Betten",
  "night-tables": "Nachttische",
  "sideboards-chests": "Sideboards",
  shelves: "Regale",
  rugs: "Teppiche",
  decor: "Accessoires",
  "small-furniture": "Kleinmöbel",
  bedwear: "Bettwäsche",
  lamps: "Leuchten",
  mirrors: "Spiegel",
  "kitchen-accessories": "Küchenaccessoires",
};

export function categoryLabel(key) {
  return CATEGORY_LABELS[key] || (key || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toCard(p) {
  const first = p.bild_anhangen?.[0];
  return {
    slug: p.path_field,
    name: cleanProductName(p.produkt_name),
    category: categoryLabel(p.kategories),
    categoryKey: p.kategories,
    image: first?.bild_anhangen ? `/cmx${first.bild_anhangen}` : null,
    alt: first?.alt_text || `Minotti ${cleanProductName(p.produkt_name)}`,
    href: `${BASE}/produkt/${p.path_field}`,
  };
}

export async function loadMinotti() {
  const [marke, products] = await Promise.all([getMarkenByName("Minotti"), fetchProdukteNewByMarke("Minotti")]);
  const active = (products || []).filter((p) => p.status === "Aktiv" && p.path_field && p.bild_anhangen?.length);
  return { marke, products: active };
}

// Plain paragraphs from CMS text; drops the heading line and every paragraph
// that speaks about Platzhirsch itself (the CMS copy contains dealer wording
// that must not be reused).
export function storyParagraphs(text) {
  return (text || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/<[^>]*>/g, "").trim())
    .filter((p) => p && p.length > 60 && !/platzhirsch|händler|vertrieb/i.test(p));
}
