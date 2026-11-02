// src/lib/api/produktDetail.js
// R5-produkt (P2): one product detail record from the backoffice, with a hard
// line between "does not exist" and "could not ask".
//
//   found        → the record (object)
//   not found    → null           → the page calls notFound() (404)
//   any failure  → throws BackofficeError → error.js, HTTP 500, nothing cached
//
// Before R5 every failure (timeout, 5xx, broken JSON) came back as null too,
// so a slow backend turned real product pages into 404s (17 sitemap URLs once
// under load) – Google may drop a URL on a 404, but retries a 500.
//
// What counts as "not found" (checked against the live API, 26.10.2026):
//   - HTTP 200 with no or an empty `message` (Frappe answers `{}` for an
//     unknown path_field),
//   - HTTP 404.
// Everything else is a failure: timeout/network error (after backofficeFetch's
// retry inside the budget), 5xx, any other non-ok status, a body that is not
// JSON, a `message` that is not an object.
// Nothing is cached on failure: Next's data cache stores only 200 responses
// (node_modules/next/dist/server/lib/patch-fetch.js), backofficeFetch drops a
// failed in-flight call, and a render that throws is not written as an ISR
// page (the last good version stays).
//
// Pure module (relative import only, no "server-only"), so node --test can run
// it with a mocked backofficeFetch (`fetcher`).
import { BackofficeError, backofficeFetch, describeUrl } from "./http.js";

function failure(url, reason, extra = {}) {
  const { endpoint } = describeUrl(url);
  const status = extra.status ?? null;
  return new BackofficeError(`Backoffice ${endpoint}: ${reason}${status ? ` ${status}` : ""}`, {
    endpoint,
    status,
    reason,
    cause: extra.cause,
  });
}

/**
 * @param {string} url  full get_produkt_by_path_field_api URL
 * @param {object} [options]  backofficeFetch options (next, timeoutMs, budgetMs, …)
 * @param {Function} [options.fetcher]  injected for tests (default backofficeFetch)
 * @returns {Promise<object|null>}
 */
export async function fetchProduktDetail(url, { fetcher = backofficeFetch, ...options } = {}) {
  let response;
  try {
    // critical: false → backofficeFetch hands back non-ok responses, so a 404
    // can be told apart from a 5xx here.
    response = await fetcher(url, { method: "GET", ...options, critical: false });
  } catch (err) {
    if (err instanceof BackofficeError) throw err;
    const reason = err?.name === "TimeoutError" || err?.name === "AbortError" ? "timeout" : "network_error";
    throw failure(url, reason, { cause: err });
  }

  if (response.status === 404) return null;
  if (!response.ok) throw failure(url, "http_error", { status: response.status });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw failure(url, "invalid_json", { status: response.status, cause: err });
  }

  const message = data?.message;
  if (message === undefined || message === null || message === "") return null;
  if (typeof message !== "object" || Array.isArray(message)) {
    throw failure(url, "unexpected_payload", { status: response.status });
  }
  return Object.keys(message).length ? message : null;
}
