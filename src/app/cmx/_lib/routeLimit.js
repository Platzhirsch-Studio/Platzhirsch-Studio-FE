// src/app/cmx/_lib/routeLimit.js — R4-plattform-ci (AP1.4)
// Rate-Limit für öffentliche GET-Routen (/cmx/files/… und /api/shop-search).
// `_lib` ist ein privater Ordner: Next macht daraus keine Route.
//
// Nutzt die bestehende Speicher-Abstraktion des Concierge (R2-labs-service):
// limiter.js (gleitendes Fenster) über limitStore.js (Arbeitsspeicher als
// Standard, createSharedStore(exec) Redis-kompatibel vorbereitet). Kein Paket,
// kein Dienst. Für mehrere Instanzen: einmal beim Start
//   getRouteLimiter("cmx").setStore(createSharedStore(exec, { prefix: "cmx:rl:" }))
// aufrufen (z. B. in instrumentation.js).
//
// Rein und ohne "@/"-Importe: direkt mit node --test prüfbar
// (tests/unit/r4-ci-ratelimit.test.mjs).
import { createLimiter } from "../../../lib/concierge/limiter.js";
import { createMemoryStore } from "../../../lib/concierge/limitStore.js";

const envInt = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Grenzen je IP. Bewusst großzügig: Sie sollen Missbrauch (Scraping, Proxy als
// Bandbreiten-Schleuder, Such-Fluten) bremsen, nie einen echten Besucher.
// - cmx: Der Browser cacht jede Datei ein Jahr (immutable). next/image holt
//   intern über Loopback und zählt nicht (siehe isInternal).
// - search: Die Navbar sucht 300 ms nach dem letzten Tastendruck (SearchDialog).
export const LIMITS = {
  cmx: [{ max: envInt("CMX_RATE_PER_MIN", 300), windowMs: 60_000 }],
  search: [
    { max: envInt("SEARCH_RATE_PER_MIN", 120), windowMs: 60_000 },
    { max: envInt("SEARCH_RATE_PER_HOUR", 1200), windowMs: 3_600_000 },
  ],
};

// Speicher klein halten: ein Schlüssel = eine IP mit höchstens `max`
// Zeitstempeln. 2000 Schlüssel × 300 Einträge ≈ 5 MB im ungünstigsten Fall.
const MAX_KEYS = 2000;

const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+|localhost)$/i;

/**
 * Client-IP wie bei den Formularen (src/lib/forms/rateLimit.js): nginx HÄNGT
 * $remote_addr an X-Forwarded-For an, also ist der LETZTE Eintrag der, den
 * unser Proxy gesehen hat. Ohne nginx setzt Next den Header selbst auf die
 * Socket-Adresse, wenn er fehlt. null = keine Adresse bekannt.
 *
 * Betriebsvoraussetzung (QM R4, P2): Ist Port 3000 direkt erreichbar, setzt
 * Next den Header NICHT (nur "??="), der Client bestimmt ihn also selbst –
 * "127.0.0.1" gälte als intern, wechselnde Adressen umgingen das Limit.
 * Darum: Next nur auf 127.0.0.1 binden (scripts/deploy.sh, BIND_HOST) und
 * nginx "proxy_set_header X-Forwarded-For $remote_addr" setzen lassen.
 * Vorlage: tools/ci/nginx-platzhirsch.conf.example.
 */
export function clientIp(headers) {
  const fwd = headers?.get?.("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((x) => x.trim()).filter(Boolean);
    if (list.length) return list[list.length - 1].slice(0, 64);
  }
  const real = headers?.get?.("x-real-ip");
  return real ? real.trim().slice(0, 64) : null;
}

/**
 * Interne Aufrufe zählen nicht: Der Bild-Optimierer (/_next/image?url=/cmx/…)
 * ruft die Route im selben Prozess mit einer nachgebauten Anfrage ohne
 * eigene Header auf; die Adresse ist dann leer oder die Loopback-Adresse von
 * nginx. Würde das zählen, teilten sich alle Besucher einen Eimer.
 * Aus dem Internet kommt kein Loopback an: nginx hängt die echte Adresse an.
 */
export function isInternal(ip) {
  return !ip || LOOPBACK.test(ip);
}

/** Ein Limiter je Route und Prozess, auch über Dev-HMR hinweg. */
export function getRouteLimiter(name, { rules = LIMITS[name], store } = {}) {
  if (!rules) throw new Error(`routeLimit: unbekannte Route ${name}`);
  const key = Symbol.for(`platzhirsch.routeLimit.${name}`);
  if (!globalThis[key]) {
    globalThis[key] = createRouteLimiter(name, { rules, store });
  }
  return globalThis[key];
}

/** Ohne globalen Zustand, für Tests und eigene Speicher. */
export function createRouteLimiter(name, { rules, store, fallback = createMemoryStore({ maxKeys: MAX_KEYS }) } = {}) {
  const limiter = createLimiter({
    store,
    fallback,
    onStoreError: (error) =>
      console.error(`[${name}] limit store failed, using in-memory fallback:`, error?.message || error),
  });
  return {
    name,
    rules,
    get storeName() {
      return limiter.storeName;
    },
    setStore: (next) => limiter.setStore(next),
    /** → { ok: true, skipped? } | { ok: false, retryAfter } */
    async check(headers, now = Date.now()) {
      const ip = clientIp(headers);
      if (isInternal(ip)) return { ok: true, skipped: "internal" };
      try {
        return await limiter.take([{ key: `${name}:${ip}`, rules }], { now });
      } catch (error) {
        // Fail-open: lieber ausliefern als eine Seite ohne Bilder/Suche.
        console.error(`[${name}] rate limit failed:`, error?.message || error);
        return { ok: true, skipped: "error" };
      }
    },
  };
}

/** 429 mit Retry-After (Sekunden). json=true für API-Routen. */
export function tooManyRequests(retryAfter, { json = false } = {}) {
  const seconds = String(Math.max(1, Math.ceil(Number(retryAfter) || 1)));
  const headers = {
    "Retry-After": seconds,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (json) {
    return Response.json({ error: "rate_limited", code: "rate_limited", retryAfter: Number(seconds) }, { status: 429, headers });
  }
  return new Response("Too many requests", {
    status: 429,
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}
