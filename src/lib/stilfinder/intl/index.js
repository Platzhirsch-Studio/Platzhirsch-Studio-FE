// src/lib/stilfinder/intl/index.js – Stil-Finder in DE, EN, FR, IT.
//
// Mehrsprachigkeit (01.11.2026): Die Texte stehen serverseitig (de.js = Master,
// en.js, fr.js, it.js) und gehen NICHT in src/messages/*.json (Client-Budget
// ≤ 35 KB je Sprache). Die Seiten geben dem Client nur die eine Sprache als
// Prop/Context mit (stilfinderClientCopy). Französische Typografie setzt
// frenchTypography() (dieselbe Regel wie Hotel & Objekt).
//
// Reines Modul (relative Importe, kein React): node --test lädt es.
import * as de from "./de.js";
import * as en from "./en.js";
import * as fr from "./fr.js";
import * as it from "./it.js";
import { frenchTypography } from "../../hotel/content-intl.js";

export const STILFINDER_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

const RAW = { de, en, fr, it };
const cache = new Map();

/**
 * Vollständige Texte einer Sprache oder null (unbekannte Sprache):
 * { locale, ui, page, questions, profiles, materials, options }.
 * questions/profiles/materials/options sind Overlays – für DE null (die
 * deutschen Texte stehen in questions.js, profiles.js, materialImages.js, options.js).
 */
export function stilfinderCopy(locale) {
  if (!STILFINDER_LOCALES.includes(locale)) return null;
  if (cache.has(locale)) return cache.get(locale);
  const src = RAW[locale];
  const typo = locale === "fr" ? frenchTypography : (v) => v;
  const copy = {
    locale,
    ui: typo(src.UI),
    page: typo(src.PAGE),
    questions: src.QUESTIONS ? typo(src.QUESTIONS) : null,
    profiles: src.PROFILES ? typo(src.PROFILES) : null,
    materials: src.MATERIALS ? typo(src.MATERIALS) : null,
    options: src.OPTIONS ? typo(src.OPTIONS) : null,
  };
  cache.set(locale, copy);
  return copy;
}

/** Was der Client braucht (eine Sprache): UI-Texte und die Overlays für Fragen, Profile, Formular. */
export function stilfinderClientCopy(locale) {
  const c = stilfinderCopy(locale);
  if (!c) return null;
  return { locale, ui: c.ui, questions: c.questions, profiles: c.profiles, options: c.options };
}
