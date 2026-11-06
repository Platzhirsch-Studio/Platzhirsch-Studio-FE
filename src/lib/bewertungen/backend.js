// src/lib/bewertungen/backend.js – Bewertungen an ph_marketing (Gruppe "bewertung").
//
//   ph  POST ph_marketing.api.create_bewertung (Token, idempotent über idempotency_key)
//       sterne?, text?, name?, email?, anlass?, quelle?, einwilligung_veroeffentlichung?,
//       textversion?, seite?  → { referenz, status, email (maskiert) }
//       GET ph_marketing.api.get_bewertungen(limit ≤ 100, quelle?)
//       → { count, average, reviews[{ id, author, rating, text, date, source, occasion, reply }] }
//       (Backend-Import/ph_marketing/ph_marketing/api/__init__.py; veröffentlicht wird nur mit
//       Einwilligung, nie nach Sternen ausgewählt, Name gekürzt, Kontaktdaten aus dem Text entfernt).
//   alt platzhirsch_studio hat keine Bewertungen: kein Formular, Übersicht leer (Leerzustand).
//       Es werden keine Bewertungen erfunden oder aus einer lokalen Datei gezeigt.
//
// X-PH-Client: create_bewertung läuft im Besucher-Request (phCall → next/headers bzw.
// visitorIp). Die öffentliche Liste ist nicht besucherbezogen und wird kurz gecacht –
// dort ohne Header (client: false), damit die Seite nicht von headers() abhängt.
//
// Rein (relative Importe; fetch wird übergeben).
import { phCall, resolveBackend } from "../backend/config.js";
import { EINWILLIGUNG_TEXTVERSION } from "./schema.js";

export const PH_CREATE_METHOD = "ph_marketing.api.create_bewertung";
export const PH_LIST_METHOD = "ph_marketing.api.get_bewertungen";
export const LIST_LIMIT = 20;
/** Sekunden, die die Übersicht im Daten-Cache bleibt (neue Freigaben erscheinen danach). */
export const LIST_REVALIDATE_S = 300;
export const BEWERTEN_PATH = "/de/bewerten";

export const EMPTY_LIST = Object.freeze({ count: 0, average: null, reviews: Object.freeze([]) });

/** Formular sichtbar und Übersicht aus ph? Nur mit Gruppe "bewertung" auf ph UND Zugang. */
export function bewertungBackend(env = process.env) {
  const t = resolveBackend("bewertung", env);
  return { generation: t.generation, ph: t.generation === "ph" ? t.ph || null : null };
}

export const bewertungFormAvailable = (env = process.env) => Boolean(bewertungBackend(env).ph);

/** Parameter für create_bewertung (nur dokumentierte Felder, kein Gating). */
export function phBewertungPayload(d, { leadRef } = {}) {
  return {
    sterne: d.sterne ?? undefined,
    text: d.text || undefined,
    name: d.name || undefined,
    email: d.email || undefined,
    anlass: d.anlass || undefined,
    quelle: d.quelle || "direkt",
    einwilligung_veroeffentlichung: d.einwilligung ? 1 : 0,
    textversion: d.einwilligung ? EINWILLIGUNG_TEXTVERSION : undefined,
    seite: BEWERTEN_PATH,
    idempotency_key: d.idem || leadRef || undefined,
  };
}

/**
 * @returns {Promise<{ ok: true, referenz: string|null, status: string|null, generation: "ph" } |
 *   { ok: false, code: string, field?: string, generation: string }>}
 *   code: not_available (alt) | not_configured | invalid | rate_limited | unavailable
 */
export async function sendBewertung(data, { env = process.env, fetchImpl = globalThis.fetch, leadRef = null, visitorIp, request } = {}) {
  const b = bewertungBackend(env);
  if (b.generation !== "ph") return { ok: false, code: "not_available", generation: "alt" };
  if (!b.ph) return { ok: false, code: "not_configured", generation: "ph" };
  const r = await phCall(b.ph, PH_CREATE_METHOD, { params: phBewertungPayload(data, { leadRef }), fetchImpl, env, visitorIp, request });
  if (!r.ok) {
    const code = r.code === "invalid" || r.code === "rate_limited" ? r.code : "unavailable";
    return { ok: false, code, generation: "ph" };
  }
  return { ok: true, referenz: r.message?.referenz || null, status: r.message?.status || null, generation: "ph" };
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Eine Bewertung aus get_bewertungen → Anzeigeform; ungültige Einträge → null. */
export function mapReview(r) {
  if (!r || typeof r !== "object") return null;
  const rating = Number(r.rating);
  const text = str(r.text, 4000);
  const stars = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
  if (!stars && !text) return null;
  return {
    id: str(String(r.id ?? ""), 140) || null,
    author: str(r.author, 60),
    rating: stars,
    text,
    date: typeof r.date === "string" && DATE_RE.test(r.date) ? r.date : null,
    source: r.source === "google" ? "google" : "direkt",
    occasion: str(r.occasion, 40) || null,
    reply: str(r.reply, 4000) || null,
  };
}

/** Antwort von get_bewertungen → { count, average, reviews }; alles Unklare → leer. */
export function mapList(message) {
  if (!message || typeof message !== "object") return EMPTY_LIST;
  const reviews = (Array.isArray(message.reviews) ? message.reviews : []).map(mapReview).filter(Boolean);
  const count = Number.isInteger(message.count) && message.count >= reviews.length ? message.count : reviews.length;
  const avg = Number(message.average);
  const average = count > 0 && Number.isFinite(avg) && avg >= 1 && avg <= 5 ? Math.round(avg * 10) / 10 : null;
  return { count, average, reviews };
}

/** Fetch mit kurzem Daten-Cache statt no-store (nur für die öffentliche Liste). */
export const cachedFetch =
  (base = globalThis.fetch) =>
  (url, init = {}) => {
    const { cache: _cache, ...rest } = init;
    return base(url, { ...rest, next: { revalidate: LIST_REVALIDATE_S, tags: ["bewertungen"] } });
  };

/**
 * Veröffentlichte Bewertungen. alt bzw. ph ohne Zugang oder bei Fehlern: EMPTY_LIST
 * (Leerzustand; die Seite zeigt dann keine Zahlen).
 * @returns {Promise<{ count: number, average: number|null, reviews: object[], generation: string, error?: string }>}
 */
export async function loadBewertungen({ env = process.env, fetchImpl, limit = LIST_LIMIT } = {}) {
  const b = bewertungBackend(env);
  if (!b.ph) return { ...EMPTY_LIST, generation: b.generation };
  const r = await phCall(b.ph, PH_LIST_METHOD, {
    get: true,
    params: { limit: Math.max(1, Math.min(Number(limit) || LIST_LIMIT, 100)) },
    fetchImpl: fetchImpl || cachedFetch(),
    env,
    client: false,
  });
  if (!r.ok) return { ...EMPTY_LIST, generation: "ph", error: r.code };
  return { ...mapList(r.message), generation: "ph" };
}
