// src/components/Katalog/kachelBild.js – welches Herstellerbild eine Katalog-Kachel
// zeigt und wie es im Rahmen sitzt (QM-Abnahme Küche/Bad/Outdoor R1, 01.11.2026).
//
// Befund: Im 4:3-Raster standen Freisteller auf Weiß, Bilder auf Beige, randabfallende
// Fotos und Dornbracht-Bilder mit grellen Farbverläufen nebeneinander; Hochformate
// steckten schmal in breiten Kästen. Regeln (Bilder werden nur ausgewählt bzw. anders
// gereiht, nie verändert – Minotti ist nicht im Katalog):
//   1. Marken mit eigenem Freisteller je Produkt (Dornbracht: Bild 2 auf Weiß) zeigen in
//      der Kachel den Freisteller statt des Farbverlaufs.
//   2. Ist das erste Bild deutlich hochformatig, nimmt die Kachel das erste Bild der Liste,
//      das annähernd quer oder quadratisch ist (sonst bleibt es beim ersten).
//   3. Alle Kachelbilder sitzen gleich: object-contain mit gleichem Passepartout im
//      Kachelton; weißer Bildgrund verschmilzt per mix-blend-multiply mit der Fläche.
// Rein, ohne "@/"-Importe (node --test: tests/unit/optik4-kueche-bad-outdoor.test.mjs).

/** Marke → Index des Freistellers in p.bilder (nur wenn er existiert). */
export const FREISTELLER_INDEX = Object.freeze({ dornbracht: 1 });

/**
 * QM R4: Produkt → Index des Bildes auf weißem Grund, wo es von FREISTELLER_INDEX abweicht
 * (Eckpixel-Prüfung aller Dornbracht-Bilder, 02.11.2026: bei TARA Küche ist Bild 1 der
 * Freisteller auf Weiß, Bild 2 der Farbverlauf).
 */
export const KACHEL_INDEX = Object.freeze({ "dornbracht-tara-kueche": 0 });

const ratio = (b) => (b && b.width && b.height ? b.width / b.height : 1);

/**
 * @param {{marke?: string, bilder?: Array<{src: string, width?: number, height?: number}>}} p
 * @returns {object|null} das Bild für die Kachel
 */
export function kachelBild(p) {
  const bilder = Array.isArray(p?.bilder) ? p.bilder.filter((b) => b?.src) : [];
  if (!bilder.length) return null;
  const fi = KACHEL_INDEX[p.slug] ?? FREISTELLER_INDEX[p.marke];
  if (fi != null && bilder[fi]) return bilder[fi];
  if (ratio(bilder[0]) < 0.8) {
    const quer = bilder.find((b) => ratio(b) >= 0.9);
    if (quer) return quer;
  }
  return bilder[0];
}

/** Einheitlicher Sitz im Rahmen (Klassen für next/image, absolut im Rahmen). */
export const KACHEL_BILD_CLASS = "absolute inset-0 block h-full w-full object-contain p-[5%] mix-blend-multiply";
