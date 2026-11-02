// src/lib/upload/http.js — small helpers for the /api/upload route handlers.
import "server-only";
import { NextResponse } from "next/server";
import { UploadError } from "./service";
import { UPLOAD_CONFIG } from "./config";
import { createMemoryStore, withFallback, sharedStoreMismatch } from "./limitStore";

const NO_STORE = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function fail(error) {
  if (error instanceof UploadError) return json({ ok: false, error: error.code }, error.status);
  console.error("[upload]", error);
  return json({ ok: false, error: "server_error" }, 500);
}

// Rate limits: sliding window behind a store (limitStore.js). Default is the
// memory of this server instance, which fits production as it runs today
// (pm2, one instance). The real gate is the signed inquiry ticket; these
// limits only slow down scripted replays and floods. With several instances
// call setUploadLimitStore(createSharedStore(exec)) once at start-up, see
// the feature doc ("Live-Einsatz"). A failing OR hanging shared store falls
// back to memory after UPLOAD_CONFIG.rateLimits.storeTimeoutMs (withFallback,
// logged at most once a minute), so uploads keep working.
const STORE_KEY = Symbol.for("platzhirsch.upload.limitStore");
const state = globalThis[STORE_KEY] || (globalThis[STORE_KEY] = { memory: createMemoryStore(), store: null, checked: false });

export function setUploadLimitStore(store) {
  if (store && typeof store.take !== "function") throw new TypeError("setUploadLimitStore: store.take fehlt");
  state.store = store ? withFallback(store, state.memory, { timeoutMs: UPLOAD_CONFIG.rateLimits.storeTimeoutMs }) : null;
}
export function uploadLimitStoreName() {
  return (state.store || state.memory).name;
}

/** Counts one request; resolves true when the key is over `limit` within `windowMs`. */
export async function rateLimited(key, limit, windowMs) {
  if (!state.checked) {
    // QM fix2 P2-2: env says "shared", but nobody called setUploadLimitStore.
    state.checked = true;
    const mismatch = process.env.NODE_ENV === "production" && sharedStoreMismatch(process.env, uploadLimitStoreName());
    if (mismatch) console.error(mismatch);
  }
  return (state.store || state.memory).take(key, limit, windowMs, Date.now());
}

/**
 * Per-link guard for the upload endpoints (scripted floods with one valid
 * link). Limits: UPLOAD_CONFIG.rateLimits.link.
 * Resolves to a 429 response or null.
 */
const LINK = UPLOAD_CONFIG.rateLimits.link;
export const LINK_LIMITS = { init: LINK.init, chunk: LINK.chunk, note: LINK.note, remove: LINK.remove };
export async function linkLimited(token, op) {
  const key = `link:${op}:${String(token).slice(-22)}`;
  if (!(await rateLimited(key, LINK_LIMITS[op] || 100, LINK.windowMs))) return null;
  return NextResponse.json(
    { ok: false, error: "rate_limited" },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(LINK.retryAfterSeconds) } },
  );
}

/**
 * Client IP for rate limits — only from a header our own reverse proxy sets
 * and overwrites (UPLOAD_TRUSTED_IP_HEADER, e.g. "x-real-ip"). Without that
 * setting a client could fake X-Forwarded-For, so every request shares one
 * key ("untrusted") and only the global limits apply.
 */
export function clientIp(request) {
  const header = process.env.UPLOAD_TRUSTED_IP_HEADER;
  if (!header) return "untrusted";
  const value = request.headers.get(header.toLowerCase()) || "";
  return value.split(",").pop().trim() || "untrusted";
}

/** Same-origin check for the mint endpoint (blocks cross-site form posts). */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
