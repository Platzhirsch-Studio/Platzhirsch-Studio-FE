// src/lib/shop/phMirror.js – Spiegel der Shop-Ablage nach ph_shop (Gruppe "shop").
//
// Bis Migrationsschritt M6 (Backend-Import/PLAN.md §4) bleibt der lokale Store
// (orderStore.js) die Quelle der Website: Bestätigungsseite, Webhook, Widerruf
// lesen weiter dort. Mit BACKEND_GENERATION=ph (Gruppe "shop") meldet dieser
// Spiegel jede Änderung ZUSÄTZLICH an ph_shop – genau der Weg aus PLAN.md
// („Website bleibt Session-Ersteller, meldet die Bestellung vorher per
// create_order, stripe_session per attach_session; beide Webhooks parallel“):
//
//   put("bestellungen")                      → ph_shop.api.create_order(record)          (idempotent)
//   update("bestellungen"): session neu      → ph_shop.api.attach_session(referenz, session, payment_intent?)
//   update: status → checkout_fehler         → attach_session(referenz, status="checkout_fehler")
//   update: status → bezahlt|zahlung_ausstehend|fehlgeschlagen|abgelaufen|erstattet|teilerstattet
//                                            → ph_shop.api.order_event(referenz, status, zeit, …) (idempotent)
//   update: sendung.awb neu                  → order_event(status="versandbereit", sendung{shipmentId, awb, carrier})
//   put("widerrufe")                         → ph_shop.api.request_withdrawal(name, email, …)   (idempotent)
//   tarife                                   → kein Spiegel (Versand-Quotes sind Website-intern)
//
// Fehler des Spiegels ändern nie das Ergebnis für die Website (nur Log ohne
// Personendaten); die Bestellung bleibt lokal vollständig. attach_session hat
// im Backend kein **kwargs → es wird KEIN idempotency_key mitgeschickt.
//
// Rein (relative Importe; fetch wird übergeben).
import { phCall, resolveBackend } from "../backend/config.js";

const EVENT_STATUS = new Set(["bezahlt", "zahlung_ausstehend", "fehlgeschlagen", "abgelaufen", "erstattet", "teilerstattet"]);

const key = (...parts) => parts.filter((p) => p != null && p !== "").join(":").slice(0, 80);
const lastZeit = (o) => (Array.isArray(o?.verlauf) && o.verlauf.length ? o.verlauf[o.verlauf.length - 1]?.zeit : null) || null;

/** Datensatz der Website → create_order-Parameter (README ph_shop: „Datensatz unverändert“). */
export function orderRecord(order) {
  return { ...order, bestellnummer: order.id };
}

/** Widerruf (widerruf.js recordShopWithdrawal) → request_withdrawal-Parameter. */
export function withdrawalParams(w) {
  return {
    id: w.id,
    zeit: w.zeit,
    name: w.name,
    email: w.email,
    bestellung: w.bestellung || w.angabe || null,
    anschrift: w.anschrift || null,
    artikel: w.artikel || null,
    bestelltAm: w.bestelltAm || null,
    erhaltenAm: w.erhaltenAm || null,
    nachricht: w.nachricht || null,
    // Die Website schickt die Eingangsbestätigung selbst (§ 13a FAGG).
    bestaetigung_senden: 0,
    idempotency_key: key("widerruf", w.id),
  };
}

/**
 * Welche ph-Aufrufe ergeben sich aus alt → neu einer Bestellung?
 * @returns {Array<[method: string, params: object]>}
 */
export function orderCalls(prev, next) {
  if (!next?.id) return [];
  const referenz = next.id;
  const calls = [];
  if (!prev) {
    calls.push(["ph_shop.api.create_order", { record: orderRecord(next), idempotency_key: key("order", referenz) }]);
    return calls;
  }
  if (next.session && next.session !== prev.session) {
    calls.push(["ph_shop.api.attach_session", { referenz, session: next.session, ...(next.payment_intent ? { payment_intent: next.payment_intent } : {}) }]);
  }
  if (next.status !== prev.status) {
    if (next.status === "checkout_fehler") calls.push(["ph_shop.api.attach_session", { referenz, status: "checkout_fehler" }]);
    else if (EVENT_STATUS.has(next.status)) {
      const zeit = lastZeit(next);
      calls.push([
        "ph_shop.api.order_event",
        {
          referenz,
          status: next.status,
          zeit,
          payment_intent: next.payment_intent || null,
          livemode: next.livemode == null ? null : next.livemode ? 1 : 0,
          betrag_bezahlt_cent: next.betrag_bezahlt_cent ?? null,
          erstattet_cent: next.erstattet_cent ?? null,
          idempotency_key: key("oe", referenz, next.status, zeit),
        },
      ]);
    }
  }
  if (next.sendung?.awb && next.sendung.awb !== prev.sendung?.awb) {
    calls.push([
      "ph_shop.api.order_event",
      {
        referenz,
        status: "versandbereit",
        zeit: lastZeit(next),
        sendung: { shipmentId: next.sendung.shipmentId || next.shipment_id || null, awb: next.sendung.awb, carrier: next.sendung.carrier || null },
        idempotency_key: key("oe", referenz, "versandbereit", next.sendung.awb),
      },
    ]);
  }
  return calls;
}

/**
 * Hüllt einen Store (createLocalOrderAdapter / createMemoryOrderAdapter) ein.
 * Ohne ph-Zugang (Gruppe nicht ph) kommt der Store unverändert zurück.
 * @param {object} store
 * @param {{ env?: object, fetchImpl?: Function, logger?: object, cfg?: object }} [o]
 */
export function withPhMirror(store, { env = process.env, fetchImpl = globalThis.fetch, logger = console, cfg } = {}) {
  const backend = cfg ? { generation: "ph", ph: cfg } : resolveBackend("shop", env);
  if (backend.generation !== "ph") return store;
  if (!backend.ph) {
    try {
      logger.warn("[shop] ph-Spiegel gewählt, aber BACKEND_PH_URL/BACKEND_PH_TOKEN fehlen – Bestellungen bleiben nur lokal.");
    } catch {
      // nie stören
    }
    return store;
  }
  const ph = backend.ph;
  const sent = [];

  async function send(calls) {
    for (const [method, params] of calls) {
      const r = await phCall(ph, method, { params, fetchImpl, client: false });
      sent.push({ method, ok: r.ok, code: r.ok ? null : r.code });
      if (!r.ok) {
        try {
          logger.error(`[shop] ph-Spiegel ${method} ${params.referenz || params.id || params.record?.id || ""}: ${r.code}${r.status ? ` (HTTP ${r.status})` : ""}`);
        } catch {
          // nie stören
        }
      }
    }
  }
  const safe = async (calls) => {
    try {
      await send(calls);
    } catch {
      // Der Spiegel darf die Website nie aufhalten.
    }
  };

  return {
    ...store,
    kind: `${store.kind || "store"}+ph`,
    phMirror: { sent },
    get: store.get.bind(store),
    list: store.list.bind(store),
    find: store.find.bind(store),
    async put(n, id, value) {
      const prev = n === "bestellungen" ? await store.get(n, id) : null;
      const saved = await store.put(n, id, value);
      if (n === "bestellungen") await safe(orderCalls(prev, saved));
      else if (n === "widerrufe" && saved) await safe([["ph_shop.api.request_withdrawal", withdrawalParams(saved)]]);
      return saved;
    },
    async update(n, id, fn) {
      if (n !== "bestellungen") return store.update(n, id, fn);
      let prev = null;
      const saved = await store.update(n, id, (cur) => {
        prev = cur;
        return fn(cur);
      });
      await safe(orderCalls(prev, saved));
      return saved;
    },
  };
}
