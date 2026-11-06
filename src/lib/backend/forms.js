// src/lib/backend/forms.js – schreibende Formular-Gruppen „formulare“ (ph_crm)
// und „newsletter“ (ph_marketing).
//
// Ein Weiterleiter je Formularart, der dieselbe Ergebnisform liefert wie
// forwardJson() (src/lib/forms/forward.js):
//   { kind: "ok", status, data } | { kind: "http", status, detail } |
//   { kind: "non_json" } | { kind: "timeout" } | { kind: "network" } |
//   { kind: "not_configured" }   (nur ph: BACKEND_PH_URL/TOKEN fehlen → nichts gesendet)
//
// alt: exakt der heutige Aufruf forwardJson(altUrl, payload, { fetchImpl }).
// ph : POST {BACKEND_PH_URL}/api/method/ph_crm.api.create_anfrage|create_contact
//      mit Token des Users website@platzhirsch.studio. ph_crm nimmt die drei
//      heutigen Payloads unverändert an (Art-Erkennung über die Felder bzw. die
//      Kontext-Zeile, Backend-Import/ph_crm/ph_crm/api/__init__.py create_anfrage);
//      zusätzlich `art` für Formulare ohne Kontext-Zeile (Gutschein, Atelier,
//      Ezarri) und `idempotency_key` (lead_ref der Website, ph_api idempotent).
//      Antwort { referenz, status } → data.message.name = referenz, damit
//      UploadHandoff / upload-inquiry (lesen data.message.name) unverändert laufen.
//
// Rein (relative Importe).
import { forwardJson } from "../forms/forward.js";
import { fieldsFromHerkunft, pickAttribution } from "../forms/attributionFields.js";
import { planerFields, withoutPlanerFields } from "../forms/planerFields.js";
import { phAuthHeader, phClientHeaders, phMethodUrl, resolveBackend } from "./config.js";

/** Formularart → ph-Methode (+ feste Zusatzfelder). */
export const PH_INQUIRY = Object.freeze({
  kontakt: { method: "ph_crm.api.create_contact" },
  beratung: { method: "ph_crm.api.create_anfrage" },
  produkt: { method: "ph_crm.api.create_anfrage" },
  gutschein: { method: "ph_crm.api.create_contact", extra: { art: "Gutschein" } },
  reservierung: { method: "ph_crm.api.create_contact", extra: { art: "Reservierung" } },
  ezarri: { method: "ph_crm.api.create_anfrage", extra: { art: "Ezarri" } },
  agent: { method: "ph_crm.api.create_anfrage", extra: { quelle: "agent" } },
});

/** Freitextfeld mit dem Herkunftsblock je Formularart (leadPayload.LEAD_TEXT_FIELD, commerce withOrigin). */
export const TEXT_FIELD = Object.freeze({
  kontakt: "ihre_nachricht",
  gutschein: "ihre_nachricht",
  reservierung: "ihre_nachricht",
  beratung: "bitte_beschreiben_sie_ihr_vorhaben",
  ezarri: "bitte_beschreiben_sie_ihr_vorhaben",
  agent: "bitte_beschreiben_sie_ihr_vorhaben",
  produkt: "anfrage_beschreibung",
});

export const PH_NEWSLETTER_METHOD = "ph_marketing.api.subscribe_newsletter";

/** ph-Antwort { referenz, status } → Form der alten Antwort (data.message.name). */
export function mapPhInquiryResult(result) {
  if (result?.kind !== "ok") return result;
  const m = result.data?.message;
  if (!m || typeof m !== "object") return result;
  return { ...result, data: { ...result.data, message: { ...m, name: m.referenz ?? m.name ?? null } } };
}

function phHeaders(cfg) {
  return { "Content-Type": "application/json", Accept: "application/json", Authorization: phAuthHeader(cfg) };
}

/**
 * Schickt eine Anfrage an das Backend der Gruppe „formulare“.
 * @param {keyof PH_INQUIRY} kind
 * @param {object} payload  Felder wie heute (ohne lead_ref)
 * @param {{ altUrl: string, fetchImpl?: Function, idempotencyKey?: string|null, env?: object, timeoutMs?: number, attribution?: object }} o
 *   attribution: utm_* / klick_id aus dem Formular (nur ph; Einwilligung prüft der Browser).
 * ph zusätzlich: utm_* / klick_id aus dem Herkunftsblock des Freitexts
 * (src/lib/forms/attributionFields.js – dort stehen sie nur mit Ads-Einwilligung).
 */
export async function forwardInquiry(kind, payload, { altUrl, fetchImpl = fetch, idempotencyKey = null, env = process.env, timeoutMs, attribution, visitorIp, request } = {}) {
  const spec = PH_INQUIRY[kind];
  if (!spec) throw new Error(`Unbekannte Formularart "${kind}"`);
  const target = resolveBackend("formulare", env);
  const opts = timeoutMs ? { timeoutMs } : {};
  // Planer-Beilage (planer, planer_konfiguration, planer_link) nur für ph – alt bekommt den bisherigen Payload.
  const base = withoutPlanerFields(payload);
  if (target.generation === "alt") return forwardJson(altUrl, base, { fetchImpl, ...opts });
  if (!target.ph) return { kind: "not_configured" };
  const kampagne = { ...fieldsFromHerkunft(payload?.[TEXT_FIELD[kind]]), ...pickAttribution(attribution) };
  const body = { ...base, ...planerFields(payload || {}), ...kampagne, ...(spec.extra || {}), ...(idempotencyKey ? { idempotency_key: String(idempotencyKey).slice(0, 80) } : {}) };
  const client = await phClientHeaders({ env, visitorIp, request });
  const result = await forwardJson(phMethodUrl(target.ph, spec.method), body, { fetchImpl, headers: { ...phHeaders(target.ph), ...client }, ...opts });
  return mapPhInquiryResult(result);
}

/**
 * Newsletter: { url, headers } des Ziels oder null (ph ohne Zugang).
 * alt bleibt beim Aufrufer (formsBackendBaseUrl + Methode, unverändert).
 */
export function newsletterPhTarget(env = process.env) {
  const target = resolveBackend("newsletter", env);
  if (target.generation !== "ph") return { generation: "alt" };
  if (!target.ph) return { generation: "ph", url: null, headers: null };
  return { generation: "ph", url: phMethodUrl(target.ph, PH_NEWSLETTER_METHOD), headers: phHeaders(target.ph) };
}
