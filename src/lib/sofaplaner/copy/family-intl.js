// Sofaplaner – eine Modellfamilie auf Französisch/Italienisch (Sprachen-Welle
// FR/IT, 01.11.2026).
//
// Quelle der Texte, in dieser Reihenfolge (keine erfundenen Bezeichnungen):
//  1. Elementnamen: Minottis eigene englische Namen (wie /en, enElementLabel in
//     ./family-en.js). Eine geprüfte französische/italienische Fassung der rund
//     6.000 Elementnamen gibt es nicht; die Oberfläche sagt das
//     (LookPanel-Hinweis „Angaben in deutscher Sprache …“, FR/IT-Fassung).
//  2. Optionen und Herstellerangaben: wie /en – englisch, wenn das Glossar sie
//     vollständig abdeckt, sonst unsere deutsche Notiz mit lang="de".
//  3. Startformen (Name, Hinweis): das Wörterbuch der Sprache (ui-fr.js/ui-it.js).
//  4. Charakterzeile der Modellkarte: aus den veröffentlichten Fakten
//     (modular/feste Größe, outdoor, Schlaffunktion), kein Freitext.
// Reines Modul, keine React-Importe; node --test.
import { localizeFamily, localizeIndex } from "./family-en.js";

const quotesIntl = (s, q) => (s == null ? s : String(s).replace(/[„“"]([^“”"]*)[“”"]/g, `${q[0]}$1${q[1]}`));
const designerIntl = (s, F) => (s == null ? s : quotesIntl(s, F.quotes).replace(/ mit /g, ` ${F.with} `).replace(/ und /g, ` ${F.and} `));

/** Charakterzeile einer Modellkarte aus Fakten. */
export function characterIntl(f, dict) {
  const F = dict.FAMILY;
  const parts = [f.modular ? F.modular : F.fixed];
  if (f.outdoor) parts.push(F.outdoor);
  if (f.sofabed) parts.push(F.sofabed);
  return parts.join(" ");
}

/** Eine Client-Familie (catalog.server clientFamily) für FR/IT. Idempotent. */
export function localizeFamilyIntl(fam, dict) {
  if (!fam || !dict || fam.lang === dict.locale) return fam;
  const F = dict.FAMILY;
  const tr = (s) => (s == null ? s : dict.UI[s] ?? s);
  // Optionen/Elemente: wie /en (englische Herstellernamen, Rest deutsch markiert)
  const en = fam.lang === "en" ? fam : localizeFamily(fam);
  return {
    ...en,
    lang: dict.locale,
    name: quotesIntl(fam.name, F.quotes),
    designer: designerIntl(fam.designer, F),
    character: characterIntl(fam, dict),
    templates: (fam.templates || []).map((t) => ({ ...t, label: tr(t.label), hint: tr(t.hint) })),
  };
}

/** Einträge der Modellauswahl für FR/IT (Name, Designer, Charakterzeile). */
export function localizeIndexIntl(index, dict) {
  if (!dict) return index;
  const F = dict.FAMILY;
  return localizeIndex(index).map((f, i) => ({ ...f, name: quotesIntl(index[i].name, F.quotes), designer: designerIntl(index[i].designer, F), character: characterIntl(index[i], dict) }));
}
