// tests/unit/backend-ph-client.test.mjs – Header X-PH-Client (Website-Anbindung Runde 2, Punkt 1).
// ph_core utils/ratelimit.py: Kennung = sha256(Besucher-IP + Salz) hex, nur mit BACKEND_PH_CLIENT_SALT.
// Alle Aufrufe gegen fetch-Attrappen.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PH_CLIENT_HEADER, phCall, phClientHeaders, phClientId, requestVisitorIp, visitorIpFrom } from "../../src/lib/backend/config.js";
import { forwardInquiry } from "../../src/lib/backend/forms.js";
import { createFrappeAdapter as bookingAdapter } from "../../src/lib/booking/adapters/frappe.js";

const CFG = { url: "https://staging.example.test", key: "k", secret: "s" };
const SALT = "salz-für-tests";
const hash = (ip) => createHash("sha256").update(ip + SALT).digest("hex");

function recorder(body = { message: { ok: 1 } }, status = 200) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: status < 400, status, json: async () => body };
  };
  return { calls, fetchImpl };
}

test("phClientId: sha256(ip + salz), ohne Salz oder IP null", () => {
  assert.equal(phClientId("203.0.113.7", { BACKEND_PH_CLIENT_SALT: SALT }), hash("203.0.113.7"));
  assert.match(phClientId("203.0.113.7", { BACKEND_PH_CLIENT_SALT: SALT }), /^[0-9a-f]{64}$/);
  assert.equal(phClientId("203.0.113.7", {}), null);
  assert.equal(phClientId("", { BACKEND_PH_CLIENT_SALT: SALT }), null);
  assert.equal(phClientId("untrusted", { BACKEND_PH_CLIENT_SALT: SALT }), null);
});

test("visitorIpFrom: vertrauter Header, sonst letzter X-Forwarded-For-Eintrag, X-Real-IP", () => {
  const h = new Headers({ "x-forwarded-for": "1.1.1.1, 198.51.100.4", "x-real-ip": "10.0.0.1", "cf-connecting-ip": "192.0.2.9" });
  assert.equal(visitorIpFrom(h, {}), "198.51.100.4");
  assert.equal(visitorIpFrom(h, { UPLOAD_TRUSTED_IP_HEADER: "CF-Connecting-IP" }), "192.0.2.9");
  assert.equal(visitorIpFrom(new Headers({ "x-real-ip": "10.0.0.1" }), {}), "10.0.0.1");
  assert.equal(visitorIpFrom(new Request("https://x.test/", { headers: { "x-forwarded-for": "203.0.113.1" } }), {}), "203.0.113.1");
  assert.equal(visitorIpFrom(null, {}), null);
});

test("requestVisitorIp außerhalb eines Requests: null (kein Header, kein Fehler)", async () => {
  assert.equal(await requestVisitorIp({}), null);
});

test("phClientHeaders: ohne Salz {}, mit Salz + IP der Header, client:false nie", async () => {
  const env = { BACKEND_PH_CLIENT_SALT: SALT };
  assert.deepEqual(await phClientHeaders({ env: {}, visitorIp: "203.0.113.7" }), {});
  assert.deepEqual(await phClientHeaders({ env, visitorIp: "203.0.113.7" }), { [PH_CLIENT_HEADER]: hash("203.0.113.7") });
  assert.deepEqual(await phClientHeaders({ env, visitorIp: "203.0.113.7", client: false }), {});
  assert.deepEqual(await phClientHeaders({ env }), {}, "ohne Request-Kontext keine IP → kein Header");
  const req = new Request("https://x.test/", { headers: { "x-forwarded-for": "198.51.100.4" } });
  assert.deepEqual(await phClientHeaders({ env, request: req }), { [PH_CLIENT_HEADER]: hash("198.51.100.4") });
});

test("phCall: Header nur mit Salz; die IP selbst geht nie ans Backend", async () => {
  const a = recorder();
  await phCall(CFG, "ph_x.api.y", { params: { a: 1 }, fetchImpl: a.fetchImpl, env: {}, visitorIp: "203.0.113.7" });
  assert.equal(a.calls[0].init.headers[PH_CLIENT_HEADER], undefined, "ohne Salz unverändert");
  const b = recorder();
  await phCall(CFG, "ph_x.api.y", { params: { a: 1 }, fetchImpl: b.fetchImpl, env: { BACKEND_PH_CLIENT_SALT: SALT }, visitorIp: "203.0.113.7" });
  const sent = b.calls[0].init;
  assert.equal(sent.headers[PH_CLIENT_HEADER], hash("203.0.113.7"));
  assert.ok(!JSON.stringify(sent).includes("203.0.113.7"));
  assert.equal(sent.headers.Authorization, "token k:s");
});

test("forwardInquiry (ph) und Termin-Adapter (Methodenbasis ph_*) senden X-PH-Client, alt nie", async () => {
  const env = { BACKEND_GENERATION: "ph", BACKEND_PH_URL: CFG.url, BACKEND_PH_TOKEN: "k:s", BACKEND_PH_CLIENT_SALT: SALT };
  const r = recorder({ message: { referenz: "PH-ANF-1", status: "Neu" } });
  await forwardInquiry("kontakt", { email: "a@b.test" }, { altUrl: "https://alt.test/x", fetchImpl: r.fetchImpl, env, visitorIp: "203.0.113.7" });
  assert.equal(r.calls[0].init.headers[PH_CLIENT_HEADER], hash("203.0.113.7"));

  const alt = recorder({ message: "ok" });
  await forwardInquiry("kontakt", { email: "a@b.test" }, { altUrl: "https://alt.test/x", fetchImpl: alt.fetchImpl, env: { BACKEND_PH_CLIENT_SALT: SALT }, visitorIp: "203.0.113.7" });
  assert.equal(alt.calls[0].url, "https://alt.test/x");
  assert.equal(alt.calls[0].init.headers?.[PH_CLIENT_HEADER], undefined);

  // Ohne Request-Kontext (node --test) liefert next/headers keine IP → kein Header, Aufruf läuft trotzdem.
  const b = recorder({ message: [] });
  const adapter = bookingAdapter({ ...CFG, methodBase: "ph_crm.api" }, { fetchImpl: b.fetchImpl, env: { BACKEND_PH_CLIENT_SALT: SALT } });
  assert.equal(typeof adapter, "object");
});
