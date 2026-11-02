// tools/splat/testszene.mjs – synthetische Test-Szene für die Entwicklung (N1).
//
//   node tools/splat/testszene.mjs [--out <ordner>] [--dichte 1]
//
// Erzeugt einen abstrahierten Raum (Boden, Fensterwand mit See, Mosaikwand,
// Sofa-Insel, Tisch, Leuchten, Kücheninsel) direkt als 3DGS-PLY in zwei
// Lichtstimmungen (tag, abend). Kein echter Ort, keine Möbel eines Herstellers,
// keine KI: nur Rechenregeln in dieser Datei (Lizenz: Teil des Projekts).
//
// Zweck: Viewer, Ladezeiten, LOD, Tag/Abend und die Kette PLY → SOG prüfen,
// bevor der Inhaber-Aufnahmeabend stattfindet (neuland.md §2.5 „Manifest läuft
// zuerst mit einem Testsplat, nur Entwicklung, nie öffentlich“). Die Test-Szene
// liegt unter public/showroom/_testszene/ und wird nur angezeigt, solange
// SHOWROOM_PUBLIC aus ist und kein Produktions-Build läuft
// (src/lib/showroom/config.js).
//
// Danach: node tools/splat/pack.mjs --ply <ply> --zone _testszene --stimmung tag --test
import path from "node:path";
import { GPU_TOOLS, parseArgs, writePly } from "./lib.mjs";

const args = parseArgs();
const OUT = path.resolve(args.out || path.join(GPU_TOOLS, "showroom", "testszene"));
const DICHTE = Number(args.dichte || 1);

// Reproduzierbarer Zufall (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Quaternion (w,x,y,z) aus Basis u, v, n (Spalten der Rotationsmatrix). */
function quatFromBasis(u, v, n) {
  const [m00, m10, m20] = u;
  const [m01, m11, m21] = v;
  const [m02, m12, m22] = n;
  const tr = m00 + m11 + m22;
  let w, x, y, z;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  const l = Math.hypot(w, x, y, z);
  return [w / l, x / l, y / l, z / l];
}

// --- Szene: Liste von Flächen mit Farbregel -------------------------------
// Jede Fläche: Ursprung o, Kanten eu/ev (Länge = Ausdehnung), Abstand d,
// Farbfunktion col(s, t, rand) mit s,t in 0..1, optional emissiv (Licht).

const surfaces = [];
const spheres = [];

function rect(o, eu, ev, d, col, opts = {}) {
  surfaces.push({ o, eu, ev, d: d / Math.sqrt(DICHTE), col, ...opts });
}

/** Quader aus fünf oder sechs Flächen (Boden weglassen: bottom=false). */
function box([x0, y0, z0], [sx, sy, sz], d, col, { bottom = false, ...opts } = {}) {
  const x1 = x0 + sx, y1 = y0 + sy, z1 = z0 + sz;
  rect([x0, y1, z1], [sx, 0, 0], [0, 0, -sz], d, col, opts); // oben
  if (bottom) rect([x0, y0, z0], [sx, 0, 0], [0, 0, sz], d, col, opts);
  rect([x0, y0, z1], [sx, 0, 0], [0, sy, 0], d, col, opts); // vorne (+z)
  rect([x1, y0, z0], [-sx, 0, 0], [0, sy, 0], d, col, opts); // hinten (-z)
  rect([x0, y0, z0], [0, 0, sz], [0, sy, 0], d, col, opts); // links (-x)
  rect([x1, y0, z1], [0, 0, -sz], [0, sy, 0], d, col, opts); // rechts (+x)
}

function sphere(c, r, n, col, opts = {}) {
  spheres.push({ c, r, n: Math.round(n * DICHTE), col, ...opts });
}

// Maße: Raum 8 × 6 m, Höhe 3,2 m. Fensterwand bei z = −3.
const W = 4, D = 3, H = 3.2;

// Farben (Design-Bibel §4 als Anhalt, kein Material eines Herstellers)
const C = {
  eiche: hex("#b08a5f"),
  eicheDunkel: hex("#8c6a45"),
  papier: hex("#efebe4"),
  stein: hex("#d9d3c8"),
  leinen: hex("#cfc6b6"),
  walnuss: hex("#5a4232"),
  tinte: hex("#30373e"),
  see: hex("#4f6b68"),
  himmel: hex("#dfe6e6"),
  berg: hex("#7d8c8f"),
  cognac: hex("#8a5a3a"),
  messing: hex("#c6a65a"),
  gruen: hex("#58704a"),
};

// Boden: Dielen 18 cm, je Diele eigener Ton, feine Maserung.
rect([-W, 0, D], [2 * W, 0, 0], [0, 0, -2 * D], 0.022, (s, t, r) => {
  const plank = Math.floor((t * 2 * D) / 0.18);
  const pr = rng(plank * 7919)();
  const grain = 0.5 + 0.5 * Math.sin(s * 2 * W * 38 + pr * 20 + Math.sin(t * 90) * 0.6);
  const base = mix(C.eiche, C.eicheDunkel, pr * 0.55 + grain * 0.12);
  const fuge = ((t * 2 * D) % 0.18) < 0.006 ? 0.75 : 1;
  return base.map((v) => v * fuge * (0.96 + r * 0.06));
});

// Teppich unter der Sofa-Insel.
rect([-1.6, 0.012, 1.4], [3.2, 0, 0], [0, 0, -2.4], 0.02, (s, t, r) => mix(C.stein, C.leinen, 0.3 + r * 0.25 + 0.08 * Math.sin(s * 160)));

// Fensterwand z = −D: Brüstung, großes Fenster mit Seeblick, Pfosten.
const fx0 = -3.2, fx1 = 2.0, fy0 = 0.45, fy1 = 2.85;
rect([-W, 0, -D], [2 * W, 0, 0], [0, H, 0], 0.024, (s, t, r) => {
  const x = -W + s * 2 * W, y = t * H;
  const inWin = x > fx0 && x < fx1 && y > fy0 && y < fy1;
  if (!inWin) return C.papier.map((v) => v * (0.97 + r * 0.04));
  const pfosten = Math.abs(((x - fx0) % 1.3) - 0) < 0.035 || y < fy0 + 0.05 || y > fy1 - 0.05;
  if (pfosten) return C.tinte;
  // Ausblick: Himmel, Bergkette (Pfänder-Seite ist es nicht: abstrakt), See.
  const u = (x - fx0) / (fx1 - fx0), v = (y - fy0) / (fy1 - fy0);
  const berg = 0.42 + 0.07 * Math.sin(u * 7.0) + 0.04 * Math.sin(u * 17 + 1.3);
  if (v < 0.36) return mix(C.see, hex("#6f8a86"), 0.25 + 0.3 * Math.sin(u * 60 + v * 30) * 0.5 + r * 0.1);
  if (v < berg) return mix(C.berg, C.see, 0.35 + r * 0.1);
  return mix(C.himmel, hex("#f4f1ea"), v);
}, { fenster: { fx0, fx1, fy0, fy1 } });

// Mosaikwand links (x = −W): 2,5-cm-Steine in Wassertönen, Rest Papier.
rect([-W, 0, D], [0, 0, -2 * D], [0, H, 0], 0.0125 * 2, (s, t, r) => {
  const z = D - s * 2 * D, y = t * H;
  const inMos = z > -1.6 && z < 1.4 && y < 2.3;
  if (!inMos) return C.papier.map((v) => v * (0.95 + r * 0.04));
  const ti = Math.floor(z / 0.025) * 131 + Math.floor(y / 0.025) * 977;
  const k = rng(ti)();
  const fuge = (z % 0.025 + 0.025) % 0.025 < 0.003 || y % 0.025 < 0.003;
  if (fuge) return hex("#e8e6e0");
  const tones = [hex("#3f7f86"), hex("#5c9aa0"), hex("#2f5f6a"), hex("#8fc0bf"), hex("#4b8d8c")];
  return tones[Math.floor(k * tones.length)].map((v) => v * (0.92 + r * 0.12));
});

// Rechte Wand: Nussbaum-Paneele mit Fugen.
rect([W, 0, -D], [0, 0, 2 * D], [0, H, 0], 0.026, (s, t, r) => {
  const z = -D + s * 2 * D;
  const fuge = ((z + 10) % 0.6) < 0.008;
  return fuge ? C.tinte : mix(C.walnuss, C.cognac, 0.15 + 0.1 * Math.sin(t * 140 + s * 9) + r * 0.08);
});

// Vorderwand und Decke (selten im Blick: gröber).
rect([W, 0, D], [-2 * W, 0, 0], [0, H, 0], 0.035, (s, t, r) => C.papier.map((v) => v * (0.94 + r * 0.04)));
rect([-W, H, -D], [2 * W, 0, 0], [0, 0, 2 * D], 0.045, (s, t, r) => C.papier.map((v) => v * (0.9 + r * 0.03)));

// Sofa-Insel: Sockel, Sitz, Rücken, Armlehnen, Kissen.
box([-1.25, 0.02, -0.9], [2.5, 0.42, 0.95], 0.016, (s, t, r) => C.leinen.map((v) => v * (0.94 + r * 0.06)));
box([-1.25, 0.42, -0.9], [2.5, 0.38, 0.22], 0.016, (s, t, r) => C.leinen.map((v) => v * (0.9 + r * 0.06)));
box([-1.45, 0.02, -0.9], [0.2, 0.62, 0.95], 0.016, (s, t, r) => C.leinen.map((v) => v * (0.88 + r * 0.06)));
box([1.25, 0.02, -0.9], [0.2, 0.62, 0.95], 0.016, (s, t, r) => C.leinen.map((v) => v * (0.88 + r * 0.06)));
box([-0.9, 0.42, -0.66], [0.55, 0.42, 0.14], 0.014, (s, t, r) => hex("#9c8f78").map((v) => v * (0.95 + r * 0.05)));
box([0.35, 0.42, -0.66], [0.55, 0.42, 0.14], 0.014, (s, t, r) => C.see.map((v) => v * (1.1 + r * 0.06)));

// Couchtisch: Nussbaum-Platte, Messing-Fuß.
box([-0.55, 0.34, 0.35], [1.1, 0.05, 0.7], 0.012, (s, t, r) => mix(C.walnuss, C.cognac, 0.2 + 0.15 * Math.sin(s * 80) + r * 0.05));
box([-0.06, 0.02, 0.64], [0.12, 0.32, 0.12], 0.012, () => C.messing);

// Sessel in Cognac.
box([1.75, 0.02, 0.3], [0.85, 0.4, 0.8], 0.015, (s, t, r) => C.cognac.map((v) => v * (0.9 + r * 0.1)));
box([1.75, 0.4, 0.92], [0.85, 0.45, 0.18], 0.015, (s, t, r) => C.cognac.map((v) => v * (0.85 + r * 0.1)));

// Kücheninsel rechts hinten: Fronten Tinte, Steinplatte mit Adern.
box([2.0, 0.02, -2.2], [1.6, 0.86, 0.9], 0.015, (s, t, r) => C.tinte.map((v) => v * (0.95 + r * 0.08)));
box([1.95, 0.88, -2.25], [1.7, 0.04, 1.0], 0.01, (s, t, r) => {
  const ader = Math.abs(Math.sin(s * 12 + Math.sin(t * 9) * 2.2)) < 0.04 ? 0.82 : 1;
  return mix(hex("#ece9e3"), hex("#cfcac0"), r * 0.2).map((v) => v * ader);
});

// Regal an der Nussbaumwand mit Objekten.
for (let i = 0; i < 3; i++) box([3.62, 0.9 + i * 0.55, 0.2], [0.36, 0.03, 1.8], 0.014, () => C.tinte);
sphere([3.8, 1.05, 0.6], 0.12, 900, () => hex("#e3dccf"));
sphere([3.8, 1.6, 1.4], 0.09, 600, () => C.see);

// Pflanze in der Ecke.
box([-3.5, 0.02, -2.6], [0.4, 0.45, 0.4], 0.014, () => hex("#8a8174"));
for (let i = 0; i < 26; i++) {
  const r = rng(500 + i);
  const a = r() * Math.PI * 2, h = 0.6 + r() * 1.1, rad = 0.1 + r() * 0.35;
  sphere([-3.3 + Math.cos(a) * rad, h, -2.4 + Math.sin(a) * rad], 0.09 + r() * 0.08, 260, (s, rr) => mix(C.gruen, hex("#7a9563"), rr * 0.5));
}

// Pendelleuchten über dem Tisch (Lichtquellen).
const lampen = [
  [-0.45, 2.25, 0.7],
  [0.45, 2.35, 0.7],
  [2.8, 2.15, -1.75],
];
for (const p of lampen) {
  sphere(p, 0.17, 2400, () => hex("#fff3dc"), { licht: true });
  rect([p[0] - 0.004, p[1] + 0.17, p[2]], [0.008, 0, 0], [0, H - p[1] - 0.17, 0], 0.004, () => C.tinte);
}

// --- Rastern + Licht --------------------------------------------------------

function shade(pos, n, base, stimmung, emissiv) {
  if (emissiv) return stimmung === "abend" ? base.map((v) => Math.min(1, v * 1.15)) : base.map((v) => v * 0.95);
  const toWin = norm([-0.6 - pos[0], 1.6 - pos[1], -D - pos[2]]);
  const dWin = Math.hypot(-0.6 - pos[0], 1.6 - pos[1], -D - pos[2]);
  if (stimmung === "tag") {
    const diff = Math.max(0, dot(n, toWin));
    const k = 0.58 + 0.42 * diff * (1.2 / (1 + dWin * 0.18)) + 0.06 * Math.max(0, n[1]);
    return base.map((v, i) => clamp01(v * k * [1.0, 1.0, 1.02][i]));
  }
  // Abend: wenig Umgebungslicht, warme Leuchten mit Abfall.
  let warm = 0.16;
  for (const p of lampen) {
    const L = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]];
    const d = Math.hypot(...L);
    warm += (1.25 * Math.max(0.15, dot(n, norm(L)))) / (1 + d * d * 0.9);
  }
  return base.map((v, i) => clamp01(v * warm * [1.08, 0.9, 0.7][i]));
}

function abendFenster(base, s, t) {
  // Nacht über dem See: tiefes Blau, ein paar Lichter am Ufer.
  const lights = rng(Math.floor(s * 400) * 13 + Math.floor(t * 200))() > 0.995 && t > 0.3 && t < 0.42;
  if (lights) return hex("#f2d9a0");
  return mix(hex("#0f1624"), hex("#243447"), t * 0.6);
}

function generate(stimmung, seed) {
  const r = rng(seed);
  const out = [];
  for (const f of surfaces) {
    const lu = Math.hypot(...f.eu), lv = Math.hypot(...f.ev);
    const u = f.eu.map((x) => x / lu), v = f.ev.map((x) => x / lv);
    const n = norm(cross(u, v));
    const q = quatFromBasis(u, v, n);
    const nu = Math.max(1, Math.round(lu / f.d)), nv = Math.max(1, Math.round(lv / f.d));
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const s = (i + 0.5 + (r() - 0.5) * 0.6) / nu;
        const t = (j + 0.5 + (r() - 0.5) * 0.6) / nv;
        const pos = [0, 1, 2].map((k) => f.o[k] + f.eu[k] * s + f.ev[k] * t);
        let base = f.col(s, t, r());
        let emissiv = false;
        if (f.fenster) {
          const x = pos[0], y = pos[1];
          const inWin = x > f.fenster.fx0 && x < f.fenster.fx1 && y > f.fenster.fy0 && y < f.fenster.fy1;
          if (inWin && base !== C.tinte) {
            emissiv = true;
            if (stimmung === "abend") base = abendFenster(base, s, t);
          }
        }
        const c = shade(pos, n, base, stimmung, emissiv);
        out.push({ x: pos[0], y: pos[1], z: pos[2], r: c[0], g: c[1], b: c[2], a: 0.92, sx: (lu / nu) * 0.72, sy: (lv / nv) * 0.72, sz: f.d * 0.06, qw: q[0], qx: q[1], qy: q[2], qz: q[3] });
      }
    }
  }
  for (const sp of spheres) {
    for (let i = 0; i < sp.n; i++) {
      const zz = 2 * r() - 1, ph = r() * Math.PI * 2, rr = Math.sqrt(1 - zz * zz);
      const n = [rr * Math.cos(ph), zz, rr * Math.sin(ph)];
      const pos = n.map((v, k) => sp.c[k] + v * sp.r);
      const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = norm(cross(up, n)), v = cross(n, u);
      const q = quatFromBasis(u, v, n);
      const sz = sp.r * Math.sqrt(4 / sp.n) * 1.1;
      const c = shade(pos, n, sp.col(0, r()), stimmung, sp.licht);
      out.push({ x: pos[0], y: pos[1], z: pos[2], r: c[0], g: c[1], b: c[2], a: sp.licht ? 0.98 : 0.9, sx: sz, sy: sz, sz: sz * 0.15, qw: q[0], qx: q[1], qy: q[2], qz: q[3] });
    }
  }
  return out;
}

for (const stimmung of ["tag", "abend"]) {
  const splats = generate(stimmung, 20261028);
  const file = path.join(OUT, `testszene-${stimmung}.ply`);
  writePly(file, splats);
  console.log(`${stimmung}: ${splats.length.toLocaleString("de-AT")} Gaussians → ${file}`);
}
