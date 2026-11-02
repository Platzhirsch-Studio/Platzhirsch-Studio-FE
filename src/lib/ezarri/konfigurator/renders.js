// src/lib/ezarri/konfigurator/renders.js – „Fotoansicht“ des Konfigurators.
//
// 48 Visualisierungen (Path-Tracing, Blender 4.5 LTS Cycles), Stand 31.10.2026:
// Beispielbecken 8 × 4 m (Rechteck, römische Treppe, Skimmer = BECKEN_START.pool),
// 25-mm-Raster, Fuge Bianco Assoluto (#ededed = Fuge "1"), je Einzelfarbe die
// Ansichten hero / wasserlinie / draufsicht, Licht „morgen“ (Niebla 2508-A auch „abend“).
// Steinfarben aus measured-colors.json. Keine Fotos – Bildunterschrift Pflicht (FOTO_CAPTION).
// 01.11.2026: 44 „morgen“-Renders durch Lauf v5 ersetzt (Himmelsorientierung korrigiert,
// Maße unverändert 1600 × 1066); Niebla 2508-A hero-morgen und alle „abend“ unverändert.
// Dateien: public/Images/Ezarri/renders/ (Namen wie im Render-Manifest),
// Bildquellen (CC0-Assets): docs/bildquellen/QUELLEN-ezarri-renders.md.
//
// Rein: keine Imports, kein React. Läuft in Server, Browser und node --test.

export const RENDER_DIR = "/Images/Ezarri/renders/";
export const RENDER_BREITE = 1600;
export const RENDER_HOEHE = 1066;
export const RENDER_STAND = "2026-11-01";

/** Reihenfolge der Ansichten und Lichtstimmungen im Umschalter. */
export const FOTO_VIEWS = Object.freeze(["hero", "wasserlinie", "draufsicht"]);
export const FOTO_LICHTER = Object.freeze(["morgen", "abend"]);

/** Bedingungen der Renderszene (müssen zum Zustand passen). */
export const FOTO_FORMAT = "25";
export const FOTO_FUGE = "1";

/** [serie, farbe (= Referenz-ID), view, licht] – Datei: ezarri-<serie>-<farbe>-<view>-<licht>.webp */
const ROWS = [
  ["iridescent", "azur", "draufsicht", "morgen"],
  ["iridescent", "azur", "hero", "morgen"],
  ["iridescent", "azur", "wasserlinie", "morgen"],
  ["iridescent", "ocean", "draufsicht", "morgen"],
  ["iridescent", "ocean", "hero", "morgen"],
  ["iridescent", "ocean", "wasserlinie", "morgen"],
  ["lisa", "2530-d", "draufsicht", "morgen"],
  ["lisa", "2530-d", "hero", "morgen"],
  ["lisa", "2530-d", "wasserlinie", "morgen"],
  ["lisa", "2531-b", "draufsicht", "morgen"],
  ["lisa", "2531-b", "hero", "morgen"],
  ["lisa", "2531-b", "wasserlinie", "morgen"],
  ["lisa", "2533-a", "draufsicht", "morgen"],
  ["lisa", "2533-a", "hero", "morgen"],
  ["lisa", "2533-a", "wasserlinie", "morgen"],
  ["mix", "25001-c", "draufsicht", "morgen"],
  ["mix", "25001-c", "hero", "morgen"],
  ["mix", "25001-c", "wasserlinie", "morgen"],
  ["mix", "25002-c", "draufsicht", "morgen"],
  ["mix", "25002-c", "hero", "morgen"],
  ["mix", "25002-c", "wasserlinie", "morgen"],
  ["mix", "25003-b", "draufsicht", "morgen"],
  ["mix", "25003-b", "hero", "morgen"],
  ["mix", "25003-b", "wasserlinie", "morgen"],
  ["mix", "2514-b", "draufsicht", "morgen"],
  ["mix", "2514-b", "hero", "morgen"],
  ["mix", "2514-b", "wasserlinie", "morgen"],
  ["niebla", "2501-b", "draufsicht", "morgen"],
  ["niebla", "2501-b", "hero", "morgen"],
  ["niebla", "2501-b", "wasserlinie", "morgen"],
  ["niebla", "2502-a", "draufsicht", "morgen"],
  ["niebla", "2502-a", "hero", "morgen"],
  ["niebla", "2502-a", "wasserlinie", "morgen"],
  ["niebla", "2503-d", "draufsicht", "morgen"],
  ["niebla", "2503-d", "hero", "morgen"],
  ["niebla", "2503-d", "wasserlinie", "morgen"],
  ["niebla", "2505-a", "draufsicht", "morgen"],
  ["niebla", "2505-a", "hero", "morgen"],
  ["niebla", "2505-a", "wasserlinie", "morgen"],
  ["niebla", "2507-a", "draufsicht", "morgen"],
  ["niebla", "2507-a", "hero", "morgen"],
  ["niebla", "2507-a", "wasserlinie", "morgen"],
  ["niebla", "2508-a", "draufsicht", "abend"],
  ["niebla", "2508-a", "draufsicht", "morgen"],
  ["niebla", "2508-a", "hero", "abend"],
  ["niebla", "2508-a", "hero", "morgen"],
  ["niebla", "2508-a", "wasserlinie", "abend"],
  ["niebla", "2508-a", "wasserlinie", "morgen"],
];

export const RENDERS = Object.freeze(
  ROWS.map(([serie, farbe, view, licht]) => Object.freeze({ file: `ezarri-${serie}-${farbe}-${view}-${licht}.webp`, serie, farbe, view, licht })),
);

/** Referenz-ID → Renders dieser Farbe. */
const BY_FARBE = new Map();
for (const r of RENDERS) {
  if (!BY_FARBE.has(r.farbe)) BY_FARBE.set(r.farbe, []);
  BY_FARBE.get(r.farbe).push(r);
}

export const FOTO_CAPTION = Object.freeze({
  de: "Visualisierung (Rendering), Farbwirkung bitte am Muster prüfen",
  en: "Visualisation (rendering), please check the colour effect on a sample",
});
export const FOTO_HINWEIS = Object.freeze({
  de: "Fotoansicht als Beispielbecken 8 × 4 m für Einzelfarben verfügbar",
  en: "Photo view available as an 8 × 4 m example pool for single colours",
});

/** Pfad eines Renders. */
export const renderSrc = (r) => `${RENDER_DIR}${r.file}`;

/** Alle Renders einer Referenz (leer, wenn keine). Optional nur passende Serie. */
export function rendersFuer(refId, serie) {
  const list = BY_FARBE.get(String(refId || "")) || [];
  return serie ? list.filter((r) => r.serie === serie) : list;
}

/**
 * Ist die Fotoansicht für diesen Zustand möglich?
 * Bedingungen: Pool-Szene, genau eine Farbe (Modus Mosaik, keine Kanäle, kein Pattern),
 * Format 25 mm, Standardfuge, und für die aufgelöste Referenz gibt es Renders.
 * @param {object} state Zustand aus state.js
 * @param {{id:string, kol?:string, safe?:boolean}|null} ref aufgelöste Referenz (index.resolveRef)
 * @returns {{ok:boolean, grund?:string, refId?:string, views:string[], lichter:string[]}}
 */
export function fotoansicht(state, ref) {
  const nein = (grund) => ({ ok: false, grund, views: [], lichter: [] });
  if (!state || typeof state !== "object") return nein("zustand");
  if (state.szene !== "pool") return nein("szene");
  const mix = Array.isArray(state.mix) ? state.mix : [];
  if (mix.length !== 1 || (state.modus && state.modus !== "mosaik" && state.modus !== "rezept")) return nein("mischung");
  if (state.pattern || (Array.isArray(state.kanaele) && state.kanaele.length)) return nein("mischung");
  if (String(state.format) !== FOTO_FORMAT) return nein("format");
  if (String(state.fuge) !== FOTO_FUGE) return nein("fuge");
  if (!ref || !ref.id || ref.safe) return nein("farbe");
  const list = rendersFuer(ref.id, ref.kol);
  if (!list.length) return nein("farbe");
  const views = FOTO_VIEWS.filter((v) => list.some((r) => r.view === v));
  const lichter = FOTO_LICHTER.filter((l) => list.some((r) => r.licht === l));
  return { ok: true, refId: ref.id, views, lichter };
}

/**
 * Passendes Render für Ansicht + Licht. Fehlt das Licht in dieser Ansicht,
 * gilt das erste vorhandene Licht; fehlt die Ansicht, die erste vorhandene.
 */
export function renderFuer(refId, view = FOTO_VIEWS[0], licht = FOTO_LICHTER[0], serie) {
  const list = rendersFuer(refId, serie);
  if (!list.length) return null;
  const inView = list.filter((r) => r.view === view);
  const pool = inView.length ? inView : list.filter((r) => r.view === (FOTO_VIEWS.find((v) => list.some((x) => x.view === v)) || list[0].view));
  return pool.find((r) => r.licht === licht) || pool.find((r) => r.licht === FOTO_LICHTER[0]) || pool[0];
}
