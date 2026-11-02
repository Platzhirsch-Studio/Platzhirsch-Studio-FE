// src/lib/payments/store.js
// Ablage der Zahlungsdaten über einen Adapter.
//
//   createFileStore(dir)  Standard: JSON-Dateien je Sammlung in
//                         PAYMENTS_DATA_DIR bzw. .data/payments/ (gitignored).
//                         Auch für einen Server mit dauerhaftem Datenträger
//                         (pm2, ecosystem.config.js) geeignet; Sicherung siehe Doku.
//   createMemoryStore()   Tests.
//
// Sammlungen: orders (Gutschein-Bestellungen), deposits (Anzahlungen),
// register (Gutscheinregister, nur Hash des Codes), events (verarbeitete
// Stripe-Ereignisse, Idempotenz), mock (simulierte Checkout-Sessions),
// withdrawals (Widerrufe).
// Schreiben: je Datei eine Warteschlange in diesem Prozess (pm2 instances: 1),
// temporäre Datei + rename, unter Windows mit Wiederholung.
// Keine "@/..."-Importe.
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const COLLECTIONS = Object.freeze(["orders", "deposits", "register", "events", "mock", "withdrawals"]);
const RETRY = new Set(["EPERM", "EBUSY", "EACCES"]);
const BACKOFF = [20, 50, 100, 200];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function assertCollection(name) {
  if (!COLLECTIONS.includes(name)) throw new Error(`Unbekannte Sammlung: ${name}`);
}

/** Gemeinsame Oberfläche über einer Lese-/Schreibfunktion je Sammlung. */
function storeOver(load, save) {
  const queues = new Map();
  const serial = (name, fn) => {
    const prev = queues.get(name) || Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    queues.set(
      name,
      next.catch(() => {})
    );
    return next;
  };
  return {
    async get(name, id) {
      assertCollection(name);
      const all = await load(name);
      return clone(all[id]) ?? null;
    },
    async list(name) {
      assertCollection(name);
      return Object.values(clone(await load(name)));
    },
    async find(name, predicate) {
      return (await this.list(name)).find(predicate) ?? null;
    },
    /** Legt an, nur wenn die Id noch frei ist. → true | false */
    async insert(name, id, value) {
      assertCollection(name);
      return serial(name, async () => {
        const all = await load(name);
        if (all[id] !== undefined) return false;
        all[id] = clone(value);
        await save(name, all);
        return true;
      });
    },
    async put(name, id, value) {
      assertCollection(name);
      return serial(name, async () => {
        const all = await load(name);
        all[id] = clone(value);
        await save(name, all);
        return clone(value);
      });
    },
    /** fn(alt|null) → neu | undefined (unverändert) | null (löschen). Liefert den neuen Wert. */
    async update(name, id, fn) {
      assertCollection(name);
      return serial(name, async () => {
        const all = await load(name);
        const next = await fn(clone(all[id]) ?? null);
        if (next === undefined) return clone(all[id]) ?? null;
        if (next === null) delete all[id];
        else all[id] = clone(next);
        await save(name, all);
        return next === null ? null : clone(next);
      });
    },
  };
}

export function createMemoryStore() {
  const data = Object.fromEntries(COLLECTIONS.map((c) => [c, {}]));
  const store = storeOver(
    async (name) => data[name],
    async (name, all) => {
      data[name] = all;
    }
  );
  store.kind = "memory";
  store.dump = () => clone(data);
  return store;
}

async function readWithRetry(file) {
  for (let i = 0; ; i++) {
    try {
      return await readFile(file, "utf8");
    } catch (err) {
      if (!RETRY.has(err.code) || i >= BACKOFF.length) throw err;
      await sleep(BACKOFF[i]);
    }
  }
}

async function writeAtomic(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, text, "utf8");
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      if (!RETRY.has(err.code)) {
        await unlink(tmp).catch(() => {});
        throw err;
      }
      if (i >= BACKOFF.length) {
        await writeFile(file, text, "utf8");
        await unlink(tmp).catch(() => {});
        return;
      }
      await sleep(BACKOFF[i]);
    }
  }
}

export function createFileStore(dir) {
  const fileOf = (name) => path.join(dir, `${name}.json`);
  const store = storeOver(
    async (name) => {
      try {
        return JSON.parse(await readWithRetry(fileOf(name)));
      } catch (err) {
        if (err.code === "ENOENT") return {};
        throw err;
      }
    },
    async (name, all) => writeAtomic(fileOf(name), JSON.stringify(all, null, 2))
  );
  store.kind = "file";
  store.dir = dir;
  return store;
}

export { writeAtomic };
