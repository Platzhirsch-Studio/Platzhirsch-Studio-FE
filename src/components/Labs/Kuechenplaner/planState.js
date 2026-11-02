// Küchenplaner – Konfiguration: Standardwerte, zod-Schema, Auto-Aufteilung,
// Kodierung für den Teilen-Link. Reine Funktionen (Server + Client).
//
// Pro-Ausbau (27.10.2026): freie Raumform (Wände mit Längen/Winkeln), Dachschräge,
// Öffnungen und Anschlüsse, Lücken und Optionen je Modul, eigene Hängeschrank-
// Ebene je Wand, Insel/Halbinsel mit Barplatte, Ergonomie (Körpergröße, Sockel,
// Korpus), Plattenstärke, Kanten, Ausschnitte, Rückwand, Wangen, Licht. Alle neuen
// Felder haben Standardwerte – alte Links (v1/v2) öffnen unverändert.
import * as z from "../zod.js"; // benannte Re-Exporte statt ganzem zod-Namensraum (Bundle, R4)
import {
  EDGES,
  FRONT_COLORS,
  FRONT_FINISHES,
  GRIP_COLORS,
  GRIPS,
  LIMITS,
  LINES,
  MODULES,
  OPENINGS,
  PANELS,
  SHAPES,
  SINK_MOUNTS,
  SPLASHES,
  WORKTOPS,
  moduleWidths,
} from "./catalog.js";
import { RUN_KEYS, WALL_IDS, DEPTH_CM, runExtent, runWalls } from "../../../lib/kuechenplaner/room.js";
import { runSpan } from "../../../lib/kuechenplaner/layout.js";

export const BASE_DEPTH = DEPTH_CM; // cm, Unterschranktiefe inkl. Front

const moduleType = z.enum(Object.keys(MODULES));
// code-tests Fix 01 – das Schema muss alles annehmen, was der Planer selbst erzeugen kann,
// sonst werden Teilen-Link, Neuladen, Speichern, Druck und Varianten still ungültig:
// - Breite: breiteste Katalogbreite ist das Wandbord mit 180 cm (EU) / 165 cm (CH), vorher max 130.
// - Anzahl: Hinzufügen, „Rest füllen“ und Drag & Drop begrenzen nicht; 1200 cm / 20 cm = 60, vorher 24.
// - Optionen: nur Kürzel a–z/0–9 wie im Link (TOKEN unten), damit die Speicher-API nichts annimmt,
//   was der Link später nicht kodieren kann.
const width = z.number().min(1).max(200);
const item = z.object({
  t: moduleType,
  w: width,
  g: z.number().min(0).max(1200).optional(),
  o: z.string().regex(/^[a-z0-9]{1,12}$/).optional(),
  // Geräte aus dem Herstellerkatalog je Steckplatz (lib/kuechenplaner/geraete.js), "" = frei.
  // Hier nur die Form; ob der Slug im Katalog steht und passt, prüft geraete.js beim Anzeigen.
  d: z.array(z.string().max(80).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/)).max(4).optional(),
});
const runSchema = z.array(item).max(60);
const clampNum = (lim) => z.number().min(lim.min).max(lim.max);
const wallId = z.enum(WALL_IDS);

const runsShape = Object.fromEntries(RUN_KEYS.map((k) => [k, runSchema.default([])]));
const upShape = Object.fromEntries(
  WALL_IDS.map((k) => [k, z.object({ m: z.enum(["auto", "frei", "aus"]), r: runSchema.default([]) }).optional()]),
);

const opening = z.object({
  k: z.enum(Object.keys(OPENINGS)),
  w: wallId,
  x: z.number().min(0).max(1200),
  b: z.number().min(1).max(400),
  y: z.number().min(0).max(320),
  h: z.number().min(1).max(320),
  s: z.enum(["l", "r"]).optional(),
});

export const DEFAULT_POLY = [
  { l: 420, a: 90 },
  { l: 330, a: 90 },
  { l: 420, a: 90 },
];

const roomSchema = z.object({
  poly: z.array(z.object({ l: clampNum(LIMITS.freeWall), a: clampNum(LIMITS.angle) })).min(2).max(7).default(DEFAULT_POLY),
  slope: z
    .object({ w: z.union([wallId, z.literal("")]), k: clampNum(LIMITS.knee), d: clampNum(LIMITS.slopeDeg) })
    .default({ w: "", k: 120, d: 35 }),
  op: z.array(opening).max(24).default([]),
});

export const DEFAULT_ERGO = { body: 170, plinth: 15, carcass: 78, upGap: 55 };

export const planSchema = z
  .object({
    v: z.literal(1),
    shape: z.enum(Object.keys(SHAPES)),
    raster: z.union([z.literal(60), z.literal(55)]),
    h: clampNum(LIMITS.height),
    walls: z.object({ a: clampNum(LIMITS.wall), b: clampNum(LIMITS.wall), c: clampNum(LIMITS.wall) }),
    runs: z.object(runsShape),
    up: z.object(upShape).default({}),
    island: z.object({
      len: clampNum(LIMITS.islandLen),
      depth: clampNum(LIMITS.islandDepth),
      over: clampNum(LIMITS.overhang),
      aisle: clampNum(LIMITS.aisle),
      fn: z.enum(["keine", "kochfeld", "spuele"]),
      bar: z.boolean().default(false),
      x: clampNum(LIMITS.islandShift).default(0),
    }),
    wallCabinets: z.boolean(),
    line: z.enum(Object.keys(LINES)),
    finish: z.enum(Object.keys(FRONT_FINISHES)),
    color: z.string().max(20),
    grip: z.enum(Object.keys(GRIPS)),
    gripColor: z.enum(Object.keys(GRIP_COLORS)).default("alu"),
    top: z.enum(Object.keys(WORKTOPS)),
    topT: z.number().min(12).max(60).default(20),
    edge: z.enum(Object.keys(EDGES)).default("gerade"),
    sink: z.enum(Object.keys(SINK_MOUNTS)).default("unterbau"),
    splash: z.enum(Object.keys(SPLASHES)).default("platte"),
    panels: z.enum(Object.keys(PANELS)).default("keine"),
    led: z.boolean().default(true),
    pend: z.number().int().min(0).max(4).default(0),
    ergo: z
      .object({
        body: clampNum(LIMITS.body),
        plinth: clampNum(LIMITS.plinth),
        carcass: z.union([z.literal(72), z.literal(78)]),
        upGap: clampNum(LIMITS.upGap),
      })
      .default(DEFAULT_ERGO),
    room: roomSchema.default({ poly: DEFAULT_POLY, slope: { w: "", k: 120, d: 35 }, op: [] }),
  })
  .refine((p) => Boolean(FRONT_COLORS[p.finish]?.[p.color]), { message: "Farbe passt nicht zur Front", path: ["color"] });

/** Nutzbare Länge einer Zeile in cm (Ecken gehören der Rückwand a bzw. der vorigen Wand). */
export function runLength(plan, wall) {
  return runExtent(plan, wall).length;
}

export function activeWalls(plan) {
  return runWalls(plan);
}

/** Belegte Länge (Breiten plus Lücken). */
export function runUsed(run) {
  return runSpan(run);
}

const r2 = (n) => Math.round(n * 100) / 100;

// Vorgaben je Grundform und Wand: head = Anfang (Ecke/links), tail = Ende.
// Dazwischen wird mit Unterschränken aufgefüllt. Faktor = Vielfaches des Rasters.
const PRESETS = {
  zeile: {
    a: { head: [["kuehlschrank", 1], ["backofen", 1]], tail: [["spuele", 1], ["geschirrspueler", 1], ["kochfeld", 1], ["unterschrank", 1]] },
  },
  l: {
    a: { head: [["eckschrank", 2], ["spuele", 1], ["geschirrspueler", 1]], tail: [] },
    b: { head: [["unterschrank", 1], ["kochfeld", 1]], tail: [["unterschrank", 0.5], ["backofen", 1], ["kuehlschrank", 1]] },
  },
  u: {
    // Ecken als Blindecke (Unterschrank 120, Front nur am zugänglichen Teil) – alte Link-Typen bleiben gültig.
    // Fix 1 (P2-1): Kühlschrank näher an die Ecke (Kochfeld–Kühlschrank 309 statt 329 cm). Bei 420 cm
    // Breite bleibt ein Schenkel über 270 cm – das meldet die Prüfung ehrlich als Hinweis.
    // Fix 2 (P2-4): Kühlschrank und Kochfeld an Wand B, Wand C reine Arbeitsfläche – Wand B und C
    // stehen 300 cm auseinander, über den Gang wäre jede Dreieckseite > 270 cm. Startet ohne Hinweis
    // (Suche über alle Anordnungen, Spüle–Kochfeld 246, Kochfeld–Kühlschrank 165, Kühlschrank–Spüle 153 cm).
    a: { head: [["unterschrank", 2], ["unterschrank", 1]], tail: [["spuele", 1], ["geschirrspueler", 1], ["unterschrank", 2]] },
    b: { head: [["kuehlschrank", 1], ["backofen", 1], ["unterschrank", 0.5], ["kochfeld", 1.5], ["unterschrank", 0.5]], tail: [] },
    c: { head: [], tail: [] },
  },
  zweizeilig: {
    b: { head: [["kuehlschrank", 1, "hl"], ["backofen", 1]], tail: [["unterschrank", 1]] },
    c: { head: [["unterschrank", 0.5], ["kochfeld", 1.5], ["unterschrank", 1], ["spuele", 1], ["geschirrspueler", 1]], tail: [] },
  },
  insel: {
    a: { head: [["hochschrank", 1], ["backofen", 1], ["kuehlschrank", 1]], tail: [["spuele", 1], ["geschirrspueler", 1]] },
  },
  halbinsel: {
    a: { head: [["kuehlschrank", 1], ["backofen", 1]], tail: [["spuele", 1], ["geschirrspueler", 1], ["kochfeld", 1], ["unterschrank", 1]] },
  },
  frei: {
    a: { head: [["kuehlschrank", 1], ["backofen", 1]], tail: [["spuele", 1], ["geschirrspueler", 1], ["kochfeld", 1], ["unterschrank", 1]] },
  },
};

/** Füllt eine Länge mit Unterschränken (größte zuerst), Rest bleibt Passblende. */
export function fillWithBase(length, raster) {
  const widths = MODULES.unterschrank.units.map((u) => r2(u * raster)).sort((x, y) => y - x);
  const out = [];
  let rest = length;
  // Bevorzugt Rasterbreite statt 120er, damit es nach Küche aussieht.
  const preferred = [raster, ...widths.filter((w) => w !== raster && w !== 2 * raster), 2 * raster];
  let guard = 0;
  while (rest >= widths[widths.length - 1] && guard++ < 20) {
    const w = preferred.find((x) => x <= rest + 0.001);
    if (!w) break;
    out.push({ t: "unterschrank", w });
    rest = r2(rest - w);
  }
  return out;
}

// Fix 2 (P2-6): Was bei zu kurzer Wand zuletzt wegfällt (höher = wichtiger).
const KEEP = { spuele: 9, kochfeld: 8, kuehlschrank: 7, eckschrank: 6, geschirrspueler: 5, backofen: 4, hochschrank: 3, unterschrank: 1 };

/** Geräte, die die Vorlage an dieser Wand vorsieht (für die Meldung „passt nicht mehr“). */
export function presetAppliances(shape, wall) {
  const preset = PRESETS[shape]?.[wall];
  if (!preset) return [];
  return [...preset.head, ...preset.tail].map(([t]) => t).filter((t) => t !== "unterschrank");
}

export function autoRun(shape, wall, length, raster) {
  const preset = PRESETS[shape]?.[wall];
  if (!preset) return [];
  const toMods = (list) => list.map(([t, f, o]) => ({ t, w: r2(f * raster), ...(o ? { o } : {}) }));
  let head = toMods(preset.head);
  let tail = toMods(preset.tail);
  // Passt nicht? Erst den Eckschrank verkleinern (LeMans ab 100 cm), dann das unwichtigste Modul
  // weglassen (Unterschränke zuerst, Spüle und Kochfeld zuletzt; bei Gleichstand hinten zuerst).
  const over = () => runUsed(head) + runUsed(tail) > length + 0.001;
  const eck = head[0]?.t === "eckschrank" ? head[0] : null;
  // Kleinste Breite, mit der der LeMans-Auszug noch geht (≥ 100 cm, Prüfregel in checks.js)
  const eckMin = Math.min(...moduleWidths("eckschrank", raster).filter((w) => w >= 100));
  if (over() && eck && eck.w > eckMin) head = [{ ...eck, w: eckMin }, ...head.slice(1)];
  // Ecken dieser Wand (Wand A besitzt bei L/U die Ecke am Anfang, bei U auch am Ende).
  // Das Modul in der Ecke fällt nie ersatzlos weg: Sonst rutscht z. B. der Geschirrspüler
  // in die Ecke hinter die Nachbarzeile und lässt sich nicht öffnen (U-Form, Wand A < 420 cm).
  const blindW = r2(1.5 * raster);
  const cornerStart = wall === "a" && (shape === "l" || shape === "u");
  const cornerEnd = wall === "a" && shape === "u";
  const isCornerPiece = (c) =>
    (c.m.t === "eckschrank" || c.m.t === "unterschrank") &&
    ((cornerStart && c.side === "h" && c.i === 0) || (cornerEnd && c.side === "t" && c.i === tail.length - 1));
  while (over() && (tail.length || head.length)) {
    const all = [...head.map((m, i) => ({ m, side: "h", i })), ...tail.map((m, i) => ({ m, side: "t", i }))];
    // Ecken in Blindecken-Breite (1,5 Raster) sind schon minimal – erst alles andere weglassen
    const pool = all.filter((c) => !(isCornerPiece(c) && c.m.t === "unterschrank" && c.m.w <= blindW + 0.001));
    const from = pool.length ? pool : all;
    let drop = from[0];
    for (const c of from) if ((KEEP[c.m.t] ?? 2) <= (KEEP[drop.m.t] ?? 2)) drop = c;
    const shrink = isCornerPiece(drop) && (drop.m.t === "eckschrank" || drop.m.w > blindW + 0.001);
    // Eckschrank bzw. breite Blindecke wird zur Blindecke (Unterschrank 1,5 Raster) statt wegzufallen
    const blind = { t: "unterschrank", w: blindW };
    if (shrink && drop.side === "h") head = [blind, ...head.slice(1)];
    else if (shrink) tail = [...tail.slice(0, -1), blind];
    else if (drop.side === "h") head = head.filter((_, k) => k !== drop.i);
    else tail = tail.filter((_, k) => k !== drop.i);
  }
  const middle = fillWithBase(length - runUsed(head) - runUsed(tail), raster);
  return [...head, ...middle, ...tail];
}

export function withAutoRuns(plan, walls = RUN_KEYS.filter((k) => k !== "i")) {
  const runs = { ...plan.runs };
  const active = activeWalls(plan);
  // Erst alle leeren, dann füllen: Ecken (freie Form) hängen von den Nachbarzeilen ab.
  for (const w of walls) if (!active.includes(w)) runs[w] = [];
  let next = { ...plan, runs };
  for (const w of walls) {
    if (!active.includes(w)) continue;
    next = { ...next, runs: { ...next.runs, [w]: autoRun(plan.shape, w, runLength(next, w), plan.raster) } };
  }
  return next;
}

function emptyRuns() {
  return Object.fromEntries(RUN_KEYS.map((k) => [k, []]));
}

export function defaultPlan(shape = "l") {
  const base = {
    v: 1,
    shape,
    raster: 60,
    h: 260,
    walls: { a: 420, b: 330, c: 330 },
    runs: emptyRuns(),
    up: {},
    island: { len: 240, depth: 100, over: 30, aisle: 120, fn: "kochfeld", bar: false, x: 0 },
    wallCabinets: true,
    line: "binni",
    finish: "matt",
    color: "kaschmir",
    grip: "grifflos",
    gripColor: "alu",
    top: "quarz",
    topT: 20,
    edge: "gerade",
    sink: "unterbau",
    splash: "platte",
    panels: "keine",
    led: true,
    pend: 0,
    ergo: { ...DEFAULT_ERGO },
    room: { poly: DEFAULT_POLY.map((w) => ({ ...w })), slope: { w: "", k: 120, d: 35 }, op: [] },
  };
  if (shape === "insel") {
    base.walls.b = 450;
    base.pend = 3;
  }
  if (shape === "halbinsel") {
    base.walls.b = 450;
    base.island = { ...base.island, len: 200, fn: "keine", bar: true };
    base.pend = 2;
  }
  if (shape === "zweizeilig") base.walls = { a: 300, b: 420, c: 420 };
  if (shape === "frei") base.wallCabinets = true;
  return withAutoRuns(base);
}

/** Rasterwechsel: Breiten proportional umrechnen und neu auffüllen. */
export function switchRaster(plan, raster) {
  if (plan.raster === raster) return plan;
  return withAutoRuns({ ...plan, raster, runs: { ...plan.runs, i: [] }, up: {} });
}

// ---- Teilen-Link -------------------------------------------------------
// Kompakt: Module als "kürzel+breite", danach JSON → base64url.
//
// Format v2 (aktuell): Breite als Ganzzahl in 1/100 cm ("k8250" = Kochfeld
// 82,5 cm), Module mit "." getrennt. Erweiterung Pro (abwärtskompatibel):
// Kürzel mit 1–2 Buchstaben, optional "+lücke" (1/100 cm) und "~optionen"
// ("e10000~ml" = Eckschrank 100 cm LeMans). Format v1 (alt, nur lesen):
// Breite in cm mit Dezimalpunkt ("k82.5"); decodePlan setzt Bruchstücke wieder zusammen.
const CODE = Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, m.code]));
const DECODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k]));
export const SHARE_VERSION = 2;

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s) {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeRun(run) {
  return (run || [])
    .map((m) => `${CODE[m.t]}${Math.round(m.w * 100)}${m.g ? `+${Math.round(m.g * 100)}` : ""}${m.o ? `~${m.o}` : ""}${m.d?.some(Boolean) ? `@${m.d.join(",")}` : ""}`)
    .join(".");
}

export function encodePlan(plan) {
  const runs = {};
  for (const w of RUN_KEYS) {
    const r = plan.runs?.[w] || [];
    if (r.length || ["a", "b", "c"].includes(w)) runs[w] = encodeRun(r);
  }
  const up = {};
  for (const [w, u] of Object.entries(plan.up || {})) if (u) up[w] = { m: u.m, r: encodeRun(u.r) };
  return b64urlEncode(JSON.stringify({ ...plan, v: SHARE_VERSION, runs, up }));
}

// Geräte (optional): "@slug,slug" in Steckplatz-Reihenfolge, leer = frei ("o6000~gd@,miele-dgc-7865").
const TOKEN = /^([a-z]{1,2})(\d+)(?:\+(\d+))?(?:~([a-z0-9]{1,12}))?(?:@([a-z0-9,-]{1,330}))?$/;

function decodeRun(s, version) {
  if (Array.isArray(s)) return s;
  if (!s) return [];
  if (version === SHARE_VERSION) {
    return s.split(".").map((p) => {
      const mm = TOKEN.exec(p);
      if (!mm) return { t: undefined, w: NaN };
      const m = { t: DECODE[mm[1]], w: Number(mm[2]) / 100 };
      if (mm[3]) m.g = Number(mm[3]) / 100;
      if (mm[4]) m.o = mm[4];
      if (mm[5]) m.d = mm[5].split(",");
      return m;
    });
  }
  // v1: "k82.5" wurde mit "." verbunden → Bruchstücke ohne Buchstaben gehören zum Vorgänger.
  const tokens = [];
  for (const p of s.split(".")) {
    if (/^\d+$/.test(p) && tokens.length) tokens[tokens.length - 1] += `.${p}`;
    else tokens.push(p);
  }
  return tokens.map((p) => ({ t: DECODE[p[0]], w: Number(p.slice(1)) }));
}

/** Liefert einen gültigen Plan oder null (nie eine Exception). */
export function decodePlan(code) {
  if (typeof code !== "string" || code.length > 8000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const raw = JSON.parse(b64urlDecode(code));
    const version = raw?.v === SHARE_VERSION ? SHARE_VERSION : 1;
    const runs = {};
    for (const w of RUN_KEYS) {
      const src = raw?.runs?.[w];
      runs[w] = decodeRun(typeof src === "string" || Array.isArray(src) ? src : "", version);
    }
    let up = {};
    if (raw?.up && typeof raw.up === "object") {
      for (const [w, u] of Object.entries(raw.up)) {
        if (u && typeof u === "object") up[w] = { m: u.m, r: decodeRun(typeof u.r === "string" || Array.isArray(u.r) ? u.r : "", SHARE_VERSION) };
      }
    }
    const parsed = planSchema.safeParse({ ...raw, v: 1, runs, up });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
