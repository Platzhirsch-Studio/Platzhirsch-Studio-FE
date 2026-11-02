// src/lib/concierge/limiter.js
// Gleitendes Fenster + globales Tagesbudget über einer Speicher-Schnittstelle
// (limitStore.js). Rein und ohne "server-only", damit es mit node --test
// geprüft werden kann. Verdrahtung mit Konfiguration: rateLimit.js.
//
// Fällt der (geteilte) Speicher aus, rechnet der Limiter mit dem
// Arbeitsspeicher-Ersatz weiter (fail-safe: Limits greifen weiter je Instanz,
// statt dass der Concierge ausfällt oder ungebremst läuft).
import { createMemoryStore } from "./limitStore.js";

export function utcDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}

export function createLimiter({ store, globalPerDay, onStoreError = () => {}, fallback = createMemoryStore() } = {}) {
  let primary = store || fallback;

  async function withStore(fn) {
    if (primary === fallback) return fn(fallback);
    try {
      return await fn(primary);
    } catch (error) {
      onStoreError(error);
      return fn(fallback);
    }
  }

  // checks: [{ key, rules: [{max, windowMs}], reason? }]. Gezählt wird nur,
  // wenn ALLE Prüfungen bestehen. → { ok: true } | { ok: false, retryAfter, reason }
  async function take(checks, { global = false, now = Date.now() } = {}) {
    return withStore(async (s) => {
      for (const c of checks) {
        const longest = Math.max(...c.rules.map((r) => r.windowMs));
        const list = await s.hits(c.key, now, longest);
        for (const rule of c.rules) {
          const inWindow = list.filter((t) => now - t < rule.windowMs);
          if (inWindow.length >= rule.max) {
            const retryAfter = Math.max(1, Math.ceil((rule.windowMs - (now - inWindow[0])) / 1000));
            return { ok: false, retryAfter, reason: c.reason || "rate" };
          }
        }
      }
      if (global) {
        const day = utcDay(now);
        if ((await s.dayCount(day)) >= globalPerDay) {
          const midnight = Date.parse(`${day}T00:00:00Z`) + 24 * 60 * 60 * 1000;
          return { ok: false, retryAfter: Math.ceil((midnight - now) / 1000), reason: "budget" };
        }
        await s.incrDay(day, 2 * 24 * 60 * 60 * 1000);
      }
      for (const c of checks) {
        await s.addHit(c.key, now, Math.max(...c.rules.map((r) => r.windowMs)));
      }
      return { ok: true };
    });
  }

  return {
    take,
    get storeName() {
      return primary.name;
    },
    setStore(next) {
      primary = next || fallback;
    },
  };
}

// Silent second attempt of the browser after a network drop (QA2 P2-2): same
// request id (rid) within 2 minutes → the per-IP and per-session limits are
// not counted again, ONCE per rid. The global daily budget still counts
// (a dropped request may have run the model). Small, bounded memory.
export function createRetryPass({ ttlMs = 2 * 60 * 1000, max = 5000 } = {}) {
  const seen = new Map(); // key → { at, used }
  const prune = (now) => {
    for (const [k, v] of seen) {
      if (now - v.at < ttlMs && seen.size <= max) break;
      seen.delete(k);
    }
  };
  return {
    /** true once for a rid that was counted before (within ttl); marks it used. */
    isRetry(key, now = Date.now()) {
      prune(now);
      const e = seen.get(key);
      if (!e || e.used || now - e.at >= ttlMs) return false;
      e.used = true;
      return true;
    },
    remember(key, now = Date.now()) {
      prune(now);
      if (!seen.has(key)) seen.set(key, { at: now, used: false });
    },
    get size() {
      return seen.size;
    },
  };
}
