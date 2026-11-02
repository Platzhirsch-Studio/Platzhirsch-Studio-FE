import "server-only";

// In-memory sliding-window limiter (per process). Enough for one Node
// instance (PM2 fork, see ecosystem.config.js); swap for Redis when scaling.

const buckets = globalThis.__phPortalRate || (globalThis.__phPortalRate = new Map());

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  }
  return { ok: true };
}
