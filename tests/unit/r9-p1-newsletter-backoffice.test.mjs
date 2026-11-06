// tests/unit/r9-p1-newsletter-backoffice.test.mjs – R5-Fix P1 (r5-technik P1-1).
// Writing endpoints never fall back to the documented READ default (production
// backoffice). Without SERVER: no request at all, 503 "not_configured"
// (production) or the same with a clear dev note. No network: fetch is a stub
// that fails the test when called.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const api = await import("../../src/lib/apiBaseUrl.js");

test("formsBackendBaseUrl: nur ausdrücklich gesetzter SERVER, nie der Lese-Standard", () => {
  assert.equal(api.formsBackendBaseUrl({}), null);
  assert.equal(api.formsBackendBaseUrl({ SERVER: "" }), null);
  assert.equal(api.formsBackendBaseUrl({ SERVER: "   " }), null);
  assert.equal(api.formsBackendBaseUrl({ SERVER: "undefined" }), null);
  assert.equal(api.formsBackendBaseUrl({ SERVER: "https://dev.backoffice.invalid/" }), "https://dev.backoffice.invalid/api/method/");
  // The read default stays for the guest GET endpoints only.
  assert.equal(api.DEFAULT_BACKOFFICE, "https://backoffice.platzhirsch.studio");
  assert.notEqual(api.formsBackendBaseUrl({}), `${api.DEFAULT_BACKOFFICE}/api/method/`);
});

test("ohne SERVER: 503 not_configured, Produktion knapp, Entwicklung mit klarem Hinweis, kein fetch", async () => {
  const realFetch = globalThis.fetch;
  const realWarn = console.warn;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("network must not be used");
  };
  console.warn = () => {};
  try {
    const prod = api.backofficeNotConfigured("newsletter_subscribe", { NODE_ENV: "production" });
    assert.equal(prod.status, 503);
    assert.equal(prod.headers.get("cache-control"), "no-store");
    assert.deepEqual(await prod.json(), { success: false, code: "not_configured" });
    const dev = api.backofficeNotConfigured("newsletter_subscribe", { NODE_ENV: "development" });
    assert.equal(dev.status, 503);
    const body = await dev.json();
    assert.equal(body.code, "not_configured");
    assert.equal(body.sent, false);
    assert.match(body.detail, /nichts an ein Backoffice gesendet/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = realFetch;
    console.warn = realWarn;
  }
});

test("Newsletter-Route: Schreib-Basis statt NEW_API_BASE_URL, Sperre vor dem Handler", () => {
  const src = read("src/app/api/newsletter_subscribe/route.js");
  assert.doesNotMatch(src, /NEW_API_BASE_URL|NEW_API_SERVER|DEFAULT_BACKOFFICE/);
  assert.match(src, /const base = formsBackendBaseUrl\(\);/);
  assert.match(src, /const handler = base \? newsletterHandler\(/);
  assert.match(src, /if \(!handler\) return backofficeNotConfigured\("newsletter_subscribe"\);/);
  // The apiBaseUrl read default is untouched for the guest GET endpoints
  // (katalogFileServer() returns it unchanged unless BACKEND_GENERATION switches "katalog" to ph).
  assert.match(read("src/lib/apiBaseUrl.js"), /const ALT_API_SERVER = \(SERVER \|\| DEFAULT_BACKOFFICE\)/);
  assert.match(read("src/lib/apiBaseUrl.js"), /export const NEW_API_SERVER = katalogFileServer\(ALT_API_SERVER\);/);
});
