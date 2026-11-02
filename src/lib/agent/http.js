// src/lib/agent/http.js – HTTP-Schicht des MCP-Servers (Streamable HTTP, zustandslos).
// Getrennt von route.js, damit node --test sie mit echten Request-Objekten
// prüfen kann (Rate-Limit, Größe, Protokoll-Header, CORS).
//
// Spezifikation (MCP 2025-11-25, Transports → Streamable HTTP):
// - POST: genau eine JSON-RPC-Nachricht; Anfrage → 200 application/json,
//   Benachrichtigung/Antwort → 202 ohne Inhalt.
// - GET: Server bietet keinen SSE-Strom an → 405 Method Not Allowed.
// - DELETE: keine Sitzungen → 405.
// - MCP-Protocol-Version: unbekannte Version → 400.
// Herkunft (Spezifikation „Security Warning“: Origin prüfen, Schutz vor DNS-
// Rebinding; r1-technik Abschn. 3): Anfragen OHNE Origin-Header (Assistenten,
// Server-Clients, curl) sind erlaubt. Mit Origin nur die eigene Website
// (gleicher Host wie die Anfrage, platzhirsch.studio, www.) und, was
// AGENT_ALLOWED_ORIGINS (Komma-Liste) ausdrücklich freigibt. Fremde Browser-
// Origins → 403, vor Rate-Limit und Body. Die CORS-Kopfzeilen bleiben, damit
// freigegebene Origins die Antwort lesen können.
// Schreibend ist nur request_appointment (nur im Modus dryrun/live), und das
// verschickt höchstens eine Bestätigungs-E-Mail (Double-Opt-in), gebremst
// durch das Rate-Limit.
// Rein: node --test lädt es direkt.
import { MAX_BODY_BYTES, PAGE_PATH, PROTOCOL_VERSIONS, SITE_ORIGIN } from "./config.js";
import { ERR, handleMessage, parseBody, rpcError } from "./jsonrpc.js";
import { clientIp } from "./rate.js";

export const CORS = Object.freeze({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
});

const BASE_HEADERS = { ...CORS, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export function json(body, status = 200, headers = {}) {
  if (body === null) return new Response(null, { status, headers: { ...BASE_HEADERS, ...headers } });
  return Response.json(body, { status, headers: { ...BASE_HEADERS, ...headers } });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: BASE_HEADERS });
}

export function methodNotAllowed() {
  return json(
    { jsonrpc: "2.0", id: null, error: { code: ERR.INVALID_REQUEST, message: `Method not allowed. This MCP server is stateless and speaks JSON over POST only. Documentation: ${SITE_ORIGIN}${PAGE_PATH}` } },
    405,
    { Allow: "POST, OPTIONS" }
  );
}

const OWN_ORIGINS = Object.freeze([SITE_ORIGIN, SITE_ORIGIN.replace("://", "://www.")]);

/** Origins aus AGENT_ALLOWED_ORIGINS (nur vollständige http(s)-Origins). */
export function allowedOriginsFrom(env = {}) {
  return String(env.AGENT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter((s) => /^https?:\/\/[^/\s]+$/.test(s));
}

/**
 * Darf diese Anfrage herein? Ohne Origin ja; sonst nur eigene oder
 * freigegebene Origins. Der eigene Host kommt aus Host bzw. X-Forwarded-Host
 * (Entwicklung: localhost:3000, Prüfserver).
 */
export function originAllowed(headers, extra = []) {
  const origin = headers.get("origin");
  if (origin === null || origin === "") return true;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (OWN_ORIGINS.includes(url.origin) || extra.includes(url.origin)) return true;
  const host = (headers.get("x-forwarded-host") || headers.get("host") || "").split(",")[0].trim().toLowerCase();
  return Boolean(host) && url.host.toLowerCase() === host;
}

async function readCapped(request, max) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > max) return null;
  const text = await request.text();
  return new TextEncoder().encode(text).length > max ? null : text;
}

/**
 * @param {{ adapter, limiter, now?: () => number, log?: Function }} deps
 * @returns {(request: Request) => Promise<Response>}
 */
export function createMcpPost({ adapter, limiter, now = Date.now, log = () => {}, allowedOrigins = allowedOriginsFrom(typeof process !== "undefined" ? process.env : {}) }) {
  return async function POST(request) {
    try {
      if (!originAllowed(request.headers, allowedOrigins)) {
        return json(rpcError(null, ERR.INVALID_REQUEST, "Origin not allowed. Call this MCP server from an assistant or server, not from another website."), 403);
      }
      const pv = request.headers.get("mcp-protocol-version");
      if (pv && !PROTOCOL_VERSIONS.includes(pv)) {
        return json(rpcError(null, ERR.INVALID_REQUEST, `Unsupported MCP-Protocol-Version: ${pv}. Supported: ${PROTOCOL_VERSIONS.join(", ")}`), 400);
      }
      const ip = clientIp(request.headers);
      const rate = await limiter.message(ip, now());
      if (!rate.ok) {
        return json(rpcError(null, ERR.INVALID_REQUEST, "Rate limit exceeded", { retryAfter: rate.retryAfter }), 429, { "Retry-After": String(rate.retryAfter) });
      }
      const text = await readCapped(request, MAX_BODY_BYTES);
      if (text === null) return json(rpcError(null, ERR.INVALID_REQUEST, "Request too large"), 413);
      const parsed = parseBody(text);
      if (!parsed.ok) return json(parsed.response.body, parsed.response.status);

      const msg = parsed.msg;
      // Terminwunsch: eigenes, strengeres Limit (pro IP + Tagesbudget).
      if (msg?.method === "tools/call" && msg?.params?.name === "request_appointment") {
        const appt = await limiter.appointment(ip, now());
        if (!appt.ok) {
          return json(
            {
              jsonrpc: "2.0",
              id: msg.id ?? null,
              result: {
                content: [{ type: "text", text: JSON.stringify({ error: "rate_limited", message: "Zu viele Terminwünsche in kurzer Zeit. Bitte später erneut versuchen oder anrufen: +43 5574 46255.", retryAfter: appt.retryAfter }) }],
                structuredContent: { error: "rate_limited", retryAfter: appt.retryAfter },
                isError: true,
              },
            },
            429,
            { "Retry-After": String(appt.retryAfter) }
          );
        }
      }

      const { status, body } = await handleMessage(msg, { adapter });
      const headers = msg?.method === "initialize" && body?.result ? { "Mcp-Protocol-Version": body.result.protocolVersion } : {};
      return json(body, status, headers);
    } catch (error) {
      log("[agent] mcp request failed", error);
      return json(rpcError(null, ERR.INTERNAL, "Internal error"), 500);
    }
  };
}
