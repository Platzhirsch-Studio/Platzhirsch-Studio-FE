// src/lib/seo/shopSeoCopy.js
// Localized <title>/meta-description templates for the /produkte hub,
// category and product pages. CMS text (metadata_description_*/beschreibung_*)
// always wins where it exists; these are the fallbacks.

const SUFFIX = " | Platzhirsch Home Living";

const HUB = {
  de: {
    title: `Designermöbel & Produktkatalog${SUFFIX}`,
    description: "Designermöbel von Minotti, Cassina und weiteren Premium-Marken, nach Kategorie sortiert. Erleben Sie die Auswahl in unserer Ausstellung in Lochau am Bodensee, Vorarlberg.",
  },
  en: {
    title: `Designer Furniture & Product Catalogue${SUFFIX}`,
    description: "Designer furniture from Minotti, Cassina and other premium brands, sorted by category. See the collection in our showroom in Lochau on Lake Constance, Vorarlberg.",
  },
  fr: {
    title: `Mobilier design & catalogue produits${SUFFIX}`,
    description: "Mobilier design de Minotti, Cassina et d'autres marques premium, classé par catégorie. Découvrez la sélection dans notre showroom à Lochau, au bord du lac de Constance.",
  },
  it: {
    title: `Mobili di design & catalogo prodotti${SUFFIX}`,
    description: "Mobili di design di Minotti, Cassina e altri marchi premium, ordinati per categoria. Scopri la selezione nel nostro showroom a Lochau, sul Lago di Costanza.",
  },
};

export function hubSeo(locale) {
  return HUB[locale] || HUB.de;
}

// `brands` = up to 3 brand names that have products in the category.
export function categorySeo(locale, { label, count, brands }) {
  const brandList = (brands || []).filter(Boolean).slice(0, 3).join(", ");
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
        title: `${label} – Designermöbel in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` von ${brandList}` : ""} – entdecken Sie die Auswahl in unserer Ausstellung in Lochau am Bodensee, mit persönlicher Beratung, Lieferung und Montage.`,
      };
  }
}

export function productTitle({ name, brand }) {
  return `${name}${brand ? ` – ${brand}` : ""}${SUFFIX}`;
}
