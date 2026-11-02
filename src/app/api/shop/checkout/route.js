// POST /api/shop/checkout — Bestellung anlegen: Stripe Checkout (Test:
// Testschlüssel oder Mock) bzw. Reservierung mit Zahlung vor Ort.
// SHOP_MODE off → 404. Logik: src/lib/shop/handlers.js.
import { shopRoutes } from "@/lib/shop/server";

export const dynamic = "force-dynamic";

export const POST = (request) => shopRoutes.checkout()(request);
