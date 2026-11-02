// src/lib/ideenboard/http.js — Bausteine der /api/ideenboard/*-Routen.
// Same-Origin wie bei Termin und Formularen (src/lib/forms/origin.js),
// Body-Limit, no-store. Keine "@/..."-Importe.
import { allowedHosts } from "../forms/origin.js";
import { clientIp } from "../forms/rateLimit.js";
import { LIMITS } from "./config.js";

export const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export const json = (body, status = 200) => Response.json(body, { status, headers: NO_STORE });
export const fail = (code, status) => json({ ok: false, code }, status);

export function isSameOrigin(request, env = process.env) {
  const h = request.headers;
  const site = (h.get("sec-fetch-site") || "").trim().toLowerCase();
  if (site === "cross-site" || site === "same-site") return false;
  const origin = (h.get("origin") || "").trim();
  if (origin && origin !== "null") {
    try {
      return allowedHosts([h], env).has(new URL(origin).host.toLowerCase());
    } catch {
      return false;
    }
  }
  if (site) return site === "same-origin" || site === "none";
  return origin !== "null";
}

export const ipOf = (request) => clientIp(request) || "unknown";

export async function readJsonBody(request, max = LIMITS.body) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return null;
  const len = Number(request.headers.get("content-length") || 0);
  if (len > max) return null;
  const text = await request.text().catch(() => null);
  if (text == null || Buffer.byteLength(text) > max) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
