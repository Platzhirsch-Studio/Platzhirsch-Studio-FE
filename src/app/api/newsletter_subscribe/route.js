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
import { newsletterHandler } from "@/lib/forms/newsletter";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";

const METHOD = "platzhirsch_studio.platzhirsch_studio.doctype.newsletter_website.api.subscribe_newsletter";

const base = formsBackendBaseUrl();
const handler = base ? newsletterHandler({ url: `${base}${METHOD}`, resolveHeaders: originalRequestHeaders }) : null;

export async function POST(request) {
  if (!handler) return backofficeNotConfigured("newsletter_subscribe");
  return handler(request);
}
