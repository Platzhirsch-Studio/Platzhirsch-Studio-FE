// src/instrumentation.js
// Server error logging (Next.js instrumentation, onRequestError).
//
// Writes ONE structured JSON line per captured server error to stderr — no
// external service (decision E11 is still open). Deliberately left out: request
// headers (cookies, IPs, user agent), request body, query strings, full stack
// traces, and anything token- or e-mail-like in path or message. The `digest`
// matches the one shown/logged by src/app/[locale]/error.js and
// src/app/global-error.js, so a visitor's report can be traced.

const MAX_MESSAGE = 300;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_ONE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const QUERY = /\?[^\s"']*/g;
// Opaque segments (base64url upload tokens, magic-link codes): mixed case +
// digits, 16+ chars. Lowercase slugs (products, brands) stay readable.
const TOKENISH = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9._~-]{16,}$/;

// Lowercase hex ids / UUIDs (24+ hex chars) are never readable slugs either.
const HEXISH = /^(?:[0-9a-f]{24,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
// Dynamic route segments whose VALUE is a secret or a personal record id:
// /[locale]/upload/[token], /api/upload/[token]/files/[fileId],
// /[locale]/portal/pass/[id], /api/portal/dokumente/[id], …
// Readable placeholders ([locale], [slug], [title], [collection], …) stay.
const SECRET_PARAM = /^\[{1,2}(?:\.\.\.)?(?:[a-z]*id|token|code|key|secret|hash|pass(?:word)?|sig(?:nature)?|magic)\]{1,2}$/i;

function redactText(text) {
  return String(text).replace(EMAIL, "[email]").replace(QUERY, "?[query]").slice(0, MAX_MESSAGE);
}

// "/[locale]/(shop)/upload/[token]" -> ["[locale]", "upload", "[token]"]:
// route groups and parallel-route slots do not appear in the URL.
function routeSegments(routePath) {
  if (!routePath || typeof routePath !== "string") return null;
  return routePath
    .split("/")
    .filter((s) => s !== "" && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
}

function heuristic(segment) {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // keep raw segment
  }
  if (EMAIL_ONE.test(decoded)) return "[email]";
  return TOKENISH.test(decoded) || HEXISH.test(decoded) || decoded.length > 64 ? "[redacted]" : segment;
}

// Deterministic first: when Next tells us the route (context.routePath), the
// segment under a secret placeholder is replaced by the placeholder itself
// ("/de/upload/[token]"), whatever the value looks like. A catch-all with a
// secret name redacts everything after it. The heuristic stays as a second
// net for every other segment (and when routePath is missing or does not line
// up, e.g. after a rewrite that changes the segment count).
export function sanitizePath(path, routePath) {
  const pathname = String(path || "").split("?")[0].split("#")[0];
  const parts = pathname.split("/");
  const route = routeSegments(routePath);
  const values = parts.filter((s) => s !== "");
  const catchAll = route ? route.findIndex((s) => s.includes("...")) : -1;
  const aligned = route && (catchAll >= 0 ? values.length >= catchAll : values.length === route.length);

  let index = -1;
  return parts
    .map((segment) => {
      if (segment === "") return segment;
      index += 1;
      if (aligned) {
        const placeholder = catchAll >= 0 && index >= catchAll ? route[catchAll] : route[index];
        if (placeholder && SECRET_PARAM.test(placeholder)) return placeholder.replace(/^\[\[|\]\]$/g, (b) => b[0]).replace("...", "");
      }
      return heuristic(segment);
    })
    .join("/");
}

export function buildErrorLogEntry(err, request, context) {
  const isObj = typeof err === "object" && err !== null;
  const entry = {
    src: "next",
    level: "error",
    event: "request_error",
    time: new Date().toISOString(),
    name: isObj && err.name ? String(err.name) : typeof err,
    message: redactText(isObj && "message" in err ? err.message : err),
    digest: isObj && "digest" in err && err.digest != null ? String(err.digest) : null,
    method: request?.method || null,
    path: sanitizePath(request?.path, context?.routePath),
    route: context?.routePath || null,
    routeType: context?.routeType || null,
    routerKind: context?.routerKind || null,
    renderSource: context?.renderSource || null,
    revalidateReason: context?.revalidateReason || null,
    runtime: process.env.NEXT_RUNTIME || "nodejs",
  };
  // Extra fields from BackofficeError (src/lib/api/http.js), all non-personal.
  if (isObj && err.name === "BackofficeError") {
    entry.backoffice = { endpoint: err.endpoint || null, status: err.status ?? null, reason: err.reason || null };
  }
  return entry;
}

export function onRequestError(err, request, context) {
  try {
    console.error(JSON.stringify(buildErrorLogEntry(err, request, context)));
  } catch {
    // Logging must never throw inside Next's error path.
  }
}
