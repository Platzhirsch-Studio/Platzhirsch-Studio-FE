// src/lib/wunschliste/localStore.js — Entwicklungs-Speicher der Wunschlisten.
// <repo>/.data/wunschliste/ (gitignored über /.data/, außerhalb von public/,
// nie von Next.js ausgeliefert) oder WUNSCHLISTE_LOCAL_DIR:
//   lists/<listId>.json      der Datensatz (model.js)
//   share/<sha256(shareId)>  Verweis Teilen-Link → listId (nur der Hash,
//                            der Dateiname verrät den Link nicht)
// Gleiche Schnittstelle wie der geplante Frappe-Adapter (./frappeAdapter.js).
// Ohne "server-only" und ohne "@/..."-Importe, damit tests/unit es mit einem
// Temp-Ordner prüfen können; eingebunden wird es nur über ./store.js.
import fs from "node:fs/promises";
import path from "node:path";
import { isToken, sha256 } from "./ids.js";

const HASH_RE = /^[a-f0-9]{64}$/;

export function createLocalStore(root) {
  const listPath = (listId) => {
    if (!isToken(listId)) throw new Error("bad id");
    return path.join(root, "lists", `${listId}.json`);
  };
  const sharePath = (hash) => {
    if (!HASH_RE.test(hash)) throw new Error("bad hash");
    return path.join(root, "share", `${hash}.json`);
  };

  const locks = new Map();
  async function withLock(key, fn) {
    const prev = locks.get(key) || Promise.resolve();
    let release;
    const next = new Promise((r) => (release = r));
    const chained = prev.then(() => next);
    locks.set(key, chained);
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (locks.get(key) === chained) locks.delete(key);
    }
  }

  async function readJson(p) {
    try {
      return JSON.parse(await fs.readFile(p, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async function writeJson(p, data) {
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, p);
  }
  const rm = (p) => fs.rm(p, { force: true });

  return {
    name: "local",

    async create(record) {
      return withLock(record.listId, async () => {
        await writeJson(listPath(record.listId), record);
        await writeJson(sharePath(record.shareHash), { listId: record.listId });
        return record;
      });
    },

    async get(listId) {
      if (!isToken(listId)) return null;
      return readJson(listPath(listId));
    },

    async getByShare(shareId) {
      if (!isToken(shareId)) return null;
      const hash = sha256(shareId);
      const ref = await readJson(sharePath(hash));
      if (!ref || !isToken(ref.listId)) return null;
      const record = await readJson(listPath(ref.listId));
      // Verweis zeigt auf einen ausgetauschten Link: wie unbekannt behandeln.
      return record && record.shareHash === hash ? record : null;
    },

    /** Atomares Lesen-Ändern-Schreiben; `fn` ändert den Datensatz und gibt ein Ergebnis zurück. */
    async update(listId, fn) {
      return withLock(listId, async () => {
        const record = await readJson(listPath(listId));
        if (!record) return { record: null, result: undefined };
        const oldShare = record.shareHash;
        const result = await fn(record);
        await writeJson(listPath(listId), record);
        if (record.shareHash !== oldShare) {
          await writeJson(sharePath(record.shareHash), { listId });
          await rm(sharePath(oldShare));
        }
        return { record, result };
      });
    },

    async remove(listId) {
      return withLock(listId, async () => {
        const record = await readJson(listPath(listId));
        if (record?.shareHash && HASH_RE.test(record.shareHash)) await rm(sharePath(record.shareHash));
        await rm(listPath(listId));
        return Boolean(record);
      });
    },
  };
}
