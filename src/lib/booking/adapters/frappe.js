// src/lib/booking/adapters/frappe.js – Backoffice-Anbindung (BOOKING_PROVIDER=frappe).
// VORBEREITET, im Dev nie aktiv (ohne FRAPPE_BOOKING_* läuft der Mock).
// Spricht die whitelisted Methoden der App platzhirsch_studio an
// (Spezifikation Marktresearch/digital/features/online-termin-video.md, B3):
//   GET  get_freie_slots   POST create_termin   POST verify_termin
//   GET  get_termin        POST cancel_termin   POST reschedule_termin
// Auth: "token <key>:<secret>" eines eigenen API-Users „website-termin“, nur
// auf dem Server. Videoraum (Frappe Meet in Frappe Suite, eigene Site),
// Erinnerungen und Kalender-Abgleich macht das Backoffice.
// Double-Opt-in wie Spezifikation B5: create_termin bekommt nur den SHA-256
// des Bestätigungslinks (verify_hash) und hält den Slot 30 Minuten
// ("Unbestaetigt", email_verifiziert 0); verify_termin bestätigt.
// Kundenmails schickt die Website (kundenmail: "website"), weil nur sie die
// signierten Links baut; der Verwaltungslink ist von der Website signiert
// (token.js), Frappe bekommt Referenz + Link-Version (`link_version`).
// get_termin liefert dem Server die E-Mail für Absage-/Umbuchungsmails
// (nie an den Browser: publicBooking maskiert sie).
// Keine "@/..."-Importe; fetch wird für Tests übergeben.
import { verifyHashOf } from "../token.js";
import { pickAttribution } from "../../forms/attributionFields.js";
import { phClientHeaders } from "../../backend/config.js";

const TIMEOUT_MS = 10_000;
const STATUS = { Unbestaetigt: "angefragt", Bestaetigt: "bestaetigt", Erledigt: "bestaetigt", Storniert: "storniert", Abgelehnt: "abgelehnt" };
// 401/403 = Zugang der Website (API-Key) → "nicht erreichbar", nie "Link ungültig" (QA Recht P3-2).
const CODES = { 404: "invalid_token", 409: "slot_taken", 410: "expired", 422: "outside_window", 429: "rate_limited", 503: "unavailable" };
const DOMAIN = new Set(["invalid_token", "slot_taken", "expired", "outside_window", "too_late_to_change", "verify_expired", "cancelled"]);

/** Antwort des Backoffice → Buchung im Format des Mock-Adapters. */
export function fromFrappe(m = {}) {
  return {
    ref: m.referenz,
    art: m.terminart,
    modus: m.modus || null,
    thema: m.thema || null,
    start: m.start,
    end: m.ende,
    status: m.status === "Unbestaetigt" && !Number(m.email_verifiziert) ? "unbestaetigt" : STATUS[m.status] || "angefragt",
    reservedUntil: m.reserviert_bis || null,
    version: Number(m.link_version || 1),
    sequence: Number(m.sequence || 0),
    locale: m.sprache || "de",
    vorname: m.vorname || "",
    nachname: m.nachname || "",
    email: m.email || "",
    telefon: "",
    plzOrt: "",
    anliegen: "",
    meetUrl: m.meet_url || null,
  };
}

export function createFrappeAdapter({ url, key, secret, methodBase }, { fetchImpl = fetch, env = process.env } = {}) {
  // X-PH-Client nur an die ph-App-Familie (Methodenbasis ph_*), ohne BACKEND_PH_CLIENT_SALT nie.
  const clientHeaders = () => (String(methodBase || "").startsWith("ph_") ? phClientHeaders({ env }) : {});
  async function call(method, { get = false, params = {} } = {}) {
    const endpoint = `${url}/api/method/${methodBase}.${method}`;
    const qs = get ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString()}` : "";
    let res;
    try {
      res = await fetchImpl(endpoint + qs, {
        method: get ? "GET" : "POST",
        headers: { Authorization: `token ${key}:${secret}`, Accept: "application/json", ...(get ? {} : { "Content-Type": "application/json" }), ...(await clientHeaders()) },
        body: get ? undefined : JSON.stringify(params),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch {
      return { ok: false, code: "unavailable" };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const named = body?.code || body?.message?.code;
      return { ok: false, code: DOMAIN.has(named) ? named : CODES[res.status] || "unavailable" };
    }
    return { ok: true, message: body?.message };
  }

  return {
    kind: "frappe",
    test: false,

    async slots({ art, modus, von, bis }) {
      const r = await call("get_freie_slots", { get: true, params: { terminart: art, modus, von, bis, zeitzone: "Europe/Vienna" } });
      if (!r.ok) throw Object.assign(new Error("slots"), { code: r.code });
      // Antwort: [{ start, ende }] → Tage wie buildDays (nur "open"/"full").
      const byDay = new Map();
      for (const s of Array.isArray(r.message) ? r.message : []) {
        const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date(s.start));
        const time = new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(s.start));
        if (!byDay.has(date)) byDay.set(date, []);
        byDay.get(date).push({ start: new Date(s.start).toISOString(), time });
      }
      const days = [];
      for (let d = new Date(`${von}T12:00:00Z`); d <= new Date(`${bis}T12:00:00Z`); d = new Date(d.getTime() + 86400000)) {
        const ymd = d.toISOString().slice(0, 10);
        const slots = byDay.get(ymd) || [];
        days.push({ date: ymd, status: slots.length ? "open" : "full", slots });
      }
      return days;
    },

    async create(input) {
      const r = await call("create_termin", {
        params: {
          terminart: input.art,
          modus: input.modus,
          thema: input.thema,
          start: input.start,
          zeitzone: "Europe/Vienna",
          vorname: input.vorname,
          nachname: input.nachname,
          email: input.email,
          telefon: input.telefon,
          plz_ort: input.plzOrt,
          anliegen: input.anliegen,
          sprache: input.locale,
          einwilligung_video: input.consentVersion ? 1 : 0,
          einwilligung_text_version: input.consentVersion || null,
          verify_hash: input.verifyHash,
          link_version: 1,
          kundenmail: "website",
          quelle: "website",
          idempotency_key: input.idem,
          // utm_* / klick_id (mit Ads-Einwilligung) nur an die neue App-Familie (ph_crm.api).
          ...(String(methodBase).startsWith("ph_") ? pickAttribution(input) : {}),
        },
      });
      if (!r.ok) return r;
      return { ok: true, booking: { ...fromFrappe(r.message), email: input.email, vorname: input.vorname, nachname: input.nachname } };
    },

    async confirm(ref, token) {
      const r = await call("verify_termin", { params: { referenz: ref, verify_hash: verifyHashOf(token) } });
      if (!r.ok) return r.code === "expired" ? { ok: false, code: "verify_expired" } : r;
      return { ok: true, booking: fromFrappe(r.message), already: Boolean(r.message?.bereits_bestaetigt) };
    },

    async get(ref) {
      const r = await call("get_termin", { get: true, params: { referenz: ref } });
      if (r.ok) return fromFrappe(r.message);
      if (r.code === "invalid_token") return null;
      throw Object.assign(new Error("get_termin"), { code: r.code });
    },

    async cancel(ref, version) {
      const r = await call("cancel_termin", { params: { referenz: ref, link_version: version } });
      return r.ok ? { ok: true, booking: fromFrappe(r.message) } : r;
    },

    async reschedule(ref, version, start) {
      const r = await call("reschedule_termin", { params: { referenz: ref, link_version: version, neuer_start: start } });
      return r.ok ? { ok: true, booking: fromFrappe(r.message) } : r;
    },
  };
}
