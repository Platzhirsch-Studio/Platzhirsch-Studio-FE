import "server-only";
import { cleanProductName } from "@/lib/content/brands";

// Small helpers to shape backoffice rows for the prototype (read-only use of
// the existing fetchers in src/lib/api – nothing there is changed).

export const CATEGORY_LABELS = {
  "sofas-couches": "Sofas",
  "armchairs-stools": "Sessel & Hocker",
  "side-tables": "Beistelltische",
  "coffee-tables": "Couchtische",
  "dining-tables": "Esstische",
  "dining-chairs": "Esszimmerstühle",
  beds: "Betten",
  "night-tables": "Nachttische",
  bedwear: "Bettwaren",
  "chaise-longues-daybeds": "Liegen & Daybeds",
  "sideboards-chests": "Sideboards",
  shelves: "Regale",
  "small-furniture": "Kleinmöbel",
  rugs: "Teppiche",
  decor: "Accessoires",
  lamps: "Leuchten",
  mirrors: "Spiegel",
  "kitchen-accessories": "Küchenaccessoires",
};

export function categoryLabel(key) {
  if (!key) return "";
  return CATEGORY_LABELS[key] || key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function firstImage(row) {
  const list = Array.isArray(row?.bild_anhangen) ? row.bild_anhangen : [];
  const path = list[0]?.bild_anhangen || (typeof row?.bild_anhangen === "string" ? row.bild_anhangen : null);
  return path ? `/cmx${path}` : null;
}

export function toCard(row) {
  return {
    slug: row.path_field,
    name: cleanProductName(row.produkt_name),
    category: row.kategories,
    image: firstImage(row),
    alt: row.bild_anhangen?.[0]?.alt_text || row.produkt_name,
  };
}

// CMS HTML → plain paragraphs (the prototype renders text only, no HTML).
export function toPlainParagraphs(paragraphs) {
  return (paragraphs || [])
    .map((p) =>
      String(p)
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}
