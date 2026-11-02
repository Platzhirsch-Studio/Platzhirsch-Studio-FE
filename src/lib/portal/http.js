import "server-only";
import { NextResponse } from "next/server";
import { publicOrigin } from "./config";

// Helpers for portal route handlers.

/**
 * CSRF guard for state-changing requests: the request must come from our own
 * origin (Origin header, or Sec-Fetch-Site for browsers that omit Origin).
 */
export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  const own = new Set([new URL(request.url).origin, publicOrigin(request)]);
  // Pages with referrer "no-referrer" (login/bestaetigen, the token is in its
  // URL) make browsers send `Origin: null` on form posts – decide by
  // Sec-Fetch-Site then, like without an Origin header.
  if (origin && origin !== "null") return own.has(origin);
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}

/** 303 redirect to a path on our public origin (POST -> GET). */
export function redirectTo(request, pathWithQuery) {
  return NextResponse.redirect(new URL(pathWithQuery, publicOrigin(request)), 303);
}

/** Accepts form posts (progressive enhancement) and JSON. */
export async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try {
      return { data: await request.json(), json: true };
    } catch {
      return { data: {}, json: true };
    }
  }
  const form = await request.formData();
  return { data: Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")), json: false };
}

/**
 * Schlüssel fürs Rate-Limit. Der ERSTE Eintrag von X-Forwarded-For stammt vom
 * Client und lässt sich fälschen (QA Technik P2-2, 29.10.2026). Deshalb:
 * gesetzter vertrauenswürdiger Header (UPLOAD_TRUSTED_IP_HEADER, wie beim
 * Handy-Upload) → dessen letzter Eintrag; sonst der LETZTE Eintrag von
 * X-Forwarded-For (vom nächsten Proxy angehängt); sonst "local".
 */
export function clientIp(request) {
  const trusted = process.env.UPLOAD_TRUSTED_IP_HEADER;
  const raw = (trusted && request.headers.get(trusted.toLowerCase())) || request.headers.get("x-forwarded-for") || "";
  return raw.split(",").pop().trim() || "local";
}

export const noStore = { "Cache-Control": "no-store" };
