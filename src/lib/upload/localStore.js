// src/lib/upload/localStore.js — development storage for customer uploads.
// Everything lives in <repo>/.data/uploads/<id>/ or UPLOAD_LOCAL_DIR/<id>/ (gitignored, outside
// public/ — never served by Next.js):
//   session.json        ref, kind, expiry, consent, note, file list
//   files/<fileId>.part while chunks arrive (written at their offset)
//   files/<fileId>.<ext> once complete
// Same interface as a future S3/Frappe adapter (see store.js).
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

// Live (R-9): UPLOAD_LOCAL_DIR = absolute folder on a persistent, backed-up
// volume outside the deploy folder. Default for development: <cwd>/.data/uploads.
const ROOT = process.env.UPLOAD_LOCAL_DIR ? path.resolve(process.env.UPLOAD_LOCAL_DIR) : path.join(process.cwd(), ".data", "uploads");
const SAFE_ID = /^[A-Za-z0-9_-]{16,32}$/;

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

function dirOf(id) {
  if (!SAFE_ID.test(id)) throw new Error("bad id");
  return path.join(ROOT, id);
}
const sessionPath = (id) => path.join(dirOf(id), "session.json");
function filePath(id, fileId, ext) {
  if (!SAFE_ID.test(fileId) || !/^[a-z0-9]{2,5}$/.test(ext)) throw new Error("bad file id");
  return path.join(dirOf(id), "files", `${fileId}.${ext}`);
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
  const tmp = `${p}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, p);
}

export const localStore = {
  name: "local",

  async getSession(id) {
    return readJson(sessionPath(id));
  },

  /** Creates the session if missing; `init` fills a new one. Returns it. */
  async ensureSession(id, init) {
    return withLock(id, async () => {
      const existing = await readJson(sessionPath(id));
      if (existing) return existing;
      const session = init();
      await fs.mkdir(path.join(dirOf(id), "files"), { recursive: true });
      await writeJson(sessionPath(id), session);
      return session;
    });
  },

  /** Atomic read-modify-write; `fn` mutates or returns the session. */
  async updateSession(id, fn) {
    return withLock(id, async () => {
      const session = await readJson(sessionPath(id));
      if (!session) throw new Error("session missing");
      const result = (await fn(session)) ?? session;
      session.updatedAt = new Date().toISOString();
      await writeJson(sessionPath(id), session);
      return result;
    });
  },

  async createPart(id, fileId, size) {
    const p = filePath(id, fileId, "part");
    const handle = await fs.open(p, "w");
    try {
      await handle.truncate(size);
    } finally {
      await handle.close();
    }
  },

  async writeChunk(id, fileId, offset, bytes) {
    const handle = await fs.open(filePath(id, fileId, "part"), "r+");
    try {
      await handle.write(bytes, 0, bytes.length, offset);
    } finally {
      await handle.close();
    }
  },

  async readHead(id, fileId, length = 16) {
    const handle = await fs.open(filePath(id, fileId, "part"), "r");
    try {
      const buf = Buffer.alloc(length);
      await handle.read(buf, 0, length, 0);
      return buf;
    } finally {
      await handle.close();
    }
  },

  /** Renames .part to its final name; `transform(buffer)` may edit in place. */
  async finalize(id, fileId, ext, transform) {
    const part = filePath(id, fileId, "part");
    const final = filePath(id, fileId, ext);
    let info = {};
    if (transform) {
      const buf = await fs.readFile(part);
      info = transform(buf) || {};
      if (info.changed) await fs.writeFile(part, buf);
    }
    await fs.rename(part, final);
    return info;
  },

  async removeFile(id, fileId, ext) {
    for (const p of [filePath(id, fileId, "part"), filePath(id, fileId, ext)]) {
      await fs.rm(p, { force: true });
    }
  },

  /** Deletes whole upload folders whose deleteAfter date has passed. */
  async purgeExpired(now = Date.now()) {
    let entries = [];
    try {
      entries = await fs.readdir(ROOT);
    } catch {
      return 0;
    }
    let removed = 0;
    for (const id of entries) {
      if (!SAFE_ID.test(id)) continue;
      const s = await readJson(sessionPath(id)).catch(() => null);
      if (s?.deleteAfter && Date.parse(s.deleteAfter) < now) {
        await fs.rm(dirOf(id), { recursive: true, force: true });
        removed++;
      }
    }
    return removed;
  },

  /**
   * Totals over all folders for the global guards: sessions created in the
   * last 24 h and bytes on disk (declared sizes of all registered files).
   * Cached for 30 s — the guards only need to be roughly right.
   */
  async stats(now = Date.now()) {
    if (statsCache && now - statsCache.at < 30_000) return statsCache.value;
    let entries = [];
    try {
      entries = await fs.readdir(ROOT);
    } catch {
      /* no folder yet */
    }
    const value = { sessions: 0, sessionsLastDay: 0, bytes: 0 };
    // QA fix2 P1-1: all session files are read in parallel (was one after another).
    const sessions = await Promise.all(entries.filter((id) => SAFE_ID.test(id)).map((id) => readJson(sessionPath(id)).catch(() => null)));
    for (const s of sessions) {
      if (!s) continue;
      value.sessions++;
      if (now - Date.parse(s.createdAt) < 24 * 60 * 60 * 1000) value.sessionsLastDay++;
      value.bytes += (s.files || []).reduce((sum, f) => sum + (f.size || 0), 0);
    }
    statsCache = { at: now, value };
    return value;
  },

  /** Lets the guards count a new session/file before the cache refreshes. */
  noteGrowth({ sessions = 0, bytes = 0 }) {
    if (!statsCache) return;
    statsCache.value.sessions += sessions;
    statsCache.value.sessionsLastDay += sessions;
    statsCache.value.bytes += bytes;
  },
};

let statsCache = null;
