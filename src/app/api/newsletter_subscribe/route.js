// src/app/api/newsletter_subscribe/route.js
// Server-side proxy for the newsletter form (src/components/Newsletter/
// newsletter.js). The browser only ever talks to /api/newsletter_subscribe;
// the backend address stays on the server. Sends to the new Frappe instance
// (NEW_API_SERVER → NEW_API_BASE_URL), like the product endpoints: the local
// dev IP from .env.local while testing, the production backend from
// .env.production.
//
// Responses are deliberately minimal — { success } or { success:false, code } —
// so no backend details (Frappe error text, tracebacks) reach the browser.
// The form maps `code` to a translated message:
//   invalid_email | already_subscribed | failed
import { NextResponse } from "next/server";
import { NEW_API_BASE_URL } from "@/lib/apiBaseUrl";

const API_URL = `${NEW_API_BASE_URL}platzhirsch_studio.platzhirsch_studio.doctype.newsletter_website.api.subscribe_newsletter`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (code, status) => NextResponse.json({ success: false, code }, { status });

// Frappe puts user-facing errors in `_server_messages` (a JSON string of
// JSON strings). Returns the joined message text, or "".
function frappeMessage(data) {
  try {
    return JSON.parse(data._server_messages || "[]")
      .map((m) => {
        try {
          return JSON.parse(m).message || "";
        } catch {
          return String(m);
        }
      })
      .join(" ");
  } catch {
    return "";
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_email", 400);
  }

  // Honeypot: a field hidden from people. Bots that fill it get a normal-looking
  // success, and nothing is sent to the backend.
  if (body?.website) return NextResponse.json({ success: true });

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return fail("invalid_email", 400);

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Newsletter: backend not reachable:", error);
    return fail("failed", 502);
  }

  // The backend may answer with an HTML error page (e.g. a proxy 502), so
  // don't assume JSON.
  let data = {};
  try {
    data = await response.json();
  } catch {
    console.error(`Newsletter: backend returned non-JSON (status ${response.status})`);
    return fail("failed", 502);
  }

  if (data.exc || !response.ok) {
    const message = frappeMessage(data);
    if (/bereits angemeldet|already subscribed/i.test(message)) return fail("already_subscribed", 409);
    // Full details stay in the server log only.
    console.error("Newsletter: backend error", response.status, message || data.exc_type || "");
    return fail("failed", 502);
  }

  return NextResponse.json({ success: true });
}
