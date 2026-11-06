// Mock-Client: dieselbe Schnittstelle wie frappe/client.js, aber gegen eine
// In-Memory-Datenbank (seed.js) mit Frappe-Filtern, Sortierung, Paging,
// Workflow-Übergängen aus den workflow.json-Fixtures und Nummernkreisen.
// Reines Modul (keine "@/"-Importe), testbar mit node --test.

import { BackofficeError } from "../frappe/errors.js";
import { LAYOUT_FELDTYPEN, metaIndex, workflowFuer } from "../frappe/meta.js";
import { isoDatumZeit } from "../format.js";
import { darfDoc, darfUebergang } from "../auth/rechte.js";
import { neuerName, passtAlle, seite, sortiere, waehleFelder, werteBedingungAus } from "./engine.js";
import { baueDatenbank } from "./seed/index.js";
import { KOMMENTAR_ARTEN, protokolliere, seedProtokoll } from "./protokoll.js";

const G = globalThis;

/** Eine Datenbank je Prozess (überlebt Turbopack-Neuladen). */
export function mockDatenbank({ index = metaIndex(), reset = false } = {}) {
  if (reset || !G.__phBoMockDb) {
    G.__phBoMockDb = { ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() };
    // Änderungsprotokoll für recentActivity (mock/core.js), vorbelegt aus dem Seed.
    G.__phBoMockDb.protokoll = seedProtokoll(G.__phBoMockDb.db);
  }
  return G.__phBoMockDb;
}

function klon(x) {
  return x === undefined ? undefined : JSON.parse(JSON.stringify(x));
}

function ohneKinder(meta, doc) {
  const out = { ...doc };
  for (const f of meta.fields) if (f.fieldtype === "Table") delete out[f.fieldname];
  return out;
}

export class MockClient {
  /**
   * @param {{user:string, name?:string, roles:string[]}} session
   * @param {{index?:any, db?:any, jetzt?:()=>Date}} [opts]
   */
  constructor(session, opts = {}) {
    this.session = session || { user: "Gast", roles: [] };
    this.index = opts.index || metaIndex();
    this.db = opts.db || mockDatenbank({ index: this.index });
    this.jetzt = opts.jetzt || (() => new Date());
    this.modus = "mock";
  }

  // ---------------------------------------------------------------- intern --

  meta(doctype) {
    const m = this.index.doctypes.get(doctype);
    if (!m) throw new BackofficeError("not_found", `DocType ${doctype} ist nicht bekannt.`);
    return m;
  }

  tabelle(doctype) {
    if (!this.db.db.has(doctype)) this.db.db.set(doctype, new Map());
    return this.db.db.get(doctype);
  }

  pruefe(meta, aktion) {
    if (!darfDoc(this.session, meta, aktion)) {
      throw new BackofficeError("forbidden", `Keine Berechtigung (${aktion}) für ${meta.name}.`);
    }
  }

  /** Zeitstempel wie Frappe mit Mikrosekunden – streng steigend, damit `modified` als Konfliktprüfung taugt. */
  zeitstempel() {
    const d = this.jetzt();
    let t = `${isoDatumZeit(d)}.${String(d.getMilliseconds()).padStart(3, "0")}000`;
    if (this.db.letzterStempel && t <= this.db.letzterStempel) {
      const n = BigInt(this.db.letzterStempel.replace(/\D/g, "")) + 1n;
      const s = n.toString().padStart(20, "0");
      t = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}.${s.slice(14, 20)}`;
    }
    this.db.letzterStempel = t;
    return t;
  }

  stempel(doc, neu = false) {
    const t = this.zeitstempel();
    if (neu) {
      doc.creation = t;
      doc.owner = this.session.user;
      doc.docstatus = doc.docstatus || 0;
    }
    doc.modified = t;
    doc.modified_by = this.session.user;
    return doc;
  }

  version(doctype, name, vorher, nachher) {
    const key = `${doctype}::${name}`;
    const liste = this.db.versionen.get(key) || [];
    const geaendert = [];
    for (const k of new Set([...Object.keys(vorher || {}), ...Object.keys(nachher || {})])) {
      if (["modified", "modified_by", "creation", "owner", "docstatus", "idx", "doctype"].includes(k)) continue;
      const a = vorher?.[k];
      const b = nachher?.[k];
      if (typeof a === "object" || typeof b === "object") continue;
      if (String(a ?? "") !== String(b ?? "")) geaendert.push([k, a ?? "", b ?? ""]);
    }
    if (!geaendert.length && vorher) return;
    liste.unshift({ name: `V-${liste.length + 1}`, owner: this.session.user, creation: isoDatumZeit(this.jetzt()), data: { changed: geaendert, added: vorher ? [] : [["neu", "", ""]] } });
    this.db.versionen.set(key, liste.slice(0, 50));
    // Protokoll: nur Feldnamen, nie Werte (wie ph_core.api.aktivitaet).
    protokolliere(this.db, { zeit: nachher?.modified || this.zeitstempel(), benutzer: this.session.user, doctype, name, art: vorher ? "Geaendert" : "Angelegt", felder: geaendert.map((g) => g[0]) });
  }

  // ------------------------------------------------------------------ Lesen --

  async getList(doctype, { fields = ["name"], filters, orFilters, orderBy, limit = 20, start = 0 } = {}) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "read");
    const alle = [...this.tabelle(doctype).values()].filter((d) => passtAlle(d, filters, orFilters));
    const sortiert = sortiere(alle, orderBy, `${meta.sort_field || "modified"} ${meta.sort_order || "DESC"}`);
    return seite(sortiert, { limit, start }).map((d) => klon(waehleFelder(ohneKinder(meta, d), fields)));
  }

  async count(doctype, { filters, orFilters } = {}) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "read");
    return [...this.tabelle(doctype).values()].filter((d) => passtAlle(d, filters, orFilters)).length;
  }

  async getDoc(doctype, name) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "read");
    const doc = this.tabelle(doctype).get(meta.issingle ? doctype : name);
    if (!doc) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    return klon(doc);
  }

  async getValue(doctype, name, feld) {
    const doc = await this.getDoc(doctype, name);
    return doc[feld];
  }

  /** Entspricht frappe.desk.form.load.getdoc → { doc, docinfo }. */
  async getDocMitInfo(doctype, name) {
    const doc = await this.getDoc(doctype, name);
    return { doc, docinfo: await this.docinfo(doctype, name) };
  }

  async docinfo(doctype, name) {
    const key = `${doctype}::${name}`;
    return {
      comments: klon(this.db.kommentare.get(key) || []),
      versions: klon(this.db.versionen.get(key) || []),
      attachments: klon([...this.db.dateien.values()].filter((f) => f.attached_to_doctype === doctype && f.attached_to_name === name)),
      assignments: [],
    };
  }

  // ------------------------------------------------------------- Schreiben --

  async insert(doctype, werte) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "create");
    if (meta.issingle) throw new BackofficeError("invalid", `${doctype} ist ein Einzeldokument.`);
    const doc = { doctype, ...klon(werte) };
    this.pflichtfelder(meta, doc);
    this.kinderNormalisieren(meta, doc);
    const name = doc.name || neuerName(meta, doc, (prefix) => this.naechsteNummer(prefix), this.jetzt());
    if (this.tabelle(doctype).has(name)) throw new BackofficeError("conflict", `${doctype} ${name} existiert bereits.`);
    doc.name = name;
    this.statusAusWorkflow(meta, doc, true);
    this.titel(meta, doc);
    this.stempel(doc, true);
    this.tabelle(doctype).set(name, doc);
    this.version(doctype, name, null, doc);
    return klon(doc);
  }

  async save(doctype, werte, { modified } = {}) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "write");
    const name = meta.issingle ? doctype : werte?.name;
    const alt = this.tabelle(doctype).get(name);
    if (!alt) {
      if (meta.issingle) return this.insertSingle(meta, werte);
      throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    }
    const erwartet = modified ?? werte?.modified;
    if (erwartet && alt.modified && String(erwartet) !== String(alt.modified)) {
      throw new BackofficeError("conflict", "Der Datensatz wurde zwischenzeitlich geändert. Bitte neu laden.", { excType: "TimestampMismatchError" });
    }
    if (alt.docstatus === 1 && !this.nurAllowOnSubmit(meta, alt, werte)) {
      throw new BackofficeError("conflict", "Gebuchte Dokumente können nicht mehr geändert werden.", { excType: "UpdateAfterSubmitError" });
    }
    if (alt.docstatus === 2) throw new BackofficeError("conflict", "Stornierte Dokumente können nicht geändert werden.");
    const neu = { ...alt, ...klon(werte), name, doctype };
    // Schreibgeschützte Felder behalten ihren Wert (Status nur über Workflow).
    for (const f of meta.fields) {
      if ((f.read_only || f.fieldname === "status" || f.fieldname === "workflow_state") && f.fieldname in werte && !["name"].includes(f.fieldname)) {
        neu[f.fieldname] = alt[f.fieldname];
      }
    }
    this.pflichtfelder(meta, neu);
    this.kinderNormalisieren(meta, neu);
    this.titel(meta, neu);
    this.stempel(neu);
    this.tabelle(doctype).set(name, neu);
    this.version(doctype, name, alt, neu);
    return klon(neu);
  }

  insertSingle(meta, werte) {
    const doc = { doctype: meta.name, name: meta.name, ...klon(werte) };
    this.stempel(doc, true);
    this.tabelle(meta.name).set(meta.name, doc);
    return klon(doc);
  }

  nurAllowOnSubmit(meta, alt, werte) {
    return Object.keys(werte || {}).every((k) => {
      if (["name", "modified", "doctype"].includes(k)) return true;
      const f = meta.fields.find((x) => x.fieldname === k);
      return !f || f.allow_on_submit || String(alt[k] ?? "") === String(werte[k] ?? "");
    });
  }

  async setValue(doctype, name, feld, wert) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "write");
    const alt = this.tabelle(doctype).get(name);
    if (!alt) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    const werte = typeof feld === "object" ? feld : { [feld]: wert };
    const neu = { ...alt, ...klon(werte) };
    if ("status" in werte && alt.status !== werte.status) {
      // Statuswechsel ohne Workflow nur für DocTypes ohne Workflow (z. B. Kanban PH Aufgabe)
      if (workflowFuer(doctype, this.index)) {
        throw new BackofficeError("invalid", "Der Status wird über den Workflow gesetzt. Bitte eine Aktion wählen.");
      }
    }
    this.titel(meta, neu);
    this.stempel(neu);
    this.tabelle(doctype).set(name, neu);
    this.version(doctype, name, alt, neu);
    return klon(neu);
  }

  async delete(doctype, name) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "delete");
    const alt = this.tabelle(doctype).get(name);
    if (!alt) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    if (alt.docstatus === 1) throw new BackofficeError("conflict", "Gebuchte Dokumente müssen zuerst storniert werden.");
    this.tabelle(doctype).delete(name);
    return { ok: true };
  }

  async submit(doctype, name) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "submit");
    if (!meta.is_submittable) throw new BackofficeError("invalid", `${doctype} ist nicht buchbar.`);
    const alt = this.tabelle(doctype).get(name);
    if (!alt) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    if (alt.docstatus !== 0) throw new BackofficeError("conflict", "Nur Entwürfe können gebucht werden.", { excType: "DocstatusTransitionError" });
    const neu = { ...alt, docstatus: 1 };
    this.stempel(neu);
    this.tabelle(doctype).set(name, neu);
    this.version(doctype, name, alt, neu);
    return klon(neu);
  }

  async cancel(doctype, name) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "cancel");
    const alt = this.tabelle(doctype).get(name);
    if (!alt) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    if (alt.docstatus !== 1) throw new BackofficeError("conflict", "Nur gebuchte Dokumente können storniert werden.", { excType: "DocstatusTransitionError" });
    const neu = { ...alt, docstatus: 2 };
    this.stempel(neu);
    this.tabelle(doctype).set(name, neu);
    this.version(doctype, name, alt, neu);
    return klon(neu);
  }

  // ---------------------------------------------------------------- Workflow --

  /** Erlaubte Übergänge für ein Dokument und die Sitzung (frappe.model.workflow.get_transitions). */
  async getTransitions(doctype, name) {
    const wf = workflowFuer(doctype, this.index);
    if (!wf) return [];
    const doc = await this.getDoc(doctype, name);
    const aktuell = doc[wf.stateField] || `PH ${doc.status}`;
    return wf.transitions
      .filter((t) => t.state === aktuell)
      .filter((t) => darfUebergang(this.session, t))
      .filter((t) => {
        try {
          return werteBedingungAus(t.condition, doc);
        } catch {
          return false;
        }
      })
      .map((t) => ({ action: t.action, nextState: t.nextState, allowed: t.allowed }));
  }

  async workflowAction(doctype, name, action) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "write");
    const wf = workflowFuer(doctype, this.index);
    if (!wf) throw new BackofficeError("invalid", `${doctype} hat keinen Workflow.`);
    const alt = this.tabelle(doctype).get(name);
    if (!alt) throw new BackofficeError("not_found", `${doctype} ${name} wurde nicht gefunden.`);
    const aktuell = alt[wf.stateField] || `PH ${alt.status}`;
    const t = wf.transitions.find((x) => x.state === aktuell && x.action === action);
    if (!t) throw new BackofficeError("invalid", `Aktion „${action}“ ist im Zustand „${aktuell.replace(/^PH /, "")}“ nicht möglich.`);
    if (!darfUebergang(this.session, t)) throw new BackofficeError("forbidden", `Aktion „${action}“ erfordert die Rolle ${t.allowed}.`);
    let ok = true;
    try {
      ok = werteBedingungAus(t.condition, alt);
    } catch {
      ok = false;
    }
    if (!ok) throw new BackofficeError("invalid", `Bedingung für „${action}“ ist nicht erfüllt (${t.condition}).`);
    const ziel = wf.states.find((s) => s.state === t.nextState);
    const neu = { ...alt, [wf.stateField]: t.nextState };
    if (ziel) {
      neu[ziel.updateField || "status"] = ziel.updateValue ?? neu.status;
      if (ziel.docStatus === 1 && alt.docstatus === 0) neu.docstatus = 1;
      if (ziel.docStatus === 2) neu.docstatus = 2;
    }
    this.titel(meta, neu);
    this.stempel(neu);
    this.tabelle(doctype).set(name, neu);
    this.version(doctype, name, alt, neu);
    this.kommentar(doctype, name, `Workflow: ${action} → ${String(t.nextState).replace(/^PH /, "")}`, "Workflow");
    return klon(neu);
  }

  /** Kanban-Spalten (statusFeld-Werte) mit Karten. */
  async getKanban(doctype, { feld = "status", filters, fields, limit = 200 } = {}) {
    const meta = this.meta(doctype);
    const spalten = meta.statusOptionen.length ? meta.statusOptionen : [...new Set([...this.tabelle(doctype).values()].map((d) => d[feld]))];
    const karten = await this.getList(doctype, { fields: fields || ["*"], filters, orderBy: "modified desc", limit });
    return spalten.map((s) => ({ status: s, karten: karten.filter((k) => k[feld] === s) }));
  }

  // --------------------------------------------------------------- Sonstiges --

  async call(method, args = {}) {
    switch (method) {
      case "frappe.auth.get_logged_user":
        return this.session.user;
      case "frappe.client.get_count":
        return this.count(args.doctype, { filters: args.filters });
      case "frappe.desk.form.load.getdoc":
        return this.getDocMitInfo(args.doctype, args.name);
      case "frappe.desk.form.utils.add_comment":
        return this.kommentar(args.reference_doctype, args.reference_name, args.content, "Comment");
      case "frappe.model.workflow.get_transitions":
        return this.getTransitions(args.doc?.doctype || args.doctype, args.doc?.name || args.name);
      case "frappe.desk.search.search_link":
        return this.searchLink(args.doctype, args.txt, args.page_length);
      case "ph_core.api.ping":
        return { ok: true, modus: "mock" };
      default:
        throw new BackofficeError("not_found", `Methode ${method} ist im Mock nicht hinterlegt.`);
    }
  }

  async runDocMethod(doctype, name, method, args = {}) {
    const doc = await this.getDoc(doctype, name);
    this.kommentar(doctype, name, `Dokumentmethode ${method} (Mock, ohne Wirkung) ${Object.keys(args).length ? JSON.stringify(args) : ""}`.trim(), "Info");
    return { ok: true, mock: true, method, doc: doc.name };
  }

  /** Link-Suche für Formularfelder: name + Titel, nach Text gefiltert. */
  async searchLink(doctype, txt = "", pageLength = 10, filters) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "read");
    const q = String(txt || "").toLowerCase();
    const felder = [...new Set(["name", meta.title_field, ...meta.search_fields].filter(Boolean))];
    const treffer = [...this.tabelle(doctype).values()]
      .filter((d) => passtAlle(d, filters))
      .filter((d) => !q || felder.some((f) => String(d[f] ?? "").toLowerCase().includes(q)))
      .slice(0, pageLength || 10)
      .map((d) => ({ value: d.name, description: felder.filter((f) => f !== "name").map((f) => d[f]).filter(Boolean).join(" · ") }));
    return treffer;
  }

  async getReport(name, filters = {}) {
    // Einfache Berichte des Mock: Zählung je Status einer DocType ("<DocType> je Status").
    const m = /^(.+) je Status$/.exec(name);
    if (m && this.index.doctypes.has(m[1])) {
      const kanban = await this.getKanban(m[1], { filters });
      return { columns: [{ fieldname: "status", label: "Status" }, { fieldname: "anzahl", label: "Anzahl", fieldtype: "Int" }], result: kanban.map((s) => ({ status: s.status, anzahl: s.karten.length })) };
    }
    throw new BackofficeError("not_found", `Bericht ${name} ist im Mock nicht hinterlegt.`);
  }

  async uploadFile({ doctype, name, dateiname, inhalt, privat = true }) {
    const meta = this.meta(doctype);
    this.pruefe(meta, "write");
    const id = `datei-${this.db.dateien.size + 1}`;
    const url = `${privat ? "/private" : ""}/files/${encodeURIComponent(dateiname)}`;
    const eintrag = { name: id, file_name: dateiname, file_url: url, is_private: privat ? 1 : 0, attached_to_doctype: doctype, attached_to_name: name, file_size: inhalt?.byteLength || inhalt?.length || 0, creation: isoDatumZeit(this.jetzt()), inhalt };
    this.db.dateien.set(id, eintrag);
    this.kommentar(doctype, name, `Datei angehängt: ${dateiname}`, "Attachment");
    const { inhalt: _i, ...ohne } = eintrag;
    return ohne;
  }

  async getFile(fileUrl) {
    const f = [...this.db.dateien.values()].find((x) => x.file_url === fileUrl);
    if (!f) throw new BackofficeError("not_found", "Datei nicht gefunden.");
    return { name: f.file_name, type: "application/octet-stream", body: f.inhalt || new Uint8Array() };
  }

  kommentar(doctype, name, text, art = "Comment") {
    const key = `${doctype}::${name}`;
    const liste = this.db.kommentare.get(key) || [];
    const k = { name: `K-${liste.length + 1}`, comment_type: art, content: text, owner: this.session.user, creation: isoDatumZeit(this.jetzt()) };
    liste.unshift(k);
    this.db.kommentare.set(key, liste);
    if (KOMMENTAR_ARTEN[art]) {
      // Kommentar-/Anhangtexte können Personendaten enthalten → nur die Art; Workflow mit Aktion/Zustand.
      protokolliere(this.db, { zeit: this.zeitstempel(), benutzer: this.session.user, doctype, name, art: KOMMENTAR_ARTEN[art], text: art === "Workflow" ? String(text || "").replace(/^Workflow:\s*/, "").slice(0, 60) : undefined });
    }
    return klon(k);
  }

  // ------------------------------------------------------------- Helfer --

  naechsteNummer(prefix) {
    const n = (this.db.zaehler.get(prefix) || 0) + 1;
    this.db.zaehler.set(prefix, n);
    return n;
  }

  pflichtfelder(meta, doc) {
    const fehlend = meta.fields
      .filter((f) => f.reqd && !LAYOUT_FELDTYPEN.has(f.fieldtype) && !f.read_only && f.fieldname !== "naming_series")
      .filter((f) => {
        const v = doc[f.fieldname];
        if (f.fieldtype === "Table") return !Array.isArray(v) || v.length === 0;
        return v === undefined || v === null || v === "";
      });
    if (fehlend.length) {
      throw new BackofficeError("invalid", `Pflichtfelder fehlen: ${fehlend.map((f) => f.label || f.fieldname).join(", ")}`, { excType: "MandatoryError", detail: fehlend.map((f) => f.fieldname) });
    }
  }

  kinderNormalisieren(meta, doc) {
    for (const f of meta.fields) {
      if (f.fieldtype !== "Table") continue;
      const zeilen = Array.isArray(doc[f.fieldname]) ? doc[f.fieldname] : [];
      doc[f.fieldname] = zeilen.map((z, i) => ({ ...z, doctype: f.options, idx: i + 1, parentfield: f.fieldname, parenttype: meta.name, parent: doc.name, name: z.name || `${f.fieldname}-${i + 1}` }));
    }
  }

  statusAusWorkflow(meta, doc) {
    const wf = workflowFuer(meta.name, this.index);
    const statusFeld = meta.fields.find((f) => f.fieldname === "status");
    if (statusFeld && !doc.status) doc.status = statusFeld.default || statusFeld.auswahl?.find(Boolean) || "";
    if (wf && !doc[wf.stateField]) {
      const start = wf.states.find((s) => s.updateValue === doc.status) || wf.states[0];
      doc[wf.stateField] = start?.state || "";
      if (start?.updateValue && !doc.status) doc.status = start.updateValue;
    }
  }

  titel(meta, doc) {
    const tf = meta.title_field;
    if (!tf || !meta.fields.some((f) => f.fieldname === tf)) return;
    const feld = meta.fields.find((f) => f.fieldname === tf);
    if (doc[tf] && !feld.read_only) return;
    const person = [doc.vorname, doc.nachname].filter(Boolean).join(" ") || doc.kunde_name || doc.firma || "";
    const kopf = doc.art || doc.terminart || doc.projektart || "";
    doc[tf] = doc[tf] || [kopf, person].filter(Boolean).join(": ") || doc.name;
  }
}
