// src/lib/portal/actionLimit.js — R6-portal-labs
// Rate-Limit für die Server Actions des Kundenportals
// (Portal/Docs/actions.js, Portal/Messages/actions.js).
//
// Zwei Stufen:
// 1. je IP, VOR der Sitzungsprüfung (getPortal: HMAC, Store-Lesen, Adapter):
//    jeder Aufruf zählt, auch ein ungültiger oder einer ohne Sitzung. Das
//    bremst Fluten von POST-Anfragen an die Action-IDs, bis das Framework-
//    Update (Next 16.4.1+, DoS über Server-Action-Anfragen) eingespielt ist.
//    Das Portal bleibt bis dahin ohnehin aus (kundenportal.md).
// 2. je Kunde, NACH der Sitzungsprüfung: Schreibvorgänge (Anfragen,
//    Nachrichten) wie bisher, jetzt über denselben Speicher.
//
// Speicher: die vorhandene Abstraktion des Concierge (limiter.js über
// limitStore.js, wie src/app/cmx/_lib/routeLimit.js): Standard ist der
// Arbeitsspeicher dieses Prozesses (pm2, eine Instanz). Für mehrere Instanzen
// einmal beim Start getActionLimiter().setStore(createSharedStore(exec,
// { prefix: "portal:rl:" })) aufrufen. Kein Paket, kein Dienst.
//
// Rein und ohne "@/"-Importe: direkt mit node --test prüfbar
// (tests/unit/r6-portal-labs.test.mjs). Die Verdrahtung mit next/headers
// steckt in den Actions selbst.
import { createLimiter } from "../concierge/limiter.js";
import { createMemoryStore } from "../concierge/limitStore.js";

const envInt = (name, fallback) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Großzügig je IP: Ein Mensch schickt im Portal wenige Formulare pro Minute.
// Kunden-Grenzen wie vor R6 (rateLimit.js): Dokumente/Termine/Pass/Anfragen
// 10 pro Stunde, Nachrichten 20 pro Stunde.
export const ACTION_LIMITS = {
  ip: [
    { max: envInt("PORTAL_ACTION_RATE_PER_MIN", 20), windowMs: 60_000 },
    { max: envInt("PORTAL_ACTION_RATE_PER_HOUR", 200), windowMs: 3_600_000 },
  ],
  docs: [{ max: 10, windowMs: 3_600_000 }],
  messages: [{ max: 20, windowMs: 3_600_000 }],
};

const MAX_KEYS = 5000;

/**
 * Client-IP wie bei Formularen und /cmx (letzter Eintrag von X-Forwarded-For,
 * den unser nginx anhängt). Ohne bekannte Adresse: "unknown" – diese Anfragen
 * teilen sich einen Eimer, statt ungebremst durchzugehen (fail-closed je IP).
 */
export function actionClientIp(headers) {
  const fwd = headers?.get?.("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((x) => x.trim()).filter(Boolean);
    if (list.length) return list[list.length - 1].slice(0, 64);
  }
  const real = headers?.get?.("x-real-ip");
  return real ? real.trim().slice(0, 64) : "unknown";
}

/** Ohne globalen Zustand, für Tests und eigene Speicher. */
export function createActionLimiter({ limits = ACTION_LIMITS, store, fallback = createMemoryStore({ maxKeys: MAX_KEYS }), log = console.error } = {}) {
  const limiter = createLimiter({
    store,
    fallback,
    onStoreError: (error) => log("[portal/actions] limit store failed, using in-memory fallback:", error?.message || error),
  });

  async function take(key, rules, now) {
    try {
      return await limiter.take([{ key, rules }], { now });
    } catch (error) {
      // Auch der Ersatzspeicher ist ausgefallen: Die Action läuft weiter (die
      // Kundengrenze und die Sitzungsprüfung bleiben), die Seite bricht nicht.
      log("[portal/actions] rate limit failed:", error?.message || error);
      return { ok: true, skipped: "error" };
    }
  }

  return {
    limits,
    get storeName() {
      return limiter.storeName;
    },
    setStore: (next) => limiter.setStore(next),
    /** Stufe 1, vor getPortal(): → { ok: true } | { ok: false, retryAfter } */
    checkIp(headers, now = Date.now()) {
      return take(`ip:${actionClientIp(headers)}`, limits.ip, now);
    },
    /** Stufe 2, nach getPortal(): scope = "docs" | "messages". */
    async checkCustomer(scope, customerId, now = Date.now()) {
      const rules = scope === "ip" ? null : limits[scope];
      if (!rules) throw new Error(`actionLimit: unbekannter Bereich ${scope}`);
      return take(`${scope}:${customerId}`, rules, now);
    },
  };
}

/** Ein Limiter je Prozess, auch über Dev-HMR hinweg. */
export function getActionLimiter() {
  const key = Symbol.for("platzhirsch.portal.actionLimit");
  if (!globalThis[key]) globalThis[key] = createActionLimiter();
  return globalThis[key];
}
