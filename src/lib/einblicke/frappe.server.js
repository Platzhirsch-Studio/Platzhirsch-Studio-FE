// src/lib/einblicke/frappe.server.js – Übertragung der Tagesaggregate an die
// Frappe-App platzhirsch_einblicke (Konzept §4.3). Nur Server.
//
// Modus (frappeMode):
//   "aus"      EINBLICKE_FRAPPE_URL/_KEY/_SECRET nicht vollständig → keine
//              Verbindung; der Body wird als Dry-Run nach
//              .data/einblicke/outbox/ geschrieben (Vorlage für den
//              Frappe-Entwickler, gleiches Format wie live)
//   "dry-run"  Schlüssel gesetzt, aber EINBLICKE_FRAPPE_DRYRUN=1 → nur outbox
//   "live"     POST {URL}/api/method/platzhirsch_einblicke.api.tag_speichern
//              Authorization: token KEY:SECRET, Upsert über deterministische Namen
// Produktionsschutz: zeigt die URL auf backoffice.platzhirsch.studio, wird NUR
// mit NODE_ENV=production UND EINBLICKE_FRAPPE_LIVE=1 gesendet – sonst wirft
// assertTargetAllowed(), bevor eine Verbindung entsteht (Unit-Test).
// Schlüssel nie NEXT_PUBLIC_*, nie geloggt.
import { writeOutbox } from "./store.server.js";

export const METHOD = "/api/method/platzhirsch_einblicke.api.tag_speichern";
export const PROTECTED_HOSTS = ["backoffice.platzhirsch.studio"];
export const SPLIT_BYTES = 1024 * 1024;
const PARTS = ["seiten", "heatmaps", "pfade", "signale", "planer"];

export function frappeConfig(env = process.env) {
  const url = String(env.EINBLICKE_FRAPPE_URL || "").trim().replace(/\/+$/, "");
  const key = String(env.EINBLICKE_FRAPPE_KEY || "").trim();
  const secret = String(env.EINBLICKE_FRAPPE_SECRET || "").trim();
  const complete = Boolean(url && key && secret);
  const mode = !complete ? "aus" : env.EINBLICKE_FRAPPE_DRYRUN === "1" ? "dry-run" : "live";
  return { url, key, secret, mode };
}
export const frappeMode = (env = process.env) => frappeConfig(env).mode;

/** Wirft bei einem nicht erlaubten Ziel – VOR jeder Verbindung. */
export function assertTargetAllowed(url, env = process.env) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error("EINBLICKE_FRAPPE_URL ist keine gültige URL");
  }
  if (u.protocol !== "https:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname)) throw new Error("EINBLICKE_FRAPPE_URL: nur https (außer localhost)");
  const host = u.hostname.toLowerCase();
  const isProtected = PROTECTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (isProtected && !(env.NODE_ENV === "production" && env.EINBLICKE_FRAPPE_LIVE === "1")) {
    throw new Error(`Produktives Backoffice (${host}) gesperrt: nur mit NODE_ENV=production und EINBLICKE_FRAPPE_LIVE=1`);
  }
  return true;
}

/** Body in Teile ≤ 1 MB (je Doctype-Liste, große Listen weiter halbiert). */
export function splitPayload(agg, limit = SPLIT_BYTES) {
  const head = { datum: agg.datum, schema: agg.schema, meta: agg.meta };
  if (Buffer.byteLength(JSON.stringify(agg)) <= limit) return [agg];
  const out = [];
  for (const part of PARTS) {
    const items = agg[part] || [];
    if (!items.length) continue;
    const chunks = [items];
    while (chunks.length) {
      const c = chunks.shift();
      const body = { ...head, teil: part, [part]: c };
      if (c.length > 1 && Buffer.byteLength(JSON.stringify(body)) > limit) {
        const mid = Math.ceil(c.length / 2);
        chunks.unshift(c.slice(0, mid), c.slice(mid));
      } else out.push(body);
    }
  }
  return out;
}

/**
 * pushDay(agg, { env, fetchImpl }) → { mode, teile, files? }
 * Wirft bei HTTP-Fehler oder gesperrtem Ziel (der Tag bleibt dann „offen“).
 */
export async function pushDay(agg, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const cfg = frappeConfig(env);
  const parts = splitPayload(agg);
  if (cfg.mode !== "live") {
    const files = [];
    for (let i = 0; i < parts.length; i++) files.push(await writeOutbox(`${agg.datum}${parts.length > 1 ? `-${i + 1}` : ""}`, parts[i], env));
    return { mode: cfg.mode, teile: parts.length, files };
  }
  assertTargetAllowed(cfg.url, env);
  for (const body of parts) {
    const res = await fetchImpl(cfg.url + METHOD, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `token ${cfg.key}:${cfg.secret}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Frappe tag_speichern: HTTP ${res.status}`);
  }
  return { mode: "live", teile: parts.length };
}
