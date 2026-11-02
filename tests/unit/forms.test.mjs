// tests/unit/forms.test.mjs — R1-formulare: guardForm, schemas, forwarding.
// Run: node --test tests/unit/forms.test.mjs
// No network: fetch is always a mock. Never point these at the real backoffice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { guardForm, isTooFast, NO_IP_LIMIT } from "../../src/lib/forms/guard.js";
import { createRateLimiter, clientIp } from "../../src/lib/forms/rateLimit.js";
import { kontaktSchema, beratungSchema, produktSchema, MAX_BYTES } from "../../src/lib/forms/schemas.js";
import { inquiryHandler, forwardJson } from "../../src/lib/forms/forward.js";
import { newsletterHandler } from "../../src/lib/forms/newsletter.js";

const NOW = 1_800_000_000_000;
const URL_K = "https://backoffice.example.invalid/kontakt";
let ipCounter = 0;
const freshIp = () => `198.51.100.${++ipCounter}`;

function req(body, { ip = freshIp(), headers = {} } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(ip ? { "X-Forwarded-For": `10.0.0.1, ${ip}` } : {}), ...headers },
    body: text,
  });
}

function mockFetch(answer = { status: 200, body: { message: { name: "KF-0001" } } }) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (answer instanceof Error) throw answer;
    const text = typeof answer.body === "string" ? answer.body : JSON.stringify(answer.body);
    return new Response(text, { status: answer.status, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}

// Payloads exactly as the callers send them today.
const KONTAKT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };
const ADVENT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "+43 660 1234567", ihre_nachricht: "[Anmeldung Adventsabend 26.11.2026] 2 Personen\n\nNachricht: Wir kommen gern." };
const BERATUNG = { bei_meiner_anfrage_geht_es_um: "eine Renovierung", das_projekt_soll_verwirklicht_werden: "in einer Wohnung", bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten.", vorname: "Erika", nachname: "Muster", email: "erika@example.com", telefon: "+43 5574 46255" };
const PRODUKT = { anfrage_type: "Geschäft", anfrage_vorname: "Erika", anfrage_nachname: "Muster", anfrage_email: "erika@example.com", anfrage_phone: "+4366012345", anfrage_country: "Österreich", anfrage_city: "Bregenz", anfrage_address: "Seestraße 1", anfrage_beschreibung: "", anfrage_company: "Muster GmbH", anfrage_fiscal_number: "ATU12345678", produkte: [101, "abc-7", null] };

const handler = (over = {}) => {
  const fetchImpl = over.fetchImpl || mockFetch();
  const POST = inquiryHandler({ route: "kontakt", url: URL_K, schema: kontaktSchema, maxBytes: MAX_BYTES.kontakt, successMessage: "Contact form submitted successfully", failMessage: "Failed to submit contact form", fetchImpl, limiter: over.limiter || createRateLimiter(), now: () => over.now ?? NOW });
  return { POST, fetchImpl };
};

test("schemas accept every payload the callers send today, unchanged", () => {
  assert.deepEqual(kontaktSchema.parse(KONTAKT), KONTAKT);
  assert.deepEqual(kontaktSchema.parse(ADVENT), ADVENT);
  assert.deepEqual(beratungSchema.parse(BERATUNG), BERATUNG);
  assert.deepEqual(produktSchema.parse(PRODUKT), PRODUKT);
  const privat = { ...PRODUKT, anfrage_type: "Person" };
  delete privat.anfrage_company;
  delete privat.anfrage_fiscal_number;
  assert.deepEqual(produktSchema.parse(privat), privat);
});

test("schemas keep the old rules", () => {
  assert.equal(kontaktSchema.safeParse({ ...KONTAKT, name: " a " }).success, false);
  assert.equal(kontaktSchema.safeParse({ ...KONTAKT, telefon: "abc" }).success, false);
  assert.equal(kontaktSchema.safeParse({ ...KONTAKT, telefon: "   " }).success, true);
  assert.equal(kontaktSchema.safeParse({ ...KONTAKT, ihre_nachricht: "kurz" }).success, false);
  // Runde 4 (recht P2): Telefon im Beratungsformular freiwillig – leer ok, Unsinn nicht.
  assert.equal(beratungSchema.safeParse({ ...BERATUNG, telefon: "" }).success, true);
  assert.equal(beratungSchema.safeParse({ ...BERATUNG, telefon: "abc" }).success, false);
  assert.equal(produktSchema.safeParse({ ...PRODUKT, anfrage_fiscal_number: "" }).success, false);
  const r = kontaktSchema.safeParse({ ...KONTAKT, email_address: undefined });
  assert.equal(r.error.issues[0].message, "Missing required field: email_address");
});

test("Küchenplaner worst case (7.2 KB) fits the Beratung limit", () => {
  const text = "x".repeat(5000) + "ä".repeat(1500);
  const body = JSON.stringify({ ...BERATUNG, bitte_beschreiben_sie_ihr_vorhaben: text });
  assert.ok(Buffer.byteLength(body) < MAX_BYTES.beratung_anfrage);
  assert.equal(beratungSchema.safeParse(JSON.parse(body)).success, true);
});

test("success: allowlisted payload, same URL/headers/answer, 10 s timeout signal", async () => {
  const { POST, fetchImpl } = handler();
  const res = await POST(req({ ...KONTAKT, website: "", _t: NOW - 20000, extra: "drop me", __proto__x: 1 }));
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json, { success: true, message: { name: "KF-0001" }, data: { message: { name: "KF-0001" } } });
  assert.equal(fetchImpl.calls.length, 1);
  const call = fetchImpl.calls[0];
  assert.equal(call.url, URL_K);
  assert.deepEqual(call.init.headers, { "Content-Type": "application/json" });
  assert.deepEqual(call.body, KONTAKT); // website, _t, unknown fields removed
  assert.ok(call.init.signal instanceof AbortSignal);
});

test("success without message falls back to the old default text", async () => {
  const { POST } = handler({ fetchImpl: mockFetch({ status: 200, body: {} }) });
  const json = await (await POST(req(KONTAKT))).json();
  assert.equal(json.message, "Contact form submitted successfully");
  assert.equal(json.success, true);
});

test("honeypot and time trap: fake success, nothing forwarded", async () => {
  const { POST, fetchImpl } = handler();
  const a = await POST(req({ ...KONTAKT, website: "http://spam" }));
  assert.equal(a.status, 200);
  assert.equal((await a.json()).success, true);
  const b = await POST(req({ ...KONTAKT, _t: NOW - 1500 }));
  assert.equal(b.status, 200);
  assert.equal((await b.json()).success, true);
  const c = await POST(req({ website: "x" })); // bot with junk data
  assert.equal(c.status, 200);
  assert.equal(fetchImpl.calls.length, 0);
});

test("time trap ignores missing, invalid and future timestamps (clock skew)", () => {
  assert.equal(isTooFast(undefined, NOW), false);
  assert.equal(isTooFast("abc", NOW), false);
  assert.equal(isTooFast(NOW + 60000, NOW), false);
  assert.equal(isTooFast(NOW - 3000, NOW), false);
  assert.equal(isTooFast(String(NOW - 100), NOW), true);
});

test("too large → 413, invalid JSON / schema → 400 with generic body", async () => {
  const { POST, fetchImpl } = handler();
  const big = await POST(req({ ...KONTAKT, ihre_nachricht: "x".repeat(25000) }));
  assert.equal(big.status, 413);
  assert.equal((await big.json()).code, "too_large");
  const bad = await POST(req("{not json"));
  assert.equal(bad.status, 400);
  const arr = await POST(req("[1,2]"));
  assert.equal(arr.status, 400);
  const inv = await POST(req({ ...KONTAKT, email_address: "nope" }));
  assert.equal(inv.status, 400);
  assert.deepEqual(await inv.json(), { success: false, code: "invalid", error: "Invalid email format", field: "email_address" });
  assert.equal(fetchImpl.calls.length, 0);
});

test("413 also without Content-Length (streamed body is capped)", async () => {
  const { POST } = handler();
  const stream = new ReadableStream({
    start(c) {
      for (let i = 0; i < 30; i++) c.enqueue(new TextEncoder().encode("x".repeat(1024)));
      c.close();
    },
  });
  const r = new Request("http://localhost/api/x", { method: "POST", body: stream, duplex: "half", headers: { "X-Forwarded-For": freshIp() } });
  assert.equal((await POST(r)).status, 413);
});

test("rate limit: 6th request in 10 min from one IP → 429 with Retry-After; other IPs unaffected; window expires", async () => {
  const limiter = createRateLimiter();
  const fetchImpl = mockFetch();
  let now = NOW;
  const POST = inquiryHandler({ route: "kontakt", url: URL_K, schema: kontaktSchema, maxBytes: 20480, successMessage: "ok", failMessage: "f", fetchImpl, limiter, now: () => now });
  const ip = freshIp();
  for (let i = 0; i < 5; i++) assert.equal((await POST(req(KONTAKT, { ip }))).status, 200);
  const sixth = await POST(req(KONTAKT, { ip }));
  assert.equal(sixth.status, 429);
  assert.equal((await sixth.json()).code, "rate_limited");
  assert.ok(Number(sixth.headers.get("retry-after")) > 0);
  assert.equal((await POST(req(KONTAKT, { ip: freshIp() }))).status, 200);
  now += 10 * 60 * 1000 + 1;
  assert.equal((await POST(req(KONTAKT, { ip }))).status, 200);
  assert.equal(fetchImpl.calls.length, 7);
});

test("rate limit uses the LAST X-Forwarded-For entry (the one nginx appended)", () => {
  const r = new Request("http://x/", { headers: { "X-Forwarded-For": "1.1.1.1, 2.2.2.2" } });
  assert.equal(clientIp(r), "2.2.2.2");
  assert.equal(clientIp(new Request("http://x/")), null);
});

test("requests without any IP share a wider bucket", async () => {
  const limiter = createRateLimiter();
  const { POST } = handler({ limiter });
  for (let i = 0; i < NO_IP_LIMIT.max; i++) assert.equal((await POST(req(KONTAKT, { ip: null }))).status, 200);
  assert.equal((await POST(req(KONTAKT, { ip: null }))).status, 429);
});

test("backoffice errors: generic 502/504, no Frappe details to the browser", async () => {
  const secret = { exc: "Traceback ... secret_db_password", message: "internal" };
  for (const [answer, status, code] of [
    [{ status: 417, body: secret }, 502, "upstream"],
    [{ status: 200, body: "<html>proxy</html>" }, 502, "upstream"],
    [Object.assign(new Error("t"), { name: "TimeoutError" }), 504, "timeout"],
    [new Error("ECONNREFUSED"), 502, "upstream"],
  ]) {
    const { POST } = handler({ fetchImpl: mockFetch(answer) });
    const res = await POST(req(KONTAKT));
    assert.equal(res.status, status);
    const text = await res.text();
    assert.equal(JSON.parse(text).code, code);
    assert.equal(JSON.parse(text).success, false);
    assert.ok(!text.includes("secret") && !text.includes("Traceback") && !text.includes("ECONNREFUSED"));
  }
});

test("forwardJson aborts after the timeout", async () => {
  const slow = (url, init) =>
    new Promise((resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(init.signal.reason));
    });
  const r = await forwardJson("http://x", {}, { fetchImpl: slow, timeoutMs: 30 });
  assert.equal(r.kind, "timeout");
});

test("guardForm returns allowlisted data directly", async () => {
  const g = await guardForm(req({ ...BERATUNG, foo: 1, website: "" }), beratungSchema, { route: "t", limiter: createRateLimiter(), now: NOW });
  assert.equal(g.ok, true);
  assert.deepEqual(g.data, BERATUNG);
});

test("newsletter: old codes and answers stay", async () => {
  const run = async (body, answer) => {
    const fetchImpl = mockFetch(answer);
    const POST = newsletterHandler({ url: "http://nl", fetchImpl, limiter: createRateLimiter(), now: () => NOW });
    const res = await POST(req(body));
    return { status: res.status, json: await res.json(), calls: fetchImpl.calls };
  };
  const ok = await run({ email: " erika@example.com ", website: "" }, { status: 200, body: { message: "ok" } });
  assert.deepEqual([ok.status, ok.json], [200, { success: true }]);
  assert.deepEqual(ok.calls[0].body, { email: "erika@example.com" });
  assert.deepEqual(ok.calls[0].init.headers, { "Content-Type": "application/json", Accept: "application/json" });
  const hp = await run({ email: "erika@example.com", website: "spam" });
  assert.deepEqual([hp.status, hp.json, hp.calls.length], [200, { success: true }, 0]);
  const inv = await run({ email: "nope" });
  assert.deepEqual([inv.status, inv.json.code], [400, "invalid_email"]);
  const already = await run({ email: "a@b.at" }, { status: 417, body: { exc_type: "ValidationError", _server_messages: JSON.stringify([JSON.stringify({ message: "E-Mail ist bereits angemeldet" })]) } });
  // QA Welle 2 P1-4: keine Adress-Enumeration – bereits angemeldet = dieselbe neutrale Antwort.
  assert.deepEqual([already.status, already.json], [200, { success: true }]);
  const exc = await run({ email: "a@b.at" }, { status: 200, body: { exc: "Traceback" } });
  assert.deepEqual([exc.status, exc.json], [502, { success: false, code: "failed" }]);
  const html = await run({ email: "a@b.at" }, { status: 502, body: "<html>" });
  assert.deepEqual([html.status, html.json], [502, { success: false, code: "failed" }]);
});
