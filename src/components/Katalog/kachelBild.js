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

/**
 * Leitbild eines Produkts (Inhaber 03.11.2026): das Bild der Kachel in Listen – auch für
 * Merkliste, Kaufbox, „Zuletzt angesehen“, og:image und Sitemap-Bilder der LISTEN. Die
 * Produktseite selbst (Hero, og:image, JSON-LD, Sitemap der Produktseite) nutzt detailBild.
 * Regel je Welt, immer nur Auswahl aus p.bilder (nie verändert):
 *   - Shop-Welt accessoires: Freisteller > Raumbild > Detail > bilder[0] – wie ShopKachel
 *     (shopIndex.kachelBilder) und shopGalerie.
 *   - sonst (bad-wellness, kuechengeraete): kachelBild(p) – Freisteller-Index der Marke
 *     (Dornbracht), Querformat statt schmalem Hochformat, sonst bilder[0].
 * Minotti läuft nicht über den statischen Katalog (Backoffice-Produkte, eigene Seiten) –
 * unberührt.
 * @param {{welt?: string, marke?: string, slug?: string, bilder?: object[]}} p
 */
export function leitbild(p) {
  const bilder = Array.isArray(p?.bilder) ? p.bilder.filter((b) => b?.src) : [];
  if (!bilder.length) return null;
  if (p.welt === "accessoires") {
    const typ = (b) => (b.typ === "ambiente" || b.typ === "detail" ? b.typ : "freisteller");
    return bilder.find((b) => typ(b) === "freisteller") || bilder.find((b) => typ(b) === "ambiente") || bilder[0];
  }
  return kachelBild(p) || bilder[0];
}

/**
 * Bildliste mit dem Leitbild an erster Stelle, danach `liste` (Standard: p.bilder) in ihrer
 * bisherigen Reihenfolge ohne das Leitbild – für Galerie, JSON-LD image[] und Sitemap.
 * @param {object} p
 * @param {object[]} [liste]
 */
export function mitLeitbild(p, liste = p?.bilder) {
  const rest = (Array.isArray(liste) ? liste : []).filter((b) => b?.src);
  const leit = leitbild(p);
  if (!leit) return rest;
  return [leit, ...rest.filter((b) => b.src !== leit.src)];
}

/**
 * Hero der Produktseite (Inhaber 03.11.2026, Korrektur): auf der Detailseite soll das Raum-Motiv
 * stehen – Raumbild (ambiente) > Freisteller > bilder[0]; Dornbracht TARA eröffnet also mit tara-3
 * („So wirkt es im Raum“), die Kachel bleibt beim Freisteller (leitbild). Produkte ohne Raumbild
 * behalten ihren bisherigen Hero (erster Freisteller: Quooker). Shop-Welt accessoires: wie leitbild
 * (Freisteller zuerst – Zalto Gravitas Omega eröffnet nicht mit dem 16:7-Szenenfoto, shopGalerie).
 * og:image, JSON-LD image[0] und die Sitemap der Produktseite folgen diesem Bild (mitDetailBild).
 * @param {{welt?: string, bilder?: object[]}} p
 */
export function detailBild(p) {
  const bilder = Array.isArray(p?.bilder) ? p.bilder.filter((b) => b?.src) : [];
  if (!bilder.length) return null;
  if (p.welt === "accessoires") return leitbild(p);
  const typ = (b) => (b.typ === "ambiente" || b.typ === "detail" ? b.typ : "freisteller");
  return bilder.find((b) => typ(b) === "ambiente") || bilder.find((b) => typ(b) === "freisteller") || bilder[0];
}

/** Wie mitLeitbild, mit dem Hero der Produktseite (detailBild) an erster Stelle. */
export function mitDetailBild(p, liste = p?.bilder) {
  const rest = (Array.isArray(liste) ? liste : []).filter((b) => b?.src);
  const hero = detailBild(p);
  if (!hero) return rest;
  return [hero, ...rest.filter((b) => b.src !== hero.src)];
}

/** Einheitlicher Sitz im Rahmen (Klassen für next/image, absolut im Rahmen). */
export const KACHEL_BILD_CLASS = "absolute inset-0 block h-full w-full object-contain p-[5%] mix-blend-multiply";
