// src/lib/payments/handlers.js
// HTTP-Handler der Zahlungsrouten (dünne route.js-Dateien rufen sie auf):
//   POST /api/payments/gutschein/checkout   Gutscheinkauf → Checkout-URL
//   POST /api/payments/anzahlung            Admin: Anzahlungs-Link anlegen
//   GET  /api/payments/anzahlung            Admin: Status (?id= | ?auftrag= | ?kunde=)
//   POST /api/payments/link/[token]         Kunde: Checkout für eine Anzahlung starten
//   POST /api/payments/register             Admin: Gutschein prüfen/einlösen/sperren/ersetzen
//   POST /api/payments/widerruf             Widerrufsfunktion § 13a FAGG
//   POST /api/payments/mock                 Simulierter Checkout (nie in Produktion)
//   POST /api/stripe/webhook                Stripe-Ereignisse (webhook.js)
// Antworten an den Browser tragen nur eigene Codes, nie Stripe-Details.
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { errorResponse, guardForm, readCapped } from "../forms/guard.js";
import { outerHeadersOf } from "../forms/forward.js";
import { clientIp, createRateLimiter } from "../forms/rateLimit.js";
import { anzahlungMode, voucherMode } from "../commerce/mode.js";
import { MOCK_WEBHOOK_SECRET, isProduction, mockActive, mockSignalOf, stripeKeysReady } from "./config.js";
import { verifyLinkToken, linkToken, logRef, newMockId } from "./codes.js";
import { linkSecret } from "./config.js";
import { MAX_BYTES as ORDER_MAX_BYTES, checkoutParams, newVoucherOrder, voucherOrderSchema } from "./voucherOrder.js";
import { PAYABLE, depositCheckoutParams, depositLink, depositLinkMail, depositSchema, newDeposit, publicDeposit } from "./deposit.js";
import { authorizeAdmin } from "./admin.js";
import { registerAction, registerSchema } from "./register.js";
import { MAX_BYTES as WITHDRAWAL_MAX_BYTES, recordWithdrawal, withdrawalSchema } from "./withdrawal.js";
import { signTestEvent, verifyWithSecret } from "./gateway.js";
import { webhookHandler } from "./webhook.js";

export const notFound = () => Response.json({ success: false, code: "not_found", error: "Not found" }, { status: 404 });
const ADMIN_MAX_BYTES = 8 * 1024;
const linkLimiter = createRateLimiter();
const LINK_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

async function readJson(request, maxBytes) {
  const capped = await readCapped(request, maxBytes);
  if (!capped.ok) return { error: errorResponse("too_large", 413) };
  try {
    return { data: JSON.parse(capped.text || "{}") };
  } catch {
    return { error: errorResponse("invalid", 400) };
  }
}

const zodError = (error) => {
  const issue = error.issues?.[0];
  return errorResponse("invalid", 400, { message: issue?.message, extra: issue?.path?.length ? { field: String(issue.path[0]) } : {} });
};

/**
 * Browser-POSTs nur von der eigenen Seite (Origin = Host). Ohne Origin-Kopfzeile
 * (Server, curl) erlaubt; die Admin-Endpunkte schützt das Geheimnis.
 */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}
const forbidden = () => errorResponse("forbidden", 403, { message: "Forbidden" });

/** Dev-Mock der Gutschein-Seite (?zahlung=mock): Kopfzeile + Entwicklungsserver. */
const devVoucherMock = (env, signal) => env.NODE_ENV === "development" && !isProduction(env) && signal.header === "1";

// ---------- Gutscheinkauf ----------

export function voucherCheckoutHandler({ ctx, termsStatus, withdrawalStatus, decisions, limiter, now, resolveHeaders } = {}) {
  return async function POST(request) {
    const env = ctx.env;
    const signal = mockSignalOf(request);
    const forceMock = devVoucherMock(env, signal);
    const mode = voucherMode(env, termsStatus, { withdrawalStatus, signal, decisions });
    if (mode !== "stripe" && !forceMock) return notFound();
    if (!sameOrigin(request)) return forbidden();
    try {
      const guard = await guardForm(request, voucherOrderSchema, {
        route: "gutschein_kauf",
        maxBytes: ORDER_MAX_BYTES,
        fakeSuccess: () => ({ success: true, url: "/de/gutscheine" }),
        outerHeaders: await outerHeadersOf(resolveHeaders),
        limiter,
        now: now ? now() : Date.now(),
      });
      if (!guard.ok) return guard.response;
      const gateway = ctx.gatewayFor(signal, { forceMock });
      if (!gateway) return errorResponse("unavailable", 503, { message: "Payments not configured" });

      const order = newVoucherOrder(guard.data, { now: ctx.now() });
      await ctx.store.put("orders", order.id, order);
      let session;
      try {
        session = await gateway.createCheckoutSession(checkoutParams(order, { env, now: ctx.now() }), { idempotencyKey: `gutschein-${order.id}` });
      } catch (err) {
        console.error(`[payments] gutschein ${order.id}: checkout ${err?.type || err?.name || "error"} ${err?.code || ""}`);
        await ctx.store.update("orders", order.id, (o) => ({ ...o, status: "checkout_fehler" }));
        return errorResponse("upstream", 502, { message: "Checkout failed" });
      }
      await ctx.store.update("orders", order.id, (o) => ({ ...o, session: session.id, testmodus: gateway.testmode }));
      console.info(`[payments] gutschein ${order.id}: checkout ${gateway.kind} ${logRef(session.id)}`);
      return Response.json({ success: true, url: session.url, bestellung: order.id });
    } catch (err) {
      console.error(`[payments] gutschein_kauf: intern ${err?.message || err}`);
      return errorResponse("internal", 500);
    }
  };
}

// ---------- Anzahlungen (Admin) ----------

export function depositAdminHandlers({ ctx, limiter } = {}) {
  const gate = (request) => {
    if (anzahlungMode(ctx.env, mockSignalOf(request)) !== "stripe") return notFound();
    const auth = authorizeAdmin(request, { env: ctx.env, limiter, now: ctx.now() });
    return auth.ok ? null : auth.response;
  };
  return {
    async POST(request) {
      const blocked = gate(request);
      if (blocked) return blocked;
      const body = await readJson(request, ADMIN_MAX_BYTES);
      if (body.error) return body.error;
      const parsed = depositSchema.safeParse(body.data);
      if (!parsed.success) return zodError(parsed.error);
      const d = newDeposit(parsed.data, { now: ctx.now() });
      await ctx.store.put("deposits", d.id, d);
      const link = depositLink(d.id, ctx.env);
      let mail = null;
      if (parsed.data.senden && d.email) {
        const r = await ctx.mailer.send(depositLinkMail(d, link));
        mail = r.ok ? "gesendet" : "fehlgeschlagen";
      }
      console.info(`[payments] anzahlung ${d.id} angelegt (${d.auftrag})`);
      return Response.json({ success: true, anzahlung: publicDeposit(d, ctx.now()), link, mail }, { status: 201 });
    },
    async GET(request) {
      const blocked = gate(request);
      if (blocked) return blocked;
      const q = new URL(request.url).searchParams;
      const id = q.get("id");
      const auftrag = q.get("auftrag");
      const kunde = q.get("kunde");
      if (!id && !auftrag && !kunde) return errorResponse("invalid", 400, { message: "id, auftrag oder kunde angeben" });
      const all = await ctx.store.list("deposits");
      const hits = all.filter((d) => (id && d.id === id) || (auftrag && d.auftrag === auftrag) || (kunde && d.kunde === kunde));
      return Response.json({ success: true, anzahlungen: hits.map((d) => ({ ...publicDeposit(d, ctx.now()), link: depositLink(d.id, ctx.env) })) });
    },
  };
}

/** Anzahlung zum Link-Token (für Seite und Handler). → Anzahlung | null */
export async function depositForToken(ctx, token) {
  const id = verifyLinkToken(token, linkSecret(ctx.env));
  return id ? ctx.store.get("deposits", id) : null;
}

export function depositPayHandler({ ctx } = {}) {
  return async function POST(request, { params }) {
    const signal = mockSignalOf(request);
    if (anzahlungMode(ctx.env, signal) !== "stripe") return notFound();
    if (!sameOrigin(request)) return forbidden();
    const ip = clientIp(request) || "none";
    if (!linkLimiter.take(`link:${ip}`, LINK_LIMIT, ctx.now()).ok) return errorResponse("rate_limited", 429);
    const { token } = await params;
    const d = await depositForToken(ctx, token);
    if (!d) return notFound();
    const view = publicDeposit(d, ctx.now());
    if (view.status === "bezahlt") return errorResponse("paid", 409, { message: "Bereits bezahlt" });
    if (!PAYABLE.includes(view.status)) return errorResponse(view.status, 409, { message: "Link nicht mehr gültig" });
    // Offene Session wiederverwenden (Doppelklick, zweiter Tab).
    if (d.session_url && d.session_ablauf && d.session_ablauf * 1000 > ctx.now() + 120_000) return Response.json({ success: true, url: d.session_url });
    const gateway = ctx.gatewayFor(signal);
    if (!gateway) return errorResponse("unavailable", 503);
    // Ältere, noch offene Session vorher beenden (QA P2-1), damit nicht zwei
    // Sessions parallel bezahlt werden können. Lässt sie sich nicht beenden
    // (z. B. gerade bezahlt), keine neue Session: der Webhook klärt den Stand.
    // Nur bei Status "offen": nach fehlgeschlagener Lastschrift ist die alte Session abgeschlossen.
    if (d.status === "offen" && d.session && d.session_url && d.session_ablauf && d.session_ablauf * 1000 > ctx.now() && typeof gateway.expireCheckoutSession === "function") {
      try {
        await gateway.expireCheckoutSession(d.session);
      } catch (err) {
        if (err?.code !== "resource_missing") {
          console.warn(`[payments] anzahlung ${d.id}: alte Session nicht beendet (${err?.code || err?.type || "error"})`);
          return errorResponse("processing", 409, { message: "Die letzte Zahlung wird gerade verarbeitet. Bitte versuchen Sie es in einigen Minuten erneut." });
        }
      }
    }
    try {
      const s = await gateway.createCheckoutSession(depositCheckoutParams(d, { env: ctx.env, now: ctx.now(), token: linkToken(d.id, linkSecret(ctx.env)) }), {
        idempotencyKey: `anzahlung-${d.id}-${Math.floor(ctx.now() / 60_000)}`,
      });
      await ctx.store.update("deposits", d.id, (x) => ({ ...x, session: s.id, session_url: s.url, session_ablauf: s.expires_at, testmodus: gateway.testmode }));
      return Response.json({ success: true, url: s.url });
    } catch (err) {
      console.error(`[payments] anzahlung ${d.id}: checkout ${err?.type || err?.name || "error"}`);
      return errorResponse("upstream", 502);
    }
  };
}

// ---------- Gutscheinregister (Admin) ----------

export function registerHandler({ ctx, limiter } = {}) {
  return async function POST(request) {
    const auth = authorizeAdmin(request, { env: ctx.env, limiter, now: ctx.now() });
    if (!auth.ok) return auth.response;
    const body = await readJson(request, ADMIN_MAX_BYTES);
    if (body.error) return body.error;
    const parsed = registerSchema.safeParse(body.data);
    if (!parsed.success) return zodError(parsed.error);
    const r = await registerAction(ctx, parsed.data);
    return Response.json(r.body, { status: r.status });
  };
}

// ---------- Widerruf ----------

/**
 * Verfügbar, solange Online-Käufe möglich sind ODER in den letzten 30 Tagen
 * eine echte (livemode) bezahlte Online-Bestellung existiert (Frist 14 Tage
 * ab Erhalt, mit Reserve). Test- und Mock-Bestellungen zählen nicht.
 */
export async function withdrawalAvailable(ctx, { termsStatus, withdrawalStatus, decisions } = {}) {
  if (voucherMode(ctx.env, termsStatus, { withdrawalStatus, decisions }) === "stripe") return true;
  const since = ctx.now() - 30 * 86_400_000;
  const orders = await ctx.store.list("orders");
  return orders.some((o) => o.livemode === true && o.bezahlt && Date.parse(o.bezahlt) >= since);
}

export function withdrawalHandler({ ctx, termsStatus, withdrawalStatus, decisions, limiter, now, resolveHeaders } = {}) {
  return async function POST(request) {
    const forceMock = devVoucherMock(ctx.env, mockSignalOf(request));
    if (!forceMock && !(await withdrawalAvailable(ctx, { termsStatus, withdrawalStatus, decisions }))) return notFound();
    if (!sameOrigin(request)) return forbidden();
    try {
      const guard = await guardForm(request, withdrawalSchema, {
        route: "widerruf",
        maxBytes: WITHDRAWAL_MAX_BYTES,
        fakeSuccess: () => ({ success: true, id: "W-0000-0000" }),
        outerHeaders: await outerHeadersOf(resolveHeaders),
        limiter,
        now: now ? now() : Date.now(),
      });
      if (!guard.ok) return guard.response;
      const r = await recordWithdrawal(ctx, guard.data);
      return Response.json({ success: true, id: r.id, zeit: r.zeit });
    } catch (err) {
      console.error(`[payments] widerruf: intern ${err?.message || err}`);
      return errorResponse("internal", 500);
    }
  };
}

// ---------- Webhook ----------

/**
 * Prüffunktion je nach Umgebung: echte Schlüssel → Stripe-Geheimnis;
 * PAYMENTS_MOCK=1 (nie Produktion) → zusätzlich das Mock-Geheimnis.
 * Ohne beides ist der Endpunkt aus (404).
 */
export function stripeWebhookHandler({ ctx } = {}) {
  return async function POST(request) {
    const env = ctx.env;
    const keys = stripeKeysReady(env);
    const mock = mockActive(env);
    if (!keys && !mock) return notFound();
    const gateway = keys ? ctx.gatewayFor({}) : null;
    const verify = (raw, sig) => {
      if (keys && gateway?.kind === "stripe") {
        try {
          return gateway.verifyEvent(raw, sig);
        } catch (err) {
          if (!mock) throw err;
        }
      }
      return verifyWithSecret(raw, sig, MOCK_WEBHOOK_SECRET);
    };
    return webhookHandler({ ctx, verify })(request);
  };
}

// ---------- Mock ----------

export const MOCK_OUTCOMES = Object.freeze(["erfolg", "ausstehend", "lastschrift_bestaetigt", "fehlschlag", "abbruch", "erstattung"]);

function mockEvent(type, object) {
  return { id: newMockId("evt"), object: "event", type, livemode: false, created: Math.floor(Date.now() / 1000), data: { object } };
}

/** Ereignis signieren und durch den echten Webhook-Pfad schicken (Rohtext + Signatur). */
export async function deliverMockEvent(ctx, event) {
  const raw = JSON.stringify(event);
  const request = new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signTestEvent(raw), "content-type": "application/json" }, body: raw });
  const res = await webhookHandler({ ctx, verify: (r, s) => verifyWithSecret(r, s, MOCK_WEBHOOK_SECRET) })(request);
  return { status: res.status, body: await res.json() };
}

export function mockHandler({ ctx } = {}) {
  return async function POST(request) {
    if (isProduction(ctx.env)) return notFound();
    if (!sameOrigin(request)) return forbidden();
    const body = await readJson(request, 2048);
    if (body.error) return body.error;
    const { session: id, ausgang } = body.data || {};
    if (typeof id !== "string" || !/^cs_mock_[a-f0-9]{24}$/.test(id) || !MOCK_OUTCOMES.includes(ausgang)) return errorResponse("invalid", 400);
    const s = await ctx.store.get("mock", id);
    if (!s) return notFound();
    // Wie bei Stripe: eine beendete Session lässt sich nicht mehr bezahlen.
    if (s.status === "expired" && ausgang !== "abbruch") return errorResponse("expired", 409, { message: "Session abgelaufen" });
    const success = s.success_url.replace("{CHECKOUT_SESSION_ID}", id);
    const pi = s.payment_intent || `pi_mock_${id.slice(8)}`;
    const details = { email: s.customer_email || "kunde@example.invalid", name: "Mock Kunde", address: { country: "AT" } };
    const base = { ...s, payment_intent: pi, customer_details: details };
    const delivered = [];
    const send = async (type, obj) => delivered.push(await deliverMockEvent(ctx, mockEvent(type, obj)));

    if (ausgang === "abbruch") {
      await send("checkout.session.expired", { ...base, status: "expired" });
      return Response.json({ success: true, redirect: s.cancel_url });
    }
    if (ausgang === "erfolg") await send("checkout.session.completed", { ...base, status: "complete", payment_status: "paid" });
    if (ausgang === "ausstehend") await send("checkout.session.completed", { ...base, status: "complete", payment_status: "unpaid" });
    if (ausgang === "lastschrift_bestaetigt") await send("checkout.session.async_payment_succeeded", { ...base, status: "complete", payment_status: "paid" });
    if (ausgang === "fehlschlag") await send("checkout.session.async_payment_failed", { ...base, status: "complete", payment_status: "unpaid" });
    if (ausgang === "erstattung") await send("charge.refunded", { id: `ch_mock_${id.slice(8)}`, object: "charge", payment_intent: pi, amount: s.amount_total, amount_refunded: s.amount_total, refunded: true, metadata: s.metadata });
    await ctx.store.update("mock", id, (x) => ({ ...x, payment_intent: pi, status: ausgang === "erstattung" ? x.status : "complete", ausgang }));
    return Response.json({ success: true, redirect: success, events: delivered.map((d) => d.body?.result || d.status) });
  };
}

// ---------- Status für die Erfolgsseite ----------

/** Öffentliche Sicht auf eine Zahlung zur Session-Id (ohne Personendaten). */
export async function statusForSession(ctx, sessionId) {
  if (typeof sessionId !== "string" || !/^cs_(test_|live_|mock_)?[A-Za-z0-9_]{8,200}$/.test(sessionId)) return null;
  const order = await ctx.store.find("orders", (o) => o.session === sessionId);
  if (order) {
    return { art: "gutschein", referenz: order.id, status: order.status, summe_cent: order.summe_cent, anzahl: order.anzahl, betrag_cent: order.betrag_cent, mail: order.mail?.status || null, test: order.testmodus || order.livemode === false };
  }
  const d = await ctx.store.find("deposits", (x) => x.session === sessionId || (x.doppelt || []).some((e) => e.session === sessionId));
  if (d) return { art: "anzahlung", referenz: d.auftrag, status: publicDeposit(d, ctx.now()).status, summe_cent: d.betrag_cent, test: d.testmodus || d.livemode === false };
  return null;
}
