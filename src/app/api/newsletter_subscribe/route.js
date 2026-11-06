// src/app/api/newsletter_subscribe/route.js
// Server-side proxy for the newsletter form (src/components/Newsletter/
// newsletter.js). The browser only ever talks to /api/newsletter_subscribe;
// the backend address stays on the server.
// Logic, answer codes and checks: src/lib/forms/newsletter.js + guard.js.
//
// R5 (r5-technik P1-1): a WRITING endpoint – it never falls back to the
// documented read default (production backoffice). Only an explicitly set
// SERVER receives sign-ups; without it the route answers 503
// "not_configured" and sends nothing (src/lib/apiBaseUrl.js
// formsBackendBaseUrl / backofficeNotConfigured).
import { backofficeNotConfigured, formsBackendBaseUrl } from "@/lib/apiBaseUrl";
import { phClientHeaders } from "@/lib/backend/config";
import { newsletterPhTarget } from "@/lib/backend/forms";
import { pickAttribution } from "@/lib/forms/attributionFields";
import { newsletterHandler } from "@/lib/forms/newsletter";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

const METHOD = "platzhirsch_studio.platzhirsch_studio.doctype.newsletter_website.api.subscribe_newsletter";

const base = formsBackendBaseUrl();
const handler = base ? newsletterHandler({ url: `${base}${METHOD}`, resolveHeaders: originalRequestHeaders }) : null;

// BACKEND_GENERATION (src/lib/backend/config.js): Gruppe "newsletter" auf ph →
// ph_marketing.api.subscribe_newsletter mit Token (DOI-Mail schickt das Backend).
// Ohne BACKEND_PH_URL/TOKEN: 503 not_configured, nichts geht an das alte System.
const ph = newsletterPhTarget();
const phHandler = ph.url ? newsletterHandler({ url: ph.url, headers: async () => ({ ...ph.headers, ...(await phClientHeaders()) }), resolveHeaders: originalRequestHeaders, extraFields: (data) => pickAttribution(data) }) : null;

export async function POST(request) {
  if (ph.generation === "ph") return phHandler ? phHandler(request) : backofficeNotConfigured("newsletter_subscribe");
  if (!handler) return backofficeNotConfigured("newsletter_subscribe");
  return handler(request);
}
