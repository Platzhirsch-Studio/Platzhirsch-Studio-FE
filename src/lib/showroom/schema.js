// src/lib/showroom/schema.js – JSON-LD der Seite /[locale]/showroom (N1).
//
// Ein @graph: WebPage, FurnitureStore (gleiche @id wie der seitenweite Knoten
// aus src/lib/seo/siteSchema.js, damit Google beide zusammenführt; Adresse
// Landstraße 11, 6911 Lochau aus src/lib/site.js) und – nur wenn das Manifest
// ein Video hat – VideoObject der Kamerafahrt. Keine Bewertungen, keine Preise.
// Rein, ohne "@/"-Aliase (node --test).
import { ADDRESS, GBP, GEO, SITE_NAME, SITE_URL } from "../site.js";
import { SHOWROOM_PATH } from "./config.js";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const abs = (p) => (p ? (p.startsWith("http") ? p : `${SITE_URL}${p}`) : undefined);
const IN_LANGUAGE = { de: "de-AT", en: "en-GB", fr: "fr", it: "it" };

/** Sekunden → ISO-8601-Dauer (PT1M5S). */
export function isoDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  return `PT${m ? `${m}M` : ""}${s % 60}S`;
}

/**
 * @param {{ locale: string, title: string, description: string, tour: object, aufnahmeDatum?: string }} p
 */
export function showroomSchema({ locale, title, description, tour, aufnahmeDatum }) {
  const url = `${SITE_URL}/${locale}${SHOWROOM_PATH}`;
  const store = {
    "@type": "FurnitureStore",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.region,
      addressCountry: ADDRESS.countryCode,
    },
    geo: { "@type": "GeoCoordinates", latitude: GEO.latitude, longitude: GEO.longitude },
    hasMap: GBP.mapsUrl,
  };
  const page = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: IN_LANGUAGE[locale] || "de-AT",
    about: { "@id": ORGANIZATION_ID },
    ...(tour?.poster?.webp ? { primaryImageOfPage: abs(tour.poster.webp) } : {}),
  };
  const graph = [page, store];
  const v = tour?.video;
  if (v && (v.h264 || v.av1) && (v.poster || tour.poster?.webp)) {
    const video = {
      "@type": "VideoObject",
      "@id": `${url}#video`,
      name: title,
      description,
      thumbnailUrl: [abs(v.poster || tour.poster.webp)],
      contentUrl: abs(v.h264 || v.av1),
      uploadDate: v.datum || aufnahmeDatum,
      ...(v.dauer ? { duration: isoDuration(v.dauer) } : {}),
      inLanguage: IN_LANGUAGE[locale] || "de-AT",
      contentLocation: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
    };
    graph.push(video);
    page.video = { "@id": video["@id"] };
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
