// src/lib/backend/adventsabend.js – Adventsabend-Anmeldung im ph-Modus
// (Website-Anbindung Runde 2, Punkt 7).
//
// alt (Standard): das Formular sendet wie bisher an /api/kontakt (Anmeldung als
//   Kontaktanfrage, Personenzahl im Nachrichtentext). Nichts ändert sich.
// ph: Gruppe „formulare“ auf ph MIT Zugang UND Server-Env ADVENTSABEND_EVENT_ID
//   (Name des PH Event im Backoffice) → /api/adventsabend/anmelden →
//   ph_marketing.api.register_event({event_id, name, email, telefon?, personen, nachricht?}).
//   ph_marketing legt die Anmeldung am PH Event an und schickt die Bestätigung
//   mit Absage-Link (/de/adventsabend/absagen?token=…). Fehlt die Event-Kennung,
//   bleibt der alte Weg (sonst gäbe es keine Anmeldung an einem Event).
//
// Antworten von register_event (ph_marketing events.anmelden):
//   {success, status: angemeldet|warteliste, event, personen, plaetze_frei?, bereits_angemeldet}
//   404 not_found (Event unbekannt) · 400 invalid · 409 conflict (ausgebucht, keine Warteliste)
//   422 outside_window (Anmeldung nicht offen) · 410 expired (vorbei/abgesagt) · 429 rate_limited
// Rein (relative Importe, node --test).
import { phCall, resolveBackend } from "./config.js";

export const PH_EVENT_METHOD = "ph_marketing.api.register_event";
export const ADVENT_ROUTE = "/api/adventsabend/anmelden";
export const MAX_PERSONEN = 10;

const s = (v) => String(v ?? "").trim();

/** Event-Kennung aus der Umgebung ("" = nicht gesetzt). */
export const adventEventId = (env = process.env) => s(env.ADVENTSABEND_EVENT_ID).slice(0, 80);

/** { cfg, eventId } für den ph-Weg oder null (alter Weg über /api/kontakt). */
export function adventPhTarget(env = process.env) {
  const r = resolveBackend("formulare", env);
  const eventId = adventEventId(env);
  if (r.generation !== "ph" || !r.ph || !eventId) return null;
  return { cfg: r.ph, eventId };
}

/** Ziel des Formulars: "/api/adventsabend/anmelden" (ph) oder "/api/kontakt" (heute). */
export const adventSubmitUrl = (env = process.env) => (adventPhTarget(env) ? ADVENT_ROUTE : "/api/kontakt");

/** Payload für register_event (nur dokumentierte Felder). */
export function registerEventPayload(data, { eventId, idempotencyKey } = {}) {
  const personen = Math.min(MAX_PERSONEN, Math.max(1, Math.trunc(Number(data?.personen) || 1)));
  const out = {
    event_id: eventId,
    name: s(data?.name).slice(0, 140),
    email: s(data?.email_address ?? data?.email).slice(0, 254),
    personen,
  };
  const telefon = s(data?.telefon).slice(0, 40);
  if (telefon) out.telefon = telefon;
  const nachricht = s(data?.nachricht).slice(0, 500);
  if (nachricht) out.nachricht = nachricht;
  if (idempotencyKey) out.idempotency_key = s(idempotencyKey).slice(0, 80);
  return out;
}

/** ph-Fehlercode → Antwort der Website-Route { status, code }. */
export const ADVENT_ERRORS = Object.freeze({
  conflict: { status: 409, code: "ausgebucht" },
  outside_window: { status: 410, code: "geschlossen" },
  expired: { status: 410, code: "geschlossen" },
  not_found: { status: 503, code: "not_configured" },
  invalid: { status: 400, code: "invalid" },
  rate_limited: { status: 429, code: "rate_limited" },
});

/**
 * Anmeldung senden. → { ok: true, status, warteliste, bereitsAngemeldet }
 *                    | { ok: false, status, code }
 * Ohne ph-Ziel: { ok: false, status: 503, code: "not_configured" } (es wird nichts gesendet).
 */
export async function sendAdventAnmeldung(data, { env = process.env, fetchImpl, idempotencyKey } = {}) {
  const target = adventPhTarget(env);
  if (!target) return { ok: false, status: 503, code: "not_configured" };
  const r = await phCall(target.cfg, PH_EVENT_METHOD, { params: registerEventPayload(data, { eventId: target.eventId, idempotencyKey }), fetchImpl, env });
  if (!r.ok) {
    const m = ADVENT_ERRORS[r.code];
    if (m) return { ok: false, ...m };
    return { ok: false, status: r.detail === "timeout" ? 504 : 502, code: r.detail === "timeout" ? "timeout" : "upstream" };
  }
  const m = r.message || {};
  const status = m.status === "warteliste" ? "warteliste" : "angemeldet";
  return { ok: true, status, warteliste: status === "warteliste", bereitsAngemeldet: Boolean(m.bereits_angemeldet) };
}

/**
 * Route-Handler für /api/adventsabend/anmelden (eigene Datei, damit node --test
 * ihn mit Attrappen prüfen kann). Prüfungen wie die Anfrageformulare:
 * Herkunft (origin.js), Rate-Limit, Größe, Honeypot, Zeitfalle, Schema (guard.js).
 * Antwort: 200 { success, status, warteliste } | Fehler { success: false, code }.
 */
export function adventHandler({ schema, maxBytes, guardForm, originCheck, forbiddenResponse, errorResponse, resolveHeaders, env, fetchImpl, limiter, now } = {}) {
  return async function POST(request) {
    try {
      const e = env || process.env;
      if (!adventPhTarget(e)) return errorResponse("not_configured", 503);
      let outerHeaders = null;
      try {
        outerHeaders = typeof resolveHeaders === "function" ? (await resolveHeaders()) || null : null;
      } catch {
        outerHeaders = null;
      }
      const origin = originCheck(request, outerHeaders, env);
      if (!origin.ok) return forbiddenResponse();
      const guard = await guardForm(request, schema, {
        route: "adventsabend",
        maxBytes,
        outerHeaders,
        fakeSuccess: () => ({ success: true, status: "angemeldet", warteliste: false }),
        limiter,
        now: now ? now() : Date.now(),
      });
      if (!guard.ok) return guard.response;
      const r = await sendAdventAnmeldung(guard.data, { env: e, fetchImpl });
      if (!r.ok) {
        if (r.code !== "ausgebucht" && r.code !== "geschlossen") console.error(`[forms] adventsabend: ph ${r.code} (${r.status})`);
        return errorResponse(r.code, r.status);
      }
      return Response.json({ success: true, status: r.status, warteliste: r.warteliste }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("[forms] adventsabend: internal error", error);
      return errorResponse("internal", 500);
    }
  };
}
