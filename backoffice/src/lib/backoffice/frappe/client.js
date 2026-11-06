// Das eine Tor zu Frappe (v15) für das Backoffice. Baut auf backofficeFetch
// (http.js: Timeout, Retry, Logging ohne Werte) auf und bildet jede Antwort auf
// das Fehlerbild in errors.js ab.
//
// Auth: Standard ist die Frappe-Sitzung (sid) des angemeldeten Mitarbeiters,
// damit Frappe-Rechte, Workflows und Protokolle unter seinem Namen laufen.
// Nur Systemaufgaben (Geräteliste, Suche ohne Benutzer …) nutzen das Service-
// Token BACKOFFICE_FRAPPE_TOKEN (Benutzer backoffice@platzhirsch.studio).
// Der Browser spricht nie direkt mit Frappe.
//
// Reines Modul (keine "@/"-Importe, kein server-only): testbar mit fetchImpl.

import { backofficeFetch } from "./http.js";
import { BackofficeError, alsBackofficeError, fehlerAusFrappe } from "./errors.js";
import { frappeServiceToken, frappeUrl } from "../config.js";
import { normalisiereMeta, normalisiereWorkflow } from "./meta.js";

const TIMEOUT_MS = 8000;

// ph_api-Fehlerbild (ph_core/api/__init__.py): HTTP-Status + {"message": {"code", "message", …Zusatz}}.
// Fachcodes, die nicht in FEHLER_CODES stehen, behalten ihren Namen in `phCode`.
const PH_CODE_MAP = {
  invalid: "invalid",
  forbidden: "forbidden",
  not_found: "not_found",
  invalid_token: "not_found",
  invalid_pin: "auth",
  rate_limited: "rate_limited",
  conflict: "conflict",
  auth: "auth",
  unavailable: "unavailable",
};
const PH_ZUSATZ = ["field", "verbleibend", "sekunden", "gesperrt", "geraet"];

/**
 * Baut aus einem ph_api-Fehler einen BackofficeError (auch vom Mock genutzt → gleiche Form):
 *   err.code     einer aus FEHLER_CODES (invalid_pin → auth, invalid_token → not_found)
 *   err.phCode   Originalcode aus ph_core
 *   err.status   HTTP-Status (Frappe) bzw. Status des Fachcodes
 *   err.detail   {phCode, field?, verbleibend?, sekunden?, gesperrt?, geraet?} – serialisierbar für Actions
 * Zusatzfelder liegen zusätzlich direkt am Fehler (err.verbleibend, err.sekunden, err.gesperrt …).
 */
export function phCoreFehler(phCode, message, daten = {}, status) {
  const code = PH_CODE_MAP[phCode] || "unavailable";
  const st = status ?? { invalid_pin: 401, invalid_token: 404 }[phCode];
  const detail = { phCode };
  for (const k of PH_ZUSATZ) if (daten?.[k] !== undefined && daten[k] !== null) detail[k] = daten[k];
  const err = new BackofficeError(code, message || phCode, { status: st, detail });
  err.phCode = phCode;
  for (const k of PH_ZUSATZ) if (k in detail) err[k] = detail[k];
  return err;
}

/** ph_api-Fehlerkörper erkennen; sonst klassische Frappe-Abbildung (exc_type, _server_messages). */
export function fehlerAusAntwort(status, body) {
  const m = body && typeof body === "object" ? body.message : null;
  if (m && typeof m === "object" && !Array.isArray(m) && typeof m.code === "string") {
    const { code, message, ...rest } = m;
    return phCoreFehler(code, typeof message === "string" ? message : undefined, rest, status);
  }
  return fehlerAusFrappe(status, body);
}

async function leseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

export class FrappeClient {
  /**
   * @param {{user:string, roles:string[], frappeSid?:string}} session
   * @param {{baseUrl?:string, token?:string, fetchImpl?:Function, service?:boolean}} [opts]
   */
  constructor(session, opts = {}) {
    this.session = session || { user: "Guest", roles: [] };
    this.baseUrl = (opts.baseUrl ?? frappeUrl()).replace(/\/+$/, "");
    this.token = opts.token ?? frappeServiceToken();
    this.fetchImpl = opts.fetchImpl;
    this.service = !!opts.service;
    this.modus = "frappe";
    if (!this.baseUrl) throw new BackofficeError("unavailable", "BACKOFFICE_FRAPPE_URL ist nicht gesetzt.");
  }

  headers(extra = {}) {
    const h = { Accept: "application/json", ...extra };
    if (!this.service && this.session.frappeSid) h.Cookie = `sid=${this.session.frappeSid}`;
    else if (this.token) h.Authorization = `token ${this.token}`;
    return h;
  }

  /** Roh-Aufruf; gibt `message`/`data` zurück oder wirft BackofficeError. */
  async request(pfad, { method = "GET", query, body, raw = false, timeoutMs = TIMEOUT_MS } = {}) {
    const url = new URL(`${this.baseUrl}${pfad}`);
    if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
    let response;
    try {
      response = await backofficeFetch(url.toString(), {
        method,
        headers: this.headers(body ? { "Content-Type": "application/json" } : {}),
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        timeoutMs,
        retries: method === "GET" ? 1 : 0,
        fetchImpl: this.fetchImpl,
        dedupe: false,
      });
    } catch (err) {
      throw alsBackofficeError(err);
    }
    if (raw) {
      if (!response.ok) throw fehlerAusAntwort(response.status, await leseBody(response));
      return response;
    }
    const daten = await leseBody(response);
    if (!response.ok) throw fehlerAusAntwort(response.status, daten);
    if (daten && typeof daten === "object") {
      if ("message" in daten) return daten.message;
      if ("data" in daten) return daten.data;
    }
    return daten;
  }

  method(name, args = {}, opts = {}) {
    return this.request(`/api/method/${name}`, { method: "POST", body: args, ...opts });
  }

  /** GET auf eine whitelisted Methode (lesend, mit einem Retry). Listen/Objekte als JSON-Text. */
  methodGet(name, args = {}, opts = {}) {
    return this.request(`/api/method/${name}`, { method: "GET", query: args, ...opts });
  }

  // ------------------------------------------------------------------ Lesen --

  async getList(doctype, { fields = ["name"], filters, orFilters, orderBy, limit = 20, start = 0 } = {}) {
    return this.method("frappe.client.get_list", {
      doctype,
      fields,
      filters: filters || [],
      or_filters: orFilters || [],
      order_by: orderBy,
      limit_page_length: limit,
      limit_start: start,
    });
  }

  async count(doctype, { filters, orFilters } = {}) {
    return this.method("frappe.client.get_count", { doctype, filters: filters || [], or_filters: orFilters || [] });
  }

  async getDoc(doctype, name) {
    return this.request(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
  }

  async getValue(doctype, name, feld) {
    const r = await this.method("frappe.client.get_value", { doctype, filters: { name }, fieldname: feld });
    return r?.[feld];
  }

  /** frappe.desk.form.load.getdoc → { doc, docinfo } */
  async getDocMitInfo(doctype, name) {
    const r = await this.request("/api/method/frappe.desk.form.load.getdoc", { query: { doctype, name } });
    // getdoc liefert {docs:[...], docinfo:{...}} unter dem Wurzelobjekt, nicht unter message.
    const docs = r?.docs || [];
    return { doc: docs[0] || null, docinfo: r?.docinfo || {} };
  }

  async docinfo(doctype, name) {
    return (await this.getDocMitInfo(doctype, name)).docinfo;
  }

  // ------------------------------------------------------------- Schreiben --

  async insert(doctype, werte) {
    return this.method("frappe.client.insert", { doc: { doctype, ...werte } });
  }

  async save(doctype, werte, { modified } = {}) {
    return this.method("frappe.client.save", { doc: { doctype, ...werte, ...(modified ? { modified } : {}) } });
  }

  async setValue(doctype, name, feld, wert) {
    return this.method("frappe.client.set_value", { doctype, name, fieldname: feld, value: typeof feld === "object" ? undefined : wert });
  }

  async delete(doctype, name) {
    await this.method("frappe.client.delete", { doctype, name });
    return { ok: true };
  }

  async submit(doctype, name) {
    const doc = await this.getDoc(doctype, name);
    return this.method("frappe.client.submit", { doc });
  }

  async cancel(doctype, name) {
    return this.method("frappe.client.cancel", { doctype, name });
  }

  // ---------------------------------------------------------------- Workflow --

  async getTransitions(doctype, name) {
    const doc = await this.getDoc(doctype, name);
    const liste = await this.method("frappe.model.workflow.get_transitions", { doc });
    return (liste || []).map((t) => ({ action: t.action, nextState: t.next_state, allowed: t.allowed }));
  }

  async workflowAction(doctype, name, action) {
    const doc = await this.getDoc(doctype, name);
    return this.method("frappe.model.workflow.apply_workflow", { doc, action });
  }

  async getKanban(doctype, { feld = "status", filters, fields, limit = 200, spalten } = {}) {
    const karten = await this.getList(doctype, { fields: fields || ["*"], filters, orderBy: "modified desc", limit });
    const werte = spalten || [...new Set(karten.map((k) => k[feld]))];
    return werte.map((s) => ({ status: s, karten: karten.filter((k) => k[feld] === s) }));
  }

  // ---------------------------------------------------------------- Sonstiges --

  call(method, args = {}) {
    return this.method(method, args);
  }

  runDocMethod(doctype, name, method, args = {}) {
    return this.method("run_doc_method", { dt: doctype, dn: name, method, args });
  }

  async searchLink(doctype, txt = "", pageLength = 10, filters) {
    const r = await this.method("frappe.desk.search.search_link", { doctype, txt, page_length: pageLength, filters });
    return (r || []).map((x) => ({ value: x.value, description: x.description || "" }));
  }

  async getReport(name, filters = {}) {
    const r = await this.method("frappe.desk.query_report.run", { report_name: name, filters, ignore_prepared_report: 1 });
    return { columns: r?.columns || [], result: r?.result || [] };
  }

  kommentar(doctype, name, text) {
    return this.method("frappe.desk.form.utils.add_comment", {
      reference_doctype: doctype,
      reference_name: name,
      content: text,
      comment_email: this.session.user,
      comment_by: this.session.name || this.session.user,
    });
  }

  /** Datei hochladen (privat, an Dokument gehängt). `inhalt` = Buffer/Uint8Array. */
  async uploadFile({ doctype, name, dateiname, inhalt, privat = true, typ = "application/octet-stream" }) {
    const form = new FormData();
    form.set("file", new Blob([inhalt], { type: typ }), dateiname);
    form.set("is_private", privat ? "1" : "0");
    form.set("doctype", doctype);
    form.set("docname", name);
    let response;
    try {
      response = await backofficeFetch(`${this.baseUrl}/api/method/upload_file`, {
        method: "POST",
        headers: this.headers(),
        body: form,
        timeoutMs: 30000,
        retries: 0,
        fetchImpl: this.fetchImpl,
        dedupe: false,
      });
    } catch (err) {
      throw alsBackofficeError(err);
    }
    const daten = await leseBody(response);
    if (!response.ok) throw fehlerAusFrappe(response.status, daten);
    return daten?.message;
  }

  /** Private Datei als Stream (eigene Route reicht sie an den Browser durch). */
  async getFile(fileUrl) {
    const response = await this.request(fileUrl, { raw: true, timeoutMs: 30000 });
    return { name: decodeURIComponent(fileUrl.split("/").pop() || "datei"), type: response.headers.get("content-type") || "application/octet-stream", body: response.body };
  }

  /** PDF eines Druckformats (frappe.utils.print_format.download_pdf). */
  async getPdf(doctype, name, { format, letterhead } = {}) {
    const query = { doctype, name, format: format || "Standard", no_letterhead: letterhead === false ? 1 : 0 };
    const response = await this.request("/api/method/frappe.utils.print_format.download_pdf", { raw: true, query, timeoutMs: 30000 });
    return { name: `${name}.pdf`, type: "application/pdf", body: response.body };
  }

  // --------------------------------------------------------------- Metadaten --

  /** Meta direkt vom Server: frappe.desk.form.load.getdoctype → docs[] (Haupt- + Kind-DocTypes). */
  async getMeta(doctype) {
    const r = await this.request("/api/method/frappe.desk.form.load.getdoctype", { query: { doctype, with_parent: 1 } });
    const docs = r?.docs || [];
    const haupt = docs.find((d) => d.name === doctype) || docs[0];
    if (!haupt) throw new BackofficeError("not_found", `DocType ${doctype} nicht gefunden.`);
    const kinder = docs.filter((d) => d !== haupt).map((d) => normalisiereMeta(d, "frappe"));
    const meta = normalisiereMeta(haupt, "frappe");
    meta.kinder = kinder;
    return meta;
  }

  async getWorkflow(doctype) {
    const liste = await this.getList("Workflow", { fields: ["name"], filters: { document_type: doctype, is_active: 1 }, limit: 1 });
    if (!liste?.length) return null;
    const w = await this.getDoc("Workflow", liste[0].name);
    return normalisiereWorkflow(w);
  }

  async hasPermission(doctype, aktion = "read", name) {
    const r = await this.method("frappe.client.has_permission", { doctype, docname: name, perm_type: aktion });
    return !!(r?.has_permission ?? r);
  }

  async ping() {
    return this.method("frappe.ping");
  }
}
