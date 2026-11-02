// src/lib/commerce/client.js
// Browser-Seite der beiden Commerce-Anfragen (Gutschein, Atelier-Reservierung).
// Formular-Vertrag wie bei den übrigen Anfragen (src/lib/forms/client.js):
// `website` (Honeypot) und `_t` (ms seit dem Anzeigen) kommen über
// useFormGuard dazu; Erfolg = response.ok && success === true.
// Der Herkunftsblock und lead_ref kommen AUSSCHLIESSLICH aus src/lib/forms
// (leadPayload.js, attribution.js): gleiche Einwilligungsgrenze wie bei
// Kontakt und Beratung, keine eigene Logik.
// Vorschau (`demo: true`): nichts wird gesendet.
// Keine "@/..."-Importe.
import { getAttribution, rememberLeadRef } from "../attribution.js";
import { appendHerkunft, deviceOf, herkunftBlock, newLeadRef } from "../forms/leadPayload.js";
import { readFormResponse } from "../forms/client.js";

export const ERROR_TEXT = Object.freeze({
  invalid: "Bitte prüfen Sie Ihre Angaben.",
  too_large: "Die Anfrage ist zu lang. Bitte kürzen Sie Grußtext, Anmerkung oder Nachricht.",
  rate_limited: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.",
  not_found: "Diese Anfrage ist derzeit nicht möglich. Bitte rufen Sie uns an oder schreiben Sie uns.",
  network: "Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
  fallback: "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns an info@platzhirsch.studio.",
});

export const errorTextOf = (code) => ERROR_TEXT[code] || ERROR_TEXT.fallback;

/**
 * Payload + Herkunftsblock im Freitextfeld `field` + lead_ref.
 * `lead` = { attribution, locale, device, leadRef } (Tests); im Browser automatisch.
 */
export function withOrigin(payload, field, lead) {
  const browser = typeof window !== "undefined";
  const opts = lead || {};
  const leadRef = opts.leadRef || newLeadRef();
  const block = herkunftBlock(opts.attribution ?? (browser ? getAttribution(window) : undefined), {
    leadRef,
    locale: opts.locale ?? (browser ? document.documentElement.lang || "de" : "de"),
    device: opts.device ?? (browser ? deviceOf(window.innerWidth) : ""),
  });
  return { ...payload, [field]: appendHerkunft(payload[field] || "", block), lead_ref: leadRef };
}

/**
 * Sendet eine Commerce-Anfrage. Wirft nie.
 * @returns {Promise<{ ok: boolean, code?: string, field?: string, message?: string, leadRef?: string, demo?: boolean }>}
 */
export async function sendCommerce(url, payload, { field, demo = false, fetchImpl, lead } = {}) {
  if (demo) return { ok: true, demo: true };
  const body = field ? withOrigin(payload, field, lead) : payload;
  const leadRef = body.lead_ref;
  rememberLeadRef(null);
  let response;
  try {
    response = await (fetchImpl || fetch)(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: "network", leadRef };
  }
  if (response.status === 404) return { ok: false, code: "not_found", leadRef };
  const result = await readFormResponse(response);
  if (result.ok) {
    if (leadRef) rememberLeadRef(leadRef);
    return { ok: true, leadRef };
  }
  const message = typeof result.data?.error === "string" && result.code === "invalid" && result.field ? result.data.error : undefined;
  return { ok: false, code: result.code, field: result.field, message, leadRef };
}
