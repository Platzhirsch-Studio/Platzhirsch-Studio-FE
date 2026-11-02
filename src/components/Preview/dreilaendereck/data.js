// Datenzugriff des Prototyps – nur Lesen über die vorhandenen Fetch-Funktionen
// in src/lib/api (nichts davon wird verändert). Alle Aufrufe fangen Fehler ab,
// damit ein Backoffice-Aussetzer den Prototyp nicht mit 500 abbricht.
import "server-only";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import {
  fetchProdukteNewByMarke,
  fetchProduktNewByPathField,
  fetchRelatedProdukteNew,
} from "@/lib/api/fetchAllProdukte";
import { toShopProductDetail } from "@/lib/shop/shopProducts";
import { cleanProductName } from "@/lib/content/brands";
import { generateSlug } from "@/lib/slugify";
import { BRAND_LIST } from "./content";

const cmx = (path) => (path ? `/cmx${path}` : null);

async function safeMarken() {
  try {
    return await fetchRawMarkenData();
  } catch {
    return [];
  }
}

// Markenliste der Startseite: Name, Herkunft, Gründungsjahr und ein Bild aus
// dem Marken-Doctype. Marken ohne aktiven CMS-Eintrag bleiben reine Textzeile.
export async function loadBrandWorld() {
  const marken = await safeMarken();
  const bySlug = new Map(marken.filter((m) => m.status === "Aktiv").map((m) => [generateSlug(m.name1), m]));
  return BRAND_LIST.map((b) => {
    const m = bySlug.get(b.slug);
    return {
      ...b,
      origin: m?.herkunftsland || null,
      founded: m?.grundungsjahr || null,
      image: cmx(m?.bild_anhagen?.[0]?.bild_anhagen),
    };
  });
}

// Minotti: Stammdaten + Bilder aus dem Marken-Doctype. Bewusst NICHT
// verwendet: dealers_title_de / dealers_description_de (enthält eine
// Händler-Behauptung) und die generischen Werbetexte.
export async function loadMinottiBrand() {
  const marken = await safeMarken();
  const m = marken.find((x) => generateSlug(x.name1) === "minotti");
  if (!m) return null;
  return {
    name: m.name1,
    founded: m.grundungsjahr || null,
    origin: m.herkunftsland || null,
    founder: m.grunder || null,
    approach: (m.desing_approach_de || "").trim() || null,
    images: (m.bild_anhagen || []).map((r) => cmx(r.bild_anhagen)).filter(Boolean),
  };
}

const CATEGORY_LABELS = {
  "sofas-couches": "Sofas",
  "armchairs-stools": "Sessel & Hocker",
  "side-tables": "Beistelltische",
  "coffee-tables": "Couchtische",
  "dining-tables": "Esstische",
  "dining-chairs": "Esszimmerstühle",
  beds: "Betten",
  rugs: "Teppiche",
  "sideboards-chests": "Sideboards",
  "night-tables": "Nachttische",
  shelves: "Regale",
  "small-furniture": "Kleinmöbel",
  decor: "Accessoires",
  bedwear: "Bettwäsche",
  "chaise-longues-daybeds": "Liegen & Daybeds",
  "kitchen-accessories": "Küchenaccessoires",
  mirrors: "Spiegel",
  lamps: "Leuchten",
};
export const categoryLabel = (key) => CATEGORY_LABELS[key] || key;

// Kuratierte Auswahl für die Markenseite (echte path_field-Werte aus dem
// Katalog, geprüft am 26.10.2026). Fehlt ein Eintrag im Backoffice, fällt er
// einfach weg.
const MINOTTI_EDIT = [
  "sofas-lawrence",
  "sofas-andersen",
  "sofas-daniels",
  "sofas-goodman",
  "sofas-seymour",
  "sofas-torii-sofas",
  "sofas-twiggy-sofas",
  "sofas-hamilton",
];

export async function loadMinottiCatalog() {
  const rows = (await fetchProdukteNewByMarke("Minotti")).filter((p) => p?.status === "Aktiv" && p?.path_field);
  const counts = {};
  for (const p of rows) if (p.kategories) counts[p.kategories] = (counts[p.kategories] || 0) + 1;
  const categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: categoryLabel(key), count }));

  const byPath = new Map(rows.map((p) => [p.path_field, p]));
  const edit = MINOTTI_EDIT.map((path) => byPath.get(path))
    .filter(Boolean)
    .map((p) => {
      const img = Array.isArray(p.bild_anhangen) ? p.bild_anhangen[0]?.bild_anhangen : p.bild_anhangen;
      return {
        slug: p.path_field,
        name: cleanProductName(p.produkt_name),
        category: categoryLabel(p.kategories),
        image: cmx(img),
      };
    })
    .filter((p) => p.image);

  return { total: rows.length, categories, edit };
}

// Produktdetail (nur aktive Minotti-Produkte – der Prototyp zeigt die
// Markenwelt Minotti, andere Marken antworten mit 404).
export async function loadMinottiProduct(slug) {
  const detail = await fetchProduktNewByPathField(slug, "de");
  if (!detail || detail.status !== "Aktiv" || generateSlug(detail.marken) !== "minotti") return null;
  const product = toShopProductDetail(detail, "de");
  const related = await fetchRelatedProdukteNew({
    marken: detail.marken,
    kategories: detail.kategories,
    path_field: slug,
    limit: 4,
  });
  return {
    ...product,
    slug,
    categoryKey: detail.kategories,
    categoryLabel: categoryLabel(detail.kategories),
    metaDescription: detail.metadata_description_de || null,
    liveHref: `/de/produkte/${generateSlug(detail.kategories)}/${slug}`,
    related: related.filter((r) => r.image),
  };
}
