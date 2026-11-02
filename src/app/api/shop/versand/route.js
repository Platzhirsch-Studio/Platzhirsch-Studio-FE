// POST /api/shop/versand — Warenkorb bepreisen + Versandtarif (LetMeShip, im
// Test Mock). SHOP_MODE off → 404. Logik: src/lib/shop/handlers.js.
import { shopRoutes } from "@/lib/shop/server";

export const dynamic = "force-dynamic";

export const POST = (request) => shopRoutes.versand()(request);
