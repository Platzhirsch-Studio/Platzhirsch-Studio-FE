// POST /api/shop/widerruf — Online-Rücktrittsfunktion für Shop-Bestellungen
// (§ 13a FAGG). Seite: /[locale]/shop/recht/widerruf-formular.
// SHOP_MODE off → 404. Logik: src/lib/shop/widerruf.js.
import { shopRoutes } from "@/lib/shop/server";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

export const dynamic = "force-dynamic";

export const POST = (request) => shopRoutes.widerruf({ resolveHeaders: originalRequestHeaders })(request);
