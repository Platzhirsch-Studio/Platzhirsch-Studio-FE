// src/lib/payments/backoffice.js
// Belegdaten für das Backoffice als Ereignis (Auftrag/Bestellung, Betrag,
// Zahlungsstatus). Das Backoffice ist PRODUKTIV: hier wird nie echt
// geschrieben, solange der Inhaber das nicht ausdrücklich einschaltet.
//
//   outbox (Standard)  Ereignis als JSON in <PAYMENTS_DATA_DIR>/backoffice-events/
//   frappe             VORBEREITET, NICHT aktiv. Baut die Anfrage an eine
//                      Whitelist-Methode (PAYMENTS_BACKOFFICE_METHOD, Standard
//                      platzhirsch_studio.api.payment_event – existiert im
//                      Backoffice noch nicht). Gesendet wird nur mit
//                      PAYMENTS_BACKOFFICE=frappe UND PAYMENTS_BACKOFFICE_LIVE=1
//                      UND FRAPPE_URL/FRAPPE_API_KEY/FRAPPE_API_SECRET. Sonst
//                      Probelauf: die gebaute Anfrage (ohne Schlüssel) geht in
//                      die outbox.
//
// Ereignis-Schema (Version 1):
//   { v: 1, typ, zeit, referenz, art: "gutschein"|"anzahlung", betrag_cent,
//     waehrung, zahlungsstatus, stripe: { session, payment_intent, livemode },
//     beleg?: { name, firma, adresse, uid } }   (beleg nur für die Rechnung)
// Keine "@/..."-Importe.
import path from "node:path";
import { writeAtomic } from "./store.js";
import { resolveBackend } from "../backend/config.js";

export const EVENT_VERSION = 1;
export const DEFAULT_METHOD = "platzhirsch_studio.api.payment_event";
export const PH_METHOD = "ph_shop.api.payment_event";

async function writeEvent(dir, event, extra = {}) {
  const name = `${event.zeit.replace(/[:.]/g, "-")}-${event.typ.replace(/[^\w.-]/g, "_")}-${event.referenz}.json`;
  await writeAtomic(path.join(dir, name), JSON.stringify({ ...event, ...extra }, null, 2));
  return name;
}

export function createOutboxBackoffice(dir) {
  return {
    kind: "outbox",
    async emit(event) {
      const file = await writeEvent(dir, event);
      console.info(`[payments] backoffice ${event.typ} ${event.referenz} → outbox`);
      return { ok: true, file };
    },
  };
}

/** Frappe-Adapter: live nur mit allen Schaltern, sonst Probelauf in die outbox. */
export function createFrappeBackoffice({ env, dir, fetchImpl = fetch }) {
  // BACKEND_GENERATION (src/lib/backend/config.js) Gruppe "zahlung" auf ph:
  // ph_shop.api.payment_event mit BACKEND_PH_URL/BACKEND_PH_TOKEN (Schema v1
  // unverändert, Body { event }). PAYMENTS_BACKOFFICE_LIVE=1 bleibt der Schalter.
  const backend = resolveBackend("zahlung", env);
  const ph = backend.generation === "ph" ? backend.ph || { url: "https://backoffice.example.invalid", key: "", secret: "" } : null;
  const live = ph
    ? env.PAYMENTS_BACKOFFICE_LIVE === "1" && Boolean(backend.ph)
    : env.PAYMENTS_BACKOFFICE_LIVE === "1" && env.FRAPPE_URL && env.FRAPPE_API_KEY && env.FRAPPE_API_SECRET;
  const method = ph ? PH_METHOD : env.PAYMENTS_BACKOFFICE_METHOD || DEFAULT_METHOD;
  const url = ph ? `${ph.url}/api/method/${method}` : `${String(env.FRAPPE_URL || "https://backoffice.example.invalid").replace(/\/+$/, "")}/api/method/${method}`;
  const authorization = ph ? `token ${ph.key}:${ph.secret}` : `token ${env.FRAPPE_API_KEY}:${env.FRAPPE_API_SECRET}`;
  // ph_api(idempotent): Wiederholungen derselben Meldung werden im Backend nicht doppelt gebucht.
  const bodyOf = (event) => (ph ? { event, idempotency_key: `pe:${event.typ}:${event.referenz}:${event.zeit}`.slice(0, 80) } : { event });
  return {
    kind: live ? "frappe" : "frappe-probelauf",
    async emit(event) {
      if (!live) {
        await writeEvent(dir, event, { probelauf: { url, method: "POST" } });
        console.info(`[payments] backoffice ${event.typ} ${event.referenz} → Probelauf (nicht gesendet)`);
        return { ok: true, dryRun: true };
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      try {
        const res = await fetchImpl(url, {
          method: "POST",
          signal: ctrl.signal,
          headers: { Authorization: authorization, "Content-Type": "application/json" },
          body: JSON.stringify(bodyOf(event)),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return { ok: true };
      } catch (err) {
        // Nicht verloren: Ereignis lokal ablegen, das Team trägt nach.
        await writeEvent(dir, event, { fehler: String(err?.message || err) });
        console.error(`[payments] backoffice ${event.typ} ${event.referenz}: ${err?.message || err}`);
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function backofficeFromEnv(env, dir, { fetchImpl } = {}) {
  const target = path.join(dir, "backoffice-events");
  if (String(env.PAYMENTS_BACKOFFICE ?? "").toLowerCase() === "frappe") return createFrappeBackoffice({ env, dir: target, fetchImpl });
  return createOutboxBackoffice(target);
}

/** Ereignis bauen (ohne E-Mail-Adresse; Belegdaten nur wenn übergeben). */
export function paymentEvent({ typ, art, referenz, betragCent, zahlungsstatus, session, paymentIntent, livemode, beleg, now = new Date() }) {
  return {
    v: EVENT_VERSION,
    typ,
    zeit: now.toISOString(),
    referenz,
    art,
    betrag_cent: betragCent,
    waehrung: "EUR",
    zahlungsstatus,
    stripe: { session: session || null, payment_intent: paymentIntent || null, livemode: Boolean(livemode) },
    ...(beleg ? { beleg } : {}),
  };
}
