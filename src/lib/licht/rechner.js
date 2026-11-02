// Bodensee-Licht (N4) – alle Werte, die die Seite aus einem Lichtzustand
// berechnet, in EINER reinen Funktion (R4 technik P1-1 / neuland P1-4).
//
// Läuft an drei Stellen mit demselben Ergebnis:
//   - auf dem Server (bodensee-licht/page.js) für das erste Bild – der Browser
//     rechnet beim Hydrieren nichts nach,
//   - im Web Worker (rechner.worker.js) bei jeder Änderung – der Hauptthread
//     bleibt frei, auch während „Tag abspielen“,
//   - als Rückfall im Hauptthread, wenn der Browser keinen Worker startet.
// Ohne React und ohne DOM; nur Zahlen, Ergebnis ist strukturiert kopierbar.
import { sonnenBahn, sonnenTag, sonnenZeitenFenster } from "./sonne.js";
import { ortVon, sonneVon } from "./zustand.js";

/** Lichtzustand → { schluessel, sonne, tag, bahn, fensterZeiten } */
export function lichtDaten(z) {
  const ort = ortVon(z);
  return {
    schluessel: datenSchluessel(z),
    sonne: sonneVon(z),
    tag: sonnenTag(ort, z.datum),
    bahn: sonnenBahn(ort, z.datum, 10),
    fensterZeiten: sonnenZeitenFenster(ort, z.datum, z.fenster),
  };
}

/** Welche Eingaben das Ergebnis bestimmen (Szene und Blick nicht). */
export function datenSchluessel(z) {
  return [z.ort || `${z.lat},${z.lon}`, z.datum, z.minuten, z.fenster].join("|");
}
