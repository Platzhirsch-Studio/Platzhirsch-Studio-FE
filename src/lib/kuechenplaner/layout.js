// Küchenplaner – Lage der Module in einer Zeile und freie Planung (Drag & Drop).
//
// Modell: Eine Zeile ist eine Liste { t, w, g?, o? }. `g` ist die Lücke VOR dem
// Modul in cm (Standard 0). So bleiben Zeilen ohne Lücken kompakt (alte Links),
// und frei verschobene Module behalten ihren Platz, auch wenn ein Nachbar
// breiter wird (dann schiebt er die Folgenden, die Prüfung meldet den Überhang).
// Alle Positionen in cm ab Wandanfang. Reine Funktionen.
import { MODULES } from "../../components/Labs/Kuechenplaner/catalog.js";
import { runExtent } from "./room.js";

const r1 = (n) => Math.round(n * 10) / 10;
export const SNAP_CM = 5;

/** Absolute Lage: [{ ...m, i, x0, x1 }] (cm ab Wandanfang). */
export function placeRun(run, start = 0) {
  let x = start;
  return (run || []).map((m, i) => {
    const x0 = x + (m.g || 0);
    const x1 = x0 + m.w;
    x = x1;
    return { ...m, i, x0: r1(x0), x1: r1(x1) };
  });
}

/** Belegte Länge einer Zeile ab ihrem Start (cm), inkl. Lücken. */
export function runSpan(run) {
  return (run || []).reduce((s, m) => s + m.w + (m.g || 0), 0);
}

/** Absolute Lagen → Liste mit Lücken (sortiert). */
export function fromPlaced(placed, start = 0) {
  const sorted = [...placed].sort((p, q) => p.x0 - q.x0);
  let end = start;
  return sorted.map((p) => {
    const g = r1(Math.max(0, p.x0 - end));
    end = Math.max(end, p.x0) + p.w;
    const m = { t: p.t, w: p.w };
    if (g >= 0.5) m.g = g;
    if (p.o) m.o = p.o;
    return m;
  });
}

function runOf(plan, wall) {
  return plan.runs?.[wall] || [];
}

/** Freie Stelle für ein Modul der Breite w möglichst nah an x (cm) – mit Magnet an Nachbarkanten. */
export function findSlot(others, w, x, lo, hi) {
  const fits = (p) => p >= lo - 0.01 && p + w <= hi + 0.01 && others.every((o) => p + w <= o.x0 + 0.01 || p >= o.x1 - 0.01);
  const cands = [lo, hi - w, ...others.flatMap((o) => [o.x1, o.x0 - w])].filter((p) => Number.isFinite(p));
  // Magnet: Kante eines Nachbarn oder Zeilenanfang/-ende in der Nähe → einrasten
  for (const c of cands) if (Math.abs(c - x) <= SNAP_CM && fits(c)) return r1(c);
  const xr = Math.round(x);
  if (fits(xr)) return xr;
  let best = null;
  for (const c of cands) if (fits(c) && (best === null || Math.abs(c - x) < Math.abs(best - x))) best = c;
  return best === null ? null : r1(best);
}

/**
 * Verschiebt Modul `from.i` von Wand `from.wall` an Position `to.x` (cm ab Wandanfang)
 * auf Wand `to.wall`. Die übrigen Module bleiben, wo sie sind. Ist kein Platz frei,
 * wird das Modul an der nächstmöglichen Stelle eingefügt und schiebt die Folgenden.
 */
export function moveModule(plan, from, to) {
  const src = runOf(plan, from.wall);
  const m = src[from.i];
  if (!m) return plan;
  const def = MODULES[m.t];
  if (to.wall === "i" && def?.kind === "tall") return plan;
  const srcStart = runExtent(plan, from.wall).start;
  const srcPlaced = placeRun(src, srcStart).filter((p) => p.i !== from.i);
  const runs = { ...plan.runs, [from.wall]: fromPlaced(srcPlaced, srcStart) };
  const ext = runExtent(plan, to.wall);
  const base = to.wall === from.wall ? srcPlaced : placeRun(runOf(plan, to.wall), ext.start);
  const lo = ext.start;
  const hi = ext.start + ext.length;
  const x = findSlot(base, m.w, to.x, lo, hi);
  const item = { t: m.t, w: m.w, ...(m.o ? { o: m.o } : {}) };
  if (to.wall === from.wall && (x === null || Math.abs(x - to.x) > m.w / 2)) {
    // Kein freier Platz in der Nähe: umsortieren (Tausch mit den Nachbarn), Lücken bleiben
    const rest = src.filter((_, k) => k !== from.i);
    const centre = to.x + m.w / 2;
    const idx = placeRun(rest, ext.start).filter((o) => (o.x0 + o.x1) / 2 < centre).length;
    const next = [...rest.slice(0, idx), item, ...rest.slice(idx)];
    if (next.every((q, k) => q === src[k] || (q === item && k === from.i))) return plan;
    return { ...plan, runs: { ...plan.runs, [to.wall]: next } };
  }
  let placed;
  if (x === null) {
    // Kein Platz: nach Position einsortieren, Lücke 0 → schiebt (Prüfung meldet Überhang)
    placed = [...base, { ...item, x0: Math.max(lo, Math.round(to.x)), x1: 0 }];
  } else {
    placed = [...base, { ...item, x0: x, x1: x + m.w }];
  }
  runs[to.wall] = fromPlaced(placed, ext.start);
  return { ...plan, runs };
}

/** Fügt ein Modul ein: an Position x (cm) oder am Zeilenende. */
export function insertModule(plan, wall, m, x = null) {
  const run = runOf(plan, wall);
  const ext = runExtent(plan, wall);
  if (x === null) return { ...plan, runs: { ...plan.runs, [wall]: [...run, m] } };
  const placed = placeRun(run, ext.start);
  const slot = findSlot(placed, m.w, x, ext.start, ext.start + ext.length);
  const item = { ...m };
  delete item.g;
  const next = [...placed, { ...item, x0: slot ?? Math.round(x), x1: 0 }];
  return { ...plan, runs: { ...plan.runs, [wall]: fromPlaced(next, ext.start) } };
}

/** Entfernt ein Modul. keep = true: die übrigen bleiben an ihrem Platz (Lücke). */
export function removeModule(plan, wall, i, keep = false) {
  const run = runOf(plan, wall);
  if (!keep) return { ...plan, runs: { ...plan.runs, [wall]: run.filter((_, k) => k !== i) } };
  const ext = runExtent(plan, wall);
  return { ...plan, runs: { ...plan.runs, [wall]: fromPlaced(placeRun(run, ext.start).filter((p) => p.i !== i), ext.start) } };
}

/** Verschiebt ein Modul per Tastatur um `d` cm (an Nachbarn vorbei, wenn Platz ist). */
export function nudgeModule(plan, wall, i, d) {
  const ext = runExtent(plan, wall);
  const p = placeRun(runOf(plan, wall), ext.start)[i];
  if (!p) return plan;
  return moveModule(plan, { wall, i }, { wall, x: p.x0 + d });
}

/** Schließt alle Lücken einer Zeile. */
export function closeGaps(plan, wall) {
  return { ...plan, runs: { ...plan.runs, [wall]: runOf(plan, wall).map(({ g, ...m }) => (void g, m)) } };
}

/** Index des Moduls nach Verschieben (gleiche Wand) – für die Auswahl im Editor. */
export function indexAt(plan, wall, x) {
  const ext = runExtent(plan, wall);
  const placed = placeRun(runOf(plan, wall), ext.start);
  let best = -1;
  let dist = Infinity;
  placed.forEach((p) => {
    const d = Math.abs((p.x0 + p.x1) / 2 - x);
    if (d < dist) {
      dist = d;
      best = p.i;
    }
  });
  return best;
}

/**
 * Fix 2 (P2-7): Ziel beim Ablegen eines neuen Moduls der Breite w bei x (cm).
 * → { type: "insert", x } bei freiem Platz,
 *   { type: "replace", i, x0, x1, t } wenn die Zeile voll ist und unter `at` (cm)
 *   ein Modul gleicher Breite steht, sonst { type: "full", x0, x1 }.
 */
export function dropTarget(plan, wall, w, x, at = x + w / 2) {
  const ext = runExtent(plan, wall);
  const placed = placeRun(runOf(plan, wall), ext.start);
  const slot = findSlot(placed, w, x, ext.start, ext.start + ext.length);
  if (slot !== null) return { type: "insert", x: slot };
  const hit = placed.find((p) => at >= p.x0 - 0.01 && at <= p.x1 + 0.01);
  if (hit && Math.abs(hit.w - w) < 0.5) return { type: "replace", i: hit.i, x0: hit.x0, x1: hit.x1, t: hit.t };
  const x0 = Math.max(ext.start, Math.min(ext.start + ext.length - w, x));
  return { type: "full", x0, x1: x0 + w };
}

/** Ersetzt Modul i durch m (Lücke davor bleibt, Optionen des alten Moduls entfallen). */
export function replaceModule(plan, wall, i, m) {
  const run = runOf(plan, wall);
  if (!run[i]) return plan;
  const next = run.slice();
  next[i] = { t: m.t, w: m.w, ...(run[i].g ? { g: run[i].g } : {}), ...(m.o ? { o: m.o } : {}) };
  return { ...plan, runs: { ...plan.runs, [wall]: next } };
}
