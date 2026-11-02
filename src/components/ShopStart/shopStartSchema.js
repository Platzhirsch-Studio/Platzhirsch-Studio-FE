// src/components/ShopStart/shopStartSchema.js
// JSON-LD der Shop-Startseite: CollectionPage mit ItemList der Kategorien
// (Abteilungen) – nur Verweise auf existierende Kategorieseiten, keine
// Product-/Offer-Knoten (die stehen auf den Produktseiten), nie
// aggregateRating/review. BreadcrumbList kommt aus <Breadcrumbs schema>.
// Rein, ohne "@/"-Importe (node --test).
const SITE = "https://platzhirsch.studio";
const SHOP_PATH = "/accessoires";

/**
 * @param {{ locale: string, name: string, description: string, gruppen: Array<{ id: string, href: string, label: string, anzahl: number }> }} p
 */
export function shopStartSchema({ locale, name, description, gruppen }) {
  const url = `${SITE}/${locale}${SHOP_PATH}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: locale === "de" ? "de-AT" : locale,
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: gruppen.length,
      itemListElement: gruppen.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/${locale}${g.href}`,
        name: g.label,
      })),
    },
  };
}
