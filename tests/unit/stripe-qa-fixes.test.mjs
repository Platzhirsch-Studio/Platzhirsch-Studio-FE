// tests/unit/stripe-qa-fixes.test.mjs — QA-Feedback Stripe (qa-screenshots/stripe/feedback.md):
//   P1   Produktion ohne Mail-Anbieter: kein "stripe", Postausgang gesperrt
//   P2-1 Doppelte Anzahlung erkennen, alte Session vorher beenden
//   P2-2 Widerrufsfunktion nicht als Mail-Relay
//   P2-3 USt- und Gültigkeitstexte aus den offenen Inhaberfragen
// Run: node --test tests/unit/stripe-qa-fixes.test.mjs
// Kein Netz: Gateways sind Attrappen, Mails/Backoffice im Speicher.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { anzahlungMode, voucherMode } from "../../src/lib/commerce/mode.js";
import { mailProviderReady, paymentsConfigProblems, paymentsReady, teamEmail } from "../../src/lib/payments/config.js";
import { createContext } from "../../src/lib/payments/context.js";
import { createMemoryStore } from "../../src/lib/payments/store.js";
import { createDisabledMailer, mailerFromEnv } from "../../src/lib/payments/mailer.js";
import { signTestEvent } from "../../src/lib/payments/gateway.js";
import { newVoucherOrder, voucherMail, voucherOrderSchema } from "../../src/lib/payments/voucherOrder.js";
import { depositAdminHandlers, depositPayHandler, mockHandler, statusForSession, voucherCheckoutHandler, withdrawalHandler } from "../../src/lib/payments/handlers.js";
import { webhookHandler } from "../../src/lib/payments/webhook.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { VOUCHER_TAX, VOUCHER_VALIDITY, voucherDecisionsOpen, voucherPriceLabel, voucherValidityText } from "../../src/lib/commerce/voucherTerms.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NOW = 1_800_000_000_000;
const KEYS = { STRIPE_SECRET_KEY: "sk_test_51abcdefghijklmnop", STRIPE_WEBHOOK_SECRET: "whsec_testsecret12345678" };
const ADMIN = "a".repeat(40);
const MAIL = { PAYMENTS_MAIL_PROVIDER: "resend", PAYMENTS_MAIL_API_KEY: "re_test_123456", PAYMENTS_MAIL_FROM: "Platzhirsch <info@platzhirsch.studio>" };
const PROD = { NODE_ENV: "production", ...KEYS, PAYMENTS_ALLOW_TEST_KEYS: "1" };
const DECIDED = { tax: "einzweck", validity: "unbefristet" };
const OK = { termsStatus: "freigegeben", withdrawalStatus: "freigegeben", decisions: DECIDED };
const ORDER = { betrag: 100, anzahl: 1, motiv: "seelicht", empfaenger: "Anna", grusstext: "Alles Gute", name: "Max Muster", email: "max@example.com", bedingungen: true, _t: 5000, website: "" };

let ipN = 0;
const ip = () => `198.51.100.${(++ipN % 250) + 1}`;
const post = (url, body, headers = {}) => new Request(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip(), ...headers }, body: JSON.stringify(body) });

function memBackoffice() {
  const events = [];
  return { kind: "memory", events, async emit(e) { events.push(e); return { ok: true }; } };
}
function memMailer() {
  const mails = [];
  return { kind: "memory", mails, async send(m) { mails.push(m); return { ok: true }; } };
}
/** Gateway-Attrappe mit expire und steuerbarer Zeit. */
function fakeGateway(clock, { failExpire = false } = {}) {
  const gw = { kind: "stripe", testmode: true, calls: [], expired: [] };
  gw.createCheckoutSession = async (params, opts) => {
    gw.calls.push({ params, opts });
    return { id: `cs_test_${String(gw.calls.length).padStart(10, "0")}`, url: `https://checkout.stripe.com/c/pay/${gw.calls.length}`, expires_at: Math.floor(clock.t / 1000) + 3600 };
  };
  gw.expireCheckoutSession = async (id) => {
    if (failExpire) throw Object.assign(new Error("complete"), { code: "checkout_session_complete" });
    gw.expired.push(id);
    return { id, status: "expired" };
  };
  gw.verifyEvent = () => {
    throw new Error("not used");
  };
  return gw;
}
function makeCtx(env, { clock = { t: NOW }, ...extra } = {}) {
  return createContext({ env, store: createMemoryStore(), mailer: memMailer(), backoffice: memBackoffice(), now: () => clock.t, ...extra });
}
let evtN = 0;
const event = (type, object, livemode = false) => ({ id: `evt_qa_${++evtN}`, type, livemode, data: { object } });
async function deliver(ctx, ev) {
  const raw = JSON.stringify(ev);
  const sdk = new Stripe(KEYS.STRIPE_SECRET_KEY);
  const res = await webhookHandler({ ctx, verify: (r, s) => sdk.webhooks.constructEvent(r, s, KEYS.STRIPE_WEBHOOK_SECRET) })(
    new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signTestEvent(raw, KEYS.STRIPE_WEBHOOK_SECRET) }, body: raw })
  );
  return { status: res.status, body: await res.json() };
}
async function buyVoucher(ctx, body = ORDER) {
  const res = await voucherCheckoutHandler({ ctx, ...OK, limiter: createRateLimiter() })(post("http://localhost/api/payments/gutschein/checkout", body));
  assert.equal(res.status, 200);
  return ctx.gatewayFor({}).calls.at(-1).params.metadata;
}

// ---------- P1 ----------

test("P1: Produktion ohne Mail-Anbieter → kein stripe (Gutschein und Anzahlung), Problem gemeldet", () => {
  assert.equal(mailProviderReady({}), false);
  assert.equal(mailProviderReady({ PAYMENTS_MAIL_PROVIDER: "resend", PAYMENTS_MAIL_API_KEY: "x" }), false, "ohne Absender");
  assert.equal(mailProviderReady(MAIL), true);
  assert.equal(paymentsReady(KEYS), true, "Entwicklung: outbox genügt");
  assert.equal(paymentsReady(PROD), false);
  assert.equal(paymentsReady({ ...PROD, ...MAIL }), true);
  const v = { ...PROD, VOUCHER_MODE: "stripe" };
  assert.equal(voucherMode(v, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "anfrage");
  assert.equal(voucherMode({ ...v, ...MAIL }, "freigegeben", { withdrawalStatus: "freigegeben", decisions: DECIDED }), "stripe");
  const a = { ...PROD, ANZAHLUNG_MODE: "stripe", PAYMENTS_ADMIN_SECRET: ADMIN, PAYMENTS_LINK_SECRET: "b".repeat(40) };
  assert.equal(anzahlungMode(a), "anfrage");
  assert.equal(anzahlungMode({ ...a, ...MAIL }), "stripe");
  assert.ok(paymentsConfigProblems(PROD).some((p) => /PAYMENTS_MAIL_PROVIDER/.test(p)));
  assert.ok(!paymentsConfigProblems({ ...PROD, ...MAIL }).some((p) => /PAYMENTS_MAIL_PROVIDER/.test(p)));
  assert.ok(paymentsConfigProblems(PROD).every((p) => !p.includes(KEYS.STRIPE_SECRET_KEY)));
});

test("P1: Postausgang in Produktion gesperrt – ok: false, nichts auf der Platte, Bestellung zeigt fehlgeschlagen", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ph-mail-"));
  assert.equal(mailerFromEnv({}, dir).kind, "outbox");
  assert.equal(mailerFromEnv({ ...MAIL }, dir).kind, "resend");
  assert.equal(mailerFromEnv({ ...MAIL, NODE_ENV: "production" }, dir).kind, "resend");
  const blocked = mailerFromEnv({ NODE_ENV: "production" }, dir);
  assert.equal(blocked.kind, "gesperrt");
  assert.equal(mailerFromEnv({ VERCEL_ENV: "production" }, dir).kind, "gesperrt");
  const r = await blocked.send({ to: "max@example.com", subject: "x", text: "CODE", tag: "gutschein", attachments: [{ filename: "a.pdf", content: Buffer.from("x") }] });
  assert.equal(r.ok, false);
  assert.deepEqual(fs.readdirSync(dir), [], "keine Datei in der Produktion");

  // Bezahlte Bestellung mit gesperrtem Adapter: Mail "fehlgeschlagen", nie "gesendet"
  const clock = { t: NOW };
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { clock, gateway: fakeGateway(clock), mailer: createDisabledMailer() });
  const m = await buyVoucher(ctx);
  await deliver(ctx, event("checkout.session.completed", { id: "cs_test_0000000001", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m }));
  assert.equal((await ctx.store.get("orders", m.order_id)).mail.status, "fehlgeschlagen");
  assert.equal((await statusForSession(ctx, "cs_test_0000000001")).mail, "fehlgeschlagen");
  // Erfolgsseite wertet status.mail aus
  assert.match(fs.readFileSync(path.join(ROOT, "src/app/[locale]/zahlung/erfolg/page.js"), "utf8"), /s\.mail === "fehlgeschlagen"/);
  assert.equal(teamEmail({}), "info@platzhirsch.studio");
  assert.equal(teamEmail({ PAYMENTS_TEAM_EMAIL: "kasse@platzhirsch.studio" }), "kasse@platzhirsch.studio");
  assert.equal(teamEmail({ PAYMENTS_TEAM_EMAIL: "kein mail" }), "info@platzhirsch.studio");
});

// ---------- P2-1 ----------

async function newDepositLink(ctx) {
  const admin = depositAdminHandlers({ ctx, limiter: createRateLimiter() });
  const res = await admin.POST(post("http://localhost/a", { auftrag: "A-2026-0200", betrag: "500,00", email: "kunde@example.com" }, { Authorization: `Bearer ${ADMIN}` }));
  assert.equal(res.status, 201);
  const json = await res.json();
  return { id: json.anzahlung.id, token: json.link.split("/").pop() };
}
const DEP_ENV = { ANZAHLUNG_MODE: "stripe", ...KEYS, PAYMENTS_ADMIN_SECRET: ADMIN };

test("P2-1: zweite bezahlte Session → doppelt, Team-Hinweis, Backoffice-Ereignis; Erstattung getrennt", async () => {
  const clock = { t: NOW };
  const gw = fakeGateway(clock);
  const ctx = makeCtx(DEP_ENV, { clock, gateway: gw });
  const { id, token } = await newDepositLink(ctx);
  const pay = () => depositPayHandler({ ctx })(post(`http://localhost/api/payments/link/${token}`, {}), { params: Promise.resolve({ token }) });
  assert.equal((await pay()).status, 200);
  // alte Session hat < 120 s Rest → neue Session, die alte wird vorher beendet
  clock.t += 3600_000 - 60_000;
  assert.equal((await pay()).status, 200);
  assert.deepEqual(gw.expired, ["cs_test_0000000001"]);
  assert.equal(gw.calls.length, 2);

  const meta = gw.calls[0].params.metadata;
  const paid = (sid, pi) => event("checkout.session.completed", { id: sid, amount_total: 50000, currency: "eur", payment_status: "paid", payment_intent: pi, metadata: meta, customer_details: { email: "kunde@example.com" } });
  assert.equal((await deliver(ctx, paid("cs_test_0000000002", "pi_b"))).body.result, "erfuellt");
  // trotzdem wird auch die alte bezahlt (z. B. lief die Zahlung schon)
  assert.equal((await deliver(ctx, paid("cs_test_0000000001", "pi_a"))).body.result, "doppelt");
  let d = await ctx.store.get("deposits", id);
  assert.equal(d.status, "bezahlt");
  assert.equal(d.bezahlt_session, "cs_test_0000000002");
  assert.equal(d.doppelt.length, 1);
  assert.equal(d.doppelt[0].payment_intent, "pi_a");
  assert.ok(ctx.backoffice.events.find((e) => e.typ === "anzahlung.doppelt"), "Ereignis anzahlung.doppelt");
  const team = ctx.mailer.mails.filter((m) => m.tag === "anzahlung-doppelt");
  assert.equal(team.length, 1);
  assert.equal(team[0].to, "info@platzhirsch.studio");
  assert.match(team[0].text, /pi_a/);
  // gleiche Sessions erneut (andere Event-Id) → kein zweiter Hinweis
  assert.equal((await deliver(ctx, paid("cs_test_0000000001", "pi_a"))).body.result, "bereits_erfuellt");
  assert.equal((await deliver(ctx, paid("cs_test_0000000002", "pi_b"))).body.result, "bereits_erfuellt");
  assert.equal(ctx.mailer.mails.filter((m) => m.tag === "anzahlung-doppelt").length, 1);
  // Erstattung der Doppelzahlung lässt die Anzahlung bezahlt
  const ref = await deliver(ctx, event("charge.refunded", { id: "ch_a", payment_intent: "pi_a", amount: 50000, amount_refunded: 50000, refunded: true, metadata: meta }));
  assert.equal(ref.body.result, "doppelt_erstattet");
  d = await ctx.store.get("deposits", id);
  assert.equal(d.status, "bezahlt");
  assert.equal(d.doppelt[0].erstattet_cent, 50000);
  // Erfolgsseite der doppelten Session findet die Anzahlung
  assert.equal((await statusForSession(ctx, "cs_test_0000000001")).art, "anzahlung");
});

test("P2-1: alte Session lässt sich nicht beenden (gerade bezahlt) → keine neue Session, 409", async () => {
  const clock = { t: NOW };
  const gw = fakeGateway(clock, { failExpire: true });
  const ctx = makeCtx(DEP_ENV, { clock, gateway: gw });
  const { token } = await newDepositLink(ctx);
  const pay = () => depositPayHandler({ ctx })(post(`http://localhost/api/payments/link/${token}`, {}), { params: Promise.resolve({ token }) });
  assert.equal((await pay()).status, 200);
  clock.t += 3600_000 - 60_000;
  assert.equal((await pay()).status, 409);
  assert.equal(gw.calls.length, 1);
});

test("P2-1: Mock-Gateway beendet Sessions; beendete Mock-Session ist nicht mehr bezahlbar", async () => {
  const ctx = makeCtx({ NODE_ENV: "test", PAYMENTS_MOCK: "1" });
  const gw = ctx.gatewayFor({}, { forceMock: true });
  const s = await gw.createCheckoutSession({
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: 1000, product_data: { name: "x" } } }],
    metadata: {},
    success_url: "http://localhost:3000/de/zahlung/erfolg?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000/de/zahlung/abbruch",
  });
  assert.deepEqual(await gw.expireCheckoutSession(s.id), { id: s.id, status: "expired" });
  const res = await mockHandler({ ctx })(post("http://localhost/api/payments/mock", { session: s.id, ausgang: "erfolg" }));
  assert.equal(res.status, 409);
});

// ---------- P2-2 ----------

test("P2-2: Widerruf ohne Zuordnung → Bestätigung ohne Namen, Freitext und Angabe; höchstens 3 je Adresse", async () => {
  const clock = { t: NOW };
  const ctx = makeCtx({ VOUCHER_MODE: "stripe", ...KEYS }, { clock, gateway: fakeGateway(clock) });
  const W = withdrawalHandler({ ctx, ...OK, limiter: createRateLimiter() });
  const spam = { name: "Ihre Bank: hier klicken", email: "opfer@example.com", bestellung: "evil.example/x", nachricht: "Bitte Konto bestätigen unter https://evil.example", bestaetigt: true, _t: 5000 };
  for (let i = 0; i < 5; i++) assert.equal((await W(post("http://localhost/w", spam))).status, 200);
  const sent = ctx.mailer.mails.filter((m) => m.to === "opfer@example.com");
  assert.equal(sent.length, 3, "höchstens 3 je Adresse und Tag");
  for (const m of sent) {
    for (const bad of ["Ihre Bank", "evil.example", "Konto bestätigen"]) {
      assert.equal(`${m.subject}\n${m.text}\n${m.html}`.includes(bad), false, bad);
    }
    assert.match(m.text, /Eingangsnummer W-/);
  }
  // Inhalt bleibt vollständig in der Ablage
  assert.equal((await ctx.store.list("withdrawals")).length, 5);
  // nach 24 h wieder zulässig
  clock.t += 24 * 3600_000 + 1;
  await W(post("http://localhost/w", spam));
  assert.equal(ctx.mailer.mails.filter((m) => m.to === "opfer@example.com").length, 4);

  // Zugeordneter Widerruf: voller Inhalt, unabhängig vom Limit
  const m = await buyVoucher(ctx, { ...ORDER, email: "opfer@example.com" });
  await deliver(ctx, event("checkout.session.completed", { id: "cs_test_0000000001", amount_total: 10000, currency: "eur", payment_status: "paid", metadata: m }));
  for (let i = 0; i < 4; i++) await W(post("http://localhost/w", spam));
  await W(post("http://localhost/w", { name: "Max Muster", email: "opfer@example.com", bestellung: m.order_id, nachricht: "Bitte erstatten", bestaetigt: true, _t: 5000 }));
  const last = ctx.mailer.mails.at(-1);
  assert.equal(last.tag, "widerruf");
  assert.match(last.text, /Max Muster/);
  assert.match(last.text, /Bitte erstatten/);
});

// ---------- P2-3 ----------

test("P2-3: USt- und Gültigkeitstexte hängen an den Inhaberfragen (entschieden 03.11.2026, Nr. 46)", () => {
  // Stand 03.11.2026: Mehrzweckgutschein (Steuerberater bestätigt noch), unbefristet → "stripe" darf wirken
  assert.equal(VOUCHER_TAX, "mehrzweck");
  assert.equal(VOUCHER_VALIDITY, "unbefristet");
  assert.equal(voucherDecisionsOpen().length, 0);
  const env = { VOUCHER_MODE: "stripe", ...KEYS };
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "freigegeben" }), "stripe");
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "freigegeben", decisions: { tax: null, validity: null } }), "anfrage", "offene Entscheidungen sperren weiter");
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "freigegeben", decisions: { tax: "einzweck", validity: null } }), "anfrage");
  assert.equal(voucherMode(env, "freigegeben", { withdrawalStatus: "freigegeben", decisions: { tax: "mehrzweck", validity: "30_jahre" } }), "stripe");
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "freigegeben"), "anfrage", "anfrage unverändert");
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "entwurf"), "off", "off unverändert");

  assert.equal(voucherPriceLabel(null).total, "Gesamtpreis");
  assert.equal(voucherPriceLabel("einzweck").total, "Gesamtpreis inkl. USt");
  assert.doesNotMatch(JSON.stringify(voucherPriceLabel("mehrzweck")), /inkl\. USt/);
  assert.doesNotMatch(JSON.stringify(voucherValidityText(null)), /unbefristet|Ablaufdatum/);
  assert.match(voucherValidityText("unbefristet").print, /ohne Ablaufdatum/);
  assert.match(voucherValidityText("30_jahre").print, /30 Jahren/);

  const order = newVoucherOrder(voucherOrderSchema.parse(ORDER), { now: NOW });
  const v = [{ code: "ABCD-EFGH-JKMN-PQRS", test: true }];
  assert.doesNotMatch(voucherMail(order, v, { env: {}, now: NOW, validity: null }).text, /unbefristet|ohne Ablaufdatum/i);
  assert.match(voucherMail(order, v, { env: {}, now: NOW, validity: "unbefristet" }).text, /Gültig ohne Ablaufdatum/);

  // Keine festen Texte mehr in Formular, Seite, Erfolgsseite und Mail
  for (const f of ["src/components/Payments/VoucherPurchaseForm.js", "src/components/Gutschein/VoucherSection.js", "src/app/[locale]/zahlung/erfolg/page.js", "src/lib/payments/voucherOrder.js", "src/lib/commerce/voucherConfig.js"]) {
    const code = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /Gesamtpreis inkl\. USt|unbefristet|ohne Ablaufdatum/i, f);
  }
});
