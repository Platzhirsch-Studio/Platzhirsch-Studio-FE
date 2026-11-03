// src/lib/shop/server.js
// Einstieg der Shop-Routen und -Seiten. "server-only": ein Import aus einer
// Client-Komponente bricht den Build ab (Stripe-SDK, Schlüssel, LetMeShip-
// Zugangsdaten bleiben auf dem Server). Logik in den Nachbardateien.
import "server-only";
import { defaultContext } from "../payments/context.js";
import { checkoutHandler, orderView, versandHandler } from "./handlers.js";
import { shopWiderrufHandler } from "./widerruf.js";

function ctx() {
  const payments = defaultContext();
  return { env: process.env, store: payments.shop.store(), payments, now: () => Date.now() };
}

export const shopRoutes = {
  versand: () => versandHandler(ctx()),
  checkout: () => checkoutHandler(ctx()),
  // Online-Rücktrittsfunktion § 13a FAGG (widerruf.js); Mail nur live über den Payments-Mailer.
  widerruf: (o = {}) => shopWiderrufHandler(ctx(), o),
};

/** Bestätigungsseite: öffentliche Sicht (Token nötig) oder null. */
export const shopOrder = (id, token) => orderView(ctx(), id, token);
