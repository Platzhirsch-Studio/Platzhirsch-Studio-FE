// src/lib/stilfinder/palette.js – colour codes for the palette chapter.
// CMYK is a plain mathematical conversion without an ICC profile; the PDF
// says so. No imports.

export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToCmyk([r, g, b]) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k >= 1) return [0, 0, 0, 100];
  const f = (v) => Math.round(((1 - v - k) / (1 - k)) * 100);
  return [f(rr), f(gg), f(bb), Math.round(k * 100)];
}

/** WCAG relative luminance (0–1). */
export function luminance(hex) {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio of two colours (1–21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const INK_ON_LIGHT = "#1f252b";
export const PAPER_ON_DARK = "#faf8f4";

/**
 * Readable text colour on a swatch: whichever of ink (#1f252b) and paper
 * (#faf8f4) has the higher WCAG contrast (QA Runde 1, P2.6 – white on
 * Messing #B08D57 was 3.09:1, ink there is 5.0:1). Mid tones where neither
 * reaches 4.5:1 fall back to pure black or white.
 */
export function textOn(hex, min = 4.5) {
  const best = (a, b) => (contrastRatio(hex, a) >= contrastRatio(hex, b) ? a : b);
  const brand = best(INK_ON_LIGHT, PAPER_ON_DARK);
  if (contrastRatio(hex, brand) >= min) return brand;
  // mid tones (Taupe #8C8174, Bronze #A08463): pure black/white reach 4.5:1
  return best("#000000", "#ffffff");
}

export function codes(hex) {
  const rgb = hexToRgb(hex);
  return {
    hex: String(hex).toUpperCase(),
    rgb: rgb.join(" · "),
    cmyk: rgbToCmyk(rgb).join(" · "),
  };
}
