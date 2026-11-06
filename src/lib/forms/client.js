// src/lib/forms/client.js
// Browser side of the form contract (R1-formulare, Marktresearch/digital/
// teamleiter/r1-R1-formulare.md → "Formular-Vertrag für Clients"):
//   - every form sends `website` (honeypot, empty for people) and `_t`
//     (ms SINCE the form was rendered: independent of the device clock);
//   - success = response.ok && json.success === true;
//   - on failure the form shows the translated `code`, never `error`
//     (English, our own generic text); `field` names the first bad field (400).
// Used by Kontakt, Beratung, Produktanfrage and Adventsabend.
// No "@/..." imports: tested directly with `node --test`.
//
// R4-leads: postForm() adds the Herkunft block and `lead_ref` for the three
// inquiry routes (leadPayload.js) and returns `leadRef`, which the forms
// pass to trackLead() as `transaction_id`.
import { getAttribution, rememberLeadRef } from "../attribution.js";
import { deviceOf, leadKindOf, newLeadRef, withLead } from "./leadPayload.js";
import { attributionFields } from "./attributionFields.js";
import { selfReportLabel } from "./selfReport.js";

/** ms since `renderedAt` (a performance.now() value), rounded; undefined if unknown. */
export function elapsedSince(renderedAt, now) {
  if (typeof renderedAt !== "number" || !Number.isFinite(renderedAt)) return undefined;
  const current = typeof now === "number" ? now : typeof performance !== "undefined" ? performance.now() : NaN;
  const ms = Math.round(current - renderedAt);
  // 0 or negative would be ignored by the server anyway; send nothing then.
  return Number.isFinite(ms) && ms > 0 ? ms : undefined;
}

/**
 * Adds the two contract fields to a payload. `website` is the honeypot value
 * as typed (people leave it empty), `_t` the duration since render.
 * The payload's own fields stay as they are (no renaming, no trimming).
 */
export function withGuardFields(payload, { website = "", renderedAt, now } = {}) {
  const t = elapsedSince(renderedAt, now);
  return { ...payload, website: typeof website === "string" ? website : "", ...(t !== undefined ? { _t: t } : {}) };
}

/** Code for a failed answer without a usable `code` in the body. */
export function codeFromStatus(status) {
  if (status === 413) return "too_large";
  if (status === 429) return "rate_limited";
  if (status === 409) return "already_subscribed";
  if (status === 504) return "timeout";
  if (status >= 400 && status < 500) return "invalid";
  return "upstream";
}

const KNOWN_CODES = new Set([
  "invalid",
  "invalid_email",
  "too_large",
  "rate_limited",
  "already_subscribed",
  "upstream",
  "failed",
  "timeout",
  "internal",
]);

/**
 * Reads a form route answer. Never throws.
 * @returns {Promise<{ ok: true, data: object } | { ok: false, code: string, field?: string, status: number, data: object }>}
 */
export async function readFormResponse(response) {
  let data = {};
  try {
    data = (await response.json()) || {};
  } catch {
    data = {};
  }
  if (response.ok && data && data.success === true) return { ok: true, data };
  const code = typeof data?.code === "string" && KNOWN_CODES.has(data.code) ? data.code : codeFromStatus(response.status);
  const field = typeof data?.field === "string" && data.field ? data.field : undefined;
  return { ok: false, code, field, status: response.status, data };
}

/**
 * Lead fields for `url` (Herkunft block + lead_ref), or the payload as is.
 * `lead`: undefined = automatic in the browser, false = off, or an object
 * { attribution, locale, device, leadRef, selfReport } (tests, special callers).
 * `selfReport` (R5-leads-perf): a code of selfReport.js (or its German label);
 * anything else is dropped. The other fields are still filled automatically.
 * `pageContext` (Runde 5): "Stadtseite: Bregenz" → own "Kontext:" line.
 * @returns {{ body: object, leadRef?: string }}
 */
export function prepareLead(url, payload, lead) {
  const kind = leadKindOf(url);
  const browser = typeof window !== "undefined";
  if (!kind || lead === false || (!lead && !browser)) return { body: payload, leadRef: undefined };
  const opts = lead && typeof lead === "object" ? lead : {};
  const body = withLead(payload, kind, {
    attribution: opts.attribution ?? (browser ? getAttribution(window) : undefined),
    leadRef: opts.leadRef || newLeadRef(),
    locale: opts.locale ?? (browser ? document.documentElement.lang || "" : ""),
    device: opts.device ?? (browser ? deviceOf(window.innerWidth) : ""),
    selfReport: selfReportLabel(opts.selfReport),
    pageContext: opts.pageContext,
  });
  return { body, leadRef: body.lead_ref };
}

/**
 * Formulare OHNE Herkunftsblock, deren Backend (ph_*) Kampagnenfelder liest:
 * utm_* / klick_id als eigene Felder – nur mit Ads-Einwilligung
 * (attributionFields.js, getAttribution). Anfrageformulare tragen sie schon
 * im Herkunftsblock (der Server liest sie dort aus).
 */
export const ATTRIBUTION_URLS = Object.freeze(["/api/kundenkarte/apply", "/api/newsletter_subscribe", "/api/termin/book"]);

/** body + utm_* und klick_id für ATTRIBUTION_URLS (attribution: Tests; im Browser automatisch). */
export function withAttributionFields(url, body, attribution) {
  const path = String(url || "").split("?")[0];
  if (!ATTRIBUTION_URLS.includes(path) || !body || typeof body !== "object") return body;
  const attr = attribution ?? (typeof window !== "undefined" ? getAttribution(window) : null);
  const fields = attributionFields(attr);
  return Object.keys(fields).length ? { ...body, ...fields } : body;
}

/**
 * POST JSON to a form route, then readFormResponse(). A network failure
 * (offline, aborted) comes back as { ok: false, code: "network" }.
 * Inquiry routes get the Herkunft block and `lead_ref` (prepareLead); the
 * result then carries `leadRef` for trackLead's transaction_id.
 */
export async function postForm(url, payload, { fetchImpl, lead } = {}) {
  const doFetch = fetchImpl || fetch;
  const prepared = prepareLead(url, payload, lead);
  const body = withAttributionFields(url, prepared.body);
  const { leadRef } = prepared;
  // The reference is remembered only for a lead that actually arrived (QM r4
  // P3-1): a failed send clears it, so a later lead (e.g. the Küchenplaner)
  // never inherits its transaction_id through trackLead's fallback.
  if (leadRef) rememberLeadRef(null);
  let response;
  try {
    response = await doFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: "network", status: 0, data: {}, ...(leadRef ? { leadRef } : {}) };
  }
  const result = await readFormResponse(response);
  if (leadRef && result.ok) rememberLeadRef(leadRef);
  return leadRef ? { ...result, leadRef } : result;
}

// Shared client-side checks, same rules as the route schemas (schemas.js).
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[0-9+\-()\s]{6,20}$/;

export const isEmail = (v) => EMAIL_PATTERN.test(String(v ?? "").trim());
export const isPhone = (v) => PHONE_PATTERN.test(String(v ?? "").trim());

/** First key of `order` that has an error in `errors`, or undefined. */
export function firstError(errors, order) {
  return order.find((key) => errors && errors[key]);
}
