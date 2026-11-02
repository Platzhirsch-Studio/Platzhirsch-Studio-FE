// src/lib/einblicke/vorschau.server.js – Daten der lokalen Vorschau
// /de/preview/einblicke (nur Dev bzw. FREIGABE_PREVIEW=1, nie VERCEL_ENV=production).
// Liest nur die anonymen Tagesaggregate aus .data/einblicke/tag/ und – für
// „heute“ – die Rohdaten des laufenden Tages, aggregiert mit derselben
// k-Schwelle wie für Frappe. Keine sid verlässt diese Datei.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { SERVER } from "./config.js";
import { aggregateDay, sumHeatmaps } from "./aggregate.js";
import { aggregateDaysOnDisk, dirs, readAggregate, readRaw, viennaDay } from "./store.server.js";

export const DEVICE_FILES = { Handy: "handy", Tablet: "tablet", Desktop: "desktop" };
export const SHOT_RE = /^[a-z0-9-]{1,140}--(handy|tablet|desktop)\.(png|jpe?g|webp)$/;

/** Vorschau erlaubt? Dev, oder Produktions-Build mit FREIGABE_PREVIEW=1; nie VERCEL_ENV=production. */
export function einblickePreviewEnabled(env = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.FREIGABE_PREVIEW === "1";
}

/** Dateistamm einer Route wie tools/qa/shoot-lib.mjs slugOf (ohne Query): "/de/kontakt" → "de-kontakt". */
export const stemOf = (route) => String(route).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "home";

async function screenshotOf(route, geraet, env) {
  const dir = dirs(env).screenshots;
  const stem = `${stemOf(route)}--${DEVICE_FILES[geraet]}`;
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    return null;
  }
  const img = files.find((f) => SHOT_RE.test(f) && f.startsWith(`${stem}.`));
  if (!img) return null;
  let manifest = null;
  try {
    manifest = JSON.parse(await readFile(path.join(dir, `${stem}.json`), "utf8"));
  } catch {
    manifest = null;
  }
  return { src: `/api/einblicke/vorschau?datei=${encodeURIComponent(img)}`, manifest };
}

/**
 * loadVorschau({ seite, geraet, tage, quelle }) → Daten für die Seite.
 * quelle "heute": Rohdaten des laufenden Tages (noch ohne Tagesabschluss).
 */
export async function loadVorschau({ seite, geraet = "Desktop", tage = 7, quelle = "aggregat" } = {}, env = process.env) {
  const today = viennaDay();
  let days = [];
  if (quelle === "heute") {
    days = [aggregateDay(await readRaw(today, env), { datum: today, k: SERVER.k })];
  } else {
    const all = await aggregateDaysOnDisk(env);
    const pick = tage > 0 ? all.slice(-tage) : all;
    for (const d of pick) {
      const a = await readAggregate(d, env);
      if (a) days.push(a);
    }
  }
  const routes = new Map();
  for (const d of days) for (const h of d.heatmaps) routes.set(h.seite, (routes.get(h.seite) || 0) + h.seitenaufrufe);
  const routeList = [...routes].sort((a, b) => b[1] - a[1]).map(([r, n]) => ({ route: r, n }));
  const route = seite && routes.has(seite) ? seite : routeList[0]?.route || null;
  const heat = route ? sumHeatmaps(days.flatMap((d) => d.heatmaps.filter((h) => h.seite === route && h.geraet === geraet))) : null;
  const sum = (fn) => days.reduce((n, d) => n + fn(d), 0);
  const pfadeAlle = days.flatMap((d) => d.pfade.filter((p) => p.geraet === "Alle" && p.herkunft === "Alle"));
  const sitzungen = sum((d) => d.meta?.sitzungen || 0);
  const mitZiel = pfadeAlle.reduce((n, p) => n + Math.round((p.ziel_quote / 100) * p.sitzungen), 0);
  return {
    quelle,
    heute: today,
    tage: days.map((d) => d.datum),
    k: SERVER.k,
    kennzahlen: { sitzungen, seitenaufrufe: sum((d) => d.meta?.seitenaufrufe || 0), zielQuote: sitzungen ? Math.round((mitZiel / sitzungen) * 1000) / 10 : 0 },
    routen: routeList,
    route,
    geraet,
    heat,
    screenshot: route ? await screenshotOf(route, geraet, env) : null,
    pfade: pfadeAlle.length ? mergePaths(pfadeAlle) : null,
    herkunft: days.flatMap((d) => d.pfade.filter((p) => p.geraet === "Alle" && p.herkunft !== "Alle")),
    signale: days.flatMap((d) => d.signale).filter((s) => !route || s.seite === route),
    planer: days.flatMap((d) => d.planer),
  };
}

/** Pfad-Dokumente mehrerer Tage zusammenzählen (Sankey + Top-Pfade). */
function mergePaths(list) {
  const edges = new Map();
  const top = new Map();
  let sitzungen = 0;
  const ziele = {};
  for (const p of list) {
    sitzungen += p.sitzungen;
    for (const e of p.sankey.kanten) edges.set(`${e.von}\u0000${e.nach}`, (edges.get(`${e.von}\u0000${e.nach}`) || 0) + e.n);
    for (const t of p.top_pfade) top.set(JSON.stringify(t.pfad), (top.get(JSON.stringify(t.pfad)) || 0) + t.n);
    for (const [g, n] of Object.entries(p.ziele)) ziele[g] = (ziele[g] || 0) + n;
  }
  const kanten = [...edges].map(([k, n]) => {
    const [von, nach] = k.split("\u0000");
    return { von, nach, n };
  });
  return {
    sitzungen,
    ziele,
    kanten,
    top_pfade: [...top].map(([k, n]) => ({ pfad: JSON.parse(k), n })).sort((a, b) => b.n - a.n).slice(0, 20),
  };
}
