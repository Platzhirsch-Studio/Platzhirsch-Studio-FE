// Bodensee-Licht (N4) – vorgerenderte Stundensequenz als Erstbild
// (R4 technik P1-1, neuland P1-4: mobil keine leere Ladefläche, TBT < 200 ms).
//
// Die Bilder unter public/licht/poster/ sind BERECHNETE DARSTELLUNGEN: dieselbe
// schematische three.js-Szene wie die 3D-Ansicht (LichtSzene.js), mit demselben
// NOAA-Sonnenstand, offline gerendert (Chromium mit GPU, Skript
// ../platzhirsch-gpu-tools/licht/render-poster.mjs) und als WebP gespeichert.
// Kein Foto, kein KI-Bild, keine Herstellerbilder. Inhalte: eigener Code,
// Himmel nach Preetham (three.js Sky.js, MIT), Materialbilder CC0 (ambientCG),
// Mosaik im Browser erzeugt. Lizenz der Bilder: eigene Erzeugung von Platzhirsch,
// frei verwendbar; Nachweis im README neben dem Skript.
//
// Sequenz: Lochau, Fenster Südwest (225°), Blick „Zum Fenster“/„Terrasse“, je
// Szene (Küche, Pool) × drei Tage (21. Juni, 20. März ≈ 23. September,
// 21. Dezember) × volle Stunden 6–21 Uhr, in 640, 960 und 1280 px Breite.
// Die Seite zeigt das Bild, das dem Zustand am nächsten liegt, und sagt in
// der Bildunterschrift, für welchen Ort, Tag und welche Stunde es gerechnet ist.
// Die genaue Ansicht für den eigenen Zustand liefert die 3D-Szene, die erst bei
// Interaktion (Desktop: sichtbar + Leerlauf) lädt.
import { sonnenTag } from "./sonne.js";
import { ortNachId } from "./zustand.js";

export const POSTER_BASIS = "/licht/poster";
const LOCHAU = ortNachId("lochau");
export const POSTER_ORT = { id: "lochau", name: "Lochau", lat: LOCHAU.lat, lon: LOCHAU.lon };
export const POSTER_FENSTER = 225;
export const POSTER_BREITEN = [640, 960, 1280];
export const POSTER_STUNDEN = Array.from({ length: 16 }, (_, i) => 6 + i); // 6 … 21 Uhr
export const POSTER_TAGE = [
  { id: "juni", datum: "2026-06-21", label: "21. Juni" },
  { id: "maerz", datum: "2026-03-20", label: "20. März" },
  { id: "dezember", datum: "2026-12-21", label: "21. Dezember" },
];
export const POSTER_SZENEN = ["kueche", "pool"];

// Mittagshöhe der Sonne in Lochau je Tag der Sequenz (Grad).
let mittag = null;
const mittagshoehen = () =>
  (mittag ??= POSTER_TAGE.map((t) => sonnenTag(POSTER_ORT, t.datum).hoeheMittag));

/** Tag der Sequenz, dessen Sonnenhöhe dem Datum am nächsten liegt. */
export function posterTag(datum) {
  let h;
  try {
    h = sonnenTag(POSTER_ORT, datum).hoeheMittag;
  } catch {
    return POSTER_TAGE[1];
  }
  const hs = mittagshoehen();
  let best = 0;
  for (let i = 1; i < hs.length; i++) if (Math.abs(hs[i] - h) < Math.abs(hs[best] - h)) best = i;
  return POSTER_TAGE[best];
}

/** Volle Stunde der Sequenz, die `minuten` am nächsten liegt. */
export function posterStunde(minuten) {
  const s = Math.round((Number(minuten) || 0) / 60);
  return Math.min(POSTER_STUNDEN.at(-1), Math.max(POSTER_STUNDEN[0], s));
}

export const posterDatei = (szene, tagId, stunde, breite, format = "webp") =>
  `${POSTER_BASIS}/${szene}-${tagId}-${String(stunde).padStart(2, "0")}-${breite}.${format}`;

/**
 * Poster für einen Lichtzustand:
 * { src, srcSet, avifSrcSet, tag, stunde, szene, genau, text }
 * R5 (neuland P1-4): Sequenz neu gerendert (Putz, Eiche, Leinen, Seeblick), dazu AVIF.
 * `genau` = das Bild zeigt genau diesen Zustand (Ort, Fenster, Tag, Uhrzeit).
 */
export function posterFuer(z) {
  const szene = z?.szene === "pool" ? "pool" : "kueche";
  const tag = posterTag(z?.datum);
  const stunde = posterStunde(z?.minuten);
  const srcSet = POSTER_BREITEN.map((b) => `${posterDatei(szene, tag.id, stunde, b)} ${b}w`).join(", ");
  const avifSrcSet = POSTER_BREITEN.map((b) => `${posterDatei(szene, tag.id, stunde, b, "avif")} ${b}w`).join(", ");
  const genau =
    z?.ort === POSTER_ORT.id &&
    z?.fenster === POSTER_FENSTER &&
    typeof z?.datum === "string" &&
    z.datum.slice(5) === tag.datum.slice(5) &&
    z?.minuten === stunde * 60;
  const blick = szene === "pool" ? "Blick vom Haus nach Südwesten" : "Fenster nach Südwesten";
  const text = `Berechnete Darstellung, kein Foto: ${POSTER_ORT.name}, ${blick}, ${tag.label}, ${stunde}:00 Uhr.`;
  return { src: posterDatei(szene, tag.id, stunde, POSTER_BREITEN[0]), srcSet, avifSrcSet, tag, stunde, szene, genau, text };
}
