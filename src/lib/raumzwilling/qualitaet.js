// src/lib/raumzwilling/qualitaet.js
// Bewertet die Frames eines Raumvideos, bevor die GPU eine Stunde rechnet.
// Rein (Browser und Server). Die Messwerte je Frame liefert
// tools/raumzwilling/frames.mjs (ffmpeg + sharp):
//   helligkeit  Mittel der Luma 0..255
//   schaerfe    Varianz des Laplace-Filters (480 px Graustufen)
//   bewegung    mittlere absolute Differenz zum vorigen Frame 0..255
// Ergebnis: ok oder eine Wiederholungsbitte mit Grund in Alltagssprache
// (Fallback 1 der Spezifikation: lieber noch einmal filmen als ein schlechter Raum).

import { QUALITAET } from "./config.js";

const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const GRUENDE = Object.freeze({
  "zu-kurz": "Das Video ist kürzer als {soll} Sekunden. Bitte gehen Sie einmal ganz um den Raum.",
  "zu-lang": "Das Video ist länger als {soll} Sekunden. Bitte kürzer aufnehmen.",
  "zu-dunkel": "Das Video ist zu dunkel (Helligkeit {wert} von 255, nötig sind mindestens {soll}). Bitte Licht einschalten und Vorhänge öffnen.",
  unscharf: "Viele Bilder sind unscharf (Schärfewert {wert}, nötig sind mindestens {soll}). Bitte das Handy ruhiger halten.",
  "zu-schnell": "Die Kamera bewegt sich zu schnell (Bewegung {wert}, höchstens {soll}). Bitte langsamer gehen, etwa 90 Sekunden für den Raum.",
  "zu-wenig-gut": "Nur {wert} % der Bilder sind brauchbar, nötig sind {soll} %. Bitte langsamer und mit Licht noch einmal.",
});

function grund(code, wert, soll) {
  const text = GRUENDE[code].replace("{wert}", String(wert)).replace("{soll}", String(soll));
  return { code, wert, soll, text };
}

/**
 * @param {{ dauer:number, frames: {helligkeit:number, schaerfe:number, bewegung?:number}[] }} messung
 * @param {typeof QUALITAET} q
 */
export function bewerteVideo(messung, q = QUALITAET, maxSekunden = 120) {
  const { dauer, frames } = messung;
  const gruende = [];
  if (!(dauer >= q.minSekunden)) gruende.push(grund("zu-kurz", Math.round(dauer || 0), q.minSekunden));
  if (dauer > maxSekunden + 2) gruende.push(grund("zu-lang", Math.round(dauer), maxSekunden));
  const hell = median(frames.map((f) => f.helligkeit));
  const scharf = median(frames.map((f) => f.schaerfe));
  const bew = median(frames.filter((f) => Number.isFinite(f.bewegung)).map((f) => f.bewegung));
  const gut = frames.filter((f) => f.helligkeit >= q.minHelligkeit && f.schaerfe >= q.minSchaerfe && !(f.bewegung > q.maxBewegung));
  const anteil = frames.length ? gut.length / frames.length : 0;

  if (frames.length && hell < q.minHelligkeit) gruende.push(grund("zu-dunkel", Math.round(hell), q.minHelligkeit));
  if (frames.length && scharf < q.minSchaerfe) gruende.push(grund("unscharf", Math.round(scharf), q.minSchaerfe));
  if (frames.length && bew > q.maxBewegung) gruende.push(grund("zu-schnell", Math.round(bew), q.maxBewegung));
  // Nur melden, wenn kein konkreterer Grund da ist.
  if (frames.length && !gruende.length && anteil < q.minAnteilGut) {
    gruende.push(grund("zu-wenig-gut", Math.round(anteil * 100), Math.round(q.minAnteilGut * 100)));
  }
  if (!frames.length) gruende.push(grund("zu-wenig-gut", 0, Math.round(q.minAnteilGut * 100)));

  return {
    ok: gruende.length === 0,
    gruende,
    werte: { dauer: Math.round(dauer || 0), helligkeit: Math.round(hell), schaerfe: Math.round(scharf), bewegung: Math.round(bew), anteilGut: Math.round(anteil * 100) },
    gueltigeFrames: gut.length,
  };
}

/** Wählt bis zu n gute, über die Zeit verteilte Frames (Standbilder für den Fallback). */
export function waehleStandbilder(frames, n = 3, q = QUALITAET) {
  const gut = frames
    .map((f, i) => ({ ...f, i }))
    .filter((f) => f.helligkeit >= q.minHelligkeit && f.schaerfe >= q.minSchaerfe);
  const pool = gut.length >= n ? gut : frames.map((f, i) => ({ ...f, i }));
  if (!pool.length) return [];
  const out = [];
  for (let k = 0; k < n; k++) {
    const lo = Math.floor((k * pool.length) / n);
    const hi = Math.max(lo + 1, Math.floor(((k + 1) * pool.length) / n));
    const fenster = pool.slice(lo, hi);
    out.push(fenster.reduce((b, f) => (f.schaerfe > b.schaerfe ? f : b), fenster[0]).i);
  }
  return [...new Set(out)];
}
