// src/lib/forms/forward.js
// Forwarding to the backoffice (Frappe) with a 10 s timeout, and the shared
// POST handler of the three inquiry routes (Kontakt, Beratung, Produkt).
//
// Contract towards the existing callers (unchanged):
//   success  → status 200, { success: true, message: data.message || <default>, data }
//              (`data` = Frappe answer; UploadHandoff/upload-inquiry read
//              data.message.name from it)
//   failure  → !ok and { success: false, code, error } — `error` is our own
//              generic text, Frappe details stay in the server log only.
//
// No "@/..." imports: tested directly with `node --test`.
import { guardForm, errorResponse } from "./guard.js";
import { forbiddenResponse, originCheck } from "./origin.js";

export const FORWARD_TIMEOUT_MS = 10000;

/**
 * POST payload as JSON. Never throws. Returns one of
 * { kind: "ok", status, data } | { kind: "http", status, detail } |
 * { kind: "non_json", status } | { kind: "timeout" } | { kind: "network", detail }
 */
export async function forwardJson(url, payload, { fetchImpl = fetch, headers, timeoutMs = FORWARD_TIMEOUT_MS } = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: headers || { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") return { kind: "timeout" };
    return { kind: "network", detail: String(error?.message || error) };
  }
  let text = "";
  try {
    text = await response.text();
  } catch {
    /* empty body */
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return response.ok ? { kind: "non_json", status: response.status } : { kind: "http", status: response.status, detail: text.slice(0, 500) };
  }
  if (!response.ok) return { kind: "http", status: response.status, detail: data };
  return { kind: "ok", status: response.status, data };
}

/**
 * inquiryHandler(config) → async POST(request)
 * config: { route, url, schema, maxBytes, successMessage, failMessage,
 *           resolveHeaders?, fetchImpl?, limiter?, now?, env?, forward? }
 * forward(fields, { fetchImpl, idempotencyKey, env }) → Ergebnis wie forwardJson
 * (plus kind "not_configured" → 503); gesetzt von den Routen über
 * src/lib/backend/forms.js (BACKEND_GENERATION alt|ph).
 * First check: Origin/Referer against the site host (origin.js) → 403 forbidden.
 * resolveHeaders: async () => Headers of the original request (route files
 * pass originalRequestHeaders from requestHeaders.js), so the rate limit also
 * sees the visitor IP when /api/upload/inquiry/[kind] calls this handler.
 */
export async function outerHeadersOf(resolveHeaders) {
  if (typeof resolveHeaders !== "function") return null;
  try {
    return (await resolveHeaders()) || null;
  } catch {
    return null;
  }
}

export function inquiryHandler(config) {
  const { route, url, schema, maxBytes, successMessage, failMessage } = config;
  const fakeSuccess = () => ({ success: true, message: successMessage, data: {} });

  return async function POST(request) {
    try {
      const outerHeaders = await outerHeadersOf(config.resolveHeaders);
      // Herkunftsprüfung (origin.js): cross-site posts never reach the backoffice.
      const origin = originCheck(request, outerHeaders, config.env);
      if (!origin.ok) {
        console.warn(`[forms] ${route}: ${origin.reason} -> 403`);
        return forbiddenResponse();
      }
      const guard = await guardForm(request, schema, {
        route,
        maxBytes,
        fakeSuccess,
        outerHeaders,
        limiter: config.limiter,
        now: config.now ? config.now() : Date.now(),
      });
      if (!guard.ok) return guard.response;

      // lead_ref stays on our side (it is in the Herkunft text block): the
      // backoffice gets exactly the fields it knew before (R4-leads).
      const { lead_ref: leadRef, ...fields } = guard.data;
      // config.forward (optional): Weiterleiter der Backend-Umschaltung
      // (src/lib/backend/forms.js forwardInquiry). Ohne ihn: wie bisher.
      const fetchImpl = config.fetchImpl || fetch;
      const result = config.forward
        ? await config.forward(fields, { fetchImpl, idempotencyKey: leadRef || null, env: config.env })
        : await forwardJson(url, fields, { fetchImpl });
      if (result.kind === "not_configured") {
        console.error(`[forms] ${route}: ph-Backend gewählt, aber BACKEND_PH_URL/BACKEND_PH_TOKEN fehlen – nichts gesendet`);
        return errorResponse("not_configured", 503, { message: failMessage });
      }
      if (result.kind === "ok") {
        return Response.json({ success: true, message: result.data?.message || successMessage, data: result.data });
      }
      // Details for us, not for the browser.
      console.error(`[forms] ${route}: backoffice ${result.kind}`, result.status || "", result.detail ?? "", leadRef ? `lead_ref=${leadRef}` : "");
      if (result.kind === "timeout") return errorResponse("timeout", 504, { message: failMessage });
      return errorResponse("upstream", 502, { message: failMessage });
    } catch (error) {
      console.error(`[forms] ${route}: internal error`, error);
      return errorResponse("internal", 500, { message: "Internal Server Error" });
    }
  };
}
