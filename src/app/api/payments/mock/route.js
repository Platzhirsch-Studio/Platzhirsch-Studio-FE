// POST /api/payments/mock — simulierter Checkout (Erfolg, ausstehende
// Lastschrift, Fehlschlag, Abbruch, Erstattung). Signiert das Ereignis mit
// dem Mock-Geheimnis und schickt es durch denselben Webhook-Pfad.
// In Produktion (NODE_ENV/VERCEL_ENV production) immer 404.
import { routes } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

export const POST = (request) => routes.mock()(request);
