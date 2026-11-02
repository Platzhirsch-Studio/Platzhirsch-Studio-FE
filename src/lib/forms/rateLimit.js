// src/lib/forms/rateLimit.js
// Sliding-window rate limit in the memory of THIS server process.
//
// Works because production runs as ONE process: ecosystem.config.js has
// pm2 `instances: 1`, `exec_mode: "fork"`. With several pm2 instances, a
// cluster or serverless, every process would count on its own (limit × n), so
// the store must then move to a shared backend (Redis/Upstash or
// rate-limiter-flexible with a store). A restart clears all counters.
//
// No "@/..." imports: tested directly with `node --test` (tests/unit/forms*.test.mjs).

// DEFAULT_LIMIT counts only requests that pass every check (= would be
// forwarded to the backoffice). ATTEMPT_LIMIT counts every request, so a
// visitor who fails the server validation a few times is NOT locked out
// (QA R1 P2-3), while floods of junk requests are still stopped.
export const DEFAULT_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
export const ATTEMPT_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const MAX_KEYS = 5000;

/**
 * createRateLimiter() → { take(key, { max, windowMs }, now) , reset() }
 * take() counts one request and returns { ok: true } or
 * { ok: false, retryAfter } (seconds until the oldest hit leaves the window).
 */
export function createRateLimiter({ maxKeys = MAX_KEYS } = {}) {
  const hits = new Map(); // key -> number[] (timestamps, oldest first)

  function take(key, { max = DEFAULT_LIMIT.max, windowMs = DEFAULT_LIMIT.windowMs } = {}, now = Date.now()) {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      hits.set(key, list);
      return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - list[0])) / 1000)) };
    }
    list.push(now);
    hits.delete(key); // re-insert: Map order = least recently used first
    hits.set(key, list);
    if (hits.size > maxKeys) {
      for (const k of hits.keys()) {
        hits.delete(k);
        if (hits.size <= maxKeys * 0.9) break;
      }
    }
    return { ok: true };
  }

  // Like take(), but does not count: would the next request still be allowed?
  function peek(key, { max = DEFAULT_LIMIT.max, windowMs = DEFAULT_LIMIT.windowMs } = {}, now = Date.now()) {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - list[0])) / 1000)) };
    return { ok: true };
  }

  return { take, peek, reset: () => hits.clear(), size: () => hits.size };
}

/** clientIp() for a plain Headers object (e.g. from next/headers); null without one. */
export function ipFromHeaders(headers) {
  return headers && typeof headers.get === "function" ? clientIp({ headers }) : null;
}

/** One shared limiter for all form routes of this process (keys carry the route). */
export const formLimiter = createRateLimiter();

/**
 * Client IP for the rate limit. nginx in front of `next start` APPENDS the
 * connecting address to X-Forwarded-For, so the LAST entry is the one our own
 * proxy saw; entries left of it come from the client and can be forged.
 * Without nginx (dev), Next.js itself sets X-Forwarded-For to the socket
 * address when the header is missing (base-server.js).
 * Returns null when no address is known (e.g. a Request built internally,
 * like the forwarded one in /api/upload/inquiry/[kind]). For that case the
 * routes hand guardForm the headers of the ORIGINAL request (next/headers,
 * see requestHeaders.js) as `outerHeaders` (QA R1 P1-1).
 */
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((x) => x.trim()).filter(Boolean);
    if (list.length) return list[list.length - 1].slice(0, 64);
  }
  const real = request.headers.get("x-real-ip");
  return real ? real.trim().slice(0, 64) : null;
}
