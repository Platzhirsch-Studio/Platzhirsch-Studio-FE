// src/app/api/beratung_anfrage/route.js
// Beratungsanfrage (components/BeratungClient/BeratungClient.js) and
// Küchenplaner "Planung anfragen" (components/Labs/Kuechenplaner/ResultPanel.js);
// also called internally by /api/upload/inquiry/beratung. Checks:
// src/lib/forms/guard.js + beratungSchema (allowlist). Same backoffice URL,
// headers and success answer as before; 10 s timeout.
import { inquiryHandler } from "@/lib/forms/forward";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { MAX_BYTES, beratungSchema } from "@/lib/forms/schemas";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage.api.create_anfrage";

export const POST = inquiryHandler({
  route: "beratung_anfrage",
  url: API_URL,
  schema: beratungSchema,
  maxBytes: MAX_BYTES.beratung_anfrage,
  successMessage: "Form submitted successfully",
  failMessage: "Failed to submit form",
  resolveHeaders: originalRequestHeaders,
});
