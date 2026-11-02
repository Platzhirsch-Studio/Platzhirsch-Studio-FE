// Sofaplaner – start shapes per model ("Form wählen"). Built only from the
// family's real elements with the docking engine, so every suggestion is a
// valid composition of existing pieces. Nothing is shown that the family does
// not have (no corner → no "Ecke").
import { DEPTH_TOLERANCE, attachAt, bounds, footprint, topology } from "./geometry.js";

const closest = (list, target) => [...list].sort((a, b) => Math.abs(a.w - target) - Math.abs(b.w - target))[0] || null;
const usable = (e) => e.w && e.d && e.shape === "rect";

// Elements of one "system": same line, seat module and depth.
function systemKey(e) {
  return `${e.line || ""}|${e.module || ""}|${e.d}`;
}

export function pickSystem(elements) {
  const straight = elements.filter((e) => usable(e) && (e.role === "end" || e.role === "mid" || e.role === "corner") && e.kind !== "daybed");
  const groups = new Map();
  for (const e of straight) {
    if (e.role === "end" && !["ende"].includes(e.kind)) continue;
    const k = systemKey(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  let best = null;
  for (const [k, list] of groups) {
    const ends = list.filter((e) => e.role === "end");
    const score =
      (ends.some((e) => e.side === "SX") && ends.some((e) => e.side === "DX") ? 100 : 0) +
      (list.some((e) => e.role === "corner") ? 50 : 0) +
      (list.some((e) => e.role === "mid") ? 20 : 0) +
      list.length / 100;
    if (!best || score > best.score) best = { key: k, list, score };
  }
  return best;
}

export function buildTemplates(family) {
  const els = family.elements;
  const lookupMap = new Map(els.map((e) => [e.code, e]));
  const lookup = (c) => lookupMap.get(c);
  let n = 0;
  const makeId = () => `t${++n}`;
  const out = [];
  const sys = pickSystem(els);
  const sameLine = (e) => !sys || !sys.list[0].line || !e.line || e.line === sys.list[0].line;
  const sameModule = (e) => !sys || !sys.list[0].module || !e.module || e.module === sys.list[0].module;

  const finish = (key, label, items, hint) => {
    if (!items || items.some((i) => !i)) return;
    // move the composition to the origin (top-left = 0/0)
    const b = bounds(items);
    const moved = items.map((i) => ({ ...i, x: Math.round((i.x - b.x) * 10) / 10, y: Math.round((i.y - b.y) * 10) / 10 }));
    out.push({ key, label, hint, items: moved, w: Math.round(b.w), d: Math.round(b.h) });
  };
  const start = (el, rot = 0) => ({ id: makeId(), code: el.code, x: 0, y: 0, rot, w: el.w, d: el.d });

  if (sys) {
    const ends = sys.list.filter((e) => e.role === "end");
    const sx = ends.filter((e) => e.side === "SX");
    const dx = ends.filter((e) => e.side === "DX");
    const mids = sys.list.filter((e) => e.role === "mid" && e.kind === "mitte");
    const corners = sys.list.filter((e) => e.role === "corner");
    const endSX = closest(sx, 200);
    const endDX = closest(dx, 200);
    const mid = closest(mids, 100);
    const corner = corners.find((c) => c.side !== "DX") || corners[0];

    // Gerade: Endelement links + (Mittelelement) + Endelement rechts
    if (endSX && endDX) {
      const items = [start(endSX)];
      if (mid && endSX.w + endDX.w < 320) items.push(attachAt(items, lookup, items[0].id, [1, 0], [mid], makeId));
      const last = items[items.length - 1];
      if (last) items.push(attachAt(items, lookup, last.id, [1, 0], [endDX], makeId));
      finish("gerade", "Gerade", items, "Zwei Endelemente mit Armlehne" + (items.length > 2 ? " und ein Mittelelement" : ""));
    }
    // Ecke links / rechts. Owner requirement 3 ("Ecksofa in < 2 min"): if the
    // corner of the family has another depth or no seat module than the chosen
    // end elements (Allen, Daniels, Lawrence, Vivienne …), the family's other
    // rectangular corners are tried too. Different depths are only a hint in
    // the planner ("im Showroom bestätigen"), never a blocked join.
    const depth = sys.list[0].d;
    const cornerCands = [
      ...(corner ? [corner] : []),
      ...els
        .filter((e) => usable(e) && e.role === "corner" && e.kind !== "daybed" && !sys.list.includes(e) && sameLine(e) && sameModule(e))
        .sort((a, b) => (a.side === "DX") - (b.side === "DX") || Math.abs(a.d - depth) - Math.abs(b.d - depth) || a.code.localeCompare(b.code)),
    ];
    const cornerShape = (cn, right) => {
      const c = start(cn, right ? (cn.side === "DX" ? 0 : 90) : cn.side === "DX" ? 270 : 0);
      const items = [c];
      const run = right
        ? attachAt(items, lookup, c.id, [-1, 0], [endSX, endDX].filter(Boolean), makeId)
        : attachAt(items, lookup, c.id, [1, 0], [endDX, endSX].filter(Boolean), makeId);
      if (run) items.push(run);
      const leg = attachAt(items, lookup, c.id, [0, 1], (right ? [endDX, endSX] : [endSX, endDX]).filter(Boolean), makeId);
      if (leg) items.push(leg);
      return items.length === 3 ? items : null;
    };
    for (const [key, label, right] of [
      ["ecke-links", "Ecke links", false],
      ["ecke-rechts", "Ecke rechts", true],
    ]) {
      if (!endSX && !endDX) break;
      for (const cn of cornerCands) {
        const items = cornerShape(cn, right);
        if (items) {
          // QM Restliste P2-2: a corner that is only simplified as a rectangle
          // (L-shape, arm depth not published) and is not shown with these
          // ends in an official arrangement is offered with a showroom note.
          const legs = items.slice(1).map((i) => lookup(i.code));
          const confirm = legs.some((e) => cn.d - e.d > DEPTH_TOLERANCE);
          finish(key, label, items, `Eckelement mit zwei Schenkeln, ${label}${confirm ? " – Kombination im Showroom bestätigen" : ""}`);
          if (confirm) out[out.length - 1].confirm = true;
          break;
        }
      }
    }
    // U-Form: Ecke + Mittelelement(e) + Ecke, Schenkel nach unten
    if (corners.length && mid && (endSX || endDX)) {
      const c1 = start(corner, corner.side === "DX" ? 270 : 0);
      const items = [c1];
      const m1 = attachAt(items, lookup, c1.id, [1, 0], [closest(mids, 200) || mid], makeId);
      if (m1) {
        items.push(m1);
        const c2 = attachAt(items, lookup, m1.id, [1, 0], corners, makeId);
        if (c2) {
          items.push(c2);
          const l1 = attachAt(items, lookup, c1.id, [0, 1], [endSX, endDX].filter(Boolean), makeId);
          const l2 = attachAt(items, lookup, c2.id, [0, 1], [endDX, endSX].filter(Boolean), makeId);
          if (l1 && l2) finish("u", "U-Form", [...items, l1, l2], "Zwei Ecken, Mittelelement und zwei Schenkel");
        }
      }
    }
    // Mit Chaiselongue / Peninsula am rechten Ende
    const tail = (kind) =>
      els.filter((e) => usable(e) && e.kind === kind && e.role === "end" && sameLine(e) && sameModule(e)).sort((a, b) => Math.abs(a.w - 120) - Math.abs(b.w - 120));
    for (const [kind, key, label] of [
      ["chaise", "chaise", "Mit Chaiselongue"],
      ["peninsula", "peninsula", "Mit Peninsula"],
    ]) {
      const options = tail(kind);
      if (!endSX || !options.length) continue;
      const items = [start(endSX)];
      if (mid) {
        const m = attachAt(items, lookup, items[0].id, [1, 0], [mid], makeId);
        if (m) items.push(m);
      }
      const t = attachAt(items, lookup, items[items.length - 1].id, [1, 0], options, makeId);
      if (t) finish(key, label, [...items, t], `${label.replace("Mit ", "")} als Abschluss rechts`);
    }
  }
  // Insel / frei stehend
  const island = els.filter((e) => e.w && e.d && e.kind === "insel").sort((a, b) => b.w - a.w)[0];
  if (island) finish("insel", "Insel", [start(island)], "Frei im Raum, von mehreren Seiten nutzbar");
  // Einzelsofa (feste Größe)
  const sofas = els.filter((e) => e.w && e.d && e.role === "free" && e.kind === "sofa");
  const sofa = closest(sofas.filter((e) => e.shape === "rect"), 240) || closest(sofas, 240);
  if (sofa) finish("sofa", out.length ? "Einzelsofa" : "Sofa", [start(sofa)], "Sofa in fester Größe");
  if (!out.length) {
    // families of single pieces (armchairs, daybeds …): the largest placeable piece
    const any = els.filter((e) => e.w && e.d && e.role !== "acc").sort((a, b) => b.w - a.w)[0];
    if (any) finish("einzeln", "Einzelstück", [start(any)], "Freistehendes Einzelstück");
  }
  return out;
}

/** Template → items placed in the room (against the back wall, sensible side). */
export function placeTemplate(t, room, makeId) {
  const wall = 0;
  let ox;
  if (t.key === "ecke-rechts") ox = Math.max(0, room.w - t.w - wall);
  else if (t.key === "ecke-links" || t.key === "u") ox = wall;
  else ox = Math.max(0, (room.w - t.w) / 2);
  const oy = t.key === "insel" ? Math.max(0, (room.d - t.d) / 2) : wall;
  return t.items.map((i) => ({ ...i, id: makeId(), x: Math.round((i.x + ox) * 10) / 10, y: Math.round((i.y + oy) * 10) / 10 }));
}

/** Small top-view data for thumbnails: centre, rotation, size and faces per item (cm). */
export function thumbOf(items, lookup) {
  return items.map((i) => {
    const el = lookup(i.code);
    const t = topology(el);
    return { x: i.x, y: i.y, rot: i.rot, w: i.w, d: i.d, backs: t.backs, closed: t.closed, kind: el?.kind || "sofa", shape: el?.shape || "rect" };
  });
}

/** Same pieces (multiset of element codes)? Position and rotation do not matter. */
export function sameComposition(items, tItems) {
  if (!Array.isArray(items) || !Array.isArray(tItems) || items.length !== tItems.length || !items.length) return false;
  const key = (list) => list.map((i) => String(i.code)).sort().join("|");
  return key(items) === key(tItems);
}

/** Gleiche Anordnung bis auf Verschiebung (Code, relative Lage, Drehung)? */
export function sameLayout(items, tItems) {
  const norm = (list) => {
    const mx = Math.min(...list.map((i) => i.x));
    const my = Math.min(...list.map((i) => i.y));
    return list.map((i) => `${i.code}@${Math.round(i.x - mx)},${Math.round(i.y - my)},${Math.round(i.rot || 0) % 360}`).sort().join("|");
  };
  return sameComposition(items, tItems) && norm(items) === norm(tItems);
}

/**
 * QM planer-tools r4: welche Startform ist gerade im Plan? Die zuletzt gewählte,
 * solange der Plan noch genau ihre Elemente hat; sonst die eine Form mit genau
 * diesen Elementen (bei mehreren Treffern, z. B. Ecke links/rechts: keine).
 */
export function activeTemplateKey(items, templates, chosenKey = null) {
  if (!Array.isArray(templates) || !templates.length) return null;
  const chosen = chosenKey && templates.find((t) => t.key === chosenKey);
  if (chosen && sameComposition(items, chosen.items)) return chosen.key;
  const hits = templates.filter((t) => sameComposition(items, t.items));
  if (hits.length <= 1) return hits.length ? hits[0].key : null;
  // gleiche Elemente (Ecke links/rechts): die Form, deren Anordnung genau passt
  const exact = hits.filter((t) => sameLayout(items, t.items));
  return exact.length === 1 ? exact[0].key : null;
}

export { footprint };
