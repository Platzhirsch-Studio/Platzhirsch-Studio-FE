// src/lib/agent/appointment.js – Terminwunsch über KI-Assistenten (request_appointment).
//
// Ablauf (Double-Opt-in, nichts wird gebucht oder bestellt):
//   1. Der Assistent ruft request_appointment mit agent_consent: true auf.
//   2. off    → nur Link zur Terminanfrage (keine Daten verarbeitet)
//      dryrun → Angaben geprüft, Referenz zurück, KEIN Netzwerkaufruf
//      live   → versiegelter Token (seal.js) + Bestätigungs-E-Mail an die Person
//   3. Die Person öffnet den Link (/de/ki-assistenten/bestaetigen#<token>),
//      sieht ihre Angaben und bestätigt – erst dann geht die Anfrage an das
//      Backoffice, auf demselben Weg und im selben Format wie das
//      Beratungsformular (/api/beratung_anfrage: beratungSchema, forwardJson),
//      mit Herkunft „Kanal: KI-Assistent · Quelle: agent / mcp“.
// Außerhalb von NODE_ENV=production gibt es Schritt 3 nur als Probelauf.
//
// Rein (relative Importe, Netz nur über übergebenes fetchImpl/sendMail):
// node --test prüft alle Wege mit gesperrtem fetch.
import { randomUUID } from "node:crypto";
import { HERKUNFT_TITLE } from "../forms/leadPayload.js";
import { CHANNELS } from "../attribution.js";
import { CONFIRM_PATH, CONFIRM_TTL_MS, MCP_PATH, SITE_ORIGIN } from "./config.js";
import { seal, unseal } from "./seal.js";
import { appointmentUrl } from "./facts.js";
import { addDays } from "../booking/time.js";

export const BACKOFFICE_URL =
  "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage.api.create_anfrage";

// Werte wie die Auswahlkarten des Beratungsformulars (src/messages/de.json MultiStepForm).
const PROJECT = { Neubau: "einen Neubau", Renovierung: "eine Renovierung", Anderes: "Anderes" };
const PROPERTY = { Einfamilienhaus: "in einem Einfamilienhaus", Wohnung: "in einer Wohnung", Gewerbe: "in einer gewerblichen Immobilie" };
const PLACE = { showroom: "im Showroom in Lochau", vor_ort: "bei mir vor Ort", offen: "offen" };

export const NOTHING_BOOKED = "Nichts ist gebucht, bitte bestätigen Sie die E-Mail.";

/** Kurze Referenz für Person und Team, z. B. „AG-7K3QX9“. */
export function newReference(rand = randomUUID) {
  const hex = rand().replace(/-/g, "");
  return `AG-${parseInt(hex.slice(0, 10), 16).toString(36).toUpperCase().slice(0, 6).padStart(6, "0")}`;
}

/** „m***@example.com“ – die Adresse wird dem Assistenten nur maskiert bestätigt. */
export function maskEmail(email) {
  const [user, host] = String(email).split("@");
  if (!host) return "***";
  return `${user.slice(0, 1)}***@${host}`;
}

/** Zusammenfassung für die Bestätigungsseite und die Mail (ohne Telefon/Mail im Klartext doppelt). */
export function summaryOf(data) {
  return {
    name: `${data.first_name} ${data.last_name}`,
    email: data.email,
    phone: data.phone,
    topic: data.topic,
    project: PROJECT[data.project_type || "Anderes"],
    property: PROPERTY[data.property_type],
    place: PLACE[data.place || "offen"],
    times: data.preferred_times || [],
    message: data.message || "",
  };
}

/** Beratungsanfrage im Format von /api/beratung_anfrage (Felder wie BeratungClient.js). */
export function toBackofficePayload(data, { reference, leadRef = randomUUID() } = {}) {
  const s = summaryOf(data);
  const lines = [
    `Terminwunsch über einen KI-Assistenten (Referenz ${reference}), von der Person per E-Mail bestätigt.`,
    `Thema: ${s.topic}`,
    `Ort: ${s.place}`,
    s.times.length ? `Wunschzeiten: ${s.times.join("; ")}` : "Wunschzeiten: keine angegeben",
    s.message ? `Nachricht: ${s.message}` : null,
  ].filter(Boolean);
  const herkunft = [
    HERKUNFT_TITLE,
    `Kanal: ${CHANNELS.ai} (Assistent) · Quelle: agent / mcp`,
    `Einstieg: ${MCP_PATH}`,
    `Sprache: ${data.locale || "de"}`,
    `Referenz: ${leadRef}`,
  ].join("\n");
  return {
    bei_meiner_anfrage_geht_es_um: s.project,
    das_projekt_soll_verwirklicht_werden: s.property,
    bitte_beschreiben_sie_ihr_vorhaben: `${lines.join("\n")}\n\n${herkunft}`,
    vorname: data.first_name,
    nachname: data.last_name,
    email: data.email,
    telefon: data.phone,
  };
}

export const confirmUrl = (token) => `${SITE_ORIGIN}${CONFIRM_PATH}#${token}`;

// ---------------------------------------------------------------------------
// Bestätigungs-E-Mail (Text + HTML, keine Tracking-Pixel, keine externen Bilder)

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function buildConfirmMail({ data, reference, link }) {
  const s = summaryOf(data);
  const subject = `Bitte bestätigen: Ihr Terminwunsch bei Platzhirsch (${reference})`;
  const rows = [
    ["Thema", s.topic],
    ["Ort", s.place],
    ["Wunschzeiten", s.times.join("; ") || "keine angegeben"],
    ["Telefon", s.phone],
  ];
  const text = [
    `Guten Tag, ${s.name},`,
    "",
    "Ihr KI-Assistent hat in Ihrem Namen einen Terminwunsch an Platzhirsch Home Living in Lochau übergeben. Nichts ist gebucht. Erst wenn Sie bestätigen, sieht unser Team Ihren Wunsch und meldet sich mit einem Terminvorschlag.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Bestätigen (48 Stunden gültig): ${link}`,
    "",
    "Waren Sie das nicht? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung wird nichts gespeichert oder weitergegeben.",
    `Datenschutz: ${SITE_ORIGIN}/de/datenschutz`,
    "",
    "Platzhirsch Home Living · Landstraße 11, 6911 Lochau · +43 5574 46255",
  ].join("\n");
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#30373e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e1d8"><tr><td style="padding:32px">
<p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a5f17">Terminwunsch ${esc(reference)}</p>
<h1 style="margin:10px 0 20px;font-family:Georgia,serif;font-weight:normal;font-size:28px;line-height:1.15">Bitte bestätigen Sie Ihren Terminwunsch.</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Guten Tag, ${esc(s.name)},<br>Ihr KI-Assistent hat in Ihrem Namen einen Terminwunsch übergeben. Nichts ist gebucht. Erst wenn Sie bestätigen, sieht unser Team Ihren Wunsch und meldet sich mit einem Terminvorschlag.</p>
<table role="presentation" style="margin:0 0 24px;font-size:15px;line-height:1.5">${rows.map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:#5c636a">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
<p style="margin:0 0 24px"><a href="${esc(link)}" style="display:inline-block;background:#30373e;color:#ffffff;text-decoration:none;font-size:15px;padding:14px 26px">Terminwunsch bestätigen</a></p>
<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5c636a">Der Link ist 48 Stunden gültig. Waren Sie das nicht? Dann ignorieren Sie diese E-Mail. Ohne Bestätigung wird nichts gespeichert oder weitergegeben. <a href="${SITE_ORIGIN}/de/datenschutz" style="color:#30373e">Datenschutz</a></p>
<p style="margin:0;font-size:13px;color:#5c636a">Platzhirsch Home Living · Landstraße 11, 6911 Lochau · +43 5574 46255</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/**
 * Versand über einen signierten Webhook (n8n/Make/SMTP-Relay), wie beim Stil-Finder.
 * Header X-Platzhirsch-Signature = HMAC-SHA256(body, AGENT_MAIL_WEBHOOK_SECRET).
 */
export function createWebhookMailer({ url, secret, fetchImpl = fetch, hmac }) {
  return async function sendMail(mail) {
    const body = JSON.stringify({ kind: "agent-appointment-confirm", ...mail });
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Platzhirsch-Signature": hmac(body, secret) },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`mail webhook ${res.status}`);
    return true;
  };
}

// ---------------------------------------------------------------------------
// Schritt 2: request_appointment

/**
 * @param {object} data   geprüfte Eingabe (validate.js, agent_consent === true)
 * @param {{ mode: "off"|"dryrun"|"live", secret?: string|null, sendMail?: Function, now?: number, reference?: string }} ctx
 * @returns {Promise<{ isError: boolean, result: object }>}
 */
export async function requestAppointment(data, ctx) {
  const locale = data.locale || "de";
  const handoff = appointmentUrl(locale);
  if (data.agent_consent !== true) {
    return { isError: true, result: { status: "consent_required", message: "Ohne agent_consent: true wird kein Terminwunsch übergeben.", appointment_url: handoff } };
  }
  if (ctx.mode === "off") {
    return {
      isError: false,
      result: {
        status: "handoff",
        message: "Terminwünsche über Assistenten sind gerade nicht aktiv. Bitte geben Sie der Person den Link zur Terminanfrage oder die Telefonnummer +43 5574 46255. Es wurden keine Angaben gespeichert.",
        appointment_url: handoff,
        phone: "+43 5574 46255",
      },
    };
  }

  const now = ctx.now ?? Date.now();
  const reference = ctx.reference || newReference();
  const base = {
    reference,
    summary: { topic: data.topic, place: PLACE[data.place || "offen"], times: data.preferred_times || [] },
    appointment_url: handoff,
  };

  if (ctx.mode === "dryrun") {
    // Probelauf: KEIN Netzwerkaufruf. Ein Bestätigungslink zum Ansehen der
    // Seite entsteht nur, wenn ein Geheimnis da ist (Entwicklung: Fallback).
    const token = ctx.secret ? seal({ ref: reference, exp: now + CONFIRM_TTL_MS, data, dry: true }, ctx.secret) : null;
    return {
      isError: false,
      result: {
        status: "dryrun",
        ...base,
        message: `Probelauf (Entwicklung): Es wurde nichts gesendet. ${NOTHING_BOOKED} Im Livebetrieb erhielte ${maskEmail(data.email)} jetzt eine E-Mail mit Bestätigungslink; erst nach der Bestätigung sieht das Team den Wunsch.`,
        ...(token ? { confirm_preview_url: confirmUrl(token) } : {}),
      },
    };
  }

  // live
  if (!ctx.secret || typeof ctx.sendMail !== "function") {
    return { isError: true, result: { status: "unavailable", message: "Terminwünsche sind gerade nicht möglich. Bitte den Link zur Terminanfrage nutzen.", appointment_url: handoff } };
  }
  const token = seal({ ref: reference, exp: now + CONFIRM_TTL_MS, data }, ctx.secret);
  try {
    await ctx.sendMail({ to: data.email, ...buildConfirmMail({ data, reference, link: confirmUrl(token) }) });
  } catch {
    return {
      isError: true,
      result: { status: "mail_failed", message: "Die Bestätigungs-E-Mail konnte gerade nicht versendet werden. Nichts ist gebucht. Bitte später erneut versuchen oder den Link zur Terminanfrage nutzen.", appointment_url: handoff },
    };
  }
  return {
    isError: false,
    result: {
      status: "pending_confirmation",
      ...base,
      message: `${NOTHING_BOOKED} Die E-Mail ging an ${maskEmail(data.email)} und ist 48 Stunden gültig. Erst nach der Bestätigung sieht das Team den Wunsch und meldet sich mit einem Terminvorschlag.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Schritt 3: Bestätigung durch die Person (/api/agent/confirm)

/** Einmal-Verwendung je Referenz (pro Server-Prozess; Token läuft ohnehin nach 48 h ab). */
export function createUsedSet(max = 5000) {
  const used = new Map();
  return {
    has: (ref) => used.has(ref),
    add(ref, now = Date.now()) {
      used.set(ref, now);
      if (used.size > max) used.delete(used.keys().next().value);
    },
  };
}

/**
 * @param {{ token: string, action: "preview"|"confirm" }} input
 * @param {{ secret: string|null, live: boolean, used: ReturnType<typeof createUsedSet>, forward?: Function, now?: number }} ctx
 *   live = Modus live UND Produktion (sonst Probelauf ohne Backoffice).
 *   forward(payload) → { kind: "ok" | … } (forwardJson aus src/lib/forms/forward.js)
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function confirmAppointment({ token, action }, ctx) {
  const payload = unseal(token, ctx.secret, ctx.now);
  if (!payload?.data || !payload.ref) {
    return { status: 400, body: { ok: false, code: "invalid_or_expired", message: "Der Link ist ungültig oder abgelaufen. Bitte den Terminwunsch neu stellen oder direkt anfragen." } };
  }
  const summary = summaryOf(payload.data);
  const dry = payload.dry === true || !ctx.live;
  if (action === "preview") {
    return { status: 200, body: { ok: true, reference: payload.ref, summary, dryrun: dry, expires: payload.exp, used: ctx.used.has(payload.ref) } };
  }
  if (ctx.used.has(payload.ref)) {
    return { status: 409, body: { ok: false, code: "already_confirmed", reference: payload.ref, message: "Dieser Terminwunsch ist bereits bestätigt." } };
  }
  if (dry) {
    ctx.used.add(payload.ref, ctx.now);
    return { status: 200, body: { ok: true, dryrun: true, reference: payload.ref, message: "Probelauf: Bestätigung geprüft, aber nicht an das Team gesendet." } };
  }
  const result = await ctx.forward(toBackofficePayload(payload.data, { reference: payload.ref }));
  if (result?.kind !== "ok") {
    return { status: 502, body: { ok: false, code: "upstream", reference: payload.ref, message: "Die Bestätigung konnte gerade nicht übermittelt werden. Bitte versuchen Sie es in ein paar Minuten erneut." } };
  }
  ctx.used.add(payload.ref, ctx.now);
  return { status: 200, body: { ok: true, dryrun: false, reference: payload.ref, message: "Danke. Ihr Terminwunsch ist bei uns angekommen. Wir melden uns mit einem Terminvorschlag." } };
}

// ---------------------------------------------------------------------------
// free_appointment_slots: freie Zeiten des Online-Kalenders, NUR LESEND.
// Keine Personendaten, nichts wird reserviert oder gebucht. Die Person wählt
// die Uhrzeit selbst auf /{locale}/termin und bestätigt per E-Mail
// (Double-Opt-in). Angeboten nur, solange der Kalender aktiv ist
// (deps.js: terminMode frappe oder mock).

export const SLOT_ARTEN = ["studio", "video", "vor_ort", "planung"];
const SLOT_WINDOW_DAYS = 14;

/**
 * @param {{ art?: string, modus?: string, from?: string, limit?: number, locale?: string }} input
 * @param {{ fetch: Function, test?: boolean, today: string } | null} ctx
 *   fetch({ art, modus, von, bis }) → Tage im Format von src/lib/booking/slots.js buildDays
 */
export async function freeAppointmentSlots(input = {}, ctx = null) {
  const locale = input.locale || "de";
  const art = SLOT_ARTEN.includes(input.art) ? input.art : "studio";
  const modus = art === "planung" ? (input.modus === "video" ? "video" : "studio") : undefined;
  const bookingUrl = SITE_ORIGIN + "/" + locale + "/termin?art=" + art + (modus ? "&modus=" + modus : "");
  if (!ctx || typeof ctx.fetch !== "function") {
    return {
      isError: false,
      result: {
        status: "unavailable",
        message: "Der Online-Kalender ist gerade nicht aktiv. Bitte den Link zur Terminanfrage oder die Telefonnummer +43 5574 46255 weitergeben.",
        appointment_url: appointmentUrl(locale),
        phone: "+43 5574 46255",
      },
    };
  }
  const today = ctx.today;
  const from = typeof input.from === "string" && input.from > today ? input.from : today;
  const to = addDays(from, SLOT_WINDOW_DAYS - 1);
  const days = await ctx.fetch({ art, modus, von: from, bis: to });
  const slots = (Array.isArray(days) ? days : [])
    .filter((d) => d.status === "open")
    .flatMap((d) => d.slots.map((s) => ({ start: s.start, local: d.date + " " + s.time })))
    .slice(0, input.limit || 12);
  return {
    isError: false,
    result: {
      status: "ok",
      art,
      ...(modus ? { modus } : {}),
      time_zone: "Europe/Vienna",
      from,
      to,
      slots,
      booking_url: bookingUrl,
      message:
        (slots.length ? "Freie Zeiten zur Information." : "In diesem Zeitraum ist nichts frei, später erneut abfragen (from) oder anrufen.") +
        " Nichts ist reserviert oder gebucht: Die Person wählt die Uhrzeit selbst auf booking_url und bestätigt per E-Mail. Freie Zeiten können sich jederzeit ändern.",
      ...(ctx.test ? { test_mode: true } : {}),
    },
  };
}
