// src/lib/booking/http.js – gemeinsame Bausteine der /api/termin/*-Routen.
// Herkunft: wie der Portal-Fix (src/lib/portal/http.js). Die Verwaltungsseite
// hat referrer "no-referrer" (Token im Fragment), Browser schicken dann bei
// POST `Origin: null` – dann entscheidet Sec-Fetch-Site. Erlaubte Hosts wie
// bei den Formularen (src/lib/forms/origin.js: eigener Host, Produktion,
// FORM_ALLOWED_ORIGINS). Rate-Limit im Speicher dieses Prozesses
// (src/lib/forms/rateLimit.js, PM2 fork, 1 Instanz). Keine "@/..."-Importe.
import { createHash } from "node:crypto";
import { SITE_URL } from "../site.js";
import { allowedHosts } from "../forms/origin.js";
import { clientIp, createRateLimiter } from "../forms/rateLimit.js";

export const NO_STORE = { "Cache-Control": "no-store" };
export const MAX_BODY = 8 * 1024;
export const MIN_FILL_MS = 3000;

export const LIMITS = {
  slots: { max: 60, windowMs: 60_000 },
  book: { max: 5, windowMs: 10 * 60_000 },
  bookEmail: { max: 3, windowMs: 60 * 60_000 },
  manage: { max: 30, windowMs: 10 * 60_000 },
  change: { max: 8, windowMs: 10 * 60_000 },
  confirm: { max: 10, windowMs: 10 * 60_000 },
};

export const limiter = globalThis.__phTerminLimiter || (globalThis.__phTerminLimiter = createRateLimiter());

export function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function fail(code, status, extra = {}) {
  return json({ ok: false, code, ...extra }, status);
}

/**
 * Same-Origin-Prüfung für POST:
 *   Sec-Fetch-Site cross-site/same-site → nein
 *   Origin vorhanden (≠ "null")         → Host muss erlaubt sein
 *   Origin "null" oder fehlt            → Sec-Fetch-Site same-origin|none,
 *                                         ohne Sec-Fetch-Site nur ohne Origin
 *                                         (Server, curl, node --test)
 */
export function isSameOrigin(request, env = process.env) {
  const h = request.headers;
  const site = (h.get("sec-fetch-site") || "").trim().toLowerCase();
  if (site === "cross-site" || site === "same-site") return false;
  const origin = (h.get("origin") || "").trim();
  if (origin && origin !== "null") {
    try {
      return allowedHosts([h], env).has(new URL(origin).host.toLowerCase());
    } catch {
      return false;
    }
  }
  if (site) return site === "same-origin" || site === "none";
  return origin !== "null";
}

/** Rate-Limit je IP (ohne bekannte IP: ein gemeinsamer Eimer). */
export function limited(request, name, now = Date.now()) {
  const ip = clientIp(request) || "unknown";
  const r = limiter.take(`termin:${name}:${ip}`, LIMITS[name], now);
  return r.ok ? null : r.retryAfter;
}

export function limitedKey(key, name, now = Date.now()) {
  const r = limiter.take(`termin:${name}:${key}`, LIMITS[name], now);
  return r.ok ? null : r.retryAfter;
}

export const hashOf = (s) => createHash("sha256").update(String(s).toLowerCase().trim()).digest("hex").slice(0, 24);

/** JSON-Body mit Größenlimit; null bei Fehler. */
export async function readJsonBody(request, max = MAX_BODY) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  const len = Number(request.headers.get("content-length") || 0);
  if (len > max) return null;
  const text = await request.text().catch(() => null);
  if (text == null || Buffer.byteLength(text) > max) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Basis für Links in Mails/Antworten: BOOKING_PUBLIC_BASE_URL, Produktion SITE_URL, sonst eigener Host. */
export function publicOrigin(request, env = process.env) {
  if (env.BOOKING_PUBLIC_BASE_URL) return env.BOOKING_PUBLIC_BASE_URL.replace(/\/+$/, "");
  if (env.NODE_ENV === "production") return SITE_URL;
  try {
    const u = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || u.host;
    const proto = request.headers.get("x-forwarded-proto") || u.protocol.replace(":", "");
    return `${proto}://${host.split(",")[0].trim()}`;
  } catch {
    return "http://localhost:3000";
  }
}

/** Honeypot gefüllt oder Ablauf schneller als 3 s (`t` = ms seit Schritt 1, vom Client) → Bot. */
export function isTrapped(body) {
  if (body?.website && String(body.website).trim()) return true;
  return typeof body?.t === "number" && body.t < MIN_FILL_MS;
}
