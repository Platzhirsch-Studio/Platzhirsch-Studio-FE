// src/lib/stilfinder/imageStats.js
// Image checks for the Moodboard curation (QA Runde 1, P1.4 b/c):
//   - dominant colour of the PRODUCT (background pixels ignored) and the
//     share of clearly off-palette colour (ΔE CIE76 > 25 to every palette tone),
//   - coverage: share of pixels that are not background (thin line lamps on
//     white come out near 0 % and would print as an empty white box),
//   - contrast (luminance standard deviation),
//   - cutout: product photographed on a white ground.
// Measured on a 64 px thumbnail, so it costs ~2 ms per image. The source image
// is never changed by this module.
// No "@/..." imports: tested with node --test.
import sharp from "sharp";

export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** sRGB (0–255) → CIE L*a*b* (D65). */
export function rgbToLab([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const x = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047;
  const y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722;
  const z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIE76 colour difference (Euclidean distance in L*a*b*). */
export const deltaE76 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** CIEDE2000 colour difference (kept for reference; compresses chroma a lot). */
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h = (a, b) => {
    if (a === 0 && b === 0) return 0;
    const v = Math.atan2(b, a) / rad;
    return v < 0 ? v + 360 : v;
  };
  const h1p = h(a1p, b1);
  const h2p = h(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lmp = (L1 + L2) / 2;
  const Cmp = (C1p + C2p) / 2;
  let hmp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hmp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    else hmp = (h1p + h2p) / 2;
  }
  const T = 1 - 0.17 * Math.cos((hmp - 30) * rad) + 0.24 * Math.cos(2 * hmp * rad) + 0.32 * Math.cos((3 * hmp + 6) * rad) - 0.2 * Math.cos((4 * hmp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hmp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lmp - 50) ** 2) / Math.sqrt(20 + (Lmp - 50) ** 2);
  const Sc = 1 + 0.045 * Cmp;
  const Sh = 1 + 0.015 * Cmp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** Chroma of a colour (0 = grey). */
export const chroma = (rgb) => {
  const [, a, b] = rgbToLab(rgb);
  return Math.hypot(a, b);
};

/**
 * Smallest ΔE (CIE76, as in the QA brief "ΔE über etwa 25") between `hex` and the palette. Near-neutral colours
 * (white, grey, black; chroma < NEUTRAL_CHROMA) fit every profile and count 0.
 */
export const NEUTRAL_CHROMA = 9;
export function paletteDistance(hex, palette) {
  if (!hex || !palette?.length) return 0;
  const rgb = hexToRgb(hex);
  if (chroma(rgb) < NEUTRAL_CHROMA) return 0;
  const lab = rgbToLab(rgb);
  return Math.min(...palette.map((c) => deltaE76(lab, rgbToLab(hexToRgb(c.hex || c)))));
}

/**
 * analyseImage(buffer) → { dominant, coverage, contrast, cutout, bg }
 *   dominant  "#rrggbb" of the product pixels (background removed)
 *   coverage  0–1 share of non-background pixels
 *   contrast  luminance standard deviation (0–128)
 */
export async function analyseImage(input) {
  const S = 64;
  const { data, info } = await sharp(input, { failOn: "none" })
    .flatten({ background: "#ffffff" })
    .resize(S, S, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const c = info.channels;
  const px = (i) => [data[i * c], data[i * c + 1], data[i * c + 2]];
  // Background = average of the outer ring.
  let edge = 0;
  let light = 0;
  const bgSum = [0, 0, 0];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (x > 1 && x < S - 2 && y > 1 && y < S - 2) continue;
      const p = px(y * S + x);
      edge++;
      bgSum[0] += p[0];
      bgSum[1] += p[1];
      bgSum[2] += p[2];
      if (p[0] > 236 && p[1] > 236 && p[2] > 236) light++;
    }
  }
  const bg = bgSum.map((v) => v / edge);
  const cutout = light / edge > 0.8;
  // Uniform ground (studio shot on grey/white) → measure against it;
  // otherwise (room scene) every pixel counts as content.
  const ringVar = (() => {
    let s = 0;
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        if (x > 1 && x < S - 2 && y > 1 && y < S - 2) continue;
        const p = px(y * S + x);
        s += Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]);
      }
    return s / edge;
  })();
  const plainGround = ringVar < 14;
  let content = 0;
  let lumSum = 0;
  let lumSq = 0;
  const bins = new Map();
  for (let i = 0; i < S * S; i++) {
    const p = px(i);
    const lum = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
    lumSum += lum;
    lumSq += lum * lum;
    const isBg = plainGround && Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]) < 26;
    if (isBg) continue;
    content++;
    // 3 bits per channel histogram for the dominant colour
    const key = ((p[0] >> 5) << 6) | ((p[1] >> 5) << 3) | (p[2] >> 5);
    const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n++;
    b.r += p[0];
    b.g += p[1];
    b.b += p[2];
    bins.set(key, b);
  }
  const n = S * S;
  const mean = lumSum / n;
  const contrast = Math.sqrt(Math.max(0, lumSq / n - mean * mean));
  const sorted = [...bins.values()].sort((a, b) => b.n - a.n);
  const dominant = sorted[0] ? rgbToHex([sorted[0].r / sorted[0].n, sorted[0].g / sorted[0].n, sorted[0].b / sorted[0].n]) : rgbToHex(bg);
  // Colour profile of the product: every bin with ≥ 1 % of the content
  // (the dominant colour alone misses a turquoise sofa photographed with grey
  // shadows; the share of off-palette colour catches it).
  const colors = sorted
    .filter((b) => content && b.n / content >= 0.01)
    .slice(0, 24)
    .map((b) => [rgbToHex([b.r / b.n, b.g / b.n, b.b / b.n]), Math.round((b.n / content) * 1000) / 1000]);
  return { dominant, colors, coverage: content / n, contrast, cutout, bg: rgbToHex(bg), plainGround };
}

/**
 * Share (0–1) of the product's pixels whose colour is clearly chromatic and
 * further than `maxDelta` (ΔE76) from every palette colour.
 */
export function offPaletteShare(stats, palette, maxDelta = IMAGE_RULES.maxPaletteDelta) {
  if (!stats?.colors?.length || !palette?.length) return 0;
  let off = 0;
  for (const [hex, share] of stats.colors) {
    const rgb = hexToRgb(hex);
    if (chroma(rgb) < 14) continue;
    if (paletteDistance(hex, palette) > maxDelta) off += share;
  }
  return off;
}

// Thresholds (P1.4): images below are dropped from the selection.
export const IMAGE_RULES = {
  maxPaletteDelta: 25, // ΔE (CIE76) to the closest palette colour
  maxOffPalette: 0.18, // share of clearly off-palette colour in the product
  minCoverage: 0.03,
  minContrast: 6,
};

/** Reason string when an analysed image should not be used, else null. */
export function rejectReason(stats, palette, rules = IMAGE_RULES) {
  if (!stats) return "no-stats";
  if (stats.coverage < rules.minCoverage) return "empty";
  if (stats.contrast < rules.minContrast) return "flat";
  if (palette && paletteDistance(stats.dominant, palette) > rules.maxPaletteDelta) return "colour";
  if (palette && offPaletteShare(stats, palette, rules.maxPaletteDelta) > rules.maxOffPalette) return "colour";
  return null;
}
