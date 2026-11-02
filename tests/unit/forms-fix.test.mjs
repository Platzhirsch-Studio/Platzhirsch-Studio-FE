// tests/unit/forms-fix.test.mjs — R1-formulare, fixes after QA round 1.
// Run: node --test tests/unit/forms*.test.mjs
// No network: fetch is always a mock. Never point these at the real backoffice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isTooFast, visitorLang, fakeSuccessStats } from "../../src/lib/forms/guard.js";
import { createRateLimiter, ATTEMPT_LIMIT, DEFAULT_LIMIT } from "../../src/lib/forms/rateLimit.js";
import { kontaktSchema, MAX_BYTES } from "../../src/lib/forms/schemas.js";
import { inquiryHandler } from "../../src/lib/forms/forward.js";
import { newsletterHandler } from "../../src/lib/forms/newsletter.js";

const NOW = 1_800_000_000_000;
const KONTAKT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };

function mockFetch() {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Response.json({ message: { name: "KF-0001" } });
  };
  fn.calls = calls;
  return fn;
}

// What /api/upload/inquiry/[kind] hands the route: a NEW Request, no client headers.
const inner = (body) =>
  new Request("http://localhost/api/upload/inquiry/kontakt", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
const direct = (body, headers = {}) =>
  new Request("http://localhost/api/kontakt", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

function kontakt({ limiter = createRateLimiter(), outer = () => null, now = () => NOW } = {}) {
  const fetchImpl = mockFetch();
  const POST = inquiryHandler({ route: "kontakt", url: "https://backoffice.example.invalid/k", schema: kontaktSchema, maxBytes: MAX_BYTES.kontakt, successMessage: "ok", failMessage: "f", resolveHeaders: async () => outer(), fetchImpl, limiter, now });
  return { POST, fetchImpl };
}

test("P1-1: wrapper request without XFF is limited per visitor IP via the original request headers", async () => {
  let current = "203.0.113.10";
  const { POST, fetchImpl } = kontakt({ outer: () => new Headers({ "x-forwarded-for": current }) });
  for (let i = 0; i < DEFAULT_LIMIT.max; i++) assert.equal((await POST(inner(KONTAKT))).status, 200);
  const sixth = await POST(inner(KONTAKT));
  assert.equal(sixth.status, 429);
  assert.ok(Number(sixth.headers.get("retry-after")) > 0);
  current = "203.0.113.11"; // another visitor is NOT blocked (no shared bucket)
  assert.equal((await POST(inner(KONTAKT))).status, 200);
  assert.equal(fetchImpl.calls.length, DEFAULT_LIMIT.max + 1);
});

test("P1-1: resolveHeaders that throws or returns nothing falls back safely", async () => {
  const { POST } = kontakt({ outer: () => { throw new Error("no request scope"); } });
  assert.equal((await POST(inner(KONTAKT))).status, 200);
});

test("P2-3: rejected (400) requests do not use up the 5 forwarded requests", async () => {
  const { POST, fetchImpl } = kontakt();
  const ip = { "X-Forwarded-For": "203.0.113.20" };
  for (let i = 0; i < 10; i++) assert.equal((await POST(direct({ ...KONTAKT, telefon: "abc" }, ip))).status, 400);
  assert.equal((await POST(direct(KONTAKT, ip))).status, 200);
  assert.equal(fetchImpl.calls.length, 1);
});

test("P2-3: junk floods are still stopped after ATTEMPT_LIMIT requests", async () => {
  const { POST } = kontakt();
  const ip = { "X-Forwarded-For": "203.0.113.21" };
  for (let i = 0; i < ATTEMPT_LIMIT.max; i++) assert.equal((await POST(direct({ name: "" }, ip))).status, 400);
  assert.equal((await POST(direct(KONTAKT, ip))).status, 429);
});

test("P2-3: 429 text in the visitor's language (Referer, Accept-Language, default de)", async () => {
  const limiter = createRateLimiter();
  const { POST } = kontakt({ limiter });
  const hit = async (headers) => {
    let r;
    for (let i = 0; i <= DEFAULT_LIMIT.max; i++) r = await POST(direct(KONTAKT, headers));
    assert.equal(r.status, 429);
    return (await r.json()).error;
  };
  assert.match(await hit({ "X-Forwarded-For": "203.0.113.30" }), /^Zu viele Anfragen/);
  assert.match(await hit({ "X-Forwarded-For": "203.0.113.31", "Accept-Language": "en-GB,en;q=0.9" }), /^Too many requests/);
  assert.match(await hit({ "X-Forwarded-For": "203.0.113.32", Referer: "https://platzhirsch.studio/fr/contact", "Accept-Language": "de" }), /^Trop de demandes/);
  assert.equal(visitorLang(null, new Headers({ referer: "https://x/it/kontakt" })), "it");
});

test("P2-2: `_t` as duration since render does not depend on the device clock", () => {
  assert.equal(isTooFast(1500, NOW), true); // 1.5 s after render: bot
  assert.equal(isTooFast("2999", NOW), true);
  assert.equal(isTooFast(42000, NOW), false); // 42 s: human, whatever the clock says
  assert.equal(isTooFast(3000, NOW), false);
  assert.equal(isTooFast(0, NOW), false);
  // legacy epoch stamps keep working
  assert.equal(isTooFast(NOW - 1000, NOW), true);
  assert.equal(isTooFast(NOW + 40000, NOW), false);
});

test("P2-2: fake successes are counted per route and reason", async () => {
  const before = fakeSuccessStats()["kontakt:time_trap"] || 0;
  const { POST, fetchImpl } = kontakt();
  const r = await POST(direct({ ...KONTAKT, _t: 800 }, { "X-Forwarded-For": "203.0.113.40" }));
  assert.equal(r.status, 200);
  assert.equal(fetchImpl.calls.length, 0);
  assert.equal(fakeSuccessStats()["kontakt:time_trap"], before + 1);
});

test("newsletter also reads the original request headers", async () => {
  const limiter = createRateLimiter();
  const fetchImpl = async () => Response.json({ message: "ok" });
  const POST = newsletterHandler({ url: "https://backoffice.example.invalid/n", fetchImpl, limiter, now: () => NOW, resolveHeaders: async () => new Headers({ "x-forwarded-for": "203.0.113.50" }) });
  const body = () => new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ email: "a@example.com" }) });
  for (let i = 0; i < DEFAULT_LIMIT.max; i++) assert.equal((await POST(body())).status, 200);
  assert.equal((await POST(body())).status, 429);
});
