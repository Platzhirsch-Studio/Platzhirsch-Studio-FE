// src/lib/ezarri/konfigurator/copy-intl.js – Französisch und Italienisch für
// Konfigurator, Druckblatt und Mosaik-Rechner (01.11.2026), NUR auf dem Server
// zu importieren (Seiten): sonst landen beide Sprachen im Client-Bundle.
//
//   toolCopy(locale)  → serialisierbares Objekt { lang, KONF, RECHNER, TABELLE }
//                       für <ToolCopyProvider value={…}> (fr/it) bzw. null (de/en:
//                       die Komponenten nutzen dort wie bisher copy.js/copy.en.js).
//   konfCopy(locale)  → Konfigurator-Texte wie ezKonfCopy(), für fr/it mit
//                       zusammenfassung() aus den Vorlagen; t(de, en, key, vars).
//
// Französisch bekommt hier die Leerzeichen-Regeln (frenchTypography).
// Rein: keine Pakete, keine "@/"-Aliase. Server und node --test.
import * as KONF_DE from "./copy.js";
import * as KONF_EN from "./copy.en.js";
import * as KONF_FR from "./copy.fr.js";
import * as KONF_IT from "./copy.it.js";
import * as RECHNER_FR from "../rechner/rechner.fr.js";
import * as RECHNER_IT from "../rechner/rechner.it.js";
import { fill, frenchSpacing, frenchTypography, makeT, phrasen, toolLang } from "./intl.js";

const plain = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => typeof v !== "function"));

/** Ausgaben der Tabelle typografisch setzen (Muster-Quellen bleiben unberührt). */
const tabelleFr = (t) => ({
  patterns: t.patterns.map(([src, out]) => [src, frenchSpacing(out)]),
  phrases: t.phrases.map(([de, out]) => [de, frenchSpacing(out)]),
});

function build(lang) {
  if (lang === "fr") {
    return Object.freeze({ lang, KONF: frenchTypography(plain(KONF_FR)), RECHNER: frenchTypography(RECHNER_FR.RECHNER), TABELLE: tabelleFr(RECHNER_FR.TABELLE) });
  }
  if (lang === "it") return Object.freeze({ lang, KONF: plain(KONF_IT), RECHNER: RECHNER_IT.RECHNER, TABELLE: RECHNER_IT.TABELLE });
  return null;
}

const CACHE = { fr: build("fr"), it: build("it") };

/** Texte für den Client (fr/it) oder null (de/en). */
export function toolCopy(locale) {
  return CACHE[toolLang(locale)] || null;
}

/** zusammenfassung() aus den Vorlagen (Zahlen mit Dezimalkomma wie Deutsch). */
export function zusammenfassungAus(Z) {
  return ({ szene, becken, mixText, fugeName, formatLabel }) => {
    const m = (v) => String(v).replace(".", ",");
    const b = { l: m(becken.l), b: m(becken.b), tFlach: m(becken.tFlach), tTief: m(becken.tTief) };
    const ort = fill(Z[szene] || Z.kueche, b);
    return fill(Z.satz, { ort, mixText, fugeName, formatLabel });
  };
}

/** Konfigurator-Texte je Sprache (Server: Druckblatt, Metadaten). */
export function konfCopy(locale) {
  const lang = toolLang(locale);
  if (lang === "de") return { ...KONF_DE, lang, t: (de) => de, LISTEN: null };
  if (lang === "en") return { ...KONF_EN, lang, t: (_de, en) => en, LISTEN: null };
  const K = CACHE[lang].KONF;
  return { ...K, lang, t: makeT(K), zusammenfassung: zusammenfassungAus(K.ZUSAMMENFASSUNG) };
}

/** Rechner-Texte für fr/it ({ RECHNER, TABELLE, uebersetze }) oder null. */
export function rechnerCopy(locale) {
  const c = CACHE[toolLang(locale)];
  if (!c) return null;
  return { RECHNER: c.RECHNER, TABELLE: c.TABELLE, uebersetze: (text) => phrasen(text, c.TABELLE) };
}
