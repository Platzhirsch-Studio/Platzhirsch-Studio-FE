// src/lib/kundenkarte/service.js – Ablauf Antrag → Bestätigungsmail → Bestätigung.
// Die Routen unter src/app/api/kundenkarte/* prüfen Herkunft, Rate-Limit,
// Honeypot und Schema (guardForm) und rufen dann diese Funktionen. Adapter,
// Mailer und Uhr sind übergebbar (node --test). Keine "@/..."-Importe.
//
// Double-Opt-in: apply() legt den Antrag "unbestaetigt" an und schickt NUR den
// Bestätigungslink (48 Stunden gültig). Erst confirm() aktiviert die Karte und
// vergibt die Kartennummer. Der Antwort an den Browser fehlt jede Angabe, ob
// die Adresse schon bekannt war (conflict nur für AKTIVE Karten, damit die
// Person ins Portal findet; sonst neutraler Erfolg – keine Adress-Enumeration
// über unbestätigte Anträge).
import { createHash } from "node:crypto";
import { CONSENT_VERSION, CONFIRM_TTL_HOURS, kundenkarteMode } from "./config.js";
import { KUNDENKARTE_CONFIRM_PATH } from "./copy.js";
import { confirmMail, kundenkarteMailer } from "./mail.js";
import { confirmHashOf, confirmTokenOf, newConfirmSecret, parseConfirmToken } from "./token.js";

export const PUBLIC_ERRORS = Object.freeze({
  invalid: 400,
  invalid_token: 400,
  forbidden: 403,
  conflict: 409,
  expired: 410,
  rate_limited: 429,
  not_configured: 503,
  unavailable: 503,
});

export { CONFIRM_TTL_HOURS };

export function confirmUrlOf(origin, locale, token) {
  return `${origin}/${locale}${KUNDENKARTE_CONFIRM_PATH}?token=${encodeURIComponent(token)}`;
}

/** Idempotenzschlüssel: gleiche Adresse + gleicher Tag → gleicher Schlüssel (Doppelklick, Neuladen). */
export function idempotencyKeyOf(email, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  return createHash("sha256").update(`kundenkarte|${String(email).toLowerCase()}|${day}`).digest("hex").slice(0, 32);
}

function mailerFor(adapter, env) {
  return kundenkarteMailer(adapter?.kind === "mock" ? "mock" : kundenkarteMode(env), env);
}

async function send(mailer, mail, ref, log) {
  if (!mailer) {
    log.error(`[kundenkarte] kein Mailer – Bestätigung ${ref} nicht versendet`);
    return false;
  }
  try {
    const r = await mailer.send(mail, { ref });
    return Boolean(r?.ok);
  } catch (err) {
    log.error(`[kundenkarte] mail ${ref}: ${err?.code || err?.name || "Fehler"}`);
    return false;
  }
}

/** Was die Seite nach dem Antrag erfährt (ohne personenbezogene Daten außer Vorname). */
export function publicApplication(a) {
  return { ref: a.ref, status: a.status, vorname: a.vorname, sprache: a.sprache };
}

/**
 * Antrag anlegen und Bestätigungslink verschicken.
 * @returns {Promise<{ok:true, pending:boolean, application:object, devConfirmUrl?:string}|{ok:false, code:string}>}
 */
export async function apply({ adapter, input, origin, env = process.env, now = Date.now(), log = console, mailer = mailerFor(adapter, env) }) {
  const secret = newConfirmSecret();
  const res = await adapter.create({
    ...input,
    einwilligung_text_version: CONSENT_VERSION,
    confirmHash: confirmHashOf(secret),
    idem: idempotencyKeyOf(input.email, now),
  });
  if (!res.ok) return res;
  const a = res.application;
  const test = adapter.test === true;
  if (a.status === "aktiv") {
    log.info(`[kundenkarte] ${a.ref} bereits aktiv`);
    return { ok: true, pending: false, application: publicApplication(a) };
  }
  const token = confirmTokenOf(a.ref, secret);
  if (!res.replay) {
    const ok = await send(mailer, confirmMail(a, { confirmUrl: confirmUrlOf(origin, a.sprache, token) }), a.ref, log);
    if (!ok && !test) return { ok: false, code: "unavailable" };
  }
  log.info(`[kundenkarte] ${res.renewed ? "erneuert" : res.replay ? "wiederholt" : "beantragt"} ${a.ref} unbestaetigt`);
  return {
    ok: true,
    pending: true,
    application: publicApplication(a),
    // Testbetrieb: Bestätigungslink direkt auf der Seite (er liegt ohnehin im Dev-Postausgang).
    ...(test && !res.replay ? { devConfirmUrl: confirmUrlOf("", a.sprache, token) } : {}),
  };
}

/** Bestätigungslink aus der Mail (?token=<ref>.<secret>). */
export async function confirm({ adapter, token, log = console }) {
  const parsed = parseConfirmToken(token);
  if (!parsed) return { ok: false, code: "invalid_token" };
  const res = await adapter.confirm(parsed.ref, parsed.secret);
  if (!res.ok) return res;
  const a = res.application;
  log.info(`[kundenkarte] ${res.already ? "schon bestätigt" : "bestätigt"} ${a.ref}`);
  return { ok: true, already: Boolean(res.already), application: publicApplication(a) };
}
