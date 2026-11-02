// Drosselung für die Planer-Routen (Küchenplaner /api/labs/kuechenplaner/plan,
// Sofaplaner /de/sofaplaner/teilen). R2-Fix, QM-Feedback P2-3.
//
// Speicher:
// - Redis über die REST-Schnittstelle (Upstash-kompatibel), sobald
//   LABS_REDIS_REST_URL und LABS_REDIS_REST_TOKEN gesetzt sind (alternativ
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Kein npm-Paket: ein
//   fetch auf /pipeline mit SET … PX … NX + INCR (festes Fenster ab dem ersten Treffer).
// - Sonst Arbeitsspeicher dieser Instanz (Dev, pm2 mit einer Instanz).
// - Fällt Redis aus (Fehler oder > 800 ms), zählt der Arbeitsspeicher weiter.
//   Die Route bleibt erreichbar, es wird einmal geloggt.
//
// Adressen gehen nur als gekürzter SHA-256-Hash nach Redis (Datenminimierung),
// die Schlüssel laufen nach dem Fenster von selbst ab.
//
// Client-Adresse: nur aus einem vertrauenswürdigen Header (LABS_IP_HEADER bzw.
// KUECHENPLANER_IP_HEADER, z. B. "x-real-ip" vom eigenen Proxy) oder dem LETZTEN
// X-Forwarded-For-Eintrag. Den ersten kann der Client frei setzen.
//
// Ohne "server-only" und ohne "@/…"-Importe, damit node --test die Datei lädt.
import { createHash } from "node:crypto";

const TIMEOUT_MS = 800;

export function redisConfig(env = process.env) {
  const url = env.LABS_REDIS_REST_URL || env.UPSTASH_REDIS_REST_URL || "";
  const token = env.LABS_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname))) return null;
    return { url: url.replace(/\/+$/, ""), token };
  } catch {
    return null;
  }
}

export function clientKey(headers, env = process.env) {
  const trusted = env.LABS_IP_HEADER || env.KUECHENPLANER_IP_HEADER;
  if (trusted) {
    const v = headers.get(trusted);
    if (v) return v.split(",")[0].trim();
  }
  const xff = (headers.get("x-forwarded-for") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return xff.length ? xff[xff.length - 1] : "local";
}

export const hashKey = (s) => createHash("sha256").update(`labs-planer:${s}`).digest("base64url").slice(0, 22);

function memoryCounter(maxKeys = 5000) {
  const hits = new Map();
  return (key, now, windowMs) => {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.delete(key);
    hits.set(key, list);
    if (hits.size > maxKeys) {
      for (const k of hits.keys()) {
        hits.delete(k);
        if (hits.size <= maxKeys * 0.9) break;
      }
    }
    return list.length;
  };
}

/**
 * createPlanerLimiter({ name, max, windowMs, env, fetchImpl, log })
 * → { limited(key) → Promise<boolean>, backend() → "redis" | "memory" }
 */
export function createPlanerLimiter({
  name,
  max = 10,
  windowMs = 600_000,
  env = process.env,
  fetchImpl = globalThis.fetch,
  log = console,
} = {}) {
  const count = memoryCounter();
  const cfg = redisConfig(env);
  let warned = false;
  const warnOnce = (msg) => {
    if (warned) return;
    warned = true;
    log.warn?.(`[labs-planer:${name}] ${msg}`);
  };
  if (!cfg && env.NODE_ENV === "production") {
    warnOnce("Rate-Limit nur im Arbeitsspeicher – LABS_REDIS_REST_URL/LABS_REDIS_REST_TOKEN setzen.");
  }

  async function redisCount(key) {
    const k = `labs:rl:${name}:${hashKey(key)}`;
    const res = await fetchImpl(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["SET", k, "0", "PX", String(windowMs), "NX"],
        ["INCR", k],
      ]),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const out = await res.json();
    const n = Number(out?.[1]?.result);
    if (!Number.isFinite(n)) throw new Error("unerwartete Antwort");
    return n;
  }

  return {
    backend: () => (cfg ? "redis" : "memory"),
    async limited(key, now = Date.now()) {
      if (cfg) {
        try {
          return (await redisCount(key)) > max;
        } catch (e) {
          warnOnce(`Redis nicht erreichbar (${e?.message || e}) – Arbeitsspeicher als Ersatz.`);
        }
      }
      return count(key, now, windowMs) > max;
    },
  };
}

/** Eine Instanz pro Server-Prozess und Name, auch über Dev-HMR hinweg. */
export function planerLimiter(name, opts) {
  const sym = Symbol.for(`platzhirsch.labs.limiter.${name}`);
  return globalThis[sym] || (globalThis[sym] = createPlanerLimiter({ name, ...opts }));
}

/**
 * Darf die Route im Produktions-Build speichern? Erst mit Freigabe (P2-2) und mit
 * geteiltem Rate-Limit (P2-3). Gibt null zurück oder einen deutschen Grund.
 */
export function liveBlocker(env = process.env, released = env.NEXT_PUBLIC_LABS_PLANER_SENDEN === "1") {
  if (env.NODE_ENV !== "production") return null;
  if (!released) return "In der Testphase noch nicht freigeschaltet.";
  if (!redisConfig(env)) return "Noch nicht für den Livebetrieb eingerichtet.";
  return null;
}
