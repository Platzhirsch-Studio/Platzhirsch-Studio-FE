// SEO der Werkzeugseiten (Fix-Runde 1, F2, Auftrag 9): je Seite og:image und
// JSON-LD aus WebPage, BreadcrumbList und WebApplication. Nutzt die Helfer aus
// src/lib/seo nur lesend (breadcrumbList, graph, IDs). Alle Werkzeuge sind
// deutsch, kostenlos nutzbar und zeigen keine Preise (kein Offer mit Preis).
// og:image: eigene Ansichten der Werkzeuge (public/labs/og/<id>.jpg, 1200 × 630,
// erzeugt mit src/components/Labs/Hub/tools/og.mjs), kein Herstellerbild.
import JsonLd from "@/components/Reusable/JsonLd";
import { ORGANIZATION_ID, SITE_NAME, SITE_URL, WEBSITE_ID, breadcrumbList, graph } from "@/lib/seo/structuredData";
import { deOnlyMetadata } from "@/lib/seo/pageMetadata";
import { SOURCE_COPY } from "@/lib/sofaplaner/consent";

const OVERVIEW = { name: "Planen & Erleben", url: "/de/leistungen" };

export const WERKZEUGE = {
  // SEO Küchenplaner (31.10.2026): featureList nur mit Funktionen, die der Planer hat (catalog.js, checks.js, druck/).
  kuechenplaner: {
    path: "/de/kuechenplaner",
    name: "Küchenplaner",
    category: "DesignApplication",
    alt: "Küchenplaner: L-Küche im Grundriss mit Modulen und Maßen",
    features: [
      "Grundformen Zeile, L-Form, U-Form, zweizeilig, Insel und Halbinsel oder freie Raumform",
      "Fenster, Türen, Anschlüsse und Dachschräge",
      "Module per Drag & Drop im 60-cm- oder 55-cm-Raster (SMS)",
      "Fronten, Farben und Arbeitsplatten in der 3D-Ansicht",
      "Prüfung von Laufwegen, Arbeitsdreieck, Arbeitshöhe und Kollisionen mit Quellenangabe",
      "Stückliste, Druckansicht als PDF, Variantenvergleich und Teilen-Link",
    ],
  },
  sofaplaner: {
    path: "/de/sofaplaner",
    name: SOURCE_COPY.seoName,
    category: "DesignApplication",
    alt: "Sofaplaner: Ecksofa im Grundriss eines Raums mit Maßen",
    // SEO (seo-inhalte): Funktionen und Bezug zur Marke (nur mit Zustimmung, consent.js) für Suche und KI-Antworten.
    features: ["Sofa aus Elementen zusammenstellen", "Maße im eigenen Grundriss prüfen", "Laufwege prüfen", "3D-Vorschau", "Plan für den Termin im Showroom"],
    about: SOURCE_COPY.brand ? "minotti" : null,
  },
  "stil-finder": { path: "/de/stil-finder", name: "Stil-Finder", category: "LifestyleApplication", alt: "Stil-Finder: Farbpaletten und Materialien für den eigenen Einrichtungsstil" },
  "3d-ansicht": { path: "/de/3d-ansicht", name: "Möbel in 3D & AR ansehen", category: "DesignApplication", alt: "3D-Ansicht: Beispielmodell eines Sessels mit eingeblendeten Maßen" },
  "dreilaender-rechner": { path: "/de/dreilaender-rechner", name: "Dreiländer-Rechner", category: "FinanceApplication", alt: "Dreiländer-Rechner: Karte mit Lochau und Orten in vier Ländern" },
  concierge: { path: "/de/concierge", name: "KI-Concierge", category: "LifestyleApplication", alt: "KI-Concierge: Beispielgespräch, als KI gekennzeichnet" },
  "bodensee-licht": { path: "/de/bodensee-licht", name: "Bodensee-Licht", category: "DesignApplication", alt: "Bodensee-Licht: Sonnenstand über dem See und Lichteinfall im Raum" },
  // Runde 4 (ux P0-1): kein Versprechen eines 3D-Raums – der Rundgang ist erst mit echter Aufnahme öffentlich.
  showroom: { path: "/de/showroom", name: "Showroom-Rundgang", category: "LifestyleApplication", alt: "Showroom in Lochau: Grundriss der Ausstellung mit Stationen" },
  leistungen: { path: "/de/leistungen", name: "Planen & Erleben", category: null, alt: "Werkzeuge von Platzhirsch: Küchenplaner, Sofaplaner und 3D-Ansicht" },
};

// Rat 9,5 B20 (Auftrag T6 → T2): Teilen-Bilder liegen unter /og/ (public/og).
export const ogImage = (id) => `${SITE_URL}/og/${id}.jpg`;

/**
 * Teil-Metadaten für openGraph/twitter mit og:image. In die Seitenmetadaten mischen:
 * `{ ...meta, ...werkzeugOg("kuechenplaner", { title, description }) }`.
 */
export function werkzeugOg(id, { title, description } = {}) {
  const w = WERKZEUGE[id];
  const image = { url: ogImage(id), width: 1200, height: 630, alt: w.alt };
  return {
    openGraph: {
      type: "website",
      url: `${SITE_URL}${w.path}`,
      title: title || w.name,
      ...(description ? { description } : {}),
      siteName: SITE_NAME,
      locale: "de_AT",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: title || w.name, ...(description ? { description } : {}), images: [image.url] },
  };
}

/**
 * Vollständige Metadaten einer Werkzeugseite (Release-Rat R2, seo P2-3/P2-4):
 * deOnlyMetadata() – canonical, hreflang de + x-default, Title ≤ 65 und
 * Description ≤ 165 – plus das eigene og:image des Werkzeugs (1200 × 630).
 * `title` ist der volle <title>, `ogTitle` optional der kürzere Teilen-Titel.
 */
export function werkzeugMetadata(id, { title, description, ogTitle, robots } = {}) {
  const w = WERKZEUGE[id];
  const meta = deOnlyMetadata({
    path: w.path.slice(3),
    title,
    description,
    ogTitle: ogTitle || w.name,
    image: ogImage(id),
    imageAlt: w.alt,
    ...(robots ? { robots } : {}),
  });
  const image = { url: ogImage(id), width: 1200, height: 630, alt: w.alt };
  return { ...meta, openGraph: { ...meta.openGraph, images: [image] }, twitter: { ...meta.twitter, images: [image.url] } };
}

/** JSON-LD-Graph einer Werkzeugseite. */
export function werkzeugSchema(id, { description } = {}) {
  const w = WERKZEUGE[id];
  const url = `${SITE_URL}${w.path}`;
  const crumbs = [{ name: "Startseite", url: "/de" }, ...(id === "leistungen" ? [] : [OVERVIEW]), { name: w.name }];
  const page = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: w.name,
    ...(description ? { description } : {}),
    inLanguage: "de-AT",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: ogImage(id), width: 1200, height: 630 },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
  const app = w.category
    ? {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: w.name,
        url,
        applicationCategory: w.category,
        operatingSystem: "Webbrowser",
        browserRequirements: "Aktueller Browser mit JavaScript",
        inLanguage: "de-AT",
        isAccessibleForFree: true,
        image: ogImage(id),
        ...(w.features ? { featureList: w.features } : {}),
        ...(description ? { description } : {}),
        // Brand-Knoten aus dem Organization-Graph (brandSchema.js: #brand/<slug>).
        ...(w.about ? { about: { "@id": `${SITE_URL}/#brand/${w.about}` } } : {}),
        provider: { "@id": ORGANIZATION_ID },
      }
    : null;
  if (app) page.mainEntity = { "@id": app["@id"] };
  return graph(page, breadcrumbList(crumbs, `${url}#breadcrumb`), app);
}

/** <script type="application/ld+json"> für eine Werkzeugseite. */
export function WerkzeugJsonLd({ id, description }) {
  return <JsonLd data={werkzeugSchema(id, { description })} />;
}
