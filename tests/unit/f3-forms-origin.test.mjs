// tests/unit/f3-forms-origin.test.mjs — Fix-Runde 1, Team F3 Nr. 9:
// Herkunftsprüfung der Formular-Routen (Origin/Referer gegen den Site-Host).
// NICHTS wird echt abgesendet: fetchImpl ist ein Stub, der jeden Aufruf zählt.
// Run: node --test tests/unit/f3-forms-origin.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { allowedHosts, originCheck, withOriginCheck } from "../../src/lib/forms/origin.js";
import { inquiryHandler } from "../../src/lib/forms/forward.js";
import { newsletterHandler } from "../../src/lib/forms/newsletter.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { kontaktSchema } from "../../src/lib/forms/schemas.js";

const ENV = {};
const req = (headers = {}, body = {}) =>
  new Request("http://localhost:3000/api/kontakt", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9", ...headers },
    body: JSON.stringify(body),
  });

test("originCheck: gleiche Herkunft, Produktions-Host und ohne Header erlaubt", () => {
  assert.equal(originCheck(req({ host: "localhost:3000", origin: "http://localhost:3000" }), null, ENV).ok, true);
  assert.equal(originCheck(req({ host: "127.0.0.1:3000", origin: "https://platzhirsch.studio" }), null, ENV).ok, true);
  assert.equal(originCheck(req({ host: "x", origin: "https://www.platzhirsch.studio" }), null, ENV).ok, true);
  assert.equal(originCheck(req({ host: "localhost:3000", referer: "http://localhost:3000/de/kontakt" }), null, ENV).ok, true);
  // Server-zu-Server (kein Browser): kein Origin, kein Referer.
  assert.equal(originCheck(req({ host: "localhost:3000" }), null, ENV).ok, true);
  // Hinter dem Proxy: X-Forwarded-Host zählt.
  assert.equal(originCheck(req({ host: "127.0.0.1:3000", "x-forwarded-host": "staging.example.org", origin: "https://staging.example.org" }), null, ENV).ok, true);
  // Zusätzliche Hosts per FORM_ALLOWED_ORIGINS.
  assert.equal(originCheck(req({ host: "a", origin: "https://preview.example.net" }), null, { FORM_ALLOWED_ORIGINS: "https://preview.example.net, other.test" }).ok, true);
  assert.ok(allowedHosts([], { FORM_ALLOWED_ORIGINS: "other.test" }).has("other.test"));
});

test("originCheck: fremde Herkunft wird abgelehnt", () => {
  assert.equal(originCheck(req({ host: "localhost:3000", origin: "https://evil.example" }), null, ENV).ok, false);
  assert.equal(originCheck(req({ host: "localhost:3000", referer: "https://evil.example/form.html" }), null, ENV).ok, false);
  assert.equal(originCheck(req({ host: "localhost:3000", origin: "null" }), null, ENV).ok, false);
  assert.equal(originCheck(req({ host: "localhost:3000", origin: "null", referer: "http://localhost:3000/de" }), null, ENV).ok, true);
  // Look-alike-Host
  assert.equal(originCheck(req({ host: "localhost:3000", origin: "https://platzhirsch.studio.evil.example" }), null, ENV).ok, false);
  // Innerer Request ohne Origin, aber die ORIGINAL-Header (Upload-Wrapper) sind fremd.
  const outer = new Headers({ host: "localhost:3000", origin: "https://evil.example" });
  assert.equal(originCheck(req({}), outer, ENV).ok, false);
});

const VALID = { name: "Erika Muster", email_address: "erika@example.com", ihre_nachricht: "Bitte um Rückruf wegen Sofa.", _t: 10_000 };

function stubFetch() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ message: { name: "TEST" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  return { calls, fetchImpl };
}

test("inquiryHandler (Kontakt/Beratung/Produkt): fremde Herkunft → 403, nichts weitergeleitet", async () => {
  const { calls, fetchImpl } = stubFetch();
  const POST = inquiryHandler({
    route: "kontakt",
    url: "https://backoffice.invalid/never",
    schema: kontaktSchema,
    maxBytes: 20 * 1024,
    successMessage: "ok",
    failMessage: "fail",
    fetchImpl,
    limiter: createRateLimiter(),
    env: ENV,
  });
  const bad = await POST(req({ host: "localhost:3000", origin: "https://evil.example" }, VALID));
  assert.equal(bad.status, 403);
  assert.deepEqual(await bad.json(), { success: false, code: "forbidden", error: "Forbidden" });
  assert.equal(calls.length, 0);
  // Gleiche Herkunft: geht an den (gestubbten) Backoffice-Aufruf.
  const ok = await POST(req({ host: "localhost:3000", origin: "http://localhost:3000" }, VALID));
  assert.equal(ok.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://backoffice.invalid/never");
});

test("newsletterHandler: fremde Herkunft → 403, nichts weitergeleitet", async () => {
  const { calls, fetchImpl } = stubFetch();
  const POST = newsletterHandler({ url: "https://backoffice.invalid/nl", fetchImpl, limiter: createRateLimiter(), env: ENV });
  const bad = await POST(req({ host: "localhost:3000", referer: "https://evil.example/x" }, { email: "a@example.com", _t: 10_000 }));
  assert.equal(bad.status, 403);
  assert.equal(calls.length, 0);
});

test("withOriginCheck (Atelier, Gutschein): fremd → 403 ohne Aufruf des Handlers", async () => {
  let called = 0;
  const POST = withOriginCheck(async () => {
    called++;
    return Response.json({ success: true });
  }, { env: ENV });
  assert.equal((await POST(req({ host: "localhost:3000", origin: "https://evil.example" }))).status, 403);
  assert.equal(called, 0);
  assert.equal((await POST(req({ host: "localhost:3000", origin: "http://localhost:3000" }))).status, 200);
  assert.equal(called, 1);
});
