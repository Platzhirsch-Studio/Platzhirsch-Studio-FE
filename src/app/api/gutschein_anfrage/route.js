// src/app/api/gutschein_anfrage/route.js
// Gutschein-ANFRAGE (Paket R5-commerce, Masterplan AP9 Nr. 1).
// VOUCHER_MODE=off (Standard): 404 für jede Methode. VOUCHER_MODE=anfrage:
// guardForm + voucherSchema, Text an das Kontakt-Backoffice. Kein Geld, kein
// Vertragsschluss. Logik und Tests: src/lib/commerce/handlers.js.
import { methodHandler, voucherHandler } from "@/lib/commerce/handlers";
import { voucherMode } from "@/lib/commerce/mode";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
// Herkunftsprüfung (Origin/Referer gegen den Site-Host) vor allem anderen.
import { withOriginCheck } from "@/lib/forms/origin";

// Der Schalter wird bei jeder Anfrage gelesen, nie beim Build festgeschrieben.
export const dynamic = "force-dynamic";

export const POST = withOriginCheck(voucherHandler({ resolveHeaders: originalRequestHeaders }), { resolveHeaders: originalRequestHeaders });
export const GET = methodHandler(() => voucherMode());
