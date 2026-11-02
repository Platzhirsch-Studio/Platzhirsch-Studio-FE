// src/lib/agent/rate.js – Rate-Limit des MCP-Servers (pro IP) und des Double-Opt-in.
// Gleiche Logik wie der Concierge (src/lib/concierge/limiter.js: gleitendes
// Fenster, Tagesbudget, Arbeitsspeicher als Ersatz bei Speicherausfall).
// Eigene Instanz und eigene Schlüssel, damit Agenten und Concierge sich nicht
// gegenseitig ausbremsen. Rein: node --test baut sich eine eigene Instanz.
import { createLimiter } from "../concierge/limiter.js";
import { RATE } from "./config.js";

export function createAgentLimiter({ rate = RATE, store, onStoreError } = {}) {
  const limiter = createLimiter({ store, globalPerDay: rate.appointmentsPerDay, onStoreError });
  return {
    /** Jede JSON-RPC-Nachricht. */
    message: (ip, now) => limiter.take([{ key: `agent:${ip}`, rules: [rate.burst, rate.daily] }], { now }),
    /** request_appointment zusätzlich (pro IP + globales Tagesbudget). */
    appointment: (ip, now) =>
      limiter.take([{ key: `agent-appt:${ip}`, rules: [rate.appointmentHour, rate.appointmentDay], reason: "appointment" }], { global: true, now }),
    /** Bestätigungsseite (Vorschau + Bestätigen). */
    confirm: (ip, now) => limiter.take([{ key: `agent-confirm:${ip}`, rules: [rate.confirm] }], { now }),
    setStore: (s) => limiter.setStore(s),
  };
}

/**
 * Client-IP wie im Concierge (src/lib/concierge/rateLimit.js): nginx hängt
 * $remote_addr an X-Forwarded-For, vertrauenswürdig ist der Eintrag
 * `hops` vom Ende (CONCIERGE_PROXY_HOPS, gleiche Einstellung). Ohne Header (Entwicklung) → "local".
 */
export function clientIp(headers, hops = Number(process.env.CONCIERGE_PROXY_HOPS) || 1) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const list = fwd.split(",").map((x) => x.trim()).filter(Boolean);
    const ip = list[Math.max(0, list.length - hops)];
    if (ip) return ip;
  }
  return headers.get("x-real-ip") || "local";
}
