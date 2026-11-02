// src/lib/concierge/store.js
// Transcript storage – ONLY when the visitor ticked the optional "Verlauf
// speichern" box (token payload st=1). Without it nothing is written.
// Development store: .data/concierge/transcripts/YYYY-MM-DD.jsonl (gitignored,
// never under public/). No IP address, no user agent; the session id is the
// random id from the consent token. Later: Frappe doctype (see feature doc).
//
// Deletion:
// - deleteSession(sid): visitor withdraws consent -> all lines of that sid go.
// - purgeExpired(): day files older than RETENTION_DAYS are removed; runs at
//   most once per hour, triggered by saveTurn/deleteSession.
import "server-only";
import { appendFile, mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { RETENTION_DAYS } from "./config";

const DIR = path.join(process.cwd(), ".data", "concierge", "transcripts");
const FILE_RE = /^(\d{4}-\d{2}-\d{2})\.jsonl$/;
let lastPurge = 0;

// Serialise writes so a delete never races an append (single instance).
let queue = Promise.resolve();
const serial = (fn) => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
};

export async function saveTurn({ sid, mode, user, assistant, productIds }) {
  try {
    await serial(async () => {
      await mkdir(DIR, { recursive: true });
      const day = new Date().toISOString().slice(0, 10);
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        sid,
        mode,
        user: String(user).slice(0, 2000),
        assistant: String(assistant).slice(0, 8000),
        productIds: (productIds || []).slice(0, 30),
      });
      await appendFile(path.join(DIR, `${day}.jsonl`), line + "\n", "utf8");
    });
    purgeExpired().catch(() => {});
  } catch (error) {
    console.error("[concierge] could not store transcript:", error);
  }
}

async function listFiles() {
  try {
    return (await readdir(DIR)).filter((f) => FILE_RE.test(f));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Removes every stored line of this session. Returns the number removed.
export async function deleteSession(sid) {
  if (typeof sid !== "string" || !sid) return 0;
  const removed = await serial(async () => {
    let count = 0;
    for (const file of await listFiles()) {
      const full = path.join(DIR, file);
      const lines = (await readFile(full, "utf8")).split("\n").filter(Boolean);
      const keep = lines.filter((l) => {
        try {
          return JSON.parse(l).sid !== sid;
        } catch {
          return true;
        }
      });
      if (keep.length === lines.length) continue;
      count += lines.length - keep.length;
      if (!keep.length) {
        await unlink(full);
      } else {
        const tmp = `${full}.tmp`;
        await writeFile(tmp, keep.join("\n") + "\n", "utf8");
        await rename(tmp, full);
      }
    }
    return count;
  });
  purgeExpired().catch(() => {});
  return removed;
}

export async function purgeExpired(now = Date.now()) {
  if (now - lastPurge < 60 * 60 * 1000) return;
  lastPurge = now;
  const cutoff = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await serial(async () => {
    for (const file of await listFiles()) {
      if (file.match(FILE_RE)[1] < cutoff) await unlink(path.join(DIR, file)).catch(() => {});
    }
  });
}
