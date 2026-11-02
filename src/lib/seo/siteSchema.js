// src/lib/seo/siteSchema.js
// Site-wide JSON-LD (Organization + FurnitureStore, WebSite) as ONE builder,
// so the layout no longer hand-types address, phone, hours and brand list.
// Rendered by src/app/[locale]/layout.js as <JsonLd data={siteSchema()} />
// (R5-shell-seo; the inline copy with 17 `brand` entries is gone).
//
// Sources (import only, nothing is re-typed here):
//   - name, legal name, URL, phone, e-mail, address, geo, service area,
//     social profiles, Google Business Profile → src/lib/site.js
//   - opening hours → openingHoursSpecification() in src/lib/site.js
//     (LocalBusiness hours = Footer = Kontakt, Design-Bibel §9)
//   - dealer filter → src/lib/legal/claims.js (isVerifiedDealerBrand)
//
// Brand rule (UWG, R4-seo): schema.org `brand` on the business reads as "the
// brands this business maintains/is associated with". Only a brand with a
// verified dealer listing (CLAIM_REGISTER: ClassiCon, and Ezarri since
// Inhaber-Entscheidung Nr. 7, 28.10.2026) is given as `brand`, under the same
// @id as its brand pages and the Ezarri world (brandNodeId(slug) → one merged
// entity). Every other showroom brand is named neutrally under `knowsAbout`
// (what the studio advises on) — no dealer or partner wording anywhere.
// Inhaber-Entscheidungen Nr. 19/21/22 (31.10.2026): Minotti (showroom brand,
// own brand page → @id) and the seven Bad-&-Wellness dealer brands. Those are
// NOT showroom brands (no showroom area before summer 2027) → own list
// DEALER_ONLY_BRANDS (never SHOWROOM_BRANDS, so no showroom statement). They
// have no brand page in the backoffice; their Brand node is defined by the
// ItemList on /bad-wellness (src/components/BadWellness/BadWellnessPage.js,
// brandNodeId(slug)) → same @id here, one merged entity. Inhaber-Entscheidung
// Nr. 24 (31.10.2026): the six kitchen-appliance dealer brands likewise
// (Brand nodes from the ItemList on /kuechengeraete).
//
// Café (F6): the café is in the same house (messages: "Ausstellung und Café
// liegen im selben Haus") with the same opening hours (OPENING_HOURS in
// site.js is "showroom and café") → `containsPlace` CafeOrCoffeeShop with
// only those facts (address, hours, phone). No menu, cuisine or prices.
//
// areaServed (F6, Runde 3 P5): regions instead of whole countries, plus the
// cities whose region page passes the doorway audit (src/lib/seo/sitemap/
// doorwayAudit.js) – a failing (noindex) city is left out, so the schema never
// advertises a local page we ask Google not to index.
//
// Never: aggregateRating/review (no own review data on the site, Masterplan
// AP6 Nr. 3) or offers/prices.
//
// Pure module (relative imports only), so node --test can load it
// (tests/unit/r4-seo.test.mjs).
import {
  ADDRESS,
  AREA_SERVED,
  EMAIL,
  GBP,
  GEO,
  LEGAL_NAME,
  PHONE_DISPLAY,
  SITE_NAME,
  SITE_URL,
  SOCIAL,
  openingHoursSpecification,
} from "../site.js";
import { dealerStudio, isVerifiedDealerBrand, toBrandSlug } from "../legal/claims.js";
import { brandNodeId } from "./brandSchema.js";
import { passesDoorwayAudit } from "./sitemap/doorwayAudit.js";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Brands shown and planned in the showroom (the list the layout carried
// since R1). Order = display order. Edit here only.
export const SHOWROOM_BRANDS = Object.freeze([
  "Minotti", "Poliform", "Rimadesio", "Flos", "Paola Lenti", "Tom Dixon",
  "Eichholtz", "Gloster", "Tonon", "ClassiCon", "next125", "Tréca",
  "101 Copenhagen", "Tuuci", "Trapa", "Umbrosa", "solpuri", "Ezarri",
]);

// Kern-USP (Inhaber-Entscheidung Nr. 8): Handzeichnung, Raummodell, dann 3D
// und Rendering. Plain text topics next to the neutral brands in knowsAbout.
export const KNOWS_ABOUT_TOPICS = Object.freeze([
  "Interior Design",
  "Einrichtungsplanung mit Handzeichnung",
  "Raummodelle im Maßstab",
  "3D-Einrichtungsplanung",
  "Fotorealistisches Rendering",
]);

/** City slug as in the region landing pages (/designermoebel-<slug>). */
const citySlug = (name) => toBrandSlug(name);

/** Cities of AREA_SERVED whose region page is indexable (doorway audit). */
export function indexableCities(cities = AREA_SERVED.cities) {
  return cities.filter((name) => passesDoorwayAudit(`/designermoebel-${citySlug(name)}`));
}

/** Alternate names of the business (GEO W3). */
export const ORGANIZATION_ALTERNATE_NAMES = Object.freeze([
  "Platzhirsch Studio",
  "Platzhirsch Home Living Lochau",
  "Minotti Studio by Platzhirsch Home Living",
]);

/** Short disambiguation (schema.org disambiguatingDescription, llms.txt). */
export const DISAMBIGUATION_DE =
  "Einrichtungsstudio für Designermöbel und Interior Design in Lochau (Vorarlberg) mit eigenem Café im Haus; nicht zu verwechseln mit gleichnamigen Gastronomiebetrieben in anderen Orten.";

export const CAFE_ID = `${SITE_URL}/#cafe`;

/** Split of SHOWROOM_BRANDS by the dealer filter: { dealer: [...], neutral: [...] }. */
export function splitBrandsByDealerFilter(brands = SHOWROOM_BRANDS) {
  const dealer = [];
  const neutral = [];
  for (const name of brands) (isVerifiedDealerBrand(name) ? dealer : neutral).push(name);
  return { dealer, neutral };
}

// Bad-&-Wellness dealer brands (Inhaber-Entscheidungen Nr. 19/21): dealer
// statement allowed, NOT in the showroom yet. Agape is not a dealer brand.
// Kitchen-appliance dealer brands (Inhaber-Entscheidung Nr. 24, 31.10.2026):
// dealer statement allowed, no showroom statement (the owner confirmed only
// "some" of them in display kitchens) → also here, never in SHOWROOM_BRANDS.
// Their Brand node is the ItemList on /kuechengeraete (brandNodeId(slug)).
export const DEALER_ONLY_BRANDS = Object.freeze([
  "Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura",
  "Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker",
  // Accessoire-Welt (Inhaber-Entscheidungen Nr. 27/28, 31.10.2026): dealer
  // statement allowed; no showroom-brand statement → not in SHOWROOM_BRANDS.
  "Baobab Collection", "Riedel", "Cire Trudon",
  // Inhaber-Entscheidung Nr. 32 (31.10.2026): further accessory dealer brands.
  // Flos and Tom Dixon (also Nr. 32) are SHOWROOM_BRANDS with own brand pages,
  // so the dealer filter moves them into `brand` like Minotti.
  "Zalto", "Assouline", "Kähler", "Lyngby Porcelæn",
]);

/** Verified dealer brands outside the showroom list (dealer filter applied, no duplicates). */
export function dealerOnlyBrands(brands = DEALER_ONLY_BRANDS) {
  const shown = new Set(SHOWROOM_BRANDS.map(toBrandSlug));
  return brands.filter((name) => isVerifiedDealerBrand(name) && !shown.has(toBrandSlug(name)));
}

export const SITE_DESCRIPTION =
  "Platzhirsch Home Living – Einrichtungsstudio in Lochau (Vorarlberg) für Designmöbel, Interior Design und persönliche Einrichtungsberatung, mit Café. Harald Menghin zeichnet Einrichtungskonzepte von Hand und baut Raummodelle, danach folgen 3D-Planung und fotorealistisches Rendering. Wir planen mit internationalen Marken wie Minotti, Poliform und Rimadesio; Lieferung und Montage auf Wunsch.";

// Runde 3 P5 (r3-seo P2-5, Inhaber-Entscheidung Nr. 3): areaServed names
// REGIONS, not whole countries – "Österreich, Deutschland, Schweiz" read like
// a delivery promise for the whole country. The regions are the ones the
// indexable region pages cover (Bodensee, Rheintal, Ostschweiz, Allgäu edge
// excluded), Liechtenstein as a whole (small, own region page).
export const SERVED_REGIONS = Object.freeze([
  { "@type": "AdministrativeArea", name: "Vorarlberg" },
  { "@type": "Place", name: "Bodensee" },
  { "@type": "Place", name: "Rheintal" },
  { "@type": "Place", name: "Ostschweiz" },
  { "@type": "Country", name: "Liechtenstein" },
]);

// Cities with an own, indexable region page (doorway audit). Name → page.
const REGION_CITIES = Object.freeze([
  ...AREA_SERVED.cities.map((name) => ({ name, path: `/designermoebel-${citySlug(name)}` })),
  { name: "Feldkirch", path: "/designermoebel-feldkirch" },
  { name: "Konstanz", path: "/designermoebel-konstanz" },
  { name: "Vaduz", path: "/designermoebel-liechtenstein" },
]);

/** areaServed: regions (no whole countries) + cities with an indexable page. */
export function areaServed() {
  return [
    ...SERVED_REGIONS.map((r) => ({ ...r })),
    ...REGION_CITIES.filter((c) => passesDoorwayAudit(c.path)).map(({ name }) => ({ "@type": "City", name })),
  ];
}

/** Minotti press release node (CLAIM_REGISTER "minotti-studio"), or null. */
export function minottiPress() {
  const studio = dealerStudio("minotti", "de");
  if (!studio?.evidenceUrl) return null;
  return {
    "@type": "NewsArticle",
    url: studio.evidenceUrl,
    headline: "Minotti weiht das neue Minotti Studio by Platzhirsch Home Living ein",
    datePublished: "2019-07",
    publisher: { "@type": "Organization", name: "Minotti", url: "https://www.minotti.com" },
    about: { "@id": ORGANIZATION_ID },
  };
}

/** The Organization + FurnitureStore (LocalBusiness subtype) node. */
export function organizationNode() {
  const { dealer, neutral } = splitBrandsByDealerFilter();
  const brand = [...dealer, ...dealerOnlyBrands()].map((name) => ({ "@type": "Brand", "@id": brandNodeId(toBrandSlug(name)), name }));
  return {
    "@type": ["Organization", "FurnitureStore"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    // GEO W3 (31.10.2026): name disambiguation – "Platzhirsch" alone matches
    // other businesses in AI answers. The studio name is backed by the Minotti
    // press release (CLAIM_REGISTER "minotti-studio").
    alternateName: [...ORGANIZATION_ALTERNATE_NAMES],
    disambiguatingDescription: DISAMBIGUATION_DE,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/Images/Navbar/Logo.png` },
    image: `${SITE_URL}/Images/Footer/PlatzImage.png`,
    description: SITE_DESCRIPTION,
    telephone: PHONE_DISPLAY,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      addressCountry: ADDRESS.countryCode,
    },
    priceRange: "€€€",
    currenciesAccepted: "EUR",
    // Google Business Profile listing (cid = the place id 0x9006009a275bf15e).
    hasMap: GBP.mapsUrl,
    geo: { "@type": "GeoCoordinates", latitude: GEO.latitude, longitude: GEO.longitude },
    areaServed: areaServed(),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_DISPLAY,
      email: EMAIL,
      contactType: "customer service",
      // Same regions as the store (r3-seo P2-5: "AT" alone contradicted it).
      areaServed: SERVED_REGIONS.map((r) => ({ ...r })),
      availableLanguage: ["German", "English", "Italian", "French"],
    },
    ...(brand.length ? { brand } : {}),
    knowsAbout: [...KNOWS_ABOUT_TOPICS, ...neutral.map((name) => ({ "@type": "Brand", name }))],
    openingHoursSpecification: openingHoursSpecification(),
    containsPlace: cafeNode(),
    // GEO W2: the Minotti press release on the opening of the studio (2019) as
    // source, URL from CLAIM_REGISTER (no second copy). No foundingDate: the
    // founding year of the company is not documented in the repo.
    ...(minottiPress() ? { subjectOf: minottiPress() } : {}),
    // Real profiles only: the social accounts from site.js plus the Google
    // Business Profile.
    sameAs: [...SOCIAL.map((s) => s.href), GBP.mapsUrl],
  };
}

// Öffentliche Profile des Cafés (geprüft 30.10.2026 über SISTRIX und die Seiten selbst).
export const CAFE_PROFILE = Object.freeze({
  name: "Platzhirsch Café, Restaurant & Bar",
  alternateName: Object.freeze(["Platzhirsch Café Lounge", "Café Platzhirsch Lochau"]),
  url: "https://platzhirsch.cafe/",
  // Eigene Kontaktdaten des Cafés laut platzhirsch.cafe (JSON-LD + Seite, geprüft 31.10.2026),
  // gleichlautend bei Lochau Tourismus – NICHT die Showroom-Nummer/-Zeiten.
  telephone: "+43 5574 46257",
  openingHours: Object.freeze({ days: Object.freeze(["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]), opens: "09:00", closes: "24:00" }),
  openingLineDe: "Dienstag bis Sonntag 9–24 Uhr, Montag Ruhetag",
  sameAs: Object.freeze([
    "https://platzhirsch.cafe/",
    "https://www.facebook.com/platzhirsch.cafe.lounge/",
    "https://www.tripadvisor.at/Restaurant_Review-g1214785-d15685355-Reviews-Platzhirsch_Cafe_Lounge-Lochau_Vorarlberg_Austrian_Alps.html",
    "https://tourismus.lochau.at/cafe-platzhirsch.html",
  ]),
});

/** The café in the same house (only facts the site states). */
export function cafeNode() {
  return {
    "@type": "CafeOrCoffeeShop",
    "@id": CAFE_ID,
    // Inhaber 30.10.2026: das Café im Haus ist das eigene „Platzhirsch Café“
    // (platzhirsch.cafe, gleiche GmbH und Adresse). Name wie auf platzhirsch.cafe,
    // dazu die Einträge, unter denen Google es kennt – so erkennt Google Café und
    // Showroom als ein Unternehmen statt als zwei „Platzhirsch“ in Lochau.
    name: CAFE_PROFILE.name,
    alternateName: CAFE_PROFILE.alternateName,
    url: CAFE_PROFILE.url,
    sameAs: [...CAFE_PROFILE.sameAs],
    parentOrganization: { "@id": ORGANIZATION_ID },
    image: `${SITE_URL}/Images/Footer/PlatzImage.png`,
    telephone: CAFE_PROFILE.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      addressCountry: ADDRESS.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: GEO.latitude, longitude: GEO.longitude },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...CAFE_PROFILE.openingHours.days],
        opens: CAFE_PROFILE.openingHours.opens,
        closes: CAFE_PROFILE.openingHours.closes,
      },
    ],
    containedInPlace: { "@id": ORGANIZATION_ID },
  };
}

/** WebSite node. */
export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: ["de-AT", "en", "fr-FR", "it-IT"],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

// Organization fields a caller may name explicitly. Only values that come
// from site.js anyway (the business times); brand, rating, address etc. stay
// owned by organizationNode() and are ignored if passed.
const ORGANIZATION_OVERRIDABLE = new Set(["openingHoursSpecification"]);

/**
 * Full site-wide JSON-LD document for <JsonLd data={siteSchema()} />.
 * The layout passes openingHoursSpecification() from site.js so the source
 * of the times stays visible there; every other key is dropped.
 */
export function siteSchema(organization = {}) {
  const extra = Object.fromEntries(
    Object.entries(organization).filter(([key]) => ORGANIZATION_OVERRIDABLE.has(key)),
  );
  return { "@context": "https://schema.org", "@graph": [{ ...organizationNode(), ...extra }, websiteNode()] };
}
