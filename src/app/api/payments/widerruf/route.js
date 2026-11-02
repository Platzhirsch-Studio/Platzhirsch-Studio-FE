// POST /api/payments/widerruf — Widerrufsfunktion nach § 13a FAGG.
// Aktiv, solange Online-Käufe möglich sind oder eine bezahlte Bestellung
// jünger als 30 Tage existiert. Logik: src/lib/payments/withdrawal.js.
import { routes } from "@/lib/payments/server";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.withdrawal({ resolveHeaders: originalRequestHeaders })(request);
