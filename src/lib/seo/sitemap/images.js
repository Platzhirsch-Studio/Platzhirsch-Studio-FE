// src/lib/seo/sitemap/images.js – Bild-Einträge der Sitemaps (Bilder-SEO, 31.10.2026).
//
// Google-Bildersitemap: je <url> bis zu 1 000 <image:image><image:loc>…
// (Namespace http://www.google.com/schemas/sitemap-image/1.1, Next-Doku
// metadata/sitemap „Image Sitemaps“: Feld `images` je Eintrag). Die Bilder
// hängen an den VORHANDENEN Einträgen von sitemap-static.xml – keine eigene
// sitemap-images.xml, weil jede URL in genau einer Sitemap steht (Regel aus
// sitemapEntries.js; Crawler und Tests werten doppelte <loc> als Fehler).
//
// Welche Bilder (nur solche, die die Seite wirklich zeigt, und nur mit
// geklärter Herkunft – Bilder ohne Freigabe werden nicht beworben):
//   - Herstellerkatalog (/bad-wellness/…, /kuechengeraete/…, /accessoires/…):
//     Produktseite = alle Bilder des Produkts; Übersicht/Kategorie/Marke = das
//     erste Bild jeder Kachel auf genau dieser Seite (gleiche Auswahl wie
//     KatalogListe.js: Übersicht ≤ UEBERSICHT_JE_KATEGORIE je Kategorie,
//     sonst die Seite seiteVon()).
//   - /bad-wellness: Auftaktbild, Markenbilder, „Ausgewählte Produkte“.
//   - /kuechengeraete: Markenbilder.
//   - Statische Seiten: eigene Fotos aus dem Urheber-Register dort, wo sie
//     erscheinen (Startseite, Kontakt, Bregenz) und Haralds Material auf
//     /arbeitsweise (media.js, sobald importiert).
//   - Backoffice-Marken/-Produkte: KEINE Bilder. get_produkte_paths liefert
//     keine Bildfelder, eine zusätzliche Backoffice-Anfrage je Seite ist nicht
//     erlaubt (Backoffice für diese IP gesperrt).
//   - Seiten mit X-Robots-Tag noimageindex (next.config.js: 3d-ansicht,
//     sofaplaner, stil-finder) bekommen nie Bilder.
//
// Rein, nur relative Importe (node --test).
import {
  katalogPfade,
  produktBySlug,
  produkteByKategorie,
  produkteByMarke,
  produkteByWelt,
  nachKategorie,
  seiteVon,
  ausgewaehlteProdukte,
  UEBERSICHT_JE_KATEGORIE,
} from "../../katalog/index.js";
import { HERO_IMAGE as BW_HERO, ALLE_MARKEN as BW_MARKEN, BAD_WELLNESS_PATH } from "../../wellness/marken.js";
import { GERAETE_MARKEN, GERAETE_PATH } from "../../kueche/geraete.js";
import { MEDIA, KETTE, WERKZEUG_BEISPIEL } from "../../arbeitsweise/media.js";
import { STATIC_IMAGE_RIGHTS } from "../imageRights.js";
import { leitbild, mitDetailBild } from "../../../components/Katalog/kachelBild.js";
import { BASE_URL, IMAGE_NS, MAX_IMAGES_PER_URL } from "./xml.js";

/** Sitemaps-Protokoll: höchstens 50 000 URLs je Datei. */
export const MAX_URLS_PER_FILE = 50000;
export { IMAGE_NS, MAX_IMAGES_PER_URL };

/** Seiten, deren Bilder nicht in den Bildindex sollen (next.config.js, X-Robots-Tag noimageindex). */
export const NOIMAGEINDEX_PATHS = Object.freeze(["/3d-ansicht", "/sofaplaner", "/stil-finder"]);

const LOCALES = ["de", "en", "fr", "it"];

/** "/Images/x y.jpg" → absolute, kodierte URL; fremde Hosts → null. */
export function absoluteImageUrl(src) {
  if (!src || typeof src !== "string") return null;
  if (/^https?:\/\//i.test(src)) return src.startsWith(BASE_URL) ? src : null;
  if (!src.startsWith("/")) return null;
  return `${BASE_URL}${encodeURI(src)}`;
}

/** Absolute, eindeutige Bild-URLs, höchstens MAX_IMAGES_PER_URL. */
export function cleanImages(list) {
  const out = [];
  const seen = new Set();
  for (const src of list) {
    const url = absoluteImageUrl(src);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= MAX_IMAGES_PER_URL) break;
  }
  return out;
}

// QM R1: Listen und Teaser zeigen das Kachelbild (kachelBild.js – z. B. Dornbracht-Freisteller), nicht immer bilder[0].
// Inhaber 03.11.2026: Listen = Kachelbild (leitbild); Produktseite = ihr Hero zuerst (detailBild: Raumbild >
// Freisteller > bilder[0], wie og:image und JSON-LD), danach die übrigen Bilder (mitDetailBild).
const firstImage = (p) => leitbild(p)?.src;

/** Bilder einer Katalogseite (Eintrag aus katalogPfade()). */
export function katalogImages(entry) {
  const seite = entry.seite || 1;
  if (entry.typ === "produkt") return mitDetailBild(produktBySlug(entry.slug)).map((b) => b.src);
  if (entry.typ === "kategorie") return seiteVon(produkteByKategorie(entry.welt, entry.kategorie), seite).map(firstImage);
  if (entry.typ === "marke") return seiteVon(produkteByMarke(entry.marke, entry.welt), seite).map(firstImage);
  // Übersichten (auch die Shop-Liste /kuechengeraete/produkte, KatalogShopListe: kachelBild) zeigen das Leitbild.
  if (entry.typ === "uebersicht") return nachKategorie(produkteByWelt(entry.welt)).flatMap((g) => g.produkte.slice(0, UEBERSICHT_JE_KATEGORIE).map(firstImage));
  return [];
}

/** Bilder der Weltseite /bad-wellness (Reihenfolge wie BadWellnessPage). */
export function badWellnessImages() {
  return [BW_HERO?.src, ...BW_MARKEN.flatMap((m) => [m.image?.src, ...(m.moreImages || []).map((i) => i.src)]), ...ausgewaehlteProdukte("bad-wellness", 4).map(firstImage)];
}

/** Bilder der Seite /kuechengeraete (Markenkarten). */
export function kuechengeraeteImages() {
  return GERAETE_MARKEN.map((m) => m.image?.src);
}

/** Haralds Material auf /arbeitsweise (nur echte, importierte Slots) bzw. das Werkzeug-Beispiel. */
export function arbeitsweiseImages(media = MEDIA, kette = KETTE) {
  const slots = Object.values(media || {}).filter((s) => s?.src && s.probelauf !== true);
  const chain = ["vorher", "skizze", "modell", "rendering", "umsetzung"].map((k) => kette?.[k]).filter((s) => s?.src && s.probelauf !== true);
  const list = [...slots, ...chain].flatMap((s) => [s.src, s.srcMobile]);
  if (!media?.planung3d?.src && WERKZEUG_BEISPIEL.planung3d) list.push(WERKZEUG_BEISPIEL.planung3d.src);
  return list;
}

const ownPhoto = (datei) => STATIC_IMAGE_RIGHTS.find((e) => e.datei === datei)?.datei;

/**
 * Statische Seiten mit Bildern: Pfad OHNE Locale (je Sprache die übersetzten
 * Varianten) → Bildliste. Nur Bilder, die die Seite zeigt (live geprüft,
 * Bericht qa-screenshots/bilder-seo/bericht.md).
 */
export function staticPageImages() {
  const about = ownPhoto("/Images/Home/aboutHome.jpg");
  return {
    "": [about], // Startseite: Hero (Hero.js HERO_IMAGE)
    "/kontakt": [about], // Kontakt: PageHeader (CONTACT_IMAGE)
    "/contact": [about],
    "/contatto": [about],
    "/designermoebel-bregenz": [about], // Intro-Bild (Landing/imagery.js)
    [BAD_WELLNESS_PATH]: badWellnessImages(),
    [GERAETE_PATH]: kuechengeraeteImages(),
    "/arbeitsweise": arbeitsweiseImages(),
  };
}

/** Pfad ohne Locale aus einer absoluten Seiten-URL ("https://…/de/kontakt" → "/kontakt", Startseite → ""). */
export function pathWithoutLocale(url) {
  const path = String(url).replace(BASE_URL, "");
  const m = path.match(/^\/(de|en|fr|it)(\/.*)?$/);
  if (!m) return null;
  return m[2] || "";
}

let katalogMap = null;
function katalogImageMap() {
  if (!katalogMap) katalogMap = new Map(katalogPfade().map((e) => [e.path, katalogImages(e)]));
  return katalogMap;
}

/** Bild-URLs für eine Seiten-URL (absolut, eindeutig, ≤ 1 000), sonst []. */
export function imagesForUrl(url, pages = staticPageImages()) {
  const path = pathWithoutLocale(url);
  if (path == null) return [];
  if (NOIMAGEINDEX_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return [];
  const list = pages[path] || katalogImageMap().get(path) || [];
  return cleanImages(list);
}

/** Hängt `images` an Sitemap-Einträge ({url, …}); Einträge ohne Bilder bleiben unverändert. */
export function withImages(entries) {
  const pages = staticPageImages();
  return entries.map((entry) => {
    const images = imagesForUrl(entry.url, pages);
    return images.length ? { ...entry, images } : entry;
  });
}

export { LOCALES as IMAGE_LOCALES };
export { imageXml } from "./xml.js";
