// src/lib/stilfinder/limits.js
// Extra limits of the Moodboard route on top of guardForm (per IP):
//  - per e-mail address: LIMITS.perEmail (3 PDFs / 24 h), key = SHA-256 of the
//    lower-cased address, so no address is kept in memory in clear text
//  - concurrent builds: LIMITS.concurrent per process (CPU/memory guard)
//  - daily caps per IP and per process: LIMITS.ipDaily / LIMITS.globalDaily
// In memory of this process (pm2 instances: 1, see src/lib/forms/rateLimit.js).
// No "@/..." imports.
import { createHash } from "node:crypto";
import { createRateLimiter } from "../forms/rateLimit.js";
import { LIMITS } from "./config.js";

const hashEmail = (email) => createHash("sha256").update(String(email).trim().toLowerCase()).digest("base64url").slice(0, 22);

export function createEmailLimiter(limit = LIMITS.perEmail) {
  const inner = createRateLimiter({ maxKeys: 5000 });
  const seen = new Set();
  return {
    take(email, now = Date.now()) {
      const key = hashEmail(email);
      if (seen.size > 5000) seen.clear();
      seen.add(key);
      return inner.take(`sf:${key}`, limit, now);
    },
    keys: () => seen.values(),
    reset: () => {
      inner.reset();
      seen.clear();
    },
  };
}

export const emailLimiter = createEmailLimiter();

/**
 * pdf-lead fix-04: daily caps per IP (hashed) and for the whole process.
 * take(ip) counts only when ALL caps still have room (peek first), so a
 * refused request uses up nothing. ip null (no proxy header) → global only.
 * Returns { ok } or { ok: false, retryAfter, scope: "ip" | "global" }.
 */
export function createSendCaps({ ipDaily = LIMITS.ipDaily, globalDaily = LIMITS.globalDaily } = {}) {
  const inner = createRateLimiter({ maxKeys: 5000 });
  return {
    take(ip, now = Date.now()) {
      const caps = [["sf:all", globalDaily, "global"]];
      if (ip) caps.push([`sf:ip:${hashEmail(ip)}`, ipDaily, "ip"]);
      for (const [key, limit, scope] of caps) {
        const r = inner.peek(key, limit, now);
        if (!r.ok) return { ...r, scope };
      }
      for (const [key, limit] of caps) inner.take(key, limit, now);
      return { ok: true };
    },
    reset: () => inner.reset(),
  };
}

export const sendCaps = createSendCaps();

let running = 0;
/** Runs fn when a build slot is free; null when all slots are busy. */
export async function withBuildSlot(fn, max = LIMITS.concurrent) {
  if (running >= max) return { busy: true };
  running++;
  try {
    return { busy: false, value: await fn() };
  } finally {
    running--;
  }
}
