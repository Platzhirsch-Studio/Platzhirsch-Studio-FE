// src/lib/booking/store.js – kleine JSON-Ablage des Mock-Kalenders in
// .data/booking/ (gitignored). Schreiben über eine Promise-Kette je Datei:
// Lesen, Prüfen und Schreiben einer Buchung laufen damit in diesem Prozess
// nacheinander – das ist der Doppelbuchungsschutz des Mocks (Produktion:
// SELECT … FOR UPDATE im Backoffice, Spezifikation B3). Windows: rename()
// scheitert gelegentlich mit EPERM/EBUSY, dann mit Pause wiederholen.
// Keine "@/..."-Importe.
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "./config.js";

const queues = globalThis.__phBookingQueues || (globalThis.__phBookingQueues = new Map());
const RETRY = new Set(["EPERM", "EBUSY", "EACCES"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fileOf(name, dir) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error("bad store name");
  return path.join(/*turbopackIgnore: true*/ dir, `${name}.json`);
}

export async function readStore(name, fallback, dir = dataDir()) {
  for (let i = 0; ; i++) {
    try {
      return JSON.parse(await readFile(fileOf(name, dir), "utf8"));
    } catch (err) {
      if (err.code === "ENOENT") return fallback;
      if (!RETRY.has(err.code) || i > 4) throw err;
      await sleep(30 * (i + 1));
    }
  }
}

async function writeStore(name, value, dir) {
  const file = fileOf(name, dir);
  await mkdir(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      if (!RETRY.has(err.code)) {
        await unlink(tmp).catch(() => {});
        throw err;
      }
      if (i > 4) {
        await writeFile(file, JSON.stringify(value, null, 2), "utf8");
        await unlink(tmp).catch(() => {});
        return;
      }
      await sleep(30 * (i + 1));
    }
  }
}

/** Lesen → fn(current) → { value, result } → Schreiben, nacheinander je Datei. */
export function updateStore(name, fallback, fn, dir = dataDir()) {
  const key = `${dir}|${name}`;
  const prev = queues.get(key) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      const current = await readStore(name, fallback, dir);
      const { value, result, write = true } = await fn(current);
      if (write) await writeStore(name, value, dir);
      return result;
    });
  queues.set(key, next);
  return next;
}
