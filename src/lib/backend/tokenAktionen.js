// src/lib/backend/tokenAktionen.js – Link-Aktionen aus Mails (Token in der URL):
//   /<locale>/newsletter/bestaetigen?token=…   Double-Opt-in bestätigen
//   /<locale>/newsletter/abmelden?token=…      Newsletter abbestellen (auch ohne Token per E-Mail-Adresse)
//   /de/adventsabend/absagen?token=…           Event-Anmeldung stornieren
// Die Seiten schicken das Token erst nach einem Klick per POST (Mail-Scanner,
// die Links vorab öffnen, lösen nichts aus) an /<locale>/service/senden/<art>.
//
//   ph  ph_marketing.api.confirm_newsletter(token)        → { status: bestaetigt | bereits_bestaetigt }
//                                                           Fehler invalid_token 404, expired 410
//       ph_marketing.api.unsubscribe(token | email)        → { status: abgemeldet | bereits_abgemeldet }
//       ph_marketing.api.cancel_event_registration(token)  → { status: abgesagt | bereits_abgesagt }
//       (Backend-Import/ph_marketing/ph_marketing/api/__init__.py; Gruppe "newsletter",
//        die Adventsabend-Absage hängt an derselben App und damit an derselben Gruppe.)
//   alt platzhirsch_studio kennt weder DOI noch Abmeldung noch Event-Absage.
//       Bestätigen: es gibt im alten System keine DOI-Mails → "not_available".
//       Abmelden/Absagen: Ablage im Postausgang wie bei der One-Click-Abmeldung
//       (newsletterAbmeldung.js): nur der SHA-256 des Tokens, bei der Abmeldung
//       per Formular die Adresse selbst (sonst kann das Team nicht austragen).
//
// Rein (relative Importe; fetch und Postausgang werden übergeben).
import { phCall, resolveBackend } from "./config.js";
import { TOKEN_RE, tokenHash } from "./newsletterAbmeldung.js";

export const PH_METHODS = Object.freeze({
  confirm: "ph_marketing.api.confirm_newsletter",
  unsubscribe: "ph_marketing.api.unsubscribe",
  cancelEvent: "ph_marketing.api.cancel_event_registration",
});

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fehlercode der ph-Antwort → öffentlicher Code der Seite. */
export function publicCode(code) {
  if (code === "invalid_token" || code === "not_found") return "invalid_token";
  if (code === "expired" || code === "verify_expired") return "expired";
  if (code === "invalid") return "invalid";
  if (code === "rate_limited") return "rate_limited";
  return "unavailable";
}

/** HTTP-Status je öffentlichem Code (Route). */
export const STATUS = Object.freeze({ invalid_token: 404, expired: 410, invalid: 400, rate_limited: 429, not_configured: 503, not_available: 503, unavailable: 503 });

const validToken = (token) => TOKEN_RE.test(String(token || ""));

async function viaPh(target, method, params, fetchImpl, okStatus) {
  if (!target.ph) return { ok: false, code: "not_configured", generation: "ph" };
  const r = await phCall(target.ph, method, { params, fetchImpl });
  if (!r.ok) return { ok: false, code: publicCode(r.code), generation: "ph" };
  const status = okStatus.includes(r.message?.status) ? r.message.status : okStatus[0];
  return { ok: true, status, generation: "ph" };
}

async function viaOutbox(outbox, entry) {
  if (typeof outbox !== "function") return { ok: false, code: "unavailable", generation: "alt" };
  try {
    await outbox(entry);
  } catch {
    return { ok: false, code: "unavailable", generation: "alt" };
  }
  return { ok: true, status: "vorgemerkt", generation: "alt" };
}

/**
 * Newsletter-Anmeldung bestätigen (DOI).
 * @returns {Promise<{ok:true,status:"bestaetigt"|"bereits_bestaetigt",generation}|{ok:false,code,generation}>}
 */
export async function confirmNewsletter({ token, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const target = resolveBackend("newsletter", env);
  if (!validToken(token)) return { ok: false, code: "invalid_token", generation: target.generation };
  if (target.generation === "ph") return viaPh(target, PH_METHODS.confirm, { token }, fetchImpl, ["bestaetigt", "bereits_bestaetigt"]);
  return { ok: false, code: "not_available", generation: "alt" };
}

/**
 * Newsletter abbestellen – mit Token aus der Mail oder mit der E-Mail-Adresse.
 * Mit Adresse antwortet das Backend immer gleich (keine Auskunft, ob sie im Verteiler ist).
 * @returns {Promise<{ok:true,status:"abgemeldet"|"bereits_abgemeldet"|"vorgemerkt",generation}|{ok:false,code,generation}>}
 */
export async function unsubscribeNewsletter({ token, email, env = process.env, fetchImpl = globalThis.fetch, outbox, now = new Date() } = {}) {
  const target = resolveBackend("newsletter", env);
  const mail = String(email || "").trim().toLowerCase();
  const byToken = Boolean(token);
  if (byToken && !validToken(token)) return { ok: false, code: "invalid_token", generation: target.generation };
  if (!byToken && (!EMAIL_RE.test(mail) || mail.length > 254)) return { ok: false, code: "invalid", generation: target.generation };
  if (target.generation === "ph") {
    const r = await viaPh(target, PH_METHODS.unsubscribe, byToken ? { token } : { email: mail }, fetchImpl, ["abgemeldet", "bereits_abgemeldet"]);
    // Mit Adresse nie verraten, ob sie bekannt war.
    return r.ok && !byToken ? { ...r, status: "abgemeldet" } : r;
  }
  const entry = byToken
    ? { art: "newsletter-abmeldung-link", eingang: now.toISOString(), token_sha256: tokenHash(token) }
    : { art: "newsletter-abmeldung-formular", eingang: now.toISOString(), email: mail };
  return viaOutbox(outbox, entry);
}

/**
 * Event-Anmeldung (Adventsabend) stornieren.
 * @returns {Promise<{ok:true,status:"abgesagt"|"bereits_abgesagt"|"vorgemerkt",generation}|{ok:false,code,generation}>}
 */
export async function cancelEventRegistration({ token, env = process.env, fetchImpl = globalThis.fetch, outbox, now = new Date() } = {}) {
  const target = resolveBackend("newsletter", env);
  if (!validToken(token)) return { ok: false, code: "invalid_token", generation: target.generation };
  if (target.generation === "ph") return viaPh(target, PH_METHODS.cancelEvent, { token }, fetchImpl, ["abgesagt", "bereits_abgesagt"]);
  return viaOutbox(outbox, { art: "adventsabend-absage", eingang: now.toISOString(), token_sha256: tokenHash(token) });
}
