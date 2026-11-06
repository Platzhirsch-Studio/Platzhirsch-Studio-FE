// src/lib/portal/adapters/ph.js – Portal-Adapter für die neue App-Familie
// (Gruppe "portal": ph_projekte.api.portal_*, Kundenkarte über ph_kundenkarte).
// Aktiv mit PORTAL_ADAPTER=frappe UND BACKEND_GENERATION (Gruppe portal) = ph
// (adapters/index.js). Vertrag: interface.js – Antworten der ph-Methoden haben
// bereits die Form der Website (Backend-Import/ph_projekte/README.md), hier wird
// nur Parameter- und Fehler-Mapping gemacht.
//
// Kunden-Token: ph_projekte prüft jeden Portalaufruf mit (kontakt, kunde_token).
// portal_login_token(email) erzeugt den Token beim Login-Wunsch (die Website
// mailt den Link selbst); die Website-Sitzung trägt nur die customerId (= PH
// Kontakt). Der Token liegt deshalb serverseitig in einem Token-Speicher
// (tokenStore: get(kontakt) / set(kontakt, token)), nie im Cookie oder Browser.
// Ein neuer Login-Wunsch ersetzt den Token (ältere Sitzungen müssen sich neu
// anmelden). Ablauf im Backend: portal_token_tage (Standard 30) = Sitzungsdauer.
//
// Fehler: invalid_token / expired / not_found beim Kunden → null bzw. []
// (Sitzung gilt als abgemeldet), alles andere wirft PhPortalError(code).
// ph-Methoden ohne **kwargs: es werden nur dokumentierte Parameter gesendet.
// Rein (relative Importe; fetch und tokenStore werden übergeben).
import { phCall } from "../../backend/config.js";

const P = "ph_projekte.api.";

export class PhPortalError extends Error {
  constructor(method, code, status) {
    super(`ph-Portal ${method}: ${code}${status ? ` (HTTP ${status})` : ""}`);
    this.name = "PhPortalError";
    this.code = code;
    this.status = status ?? null;
  }
}

const GONE = new Set(["invalid_token", "expired", "not_found"]);

export function createPhPortalAdapter({ cfg, tokenStore, fetchImpl = globalThis.fetch } = {}) {
  if (!cfg) throw new Error("ph-Portal: BACKEND_PH_URL/BACKEND_PH_TOKEN fehlen");
  if (!tokenStore) throw new Error("ph-Portal: tokenStore fehlt");

  // Alle Portalmethoden nehmen POST (JSON-Body, Token nie in der URL).
  async function raw(method, params) {
    return phCall(cfg, method, { params, fetchImpl });
  }

  /** Aufruf mit Kunden-Token. fallback: Rückgabe, wenn Kunde/Token nicht (mehr) gilt. */
  async function kunde(customerId, method, extra = {}, { fallback = null } = {}) {
    const kundeToken = customerId ? await tokenStore.get(customerId) : null;
    if (!kundeToken) return fallback;
    const r = await raw(method, { kontakt: customerId, kunde_token: kundeToken, ...extra });
    if (r.ok) return r.message ?? fallback;
    if (GONE.has(r.code)) return fallback;
    throw new PhPortalError(method, r.code, r.status);
  }

  const asList = (v) => (Array.isArray(v) ? v : []);

  return {
    name: "ph",

    // Login: erzeugt den Kunden-Token und merkt ihn serverseitig.
    async findCustomerByEmail(email) {
      const r = await raw(`${P}portal_login_token`, { email: String(email || "").trim().toLowerCase() });
      if (!r.ok) {
        if (r.code === "not_found" || r.code === "invalid") return null;
        throw new PhPortalError("portal_login_token", r.code, r.status);
      }
      const m = r.message || {};
      if (!m.found || !m.kontakt || !m.kunde_token) return null;
      await tokenStore.set(m.kontakt, m.kunde_token);
      return { ...(m.customer || {}), id: m.kontakt };
    },

    async getCustomer(customerId) {
      const c = await kunde(customerId, `${P}portal_customer`);
      return c ? { ...c, id: customerId } : null;
    },

    async listProjects(customerId) {
      return asList(await kunde(customerId, `${P}portal_projects`, {}, { fallback: [] }));
    },

    async getProject(customerId, projectId) {
      if (!projectId) return null;
      return kunde(customerId, `${P}portal_project`, { projekt: projectId });
    },

    async listDocuments(customerId, opts = {}) {
      const extra = {};
      if (opts.type) extra.type = opts.type;
      if (opts.projectId) extra.projekt = opts.projectId;
      return asList(await kunde(customerId, `${P}portal_documents`, extra, { fallback: [] }));
    },

    async listAppointments(customerId, opts = {}) {
      const extra = {};
      if (opts.projectId) extra.projekt = opts.projectId;
      if (opts.from) extra.von = opts.from;
      return asList(await kunde(customerId, `${P}portal_appointments`, extra, { fallback: [] }));
    },

    async getProductPass(customerId, productPassId) {
      if (!productPassId) return null;
      // Parameter heißt im Backend `produktpass` (nicht `pass`).
      return kunde(customerId, `${P}portal_product_pass`, { produktpass: productPassId });
    },

    async listRenderings(customerId, projectId) {
      if (!projectId) return [];
      return asList(await kunde(customerId, `${P}portal_renderings`, { projekt: projectId }, { fallback: [] }));
    },

    async listMessages(customerId, opts = {}) {
      const extra = opts.projectId ? { projekt: opts.projectId } : {};
      return asList(await kunde(customerId, `${P}portal_messages`, extra, { fallback: [] }));
    },

    async addFeedback(customerId, input) {
      const r = await kunde(customerId, `${P}portal_add_feedback`, { eintrag: input || {} });
      if (!r) throw new PhPortalError("portal_add_feedback", "invalid_token");
      return { ...r, id: r.id, createdAt: r.createdAt };
    },

    async requestPlanning(customerId, input) {
      const r = await kunde(customerId, `${P}portal_request_planning`, { eintrag: input || {} });
      if (!r) throw new PhPortalError("portal_request_planning", "invalid_token");
      return { id: r.id, createdAt: r.createdAt };
    },

    async markMessagesRead(customerId, messageIds) {
      const ids = asList(messageIds).map(String);
      if (!ids.length) return 0;
      const n = await kunde(customerId, `${P}portal_mark_read`, { message_ids: ids }, { fallback: 0 });
      return Number(n) || 0;
    },

    async sendMessage(customerId, input = {}) {
      const extra = { body: String(input.body || "") };
      if (input.projectId) extra.projekt = input.projectId;
      const r = await kunde(customerId, `${P}portal_send_message`, extra);
      if (!r) throw new PhPortalError("portal_send_message", "invalid_token");
      return r;
    },

    // Kundenkarte: ph_kundenkarte.api.portal_card → { found:false } = keine Karte.
    async getCustomerCard(customerId) {
      const m = await kunde(customerId, "ph_kundenkarte.api.portal_card");
      return m && m.found ? m : null;
    },

    // Zusatz (nicht im Vertrag): private Datei (Rendering, Dokument) über portal_file.
    // → { name, mime, size, content_base64 } | null
    async readFile(customerId, fileUrl) {
      if (!fileUrl) return null;
      return kunde(customerId, `${P}portal_file`, { file_url: fileUrl });
    },
  };
}
