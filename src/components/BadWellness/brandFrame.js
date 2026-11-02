// src/components/BadWellness/brandFrame.js
// QM R3 (01.11.2026): Markenrahmen mit mehreren Motiven (z. B. Dornbracht: TARA
// hochformatig + AQUAHALO querformatig). Jede Zelle bekommt flex-grow = Seiten-
// verhältnis und dasselbe aspect-ratio → alle Motive stehen gleich hoch neben-
// einander, ungeschnitten (object-contain bleibt). Pure, ohne React.

/** Inline-Style einer Zelle im Mehrfach-Rahmen. */
export function brandCell(image) {
  const w = Number(image?.width) > 0 ? Number(image.width) : 1;
  const h = Number(image?.height) > 0 ? Number(image.height) : 1;
  return { flex: `${(w / h).toFixed(4)} 1 0%`, aspectRatio: `${w} / ${h}` };
}

/**
 * QM R4 (02.11.2026): fünf Wellness-Marken standen ab @5xl als 3 + 2 mit leerer dritter
 * Spalte. Raster mit 6 Spuren: volle Reihen je 2 Spuren (3 Karten), bleiben am Ende zwei
 * Karten übrig, bekommen sie je 3 Spuren (zwei breite Karten füllen die Reihe).
 * @param {number} i Index der Karte
 * @param {number} n Anzahl Karten
 * @returns {string} Tailwind-Klasse (Literale für den Scanner)
 */
export function reihenSpan(i, n) {
  if (n % 3 === 2 && i >= n - 2) return "@5xl/page:col-span-3";
  return "@5xl/page:col-span-2";
}
