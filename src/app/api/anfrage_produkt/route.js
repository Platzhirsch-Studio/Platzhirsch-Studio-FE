// src/app/api/anfrage_produkt/route.js
// Produktanfrage aus der Merkliste (components/AnfrageFormProduct/AnfrageFormProduct.js);
// also called internally by /api/upload/inquiry/produkt. Checks:
// src/lib/forms/guard.js + produktSchema (allowlist). Same backoffice URL,
// headers and success answer as before; 10 s timeout.
import { forwardInquiry } from "@/lib/backend/forms";
import { inquiryHandler } from "@/lib/forms/forward";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { MAX_BYTES, produktSchema } from "@/lib/forms/schemas";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage_produkt.api.create_anfrage";

export const POST = inquiryHandler({
  route: "anfrage_produkt",
  url: API_URL,
  schema: produktSchema,
  maxBytes: MAX_BYTES.anfrage_produkt,
  successMessage: "Inquiry submitted successfully",
  failMessage: "Failed to submit inquiry",
  resolveHeaders: originalRequestHeaders,
  // BACKEND_GENERATION (src/lib/backend/config.js): alt = API_URL wie bisher, ph = ph_crm.api.
  forward: (fields, o) => forwardInquiry("produkt", fields, { altUrl: API_URL, ...o }),
});
