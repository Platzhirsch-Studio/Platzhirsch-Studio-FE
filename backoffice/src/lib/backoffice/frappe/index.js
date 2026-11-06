// backoffice(session) liefert je nach Modus den Mock- oder Frappe-Client, immer
// an die Sitzung gebunden (Rechte, Workflow-Rollen, Frappe-sid).
// Dazu die Meta-Beschaffung, die den Modus kennt:
//   Mock/Dev  → JSON-Dateien unter ../Backend-Import (meta.js)
//   Frappe    → ausschließlich vom Server (getdoctype, Workflow), Cache 5 min
// Reines Modul.

import { backofficeMode } from "../config.js";
import { MockClient } from "../mock/client.js";
import { FrappeClient } from "./client.js";
import { BackofficeError } from "./errors.js";
import { doctypeAusSlug, metaFuer, metaIndex, workflowFuer } from "./meta.js";
import { doctypeSlug } from "../format.js";

const META_TTL_MS = 5 * 60_000;
const G = globalThis;

function frappeMetaCache() {
  if (!G.__phBoFrappeMeta) G.__phBoFrappeMeta = new Map();
  return G.__phBoFrappeMeta;
}

/**
 * @param {{user:string, roles:string[], frappeSid?:string|null}} session
 * @param {{modus?:"mock"|"frappe", service?:boolean}} [opts]
 */
export function backoffice(session, opts = {}) {
  const modus = opts.modus || backofficeMode();
  if (modus === "frappe") return new FrappeClient(session, { service: opts.service });
  return new MockClient(session);
}

/** Service-Client (Systemaufgaben, Token statt Benutzer-Sitzung). Im Mock: Admin-Sicht. */
export function backofficeService(opts = {}) {
  const modus = opts.modus || backofficeMode();
  if (modus === "frappe") return new FrappeClient({ user: "backoffice@platzhirsch.studio", roles: ["System Manager"] }, { service: true });
  return new MockClient({ user: "backoffice@platzhirsch.studio", roles: ["System Manager"] });
}

/** Meta für einen DocType – im Mock aus Dateien, im Frappe-Modus vom Server (gecacht). */
export async function ladeMeta(client, doctype) {
  if (client.modus !== "frappe") {
    const m = metaFuer(doctype, client.index);
    if (!m) throw new BackofficeError("not_found", `DocType ${doctype} ist nicht bekannt.`);
    return m;
  }
  const cache = frappeMetaCache();
  const alt = cache.get(doctype);
  if (alt && Date.now() - alt.t < META_TTL_MS) return alt.meta;
  const meta = await client.getMeta(doctype);
  cache.set(doctype, { meta, t: Date.now() });
  return meta;
}

export async function ladeWorkflow(client, doctype) {
  if (client.modus !== "frappe") return workflowFuer(doctype, client.index);
  const cache = frappeMetaCache();
  const key = `wf::${doctype}`;
  const alt = cache.get(key);
  if (alt && Date.now() - alt.t < META_TTL_MS) return alt.meta;
  const wf = await client.getWorkflow(doctype);
  cache.set(key, { meta: wf, t: Date.now() });
  return wf;
}

/** Kind-DocType-Meta (Tabellenfelder): Mock aus Index, Frappe aus meta.kinder oder Nachladen. */
export async function ladeKinderMeta(client, meta) {
  const out = {};
  for (const f of meta.fields) {
    if (f.fieldtype !== "Table" || !f.options) continue;
    if (meta.kinder) {
      const k = meta.kinder.find((x) => x.name === f.options);
      if (k) {
        out[f.options] = k;
        continue;
      }
    }
    try {
      out[f.options] = await ladeMeta(client, f.options);
    } catch {
      out[f.options] = null;
    }
  }
  return out;
}

/**
 * URL-Segment → DocType-Name. Mock: über den Slug-Index. Frappe: der Slug wird
 * gegen die Liste bekannter DocTypes (DocType-Liste vom Server, gecacht) aufgelöst.
 */
export async function doctypeAusSegment(client, segment) {
  if (client.modus !== "frappe") return doctypeAusSlug(segment, client.index);
  const dekodiert = decodeURIComponent(String(segment || ""));
  const cache = frappeMetaCache();
  const key = "__doctypes";
  let alt = cache.get(key);
  if (!alt || Date.now() - alt.t > META_TTL_MS) {
    const liste = await client.getList("DocType", { fields: ["name", "module"], filters: [["module", "like", "PH %"]], limit: 0 });
    alt = { meta: liste.map((d) => d.name), t: Date.now() };
    cache.set(key, alt);
  }
  if (alt.meta.includes(dekodiert)) return dekodiert;
  const slug = doctypeSlug(dekodiert);
  return alt.meta.find((n) => doctypeSlug(n) === slug) || (["User", "DocType"].includes(dekodiert) ? dekodiert : null);
}

export { metaIndex };
