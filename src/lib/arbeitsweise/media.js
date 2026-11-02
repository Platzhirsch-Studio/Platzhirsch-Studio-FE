// src/lib/arbeitsweise/media.js – die EINE Bildquelle der Seite /de/arbeitsweise.
//
// Regel (Kern-USP, Marktresearch/digital/features/usp-handzeichnung-designprozess.md):
// NUR ECHTES MATERIAL von Harald Menghin bzw. aus echten Projekten. Keine
// KI-generierten Skizzen, Modellfotos, Räume oder Renderings, die als
// Platzhirsch-Arbeit erscheinen (UWG, AI Act Art. 50). Keine Komponente kennt
// einen Bildpfad – echte Bilder werden NUR HIER eingetragen.
//
// Jeder Slot ist `null` (fehlt noch) oder ein Objekt:
//   {
//     src: "/arbeitsweise/handzeichnung-wohnraum-2026-09.avif", // unter public/arbeitsweise/
//     srcMobile: "…-4x5.avif",       // nur `rendering`: 4:5-Fassung derselben Kamera (Art Direction)
//     alt: "Handzeichnung eines Wohnraums mit Sofa vor dem Fenster und Esstisch zum Garten",
//     width: 3000, height: 2000,      // Originalmaß (Seitenverhältnis wird geprüft)
//     credit: "Handzeichnung: Harald Menghin",
//     datum: "09/2026",               // Monat/Jahr
//     projekt: "P-2026-014",          // interne Projekt-ID (nicht angezeigt)
//     einwilligung: "BR-2026-031",    // Verweis ins Bildregister (Einwilligung Bauherrschaft/Person)
//     kiStufe: "keine",               // bei Skizze und Modell IMMER "keine"; bei Renderings ehrliche Angabe
//     typ: "skizze",                  // skizze | modell | rendering | foto | screenshot
//     caption: "Handzeichnung: Harald Menghin, 09/2026", // optional, sonst credit + datum
//   }
//
// Fehlende Slots: der Bildplatz entfällt überall (Text und Schema-Grafik
// bleiben) – Fix-Runde 1 (F1, Release-Rat recht P0-3 / ux P1-6): auch im
// Dev-Server kein „Bild folgt“, kein leerer Rahmen, keine „Projekt-Kette folgt“.
// Nur zur Bildplanung (Styleguide/Staging) lassen sich die gestalteten
// Platzhalter (data-placeholder="arbeitsweise") mit
// NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER="1" einblenden.
//
// LAUNCH-LISTE (Doku: Marktresearch/digital/features/arbeitsweise.md):
// `handzeichnung`, `modell`, `rendering` und `portrait` sollen echt eingetragen
// werden (missingForLaunch() zeigt, was fehlt). Runde 2 (r2-seo P0-1,
// Inhaber-Entscheidung Nr. 9 „Fehlendes innerhalb der Seite lösen, nicht
// verstecken“): die Indexierung hängt NICHT mehr an den Bildslots – die Seite
// trägt rein typografisch und ist index, follow.
//
// SHOTLISTE für Harald (Reihenfolge = Wirkung, feedback-1 P1-3):
//   1. portrait   – Harald beim Zeichnen, Blick aufs Blatt (4:5)
//   2. handzeichnung – Skizze, gescannt (3:2)
//   3. modell     – Modellfoto mit Hand im Bild (1:1)
//   4. rendering  – 21:9 plus srcMobile 4:5
//   5. hero       – Hand + Stift + Blatt, echtes Foto (4:5)
//   danach KETTE: ein Projekt komplett, mit Einwilligung der Bauherrschaft.
//
// IMPORT (Rat 9,5, A14): Haralds Lieferung kommt über
//   node tools/arbeitsweise/import.mjs --in <lieferordner>
// nach src/lib/arbeitsweise/media-import.js (erzeugt; AVIF unter
// public/arbeitsweise/). Die Werte unten bleiben `null`, ein importierter Slot
// ersetzt sie. Probelauf-Objekte (`probelauf: true`) erreichen die Seite nie.
//
// Rein, ohne React und ohne Pakete (node --test importiert die Datei).
import { IMPORT_KETTE, IMPORT_MEDIA } from "./media-import.js";

/** @typedef {null | {src: string, srcMobile?: string, alt: string, width: number, height: number, credit: string, datum?: string, projekt?: string, einwilligung: string, kiStufe: string, typ: "skizze"|"modell"|"rendering"|"foto"|"screenshot", caption?: string}} Slot */

/** Nur bekannte Schlüssel übernehmen, Probelauf-Objekte nie. */
function merge(base, imported) {
  const out = { ...base };
  for (const [k, v] of Object.entries(imported || {})) {
    if (k in base && v && v.probelauf !== true) out[k] = v;
  }
  return out;
}

/** @type {Record<string, Slot>} */
const MEDIA_BASE = {
  // Auftakt rechts neben dem Titel (mobil unter dem Lead): echtes Foto „Hand + Stift + Blatt“,
  // Harald am Zeichentisch (4:5), typ "foto", kein Projektbezug nötig. Solange null:
  // ab 1024 px das Schema (Phase 3) als ruhiges Standbild, mobil nichts.
  hero: null,
  // Schritt 01 – Gespräch im Café oder am Tisch mit Mustern (3:2, Personen nur mit Einwilligung)
  kennenlernen: null,
  // Schritt 02 – Aufmaß, Raum mit Tageslicht, Notizbuch (3:2, ohne Adresse, ohne Hausfront)
  vorOrt: null,
  // Schritt 03 – Scan einer Skizze (3:2 oder 4:5), typ "skizze", kiStufe "keine"
  handzeichnung: null,
  // Schritt 04 – Modellfoto mit Hand oder Maßstabsfigur (1:1), typ "modell", kiStufe "keine"
  modell: null,
  // Schritt 05 – Screenshot der 3D-Planung mit Maßen (3:2), typ "screenshot"
  planung3d: null,
  // Schritt 06 – fotorealistisches Rendering (21:9, dazu srcMobile 4:5), typ "rendering"
  rendering: null,
  // Schritt 07 – Foto des fertigen Raums (3:2), typ "foto"
  umsetzung: null,
  // Harald beim Zeichnen, Blick auf das Blatt (4:5), typ "foto"
  portrait: null,
};

/** @type {Record<string, Slot>} */
export const MEDIA = merge(MEDIA_BASE, IMPORT_MEDIA);

/**
 * Vorher-Nachher-Kette EINES echten Projekts (3:2, gleiche Blickrichtung, wo machbar).
 * Erscheint in Produktion nur, wenn alle fünf Bilder vorliegen.
 * `fakten` nur mit echten Daten: { region, typologie, flaeche, dauer }.
 */
export const KETTE = merge(
  {
    vorher: null,
    skizze: null,
    modell: null,
    rendering: null,
    umsetzung: null,
    fakten: null,
  },
  IMPORT_KETTE
);

/**
 * Rat 9,5 (B8, gesamtwerk M6): echte Ausgabe unserer EIGENEN Werkzeuge als
 * Beispiel, solange der passende Slot leer ist. Kein Material von Harald,
 * kein Kundenprojekt – die Seite beschriftet es als „Beispiel aus unserem
 * Küchenplaner“. Der Slot `planung3d` (echter Screenshot aus einem Projekt)
 * hat Vorrang, sobald er eingetragen ist.
 */
export const WERKZEUG_BEISPIEL = Object.freeze({
  planung3d: Object.freeze({
    src: "/bilder/leistungen/kuechenplaner.webp", // Grafik des Küchenplaners (/de/kuechenplaner), 1200 × 800
    width: 1200,
    height: 800,
    typ: "screenshot",
    werkzeug: "/kuechenplaner",
  }),
});

/** Seitenverhältnis je Slot (Bibel §6: nur 21:9, 4:5, 3:2, 1:1, 9:16). */
export const RATIO = {
  hero: "4/5",
  kennenlernen: "3/2",
  vorOrt: "3/2",
  handzeichnung: "3/2",
  modell: "1/1",
  planung3d: "3/2",
  rendering: "21/9",
  umsetzung: "3/2",
  portrait: "4/5",
};

/** Slots, die vor dem Livegang echt vorliegen müssen (Konzept §6.3). */
export const LAUNCH_REQUIRED = ["handzeichnung", "modell", "rendering", "portrait"];

/** Slots mit Haralds Werk: brauchen credit, einwilligung und kiStufe "keine" (Skizze, Modell). */
export const HAND_SLOTS = ["handzeichnung", "modell"];

const RAW_FLAG = process.env.NEXT_PUBLIC_ARBEITSWEISE_PLATZHALTER;

/**
 * Zeigt die Seite Platzhalter „Bild folgt“? Nur mit dem Schalter "1" (F1:
 * nicht mehr automatisch im Dev-Server – sonst sah die Abnahme eine andere
 * Seite als die Produktion).
 * @param {string|undefined} [raw]
 * @param {string|undefined} [_nodeEnv] (früher: Vorschau außerhalb der Produktion; bleibt für die Signatur)
 */
export function placeholdersVisible(raw = RAW_FLAG, _nodeEnv = process.env.NODE_ENV) {
  const v = typeof raw === "string" ? raw.trim() : raw;
  return v === "1";
}

export const SHOW_PLACEHOLDERS = placeholdersVisible();

/** Slot lesen (null, wenn nicht eingetragen oder unbekannt). */
export function slot(key, media = MEDIA) {
  return media[key] ?? null;
}

/** Sind alle fünf Bilder der Kette da? */
export function chainComplete(kette = KETTE) {
  return ["vorher", "skizze", "modell", "rendering", "umsetzung"].every((k) => Boolean(kette[k]?.src));
}

/** Fehlende Pflicht-Slots für den Livegang (leer = bereit). */
export function missingForLaunch(media = MEDIA) {
  return LAUNCH_REQUIRED.filter((k) => !media[k]?.src);
}

/**
 * Robots-Angabe der Seite: immer index, follow (r2-seo P0-1, Entscheidung Nr. 9).
 * Früher noindex, bis alle Pflicht-Slots echt waren; die Seite zeigt ohne Bilder
 * aber keinen Platzhalter, sondern trägt typografisch. Der Parameter bleibt für
 * die Signatur, beeinflusst das Ergebnis aber nicht mehr.
 * @returns {{index: true, follow: true}}
 */
export function robotsForLaunch(_media = MEDIA) {
  return { index: true, follow: true };
}

/** Wie viele Bilder der Kette sind echt da? */
export function chainCount(kette = KETTE) {
  return ["vorher", "skizze", "modell", "rendering", "umsetzung"].filter((k) => Boolean(kette[k]?.src)).length;
}

/**
 * Prüft eingetragene Slots auf die Pflichtfelder (Unit-Test, Konzept §6.4).
 * @param {{allowProbe?: boolean}} [opts] allowProbe: Probelauf-Objekte zulassen (nur import.mjs --probe)
 * @returns {string[]} Fehlermeldungen (leer = in Ordnung)
 */
export function validateMedia(media = MEDIA, kette = KETTE, { allowProbe = false } = {}) {
  const errors = [];
  const check = (key, s) => {
    if (s == null) return;
    if (s.probelauf === true && !allowProbe) errors.push(`${key}: Probelauf-Objekt (import.mjs --probe) darf nicht auf die Seite`);
    for (const f of ["src", "alt", "width", "height", "credit", "einwilligung", "kiStufe", "typ"]) {
      if (s[f] == null || s[f] === "") errors.push(`${key}: Feld „${f}“ fehlt`);
    }
    if (typeof s.src === "string" && !s.src.startsWith("/arbeitsweise/")) errors.push(`${key}: Bild muss unter public/arbeitsweise/ liegen`);
    if (/\b(ai|ki)[-_]?(generated|generiert)|midjourney|dall-?e|stable-?diffusion/i.test(`${s.src} ${s.credit}`)) errors.push(`${key}: KI-generiertes Material ist verboten`);
  };
  for (const [key, s] of Object.entries(media)) check(key, s);
  for (const [key, s] of Object.entries(kette)) if (key !== "fakten") check(`kette.${key}`, s);
  for (const key of HAND_SLOTS) {
    const s = media[key];
    if (s && s.kiStufe !== "keine") errors.push(`${key}: Haralds Handwerk muss kiStufe "keine" haben`);
  }
  for (const key of ["skizze", "modell"]) {
    const s = kette[key];
    if (s && s.kiStufe !== "keine") errors.push(`kette.${key}: Haralds Handwerk muss kiStufe "keine" haben`);
  }
  return errors;
}
