// POST /api/stripe/webhook — Stripe-Ereignisse.
// Rohtext über request.text() (Next 16 route.md "Webhooks": kein bodyParser
// nötig), Signaturprüfung mit STRIPE_WEBHOOK_SECRET, Idempotenz über die
// Event-Id. Ohne Schlüssel (und ohne PAYMENTS_MOCK=1 außerhalb der
// Produktion) 404. Logik: src/lib/payments/webhook.js.
import { routes } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.webhook()(request);
