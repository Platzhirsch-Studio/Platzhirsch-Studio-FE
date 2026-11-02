// src/lib/ezarri/images.js – Bildquellen der Ezarri-Welt für <picture>.
//
// Alle Ezarri-Bilder liegen in public/ezarri/<kollektion>/<name>-{600,1600}.{avif,webp}
// (≤ 200 KB, siehe Herstellermaterial/Ezarri/00-INDEX.md). Sie sind schon
// optimiert → <picture> mit diesen srcsets oder next/image mit `unoptimized`.
// Jedes Bild bekommt sichtbar die Quellenangabe (config.js → ezarriCredit()).
//
// Rein (keine Imports): Server- und Client-Komponenten, node --test.

/** Kompakte Bildangabe aus einem Datensatz-Bild (für Karten und Client-Props). */
export function compactImage(img) {
  if (!img?.web) return null;
  return { web: img.web, breite: img.breite || 1600, hoehe: img.hoehe || 1600 };
}

/**
 * Bildquellen einer Web-Basis ("/ezarri/gea/anw-cam4-basalt50").
 * @param {{web?: string, breite?: number, hoehe?: number, quelle?: string}|null} img
 * @param {number[]} [stufen] zusätzliche Breiten, für die Dateien <web>-<b>.{avif,webp} existieren
 */
export function imageSources(img, stufen = []) {
  if (!img?.web) return null;
  const w = img.breite || 1600;
  const h = img.hoehe || 1600;
  const small = Math.min(600, w);
  // Zwischenstufen (QM r2: Kollektionskacheln -900/-1200, nur verkleinert aus -1600) – nur, wenn
  // die Stufe kleiner als die größte Datei ist (sonst gibt es sie nicht).
  const breiten = [600, ...stufen.filter((x) => x > 600 && x < Math.min(w, 1600)), 1600];
  const set = (ext) => breiten.map((b) => `${img.web}-${b}.${ext} ${b}w`).join(", ");
  return {
    avif: set("avif"),
    webp: set("webp"),
    src: `${img.web}-600.webp`,
    width: small,
    height: Math.round((h / w) * small),
    ratio: `${w} / ${h}`,
    quelle: img.quelle ?? null,
  };
}
