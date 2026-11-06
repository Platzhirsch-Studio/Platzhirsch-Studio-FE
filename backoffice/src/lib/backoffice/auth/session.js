// HMAC-signierte Sitzungscookies (Muster: src/lib/portal/session.js + crypto.js der
// Website, kopiert und angepasst). Cookie-Inhalt: { v, sub, name, roles, sid, ap, iat, exp }.
// HttpOnly, SameSite=Lax, Secure in Produktion. Die Frappe-sid liegt NIE im
// Cookie, sondern im serverseitigen Store (store.js) unter `sid`.
// Idle-Timeout (60 min / 15 min Kiosk) prüft der Store über lastSeen.
// Reines Modul (node:crypto), testbar.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { IS_PRODUCTION, SESSION_COOKIE, SESSION_TTL_SECONDS, hasSessionSecret, sessionSecret } from "../config.js";

const PURPOSE = "backoffice-session";

function hmac(purpose, value, secret) {
  return createHmac("sha256", secret ?? sessionSecret()).update(`${purpose}:${value}`).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function sign(purpose, payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${hmac(purpose, body, secret)}`;
}

export function verify(purpose, value, secret, now = Date.now()) {
  if (typeof value !== "string" || value.length > 8192) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!safeEqual(sig, hmac(purpose, body, secret))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload?.exp === "number" && payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Erzeugt den Cookie-Wert einer neuen Sitzung.
 * @param {{user:string, name:string, roles:string[], arbeitsplatz?:string, ttlSeconds?:number}} s
 * @returns {{value:string, sid:string, exp:number}}
 */
export function createSessionValue({ user, name, roles, arbeitsplatz, ttlSeconds = SESSION_TTL_SECONDS, sid = randomUUID(), now = Date.now(), secret } = {}) {
  const iat = Math.floor(now / 1000);
  const exp = iat + ttlSeconds;
  const payload = { v: 1, sub: user, name: name || user, roles: Array.isArray(roles) ? roles : [], sid, ap: arbeitsplatz || null, iat, exp };
  return { value: sign(PURPOSE, payload, secret), sid, exp };
}

/**
 * Liest den Cookie-Wert. Ohne Secret (Produktion) immer null: fail-closed.
 * @returns {{user:string, name:string, roles:string[], sid:string, arbeitsplatz:string|null, issuedAt:number, expiresAt:number}|null}
 */
export function readSessionValue(value, { secret, now = Date.now(), secretOk = hasSessionSecret() } = {}) {
  if (!value || !secretOk) return null;
  const p = verify(PURPOSE, value, secret, now);
  if (!p || p.v !== 1 || typeof p.sub !== "string" || typeof p.sid !== "string") return null;
  return { user: p.sub, name: p.name || p.sub, roles: Array.isArray(p.roles) ? p.roles : [], sid: p.sid, arbeitsplatz: p.ap || null, issuedAt: p.iat, expiresAt: p.exp };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
  priority: "high",
};

export { SESSION_COOKIE };
