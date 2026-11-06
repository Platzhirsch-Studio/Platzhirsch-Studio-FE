// src/lib/backend/labs.js – Labs im ph-Modus der Gruppe „katalog“ (ph_sortiment,
// Website-Anbindung Runde 2, Punkt 6):
//   AR-Viewer          ph_sortiment.api.get_produkt_modelle_3d(marke?)
//                      → [{path_field, glb, usdz, massstab, id, name, category, src, iosSrc, poster, marken}]
//   Dreiländer-Rechner ph_sortiment.api.get_wechselkurs_einstellungen()
//                      → Teil-Konfiguration im Schema von pricing.js configSchema, {} = nicht aktiv
// Beides sind Gast-Methoden (allow_guest, gast_rate_limit je IP): kein Token und
// kein X-PH-Client (ph_core ignoriert ihn bei Gästen). Wie der Katalog über den
// Next-Data-Cache (revalidate) statt no-store.
//
// Ohne ph (Gruppe katalog alt oder ohne Zugang) oder bei Fehlern liefern die
// fetch-Funktionen null → die Aufrufer bleiben exakt beim heutigen Weg.
// Rein (relative Importe, node --test).
import { phMethodUrl, resolveBackend } from "./config.js";

export const PH_MODELLE_3D_METHOD = "ph_sortiment.api.get_produkt_modelle_3d";
export const PH_WECHSELKURS_METHOD = "ph_sortiment.api.get_wechselkurs_einstellungen";
export const LABS_REVALIDATE_S = 3600;
const TIMEOUT_MS = 8000;

/** ph-Zugang der Gruppe katalog oder null (alt / ohne Zugang). */
export function labsPhTarget(env = process.env) {
  const r = resolveBackend("katalog", env);
  return r.generation === "ph" && r.ph ? r.ph : null;
}

/** Gast-GET an ph_sortiment. → message oder null (Netz, HTTP-Fehler, kein JSON). */
export async function phGastGet(cfg, method, params = {}, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS, revalidate = LABS_REVALIDATE_S } = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== "") qs.set(k, String(v));
  const q = qs.toString();
  try {
    const res = await fetchImpl(`${phMethodUrl(cfg, method)}${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.message ?? null;
  } catch {
    return null;
  }
}

// ── AR-Viewer ────────────────────────────────────────────────────────────────

/**
 * Dateipfad des Backends → Pfad, den der AR-Viewer laden darf (ArModelSchema assetUrl):
 * "/files/…" → "/cmx/files/…" (Datei-Proxy, Adresse des Backends bleibt verborgen),
 * eigene Pfade (/labs/ar-viewer/…, /cmx/…) unverändert; alles andere (private
 * Dateien, fremde Hosts) → null.
 */
export function phAssetPath(u) {
  const s = String(u ?? "").trim();
  if (!s || s.includes("..")) return null;
  if (/^\/files\/[\w\-./%]+$/.test(s)) return `/cmx${s}`;
  if (/^\/(cmx|labs\/ar-viewer)\/[\w\-./%]+$/.test(s)) return s;
  return null;
}

/**
 * ph-Modelle → Datensätze im heutigen Format (ArModelSchema).
 * Maße, Bildtext, Hotspots, Varianten, Rechte pflegt die Website selbst
 * (ph_sortiment liefert sie nicht). Deshalb: ein ph-Eintrag ersetzt nur die
 * Dateien (src, iosSrc, poster) eines bekannten Modells (gleiche id oder
 * path_field); Einträge ohne Gegenstück fallen weg und werden gezählt.
 * → { models, ohneGegenstueck: [id…], ungueltig: [id…] }
 */
export function mapPhModelle3d(list, localModels = []) {
  const byId = new Map(localModels.map((m) => [m.id, m]));
  const out = new Map(localModels.map((m) => [m.id, m]));
  const ohneGegenstueck = [];
  const ungueltig = [];
  for (const e of Array.isArray(list) ? list : []) {
    if (!e || typeof e !== "object") continue;
    const id = String(e.id || "");
    const local = byId.get(id) || byId.get(String(e.path_field || ""));
    if (!local) {
      ohneGegenstueck.push(id || String(e.path_field || "?"));
      continue;
    }
    const src = phAssetPath(e.src || e.glb);
    if (!src || !/\.(glb|gltf)$/i.test(src)) {
      ungueltig.push(id);
      continue;
    }
    const ios = phAssetPath(e.iosSrc || e.usdz);
    const poster = phAssetPath(e.poster);
    out.set(local.id, {
      ...local,
      src,
      iosSrc: ios && /\.usdz$/i.test(ios) ? ios : local.iosSrc ?? null,
      poster: poster || local.poster,
      ...(e.name ? { name: String(e.name).slice(0, 120) } : {}),
    });
  }
  return { models: [...out.values()], ohneGegenstueck, ungueltig };
}

/** Rohliste aus ph oder null (alt, ohne Zugang, Fehler, keine Liste). */
export async function fetchPhModelle3d({ marke, env = process.env, fetchImpl } = {}) {
  const cfg = labsPhTarget(env);
  if (!cfg) return null;
  const m = await phGastGet(cfg, PH_MODELLE_3D_METHOD, { marke }, { fetchImpl });
  return Array.isArray(m) ? m : null;
}

// ── Dreiländer-Rechner ───────────────────────────────────────────────────────

const RANGE_KEYS = ["customsFeeChf", "selfTransportChf"];

/**
 * Teil-Konfiguration aus ph → Überschreibung für mergeConfig(DEFAULT_CONFIG, …).
 * Fehlt einem Posten der Kundentext (`source`), bleibt der Text der Vorgabe.
 * {} oder kein Objekt → null (nicht aktiv: heutiger Weg).
 */
export function mapPhWechselkurs(ph, base) {
  if (!ph || typeof ph !== "object" || Array.isArray(ph) || !Object.keys(ph).length) return null;
  const withSource = (r, b) => (r && typeof r === "object" ? { ...r, ...(r.source ? {} : b?.source ? { source: b.source } : {}) } : r);
  const out = { version: 1 };
  if (typeof ph.ossActive === "boolean") out.ossActive = ph.ossActive;
  if (ph.deliveryEur && typeof ph.deliveryEur === "object") {
    out.deliveryEur = {};
    for (const [land, r] of Object.entries(ph.deliveryEur)) if (["CH", "FL", "DE", "AT"].includes(land)) out.deliveryEur[land] = withSource(r, base?.deliveryEur?.[land]);
  }
  for (const k of RANGE_KEYS) if (ph[k]) out[k] = withSource(ph[k], base?.[k]);
  if (ph.fallbackRate && typeof ph.fallbackRate === "object") out.fallbackRate = ph.fallbackRate;
  return out;
}

/** Überschreibung aus ph oder null (alt, ohne Zugang, Fehler, nicht aktiv). */
export async function fetchPhWechselkurs(base, { env = process.env, fetchImpl } = {}) {
  const cfg = labsPhTarget(env);
  if (!cfg) return null;
  return mapPhWechselkurs(await phGastGet(cfg, PH_WECHSELKURS_METHOD, {}, { fetchImpl }), base);
}
