// src/lib/einblicke/schema.js – strenge Prüfung der Einblicke-Pakete (Server).
//
// Umschlag streng: { v:1, sid:uuid, seq, pv, e:[…] } – sonst wird das ganze
// Paket verworfen. Ereignisse einzeln: ein unbekannter Typ oder ein Feld außer
// der Reihe verwirft nur dieses Ereignis. Strings nur aus erlaubten Zeichen
// und Längen, Zahlen begrenzt, Pfade ohne Query/Fragment. Es gibt kein Feld,
// in das Text, Werte oder Kennungen passen würden.
import { z } from "zod";
import { CHANNELS } from "../attribution.js";
import { GOALS, PLANNER_ACTIONS, PLANNERS, routeExcluded } from "./config.js";

const int = (max, min = 0) => z.number().int().min(min).max(max);
const name40 = z.string().regex(/^[A-Za-z][\w-]{0,39}$/);
export const PATH_RE = /^\/[A-Za-z0-9\-._~%/[\]]{0,199}$/;
const path = z.string().regex(PATH_RE).refine((p) => !p.includes("//"));
// Selektor: data-eb-Schlüssel oder landmarke>#id>tag:n (siehe selector.js).
export const SEL_RE = /^[A-Za-z][\w-]{0,39}(?:>#?[A-Za-z][\w-]{0,39}(?::\d{1,4})?){0,3}$/;
const sel = z.string().max(80).regex(SEL_RE);
const channel = z.enum(Object.values(CHANNELS));
const planner = z.enum(Object.keys(PLANNERS));

const EVENT_SCHEMAS = {
  pv: z.strictObject({
    p: path,
    dc: z.enum(["m", "t", "d"]),
    vw: int(10000, 1),
    vh: int(10000, 1),
    dh: int(200000),
    prev: path.optional(),
    ch: channel.optional(),
  }),
  c: z.strictObject({ s: sel, ex: int(1000), ey: int(1000), col: int(39), y: int(40000) }),
  sg: z.strictObject({ k: z.enum(["rage", "dead"]), s: sel }),
  sc: z.strictObject({ max: int(100) }),
  m: z.array(z.tuple([int(39), int(999), int(400, 1)])).max(400),
  a: z.array(z.tuple([sel, int(600000)])).max(60),
  fo: z.strictObject({ f: name40, b: z.array(name40).max(30), l: z.union([name40, z.literal("")]) }),
  fi: z.strictObject({ f: name40, n: name40 }),
  fe: z.strictObject({ f: name40, st: int(599) }),
  g: z.strictObject({ t: z.enum(GOALS), f: name40.optional() }),
  pl: z
    .strictObject({
      n: planner,
      a: z.enum(PLANNER_ACTIONS),
      s: z.string().regex(/^[a-z0-9]{1,20}$/).optional(),
      p: z.string().regex(/^[a-z0-9-]{1,30}$/).optional(),
      d: int(86400).optional(),
    })
    .refine((e) => e.s === undefined || PLANNERS[e.n].steps.includes(e.s)),
  err: z.strictObject({
    t: z.string().regex(/^[A-Za-z]{1,30}$/),
    src: z.string().regex(/^[\w.-]{1,60}$/).optional(),
    l: int(1e7).optional(),
  }),
};
export const EVENT_TYPES = Object.keys(EVENT_SCHEMAS);

const Envelope = z.strictObject({
  v: z.literal(1),
  sid: z.string().regex(/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i),
  seq: int(100000, 1),
  pv: int(10000, 1),
  e: z.array(z.unknown()).min(1).max(200),
});

/**
 * parsePacket(json) → { sid, seq, pv, e:[[typ, daten]] } | null
 * null: Umschlag ungültig, kein gültiges Ereignis übrig, oder ein Seitenaufruf
 * einer ausgeschlossenen Route.
 */
export function parsePacket(json) {
  const env = Envelope.safeParse(json);
  if (!env.success) return null;
  const events = [];
  for (const item of env.data.e) {
    if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== "string") continue;
    const schema = EVENT_SCHEMAS[item[0]];
    if (!schema) continue;
    const r = schema.safeParse(item[1]);
    if (!r.success) continue;
    if (item[0] === "pv" && (routeExcluded(r.data.p) || (r.data.prev && routeExcluded(r.data.prev)))) {
      if (routeExcluded(r.data.p)) return null;
      delete r.data.prev;
    }
    events.push([item[0], r.data]);
  }
  if (!events.length) return null;
  return { sid: env.data.sid.toLowerCase(), seq: env.data.seq, pv: env.data.pv, e: events };
}
