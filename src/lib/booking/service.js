// src/lib/booking/service.js – Ablauf Buchen, Bestätigen, Ansehen, Absagen, Umbuchen.
// Die Routen unter src/app/api/termin/* prüfen Herkunft, Rate-Limit und
// Schema und rufen dann diese Funktionen. Adapter, Mailer und Uhr sind
// übergebbar (node --test). Keine "@/..."-Importe.
//
// Double-Opt-in (Spezifikation B5, QA Recht P1-1): book() legt den Termin
// "unbestaetigt" an (Uhrzeit 30 Minuten gehalten) und schickt nur den
// Bestätigungslink. Erst confirm() macht ihn fest und verschickt Bestätigung,
// .ics und Verwaltungslink. Alle Kundenmails schickt die Website, auch im
// Frappe-Betrieb (QA Recht P1-2); die Studio-Mail nur im Mock.
// Videoraum-Link erst ab 15 Minuten vor Beginn (MEET_OPEN_MIN, QA Recht P2-4).
import { CONSENT_VERSION, MAX_RANGE_DAYS, MEET_OPEN_MIN, linkSecret } from "./config.js";
import { artLabel, customerMail, icsFor, placeLabel, studioMail, verifyMail } from "./mail.js";
import { bookingMailer } from "./mailer.js";
import { newVerifyToken, parseVerifyLink, signManageToken, verifyHashOf, verifyLinkOf, verifyManageToken } from "./token.js";
import { diffDays, isYmd } from "./time.js";
import { modusOf } from "./types.js";

export const PUBLIC_ERRORS = {
  slot_taken: 409,
  outside_window: 422,
  invalid_token: 403,
  expired: 410,
  verify_expired: 410,
  cancelled: 410,
  too_late_to_change: 409,
  rate_limited: 429,
  not_configured: 503,
  unavailable: 503,
};

const FIXED = new Set(["bestaetigt", "angefragt"]);

export function maskEmail(email) {
  const [user = "", host = ""] = String(email).split("@");
  return host ? `${user.slice(0, 1)}***@${host}` : "";
}

function absolute(origin, p) {
  return /^https?:\/\//.test(p) ? p : `${origin}${p}`;
}

export function manageUrlOf(origin, locale, token) {
  return `${origin}/${locale}/termin/verwalten#${token}`;
}

export function verifyUrlOf(origin, locale, link) {
  return `${origin}/${locale}/termin/bestaetigen#${link}`;
}

function tokenFor(b, env) {
  return signManageToken({ ref: b.ref, version: b.version, expiresAt: Date.parse(b.end) }, linkSecret(env));
}

/** Videoraum offen? Bestätigter Videotermin, ab MEET_OPEN_MIN vor Beginn bis Ende. */
export function meetOpen(b, now = Date.now()) {
  return b.modus === "video" && b.status === "bestaetigt" && now >= Date.parse(b.start) - MEET_OPEN_MIN * 60000 && now <= Date.parse(b.end);
}

/** Was die Seite über einen Termin zeigen darf (ohne Telefon, Anliegen, volle Adresse, Link vor der Zeit). */
export function publicBooking(b, { origin, now = Date.now(), test = false } = {}) {
  const fixed = FIXED.has(b.status);
  const video = b.modus === "video" && b.status !== "storniert";
  return {
    ref: b.ref,
    art: b.art,
    modus: b.modus,
    thema: b.thema,
    label: artLabel(b),
    place: placeLabel(b),
    start: b.start,
    end: b.end,
    status: b.status,
    locale: b.locale,
    vorname: b.vorname,
    email: maskEmail(b.email),
    meetUrl: b.meetUrl && meetOpen(b, now) ? absolute(origin, b.meetUrl) : null,
    meetFrom: video ? new Date(Date.parse(b.start) - MEET_OPEN_MIN * 60000).toISOString() : null,
    // Nur im Testbetrieb: der Test-Raum ist jederzeit ansehbar (deutlich als Test markiert).
    testRoom: test && video ? `${origin}/${b.locale}/termin/testraum` : null,
    canChange: fixed && Date.parse(b.start) > now,
    ics: fixed ? icsFor(b, { now }) : null,
    test,
  };
}

async function send(mailer, mail, ref, log) {
  if (!mailer || !mail?.to) {
    log.error(`[termin] keine Mail ${mail?.tag || "-"} ${ref}: ${mailer ? "Adresse fehlt" : "kein Versandweg"}`);
    return false;
  }
  try {
    const r = await mailer.send(mail, { ref });
    return r?.ok !== false;
  } catch (err) {
    log.error(`[termin] Mail ${mail.tag} ${ref}: ${err?.code || err?.name || "Fehler"}`);
    return false;
  }
}

async function notify(kind, b, { adapter, mailer, origin, token, log }) {
  const test = adapter.test === true;
  const manageUrl = token ? manageUrlOf(origin, b.locale, token) : null;
  await send(mailer, customerMail(kind, b, { manageUrl, test }), b.ref, log);
  if (adapter.kind === "mock") await send(mailer, studioMail(kind, b, { test }), b.ref, log);
}

const mailerFor = (adapter, env) => bookingMailer(adapter.kind === "mock" ? "mock" : "frappe", env);

export async function getSlots({ adapter, art, modus, von, bis }) {
  if (!isYmd(von) || !isYmd(bis) || diffDays(von, bis) < 0 || diffDays(von, bis) > MAX_RANGE_DAYS) return { ok: false, code: "bad_request" };
  try {
    return { ok: true, days: await adapter.slots({ art, modus: modusOf(art, modus), von, bis }) };
  } catch (err) {
    return { ok: false, code: err?.code || "unavailable" };
  }
}

/**
 * Termin anlegen (unbestätigt) und den Bestätigungslink schicken.
 * → { ok, pending, booking, reservedUntil?, devConfirmUrl?, manageUrl? }
 */
export async function book({ adapter, input, origin, env = process.env, now = Date.now(), log = console, mailer = mailerFor(adapter, env) }) {
  const modus = modusOf(input.art, input.modus);
  const verifyToken = newVerifyToken();
  const res = await adapter.create({
    ...input,
    modus,
    verifyHash: verifyHashOf(verifyToken),
    consentVersion: modus === "video" ? CONSENT_VERSION : null,
  });
  if (!res.ok) return res;
  const b = res.booking;
  const test = adapter.test === true;
  const pub = publicBooking(b, { origin, now, test });
  if (b.status !== "unbestaetigt") {
    // Wiederholung einer schon bestätigten Buchung (gleicher Schlüssel): nichts neu verschicken.
    log.info(`[termin] wiederholt ${b.ref} ${b.art}/${b.modus} ${b.status}`);
    return { ok: true, pending: false, booking: pub, manageUrl: manageUrlOf("", b.locale, tokenFor(b, env)) };
  }
  const link = verifyLinkOf(b.ref, verifyToken);
  if (!res.replay) {
    const ok = await send(mailer, verifyMail(b, { verifyUrl: verifyUrlOf(origin, b.locale, link), test }), b.ref, log);
    if (!ok && !test) return { ok: false, code: "unavailable" };
  }
  log.info(`[termin] ${res.renewed ? "erneuert" : res.replay ? "wiederholt" : "vorgemerkt"} ${b.ref} ${b.art}/${b.modus} unbestaetigt`);
  return {
    ok: true,
    pending: true,
    booking: pub,
    reservedUntil: b.reservedUntil || null,
    // Testbetrieb: Bestätigungslink direkt auf der Seite (er liegt ohnehin im Dev-Postausgang).
    ...(test && !res.replay ? { devConfirmUrl: verifyUrlOf("", b.locale, link) } : {}),
  };
}

/** Bestätigungslink aus der Mail (Fragment "<ref>.<token>"). */
export async function confirm({ adapter, link, origin, env = process.env, now = Date.now(), log = console, mailer = mailerFor(adapter, env) }) {
  const parsed = parseVerifyLink(link);
  if (!parsed) return { ok: false, code: "invalid_token" };
  const res = await adapter.confirm(parsed.ref, parsed.token);
  if (!res.ok) return res;
  const b = res.booking;
  const token = tokenFor(b, env);
  if (!res.already) await notify("booked", b, { adapter, mailer, origin, token, log });
  log.info(`[termin] ${res.already ? "schon bestätigt" : "bestätigt"} ${b.ref} ${b.status}`);
  return { ok: true, already: Boolean(res.already), booking: publicBooking(b, { origin, now, test: adapter.test }), manageUrl: manageUrlOf("", b.locale, token) };
}

async function load(adapter, token, env, now) {
  const v = verifyManageToken(token, linkSecret(env), now);
  if (!v.ok) return v;
  let b;
  try {
    b = await adapter.get(v.ref);
  } catch (err) {
    return { ok: false, code: err?.code === "rate_limited" ? "rate_limited" : "unavailable" };
  }
  if (!b || b.version !== v.version || b.status === "unbestaetigt") return { ok: false, code: "invalid_token" };
  return { ok: true, b, v };
}

export async function view({ adapter, token, origin, env = process.env, now = Date.now() }) {
  const r = await load(adapter, token, env, now);
  if (!r.ok) return r;
  return { ok: true, booking: publicBooking(r.b, { origin, now, test: adapter.test }) };
}

export async function cancel({ adapter, token, origin, env = process.env, now = Date.now(), log = console, mailer = mailerFor(adapter, env) }) {
  const r = await load(adapter, token, env, now);
  if (!r.ok) return r;
  const res = await adapter.cancel(r.v.ref, r.v.version);
  if (!res.ok) return res;
  // Frappe liefert nach dem Storno ggf. keine Adresse mehr: die vom Laden nehmen.
  const b = { ...r.b, ...res.booking, email: res.booking.email || r.b.email, nachname: res.booking.nachname || r.b.nachname };
  if (!res.already) await notify("cancelled", b, { adapter, mailer, origin, log });
  log.info(`[termin] abgesagt ${b.ref}`);
  return { ok: true, booking: publicBooking(b, { origin, now, test: adapter.test }) };
}

export async function reschedule({ adapter, token, start, origin, env = process.env, now = Date.now(), log = console, mailer = mailerFor(adapter, env) }) {
  const r = await load(adapter, token, env, now);
  if (!r.ok) return r;
  const res = await adapter.reschedule(r.v.ref, r.v.version, start);
  if (!res.ok) return res;
  const b = { ...r.b, ...res.booking, email: res.booking.email || r.b.email, nachname: res.booking.nachname || r.b.nachname };
  const next = tokenFor(b, env);
  await notify("rescheduled", b, { adapter, mailer, origin, token: next, log });
  log.info(`[termin] verschoben ${b.ref}`);
  return { ok: true, booking: publicBooking(b, { origin, now, test: adapter.test }), manageUrl: manageUrlOf("", b.locale, next), token: next };
}
