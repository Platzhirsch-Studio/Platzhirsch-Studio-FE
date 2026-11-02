// /api/payments/anzahlung — Anzahlungs-Links für Mitarbeitende.
// Authorization: Bearer <PAYMENTS_ADMIN_SECRET>. Nur mit ANZAHLUNG_MODE=stripe, sonst 404.
//   POST { auftrag, betrag, beschreibung?, email?, kunde?, gueltig_tage?, senden? } → { link, anzahlung }
//   GET  ?id= | ?auftrag= | ?kunde=  → Status
// Doku: Marktresearch/digital/features/stripe-zahlung.md. Logik: src/lib/payments/handlers.js.
import { routes } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.depositAdmin().POST(request);
export const GET = (request) => routes.depositAdmin().GET(request);
