// src/lib/portal/tagebuch/anzeige.js — Nennung, Ort und Bildnachweis auf der
// öffentlichen Seite. Ohne zod, damit Client-Komponenten (Vorschau) es klein laden.
import { ANONYM_ORT } from "./config.js";

/** Ort, wie er öffentlich steht. */
export function oeffentlicherOrt(anzeige) {
  return anzeige?.art === "vorname_ort" && anzeige.ort ? anzeige.ort : ANONYM_ORT;
}

/** Nennung „Anna, Hörbranz“ oder null (anonym). */
export function nennungVon(anzeige) {
  return anzeige?.art === "vorname_ort" && anzeige.vorname ? `${anzeige.vorname}, ${anzeige.ort}` : null;
}

/** Bildnachweis. Anonym → kein Name des Kunden. */
export function fotografVon(bild, anzeige) {
  if (bild.phase === "skizze") return "Harald Menghin (Handzeichnung)";
  if (bild.von === "team") return "Platzhirsch Home Living";
  return anzeige?.art === "vorname_ort" && anzeige.vorname ? anzeige.vorname : "Bauherren";
}
