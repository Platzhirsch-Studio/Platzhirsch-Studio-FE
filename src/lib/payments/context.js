// src/lib/payments/context.js
// Bündelt Umgebung, Ablage, Mail-, Backoffice- und Zahlungs-Adapter.
// Tests bauen sich einen Kontext mit createMemoryStore() und eigenen Adaptern;
// die Routen nutzen defaultContext() (Datei-Ablage, outbox).
// Keine "@/..."-Importe.
import { dataDir, mockActive, stripeKeysReady } from "./config.js";
import { createFileStore } from "./store.js";
import { mailerFromEnv } from "./mailer.js";
import { backofficeFromEnv } from "./backoffice.js";
import { createMockGateway, createStripeGateway } from "./gateway.js";
import { createShopHooks } from "../shop/webhook.js";

/**
 * @param {{ env?: object, store?: object, mailer?: object, backoffice?: object,
 *   gateway?: object, now?: () => number, fetchImpl?: Function }} [o]
 */
export function createContext(o = {}) {
  const env = o.env || process.env;
  const dir = dataDir(env);
  const store = o.store || createFileStore(dir);
  const now = o.now || (() => Date.now());
  let stripeGateway = null;
  const ctx = {
    env,
    store,
    now,
    dir,
    mailer: o.mailer || mailerFromEnv(env, dir, { fetchImpl: o.fetchImpl }),
    backoffice: o.backoffice || backofficeFromEnv(env, dir, { fetchImpl: o.fetchImpl }),
    // Shop (Nr. 29): Bestellungen in .data/shop, nie im Backoffice. Mailer für die
    // Vertragsbestätigung (orderMail.js), verzögert gelesen, damit Tests ihn tauschen können.
    shop: o.shop || createShopHooks({ env, now, mailer: () => ctx.mailer }),
    /** Mock hat Vorrang, wenn aktiv (nie in Produktion); sonst Stripe mit Schlüsseln; sonst null. */
    gatewayFor(signal = {}, { forceMock = false } = {}) {
      if (o.gateway) return o.gateway;
      if (forceMock || mockActive(env, signal)) return createMockGateway(env, { store, now });
      if (stripeKeysReady(env)) return (stripeGateway ||= createStripeGateway(env));
      return null;
    },
  };
  return ctx;
}

// Bei Änderungen an den Adaptern erhöhen: der Entwicklungsserver behält globalThis
// über Modul-Neuladungen hinweg, ein alter Kontext würde sonst alte Hooks nutzen.
export const CONTEXT_VERSION = 2;

/** Ein Kontext je Serverprozess. */
export function defaultContext() {
  const g = globalThis;
  if (!g.__phPaymentsContext || g.__phPaymentsContext.version !== CONTEXT_VERSION) {
    g.__phPaymentsContext = Object.assign(createContext(), { version: CONTEXT_VERSION });
  }
  return g.__phPaymentsContext;
}
