// src/lib/upload/inquiry.js — logic of POST /api/upload/inquiry/<kind>, kept
// free of Next.js and "@/..." imports so node --test can check it directly
// (tests/unit/upload-inquiry.test.mjs). The route file only wires it up.
//
// 1. The request is handed UNCHANGED (same body) to the existing form route
//    handler, now WITH the visitor's proxy headers (X-Forwarded-For,
//    X-Real-IP, Referer, Accept-Language, User-Agent) so its rate limit and
//    language detection see the real visitor (R1-formulare, open point 1).
// 2. Only a real success gets a signed "Anfrage-Ticket" (`upload.ticket`).
//    Honeypot and time-trap hits are answered by the form route with a fake
//    success (no backoffice call); they get NO ticket, otherwise a bot would
//    get an upload link for an inquiry that never existed (QA P1-3).
// 3. If anything on the upload side fails, the form answer passes through as
//    it is: the inquiry never depends on the upload feature.

import { uploadsAccepting } from "./config.js";

export const MAX_RAW_BYTES = 200_000;
export const MIN_FILL_MS = 3000; // same rule as src/lib/forms/guard.js (isTooFast)
const DURATION_MAX = 1e11;

export const FORMS = {
  produkt: { route: "anfrage_produkt", emailField: "anfrage_email" },
  beratung: { route: "beratung_anfrage", emailField: "email" },
  kontakt: { route: "kontakt", emailField: "email_address" },
};

/** Headers of the visitor request that the form routes need. */
export const PASS_HEADERS = ["x-forwarded-for", "x-real-ip", "x-forwarded-proto", "x-forwarded-host", "referer", "accept-language", "user-agent", "origin"];

const EMAIL_RE = /^[^\s@]+@[^\s@]{1,190}\.[^\s@]{2,}$/;
const LEAD_RE = /^[\w .\-/#]{1,140}$/;

/** Request for the inner form handler: same URL and body, visitor headers kept. */
export function forwardedRequest(request, raw) {
  const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
  for (const name of PASS_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Request(request.url, { method: "POST", headers, body: raw });
}

/** Backoffice document name, if the Frappe API returns one (today it mostly does not). */
export function leadRefOf(result) {
  const candidates = [result?.data?.message?.name, result?.data?.name, result?.message?.name];
  return candidates.find((c) => typeof c === "string" && LEAD_RE.test(c)) || null;
}

/**
 * Was this body caught by the honeypot or the time trap of the form route?
 * Mirrors guardForm: `website` filled, or `_t` = duration (< 1e11 ms) below
 * 3 s, or a legacy timestamp less than 3 s in the past.
 */
export function isTrapped(body, now = Date.now()) {
  if (!body || typeof body !== "object") return false;
  const { website, _t } = body;
  if (website !== undefined && website !== null && String(website).trim() !== "") return true;
  const n = typeof _t === "string" && _t.trim() !== "" ? Number(_t) : _t;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return false;
  if (n < DURATION_MAX) return n < MIN_FILL_MS;
  const elapsed = now - n;
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

function jsonResponse(data, status) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

/**
 * handleInquiry(request, kind, { handlers, sign, now, log })
 *   handlers: { produkt, beratung, kontakt } → async (Request) => Response
 *   sign:     ({ kind, leadRef, email }) => ticket string
 *   accepting: upload open? (default uploadsAccepting(); false = never a ticket,
 *              the form answer passes through unchanged, r1-recht-inhalt P0-4)
 */
export async function handleInquiry(request, kind, { handlers, sign, now = Date.now(), log = console, accepting = uploadsAccepting() } = {}) {
  const form = Object.hasOwn(FORMS, kind) ? FORMS[kind] : null;
  const handler = form && handlers?.[kind];
  if (!handler) return jsonResponse({ success: false, code: "unknown_form", error: "Unknown form" }, 404);

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_RAW_BYTES) return jsonResponse({ success: false, code: "too_large", error: "Payload too large" }, 413);
  const raw = await request.text();
  if (raw.length > MAX_RAW_BYTES) return jsonResponse({ success: false, code: "too_large", error: "Payload too large" }, 413);

  const response = await handler(forwardedRequest(request, raw));

  let result;
  try {
    result = await response.clone().json();
  } catch {
    return response;
  }
  if (!response.ok || !result?.success) return response;
  if (!accepting) return response; // upload paused → no link, the inquiry itself is unaffected

  let body = null;
  try {
    body = JSON.parse(raw);
  } catch {
    /* the form route validated the body already */
  }
  if (isTrapped(body, now)) return response; // fake success → no upload link

  try {
    const value = body?.[form.emailField];
    const email = typeof value === "string" && EMAIL_RE.test(value.trim()) ? value.trim().slice(0, 200) : null;
    const ticket = sign({ kind, leadRef: leadRefOf(result), email });
    return jsonResponse({ ...result, upload: { ticket } }, response.status);
  } catch (error) {
    log.error?.("[upload] ticket", error);
    return response;
  }
}
