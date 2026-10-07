// src/lib/seo/shopSeoCopy.js
// Localized <title>/meta-description templates for the /produkte hub,
// category and product pages. CMS text (metadata_description_*/beschreibung_*)
// always wins where it exists; these are the fallbacks.

const SUFFIX = " | Platzhirsch Home Living";

const HUB = {
  de: {
    title: `Designermöbel & Produktkatalog${SUFFIX}`,
    description: "Designermöbel von Minotti, Rimadesio und weiteren Premium-Marken, nach Kategorie sortiert. Erleben Sie die Auswahl in unserer Ausstellung in Lochau am Bodensee, Vorarlberg.",
  },
  en: {
    title: `Designer Furniture & Product Catalogue${SUFFIX}`,
    description: "Designer furniture from Minotti, Rimadesio and other premium brands, sorted by category. See the collection in our showroom in Lochau on Lake Constance, Vorarlberg.",
  },
  fr: {
    title: `Mobilier design & catalogue produits${SUFFIX}`,
    description: "Mobilier design de Minotti, Rimadesio et d'autres marques premium, classé par catégorie. Découvrez la sélection dans notre showroom à Lochau, au bord du lac de Constance.",
  },
  it: {
    title: `Mobili di design & catalogo prodotti${SUFFIX}`,
    description: "Mobili di design di Minotti, Rimadesio e altri marchi premium, ordinati per categoria. Scopri la selezione nel nostro showroom a Lochau, sul Lago di Costanza.",
  },
};

export function hubSeo(locale) {
  return HUB[locale] || HUB.de;
}

// German search terms per category key (SISTRIX, DE monthly clicks 2026-10:
// "designer sofa" 1,350, "esstisch design" 500, "design gartenmöbel" 400,
// "designerleuchten" 250, "designerbetten" 150, "designerküchen" 150). Used in
// the German <title>/description of the category page; the visible H1 keeps
// the CMS label. Keys = ProductsMenu/category slugs.
const CATEGORY_KEYWORD_DE = {
  "sofas-couches": "Designer Sofas",
  "corner-sofas": "Design Ecksofas",
  "leather-sofas": "Designer Ledersofas",
  "armchairs-stools": "Designer Sessel",
  "chaise-longues-daybeds": "Design Chaiselongues & Daybeds",
  "dining-tables": "Design Esstische",
  "dining-chairs": "Designer Stühle",
  "coffee-tables": "Design Couchtische",
  "side-tables": "Design Beistelltische",
  "beds": "Designerbetten",
  "wardrobes": "Design Kleiderschränke",
  "sideboards-chests": "Design Sideboards",
  "shelves": "Design Regale",
  "kitchen": "Designerküchen",
  "lamps": "Designerleuchten",
  "rugs": "Designer Teppiche",
  "garden-tables": "Design Gartentische",
  "garden-chairs": "Design Gartenstühle",
  "lounge-furniture-daybeds": "Design Gartenmöbel & Loungemöbel",
  "sun-loungers": "Design Sonnenliegen",
  "parasols": "Design Sonnenschirme",
};

// `brands` = up to 3 brand names that have products in the category;
// `key` = category slug for the German keyword map.
export function categorySeo(locale, { label, count, brands, key }) {
  const brandList = (brands || []).filter(Boolean).slice(0, 3).join(", ");
  const keywordDe = CATEGORY_KEYWORD_DE[key];
  switch (locale) {
    case "en":
      return {
        title: `${label} – Designer Furniture in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` by ${brandList}` : ""} – discover them in our showroom in Lochau on Lake Constance, with personal consulting, delivery and assembly.`,
      };
    case "fr":
      return {
        title: `${label} – Mobilier design au Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` de ${brandList}` : ""} – à découvrir dans notre showroom à Lochau, au bord du lac de Constance, avec conseil personnalisé, livraison et montage.`,
      };
    case "it":
      return {
        title: `${label} – Mobili di design in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` di ${brandList}` : ""} – da scoprire nel nostro showroom a Lochau, sul Lago di Costanza, con consulenza personale, consegna e montaggio.`,
      };
    default:
      return {
        title: keywordDe
          ? `${keywordDe} in Vorarlberg – ${label}${SUFFIX}`
          : `${label} – Designermöbel in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${keywordDe || label}${brandList ? ` von ${brandList}` : ""} – im Showroom in Lochau am Bodensee erleben. Persönliche Beratung, Lieferung und Montage in Österreich, Deutschland und der Schweiz.`,
      };
  }
}

export function productTitle({ name, brand }) {
  return `${name}${brand ? ` – ${brand}` : ""}${SUFFIX}`;
}
