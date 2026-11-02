// Sofaplaner – geometry, docking and join validation (pure, client + server).
//
// Coordinates in cm. A placed item stores its CENTRE (x, y), its rotation
// (0/90/180/270, clockwise on screen) and its footprint w × d (from the
// manufacturer data). At rot 0 the backrest is at the top (y−) and the seat
// faces down (y+), so "left" in the drawing is the left side seen from the
// front – the side Minotti calls SX.

export const SIDES = ["top", "right", "bottom", "left"];
const N = { top: [0, -1], right: [1, 0], bottom: [0, 1], left: [-1, 0] };
const TOL = 1; // cm – two faces closer than this touch
const MIN_CONTACT = 5; // cm of shared edge before two faces count as joined
export const DEPTH_TOLERANCE = 5; // cm – smaller depth differences within a family count as a neutral hint (QM Restliste P2-2)

export function rotVec([x, y], rot) {
  switch (((rot % 360) + 360) % 360) {
    case 90:
      return [-y, x];
    case 180:
      return [-x, -y];
    case 270:
      return [y, -x];
    default:
      return [x, y];
  }
}

/** Direction the seat faces, in room coordinates. */
export function facing(rot) {
  return rotVec([0, 1], rot);
}

export function footprint(item) {
  const swap = item.rot === 90 || item.rot === 270;
  const w = swap ? item.d : item.w;
  const h = swap ? item.w : item.d;
  return { x: item.x - w / 2, y: item.y - h / 2, w, h };
}

/**
 * Which local sides carry a backrest, join other elements (open) or are closed
 * (armrest / termination). Derived from the element type – Minotti publishes no
 * joining matrix, so this is the planner's rule set (documented in the UI).
 */
export function topology(el) {
  if (!el || el.role === "loose" || el.role === "acc") return { backs: [], open: [], closed: [] };
  const backs = el.b2b ? ["mid"] : el.kind === "tisch" ? [] : ["top"];
  switch (el.role) {
    case "free":
      return { backs, open: [], closed: ["left", "right"] };
    case "mid":
      return { backs, open: ["left", "right"], closed: [] };
    case "end":
      return el.side === "DX" ? { backs, open: ["left"], closed: ["right"] } : { backs, open: ["right"], closed: ["left"] };
    case "corner":
      return el.side === "DX"
        ? { backs: ["top", "right"], open: ["left", "bottom"], closed: [] }
        : { backs: ["top", "left"], open: ["right", "bottom"], closed: [] };
    default:
      return { backs: [], open: [], closed: [] };
  }
}

function localSide(el, s) {
  const w = el.w / 2,
    d = el.d / 2;
  switch (s) {
    case "top":
      return [
        [-w, -d],
        [w, -d],
      ];
    case "right":
      return [
        [w, -d],
        [w, d],
      ];
    case "bottom":
      return [
        [-w, d],
        [w, d],
      ];
    default:
      return [
        [-w, -d],
        [-w, d],
      ];
  }
}

// The end of a joining face that lies at the backrest: two joined elements
// share this point, so their backs line up.
function localBackEnd(el, s, topo) {
  const [p0, p1] = localSide(el, s);
  if (s === "left" || s === "right") {
    if (topo.backs.includes("top")) return p0;
    return [p0[0], 0]; // back-to-back pieces: centre line
  }
  if (s === "bottom") {
    if (topo.backs.includes("left")) return p0;
    if (topo.backs.includes("right")) return p1;
  }
  return p0;
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

export function worldSide(item, el, s) {
  const [p0, p1] = localSide({ w: item.w, d: item.d }, s);
  const c = [item.x, item.y];
  return { side: s, n: rotVec(N[s], item.rot), p0: add(c, rotVec(p0, item.rot)), p1: add(c, rotVec(p1, item.rot)) };
}

/** Length two faces share, or 0 when they do not touch. */
export function contact(fa, fb) {
  if (Math.abs(fa.n[0] + fb.n[0]) > 0.01 || Math.abs(fa.n[1] + fb.n[1]) > 0.01) return 0;
  if (Math.abs(dot(fa.p0, fa.n) - dot(fb.p0, fa.n)) > TOL) return 0;
  const t = [-fa.n[1], fa.n[0]];
  const a = [dot(fa.p0, t), dot(fa.p1, t)].sort((x, y) => x - y);
  const b = [dot(fb.p0, t), dot(fb.p1, t)].sort((x, y) => x - y);
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

/** Position for `el` (at `rot`) whose face `s` joins `target`'s face `ts`, backs aligned. */
export function dockCandidate(target, tEl, ts, el, rot, s) {
  const tTopo = topology(tEl);
  const eTopo = topology(el);
  const n = rotVec(N[s], rot);
  const tn = rotVec(N[ts], target.rot);
  if (n[0] !== -tn[0] || n[1] !== -tn[1]) return null;
  const tBack = add([target.x, target.y], rotVec(localBackEnd(target, ts, tTopo), target.rot));
  const c = sub(tBack, rotVec(localBackEnd(el, s, eTopo), rot));
  const cand = { x: round(c[0]), y: round(c[1]), rot, w: el.w, d: el.d };
  if (contact(worldSide(target, tEl, ts), worldSide(cand, el, s)) < MIN_CONTACT) return null;
  return cand;
}

const round = (v) => Math.round(v * 10) / 10;

export function rectsOverlap(a, b, eps = 0.5) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > eps && oy > eps;
}

const displayName = (el) => (el ? el.label : "Element");
const lineName = (l) => `Linie „${l}“`;

/**
 * Can these two elements be joined? null = yes. Otherwise {level, text}.
 * level "error" blocks the join in the planner.
 */
export function joinIssue(a, b) {
  if (!a || !b) return null;
  if (a.line && b.line && a.line !== b.line) {
    return {
      level: "error",
      code: "line",
      text: `${displayName(a)} (${lineName(a.line)}) und ${displayName(b)} (${lineName(b.line)}) gehören zu verschiedenen Linien und lassen sich nicht verbinden.`,
    };
  }
  if (a.module && b.module && a.module !== b.module) {
    return {
      level: "error",
      code: "module",
      text: `Unterschiedliche Sitzmodul-Breiten (${a.module} cm und ${b.module} cm) – Elemente eines Sofas haben immer dasselbe Sitzmodul.`,
    };
  }
  const straight = (e) => (e.role === "end" || e.role === "mid" || e.role === "corner") && !["chaise", "peninsula", "daybed"].includes(e.kind);
  if (straight(a) && straight(b) && a.d && b.d && Math.abs(a.d - b.d) > 1) {
    const diff = Math.abs(a.d - b.d);
    // QM Restliste P2-2: an L-shaped corner element is drawn as a rectangle –
    // its overall depth (e.g. 168 × 168) is not the depth of its arms, so a
    // larger corner is no depth conflict, only a simplification to confirm.
    const [big, small] = a.d > b.d ? [a, b] : [b, a];
    if (big.role === "corner" && small.role !== "corner" && diff > DEPTH_TOLERANCE && big.w >= small.d) {
      return {
        level: "info",
        code: "corner",
        text: `${displayName(big)} ist im Grundriss als Rechteck vereinfacht (${fmtCm(big.w)} × ${fmtCm(big.d)} cm, Schenkeltiefe nicht veröffentlicht) – Anschluss an ${fmtCm(small.d)} cm tiefe Elemente im Showroom bestätigen.`,
      };
    }
    // Small differences within a family (the element with armrest is a few cm
    // deeper) are typical – a neutral hint, not a "Prüfen".
    if (diff <= DEPTH_TOLERANCE) {
      return {
        level: "info",
        code: "depth",
        text: `Tiefen ${fmtCm(a.d)} und ${fmtCm(b.d)} cm: Vorderkanten weichen um ${fmtCm(diff)} cm ab – bei dieser Linie üblich.`,
      };
    }
    return {
      level: "warn",
      code: "depth",
      text: `Unterschiedliche Tiefen (${fmtCm(a.d)} und ${fmtCm(b.d)} cm): Vorderkanten laufen nicht bündig – Kombination im Showroom bestätigen.`,
    };
  }
  if (a.shape !== "rect" || b.shape !== "rect") {
    return {
      level: "info",
      code: "shape",
      text: "Gebogene oder geneigte Elemente sind im Grundriss als Rechteck vereinfacht (Winkel/Radius nicht vollständig veröffentlicht) – Anschluss im Showroom bestätigen.",
    };
  }
  return null;
}

export const fmtCm = (v) => (v == null ? "–" : String(Math.round(v * 10) / 10).replace(".", ","));

// Two joined faces must meet at their back ends – exactly what dockCandidate
// produces. A piece dragged past the magnet (offset) or turned by 180° (seat
// against back) still touches its neighbour, but is no valid composition.
export const ALIGN_TOL = 2; // cm
const RANK = { info: 1, warn: 2, error: 3 };
function worstIssue(a, b) {
  if (!a) return b;
  if (!b) return a;
  return RANK[b.level] > RANK[a.level] ? b : a;
}
function worldBackEnd(it, s, topo) {
  return add([it.x, it.y], rotVec(localBackEnd({ w: it.w, d: it.d }, s, topo), it.rot));
}
/** Backs of a join out of line? null = flush. A/B = { it, el, topo }, fa/fb = the joined faces. */
export function alignIssue(A, fa, B, fb) {
  // pieces without a back (connecting tables) dock on their centre line – nothing to check
  if (!A.el || !B.el || !A.topo.backs.length || !B.topo.backs.length) return null;
  const pa = worldBackEnd(A.it, fa.side, A.topo);
  const pb = worldBackEnd(B.it, fb.side, B.topo);
  const off = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
  if (off <= ALIGN_TOL) return null;
  const [ax, ay] = facing(A.it.rot);
  const [bx, by] = facing(B.it.rot);
  if (ax * bx + ay * by < -0.5 && !A.el.b2b && !B.el.b2b) {
    return {
      level: "error",
      code: "facing",
      text: `${displayName(A.el)} und ${displayName(B.el)} stehen gegeneinander verdreht – die Rücken liegen auf verschiedenen Seiten. Ein Element drehen.`,
    };
  }
  return {
    level: "warn",
    code: "align",
    text: `${displayName(A.el)} und ${displayName(B.el)}: Rücken nicht bündig (${Math.round(off)} cm versetzt) – bündig anstellen.`,
  };
}

/**
 * All contacts between items. `lookup(code)` returns the catalogue element.
 * Returns joins (open ↔ open), clashes (open face against a closed face) and
 * the open faces that are still free.
 */
export function analyzeJoins(items, lookup) {
  const faces = items.map((it) => {
    const el = lookup(it.code);
    const topo = topology(el);
    return { it, el, topo, faces: SIDES.map((s) => ({ ...worldSide(it, el, s), open: topo.open.includes(s) })) };
  });
  const joins = [];
  const clashes = [];
  const used = new Set();
  for (let i = 0; i < faces.length; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const A = faces[i],
        B = faces[j];
      for (const fa of A.faces) {
        for (const fb of B.faces) {
          if (contact(fa, fb) < MIN_CONTACT) continue;
          if (fa.open && fb.open) {
            joins.push({ a: A.it.id, b: B.it.id, sa: fa.side, sb: fb.side, issue: worstIssue(joinIssue(A.el, B.el), alignIssue(A, fa, B, fb)) });
            used.add(`${A.it.id}:${fa.side}`);
            used.add(`${B.it.id}:${fb.side}`);
          } else if (fa.open !== fb.open) {
            const [O, C] = fa.open ? [A, B] : [B, A];
            const of = fa.open ? fa : fb;
            if (C.el && C.el.role !== "loose") {
              clashes.push({ open: O.it.id, closed: C.it.id, side: of.side, text: `${displayName(O.el)}: die Anschlussseite trifft auf eine geschlossene Seite (Armlehne oder Rücken) von ${displayName(C.el)}.` });
            }
          }
        }
      }
    }
  }
  const free = [];
  for (const F of faces) for (const f of F.faces) if (f.open && !used.has(`${F.it.id}:${f.side}`)) free.push({ id: F.it.id, side: f.side, face: f });
  return { joins, clashes, free };
}

const overlapsAny = (cand, items, skipId) => {
  const r = footprint(cand);
  return items.some((o) => o.id !== skipId && rectsOverlap(r, footprint(o)));
};
const insideRoom = (cand, room) => {
  if (!room) return true;
  const r = footprint(cand);
  return r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= room.w + 0.5 && r.y + r.h <= room.d + 0.5;
};

/**
 * Snap a dragged item to the nearest free joining face within `radius`.
 * Keeps the current rotation. Returns {x, y, target, issue} or null.
 * A join that `joinIssue` rejects is returned with `blocked: true`.
 */
export function snapDock(items, lookup, moving, pos, radius = 30) {
  const mEl = lookup(moving.code);
  const mTopo = topology(mEl);
  if (!mTopo.open.length) return null;
  const others = items.filter((i) => i.id !== moving.id);
  let best = null;
  for (const t of others) {
    const tEl = lookup(t.code);
    for (const ts of topology(tEl).open) {
      for (const ms of mTopo.open) {
        const cand = dockCandidate(t, tEl, ts, { ...mEl, w: moving.w, d: moving.d }, moving.rot, ms);
        if (!cand) continue;
        const dist = Math.hypot(cand.x - pos.x, cand.y - pos.y);
        if (dist > radius || (best && dist >= best.dist)) continue;
        if (overlapsAny({ ...cand, id: moving.id }, others, moving.id)) continue;
        const issue = joinIssue(mEl, tEl);
        best = { x: cand.x, y: cand.y, dist, target: t.id, issue, blocked: issue?.level === "error" };
      }
    }
  }
  return best;
}

/**
 * Find a docking place for one of `variants` (e.g. the SX and DX version of
 * one element). Tries the preferred item first. Returns
 * {item, target} | {reason} when nothing fits.
 */
export function findDock(items, lookup, variants, { prefer = null, room = null, makeId = () => "n" } = {}) {
  const els = variants.filter((v) => topology(v).open.length && v.w && v.d);
  if (!els.length) return { reason: "Dieses Element wird frei gestellt.", code: "free" };
  if (!items.length) return { reason: "empty", code: "empty" };
  const { free } = analyzeJoins(items, lookup);
  if (!free.length) {
    return { code: "closed", reason: "Keine freie Anschlussseite: Ihre Komposition ist an allen Enden mit Armlehnen abgeschlossen. Tauschen Sie ein Endelement gegen ein Mittelelement oder entfernen Sie es." };
  }
  const order = [...free].sort((a, b) => (a.id === prefer ? -1 : 0) - (b.id === prefer ? -1 : 0));
  let lineIssue = null;
  let outside = null;
  for (const f of order) {
    const t = items.find((i) => i.id === f.id);
    const tEl = lookup(t.code);
    for (const el of els) {
      const issue = joinIssue(el, tEl);
      if (issue?.level === "error") {
        lineIssue = lineIssue || issue;
        continue;
      }
      // prefer the target's own rotation (straight runs), then the others
      const rots = [t.rot, (t.rot + 90) % 360, (t.rot + 270) % 360, (t.rot + 180) % 360];
      for (const rot of rots) {
        for (const ms of topology(el).open) {
          const cand = dockCandidate(t, tEl, f.side, el, rot, ms);
          if (!cand) continue;
          const item = { id: makeId(), code: el.code, ...cand };
          if (overlapsAny(item, items, null)) continue;
          if (!insideRoom(item, room)) {
            outside = outside || { item, target: t.id, issue, outside: true };
            continue;
          }
          return { item, target: t.id, issue };
        }
      }
    }
  }
  if (outside) return outside;
  if (lineIssue) return { reason: lineIssue.text, issue: lineIssue, code: lineIssue.code };
  return { code: "space", reason: "An den freien Anschlussseiten ist dafür kein Platz – ein anderes Element entfernen oder das Element frei stellen." };
}

/** Like findDock but only at a face of `target` whose outward normal is `dir` (template builder). */
export function attachAt(items, lookup, targetId, dir, variants, makeId) {
  const t = items.find((i) => i.id === targetId);
  if (!t) return null;
  const tEl = lookup(t.code);
  for (const ts of topology(tEl).open) {
    const n = rotVec(N[ts], t.rot);
    if (n[0] !== dir[0] || n[1] !== dir[1]) continue;
    for (const el of variants) {
      if (!el || !el.w || !el.d) continue;
      if (joinIssue(el, tEl)?.level === "error") continue;
      for (const rot of [t.rot, (t.rot + 90) % 360, (t.rot + 270) % 360, (t.rot + 180) % 360]) {
        for (const ms of topology(el).open) {
          const cand = dockCandidate(t, tEl, ts, el, rot, ms);
          if (!cand) continue;
          const item = { id: makeId(), code: el.code, ...cand };
          if (overlapsAny(item, items, null)) continue;
          return item;
        }
      }
    }
  }
  return null;
}

export function bounds(items) {
  if (!items.length) return null;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const it of items) {
    const r = footprint(it);
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * QM planer-tools r2: Plätze für die Modellkarten-Silhouette aus der Startform
 * (Breite der längsten Seite ÷ Sitzbreite, 1–4). Vorher zeigten fast alle Karten
 * dieselbe 3-Sitzer-Zeichnung. Nur Maße aus den Planungsdaten, nichts erfunden.
 */
export function silhouetteSeats(items, seat) {
  if (!Array.isArray(items) || !items.length) return 3;
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const i of items) {
    const r = footprint(i);
    x0 = Math.min(x0, r.x);
    x1 = Math.max(x1, r.x + r.w);
    y0 = Math.min(y0, r.y);
    y1 = Math.max(y1, r.y + r.h);
  }
  const width = Math.max(x1 - x0, y1 - y0);
  const per = Math.max(60, Math.min(130, seat || 95));
  if (!Number.isFinite(width) || width <= 0) return 3;
  // QM r5: ab 140 cm Breite ist es ein Sofa – mindestens zwei Plätze („Aston Sofa“ 167 cm war ein Sessel)
  return Math.max(width >= 140 ? 2 : 1, Math.min(4, Math.round((width - 30) / per)));
}
