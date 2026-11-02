import "server-only";
import { randomUUID } from "node:crypto";
import { IS_PRODUCTION, SESSION_COOKIE, SESSION_TTL_SECONDS, hasSessionSecret } from "./config";
import { sign, verify } from "./crypto";

// Stateless, HMAC-signed session cookie: { v, sub (customerId), sid, iat, exp }.
// HttpOnly + SameSite=Lax + Secure (production). No personal data in the
// cookie beyond the customer id.

const PURPOSE = "portal-session";

export function createSessionValue(customerId) {
  const now = Math.floor(Date.now() / 1000);
  return sign(PURPOSE, { v: 1, sub: customerId, sid: randomUUID(), iat: now, exp: now + SESSION_TTL_SECONDS });
}

/** @returns {{customerId:string, sessionId:string, issuedAt:number, expiresAt:number}|null} */
export function readSessionValue(value) {
  // Fail closed without the secret: no session instead of a 500 on every page.
  if (!value || !hasSessionSecret()) return null;
  const payload = verify(PURPOSE, value);
  if (!payload || payload.v !== 1 || typeof payload.sub !== "string") return null;
  return { customerId: payload.sub, sessionId: payload.sid, issuedAt: payload.iat, expiresAt: payload.exp };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
  priority: "high",
};

/** Sets the session cookie on a NextResponse. */
export function attachSession(response, customerId) {
  response.cookies.set(SESSION_COOKIE, createSessionValue(customerId), sessionCookieOptions);
  return response;
}

export function clearSession(response) {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
