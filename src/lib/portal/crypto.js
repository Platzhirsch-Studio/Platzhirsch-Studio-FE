import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "./config";

// Small signing helpers (HMAC-SHA256). Purpose strings separate the key
// usages, so a magic-link token can never be replayed as a session cookie.

function hmac(purpose, value) {
  return createHmac("sha256", sessionSecret()).update(`${purpose}:${value}`).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Keyed hash for storing tokens at rest (the raw token is never stored). */
export function tokenDigest(token) {
  return hmac("magic-digest", token);
}

/** Serialises `payload` as base64url JSON and appends an HMAC. */
export function sign(purpose, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${hmac(purpose, body)}`;
}

/** Returns the payload, or null if the signature or `exp` (seconds) fails. */
export function verify(purpose, value) {
  if (typeof value !== "string" || value.length > 4096) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!safeEqual(sig, hmac(purpose, body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload?.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
