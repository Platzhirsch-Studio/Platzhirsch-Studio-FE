// src/lib/api/http.js
// One door to the Frappe backoffice for every fetcher in src/lib/api/**.
//
// backofficeFetch(url, options) is a drop-in for fetch():
// - Next's cache options (`next: { revalidate, tags }`, `cache`) and every other
//   RequestInit field are passed through untouched.
// - Each attempt gets its own AbortSignal.timeout(timeoutMs), so a stalled
//   backend can never hang a render again (a dev run once took 4.7 min).
//   Note: a fetch with a signal is not memoized per render pass by Next (see
//   node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md,
//   "Memoization"); the persistent data cache (revalidate/tags) still applies.
// - GET/HEAD/OPTIONS are retried `retries` times on timeouts, network errors
//   and 5xx. 4xx is never retried (the request itself is wrong).
// - budgetMs caps the TOTAL time of all attempts (incl. the retry delay): each
//   attempt gets min(timeoutMs, time left), and no retry starts with less than
//   MIN_ATTEMPT_MS left. The four fetchers that had one 15 s limit now run
//   2 x 7 s inside a 15 s budget, so their worst case stays <= 15 s.
// - In-flight dedupe per request: identical GET/HEADs without body or caller
//   signal in the same render pass (layout + generateMetadata + page) share ONE
//   backend call, which restores Next's per-render memoization that a signal
//   switches off. The scope comes from React cache(): per request in a server
//   render, a fresh Map (= no sharing) everywhere else, so nothing is ever
//   shared across requests and every request keeps registering its own
//   revalidate/tags with Next's data cache.
// - Every failure, retry and slow call writes ONE structured JSON log line
//   (endpoint, query parameter NAMES only, status, ms, attempt). Query values
//   are never logged: they can carry search terms or secrets.
// - critical: false (default) behaves like fetch(): a non-ok Response is
//   returned, a network error/timeout is re-thrown, so the callers' existing
//   try/catch fallbacks stay exactly as they were.
//   critical: true throws a BackofficeError on non-ok, timeout or network
//   error, and backofficeMessage() additionally throws on an empty payload —
//   so a page can fail (and keep its last good ISR version) instead of
//   caching an empty backoffice answer.
//
// Pure module: no "server-only", no "@/" imports, so node --test can load it.

import { cache } from "react";

export const DEFAULT_TIMEOUT_MS = 6000;
export const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 250;
const MIN_ATTEMPT_MS = 1000;
const SLOW_MS = 2000;
const IDEMPOTENT = new Set(["GET", "HEAD", "OPTIONS"]);
const FRAPPE_PREFIX = /^\/api\/method\/(?:platzhirsch_studio\.platzhirsch_studio\.doctype\.)?/;

export class BackofficeError extends Error {
  constructor(message, { endpoint, status = null, attempts, reason, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "BackofficeError";
    this.endpoint = endpoint;
    this.status = status;
    this.attempts = attempts;
    this.reason = reason;
  }
}

// "https://host/api/method/platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data?x=1"
// -> { endpoint: "news.api.news_data", query: ["x"] }. Never returns values.
export function describeUrl(url) {
  try {
    const u = new URL(String(url));
    return {
      endpoint: u.pathname.replace(FRAPPE_PREFIX, "") || "/",
      query: [...new Set(u.searchParams.keys())],
    };
  } catch {
    // e.g. "undefined/api/method/..." when SERVER is not configured.
    const path = String(url).split("?")[0].split("#")[0];
    return { endpoint: path.replace(/^.*(?=\/api\/method\/)/, "").replace(FRAPPE_PREFIX, "") || "invalid-url", query: [] };
  }
}

function log(logger, level, fields) {
  const line = JSON.stringify({ src: "backoffice", level, ...fields });
  const fn = (logger && (logger[level] || logger.log)) || console.log;
  try {
    fn.call(logger, line);
  } catch {
    // Logging must never break a render.
  }
}

function isTimeout(err) {
  return err?.name === "TimeoutError" || err?.name === "AbortError";
}

function wait(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function attemptSignal(timeoutMs, callerSignal) {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeout;
  return typeof AbortSignal.any === "function" ? AbortSignal.any([callerSignal, timeout]) : callerSignal;
}

// Per-request map of in-flight GETs (see header). Outside a React server render
// cache() does not memoize, so every call gets a fresh Map and nothing is shared.
const requestScope = cache(() => new Map());

function dedupeKey(url, method, init, critical) {
  return JSON.stringify([method, String(url), init.cache || null, init.next || null, init.headers || null, critical]);
}

async function snapshot(response) {
  const body = response.status === 204 || response.status === 304 || response.body == null ? null : await response.arrayBuffer();
  return { body, status: response.status, statusText: response.statusText, headers: [...response.headers] };
}

function fromSnapshot(snap) {
  return new Response(snap.body === null ? null : snap.body.slice(0), {
    status: snap.status,
    statusText: snap.statusText,
    headers: snap.headers,
  });
}

export async function backofficeFetch(url, options = {}) {
  const { dedupe = true, dedupeScope, signal, critical = false, ...rest } = options;
  const method = String(rest.method || "GET").toUpperCase();
  if (!dedupe || signal || rest.body != null || (method !== "GET" && method !== "HEAD")) {
    return fetchWithRetry(url, options);
  }
  let scope;
  try {
    scope = dedupeScope || requestScope();
  } catch {
    return fetchWithRetry(url, options);
  }
  const key = dedupeKey(url, method, rest, critical);
  let shared = scope.get(key);
  if (!shared) {
    shared = fetchWithRetry(url, options).then(snapshot);
    scope.set(key, shared);
    // A failed call is not handed to later renders of the same request.
    shared.catch(() => scope.delete(key));
  }
  return fromSnapshot(await shared);
}

async function fetchWithRetry(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    budgetMs = Infinity,
    retries = DEFAULT_RETRIES,
    critical = false,
    retryDelayMs = RETRY_DELAY_MS,
    minAttemptMs = MIN_ATTEMPT_MS,
    slowMs = SLOW_MS,
    logger = console,
    fetchImpl,
    signal: callerSignal,
    dedupe: _dedupe,
    dedupeScope: _dedupeScope,
    ...init
  } = options;
  const t0 = Date.now();
  const left = () => Number(budgetMs) - (Date.now() - t0);

  const doFetch = fetchImpl || globalThis.fetch;
  const method = String(init.method || "GET").toUpperCase();
  const maxAttempts = 1 + (IDEMPOTENT.has(method) ? Math.max(0, Number(retries) || 0) : 0);
  const { endpoint, query } = describeUrl(url);
  const verbose = typeof process !== "undefined" && process.env?.BACKOFFICE_LOG === "verbose";
  const base = { endpoint, query, method };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const started = Date.now();
    const attemptMs = Math.max(1, Math.min(Number(timeoutMs), left()));
    // Evaluated after the attempt: retry only if a useful attempt still fits the budget.
    const fits = () => attempt < maxAttempts && left() - retryDelayMs >= minAttemptMs;
    let response;

    try {
      response = await doFetch(url, { ...init, signal: attemptSignal(attemptMs, callerSignal) });
    } catch (err) {
      const ms = Date.now() - started;
      const reason = isTimeout(err) ? "timeout" : "network_error";
      // A caller-initiated abort is not ours to retry.
      const callerAborted = callerSignal?.aborted === true;
      const retrying = fits() && !callerAborted;
      log(logger, retrying ? "warn" : "error", {
        ...base, status: null, ms, attempt, of: maxAttempts,
        outcome: retrying ? "retry" : reason,
        ...(reason === "timeout" ? { timeoutMs: attemptMs } : { error: err?.name || "Error" }),
      });
      if (retrying) {
        await wait(retryDelayMs);
        continue;
      }
      if (critical) {
        throw new BackofficeError(`Backoffice ${endpoint}: ${reason}`, { endpoint, attempts: attempt, reason, cause: err });
      }
      throw err;
    }

    const ms = Date.now() - started;
    const { status } = response;

    if (response.ok) {
      if (ms >= slowMs) log(logger, "warn", { ...base, status, ms, attempt, of: maxAttempts, outcome: "slow" });
      else if (verbose) log(logger, "info", { ...base, status, ms, attempt, of: maxAttempts, outcome: "ok" });
      return response;
    }

    const retrying = fits() && status >= 500;
    log(logger, retrying ? "warn" : "error", {
      ...base, status, ms, attempt, of: maxAttempts, outcome: retrying ? "retry" : "http_error",
    });
    if (retrying) {
      try {
        await response.body?.cancel?.();
      } catch {
        // body already consumed or not cancelable
      }
      await wait(retryDelayMs);
      continue;
    }
    if (critical) {
      throw new BackofficeError(`Backoffice ${endpoint}: HTTP ${status}`, { endpoint, status, attempts: attempt, reason: "http_error" });
    }
    return response;
  }

  // Unreachable: the loop always returns or throws.
  throw new BackofficeError(`Backoffice ${endpoint}: no attempt made`, { endpoint, attempts: 0, reason: "none" });
}

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

// Frappe answers { message: ... }. Returns `message`, or `fallback` when the
// call fails or the message is empty — unless critical: true, then it throws
// instead (so ISR keeps the last good page rather than caching emptiness).
// Not used by the fetchers yet (their return contracts stay unchanged in R1).
export async function backofficeMessage(url, { fallback = null, ...options } = {}) {
  const critical = options.critical === true;
  try {
    const response = await backofficeFetch(url, options);
    if (!response.ok) return fallback;
    const data = await response.json();
    if (isEmpty(data?.message)) {
      if (critical) {
        const { endpoint } = describeUrl(url);
        throw new BackofficeError(`Backoffice ${endpoint}: empty message`, { endpoint, status: response.status, reason: "empty" });
      }
      return fallback;
    }
    return data.message;
  } catch (err) {
    if (critical) {
      if (err instanceof BackofficeError) throw err;
      const { endpoint } = describeUrl(url);
      throw new BackofficeError(`Backoffice ${endpoint}: invalid response`, { endpoint, reason: "invalid_json", cause: err });
    }
    return fallback;
  }
}
