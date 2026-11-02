// Küchenplaner – Raumgeometrie: Wände (Grundform oder frei als Polygon),
// Ecken, nutzbare Zeilenlängen, Dachschräge. Einheiten: cm (Eingabe) bzw. m
// (Welt). Reine Funktionen ohne three.js – genutzt von 3D, 2D, Prüfungen, Tests.
import { SHAPES } from "../../components/Labs/Kuechenplaner/catalog.js";
import { opt } from "./options.js";

export const WALL_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RUN_KEYS = [...WALL_IDS, "i"];
export const DEPTH_CM = 60; // Unterschranktiefe inkl. Front (EN 1116 / SMS: 60 cm Tiefe)
export const MAX_FREE_WALLS = 8;

const rad = (d) => (d * Math.PI) / 180;
const r4 = (n) => Math.round(n * 10000) / 10000;

/** Polygonpunkte (m) eines freien Raums. Letzte Wand schließt automatisch. */
export function freePoints(poly) {
  const pts = [[0, 0]];
  let phi = 0;
  for (let i = 0; i < poly.length; i++) {
    const { l, a } = poly[i];
    const [x, z] = pts[pts.length - 1];
    pts.push([r4(x + (Math.cos(phi) * l) / 100), r4(z + (Math.sin(phi) * l) / 100)]);
    phi += rad(180 - a);
  }
  return pts; // pts[n] ist der Endpunkt der letzten eingegebenen Wand; Schlusswand pts[n] → pts[0]
}

function segIntersect(p, p2, q, q2) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(q, q2, p);
  const d2 = d(q, q2, p2);
  const d3 = d(p, p2, q);
  const d4 = d(p, p2, q2);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
}

export function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    s += x1 * z2 - x2 * z1;
  }
  return s / 2;
}

/** Prüft einen freien Raum: Schlusswand lang genug, keine Selbstüberschneidung. */
export function validateFree(poly) {
  const pts = freePoints(poly);
  const closing = Math.hypot(pts[pts.length - 1][0], pts[pts.length - 1][1]) * 100;
  const corners = pts.slice(0, -1).concat([pts[pts.length - 1]]);
  const errors = [];
  if (closing < 40) errors.push("Die letzte Wand ist kürzer als 40 cm – bitte Längen oder Winkel anpassen.");
  const ring = [...corners];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segIntersect(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) {
        errors.push("Die Wände überschneiden sich – bitte Winkel prüfen.");
        i = n;
        break;
      }
    }
  }
  if (Math.abs(signedArea(ring)) < 2) errors.push("Der Raum ist kleiner als 2 m².");
  return { ok: errors.length === 0, errors, closing: Math.round(closing) };
}

export function roomDepth(plan) {
  if (plan.shape === "u" || plan.shape === "zweizeilig") return Math.max(plan.walls.b, plan.walls.c);
  return plan.walls.b;
}

/**
 * Wände als Liste: { id, p0, p1 (m), len (m), u (Richtung), n (nach innen), rot, rendered }.
 * Grundformen: a hinten, b links, c rechts (beide von der Rückwand nach vorne), d vorne (offen).
 */
export function roomWalls(plan) {
  const shape = SHAPES[plan.shape] || SHAPES.l;
  if (shape.free) {
    const pts = freePoints(plan.room.poly);
    const ring = pts.slice();
    const n = ring.length; // letzte Ecke + Schluss zu 0
    const sign = signedArea(ring) >= 0 ? 1 : -1;
    const walls = [];
    for (let i = 0; i < n && i < MAX_FREE_WALLS; i++) {
      const p0 = ring[i];
      const p1 = ring[(i + 1) % n];
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const u = [(p1[0] - p0[0]) / (len || 1), (p1[1] - p0[1]) / (len || 1)];
      const nrm = [-u[1] * sign, u[0] * sign];
      walls.push({ id: WALL_IDS[i], p0, p1, len, u, n: nrm, rot: Math.atan2(nrm[0], nrm[1]), rendered: true, closing: i === n - 1 });
    }
    return walls;
  }
  const W = plan.walls.a / 100;
  const D = roomDepth(plan) / 100;
  const Db = (plan.shape === "u" || plan.shape === "zweizeilig" ? plan.walls.b : D * 100) / 100;
  const Dc = (plan.shape === "u" || plan.shape === "zweizeilig" ? plan.walls.c : D * 100) / 100;
  return [
    { id: "a", p0: [0, 0], p1: [W, 0], len: W, u: [1, 0], n: [0, 1], rot: 0, rendered: true },
    { id: "b", p0: [0, 0], p1: [0, Db], len: Db, u: [0, 1], n: [1, 0], rot: Math.PI / 2, rendered: shape.side.left },
    { id: "c", p0: [W, 0], p1: [W, Dc], len: Dc, u: [0, 1], n: [-1, 0], rot: -Math.PI / 2, rendered: shape.side.right },
    { id: "d", p0: [0, D], p1: [W, D], len: W, u: [1, 0], n: [0, -1], rot: Math.PI, rendered: false },
  ];
}

export function wallById(plan, id) {
  return roomWalls(plan).find((w) => w.id === id) || null;
}

/** Wände mit Küchenzeilen. */
export function runWalls(plan) {
  const shape = SHAPES[plan.shape] || SHAPES.l;
  if (shape.free) return roomWalls(plan).map((w) => w.id);
  return shape.walls;
}

/** Innenwinkel (Grad) am Anfang einer freien Wand. */
function freeAngleAtStart(plan, i, count) {
  if (i === 0) {
    // Ecke zwischen Schlusswand und Wand a
    const pts = freePoints(plan.room.poly);
    const walls = roomWalls(plan);
    const last = walls[count - 1];
    const first = walls[0];
    const cross = last.u[0] * first.u[1] - last.u[1] * first.u[0];
    const dot = last.u[0] * first.u[0] + last.u[1] * first.u[1];
    const turn = Math.atan2(cross, dot); // Drehung in Grad
    void pts;
    const sign = signedArea(freePoints(plan.room.poly)) >= 0 ? 1 : -1;
    return 180 - (turn * 180) / Math.PI * sign;
  }
  return plan.room.poly[i - 1]?.a ?? 90;
}

/**
 * Ecken mit zwei Küchenzeilen: { owner, ownerAt, other, otherAt, angle }.
 * Die Zeile `owner` läuft bis in die Ecke, `other` beginnt mit Abstand.
 */
export function corners(plan) {
  const has = (w) => (plan.runs?.[w] || []).length > 0;
  if (plan.shape === "l") return [{ owner: "a", ownerAt: "start", other: "b", otherAt: "start", angle: 90 }];
  if (plan.shape === "u")
    return [
      { owner: "a", ownerAt: "start", other: "b", otherAt: "start", angle: 90 },
      { owner: "a", ownerAt: "end", other: "c", otherAt: "start", angle: 90 },
    ];
  if (!SHAPES[plan.shape]?.free) return [];
  const walls = roomWalls(plan);
  const out = [];
  for (let i = 0; i < walls.length; i++) {
    const prev = walls[(i - 1 + walls.length) % walls.length];
    if (has(prev.id) && has(walls[i].id) && prev.id !== walls[i].id) {
      out.push({ owner: prev.id, ownerAt: "end", other: walls[i].id, otherAt: "start", angle: freeAngleAtStart(plan, i, walls.length) });
    }
  }
  return out;
}

/**
 * Abstand, den eine Zeile an einer Ecke mit Innenwinkel `deg` vor der Nachbarzeile lassen muss (cm).
 * Spitz (≤ 90°): Die Fronten treffen sich auf der Winkelhalbierenden → depth / tan(deg/2).
 * Stumpf (90°–180°): Die rechtwinklige Seitenwand des ersten Schranks muss an der vorderen
 * Ecke des Eckschranks vorbei → depth · sin(deg). Die Winkelhalbierende allein reicht dort
 * nicht (bei 135° überlappten sich die Korpusse um rund 17 cm).
 */
export function cornerClearance(deg, depth = DEPTH_CM) {
  if (deg >= 179.5) return 0;
  if (deg <= 90) return Math.max(0, depth / Math.tan(rad(deg) / 2));
  return Math.max(0, depth * Math.sin(rad(deg)));
}

/**
 * Wie weit eine Zeile vor einer Wand mit spitzem Innenwinkel enden muss (cm), damit die
 * vordere Schrankecke nicht durch diese Wand ragt: depth / tan(deg). Ab 90° → 0.
 */
export function wallClearance(deg, depth = DEPTH_CM) {
  if (!(deg < 90)) return 0;
  return Math.max(0, depth / Math.tan(rad(deg)));
}

/** Eckmodul der Ecke (erstes bzw. letztes Modul der Besitzer-Zeile) oder null. */
export function cornerModule(plan, c) {
  const run = plan.runs?.[c.owner] || [];
  if (!run.length) return null;
  return c.ownerAt === "start" ? run[0] : run[run.length - 1];
}

/** Zusätzlicher Abstand durch einen Karussell-Eckschrank (L 90/90): Breite − Tiefe. */
function karussellExtra(plan, c) {
  const m = cornerModule(plan, c);
  if (m && m.t === "eckschrank" && opt(m, "m") === "k") return Math.max(0, m.w - DEPTH_CM);
  return 0;
}

/**
 * Nutzbarer Bereich einer Zeile in cm, gemessen ab Wandanfang: { start, length }.
 * Alte Grundformen: Wand a gehört die Ecke, b und c beginnen 60 cm vor der Rückwand.
 */
export function runExtent(plan, wall) {
  if (wall === "i") return { start: 0, length: plan.island.len };
  const shape = SHAPES[plan.shape] || SHAPES.l;
  if (!shape.free) {
    if (wall === "a") return { start: 0, length: plan.walls.a };
    if (plan.shape === "zweizeilig") return { start: 0, length: plan.walls[wall] };
    const c = corners(plan).find((k) => k.other === wall);
    const extra = c ? karussellExtra(plan, c) : 0;
    return { start: DEPTH_CM + extra, length: Math.max(0, plan.walls[wall] - DEPTH_CM - extra) };
  }
  const w = wallById(plan, wall);
  if (!w) return { start: 0, length: 0 };
  const total = w.len * 100;
  const walls = roomWalls(plan);
  const idx = walls.findIndex((x) => x.id === wall);
  // Spitzer Winkel: Schränke dürfen nicht durch die Nachbarwand ragen – auch wenn dort keine Zeile steht
  let start = wallClearance(freeAngleAtStart(plan, idx, walls.length));
  const endCut = wallClearance(freeAngleAtStart(plan, (idx + 1) % walls.length, walls.length));
  for (const c of corners(plan)) {
    if (c.other === wall) start = Math.max(start, cornerClearance(c.angle) + karussellExtra(plan, c));
  }
  start = Math.round(start * 10) / 10;
  return { start, length: Math.max(0, Math.round((total - start - endCut) * 10) / 10) };
}

/** Deckenhöhe (m) an einem Punkt (x, z in m) – mit Dachschräge. */
export function ceilingAt(plan, x, z) {
  const H = plan.h / 100;
  const s = plan.room?.slope;
  if (!s || !s.w) return H;
  const w = wallById(plan, s.w);
  if (!w) return H;
  const dist = (x - w.p0[0]) * w.n[0] + (z - w.p0[1]) * w.n[1];
  return Math.min(H, s.k / 100 + Math.max(0, dist) * Math.tan(rad(s.d)));
}

/** Schwerpunkt und Ausdehnung des Raums (m). */
export function roomBounds(plan) {
  const walls = roomWalls(plan).filter((w) => w.rendered || SHAPES[plan.shape]?.free || w.id === "d");
  const xs = walls.flatMap((w) => [w.p0[0], w.p1[0]]);
  const zs = walls.flatMap((w) => [w.p0[1], w.p1[1]]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  return { minX, maxX, minZ, maxZ, w: maxX - minX, d: maxZ - minZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
}

/** Punkt im Polygon (für Insel im freien Raum). */
export function pointInRoom(plan, x, z) {
  const walls = roomWalls(plan);
  let inside = false;
  for (const w of walls) {
    const [x1, z1] = w.p0;
    const [x2, z2] = w.p1;
    if (z1 > z !== z2 > z && x < ((x2 - x1) * (z - z1)) / (z2 - z1 || 1e-9) + x1) inside = !inside;
  }
  return inside;
}
