// src/lib/payments/gateway.js
// Zugang zu Stripe (oder zum Mock) hinter einer schmalen Oberfläche:
//   createCheckoutSession(params, { idempotencyKey }) → { id, url, expires_at }
//   expireCheckoutSession(id)                        → { id, status } (wirft, wenn schon bezahlt)
//   verifyEvent(rawBody, signatureHeader)            → Stripe-Event (wirft bei falscher Signatur)
//   signTestEvent(payload)                           → Signatur-Kopfzeile (nur Mock/Tests)
// Das SDK ("stripe", exakt gepinnt) wird nur hier importiert. Diese Datei
// darf nie in eine Client-Komponente gelangen (Test: stripe-bundle.test.mjs).
// API-Version fest: Webhook-Endpunkt im Dashboard auf dieselbe Version stellen.
// Keine "@/..."-Importe.
import Stripe from "stripe";
import { MOCK_SECRET_KEY, MOCK_WEBHOOK_SECRET, baseUrl, isTestKey } from "./config.js";
import { newMockId } from "./codes.js";

export const STRIPE_API_VERSION = "2026-08-26.dahlia";
// Toleranz der Signaturprüfung (Sekunden), Stripe-Standard.
export const SIGNATURE_TOLERANCE = 300;

export function createStripeGateway(env, { stripe } = {}) {
  const client =
    stripe ||
    new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: { name: "platzhirsch.studio" },
    });
  const secret = env.STRIPE_WEBHOOK_SECRET;
  return {
    kind: "stripe",
    testmode: isTestKey(env.STRIPE_SECRET_KEY),
    async createCheckoutSession(params, { idempotencyKey } = {}) {
      const s = await client.checkout.sessions.create(params, idempotencyKey ? { idempotencyKey } : undefined);
      return { id: s.id, url: s.url, expires_at: s.expires_at };
    },
    async expireCheckoutSession(id) {
      const s = await client.checkout.sessions.expire(id);
      return { id: s.id, status: s.status };
    },
    verifyEvent(raw, signature) {
      return client.webhooks.constructEvent(raw, signature, secret, SIGNATURE_TOLERANCE);
    },
  };
}

// Nur für Signaturen des Mocks; macht keine Netzwerkanfrage.
let mockSdk;
const sdk = () => (mockSdk ||= new Stripe(MOCK_SECRET_KEY, { apiVersion: STRIPE_API_VERSION }));

/** Signatur-Kopfzeile wie von Stripe, mit dem Mock-Geheimnis (oder einem anderen). */
export const signTestEvent = (payload, secret = MOCK_WEBHOOK_SECRET) => sdk().webhooks.generateTestHeaderString({ payload, secret });

/** Prüft eine Signatur mit beliebigem Geheimnis (Mock-Webhook). */
export const verifyWithSecret = (raw, signature, secret) => sdk().webhooks.constructEvent(raw, signature, secret, SIGNATURE_TOLERANCE);

/**
 * Mock: legt eine simulierte Checkout-Session in der Ablage an. Die "Bezahl-
 * seite" ist /de/zahlung/mock?session=…, dort werden Erfolg, ausstehende
 * Zahlung (SEPA), Fehlschlag und Abbruch simuliert.
 */
export function createMockGateway(env, { store, now = () => Date.now() }) {
  return {
    kind: "mock",
    testmode: true,
    async createCheckoutSession(params) {
      const id = newMockId("cs");
      const amount = (params.line_items || []).reduce((sum, li) => sum + li.quantity * li.price_data.unit_amount, 0);
      const session = {
        id,
        object: "checkout.session",
        url: `${baseUrl(env)}/de/zahlung/mock?session=${id}`,
        status: "open",
        payment_status: "unpaid",
        amount_total: amount,
        currency: params.line_items?.[0]?.price_data?.currency || "eur",
        metadata: params.metadata || {},
        client_reference_id: params.client_reference_id || null,
        customer_email: params.customer_email || null,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
        line_items: (params.line_items || []).map((li) => ({ name: li.price_data.product_data.name, quantity: li.quantity, unit_amount: li.price_data.unit_amount })),
        expires_at: Math.floor(now() / 1000) + 24 * 3600,
        livemode: false,
      };
      await store.put("mock", id, session);
      return { id, url: session.url, expires_at: session.expires_at };
    },
    async expireCheckoutSession(id) {
      const s = await store.get("mock", id);
      if (!s) throw Object.assign(new Error("No such session"), { type: "StripeInvalidRequestError", code: "resource_missing" });
      if (s.status === "complete") throw Object.assign(new Error("Session is complete"), { type: "StripeInvalidRequestError", code: "checkout_session_complete" });
      await store.put("mock", id, { ...s, status: "expired" });
      return { id, status: "expired" };
    },
    verifyEvent(raw, signature) {
      return verifyWithSecret(raw, signature, MOCK_WEBHOOK_SECRET);
    },
  };
}
