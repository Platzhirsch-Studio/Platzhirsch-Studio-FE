// src/app/api/kontakt/route.js
// Kontaktformular (components/Kontakt/kontakt.js) and Adventsabend-Anmeldung
// (app/[locale]/adventsabend/AdventsabendForm.js); also called internally by
// /api/upload/inquiry/kontakt. Checks: src/lib/forms/guard.js (size, rate
// limit, honeypot, time trap) + kontaktSchema (allowlist). Same backoffice
// URL, headers and success answer as before; 10 s timeout.
import { forwardInquiry } from "@/lib/backend/forms";
import { inquiryHandler } from "@/lib/forms/forward";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { MAX_BYTES, kontaktSchema } from "@/lib/forms/schemas";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";

export const POST = inquiryHandler({
  route: "kontakt",
  url: API_URL,
  schema: kontaktSchema,
  maxBytes: MAX_BYTES.kontakt,
  successMessage: "Contact form submitted successfully",
  failMessage: "Failed to submit contact form",
  resolveHeaders: originalRequestHeaders,
  // BACKEND_GENERATION (src/lib/backend/config.js): alt = API_URL wie bisher, ph = ph_crm.api.
  forward: (fields, o) => forwardInquiry("kontakt", fields, { altUrl: API_URL, ...o }),
});
