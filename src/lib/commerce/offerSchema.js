// src/lib/commerce/offerSchema.js
// JSON-LD Product + Offer für ein Atelier-Stück (Masterplan AP9 Nr. 2).
// Nur für ECHTE Daten: Das Stück muss aus dem Sheet kommen (origin "sheet",
// atelierSource.js), Status "verfuegbar" haben und einen gültigen Preis.
// Sonst null: kein Schema aus Platzhaltern, kein Schema im Leerzustand.
//
// Bewusst NICHT enthalten:
//   - aggregateRating / review (keine echten Bewertungen am Stück)
//   - itemCondition bei Ausstellungsstücken: ob ein Ausstellungsstück
//     "gebraucht" ist, ist rechtlich offen (Rechtspaket W7). Das Feld bleibt
//     weg, bis die Kanzlei das klärt [anwaltlich prüfen]. Der Zustand steht
//     als Text in `description`.
//   - ein Vergleichspreis (keine Streichpreise, W8)
//   - Händler-Formulierungen: `brand` nennt nur den Hersteller, der Verkäufer
//     ist die eigene Organisation.
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { schemaPrice } from "./priceRules.js";

const SITE_URL = "https://platzhirsch.studio";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const atelierItemUrl = (slug) => `${SITE_URL}/de/atelierverkauf/${slug}`;

const absolute = (src) => (src && src.startsWith("/") ? `${SITE_URL}${src}` : src);

/** Product-Objekt (ohne @context) oder null. */
export function atelierProductSchema(item) {
  if (!item || item.origin !== "sheet" || item.status !== "verfuegbar") return null;
  const price = schemaPrice(item.preis);
  if (!price || !item.slug || !item.titel) return null;
  const url = atelierItemUrl(item.slug);
  const offer = {
    "@type": "Offer",
    url,
    price,
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    seller: { "@id": ORGANIZATION_ID },
    ...(item.preisGueltigBis ? { priceValidUntil: item.preisGueltigBis } : {}),
  };
  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: item.titel,
    description: `Ausstellungsstück aus unserem Showroom in Lochau. Zustand: ${item.zustand}`.slice(0, 5000),
    url,
    ...(item.marke ? { brand: { "@type": "Brand", name: item.marke } } : {}),
    ...(item.kategorie ? { category: item.kategorie } : {}),
    ...(item.foto ? { image: [absolute(item.foto)] } : {}),
    offers: offer,
  };
}

/** Komplettes JSON-LD-Dokument oder null. */
export function atelierJsonLd(item) {
  const product = atelierProductSchema(item);
  return product ? { "@context": "https://schema.org", ...product } : null;
}
