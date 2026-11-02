// src/lib/ideenboard/localStore.js — Speicher der geteilten Ideenboards.
// <repo>/.data/ideenboard/ (gitignored über /.data/, nie von Next.js
// ausgeliefert) oder IDEENBOARD_LOCAL_DIR:
//   boards/<boardId>.json     der Datensatz (model.js createRecord)
//   share/<sha256(shareId)>   Verweis Teilen-Link → boardId (nur der Hash)
// Ohne "server-only" und ohne "@/..."-Importe, damit tests/unit es mit einem
// Temp-Ordner prüfen können; eingebunden wird es nur über ./service.js.
// Ein Frappe-Adapter mit gleicher Schnittstelle (create/get/getByShare/
// update/remove/sweep) kann später dazukommen; heute schreibt nichts ins Backoffice.
// sweep(isExpired) löscht abgelaufene Datensätze aktiv (DSGVO Art. 5 Abs. 1
// lit. e: Speicherbegrenzung – auch Boards, die niemand mehr aufruft) und
// räumt verwaiste Verweise und liegengebliebene .tmp-Dateien weg.
import fs from "node:fs/promises";
import path from "node:path";
import { isToken, sha256 } from "./ids.js";

const HASH_RE = /^[a-f0-9]{64}$/;

export function createLocalStore(root) {
  const boardPath = (id) => {
    if (!isToken(id)) throw new Error("bad id");
    return path.join(root, "boards", `${id}.json`);
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
      return withLock(record.boardId, async () => {
        await writeJson(boardPath(record.boardId), record);
        await writeJson(sharePath(record.shareHash), { boardId: record.boardId });
        return record;
      });
    },
    async get(boardId) {
      if (!isToken(boardId)) return null;
      return readJson(boardPath(boardId));
    },
    async getByShare(shareId) {
      if (!isToken(shareId)) return null;
      const hash = sha256(shareId);
      const ref = await readJson(sharePath(hash));
      if (!ref || !isToken(ref.boardId)) return null;
      const record = await readJson(boardPath(ref.boardId));
      return record && record.shareHash === hash ? record : null;
    },
    async update(boardId, fn) {
      return withLock(boardId, async () => {
        const record = await readJson(boardPath(boardId));
        if (!record) return { record: null, result: undefined };
        const oldShare = record.shareHash;
        const result = await fn(record);
        await writeJson(boardPath(boardId), record);
        if (record.shareHash !== oldShare) {
          await writeJson(sharePath(record.shareHash), { boardId });
          await rm(sharePath(oldShare));
        }
        return { record, result };
      });
    },
    /**
     * Abgelaufene Boards löschen.
     * @param {(record: object) => boolean} expired
     * @returns {Promise<{checked: number, removed: number, orphans: number}>}
     */
    async sweep(expired) {
      const out = { checked: 0, removed: 0, orphans: 0 };
      const list = async (dir) => {
        try {
          return await fs.readdir(path.join(root, dir));
        } catch (e) {
          if (e.code === "ENOENT") return [];
          throw e;
        }
      };
      const live = new Set();
      for (const name of await list("boards")) {
        if (name.endsWith(".tmp")) {
          await rm(path.join(root, "boards", name));
          continue;
        }
        const id = name.replace(/.json$/, "");
        if (!isToken(id)) continue;
        out.checked++;
        let record = null;
        try {
          record = await readJson(boardPath(id));
        } catch {
          record = null; // kaputte Datei: wie abgelaufen behandeln
        }
        if (!record || expired(record)) {
          await this.remove(id);
          out.removed++;
        } else if (record.shareHash) live.add(record.shareHash);
      }
      for (const name of await list("share")) {
        const hash = name.replace(/.json$/, "");
        if (name.endsWith(".tmp") || (HASH_RE.test(hash) && !live.has(hash))) {
          await rm(path.join(root, "share", name));
          out.orphans++;
        }
      }
      return out;
    },
    async remove(boardId) {
      return withLock(boardId, async () => {
        const record = await readJson(boardPath(boardId));
        if (record?.shareHash && HASH_RE.test(record.shareHash)) await rm(sharePath(record.shareHash));
        await rm(boardPath(boardId));
        return Boolean(record);
      });
    },
  };
}
