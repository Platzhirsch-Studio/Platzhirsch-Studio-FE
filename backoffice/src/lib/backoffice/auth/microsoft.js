// Microsoft-Anmeldung des Backoffice (Inhaber-Entscheidung Nr. 52: Entra ID / OpenID Connect,
// verbunden mit Exchange Online). Ablauf:
//
//   /auth/microsoft/start     → starteAnmeldung(): PKCE + state + nonce ins signierte Flow-Cookie (10 min),
//                               Weiterleitung zu Microsoft (prompt=select_account)
//   /auth/microsoft/callback  → beendeAnmeldung(): state prüfen, Code serverseitig tauschen (Secret ODER
//                               Zertifikat), id_token prüfen (JWKS, iss, aud, nonce, exp, tid), im
//                               Frappe-Modus ph_microsoft.api.sso_sitzung(id_token) → {user,name,roles,standort,sid}
//   Mock-Modus                → derselbe Ablauf gegen einen lokalen Test-Issuer (/auth/microsoft/demo),
//                               Demo-Benutzer per E-Mail wie in mockUsers.js
//
// Außerdem: Login-Arten-Schalter (BACKOFFICE_LOGIN_ARTEN) und Notfall-Passwort nur für Admins.
// Env-Namen nur hier (MS_ENV) und in .env.example. Reines Modul (keine "@/"-Importe, kein server-only).

import { createPrivateKey, generateKeyPairSync, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { BackofficeError } from "../frappe/errors.js";
import { backofficeFetch } from "../frappe/http.js";
import { IS_PRODUCTION, backofficeMode, frappeUrl, mockPassword } from "../config.js";
import { demoBenutzer } from "./mockUsers.js";
import { arbeitsplatz, erlaubteArbeitsplaetze, istAdmin } from "./rechte.js";
import {
  OidcFehler,
  autorisierungsUrl,
  b64url,
  clientAssertion,
  flowCookieLesen,
  flowCookieWert,
  gleich,
  ladeDiscovery,
  ladeJwks,
  pkceChallenge,
  pkcePaar,
  pruefeIdToken,
  signiereJwt,
  tauscheCode,
  zufall,
} from "./oidc.js";

export const MS_ENV = {
  TENANT_ID: "BACKOFFICE_MS_TENANT_ID",
  CLIENT_ID: "BACKOFFICE_MS_CLIENT_ID",
  CLIENT_SECRET: "BACKOFFICE_MS_CLIENT_SECRET",
  /** Zertifikat statt Secret: privater Schlüssel als PEM (\n erlaubt) oder Dateipfad, plus SHA-1-Fingerabdruck. */
  CERT_KEY: "BACKOFFICE_MS_CERT_KEY",
  CERT_KEY_FILE: "BACKOFFICE_MS_CERT_KEY_FILE",
  CERT_THUMBPRINT: "BACKOFFICE_MS_CERT_THUMBPRINT",
  REDIRECT_URI: "BACKOFFICE_MS_REDIRECT_URI",
  /** Zusätzliche Scopes (Leerzeichen/Komma), z. B. "User.Read". */
  SCOPES: "BACKOFFICE_MS_SCOPES",
  /** "1": Abmelden meldet auch bei Microsoft ab (end_session_endpoint). */
  LOGOUT: "BACKOFFICE_MS_LOGOUT",
  LOGIN_ARTEN: "BACKOFFICE_LOGIN_ARTEN",
  NOTFALL_ADMINS: "BACKOFFICE_NOTFALL_ADMINS",
};

export const MS_AUTHORITY = "https://login.microsoftonline.com";
export const BASIS_SCOPES = ["openid", "profile", "email", "offline_access"];
export const LOGIN_ARTEN = ["microsoft", "passwort"];
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --------------------------------------------------------- Einstellungen --

/**
 * Anzeigereihenfolge der Anmeldearten. Standard: Produktion nur "microsoft", sonst "microsoft,passwort".
 * @returns {Array<"microsoft"|"passwort">}
 */
export function loginArten(env = process.env, production = IS_PRODUCTION) {
  const roh = String(env[MS_ENV.LOGIN_ARTEN] || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .map((s) => (s === "password" ? "passwort" : s))
    .filter((s) => LOGIN_ARTEN.includes(s));
  const arten = [...new Set(roh)];
  if (arten.length) return arten;
  return production ? ["microsoft"] : ["microsoft", "passwort"];
}

/** E-Mail-Liste für den Notfall-Passwort-Login (nur Admins), klein geschrieben. */
export function notfallAdmins(env = process.env) {
  return String(env[MS_ENV.NOTFALL_ADMINS] || "")
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
}

/**
 * Darf diese E-Mail das Passwortformular benutzen?
 * @returns {{ok:boolean, notfall:boolean}} notfall=true: nur zugelassen, wenn die Rollen danach Admin sind.
 */
export function passwortZugelassen(email, { env = process.env, production = IS_PRODUCTION } = {}) {
  if (loginArten(env, production).includes("passwort")) return { ok: true, notfall: false };
  const e = String(email || "").trim().toLowerCase();
  return notfallAdmins(env).includes(e) ? { ok: true, notfall: true } : { ok: false, notfall: false };
}

/** Admin im Sinne des Notfall-Logins: System Manager / PH Backoffice-Admin (Bereich zentrale, admin). */
export function notfallRollenOk(roles) {
  const rs = Array.isArray(roles) ? roles : [];
  return rs.includes("System Manager") || rs.includes("Administrator") || istAdmin({ roles: rs });
}

/** Demo-Flow (lokaler Test-Issuer) nur im Mock und nur, wo auch der Mock-Passwort-Login ginge. */
export function demoAktiv({ modus = backofficeMode(), env = process.env, production = IS_PRODUCTION } = {}) {
  return modus === "mock" && !!mockPassword(env, production);
}

function zertifikatSchluessel(env) {
  let pem = env[MS_ENV.CERT_KEY] || "";
  if (!pem && env[MS_ENV.CERT_KEY_FILE]) {
    try {
      pem = readFileSync(env[MS_ENV.CERT_KEY_FILE], "utf8");
    } catch {
      return null;
    }
  }
  if (!pem) return null;
  try {
    return createPrivateKey(pem.replace(/\\n/g, "\n"));
  } catch {
    return null;
  }
}

/**
 * Microsoft-Konfiguration aus der Umgebung. `fehlend` nennt nur Env-NAMEN, nie Werte.
 * @returns {{konfiguriert:boolean, fehlend:string[], tenantId:string, clientId:string, redirectUri:string,
 *   scopes:string[], discoveryUrl:string, clientSecret:string, zertifikat:{key:any, thumbprint:string}|null, logout:boolean}}
 */
export function msKonfig(env = process.env) {
  const tenantId = String(env[MS_ENV.TENANT_ID] || "").trim().toLowerCase();
  const clientId = String(env[MS_ENV.CLIENT_ID] || "").trim();
  const redirectUri = String(env[MS_ENV.REDIRECT_URI] || "").trim();
  const clientSecret = env[MS_ENV.CLIENT_SECRET] || "";
  const thumbprint = String(env[MS_ENV.CERT_THUMBPRINT] || "").trim();
  const key = (env[MS_ENV.CERT_KEY] || env[MS_ENV.CERT_KEY_FILE]) && thumbprint ? zertifikatSchluessel(env) : null;
  const zusatz = String(env[MS_ENV.SCOPES] || "").split(/[\s,]+/).filter(Boolean);
  const fehlend = [];
  if (!GUID.test(tenantId)) fehlend.push(MS_ENV.TENANT_ID);
  if (!clientId) fehlend.push(MS_ENV.CLIENT_ID);
  if (!/^https?:\/\//.test(redirectUri)) fehlend.push(MS_ENV.REDIRECT_URI);
  if (!clientSecret && !key) fehlend.push(`${MS_ENV.CLIENT_SECRET} | BACKOFFICE_MS_CERT_*`);
  return {
    konfiguriert: fehlend.length === 0,
    fehlend,
    tenantId,
    clientId,
    redirectUri,
    scopes: [...new Set([...BASIS_SCOPES, ...zusatz])],
    discoveryUrl: `${MS_AUTHORITY}/${tenantId || "invalid"}/v2.0/.well-known/openid-configuration`,
    clientSecret,
    zertifikat: key ? { key, thumbprint } : null,
    logout: ["1", "true", "ja"].includes(String(env[MS_ENV.LOGOUT] || "").toLowerCase()),
  };
}

/** Steht der Microsoft-Knopf zur Verfügung? (Mock: Demo-Flow; Frappe: vollständige Konfiguration.) */
export function microsoftVerfuegbar({ modus = backofficeMode(), env = process.env, production = IS_PRODUCTION } = {}) {
  if (modus === "mock") return demoAktiv({ modus, env, production });
  return msKonfig(env).konfiguriert;
}

// ---------------------------------------------------------- Demo-Issuer --
// Lokaler Test-Issuer für den Mock: eigener RSA-Schlüssel je Prozess, Codes einmalig und 2 min gültig.

export const DEMO_TENANT = "00000000-0000-4000-8000-0000000000de";
export const DEMO_CLIENT_ID = "platzhirsch-backoffice-demo";
export const DEMO_ISSUER = `https://login.demo.local/${DEMO_TENANT}/v2.0`;
export const DEMO_AUTORISIERUNG = "/auth/microsoft/demo";
export const CALLBACK_PFAD = "/auth/microsoft/callback";
const DEMO_CODE_TTL_MS = 2 * 60 * 1000;

const G = globalThis;
function demoZustand() {
  if (!G.__phBoMsDemo) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const jwk = publicKey.export({ format: "jwk" });
    G.__phBoMsDemo = { privateKey, jwk: { ...jwk, kid: `demo-${zufall(6)}`, use: "sig", alg: "RS256" }, codes: new Map() };
  }
  return G.__phBoMsDemo;
}

export function demoJwks() {
  return [demoZustand().jwk];
}

/** „Microsoft“-Seite des Demo-Issuers: stellt nach der Kontowahl einen Code aus. */
export function demoCodeAusstellen({ email, nonce, challenge, method, redirectUri, clientId, now = Date.now() }) {
  if (clientId !== DEMO_CLIENT_ID || redirectUri !== CALLBACK_PFAD) throw new BackofficeError("invalid", "Unbekannte Anwendung.");
  if (method !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(String(challenge || ""))) throw new BackofficeError("invalid", "PKCE (S256) fehlt.");
  if (!nonce) throw new BackofficeError("invalid", "nonce fehlt.");
  const z = demoZustand();
  for (const [k, v] of z.codes) if (now - v.zeit > DEMO_CODE_TTL_MS) z.codes.delete(k);
  const code = zufall(24);
  z.codes.set(code, { email: String(email || "").trim().toLowerCase(), nonce, challenge, redirectUri, clientId, zeit: now });
  return code;
}

/** Token-Endpunkt des Demo-Issuers (PKCE-Prüfung wie bei Microsoft). */
export function demoTokenTausch({ code, verifier, redirectUri, clientId, now = Date.now() }) {
  const z = demoZustand();
  const e = z.codes.get(String(code || ""));
  z.codes.delete(String(code || ""));
  if (!e || now - e.zeit > DEMO_CODE_TTL_MS || e.redirectUri !== redirectUri || e.clientId !== clientId) throw new OidcFehler("token", "Code-Tausch abgelehnt (invalid_grant).");
  if (!gleich(pkceChallenge(verifier), e.challenge)) throw new OidcFehler("token", "Code-Tausch abgelehnt (invalid_grant).");
  const u = demoBenutzer(e.email);
  const iat = Math.floor(now / 1000);
  const claims = {
    iss: DEMO_ISSUER,
    aud: DEMO_CLIENT_ID,
    tid: DEMO_TENANT,
    oid: u ? `demo-${b64url(Buffer.from(u.email)).slice(0, 12)}` : randomUUID(),
    sub: zufall(12),
    email: e.email,
    preferred_username: e.email,
    name: u?.name || e.email,
    nonce: e.nonce,
    iat,
    nbf: iat,
    exp: iat + 3600,
    ver: "2.0",
  };
  return { id_token: signiereJwt({ kid: z.jwk.kid }, claims, z.privateKey), token_type: "Bearer" };
}

/** Nur für Tests: Demo-Token mit beliebigen Claims (gleicher Schlüssel). */
export function demoTokenSignieren(claims) {
  const z = demoZustand();
  return signiereJwt({ kid: z.jwk.kid }, claims, z.privateKey);
}

// ------------------------------------------------------------- Start --

function sicheresZiel(next) {
  return typeof next === "string" && /^\/(?!\/)[a-z0-9\-/?=&%._]*$/i.test(next) && next !== "/" ? next : "";
}

/**
 * Beginnt die Anmeldung. Liefert die Ziel-URL (Microsoft bzw. Demo-Seite) und den Flow-Cookie-Wert.
 * @returns {Promise<{url:string, cookie:string}>}
 */
export async function starteAnmeldung({ modus = backofficeMode(), env = process.env, production = IS_PRODUCTION, next, loginHint, secret, fetchImpl, now = Date.now() } = {}) {
  const { verifier, challenge } = pkcePaar();
  const state = zufall(24);
  const nonce = zufall(24);
  const cookie = flowCookieWert({ state, nonce, verifier, next: sicheresZiel(next), art: modus === "mock" ? "demo" : "microsoft" }, { secret, now });
  const hint = /^[^\s@]+@[^\s@]+$/.test(String(loginHint || "")) ? String(loginHint).slice(0, 254) : undefined;
  if (modus === "mock") {
    if (!demoAktiv({ modus, env, production })) throw msFehler("nicht_eingerichtet", "unavailable");
    const url = autorisierungsUrl({ endpoint: `http://demo.invalid${DEMO_AUTORISIERUNG}`, clientId: DEMO_CLIENT_ID, redirectUri: CALLBACK_PFAD, scopes: BASIS_SCOPES, state, nonce, challenge, prompt: "select_account", loginHint: hint });
    return { url: url.replace("http://demo.invalid", ""), cookie };
  }
  const k = msKonfig(env);
  if (!k.konfiguriert) throw msFehler("nicht_eingerichtet", "unavailable");
  const d = await ladeDiscovery(k.discoveryUrl, { fetchImpl, now });
  const url = autorisierungsUrl({ endpoint: d.authorization_endpoint, clientId: k.clientId, redirectUri: k.redirectUri, scopes: k.scopes, state, nonce, challenge, prompt: "select_account", loginHint: hint });
  return { url, cookie };
}

// ------------------------------------------------------------ Callback --

/** Fehlercodes für /login?ms_fehler=… (Seite zeigt nur bekannte Codes, nie Eingaben). */
export const MS_FEHLER = {
  abgebrochen: "Die Anmeldung bei Microsoft wurde abgebrochen.",
  abgelaufen: "Die Anmeldung hat zu lange gedauert. Bitte erneut versuchen.",
  state: "Die Anmeldung konnte nicht zugeordnet werden. Bitte erneut versuchen.",
  token: "Microsoft hat die Anmeldung nicht bestätigt. Bitte erneut versuchen.",
  konto: "Für dieses Microsoft-Konto gibt es keinen Backoffice-Zugang.",
  gesperrt: "Dieses Konto ist für das Backoffice gesperrt.",
  nicht_eingerichtet: "Die Microsoft-Anmeldung ist noch nicht eingerichtet.",
  rate_limited: "Zu viele Fehlversuche. Bitte in einigen Minuten erneut versuchen.",
  technik: "Der Anmeldedienst ist gerade nicht erreichbar. Bitte später erneut versuchen.",
};

/** Fehler mit Anzeige-Code (`msCode`) für die Login-Seite. */
export function msFehler(msCode, code = "auth", detail) {
  const err = new BackofficeError(code, MS_FEHLER[msCode] || MS_FEHLER.technik, { detail: { msCode, ...(detail || {}) } });
  err.msCode = msCode;
  return err;
}

const OIDC_ZU_MS = { netz: "technik", discovery: "technik", jwks: "technik", token: "token" };

/** Frappe: ph_microsoft.api.sso_sitzung(id_token) → {user, name, roles, standort, sid}. */
export async function frappeSsoSitzung({ idToken, baseUrl = frappeUrl(), fetchImpl } = {}) {
  if (!baseUrl) throw msFehler("nicht_eingerichtet", "unavailable");
  let response;
  try {
    response = await backofficeFetch(`${baseUrl}/api/method/ph_microsoft.api.sso_sitzung`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
      cache: "no-store",
      timeoutMs: 8000,
      retries: 0,
      dedupe: false,
      fetchImpl,
    });
  } catch {
    throw msFehler("technik", "unavailable");
  }
  let daten = null;
  try {
    daten = await response.json();
  } catch {
    daten = null;
  }
  const m = daten?.message;
  const phCode = m && typeof m === "object" && typeof m.code === "string" ? m.code : null;
  if (!response.ok || phCode) {
    if (response.status === 404 || phCode === "not_found") throw msFehler("konto", "not_found", { phCode: phCode || "not_found" });
    if (response.status === 403 || phCode === "forbidden") throw msFehler("gesperrt", "forbidden", { phCode: phCode || "forbidden" });
    if (response.status === 401 || phCode === "invalid_token") throw msFehler("token", "auth", { phCode: phCode || "invalid_token" });
    throw msFehler("technik", "unavailable");
  }
  if (!m?.user || !m?.sid) throw msFehler("technik", "unavailable");
  return { user: m.user, name: m.name || m.user, kurzname: m.kurzname || String(m.name || m.user).split(" ")[0], roles: Array.isArray(m.roles) ? m.roles : [], standort: m.standort || "", frappeSid: m.sid };
}

function emailAus(claims) {
  return String(claims.email || claims.preferred_username || claims.upn || "").trim().toLowerCase();
}

/**
 * Schließt die Anmeldung ab. Wirft BackofficeError mit err.msCode (siehe MS_FEHLER).
 * @param {{query:{code?:string, state?:string, error?:string}, flowCookie?:string}} args
 * @returns {Promise<{ok:true, user:string, name:string, kurzname:string, roles:string[], frappeSid:string|null, standort:string, next:string, art:string, email:string}>}
 */
export async function beendeAnmeldung({ query = {}, flowCookie, modus = backofficeMode(), env = process.env, production = IS_PRODUCTION, secret, fetchImpl, ssoImpl = frappeSsoSitzung, now = Date.now() } = {}) {
  const flow = flowCookieLesen(flowCookie, { secret, now });
  if (query.error) throw msFehler("abgebrochen", "auth", { oauth: String(query.error).slice(0, 40) });
  if (!flow) throw msFehler("abgelaufen", "auth");
  if (!query.state || !gleich(query.state, flow.state)) throw msFehler("state", "forbidden");
  if (!query.code || String(query.code).length > 4096) throw msFehler("token", "auth");
  const demo = modus === "mock";
  if (demo !== (flow.art === "demo")) throw msFehler("state", "forbidden");

  let claims;
  let idToken;
  try {
    if (demo) {
      if (!demoAktiv({ modus, env, production })) throw msFehler("nicht_eingerichtet", "unavailable");
      idToken = demoTokenTausch({ code: query.code, verifier: flow.verifier, redirectUri: CALLBACK_PFAD, clientId: DEMO_CLIENT_ID, now }).id_token;
      claims = await pruefeIdToken(idToken, { keys: demoJwks(), issuer: DEMO_ISSUER, audience: DEMO_CLIENT_ID, nonce: flow.nonce, tenants: [DEMO_TENANT], now });
    } else {
      const k = msKonfig(env);
      if (!k.konfiguriert) throw msFehler("nicht_eingerichtet", "unavailable");
      const d = await ladeDiscovery(k.discoveryUrl, { fetchImpl, now });
      const assertion = k.zertifikat ? clientAssertion({ clientId: k.clientId, tokenEndpoint: d.token_endpoint, privateKey: k.zertifikat.key, thumbprint: k.zertifikat.thumbprint, now }) : undefined;
      const tokens = await tauscheCode({ tokenEndpoint: d.token_endpoint, code: query.code, verifier: flow.verifier, clientId: k.clientId, redirectUri: k.redirectUri, clientSecret: assertion ? undefined : k.clientSecret, assertion, scopes: k.scopes, fetchImpl });
      idToken = tokens.id_token;
      // Refresh-/Access-Token werden hier nicht gespeichert: Exchange-Zugriffe laufen über ph_microsoft (Frappe).
      claims = await pruefeIdToken(idToken, { keys: (neu) => ladeJwks(d.jwks_uri, { fetchImpl, now, neu }), issuer: d.issuer, audience: k.clientId, nonce: flow.nonce, tenants: [k.tenantId], now });
    }
  } catch (err) {
    if (err instanceof OidcFehler) throw msFehler(OIDC_ZU_MS[err.grund] || "token", OIDC_ZU_MS[err.grund] === "technik" ? "unavailable" : "auth", { grund: err.grund });
    throw err;
  }

  const email = emailAus(claims);
  if (demo) {
    const u = demoBenutzer(email);
    if (!u) throw msFehler("konto", "not_found");
    return { ok: true, user: u.email, name: u.name, kurzname: u.name.split(" ")[0], roles: u.roles, frappeSid: null, standort: u.standort, next: flow.next, art: "demo", email };
  }
  const r = await ssoImpl({ idToken, fetchImpl });
  return { ok: true, ...r, next: flow.next, art: "microsoft", email };
}

/** Startarbeitsplatz und Ziel nach der Anmeldung – gleiche Regel wie anmeldenAction (actions.js). */
export function startziel({ roles, geraet, next }) {
  const plaetze = erlaubteArbeitsplaetze({ roles });
  const startplatz = geraet?.arbeitsplatz && plaetze.some((p) => p.slug === geraet.arbeitsplatz) ? geraet.arbeitsplatz : plaetze.length === 1 ? plaetze[0].slug : null;
  const ziel = sicheresZiel(next) || (startplatz ? arbeitsplatz(startplatz).href : plaetze.length > 1 ? "/arbeitsplatz" : "/");
  return { startplatz, kiosk: !!arbeitsplatz(startplatz)?.kiosk, ziel };
}

/**
 * Microsoft-Abmelde-URL (end_session_endpoint) oder null (nicht eingerichtet / BACKOFFICE_MS_LOGOUT aus / Mock).
 * post_logout_redirect_uri: Ursprung der Redirect-URI + /login?abgemeldet=1 (in Entra als Front-Channel-Logout eintragen).
 */
export async function microsoftAbmeldeUrl({ modus = backofficeMode(), env = process.env, fetchImpl, now = Date.now() } = {}) {
  if (modus === "mock") return null;
  const k = msKonfig(env);
  if (!k.konfiguriert || !k.logout) return null;
  try {
    const d = await ladeDiscovery(k.discoveryUrl, { fetchImpl, now });
    if (!d.end_session_endpoint) return null;
    const u = new URL(d.end_session_endpoint);
    u.searchParams.set("post_logout_redirect_uri", `${new URL(k.redirectUri).origin}/login?abgemeldet=1`);
    return u.toString();
  } catch {
    return null;
  }
}
