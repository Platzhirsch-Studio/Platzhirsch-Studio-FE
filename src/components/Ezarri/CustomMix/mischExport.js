// src/components/Ezarri/CustomMix/mischExport.js – Mischung als Bild und als
// druckbares A4 (Team C, QM P1-3: Parität zu Ezarris „Datei herunterladen“).
//
// Nur im Browser aufrufen (Canvas, Blob, dynamischer Import von qrcode).
// Gleicher Startwert wie die Vorschau → das gespeicherte Bild zeigt dieselbe
// Verteilung wie der Bildschirm. Kein Lead-Gate: Speichern und Drucken gehen
// ohne Angaben.
//
// Aufbau (PNG, 1600 px breit): oben die Mosaikfläche 1600 × 1600, darunter ein
// Textstreifen mit Rezept (Name, Code, %), Fuge, Format, Ausschnitt, Ansicht,
// Teilen-Link, Quellenangabe und Farbhinweis. Das A4 (print) zeigt dieselben
// Angaben plus QR-Code zum Teilen-Link. Team B (PDF-Datenblatt im Konfigurator)
// soll dieselbe Reihenfolge nutzen, siehe features/ezarri-rechner.md.
import { drawMosaic, rasterFuer } from "@/lib/ezarri/rechner/flaeche2d";

export const BILD_PX = 1600;

/**
 * Zeichnet die Mosaikfläche auf eine neue Canvas (quadratisch).
 * @returns {HTMLCanvasElement}
 */
export function mosaikCanvas({ mix, toene, fuge, format, seed, wasser, meter }, px = BILD_PX) {
  const cv = document.createElement("canvas");
  cv.width = px;
  cv.height = px;
  const ctx = cv.getContext("2d");
  const { cols, rows } = rasterFuer(format, meter, meter);
  drawMosaic(ctx, { width: px, height: px, cols, rows, format, mix, toene, fuge, seed, wasser });
  return cv;
}

/** Text in Zeilen umbrechen, die in `max` Pixel passen. */
function umbrechen(ctx, text, max) {
  const out = [];
  let zeile = "";
  for (const wort of String(text).split(/\s+/)) {
    const probe = zeile ? `${zeile} ${wort}` : wort;
    if (ctx.measureText(probe).width <= max || !zeile) zeile = probe;
    else {
      out.push(zeile);
      zeile = wort;
    }
  }
  if (zeile) out.push(zeile);
  return out;
}

/**
 * PNG der Mischung mit Textstreifen.
 * @param {object} zustand  {mix, toene, fuge, format, seed, wasser, meter}
 * @param {{titel:string, zeilen:Array<{text:string, klein?:boolean, stark?:boolean}>, papier:string, tinte:string, leise:string, schrift:string}} text
 * @returns {Promise<Blob>}
 */
export function mischBild(zustand, text) {
  const W = BILD_PX;
  const pad = 64;
  const mosaik = mosaikCanvas(zustand, W);
  const mess = document.createElement("canvas").getContext("2d");
  const groesse = (z) => (z.klein ? 26 : 32);
  const font = (z) => `${z.stark ? 600 : 400} ${groesse(z)}px ${text.schrift}`;
  // Zeilen vorab umbrechen, um die Höhe des Streifens zu kennen
  const zeilen = [{ text: text.titel, stark: true, gross: true }, ...text.zeilen].flatMap((z) => {
    mess.font = z.gross ? `600 44px ${text.schrift}` : font(z);
    return umbrechen(mess, z.text, W - 2 * pad).map((t, i) => ({ ...z, text: t, erste: i === 0 }));
  });
  const hoehe = (z) => (z.gross ? 64 : z.klein ? 38 : 46);
  const abstand = (z) => (z.erste && !z.gross ? 10 : 0);
  const streifen = pad + zeilen.reduce((s, z) => s + hoehe(z) + abstand(z), 0) + pad;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = W + streifen;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = text.papier;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(mosaik, 0, 0);
  let y = W + pad;
  ctx.textBaseline = "top";
  for (const z of zeilen) {
    y += abstand(z);
    ctx.font = z.gross ? `600 44px ${text.schrift}` : font(z);
    ctx.fillStyle = z.klein ? text.leise : text.tinte;
    ctx.fillText(z.text, pad, y);
    y += hoehe(z);
  }
  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/** Blob als Datei speichern (Download-Link, danach aufräumen). */
export function speichern(blob, dateiname) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dateiname;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** QR-Code zum Teilen-Link als PNG-Data-URL (qrcode ist installiert, wird erst beim Drucken geladen). */
export async function qrDataUrl(text) {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: "M" });
}

/** Dateiname aus den Mosaik-Namen ("mischung-2521-b-perla-25mm.png"). */
export function dateiname(namen, format) {
  const slug = namen
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `mischung-${slug || "ezarri"}-${format === "hexa" ? "hexa" : `${format}mm`}.png`;
}
