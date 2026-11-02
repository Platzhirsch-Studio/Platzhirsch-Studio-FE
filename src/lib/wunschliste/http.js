// src/lib/wunschliste/http.js — Hilfen der Route-Handler unter /api/wunschliste.
import "server-only";
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/forms/origin";
import { clientIp } from "@/lib/upload/http";
import { WishlistError, limited } from "./service";
import { wunschlisteAvailable } from "./mode";
import { fieldsOf } from "./schemas";

export const NO_STORE = Object.freeze({
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
});

export const json = (data, status = 200, extra = {}) => NextResponse.json(data, { status, headers: { ...NO_STORE, ...extra } });

export function fail(error) {
  if (error instanceof WishlistError) return json({ ok: false, error: error.code }, error.status);
  console.error("[wunschliste]", error);
  return json({ ok: false, error: "server_error" }, 500);
}

const MAX_BYTES = 64 * 1024;

/**
 * Rate-Limit je Besucher (QA Technik P1-4). Mit UPLOAD_TRUSTED_IP_HEADER
 * zählt die IP aus diesem Header. Ohne ihn hätten sich bisher ALLE Besucher
 * einen Schlüssel („untrusted“) geteilt – ein Einzelner konnte die Funktion
 * für alle sperren. Jetzt: Schlüssel aus dem letzten Eintrag von
 * X-Forwarded-For bzw. X-Real-IP (vom nächsten Proxy gesetzt), dazu eine
 * Obergrenze für die ganze Instanz (20 × Limit) gegen gefälschte Header.
 * Deploy-Checkliste: UPLOAD_TRUSTED_IP_HEADER bleibt empfohlen.
 */
export function visitorKey(request) {
  const trusted = clientIp(request);
  if (trusted !== "untrusted") return trusted;
  const fwd = (request.headers.get("x-forwarded-for") || "").split(",").pop().trim();
  return `fb:${(fwd || request.headers.get("x-real-ip") || "anon").slice(0, 64)}`;
}

function rateLimited(request, scope, rate) {
  const key = visitorKey(request);
  if (limited(`${scope}:${key}`, rate)) return true;
  if (key.startsWith("fb:")) return limited(`${scope}:global`, { limit: rate.limit * 20, windowMs: rate.windowMs });
  return false;
}

/**
 * Gemeinsame Prüfung jeder POST-Anfrage: Schalter, Herkunft, Rate-Limit,
 * Größe, JSON, Schema. Liefert { data } oder { response }.
 */
export async function readBody(request, schema, { rate, scope }) {
  if (!wunschlisteAvailable()) return { response: json({ ok: false, error: "unavailable" }, 503) };
  if (!isSameOriginRequest(request)) return { response: json({ ok: false, error: "forbidden" }, 403) };
  if (rateLimited(request, scope, rate)) {
    return { response: json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": "300" }) };
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BYTES) return { response: json({ ok: false, error: "too_large" }, 413) };
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BYTES) return { response: json({ ok: false, error: "too_large" }, 413) };
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    return { response: json({ ok: false, error: "bad_request" }, 400) };
  }
  // Honigtopf: still „ok“ melden, nichts speichern.
  if (body && typeof body === "object" && body.website) return { response: json({ ok: true, ignored: true }) };
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { response: json({ ok: false, error: "invalid", fields: fieldsOf(parsed.error) }, 422) };
  return { data: parsed.data };
}
