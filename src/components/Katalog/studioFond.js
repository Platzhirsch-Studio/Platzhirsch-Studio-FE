// src/components/Katalog/studioFond.js
// Marken, deren Packshots einen EIGENEN Studiogrund mit Horizont haben (Zalto: alle 22
// Bilder 2:3, oben weiß, unten grauer Spiegelboden). In einem 4:5-Rahmen (Kachel) bzw.
// auf der 5:4-Bühne (Produktseite) blieben links/rechts Streifen im Kachelton – das Foto
// stand als schmales graues Rechteck in der Fläche (Optik-QA r1).
// Lösung ohne Beschnitt: zu jedem Zalto-Hauptbild liegen zwei seitlich VERLÄNGERTE
// Fassungen neben dem Original (…-1-4x5.webp für die Kachel, …-1-5x4.webp für die Bühne).
// Jede Bildzeile setzt den Mittelwert ihrer äußeren 8 Spalten fort (24-px-Naht), das
// Herstellerbild bleibt pixelgleich in der Mitte, nichts wird skaliert oder abgeschnitten.
// Erzeugt mit scratchpad/qm/shop-r2/extend.cjs. Rein, ohne "@/"-Importe (node --test).
//
// Optik-QA r2 (01.11.2026): Die verlängerten Fassungen zeigten in der Kachel weiter Bänder
// (leichte Vignette im Original) und brachen als graue Studiofotos das Raster der hellen
// Freisteller. Für Kachel, Mini-Warenkorb und Warenkorb gibt es daher „-frei“: Flat-Field je
// Zeile (Pixel ÷ Grund der Zeile, aus den Randspalten geschätzt) → der Studiogrund wird weiß,
// das Glas behält seinen Kontrast; Spiegelung unten sanft ausgeblendet, 4:5 um das Glas.
// Erzeugt mit scratchpad/qm/shop-r2/frei.cjs. Die Bühne der Produktseite bleibt bei 5x4.

export const STUDIO_FOND = Object.freeze(new Set(["zalto"]));

// Optik-QA r3 (alle Geräte): Bei Gravitas Omega rechnete das Flat-Field die hellen Kelchkanten links und die
// obere Randlinie mit weg – das Glas wirkte abgeschnitten. Regel „Herstellerbilder nie verschlechtern“: für
// diese Bilder KEINE „-frei“-Fassung, Kachel und Warenkorb zeigen das unveränderte Original.
const OHNE_FREI = Object.freeze(new Set(["zalto-gravitas-omega-1.webp"]));

/** Nur das jeweils erste Herstellerbild (…-1.webp) hat Verlängerungen. */
const HAUPTBILD = /^\/Images\/Wellness\/produkte\/zalto\/zalto-[a-z0-9-]+-1\.webp$/;

/**
 * Verlängerte Fassung eines Studiofotos oder null.
 * @param {string|null|undefined} src
 * @param {string|null|undefined} markeSlug
 * @param {"4x5"|"5x4"|"frei"} format  frei = Kachel/Warenkorb (heller Grund), 5x4 = Bühne der Produktseite, 4x5 = alte Kachelfassung
 * @returns {string|null}
 */
export function studioFassung(src, markeSlug, format) {
  if (!STUDIO_FOND.has(markeSlug) || typeof src !== "string" || !HAUPTBILD.test(src)) return null;
  if (format === "frei" && OHNE_FREI.has(src.slice(src.lastIndexOf("/") + 1))) return null;
  return src.replace(/\.webp$/, `-${format}.webp`);
}
