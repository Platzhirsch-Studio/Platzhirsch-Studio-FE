// src/lib/portal/tagebuch/bildPipeline.js — Fotos fürs Projekt-Tagebuch (ohne
// "server-only", damit tests/unit/tagebuch.test.mjs es direkt prüfen kann; nur
// von Server-Code importieren).
//
// Jedes Bild wird mit sharp NEU KODIERT: Ausrichtung aus EXIF angewendet
// (.rotate()), danach AVIF und WebP in BILD_BREITEN. sharp schreibt ohne
// .withMetadata()/.keepExif() KEINE Metadaten: EXIF (inkl. GPS), XMP, IPTC und
// Kameradaten fallen weg. Das Original wird nicht gespeichert.
import sharp from "sharp";
import { detectType } from "../../upload/magic.js";
import { BILD_BREITEN } from "./config.js";

// Höchstens 50 Megapixel (QA Technik P2-1): 80 MP ergaben eine RGBA-Zwischenstufe
// von rund 320 MB je Bild. 50 MP decken übliche Handy-Aufnahmen bis 48 MP ab.
export const MAX_PIXEL = 50_000_000;

const ERLAUBT = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * @param {Buffer} buf  hochgeladene Datei
 * @returns {Promise<{ok:true, breite:number, hoehe:number, gpsGefunden:boolean, dateien:{w:number,h:number,fmt:string,daten:Buffer}[]} | {ok:false, fehler:string, status:number}>}
 */
export async function verarbeiteBild(buf) {
  const typ = detectType(buf);
  if (!typ || typ.family !== "image") return { ok: false, status: 415, fehler: "Nur Fotos (JPG, PNG, WebP, AVIF)." };
  if (!ERLAUBT.has(typ.mime)) {
    return { ok: false, status: 415, fehler: "HEIC-Fotos bitte als JPG senden (iPhone: Einstellungen › Kamera › Formate › „Maximale Kompatibilität“)." };
  }
  let meta;
  try {
    meta = await sharp(buf, { failOn: "error", limitInputPixels: MAX_PIXEL }).metadata();
  } catch {
    return { ok: false, status: 415, fehler: "Das Bild konnte nicht gelesen werden." };
  }
  const gpsGefunden = hatGps(meta.exif);
  // Basis: gedreht nach EXIF, längste Kante ≤ 2400, sRGB.
  let basis;
  try {
    basis = await sharp(buf, { failOn: "error", limitInputPixels: MAX_PIXEL })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .toColourspace("srgb")
      .png()
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, status: 415, fehler: "Das Bild konnte nicht gelesen werden." };
  }
  const { width: breite, height: hoehe } = basis.info;
  if (breite < 320 || hoehe < 240) return { ok: false, status: 422, fehler: "Das Foto ist zu klein (mindestens 320 × 240 Pixel)." };

  const breiten = [...new Set(BILD_BREITEN.map((w) => Math.min(w, breite)))];
  const dateien = [];
  for (const w of breiten) {
    const h = Math.round((w * hoehe) / breite);
    const skaliert = sharp(basis.data).resize({ width: w, height: h, fit: "fill" });
    const avif = await skaliert.clone().avif({ quality: 55, effort: 4 }).toBuffer();
    const webp = await skaliert.clone().webp({ quality: 80 }).toBuffer();
    dateien.push({ w, h, fmt: "avif", daten: avif }, { w, h, fmt: "webp", daten: webp });
  }
  return { ok: true, breite, hoehe, gpsGefunden, dateien };
}

/** Grobe Prüfung, ob der EXIF-Block eine GPS-IFD enthält (nur für den Hinweis an den Nutzer). */
export function hatGps(exif) {
  if (!exif || exif.length < 16) return false;
  // Tag 0x8825 (GPSInfo) in beiden Byte-Reihenfolgen.
  for (let i = 0; i < exif.length - 1; i++) {
    if ((exif[i] === 0x88 && exif[i + 1] === 0x25) || (exif[i] === 0x25 && exif[i + 1] === 0x88)) return true;
  }
  return false;
}

/** Nachweis für Tests und QA: hat die erzeugte Datei noch EXIF/XMP/IPTC? */
export async function metadatenRest(daten) {
  const m = await sharp(daten).metadata();
  return { exif: Boolean(m.exif), xmp: Boolean(m.xmp), iptc: Boolean(m.iptc) };
}
