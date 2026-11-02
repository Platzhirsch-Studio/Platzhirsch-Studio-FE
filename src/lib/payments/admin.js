// src/lib/payments/admin.js
// Berechtigung der Mitarbeitenden-Endpunkte (/api/payments/anzahlung,
// /api/payments/register): Kopfzeile `Authorization: Bearer <PAYMENTS_ADMIN_SECRET>`.
// Ohne gesetztes Geheimnis (≥ 32 Zeichen) sind die Endpunkte gesperrt (404).
// Vergleich zeitkonstant; Fehlversuche je IP begrenzt (10 / 10 min).
// Einbaupunkt Portal-Rolle: sobald das Portal eine Mitarbeitenden-Rolle hat,
// kann `authorizeAdmin` zusätzlich eine Sitzung mit Rolle "team" akzeptieren
// (siehe Doku stripe-zahlung.md, Abschnitt "Portal").
// Keine "@/..."-Importe.
import { adminSecret } from "./config.js";
import { safeEqual } from "./codes.js";
import { clientIp, createRateLimiter } from "../forms/rateLimit.js";

export const FAIL_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 };
const defaultLimiter = createRateLimiter();

/**
 * → { ok: true } | { ok: false, response }
 */
export function authorizeAdmin(request, { env = process.env, limiter = defaultLimiter, now = Date.now() } = {}) {
  const secret = adminSecret(env);
  if (!secret) return { ok: false, response: Response.json({ success: false, code: "not_found" }, { status: 404 }) };
  const key = `payments-admin:${clientIp(request) || "none"}`;
  // Nach 10 Fehlversuchen ist die IP für das Zeitfenster gesperrt, auch mit richtigem Geheimnis.
  if (!limiter.peek(key, FAIL_LIMIT, now).ok) return { ok: false, response: Response.json({ success: false, code: "rate_limited" }, { status: 429 }) };
  const header = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (m && safeEqual(m[1].trim(), secret)) return { ok: true };
  limiter.take(key, FAIL_LIMIT, now);
  console.warn("[payments] admin: Zugriff abgelehnt");
  return { ok: false, response: Response.json({ success: false, code: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } }) };
}
