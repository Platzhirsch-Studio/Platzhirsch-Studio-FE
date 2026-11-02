// src/components/Katalog/katalogSchema.js
// JSON-LD des Herstellerkatalogs. Regel (r4-seo, f6-seo): NIE offers, price,
// aggregateRating oder review – nur name, brand, image, description, category
// (+ url, @id). Bewusste Ausnahme (Inhaber-Entscheidungen Nr. 26/27): ein
// Offer/AggregateOffer NUR, wenn das Produkt einen anzeigbaren Preis hat
// (Küchengeräte-UVP, Baobab-Verkaufspreis; preisOffer() in preis.js).
// aggregateRating/review nie. Rein, ohne "@/"-Importe (tests/unit/wellness-produkte.test.mjs).
import { produktPath, produktePath, markePath } from "../../lib/katalog/welten.js";
import { textOf } from "../../lib/katalog/schema.js";

const SITE = "https://platzhirsch.studio";
const abs = (locale, path) => `${SITE}/${locale}${path}`;

/** Brand-Knoten wie src/lib/seo/brandSchema.js (brandNodeId). */
const brandId = (slug) => `${SITE}/#brand/${slug}`;

/**
 * Product-Knoten für die Detailseite.
 * @param {object} p           Produkt (mit welt)
 * @param {object} marke       MARKE
 * @param {string} locale
 * @param {string} kategorieLabel
 * @param {object|null} [offer]  nur mit anzeigbarem Preis (preisOffer)
 */
export function produktSchema(p, marke, locale, kategorieLabel, offer = null) {
  const url = abs(locale, produktPath(p.welt, p.slug));
  const node = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    url,
    name: p.name,
    brand: { "@type": "Brand", "@id": brandId(marke.slug), name: marke.name },
    description: textOf(p.kurz, locale),
    category: kategorieLabel,
  };
  if (p.bilder.length) node.image = p.bilder.map((b) => `${SITE}${b.src}`);
  if (offer) node.offers = offer;
  return node;
}

/** ItemList der Produkte (Übersicht/Markenseite): nur Verweise, keine Product-Details. */
export function produktListeSchema(list, locale, { name, path }) {
  const url = abs(locale, path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name,
    inLanguage: locale === "de" ? "de-AT" : locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(locale, produktPath(p.welt, p.slug)), name: p.name })),
    },
  };
}

export { produktePath, markePath, produktPath };
