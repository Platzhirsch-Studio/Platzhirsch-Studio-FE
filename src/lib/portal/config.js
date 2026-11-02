import "server-only";
import path from "node:path";

// Central settings of the customer portal "Mein Platzhirsch".
// Everything that depends on the environment is read here and nowhere else.

export const PORTAL_LOCALE = "de";
export const PORTAL_BASE_PATH = `/${PORTAL_LOCALE}/portal`;
export const PORTAL_LOGIN_PATH = `${PORTAL_BASE_PATH}/login`;

export const SESSION_COOKIE = "ph_portal_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const MAGIC_LINK_TTL_SECONDS = 60 * 15; // 15 minutes

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Local development store (gitignored: /.data/ in .gitignore). */
export const DATA_DIR = path.join(process.cwd(), ".data", "portal");

/** Which data adapter serves the portal: "mock" (default) or "frappe". */
export function adapterName() {
  return (process.env.PORTAL_ADAPTER || "mock").toLowerCase();
}

const DEV_FALLBACK_SECRET = "dev-only-portal-secret-do-not-use-in-production-0000";
let warned = false;

/**
 * HMAC secret for session cookies and magic-link tokens.
 * Production: PORTAL_SESSION_SECRET (>= 32 characters) is mandatory.
 * Development: falls back to a fixed value and warns once in the console.
 */
/**
 * false only in production without a usable PORTAL_SESSION_SECRET. Pages then
 * treat every cookie as "not logged in" (redirect to the login page, which
 * explains that the login is unavailable) instead of answering 500.
 */
export function hasSessionSecret() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  return !IS_PRODUCTION || Boolean(secret && secret.length >= 32);
}

export function sessionSecret() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (IS_PRODUCTION) {
    throw new Error("PORTAL_SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen – Portal-Login deaktiviert.");
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[portal] PORTAL_SESSION_SECRET nicht gesetzt – nutze unsicheren Entwicklungs-Fallback. In Produktion zwingend setzen."
    );
  }
  return DEV_FALLBACK_SECRET;
}

/**
 * Public origin used in magic links and redirects. In production it must come
 * from PORTAL_BASE_URL (never trust the Host header behind a proxy); in
 * development the request origin is fine.
 */
export function publicOrigin(request) {
  const configured = process.env.PORTAL_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (IS_PRODUCTION) return "https://platzhirsch.studio";
  return request ? new URL(request.url).origin : "http://localhost:3000";
}
