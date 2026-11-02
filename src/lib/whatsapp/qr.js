// src/lib/whatsapp/qr.js – QR-Code des wa.me-Links für Desktop (lokal
// erzeugt mit dem Paket `qrcode`, kein Fremddienst, keine Anfrage nach außen).
//
// Wird vom Hinweis nur auf breiten Bildschirmen per dynamischem import()
// geladen, also als eigener, später Chunk: Telefone laden ihn nie.
// Farben nach Design-Bibel §4 (ink-deep auf paper, 14,6:1), Ruhezone 4 Module
// (ISO/IEC 18004), Fehlerkorrektur M, bei langen Links (> 300 Zeichen) L –
// das hält den Code bei langen Produktnamen eine Version kleiner, der Code
// liegt auf dem Bildschirm, nicht auf verschmutztem Papier. Keine Verläufe,
// keine Radien.
import QRCode from "qrcode";

export const QR_DARK = "#1f252b";
export const QR_LIGHT = "#faf8f4";
const MARGIN = 4;

/** QR-Code als SVG-String. */
export function whatsappQrSvg(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: String(text).length > 300 ? "L" : "M" });
  const size = qr.modules.size;
  let d = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (qr.modules.get(r, c)) d += `M${c + MARGIN} ${r + MARGIN}h1v1h-1z`;
  }
  const total = size + 2 * MARGIN;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="${QR_LIGHT}"/>` +
    `<path fill="${QR_DARK}" d="${d}"/></svg>`
  );
}

/** Als data:-URL für <img src> (CSP img-src erlaubt data:). */
export function whatsappQrDataUrl(text) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(whatsappQrSvg(text))}`;
}
