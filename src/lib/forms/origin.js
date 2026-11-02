// src/lib/forms/origin.js
// Herkunftsprüfung of the form routes (Fix-Runde 1, F3 Nr. 9): a POST from a
// browser always carries `Origin` (and usually `Referer`). When one of them
// names a foreign site, the request is a cross-site form post and is refused
// with 403 { success:false, code:"forbidden" } before the body is read and
// before anything reaches the backoffice.
//
// Rules (per header set: the request itself, then the ORIGINAL request headers
// of /api/upload/inquiry/[kind], see requestHeaders.js):
//   - Origin present and not "null"  → its host must be allowed
//   - Origin "null" (sandboxed frame, privacy redirect) → Referer decides; no
//     Referer → refused
//   - no Origin, Referer present     → the Referer's host must be allowed
//   - neither (server-to-server, curl, node --test) → allowed: a browser never
//     sends a cross-site POST without Origin, so this is no CSRF path. The
//     other checks (rate limit, honeypot, time trap, schema) still apply.
// Allowed hosts: the request's own Host / X-Forwarded-Host, the production
// hosts and FORM_ALLOWED_ORIGINS (comma-separated origins or hosts, e.g. a
// staging domain).
// No "@/..." imports: tested directly with `node --test`.

export const SITE_HOSTS = Object.freeze(["platzhirsch.studio", "www.platzhirsch.studio"]);

function hostOf(value) {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function envHosts(env) {
  return String(env?.FORM_ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .map((v) => (v.includes("://") ? hostOf(v) : v))
    .filter(Boolean);
}

const isHeaders = (h) => h && typeof h.get === "function";

/** Hosts this request may come from. */
export function allowedHosts(headerSets, env = process.env) {
  const hosts = new Set([...SITE_HOSTS, ...envHosts(env)]);
  for (const h of headerSets) {
    if (!isHeaders(h)) continue;
    for (const name of ["x-forwarded-host", "host"]) {
      const v = (h.get(name) || "").split(",")[0].trim().toLowerCase();
      if (v) hosts.add(v);
    }
  }
  return hosts;
}

/**
 * originCheck(request, outerHeaders?, env?) → { ok: true } | { ok: false, reason }
 * `outerHeaders`: Headers of the original request (or null).
 */
export function originCheck(request, outerHeaders = null, env = process.env) {
  const sets = [request?.headers, outerHeaders].filter(isHeaders);
  const hosts = allowedHosts(sets, env);
  for (const h of sets) {
    const origin = (h.get("origin") || "").trim();
    const referer = (h.get("referer") || "").trim();
    if (origin && origin !== "null") {
      const host = hostOf(origin);
      if (!host || !hosts.has(host)) return { ok: false, reason: `foreign origin ${host || "?"}` };
      continue;
    }
    if (referer) {
      const host = hostOf(referer);
      if (!host || !hosts.has(host)) return { ok: false, reason: `foreign referer ${host || "?"}` };
      continue;
    }
    if (origin === "null") return { ok: false, reason: "opaque origin without referer" };
  }
  return { ok: true };
}

/** 403 answer in the format of the form routes (code → generic text in the forms). */
export function forbiddenResponse() {
  return Response.json(
    { success: false, code: "forbidden", error: "Forbidden" },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Wraps a POST handler with the check (for routes whose handler lives in
 * another package, e.g. /api/atelier_reservierung, /api/gutschein_anfrage).
 * resolveHeaders: async () => original request Headers (requestHeaders.js).
 */
export function withOriginCheck(handler, { resolveHeaders, env } = {}) {
  return async function POST(request, ctx) {
    let outer = null;
    try {
      outer = typeof resolveHeaders === "function" ? (await resolveHeaders()) || null : null;
    } catch {
      outer = null;
    }
    const check = originCheck(request, outer, env || process.env);
    if (!check.ok) {
      console.warn(`[forms] ${new URL(request.url, "http://x").pathname}: ${check.reason} -> 403`);
      return forbiddenResponse();
    }
    return handler(request, ctx);
  };
}

/**
 * One same-origin rule for every POST route (r8-leads, technik P2 Nr. 11:
 * before, seven local `sameOrigin()` copies compared Origin with `Host` only
 * or with `X-Forwarded-Host || Host`, so a proxy that rewrites Host would have
 * refused real requests on some routes). Built on originCheck (own Host /
 * X-Forwarded-Host, production hosts, FORM_ALLOWED_ORIGINS):
 *   - Sec-Fetch-Site "cross-site" → refused (set by the browser, not by JS)
 *   - Origin / Referer naming a foreign host → refused (originCheck)
 *   - requireOrigin: no Origin is only accepted with Sec-Fetch-Site
 *     "same-origin" (upload tickets, Küchenplaner in production)
 * Each route keeps its own 403 body; this only answers yes/no.
 * @returns {boolean}
 */
export function isSameOriginRequest(request, { requireOrigin = false, env = process.env } = {}) {
  const h = request?.headers;
  if (!isHeaders(h)) return !requireOrigin;
  const site = (h.get("sec-fetch-site") || "").trim().toLowerCase();
  if (site === "cross-site") return false;
  const origin = (h.get("origin") || "").trim();
  if (requireOrigin && (!origin || origin === "null") && site !== "same-origin") return false;
  return originCheck(request, null, env).ok;
}
