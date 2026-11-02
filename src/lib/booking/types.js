// src/lib/booking/types.js – Terminarten des Online-Kalenders.
// Schlüssel wie PH Terminart (Spezifikation B7). Planungstermine haben ein
// Thema und einen Ort (Studio oder Video); das Backoffice bekommt `modus`
// als Parameter. Texte: src/lib/booking/copy.js. Keine "@/..."-Importe.

/**
 * dauer: Minuten des Gesprächs; puffer: Minuten danach; vorher: Minuten davor
 * (Anfahrt bei Vor Ort); starts: feste Startzeiten statt Raster;
 * days: Wochentage (0 = So) zusätzlich zu den Öffnungszeiten;
 * bestaetigung: "sofort" (gebucht) | "anfrage" (Team bestätigt persönlich).
 */
export const TERMINARTEN = Object.freeze({
  studio: { key: "studio", modus: "studio", dauer: 60, puffer: 15, vorher: 0, bestaetigung: "sofort" },
  video: { key: "video", modus: "video", dauer: 45, puffer: 15, vorher: 0, bestaetigung: "sofort" },
  vor_ort: { key: "vor_ort", modus: "vor_ort", dauer: 90, puffer: 60, vorher: 60, bestaetigung: "anfrage", starts: ["10:00", "14:00"], days: [2, 3, 4, 5] },
  planung: { key: "planung", modus: null, modi: ["studio", "video"], dauer: 90, puffer: 15, vorher: 0, bestaetigung: "sofort", themen: ["kueche", "wohnen", "ezarri", "licht", "yacht", "hotel"] },
});

export const ART_KEYS = Object.keys(TERMINARTEN);
export const THEMEN = TERMINARTEN.planung.themen;
export const MODI = ["studio", "video", "vor_ort"];

/** Ort des Termins: Planungstermin → gewählter Modus, sonst der feste. */
export function modusOf(art, modus) {
  const t = TERMINARTEN[art];
  if (!t) return null;
  if (t.modus) return t.modus;
  return t.modi.includes(modus) ? modus : null;
}

export function artOf(key) {
  return TERMINARTEN[key] || null;
}
