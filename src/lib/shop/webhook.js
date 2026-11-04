// src/lib/shop/webhook.js
// Shop-Teil des Stripe-Webhooks (/api/stripe/webhook, src/lib/payments/
// webhook.js leitet Sessions mit metadata.art === "shop" hierher weiter –
// Signaturprüfung und Idempotenz bleiben dort, ein Endpunkt für alles).
//   checkout.session.completed (paid) / async_payment_succeeded → "bezahlt",
//       danach bei Lieferart Versand: Sendung + Etikett + Tracking (LetMeShip;
//       im Test nur Mock). Abholung → kein LetMeShip-Aufruf.
//   completed (unpaid)          → "zahlung_ausstehend"
//   async_payment_failed        → "fehlgeschlagen"
//   checkout.session.expired    → "abgelaufen" (nur aus "offen")
//   charge.refunded             → "erstattet" / "teilerstattet"
// Mail: nach „bezahlt“ die Vertragsbestätigung (§ 7 Abs 3 FAGG, orderMail.js;
// live jeder Mailer, test nur Mock-Mailer). Kein Backoffice. Logs ohne Personendaten.
// Keine "@/"-Importe.
import { shippingAdapterFor } from "../commerce/shipping/index.js";
import { createLocalOrderAdapter, shopDataDir } from "./orderStore.js";
import { shopMode } from "./mode.js";
import { sendeVertragsbestaetigung } from "./orderMail.js";

const push = (o, status, now, extra = {}) => ({ ...o, ...extra, status, verlauf: [...(o.verlauf || []), { zeit: new Date(now).toISOString(), status }] });

/**
 * @param {{ env?: object, store?: object, shipping?: object|null, mailer?: object|null, now?: () => number }} [o]
 */
export function createShopHooks(o = {}) {
  const env = o.env || process.env;
  const now = o.now || (() => Date.now());
  let store = o.store || null;
  const st = () => (store ||= createLocalOrderAdapter(shopDataDir(env)));
  const shippingOf = () => (o.shipping !== undefined ? o.shipping : shippingAdapterFor(env, shopMode(env)));
  const mailerOf = () => (typeof o.mailer === "function" ? o.mailer() : o.mailer || null);

  /** Vertragsbestätigung genau einmal je Bestellung (Webhook-Zustellungen wiederholen sich). */
  async function bestaetigen(order) {
    if (order.mail?.status === "gesendet") return order;
    await sendeVertragsbestaetigung({ store: st(), mailer: mailerOf(), now }, order, order.modus || shopMode(env));
    return st().get("bestellungen", order.id);
  }

  async function versenden(order) {
    if (order.lieferart !== "versand" || order.sendung?.awb) return order;
    const adapter = shippingOf();
    if (!adapter) return st().update("bestellungen", order.id, (x) => push(x, x.status, now(), { sendung: { status: "nicht_angelegt", grund: "kein_adapter" } }));
    try {
      const s = await adapter.createShipment({
        ziel: { ...order.adresse, name: order.kunde.name, email: order.kunde.email, telefon: order.kunde.telefon },
        pakete: order.versand.pakete,
        versichern: order.versand.versichert,
        warenwertCent: order.summen.warenCent,
        datum: new Date(now() + 86_400_000).toISOString().slice(0, 10),
        service: order.versand.service,
        referenz: order.id,
      });
      const etikett = s.labelPdfBase64 ? await st().saveLabel(order.id, s.labelPdfBase64) : null;
      return st().update("bestellungen", order.id, (x) =>
        push(x, "versandbereit", now(), { sendung: { status: "angelegt", shipmentId: s.shipmentId, awb: s.awb, carrier: s.carrier, etikett, mock: Boolean(adapter.mock) } })
      );
    } catch (err) {
      console.error(`[shop] ${order.id}: sendung ${err?.code || "fehler"}`);
      return st().update("bestellungen", order.id, (x) => ({ ...x, sendung: { status: "fehler", grund: err?.code || "fehler" } }));
    }
  }

  async function onEvent(event) {
    const obj = event?.data?.object || {};
    const id = obj.metadata?.order_id;
    if (!id) return "ignoriert";
    const cur = await st().get("bestellungen", id);
    if (!cur) return "unbekannt";
    const t = now();
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const paid = obj.payment_status === "paid" || obj.payment_status === "no_payment_required";
        if (!paid) {
          if (cur.status === "offen") await st().update("bestellungen", id, (x) => push(x, "zahlung_ausstehend", t, { payment_intent: obj.payment_intent || null }));
          return "ausstehend";
        }
        if ((obj.amount_total ?? cur.summen.gesamtCent) !== cur.summen.gesamtCent) console.error(`[shop] ${id}: Betrag weicht ab`);
        let order = cur;
        if (!cur.bezahlt) order = await st().update("bestellungen", id, (x) => push(x, "bezahlt", t, { bezahlt: new Date(t).toISOString(), payment_intent: obj.payment_intent || null, livemode: Boolean(event.livemode), betrag_bezahlt_cent: obj.amount_total ?? null }));
        order = await bestaetigen(order);
        await versenden(order);
        return "bezahlt";
      }
      case "checkout.session.async_payment_failed":
        if (cur.status !== "bezahlt") await st().update("bestellungen", id, (x) => push(x, "fehlgeschlagen", t));
        return "fehlgeschlagen";
      case "checkout.session.expired":
        if (cur.status === "offen") await st().update("bestellungen", id, (x) => push(x, "abgelaufen", t));
        return "abgelaufen";
      case "charge.refunded": {
        const full = obj.refunded === true || obj.amount_refunded >= obj.amount;
        const status = full ? "erstattet" : "teilerstattet";
        await st().update("bestellungen", id, (x) => push(x, status, t, { erstattet_cent: obj.amount_refunded }));
        return status;
      }
      default:
        return "ignoriert";
    }
  }

  return { onEvent, versenden, store: st };
}
