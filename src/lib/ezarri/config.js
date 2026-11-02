// src/lib/ezarri/config.js – EIN Schalter für die ganze Ezarri-Welt (/[locale]/ezarri/**).
//
//   EZARRI_PUBLIC = false  (bis 28.10.2026)
//     → alle Ezarri-Seiten robots "noindex, nofollow", nicht in Sitemap,
//       nicht in /llms.txt, nicht im Hauptmenü; Händler-Aussage
//       „Ezarri-Vertragshändler“ ausgeblendet (neutral: „Ezarri in unserer
//       Ausstellung in Lochau“).
//   EZARRI_PUBLIC = true   (mit dem Deploy des Neuauftritts, Inhaber-OK)
//     → indexierbar, Sitemap-Einträge, Händler-Aussage sichtbar.
//
// Grundlage: Marktresearch/digital/teamleiter/inhaber-entscheidungen.md Nr. 7
// (Händlervertrag und Nutzungserlaubnis laut Inhaber in den Firmenakten).
// Konzept, Teamgrenzen, SEO-Plan: Marktresearch/digital/features/ezarri-konzept.md
//
// Bewusst eine Konstante im Code (kein Env-Lookup): Freischalten ist eine
// sichtbare, prüfbare Code-Änderung in genau dieser Zeile.
//
// Rein: keine Pakete, kein "server-only", keine "@/"-Aliase. Server- und
// Client-Komponenten, Sitemap-Code und node --test dürfen es importieren.
// Jede Hilfsfunktion nimmt den Schalter als optionalen letzten Parameter,
// damit Tests beide Zustände prüfen können.

/** Hauptschalter. Nur auf true setzen mit Deploy-OK des Inhabers. */
export const EZARRI_PUBLIC = true; // Inhaber-Entscheidung Nr. 7 + Nr. 9 (28.10.2026): mit dem Neuauftritt öffentlich. Aus: false.

/** Wurzelpfad der Ezarri-Welt (nach dem Locale-Präfix). */
export const EZARRI_BASE_PATH = "/ezarri";

/**
 * Sprachen der Ezarri-WERKZEUGE ohne eigene fr/it-Fassung (Custom Mix, Anfrage;
 * Konfigurator und Rechner: konfigurator/intl.js TOOL_LOCALES). Deutsch (copy.js)
 * und seit Welle 2 (Inhaber-Auftrag 29.10.2026, Nr. 13) Englisch (copy.en.js,
 * konfigurator/copy.en.js, rechner/copy.en.js; Auswahl über lang.js).
 * Die Welt-Seiten selbst: EZARRI_WELT_LOCALES (unten, 01.11.2026 mit fr/it).
 */
export const EZARRI_LOCALES = Object.freeze(["de", "en"]);

/** Liefert die Ezarri-Welt diese Sprache aus? (Werkzeuge: Konfigurator, Rechner, Custom Mix, Anfrage) */
export function ezarriLocaleEnabled(locale) {
  return EZARRI_LOCALES.includes(locale);
}

/**
 * Sprachen der Ezarri-WELT (Hub, Einsatz-Welten, Wasser, Mosaike, Kollektionen,
 * Galerie, Vergleich, Technik). Inhaber-Auftrag 01.11.2026: zusätzlich
 * Französisch und Italienisch (copy.fr.js, copy.it.js). Die Werkzeuge
 * (Konfigurator, Rechner, Custom Mix, Anfrage) folgen weiter EZARRI_LOCALES;
 * Links dorthin zeigen auf fr/it zur englischen Fassung (deLinks.ezLinkProps).
 */
export const EZARRI_WELT_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Liefert die Ezarri-Welt (ohne Werkzeuge) diese Sprache aus? */
export function ezarriWeltLocaleEnabled(locale) {
  return EZARRI_WELT_LOCALES.includes(locale);
}

/** Pfad innerhalb der Ezarri-Welt: ezarriPath("mosaike", "dune") → "/ezarri/mosaike/dune". */
export function ezarriPath(...segments) {
  const rest = segments
    .flat()
    .filter((s) => s !== undefined && s !== null && String(s) !== "")
    .map((s) => encodeURIComponent(String(s)))
    .join("/");
  return rest ? `${EZARRI_BASE_PATH}/${rest}` : EZARRI_BASE_PATH;
}

/**
 * robots-Metadaten für generateMetadata() (Next 16, Metadata.robots).
 * Nicht öffentlich: noindex, nofollow – auch für Googlebot ausdrücklich.
 * @param {boolean} [isPublic]
 */
export function ezarriRobots(isPublic = EZARRI_PUBLIC) {
  if (isPublic) return { index: true, follow: true };
  return { index: false, follow: false, googleBot: { index: false, follow: false } };
}

/**
 * robots für Seiten, die auch öffentlich nie in den Index sollen
 * (Filterkombinationen, Vergleich, geteilte Konfigurationen, Anfrage-Bestätigung).
 * Öffentlich: noindex, follow (Links werden verfolgt). Nicht öffentlich: wie ezarriRobots().
 * @param {boolean} [isPublic]
 */
export function ezarriRobotsUtility(isPublic = EZARRI_PUBLIC) {
  if (isPublic) return { index: false, follow: true };
  return ezarriRobots(false);
}

/**
 * Setzt die Ezarri-robots auf ein fertiges Metadata-Objekt (z. B. aus
 * buildPageMetadata in src/lib/seo/pageMetadata.js) und gibt eine Kopie zurück.
 * @param {object} metadata
 * @param {{utility?: boolean, isPublic?: boolean}} [opts]
 */
export function withEzarriRobots(metadata, { utility = false, isPublic = EZARRI_PUBLIC } = {}) {
  return { ...metadata, robots: utility ? ezarriRobotsUtility(isPublic) : ezarriRobots(isPublic) };
}

/** Gehören Ezarri-URLs in Sitemap und /llms.txt? */
export function ezarriInSitemap(isPublic = EZARRI_PUBLIC) {
  return Boolean(isPublic);
}

/** Erscheint die Ezarri-Welt im Hauptmenü und auf der Startseite? */
export function ezarriInNavigation(isPublic = EZARRI_PUBLIC) {
  return Boolean(isPublic);
}

/** Darf die Händler-Aussage „Ezarri-Vertragshändler“ sichtbar sein? */
export function ezarriDealerClaimVisible(isPublic = EZARRI_PUBLIC) {
  return Boolean(isPublic);
}

/** Offizielle Website (sameAs im Brand-Knoten, Quellenangaben). */
export const EZARRI_SITE_URL = "https://www.ezarri.com/de";
/** Englische Fassung der Ezarri-Website (Quelle der englischen Originaltexte). */
export const EZARRI_SITE_URL_EN = "https://www.ezarri.com/en";

// Ezarri-Seiten, deren englische Adresse anders heißt als die deutsche
// (geprüft am 29.10.2026 gegen ezarri.com/en). Produktseiten (/de/<slug>)
// heißen gleich (/en/<slug>).
const EN_PATHS = Object.freeze({
  "/de/kollektionen": "/en/collections",
  "/de/verlegung": "/en/installation",
  "/de/pflege-des-Mosaiks": "/en/maintenance-of-mosaic",
  "/de/mosaik-rechner": "/en/mosaic-calculator",
  "/de/faqs": "/en/faqs",
});

/**
 * Ezarri-URL in der Sprache der Seite: auf Englisch die /en-Fassung derselben
 * Ezarri-Seite (Quellenangabe, „bei Ezarri ansehen“), sonst unverändert.
 * @param {string|null|undefined} url
 * @param {string} [locale]
 */
export function ezarriUrlFor(url, locale = "de") {
  // fr/it: englische Ezarri-Fassung (geprüfte Pfade, s. EN_PATHS) statt der deutschen.
  if (!url || !["en", "fr", "it"].includes(locale)) return url;
  const m = /^(https:\/\/www\.ezarri\.com)(\/de)(\/[^?#]*)?(.*)$/.exec(String(url));
  if (!m) return url;
  const path = `/de${m[3] || ""}`;
  const hit = Object.keys(EN_PATHS).find((k) => path === k || path.startsWith(`${k}/`));
  const en = hit ? EN_PATHS[hit] + path.slice(hit.length) : `/en${m[3] || ""}`;
  return `${m[1]}${en}${m[4] || ""}`;
}

/** Quellenangabe für übernommene Inhalte. Pflicht an jedem Ezarri-Bild, -Datensatz, -PDF. */
export const EZARRI_CREDIT = Object.freeze({
  bild: "Bild: Ezarri, ezarri.com",
  daten: "Daten: Ezarri, ezarri.com",
  datenblatt: "Datenblatt: Ezarri, ezarri.com",
  video: "Video: Ezarri, ezarri.com",
});

export const EZARRI_CREDIT_EN = Object.freeze({
  bild: "Image: Ezarri, ezarri.com",
  daten: "Data: Ezarri, ezarri.com",
  datenblatt: "Data sheet: Ezarri, ezarri.com",
  video: "Video: Ezarri, ezarri.com",
  text: "Text: Ezarri, ezarri.com/en",
});

export const EZARRI_CREDIT_FR = Object.freeze({
  bild: "Image : Ezarri, ezarri.com",
  daten: "Données : Ezarri, ezarri.com",
  datenblatt: "Fiche technique : Ezarri, ezarri.com",
  video: "Vidéo : Ezarri, ezarri.com",
  text: "Texte : Ezarri, ezarri.com/en (en anglais)",
});

export const EZARRI_CREDIT_IT = Object.freeze({
  bild: "Immagine: Ezarri, ezarri.com",
  daten: "Dati: Ezarri, ezarri.com",
  datenblatt: "Scheda tecnica: Ezarri, ezarri.com",
  video: "Video: Ezarri, ezarri.com",
  text: "Testo: Ezarri, ezarri.com/en (in inglese)",
});

/** Quellenangabe je Art; unbekannte Art → allgemeine Angabe. */
export function ezarriCredit(kind = "bild", locale = "de") {
  if (locale === "en") return EZARRI_CREDIT_EN[kind] || "Source: Ezarri, ezarri.com";
  if (locale === "fr") return EZARRI_CREDIT_FR[kind] || "Source : Ezarri, ezarri.com";
  if (locale === "it") return EZARRI_CREDIT_IT[kind] || "Fonte: Ezarri, ezarri.com";
  return EZARRI_CREDIT[kind] || "Quelle: Ezarri, ezarri.com";
}
