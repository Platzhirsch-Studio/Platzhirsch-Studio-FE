// src/lib/crossSell.js – Querverweise vom Sortiment zu den Planern und Welten
// (Inhaber-Entscheidung Nr. 9, Wachstumsrat cross-upsell.md, USP-
// Durchdringungsplan): Produkt → 3D/AR, Minotti-Sofa → Sofaplaner, Küche →
// Küchenplaner + Bodensee-Licht, Outdoor → Outdoor-Planung und Ezarri-Pool,
// Marke Minotti → Sofaplaner, Küchenmarke → Küchenplaner, Ezarri → Ezarri-Welt.
//
// Rein (keine Pakete, keine "@/"-Aliase): node --test lädt es direkt.
// Alle Ziele sind deutsche Seiten → nur für locale "de" (andere Sprachen
// würden auf 404 zeigen). `on(id)` sagt, ob das Feature verlinkt wird
// (src/lib/features.js + EZARRI_PUBLIC), Standard: alles an.

import { SOURCE_COPY } from "./sofaplaner/consent.js";

// Sofaplaner-Texte aus SOURCE_COPY (R8, recht P0-1/ux P1-4): ohne Minotti-
// Zustimmung verlinkt die Minotti-Seite den Planer nur neutral.
const SOFA_CATEGORIES = new Set(["sofas-couches", "armchairs-stools", "chaise-longues-daybeds"]);
const KITCHEN_CATEGORIES = new Set(["kitchen", "kitchen-accessories"]);
const OUTDOOR_CATEGORIES = new Set(["garden-tables", "garden-chairs", "lounge-furniture-daybeds", "sun-loungers", "parasols", "heaters"]);
const POOL_CATEGORIES = new Set(["sun-loungers", "lounge-furniture-daybeds"]);
const KITCHEN_BRANDS = new Set(["next125", "binni", "schueller", "bulthaup"]);

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const all = () => true;

/**
 * Links für eine Produktseite.
 * @param {{locale: string, categoryKey?: string, brand?: string, name?: string, sofaFamily?: string|null, on?: (id: string) => boolean}} p
 *   sofaFamily: geprüfter Sofaplaner-Slug des Modells (src/lib/marken/minottiBodensee.js,
 *   nur wenn die Familie im Katalog existiert) → „Dieses Modell im Sofaplaner planen“.
 * @returns {{id: string, href: string, label: string, text: string}[]}
 */
export function productPlanLinks({ locale, categoryKey, brand, name, sofaFamily = null, on = all }) {
  if (locale !== "de") return [];
  const cat = slug(categoryKey);
  const b = slug(brand);
  const out = [];
  if (on("arviewer") && name) {
    out.push({
      id: "arviewer",
      href: `/3d-ansicht?q=${encodeURIComponent(String(name).trim())}#sortiment`,
      label: "In 3D & AR ansehen",
      text: "Drehen, Maße einblenden und per Handy in Originalgröße in Ihren Raum stellen.",
    });
  }
  if (on("sofaplaner") && b === "minotti" && SOFA_CATEGORIES.has(cat)) {
    const model = cat === "sofas-couches" && typeof sofaFamily === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(sofaFamily);
    out.push(
      model
        ? { id: "sofaplaner", href: `/sofaplaner?m=${sofaFamily}`, label: "Dieses Modell im Sofaplaner planen", text: SOURCE_COPY.crossText }
        : { id: "sofaplaner", href: "/sofaplaner", label: SOURCE_COPY.crossLabel, text: SOURCE_COPY.crossText }
    );
  }
  // Service Nr. 4 (Integration 29.10.2026): dezenter Hinweis auf den
  // Pflege-Service bei Polstermöbeln (Leder, Stoff), unabhängig von der Marke.
  if (on("pflege") && SOFA_CATEGORIES.has(cat)) {
    out.push({ id: "pflege", href: "/pflege-service", label: "Pflege-Service", text: "Leder, Stoff und Holz: Pflegetermin bei Ihnen, auch als jährliches Abo." });
  }
  if (on("kuechenplaner") && KITCHEN_CATEGORIES.has(cat)) {
    out.push({ id: "kuechenplaner", href: "/kuechenplaner", label: "Küche online planen", text: "Grundriss, Module und Fronten im Browser, in 3D." });
  }
  if (on("licht") && KITCHEN_CATEGORIES.has(cat)) {
    out.push({ id: "licht", href: "/bodensee-licht", label: "Licht in Ihrer Küche ansehen", text: "Der echte Sonnenstand für Ihren Ort und Ihre Fensterrichtung." });
  }
  if (on("outdoor") && OUTDOOR_CATEGORIES.has(cat)) {
    out.push({ id: "outdoor", href: "/outdoor-gartenplanung", label: "Outdoor-Konzept planen", text: "Möbel, Schatten und Licht für Terrasse und Garten." });
  }
  if (on("ezarri") && POOL_CATEGORIES.has(cat)) {
    out.push({ id: "ezarri", href: "/ezarri/pool", label: "Pool mit Ezarri-Glasmosaik", text: "Mosaik für Becken, Wellness und Bad – mit Konfigurator." });
  }
  return out.slice(0, 3);
}

/**
 * Links für eine Markenseite.
 * @param {{locale: string, brand?: string, on?: (id: string) => boolean}} p
 */
export function brandPlanLinks({ locale, brand, on = all }) {
  if (locale !== "de") return [];
  const b = slug(brand);
  const out = [];
  if (b === "minotti" && on("sofaplaner")) out.push({ id: "sofaplaner", href: "/sofaplaner", label: SOURCE_COPY.seoName, text: SOURCE_COPY.brandText });
  if (KITCHEN_BRANDS.has(b) && on("kuechenplaner")) out.push({ id: "kuechenplaner", href: "/kuechenplaner", label: "Küchenplaner", text: "Ihre Küche online vorplanen, dann gemeinsam im Studio." });
  if (b === "ezarri" && on("ezarri")) out.push({ id: "ezarri", href: "/ezarri", label: "Ezarri-Welt", text: "Sortiment, Mosaik-Übersicht und Pool-Konfigurator." });
  // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21): Agape steht dort im Bereich Bad –
  // ohne Händleraussage (Agape ist nicht im Register), nur der Weg zur Planung.
  if (b === "agape") out.push({ id: "bad-wellness", href: "/bad-wellness", label: "Bad & Wellness planen", text: "Bad, Private Spa und Wellness von Hand und in 3D planen." });
  if (on("arviewer")) out.push({ id: "arviewer", href: `/3d-ansicht?marke=${encodeURIComponent(b)}#sortiment`, label: "Stücke in 3D & AR ansehen", text: "Ausgewählte Stücke drehen, messen und in den eigenen Raum stellen." });
  return out.slice(0, 3);
}
