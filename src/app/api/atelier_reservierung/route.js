// src/app/api/atelier_reservierung/route.js
// Reservierungs-ANFRAGE Atelierverkauf (Paket R5-commerce, Masterplan AP9 Nr. 2).
// ATELIER_MODE=off (Standard): 404 für jede Methode. ATELIER_MODE=anfrage:
// guardForm + reservationSchema, Stück muss im Sheet verfügbar sein, Text an
// das Kontakt-Backoffice. Keine Zahlung, keine Anzahlung, kein Vertrag.
// Logik und Tests: src/lib/commerce/handlers.js.
import { methodHandler, reservationHandler } from "@/lib/commerce/handlers";
import { atelierMode } from "@/lib/commerce/mode";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
// Herkunftsprüfung (Origin/Referer gegen den Site-Host) vor allem anderen.
import { withOriginCheck } from "@/lib/forms/origin";

export const dynamic = "force-dynamic";

export const POST = withOriginCheck(reservationHandler({ resolveHeaders: originalRequestHeaders }), { resolveHeaders: originalRequestHeaders });
export const GET = methodHandler(() => atelierMode());
