// src/lib/yacht/hull.js
// Procedural boat generator for the "Werfthalle" on /de/yacht-interior.
// ONE generator builds all six hulls from a parameter set (stations ×
// section points), plus deck, superstructure volumes, abstract furniture
// blocks, zone anchors and camera presets. No external models, no textures,
// no manufacturer shapes: furniture stays abstract volumes on purpose
// (Design-Bibel §14 "Keine Nachbauten von Designermöbeln in 3D ohne Lizenz").
//
// Pure module (no three.js, no React, no '@/' alias): used by the 3D stage,
// by the SVG poster (side profile) and by node --test.
// Coordinates: metres; x along the boat (stern −L/2 → bow +L/2),
// y up (waterline 0), z across (port −, starboard +).
// Docs: Marktresearch/digital/features/yacht.md

/** Hull parameters per model. L/B come from concepts.json → modelle. */
export const HULLS = {
  runabout: { L: 9, B: 2.6, F: 0.78, S: 0.22, D: 0.42, transom: 0.84, n: 2.4, m: 1.25, bowStart: 0.5, bowPow: 1.25, forefoot: 0.72, finish: "holz" },
  daycruiser: { L: 11, B: 3.5, F: 1.0, S: 0.28, D: 0.62, transom: 0.86, n: 2.4, m: 1.3, bowStart: 0.52, bowPow: 1.3, forefoot: 0.7, finish: "gelcoat" },
  segelyacht: { L: 14, B: 4.3, F: 1.05, S: 0.24, D: 0.55, transom: 0.72, n: 2.2, m: 1.9, bowStart: 0.48, bowPow: 1.15, forefoot: 0.62, finish: "gelcoat", keel: { x: 0.6, depth: 2.1, chord: 1.6 } },
  motoryacht: { L: 26, B: 6.2, F: 1.25, S: 0.55, D: 1.05, transom: 0.9, n: 2.5, m: 1.35, bowStart: 0.55, bowPow: 1.3, forefoot: 0.7, finish: "gelcoat" },
  hausboot: { L: 15, B: 5, F: 0.62, S: 0.06, D: 0.5, transom: 1, n: 7, m: 6, bowStart: 0.82, bowPow: 0.6, forefoot: 0.86, finish: "lärche", barge: true },
  superyacht: { L: 45, B: 9, F: 2.0, S: 0.7, D: 2.0, transom: 0.88, n: 2.5, m: 1.4, bowStart: 0.55, bowPow: 1.35, forefoot: 0.66, finish: "gelcoat" },
};

export const MODEL_KEYS = Object.keys(HULLS);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Half beam at station t ∈ [0,1] (stern → bow). Never exactly 0 (normals). */
export function halfBeam(h, t) {
  const b = h.B / 2;
  if (t <= h.bowStart) {
    const k = t / h.bowStart;
    return b * (h.transom + (1 - h.transom) * Math.sin((k * Math.PI) / 2));
  }
  const k = (t - h.bowStart) / (1 - h.bowStart);
  return Math.max(0.004, b * Math.pow(Math.cos((k * Math.PI) / 2), h.bowPow));
}

/** Sheer (deck edge) height at station t. Rises towards the bow. */
export const sheerY = (h, t) => h.F + h.S * Math.pow(t, 2.2);

/** Keel height at station t. The forefoot lifts towards the stem. */
export function keelY(h, t) {
  const rise = t <= h.forefoot ? 0 : Math.pow((t - h.forefoot) / (1 - h.forefoot), 1.6);
  const top = sheerY(h, t) - 0.12;
  return -h.D + (top + h.D) * rise * 0.92;
}

export const xAt = (h, t) => -h.L / 2 + t * h.L;
export const tAt = (h, x) => clamp((x + h.L / 2) / h.L, 0, 1);
/** Deck height at x (on the sheer). */
export const deckAt = (h, x) => sheerY(h, tAt(h, x));

/**
 * Half width of the hull at x and height y (inside of the skin). The section
 * is the superellipse of buildHull: (z/w)^n + ((ys−y)/(ys−yk))^m = 1.
 * Above the sheer the hull is open (returns w), below the keel 0.
 */
export function hullHalfWidth(h, x, y) {
  if (x < -h.L / 2 || x > h.L / 2) return 0;
  const t = tAt(h, x);
  const w = halfBeam(h, t);
  const ys = sheerY(h, t);
  const yk = keelY(h, t);
  if (y >= ys) return w;
  if (y <= yk) return 0;
  const v = (ys - y) / (ys - yk);
  return w * Math.pow(Math.max(0, 1 - Math.pow(v, h.m)), 1 / h.n);
}

/**
 * Hull surface: `stations` rings of 2·P+1 points (port sheer → keel →
 * starboard sheer), quads between rings, a transom cap at the stern.
 * @returns {{positions: number[], indices: number[], uvs: number[], stations: number, ring: number}}
 */
export function buildHull(h, { stations = 40, half = 15 } = {}) {
  const ring = half * 2 + 1;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < stations; i++) {
    const t = i / (stations - 1);
    const x = xAt(h, t);
    const w = halfBeam(h, t);
    const ys = sheerY(h, t);
    const yk = keelY(h, t);
    for (let r = 0; r < ring; r++) {
      const j = r - half; // −half … +half
      const theta = (Math.abs(j) / half) * (Math.PI / 2);
      const z = Math.sign(j) * w * Math.pow(Math.sin(theta), 2 / h.n);
      const y = ys - (ys - yk) * Math.pow(Math.cos(theta), 2 / h.m);
      positions.push(x, y, z);
      uvs.push(t, r / (ring - 1));
    }
  }
  for (let i = 0; i < stations - 1; i++) {
    for (let r = 0; r < ring - 1; r++) {
      const a = i * ring + r;
      const b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // Transom cap (fan around the centre of the stern ring).
  const c = positions.length / 3;
  const ys0 = sheerY(h, 0);
  positions.push(xAt(h, 0), (ys0 + keelY(h, 0)) / 2, 0);
  uvs.push(0, 0.5);
  for (let r = 0; r < ring - 1; r++) indices.push(c, r + 1, r);
  // Close the top of the transom (sheer to sheer).
  indices.push(c, 0, ring - 1);
  return { positions, indices, uvs, stations, ring };
}

/**
 * Deck: a strip between port and starboard sheer per station, slightly
 * below the sheer so the hull edge reads as a rubbing strake.
 * UV: u along the boat in metres / 1, v across in metres → plank texture.
 */
export function buildDeck(h, { stations = 40, inset = 0.06 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < stations; i++) {
    const t = i / (stations - 1);
    const x = xAt(h, t);
    const w = Math.max(0.002, halfBeam(h, t) - inset);
    const y = sheerY(h, t) - 0.02;
    positions.push(x, y, -w, x, y, w);
    uvs.push(x, -w, x, w);
  }
  for (let i = 0; i < stations - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return { positions, indices, uvs };
}

/** Side profile for the SVG poster: sheer and keel polylines + waterline. */
export function sideProfile(h, steps = 48) {
  const sheer = [];
  const keel = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    sheer.push([xAt(h, t), sheerY(h, t)]);
    keel.push([xAt(h, t), keelY(h, t)]);
  }
  return { sheer, keel };
}

// ---------------------------------------------------------------------------
// Superstructure, interior and furniture.
// Box: { p: [x,y,z] centre, s: [sx,sy,sz] size, mat, r?: radius, cut?: bool,
//        rot?: [rx,ry,rz] (radians), zone?: zone id }
// mats: gelcoat, holz, lärche, glass, window, teak, hardtop, metal,
//       soft0 / soft1 / soft2 (concept colours), bedding (white linen),
//       wood (interior joinery), sole (interior floor), wall (bulkhead),
//       sail, lamp (battery lamp shade – glows in the evening)
// `cut: true` → clipped by the section plane (deck, superstructure). Parts
// below the section height stay visible inside the opened hull.
// `zone` tags the furniture of a zone: its bounding box frames the camera
// (cameraFor) – no hand-tuned camera per boat.
// Furniture = low-poly SILHOUETTES (plinth, seat and back cushions,
// armrests, headboard, pillows, blanket, pedestal …) in the concept colours.
// Generic archetypes – no design of a manufacturer is rebuilt (Bibel §14).
// ---------------------------------------------------------------------------

const box = (p, s, mat, extra = {}) => ({ p, s, mat, r: 0.04, ...extra });

/**
 * Sofa / bench along x or z: plinth, seat cushions, back cushions,
 * armrests and one scatter cushion. The back sits outboard (axis x) or
 * towards the stern (axis z).
 */
export function bench(x, y, z, len, axis, mat, depth = 0.55) {
  const along = axis === "x";
  const back = along ? Math.sign(z || 1) : -1;
  // u = along the bench, v = across (towards the back = +), yy = height
  const P = (u, v, yy) => (along ? [x + u, y + yy, z + back * v] : [x + back * v, y + yy, z + u]);
  const S = (su, sv, sy) => (along ? [su, sy, sv] : [sv, sy, su]);
  const arm = Math.min(0.14, len * 0.1);
  const inner = len - arm * 2;
  const n = Math.max(1, Math.round(inner / 0.8));
  const cw = inner / n;
  const out = [box(P(0, 0, 0.07), S(len - 0.04, depth - 0.04, 0.14), "wood", { r: 0.02 })];
  for (let i = 0; i < n; i++) {
    const u = -inner / 2 + cw * (i + 0.5);
    out.push(box(P(u, -0.09, 0.25), S(cw - 0.025, depth - 0.2, 0.22), mat, { r: 0.07 }));
    out.push(box(P(u, depth / 2 - 0.11, 0.58), S(cw - 0.03, 0.2, 0.44), mat, { r: 0.08 }));
  }
  for (const s of [-1, 1]) out.push(box(P(s * (len / 2 - arm / 2), 0, 0.36), S(arm, depth, 0.44), mat, { r: 0.05 }));
  if (inner > 1) out.push(box(P(-inner / 2 + 0.28, depth / 2 - 0.3, 0.5), S(0.4, 0.13, 0.34), mat === "soft2" ? "soft0" : "soft2", { r: 0.06 }));
  return out;
}

/** Table: top plus pedestal(s) with a foot plate. */
export function table(x, y, z, sx, sz, mat = "wood", h = 0.72) {
  const out = [box([x, y + h - 0.02, z], [sx, 0.04, sz], mat, { r: 0.015 })];
  const legs = sx > 1.5 ? [-sx * 0.3, sx * 0.3] : [0];
  for (const dx of legs) {
    out.push(box([x + dx, y + h / 2, z], [0.09, h - 0.06, 0.09], "metal", { r: 0.02 }));
    out.push(box([x + dx, y + 0.015, z], [Math.min(0.5, sx * 0.4), 0.03, Math.min(0.5, sz * 0.6)], "metal", { r: 0.01 }));
  }
  return out;
}

/** Dining chair facing ±z: seat, back, pedestal. */
function chair(x, y, z, face, mat) {
  return [
    box([x, y + 0.45, z], [0.46, 0.08, 0.46], mat, { r: 0.03 }),
    box([x, y + 0.7, z - face * 0.2], [0.44, 0.42, 0.06], mat, { r: 0.03 }),
    box([x, y + 0.22, z], [0.06, 0.42, 0.06], "metal", { r: 0.01 }),
  ];
}

/** Double bed, head towards +x (bow): base, mattress, headboard, pillows, blanket, throw. */
export function bed(x, y, z, sx, sz) {
  const head = x + sx / 2;
  return [
    box([x, y + 0.14, z], [sx, 0.28, sz], "wood", { r: 0.03 }),
    box([x - 0.02, y + 0.38, z], [sx - 0.1, 0.2, sz - 0.08], "bedding", { r: 0.06 }),
    box([head + 0.04, y + 0.48, z], [0.1, 0.72, sz + 0.06], "soft0", { r: 0.04 }),
    ...[-1, 1].map((s) => box([head - 0.26, y + 0.54, z + s * sz * 0.23], [0.32, 0.13, sz * 0.4], "bedding", { r: 0.05 })),
    box([x - sx * 0.18, y + 0.5, z], [sx * 0.62, 0.05, sz + 0.02], "soft1", { r: 0.02 }),
    box([x - sx * 0.42, y + 0.54, z], [0.32, 0.05, sz + 0.05], "soft2", { r: 0.02 }),
  ];
}

/** Sun lounger along x, back raised at +x (dir 1) or −x (dir −1). */
function lounger(x, y, z, len, w, mat, dir = 1) {
  return [
    box([x, y + 0.12, z], [len, 0.14, w], "wood", { r: 0.02 }),
    box([x - dir * len * 0.14, y + 0.25, z], [len * 0.68, 0.1, w - 0.06], mat, { r: 0.04 }),
    box([x + dir * len * 0.31, y + 0.37, z], [len * 0.34, 0.1, w - 0.06], mat, { r: 0.04, rot: [0, 0, dir * 0.45] }),
  ];
}

/** Sun pad with two cushions at the +x end. */
function sunpad(x, y, z, sx, sz, mat) {
  return [
    box([x, y + 0.1, z], [sx, 0.2, sz], mat, { r: 0.08 }),
    ...[-1, 1].map((s) => box([x + sx / 2 - 0.24, y + 0.26, z + s * sz * 0.22], [0.3, 0.13, sz * 0.36], "bedding", { r: 0.05 })),
  ];
}

/**
 * Bath as its own room between two bulkheads x0..x1 (floor y, half width zh):
 * tiled floor, vanity with basin, tap and mirror (port), shower tray with
 * glass screens and rain head (starboard, forward), WC with cistern
 * (starboard, aft), towel on a rail and bath mat. Generic sanitary
 * archetypes, no product.
 */
export function bath(x0, x1, y, zh) {
  const len = x1 - x0;
  const xc = (x0 + x1) / 2;
  const sh = Math.min(0.8, len * 0.4); // shower tray
  const vw = Math.min(1.0, len * 0.46); // vanity width
  const vx = x1 - 0.1 - vw / 2;
  const sx = x1 - 0.06 - sh / 2;
  const sz = zh - 0.06 - sh / 2;
  return [
    box([xc, y + 0.02, 0], [len - 0.08, 0.04, zh * 2 - 0.08], "tile", { r: 0.005 }),
    box([vx, y + 0.4, -zh + 0.28], [vw, 0.74, 0.44], "wood", { r: 0.02 }),
    box([vx, y + 0.79, -zh + 0.28], [vw + 0.04, 0.04, 0.48], "ceramic", { r: 0.01 }),
    box([vx, y + 0.86, -zh + 0.3], [Math.min(0.44, vw * 0.6), 0.1, 0.32], "ceramic", { r: 0.04 }),
    box([vx, y + 0.95, -zh + 0.1], [0.04, 0.2, 0.04], "metal", { r: 0.01 }),
    box([vx, y + 1.3, -zh + 0.05], [vw * 0.9, 0.62, 0.02], "mirror", { r: 0.01, cut: true }),
    // shower: tray, two glass screens, rain head
    box([sx, y + 0.05, sz], [sh, 0.06, sh], "ceramic", { r: 0.02 }),
    box([sx, y + 0.95, zh - 0.08 - sh], [sh, 1.8, 0.02], "glass", { r: 0.005, cut: true }),
    box([x1 - 0.07 - sh, y + 0.95, sz], [0.02, 1.8, sh], "glass", { r: 0.005, cut: true }),
    box([sx, y + 1.95, sz], [0.22, 0.03, 0.22], "metal", { r: 0.01, cut: true }),
    // WC against the aft bulkhead: bowl, seat, cistern
    box([x0 + 0.38, y + 0.2, zh - 0.36], [0.5, 0.4, 0.38], "ceramic", { r: 0.12 }),
    box([x0 + 0.4, y + 0.42, zh - 0.36], [0.46, 0.04, 0.36], "ceramic", { r: 0.03 }),
    box([x0 + 0.12, y + 0.62, zh - 0.36], [0.14, 0.5, 0.4], "ceramic", { r: 0.03 }),
    // towel on a rail (aft bulkhead, port) and bath mat
    box([x0 + 0.08, y + 0.95, -zh + 0.62], [0.03, 0.03, 0.46], "metal", { r: 0.01 }),
    box([x0 + 0.09, y + 0.73, -zh + 0.62], [0.03, 0.44, 0.4], "soft2", { r: 0.01 }),
    box([vx, y + 0.045, -zh + 0.78], [Math.min(0.7, vw), 0.012, 0.4], "soft1", { r: 0.005 }),
  ];
}

function windows(x0, x1, y, h, zHalf, count, extra = {}) {
  const out = [];
  const len = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    const x = x0 + len * (i + 0.5);
    for (const s of [-1, 1]) out.push(box([x, y, s * zHalf], [len * 0.78, h, 0.04], "window", { r: 0.01, cut: true, ...extra }));
  }
  return out;
}

/** Parts per model. `h` = hull params. Returns { parts, anchors, cutY, floorY, rooms, lamps }. */
export function buildModel(key) {
  const h = HULLS[key];
  if (!h) throw new Error(`unknown model ${key}`);
  const L = h.L;
  const B = h.B;
  const d = (x) => deckAt(h, x);
  const w = (x) => halfBeam(h, tAt(h, x));
  const parts = [];
  const anchors = {};
  const cutY = {};
  const lamps = [];
  const sole = Math.max(-h.D + 0.35, -0.1);
  const add = (...list) => parts.push(...list.flat(2));
  /** furniture of a zone (tagged for the camera framing) */
  const Z = (zone, ...list) => parts.push(...list.flat(2).map((p) => ({ ...p, zone })));
  /** cordless lamp on a surface at height yTop (shade glows in the evening) */
  const lamp = (zone, x, yTop, z, extra = {}) => {
    lamps.push([x, yTop + 0.32, z]);
    Z(zone, [box([x, yTop + 0.13, z], [0.035, 0.26, 0.035], "metal", { r: 0.01, ...extra }), box([x, yTop + 0.3, z], [0.2, 0.09, 0.2], "lamp", { r: 0.045, ...extra })]);
  };
  const cutAll = (list) => list.flat(2).map((p) => ({ ...p, cut: true }));
  /** room boxes of the cabins below deck, from their bulkheads (camera framing) */
  const interior = {};
  /** usable half width of a room x0..x1 at floor y (narrower end, at seat height) */
  const inner = (x0, x1, y) => Math.max(0.6, Math.min(hullHalfWidth(h, x0, y + 0.45), hullHalfWidth(h, x1, y + 0.45)) - 0.06);
  /** transverse bulkhead at x from floor y up to just under the deck (section-cut) */
  const bulkhead = (x, y) => {
    const top = d(x) - 0.06;
    const zh = Math.max(0.4, hullHalfWidth(h, x, y + 0.35) - 0.02);
    add(box([x, (y + top) / 2, 0], [0.06, top - y, zh * 2], "wall", { r: 0.01, cut: true }));
  };
  const cabin = (zone, x0, x1, y, height = 1) => {
    interior[zone] = { c: [(x0 + x1) / 2, y + height / 2, 0], s: [x1 - x0, height, 2 * inner(x0, x1, y)] };
  };

  if (key === "runabout") {
    const y = d(-2) - 0.55; // cockpit sole
    Z("deck", box([-2.6, y, 0], [2.8, 0.06, B * 0.72], "teak", { cut: false }));
    Z("deck", bench(-3.15, y, 0, B * 0.68, "z", "soft0", 0.7));
    Z("deck", bench(-1.6, y, -0.45, 0.62, "z", "soft0", 0.6), bench(-1.6, y, 0.45, 0.62, "z", "soft0", 0.6));
    add(box([-0.6, d(-0.6) + 0.22, 0], [0.08, 0.44, B * 0.7], "glass", { r: 0.02 }));
    Z("deck", sunpad(-4.05, d(-4) - 0.08, 0, 0.9, B * 0.62, "soft1"));
    Z("badeplattform", box([-L / 2 - 0.25, 0.24, 0], [0.5, 0.06, B * 0.7], "teak"));
    add(box([-1.15, d(-1.1) + 0.3, 0.55], [0.06, 0.06, 0.06], "metal"));
    add(box([-1.25, d(-1.2) + 0.35, 0.45], [0.04, 0.36, 0.36], "holz", { r: 0.02 })); // steering wheel
    anchors.deck = [-2.4, d(-2.4) - 0.1, 0];
    anchors.badeplattform = [-L / 2 - 0.2, 0.3, 0];
  }

  if (key === "daycruiser") {
    const y = d(-3) - 0.62;
    Z("deck", box([-3.2, y, 0], [3.4, 0.06, B * 0.78], "teak"));
    Z("deck", bench(-4.4, y, 0, B * 0.7, "z", "soft0", 0.6));
    Z("deck", bench(-3.3, y, -B * 0.32, 2.0, "x", "soft0", 0.55));
    Z("deck", table(-3.2, y, 0.25, 1.1, 0.7, "teak"));
    lamp("deck", -2.95, y + 0.72, 0.4);
    // cabin roof and windscreen over the forward part
    add(box([1.2, d(1.2) + 0.32, 0], [4.2, 0.62, B * 0.7], "gelcoat", { cut: true, r: 0.18 }));
    add(box([-1.15, d(-1.1) + 0.55, 0], [0.5, 0.9, B * 0.72], "glass", { cut: true, r: 0.05 }));
    add(box([-1.6, d(-1.6) + 1.25, 0], [2.6, 0.06, B * 0.8], "hardtop", { cut: true, r: 0.1 }));
    add(windows(-0.6, 3.0, d(1.2) + 0.32, 0.14, B * 0.35 + 0.01, 3));
    add(cutAll(sunpad(4.6, d(4.6) - 0.06, 0, 1.4, B * 0.4, "soft1")));
    Z("badeplattform", box([-L / 2 - 0.35, 0.22, 0], [0.7, 0.06, B * 0.8], "teak"));
    // interior below deck
    add(box([1.6, sole, 0], [5.6, 0.04, B * 0.62], "sole"));
    Z("salon", bench(0.55, sole, -B * 0.24, 1.6, "x", "soft2", 0.5), table(0.55, sole, 0.15, 0.9, 0.6));
    lamp("salon", 0.75, sole + 0.72, 0.25);
    bulkhead(1.65, sole);
    Z("bad", bath(1.65, 2.75, sole, inner(1.65, 2.75, sole)));
    bulkhead(2.75, sole);
    cabin("bad", 1.65, 2.75, sole);
    cabin("kabine", 2.75, 4.5, sole);
    Z("kabine", bed(3.65, sole + 0.05, 0, 1.6, Math.min(1.7, w(3.6) * 1.6)));
    anchors.deck = [-3.2, d(-3.2) - 0.2, 0];
    anchors.salon = [0.55, sole + 0.5, 0];
    anchors.bad = [2.2, sole + 0.5, 0];
    anchors.kabine = [3.6, sole + 0.5, 0];
    anchors.badeplattform = [-L / 2 - 0.3, 0.28, 0];
    for (const z of ["salon", "bad", "kabine"]) cutY[z] = sole + 0.95;
  }

  if (key === "segelyacht") {
    const y = d(-4) - 0.55;
    Z("deck", box([-4.3, y, 0], [3.0, 0.06, B * 0.6], "teak"));
    Z("deck", bench(-4.3, y, -B * 0.28, 2.6, "x", "soft0", 0.5), bench(-4.3, y, B * 0.28, 2.6, "x", "soft0", 0.5));
    Z("deck", table(-4.1, y, 0, 0.9, 0.5, "teak"));
    lamp("deck", -4.1, y + 0.72, 0);
    add(box([0.8, d(0.8) + 0.3, 0], [5.4, 0.6, B * 0.56], "gelcoat", { cut: true, r: 0.22 }));
    add(windows(-1.4, 2.8, d(0.8) + 0.32, 0.12, B * 0.28 + 0.01, 4));
    add(box([-2.25, d(-2.2) + 0.45, 0], [0.7, 0.55, B * 0.58], "soft2", { cut: true, r: 0.2 }));
    const mx = 1.6;
    const mh = L * 1.05;
    // mast, boom and furled sail are cut with the deck (no pole in front of the cabins)
    add(box([mx, d(mx) + mh / 2, 0], [0.18, mh, 0.22], "metal", { r: 0.06, cut: true }));
    add(box([mx - 2.6, d(mx) + 1.9, 0], [5.2, 0.12, 0.12], "metal", { r: 0.05, cut: true }));
    add(box([mx - 2.6, d(mx) + 2.25, 0], [5.0, 0.55, 0.36], "sail", { r: 0.12, cut: true }));
    // keel fin and bulb (below the hull)
    add(box([h.keel.x, -h.D - h.keel.depth / 2 + 0.1, 0], [h.keel.chord, h.keel.depth, 0.18], "gelcoat", { r: 0.06 }));
    add(box([h.keel.x - 0.1, -h.D - h.keel.depth + 0.1, 0], [2.0, 0.34, 0.5], "metal", { r: 0.16 }));
    // interior
    add(box([1.4, sole, 0], [7.5, 0.04, B * 0.6], "sole"));
    Z("salon", bench(0.6, sole, -B * 0.26, 2.2, "x", "soft2", 0.55), bench(0.6, sole, B * 0.26, 2.2, "x", "soft2", 0.55), table(0.6, sole, 0, 1.2, 0.6));
    lamp("salon", 0.85, sole + 0.72, 0.1);
    bulkhead(2.1, sole);
    Z("bad", bath(2.1, 3.5, sole, inner(2.1, 3.5, sole)));
    bulkhead(3.5, sole);
    cabin("bad", 2.1, 3.5, sole);
    cabin("kabine", 3.5, 5.6, sole);
    Z("kabine", bed(4.5, sole + 0.05, 0, 1.8, Math.min(1.8, w(4.5) * 1.6)));
    anchors.deck = [-4.3, d(-4.3) - 0.2, 0];
    anchors.salon = [0.6, sole + 0.5, 0];
    anchors.bad = [2.8, sole + 0.5, 0];
    anchors.kabine = [4.5, sole + 0.5, 0];
    for (const z of ["salon", "bad", "kabine"]) cutY[z] = sole + 0.95;
  }

  if (key === "motoryacht") {
    const main = d(-6);
    // aft deck
    Z("deck", box([-9.5, main + 0.02, 0], [5.6, 0.05, B * 0.86], "teak"));
    Z("deck", bench(-11.2, main, 0, B * 0.66, "z", "soft0", 0.8), table(-10.0, main, 0, 1.8, 1.0, "teak"));
    for (const s of [-1, 1]) Z("deck", chair(-10.0, main, s * 0.85, -s, "soft0"));
    lamp("deck", -9.7, main + 0.72, 0.15);
    // swim platform
    Z("badeplattform", box([-L / 2 - 0.7, 0.25, 0], [1.4, 0.1, B * 0.86], "teak"));
    Z("badeplattform", sunpad(-L / 2 - 0.55, 0.3, 0, 1.0, 1.8, "soft1"));
    // salon superstructure on the main deck
    const sTop = main + 2.25;
    add(box([0, main + 0.02, 0], [12.4, 0.05, B * 0.8], "sole", { cut: true }));
    add(box([0.2, sTop - 0.04, 0], [12.8, 0.1, B * 0.86], "gelcoat", { cut: true, r: 0.06 }));
    add(box([-6.15, main + 1.1, 0], [0.06, 2.2, B * 0.8], "glass", { cut: true, r: 0.02 }));
    add(box([6.3, main + 1.1, 0], [0.5, 2.2, B * 0.74], "gelcoat", { cut: true, r: 0.12 }));
    add(windows(-5.6, 5.6, main + 1.25, 1.2, B * 0.43, 5));
    add(box([0.2, main + 1.1, 0], [12.2, 2.2, B * 0.84], "gelcoat", { cut: true, r: 0.08 }));
    // salon: sofa, coffee table, rug, armchair, dining
    Z("salon", bench(0.6, main, -B * 0.28, 3.4, "x", "soft2", 0.9), table(0.9, main, 0.2, 1.4, 0.9, "wood", 0.42));
    Z("salon", box([0.9, main + 0.04, 0.2], [3.4, 0.02, 2.4], "soft1", { r: 0.01 }));
    Z("salon", bench(2.5, main, 0.9, 0.9, "z", "soft2", 0.85));
    lamp("salon", 0.6, main + 0.42, 0.35);
    Z("salon", table(-3.6, main, 0, 1.8, 1.0));
    for (const xx of [-4.1, -3.1]) for (const s of [-1, 1]) Z("salon", chair(xx, main, s * 0.78, -s, "soft0"));
    // flybridge
    const fly = sTop + 0.04;
    add(box([0.4, fly, 0], [10.8, 0.05, B * 0.8], "teak", { cut: true }));
    Z("flybridge", cutAll(bench(-2.6, fly, -B * 0.26, 3.6, "x", "soft0", 0.9)));
    Z("flybridge", cutAll(table(-2.4, fly, 0.25, 1.6, 0.9, "teak", 0.42)));
    lamp("flybridge", -2.0, fly + 0.42, 0.4, { cut: true });
    Z("flybridge", cutAll(sunpad(5.0, fly, 0, 2.0, 2.2, "soft1")));
    Z("flybridge", cutAll([lounger(-4.6, fly, -1.0, 1.9, 0.75, "soft1", 1), lounger(-4.6, fly, 0.1, 1.9, 0.75, "soft1", 1)]));
    add(box([2.8, fly + 0.6, 0], [1.4, 1.2, 1.6], "gelcoat", { cut: true, r: 0.1 }));
    for (const s of [-1, 1]) add(box([2.2, fly + 1.15, s * B * 0.34], [0.08, 2.3, 0.08], "metal", { cut: true }));
    add(box([2.4, fly + 2.32, 0], [5.4, 0.08, B * 0.78], "hardtop", { cut: true, r: 0.2 }));
    // foredeck sun pad
    add(cutAll(sunpad(8.8, d(8.8) + 0.02, 0, 2.4, B * 0.42, "soft1")));
    // lower deck interior
    add(box([5.8, sole, 0], [8.2, 0.04, B * 0.66], "sole"));
    bulkhead(3.4, sole);
    Z("bad", bath(3.4, 5.9, sole, inner(3.4, 5.9, sole)));
    bulkhead(5.9, sole);
    cabin("bad", 3.4, 5.9, sole, 1.2);
    cabin("kabine", 5.9, 9.6, sole, 1.2);
    Z("kabine", bed(7.8, sole + 0.05, 0, 2.1, 1.9));
    for (const s of [-1, 1]) {
      Z("kabine", box([8.55, sole + 0.25, s * 1.25], [0.45, 0.5, 0.45], "wood", { r: 0.03 }));
      lamp("kabine", 8.55, sole + 0.5, s * 1.25);
    }
    Z("kabine", bench(6.7, sole, 1.15, 0.8, "x", "soft2", 0.6));
    anchors.deck = [-9.8, main + 0.4, 0];
    anchors.flybridge = [-0.6, fly + 0.5, 0];
    anchors.salon = [0.6, main + 0.5, 0];
    anchors.bad = [4.65, sole + 0.5, 0];
    anchors.kabine = [7.8, sole + 0.5, 0];
    anchors.badeplattform = [-L / 2 - 0.6, 0.35, 0];
    cutY.salon = main + 1.25;
    cutY.bad = cutY.kabine = sole + 1.25;
  }

  if (key === "hausboot") {
    const deck = d(0);
    const houseTop = deck + 2.6;
    add(box([0.3, deck + 1.3, 0], [8.6, 2.6, B * 0.78], "lärche", { cut: true, r: 0.06 }));
    add(box([0.3, houseTop + 0.05, 0], [9.6, 0.12, B * 0.92], "hardtop", { cut: true, r: 0.05 }));
    add(windows(-3.4, 4.0, deck + 1.35, 1.7, B * 0.39 + 0.02, 4));
    add(box([4.6, deck + 1.35, 0], [0.04, 1.9, B * 0.6], "window", { cut: true, r: 0.01 }));
    // terrace (aft) with lounge, table, lounger and shade
    Z("deck", box([-5.6, deck + 0.02, 0], [3.4, 0.05, B * 0.9], "teak"));
    Z("deck", bench(-6.4, deck, 0, B * 0.6, "z", "soft0", 0.85));
    Z("deck", table(-5.0, deck, 0, 1.6, 0.9, "teak", 0.42));
    lamp("deck", -4.8, deck + 0.42, 0.1);
    Z("deck", lounger(-5.0, deck, B * 0.34, 1.8, 0.7, "soft1", -1));
    add(box([-5.4, deck + 2.3, 0], [3.0, 0.06, B * 0.8], "soft2", { r: 0.02 }));
    for (const s of [-1, 1]) add(box([-4.1, deck + 1.15, s * B * 0.38], [0.08, 2.3, 0.08], "metal"));
    // bow terrace
    add(box([5.9, deck + 0.02, 0], [2.0, 0.05, B * 0.82], "teak"));
    add(sunpad(6.0, deck + 0.03, 0, 1.2, 1.8, "soft1"));
    // interior
    add(box([0.3, deck + 0.04, 0], [8.4, 0.04, B * 0.76], "sole"));
    Z("salon", bench(-1.6, deck, -B * 0.24, 2.8, "x", "soft2", 0.9), table(-1.4, deck, 0.4, 1.2, 0.8, "wood", 0.42));
    Z("salon", box([-1.4, deck + 0.07, 0.2], [3.0, 0.02, 2.2], "soft1", { r: 0.01 }));
    Z("salon", bench(-3.0, deck, 1.1, 0.85, "z", "soft0", 0.85));
    lamp("salon", -1.1, deck + 0.42, 0.55);
    add(box([1.4, deck + 1.0, 0], [0.06, 2.0, B * 0.76], "wall", { r: 0.01, cut: true }));
    Z("kabine", bed(3.1, deck + 0.05, 0, 2.1, 1.9));
    for (const s of [-1, 1]) {
      Z("kabine", box([3.85, deck + 0.3, s * 1.25], [0.4, 0.5, 0.4], "wood", { r: 0.03 }));
      lamp("kabine", 3.85, deck + 0.55, s * 1.25);
    }
    add(box([-L / 2 - 0.3, 0.2, 0], [0.6, 0.06, B * 0.8], "teak"));
    anchors.deck = [-5.6, deck + 0.4, 0];
    anchors.salon = [-1.4, deck + 0.6, 0];
    anchors.kabine = [3.1, deck + 0.6, 0];
    anchors.badeplattform = [-L / 2 - 0.3, 0.3, 0];
    cutY.salon = cutY.kabine = deck + 1.3;
  }

  if (key === "superyacht") {
    const main = d(-8);
    const lvl = 2.7;
    // beach club at the stern
    Z("badeplattform", box([-L / 2 - 1.1, 0.3, 0], [2.2, 0.1, B * 0.86], "teak"));
    Z("badeplattform", box([-L / 2 + 1.6, 0.6, 0], [3.2, 0.06, B * 0.8], "teak"));
    for (const z of [-1.8, 0, 1.8]) Z("badeplattform", lounger(-L / 2 + 1.6, 0.63, z, 2.0, 0.9, "soft0", 1));
    Z("badeplattform", table(-L / 2 + 1.6, 0.63, -0.9, 0.5, 0.5, "teak", 0.45), table(-L / 2 + 1.6, 0.63, 0.9, 0.5, 0.5, "teak", 0.45));
    lamp("badeplattform", -L / 2 + 1.6, 1.08, 0.9);
    // main deck aft + superstructure
    Z("deck", box([-15, main + 0.02, 0], [8, 0.05, B * 0.86], "teak"));
    Z("deck", bench(-17.5, main, 0, B * 0.6, "z", "soft0", 0.9), table(-15.5, main, 0, 2.6, 1.2, "teak"));
    for (const xx of [-16.3, -15.5, -14.7]) for (const s of [-1, 1]) Z("deck", chair(xx, main, s * 0.95, -s, "soft0"));
    lamp("deck", -15.5, main + 0.72, 0);
    add(box([0, main + 0.02, 0], [21.6, 0.05, B * 0.8], "sole"));
    add(box([0, main + lvl / 2, 0], [22, lvl, B * 0.84], "gelcoat", { cut: true, r: 0.2, shell: true }));
    add(windows(-10, 10, main + 1.35, 1.5, B * 0.42 + 0.02, 7));
    Z("salon", bench(1.5, main, -B * 0.26, 4.2, "x", "soft2", 1.0), table(1.8, main, 0.6, 2.0, 1.2, "wood", 0.42));
    Z("salon", box([1.8, main + 0.04, 0.4], [5, 0.02, 3.4], "soft1", { r: 0.01 }));
    for (const xx of [0.6, 3.0]) Z("salon", bench(xx, main, 1.9, 0.95, "x", "soft0", 0.9));
    lamp("salon", 1.4, main + 0.42, 0.7);
    // upper deck
    const up = main + lvl;
    add(box([-1, up + lvl / 2, 0], [16, lvl, B * 0.76], "gelcoat", { cut: true, r: 0.2 }));
    add(windows(-7.5, 5.5, up + 1.35, 1.3, B * 0.38 + 0.02, 5));
    add(box([-12, up + 0.03, 0], [6, 0.05, B * 0.8], "teak", { cut: true }));
    add(cutAll(bench(-13.5, up, 0, B * 0.5, "z", "soft0", 0.9)));
    // sun deck
    const sun = up + lvl;
    add(box([-3, sun + 0.03, 0], [12, 0.05, B * 0.72], "teak", { cut: true }));
    for (const z of [-1.1, 1.1]) Z("flybridge", cutAll(lounger(-5.6, sun, z, 2.0, 0.9, "soft1", 1)));
    Z("flybridge", cutAll(bench(-1.2, sun, -B * 0.24, 4, "x", "soft0", 0.9)), cutAll(table(-1.0, sun, 0.4, 1.6, 0.9, "teak", 0.42)));
    lamp("flybridge", -0.7, sun + 0.42, 0.5, { cut: true });
    for (const s of [-1, 1]) add(box([2.4, sun + 1.2, s * B * 0.3], [0.1, 2.4, 0.1], "metal", { cut: true }));
    add(box([2.6, sun + 2.42, 0], [6, 0.1, B * 0.7], "hardtop", { cut: true, r: 0.3 }));
    add(box([10.5, main + 0.35, 0], [3, 0.7, B * 0.7], "gelcoat", { cut: true, r: 0.3 }));
    add(cutAll(sunpad(16, d(16) + 0.03, 0, 3.4, B * 0.32, "soft1")));
    anchors.deck = [-15.5, main + 0.5, 0];
    anchors.flybridge = [-3.5, sun + 0.6, 0];
    anchors.salon = [1.5, main + 0.6, 0];
    anchors.badeplattform = [-L / 2 + 0.4, 0.8, 0];
    cutY.salon = main + 1.3;
  }

  // Werfthalle: the boat stands on cradles in the hall (winter storage).
  const keelMin = h.keel ? -h.D - h.keel.depth : -h.D;
  const floorY = keelMin - (h.keel ? 0.25 : 0.55);
  if (!h.keel) {
    for (const x of [-L * 0.28, L * 0.18]) {
      add(box([x, (floorY - h.D) / 2 + 0.02, 0], [0.5, -h.D - floorY + 0.06, B * 0.5], "cradle", { r: 0.02 }));
    }
  } else {
    for (const x of [-L * 0.25, L * 0.25]) {
      for (const s of [-1, 1]) add(box([x, floorY + 0.9, s * B * 0.32], [0.14, 1.8, 0.14], "cradle", { r: 0.02 }));
    }
    add(box([h.keel.x - 0.1, floorY + 0.12, 0], [2.4, 0.24, 0.7], "cradle", { r: 0.02 }));
  }
  // Steg & Bootshaus: a jetty next to the boat (shown when a concept has
  // products for it). Placed on the starboard side, at deck height.
  const stegZ = -(B / 2 + 1.6);
  const stegY = Math.max(0.35, d(-L / 4) - 0.6);
  anchors.bootshaus = [-L * 0.12, stegY + 0.4, stegZ];
  const span = Math.min(0.25, 6 / L);
  const steg = [
    box([-L * 0.12, stegY, stegZ], [Math.min(L * 0.55, 14), 0.12, 2.2], "teak"),
    ...[-0.12 - span, -0.12 + span].flatMap((f) => [box([L * f, (stegY + floorY) / 2, stegZ - 1], [0.14, stegY - floorY, 0.14], "cradle"), box([L * f, (stegY + floorY) / 2, stegZ + 1], [0.14, stegY - floorY, 0.14], "cradle")]),
    ...lounger(-L * 0.2, stegY + 0.06, stegZ + 0.3, 1.9, 0.8, "soft0", 1),
    ...table(-L * 0.2 + 1.45, stegY + 0.06, stegZ + 0.3, 0.55, 0.55, "teak", 0.45),
    box([-L * 0.03, stegY + 1.1, stegZ + 0.2], [0.06, 2.0, 0.06], "metal"),
    box([-L * 0.03, stegY + 2.1, stegZ + 0.2], [2.4, 0.08, 2.4], "soft2", { r: 0.5 }),
  ].map((p) => ({ ...p, steg: true, zone: "bootshaus" }));
  parts.push(...steg);
  lamps.push([-L * 0.2 + 1.45, stegY + 0.8, stegZ + 0.3]);

  // Room boxes for the camera: bounding box of the zone's tagged parts.
  const rooms = {};
  for (const id of Object.keys(anchors)) {
    const own = parts.filter((p) => p.zone === id && p.mat !== "cradle" && !(p.cut && p.s[1] > 1.2));
    if (!own.length) {
      rooms[id] = { c: anchors[id], s: [3, 1.5, 3] };
      continue;
    }
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (const p of own) {
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], p.p[k] - p.s[k] / 2);
        hi[k] = Math.max(hi[k], p.p[k] + p.s[k] / 2);
      }
    }
    rooms[id] = { c: lo.map((v, k) => (v + hi[k]) / 2), s: lo.map((v, k) => hi[k] - v) };
  }
  // cabins below deck are framed by their bulkheads, not by the furniture
  for (const [id, r] of Object.entries(interior)) if (anchors[id]) rooms[id] = r;

  return { key, hull: h, parts, anchors, cutY, floorY, rooms, lamps };
}

const DEG = Math.PI / 180;

/**
 * Section cut WITHOUT clipping planes (QA round 2, P2.5): the renderer gets
 * geometry that already ends at the cut, so it works in every WebGL
 * implementation (WebKit/iOS included). For a part with `cut: true` and a
 * horizontal cut at height `cut`:
 * - entirely above the cut → null (hidden),
 * - crossing it, axis-aligned → the box shortened to end at the cut,
 * - crossing it, rotated → kept only if its centre is below the cut.
 * (Volumes are opened by sectionParts.)
 * Parts without `cut`, or no cut (null) → unchanged. Pure.
 */
export function sectionPart(part, cut) {
  if (cut == null || !part.cut) return part;
  const lo = part.p[1] - part.s[1] / 2;
  const hi = part.p[1] + part.s[1] / 2;
  if (lo >= cut - 1e-3) return null;
  if (hi <= cut) return part;
  if (part.rot) return part.p[1] < cut ? part : null;
  const sy = cut - lo;
  if (sy < 0.02) return null;
  return { ...part, p: [part.p[0], lo + sy / 2, part.p[2]], s: [part.s[0], sy, part.s[2]] };
}

/** Wall thickness of an opened volume (sectionParts). */
const SHELL = 0.06;

/**
 * Like sectionPart, but a crossing VOLUME (superstructure, house: both plan
 * sides > 2 m) is opened like a cutaway: four walls up to the cut, no lid –
 * the same picture a clipping plane gave, without clipping. Returns an array.
 */
export function sectionParts(part, cut) {
  const one = sectionPart(part, cut);
  if (!one) return [];
  if (one === part || one.rot || part.s[0] <= 2 || part.s[2] <= 2) return [one];
  const [x, y, z] = one.p;
  const [sx, sy, sz] = one.s;
  const t = SHELL;
  const wall = (p, s) => ({ ...one, p, s, r: 0.02 });
  return [
    wall([x - sx / 2 + t / 2, y, z], [t, sy, sz]),
    wall([x + sx / 2 - t / 2, y, z], [t, sy, sz]),
    wall([x, y, z - sz / 2 + t / 2], [sx - 2 * t, sy, t]),
    wall([x, y, z + sz / 2 - t / 2], [sx - 2 * t, sy, t]),
  ];
}

/** Deck surface visible under a cut? Hidden once the cut lies below the sheer. */
export function deckVisible(model, cut) {
  return cut == null || cut >= model.hull.F + model.hull.S;
}

/**
 * Section cut across the boat for a zone below deck: the hull skin on the
 * camera side (z > side) is cut away, like a cutaway drawing. Only when the
 * horizontal cut lies below the sheer (cabins under the deck); null otherwise.
 */
export function sideCut(model, zone) {
  const cut = model.cutY?.[zone];
  return cut != null && cut < model.hull.F ? 0 : null;
}

/**
 * Raycast from the zone's target to the camera (pure, no three.js): returns
 * what blocks the view, or null. Checks every part as an axis-aligned box
 * (glass, the zone's own furniture and parts above the section cut are
 * ignored – they are clipped or see-through) and the hull skin (a crossing
 * below the cut on the camera side counts only without a side cut).
 * Also used by the unit test "no mesh between camera and zone".
 */
export function viewBlocked(model, zone, target, position) {
  const h = model.hull;
  const cut = model.cutY?.[zone] ?? Infinity;
  const side = sideCut(model, zone);
  const dir = [0, 1, 2].map((k) => position[k] - target[k]);
  const len = Math.hypot(...dir);
  if (len < 1e-6) return null;
  const u = dir.map((v) => v / len);
  const t0 = 0.25;
  for (const p of model.parts) {
    if (p.zone === zone || p.steg || p.mat === "glass" || p.mat === "window" || p.mat === "mirror") continue;
    const lo = p.p.map((v, k) => v - p.s[k] / 2);
    const hi = p.p.map((v, k) => v + p.s[k] / 2);
    if (p.cut) {
      if (lo[1] >= cut) continue;
      hi[1] = Math.min(hi[1], cut);
    }
    let tmin = -Infinity;
    let tmax = Infinity;
    let hit = true;
    for (let k = 0; k < 3 && hit; k++) {
      if (Math.abs(u[k]) < 1e-9) {
        if (target[k] < lo[k] || target[k] > hi[k]) hit = false;
        continue;
      }
      let ta = (lo[k] - target[k]) / u[k];
      let tb = (hi[k] - target[k]) / u[k];
      if (ta > tb) [ta, tb] = [tb, ta];
      tmin = Math.max(tmin, ta);
      tmax = Math.min(tmax, tb);
      if (tmin > tmax) hit = false;
    }
    if (!hit || tmax < t0 || tmin > len) continue;
    if (tmin < t0) {
      // target inside a hollow volume (superstructure, house): the ray must
      // leave it through the section cut, not through a wall
      if (p.cut && target[1] + u[1] * tmax >= hi[1] - 1e-6) continue;
      if (!p.cut && tmax <= t0) continue;
    }
    return { part: p.mat, at: Math.max(tmin, t0) };
  }
  // hull skin: march until the ray is above the deck edge or the cut; a
  // change between inside and outside below the cut crosses the skin
  let was = null;
  for (let t = t0; t < len; t += 0.05) {
    const x = target[0] + u[0] * t;
    const y = target[1] + u[1] * t;
    const z = target[2] + u[2] * t;
    if (y >= Math.min(cut, sheerY(h, tAt(h, x)))) {
      if (y >= Math.min(cut, h.F + h.S)) break;
      was = null;
      continue;
    }
    const inside = x > -h.L / 2 && x < h.L / 2 && y > keelY(h, tAt(h, x)) && Math.abs(z) < hullHalfWidth(h, x, y);
    if (was != null && inside !== was && !(side != null && z > side)) return { part: "hull", at: t };
    was = inside;
  }
  return null;
}

/**
 * Camera preset for a zone: { target, position, cut, side }.
 * Overview (zone null): from aft-starboard-above, whole boat.
 * Zone: the zone's room box fills about 70–80 % of the stage. Zones under a
 * section cut (salon, kabine, bad) get an oblique view of 45° (steeper only when blocked)
 * into the opened hull, open zones 32° – never a plan view. The first
 * elevation/azimuth pair whose ray from the target to the camera is clear
 * (viewBlocked) wins, so no bulkhead or deck sits in front of the room.
 * @param {number} [aspect=1.6] viewport width/height
 * @param {number} [fov=32] vertical field of view in degrees
 */
export function cameraFor(model, zone, aspect = 1.6, fov = 32) {
  const { hull: h, anchors, cutY, rooms } = model;
  // narrow stages (phones 4:5): back off so the whole boat incl. the near
  // stern stays inside the horizontal field of view
  const portrait = aspect < 1.2 ? 1 + (1.2 - aspect) * 1.5 : 1;
  if (!zone || !anchors[zone]) {
    const top = h.keel ? h.L * 0.35 : h.F + 1.5;
    // portrait: aim a little towards the stern and lower so the boat
    // sits centred in the tall frame (the near stern projects larger)
    const p = portrait - 1;
    // phones (QA round 2, P2.7): the boat centred horizontally (shift
    // along the screen's x axis, -x-z) and closer (~85–95 % of the width);
    // landscape stages keep the framing of the poster stills
    const ax = p > 0 ? 0.07 - 0.075 * p : 0;
    const target = [-h.L * 0.12 * p - ax * h.L, top * (0.5 - 0.75 * p), -ax * h.L];
    const k = (h.L * 1.12 * portrait + 2) * (p > 0 ? 0.88 : 1);
    return { target, position: [-k * 0.82, k * 0.42 + 1, k * 0.82], cut: null, side: null };
  }
  const room = rooms?.[zone] || { c: anchors[zone], s: [3, 1.5, 3] };
  const cut = cutY[zone] ?? null;
  const side = sideCut(model, zone);
  const vHalf = (fov / 2) * DEG;
  const half = Math.min(vHalf, Math.atan(Math.tan(vHalf) * aspect));
  // projected half size of the room box (plan diagonal, a bit of height)
  const r = Math.max(1.1, 0.5 * Math.hypot(room.s[0], room.s[2]) * 0.92, room.s[1] * 0.5);
  const dist = r / (0.78 * Math.tan(half));
  const t = [room.c[0], cut != null ? Math.min(room.c[1], cut - 0.3) : room.c[1], room.c[2]];
  // below deck: oblique 45° (QA 1: 35–45°), nearly across the beam into the
  // cutaway (bulkheads seen edge-on); steeper only if something blocks the view
  const els = cut != null ? [45, 50, 56, 62] : [32, 40, 48, 56];
  const azs = cut != null ? [8, 16, 0, -8] : [36, 24, 48];
  let first = null;
  for (const e of els) {
    for (const a of azs) {
      const el = e * DEG;
      const az = a * DEG; // from the beam towards the stern
      const position = [t[0] - dist * Math.sin(az) * Math.cos(el), t[1] + dist * Math.sin(el), t[2] + dist * Math.cos(az) * Math.cos(el)];
      const cam = { target: t, position, cut, side };
      if (!first) first = cam;
      if (!viewBlocked(model, zone, t, position)) return cam;
    }
  }
  return first;
}

/** Corner radius of a part as drawn (never more than half its thinnest side). */
export function partRadius(part) {
  const minHalf = Math.min(...part.s) / 2;
  return Math.max(0.001, Math.min(part.r ?? 0.04, minHalf - 0.001));
}

/** Drawn as a rounded box? Thin parts (< 5 cm) and tiny radii stay plain boxes. */
export function isRoundedPart(part) {
  return partRadius(part) >= 0.01 && Math.min(...part.s) >= 0.05;
}

/**
 * Triangle count of a model as Stage3D draws it (budget ≤ 120 k, see tests):
 * hull + deck + 300 per rounded part (RoundedBoxGeometry, 2 segments = 5×5
 * quads per face) + 12 per plain box. The old estimate counted 12 for every
 * part and reported ≈ 4.5 k for the motor yacht – drawn were ≈ 96 k.
 */
export function triangleEstimate(model, { stations = 40, half = 15, roundedTris = 300, boxTris = 12 } = {}) {
  const ring = half * 2 + 1;
  const hullTris = (stations - 1) * (ring - 1) * 2 + ring;
  const deckTris = (stations - 1) * 2;
  const rounded = model.parts.filter(isRoundedPart).length;
  return hullTris + deckTris + rounded * roundedTris + (model.parts.length - rounded) * boxTris;
}
