// Reine Konstanten zu Frappe-Feldtypen und Farben – OHNE node:fs, damit Client-
// Komponenten (Formular, DataTable) sie importieren können. meta.js re-exportiert sie.

/** Frappe-Farbnamen (DocType.states) → Badge-Ton. */
export const FARBE_TON = {
  Blue: "blau",
  "Light Blue": "blau",
  Cyan: "blau",
  Purple: "lila",
  Pink: "lila",
  Green: "gruen",
  Orange: "orange",
  Yellow: "orange",
  Red: "rot",
  Gray: "grau",
  Grey: "grau",
};

/** Workflow-State-Style (Primary/Info/Success/Warning/Danger/Inverse) → Badge-Ton. */
export const STYLE_TON = { Primary: "blau", Info: "blau", Success: "gruen", Warning: "orange", Danger: "rot", Inverse: "grau" };

export const LAYOUT_FELDTYPEN = new Set(["Section Break", "Column Break", "Tab Break"]);
export const NICHT_ANZEIGEN = new Set(["Button", "Fold", "HTML", "Heading", "Image", "Geolocation", "Signature", "Password"]);
