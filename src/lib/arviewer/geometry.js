// Gemeinsame Geometrie-Regeln für AR-Foto und Raumbedarf (rein, Browser und Node).
// Muss zu scripts/arviewer/ar-foto.mjs footprintAxes() passen (Unit-Test prüft das).

/** Grundfläche in cm: B entlang x, T entlang z – lange Möbel (T > 1,5 × B) beim AR-Foto längs. */
export function footprintFor({ w, d }, laengsErlaubt = true) {
  const laengs = laengsErlaubt && d > 1.5 * w;
  return { x: laengs ? d : w, z: laengs ? w : d, laengs };
}
