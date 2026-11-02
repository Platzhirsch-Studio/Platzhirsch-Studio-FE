// src/lib/ezarri/konfigurator/intl.js – Sprachen der Ezarri-Werkzeuge (Konfigurator,
// Druckblatt, Mosaik-Rechner): Deutsch (Quelle), Englisch und seit 01.11.2026
// Französisch und Italienisch.
//
// Deutsch und Englisch stehen wie bisher im Code (t("de", "en") bzw. copy.js /
// copy.en.js). Französisch und Italienisch kommen NUR vom Server: copy.fr.js /
// copy.it.js (Konfigurator) und ../rechner/werkzeug.fr.js / .it.js (Rechner)
// werden in copy-intl.js zu einem kleinen, serialisierbaren Objekt gebaut, das
// die Seite an <ToolCopyProvider> gibt. So bleiben die Texte aus dem
// Client-Bundle und aus src/messages/*.json (Budget ≤ 35 KB je Sprache).
//
// Rein: keine Pakete, keine "@/"-Aliase. Server, Client und node --test.

/** Sprachen, in denen Konfigurator, Druckblatt und Rechner Texte haben. */
export const TOOL_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Hat das Werkzeug Texte in dieser Sprache? */
export const toolLocaleEnabled = (locale) => TOOL_LOCALES.includes(locale);

/** "de" | "en" | "fr" | "it" (unbekannt → "de"). */
export const toolLang = (locale) => (TOOL_LOCALES.includes(locale) ? locale : "de");

/**
 * hreflang der Werkzeugseiten: jede aktive Sprache auf ihre eigene URL, dazu
 * x-default = Deutsch. `active` = Sprachen, die wirklich ausgeliefert werden
 * (seo.js: TOOL_LOCALES ∩ EZARRI_LOCALES) – nie ein Verweis auf eine 404/308.
 * Auf jeder Sprachfassung derselbe Satz (reziprok).
 */
export function toolLanguagesFrom(urlFor, active = TOOL_LOCALES) {
  const langs = TOOL_LOCALES.filter((l) => active.includes(l));
  if (!langs.includes("de")) return {};
  const out = Object.fromEntries(langs.map((l) => [l, urlFor(l)]));
  out["x-default"] = urlFor("de");
  return out;
}

/** Platzhalter {name} bzw. {0} füllen; fehlende Werte bleiben leer. */
export function fill(tpl, vars = {}) {
  return String(tpl ?? "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? vars[k] === 0 ? String(vars[k]) : ""));
}

const NNBSP = " "; // schmales geschütztes Leerzeichen (vor ; ! ?)
const NBSP = " "; // geschütztes Leerzeichen (vor : und in « »)

/** Französische Leerzeichen-Regeln (wie src/lib/hotel/content-intl.js). */
export function frenchSpacing(text) {
  return String(text)
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ :(?=\s|$)/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);
}

/** frenchSpacing() auf alle Strings eines Objekts (Kopie; Schlüssel bleiben). */
export function frenchTypography(value) {
  if (typeof value === "string") return frenchSpacing(value);
  if (Array.isArray(value)) return value.map(frenchTypography);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchTypography(v)]));
  return value;
}

/**
 * Übersetzer für FR/IT aus einem Text-Objekt { UI, UI_TPL }:
 *   t("Deutsch", "English")                    → UI["Deutsch"]
 *   t(`… ${x} …`, `… ${x} …`, "schluessel", { x }) → fill(UI_TPL.schluessel, { x })
 * Fehlt ein Eintrag, steht der englische Text (Tests prüfen Vollständigkeit).
 */
export function makeT(copy) {
  const ui = copy?.UI || {};
  const tpl = copy?.UI_TPL || {};
  return (de, en, key, vars) => {
    if (key && tpl[key] != null) return fill(tpl[key], vars);
    return ui[de] ?? en;
  };
}

/** RECHNER (fr/it, Vorlagen) → mit flaecheText()/mischRundung() wie copy.js. */
export function rechnerMitFunktionen(R) {
  return {
    ...R,
    ergebnis: {
      ...R.ergebnis,
      flaecheText: (netto, marge) => fill(R.ergebnis.flaecheText, { netto, marge }),
      mischRundung: (n) => fill(n === 1 ? R.ergebnis.mischRundung1 : R.ergebnis.mischRundungN, { n }),
    },
  };
}

/** Ergebnis von poolFlaechen() mit übersetzten Texten (Zahlen unverändert; wie flaechenEn). */
export function flaechenUebersetzt(f, table) {
  if (!f) return f;
  const tr = (s) => phrasen(s, table);
  return {
    ...f,
    teile: f.teile.map((x) => ({ ...x, label: tr(x.label), formel: tr(x.formel) })),
    fehler: Object.fromEntries(Object.entries(f.fehler || {}).map(([k, v]) => [k, tr(v)])),
    hinweise: (f.hinweise || []).map(tr),
    kantenFormel: { corner: tr(f.kantenFormel?.corner), cove: tr(f.kantenFormel?.cove) },
  };
}

/** Werkzeugliste von quantities() mit übersetzten Texten (wie werkzeugEn). */
export function werkzeugUebersetzt(list = [], table) {
  return list.map((w) => ({ ...w, label: phrasen(w.label, table), regel: w.regel ? phrasen(w.regel, table) : w.regel }));
}

/** Rechner-/Flächentexte (deutsch aus flaechen.js/core.js) über eine Tabelle übersetzen. */
export function phrasen(text, table) {
  if (text == null || text === "" || !table) return text;
  let s = String(text);
  for (const [src, out] of table.patterns || []) {
    const re = new RegExp(src);
    if (re.test(s)) return s.replace(re, out);
  }
  for (const [de, out] of table.phrases || []) s = s.split(de).join(out);
  return s;
}
