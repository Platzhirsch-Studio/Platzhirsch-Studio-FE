// OpenID-Connect-Bausteine ohne Fremdpaket (node:crypto): PKCE (S256), state/nonce, signiertes
// Flow-Cookie, Discovery- und JWKS-Cache, Code-Tausch, Client-Assertion (Zertifikat) und die
// Prüfung des id_token (RS256 über JWKS, iss, aud, exp/nbf, nonce, tid).
// Anbieterneutral; die Microsoft-Einzelheiten stehen in microsoft.js.
// Reines Modul (fetchImpl injizierbar, keine "@/"-Importe), testbar mit node --test.

import { createHash, createPrivateKey, createPublicKey, randomBytes, sign as cryptoSign, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import { sign, verify } from "./session.js";

export const FLOW_COOKIE = "ph_bo_oidc";
/** Lebensdauer des Flow-Cookies (state/nonce/PKCE): 10 Minuten. */
export const FLOW_TTL_SECONDS = 10 * 60;
const FLOW_PURPOSE = "backoffice-oidc-flow";
/** Erlaubte Uhrabweichung bei exp/nbf/iat. */
export const CLOCK_SKEW_SECONDS = 300;

/** Fehler der OIDC-Prüfung; `grund` ist ein kurzer Code (für Tests und Log, nie Token-Inhalt). */
export class OidcFehler extends Error {
  constructor(grund, message) {
    super(message || grund);
    this.name = "OidcFehler";
    this.grund = grund;
  }
}

export function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

/** Zufallswert (base64url) – für state, nonce, code_verifier. */
export function zufall(bytes = 32) {
  return b64url(randomBytes(bytes));
}

export function gleich(a, b) {
  const ab = Buffer.from(String(a ?? ""));
  const bb = Buffer.from(String(b ?? ""));
  return ab.length > 0 && ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** code_challenge zu einem code_verifier (RFC 7636, S256). */
export function pkceChallenge(verifier) {
  return b64url(createHash("sha256").update(String(verifier)).digest());
}

/** Neues PKCE-Paar; verifier 43 Zeichen (32 Byte). */
export function pkcePaar() {
  const verifier = zufall(32);
  return { verifier, challenge: pkceChallenge(verifier), method: "S256" };
}

// ------------------------------------------------------------ Flow-Cookie --

/**
 * Signierter Inhalt des kurzlebigen Flow-Cookies (HMAC wie die Sitzung, eigener Zweck).
 * @param {{state:string, nonce:string, verifier:string, next?:string, art?:string}} flow
 */
export function flowCookieWert(flow, { secret, now = Date.now(), ttlSeconds = FLOW_TTL_SECONDS } = {}) {
  const iat = Math.floor(now / 1000);
  return sign(FLOW_PURPOSE, { v: 1, s: flow.state, n: flow.nonce, pv: flow.verifier, nx: flow.next || "", art: flow.art || "microsoft", iat, exp: iat + ttlSeconds }, secret);
}

/** @returns {{state:string, nonce:string, verifier:string, next:string, art:string}|null} null bei fehlend/manipuliert/abgelaufen */
export function flowCookieLesen(wert, { secret, now = Date.now() } = {}) {
  if (!wert) return null;
  const p = verify(FLOW_PURPOSE, wert, secret, now);
  if (!p || p.v !== 1 || typeof p.s !== "string" || typeof p.n !== "string" || typeof p.pv !== "string" || typeof p.exp !== "number") return null;
  return { state: p.s, nonce: p.n, verifier: p.pv, next: p.nx || "", art: p.art || "microsoft" };
}

export function flowCookieOptionen(production) {
  return { httpOnly: true, secure: !!production, sameSite: "lax", path: "/auth/microsoft", maxAge: FLOW_TTL_SECONDS };
}

// ------------------------------------------------------ Discovery / JWKS --

const G = globalThis;
const cache = G.__phBoOidcCache || (G.__phBoOidcCache = { discovery: new Map(), jwks: new Map() });
export const DISCOVERY_TTL_MS = 24 * 60 * 60 * 1000;
export const JWKS_TTL_MS = 60 * 60 * 1000;
/** Unbekannte kid lösen höchstens alle 5 Minuten ein Neuladen aus (Schlüsselwechsel bei Microsoft). */
export const JWKS_REFRESH_MIN_MS = 5 * 60 * 1000;

export function oidcCacheLeeren() {
  cache.discovery.clear();
  cache.jwks.clear();
}

async function holeJson(url, { fetchImpl = fetch, timeoutMs = 8000, init = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(url, { cache: "no-store", ...init, signal: ctrl.signal });
  } catch {
    throw new OidcFehler("netz", "Anmeldedienst nicht erreichbar.");
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  let daten = null;
  try {
    daten = text ? JSON.parse(text) : null;
  } catch {
    daten = null;
  }
  return { status: res.status, ok: res.ok, daten };
}

/** OpenID-Konfiguration (…/.well-known/openid-configuration), 24 h im Prozess gecacht. */
export async function ladeDiscovery(url, { fetchImpl, now = Date.now() } = {}) {
  const c = cache.discovery.get(url);
  if (c && now - c.zeit < DISCOVERY_TTL_MS) return c.daten;
  const r = await holeJson(url, { fetchImpl });
  const d = r.daten;
  if (!r.ok || !d?.issuer || !d?.authorization_endpoint || !d?.token_endpoint || !d?.jwks_uri) {
    throw new OidcFehler("discovery", "OpenID-Konfiguration ungültig oder nicht erreichbar.");
  }
  cache.discovery.set(url, { zeit: now, daten: d });
  return d;
}

/** JWKS (öffentliche Signaturschlüssel), 1 h gecacht; `neu` erzwingt Neuladen (gedrosselt). */
export async function ladeJwks(jwksUri, { fetchImpl, now = Date.now(), neu = false } = {}) {
  const c = cache.jwks.get(jwksUri);
  if (c && (now - c.zeit < JWKS_TTL_MS) && (!neu || now - c.zeit < JWKS_REFRESH_MIN_MS)) return c.keys;
  const r = await holeJson(jwksUri, { fetchImpl });
  if (!r.ok || !Array.isArray(r.daten?.keys)) throw new OidcFehler("jwks", "Signaturschlüssel nicht abrufbar.");
  cache.jwks.set(jwksUri, { zeit: now, keys: r.daten.keys });
  return r.daten.keys;
}

// ---------------------------------------------------------------- JWT --

export function jwtZerlegen(token) {
  if (typeof token !== "string" || token.length > 16384) throw new OidcFehler("format", "Token fehlt oder ist zu lang.");
  const teile = token.split(".");
  if (teile.length !== 3 || teile.some((t) => !/^[A-Za-z0-9_-]*$/.test(t)) || !teile[0] || !teile[1] || !teile[2]) throw new OidcFehler("format", "Token hat kein JWS-Format.");
  try {
    return {
      header: JSON.parse(Buffer.from(teile[0], "base64url").toString("utf8")),
      claims: JSON.parse(Buffer.from(teile[1], "base64url").toString("utf8")),
      eingabe: `${teile[0]}.${teile[1]}`,
      signatur: Buffer.from(teile[2], "base64url"),
    };
  } catch {
    throw new OidcFehler("format", "Token nicht lesbar.");
  }
}

/** JWT mit RS256 signieren (Client-Assertion, Test-/Demo-Issuer). key: KeyObject oder PEM. */
export function signiereJwt(header, claims, privateKey) {
  const h = b64url(JSON.stringify({ alg: "RS256", typ: "JWT", ...header }));
  const c = b64url(JSON.stringify(claims));
  const key = typeof privateKey === "string" ? createPrivateKey(privateKey) : privateKey;
  const sig = cryptoSign("RSA-SHA256", Buffer.from(`${h}.${c}`), key);
  return `${h}.${c}.${b64url(sig)}`;
}

function audPasst(aud, clientId) {
  return Array.isArray(aud) ? aud.length === 1 && aud[0] === clientId : aud === clientId;
}

/**
 * Prüft ein id_token vollständig. Wirft OidcFehler(grund): format | alg | kid | signatur | iss | aud |
 * exp | nbf | iat | nonce | tid. Gibt die Claims zurück.
 * @param {string} token
 * @param {{keys:object[]|Function, issuer:string, audience:string, nonce:string, tenants?:string[], now?:number, skew?:number}} opts
 *   keys: JWKS-Liste oder async (neu:boolean) => Liste (lädt bei unbekannter kid einmal neu)
 *   issuer: erwarteter iss (Platzhalter {tenantid} wird durch tid ersetzt)
 */
export async function pruefeIdToken(token, { keys, issuer, audience, nonce, tenants, now = Date.now(), skew = CLOCK_SKEW_SECONDS } = {}) {
  const { header, claims, eingabe, signatur } = jwtZerlegen(token);
  if (header.alg !== "RS256") throw new OidcFehler("alg", "Signaturverfahren nicht erlaubt.");
  if (header.crit) throw new OidcFehler("alg", "Unbekannte kritische Header.");
  const liste = typeof keys === "function" ? keys : async () => keys || [];
  const finde = (ks) => ks.find((k) => k && k.kty === "RSA" && (!header.kid || k.kid === header.kid) && (!k.use || k.use === "sig"));
  let jwk = finde(await liste(false));
  if (!jwk && typeof keys === "function") jwk = finde(await liste(true));
  if (!jwk) throw new OidcFehler("kid", "Signaturschlüssel unbekannt.");
  let ok = false;
  try {
    const pub = createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e }, format: "jwk" });
    ok = cryptoVerify("RSA-SHA256", Buffer.from(eingabe), pub, signatur);
  } catch {
    ok = false;
  }
  if (!ok) throw new OidcFehler("signatur", "Signatur ungültig.");

  const jetzt = Math.floor(now / 1000);
  const erwartetIss = String(issuer || "").replace("{tenantid}", String(claims.tid || ""));
  if (!erwartetIss || claims.iss !== erwartetIss) throw new OidcFehler("iss", "Aussteller passt nicht.");
  if (!audience || !audPasst(claims.aud, audience)) throw new OidcFehler("aud", "Token ist nicht für dieses Backoffice ausgestellt.");
  if (typeof claims.exp !== "number" || claims.exp + skew < jetzt) throw new OidcFehler("exp", "Token ist abgelaufen.");
  if (typeof claims.nbf === "number" && claims.nbf - skew > jetzt) throw new OidcFehler("nbf", "Token ist noch nicht gültig.");
  if (typeof claims.iat === "number" && claims.iat - skew > jetzt) throw new OidcFehler("iat", "Ausstellungszeit liegt in der Zukunft.");
  if (!nonce || !gleich(claims.nonce, nonce)) throw new OidcFehler("nonce", "Nonce passt nicht.");
  if (Array.isArray(tenants) && tenants.length && !tenants.includes(String(claims.tid || "").toLowerCase())) throw new OidcFehler("tid", "Mandant nicht zugelassen.");
  return claims;
}

// ------------------------------------------------------ Autorisierung --

/** URL des Autorisierungsendpunkts (Authorization Code + PKCE, response_mode=query). */
export function autorisierungsUrl({ endpoint, clientId, redirectUri, scopes, state, nonce, challenge, prompt, loginHint, domainHint }) {
  const u = new URL(endpoint);
  const p = u.searchParams;
  p.set("client_id", clientId);
  p.set("response_type", "code");
  p.set("redirect_uri", redirectUri);
  p.set("response_mode", "query");
  p.set("scope", scopes.join(" "));
  p.set("state", state);
  p.set("nonce", nonce);
  p.set("code_challenge", challenge);
  p.set("code_challenge_method", "S256");
  if (prompt) p.set("prompt", prompt);
  if (loginHint) p.set("login_hint", loginHint);
  if (domainHint) p.set("domain_hint", domainHint);
  return u.toString();
}

/**
 * Client-Assertion (private_key_jwt) für die Zertifikat-Anmeldung bei Microsoft.
 * thumbprint: SHA-1-Fingerabdruck des Zertifikats (Hex, wie in Entra angezeigt) → Header x5t.
 */
export function clientAssertion({ clientId, tokenEndpoint, privateKey, thumbprint, now = Date.now() }) {
  const iat = Math.floor(now / 1000);
  const x5t = b64url(Buffer.from(String(thumbprint).replace(/[^0-9a-f]/gi, ""), "hex"));
  return signiereJwt({ x5t }, { aud: tokenEndpoint, iss: clientId, sub: clientId, jti: zufall(16), nbf: iat, iat, exp: iat + 600 }, privateKey);
}

/**
 * Tauscht den Code serverseitig gegen Tokens. Geheimnis: clientSecret ODER assertion (Zertifikat).
 * @returns {Promise<{id_token:string, access_token?:string, refresh_token?:string, expires_in?:number}>}
 */
export async function tauscheCode({ tokenEndpoint, code, verifier, clientId, redirectUri, clientSecret, assertion, scopes, fetchImpl }) {
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, code_verifier: verifier });
  if (scopes?.length) body.set("scope", scopes.join(" "));
  if (assertion) {
    body.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    body.set("client_assertion", assertion);
  } else if (clientSecret) {
    body.set("client_secret", clientSecret);
  }
  const r = await holeJson(tokenEndpoint, {
    fetchImpl,
    init: { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: body.toString() },
  });
  if (!r.ok || !r.daten?.id_token) {
    // Fehlercode (z. B. invalid_grant) ohne Beschreibung weiterreichen – keine Token-/Geheimnis-Inhalte.
    throw new OidcFehler("token", r.daten?.error ? `Code-Tausch abgelehnt (${String(r.daten.error).slice(0, 40)}).` : "Code-Tausch fehlgeschlagen.");
  }
  return r.daten;
}
