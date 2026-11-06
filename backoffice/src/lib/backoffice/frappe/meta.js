// DocType-Metadaten: Felder, Labels, Optionen, Pflicht, Status-Farben, Rechte,
// Workflows. Daraus entstehen die generischen Listen und Formulare.
//
// Mock-/Dev-Modus: gelesen aus den JSON-Dateien der ph_*-Apps
//   <META_DIR>/ph_*/<app>/<app>/doctype/<dt>/<dt>.json, fixtures/workflow.json,
//   fixtures/workflow_state.json, fixtures/custom_field.json
// Frappe-Modus: ausschließlich vom Server (frappe.desk.form.load.getdoctype,
//   Workflow-Dokumente) – siehe client.js (ladeMetaVonFrappe). Fehlt der Meta-
//   Ordner, bricht im Frappe-Modus nichts: der Leser liefert dann einen leeren Index.
//
// Reines Modul (node:fs, keine "@/"-Importe), testbar mit node --test.

import fs from "node:fs";
import path from "node:path";
import { metaDir } from "../config.js";
import { bereichFuerDoctype } from "../bereiche/index.js";
import { doctypeSlug } from "../format.js";
import { ZUSATZ_DOCTYPES } from "../mock/zusatzMeta.js";

const CACHE_TTL_MS = 60_000;

export { FARBE_TON, STYLE_TON, LAYOUT_FELDTYPEN, NICHT_ANZEIGEN } from "./feldtypen.js";
import { FARBE_TON, STYLE_TON, LAYOUT_FELDTYPEN } from "./feldtypen.js";

const FELD_KEYS = [
  "fieldname", "fieldtype", "label", "options", "reqd", "read_only", "in_list_view", "in_standard_filter", "default", "hidden",
  "depends_on", "mandatory_depends_on", "read_only_depends_on", "description", "permlevel", "precision", "length", "bold",
  "allow_on_submit", "collapsible", "fetch_from", "unique", "no_copy", "in_preview", "columns",
];

export function normalisiereFeld(f) {
  const out = {};
  for (const k of FELD_KEYS) if (f[k] !== undefined && f[k] !== null && f[k] !== "") out[k] = f[k];
  if (!out.label && !LAYOUT_FELDTYPEN.has(out.fieldtype)) out.label = out.fieldname;
  if (out.fieldtype === "Select" && typeof out.options === "string") {
    out.auswahl = out.options.split("\n").map((s) => s.trim());
  }
  out.cent = out.fieldtype === "Int" && /_cent$/.test(out.fieldname || "");
  return out;
}

/** Roh-JSON einer DocType → kompakte, serialisierbare Meta. */
export function normalisiereMeta(json, quelle = "datei") {
  const fields = (json.fields || []).map(normalisiereFeld);
  const order = Array.isArray(json.field_order) && json.field_order.length ? json.field_order : fields.map((f) => f.fieldname);
  const byName = new Map(fields.map((f) => [f.fieldname, f]));
  const geordnet = order.map((n) => byName.get(n)).filter(Boolean);
  for (const f of fields) if (!order.includes(f.fieldname)) geordnet.push(f);
  const states = (json.states || []).map((s) => ({ title: s.title, color: s.color, ton: FARBE_TON[s.color] || "grau" }));
  const permissions = (json.permissions || []).map((p) => ({
    role: p.role,
    permlevel: p.permlevel || 0,
    read: !!p.read, write: !!p.write, create: !!p.create, delete: !!p.delete, submit: !!p.submit, cancel: !!p.cancel,
    amend: !!p.amend, print: !!p.print, email: !!p.email, export: !!p.export, report: !!p.report, share: !!p.share,
  }));
  const statusFeld = geordnet.find((f) => f.fieldname === "status");
  return {
    name: json.name,
    slug: doctypeSlug(json.name),
    module: json.module || "",
    bereich: bereichFuerDoctype(json.name, json.module),
    quelle,
    description: json.description || "",
    istable: !!json.istable,
    issingle: !!json.issingle,
    is_submittable: !!json.is_submittable,
    in_create: !!json.in_create,
    autoname: json.autoname || "",
    naming_rule: json.naming_rule || "",
    title_field: json.title_field || "",
    search_fields: (json.search_fields || "").split(",").map((s) => s.trim()).filter(Boolean),
    sort_field: json.sort_field || "modified",
    sort_order: (json.sort_order || "DESC").toUpperCase(),
    track_changes: !!json.track_changes,
    quick_entry: !!json.quick_entry,
    states,
    statusOptionen: statusFeld?.auswahl?.filter(Boolean) || [],
    fields: geordnet,
    permissions,
    links: json.links || [],
  };
}

function leseJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/** Alle JSON-Dateien unter dir, deren Pfad `doctype/<x>/<x>.json` ist. */
function findeDoctypeDateien(dir, out = [], tiefe = 0) {
  if (tiefe > 7) return out;
  let eintraege;
  try {
    eintraege = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of eintraege) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "__pycache__") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "doctype") {
        for (const d of fs.readdirSync(p, { withFileTypes: true })) {
          if (!d.isDirectory()) continue;
          const f = path.join(p, d.name, `${d.name}.json`);
          if (fs.existsSync(f)) out.push(f);
        }
      } else {
        findeDoctypeDateien(p, out, tiefe + 1);
      }
    }
  }
  return out;
}

function findeFixtures(dir, dateiname, out = [], tiefe = 0) {
  if (tiefe > 6) return out;
  let eintraege;
  try {
    eintraege = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of eintraege) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "__pycache__" || e.name === "doctype") continue;
    const p = path.join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (e.name === "fixtures") {
      const f = path.join(p, dateiname);
      if (fs.existsSync(f)) out.push(f);
    } else {
      findeFixtures(p, dateiname, out, tiefe + 1);
    }
  }
  return out;
}

export function normalisiereWorkflow(w) {
  return {
    name: w.name || w.workflow_name,
    doctype: w.document_type,
    stateField: w.workflow_state_field || "workflow_state",
    states: (w.states || []).map((s) => ({
      state: s.state,
      updateField: s.update_field || "status",
      updateValue: s.update_value,
      allowEdit: s.allow_edit,
      docStatus: Number(s.doc_status || 0),
    })),
    transitions: (w.transitions || []).map((t) => ({
      state: t.state,
      action: t.action,
      nextState: t.next_state,
      allowed: t.allowed,
      condition: t.condition || "",
      allowSelfApproval: t.allow_self_approval !== 0,
    })),
  };
}

/** Liest den kompletten Index aus dem Meta-Ordner. Fehlt er → leerer Index (bricht nie). */
export function ladeMetaIndex(dir = aufgeloesterMetaDir()) {
  const doctypes = new Map();
  const workflows = new Map();
  const stateStyles = new Map();
  const kanban = new Map();
  let dateien = 0;

  if (dir && fs.existsSync(dir)) {
    for (const f of findeDoctypeDateien(dir)) {
      const json = leseJson(f);
      if (!json || json.doctype !== "DocType" || !json.name) continue;
      doctypes.set(json.name, normalisiereMeta(json, "datei"));
      dateien++;
    }
    for (const f of findeFixtures(dir, "custom_field.json")) {
      const liste = leseJson(f);
      if (!Array.isArray(liste)) continue;
      for (const cf of liste) {
        const ziel = doctypes.get(cf.dt);
        if (!ziel || ziel.fields.some((x) => x.fieldname === cf.fieldname)) continue;
        const feld = normalisiereFeld(cf);
        const idx = cf.insert_after ? ziel.fields.findIndex((x) => x.fieldname === cf.insert_after) : -1;
        if (idx >= 0) ziel.fields.splice(idx + 1, 0, feld);
        else ziel.fields.push(feld);
      }
    }
    for (const f of findeFixtures(dir, "workflow.json")) {
      const liste = leseJson(f);
      if (!Array.isArray(liste)) continue;
      for (const w of liste) if (w.document_type) workflows.set(w.document_type, normalisiereWorkflow(w));
    }
    for (const f of findeFixtures(dir, "workflow_state.json")) {
      const liste = leseJson(f);
      if (!Array.isArray(liste)) continue;
      for (const s of liste) if (s.workflow_state_name) stateStyles.set(s.workflow_state_name, s.style || "");
    }
    for (const f of findeFixtures(dir, "kanban_board.json")) {
      const liste = leseJson(f);
      if (!Array.isArray(liste)) continue;
      for (const k of liste) {
        if (!k.reference_doctype) continue;
        kanban.set(k.reference_doctype, {
          name: k.kanban_board_name || k.name,
          field: k.field_name || "status",
          columns: (k.columns || []).map((c) => ({ name: c.column_name, indicator: c.indicator })),
          fields: (() => {
            try {
              return JSON.parse(k.fields || "[]");
            } catch {
              return [];
            }
          })(),
        });
      }
    }
  }

  // Synthetische DocTypes des Mock (User, Kundenkarte im Bau …): nur wenn keine Datei da ist.
  for (const json of ZUSATZ_DOCTYPES) {
    if (!doctypes.has(json.name)) doctypes.set(json.name, normalisiereMeta(json, "synthetisch"));
  }

  const slugs = new Map();
  for (const [name, m] of doctypes) slugs.set(m.slug, name);

  return { dir, dateien, doctypes, workflows, stateStyles, kanban, slugs, geladen: Date.now() };
}

/** BACKOFFICE_META_DIR oder ../Backend-Import bzw. ./Backend-Import relativ zum Arbeitsverzeichnis. */
export function aufgeloesterMetaDir(cwd = process.cwd()) {
  const konfiguriert = metaDir();
  const kandidaten = path.isAbsolute(konfiguriert)
    ? [konfiguriert]
    : [path.resolve(cwd, konfiguriert), path.resolve(cwd, "..", konfiguriert), path.resolve(cwd, "Backend-Import"), path.resolve(cwd, "..", "Backend-Import")];
  for (const k of kandidaten) if (fs.existsSync(k)) return k;
  return kandidaten[0];
}

// Modul-Cache mit TTL (globalThis, damit Turbopack-Neuladen den Index behält).
const G = globalThis;
export function metaIndex({ dir, force = false } = {}) {
  const key = "__phBoMetaIndex";
  const alt = G[key];
  if (!force && alt && Date.now() - alt.geladen < CACHE_TTL_MS && (!dir || alt.dir === dir)) return alt;
  const neu = ladeMetaIndex(dir);
  G[key] = neu;
  return neu;
}

export function metaFuer(doctype, index = metaIndex()) {
  return index.doctypes.get(doctype) || null;
}

/** Slug ("ph-anfrage") oder Name ("PH Anfrage") → Name. */
export function doctypeAusSlug(slugOderName, index = metaIndex()) {
  if (index.doctypes.has(slugOderName)) return slugOderName;
  const dekodiert = decodeURIComponent(String(slugOderName || ""));
  if (index.doctypes.has(dekodiert)) return dekodiert;
  return index.slugs.get(doctypeSlug(dekodiert)) || null;
}

export function workflowFuer(doctype, index = metaIndex()) {
  return index.workflows.get(doctype) || null;
}

/** Spalten für eine Liste: Titel/Name, in_list_view-Felder, Status, geändert. */
export function listenSpalten(meta, max = 7) {
  const spalten = [];
  const push = (f) => {
    if (!f || spalten.some((s) => s.fieldname === f.fieldname)) return;
    spalten.push({ fieldname: f.fieldname, label: f.label, fieldtype: f.fieldtype, options: f.options, cent: f.cent, auswahl: f.auswahl });
  };
  push({ fieldname: "name", label: meta.issingle ? "Name" : "Nr.", fieldtype: "Data" });
  const titel = meta.fields.find((f) => f.fieldname === meta.title_field);
  if (titel && titel.fieldname !== "name") push(titel);
  for (const f of meta.fields) {
    if (spalten.length >= max) break;
    if (f.in_list_view && !LAYOUT_FELDTYPEN.has(f.fieldtype) && f.fieldtype !== "Table" && !f.hidden) push(f);
  }
  const status = meta.fields.find((f) => f.fieldname === "status");
  if (status) push(status);
  push({ fieldname: "modified", label: "Geändert", fieldtype: "Datetime" });
  return spalten;
}

/** Felder, die eine Liste laden muss (Spalten + Titel + Status + Workflow). */
export function listenFelder(meta) {
  const felder = new Set(["name", "modified", "creation", "owner"]);
  for (const s of listenSpalten(meta, 12)) felder.add(s.fieldname);
  if (meta.title_field) felder.add(meta.title_field);
  if (meta.fields.some((f) => f.fieldname === "status")) felder.add("status");
  if (meta.fields.some((f) => f.fieldname === "workflow_state")) felder.add("workflow_state");
  if (meta.is_submittable) felder.add("docstatus");
  return [...felder];
}

/** Farbton für einen Status-Wert (states der DocType → Workflow-State-Style → grau). */
export function statusTon(meta, wert, index = metaIndex()) {
  if (!wert) return "grau";
  const s = meta?.states?.find((x) => x.title === wert);
  if (s) return s.ton;
  const style = index.stateStyles.get(`PH ${wert}`) || index.stateStyles.get(wert);
  if (style) return STYLE_TON[style] || "grau";
  const w = String(wert).toLowerCase();
  if (/erledigt|bezahlt|aktiv|gewonnen|abgeschlossen|zugestellt|eingestellt|signiert/.test(w)) return "gruen";
  if (/storniert|abgelehnt|spam|fehl|gesperrt|verloren|ausfall/.test(w)) return "rot";
  if (/offen|neu|entwurf|eingegangen|gemeldet|angefragt/.test(w)) return "blau";
  if (/arbeit|wartet|ausstehend|freigabe|geplant|pruefen|prüfen/.test(w)) return "orange";
  return "grau";
}
