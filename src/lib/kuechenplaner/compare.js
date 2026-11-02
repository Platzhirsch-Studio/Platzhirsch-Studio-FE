// Küchenplaner – Varianten A/B vergleichen (Feinschliff, QA-Feedback 2 P3-9).
// Reine Funktionen: Kennzahlen einer Planung und eine Vergleichstabelle mit
// Unterschieden. Neutral formuliert: Es gibt Differenzen, kein „besser“/„schlechter“.
// Preise erscheinen nur, wenn der Preisrahmen freigegeben ist (price.visible).
import { FRONT_COLORS, FRONT_FINISHES, GRIPS, MODULES, SHAPES, WORKTOPS, fmtCm } from "../../components/Labs/Kuechenplaner/catalog.js";

const r1 = (n) => Math.round(n * 10) / 10;
const NOT_STORAGE_UP = new Set(["wandbord", "luecke"]);
// Fix 3 (P3-1): Der Haubenschrank (Flachschirmhaube) bleibt ein Modul, zählt aber nicht
// als Hängeschrank-Stauraum (der Platz gehört größtenteils der Haube).
const NOT_STORAGE_UPPER = new Set([...NOT_STORAGE_UP, "luefterhs"]);
// Fix 3 (P3-2): Zahl und Einheit (und Kürzel und Zahl) nie getrennt umbrechen.
export const NBSP = " ";

/** Raum in Kurzform: „A 420 · B 330 cm“, freie Form „5 Wände“, Insel mit Maß. */
function roomText(plan, kitchen) {
  if (plan.shape === "frei") return `${kitchen.walls.filter((w) => w.rendered).length}${NBSP}Wände, Raum ${Math.round(kitchen.room.w * 100)}${NBSP}×${NBSP}${Math.round(kitchen.room.d * 100)}${NBSP}cm`;
  const walls = SHAPES[plan.shape].walls.length ? SHAPES[plan.shape].walls : ["a"];
  const list = walls.map((w) => `${w.toUpperCase()}${NBSP}${fmtCm(plan.walls[w])}`).join(" · ");
  const island = SHAPES[plan.shape].island ? ` · ${plan.shape === "halbinsel" ? "Halbinsel" : "Insel"} ${fmtCm(plan.island.len)}${NBSP}×${NBSP}${fmtCm(plan.island.depth)}` : "";
  return `${list}${island}${NBSP}cm`;
}

/** Modul-Namen mit Anzahl („Unterschrank ×4“), Hängeschränke ohne automatische. */
export function moduleCounts(kitchen) {
  const counts = new Map();
  for (const m of kitchen.mods) {
    if (m.t === "luecke" || m.t === "passstueck") continue;
    if (m.kind === "upper" && m.auto) continue;
    const n = MODULES[m.t]?.name || m.t;
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  return counts;
}

/**
 * Kennzahlen einer Planung. kitchen = buildKitchen(plan), checks = runChecks(plan, kitchen),
 * price = priceRange(...) oder null.
 */
export function planMetrics(plan, kitchen, checks, price = null) {
  const mods = kitchen.mods;
  const floor = mods.filter((m) => m.kind !== "upper");
  const sumW = (list) => r1(list.reduce((s, m) => s + m.w, 0));
  const top = r1(Object.values(kitchen.tops).flat().reduce((s, p) => s + (p.u1 - p.u0) * 100, 0));
  const cut = sumW(floor.filter((m) => m.t === "spuele" || m.t === "kochfeld"));
  // Feste Reihenfolge (Katalog), damit gleiche Geräte an anderer Stelle nicht als Unterschied gelten
  const order = Object.keys(MODULES);
  const appliances = floor.filter((m) => MODULES[m.t]?.appliance).sort((x, y) => order.indexOf(x.t) - order.indexOf(y.t)).map((m) => MODULES[m.t].name);
  const tri = checks.metrics?.triangle;
  const color = FRONT_COLORS[plan.finish]?.[plan.color]?.label || plan.color;
  return {
    shape: SHAPES[plan.shape]?.label || plan.shape,
    room: roomText(plan, kitchen),
    modules: floor.filter((m) => m.t !== "passstueck").length + mods.filter((m) => m.kind === "upper" && !NOT_STORAGE_UP.has(m.t)).length,
    worktop: top,
    worktopFree: r1(Math.max(0, top - cut)),
    storeBase: sumW(floor.filter((m) => MODULES[m.t]?.kind === "base" && !MODULES[m.t].appliance && m.t !== "passstueck")),
    storeTall: sumW(floor.filter((m) => MODULES[m.t]?.kind === "tall" && !MODULES[m.t].appliance)),
    storeUpper: sumW(mods.filter((m) => m.kind === "upper" && !NOT_STORAGE_UPPER.has(m.t))),
    appliances: appliances.length ? [...new Set(appliances)].map((n) => `${n}${appliances.filter((x) => x === n).length > 1 ? ` ×${appliances.filter((x) => x === n).length}` : ""}`).join(", ") : "keine",
    triangle: tri ? tri.sum : null,
    workHeight: r1(plan.ergo.plinth + plan.ergo.carcass + plan.topT / 10),
    front: `${FRONT_FINISHES[plan.finish]?.label || plan.finish}, ${color}`,
    worktopMat: `${WORKTOPS[plan.top]?.label || plan.top}, ${plan.topT}${NBSP}mm`,
    grip: GRIPS[plan.grip]?.label || plan.grip,
    errors: checks.counts.error,
    warns: checks.counts.warn,
    price: price && price.visible ? { min: price.min, max: price.max, currency: price.currency || "EUR" } : null,
    counts: moduleCounts(kitchen),
  };
}

const fmtEUR = (n, c = "EUR") => new Intl.NumberFormat("de-AT", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
const signed = (n, unit) => `${n > 0 ? "+" : "−"}${fmtCm(Math.abs(r1(n)))}${unit ? `${NBSP}${unit}` : ""}`;

/**
 * Zeilen der Vergleichstabelle: { key, label, group, a, b, diff, delta }.
 * delta beschreibt B gegenüber A („+60 cm“), nur bei Zahlen.
 */
export function compareRows(ma, mb) {
  const rows = [];
  const text = (key, label, group, fa = (m) => m[key]) => {
    const a = String(fa(ma));
    const b = String(fa(mb));
    rows.push({ key, label, group, a, b, diff: a !== b, delta: "" });
  };
  const num = (key, label, group, unit) => {
    const a = ma[key];
    const b = mb[key];
    const show = (v) => (v === null || v === undefined ? "–" : `${fmtCm(v)}${unit ? `${NBSP}${unit}` : ""}`);
    const both = typeof a === "number" && typeof b === "number";
    const diff = both ? Math.abs(a - b) > 0.05 : a !== b;
    rows.push({ key, label, group, a: show(a), b: show(b), diff, delta: both && diff ? signed(b - a, unit) : "" });
  };
  text("shape", "Grundform", "Raum");
  text("room", "Maße", "Raum");
  num("worktop", "Arbeitsplatte", "Fläche & Stauraum", "cm");
  num("worktopFree", "Arbeitsfläche ohne Spüle und Kochfeld", "Fläche & Stauraum", "cm");
  num("storeBase", "Unterschränke (Stauraum)", "Fläche & Stauraum", "cm");
  num("storeTall", "Hochschränke (Stauraum)", "Fläche & Stauraum", "cm");
  num("storeUpper", "Hängeschränke (Stauraum)", "Fläche & Stauraum", "cm");
  num("modules", "Module", "Fläche & Stauraum", "");
  text("appliances", "Geräte", "Geräte & Ergonomie");
  num("triangle", "Arbeitsdreieck (Summe)", "Geräte & Ergonomie", "cm");
  num("workHeight", "Arbeitshöhe", "Geräte & Ergonomie", "cm");
  text("front", "Fronten", "Material");
  text("worktopMat", "Arbeitsplatte", "Material");
  text("grip", "Griff", "Material");
  num("errors", "Kollisionen", "Prüfung", "");
  num("warns", "Hinweise", "Prüfung", "");
  if (ma.price || mb.price) {
    const p = (m) => (m.price ? `${fmtEUR(m.price.min, m.price.currency)} – ${fmtEUR(m.price.max, m.price.currency)}` : "–");
    const a = p(ma);
    const b = p(mb);
    const mid = (m) => (m.price ? (m.price.min + m.price.max) / 2 : null);
    const d = mid(ma) !== null && mid(mb) !== null ? mid(mb) - mid(ma) : null;
    rows.push({ key: "price", label: "Preisrahmen (unverbindlich)", group: "Preis", a, b, diff: a !== b, delta: d ? `${d > 0 ? "+" : "−"}${fmtEUR(Math.abs(d), (mb.price || ma.price).currency)} (Mitte)` : "" });
  }
  return rows;
}

/** Module, die nur in A bzw. nur in B vorkommen (nach Anzahl). */
export function moduleDiff(ma, mb) {
  const only = (x, y) => {
    const out = [];
    for (const [n, c] of x.counts) {
      const d = c - (y.counts.get(n) || 0);
      if (d > 0) out.push(d > 1 ? `${n} ×${d}` : n);
    }
    return out;
  };
  return { onlyA: only(ma, mb), onlyB: only(mb, ma) };
}
