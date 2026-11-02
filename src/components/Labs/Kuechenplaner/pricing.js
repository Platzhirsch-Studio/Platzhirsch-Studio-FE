// Küchenplaner – Preisrahmen aus der Preistabelle (PLATZHALTER, siehe catalog.js)
// und Klartext-Zusammenfassung. Der Preis wird nur aus der Konfigurationstabelle
// berechnet und nur angezeigt, wenn der Inhaber die Tabelle freigegeben hat
// (release.js → pricesPublic). Pro-Ausbau: alle Modultypen, eigene Hängeschränke.
import { EDGES, FRONT_COLORS, FRONT_FINISHES, GRIPS, LINES, MODULES, OPENINGS, PANELS, PRICE_LABEL, PRICE_PLACEHOLDER_NOTE, SHAPES, SINK_MOUNTS, SPLASHES, WORKTOPS, fmtCm } from "./catalog.js";
import { buildKitchen } from "./geometry.js";
import { activeWalls, runLength, runUsed } from "./planState.js";
import { PRICE_HIDDEN_TITLE, pricesPublic } from "./release.js";
import { optLabels } from "../../../lib/kuechenplaner/options.js";
import { geraetText, gewaehlteGeraete } from "../../../lib/kuechenplaner/geraete.js";

const add = (a, b, f = 1) => [a[0] + b[0] * f, a[1] + b[1] * f];

/**
 * Liefert { min, max, items, label, note, placeholder, visible }.
 * visible = false (QM R2 P2-1): Tabelle ist nicht freigegeben, die UI zeigt keine Zahlen.
 */
export function priceRange(plan, table, kitchen = null) {
  const k = kitchen || buildKitchen(plan);
  const g = plan.raster;
  let cabinets = [0, 0];
  let appliances = [0, 0];
  let topM = 0;
  const items = [];

  for (const m of k.mods) {
    const def = MODULES[m.t];
    if (!def) continue;
    cabinets = add(cabinets, table.modules[m.t] || [0, 0], m.w / g);
    if (def.appliance && m.kind !== "upper") appliances = add(appliances, table.appliances[def.appliance] || [0, 0]);
  }
  for (const pieces of Object.values(k.tops)) for (const p of pieces) topM += (p.u1 - p.u0) * Math.max(1, (p.v1 - p.v0) / 0.62);
  if (SHAPES[plan.shape]?.island) cabinets = add(cabinets, table.modules.inselProM || [0, 0], plan.island.len / 100);

  const f = (table.lineFactor[plan.line] || 1) * (table.frontFactor[plan.finish] || 1) * (table.gripFactor[plan.grip] || 1);
  cabinets = [cabinets[0] * f, cabinets[1] * f];
  const wt = table.worktopPerM[plan.top] || [0, 0];
  const top = [topM * wt[0], topM * wt[1]];
  items.push({ label: `Möbel (${LINES[plan.line].label}, ${FRONT_FINISHES[plan.finish].label})`, range: cabinets });
  items.push({ label: `Arbeitsplatte ${WORKTOPS[plan.top].label} (${fmtCm(Math.round(topM * 10) / 10)} lfm)`, range: top });
  items.push({ label: "Geräte (Grundausstattung)", range: appliances });
  let sum = [cabinets[0] + top[0] + appliances[0], cabinets[1] + top[1] + appliances[1]];
  const montage = [sum[0] * table.montage[0], sum[1] * table.montage[1]];
  items.push({ label: "Lieferung & Montage", range: montage });
  sum = add(sum, montage);
  const r = table.roundTo || 100;
  return {
    min: Math.floor(sum[0] / r) * r,
    max: Math.ceil(sum[1] / r) * r,
    items: items.map((i) => ({ ...i, range: [Math.round(i.range[0] / 100) * 100, Math.round(i.range[1] / 100) * 100] })),
    label: pricesPublic(table) ? PRICE_LABEL : PRICE_HIDDEN_TITLE,
    note: table.placeholder ? PRICE_PLACEHOLDER_NOTE : "",
    placeholder: Boolean(table.placeholder),
    visible: pricesPublic(table),
    currency: table.currency || "EUR",
  };
}

export function formatEUR(n, currency = "EUR") {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

const WALL_LABEL = { a: "Wand A (Rückwand)", b: "Wand B (links)", c: "Wand C (rechts)", i: "Insel" };
export function wallLabel(plan, w) {
  if (plan.shape === "frei" && w !== "i") return `Wand ${w.toUpperCase()}`;
  if (plan.shape === "halbinsel" && w === "i") return "Halbinsel";
  return WALL_LABEL[w] || `Wand ${w.toUpperCase()}`;
}

/** Klartext-Zusammenfassung für Anzeige und Anfrage (geraete: Geräte-Index, optional – sonst Slugs). */
export function summaryLines(plan, geraete = null) {
  const color = FRONT_COLORS[plan.finish]?.[plan.color]?.label || plan.color;
  const roomLine =
    plan.shape === "frei"
      ? `Raum: freie Form, Wände ${plan.room.poly.map((w) => `${w.l} cm`).join(" / ")} (+ Schlusswand), Raumhöhe ${plan.h} cm`
      : `Raum: Wand A ${plan.walls.a} cm, ${plan.shape === "u" || plan.shape === "zweizeilig" ? `Wand B ${plan.walls.b} cm, Wand C ${plan.walls.c} cm` : `${plan.shape === "l" || plan.shape === "halbinsel" ? "Wand B" : "Raumtiefe"} ${plan.walls.b} cm`}, Raumhöhe ${plan.h} cm`;
  const lines = [
    `Grundform: ${SHAPES[plan.shape].label} · Raster ${plan.raster} cm`,
    roomLine,
    `Linie: ${LINES[plan.line].label}`,
    `Fronten: ${FRONT_FINISHES[plan.finish].label}, ${color} · ${GRIPS[plan.grip].label}`,
    `Arbeitsplatte: ${WORKTOPS[plan.top].label} ${plan.topT || 20} mm, ${EDGES[plan.edge || "gerade"].label} · Spüle: ${SINK_MOUNTS[plan.sink || "unterbau"].label} · Rückwand: ${SPLASHES[plan.splash || "platte"].label}`,
    `Arbeitshöhe: ${Math.round((plan.ergo.plinth + plan.ergo.carcass) * 10 + (plan.topT || 20)) / 10} cm (Sockel ${plan.ergo.plinth} + Korpus ${plan.ergo.carcass} + Platte) · Körpergröße ${plan.ergo.body} cm`,
    `Hängeschränke: ${plan.wallCabinets ? "ja" : "nein"}${Object.keys(plan.up || {}).length ? " (je Wand angepasst)" : ""} · Wangen: ${PANELS[plan.panels || "keine"].label.replace("Wangen ", "")}`,
    `Licht: ${plan.led ? "LED unter den Hängeschränken" : "ohne Unterbau-LED"}${plan.pend ? `, ${plan.pend} Pendelleuchte${plan.pend > 1 ? "n" : ""}` : ""}`,
  ];
  if (plan.room?.slope?.w) lines.push(`Dachschräge an Wand ${plan.room.slope.w.toUpperCase()}: Kniestock ${plan.room.slope.k} cm, Neigung ${plan.room.slope.d}°`);
  for (const w of activeWalls(plan)) {
    const run = plan.runs[w] || [];
    const rest = runLength(plan, w) - runUsed(run);
    const mods = run.map((m) => `${MODULES[m.t].label} ${fmtCm(m.w)}${m.g ? ` (Abstand ${fmtCm(m.g)})` : ""}${m.o ? ` [${optLabels(m).join(", ")}]` : ""}`).join(", ");
    lines.push(`${wallLabel(plan, w)}: ${mods || "leer"}${rest > 0.5 ? ` + frei ${fmtCm(Math.round(rest * 10) / 10)}` : ""} (cm)`);
  }
  if (SHAPES[plan.shape].island) {
    const fn = { keine: "ohne Gerät", kochfeld: "mit Kochfeld", spuele: "mit Spüle" }[plan.island.fn];
    lines.push(`${plan.shape === "halbinsel" ? "Halbinsel" : "Insel"}: ${plan.island.len} × ${plan.island.depth} cm, Überstand ${plan.island.over} cm, Gang ${plan.island.aisle} cm, ${plan.runs.i?.length ? "eigene Module" : fn}${plan.island.bar ? ", Barplatte" : ""}`);
  }
  const gew = gewaehlteGeraete(plan, geraete || []);
  if (gew.length) lines.push(`Geräte (Katalogauswahl): ${gew.map(geraetText).join("; ")}`);
  const ops = plan.room?.op || [];
  if (ops.length) lines.push(`Öffnungen/Anschlüsse: ${ops.map((o) => `${OPENINGS[o.k].label} Wand ${o.w.toUpperCase()} bei ${o.x} cm`).join(", ")}`);
  return lines;
}
