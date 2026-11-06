// src/lib/backend/config.js – zentrale Umschaltung zwischen den zwei
// Backend-Generationen (Bericht: Marktresearch/digital/backoffice/60-website-backend-umstellung.md).
//
//   alt  heutiges Frappe-Backoffice, App `platzhirsch_studio`
//        (/api/method/platzhirsch_studio.platzhirsch_studio.doctype.<x>.api.<y>)
//   ph   neue App-Familie Backend-Import/ph_* (/api/method/ph_<app>.api.<verb>_<objekt>)
//
// Umgebung (nur Server, nie NEXT_PUBLIC_):
//   BACKEND_GENERATION   alt | ph               Standard alt (ungesetzt = heutiges Verhalten)
//   BACKEND_PH_GRUPPEN   katalog,termin,…|alle  bei alt: diese Gruppen schon auf ph
//   BACKEND_ALT_GRUPPEN  shop,portal,…          bei ph: diese Gruppen bleiben auf alt
//   BACKEND_PH_URL       https://…              Basis der ph-Site (ohne /api)
//   BACKEND_PH_TOKEN     key:secret             API-Schlüssel des Users website@platzhirsch.studio
//   BACKEND_PH_LIVE      1                      nötig, wenn BACKEND_PH_URL das produktive
//                                               Backoffice ist (nur zusammen mit NODE_ENV=production)
//   BACKEND_PH_ALLOW_HTTP 1                     http statt https (nur außerhalb der Produktion, Staging im LAN)
//   BACKEND_PH_CLIENT_SALT …                    Salz für X-PH-Client = sha256(Besucher-IP + Salz);
//                                               ohne Salz kein Header (ph_core utils/ratelimit.py)
//
// Die Generation sagt nur, WELCHES Backend eine Gruppe nutzt. OB eine Gruppe
// überhaupt ein Backend anspricht, entscheiden weiter die bestehenden Schalter
// (BOOKING_PROVIDER, KUNDENKARTE_PROVIDER, PAYMENTS_BACKOFFICE(_LIVE),
// PORTAL_ADAPTER, Ezarri-Schalter, …). So schaltet BACKEND_GENERATION=ph
// keinen Weg „aus Versehen“ live.
//
// Fehlt bei einer ph-Gruppe die Konfiguration (URL/Token), lesen lesende
// Gruppen weiter alt (Warnung im Log), schreibende melden „not_configured“ –
// eine Anfrage landet nie still im falschen System.
//
// Rein: keine "@/"-Importe, kein "server-only" (node --test).
import { createHash } from "node:crypto";

export const GENERATIONEN = Object.freeze(["alt", "ph"]);

/**
 * Funktionsgruppen. ph=false: im ph-Backend gibt es (noch) kein Gegenstück,
 * die Gruppe bleibt immer alt bzw. lokal.
 */
export const GRUPPEN = Object.freeze({
  katalog: { ph: true, lesend: true, app: "ph_sortiment", text: "Produkte, Marken, Kategorien, Farben, Materialien, Kollektionen, Dateien (/cmx)" },
  karriere: { ph: true, lesend: true, app: "ph_personal", text: "Stellenliste" },
  formulare: { ph: true, lesend: false, app: "ph_crm", text: "Kontakt, Beratung, Produktanfrage, Gutschein-Anfrage, Atelier-Reservierung, Empfehlung, Adventsabend, Ezarri, KI-Assistent" },
  newsletter: { ph: true, lesend: false, app: "ph_marketing", text: "Newsletter-Anmeldung (DOI im Backend)" },
  termin: { ph: true, lesend: false, app: "ph_crm", text: "Online-Termin (Slots, Buchung, Bestätigung, Absage, Umbuchung)" },
  upload: { ph: true, lesend: false, app: "ph_crm", text: "Upload-Anhänge an Anfragen" },
  einblicke: { ph: true, lesend: false, app: "ph_marketing", text: "Besucher-Einblicke (Tagesaggregat)" },
  zahlung: { ph: true, lesend: false, app: "ph_shop", text: "Zahlungsereignisse Gutschein/Anzahlung (payment_event)" },
  shop: { ph: true, lesend: false, app: "ph_shop", text: "Shop-Bestellungen und Widerrufe (Spiegel neben dem lokalen Store bis M6)" },
  portal: { ph: true, lesend: false, app: "ph_projekte", text: "Kundenportal (Login-Token, Projekte, Dokumente, Termine, Produktpass, Renderings, Nachrichten, Feedback)" },
  kundenkarte: { ph: true, lesend: false, app: "ph_kundenkarte", text: "Kundenkarte (Antrag, DOI, Status, Portal-Karte)" },
  service: { ph: true, lesend: false, app: "ph_service", text: "Reklamation von der Website (create_service_case; alt: Anfrage über create_contact)" },
  bewerbung: { ph: true, lesend: false, app: "ph_personal", text: "Bewerbungsformular der Stellenseiten (create_bewerbung + attach_unterlage; alt: E-Mail)" },
  cms: { ph: false, lesend: true, app: "platzhirsch_studio", text: "News, Homepage, Team, Keywords (bleiben in platzhirsch_studio)" },
  wunschliste: { ph: true, lesend: false, app: "ph_shop", text: "Wunschliste (create/get/get_by_share/update/remove_wishlist; nur mit WUNSCHLISTE_STORAGE=frappe, sonst lokal)" },
  ideenboard: { ph: true, lesend: false, app: "ph_marketing", text: "Ideenboard-Teilen (create/get/get_by_share/update/remove_ideenboard; nur mit IDEENBOARD_STORAGE=ph, sonst lokal)" },
  bewertung: { ph: true, lesend: false, app: "ph_marketing", text: "Bewertungen /bewerten (create_bewertung, get_bewertungen; alt: kein Formular, Übersicht leer)" },
});

export const PROTECTED_HOSTS = Object.freeze(["backoffice.platzhirsch.studio"]);
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/;

const s = (v) => String(v ?? "").trim();
const truthy = (v) => v === "1" || s(v).toLowerCase() === "true";

const warned = new Set();
function warnOnce(key, text, logger = console) {
  if (warned.has(key)) return;
  warned.add(key);
  try {
    logger.warn(`[backend] ${text}`);
  } catch {
    // Logging darf nie stören.
  }
}

/** "a, b ,c" → Set(["a","b","c"]); "alle" / "*" → alle Gruppen mit ph-Adapter. */
export function parseGruppen(value) {
  const list = s(value)
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (list.includes("alle") || list.includes("*")) return new Set(Object.keys(GRUPPEN).filter((g) => GRUPPEN[g].ph));
  return new Set(list.filter((g) => GRUPPEN[g]));
}

/** Basis-Generation aus BACKEND_GENERATION (unbekannte Werte → alt). */
export function baseGeneration(env = process.env) {
  const v = s(env.BACKEND_GENERATION).toLowerCase();
  if (!v) return "alt";
  if (GENERATIONEN.includes(v)) return v;
  warnOnce(`gen:${v}`, `BACKEND_GENERATION="${v}" unbekannt – es gilt "alt".`);
  return "alt";
}

/** Gewünschte Generation einer Gruppe (ohne Blick auf die Konfiguration). */
export function requestedGeneration(gruppe, env = process.env) {
  const g = GRUPPEN[gruppe];
  if (!g) throw new Error(`Unbekannte Backend-Gruppe "${gruppe}"`);
  if (!g.ph) return "alt";
  if (baseGeneration(env) === "ph") return parseGruppen(env.BACKEND_ALT_GRUPPEN).has(gruppe) ? "alt" : "ph";
  return parseGruppen(env.BACKEND_PH_GRUPPEN).has(gruppe) ? "ph" : "alt";
}

/** "token key:secret" | "key:secret" → { key, secret } oder null. */
export function parseToken(value) {
  const raw = s(value).replace(/^token\s+/i, "");
  const i = raw.indexOf(":");
  if (i <= 0 || i === raw.length - 1) return null;
  const key = raw.slice(0, i).trim();
  const secret = raw.slice(i + 1).trim();
  return key && secret ? { key, secret } : null;
}

/**
 * Zugang zur ph-Site. { ok: true, url, key, secret } oder { ok: false, reason }.
 * reason: url_fehlt | url_ungueltig | nur_https | token_fehlt | geschuetzt
 */
export function phAccess(env = process.env) {
  const url = s(env.BACKEND_PH_URL).replace(/\/+$/, "");
  if (!url) return { ok: false, reason: "url_fehlt" };
  let u;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, reason: "url_ungueltig" };
  }
  const prod = env.NODE_ENV === "production";
  if (u.protocol !== "https:") {
    const httpOk = u.protocol === "http:" && (LOCAL_HOST.test(u.hostname) || (!prod && truthy(env.BACKEND_PH_ALLOW_HTTP)));
    if (!httpOk) return { ok: false, reason: "nur_https" };
  }
  const host = u.hostname.toLowerCase();
  if (PROTECTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) && !(prod && truthy(env.BACKEND_PH_LIVE))) {
    return { ok: false, reason: "geschuetzt" };
  }
  const token = parseToken(env.BACKEND_PH_TOKEN);
  if (!token) return { ok: false, reason: "token_fehlt" };
  return { ok: true, url, ...token };
}

/** Zugang oder null (für Adapter, die { url, key, secret } erwarten). */
export function phConfig(env = process.env) {
  const a = phAccess(env);
  return a.ok ? { url: a.url, key: a.key, secret: a.secret } : null;
}

/**
 * Ergebnis für eine Gruppe:
 *   { gruppe, generation: "alt" }
 *   { gruppe, generation: "ph", ph: { url, key, secret } }
 *   { gruppe, generation: "ph", ph: null, problem }   (nur schreibende Gruppen)
 * Lesende Gruppen ohne ph-Zugang fallen auf alt zurück (Warnung einmal je Grund).
 */
export function resolveBackend(gruppe, env = process.env) {
  if (requestedGeneration(gruppe, env) === "alt") return { gruppe, generation: "alt" };
  const access = phAccess(env);
  if (access.ok) return { gruppe, generation: "ph", ph: { url: access.url, key: access.key, secret: access.secret } };
  if (GRUPPEN[gruppe].lesend) {
    warnOnce(`fallback:${gruppe}:${access.reason}`, `Gruppe ${gruppe}: ph gewünscht, aber BACKEND_PH_* unvollständig (${access.reason}) – liest weiter alt.`);
    return { gruppe, generation: "alt", problem: access.reason };
  }
  warnOnce(`off:${gruppe}:${access.reason}`, `Gruppe ${gruppe}: ph gewünscht, aber BACKEND_PH_* unvollständig (${access.reason}) – nichts wird gesendet.`);
  return { gruppe, generation: "ph", ph: null, problem: access.reason };
}

/** "alt" | "ph" – wirksame Generation einer Gruppe. */
export function backendGeneration(gruppe, env = process.env) {
  return resolveBackend(gruppe, env).generation;
}

export const isPh = (gruppe, env = process.env) => backendGeneration(gruppe, env) === "ph";

/** Übersicht aller Gruppen (Diagnose, Bericht). Ohne Schlüssel. */
export function backendOverview(env = process.env) {
  const access = phAccess(env);
  return {
    basis: baseGeneration(env),
    phZugang: access.ok ? { ok: true, url: access.url } : { ok: false, reason: access.reason },
    gruppen: Object.fromEntries(
      Object.keys(GRUPPEN).map((g) => {
        const r = resolveBackend(g, env);
        return [g, r.problem ? `${r.generation} (${r.problem})` : r.generation];
      })
    ),
  };
}

/** Namen aller Umgebungsvariablen der Umschaltung (Doku; Werte stehen nie im Code). */
export const ENV_NAMES = Object.freeze([
  "BACKEND_GENERATION",
  "BACKEND_PH_GRUPPEN",
  "BACKEND_ALT_GRUPPEN",
  "BACKEND_PH_URL",
  "BACKEND_PH_TOKEN",
  "BACKEND_PH_LIVE",
  "BACKEND_PH_ALLOW_HTTP",
  "BACKEND_PH_CLIENT_SALT",
]);

// ── Besucher-Kennung X-PH-Client (ph_core utils/ratelimit.py) ────────────────
//
// ph_core zählt das Rate-Limit der Website-Rolle je Client. Die Kennung ist
// sha256(Besucher-IP + BACKEND_PH_CLIENT_SALT) als Hex – die IP selbst geht
// nie ans Backend. Ohne Salz: kein Header (heutiges Verhalten, ein Eimer je
// Methode). Die IP kommt aus dem Besucher-Request:
//   1. ausdrücklich (Option visitorIp / Request-Objekt),
//   2. sonst aus next/headers – nur innerhalb eines Requests; außerhalb
//      (node --test, Hintergrundjobs) kein Header.
// Gast-Methoden ignorieren den Header (ratelimit.client_kennung) – Adapter
// für Gast-Methoden senden ihn deshalb nicht.

export const PH_CLIENT_HEADER = "X-PH-Client";

/** Salz aus der Server-Umgebung oder "" (kein Header). */
export const phClientSalt = (env = process.env) => s(env.BACKEND_PH_CLIENT_SALT);

/** sha256(ip + salz) hex oder null (ohne Salz oder IP). */
export function phClientId(ip, env = process.env) {
  const salt = phClientSalt(env);
  const addr = s(ip);
  if (!salt || !addr || addr === "untrusted") return null;
  return createHash("sha256").update(addr + salt).digest("hex");
}

/**
 * Besucher-IP aus Request-Headern (Headers, Map-artig oder Request).
 * Mit UPLOAD_TRUSTED_IP_HEADER zählt nur dieser Header (wie upload/http clientIp),
 * sonst der letzte Eintrag von X-Forwarded-For bzw. X-Real-IP.
 */
export function visitorIpFrom(source, env = process.env) {
  const h = source?.headers && typeof source.headers.get === "function" ? source.headers : source;
  if (!h || typeof h.get !== "function") return null;
  const last = (v) => s(String(v || "").split(",").pop()) || null;
  const trusted = s(env.UPLOAD_TRUSTED_IP_HEADER).toLowerCase();
  if (trusted) return last(h.get(trusted));
  return last(h.get("x-forwarded-for")) || last(h.get("x-real-ip"));
}

/** Steuerfehler von Next (dynamische Nutzung, redirect, notFound) – dürfen nicht verschluckt werden. */
const isNextSignal = (err) => Boolean(err && typeof err === "object" && typeof err.digest === "string");

/** Besucher-IP des laufenden Requests über next/headers oder null. */
export async function requestVisitorIp(env = process.env) {
  try {
    const mod = await import("next/headers");
    const h = await mod.headers();
    return visitorIpFrom(h, env);
  } catch (err) {
    if (isNextSignal(err)) throw err;
    return null;
  }
}

/**
 * { "X-PH-Client": id } oder {}.
 * client: false → nie (Webhooks, Hintergrundjobs); client: "<hex>" → fester Wert;
 * visitorIp / request → IP ausdrücklich; sonst next/headers (nur mit Salz).
 */
export async function phClientHeaders({ env = process.env, visitorIp, request, client } = {}) {
  if (client === false) return {};
  if (typeof client === "string" && /^[0-9a-f]{16,64}$/i.test(client)) return { [PH_CLIENT_HEADER]: client.toLowerCase() };
  if (!phClientSalt(env)) return {};
  const ip = visitorIp ?? (request ? visitorIpFrom(request, env) : await requestVisitorIp(env));
  const id = phClientId(ip, env);
  return id ? { [PH_CLIENT_HEADER]: id } : {};
}

// ── HTTP an die ph-Site ──────────────────────────────────────────────────────

export const PH_TIMEOUT_MS = 10_000;

/** Fehlercodes der ph-Apps (ph_core ph_api, CONVENTIONS §11). */
export const PH_CODES = Object.freeze([
  "invalid",
  "forbidden",
  "not_found",
  "invalid_token",
  "conflict",
  "slot_taken",
  "too_late_to_change",
  "expired",
  "verify_expired",
  "cancelled",
  "outside_window",
  "rate_limited",
  "unavailable",
  "internal",
]);
const PH_CODE_SET = new Set(PH_CODES);
const STATUS_CODES = { 400: "invalid", 401: "forbidden", 403: "forbidden", 404: "not_found", 409: "conflict", 410: "expired", 413: "invalid", 415: "invalid", 417: "invalid", 422: "outside_window", 429: "rate_limited", 503: "unavailable" };

export function phMethodUrl(cfg, method) {
  return `${String(cfg.url).replace(/\/+$/, "")}/api/method/${method}`;
}

export function phAuthHeader(cfg) {
  return `token ${cfg.key}:${cfg.secret}`;
}

/** Fehlercode aus einer ph-Antwort: body.code / body.message.code, sonst nach HTTP-Status. */
export function phErrorCode(status, body) {
  const named = body?.code || body?.message?.code;
  if (PH_CODE_SET.has(named)) return named;
  return STATUS_CODES[status] || (status >= 500 ? "unavailable" : "invalid");
}

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined));

/**
 * Ein Aufruf an die ph-Site. Wirft nie.
 * → { ok: true, status, message } | { ok: false, status, code, detail? }
 * GET: Parameter als Query (null/"" weggelassen, Objekte als JSON);
 * POST: JSON-Body (undefined weggelassen). ph_api-Methoden ohne **kwargs
 * vertragen keine Zusatzparameter – Adapter senden nur dokumentierte Felder.
 * X-PH-Client: siehe phClientHeaders (Optionen env, visitorIp, request, client).
 */
export async function phCall(cfg, method, { get = false, params = {}, fetchImpl = globalThis.fetch, timeoutMs = PH_TIMEOUT_MS, body, headers, env = process.env, visitorIp, request, client } = {}) {
  const endpoint = phMethodUrl(cfg, method);
  const clientHeaders = await phClientHeaders({ env, visitorIp, request, client });
  let url = endpoint;
  if (get) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v == null || v === "") continue;
      qs.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
    const q = qs.toString();
    if (q) url += `?${q}`;
  }
  let res;
  try {
    res = await fetchImpl(url, {
      method: get ? "GET" : "POST",
      headers: { Authorization: phAuthHeader(cfg), Accept: "application/json", ...(get || body ? {} : { "Content-Type": "application/json" }), ...clientHeaders, ...(headers || {}) },
      body: get ? undefined : body !== undefined ? body : JSON.stringify(clean(params)),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return { ok: false, status: null, code: "unavailable", detail: timeout ? "timeout" : "network" };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) return { ok: false, status: res.status, code: phErrorCode(res.status, data) };
  return { ok: true, status: res.status, message: data?.message };
}
