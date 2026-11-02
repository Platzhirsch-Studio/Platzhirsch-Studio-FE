// tests/unit/stripe-payments.test.mjs — Stripe-Vorbereitung (Gutscheinkauf,
// Anzahlungen, Webhook, Register, Widerruf, Mock).
// Run: node --test tests/unit/stripe-payments.test.mjs
// Kein Netz: Stripe wird nie angefragt (Mock-Gateway bzw. abgefangene
// Parameter), Mails gehen in eine temporäre outbox, das Backoffice nur in
// einen Speicher-Adapter. Signaturen mit dem echten SDK (generateTestHeaderString).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Stripe from "stripe";
import { anzahlungMode, voucherEnabled, voucherMode, voucherModeRequested, voucherDevMock } from "../../src/lib/commerce/mode.js";
import { baseUrl, isProduction, linkSecret, mockActive, paymentsConfigProblems, stripeKeysReady } from "../../src/lib/payments/config.js";
import { ALPHABET, codeHash, linkToken, newVoucherCode, normalizeCode, safeEqual, verifyLinkToken } from "../../src/lib/payments/codes.js";
import { createContext } from "../../src/lib/payments/context.js";
import { createMemoryStore, createFileStore } from "../../src/lib/payments/store.js";
import { createOutboxMailer } from "../../src/lib/payments/mailer.js";
import { createFrappeBackoffice } from "../../src/lib/payments/backoffice.js";
import { createStripeGateway, signTestEvent } from "../../src/lib/payments/gateway.js";
import { checkoutParams, newVoucherOrder, voucherOrderSchema } from "../../src/lib/payments/voucherOrder.js";
import { parseEuroCents } from "../../src/lib/payments/deposit.js";
import { voucherPdf } from "../../src/lib/payments/pdf.js";
import {
  deliverMockEvent,
  depositAdminHandlers,
  depositPayHandler,
  mockHandler,
  registerHandler,
  statusForSession,
  stripeWebhookHandler,
  voucherCheckoutHandler,
  withdrawalHandler,
} from "../../src/lib/payments/handlers.js";
import { webhookHandler } from "../../src/lib/payments/webhook.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";

const NOW = 1_800_000_000_000;
const KEYS = { STRIPE_SECRET_KEY: "sk_test_51abcdefghijklmnop", STRIPE_WEBHOOK_SECRET: "whsec_testsecret12345678" };
const ADMIN = "a".repeat(40);
const MAIL = { PAYMENTS_MAIL_PROVIDER: "resend", PAYMENTS_MAIL_API_KEY: "re_test_123456", PAYMENTS_MAIL_FROM: "Platzhirsch <info@platzhirsch.studio>" };
// Inhaberfragen 2/3 entschieden (voucherTerms.js VOUCHER_TAX/VOUCHER_VALIDITY), sonst kein "stripe".
const DECIDED = { tax: "einzweck", validity: "unbefristet" };
const OK = { termsStatus: "freigegeben", withdrawalStatus: "freigegeben", decisions: DECIDED };
let ipN = 0;
const ip = () => `203.0.113.${(++ipN % 250) + 1}`;

function memBackoffice() {
  const events = [];
  return { kind: "memory", events, async emit(e) {
    events.push(e);
    return { ok: true };
  } };
}
function memMailer() {
  const mails = [];
  return { kind: "memory", mails, async send(m) {
    mails.push(m);
    return { ok: true };
  } };
}
/** Gateway, das die Parameter festhält und eine Fake-Session liefert. */
function captureGateway() {
  const calls = [];
  return {
    kind: "stripe",
    testmode: true,
    calls,
    async createCheckoutSession(params, opts) {
      calls.push({ params, opts });
      return { id: `cs_test_${String(calls.length).padStart(10, "0")}`, url: "https://checkout.stripe.com/c/pay/cs_test_x", expires_at: Math.floor(NOW / 1000) + 3600 };
    },
    verifyEvent() {
      throw new Error("not used");
    },
  };
}
function makeCtx(env = {}, extra = {}) {
  let t = NOW;
  return createContext({ env: { ...env }, store: createMemoryStore(), mailer: memMailer(), backoffice: memBackoffice(), now: () => t, ...extra, _tick: (ms) => (t += ms) });
}
const post = (url, body, headers = {}) =>
  new Request(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip(), ...headers }, body: JSON.stringify(body) });

const ORDER = { betrag: 100, anzahl: 2, motiv: "seelicht", empfaenger: "Anna", grusstext: "Alles Gute", name: "Max Muster", email: "max@example.com", bedingungen: true, _t: 5000, website: "" };

/** Signiertes Ereignis durch den echten Handler (Stripe-Geheimnis). */
async function deliver(ctx, event, secret = KEYS.STRIPE_WEBHOOK_SECRET) {
  const raw = JSON.stringify(event);
  const sig = signTestEvent(raw, secret);
  const sdk = new Stripe(KEYS.STRIPE_SECRET_KEY);
  const res = await webhookHandler({ ctx, verify: (r, s) => sdk.webhooks.constructEvent(r, s, secret) })(
    new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": sig }, body: raw })
  );
  return { status: res.status, body: await res.json() };
}
let evtN = 0;
const event = (type, object, livemode = false) => ({ id: `evt_test_${++evtN}`, type, livemode, data: { object } });

async function buyVoucher(ctx, gw, body = ORDER) {
  const POST = voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() });
  const res = await POST(post("http://localhost/api/payments/gutschein/checkout", body));
  return { res, json: await res.json(), call: gw.calls.at(-1) };
}

// ---------- Schalter ----------

test("Modus: stripe nur mit Schlüsseln UND freigegebenen Texten, sonst Rückfall", () => {
  const env = { VOUCHER_MODE: "stripe", ...KEYS };
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "stripe");
  // Bedingungen Entwurf → off (wie bisher)
  assert.equal(voucherMode(env, "entwurf", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "off");
  // Widerrufsbelehrung Entwurf → anfrage
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "entwurf" }), "anfrage");
  // Schlüssel fehlen → anfrage
  assert.equal(voucherMode({ VOUCHER_MODE: "stripe" }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage");
  assert.equal(voucherMode({ VOUCHER_MODE: "stripe", STRIPE_SECRET_KEY: KEYS.STRIPE_SECRET_KEY }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage", "ohne Webhook-Geheimnis");
  assert.equal(voucherMode({ VOUCHER_MODE: "stripe", STRIPE_WEBHOOK_SECRET: KEYS.STRIPE_WEBHOOK_SECRET }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage", "ohne Secret Key");
  // Heute (Repo-Stand): Entwurf → off, auch mit Schlüsseln
  assert.equal(voucherMode(env), "off");
  assert.equal(voucherEnabled(env), false);
  // Altes stripe_link bleibt off, anfrage unverändert
  assert.equal(voucherMode({ VOUCHER_MODE: "stripe_link", ...KEYS }, "freigegeben"), "off");
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "freigegeben"), "anfrage");
  assert.equal(voucherModeRequested({ VOUCHER_MODE: "STRIPE" }), "stripe");
});

test("Modus: Mock zählt nur außerhalb der Produktion", () => {
  const env = { VOUCHER_MODE: "stripe", PAYMENTS_MOCK: "1" };
  assert.equal(voucherMode({ ...env, NODE_ENV: "test" }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "stripe");
  assert.equal(voucherMode({ ...env, NODE_ENV: "production" }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage");
  assert.equal(voucherMode({ ...env, VERCEL_ENV: "production" }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage");
  // Kopfzeile/Query nur im Entwicklungsserver
  assert.equal(mockActive({ NODE_ENV: "development" }, { header: "1" }), true);
  assert.equal(mockActive({ NODE_ENV: "production" }, { header: "1" }), false);
  assert.equal(mockActive({}, { header: "1" }), false, "ohne NODE_ENV=development keine Kopfzeile");
  assert.equal(voucherDevMock({ NODE_ENV: "development" }, "mock"), true);
  assert.equal(voucherDevMock({ NODE_ENV: "production" }, "mock"), false);
  assert.equal(voucherDevMock({ NODE_ENV: "development" }, null), false);
});

test("Modus Anzahlung: stripe braucht Schlüssel und Admin-Geheimnis, sonst anfrage", () => {
  assert.equal(anzahlungMode({}), "off");
  assert.equal(anzahlungMode({ ANZAHLUNG_MODE: "anfrage" }), "anfrage");
  assert.equal(anzahlungMode({ ANZAHLUNG_MODE: "stripe" }), "anfrage");
  assert.equal(anzahlungMode({ ANZAHLUNG_MODE: "stripe", ...KEYS }), "anfrage", "ohne PAYMENTS_ADMIN_SECRET");
  assert.equal(anzahlungMode({ ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN }), "stripe");
  assert.equal(anzahlungMode({ ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: "kurz" }), "anfrage");
  // Produktion: Link-Geheimnis Pflicht, Testschlüssel nur mit Freigabe
  const prod = { NODE_ENV: "production", ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN, PAYMENTS_ALLOW_TEST_KEYS: "1" };
  assert.equal(anzahlungMode(prod), "anfrage");
  assert.equal(anzahlungMode({ ...prod, PAYMENTS_LINK_SECRET: "b".repeat(40) }), "anfrage", "Produktion ohne Mail-Anbieter (QA P1)");
  assert.equal(anzahlungMode({ ...prod, ...MAIL, PAYMENTS_LINK_SECRET: "b".repeat(40) }), "stripe");
});

test("Konfiguration: Testschlüssel in Produktion nur mit PAYMENTS_ALLOW_TEST_KEYS, Probleme ohne Werte", () => {
  assert.equal(stripeKeysReady(KEYS), true);
  assert.equal(stripeKeysReady({ ...KEYS, NODE_ENV: "production" }), false);
  assert.equal(stripeKeysReady({ ...KEYS, NODE_ENV: "production", PAYMENTS_ALLOW_TEST_KEYS: "1" }), true);
  assert.equal(stripeKeysReady({ STRIPE_SECRET_KEY: "pk_test_123456789", STRIPE_WEBHOOK_SECRET: KEYS.STRIPE_WEBHOOK_SECRET }), false, "publishable key ist kein Secret");
  const problems = paymentsConfigProblems({ NODE_ENV: "production", ...KEYS });
  assert.ok(problems.some((p) => /Live-Schlüssel/.test(p)));
  assert.ok(problems.every((p) => !p.includes(KEYS.STRIPE_SECRET_KEY)));
  assert.equal(baseUrl({ NODE_ENV: "production" }), "https://platzhirsch.studio");
  assert.equal(baseUrl({ NODE_ENV: "production", PAYMENTS_BASE_URL: "http://evil.example" }), "https://platzhirsch.studio");
  assert.equal(linkSecret({ NODE_ENV: "production" }), null);
  assert.equal(isProduction({ VERCEL_ENV: "production" }), true);
});

// ---------- Codes ----------

test("Gutscheincodes: kryptografisch zufällig, 80 bit, eindeutig, ohne Verwechsler", () => {
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const c = newVoucherCode();
    assert.match(c, /^PH-[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){3}$/);
    seen.add(c);
  }
  assert.equal(seen.size, 5000);
  assert.equal(ALPHABET.length, 32);
  assert.doesNotMatch(ALPHABET, /[01OI]/);
  assert.match(newVoucherCode({ test: true }), /^TEST-PH-/);
  const c = newVoucherCode();
  assert.equal(normalizeCode(c.toLowerCase().replace(/-/g, " ")), normalizeCode(c));
  assert.equal(normalizeCode("PH-0000-0000-0000-0000"), null);
  assert.notEqual(codeHash(normalizeCode(c)), normalizeCode(c));
  const src = fs.readFileSync(new URL("../../src/lib/payments/codes.js", import.meta.url), "utf8");
  assert.match(src, /randomBytes/);
  assert.doesNotMatch(src, /Math\.random/);
});

test("Anzahlungs-Link: HMAC-signiert, Manipulation und anderer Schlüssel scheitern", () => {
  const secret = "s".repeat(40);
  const t = linkToken("AZ-ABCD-EFGH", secret);
  assert.equal(verifyLinkToken(t, secret), "AZ-ABCD-EFGH");
  assert.equal(verifyLinkToken(t.replace("AZ-ABCD", "AZ-ABCE"), secret), null);
  assert.equal(verifyLinkToken(t, "x".repeat(40)), null);
  assert.equal(verifyLinkToken(`${t.slice(0, -1)}A`, secret) === "AZ-ABCD-EFGH" && !t.endsWith("A"), false);
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(parseEuroCents("1.250,50"), 125050);
  assert.equal(parseEuroCents("1250.5"), 125050);
  assert.equal(parseEuroCents("12,3,4"), NaN);
});

// ---------- Gutscheinkauf ----------

test("Kauf: off/anfrage → 404, kein Checkout", async () => {
  const gw = captureGateway();
  for (const env of [{}, { VOUCHER_MODE: "anfrage" }, { VOUCHER_MODE: "stripe" }]) {
    const ctx = makeCtx(env, { gateway: gw });
    const res = await voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() })(post("http://localhost/x", ORDER));
    assert.equal(res.status, 404, JSON.stringify(env));
  }
  // Repo-Stand (Entwurf) mit Schlüsseln: 404
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  assert.equal((await voucherCheckoutHandler({ ctx, limiter: createRateLimiter() })(post("http://localhost/x", ORDER))).status, 404);
  assert.equal(gw.calls.length, 0);
});

test("Kauf: Checkout-Parameter – Preis vom Server, Zahlungsarten aus dem Dashboard, Rücksprung, Metadaten", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const { res, json, call } = await buyVoucher(ctx, gw, { ...ORDER, preis: 1, unit_amount: 1, amount: 1 });
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.url, "https://checkout.stripe.com/c/pay/cs_test_x");
  const p = call.params;
  assert.equal(p.mode, "payment");
  assert.equal(p.payment_method_types, undefined, "keine hart codierten Zahlungsarten");
  assert.equal(p.line_items.length, 1);
  assert.equal(p.line_items[0].quantity, 2);
  assert.equal(p.line_items[0].price_data.unit_amount, 10000);
  assert.equal(p.line_items[0].price_data.currency, "eur");
  assert.equal(p.metadata.art, "gutschein");
  assert.match(p.metadata.order_id, /^G-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(p.payment_intent_data.metadata.order_id, p.metadata.order_id);
  assert.equal(p.success_url, "http://localhost:3000/de/zahlung/erfolg?session_id={CHECKOUT_SESSION_ID}");
  assert.match(p.cancel_url, /\/de\/zahlung\/abbruch\?art=gutschein$/);
  assert.equal(p.customer_email, "max@example.com");
  assert.equal(p.submit_type, "pay");
  assert.equal(call.opts.idempotencyKey, `gutschein-${p.metadata.order_id}`);
  const order = await ctx.store.get("orders", p.metadata.order_id);
  assert.equal(order.status, "offen");
  assert.equal(order.codes.length, 0, "kein Code vor der Zahlung");
  assert.equal(order.summe_cent, 20000);
  assert.ok(order.zustimmung.bedingungen && order.zustimmung.widerruf);
  // optionale Zahlungsarten-Konfiguration
  const pmc = checkoutParams(order, { env: { STRIPE_PAYMENT_METHOD_CONFIGURATION: "pmc_1234567890abc" } });
  assert.equal(pmc.payment_method_configuration, "pmc_1234567890abc");
});

test("Kauf: Bedingungen nicht bestätigt, zu viele Stück, zu hoher Gesamtbetrag → 400", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  for (const [body, field] of [
    [{ ...ORDER, bedingungen: false }, "bedingungen"],
    [{ ...ORDER, bedingungen: "true" }, "bedingungen"],
    [{ ...ORDER, anzahl: 11 }, "anzahl"],
    [{ ...ORDER, betrag: 1000, anzahl: 6 }, "anzahl"],
    [{ ...ORDER, betrag: 20 }, "betrag"],
  ]) {
    const { res, json } = await buyVoucher(ctx, gw, body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(json.field, field);
  }
  assert.equal(gw.calls.length, 0);
  const { json } = await buyVoucher(ctx, gw, { ...ORDER, bedingungen: undefined });
  assert.equal(json.field, "bedingungen");
  assert.equal(voucherOrderSchema.safeParse({ ...ORDER }).success, true);
});

test("Kauf: fremde Herkunft (Origin) → 403", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const res = await voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() })(post("http://localhost/x", ORDER, { Origin: "https://evil.example", Host: "localhost" }));
  assert.equal(res.status, 403);
});

// ---------- Webhook ----------

test("Webhook: ohne/mit falscher Signatur 400, nichts verarbeitet", async () => {
  const ctx = makeCtx(KEYS);
  const sdk = new Stripe(KEYS.STRIPE_SECRET_KEY);
  const POST = webhookHandler({ ctx, verify: (r, s) => sdk.webhooks.constructEvent(r, s, KEYS.STRIPE_WEBHOOK_SECRET) });
  const raw = JSON.stringify(event("checkout.session.completed", { id: "cs_x", payment_status: "paid", metadata: {} }));
  assert.equal((await POST(new Request("http://x", { method: "POST", body: raw }))).status, 400);
  assert.equal((await POST(new Request("http://x", { method: "POST", headers: { "stripe-signature": signTestEvent(raw, "whsec_falsch12345678") }, body: raw }))).status, 400);
  // Rohtext zählt: nach der Signatur verändert → 400
  const sig = signTestEvent(raw, KEYS.STRIPE_WEBHOOK_SECRET);
  assert.equal((await POST(new Request("http://x", { method: "POST", headers: { "stripe-signature": sig }, body: raw.replace("paid", "pai d") }))).status, 400);
  assert.equal((await ctx.store.list("events")).length, 0);
  // Route-Handler ohne Schlüssel und ohne Mock → 404
  assert.equal((await stripeWebhookHandler({ ctx: makeCtx({}) })(new Request("http://x", { method: "POST", body: "{}" }))).status, 404);
  // Mit Schlüsseln nutzt die Route das echte Geheimnis
  const live = makeCtx(KEYS);
  const r2 = await stripeWebhookHandler({ ctx: live })(new Request("http://x", { method: "POST", headers: { "stripe-signature": sig }, body: raw }));
  assert.equal(r2.status, 200);
  // Mock-Geheimnis wird ohne PAYMENTS_MOCK nicht akzeptiert
  const r3 = await stripeWebhookHandler({ ctx: makeCtx(KEYS) })(new Request("http://x", { method: "POST", headers: { "stripe-signature": signTestEvent(raw) }, body: raw }));
  assert.equal(r3.status, 400);
});

test("Webhook: Codes erst nach bestätigter Zahlung, PDF per Mail, Backoffice-Ereignis, Idempotenz", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const { call } = await buyVoucher(ctx, gw);
  const orderId = call.params.metadata.order_id;
  const session = { id: "cs_test_0000000001", object: "checkout.session", amount_total: 20000, currency: "eur", payment_intent: "pi_1", metadata: call.params.metadata, customer_details: { email: "max@example.com", name: "Max Muster", address: { country: "AT" } } };

  // SEPA: completed, aber unpaid → keine Codes
  const r1 = await deliver(ctx, event("checkout.session.completed", { ...session, payment_status: "unpaid" }));
  assert.equal(r1.body.result, "ausstehend");
  assert.equal((await ctx.store.get("orders", orderId)).status, "zahlung_ausstehend");
  assert.equal((await ctx.store.list("register")).length, 0);
  assert.equal(ctx.mailer.mails.length, 0);

  // Lastschrift bestätigt → Codes, Mail, Ereignis
  const ev = event("checkout.session.async_payment_succeeded", { ...session, payment_status: "paid" });
  const r2 = await deliver(ctx, ev);
  assert.equal(r2.status, 200);
  assert.equal(r2.body.result, "erfuellt");
  const order = await ctx.store.get("orders", orderId);
  assert.equal(order.status, "bezahlt");
  assert.equal(order.codes.length, 2);
  const reg = await ctx.store.list("register");
  assert.equal(reg.length, 2);
  assert.ok(reg.every((r) => r.status === "test" && r.test === true), "livemode false → Testgutscheine");
  const mail = ctx.mailer.mails[0];
  assert.equal(mail.to, "max@example.com");
  assert.equal(mail.attachments.length, 2);
  assert.match(mail.attachments[0].content.subarray(0, 8).toString("latin1"), /^%PDF-1\.4/);
  assert.match(mail.text, /TEST-PH-/);
  assert.match(mail.text, /Rechnung/);
  assert.match(mail.text, /zahlung\/widerruf/);
  const be = ctx.backoffice.events.find((e) => e.typ === "gutschein.bezahlt");
  assert.equal(be.referenz, orderId);
  assert.equal(be.betrag_cent, 20000);
  assert.equal(be.zahlungsstatus, "bezahlt");
  assert.equal(JSON.stringify(be).includes("max@example.com"), false, "keine E-Mail im Backoffice-Ereignis");

  // Gleiches Ereignis erneut → duplicate, keine neuen Codes
  const r3 = await deliver(ctx, ev);
  assert.equal(r3.body.duplicate, true);
  // Anderes Ereignis gleicher Session → bereits erfüllt
  const r4 = await deliver(ctx, event("checkout.session.completed", { ...session, payment_status: "paid" }));
  assert.equal(r4.body.result, "bereits_erfuellt");
  assert.equal((await ctx.store.list("register")).length, 2);
  assert.equal(ctx.mailer.mails.length, 1);
  // Späte "unpaid"-Zustellung stuft nicht zurück
  await deliver(ctx, event("checkout.session.completed", { ...session, payment_status: "unpaid" }));
  assert.equal((await ctx.store.get("orders", orderId)).status, "bezahlt");

  // Status für die Erfolgsseite ohne Personendaten
  await ctx.store.update("orders", orderId, (o) => ({ ...o, session: session.id }));
  const st = await statusForSession(ctx, session.id);
  assert.equal(st.status, "bezahlt");
  assert.equal(JSON.stringify(st).includes("Max"), false);
});

test("Webhook: Livemodus erzeugt echte Codes; Betrag weicht ab → prüfen, keine Codes", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const a = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  const r = await deliver(ctx, event("checkout.session.completed", { id: "cs_live_a1234567", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: a, payment_intent: "pi_a" }, true));
  assert.equal(r.body.result, "erfuellt");
  const reg = await ctx.store.list("register");
  assert.equal(reg[0].status, "aktiv");
  assert.doesNotMatch(ctx.mailer.mails[0].text, /TEST/);

  const b = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  const r2 = await deliver(ctx, event("checkout.session.completed", { id: "cs_live_b1234567", amount_total: 100, currency: "eur", payment_status: "paid", metadata: b }, true));
  assert.equal(r2.body.result, "pruefen");
  assert.equal((await ctx.store.get("orders", b.order_id)).codes.length, 0);
  const r3 = await deliver(ctx, event("checkout.session.completed", { id: "cs_live_c1234567", amount_total: 10000, currency: "chf", payment_status: "paid", metadata: b }, true));
  assert.equal(r3.body.result, "pruefen");
});

test("Webhook: Fehlschlag, Ablauf und Erstattung (Gutscheine gesperrt)", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const m1 = (await buyVoucher(ctx, gw)).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_test_f1234567", amount_total: 20000, currency: "eur", payment_status: "unpaid", metadata: m1, customer_details: { email: "max@example.com" } }));
  const f = await deliver(ctx, event("checkout.session.async_payment_failed", { id: "cs_test_f1234567", amount_total: 20000, currency: "eur", payment_status: "unpaid", metadata: m1, customer_details: { email: "max@example.com" } }));
  assert.equal(f.body.result, "fehlgeschlagen");
  assert.equal((await ctx.store.get("orders", m1.order_id)).status, "fehlgeschlagen");
  assert.equal((await ctx.store.list("register")).length, 0);
  assert.match(ctx.mailer.mails.at(-1).subject, /nicht erfolgreich/);

  const m2 = (await buyVoucher(ctx, gw)).call.params.metadata;
  await deliver(ctx, event("checkout.session.expired", { id: "cs_test_e1234567", metadata: m2 }));
  assert.equal((await ctx.store.get("orders", m2.order_id)).status, "abgelaufen");

  const m3 = (await buyVoucher(ctx, gw)).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_live_r1234567", amount_total: 20000, currency: "eur", payment_status: "paid", payment_intent: "pi_r", metadata: m3 }, true));
  const r = await deliver(ctx, event("charge.refunded", { id: "ch_1", object: "charge", payment_intent: "pi_r", amount: 20000, amount_refunded: 20000, refunded: true, metadata: {} }, true));
  assert.match(r.body.result, /^erstattet:2_gesperrt$/);
  const order = await ctx.store.get("orders", m3.order_id);
  assert.equal(order.status, "erstattet");
  for (const c of order.codes) assert.equal((await ctx.store.get("register", c.hash)).status, "gesperrt");
  assert.ok(ctx.backoffice.events.some((e) => e.typ === "gutschein.erstattet"));
});

test("Webhook-Logs: keine Namen, E-Mails oder Codes im Klartext", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const logs = [];
  const orig = { info: console.info, warn: console.warn, error: console.error, log: console.log };
  for (const k of Object.keys(orig)) console[k] = (...a) => logs.push(a.join(" "));
  try {
    const m = (await buyVoucher(ctx, gw)).call.params.metadata;
    await deliver(ctx, event("checkout.session.completed", { id: "cs_live_l1234567", amount_total: 20000, currency: "eur", payment_status: "paid", metadata: m, customer_details: { email: "max@example.com", name: "Max Muster" } }, true));
    const outbox = createOutboxMailer(fs.mkdtempSync(path.join(os.tmpdir(), "ph-outbox-")));
    await outbox.send({ to: "max@example.com", subject: "x", text: "x", tag: "t" });
  } finally {
    Object.assign(console, orig);
  }
  const all = logs.join("\n");
  assert.ok(logs.length > 0);
  assert.doesNotMatch(all, /max@example\.com|Max Muster|PH-[2-9A-Z]{4}-/);
});

// ---------- Anzahlungen ----------

test("Anzahlung: Admin-Endpunkt nur mit Geheimnis, Link, Checkout mit Server-Betrag, Webhook, Status", async () => {
  const gw = captureGateway();
  const env = { ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN };
  const ctx = makeCtx(env, { gateway: gw });
  const admin = depositAdminHandlers({ ctx, limiter: createRateLimiter() });
  const body = { auftrag: "A-2026-0142", betrag: "1.250,00", beschreibung: "Sofa Minotti, 30 %", email: "kunde@example.com", kunde: "CUST-1", senden: true };

  // Modus off → 404 auch mit Geheimnis
  const off = depositAdminHandlers({ ctx: makeCtx({ ...env, ANZAHLUNG_MODE: "anfrage" }), limiter: createRateLimiter() });
  assert.equal((await off.POST(post("http://localhost/a", body, { Authorization: `Bearer ${ADMIN}` }))).status, 404);
  // ohne / falsches Geheimnis → 401
  assert.equal((await admin.POST(post("http://localhost/a", body))).status, 401);
  assert.equal((await admin.POST(post("http://localhost/a", body, { Authorization: "Bearer falsch" }))).status, 401);
  // richtig → 201 + Link
  const res = await admin.POST(post("http://localhost/a", body, { Authorization: `Bearer ${ADMIN}` }));
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.anzahlung.betrag_cent, 125000);
  assert.match(json.link, /^http:\/\/localhost:3000\/de\/zahlung\/anzahlung\/AZ-[A-Z0-9]{4}-[A-Z0-9]{4}\.[A-Za-z0-9_-]{32}$/);
  assert.equal(json.mail, "gesendet");
  assert.equal(ctx.mailer.mails[0].to, "kunde@example.com");
  assert.ok(ctx.mailer.mails[0].text.includes(json.link));
  assert.equal(JSON.stringify(json.anzahlung).includes("kunde@example.com"), false);

  // Kunde startet Checkout; Betrag aus der Ablage
  const token = json.link.split("/").pop();
  const pay = depositPayHandler({ ctx });
  const pr = await pay(post(`http://localhost/api/payments/link/${token}`, { betrag: 1 }), { params: Promise.resolve({ token }) });
  assert.equal(pr.status, 200);
  const p = gw.calls[0].params;
  assert.equal(p.line_items[0].price_data.unit_amount, 125000);
  assert.equal(p.metadata.art, "anzahlung");
  assert.equal(p.metadata.auftrag, "A-2026-0142");
  assert.equal(p.payment_method_types, undefined);
  assert.match(p.cancel_url, /art=anzahlung&link=/);
  // zweiter Klick → gleiche Session
  await pay(post(`http://localhost/api/payments/link/${token}`, {}), { params: Promise.resolve({ token }) });
  assert.equal(gw.calls.length, 1);
  // manipulierter Token → 404
  const bad = await pay(post("http://localhost/x", {}), { params: Promise.resolve({ token: token.replace(/.$/, token.endsWith("A") ? "B" : "A") }) });
  assert.equal(bad.status, 404);

  // Webhook bezahlt
  const id = json.anzahlung.id;
  const w = await deliver(ctx, event("checkout.session.completed", { id: "cs_test_0000000001", amount_total: 125000, currency: "eur", payment_status: "paid", payment_intent: "pi_d", metadata: p.metadata, customer_details: { email: "kunde@example.com" } }));
  assert.equal(w.body.result, "erfuellt");
  const ev = ctx.backoffice.events.find((e) => e.typ === "anzahlung.bezahlt");
  assert.equal(ev.referenz, "A-2026-0142");
  assert.equal(ev.betrag_cent, 125000);
  // bezahlter Link startet keinen Checkout mehr
  assert.equal((await pay(post("http://localhost/x", {}), { params: Promise.resolve({ token }) })).status, 409);
  // Status per GET
  const g = await admin.GET(new Request(`http://localhost/a?auftrag=A-2026-0142`, { headers: { Authorization: `Bearer ${ADMIN}` } }));
  const gj = await g.json();
  assert.equal(gj.anzahlungen[0].status, "bezahlt");
  assert.equal(gj.anzahlungen[0].id, id);
  // Erfolgsseite
  assert.equal((await statusForSession(ctx, "cs_test_0000000001")).art, "anzahlung");
});

test("Admin: nach 10 Fehlversuchen gesperrt (429)", async () => {
  const ctx = makeCtx({ ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN }, { gateway: captureGateway() });
  const admin = depositAdminHandlers({ ctx, limiter: createRateLimiter() });
  const h = { "X-Forwarded-For": "198.51.100.9" };
  for (let i = 0; i < 10; i++) assert.equal((await admin.GET(new Request("http://localhost/a?id=x", { headers: { ...h, Authorization: "Bearer nein" } }))).status, 401);
  assert.equal((await admin.GET(new Request("http://localhost/a?id=x", { headers: { ...h, Authorization: `Bearer ${ADMIN}` } }))).status, 429);
});

// ---------- Register ----------

test("Register: prüfen, teilweise einlösen, Rest, Testgutschein nicht einlösbar, ersetzen", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN }, { gateway: gw });
  const m = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_live_g1234567", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m }, true));
  const code = /PH-[A-Z0-9-]{19}/.exec(ctx.mailer.mails[0].text)[0];
  const reg = registerHandler({ ctx, limiter: createRateLimiter() });
  const call = async (b) => {
    const r = await reg(post("http://localhost/r", b, { Authorization: `Bearer ${ADMIN}` }));
    return { status: r.status, json: await r.json() };
  };
  assert.equal((await reg(post("http://localhost/r", { aktion: "pruefen", code }))).status, 401);
  assert.equal((await call({ aktion: "pruefen", code })).json.gutschein.rest, "100 €");
  assert.equal((await call({ aktion: "einloesen", code, betrag: "60", beleg: "K-1" })).json.gutschein.rest, "40 €");
  assert.equal((await call({ aktion: "einloesen", code, betrag: "50" })).status, 409);
  const done = await call({ aktion: "einloesen", code: code.toLowerCase(), betrag: "40" });
  assert.equal(done.json.gutschein.status, "eingeloest");
  assert.equal((await call({ aktion: "pruefen", code: "PH-2222-2222-2222-2222" })).status, 404);

  // Testgutschein
  const m2 = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_test_h1234567", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m2 }, false));
  const tcode = /TEST-PH-[A-Z0-9-]{19}/.exec(ctx.mailer.mails.at(-1).text)[0];
  assert.equal((await call({ aktion: "einloesen", code: tcode, betrag: "10" })).json.code, "test");

  // Ersetzen: alter Code ersetzt, neuer mit Restwert
  const m3 = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_live_i1234567", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m3 }, true));
  const c3 = /PH-[A-Z0-9-]{19}/.exec(ctx.mailer.mails.at(-1).text)[0];
  await call({ aktion: "einloesen", code: c3, betrag: "30" });
  const rep = await call({ aktion: "ersetzen", code: c3, grund: "verloren" });
  assert.equal(rep.status, 200);
  assert.equal((await call({ aktion: "pruefen", code: c3 })).json.gutschein.status, "ersetzt");
  const newCode = /PH-[A-Z0-9-]{19}/.exec(ctx.mailer.mails.at(-1).text)[0];
  assert.equal((await call({ aktion: "pruefen", code: newCode })).json.gutschein.rest, "70 €");
});

// ---------- Widerruf ----------

test("Widerruf (§ 13a FAGG): Eingangsbestätigung per Mail, Codes gesperrt, gleiche Antwort für Unbekanntes", async () => {
  const gw = captureGateway();
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { gateway: gw });
  const W = withdrawalHandler({ ctx, ...OK, limiter: createRateLimiter() });
  const m = (await buyVoucher(ctx, gw, { ...ORDER, anzahl: 1 })).call.params.metadata;
  await deliver(ctx, event("checkout.session.completed", { id: "cs_live_w1234567", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m }, true));
  const base = { name: "Max Muster", email: "MAX@example.com", bestellung: m.order_id, bestaetigt: true, _t: 5000 };
  assert.equal((await W(post("http://localhost/w", { ...base, bestaetigt: false }))).status, 400);
  const r = await W(post("http://localhost/w", base));
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.match(j.id, /^W-/);
  const mail = ctx.mailer.mails.at(-1);
  assert.match(mail.subject, /Eingangsbestätigung/);
  assert.match(mail.text, new RegExp(m.order_id));
  const order = await ctx.store.get("orders", m.order_id);
  assert.equal(order.widerruf.gesperrt, 1);
  assert.equal((await ctx.store.get("register", order.codes[0].hash)).status, "gesperrt");
  // Unbekannte Bestellung: gleiche Antwortform, nichts gesperrt
  const r2 = await W(post("http://localhost/w", { ...base, bestellung: "G-ZZZZ-ZZZZ" }));
  assert.equal(r2.status, 200);
  assert.deepEqual(Object.keys(await r2.json()).sort(), Object.keys(j).sort());
  // Ohne Online-Verkauf und ohne Bestellungen: 404
  const off = withdrawalHandler({ ctx: makeCtx({}), limiter: createRateLimiter() });
  assert.equal((await off(post("http://localhost/w", base))).status, 404);
});

// ---------- Mock ----------

test("Mock: kompletter Ablauf ohne Stripe, durch den signierten Webhook-Pfad; in Produktion 404", async () => {
  const env = { VOUCHER_MODE: "stripe", PAYMENTS_MOCK: "1" };
  const ctx = makeCtx(env);
  const buy = await voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() })(post("http://localhost/x", ORDER));
  const bj = await buy.json();
  assert.equal(buy.status, 200, JSON.stringify(bj));
  assert.match(bj.url, /\/de\/zahlung\/mock\?session=cs_mock_[a-f0-9]{24}$/);
  const session = new URL(bj.url).searchParams.get("session");
  const M = mockHandler({ ctx });
  const r = await M(post("http://localhost/m", { session, ausgang: "erfolg" }));
  const rj = await r.json();
  assert.equal(r.status, 200);
  assert.equal(rj.redirect, `http://localhost:3000/de/zahlung/erfolg?session_id=${session}`);
  assert.deepEqual(rj.events, ["erfuellt"]);
  const st = await statusForSession(ctx, session);
  assert.equal(st.status, "bezahlt");
  assert.equal(st.test, true);
  // Erstattung simulieren
  await M(post("http://localhost/m", { session, ausgang: "erstattung" }));
  assert.equal((await statusForSession(ctx, session)).status, "erstattet");
  // ungültige Eingaben / Produktion
  assert.equal((await M(post("http://localhost/m", { session, ausgang: "geld" }))).status, 400);
  assert.equal((await mockHandler({ ctx: makeCtx({ NODE_ENV: "production" }) })(post("http://localhost/m", { session, ausgang: "erfolg" }))).status, 404);
  // Webhook-Route akzeptiert das Mock-Geheimnis nur mit PAYMENTS_MOCK
  const ev = { id: "evt_mock_x", type: "ping", data: { object: {} } };
  const viaRoute = await stripeWebhookHandler({ ctx })(new Request("http://x", { method: "POST", headers: { "stripe-signature": signTestEvent(JSON.stringify(ev)) }, body: JSON.stringify(ev) }));
  assert.equal(viaRoute.status, 200);
  assert.equal((await deliverMockEvent(ctx, ev)).body.duplicate, true);
});

test("Mock in Produktion: Kauf fällt auf anfrage zurück → Checkout-API 404", async () => {
  const ctx = makeCtx({ NODE_ENV: "production", VOUCHER_MODE: "stripe", PAYMENTS_MOCK: "1" });
  const res = await voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() })(post("http://localhost/x", ORDER, { "x-payments-mock": "1" }));
  assert.equal(res.status, 404);
});

// ---------- Adapter ----------

test("Ablage: Datei-Adapter schreibt nach PAYMENTS_DATA_DIR, Mail-outbox mit PDF, Backoffice nie live ohne Schalter", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ph-pay-"));
  const store = createFileStore(dir);
  assert.equal(await store.insert("orders", "G-1", { a: 1 }), true);
  assert.equal(await store.insert("orders", "G-1", { a: 2 }), false);
  await Promise.all([1, 2, 3, 4, 5].map((n) => store.update("orders", "G-1", (o) => ({ ...o, [`k${n}`]: n }))));
  const o = await store.get("orders", "G-1");
  assert.deepEqual(Object.keys(o).sort(), ["a", "k1", "k2", "k3", "k4", "k5"]);
  assert.ok(fs.existsSync(path.join(dir, "orders.json")));

  const outbox = createOutboxMailer(path.join(dir, "outbox"));
  await outbox.send({ to: "a@example.com", subject: "S", text: "T", tag: "t", attachments: [{ filename: "Gutschein.pdf", contentType: "application/pdf", content: Buffer.from("%PDF-1.4") }] });
  const folder = fs.readdirSync(path.join(dir, "outbox"))[0];
  assert.ok(fs.existsSync(path.join(dir, "outbox", folder, "Gutschein.pdf")));

  let fetched = 0;
  const bo = createFrappeBackoffice({ env: { FRAPPE_URL: "https://backoffice.example.invalid", FRAPPE_API_KEY: "k", FRAPPE_API_SECRET: "s" }, dir: path.join(dir, "be"), fetchImpl: async () => {
    fetched++;
    return new Response("{}");
  } });
  const r = await bo.emit({ typ: "gutschein.bezahlt", zeit: new Date(NOW).toISOString(), referenz: "G-1" });
  assert.equal(r.dryRun, true);
  assert.equal(fetched, 0, "ohne PAYMENTS_BACKOFFICE_LIVE=1 kein Aufruf");
  const written = fs.readFileSync(path.join(dir, "be", fs.readdirSync(path.join(dir, "be"))[0]), "utf8");
  assert.doesNotMatch(written, /"k"|"s"|token/);
});

test("Stripe-Gateway: echtes SDK prüft Signaturen (ohne Netz), API-Version fest", async () => {
  const gw = createStripeGateway(KEYS);
  const raw = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } });
  assert.equal(gw.verifyEvent(raw, signTestEvent(raw, KEYS.STRIPE_WEBHOOK_SECRET)).id, "evt_1");
  assert.throws(() => gw.verifyEvent(raw, signTestEvent(raw, "whsec_other12345678")));
  assert.equal(gw.testmode, true);
  const src = fs.readFileSync(new URL("../../src/lib/payments/gateway.js", import.meta.url), "utf8");
  assert.match(src, /STRIPE_API_VERSION = "\d{4}-\d{2}-\d{2}\.[a-z]+"/);
});

test("PDF: gültige Struktur, Code, Betrag, Umlaute, Testvermerk", () => {
  const pdf = voucherPdf({ code: "PH-ABCD-EFGH-JKLM-NPQR", amountText: "1.000 €", recipient: "Jürgen", greeting: "Für das neue Zuhause", motif: "geweih", orderId: "G-AAAA-BBBB", issuedAt: "28.10.2026", validity: "Gültig ohne Ablaufdatum", issuer: "Test GmbH", termsUrl: "platzhirsch.studio/de/gutscheinbedingungen", test: true });
  const s = pdf.toString("latin1");
  assert.match(s, /^%PDF-1\.4/);
  assert.match(s, /%%EOF\n$/);
  assert.match(s, /PH-ABCD-EFGH-JKLM-NPQR/);
  assert.match(s, /\\200/, "€ als WinAnsi 0x80");
  assert.match(s, /J\\374rgen/, "ü als WinAnsi");
  assert.match(s, /TESTGUTSCHEIN/);
  const xref = Number(/startxref\n(\d+)/.exec(s)[1]);
  assert.equal(s.slice(xref, xref + 4), "xref");
  // Objekt-Offsets stimmen
  const offsets = [...s.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  offsets.forEach((off, i) => assert.equal(s.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`));
});

test("Bestellung: Preis nur aus eigenen Feldern (zod-Allowlist)", () => {
  const parsed = voucherOrderSchema.parse({ ...ORDER, unit_amount: 1, summe_cent: 1 });
  assert.equal(parsed.unit_amount, undefined);
  const order = newVoucherOrder(parsed, { now: NOW });
  assert.equal(checkoutParams(order, { env: {}, now: NOW }).line_items[0].price_data.unit_amount, 10000);
});
