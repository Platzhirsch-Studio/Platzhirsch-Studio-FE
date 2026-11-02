// src/lib/upload/limitStore.js — storage behind the upload rate limits
// (http.js). Pure: no "server-only", no packages, so node --test can load it.
// Feature doc: Marktresearch/digital/features/handy-upload.md, "Live-Einsatz".
//
// Contract (async):
//   take(key, limit, windowMs, now) → true when this request is OVER the limit.
//                                     The request is counted either way
//                                     (sliding window, same as before R-9).
//   name                            → "memory" | "shared" (logs, readiness)
//
// Default: createMemoryStore(), the memory of THIS server process. That is
// correct for production as it runs today (ecosystem.config.js: pm2,
// instances: 1, fork). A restart clears the counters. With several instances,
// a cluster or serverless, every process would count on its own (limit × n):
// then call setUploadLimitStore(createSharedStore(exec)) once at start-up
// (http.js). No Redis client is installed and no service is contacted here.

export function createMemoryStore({ maxKeys = 5000 } = {}) {
  const hits = new Map(); // key -> timestamps, Map order = least recently used first
  return {
    name: "memory",
    async take(key, limit, windowMs, now = Date.now()) {
      return takeSync(hits, maxKeys, key, limit, windowMs, now);
    },
    size: () => hits.size,
    reset: () => hits.clear(),
  };
}

function takeSync(hits, maxKeys, key, limit, windowMs, now) {
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.delete(key); // re-insert → most recently used last
  hits.set(key, list);
  if (hits.size > maxKeys) {
    // Drop the older half instead of resetting everyone's counter.
    let drop = Math.floor(hits.size / 2);
    for (const k of hits.keys()) {
      if (drop-- <= 0) break;
      hits.delete(k);
    }
  }
  return list.length > limit;
}

/**
 * Shared, Redis-compatible store (several instances, survives restarts).
 * exec(args: string[]) → Promise<reply> runs ONE command, for example
 *   node-redis:   (args) => client.sendCommand(args)
 *   ioredis:      (args) => client.call(...args)
 *   Upstash REST: (args) => fetch(URL, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` },
 *                                        body: JSON.stringify(args) }).then((r) => r.json()).then((j) => j.result)
 * Data model: one sorted set per key (score = time). "Remove old, add, count"
 * is not atomic; for a flood guard that precision is enough (bundle it as a
 * Lua script with EVAL if exact counts are ever needed).
 */
export function createSharedStore(exec, { prefix = "upload:rl:" } = {}) {
  if (typeof exec !== "function") throw new TypeError("createSharedStore: exec(args) fehlt");
  let seq = 0;
  return {
    name: "shared",
    async take(key, limit, windowMs, now = Date.now()) {
      const k = `${prefix}${key}`;
      seq = (seq + 1) % 1e6;
      await exec(["ZREMRANGEBYSCORE", k, "-inf", String(now - windowMs)]);
      await exec(["ZADD", k, String(now), `${now}-${seq}-${Math.random().toString(36).slice(2, 8)}`]);
      await exec(["PEXPIRE", k, String(windowMs)]);
      return Number(await exec(["ZCARD", k])) > limit;
    },
  };
}

/**
 * QM fix2 P2-1: a shared store that hangs (e.g. a Redis client buffering
 * commands in its offline queue while the server is down) must not block
 * uploads. withFallback races store.take against `timeoutMs`; on a timeout
 * OR an error the request is counted in `memory` instead. Logs at most once
 * per `logEveryMs` so a dead store cannot flood the log.
 * Returns a store with the same contract; `lastSource()` tells which store
 * answered the last call ("shared" | "memory", for tests and logs).
 */
export function withFallback(store, memory, { timeoutMs = 300, logEveryMs = 60_000, log = console.error } = {}) {
  if (!store || typeof store.take !== "function") throw new TypeError("withFallback: store.take fehlt");
  if (!memory || typeof memory.take !== "function") throw new TypeError("withFallback: memory.take fehlt");
  let lastLog = -Infinity;
  let source = null;
  const warn = (reason) => {
    const t = Date.now();
    if (t - lastLog < logEveryMs) return;
    lastLog = t;
    log(`[upload] Rate-Limit-Speicher "${store.name}" ${reason}, nutze Arbeitsspeicher.`);
  };
  return {
    name: store.name,
    lastSource: () => source,
    async take(key, limit, windowMs, now = Date.now()) {
      let timer;
      const TIMEOUT = Symbol("timeout");
      try {
        const result = await Promise.race([
          Promise.resolve().then(() => store.take(key, limit, windowMs, now)),
          new Promise((resolve) => {
            timer = setTimeout(() => resolve(TIMEOUT), timeoutMs);
          }),
        ]);
        if (result !== TIMEOUT) {
          source = store.name;
          return result;
        }
        warn(`antwortet nicht innerhalb von ${timeoutMs} ms`);
      } catch (error) {
        warn(`nicht erreichbar (${error?.message || error})`);
      } finally {
        clearTimeout(timer);
      }
      source = memory.name;
      return memory.take(key, limit, windowMs, now);
    },
  };
}

/**
 * QM fix2 P2-2: UPLOAD_RATE_LIMIT_STORE=shared only says the operator MEANT
 * to wire a shared store. Returns the error text when env asks for "shared"
 * but the active store is something else, otherwise null.
 */
export function sharedStoreMismatch(env = {}, activeName = "memory") {
  const wanted = String(env.UPLOAD_RATE_LIMIT_STORE || "").trim().toLowerCase();
  if (wanted !== "shared" || activeName === "shared") return null;
  return "[upload] UPLOAD_RATE_LIMIT_STORE=shared, aber kein geteilter Speicher angeschlossen – zähle im Arbeitsspeicher";
}
