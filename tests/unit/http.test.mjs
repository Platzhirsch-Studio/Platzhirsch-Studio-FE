// node --test tests/unit/http.test.mjs
// Unit tests for src/lib/api/http.js (backofficeFetch) with a mocked globalThis.fetch.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  backofficeFetch,
  backofficeMessage,
  BackofficeError,
  describeUrl,
} from "../../src/lib/api/http.js";

const URL_ = "https://backoffice.example/api/method/platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data?q=secret-term&token=abc";
const realFetch = globalThis.fetch;
let calls;
let lines;
const logger = {
  info: (l) => lines.push(JSON.parse(l)),
  warn: (l) => lines.push(JSON.parse(l)),
  error: (l) => lines.push(JSON.parse(l)),
};

function mockFetch(...steps) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    return step(url, init);
  };
}
const ok = (body = { message: [1] }) => () => new Response(JSON.stringify(body), { status: 200 });
const status = (code) => () => new Response("x", { status: code });
// Never resolves on its own; rejects when the per-attempt signal aborts.
const hang = () => (url, init) =>
  new Promise((_, reject) => {
    init.signal.addEventListener("abort", () => reject(init.signal.reason));
  });

beforeEach(() => {
  calls = [];
  lines = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("passes Next cache options through and adds a signal", async () => {
  mockFetch(ok());
  const res = await backofficeFetch(URL_, { method: "GET", next: { revalidate: 3600, tags: ["news"] }, logger });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].init.next, { revalidate: 3600, tags: ["news"] });
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal("timeoutMs" in calls[0].init, false);
  assert.equal("critical" in calls[0].init, false);
  assert.equal(lines.length, 0, "fast success logs nothing");
});

test("timeout aborts the attempt and retries once, then rethrows (non-critical)", async () => {
  mockFetch(hang());
  const started = Date.now();
  await assert.rejects(
    backofficeFetch(URL_, { timeoutMs: 40, retryDelayMs: 0, logger }),
    (err) => err.name === "TimeoutError" || err.name === "AbortError"
  );
  assert.equal(calls.length, 2);
  assert.ok(Date.now() - started < 2000);
  assert.equal(lines[0].outcome, "retry");
  assert.equal(lines[1].outcome, "timeout");
  assert.equal(lines[1].attempt, 2);
  assert.equal(lines[1].timeoutMs, 40);
});

test("retry after a timeout can succeed", async () => {
  mockFetch(hang(), ok());
  const res = await backofficeFetch(URL_, { timeoutMs: 40, retryDelayMs: 0, logger });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
});

test("5xx is retried once and the last response is returned (non-critical)", async () => {
  mockFetch(status(502), status(503));
  const res = await backofficeFetch(URL_, { retryDelayMs: 0, logger });
  assert.equal(res.status, 503);
  assert.equal(calls.length, 2);
  assert.deepEqual(lines.map((l) => l.outcome), ["retry", "http_error"]);
});

test("5xx then 200 recovers", async () => {
  mockFetch(status(500), ok());
  const res = await backofficeFetch(URL_, { retryDelayMs: 0, logger });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
});

test("4xx is never retried", async () => {
  for (const code of [400, 403, 404, 429]) {
    calls = [];
    mockFetch(status(code));
    const res = await backofficeFetch(URL_, { retryDelayMs: 0, logger });
    assert.equal(res.status, code);
    assert.equal(calls.length, 1, `HTTP ${code} must not be retried`);
  }
});

test("non-idempotent methods are not retried", async () => {
  mockFetch(status(500));
  const res = await backofficeFetch(URL_, { method: "POST", retryDelayMs: 0, logger });
  assert.equal(res.status, 500);
  assert.equal(calls.length, 1);
});

test("network error: retried, then the original error is rethrown", async () => {
  mockFetch(() => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(backofficeFetch(URL_, { retryDelayMs: 0, logger }), TypeError);
  assert.equal(calls.length, 2);
  assert.equal(lines.at(-1).outcome, "network_error");
});

test("critical: true throws BackofficeError on HTTP error", async () => {
  mockFetch(status(404));
  await assert.rejects(backofficeFetch(URL_, { critical: true, retryDelayMs: 0, logger }), (err) => {
    assert.ok(err instanceof BackofficeError);
    assert.equal(err.status, 404);
    assert.equal(err.reason, "http_error");
    assert.equal(err.endpoint, "news.api.news_data");
    return true;
  });
  assert.equal(calls.length, 1);
});

test("critical: true throws BackofficeError after timeout retries", async () => {
  mockFetch(hang());
  await assert.rejects(
    backofficeFetch(URL_, { critical: true, timeoutMs: 30, retryDelayMs: 0, logger }),
    (err) => err instanceof BackofficeError && err.reason === "timeout" && err.attempts === 2
  );
});

test("critical: true throws on 5xx after retries", async () => {
  mockFetch(status(500));
  await assert.rejects(
    backofficeFetch(URL_, { critical: true, retryDelayMs: 0, logger }),
    (err) => err instanceof BackofficeError && err.status === 500 && err.attempts === 2
  );
});

test("log lines never contain query values", async () => {
  mockFetch(status(500));
  await backofficeFetch(URL_, { retryDelayMs: 0, logger });
  const text = JSON.stringify(lines);
  assert.equal(text.includes("secret-term"), false);
  assert.equal(text.includes("abc"), false);
  assert.deepEqual(lines[0].query, ["q", "token"]);
  for (const key of ["endpoint", "status", "ms", "attempt"]) assert.ok(key in lines[0], key);
});

test("describeUrl strips the Frappe prefix and survives an invalid base URL", () => {
  assert.deepEqual(describeUrl(URL_), { endpoint: "news.api.news_data", query: ["q", "token"] });
  assert.equal(
    describeUrl("undefined/api/method/platzhirsch_studio.platzhirsch_studio.doctype.team.api.x?k=v").endpoint,
    "team.api.x"
  );
});

test("backofficeMessage: fallback when empty, throws when critical", async () => {
  mockFetch(ok({ message: [] }));
  assert.deepEqual(await backofficeMessage(URL_, { fallback: ["fb"], logger }), ["fb"]);
  await assert.rejects(backofficeMessage(URL_, { critical: true, logger }), (err) => err.reason === "empty");
  mockFetch(ok({ message: [{ a: 1 }] }));
  assert.deepEqual(await backofficeMessage(URL_, { critical: true, logger }), [{ a: 1 }]);
});

// --- R1 fix: total time budget and per-request in-flight dedupe -------------

test("budgetMs caps the total: the retry only gets the time that is left", async () => {
  mockFetch(hang());
  const started = Date.now();
  await assert.rejects(
    backofficeFetch(URL_, { timeoutMs: 200, budgetMs: 300, minAttemptMs: 10, retryDelayMs: 0, logger }),
    (err) => err.name === "TimeoutError" || err.name === "AbortError"
  );
  const total = Date.now() - started;
  assert.equal(calls.length, 2);
  assert.ok(total < 2000, `total ${total} ms`);
  assert.equal(lines[0].timeoutMs, 200);
  assert.ok(lines[1].timeoutMs <= 100, `second attempt capped (${lines[1].timeoutMs} ms)`);
});

test("budgetMs: no retry when less than minAttemptMs would be left", async () => {
  mockFetch(hang());
  await assert.rejects(backofficeFetch(URL_, { timeoutMs: 100, budgetMs: 150, minAttemptMs: 100, retryDelayMs: 0, logger }));
  assert.equal(calls.length, 1);
  assert.equal(lines[0].outcome, "timeout");
});

test("15 s fetcher setting (2 x 7 s in 15 s) never exceeds 15 s", async () => {
  // Scaled 1:10 (700 ms / 1500 ms, 1 s minimum -> 100 ms, 250 ms delay -> 25 ms).
  mockFetch(hang());
  const started = Date.now();
  await assert.rejects(backofficeFetch(URL_, { timeoutMs: 700, budgetMs: 1500, minAttemptMs: 100, retryDelayMs: 25, logger }));
  assert.equal(calls.length, 2);
  assert.ok(lines[0].timeoutMs + lines[1].timeoutMs <= 1500, "attempt limits add up to the budget at most");
  assert.ok(Date.now() - started < 1500 + 300, "worst case stays at the budget (plus timer slack)");
});

test("dedupe: identical GETs in one request scope share one backend call", async () => {
  mockFetch(async () => {
    await new Promise((r) => setTimeout(r, 20));
    return new Response(JSON.stringify({ message: [1, 2] }), { status: 200, headers: { "x-a": "1" } });
  });
  const scope = new Map();
  const opts = { next: { revalidate: 3600 }, logger, dedupeScope: scope };
  const [a, b, c] = await Promise.all([backofficeFetch(URL_, opts), backofficeFetch(URL_, opts), backofficeFetch(URL_, opts)]);
  assert.equal(calls.length, 1);
  for (const r of [a, b, c]) {
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("x-a"), "1");
    assert.deepEqual(await r.json(), { message: [1, 2] }, "every caller can read its own body");
  }
});

test("dedupe: different cache options, POST, caller signal or a new scope are not shared", async () => {
  mockFetch(ok());
  const scope = new Map();
  await backofficeFetch(URL_, { next: { revalidate: 60 }, logger, dedupeScope: scope });
  await backofficeFetch(URL_, { next: { revalidate: 3600 }, logger, dedupeScope: scope });
  await backofficeFetch(URL_, { method: "POST", body: "{}", logger, dedupeScope: scope });
  await backofficeFetch(URL_, { next: { revalidate: 60 }, signal: new AbortController().signal, logger, dedupeScope: scope });
  await backofficeFetch(URL_, { next: { revalidate: 60 }, logger, dedupeScope: new Map() });
  await backofficeFetch(URL_, { next: { revalidate: 60 }, logger }); // outside a React server render: no sharing
  assert.equal(calls.length, 6);
});

test("dedupe: a failed shared call is dropped so the next render can try again", async () => {
  mockFetch(() => Promise.reject(new TypeError("fetch failed")), ok());
  const scope = new Map();
  await assert.rejects(backofficeFetch(URL_, { retries: 0, logger, dedupeScope: scope }));
  const res = await backofficeFetch(URL_, { retries: 0, logger, dedupeScope: scope });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
});

test("dedupe keeps non-ok responses and critical errors intact", async () => {
  mockFetch(status(404));
  const scope = new Map();
  const res = await backofficeFetch(URL_, { logger, dedupeScope: scope });
  assert.equal(res.status, 404);
  assert.equal(await res.text(), "x");
  await assert.rejects(backofficeFetch(URL_, { critical: true, logger, dedupeScope: scope }), (err) => err instanceof BackofficeError && err.status === 404);
});
