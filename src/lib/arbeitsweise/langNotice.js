// src/lib/arbeitsweise/langNotice.js – Hinweis in der Besuchersprache auf rein
// deutschen Seiten (R8, gesamtwerk P1-2, neuland P1-6).
//
// /en|fr|it/<seite> leitet per 308 auf /de/<seite>?lang=<en|fr|it> um
// (src/lib/seo/deOnlyRedirects.cjs). Diese Seiten zeigen dann oben 1–2 Sätze
// in der Sprache des Besuchers, eine Kurzfassung des Kernversprechens und den
// Link „Termin anfragen“ zur Beratungsseite in seiner Sprache. Canonical und
// hreflang bleiben unverändert (DE).
//
// Regeln: keine Superlative, keine Preise, keine Händler-Aussage im Fließtext
// (die Ezarri-Händlerzeile hängt an dealerClaim()/EZARRI_PUBLIC, Lint-Regel),
// Kern-USP nach Entscheidung Nr. 8.
// Rein, ohne React (node --test importiert die Datei).

export const NOTICE_LANGS = Object.freeze(["en", "fr", "it"]);

// Beratungsseite je Sprache (src/utils/routing.js, pathnames „beratung“).
export const APPOINTMENT_HREF = Object.freeze({ en: "/en/consultation", fr: "/fr/conseil", it: "/it/consulenza" });

const NOTE = {
  en: "This page is only available in German.",
  fr: "Cette page n’existe qu’en allemand.",
  it: "Questa pagina è disponibile solo in tedesco.",
};

// Runde 4 (P2 Sprache): dasselbe Hauptwort wie die Termin-Knöpfe in
// src/messages (Shell.menu.termin), IT in der voi-Form wie it.json.
const CTA = { en: "Request a visit", fr: "Demander un rendez-vous", it: "Richiedete un appuntamento" };

const LABEL = { en: "Note in English", fr: "Note en français", it: "Nota in italiano" };

// Kurzfassung des Kernversprechens je Seite.
const CORE = {
  arbeitsweise: {
    en: "In short: Harald Menghin draws your interior by hand and builds a small model before we plan it in 3D and show you a photorealistic rendering. We are happy to explain the process in English.",
    fr: "En bref : Harald Menghin dessine votre intérieur à la main et construit une maquette avant la planification en 3D et le rendu photoréaliste. Nous vous expliquons volontiers la démarche en français.",
    it: "In breve: Harald Menghin disegna il vostro interno a mano e costruisce un piccolo modello prima della progettazione in 3D e del rendering fotorealistico. Vi spieghiamo volentieri il metodo in italiano.",
  },
  ezarri: {
    en: "In short: we advise on Ezarri glass mosaic for pools, bathrooms and wellness areas and show samples in Lochau, and Harald Menghin draws your design by hand before it is planned. Prices on request.",
    fr: "En bref : nous vous conseillons sur la mosaïque de verre Ezarri (piscine, salle de bains, bien-être) avec échantillons à Lochau, et Harald Menghin dessine votre projet à la main avant la planification. Prix sur demande.",
    it: "In breve: vi consigliamo sul mosaico di vetro Ezarri (piscina, bagno, wellness) con campioni a Lochau e Harald Menghin disegna il vostro progetto a mano prima della progettazione. Prezzi su richiesta.",
  },
  "3d-ansicht": {
    en: "In short: this tool shows whether a piece fits your room, at full size. Harald Menghin draws your interior by hand before we plan it in 3D.",
    fr: "En bref : cet outil montre si un meuble trouve sa place chez vous, en taille réelle. Harald Menghin dessine votre intérieur à la main avant la planification en 3D.",
    it: "In breve: questo strumento mostra se un mobile sta nel vostro spazio, a grandezza reale. Harald Menghin disegna il vostro interno a mano prima della progettazione in 3D.",
  },
};

export const NOTICE_PAGES = Object.freeze(Object.keys(CORE));

// Welle 2 (Inhaber Nr. 13): the Ezarri world also exists in English. An
// English visitor on /de/ezarri…?lang=en (old link) is told so and gets the
// English page instead of "only available in German".
const EN_VERSION = Object.freeze({ ezarri: "/en/ezarri" });
const EN_VERSION_NOTE = "This page is also available in English.";
const EN_VERSION_CTA = "Open the English version";

/** Hinweis für `page` in `lang`, oder null (DE, unbekannte Sprache/Seite). */
export function langNotice(page, lang) {
  if (!NOTICE_LANGS.includes(lang) || !CORE[page]) return null;
  if (lang === "en" && EN_VERSION[page]) {
    return { lang, label: LABEL.en, note: EN_VERSION_NOTE, core: CORE[page].en, cta: EN_VERSION_CTA, href: EN_VERSION[page] };
  }
  return { lang, label: LABEL[lang], note: NOTE[lang], core: CORE[page][lang], cta: CTA[lang], href: APPOINTMENT_HREF[lang] };
}

/** `?lang=` aus searchParams (String oder Array) → "en" | "fr" | "it" | null. */
export function noticeLang(value) {
  const v = Array.isArray(value) ? value[0] : value;
  return NOTICE_LANGS.includes(v) ? v : null;
}

// ---------------------------------------------------------------------------
// Runde 4 (P2 Sprache, gesamtwerk P1-1): globaler Hinweis für alle übrigen
// deutschen Seiten (Sofaplaner, Küchenplaner, Stil-Finder, Yacht-Interieur,
// Outdoor, Concierge, Bodensee-Licht …). Eingebunden über
// src/components/I18n/GermanOnlyNotice.js in client-layout.js. Seiten mit
// eigenem Hinweis (NOTICE_PAGES) bekommen keinen zweiten.

const CORE_GLOBAL = {
  en: "In short: Harald Menghin draws your interior by hand and builds a small model before we plan it in 3D. We are happy to advise you in English, in Lochau or at your home.",
  fr: "En bref : Harald Menghin dessine votre intérieur à la main et construit une maquette avant la planification en 3D. Nous vous conseillons volontiers en français, à Lochau ou chez vous.",
  it: "In breve: Harald Menghin disegna il vostro interno a mano e costruisce un piccolo modello prima della progettazione in 3D. Vi consigliamo volentieri in italiano, a Lochau o a casa vostra.",
};

/** Pfade mit eigenem Hinweis: /de/arbeitsweise, /de/ezarri/**, /de/3d-ansicht/**. */
export const OWN_NOTICE_PATH = /^\/de\/(?:arbeitsweise|ezarri|3d-ansicht)(?:\/|$)/;

// Yacht team (31.10.2026): Welle 2 pages that exist in German AND English.
// /fr|it/<page> still 308s to /de/<page>?lang=fr|it (deOnlyRedirects.cjs,
// FR_IT_ONLY_EXACT), and old /en links may carry ?lang=en – there the notice
// must not say "only available in German"; it says the page is also in
// English and links there (hreflang="en").
export const EN_TWINS = Object.freeze({ "/de/yacht-interior": "/en/yacht-interior", "/de/sofaplaner": "/en/sofaplaner" });
const TWIN_NOTE = {
  en: "This page is also available in English.",
  fr: "Cette page existe aussi en anglais.",
  it: "Questa pagina è disponibile anche in inglese.",
};
const TWIN_CTA = { en: "Open the English version", fr: "Version anglaise", it: "Versione inglese" };

/** English twin of a German page ("/de/yacht-interior" → "/en/yacht-interior") or null. */
export function enTwin(pathname) {
  return EN_TWINS[String(pathname || "").replace(/\/+$/, "")] || null;
}

/** Allgemeiner Hinweis in `lang` (oder null); `pathname` wählt die Fassung für Seiten mit englischer Version. */
export function globalNotice(lang, pathname = "") {
  if (!NOTICE_LANGS.includes(lang)) return null;
  const twin = enTwin(pathname);
  if (twin) return { lang, label: LABEL[lang], note: TWIN_NOTE[lang], core: CORE_GLOBAL[lang], cta: TWIN_CTA[lang], href: twin, hrefLang: "en" };
  return { lang, label: LABEL[lang], note: NOTE[lang], core: CORE_GLOBAL[lang], cta: CTA[lang], href: APPOINTMENT_HREF[lang], hrefLang: lang };
}

/**
 * Sprache des globalen Hinweises für `pathname` + `search`: nur auf deutschen
 * Seiten (/de/…) ohne eigenen Hinweis, sonst null.
 */
export function globalNoticeLang(pathname, search) {
  if (!/^\/de(?:\/|$)/.test(pathname || "") || OWN_NOTICE_PATH.test(pathname)) return null;
  let v = null;
  try {
    v = new URLSearchParams(search || "").get("lang");
  } catch {
    v = null;
  }
  return noticeLang(v);
}
