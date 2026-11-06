// src/app/api/adventsabend/anmelden/route.js – Adventsabend-Anmeldung im ph-Modus
// (Gruppe „formulare“ auf ph + ADVENTSABEND_EVENT_ID): ph_marketing.api.register_event.
// Ohne ph-Ziel 503 not_configured – das Formular sendet dann ohnehin an /api/kontakt
// (src/lib/backend/adventsabend.js adventSubmitUrl). Prüfungen wie die Anfrageformulare.
import { adventHandler } from "@/lib/backend/adventsabend";
import { errorResponse, guardForm } from "@/lib/forms/guard";
import { forbiddenResponse, originCheck } from "@/lib/forms/origin";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { MAX_BYTES, adventSchema } from "@/lib/forms/schemas";

export const POST = adventHandler({
  schema: adventSchema,
  maxBytes: MAX_BYTES.adventsabend,
  guardForm,
  originCheck,
  forbiddenResponse,
  errorResponse,
  resolveHeaders: originalRequestHeaders,
});
