// src/lib/payments/webhook.js
// POST /api/stripe/webhook
//   1. Rohtext lesen (request.text(), Next-Doku route.md "Webhooks"), höchstens 256 KB
//   2. Signatur prüfen (Stripe-Signature, SDK constructEvent, Toleranz 300 s)
//   3. Idempotenz über die Event-Id (Sammlung "events"); parallele Zustellung
//      desselben Ereignisses → 409, Stripe wiederholt später
//   4. Verarbeiten:
//        checkout.session.completed         paid → erfüllen; unpaid (SEPA, …) → "zahlung_ausstehend"
//        checkout.session.async_payment_succeeded → erfüllen
//        checkout.session.async_payment_failed    → "fehlgeschlagen" (+ Mail)
//        checkout.session.expired           → offene Bestellung "abgelaufen"
//        charge.refunded                    → "erstattet"/"teilerstattet", Gutscheine sperren
//      Andere Typen: 200 ohne Wirkung.
//   5. Fehler bei der Verarbeitung → 500 und Event-Id wieder frei (Stripe wiederholt).
// Logs: Typ, Event-Id, Bestellnummer; nie Namen, Adressen, E-Mails, Codes.
// Keine "@/..."-Importe.
import { formatEuro } from "../commerce/priceRules.js";
import { logRef } from "./codes.js";
import { fulfilVoucherOrder } from "./voucherOrder.js";
import { markDepositPaid } from "./deposit.js";
import { mailHtml } from "./mailer.js";
import { paymentEvent } from "./backoffice.js";

export const MAX_WEBHOOK_BYTES = 256 * 1024;
export const HANDLED = Object.freeze([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
]);

const inFlight = new Set();
const json = (body, status = 200) => Response.json(body, { status });

async function setStatus(ctx, coll, id, status, extra = {}) {
  const nowIso = new Date(ctx.now()).toISOString();
  return ctx.store.update(coll, id, (x) => (x ? { ...x, ...extra, status, verlauf: [...(x.verlauf || []), { zeit: nowIso, status }] } : undefined));
}

const targetOf = (session) => {
  const m = session?.metadata || {};
  if (m.art === "gutschein" && m.order_id) return { coll: "orders", id: m.order_id, art: "gutschein" };
  if (m.art === "anzahlung" && m.deposit_id) return { coll: "deposits", id: m.deposit_id, art: "anzahlung" };
  return null;
};

async function fulfil(ctx, session, livemode) {
  const t = targetOf(session);
  if (!t) return "ignoriert";
  const r = t.art === "gutschein" ? await fulfilVoucherOrder(ctx, session, { livemode }) : await markDepositPaid(ctx, session, { livemode });
  return r.result;
}

async function onFailed(ctx, session, livemode) {
  const t = targetOf(session);
  if (!t) return "ignoriert";
  const cur = await ctx.store.get(t.coll, t.id);
  if (!cur || cur.status === "bezahlt") return "unveraendert";
  await setStatus(ctx, t.coll, t.id, "fehlgeschlagen", { session: session.id });
  const email = session.customer_details?.email || (t.art === "gutschein" ? cur.kaeufer?.email : cur.email);
  if (email) {
    const what = t.art === "gutschein" ? `Ihre Gutschein-Bestellung ${cur.id}` : `die Anzahlung zu Auftrag ${cur.auftrag}`;
    const lines = [
      "Guten Tag,",
      `die Zahlung für ${what} über ${formatEuro((session.amount_total || 0) / 100)} ist leider nicht durchgegangen, zum Beispiel weil eine Lastschrift zurückgegeben wurde. Es ist nichts abgebucht bzw. der Betrag wird zurückgebucht.`,
      t.art === "gutschein" ? "Gerne können Sie den Gutschein erneut bestellen oder uns anrufen: +43 5574 46255." : "Sie können den Zahlungslink erneut verwenden oder uns anrufen: +43 5574 46255.",
      "Herzliche Grüße\nIhr Team von Platzhirsch Home Living",
    ];
    try {
      await ctx.mailer.send({ to: email, subject: `${livemode ? "" : "[TEST] "}Zahlung nicht erfolgreich`, text: lines.join("\n\n"), html: mailHtml(lines), tag: "zahlung-fehlgeschlagen" });
    } catch (err) {
      console.error(`[payments] ${t.id}: mail ${err?.message || err}`);
    }
  }
  await ctx.backoffice.emit(paymentEvent({ typ: `${t.art}.fehlgeschlagen`, art: t.art, referenz: t.art === "anzahlung" ? cur.auftrag : cur.id, betragCent: session.amount_total, zahlungsstatus: "fehlgeschlagen", session: session.id, paymentIntent: session.payment_intent, livemode, now: new Date(ctx.now()) }));
  return "fehlgeschlagen";
}

async function onRefund(ctx, charge, livemode) {
  const pi = charge.payment_intent;
  if (!pi) return "ignoriert";
  const meta = charge.metadata || {};
  let t = null;
  if (meta.art === "gutschein" && meta.order_id) t = { coll: "orders", id: meta.order_id, art: "gutschein" };
  else if (meta.art === "anzahlung" && meta.deposit_id) t = { coll: "deposits", id: meta.deposit_id, art: "anzahlung" };
  else {
    const order = await ctx.store.find("orders", (o) => o.payment_intent === pi);
    if (order) t = { coll: "orders", id: order.id, art: "gutschein" };
    else {
      const dep = await ctx.store.find("deposits", (d) => d.payment_intent === pi);
      if (dep) t = { coll: "deposits", id: dep.id, art: "anzahlung" };
    }
  }
  if (!t) return "unbekannt";
  // Erstattung einer DOPPELTEN Anzahlung (QA P2-1): nur den Eintrag in
  // "doppelt" markieren, die eigentliche Anzahlung bleibt bezahlt.
  if (t.art === "anzahlung") {
    const dep = await ctx.store.get(t.coll, t.id);
    if (dep && (dep.doppelt || []).some((x) => x.payment_intent === pi)) {
      const nowIso = new Date(ctx.now()).toISOString();
      await ctx.store.update(t.coll, t.id, (x) => ({
        ...x,
        doppelt: x.doppelt.map((e) => (e.payment_intent === pi ? { ...e, erstattet_cent: charge.amount_refunded, erstattet: nowIso } : e)),
        verlauf: [...x.verlauf, { zeit: nowIso, status: "doppelt_erstattet" }],
      }));
      await ctx.backoffice.emit(paymentEvent({ typ: "anzahlung.doppelt_erstattet", art: "anzahlung", referenz: dep.auftrag, betragCent: charge.amount_refunded, zahlungsstatus: "doppelt_erstattet", paymentIntent: pi, livemode, now: new Date(ctx.now()) }));
      return "doppelt_erstattet";
    }
  }
  const full = charge.refunded === true || charge.amount_refunded >= charge.amount;
  const status = full ? "erstattet" : "teilerstattet";
  const cur = await setStatus(ctx, t.coll, t.id, status, { erstattet_cent: charge.amount_refunded });
  if (!cur) return "unbekannt";
  let gesperrt = 0;
  let pruefen = false;
  if (t.art === "gutschein" && full) {
    for (const c of cur.codes || []) {
      await ctx.store.update("register", c.hash, (r) => {
        if (!r) return undefined;
        if (r.rest_cent < r.wert_cent) {
          pruefen = true; // bereits (teil)eingelöst: Team entscheidet
          return { ...r, hinweis: "erstattet trotz Einlösung, prüfen" };
        }
        gesperrt++;
        return { ...r, status: "gesperrt", grund: "erstattet", rest_cent: 0 };
      });
    }
  }
  await ctx.backoffice.emit(
    paymentEvent({
      typ: `${t.art}.${status}`,
      art: t.art,
      referenz: t.art === "anzahlung" ? cur.auftrag : cur.id,
      betragCent: charge.amount_refunded,
      zahlungsstatus: pruefen ? `${status}_pruefen` : status,
      paymentIntent: pi,
      livemode,
      now: new Date(ctx.now()),
    })
  );
  return gesperrt ? `${status}:${gesperrt}_gesperrt` : status;
}

/** Ein geprüftes Ereignis verarbeiten. */
export async function processEvent(ctx, event) {
  const obj = event?.data?.object || {};
  const live = Boolean(event.livemode);
  // Shop der Accessoire-Welt (Nr. 29): eigene Ablage und Logik in src/lib/shop/webhook.js.
  if (obj?.metadata?.art === "shop") return ctx.shop ? ctx.shop.onEvent(event) : "ignoriert";
  switch (event.type) {
    case "checkout.session.completed":
      if (obj.payment_status === "paid" || obj.payment_status === "no_payment_required") return fulfil(ctx, obj, live);
      {
        const t = targetOf(obj);
        const cur = t ? await ctx.store.get(t.coll, t.id) : null;
        // Reihenfolge der Zustellung ist nicht garantiert: nie von "bezahlt" zurück.
        if (cur && cur.status !== "bezahlt") await setStatus(ctx, t.coll, t.id, "zahlung_ausstehend", { session: obj.id, payment_intent: obj.payment_intent || null });
        return "ausstehend";
      }
    case "checkout.session.async_payment_succeeded":
      return fulfil(ctx, obj, live);
    case "checkout.session.async_payment_failed":
      return onFailed(ctx, obj, live);
    case "checkout.session.expired": {
      const t = targetOf(obj);
      if (!t) return "ignoriert";
      const cur = await ctx.store.get(t.coll, t.id);
      // Anzahlungen bleiben bezahlbar (neue Session über den Link).
      if (cur && t.art === "gutschein" && cur.status === "offen") await setStatus(ctx, t.coll, t.id, "abgelaufen");
      // Nur die aktuelle Session zurücksetzen, nicht eine inzwischen neuere.
      if (cur && t.art === "anzahlung" && cur.session === obj.id) await ctx.store.update(t.coll, t.id, (x) => (x.session === obj.id ? { ...x, session_url: null, session_ablauf: null } : x));
      return "abgelaufen";
    }
    case "charge.refunded":
      return onRefund(ctx, obj, live);
    default:
      return "ignoriert";
  }
}

/**
 * Handler-Fabrik. `verify(raw, signature)` → Event (wirft bei Fehler).
 * @param {{ ctx: object, verify: (raw: string, sig: string) => object }} deps
 */
export function webhookHandler({ ctx, verify }) {
  return async function POST(request) {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return json({ received: false, error: "missing signature" }, 400);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_WEBHOOK_BYTES) return json({ received: false, error: "too large" }, 413);
    let raw;
    try {
      raw = await request.text();
    } catch {
      return json({ received: false, error: "unreadable" }, 400);
    }
    if (raw.length > MAX_WEBHOOK_BYTES) return json({ received: false, error: "too large" }, 413);

    let event;
    try {
      event = verify(raw, signature);
    } catch {
      console.warn("[payments] webhook: Signatur ungültig");
      return json({ received: false, error: "invalid signature" }, 400);
    }
    if (!event?.id || !event?.type) return json({ received: false, error: "invalid event" }, 400);

    if (inFlight.has(event.id)) return json({ received: false, error: "in progress" }, 409);
    const done = await ctx.store.get("events", event.id);
    if (done) return json({ received: true, duplicate: true });

    inFlight.add(event.id);
    try {
      const result = HANDLED.includes(event.type) ? await processEvent(ctx, event) : "ignoriert";
      await ctx.store.put("events", event.id, { typ: event.type, zeit: new Date(ctx.now()).toISOString(), ergebnis: result, livemode: Boolean(event.livemode) });
      const ref = event.data?.object?.metadata?.order_id || event.data?.object?.metadata?.deposit_id || logRef(event.data?.object?.id);
      console.info(`[payments] webhook ${event.type} ${event.id} ${ref}: ${result}`);
      return json({ received: true, result });
    } catch (err) {
      console.error(`[payments] webhook ${event.type} ${event.id}: Fehler ${err?.message || err}`);
      return json({ received: false, error: "processing failed" }, 500);
    } finally {
      inFlight.delete(event.id);
    }
  };
}
