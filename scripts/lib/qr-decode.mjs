// scripts/lib/qr-decode.mjs — small, independent QR decoder for the self-test
// of scripts/make-review-qr.mjs (R5-release). It reads the PIXELS of a
// rendered QR code (PNG via pngjs, or a module grid from our own SVG path) and
// decodes it per ISO/IEC 18004: format information (BCH-checked), mask,
// zig-zag data placement, block de-interleaving, numeric/alphanumeric/byte
// segments. It does not use the encoder of the `qrcode` package; only the
// RS block table (getBlocksCount/getTotalCodewordsCount) is a spec table.
//
// Scope: upright, unrotated codes as our own script renders them (versions
// 1–40 without version-info check, no error correction applied). Enough to
// prove "the printed code contains exactly this URL".
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ECBlocks = require("qrcode/lib/core/error-correction-code");
const ECLevel = require("qrcode/lib/core/error-correction-level");
const Utils = require("qrcode/lib/core/utils");
const { PNG } = require("pngjs");

const ALIGN = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
  [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
];
const MASKS = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i * j) % 3) + ((i + j) % 2)) % 2 === 0,
];
// Format bits 14-13: 01 = L, 00 = M, 11 = Q, 10 = H.
const ECL_BY_BITS = { 1: "L", 0: "M", 3: "Q", 2: "H" };

function bchFormat(data5) {
  let v = data5 << 10;
  for (let i = 14; i >= 10; i--) if (v & (1 << i)) v ^= 0x537 << (i - 10);
  return ((data5 << 10) | v) ^ 0x5412;
}
const VALID_FORMATS = Array.from({ length: 32 }, (_, d) => ({ d, code: bchFormat(d) }));
const popcount = (x) => x.toString(2).replace(/0/g, "").length;

/** Reads a PNG buffer into a boolean module grid (true = dark). */
export function gridFromPng(buffer, region = null) {
  const png = PNG.sync.read(buffer);
  const { width, height, data } = png;
  const dark = (x, y) => {
    const o = (y * width + x) * 4;
    const a = data[o + 3] / 255;
    const lum = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) * a + 255 * (1 - a);
    return lum < 128;
  };
  const r = region || { x: 0, y: 0, w: width, h: height };
  // Top-left finder: first dark row inside the region, its first dark run is 7 modules wide.
  let y0 = -1;
  let x0 = -1;
  for (let y = r.y; y < r.y + r.h && y0 < 0; y++)
    for (let x = r.x; x < r.x + r.w; x++)
      if (dark(x, y)) {
        y0 = y;
        x0 = x;
        break;
      }
  if (y0 < 0) throw new Error("no dark pixel in region");
  let run = 0;
  while (x0 + run < r.x + r.w && dark(x0 + run, y0)) run++;
  const m = run / 7;
  let x1 = r.x + r.w - 1;
  while (x1 > x0 && !dark(x1, y0)) x1--;
  const size = Math.round((x1 - x0 + 1) / m);
  if (size < 21 || (size - 17) % 4 !== 0) throw new Error(`implausible symbol size ${size} (module ${m.toFixed(2)} px)`);
  const grid = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => dark(Math.floor(x0 + (j + 0.5) * m), Math.floor(y0 + (i + 0.5) * m))),
  );
  return { grid, size, modulePx: m, origin: { x: x0, y: y0 } };
}

/**
 * Module grid from the SVG path that make-review-qr.mjs writes: one
 * `M{x} {y}h{n}v1h-{n}z` rectangle per run of dark modules, inside a
 * <path data-qr="modules" …> element, quiet zone `data-quiet`.
 */
export function gridFromOwnSvg(svg) {
  const el = svg.match(/<path[^>]*data-qr="modules"[^>]*>/);
  if (!el) throw new Error("no data-qr path");
  const d = el[0].match(/\sd="([^"]+)"/)[1];
  const quiet = Number(el[0].match(/data-quiet="(\d+)"/)[1]);
  const size = Number(el[0].match(/data-size="(\d+)"/)[1]);
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  for (const [, x, y, n] of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
    for (let k = 0; k < Number(n); k++) grid[Number(y) - quiet][Number(x) - quiet + k] = true;
  }
  return { grid, size };
}

function functionMask(size, version) {
  const f = Array.from({ length: size }, () => Array(size).fill(false));
  const box = (r0, c0, h, w) => {
    for (let r = Math.max(0, r0); r < Math.min(size, r0 + h); r++)
      for (let c = Math.max(0, c0); c < Math.min(size, c0 + w); c++) f[r][c] = true;
  };
  box(0, 0, 9, 9); // finder + separator + format
  box(0, size - 8, 9, 8);
  box(size - 8, 0, 8, 9); // incl. dark module
  for (let k = 0; k < size; k++) {
    f[6][k] = true;
    f[k][6] = true;
  }
  const pos = ALIGN[version] || [];
  for (const r of pos)
    for (const c of pos) {
      if ((r === 6 && c === 6) || (r === 6 && c === pos.at(-1)) || (r === pos.at(-1) && c === 6)) continue;
      box(r - 2, c - 2, 5, 5);
    }
  if (version >= 7) {
    box(0, size - 11, 6, 3);
    box(size - 11, 0, 3, 6);
  }
  return f;
}

function readFormat(grid, size) {
  // Copy along column 8 (bits 0..14, bit i: rows 0-5, 7, 8, then size-7..size-1).
  let bits = 0;
  for (let i = 0; i < 15; i++) {
    const row = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
    if (grid[row][8]) bits |= 1 << i;
  }
  let best = null;
  for (const v of VALID_FORMATS) {
    const dist = popcount(v.code ^ bits);
    if (!best || dist < best.dist) best = { ...v, dist };
  }
  if (best.dist > 3) throw new Error(`format information unreadable (distance ${best.dist})`);
  return { ecl: ECL_BY_BITS[best.d >> 3], mask: best.d & 7, distance: best.dist };
}

function readCodewords(grid, size, fmask, mask) {
  const bits = [];
  let up = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let k = 0; k < size; k++) {
      const row = up ? size - 1 - k : k;
      for (const c of [col, col - 1]) {
        if (fmask[row][c]) continue;
        bits.push(grid[row][c] !== MASKS[mask](row, c) ? 1 : 0);
      }
    }
    up = !up;
  }
  const words = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) words.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  return words;
}

function deinterleave(words, version, ecl) {
  const level = ECLevel.from(ecl);
  const total = Utils.getSymbolTotalCodewords(version);
  if (words.length < total) throw new Error(`only ${words.length} of ${total} codewords read`);
  const ecTotal = ECBlocks.getTotalCodewordsCount(version, level);
  const blocks = ECBlocks.getBlocksCount(version, level);
  const dataTotal = total - ecTotal;
  const g2 = dataTotal % blocks;
  const g1 = blocks - g2;
  const len1 = Math.floor(dataTotal / blocks);
  const lens = [...Array(g1).fill(len1), ...Array(g2).fill(len1 + 1)];
  const out = lens.map(() => []);
  let p = 0;
  for (let i = 0; i < len1 + 1; i++)
    for (let b = 0; b < blocks; b++) if (i < lens[b]) out[b].push(words[p++]);
  return out.flat();
}

function parseSegments(data, version) {
  const bits = [];
  for (const w of data) for (let i = 7; i >= 0; i--) bits.push((w >> i) & 1);
  let p = 0;
  const take = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (bits[p++] ?? 0);
    return v;
  };
  const cc = (mode) => {
    const idx = version <= 9 ? 0 : version <= 26 ? 1 : 2;
    return { 1: [10, 12, 14], 2: [9, 11, 13], 4: [8, 16, 16] }[mode][idx];
  };
  const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  let text = "";
  const modes = [];
  while (p + 4 <= bits.length) {
    const mode = take(4);
    if (mode === 0) break;
    const n = take(cc(mode));
    if (mode === 4) {
      modes.push("byte");
      const bytes = [];
      for (let i = 0; i < n; i++) bytes.push(take(8));
      text += Buffer.from(bytes).toString("utf8");
    } else if (mode === 2) {
      modes.push("alphanumeric");
      for (let i = 0; i < n; i += 2) {
        if (i + 1 < n) {
          const v = take(11);
          text += ALNUM[Math.floor(v / 45)] + ALNUM[v % 45];
        } else text += ALNUM[take(6)];
      }
    } else if (mode === 1) {
      modes.push("numeric");
      for (let i = 0; i < n; i += 3) {
        const d = Math.min(3, n - i);
        text += String(take([0, 4, 7, 10][d])).padStart(d, "0");
      }
    } else throw new Error(`unsupported mode ${mode}`);
  }
  return { text, modes };
}

/** Decodes a module grid; returns { text, version, ecl, mask, modes }. */
export function decodeGrid({ grid, size }) {
  const version = (size - 17) / 4;
  const fmt = readFormat(grid, size);
  const words = readCodewords(grid, size, functionMask(size, version), fmt.mask);
  const data = deinterleave(words, version, fmt.ecl);
  const { text, modes } = parseSegments(data, version);
  return { text, version, size, ecl: fmt.ecl, mask: fmt.mask, formatDistance: fmt.distance, modes };
}

export const decodePng = (buffer, region) => decodeGrid(gridFromPng(buffer, region));
export const decodeOwnSvg = (svg) => decodeGrid(gridFromOwnSvg(svg));
