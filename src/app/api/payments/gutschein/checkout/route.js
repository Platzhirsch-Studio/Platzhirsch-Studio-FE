// POST /api/payments/gutschein/checkout — Gutscheinkauf über Stripe Checkout.
// Nur mit VOUCHER_MODE=stripe (wirksam: Bedingungen + Widerrufsbelehrung
// freigegeben, Stripe-Schlüssel gesetzt), sonst 404. Logik: src/lib/payments/handlers.js.
import { routes } from "@/lib/payments/server";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.voucherCheckout({ resolveHeaders: originalRequestHeaders })(request);
