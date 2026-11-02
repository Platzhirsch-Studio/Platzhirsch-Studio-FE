// Wow hero "Pause" – registration of the line on the photo (push round 2,
// Antreiber awwwards #2, luxus-cd #3): "2 px or leave it out".
//   node --test tests/unit/wow-registration.test.mjs
//   WOW_DIFF_OUT=qa-screenshots/wow/push-r2/deckung.png → writes the
//   difference picture (edge mask grey, lines on an edge green, off red).
// Edge mask of aboutHome.jpg with sharp: Sobel of the grey image (σ 1.6)
// plus Sobel of a local-contrast map (finds the border of the bouclé
// armchairs, whose own texture is noisy). A sample of a pen path counts as
// "on the edge" if an edge pixel lies within TOL viewBox units. TOL = 4 ≈
// 2.1 px at 1440 px (frame 813 × 650, scale 0.53) and ≈ 0.8 px at 390 px.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PAUSE_PATHS, PHOTO_SIZE } from "../../src/lib/wow/pause-paths.js";
import { samples } from "../../src/lib/wow/geometry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(root, "public/Images/Home/aboutHome.jpg");
const { width: W, height: H } = PHOTO_SIZE;
const TOL = 4;
const MIN_SHARE = 0.9;

const grey = (img) => img.greyscale().toColourspace("b-w").raw().toBuffer();
function sobel(buf) {
  const g = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const p = (dx, dy) => buf[i + dy * W + dx];
      const gx = p(1, -1) + 2 * p(1, 0) + p(1, 1) - p(-1, -1) - 2 * p(-1, 0) - p(-1, 1);
      const gy = p(-1, 1) + 2 * p(0, 1) + p(1, 1) - p(-1, -1) - 2 * p(0, -1) - p(1, -1);
      g[i] = Math.hypot(gx, gy);
    }
  return g;
}
const pct = (g, q) => {
  const s = Float32Array.from(g.filter((_, i) => i % 7 === 0)).sort();
  return s[Math.floor(s.length * q)];
};

async function maps() {
  const raw = await grey(sharp(SRC));
  const soft = await grey(sharp(SRC).blur(1.6));
  const fine = await grey(sharp(SRC).blur(1.5));
  const d = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) d[i] = Math.min(255, Math.abs(raw[i] - fine[i]) * 6);
  const tex = await grey(sharp(d, { raw: { width: W, height: H, channels: 1 } }).blur(5));
  return { a: sobel(soft), b: sobel(tex) };
}

export async function edgeMask() {
  const { a, b } = await maps();
  const ta = pct(a, 0.8);
  const tb = pct(b, 0.85);
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = a[i] >= ta || b[i] >= tb ? 1 : 0;
  return m;
}

const near = (m, [x, y], r) => {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const X = Math.round(x + dx);
      const Y = Math.round(y + dy);
      if (X >= 0 && Y >= 0 && X < W && Y < H && m[Y * W + X]) return true;
    }
  return false;
};

test("Deckung: jeder Federstrich liegt zu ≥ 90 % innerhalb 4 Einheiten (≈ 2 px bei 1440) auf einer Kante des Fotos", async () => {
  const m = await edgeMask();
  const report = [];
  const marks = [];
  const bad = [];
  for (const p of PAUSE_PATHS) {
    if (p.kind === "guide") continue; // construction lines are not part of the climax
    const pts = samples(p.d);
    const hits = pts.map((q) => near(m, q, TOL));
    pts.forEach((q, i) => marks.push([q, hits[i]]));
    const share = hits.filter(Boolean).length / pts.length;
    report.push(`${p.id} ${(share * 100).toFixed(0)} %`);
    if (share < MIN_SHARE) bad.push(`${p.id}: only ${(share * 100).toFixed(1)} % on an edge`);
  }
  if (process.env.WOW_DIFF_OUT) {
    const px = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) px.fill(m[i] ? 70 : 0, i * 3, i * 3 + 3);
    for (const [[x, y], ok] of marks)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const X = Math.round(x) + dx;
          const Y = Math.round(y) + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const i = (Y * W + X) * 3;
          px[i] = ok ? 40 : 255;
          px[i + 1] = ok ? 230 : 40;
          px[i + 2] = 60;
        }
    await sharp(px, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.resolve(root, process.env.WOW_DIFF_OUT));
  }
  console.log(report.join(" · "));
  assert.deepEqual(bad, []);
});

// Ridge test – the mask above is dense (the photo is full of edges), so it
// alone would also pass a drawing shifted by 6 units. Here every sample looks
// along its normal (±12 units) for the strongest edge (Sobel; for the two
// armchair outlines the Sobel of the contrast map): it must lie within 4
// units. Control: the same drawing shifted by 5 units along the normals must
// score clearly worse, so the test can tell "on the edge" from "next to it".
test("Deckung (Kamm): die stärkste Kante quer zum Strich liegt ≤ 4 Einheiten neben der Linie, Verschiebung um 5 fällt durch", async () => {
  const { a, b } = await maps();
  const at = (g, x, y) => {
    const X = Math.round(x);
    const Y = Math.round(y);
    return X < 1 || Y < 1 || X >= W - 1 || Y >= H - 1 ? 0 : g[Y * W + X];
  };
  const share = (shift) => {
    let ok = 0;
    let n = 0;
    for (const p of PAUSE_PATHS) {
      if (p.kind === "guide") continue;
      const g = /^chair-(left|right)$/.test(p.id) ? b : a;
      const pts = samples(p.d, 3);
      pts.forEach((q, i) => {
        const A = pts[Math.max(0, i - 2)];
        const B = pts[Math.min(pts.length - 1, i + 2)];
        const l = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
        const nx = -(B[1] - A[1]) / l;
        const ny = (B[0] - A[0]) / l;
        let bt = 0;
        let bv = -1;
        for (let t = -12; t <= 12; t++) {
          const v = at(g, q[0] + nx * (t + shift), q[1] + ny * (t + shift));
          if (v > bv) [bv, bt] = [v, t];
        }
        n++;
        if (Math.abs(bt) <= 4) ok++;
      });
    }
    return ok / n;
  };
  const on = share(0);
  const off = share(5);
  console.log(`ridge: ${(on * 100).toFixed(1)} % on, ${(off * 100).toFixed(1)} % when shifted by 5`);
  assert.ok(on >= 0.65, `only ${(on * 100).toFixed(1)} % on the ridge`);
  assert.ok(on - off >= 0.3, "test cannot tell a shifted drawing apart");
});
