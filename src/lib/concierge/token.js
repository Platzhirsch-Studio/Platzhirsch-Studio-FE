// src/lib/concierge/token.js
// Signed consent token. The chat route only answers requests that carry a
// token issued after the visitor accepted the current consent text. Format:
// base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, secret)).
// Secret: CONCIERGE_SECRET (server only). In development a fixed fallback is
// used with a warning; in production a missing secret disables the feature.
import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { CONSENT_TTL_MS, CONSENT_VERSION, IS_PROD } from "./config";

let warned = false;

function getSecret() {
  const secret = process.env.CONCIERGE_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (IS_PROD) return null;
  if (!warned) {
    console.warn("[concierge] CONCIERGE_SECRET fehlt oder ist kürzer als 32 Zeichen – Entwicklungs-Fallback aktiv. In Produktion setzen!");
    warned = true;
  }
  return "dev-only-concierge-secret-do-not-use-in-production";
}

export function isTokenConfigured() {
  return getSecret() !== null;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const sign = (data, secret) => createHmac("sha256", secret).update(data).digest();

// store: visitor also agreed to keep the transcript (optional second box).
// mode: "mock" | "live" – the consent text differs (mock: nothing goes to
// Anthropic), so a token is only valid for the mode it was given for.
export function issueToken({ store, mode }) {
  const secret = getSecret();
  if (!secret) throw new Error("CONCIERGE_SECRET not configured");
  const payload = {
    v: CONSENT_VERSION,
    sid: b64(randomBytes(12)),
    iat: Date.now(),
    st: store ? 1 : 0,
    m: mode === "live" ? "live" : "mock",
  };
  const data = b64(JSON.stringify(payload));
  return { token: `${data}.${b64(sign(data, secret))}`, payload };
}

// Returns the payload or null. allowStale: accept expired tokens and older
// consent versions (signature still required) – only for revoking/deleting,
// so a visitor can always withdraw consent for a session that was theirs.
export function verifyToken(token, { allowStale = false } = {}) {
  const secret = getSecret();
  if (!secret || typeof token !== "string" || token.length > 400) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (typeof payload.sid !== "string" || typeof payload.iat !== "number") return null;
    if (allowStale) return payload;
    if (payload.v !== CONSENT_VERSION) return null;
    if (Date.now() - payload.iat > CONSENT_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

// Website-agent proposals (actions.js): id + HMAC over id, session and expiry.
// The browser only checks the format; the server checks the signature when the
// outcome comes back in the next <seitenkontext> (ctx.actions), so a forged
// "ausgeführt" from another session is dropped.
export function signAction({ id, sid, exp }) {
  const secret = getSecret();
  if (!secret) return null;
  return b64(sign(`act|${id}|${sid}|${exp}`, secret)).slice(0, 32);
}

export function verifyActionSig({ id, sig, exp }, sid) {
  const expected = signAction({ id, sid, exp });
  if (!expected || typeof sig !== "string" || sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
