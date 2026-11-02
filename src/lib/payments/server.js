// src/lib/payments/server.js
// Einstieg der Routen und Seiten in die Zahlungsstrecke. "server-only":
// ein Import aus einer Client-Komponente bricht den Build ab, damit weder das
// Stripe-SDK noch STRIPE_SECRET_KEY je ins Browser-Bundle gelangen.
// Die Logik liegt in den Nachbardateien (ohne "server-only", für node --test).
import "server-only";
import { defaultContext } from "./context.js";
import {
  depositAdminHandlers,
  depositForToken,
  depositPayHandler,
  mockHandler,
  registerHandler,
  statusForSession,
  stripeWebhookHandler,
  voucherCheckoutHandler,
  withdrawalAvailable,
  withdrawalHandler,
} from "./handlers.js";
import { publicDeposit, depositLink } from "./deposit.js";

export { defaultContext, publicDeposit };

const ctx = () => defaultContext();

export const routes = {
  voucherCheckout: (o = {}) => voucherCheckoutHandler({ ctx: ctx(), ...o }),
  depositAdmin: () => depositAdminHandlers({ ctx: ctx() }),
  depositPay: () => depositPayHandler({ ctx: ctx() }),
  register: () => registerHandler({ ctx: ctx() }),
  withdrawal: (o = {}) => withdrawalHandler({ ctx: ctx(), ...o }),
  mock: () => mockHandler({ ctx: ctx() }),
  webhook: () => stripeWebhookHandler({ ctx: ctx() }),
};

/** Erfolgsseite: Status zur Session-Id (ohne Personendaten). */
export const paymentStatus = (sessionId) => statusForSession(ctx(), sessionId);

/** Anzahlungs-Seite: öffentliche Sicht zum Token oder null. */
export async function depositView(token) {
  const d = await depositForToken(ctx(), token);
  return d ? publicDeposit(d, Date.now()) : null;
}

/** Mock-Bezahlseite: simulierte Session oder null. */
export async function mockSession(id) {
  if (typeof id !== "string" || !/^cs_mock_[a-f0-9]{24}$/.test(id)) return null;
  return ctx().store.get("mock", id);
}

/** Ist die Widerrufsfunktion verfügbar? */
export const withdrawalOpen = () => withdrawalAvailable(ctx());

/**
 * EINBAUPUNKT PORTAL (nur Vorschlag, das Portal-Team baut ihn ein):
 * offene und bezahlte Anzahlungen einer Kundin/eines Kunden mit Link.
 *   import { depositsForCustomer } from "@/lib/payments/server";
 *   const items = await depositsForCustomer(session.customerId);
 *   <PaymentLinkCard key={i.id} {...i} />   (src/components/Payments/PaymentLinkCard.js)
 */
export async function depositsForCustomer(customerId) {
  if (!customerId) return [];
  const c = ctx();
  const list = await c.store.list("deposits");
  return list
    .filter((d) => d.kunde === customerId && d.status !== "storniert")
    .map((d) => ({ ...publicDeposit(d, c.now()), href: depositLink(d.id, c.env) }));
}
