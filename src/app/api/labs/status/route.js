// GET /api/labs/status – Verfügbarkeit der Werkzeuge mit Server-Abhängigkeit
// (Fix-Runde 1, F2). Der seitenweite Concierge-Knopf fragt das im Produktions-
// Build einmal je Sitzung ab und bleibt ohne API-Schlüssel ausgeblendet.
// Keine personenbezogenen Daten, keine Parameter.
// Runde 5 (ux P1-2, technik P1-6): gleiches Kriterium wie Footer, Hub und
// CTA-Leiste – conciergeLive() (Schlüssel gesetzt, kein Mock, kein Not-Aus).
// Der Mock ist ein Testmodus und schaltet den Knopf für Kunden nicht frei.
import { conciergeLive } from "@/lib/concierge/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ concierge: conciergeLive() }, { headers: { "Cache-Control": "no-store" } });
}
