// src/lib/einblicke/store.server.js – lokale Ablage der Einblicke (nur Server).
//
//   .data/einblicke/roh/YYYY-MM-DD.ndjson   Rohsätze { sid, seq, pv, ts_min, e }
//                                           – OHNE IP, User-Agent, Referrer,
//                                           Header; höchstens 14 Tage
//   .data/einblicke/tag/YYYY-MM-DD.json     Tagesaggregat (anonym, dauerhaft)
//   .data/einblicke/tag/YYYY-MM-DD.gesendet Vermerk: an Frappe übertragen
//   .data/einblicke/pool.json               dünne Heatmaps (< k Besuche), höchstens
//                                           14 Tage wie die Rohdaten (aggregate.js
//                                           poolHeatmaps)
//   .data/einblicke/outbox/…json            Dry-Run des Frappe-Pushs
//   .data/einblicke/screenshots/            Screenshots + Manifeste (Vorschau)
// .data/ ist gitignored. Ordner: EINBLICKE_DIR (Tests), sonst <cwd>/.data/einblicke.
// Tag = Kalendertag in Europe/Vienna.
import { appendFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { SERVER, rawDays } from "./config.js";
import { prunePool } from "./aggregate.js";

export const baseDir = (env = process.env) => env.EINBLICKE_DIR || path.join(process.cwd(), ".data", "einblicke");
export const dirs = (env = process.env) => {
  const base = baseDir(env);
  return { base, roh: path.join(base, "roh"), tag: path.join(base, "tag"), outbox: path.join(base, "outbox"), screenshots: path.join(base, "screenshots") };
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const VIENNA = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });

/** Kalendertag in Wien, "YYYY-MM-DD". */
export const viennaDay = (d = new Date()) => VIENNA.format(d);
/** Zeitstempel auf die Minute gerundet (UTC, ISO). */
export const minuteOf = (d = new Date()) => new Date(Math.floor(d.getTime() / 60000) * 60000).toISOString();
/** Tage zwischen zwei "YYYY-MM-DD". */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

// Erste Speicherung eines neuen Tages (je Prozess und Ordner): Rohdaten und
// Pool > 14 Tage löschen. So gilt die 14-Tage-Grenze auch ohne Cron
// (QA Technik P1-1, QA Recht P2-1); der Tagesabschluss löscht zusätzlich.
const purgedOn = new Map();
let purging = null;

/** Hängt einen geprüften Rohsatz an die Datei des Tages an (keine Request-Daten). */
export async function appendRaw(packet, { now = new Date(), env = process.env } = {}) {
  const { base, roh } = dirs(env);
  const day = viennaDay(now);
  const file = path.join(roh, `${day}.ndjson`);
  await mkdir(roh, { recursive: true });
  if (purgedOn.get(base) !== day && !purging) {
    purgedOn.set(base, day);
    purging = purgeRaw({ now, env })
      .catch(() => purgedOn.delete(base))
      .finally(() => (purging = null));
    await purging;
  }
  try {
    if ((await stat(file)).size > SERVER.rawFileMaxBytes) return false;
  } catch {
    /* neue Datei */
  }
  const line = JSON.stringify({ sid: packet.sid, seq: packet.seq, pv: packet.pv, ts_min: minuteOf(now), e: packet.e });
  await appendFile(file, line + "\n", "utf8");
  return true;
}

/** Rohsätze eines Tages (kaputte Zeilen werden übersprungen). */
export async function readRaw(day, env = process.env) {
  if (!DAY_RE.test(day)) return [];
  let text = "";
  try {
    text = await readFile(path.join(dirs(env).roh, `${day}.ndjson`), "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* abgeschnittene Zeile */
    }
  }
  return out;
}

async function list(dir, ext) {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith(ext) && DAY_RE.test(f.slice(0, 10))).map((f) => f.slice(0, 10)).sort();
  } catch {
    return [];
  }
}
export const rawDaysOnDisk = (env = process.env) => list(dirs(env).roh, ".ndjson");
export const aggregateDaysOnDisk = (env = process.env) => list(dirs(env).tag, ".json");

/** Offene Tage: Rohdaten vor heute, deren Aggregat fehlt oder älter ist. */
export async function openDays({ now = new Date(), env = process.env } = {}) {
  const today = viennaDay(now);
  const { roh, tag } = dirs(env);
  const out = [];
  for (const day of await rawDaysOnDisk(env)) {
    if (day >= today) continue;
    try {
      const [r, t] = await Promise.all([stat(path.join(roh, `${day}.ndjson`)), stat(path.join(tag, `${day}.json`))]);
      if (r.mtimeMs > t.mtimeMs) out.push(day);
    } catch {
      out.push(day);
    }
  }
  return out;
}

export async function writeAggregate(day, agg, env = process.env) {
  const { tag } = dirs(env);
  await mkdir(tag, { recursive: true });
  await writeFile(path.join(tag, `${day}.json`), JSON.stringify(agg), "utf8");
}

export async function readAggregate(day, env = process.env) {
  if (!DAY_RE.test(day)) return null;
  try {
    return JSON.parse(await readFile(path.join(dirs(env).tag, `${day}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function markSent(day, info, env = process.env) {
  const { tag } = dirs(env);
  await mkdir(tag, { recursive: true });
  await writeFile(path.join(tag, `${day}.gesendet`), JSON.stringify({ gesendet: new Date().toISOString(), ...info }), "utf8");
}

export async function writeOutbox(name, payload, env = process.env) {
  const { outbox } = dirs(env);
  await mkdir(outbox, { recursive: true });
  const file = path.join(outbox, `${String(name).replace(/[^\w.-]/g, "_")}.json`);
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}

const poolFile = (env) => path.join(dirs(env).base, "pool.json");

/** Pool der dünnen Heatmaps (aggregate.js poolHeatmaps). */
export async function readPool(env = process.env) {
  try {
    return JSON.parse(await readFile(poolFile(env), "utf8"));
  } catch {
    return { v: 1, eintraege: {} };
  }
}

export async function writePool(pool, env = process.env) {
  await mkdir(dirs(env).base, { recursive: true });
  if (!pool || !Object.keys(pool.eintraege || {}).length) {
    await unlink(poolFile(env)).catch(() => {});
    return;
  }
  await writeFile(poolFile(env), JSON.stringify(pool), "utf8");
}

/** Ältester Rohdaten-Tag auf der Platte und sein Alter in Tagen (Inbetriebnahme-Prüfung). */
export async function oldestRaw({ now = new Date(), env = process.env } = {}) {
  const days = await rawDaysOnDisk(env);
  return days.length ? { tag: days[0], alter: daysBetween(days[0], viennaDay(now)) } : null;
}

/**
 * Löscht Rohdaten älter als EINBLICKE_ROH_TAGE (höchstens 14, im Code
 * erzwungen) und dieselben Tage im Pool der dünnen Heatmaps. Gibt die
 * gelöschten Rohdaten-Tage zurück.
 */
export async function purgeRaw({ now = new Date(), env = process.env, days = rawDays(env.EINBLICKE_ROH_TAGE) } = {}) {
  const keep = Math.min(Math.max(1, Math.floor(days) || SERVER.rawMaxDays), SERVER.rawMaxDays);
  const today = viennaDay(now);
  const removed = [];
  for (const day of await rawDaysOnDisk(env)) {
    if (daysBetween(day, today) >= keep) {
      try {
        await unlink(path.join(dirs(env).roh, `${day}.ndjson`));
        removed.push(day);
      } catch {
        /* schon weg */
      }
    }
  }
  const pool = await readPool(env);
  if (Object.keys(pool.eintraege || {}).length) await writePool(prunePool(pool, today, keep), env);
  return removed;
}
