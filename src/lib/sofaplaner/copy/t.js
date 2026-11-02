// Sofaplaner – translation helper (Welle 2, team EN-Yacht-Sofa, 29.10.2026).
//
// The planner was written in German; every visible string in the components
// is now wrapped in T("<German text>", vars). German is the key, so the German
// page renders exactly as before (identity), and the English page looks the
// key up in UI_EN (./ui-en.js). Missing keys fall back to German – the unit
// test tests/unit/sofaplaner-en.test.mjs lists every T("…") literal in the
// components and fails on a missing English entry.
//
// T.dyn(text) translates texts that are BUILT elsewhere (plan checks in
// model.js, dock reasons in geometry.js, side labels): exact entry first, then
// the patterns of DYN_EN (./ui-en.js), else the German text.
// Pure module (no imports besides the dictionaries), usable on server and client.
import { DYN_EN, UI_EN } from "./ui-en.js";

/** English network messages (src/messages/en.json → Labs.net); re-exported by ./source.js. */
export const NET_EN = Object.freeze({
  timeout: "The response took too long. Please try again.",
  offline: "No internet connection. Please check your connection and try again.",
});

const fill = (s, vars) => (vars ? String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : String(s));

/** English text for a computed German text (checks, reasons, labels). */
export function dynEn(text) {
  if (text == null) return text;
  const s = String(text);
  if (UI_EN[s] != null) return UI_EN[s];
  let out = s;
  for (const [re, rep] of DYN_EN) out = out.replace(re, rep);
  // lead-mobil-i18n fix-02: German decimal comma in built texts (fmtCm, "64,5 cm") → "64.5"
  return out.replace(/(\d),(\d)/g, "$1.$2");
}

// Sprachen-Welle FR/IT (01.11.2026): Französisch und Italienisch liegen NICHT
// in diesem Modul (sonst trügen DE/EN-Seiten beide Wörterbücher im Bundle).
// ./dicts.js lädt ui-fr.js / ui-it.js nach und trägt sie hier ein
// (registerDict); makeT("fr") liest dann aus der Registry. Seiten-Code wartet
// vorher auf loadDict(locale) (page.js auf dem Server, PlannerGate im Browser).
const DICTS = {};

/** Wörterbuch einer Zusatzsprache eintragen ({ UI, DYN, SOURCE, HANDOFF, FAMILY, NET, … }). */
export function registerDict(locale, dict) {
  if (dict && locale) DICTS[locale] = dict;
}

/** Eingetragenes Wörterbuch (fr/it) oder null. */
export function dictFor(locale) {
  return DICTS[locale] || null;
}

/** Text einer Zusatzsprache für einen gebauten deutschen Text (Prüfungen, Gründe, Labels). */
export function dynIntl(text, dict) {
  if (text == null || !dict) return text;
  const s = String(text);
  if (dict.UI[s] != null) return dict.UI[s];
  let out = s;
  for (const [re, rep] of dict.DYN) out = out.replace(re, rep);
  return out;
}

/** T(key, vars) for a locale; German = identity (with {var} filled in). */
export function makeT(locale = "de") {
  const intl = locale === "en" ? null : dictFor(locale);
  if (intl) {
    const T = (key, vars) => fill(intl.UI[key] ?? key, vars);
    T.dyn = (text) => dynIntl(text, intl);
    T.locale = intl.locale;
    T.en = false;
    /** true = nicht Deutsch (Elementnamen/Angaben englisch bzw. lang="de"). */
    T.foreign = true;
    T.net = intl.NET;
    T.dateLocale = intl.dateLocale;
    T.dict = intl;
    T.num = (n) => (n == null ? n : String(n).replace(".", ","));
    T.cm = (v) => (v == null ? "–" : T.num(Math.round(v * 10) / 10));
    return T;
  }
  const en = locale === "en";
  const T = (key, vars) => fill(en ? (UI_EN[key] ?? key) : key, vars);
  T.dyn = (text) => (en ? dynEn(text) : text);
  T.locale = en ? "en" : "de";
  T.en = en;
  T.foreign = en;
  T.net = en ? NET_EN : undefined;
  T.dateLocale = en ? "en-GB" : "de-AT";
  T.dict = null;
  /** Number with the locale's decimal sign (DE "1,5", EN "1.5"). */
  T.num = (n) => (n == null ? n : en ? String(n) : String(n).replace(".", ","));
  /** Centimetres like fmtCm (geometry.js: one decimal, "–" if unknown) with the locale's decimal sign. */
  T.cm = (v) => (v == null ? "–" : T.num(Math.round(v * 10) / 10));
  return T;
}
