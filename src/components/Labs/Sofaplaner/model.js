// Sofaplaner (Minotti-Modelle) – plan model shared by browser and server.
// No React. Geometry, docking and joining rules live in src/lib/sofaplaner/geometry.js,
// the catalogue normalisation in src/lib/sofaplaner/normalize.js.
// All dimensions in cm. Element sizes come from the manufacturer data of the
// chosen family – nothing here invents a measure.
import * as z from "./zod-mini.js"; // zod/mini: nur genutzte Prüfungen im Browser-Bundle (Tempo, 30.10.2026)
import { analyzeJoins, bounds, facing, fmtCm, footprint, rectsOverlap } from "../../../lib/sofaplaner/geometry.js";
import { placeTemplate } from "../../../lib/sofaplaner/templates.js";
import { MEASURE_LABEL } from "../../../lib/sofaplaner/normalize.js";
import { SOURCE_COPY } from "../../../lib/sofaplaner/consent.js";
import { MATERIALS, materialsFor, tone } from "../../../lib/sofaplaner/materials.js";

export { bounds, facing, footprint, rectsOverlap, fmtCm };

export const PLAN_VERSION = 2;
export const WALKWAY_MIN = 80;
export const WALKWAY_IDEAL = 90;

// --- Price configuration -------------------------------------------------
// Richtwert – vom Inhaber festzulegen. There are NO released prices: the table
// is empty and `placeholder` stays true, so the UI shows "Im Gespräch" and never
// an amount (QM R2 P2-1). Once the owner releases guide prices per element code,
// they go into `elements` and `placeholder` becomes false.
export const PRICE_CONFIG = {
  placeholder: true,
  label: "Richtpreis auf Anfrage",
  currency: "EUR",
  elements: {},
};
export function pricesPublic(config = PRICE_CONFIG) {
  return Boolean(config) && config.placeholder === false;
}

// --- helpers -------------------------------------------------------------
export function snap(v, grid) {
  return Math.round(v / grid) * grid;
}

export function makeLookup(family) {
  const map = new Map((family?.elements || []).map((e) => [e.code, e]));
  return (code) => map.get(code) || null;
}

// Customer wording for the side of an element. The manufacturer codes SX/DX
// (sinistro/destro, seen from the front) stay in the order details only
// (owner requirement 2: no internal codes in the main view; QM R3 P3-H).
export function sideLabel(el) {
  if (!el?.side) return null;
  const lr = el.side === "SX" ? "links" : "rechts";
  if (el.role === "end") return `Abschluss ${lr}`;
  if (el.role === "corner") return `Ecke ${lr}`;
  return `Ausführung ${lr}`;
}

/** Manufacturer side code for the order details („SX“/„DX“), else null. */
export function sideCode(el) {
  return el?.side === "SX" || el?.side === "DX" ? el.side : null;
}

// A trailing "208 × 102 cm" in the manufacturer name is dropped where the
// measure is printed next to it anyway (QM R3 P3-H: no double measure).
const TRAILING_DIMS = /\s*[-–,]?\s*\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?\s*(?:cm)?\s*$/i;
export function plainLabel(el) {
  if (!el) return "";
  let t = String(el.label || "").replace(TRAILING_DIMS, "").trim();
  // "Eckelement 198 cm" where 198 is the width printed next to it
  const one = /\s*[-–,]?\s*(\d+(?:[.,]\d+)?)\s*cm\s*$/i.exec(t);
  if (one && el.w != null && Math.abs(Number(one[1].replace(",", ".")) - el.w) < 0.6) t = t.slice(0, one.index).trim();
  return t || el.label || el.code;
}

export function shortName(el) {
  if (!el) return "Element";
  const s = sideLabel(el);
  const name = plainLabel(el);
  return s && el.role === "end" ? `${name} (${el.side === "SX" ? "links" : "rechts"})` : name;
}

export function clampToRoom(item, room) {
  const r = footprint(item);
  const x = Math.min(Math.max(item.x, r.w / 2), Math.max(r.w / 2, room.w - r.w / 2));
  const y = Math.min(Math.max(item.y, r.h / 2), Math.max(r.h / 2, room.d - r.h / 2));
  return { ...item, x, y };
}

// Fit ALL items into a changed room as ONE block – the composition is never
// pulled apart (QM Sofaplaner R1 P1-4). If the sofa still fits on an axis it
// moves as a whole; if it is larger than the room on that axis it is aligned
// to the wall (start = 0) and checkPlan reports "Sofa … ist breiter als der Raum".
export function fitItemsToRoom(items, room) {
  if (!items.length) return items;
  const b = bounds(items);
  const shift = (start, size, limit) => {
    if (size > limit + 0.5) return -start;
    if (start < 0) return -start;
    if (start + size > limit) return limit - (start + size);
    return 0;
  };
  const dx = shift(b.x, b.w, room.w);
  const dy = shift(b.y, b.h, room.d);
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return items;
  return items.map((it) => ({ ...it, x: Math.round((it.x + dx) * 10) / 10, y: Math.round((it.y + dy) * 10) / 10 }));
}

/** Sofa larger than the room? Overshoot per axis in cm (0 = fits). */
export function oversize(items, room) {
  const b = bounds(items);
  if (!b) return { w: 0, d: 0, bounds: null };
  return { w: Math.max(0, Math.round(b.w - room.w)), d: Math.max(0, Math.round(b.h - room.d)), bounds: b };
}

export function overlappingPairs(items) {
  const out = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (rectsOverlap(footprint(items[i]), footprint(items[j]))) out.push([i, j]);
  return out;
}

// Push overlapping items apart (smallest move), staying inside the room.
export function separateItems(items, room, maxRounds = 20) {
  let cur = items;
  for (let round = 0; round < maxRounds; round++) {
    const pairs = overlappingPairs(cur);
    if (!pairs.length) return cur;
    const next = [...cur];
    let moved = false;
    for (const [i, j] of pairs) {
      const a = footprint(next[i]);
      const b = footprint(next[j]);
      if (!rectsOverlap(a, b)) continue;
      const tries = [
        [j, b.x + b.w / 2 >= a.x + a.w / 2 ? a.x + a.w - b.x : a.x - (b.x + b.w), 0],
        [j, 0, b.y + b.h / 2 >= a.y + a.h / 2 ? a.y + a.h - b.y : a.y - (b.y + b.h)],
        [i, a.x + a.w / 2 > b.x + b.w / 2 ? b.x + b.w - a.x : b.x - (a.x + a.w), 0],
        [i, 0, a.y + a.h / 2 > b.y + b.h / 2 ? b.y + b.h - a.y : b.y - (a.y + a.h)],
      ].sort((p, q) => Math.abs(p[1]) + Math.abs(p[2]) - (Math.abs(q[1]) + Math.abs(q[2])));
      for (const [k, dx, dy] of tries) {
        const cand = clampToRoom({ ...next[k], x: next[k].x + dx, y: next[k].y + dy }, room);
        if (!rectsOverlap(footprint(cand), footprint(next[k === i ? j : i]))) {
          next[k] = cand;
          moved = true;
          break;
        }
      }
    }
    if (!moved) return cur;
    cur = next;
  }
  return cur;
}

export function wallLength(wall, room) {
  return wall === "top" || wall === "bottom" ? room.w : room.d;
}
export function fitOpenings(openings, room) {
  const out = [];
  let changed = 0;
  for (const o of openings) {
    const len = wallLength(o.wall, room);
    const width = Math.min(o.width, len);
    if (width < 40) continue;
    const offset = Math.max(0, Math.min(o.offset, len - width));
    if (width !== o.width || offset !== o.offset) changed += 1;
    out.push(width === o.width && offset === o.offset ? o : { ...o, width, offset });
  }
  return { openings: out, changed, removed: openings.length - out.length };
}

export function openingZone(o, room) {
  const depth = o.type === "door" ? o.width : 30;
  switch (o.wall) {
    case "top":
      return { x: o.offset, y: 0, w: o.width, h: depth };
    case "bottom":
      return { x: o.offset, y: room.d - depth, w: o.width, h: depth };
    case "left":
      return { x: 0, y: o.offset, w: depth, h: o.width };
    default:
      return { x: room.w - depth, y: o.offset, w: depth, h: o.width };
  }
}

function overlap1d(a0, a1, b0, b1) {
  return Math.min(a1, b1) - Math.max(a0, b0);
}
function axisGap(a, b) {
  const ox = overlap1d(a.x, a.x + a.w, b.x, b.x + b.w);
  const oy = overlap1d(a.y, a.y + a.h, b.y, b.y + b.h);
  if (oy > 5) {
    if (b.x >= a.x + a.w) return { axis: "x", gap: b.x - (a.x + a.w) };
    if (a.x >= b.x + b.w) return { axis: "x", gap: a.x - (b.x + b.w) };
  }
  if (ox > 5) {
    if (b.y >= a.y + a.h) return { axis: "y", gap: b.y - (a.y + a.h) };
    if (a.y >= b.y + b.h) return { axis: "y", gap: a.y - (b.y + b.h) };
  }
  return null;
}

export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export const isLightColor = (hex) => luminance(hex) > 0.24;

// --- Checks --------------------------------------------------------------
// level: "error" (does not fit / not combinable), "warn", "info".
const noLookup = () => null;
export function checkPlan(plan, lookup = noLookup) {
  const { room, items, openings } = plan;
  const out = [];
  const rects = items.map((it) => ({ it, el: lookup(it.code), r: footprint(it) }));
  const name = (x) => shortName(x.el);

  const big = items.length ? oversize(items, room) : { w: 0, d: 0 };
  const allIds = items.map((i) => i.id);
  if (big.w > 0) out.push({ level: "error", kind: "roomsize", ids: allIds, text: `Sofa (${Math.round(big.bounds.w)} cm) ist breiter als der Raum (${room.w} cm).` });
  if (big.d > 0) out.push({ level: "error", kind: "roomsize", ids: allIds, text: `Sofa (${Math.round(big.bounds.h)} cm) ist tiefer als der Raum (${room.d} cm).` });
  for (const x of rects) {
    const { r } = x;
    if (big.w > 0 || big.d > 0) break; // one clear message instead of one per element
    if (r.x < -0.5 || r.y < -0.5 || r.x + r.w > room.w + 0.5 || r.y + r.h > room.d + 0.5) {
      out.push({ level: "error", kind: "room", ids: [x.it.id], text: `${name(x)} ragt über die Wand hinaus.` });
    }
  }

  const joined = new Set();
  if (items.length && lookup !== noLookup) {
    const { joins, clashes, free } = analyzeJoins(items, lookup);
    for (const j of joins) {
      joined.add(`${j.a}|${j.b}`);
      joined.add(`${j.b}|${j.a}`);
      if (j.issue) out.push({ level: j.issue.level, kind: "join", ids: [j.a, j.b], text: j.issue.text });
    }
    for (const c of clashes) out.push({ level: "error", kind: "join", ids: [c.open, c.closed], text: c.text });
    const freeBy = new Map();
    for (const f of free) freeBy.set(f.id, (freeBy.get(f.id) || 0) + 1);
    for (const [id, n] of freeBy) {
      const x = rects.find((q) => q.it.id === id);
      out.push({
        level: "warn",
        kind: "open",
        ids: [id],
        text: `${name(x)}: ${n > 1 ? `${n} Anschlussseiten sind` : "eine Anschlussseite ist"} noch offen – mit End-, Eck- oder Mittelelement abschließen.`,
      });
    }
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i],
        b = rects[j];
      if (rectsOverlap(a.r, b.r)) {
        out.push({ level: "error", kind: "overlap", ids: [a.it.id, b.it.id], text: `${name(a)} und ${name(b)} überlappen sich.` });
        continue;
      }
      if (joined.has(`${a.it.id}|${b.it.id}`)) continue;
      const g = axisGap(a.r, b.r);
      if (!g || g.gap <= 1) continue;
      const loose = a.el?.role === "loose" || b.el?.role === "loose";
      if (loose) {
        if (g.gap > 50 && g.gap < WALKWAY_MIN)
          out.push({ level: "info", kind: "gap", ids: [a.it.id, b.it.id], text: `Hocker oder Tisch steht ${Math.round(g.gap)} cm entfernt – als Fußablage sind 0–45 cm üblich, als Durchgang ab ${WALKWAY_MIN} cm.` });
      } else if (g.gap < WALKWAY_MIN) {
        out.push({
          level: "warn",
          kind: "gap",
          ids: [a.it.id, b.it.id],
          text: `Spalt von ${Math.round(g.gap)} cm zwischen ${name(a)} und ${name(b)}: entweder bündig anstellen oder mind. ${WALKWAY_MIN}–${WALKWAY_IDEAL} cm Laufweg lassen.`,
        });
      }
    }
  }

  for (const x of rects) {
    const role = x.el?.role;
    if (role === "loose" || role === "acc" || x.el?.b2b) continue;
    const { r } = x;
    const [fx, fy] = facing(x.it.rot);
    let free;
    if (fy === 1) free = room.d - (r.y + r.h);
    else if (fy === -1) free = r.y;
    else if (fx === 1) free = room.w - (r.x + r.w);
    else free = r.x;
    for (const o of rects) {
      if (o.it.id === x.it.id || o.el?.role === "loose") continue;
      const g = axisGap(r, o.r);
      if (!g) continue;
      const ahead =
        (fy === 1 && g.axis === "y" && o.r.y >= r.y + r.h - 0.5) ||
        (fy === -1 && g.axis === "y" && o.r.y + o.r.h <= r.y + 0.5) ||
        (fx === 1 && g.axis === "x" && o.r.x >= r.x + r.w - 0.5) ||
        (fx === -1 && g.axis === "x" && o.r.x + o.r.w <= r.x + 0.5);
      if (ahead && g.gap > 1) free = Math.min(free, g.gap);
    }
    if (free < WALKWAY_MIN && free >= -0.5) {
      out.push({ level: "warn", kind: "front", ids: [x.it.id], text: `Vor ${name(x)} bleiben nur ${Math.round(free)} cm – für Beine und Laufweg mind. ${WALKWAY_MIN}–${WALKWAY_IDEAL} cm einplanen.` });
    }
  }

  for (const o of openings) {
    const zr = openingZone(o, room);
    for (const x of rects) {
      if (!rectsOverlap(zr, x.r)) continue;
      if (o.type === "door") {
        out.push({ level: "error", kind: "door", ids: [x.it.id], text: `${name(x)} steht im Schwenkbereich der Tür (${o.width} cm).` });
      } else if (x.el?.h == null) {
        out.push({ level: "info", kind: "window", ids: [x.it.id], text: `${name(x)} steht vor dem Fenster – Höhe vom Hersteller nicht bemaßt, Brüstung ${o.sill} cm bitte im Showroom abgleichen.` });
      } else if (x.el.h > o.sill) {
        out.push({ level: "info", kind: "window", ids: [x.it.id], text: `${name(x)} steht vor dem Fenster: Höhe ${fmtCm(x.el.h)} cm (Herstellerangabe), Brüstung ${o.sill} cm – die Lehne ragt ins Fenster.` });
      }
    }
  }

  const missing = rects.filter((x) => x.el && x.el.missing.length);
  if (missing.length) {
    out.push({
      level: "info",
      kind: "missing",
      ids: missing.map((x) => x.it.id),
      text: `${missing.length} ${missing.length === 1 ? "Element hat" : "Elemente haben"} fehlende Herstellermaße (z. B. ${missing[0].el.missing.map((k) => MEASURE_LABEL[k]).join(", ")}) – Maß im Showroom bestätigen.`,
    });
  }
  return mergeChecks(out);
}

// QM Restliste P2-2: the same finding at several joins (e.g. both legs of a
// corner) is shown once, with "(an n Stellen)" and all affected elements.
export function mergeChecks(list) {
  const by = new Map();
  const out = [];
  for (const c of list) {
    const k = `${c.level}|${c.kind}|${c.text}`;
    const prev = by.get(k);
    if (!prev) {
      const copy = { ...c, ids: [...c.ids], count: 1 };
      by.set(k, copy);
      out.push(copy);
      continue;
    }
    prev.count += 1;
    for (const id of c.ids) if (!prev.ids.includes(id)) prev.ids.push(id);
  }
  return out.map(({ count, ...c }) => (count > 1 ? { ...c, text: `${c.text} (an ${count} Stellen)` } : c));
}

export function summarize(plan, lookup = noLookup) {
  const b = bounds(plan.items);
  let maxH = null,
    hMissing = false;
  const sh = new Set();
  for (const it of plan.items) {
    const el = lookup(it.code);
    if (el?.h != null) maxH = Math.max(maxH ?? 0, el.h);
    else hMissing = true;
    if (el?.sh != null) sh.add(el.sh);
  }
  return { bounds: b, count: plan.items.length, maxH, hMissing, seatHeights: [...sh].sort((a, c) => a - c) };
}

// --- Bill of materials ---------------------------------------------------
export function bom(plan, lookup = noLookup, family = null) {
  const rows = new Map();
  for (const it of plan.items) {
    const el = lookup(it.code);
    const key = it.code;
    if (!rows.has(key)) rows.set(key, { code: it.code, el, qty: 0 });
    rows.get(key).qty += 1;
  }
  const extras = [];
  const cushions = family?.options?.cushions || [];
  for (const c of plan.look?.cushions || []) {
    if (!c.q) continue;
    const opt = cushions.find((o) => o.id === c.id);
    const el = lookup(c.id);
    if (opt) extras.push({ code: null, label: opt.label, detail: opt.detail, qty: c.q });
    else if (el) extras.push({ code: el.code, label: plainLabel(el), detail: dims(el), qty: c.q, el });
  }
  return { rows: [...rows.values()], extras };
}

export function dims(el) {
  if (!el) return "";
  const p = [`${fmtCm(el.w)} × ${fmtCm(el.d)} cm`];
  if (el.h != null) p.push(`H ${fmtCm(el.h)} cm`);
  return p.join(", ");
}

export function lookText(plan, family) {
  const o = family?.options || {};
  const look = plan.look || {};
  const pick = (list, id) => list?.find((x) => x.id === id)?.label;
  const lines = [];
  const t = tone(look.material, look.tone);
  lines.push(`Bezug (neutrale Materialfamilie): ${t.material.label}, Farbton ${t.label}`);
  if (look.coverType) lines.push(`Bezugsart: ${look.coverType}`);
  if (look.variant) lines.push(`Ausführung: ${look.variant}`);
  const backs = (look.back || []).map((id) => pick(o.back, id)).filter(Boolean);
  if (backs.length) lines.push(`Rücken: ${backs.join("; ")}`);
  const arm = pick(o.arm, look.arm);
  if (arm) lines.push(`Armlehne: ${arm}`);
  const base = pick(o.base, look.base);
  if (base) lines.push(`Sockel/Füße: ${base}`);
  return lines;
}

// --- Plan defaults -------------------------------------------------------
let uid = 0;
export function newId(prefix = "m") {
  uid += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${uid.toString(36)}`;
}

export function defaultLook(family) {
  const mats = materialsFor(family);
  const material = mats[0];
  return {
    material,
    tone: MATERIALS[material].tones[1]?.[0] || MATERIALS[material].tones[0][0],
    back: [],
    arm: family?.options?.arm?.length === 1 ? family.options.arm[0].id : "",
    base: family?.options?.base?.length === 1 ? family.options.base[0].id : "",
    coverType: "",
    variant: "",
    cushions: [],
  };
}

/**
 * Team katalog-modell-code (31.10.2026): the look of a loaded plan (share
 * link, draft, Merkliste) may only name options of ITS model. Before, any
 * string (up to 300 characters) in coverType/variant went straight into the
 * enquiry text ("Bezugsart: …") of whoever opened the link; unknown option
 * ids and cushions are dropped as well. Material and tone stay (tone() and
 * the look panel fall back on their own).
 */
export function cleanLook(look, family) {
  if (!look || !family) return look;
  const o = family.options || {};
  const ids = (list) => new Set((list || []).map((x) => x.id));
  const back = ids(o.back);
  const arm = ids(o.arm);
  const base = ids(o.base);
  const cushions = new Set([...ids(o.cushions), ...(family.elements || []).map((e) => e.code)]);
  const types = new Set(o.cover?.types || []);
  const variants = new Set(o.cover?.variants || []);
  return {
    ...look,
    back: (look.back || []).filter((id) => back.has(id)),
    arm: arm.has(look.arm) ? look.arm : "",
    base: base.has(look.base) ? look.base : "",
    coverType: types.has(look.coverType) ? look.coverType : "",
    variant: variants.has(look.variant) ? look.variant : "",
    cushions: (look.cushions || []).filter((c) => cushions.has(c.id)),
  };
}

export const DEFAULT_ROOM = { w: 560, d: 440 };
export const DEFAULT_OPENINGS = [
  { id: "o1", type: "window", wall: "bottom", offset: 160, width: 220, sill: 50 },
  { id: "o2", type: "door", wall: "right", offset: 320, width: 90, sill: 0 },
];

// --- Start shapes in the room (QM Sofaplaner R1 P1-3) ----------------------
// A start shape must never begin with a red conflict. fitTemplate first tries
// the usual spot (back wall, left/right/centre), then other spots along the
// back wall (nearest first), then the composition turned to the other walls.
// Turning keeps every join intact (rigid rotation of the whole group).
function rotateGroup(items, a) {
  if (!a) return items;
  return items.map((i) => {
    const [x, y] = rotVecLocal([i.x, i.y], a);
    return { ...i, x, y, rot: (i.rot + a) % 360 };
  });
}
function rotVecLocal([x, y], a) {
  if (a === 90) return [-y, x];
  if (a === 180) return [-x, -y];
  if (a === 270) return [y, -x];
  return [x, y];
}
function toOrigin(items) {
  const b = bounds(items);
  return { items: items.map((i) => ({ ...i, x: i.x - b.x, y: i.y - b.y })), w: b.w, h: b.h };
}
const errorsIn = (room, openings, items, lookup) => checkPlan({ room, openings, items }, lookup).filter((c) => c.level === "error");

/** → { items, fits } – fits=false: no spot without a conflict in this room. */
export function fitTemplate(t, room, openings = [], lookup = noLookup, makeId = () => newId()) {
  const preferred = placeTemplate(t, room, makeId);
  const kinds = new Set();
  const ok = (items) => {
    const errs = errorsIn(room, openings, items, lookup);
    for (const e of errs) kinds.add(e.kind);
    return !errs.length;
  };
  if (ok(preferred)) return { items: preferred, fits: true };
  const ids = preferred.map((i) => i.id);
  const pb = bounds(preferred);
  const r1 = (v) => Math.round(v * 10) / 10;
  // back wall for each turn: 0 → top, 90 → right, 180 → bottom, 270 → left
  for (const a of [0, 90, 270, 180]) {
    const g = toOrigin(rotateGroup(t.items, a));
    const along = a === 0 || a === 180 ? room.w - g.w : room.d - g.h;
    if (along < -0.5 || (a === 0 || a === 180 ? room.d < g.h : room.w < g.w)) {
      kinds.add("roomsize");
      continue;
    }
    const want = a === 0 ? pb.x : along / 2;
    const offsets = [];
    for (let o = 0; o <= along + 0.01; o += 10) offsets.push(o);
    if (along > 0) offsets.push(along);
    offsets.sort((p, q) => Math.abs(p - want) - Math.abs(q - want));
    for (const o of offsets) {
      const ox = a === 0 || a === 180 ? o : a === 90 ? room.w - g.w : 0;
      const oy = a === 0 || a === 180 ? (a === 0 ? (t.key === "insel" ? Math.max(0, (room.d - g.h) / 2) : 0) : room.d - g.h) : o;
      const items = g.items.map((i, k) => ({ ...i, id: ids[k], x: r1(i.x + ox), y: r1(i.y + oy) }));
      if (ok(items)) return { items, fits: true };
    }
  }
  return { items: preferred, fits: false, kinds: [...kinds] };
}

// QM Restliste P3-1: why a start shape does not fit, in plain words for the
// "Form passt nicht" choice (the shape alone can be smaller than the room).
export function nofitReason(t, room, openings = [], lookup = noLookup) {
  const r = fitTemplate(t, room, openings, lookup, () => "x");
  if (r.fits) return "";
  const kinds = new Set(r.kinds || []);
  const door = openings.find((o) => o.type === "door");
  const tooBig = Math.min(t.w, t.d) > Math.min(room.w, room.d) || Math.max(t.w, t.d) > Math.max(room.w, room.d);
  if (tooBig) return `Die Form ist ${t.w} × ${t.d} cm groß und damit größer als Ihr Raum.`;
  const parts = [];
  if (kinds.has("door") && door) parts.push(`vor der Tür ein Schwenkbereich von ${door.width} × ${door.width} cm frei bleiben muss – an jeder passenden Wand stünde ein Element darin`);
  if (kinds.has("overlap") || kinds.has("join")) parts.push("sie mit anderen Möbeln im Plan kollidiert");
  if (!parts.length) parts.push("an keiner Wand ein Platz ohne Konflikt frei ist");
  return `Die Form selbst misst ${t.w} × ${t.d} cm, passt aber nicht, weil ${parts.join(" und ")}.`;
}

// QM R3 P3-A: smallest room (10-cm steps, at most 2000 cm) in which a start
// shape fits without a conflict – offered as "Raum anpassen" instead of
// placing a shape that does not fit. null if no such room exists.
export function roomForTemplate(t, room, openings = [], lookup = noLookup, max = 2000) {
  const up = (v) => Math.ceil(v / 10) * 10;
  const w0 = Math.min(max, Math.max(room.w, up(t.w)));
  const d0 = Math.min(max, Math.max(room.d, up(t.d)));
  for (let k = 0; k <= 120; k++) {
    const g = k * 10;
    for (const cand of [
      { w: w0 + g, d: d0 },
      { w: w0, d: d0 + g },
      { w: w0 + g, d: d0 + g },
    ]) {
      if (cand.w > max || cand.d > max) continue;
      const r = { ...room, ...cand };
      const ops = fitOpenings(openings, r).openings;
      if (fitTemplate(t, r, ops, lookup, () => "x").fits) return cand;
    }
  }
  return null;
}

// QM R3 P3-B: elements that are joined (directly or through others) to the
// given one – rotating a docked element turns this whole group, so the
// composition is never torn apart.
export function joinedGroup(items, lookup, id) {
  const { joins } = analyzeJoins(items, lookup);
  const seen = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift();
    for (const j of joins) {
      const other = j.a === cur ? j.b : j.b === cur ? j.a : null;
      if (other && !seen.has(other)) {
        seen.add(other);
        queue.push(other);
      }
    }
  }
  return seen;
}

/** Rotate a set of items by 90° clockwise around their common centre and keep the block in the room. */
export function rotateItems(items, ids, room) {
  const group = items.filter((i) => ids.has(i.id));
  if (!group.length) return items;
  const b = bounds(group);
  const cx = b.x + b.w / 2,
    cy = b.y + b.h / 2;
  const r1 = (v) => Math.round(v * 10) / 10;
  const turned = group.map((i) => {
    const [dx, dy] = rotVecLocal([i.x - cx, i.y - cy], 90);
    return { ...i, x: r1(cx + dx), y: r1(cy + dy), rot: (i.rot + 90) % 360 };
  });
  const placed = new Map(fitItemsToRoom(turned, room).map((i) => [i.id, i]));
  return items.map((i) => placed.get(i.id) || i);
}

/**
 * After turning a group: if it now has a hard conflict (wall, door swing,
 * overlap), move the whole block to the nearest spot (10-cm grid) where it
 * has none. Returns { items, moved, ok }.
 */
export function settleGroup(plan, ids, lookup = noLookup) {
  const hard = (items) => checkPlan({ ...plan, items }, lookup).some((c) => c.level === "error" && c.ids.some((id) => ids.has(id)));
  if (!hard(plan.items)) return { items: plan.items, moved: false, ok: true };
  const group = plan.items.filter((i) => ids.has(i.id));
  const b = bounds(group);
  const { room } = plan;
  if (b.w > room.w || b.h > room.d) return { items: plan.items, moved: false, ok: false };
  const cands = [];
  for (let x = 0; x <= room.w - b.w + 0.01; x += 10) for (let y = 0; y <= room.d - b.h + 0.01; y += 10) cands.push([x, y]);
  cands.push([room.w - b.w, 0], [0, room.d - b.h], [room.w - b.w, room.d - b.h]);
  cands.sort((p, q) => Math.hypot(p[0] - b.x, p[1] - b.y) - Math.hypot(q[0] - b.x, q[1] - b.y));
  const r1 = (v) => Math.round(v * 10) / 10;
  for (const [x, y] of cands.slice(0, 4000)) {
    const dx = x - b.x,
      dy = y - b.y;
    const items = plan.items.map((i) => (ids.has(i.id) ? { ...i, x: r1(i.x + dx), y: r1(i.y + dy) } : i));
    if (!hard(items)) return { items, moved: true, ok: true };
  }
  return { items: plan.items, moved: false, ok: false };
}

/** Plan for a family, optionally starting from one of its templates. Deterministic ids (SSR). */
export function planFor(family, templateKey = null, room = DEFAULT_ROOM, openings = DEFAULT_OPENINGS) {
  const templates = family?.templates || [];
  const lookup = makeLookup(family);
  let i = 0;
  const makeId = () => `d${++i}`;
  const order = templateKey
    ? templates.filter((x) => x.key === templateKey)
    : [templates.find((x) => x.key === "ecke-links"), ...templates].filter(Boolean);
  let items = [];
  for (const t of order) {
    i = 0;
    const r = fitTemplate(t, room, openings, lookup, makeId);
    if (!items.length) items = r.items;
    if (r.fits) {
      items = r.items;
      break;
    }
  }
  return {
    v: PLAN_VERSION,
    name: "Mein Sofa",
    family: family?.slug || "",
    room: { ...room },
    grid: 10,
    openings: openings.map((o) => ({ ...o })),
    items,
    look: defaultLook(family),
  };
}

// --- Validation (share route, loading drafts / shared plans) -------------
// zod/mini (zod-mini.js): dieselben Regeln wie vorher mit der klassischen API
// (.min/.max = gte/lte bzw. Länge, .default = _default, .transform = pipe).
const num = (lo, hi) => z.number().check(z.gte(lo), z.lte(hi));
const str = (max) => z.string().check(z.maxLength(max));
const list = (el, max) => z.array(el).check(z.maxLength(max));
const rot = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]);
export const planSchema = z.pipe(
  z.object({
    v: z.literal(PLAN_VERSION),
    name: z._default(z.string().check(z.trim(), z.maxLength(60)), "Mein Sofa"),
    family: z.string().check(z.regex(/^[a-z0-9-]{2,64}$/)),
    room: z.object({ w: num(150, 2000), d: num(150, 2000) }),
    grid: z._default(z.union([z.literal(5), z.literal(10), z.literal(20)]), 10),
    openings: list(
      z.object({
        id: str(24),
        type: z.enum(["window", "door"]),
        wall: z.enum(["top", "right", "bottom", "left"]),
        offset: num(0, 2000),
        width: num(40, 600),
        sill: z._default(num(0, 200), 0),
      }),
      12
    ),
    items: list(
      z.object({
        id: str(24),
        code: z.string().check(z.minLength(1), z.maxLength(140)),
        x: num(-200, 2200),
        y: num(-200, 2200),
        rot,
        w: num(5, 1200),
        d: num(5, 1200),
      }),
      40
    ),
    look: z.object({
      material: z.enum(Object.keys(MATERIALS)),
      tone: str(24),
      back: z._default(list(str(80), 20), []),
      arm: z._default(str(80), ""),
      base: z._default(str(80), ""),
      coverType: z._default(str(200), ""),
      variant: z._default(str(300), ""),
      cushions: z._default(list(z.object({ id: str(140), q: z.int().check(z.gte(0), z.lte(20)) }), 30), []),
    }),
  }),
  z.transform((p) => ({
    ...p,
    name: cleanName(p.name),
    openings: fitOpenings(uniqueIds(p.openings), p.room).openings,
    items: fitItemsToRoom(uniqueIds(p.items), p.room),
  }))
);

// Team katalog-modell-code (31.10.2026): shared plans and drafts come from the
// browser. Line breaks and control characters in the name would add lines to
// the enquiry text (planToText: "Plan ansehen: …"), and duplicate ids break
// selection, joins and React keys – both are repaired instead of rejected, so
// no stored plan is lost.
function cleanName(name) {
  const t = String(name).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return t || "Mein Sofa";
}
function uniqueIds(list) {
  const seen = new Set(list.map((x) => x.id));
  if (seen.size === list.length) return list;
  const used = new Set();
  let n = 0;
  return list.map((x) => {
    if (!used.has(x.id)) {
      used.add(x.id);
      return x;
    }
    let id;
    do id = `${String(x.id).slice(0, 18)}~${(++n).toString(36)}`;
    while (seen.has(id) || used.has(id));
    used.add(id);
    return { ...x, id };
  });
}

/** Re-resolve a loaded plan against the catalogue: unknown codes are dropped, sizes come from the catalogue. */
export function resolvePlan(plan, family) {
  const lookup = makeLookup(family);
  plan = { ...plan, look: cleanLook(plan.look, family) };
  let dropped = 0;
  const items = [];
  for (const it of plan.items) {
    const el = lookup(it.code);
    if (!el || !el.w || !el.d) {
      dropped += 1;
      continue;
    }
    items.push({ ...it, w: el.w, d: el.d });
  }
  return { plan: { ...plan, items }, dropped };
}

/**
 * Shared plan (?p=…) → { family, plan, dropped }, or null when its model is no
 * longer in the catalogue (e.g. a link from the Minotti catalogue while the
 * neutral one is active). The page then says so instead of announcing
 * "Geteilter Plan geladen" over a start suggestion of another model.
 */
export function openShared(stored, familyFor) {
  const family = stored ? familyFor(stored.family) : null;
  if (!family) return null;
  return { family, ...resolvePlan(stored, family) };
}

// --- Text output (Anfrage) ------------------------------------------------
export function planToText(plan, family, shareUrl) {
  const lookup = makeLookup(family);
  const s = summarize(plan, lookup);
  const lines = [];
  lines.push(`Sofaplaner: ${plan.name || "Mein Sofa"}`);
  if (family) lines.push(`Modell: ${SOURCE_COPY.modelWord} ${family.name}${family.designer ? ` (Design ${family.designer})` : ""}`);
  lines.push(`Raum: ${plan.room.w} × ${plan.room.d} cm`);
  if (s.bounds) lines.push(`Gesamtmaß: ${Math.round(s.bounds.w)} × ${Math.round(s.bounds.h)} cm (B × T)${s.maxH ? `, Höhe bis ${fmtCm(s.maxH)} cm` : ""}`);
  lines.push("Elemente:");
  const { rows, extras } = bom(plan, lookup, family);
  for (const r of rows) {
    const el = r.el;
    const side = sideLabel(el);
    lines.push(`- ${r.qty} × ${el ? plainLabel(el) : r.code}${side ? `, ${side}` : ""} (${dims(el)})${el?.missing?.length ? " – Maß im Showroom bestätigen" : ""}`);
  }
  for (const x of extras) lines.push(`- ${x.qty} × ${x.label}${x.detail ? ` (${x.detail})` : ""}`);
  lines.push(...lookText(plan, family));
  const issues = checkPlan(plan, lookup).filter((c) => c.level === "error" || c.level === "warn");
  if (issues.length) lines.push(`Hinweise aus dem Planer: ${issues.length} (Anschlüsse/Laufwege bitte prüfen)`);
  if (shareUrl) lines.push(`Plan ansehen: ${shareUrl}`);
  lines.push("Ich möchte die Planung im Showroom in Lochau besprechen (Stoff- und Ledermuster, Probesitzen, Richtpreis).");
  return lines.join("\n");
}
