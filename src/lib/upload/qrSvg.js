// src/lib/upload/qrSvg.js — the house QR code of the upload handoff (own
// drawing instead of the qrcode package's default SVG). Pure function, no
// "server-only" so node --test can check it (tests/unit/upload-qr.test.mjs);
// only imported by the server module handoff.js, so `qrcode` never reaches a
// browser bundle.
//
// Design (Design-Bibel §3/§4/§6): ink-deep modules on paper, no gradients, no
// radii. Data modules are drawn as slightly inset squares (a fine "tile" grid
// instead of a solid block), the three finder patterns stay solid and
// contiguous (they carry the detection), and the centre holds the Platzhirsch
// monogram on a paper field. With the monogram the symbol uses error
// correction level Q (25 % recoverable); the field covers ~3.7 % of the
// modules, a seventh of what Q can repair. Measured with a real decoder (jsQR,
// qa-screenshots/labs-ausbau/handy-upload/selbst/qr-scan.mjs): the monogram
// symbol decodes exactly as often as the same level without it; level H was
// worse (version 11/12 instead of 10 → denser modules), so H is not used.
// Shown at ≥ 224 CSS px (≥ 3 px per module). Details in
// Marktresearch/digital/features/handy-upload.md.
import QRCode from "qrcode";

export const QR_COLORS = { dark: "#1f252b", light: "#faf8f4" }; // ink-deep on paper (14.6:1)
export const QR_MARGIN = 4; // quiet zone in modules (ISO/IEC 18004 minimum)
const INSET_DEFAULT = 0.04; // gap on each side of a data module (8 % in total; 0.07 failed blurred at 160 px)

// Monogram strokes (src/components/Brand/Logo.js, MonogramStrokes, 48 × 60 box).
const MONOGRAM = [
  "M15 57V26M33 57V26",
  "M15 26h6.5a7 7 0 0 1 0 14H15",
  "M15 47.5h18",
  "M15 26C15 16.5 11 10 6 3.5M33 26C33 16.5 37 10 42 3.5",
  "M14.4 20.5L21 16.7M33.6 20.5L27 16.7",
];

/** Side length (in modules, odd) of the monogram field for a symbol of `size` modules. */
export function logoField(size, ratio = 0.2) {
  let k = Math.round(size * ratio);
  if (k % 2 === 0) k += 1;
  return Math.max(7, k);
}

const inFinder = (r, c, size) => (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

/**
 * QR code as an SVG string.
 * @param {string} text   content (the upload URL)
 * @param {{ logo?: boolean, level?: "L"|"M"|"Q"|"H", inset?: number, fieldRatio?: number }} [opts]
 *   logo=false: plain symbol (level M, smaller), e.g. for very small prints; the
 *   other options exist for the scan check only.
 * @returns {{ svg: string, size: number, version: number, level: string, field: number }}
 */
export function qrSvg(text, { logo = true, level: forced, inset: INSET = INSET_DEFAULT, fieldRatio = 0.2 } = {}) {
  const level = forced || (logo ? "Q" : "M");
  const qr = QRCode.create(text, { errorCorrectionLevel: level });
  const size = qr.modules.size;
  const at = (r, c) => qr.modules.get(r, c);
  const field = logo ? logoField(size, fieldRatio) : 0;
  const lo = (size - field) / 2;
  const hi = lo + field;
  const inField = (r, c) => logo && r >= lo && r < hi && c >= lo && c < hi;
  const m = QR_MARGIN;
  const s = 1 - 2 * INSET;

  let data = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!at(r, c) || inFinder(r, c, size) || inField(r, c)) continue;
      data += `M${c + m + INSET} ${r + m + INSET}h${s}v${s}h-${s}z`;
    }
  }

  // Finder: 7 × 7 frame (1 module) + solid 3 × 3 eye, contiguous.
  const finder = (r, c) => {
    const x = c + m;
    const y = r + m;
    return `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  };
  const finders = finder(0, 0) + finder(0, size - 7) + finder(size - 7, 0);

  const total = size + 2 * m;
  let mark = "";
  if (logo) {
    // Paper field with one free module around the monogram (its own quiet zone).
    const x = lo + m;
    const box = field - 2; // monogram height in modules
    const scale = box / 60;
    const w = 48 * scale;
    const tx = x + (field - w) / 2;
    const ty = lo + m + 1;
    mark =
      `<rect x="${x}" y="${x}" width="${field}" height="${field}" fill="${QR_COLORS.light}"/>` +
      `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(4)})" fill="none" stroke="${QR_COLORS.dark}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">` +
      MONOGRAM.map((d) => `<path d="${d}"/>`).join("") +
      `</g>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">` +
    `<rect width="${total}" height="${total}" fill="${QR_COLORS.light}"/>` +
    `<path fill="${QR_COLORS.dark}" fill-rule="evenodd" shape-rendering="crispEdges" d="${finders}"/>` +
    `<path fill="${QR_COLORS.dark}" shape-rendering="crispEdges" d="${data}"/>` +
    mark +
    `</svg>`;
  return { svg, size, version: qr.version, level, field };
}

/** The SVG as a data URL for <img src>. */
export const qrDataUrl = (text, opts) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(text, opts).svg)}`;
