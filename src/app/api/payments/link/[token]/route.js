// POST /api/payments/link/<token> — startet für eine Anzahlung eine Checkout-
// Session (Betrag aus der Ablage, nie aus dem Browser) und antwortet mit der URL.
// GET hat absichtlich keine Wirkung (Link-Vorschauen in Mailprogrammen).
import { routes } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

export const POST = (request, context) => routes.depositPay()(request, context);
