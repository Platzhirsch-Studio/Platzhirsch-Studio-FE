// src/lib/einblicke/receive.server.js – Prüfung eines Beacons an /api/einblicke
// (Konzept §4.1). Die Route antwortet IMMER 204 (außer 413 bei > 16 KB);
// ob gespeichert wird, entscheidet nur diese Funktion.
//
// Verworfen: DNT: 1 / Sec-GPC: 1, Sec-Fetch-Site cross-site, fremder Origin
// bzw. Referer, KEIN Origin ohne Sec-Fetch-Site same-origin (requireOrigin,
// src/lib/forms/origin.js; sendBeacon/fetch senden beides – curl ohne Header
// nicht, QA Technik P2-2), Bot-User-Agent, Schalter aus, keine Einwilligung
// "einblicke" im mitgesendeten Consent-Cookie (zweite Sicherung, QA Recht P3-1),
// mehr als 120 Pakete/Minute im Prozess, mehr als 12 je sid und Minute, mehr
// als 300 Pakete je sid und Tag, ungültiges Paket (schema.js). Gelesen werden
// nur diese Header – IP,
// User-Agent, Referrer und Cookies werden nie gespeichert oder geloggt; das
// Rate-Limit kennt keine IP.
import { einblickeOn, LIMITS, SERVER } from "./config.js";
import { parsePacket } from "./schema.js";
import { isSameOriginRequest } from "../forms/origin.js";
import { einblickeConsentOf, readConsent } from "../attribution.js";

export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python|httpclient|axios|node-fetch|go-http|java\/|phantom|puppeteer|playwright-bot/i;

/** Prozess-Zähler: Pakete je Minute (gesamt und je sid) und je sid × Tag. */
export function createLimiter() {
  let windowStart = 0;
  let count = 0;
  let day = "";
  const perSid = new Map();
  const perSidMinute = new Map();
  return {
    take(sid, now = Date.now(), today = new Date(now).toISOString().slice(0, 10)) {
      if (now - windowStart >= 60_000) {
        windowStart = now;
        count = 0;
        perSidMinute.clear();
      }
      if (today !== day) {
        day = today;
        perSid.clear();
      }
      // Erst je sid: eine einzelne (falsche) sid verbraucht nicht das Gesamtlimit.
      const m = (perSidMinute.get(sid) || 0) + 1;
      if (perSidMinute.size > 50_000 && !perSidMinute.has(sid)) return false;
      perSidMinute.set(sid, m);
      if (m > SERVER.packetsPerSidMinute) return false;
      count += 1;
      if (count > SERVER.packetsPerMinute) return false;
      const n = (perSid.get(sid) || 0) + 1;
      if (perSid.size > 50_000 && !perSid.has(sid)) return false;
      perSid.set(sid, n);
      return n <= SERVER.packetsPerSidDay;
    },
  };
}

/** Body als Text, höchstens `limit` Bytes; null = zu groß (Stream wird abgebrochen). */
export async function readLimited(request, limit = LIMITS.packetBytes) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

/** Header-Prüfung ohne Body. → Grund (string) oder null (weiter). */
export function rejectReason(headers, env = process.env) {
  if (!einblickeOn(env.NEXT_PUBLIC_EINBLICKE, env.NODE_ENV)) return "aus";
  if ((headers.get("dnt") || "").trim() === "1") return "dnt";
  if ((headers.get("sec-gpc") || "").trim() === "1") return "gpc";
  if (BOT_UA.test(headers.get("user-agent") || "")) return "bot";
  if (!isSameOriginRequest({ headers }, { requireOrigin: true, env })) return "origin";
  if (!einblickeConsentOf(readConsent(headers.get("cookie") || ""))) return "consent";
  return null;
}

/**
 * receive(request, { limiter, env, now }) → { status, packet?, reason? }
 * status 413 nur bei Übergröße, sonst 204. `packet` nur, wenn gespeichert werden darf.
 */
export async function receive(request, { limiter, env = process.env, now = Date.now() } = {}) {
  let text;
  try {
    text = await readLimited(request);
  } catch {
    text = "";
  }
  if (text === null) return { status: 413, reason: "groesse" };
  const reason = rejectReason(request.headers, env);
  if (reason) return { status: 204, reason };
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { status: 204, reason: "json" };
  }
  const packet = parsePacket(json);
  if (!packet) return { status: 204, reason: "schema" };
  if (limiter && !limiter.take(packet.sid, now)) return { status: 204, reason: "limit" };
  return { status: 204, packet };
}
