import "server-only";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./config";

// Tiny JSON file store for local development in /.data/portal/ (gitignored).
// Writes go to a temp file and are renamed into place; a per-file promise
// chain serialises writes inside this process. Not for production use – the
// Frappe adapter replaces it there.
//
// Windows: rename() fails sporadically with EPERM/EBUSY/EACCES while another
// request reads the target file. We retry with backoff, then fall back to a
// direct write, and always remove the temp file. Every failure is thrown so
// route handlers / actions answer with an error instead of a false success.

const queues = globalThis.__phPortalStoreQueues || (globalThis.__phPortalStoreQueues = new Map());
const RETRY_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);
const BACKOFF_MS = [20, 50, 100, 150, 200];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fileFor(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Ungültiger Store-Name: ${name}`);
  return path.join(DATA_DIR, `${name}.json`);
}

async function readRaw(file) {
  // A reader can hit the same transient lock on Windows – retry briefly.
  for (let i = 0; ; i++) {
    try {
      return await readFile(file, "utf8");
    } catch (err) {
      if (!RETRY_CODES.has(err.code) || i >= BACKOFF_MS.length) throw err;
      await sleep(BACKOFF_MS[i]);
    }
  }
}

export async function readJson(name, fallback) {
  try {
    return JSON.parse(await readRaw(fileFor(name)));
  } catch (err) {
    if (err.code === "ENOENT") return typeof fallback === "function" ? fallback() : fallback;
    throw err;
  }
}

async function renameWithRetry(tmp, file) {
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      if (!RETRY_CODES.has(err.code)) throw err;
      if (i >= BACKOFF_MS.length) {
        // Last resort: overwrite in place (not atomic, but nothing is lost).
        await writeFile(file, await readFile(tmp, "utf8"), "utf8");
        await unlink(tmp).catch(() => {});
        return;
      }
      await sleep(BACKOFF_MS[i]);
    }
  }
}

export async function writeJson(name, data) {
  const file = fileFor(name);
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await renameWithRetry(tmp, file);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

/**
 * Read-modify-write under a per-file lock. `fn` returns { value, result }.
 * Rejects when reading, `fn` or writing fails – callers must surface that.
 */
export function updateJson(name, fallback, fn) {
  const prev = queues.get(name) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      const current = await readJson(name, fallback);
      const { value, result } = await fn(current);
      await writeJson(name, value);
      return result;
    });
  queues.set(name, next);
  return next;
}
