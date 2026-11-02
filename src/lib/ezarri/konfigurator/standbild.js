// src/lib/ezarri/konfigurator/standbild.js – Standbild der 3D-Ansicht für das Druckblatt
// (QM Runde 1, P2-5). Ein Platz in localStorage (überschreibt das vorige Bild), gebunden
// an den Entwurf ?k=. localStorage statt sessionStorage, damit das Blatt auch in einem
// neuen Tab das Bild findet. Bleibt im Browser, wird nie gesendet.
export const SNAP_KEY = "ezk-snap";

/** Standbild ablegen. */
export function merkeStandbild(k, bild) {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify({ k, bild, t: Date.now() }));
  } catch {
    /* Speicher voll oder gesperrt – das Blatt rendert dann selbst */
  }
}

/** Standbild zum Entwurf k oder null. */
export function leseStandbild(k) {
  try {
    const v = JSON.parse(localStorage.getItem(SNAP_KEY) || "null");
    return v && v.k === k && typeof v.bild === "string" && v.bild.startsWith("data:image/") ? v.bild : null;
  } catch {
    return null;
  }
}
