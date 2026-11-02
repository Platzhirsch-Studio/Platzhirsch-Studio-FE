// src/lib/ezarri/indexierung.js – welche Ezarri-Mosaikseiten indexierbar sind
// (Runde 4 P5, seo P1-2).
//
// Problem: 281 Mosaikseiten, die sich innerhalb einer Kollektion fast nur in
// Name, Code und Format unterscheiden (Varianten -50, -gold, -hexa, Farbstufen
// derselben Mischung). Als Index-Seiten wären das Beinahe-Dubletten.
//
// Regel: Eine Mosaikseite bleibt index,follow, wenn
//   (a) sie einen eigenen Text hat (EIGENE_TEXTE unten, von Platzhirsch
//       geschrieben, nicht von ezarri.com kopiert), oder
//   (b) ihr Datenprofil (Name, Code, Format, Oberfläche, Farben, Wasserwirkung,
//       Eignung, Maße, Rutschhemmung, Fugenempfehlung, Mischrezept) jeder
//       anderen Mosaikseite DERSELBEN Kollektion zu weniger als 50 % gleicht
//       (Jaccard über Wort-Trigramme).
// Alle übrigen Mosaikseiten: noindex,follow, nicht in Sitemap und llms.txt;
// sie bleiben erreichbar und verlinkt (Katalog, Varianten, Konfigurator).
// Safe-Steps, Corner, Cove sind ohnehin Hilfsseiten (noindex).
//
// Reines Modul (keine Imports), node --test lädt es
// (tests/unit/r5-seo-ezarri.test.mjs). data.js wendet es auf die JSON-Daten an.

/** Ab diesem Anteil gleicher Wort-Trigramme gilt eine Seite als Beinahe-Dublette. */
export const EZARRI_SIMILARITY_MAX = 0.5;

/**
 * Eigene Texte je Referenz-ID ({ "2511-a": "…" }), von Platzhirsch verfasst
 * (Beratungserfahrung, Einsatz im Projekt). Eine Seite mit eigenem Text ist
 * immer index,follow und zeigt den Text unter dem Vorspann. Leer, bis echte
 * Texte vorliegen; keine erfundenen Projekte oder Referenzen eintragen.
 */
export const EIGENE_TEXTE = Object.freeze({});

const words = (s) =>
  String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/u)
    .filter(Boolean);

/** Wort-Trigramme eines Textes (kurze Texte: einzelne Wörter). */
export function shingles(text, n = 3) {
  const w = words(text);
  const out = new Set();
  if (w.length < n) {
    for (const x of w) out.add(x);
    return out;
  }
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

/** Jaccard-Ähnlichkeit zweier Mengen (0 … 1). */
export function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let same = 0;
  for (const x of a) if (b.has(x)) same++;
  return same / (a.size + b.size - same);
}

/** Datenprofil einer Referenz = der Text, den die Seite aus den Daten zeigt. */
export function profileText(ref, rezept) {
  if (!ref) return "";
  const m = ref.masse || {};
  return [
    ref.name,
    ref.code,
    ref.format,
    ref.oberflaeche,
    ...(ref.farben || []),
    ...[].concat(ref.wasserfarbe ?? []),
    ...(ref.einsatz || []),
    m.stein_mm,
    m.blatt_cm,
    m.steine_pro_blatt,
    m.dicke,
    m.fuge_mm,
    ref.rutschhemmung ? JSON.stringify(ref.rutschhemmung) : "",
    ref.fuge_empfehlung,
    ...((rezept?.kombination || []).map((t) => `${t.name} ${t.anteil}`)),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {Array} refs references.json → referenzen
 * @param {Object} rezepte kombinationen.json → rezepte ({ [id]: { kombination } })
 * @param {Object} [eigene] EIGENE_TEXTE
 * @returns {Map<string, {indexable: boolean, maxSimilarity: number, eigenerText: boolean}>}
 *   ein Eintrag je Mosaik (typ "mosaik"); andere Typen fehlen (immer noindex).
 */
export function computeMosaikIndex(refs, rezepte = {}, eigene = EIGENE_TEXTE) {
  const mosaike = (refs || []).filter((r) => r?.typ === "mosaik");
  const profile = new Map(mosaike.map((r) => [r.id, shingles(profileText(r, rezepte?.[r.id]))]));
  const byCollection = new Map();
  for (const r of mosaike) {
    if (!byCollection.has(r.kollektion)) byCollection.set(r.kollektion, []);
    byCollection.get(r.kollektion).push(r);
  }
  const result = new Map();
  for (const r of mosaike) {
    const own = profile.get(r.id);
    let max = 0;
    for (const o of byCollection.get(r.kollektion) || []) {
      if (o.id === r.id) continue;
      max = Math.max(max, jaccard(own, profile.get(o.id)));
    }
    const eigenerText = Boolean(String(eigene?.[r.id] || "").trim());
    result.set(r.id, { indexable: eigenerText || max < EZARRI_SIMILARITY_MAX, maxSimilarity: Number(max.toFixed(3)), eigenerText });
  }
  return result;
}

/**
 * H1 einer Mosaik-/Hilfsseite: Ezarri, Art, Name (mit Code) und Kollektion,
 * z. B. „Ezarri Mosaik 2511-A 25 · Kollektion Niebla“. Der Code steht nur
 * einmal da: steckt er schon im Namen, wird er nicht wiederholt.
 * @returns {{ main: string, kollektion: string, text: string }}
 */
export function mosaikHeading(ref, kollektionName, typLabel = "Mosaik", locale = "de") {
  const name = String(ref?.name || "").trim();
  const code = String(ref?.code || "").trim();
  const withCode = code && !name.toLowerCase().includes(code.toLowerCase()) ? `${name} (${code})` : name;
  // fr/it: Gattungswort vor der Marke („Mosaïque Ezarri Celestite 25“), wie im Französischen und Italienischen üblich.
  const main = (locale === "fr" || locale === "it" ? `${typLabel} Ezarri ${withCode}` : `Ezarri ${typLabel} ${withCode}`).replace(/\s+/g, " ").trim();
  // Welle 2: englisch „Gea collection“.
  // 01.11.2026: fr „collection Gea“, it „collezione Gea“.
  const KOL = { en: (n) => `${n} collection`, fr: (n) => `Collection ${n}`, it: (n) => `Collezione ${n}` };
  const kollektion = kollektionName ? (KOL[locale] ? KOL[locale](kollektionName) : `Kollektion ${kollektionName}`) : "";
  return { main, kollektion, text: kollektion ? `${main} · ${kollektion}` : main };
}
