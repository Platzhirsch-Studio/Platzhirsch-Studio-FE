// src/lib/forms/guard.js
// guardForm(): the common entry check of the four form routes
// (/api/kontakt, /api/beratung_anfrage, /api/anfrage_produkt,
// /api/newsletter_subscribe). Order of the checks:
//   1. rate limit   per IP and route, two buckets               → 429 rate_limited
//                   (a) 20 requests / 10 min: EVERY request (also rejected ones)
//                   (b)  5 requests / 10 min: only requests that pass every
//                        check and are forwarded (checked here, counted at 6.)
//                   IP = X-Forwarded-For of the request, or of the ORIGINAL
//                   request (`outerHeaders`) when a wrapper such as
//                   /api/upload/inquiry/[kind] built a new Request without it.
//   2. body size    Content-Length and the bytes actually read → 413 too_large
//   3. JSON         unreadable body                          → 400 <invalidCode>
//   4. honeypot     `website` not empty                      → fake success
//   5. time trap    `_t` says: filled in under 3 s           → fake success
//                   `_t` = ms SINCE render (recommended, does not depend on the
//                   device clock) or, legacy, Date.now() at render.
//   6. zod schema   allowlist: only known fields are kept    → 400 <invalidCode>
// `website` and `_t` are removed before anything is forwarded.
// Responses to the browser only carry our own codes, never backoffice details.
//
// No "@/..." imports: tested directly with `node --test` (tests/unit/forms*.test.mjs).
// Rate-limit store: see rateLimit.js (in memory, needs pm2 instances: 1).
import { ATTEMPT_LIMIT, DEFAULT_LIMIT, clientIp, formLimiter, ipFromHeaders } from "./rateLimit.js";

export const DEFAULT_MAX_BYTES = 20 * 1024;
export const MIN_FILL_MS = 3000;
// Requests without any client address share one bucket; it is wider so
// several real visitors behind it are not blocked. Since the routes also read
// the original request headers (P1-1), this should only happen in tests.
export const NO_IP_LIMIT = { max: 30, windowMs: DEFAULT_LIMIT.windowMs };
export const NO_IP_ATTEMPT_LIMIT = { max: 120, windowMs: DEFAULT_LIMIT.windowMs };
// `_t` below this value is a duration (ms since render), above it an epoch
// timestamp (1e11 ms after 1970 = 1973; no form is open for three years).
export const DURATION_MAX = 1e11;

const MESSAGES = {
  rate_limited: "Too many requests. Please try again later.",
  too_large: "Payload too large",
  invalid: "Invalid form data",
};

// The 429 text is new (no old caller depends on it) and some forms show
// `error` as it is (Küchenplaner, Beratung), so it is given in the visitor's
// language. No trailing period: the Küchenplaner appends ". Bitte …".
const RATE_LIMITED_TEXT = {
  de: "Zu viele Anfragen in kurzer Zeit, bitte versuchen Sie es in einigen Minuten erneut",
  en: "Too many requests in a short time, please try again in a few minutes",
  fr: "Trop de demandes en peu de temps, veuillez réessayer dans quelques minutes",
  it: "Troppe richieste in poco tempo, riprovi tra qualche minuto",
};

/** Visitor language from Referer path (/de/…) or Accept-Language; default de. */
export function visitorLang(...headerSets) {
  for (const h of headerSets) {
    if (!h || typeof h.get !== "function") continue;
    const ref = h.get("referer");
    if (ref) {
      try {
        const m = new URL(ref).pathname.match(/^\/(de|en|fr|it)(\/|$)/);
        if (m) return m[1];
      } catch {
        /* ignore */
      }
    }
  }
  for (const h of headerSets) {
    if (!h || typeof h.get !== "function") continue;
    const m = (h.get("accept-language") || "").trim().toLowerCase().match(/^(de|en|fr|it)\b/);
    if (m) return m[1];
  }
  return "de";
}

export function errorResponse(code, status, { message, headers, extra } = {}) {
  return Response.json(
    { success: false, code, error: message || MESSAGES[code] || MESSAGES.invalid, ...(extra || {}) },
    { status, headers }
  );
}

function log(route, reason) {
  // No personal data in the log: route and reason only.
  console.warn(`[forms] ${route}: ${reason}`);
}

// Fake successes are invisible to the visitor, so they are counted: a sudden
// rise of "time trap" hits shows false alarms (e.g. a client sending a wrong
// `_t`). Count per route and reason since the process started.
const fakeCounts = new Map();
function countFake(route, kind) {
  const key = `${route}:${kind}`;
  const n = (fakeCounts.get(key) || 0) + 1;
  fakeCounts.set(key, n);
  return n;
}
/** { "<route>:<honeypot|time_trap>": count } since process start. */
export function fakeSuccessStats() {
  return Object.fromEntries(fakeCounts);
}

// Reads the body as text, but stops as soon as more than maxBytes arrived
// (a missing or false Content-Length header does not get around the limit).
export async function readCapped(request, maxBytes) {
  if (!request.body) return { ok: true, text: "" };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      return { ok: false, size };
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(all) };
}

/**
 * Filled in faster than minMs?
 * - `_t` < DURATION_MAX: duration in ms since the form was rendered
 *   (client: Math.round(performance.now() - renderedAt)). Independent of the
 *   device clock, so a wrong clock can never drop a real inquiry.
 * - otherwise legacy epoch ms (Date.now() at render), compared with the server
 *   clock. Future values (device clock ahead) do not count as a bot.
 * Missing, invalid, 0 or negative values never count as a bot.
 */
export function isTooFast(t, now, minMs = MIN_FILL_MS) {
  const n = typeof t === "string" && t.trim() !== "" ? Number(t) : t;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return false;
  if (n < DURATION_MAX) return n < minMs;
  const elapsed = now - n;
  return elapsed >= 0 && elapsed < minMs;
}

/**
 * guardForm(request, schema, options)
 * options:
 *   route         name for log and rate-limit key (required)
 *   limit         { max, windowMs } of forwarded requests, default 5 / 10 min
 *   attemptLimit  { max, windowMs } of all requests, default 20 / 10 min
 *   maxBytes      body limit in bytes, default 20 KB
 *   invalidCode   code for 400 answers, default "invalid"
 *   fakeSuccess   () => object, body of the fake success answer (status 200)
 *   outerHeaders  Headers of the original request (next/headers), used for IP
 *                 and language when `request` was built internally
 *   limiter, now (tests)
 * Returns { ok: true, data } (data = allowlisted, ready to forward) or
 * { ok: false, response, reason } — the route returns `response` as it is.
 */
export async function guardForm(request, schema, options = {}) {
  const {
    route = "form",
    limit = DEFAULT_LIMIT,
    attemptLimit = ATTEMPT_LIMIT,
    maxBytes = DEFAULT_MAX_BYTES,
    invalidCode = "invalid",
    fakeSuccess = () => ({ success: true }),
    outerHeaders = null,
    limiter = formLimiter,
    now = Date.now(),
  } = options;

  const reject = (reason, response) => {
    log(route, reason);
    return { ok: false, reason, response };
  };
  const rateLimited = (retryAfter) =>
    reject(
      "rate_limited",
      errorResponse("rate_limited", 429, {
        message: RATE_LIMITED_TEXT[visitorLang(request.headers, outerHeaders)],
        headers: { "Retry-After": String(retryAfter) },
      })
    );

  // 1. rate limit: (b) forwarded bucket full? (a) count this attempt.
  const ip = clientIp(request) || ipFromHeaders(outerHeaders);
  const key = ip ? `${route}:${ip}` : `${route}:noip`;
  const sendKey = `${key}:send`;
  const sendLimit = ip ? limit : NO_IP_LIMIT;
  const sendState = limiter.peek(sendKey, sendLimit, now);
  if (!sendState.ok) return rateLimited(sendState.retryAfter);
  const attempt = limiter.take(`${key}:any`, ip ? attemptLimit : NO_IP_ATTEMPT_LIMIT, now);
  if (!attempt.ok) return rateLimited(attempt.retryAfter);

  // 2. size
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return reject("too_large", errorResponse("too_large", 413));
  let read;
  try {
    read = await readCapped(request, maxBytes);
  } catch {
    return reject("unreadable body", errorResponse(invalidCode, 400));
  }
  if (!read.ok) return reject("too_large", errorResponse("too_large", 413));

  // 3. JSON object
  let body;
  try {
    body = JSON.parse(read.text);
  } catch {
    return reject("invalid json", errorResponse(invalidCode, 400));
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reject("invalid json", errorResponse(invalidCode, 400));
  }

  // 4. honeypot / 5. time trap: look like success, forward nothing.
  const { website, _t, ...rest } = body;
  if (website !== undefined && website !== null && String(website).trim() !== "") {
    const n = countFake(route, "honeypot");
    return reject(`honeypot -> fake success, not forwarded (#${n})`, Response.json(fakeSuccess(), { status: 200 }));
  }
  if (isTooFast(_t, now)) {
    const n = countFake(route, "time_trap");
    const mode = Number(_t) < DURATION_MAX ? "duration" : "timestamp";
    return reject(`time trap (<3 s, ${mode}) -> fake success, not forwarded (#${n})`, Response.json(fakeSuccess(), { status: 200 }));
  }

  // 6. schema + allowlist (z.object drops unknown keys)
  const parsed = schema.safeParse(rest);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.length ? String(issue.path[0]) : undefined;
    log(route, `invalid field ${field || "?"}`);
    return {
      ok: false,
      reason: "invalid",
      response: errorResponse(invalidCode, 400, {
        message: issue?.message && issue.message.length < 120 ? issue.message : undefined,
        extra: field ? { field } : undefined,
      }),
    };
  }

  // Passed: now it counts against the 5 forwarded requests (b).
  const send = limiter.take(sendKey, sendLimit, now);
  if (!send.ok) return rateLimited(send.retryAfter);
  return { ok: true, data: parsed.data };
}
