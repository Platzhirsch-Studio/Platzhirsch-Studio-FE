// POST /api/payments/register — Gutscheinregister für das Team (Showroom).
// Authorization: Bearer <PAYMENTS_ADMIN_SECRET>; ohne Geheimnis 404.
//   { aktion: "pruefen" | "einloesen" | "sperren" | "ersetzen", code, betrag?, beleg?, grund? }
// Bleibt aktiv, auch wenn der Verkauf ausgeschaltet wird (Einlösung läuft weiter).
import { routes } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.register()(request);
