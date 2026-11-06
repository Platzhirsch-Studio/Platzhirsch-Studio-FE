// src/lib/kundenkarte/adapters/frappe.js – Anbindung der Frappe-App ph_kundenkarte
// (Backend-Import/ph_kundenkarte, parallel im Bau). Methoden und Felder:
// interface.js. Auth: Server-zu-Server-Token eines Integrationsnutzers
// ("Authorization: token key:secret"); Schlüssel nur aus der Umgebung
// (config.js frappeCredentials), nie im Browser.
// Fehlerbild: Frappe-Antworten mit `code` (invalid, conflict, rate_limited,
// unavailable, invalid_token, expired) werden durchgereicht, sonst nach
// HTTP-Status gemappt. Keine "@/..."-Importe (node --test mit fetchImpl).
import { confirmHashOf } from "../token.js";
import { pickAttribution } from "../../forms/attributionFields.js";
import { phClientHeaders } from "../../backend/config.js";

const TIMEOUT_MS = 8000;
// Backend-Status (ph_kundenkarte.api) → Status der Website. „Bestaetigt“ ohne Karte heißt: DOI ok,
// Ausstellung durch Mitarbeiter steht aus (Einstellung „automatisch annehmen“ aus).
const STATUS = { Neu: "unbestaetigt", unbestaetigt: "unbestaetigt", Bestaetigt: "bestaetigt", bestaetigt: "bestaetigt", bereits_bestaetigt: "bestaetigt", aktiv: "aktiv", Angenommen: "aktiv", Abgelehnt: "abgelehnt", Doppelt: "abgelehnt", Aktiv: "aktiv", Gesperrt: "gesperrt", Gekuendigt: "gekuendigt" };
const DOMAIN = new Set(["invalid", "conflict", "rate_limited", "unavailable", "invalid_token", "expired", "not_found"]);
const CODES = { 400: "invalid", 401: "unavailable", 403: "unavailable", 404: "not_found", 409: "conflict", 410: "expired", 417: "invalid", 422: "invalid", 429: "rate_limited" };

/** Antwort von create/confirm → Application (Form der Website). */
export function fromFrappe(m = {}) {
  return {
    ref: m.referenz || m.antrag || m.name || "",
    status: STATUS[m.status] || m.status || "unbestaetigt",
    vorname: m.vorname || "",
    nachname: m.nachname || "",
    email: String(m.email || "").toLowerCase(),
    telefon: m.telefon || "",
    plz: m.plz || "",
    ort: m.ort || "",
    geburtstag: m.geburtstag || "",
    interessen: Array.isArray(m.interessen) ? m.interessen : [],
    einwilligungAuswertung: Boolean(m.einwilligung_auswertung),
    einwilligungNewsletter: Boolean(m.einwilligung_newsletter),
    einwilligungTextVersion: m.einwilligung_text_version || "",
    sprache: m.sprache || "de",
    confirmHash: "",
    confirmUntil: m.confirm_until || "",
    kartennummer: m.kartennummer || null,
    createdAt: m.creation || "",
    updatedAt: m.modified || "",
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

    async create(input) {
      const r = await call("create_card_application", {
        params: {
          vorname: input.vorname,
          nachname: input.nachname,
          email: input.email,
          telefon: input.telefon || "",
          plz: input.plz || "",
          ort: input.ort || "",
          geburtstag: input.geburtstag || "",
          interessen: input.interessen || [],
          einwilligung_auswertung: input.einwilligung_auswertung ? 1 : 0,
          einwilligung_newsletter: input.einwilligung_newsletter ? 1 : 0,
          einwilligung_textversion: input.einwilligung_text_version || "",
          newsletter_textversion: input.einwilligung_text_version || "",
          vertragsdaten_akzeptiert: 1,
          sprache: input.sprache || "de",
          confirm_hash: input.confirmHash,
          quelle: "website",
          idempotency_key: input.idem,
          // utm_* / klick_id nur, wenn der Browser sie mit Ads-Einwilligung mitgab.
          ...pickAttribution(input),
        },
      });
      if (!r.ok) return r;
      return { ok: true, application: { ...fromFrappe(r.message), email: input.email, vorname: input.vorname, nachname: input.nachname, sprache: input.sprache || "de" }, replay: Boolean(r.message?.bereits_vorhanden) };
    },

    async confirm(ref, secret) {
      const r = await call("confirm_card_application", { params: { antrag: ref, confirm_hash: confirmHashOf(secret) } });
      if (!r.ok) return r.code === "not_found" ? { ok: false, code: "invalid_token" } : r;
      return { ok: true, application: fromFrappe(r.message), already: Boolean(r.message?.bereits_bestaetigt) };
    },

    async status(email) {
      const r = await call("get_card_status", { get: true, params: { email } });
      if (!r.ok) throw Object.assign(new Error("status"), { code: r.code });
      return { found: Boolean(r.message?.found), status: r.message?.status || null };
    },

    async portalCard(kontakt, kundeToken) {
      const r = await call("portal_card", { get: true, params: { kontakt, kunde_token: kundeToken } });
      if (!r.ok) {
        if (r.code === "not_found") return null;
        throw Object.assign(new Error("portalCard"), { code: r.code });
      }
      return r.message || null;
    },

    async walletPass(kontakt, kundeToken, plattform) {
      const r = await call("portal_wallet_pass", { params: { kontakt, kunde_token: kundeToken, plattform } });
      if (!r.ok) return r;
      return { ok: true, url: r.message?.url || "" };
    },
  };
}
