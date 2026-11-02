// src/lib/commerce/handlers.js
// POST-Handler der beiden Commerce-Routen (Paket R5-commerce):
//   /api/gutschein_anfrage    → VOUCHER_MODE
//   /api/atelier_reservierung → ATELIER_MODE
// Modus "off" (Standard): jede Methode 404, nichts wird gelesen oder gesendet.
// Modus "anfrage": guardForm (Rate-Limit, Größe, Honeypot, Zeitfalle, zod-
// Allowlist) → Text-Payload an das bestehende Kontakt-Backoffice (gleiches
// Format wie /api/kontakt) mit 10 s Timeout. Antworten an den Browser tragen
// nur eigene Codes (Formular-Vertrag aus src/lib/forms/client.js).
// Keine Zahlung, kein Vertragsschluss, kein Stripe.
// Keine "@/..."-Importe: direkt mit `node --test` getestet (fetch immer gemockt).
import { guardForm, errorResponse } from "../forms/guard.js";
import { forwardJson, outerHeadersOf } from "../forms/forward.js";
import { atelierMode, voucherMode } from "./mode.js";
import { MAX_BYTES as VOUCHER_MAX_BYTES, voucherSchema, voucherToBackoffice } from "./voucher.js";
import { MAX_BYTES as RESERVATION_MAX_BYTES, reservationSchema, reservationToBackoffice } from "./reservation.js";
import { findAtelierItem } from "./atelierSource.js";

// Dasselbe Backoffice wie /api/kontakt (src/app/api/kontakt/route.js):
// Gutschein- und Reservierungsanfragen landen als Kontaktanfrage mit Text.
export const BACKOFFICE_URL =
  "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";

export const notFoundResponse = () => Response.json({ success: false, code: "not_found", error: "Not found" }, { status: 404 });

/** GET/PUT/… : im Modus off 404, sonst 405. */
export function methodHandler(modeOf) {
  return async function handler() {
    if (modeOf() === "off") return notFoundResponse();
    return Response.json({ success: false, code: "invalid", error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
  };
}

/**
 * commerceHandler(config) → async POST(request)
 * config: { route, modeOf, schema, maxBytes, toPayload(data) → payload |
 *   { error: Response }, successMessage, url?, fetchImpl?, limiter?, now?,
 *   resolveHeaders? }
 */
export function commerceHandler(config) {
  const { route, modeOf, schema, maxBytes, toPayload, successMessage } = config;
  const fakeSuccess = () => ({ success: true, message: successMessage, data: {} });

  return async function POST(request) {
    if (modeOf() === "off") return notFoundResponse();
    try {
      const guard = await guardForm(request, schema, {
        route,
        maxBytes,
        fakeSuccess,
        outerHeaders: await outerHeadersOf(config.resolveHeaders),
        limiter: config.limiter,
        now: config.now ? config.now() : Date.now(),
      });
      if (!guard.ok) return guard.response;

      const { lead_ref: leadRef, ...fields } = guard.data;
      const prepared = await toPayload(fields);
      if (prepared?.error) return prepared.error;

      const result = await forwardJson(config.url || BACKOFFICE_URL, prepared, { fetchImpl: config.fetchImpl || fetch });
      if (result.kind === "ok") return Response.json({ success: true, message: successMessage });
      console.error(`[commerce] ${route}: backoffice ${result.kind}`, result.status || "", leadRef ? `lead_ref=${leadRef}` : "");
      if (result.kind === "timeout") return errorResponse("timeout", 504, { message: "Failed to submit" });
      return errorResponse("upstream", 502, { message: "Failed to submit" });
    } catch (error) {
      console.error(`[commerce] ${route}: internal error`, error?.message || error);
      return errorResponse("internal", 500, { message: "Internal Server Error" });
    }
  };
}

/**
 * Handler für /api/gutschein_anfrage. Optionen: env, termsStatus (Standard
 * aus voucherTerms.js; Entwurf = 404), fetchImpl, limiter, now, resolveHeaders.
 */
export function voucherHandler({ env = process.env, termsStatus, ...options } = {}) {
  return commerceHandler({
    route: "gutschein_anfrage",
    modeOf: () => (termsStatus === undefined ? voucherMode(env) : voucherMode(env, termsStatus)),
    schema: voucherSchema,
    maxBytes: VOUCHER_MAX_BYTES,
    toPayload: (data) => voucherToBackoffice(data),
    successMessage: "Voucher inquiry received",
    ...options,
  });
}

/**
 * Handler für /api/atelier_reservierung. Das Stück muss im Sheet sichtbar
 * sein (Status "verfuegbar"); Titel und Preis kommen von dort.
 * Optionen: env, fetchImpl (Backoffice), sourceFetch (Sheet), limiter, now, resolveHeaders.
 */
export function reservationHandler({ env = process.env, sourceFetch, ...options } = {}) {
  return commerceHandler({
    route: "atelier_reservierung",
    modeOf: () => atelierMode(env),
    schema: reservationSchema,
    maxBytes: RESERVATION_MAX_BYTES,
    toPayload: async (data) => {
      const item = await findAtelierItem(data.stueck, { env, ...(sourceFetch ? { fetchImpl: sourceFetch } : {}) });
      if (!item) {
        return {
          error: errorResponse("invalid", 400, { message: "Dieses Stück ist nicht mehr verfügbar.", extra: { field: "stueck" } }),
        };
      }
      return reservationToBackoffice(data, item);
    },
    successMessage: "Reservation inquiry received",
    ...options,
  });
}
