// lib/apiBaseUrl.js

// API Configuration from environment variables
const SERVER = process.env.SERVER;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

export const API_BASE_URL = `${SERVER}/api/method/`;

// Backend for the product/brand endpoints (Produkte New, Marken, Produkte
// Kategorie, Sub Kategorie, Produkte Farbe, Produkte Material, collections) and
// the /cmx file proxy. These are now deployed on SERVER, so they use it too.
// Every one of them is a whitelisted allow_guest method — no credentials
// needed for any fetch* module.
//
// Without SERVER (R4 technik P1-5): DOCUMENTED DEFAULT is the production
// backoffice https://backoffice.platzhirsch.studio (the same default as
// .github/workflows/ci.yml). The former silent fallback to the internal dev
// instance http://10.30.70.201:8000 made a production build without SERVER
// fail with "network_error" (unreachable LAN address) or – worse – ship links
// to a private IP. Only these READ-ONLY guest endpoints use the default;
// API_BASE_URL above (forms, authenticated calls) still needs SERVER, so no
// request is ever sent to the production backoffice by accident.
// A different instance (e.g. the dev backoffice) is set explicitly via SERVER.
export const DEFAULT_BACKOFFICE = "https://backoffice.platzhirsch.studio";
export const NEW_API_SERVER = (SERVER || DEFAULT_BACKOFFICE).replace(/\/+$/, "");
if (!SERVER && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE === "phase-production-build") {
  // Loud, once per build worker – not silent.
  console.warn(`[apiBaseUrl] SERVER is not set: product/brand data is read from the documented default ${DEFAULT_BACKOFFICE}. Set SERVER for any other backoffice.`);
}
export const NEW_API_BASE_URL = `${NEW_API_SERVER}/api/method/`;

// WRITING endpoints (R5, r5-technik P1-1): never the documented default above.
// The newsletter used NEW_API_BASE_URL, so a dev server or a test without
// SERVER created real sign-ups in the production backoffice. Writes go only to
// an explicitly set SERVER; without it there is no request at all:
//   production → 503 { code: "not_configured" } (deploy is misconfigured)
//   dev / test → 503 { code: "not_configured", dev: true } with a clear note
//                that nothing was sent (the form shows its generic error).
// Pure: takes the env, no fetch (tests/unit/r9-p1-newsletter-backoffice.test.mjs).
export function formsBackendBaseUrl(env = process.env) {
  const server = String(env?.SERVER || "").trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(server) ? `${server}/api/method/` : null;
}

export function backofficeNotConfigured(route, env = process.env) {
  const production = env?.NODE_ENV === "production";
  console.warn(`[forms] ${route}: SERVER is not set – nothing sent to any backoffice (${production ? "production: 503" : "dev: not sent"}).`);
  const body = production
    ? { success: false, code: "not_configured" }
    : {
        success: false,
        code: "not_configured",
        dev: true,
        sent: false,
        detail: "SERVER ist nicht gesetzt: In der Entwicklung wird nichts an ein Backoffice gesendet.",
      };
  return Response.json(body, { status: 503, headers: { "Cache-Control": "no-store" } });
}

export function getApiHeaders() {
    if (!API_KEY || !API_SECRET) {
        console.error('Missing API credentials in environment variables');
        throw new Error('API credentials not configured');
    }

    const headers = new Headers();
    headers.append('Authorization', `token ${API_KEY}:${API_SECRET}`);
    headers.append('Content-Type', 'application/json');
    return headers;
}

// Optional: Helper function to check if API is configured
export function isApiConfigured() {
    return !!(API_KEY && API_SECRET);
}