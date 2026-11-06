// Gleitendes Fenster je Schlüssel (Prozess-lokal). Kopie des Musters
// src/lib/portal/rateLimit.js der Website. Für mehrere Instanzen: Redis.
// Reines Modul.

import { createHash } from "node:crypto";

const buckets = globalThis.__phBoRate || (globalThis.__phBoRate = new Map());

export function rateLimit(key, { limit, windowMs }, now = Date.now()) {
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

/** Nur prüfen, nichts zählen – für Anmeldungen, bei denen nur Fehlversuche zählen sollen. */
export function rateLimitStatus(key, { limit, windowMs }, now = Date.now()) {
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  return { ok: true };
}

export function resetRateLimit() {
  buckets.clear();
}

/** IP → gekürzter SHA-256 (nie die IP selbst speichern). */
export function ipHash(ip) {
  return createHash("sha256").update(String(ip || "unbekannt")).digest("hex").slice(0, 16);
}
