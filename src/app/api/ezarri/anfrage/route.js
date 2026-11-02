// src/app/api/ezarri/anfrage/route.js – POST /api/ezarri/anfrage
// Ezarri-Anfrage „Muster, Beratung, Angebot“ (Formular: src/components/Ezarri/Anfrage/AnfrageForm.js).
// Logik: ./handler.js · Schema: ./schema.js · Versandweg und Schalter: ./versand.js
// Heute (Schalter EZARRI_ANFRAGE_BACKOFFICE = false): nichts geht ans Backoffice,
// jede Anfrage landet in .data/ezarri/outbox/ (Dry-Run); in Produktion 503 „unavailable“.
// Doku: Marktresearch/digital/features/ezarri-rechner.md
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { getGroutList, getMixItems, getReferenceChips } from "@/lib/ezarri/rechner/palette.server";
import { createAnfrageHandler } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createAnfrageHandler({
  resolveRefs: (ids) => getReferenceChips(ids),
  resolveMix: (ids) => getMixItems(ids),
  resolveFuge: (id) => getGroutList().find((g) => g.id === id)?.name,
  resolveHeaders: originalRequestHeaders,
});
