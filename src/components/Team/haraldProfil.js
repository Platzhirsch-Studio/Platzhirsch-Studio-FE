// Profile page of Harald Menghin (Rat 9,5, B14, seo 2): path, languages and
// the facts the page may state. Pure module (node --test).
//  - All four languages since 31.10.2026: the translated About URLs
//    (/en/about-us/team/harald-menghin, /fr/a-propos/equipe/…,
//    /it/chi-siamo/team/…) come from the pathnames table in src/proxy.js
//    (ABOUT_SECTIONS.team has the suffix "/harald-menghin"). Page texts:
//    Showroom.abschnitte.haraldText + arbeitsweiseCopy(locale).HARALD.
//  - No job title, no awards, no years: nothing is confirmed (inhaber-offen A4).
//    knowsAbout comes from TEAM_PEOPLE (src/lib/seo/structuredData.js).
//  - PROFILE_URL (DE) stays the `url` of the Person entity (one stable ID
//    across the site); each language version has its own canonical
//    (profileUrl(locale)) and the hreflang set from profileUrl().
import { ROUTES } from "../../utils/routing.js";

const SITE = "https://platzhirsch.studio";
export const PROFILE_SLUG = "harald-menghin";
export const PROFILE_PATH = `/ueber-uns/team/${PROFILE_SLUG}`;
export const PROFILE_LOCALES = Object.freeze(["de", "en", "fr", "it"]);
export const PROFILE_URL = `${SITE}/de${PROFILE_PATH}`;

/** Translated path without locale prefix, e.g. "/about-us/team/harald-menghin". */
export function profilePath(locale = "de") {
  return `${ROUTES.team[locale] || ROUTES.team.de}/${PROFILE_SLUG}`;
}

/** Absolute URL of the profile in one language. */
export function profileUrl(locale = "de") {
  const l = PROFILE_LOCALES.includes(locale) ? locale : "de";
  return `${SITE}/${l}${profilePath(l)}`;
}

// Title (≤ 60 incl. suffix) and description per language – translations of
// the German snippet, no new claims.
export const PROFILE_META = Object.freeze({
  de: {
    title: "Harald Menghin – Entwurf von Hand | Platzhirsch",
    description: "Harald Menghin zeichnet Einrichtungen von Hand und baut Modelle, bevor wir in 3D planen und rendern. Mit Zeit bei Ihnen vor Ort.",
  },
  en: {
    title: "Harald Menghin – Designed by hand | Platzhirsch",
    description: "Harald Menghin draws interiors by hand and builds models before we plan and render in 3D. With time at your home.",
  },
  fr: {
    title: "Harald Menghin – Dessiné à la main | Platzhirsch",
    description: "Harald Menghin dessine les aménagements à la main et construit des maquettes avant que nous planifiions et rendions en 3D. Avec du temps chez vous.",
  },
  it: {
    title: "Harald Menghin – Disegnato a mano | Platzhirsch",
    description: "Harald Menghin disegna gli arredamenti a mano e costruisce modelli prima che progettiamo e realizziamo il rendering in 3D. Con tempo a casa vostra.",
  },
});
