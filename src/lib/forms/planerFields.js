// src/lib/forms/planerFields.js – Planer-Ergebnis an einer Beratungsanfrage
// (Website-Anbindung Runde 2, Punkt 5). Spiegel von
// Backend-Import/ph_crm/ph_crm/utils/planer.py (planer_pruefen):
//   planer                Schlüssel aus PLANER (Sofaplaner, Dreiländer-Rechner …)
//   planer_konfiguration  JSON eines Objekts, ≤ 64 KB (json.dumps indent=1), Tiefe ≤ 12
//   planer_link           optional, https://*.platzhirsch.studio/…, ≤ 500 Zeichen
//
// Anders als das Backend wirft die Website nie: Ungültiges fällt weg (eine
// Anfrage scheitert nie an der Planer-Beilage). Gesendet werden die Felder nur
// an ph (src/lib/backend/forms.js forwardInquiry); das alte System bekommt den
// bisherigen Payload.
//
// Der Browser schickt die Konfiguration höchstens CLIENT_KONFIG_MAX groß mit,
// weil die ganze Beratungsanfrage höchstens MAX_BYTES.beratung_anfrage (32 KB)
// haben darf. Größere Pläne gehen nur als Link.
// Rein, ohne Pakete (Client, Server, node --test).

export const PLANER_KEYS = Object.freeze(["sofaplaner", "dreilaender", "kuechenplaner", "ezarri", "3d", "stil-finder", "yacht", "bodensee-licht"]);
export const PLANER_MAX_BYTES = 64 * 1024;
export const CLIENT_KONFIG_MAX = 16 * 1024;
export const PLANER_MAX_TIEFE = 12;
export const PLANER_LINK_MAX = 500;
const LINK_RE = /^https:\/\/([a-z0-9-]+\.)*platzhirsch\.studio(\/\S*)?$/i;
export const PLANER_FIELDS = Object.freeze(["planer", "planer_konfiguration", "planer_link"]);

const bytes = (text) => new TextEncoder().encode(text).length;

function tiefe(wert, n = 0) {
  if (n > PLANER_MAX_TIEFE) return n;
  if (Array.isArray(wert)) return Math.max(n + 1, ...wert.map((v) => tiefe(v, n + 1)));
  if (wert && typeof wert === "object") return Math.max(n + 1, ...Object.values(wert).map((v) => tiefe(v, n + 1)));
  return n;
}

function sortiert(wert) {
  if (Array.isArray(wert)) return wert.map(sortiert);
  if (wert && typeof wert === "object") return Object.fromEntries(Object.keys(wert).sort().map((k) => [k, sortiert(wert[k])]));
  return wert;
}

/** Konfiguration (Objekt oder JSON-Text) → Objekt oder null, wenn ungültig/zu groß/zu tief. */
export function konfigurationOf(wert, maxBytes = PLANER_MAX_BYTES) {
  let obj = wert;
  if (typeof wert === "string") {
    const s = wert.trim();
    if (!s || bytes(s) > maxBytes) return null;
    try {
      obj = JSON.parse(s);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || !Object.keys(obj).length) return null;
  if (tiefe(obj) > PLANER_MAX_TIEFE) return null;
  // Größe wie im Backend gemessen (sortierte Schlüssel, Einrückung 1).
  if (bytes(JSON.stringify(sortiert(obj), null, 1)) > maxBytes) return null;
  return obj;
}

export const planerLinkOf = (link) => {
  const s = String(link ?? "").trim();
  return s && s.length <= PLANER_LINK_MAX && LINK_RE.test(s) ? s : null;
};

/**
 * Felder für ph_crm.create_anfrage / create_contact oder {}.
 * Ohne gültigen planer: {} (das Backend verlangt ihn, sobald etwas mitkommt).
 */
export function planerFields({ planer, planer_konfiguration, planer_link } = {}, { maxBytes = PLANER_MAX_BYTES } = {}) {
  const key = String(planer ?? "").trim().toLowerCase();
  if (!PLANER_KEYS.includes(key)) return {};
  const konfig = planer_konfiguration == null ? null : konfigurationOf(planer_konfiguration, maxBytes);
  const link = planerLinkOf(planer_link);
  return { planer: key, ...(konfig ? { planer_konfiguration: JSON.stringify(konfig) } : {}), ...(link ? { planer_link: link } : {}) };
}

/** Payload ohne die Planer-Felder (alt-Weg: exakt der bisherige Payload). */
export function withoutPlanerFields(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (!PLANER_FIELDS.some((k) => k in payload)) return payload;
  const out = { ...payload };
  for (const k of PLANER_FIELDS) delete out[k];
  return out;
}

const DREILAENDER_KEYS = new Set(["dreilaender", "dreilaenderResult", "dreilaenderLand"]);

/**
 * Browser (BeratungClient): Planer-Felder aus dem URL-Kontext (beratungContext)
 * und der Übergabe aus sessionStorage (draft.js takeHandoff → { config, url }).
 *   Sofaplaner      planer=sofaplaner, Konfiguration = planSchema-Datensatz der Übergabe, Link = Teilen-Link
 *   Dreiländer      planer=dreilaender, Konfiguration = { land, wert } (Ländercode, Wertband – nie ein Betrag)
 * {} ohne Planer.
 */
export function planerPayload(context, handoff = null) {
  const lines = context?.lines || [];
  const keys = new Set(lines.map((l) => l.key));
  if (keys.has("sofaplaner")) {
    const config = handoff?.config ? konfigurationOf(handoff.config, CLIENT_KONFIG_MAX) : null;
    return planerFields({ planer: "sofaplaner", planer_konfiguration: config, planer_link: handoff?.url || context?.plan || null }, { maxBytes: CLIENT_KONFIG_MAX });
  }
  const d = lines.find((l) => DREILAENDER_KEYS.has(l.key));
  if (d) {
    const k = {};
    if (d.vars?.land) k.land = d.vars.land;
    if (d.vars?.wert) k.wert = d.vars.wert;
    return planerFields({ planer: "dreilaender", planer_konfiguration: Object.keys(k).length ? k : null });
  }
  return {};
}
