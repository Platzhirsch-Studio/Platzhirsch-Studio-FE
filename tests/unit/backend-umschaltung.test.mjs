// tests/unit/backend-umschaltung.test.mjs – Umschaltung alt (platzhirsch_studio)
// ↔ ph (Backend-Import/ph_*): zentrale Konfiguration, ph-Adapter je Gruppe
// gegen fetch-Attrappen (Pfad, Parameter, Auth-Header, Mapping, Fehlercodes).
// Bericht: Marktresearch/digital/backoffice/60-website-backend-umstellung.md
// Kein Netz: jeder fetch ist eine Attrappe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { GRUPPEN, backendGeneration, backendOverview, parseGruppen, parseToken, phAccess, phCall, phErrorCode, requestedGeneration, resolveBackend } from "../../src/lib/backend/config.js";
import { katalogApi, katalogFileServer, katalogMethod, karriereUrl, mapPhProduktDetail } from "../../src/lib/backend/katalog.js";
import { forwardInquiry, mapPhInquiryResult, newsletterPhTarget, PH_INQUIRY } from "../../src/lib/backend/forms.js";
import { inquiryHandler } from "../../src/lib/forms/forward.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { kontaktSchema, MAX_BYTES } from "../../src/lib/forms/schemas.js";
import { newsletterHandler } from "../../src/lib/forms/newsletter.js";
import { frappeCredentials as bookingCredentials } from "../../src/lib/booking/config.js";
import { createFrappeAdapter as createBookingAdapter } from "../../src/lib/booking/adapters/frappe.js";
import { frappeCredentials as kundenkarteCredentials } from "../../src/lib/kundenkarte/config.js";
import { createFrappeAdapter as createKundenkarteAdapter } from "../../src/lib/kundenkarte/adapters/frappe.js";
import { frappeConfig, pushDay } from "../../src/lib/einblicke/frappe.server.js";
import { backofficeFromEnv, createFrappeBackoffice, paymentEvent } from "../../src/lib/payments/backoffice.js";
import { createMemoryOrderAdapter } from "../../src/lib/shop/orderStore.js";
import { orderCalls, withPhMirror, withdrawalParams } from "../../src/lib/shop/phMirror.js";
import { createPhUploadAdapter, phUploadAdapter } from "../../src/lib/upload/phAdapter.js";
import { createPhPortalAdapter, PhPortalError } from "../../src/lib/portal/adapters/ph.js";
import { createTokenStore, openToken, sealToken } from "../../src/lib/portal/adapters/phTokenStore.js";
import { ADAPTER_METHODS } from "../../src/lib/portal/adapters/interface.js";

const PH = { BACKEND_PH_URL: "https://ph.staging.test/", BACKEND_PH_TOKEN: "key1:secret1" };
const AUTH = "token key1:secret1";
const ALT_BASE = "https://backoffice.platzhirsch.studio/api/method/";
const quiet = { info() {}, warn() {}, error() {}, log() {} };

/** fetch-Attrappe: answer(url, init, call) → { status, body } | Error. */
function fakeFetch(answer = () => ({ status: 200, body: { message: { ok: true } } })) {
  const calls = [];
  const fn = async (url, init = {}) => {
    let body = init.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // bleibt Text
      }
    }
    const call = { url: String(url), method: init.method || "GET", headers: new Headers(init.headers || {}), body, init };
    calls.push(call);
    const a = typeof answer === "function" ? answer(String(url), init, call) : answer;
    if (a instanceof Error) throw a;
    const text = typeof a.body === "string" ? a.body : JSON.stringify(a.body ?? {});
    return new Response(text, { status: a.status ?? 200, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}
const msg = (message, status = 200) => ({ status, body: { message } });
const phErr = (code, status) => ({ status, body: { message: { code, message: "x" } } });

// ── Umschaltlogik ────────────────────────────────────────────────────────────

test("ohne BACKEND_GENERATION: jede Gruppe alt (heutiges Verhalten)", () => {
  for (const g of Object.keys(GRUPPEN)) assert.equal(backendGeneration(g, {}), "alt", g);
  for (const g of Object.keys(GRUPPEN)) assert.equal(backendGeneration(g, { ...PH }), "alt", `${g}: URL/Token allein schalten nichts`);
  assert.equal(backendOverview({}).basis, "alt");
});

test("BACKEND_GENERATION=ph schaltet alle Gruppen mit ph-Adapter, BACKEND_ALT_GRUPPEN nimmt aus", () => {
  const env = { ...PH, BACKEND_GENERATION: "ph", BACKEND_ALT_GRUPPEN: "shop, portal" };
  for (const [g, def] of Object.entries(GRUPPEN)) {
    const want = def.ph && g !== "shop" && g !== "portal" ? "ph" : "alt";
    assert.equal(backendGeneration(g, env), want, g);
  }
  // cms hat kein ph-Gegenstück.
  assert.equal(requestedGeneration("cms", { BACKEND_GENERATION: "ph" }), "alt");
  assert.equal(requestedGeneration("wunschliste", { BACKEND_GENERATION: "ph" }), "ph", "seit Runde 2 mit ph-Adapter (Speicherwahl bleibt WUNSCHLISTE_STORAGE)");
});

test("BACKEND_PH_GRUPPEN je Funktionsgruppe, 'alle', unbekannte Werte", () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "katalog,termin;shop  unsinn" };
  assert.deepEqual([...parseGruppen(env.BACKEND_PH_GRUPPEN)].sort(), ["katalog", "shop", "termin"]);
  assert.equal(backendGeneration("katalog", env), "ph");
  assert.equal(backendGeneration("formulare", env), "alt");
  assert.ok(parseGruppen("alle").has("portal"));
  assert.ok(!parseGruppen("alle").has("cms"));
  assert.equal(backendGeneration("katalog", { ...PH, BACKEND_GENERATION: "neu", BACKEND_PH_GRUPPEN: "" }), "alt", "unbekannte Generation → alt");
  assert.throws(() => requestedGeneration("gibtsnicht", {}), /Unbekannte Backend-Gruppe/);
});

test("phAccess: https, localhost-http, Staging-http nur außerhalb Produktion, Schutz des produktiven Backoffice, Token", () => {
  assert.equal(phAccess({}).reason, "url_fehlt");
  assert.equal(phAccess({ BACKEND_PH_URL: "kein url" }).reason, "url_ungueltig");
  assert.equal(phAccess({ BACKEND_PH_URL: "http://10.30.70.5:8000", BACKEND_PH_TOKEN: "a:b" }).reason, "nur_https");
  assert.equal(phAccess({ BACKEND_PH_URL: "http://10.30.70.5:8000", BACKEND_PH_TOKEN: "a:b", BACKEND_PH_ALLOW_HTTP: "1" }).ok, true);
  assert.equal(phAccess({ BACKEND_PH_URL: "http://10.30.70.5:8000", BACKEND_PH_TOKEN: "a:b", BACKEND_PH_ALLOW_HTTP: "1", NODE_ENV: "production" }).reason, "nur_https");
  assert.equal(phAccess({ BACKEND_PH_URL: "http://localhost:8000", BACKEND_PH_TOKEN: "a:b" }).ok, true);
  assert.equal(phAccess({ BACKEND_PH_URL: "https://backoffice.platzhirsch.studio", BACKEND_PH_TOKEN: "a:b" }).reason, "geschuetzt");
  assert.equal(phAccess({ BACKEND_PH_URL: "https://backoffice.platzhirsch.studio", BACKEND_PH_TOKEN: "a:b", BACKEND_PH_LIVE: "1" }).reason, "geschuetzt", "LIVE nur mit NODE_ENV=production");
  assert.equal(phAccess({ BACKEND_PH_URL: "https://backoffice.platzhirsch.studio", BACKEND_PH_TOKEN: "a:b", BACKEND_PH_LIVE: "1", NODE_ENV: "production" }).ok, true);
  assert.equal(phAccess({ BACKEND_PH_URL: "https://ph.test" }).reason, "token_fehlt");
  assert.deepEqual(parseToken("token k:s"), { key: "k", secret: "s" });
  assert.equal(parseToken("nurkey"), null);
  assert.equal(parseToken(":s"), null);
  assert.deepEqual(phAccess(PH), { ok: true, url: "https://ph.staging.test", key: "key1", secret: "secret1" });
});

test("ph gewählt, Zugang fehlt: lesend → alt, schreibend → ph ohne Zugang (nichts senden)", () => {
  const env = { BACKEND_GENERATION: "ph" };
  const lesend = resolveBackend("katalog", env);
  assert.equal(lesend.generation, "alt");
  assert.equal(lesend.problem, "url_fehlt");
  const schreibend = resolveBackend("formulare", env);
  assert.equal(schreibend.generation, "ph");
  assert.equal(schreibend.ph, null);
  assert.equal(schreibend.problem, "url_fehlt");
});

test("phErrorCode: Code aus body.code / body.message.code, sonst HTTP-Status", () => {
  assert.equal(phErrorCode(409, { message: { code: "slot_taken" } }), "slot_taken");
  assert.equal(phErrorCode(404, { code: "invalid_token" }), "invalid_token");
  assert.equal(phErrorCode(417, { exc_type: "ValidationError" }), "invalid");
  assert.equal(phErrorCode(403, {}), "forbidden");
  assert.equal(phErrorCode(429, null), "rate_limited");
  assert.equal(phErrorCode(502, null), "unavailable");
  assert.equal(phErrorCode(400, { message: { code: "erfunden" } }), "invalid");
});

test("phCall: POST-JSON mit Token, GET mit Query (Objekte als JSON), Netzfehler → unavailable", async () => {
  const cfg = phAccess(PH);
  const f = fakeFetch(() => msg({ referenz: "X" }));
  const r = await phCall(cfg, "ph_crm.api.create_anfrage", { params: { a: 1, weg: undefined, leer: null }, fetchImpl: f });
  assert.deepEqual(r, { ok: true, status: 200, message: { referenz: "X" } });
  assert.equal(f.calls[0].url, "https://ph.staging.test/api/method/ph_crm.api.create_anfrage");
  assert.equal(f.calls[0].method, "POST");
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.equal(f.calls[0].headers.get("content-type"), "application/json");
  assert.deepEqual(f.calls[0].body, { a: 1, leer: null });
  await phCall(cfg, "ph_x.api.y", { get: true, params: { q: "so fa", liste: ["a"], leer: "" }, fetchImpl: f });
  assert.equal(f.calls[1].url, "https://ph.staging.test/api/method/ph_x.api.y?q=so+fa&liste=%5B%22a%22%5D");
  assert.equal(f.calls[1].method, "GET");
  const down = await phCall(cfg, "ph_x.api.y", { fetchImpl: fakeFetch(() => new TypeError("fetch failed")) });
  assert.deepEqual(down, { ok: false, status: null, code: "unavailable", detail: "network" });
  const err = await phCall(cfg, "ph_x.api.y", { fetchImpl: fakeFetch(() => phErr("rate_limited", 429)) });
  assert.deepEqual(err, { ok: false, status: 429, code: "rate_limited" });
});

// ── Katalog / Karriere (lesend) ──────────────────────────────────────────────

test("Katalog alt: Methoden-URLs exakt wie bisher; ph: ph_sortiment.api mit gleichen Methodennamen", () => {
  assert.equal(katalogApi("produkte_new.api", ALT_BASE, {}), `${ALT_BASE}platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api`);
  assert.equal(katalogMethod("marken.api", "marken_data", ALT_BASE, {}), `${ALT_BASE}platzhirsch_studio.platzhirsch_studio.doctype.marken.api.marken_data`);
  assert.equal(katalogMethod("produkte_farbe.api", "get_all_farben_api", ALT_BASE, {}), `${ALT_BASE}platzhirsch_studio.platzhirsch_studio.doctype.produkte_farbe.api.get_all_farben_api`);
  const env = { ...PH, BACKEND_PH_GRUPPEN: "katalog" };
  assert.equal(katalogApi("produkte_new.api", ALT_BASE, env), "https://ph.staging.test/api/method/ph_sortiment.api");
  for (const [mod, m] of [["produkte_new.api", "get_produkte_by_kategorie"], ["marken.api", "marken_data"], ["produkte_kategorie.api", "get_all_kategorien_api"], ["sub_kategorie.api", "get_all_sub_kategorien_api"], ["produkte_farbe.api", "get_all_farben_api"], ["produkte_material.api", "get_all_materialien_api"]]) {
    assert.equal(katalogMethod(mod, m, ALT_BASE, env), `https://ph.staging.test/api/method/ph_sortiment.api.${m}`);
  }
  assert.throws(() => katalogApi("news.api", ALT_BASE, env), /Unbekanntes Katalogmodul/);
  // Ohne Zugang liest der Katalog weiter alt.
  assert.equal(katalogApi("produkte_new.api", ALT_BASE, { BACKEND_PH_GRUPPEN: "katalog" }), `${ALT_BASE}platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api`);
});

test("Katalog-Dateien (/cmx) und Karriere folgen ihrer Gruppe", () => {
  assert.equal(katalogFileServer("https://alt.test", {}), "https://alt.test");
  assert.equal(katalogFileServer("https://alt.test", { ...PH, BACKEND_PH_GRUPPEN: "katalog" }), "https://ph.staging.test");
  assert.equal(karriereUrl(ALT_BASE, {}), `${ALT_BASE}platzhirsch_studio.platzhirsch_studio.doctype.karriere.api.karriere_data`);
  assert.equal(karriereUrl(ALT_BASE, { ...PH, BACKEND_PH_GRUPPEN: "karriere" }), "https://ph.staging.test/api/method/ph_personal.api.karriere_data");
});

test("mapPhProduktDetail: Material/Farbe aus merkmale in additional_information[0], Rest unverändert", () => {
  const d = {
    name: "sofa-x",
    path_field: "sofa-x",
    additional_information: [{ dimensions: "Länge: 200 cm", gewicht: "40 kg" }],
    merkmale: [{ de: "Eiche", gruppe: "Holz" }, { de: "Leinen", gruppe: "Stoff" }, { de: "Sand", gruppe: "Farbe" }, { de: "Eiche", gruppe: "Holz" }],
  };
  const m = mapPhProduktDetail(d);
  assert.deepEqual(m.additional_information, [{ dimensions: "Länge: 200 cm", gewicht: "40 kg", material: "Eiche, Leinen", farbe: "Sand" }]);
  assert.equal(m.path_field, "sofa-x");
  assert.deepEqual(d.additional_information, [{ dimensions: "Länge: 200 cm", gewicht: "40 kg" }], "Eingabe nicht verändert");
  assert.deepEqual(mapPhProduktDetail({ merkmale: [{ de: "Rot", gruppe: "Farbe" }] }).additional_information, [{ farbe: "Rot" }]);
  assert.deepEqual(mapPhProduktDetail({}), {});
  assert.equal(mapPhProduktDetail(null), null);
  const ohne = { name: "a", additional_information: [] };
  assert.equal(mapPhProduktDetail(ohne), ohne);
});

// ── Formulare (ph_crm) ───────────────────────────────────────────────────────

const KONTAKT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };
const ALT_KONTAKT = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";

test("forwardInquiry alt: exakt der heutige Aufruf (URL, Body, kein Token)", async () => {
  const f = fakeFetch(() => msg({ name: "KF-0001" }));
  const r = await forwardInquiry("kontakt", KONTAKT, { altUrl: ALT_KONTAKT, fetchImpl: f, idempotencyKey: "lead-1", env: {} });
  assert.equal(r.kind, "ok");
  assert.deepEqual(r.data, { message: { name: "KF-0001" } });
  assert.equal(f.calls[0].url, ALT_KONTAKT);
  assert.deepEqual(f.calls[0].body, KONTAKT, "kein idempotency_key, kein art an das alte System");
  assert.equal(f.calls[0].headers.get("authorization"), null);
});

test("forwardInquiry ph: ph_crm-Methode je Formularart, Token, art/quelle, idempotency_key, Antwort-Mapping", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "formulare" };
  const cases = [
    ["kontakt", "ph_crm.api.create_contact", {}],
    ["beratung", "ph_crm.api.create_anfrage", {}],
    ["produkt", "ph_crm.api.create_anfrage", {}],
    ["gutschein", "ph_crm.api.create_contact", { art: "Gutschein" }],
    ["reservierung", "ph_crm.api.create_contact", { art: "Reservierung" }],
    ["ezarri", "ph_crm.api.create_anfrage", { art: "Ezarri" }],
    ["agent", "ph_crm.api.create_anfrage", { quelle: "agent" }],
  ];
  assert.deepEqual(Object.keys(PH_INQUIRY).sort(), cases.map((c) => c[0]).sort());
  for (const [kind, method, extra] of cases) {
    const f = fakeFetch(() => msg({ referenz: "PH-ANF-2026-00001", status: "Neu" }));
    const r = await forwardInquiry(kind, { a: 1 }, { altUrl: ALT_KONTAKT, fetchImpl: f, idempotencyKey: "lead-7", env });
    assert.equal(f.calls[0].url, `https://ph.staging.test/api/method/${method}`, kind);
    assert.equal(f.calls[0].headers.get("authorization"), AUTH);
    assert.deepEqual(f.calls[0].body, { a: 1, ...extra, idempotency_key: "lead-7" }, kind);
    assert.deepEqual(r.data.message, { referenz: "PH-ANF-2026-00001", status: "Neu", name: "PH-ANF-2026-00001" }, "data.message.name für UploadHandoff");
  }
});

test("forwardInquiry ph: Fehler bleiben Fehler, ohne Zugang wird nichts gesendet", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "formulare" };
  const f = fakeFetch(() => phErr("invalid", 400));
  const r = await forwardInquiry("beratung", { a: 1 }, { altUrl: ALT_KONTAKT, fetchImpl: f, env });
  assert.equal(r.kind, "http");
  assert.equal(r.status, 400);
  const none = fakeFetch();
  assert.deepEqual(await forwardInquiry("kontakt", KONTAKT, { altUrl: ALT_KONTAKT, fetchImpl: none, env: { BACKEND_PH_GRUPPEN: "formulare" } }), { kind: "not_configured" });
  assert.equal(none.calls.length, 0);
  assert.equal(mapPhInquiryResult({ kind: "timeout" }).kind, "timeout");
  await assert.rejects(() => forwardInquiry("xyz", {}, { altUrl: ALT_KONTAKT, env: {} }), /Unbekannte Formularart/);
});

function formReq(body) {
  return new Request("http://localhost/api/kontakt", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.0.0.1, 203.0.113.${Math.floor(Math.random() * 200) + 1}` },
    body: JSON.stringify(body),
  });
}

test("inquiryHandler mit forward: ph-Erfolg → gleiche Antwortform, not_configured → 503, lead_ref als idempotency_key", async () => {
  const NOW = 1_800_000_000_000;
  const make = (env, fetchImpl) =>
    inquiryHandler({
      route: "kontakt",
      url: ALT_KONTAKT,
      schema: kontaktSchema,
      maxBytes: MAX_BYTES.kontakt,
      successMessage: "Contact form submitted successfully",
      failMessage: "Failed to submit contact form",
      fetchImpl,
      limiter: createRateLimiter(),
      now: () => NOW,
      env,
      forward: (fields, o) => forwardInquiry("kontakt", fields, { altUrl: ALT_KONTAKT, ...o }),
    });
  const lead = "123e4567-e89b-42d3-a456-426614174000";
  const f = fakeFetch(() => msg({ referenz: "PH-ANF-1", status: "Neu" }));
  const res = await make({ ...PH, BACKEND_PH_GRUPPEN: "formulare" }, f)(formReq({ ...KONTAKT, lead_ref: lead, _t: NOW - 20000 }));
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.success, true);
  assert.equal(j.data.message.name, "PH-ANF-1");
  assert.equal(f.calls[0].url, "https://ph.staging.test/api/method/ph_crm.api.create_contact");
  assert.equal(f.calls[0].body.idempotency_key, lead);
  assert.equal(f.calls[0].body.lead_ref, undefined, "lead_ref bleibt auf der Website");

  const alt = fakeFetch(() => msg({ name: "KF-1" }));
  const resAlt = await make({}, alt)(formReq({ ...KONTAKT, _t: NOW - 20000 }));
  assert.equal(resAlt.status, 200);
  assert.equal(alt.calls[0].url, ALT_KONTAKT);
  assert.deepEqual(alt.calls[0].body, KONTAKT);

  const errLog = console.error;
  console.error = () => {};
  try {
    const none = fakeFetch();
    const res503 = await make({ BACKEND_PH_GRUPPEN: "formulare" }, none)(formReq({ ...KONTAKT, _t: NOW - 20000 }));
    assert.equal(res503.status, 503);
    assert.equal((await res503.json()).code, "not_configured");
    assert.equal(none.calls.length, 0);
  } finally {
    console.error = errLog;
  }
});

test("Newsletter: alt unverändert, ph → ph_marketing.api.subscribe_newsletter mit Token, Antwort neutral", async () => {
  assert.deepEqual(newsletterPhTarget({}), { generation: "alt" });
  assert.deepEqual(newsletterPhTarget({ BACKEND_PH_GRUPPEN: "newsletter" }), { generation: "ph", url: null, headers: null });
  const t = newsletterPhTarget({ ...PH, BACKEND_PH_GRUPPEN: "newsletter" });
  assert.equal(t.url, "https://ph.staging.test/api/method/ph_marketing.api.subscribe_newsletter");
  assert.equal(t.headers.Authorization, AUTH);
  const f = fakeFetch(() => msg({ success: true, doi: true, abo: "erika@example.com" }));
  const POST = newsletterHandler({ url: t.url, headers: t.headers, fetchImpl: f, limiter: createRateLimiter(), now: () => 1_800_000_000_000 });
  const res = await POST(new Request("http://localhost/api/newsletter_subscribe", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.0.1, 198.18.0.9" }, body: JSON.stringify({ email: " erika@example.com ", website: "", _t: 1_800_000_000_000 - 20000 }) }));
  assert.deepEqual(await res.json(), { success: true }, "keine Adresse an den Browser");
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.deepEqual(f.calls[0].body, { email: "erika@example.com" });
});

// ── Termin (ph_crm termin.py) ────────────────────────────────────────────────

test("Termin: Zugang + Methodenbasis ph_crm.api bei Gruppe termin, sonst FRAPPE_BOOKING_* wie bisher", () => {
  const alt = { FRAPPE_BOOKING_URL: "https://b.test", FRAPPE_BOOKING_KEY: "k", FRAPPE_BOOKING_SECRET: "s" };
  assert.equal(bookingCredentials(alt).methodBase, "platzhirsch_studio.termin.api");
  assert.deepEqual(bookingCredentials({ ...alt, ...PH, BACKEND_PH_GRUPPEN: "termin" }), { url: "https://ph.staging.test", key: "key1", secret: "secret1", methodBase: "ph_crm.api" });
  assert.equal(bookingCredentials({ ...alt, BACKEND_PH_GRUPPEN: "termin" }), null, "ph ohne Zugang: kein Rückfall auf das alte System");
});

test("Termin ph-Adapter: Pfade, Parameter, Auth, Mapping, Fehlercodes (body.message.code)", async () => {
  const cfg = bookingCredentials({ ...PH, BACKEND_PH_GRUPPEN: "termin" });
  const termin = { referenz: "PH-T-1", terminart: "beratung", modus: "studio", start: "2026-11-10T09:00:00+01:00", ende: "2026-11-10T10:00:00+01:00", status: "Unbestaetigt", email_verifiziert: 0, link_version: 1, sequence: 0, sprache: "de", vorname: "E", nachname: "M", email: "e@x.at", reserviert_bis: "2026-11-04T10:30:00+01:00" };
  const f = fakeFetch((url) => {
    if (url.includes("get_freie_slots")) return msg([{ start: "2026-11-10T08:00:00Z", ende: "2026-11-10T09:00:00Z", berater: ["a"] }]);
    if (url.includes("create_termin")) return msg({ ...termin, name: "PH-T-1" });
    if (url.includes("verify_termin")) return phErr("verify_expired", 410);
    if (url.includes("reschedule_termin")) return phErr("slot_taken", 409);
    if (url.includes("get_termin")) return phErr("invalid_token", 404);
    return msg(termin);
  });
  const a = createBookingAdapter(cfg, { fetchImpl: f });
  const days = await a.slots({ art: "beratung", modus: "studio", von: "2026-11-10", bis: "2026-11-10" });
  assert.match(f.calls[0].url, /^https:\/\/ph\.staging\.test\/api\/method\/ph_crm\.api\.get_freie_slots\?terminart=beratung&modus=studio&von=2026-11-10&bis=2026-11-10&zeitzone=Europe%2FVienna$/);
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.equal(days[0].slots.length, 1);
  const c = await a.create({ art: "beratung", modus: "studio", start: termin.start, vorname: "E", nachname: "M", email: "e@x.at", locale: "de", verifyHash: "h", idem: "idem-1" });
  assert.equal(f.calls[1].url, "https://ph.staging.test/api/method/ph_crm.api.create_termin");
  assert.equal(f.calls[1].body.idempotency_key, "idem-1");
  assert.equal(f.calls[1].body.verify_hash, "h");
  assert.equal(c.booking.status, "unbestaetigt");
  assert.equal(c.booking.ref, "PH-T-1");
  assert.deepEqual(await a.confirm("PH-T-1", "tok"), { ok: false, code: "verify_expired" });
  assert.deepEqual(await a.reschedule("PH-T-1", 1, termin.start), { ok: false, code: "slot_taken" });
  assert.equal(await a.get("PH-T-1"), null);
});

// ── Kundenkarte (ph_kundenkarte) ─────────────────────────────────────────────

test("Kundenkarte: Gruppe kundenkarte nimmt BACKEND_PH_*; Adapter ruft ph_kundenkarte.api", async () => {
  const alt = { FRAPPE_KUNDENKARTE_URL: "https://k.test", FRAPPE_KUNDENKARTE_KEY: "k", FRAPPE_KUNDENKARTE_SECRET: "s" };
  assert.equal(kundenkarteCredentials(alt).url, "https://k.test");
  const cfg = kundenkarteCredentials({ ...alt, ...PH, BACKEND_GENERATION: "ph" });
  assert.deepEqual(cfg, { url: "https://ph.staging.test", key: "key1", secret: "secret1", methodBase: "ph_kundenkarte.api" });
  assert.equal(kundenkarteCredentials({ ...alt, BACKEND_GENERATION: "ph" }), null);
  const f = fakeFetch(() => msg({ found: true, kartennummer: "PHK-1", status: "Aktiv" }));
  const card = await createKundenkarteAdapter(cfg, { fetchImpl: f }).portalCard("PH-KON-1", "t0k");
  assert.equal(card.kartennummer, "PHK-1");
  assert.match(f.calls[0].url, /^https:\/\/ph\.staging\.test\/api\/method\/ph_kundenkarte\.api\.portal_card\?kontakt=PH-KON-1&kunde_token=t0k$/);
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
});

// ── Einblicke (ph_marketing.tag_speichern) ───────────────────────────────────

test("Einblicke: ph → ph_marketing.api.tag_speichern mit Token; produktives Backoffice gesperrt; alt unverändert", async () => {
  const alt = { EINBLICKE_FRAPPE_URL: "https://e.test", EINBLICKE_FRAPPE_KEY: "k", EINBLICKE_FRAPPE_SECRET: "s" };
  assert.equal(frappeConfig(alt).method, "/api/method/platzhirsch_einblicke.api.tag_speichern");
  const env = { ...PH, BACKEND_PH_GRUPPEN: "einblicke" };
  const cfg = frappeConfig(env);
  assert.equal(cfg.mode, "live");
  assert.equal(cfg.method, "/api/method/ph_marketing.api.tag_speichern");
  assert.equal(frappeConfig({ ...env, EINBLICKE_FRAPPE_DRYRUN: "1" }).mode, "dry-run");
  const f = fakeFetch(() => msg({ datum: "2026-11-03", teile: "alle", status: "Vollstaendig" }));
  const r = await pushDay({ datum: "2026-11-03", schema: 1, meta: {}, seiten: [] }, { env, fetchImpl: f });
  assert.deepEqual(r, { mode: "live", teile: 1 });
  assert.equal(f.calls[0].url, "https://ph.staging.test/api/method/ph_marketing.api.tag_speichern");
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.equal(f.calls[0].body.datum, "2026-11-03");
  await assert.rejects(() => pushDay({ datum: "2026-11-03", schema: 1, meta: {} }, { env, fetchImpl: fakeFetch(() => ({ status: 503, body: {} })) }), /HTTP 503/);
});

// ── Zahlungsereignisse (ph_shop.payment_event) ───────────────────────────────

test("Zahlung: ph → ph_shop.api.payment_event, Body {event, idempotency_key}; ohne LIVE nur Probelauf", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ph-pay-"));
  const info = console.info;
  console.info = () => {};
  try {
    const ev = paymentEvent({ typ: "gutschein.bezahlt", art: "gutschein", referenz: "G-AB12-CD34", betragCent: 5000, zahlungsstatus: "bezahlt", session: "cs_1", paymentIntent: "pi_1", livemode: false, now: new Date("2026-11-04T10:00:00Z") });
    const f = fakeFetch(() => msg({ doctype: "PH Gutschein", referenz: "G-AB12-CD34", status: "Bezahlt", ergebnis: "angelegt" }));
    const env = { ...PH, BACKEND_PH_GRUPPEN: "zahlung", PAYMENTS_BACKOFFICE: "frappe", PAYMENTS_BACKOFFICE_LIVE: "1" };
    const b = backofficeFromEnv(env, dir, { fetchImpl: f });
    assert.equal(b.kind, "frappe");
    assert.deepEqual(await b.emit(ev), { ok: true });
    assert.equal(f.calls[0].url, "https://ph.staging.test/api/method/ph_shop.api.payment_event");
    assert.equal(f.calls[0].headers.get("authorization"), AUTH);
    assert.deepEqual(f.calls[0].body, { event: ev, idempotency_key: "pe:gutschein.bezahlt:G-AB12-CD34:2026-11-04T10:00:00.000Z" });
    // ohne PAYMENTS_BACKOFFICE_LIVE: nichts gesendet
    const f2 = fakeFetch();
    const p = createFrappeBackoffice({ env: { ...env, PAYMENTS_BACKOFFICE_LIVE: "" }, dir, fetchImpl: f2 });
    assert.equal(p.kind, "frappe-probelauf");
    assert.deepEqual(await p.emit(ev), { ok: true, dryRun: true });
    assert.equal(f2.calls.length, 0);
    // ph ohne Zugang trotz LIVE: Probelauf, nie das alte FRAPPE_URL
    const f3 = fakeFetch();
    const q = createFrappeBackoffice({ env: { BACKEND_PH_GRUPPEN: "zahlung", PAYMENTS_BACKOFFICE_LIVE: "1", FRAPPE_URL: "https://alt.test", FRAPPE_API_KEY: "a", FRAPPE_API_SECRET: "b" }, dir, fetchImpl: f3 });
    assert.equal(q.kind, "frappe-probelauf");
    // alt unverändert
    const f4 = fakeFetch(() => msg({}));
    const old = createFrappeBackoffice({ env: { PAYMENTS_BACKOFFICE_LIVE: "1", FRAPPE_URL: "https://alt.test/", FRAPPE_API_KEY: "a", FRAPPE_API_SECRET: "b" }, dir, fetchImpl: f4 });
    await old.emit(ev);
    assert.equal(f4.calls[0].url, "https://alt.test/api/method/platzhirsch_studio.api.payment_event");
    assert.equal(f4.calls[0].headers.get("authorization"), "token a:b");
    assert.deepEqual(f4.calls[0].body, { event: ev });
  } finally {
    console.info = info;
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Shop-Spiegel (ph_shop) ───────────────────────────────────────────────────

const ORDER = { id: "PH-S-261104-ABC123", status: "offen", lieferart: "versand", zahlung: "online", kunde: { name: "Erika Muster", email: "e@x.at" }, adresse: { land: "AT", plz: "6911", ort: "Lochau", strasse: "Landstraße", hausnr: "11" }, zeilen: [{ slug: "vase", menge: 1, einzelCent: 9900, summeCent: 9900 }], summen: { versandCent: 990, gesamtCent: 10890 }, verlauf: [{ zeit: "2026-11-04T10:00:00.000Z", status: "offen" }] };

test("orderCalls: create_order, attach_session (ohne idempotency_key), order_event je Status, versandbereit", () => {
  const [[m1, p1]] = orderCalls(null, ORDER);
  assert.equal(m1, "ph_shop.api.create_order");
  assert.equal(p1.record.bestellnummer, ORDER.id);
  assert.equal(p1.idempotency_key, `order:${ORDER.id}`);
  const s = orderCalls(ORDER, { ...ORDER, session: "cs_1" });
  assert.deepEqual(s, [["ph_shop.api.attach_session", { referenz: ORDER.id, session: "cs_1" }]]);
  assert.deepEqual(orderCalls(ORDER, { ...ORDER, status: "checkout_fehler" }), [["ph_shop.api.attach_session", { referenz: ORDER.id, status: "checkout_fehler" }]]);
  const paid = { ...ORDER, status: "bezahlt", payment_intent: "pi_1", livemode: false, betrag_bezahlt_cent: 10890, verlauf: [...ORDER.verlauf, { zeit: "2026-11-04T10:05:00.000Z", status: "bezahlt" }] };
  const [[m3, p3]] = orderCalls(ORDER, paid);
  assert.equal(m3, "ph_shop.api.order_event");
  assert.deepEqual(p3, { referenz: ORDER.id, status: "bezahlt", zeit: "2026-11-04T10:05:00.000Z", payment_intent: "pi_1", livemode: 0, betrag_bezahlt_cent: 10890, erstattet_cent: null, idempotency_key: `oe:${ORDER.id}:bezahlt:2026-11-04T10:05:00.000Z` });
  const [[, p4]] = orderCalls(paid, { ...paid, sendung: { awb: "AWB1", carrier: "DHL", shipmentId: "S1" } });
  assert.deepEqual(p4.sendung, { shipmentId: "S1", awb: "AWB1", carrier: "DHL" });
  assert.equal(p4.status, "versandbereit");
  assert.deepEqual(orderCalls(ORDER, { ...ORDER }), [], "keine Änderung → kein Aufruf");
  const w = withdrawalParams({ id: "WS-1", zeit: "z", name: "E", email: "e@x.at", bestellung: null, angabe: "PH-S-1", anschrift: "A", artikel: "Vase", bestelltAm: "2026-11-01", erhaltenAm: "2026-11-03" });
  assert.equal(w.bestellung, "PH-S-1");
  assert.equal(w.bestaetigung_senden, 0);
  assert.equal(w.idempotency_key, "widerruf:WS-1");
});

test("withPhMirror: lokaler Store bleibt Quelle, Spiegel meldet an ph_shop; Fehler stören nie; ohne ph unverändert", async () => {
  const mem = createMemoryOrderAdapter();
  assert.equal(withPhMirror(mem, { env: {} }), mem, "alt: derselbe Store");
  assert.equal(withPhMirror(mem, { env: { BACKEND_PH_GRUPPEN: "shop" }, logger: quiet }), mem, "ph ohne Zugang: nur lokal");

  const f = fakeFetch((url) => (url.includes("attach_session") ? phErr("not_found", 404) : msg({ referenz: ORDER.id, status: "Offen" })));
  const st = withPhMirror(createMemoryOrderAdapter(), { env: { ...PH, BACKEND_PH_GRUPPEN: "shop" }, fetchImpl: f, logger: quiet });
  assert.match(st.kind, /\+ph$/);
  await st.put("bestellungen", ORDER.id, ORDER);
  const saved = await st.update("bestellungen", ORDER.id, (o) => ({ ...o, session: "cs_9" }));
  assert.equal(saved.session, "cs_9", "lokales Ergebnis trotz ph-Fehler");
  await st.put("tarife", "q1", { id: "q1" });
  await st.put("widerrufe", "WS-2", { id: "WS-2", zeit: "z", name: "E", email: "e@x.at", bestellung: ORDER.id });
  assert.deepEqual(f.calls.map((c) => c.url.split("/api/method/")[1]), ["ph_shop.api.create_order", "ph_shop.api.attach_session", "ph_shop.api.request_withdrawal"]);
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.equal(f.calls[1].body.idempotency_key, undefined, "attach_session hat kein **kwargs");
  assert.deepEqual(st.phMirror.sent.map((x) => x.ok), [true, false, true]);
  assert.equal((await st.get("bestellungen", ORDER.id)).session, "cs_9");
  // Netzfehler: kein Throw
  const down = withPhMirror(createMemoryOrderAdapter(), { cfg: phAccess(PH), fetchImpl: fakeFetch(() => new TypeError("down")), logger: quiet });
  await down.put("bestellungen", ORDER.id, ORDER);
  assert.equal((await down.list("bestellungen")).length, 1);
});

// ── Upload (ph_crm.attach_upload) ────────────────────────────────────────────

test("Upload ph-Adapter: multipart mit Datei, JSON mit file_url, Endungen, Fehlercodes", async () => {
  assert.equal(phUploadAdapter({}), null, "alt: kein Upload ans Backend");
  assert.equal(phUploadAdapter({ BACKEND_PH_GRUPPEN: "upload" }).enabled, false);
  const f = fakeFetch(() => msg({ referenz: "PH-ANF-1", file: "f-1", file_url: null, upload_anzahl: 2 }));
  const a = createPhUploadAdapter(phAccess(PH), { fetchImpl: f });
  const r = await a.attach({ referenz: "PH-ANF-1", fileName: "plan.pdf", data: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf", note: "Grundriss" });
  assert.deepEqual(r, { ok: true, ref: "PH-ANF-1", fileId: "f-1", fileUrl: null, count: 2 });
  const c = f.calls[0];
  assert.equal(c.url, "https://ph.staging.test/api/method/ph_crm.api.attach_upload");
  assert.equal(c.headers.get("authorization"), AUTH);
  assert.equal(c.headers.get("content-type"), null, "Boundary setzt fetch");
  assert.ok(c.init.body instanceof FormData);
  assert.equal(c.init.body.get("referenz"), "PH-ANF-1");
  assert.equal(c.init.body.get("note"), "Grundriss");
  assert.equal(c.init.body.get("file").size, 4);
  await a.attach({ referenz: "PH-ANF-1", fileName: "video.mp4", fileUrl: "https://s3.test/v.mp4" });
  assert.deepEqual(f.calls[1].body, { referenz: "PH-ANF-1", file_url: "https://s3.test/v.mp4", file_name: "video.mp4" });
  assert.deepEqual(await a.attach({ referenz: "PH-ANF-1", fileName: "x.exe", data: new Uint8Array([1]) }), { ok: false, code: "invalid" });
  assert.deepEqual(await a.attach({ fileName: "a.pdf", data: new Uint8Array([1]) }), { ok: false, code: "invalid" });
  const e = createPhUploadAdapter(phAccess(PH), { fetchImpl: fakeFetch(() => phErr("not_found", 404)) });
  assert.deepEqual(await e.attach({ referenz: "X", fileName: "a.pdf", data: new Uint8Array([1]) }), { ok: false, code: "not_found" });
});

// ── Portal (ph_projekte) ─────────────────────────────────────────────────────

function memTokenStore() {
  const m = new Map();
  return { m, get: async (k) => m.get(k) || null, set: async (k, v) => void m.set(k, v) };
}

test("Portal ph-Adapter: Vertrag vollständig, Login-Token serverseitig, Parameter je Methode", async () => {
  const tokens = memTokenStore();
  const customer = { id: "PH-KON-00001", email: "e@x.at", salutation: "Frau", firstName: "E", lastName: "M", displayName: "Frau M", advisor: { name: "A", email: "a@p.at", phone: "1" } };
  const f = fakeFetch((url, init) => {
    const m = url.split("/api/method/")[1];
    if (m === "ph_projekte.api.portal_login_token") return msg({ found: true, kontakt: "PH-KON-00001", kunde_token: "geheim", customer });
    if (m === "ph_projekte.api.portal_customer") return msg(customer);
    if (m === "ph_projekte.api.portal_projects") return msg([{ id: "PH-PRJ-1", title: "Wohnzimmer", steps: [] }]);
    if (m === "ph_projekte.api.portal_product_pass") return msg({ id: "PP-1" });
    if (m === "ph_projekte.api.portal_mark_read") return msg(2);
    if (m === "ph_projekte.api.portal_add_feedback") return msg({ id: "w1", frappeId: "F-1", createdAt: "2026-11-04", entry: {} });
    if (m === "ph_kundenkarte.api.portal_card") return msg({ found: false });
    if (m === "ph_projekte.api.portal_file") return msg({ name: "r.webp", mime: "image/webp", size: 3, content_base64: "AAEC" });
    return msg([]);
  });
  const a = createPhPortalAdapter({ cfg: phAccess(PH), tokenStore: tokens, fetchImpl: f });
  for (const name of ADAPTER_METHODS) assert.equal(typeof a[name], "function", name);

  const c = await a.findCustomerByEmail(" E@X.at ");
  assert.equal(c.id, "PH-KON-00001");
  assert.equal(c.displayName, "Frau M");
  assert.deepEqual(f.calls[0].body, { email: "e@x.at" });
  assert.equal(tokens.m.get("PH-KON-00001"), "geheim");
  assert.equal(JSON.stringify(c).includes("geheim"), false, "Token nie in der Kundenform");

  assert.equal((await a.getCustomer("PH-KON-00001")).id, "PH-KON-00001");
  assert.deepEqual(f.calls[1].body, { kontakt: "PH-KON-00001", kunde_token: "geheim" });
  assert.equal(f.calls[1].headers.get("authorization"), AUTH);
  assert.equal((await a.listProjects("PH-KON-00001"))[0].id, "PH-PRJ-1");
  await a.listDocuments("PH-KON-00001", { type: "angebot", projectId: "PH-PRJ-1" });
  assert.deepEqual(f.calls.at(-1).body, { kontakt: "PH-KON-00001", kunde_token: "geheim", type: "angebot", projekt: "PH-PRJ-1" });
  await a.listAppointments("PH-KON-00001", { from: "2026-11-01" });
  assert.deepEqual(f.calls.at(-1).body, { kontakt: "PH-KON-00001", kunde_token: "geheim", von: "2026-11-01" });
  await a.getProductPass("PH-KON-00001", "PP-1");
  assert.deepEqual(f.calls.at(-1).body, { kontakt: "PH-KON-00001", kunde_token: "geheim", produktpass: "PP-1" });
  assert.equal(await a.markMessagesRead("PH-KON-00001", ["m1", "m2"]), 2);
  assert.deepEqual(f.calls.at(-1).body.message_ids, ["m1", "m2"]);
  const fb = await a.addFeedback("PH-KON-00001", { kind: "kommentar", projectId: "PH-PRJ-1", body: "Schön" });
  assert.equal(fb.id, "w1");
  assert.deepEqual(f.calls.at(-1).body.eintrag, { kind: "kommentar", projectId: "PH-PRJ-1", body: "Schön" });
  await a.sendMessage("PH-KON-00001", { body: "Hallo", projectId: "PH-PRJ-1" });
  assert.deepEqual(f.calls.at(-1).body, { kontakt: "PH-KON-00001", kunde_token: "geheim", body: "Hallo", projekt: "PH-PRJ-1" });
  assert.equal(await a.getCustomerCard("PH-KON-00001"), null, "found:false → keine Karte");
  assert.equal((await a.readFile("PH-KON-00001", "/private/files/r.webp")).content_base64, "AAEC");
  // ohne Token (fremde/abgelaufene Sitzung): kein Aufruf, leere Antworten
  const n = f.calls.length;
  assert.equal(await a.getCustomer("PH-KON-99999"), null);
  assert.deepEqual(await a.listProjects("PH-KON-99999"), []);
  assert.equal(f.calls.length, n);
});

test("Portal ph-Adapter: invalid_token/expired → abgemeldet, andere Fehler werfen PhPortalError", async () => {
  const tokens = memTokenStore();
  await tokens.set("K1", "t");
  const exp = createPhPortalAdapter({ cfg: phAccess(PH), tokenStore: tokens, fetchImpl: fakeFetch(() => phErr("expired", 410)) });
  assert.equal(await exp.getCustomer("K1"), null);
  assert.deepEqual(await exp.listRenderings("K1", "P1"), []);
  const bad = createPhPortalAdapter({ cfg: phAccess(PH), tokenStore: tokens, fetchImpl: fakeFetch(() => phErr("unavailable", 503)) });
  await assert.rejects(() => bad.listProjects("K1"), (e) => e instanceof PhPortalError && e.code === "unavailable" && e.status === 503);
  const unknown = createPhPortalAdapter({ cfg: phAccess(PH), tokenStore: tokens, fetchImpl: fakeFetch(() => msg({ found: false })) });
  assert.equal(await unknown.findCustomerByEmail("nobody@x.at"), null);
  assert.throws(() => createPhPortalAdapter({ cfg: null, tokenStore: tokens }), /BACKEND_PH_URL/);
});

test("Portal-Token-Speicher: verschlüsselt, Ablauf, falsches Geheimnis", async () => {
  const sealed = sealToken("geheim", "s".repeat(32));
  assert.equal(sealed.includes("geheim"), false);
  assert.equal(openToken(sealed, "s".repeat(32)), "geheim");
  assert.equal(openToken(sealed, "x".repeat(32)), null);
  assert.equal(openToken("kaputt", "s".repeat(32)), null);
  let data = {};
  let now = 1000;
  const store = createTokenStore({ read: async () => data, update: async (fn) => void (data = fn(data)), secret: () => "s".repeat(32), now: () => now, maxAgeMs: 100 });
  await store.set("K1", "t1");
  assert.equal(await store.get("K1"), "t1");
  assert.equal(JSON.stringify(data).includes("t1"), false);
  now = 1200;
  assert.equal(await store.get("K1"), null, "abgelaufen");
  await store.set("K2", "t2");
  assert.deepEqual(Object.keys(data), ["K2"], "Abgelaufene fallen beim Schreiben weg");
});
