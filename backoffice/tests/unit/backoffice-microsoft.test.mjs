// Microsoft-Anmeldung (Entra ID / OIDC, Entscheidung Nr. 52): PKCE/State/Nonce, Flow-Cookie, id_token-Prüfung
// mit selbst erzeugten RSA-Schlüsseln, Start/Callback gegen Attrappen (kein Aufruf an Microsoft), Mock-Flow,
// Login-Arten-Schalter und Notfall-Passwort.
//   node --test tests/unit/backoffice-microsoft.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createPublicKey, generateKeyPairSync, verify as cryptoVerify } from "node:crypto";
import {
  FLOW_TTL_SECONDS,
  OidcFehler,
  autorisierungsUrl,
  clientAssertion,
  flowCookieLesen,
  flowCookieWert,
  oidcCacheLeeren,
  pkceChallenge,
  pkcePaar,
  pruefeIdToken,
  signiereJwt,
} from "../../src/lib/backoffice/auth/oidc.js";
import {
  CALLBACK_PFAD,
  DEMO_CLIENT_ID,
  DEMO_ISSUER,
  DEMO_TENANT,
  beendeAnmeldung,
  demoCodeAusstellen,
  demoJwks,
  demoTokenSignieren,
  frappeSsoSitzung,
  loginArten,
  microsoftAbmeldeUrl,
  microsoftVerfuegbar,
  msKonfig,
  notfallAdmins,
  passwortZugelassen,
  starteAnmeldung,
  startziel,
} from "../../src/lib/backoffice/auth/microsoft.js";
import { anmelden } from "../../src/lib/backoffice/auth/login.js";

const SECRET = "test-secret-mindestens-32-zeichen-lang-0000";
const TENANT = "11111111-2222-4333-8444-555555555555";
const CLIENT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const ISSUER = `https://login.microsoftonline.com/${TENANT}/v2.0`;
const ENV = {
  BACKOFFICE_MS_TENANT_ID: TENANT,
  BACKOFFICE_MS_CLIENT_ID: CLIENT,
  BACKOFFICE_MS_CLIENT_SECRET: "geheim-nur-test",
  BACKOFFICE_MS_REDIRECT_URI: "https://backoffice.example.test/auth/microsoft/callback",
};

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const fremd = generateKeyPairSync("rsa", { modulusLength: 2048 });
const JWK = { ...publicKey.export({ format: "jwk" }), kid: "k1", use: "sig" };

function claims(extra = {}) {
  const iat = Math.floor(Date.now() / 1000);
  return { iss: ISSUER, aud: CLIENT, tid: TENANT, nonce: "n-123", email: "gf@demo.local", name: "Max", oid: "o1", iat, nbf: iat, exp: iat + 3600, ...extra };
}
const token = (c = claims(), key = privateKey, header = { kid: "k1" }) => signiereJwt(header, c, key);
const pruefen = (t, extra = {}) => pruefeIdToken(t, { keys: [JWK], issuer: ISSUER, audience: CLIENT, nonce: "n-123", tenants: [TENANT], ...extra });

async function grund(promise) {
  try {
    await promise;
  } catch (err) {
    return err.grund || err.msCode || err.code;
  }
  return "kein Fehler";
}

// ------------------------------------------------------------ PKCE/State --

test("PKCE: S256 nach RFC 7636 (Testvektor), Paare zufällig und 43 Zeichen", () => {
  assert.equal(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  const a = pkcePaar();
  const b = pkcePaar();
  assert.equal(a.verifier.length, 43);
  assert.equal(a.method, "S256");
  assert.equal(a.challenge, pkceChallenge(a.verifier));
  assert.notEqual(a.verifier, b.verifier);
});

test("Flow-Cookie: signiert, manipulationssicher, nach 10 min ungültig", () => {
  const now = Date.now();
  const w = flowCookieWert({ state: "s1", nonce: "n1", verifier: "v1", next: "/crm" }, { secret: SECRET, now });
  assert.deepEqual(flowCookieLesen(w, { secret: SECRET, now }), { state: "s1", nonce: "n1", verifier: "v1", next: "/crm", art: "microsoft" });
  assert.equal(flowCookieLesen(w, { secret: "anderes-secret-mindestens-32-zeichen-00", now }), null);
  assert.equal(flowCookieLesen(`x${w}`, { secret: SECRET, now }), null);
  assert.equal(flowCookieLesen(w, { secret: SECRET, now: now + (FLOW_TTL_SECONDS + 1) * 1000 }), null);
  assert.equal(flowCookieLesen("", { secret: SECRET }), null);
  assert.equal(FLOW_TTL_SECONDS, 600);
});

test("Autorisierungs-URL: Code-Flow, PKCE S256, select_account, Scopes", () => {
  const u = new URL(autorisierungsUrl({ endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`, clientId: CLIENT, redirectUri: ENV.BACKOFFICE_MS_REDIRECT_URI, scopes: ["openid", "profile", "email", "offline_access"], state: "s", nonce: "n", challenge: "c", prompt: "select_account" }));
  const p = u.searchParams;
  assert.equal(p.get("response_type"), "code");
  assert.equal(p.get("response_mode"), "query");
  assert.equal(p.get("code_challenge_method"), "S256");
  assert.equal(p.get("prompt"), "select_account");
  assert.equal(p.get("scope"), "openid profile email offline_access");
  assert.equal(p.get("client_secret"), null);
});

// ----------------------------------------------------------- id_token --

test("id_token: gültig wird akzeptiert", async () => {
  const c = await pruefen(token());
  assert.equal(c.email, "gf@demo.local");
});

test("id_token: falsche aud/iss/tid, abgelaufen, falscher nonce, fremde Signatur, alg werden abgelehnt", async () => {
  assert.equal(await grund(pruefen(token(claims({ aud: "andere-app" })))), "aud");
  assert.equal(await grund(pruefen(token(claims({ aud: [CLIENT, "x"] })))), "aud");
  assert.equal(await grund(pruefen(token(claims({ iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0" })))), "iss");
  assert.equal(await grund(pruefen(token(claims({ tid: "99999999-2222-4333-8444-555555555555", iss: "https://login.microsoftonline.com/99999999-2222-4333-8444-555555555555/v2.0" })), { issuer: "https://login.microsoftonline.com/{tenantid}/v2.0" })), "tid");
  const alt = Math.floor(Date.now() / 1000) - 7200;
  assert.equal(await grund(pruefen(token(claims({ iat: alt, nbf: alt, exp: alt + 3600 })))), "exp");
  assert.equal(await grund(pruefen(token(claims({ nonce: "falsch" })))), "nonce");
  assert.equal(await grund(pruefen(token(claims({ nonce: undefined })))), "nonce");
  assert.equal(await grund(pruefen(token(claims(), fremd.privateKey))), "signatur");
  assert.equal(await grund(pruefen(token(claims(), privateKey, { kid: "unbekannt" }))), "kid");
  // alg=none / manipulierter Inhalt
  const t = token();
  const [, body, sig] = t.split(".");
  const none = `${Buffer.from(JSON.stringify({ alg: "none", kid: "k1" })).toString("base64url")}.${body}.${sig}`;
  assert.equal(await grund(pruefen(none)), "alg");
  const manip = `${t.split(".")[0]}.${Buffer.from(JSON.stringify(claims({ email: "admin@demo.local" }))).toString("base64url")}.${sig}`;
  assert.equal(await grund(pruefen(manip)), "signatur");
  assert.equal(await grund(pruefen("kein.jwt")), "format");
});

test("id_token: unbekannte kid lädt JWKS genau einmal neu (Schlüsselwechsel)", async () => {
  const aufrufe = [];
  const keys = async (neu) => {
    aufrufe.push(neu);
    return neu ? [JWK] : [{ ...JWK, kid: "alt" }];
  };
  const c = await pruefen(token(), { keys });
  assert.equal(c.oid, "o1");
  assert.deepEqual(aufrufe, [false, true]);
});

test("Client-Assertion (Zertifikat): RS256, x5t aus SHA-1-Fingerabdruck, aud = Token-Endpunkt", () => {
  const thumb = createHash("sha1").update("zertifikat").digest("hex").toUpperCase();
  const a = clientAssertion({ clientId: CLIENT, tokenEndpoint: "https://t.example/token", privateKey, thumbprint: thumb });
  const [h, c, s] = a.split(".");
  const header = JSON.parse(Buffer.from(h, "base64url"));
  const body = JSON.parse(Buffer.from(c, "base64url"));
  assert.equal(header.alg, "RS256");
  assert.equal(Buffer.from(header.x5t, "base64url").toString("hex").toUpperCase(), thumb);
  assert.equal(body.aud, "https://t.example/token");
  assert.equal(body.iss, CLIENT);
  assert.equal(body.sub, CLIENT);
  assert.ok(cryptoVerify("RSA-SHA256", Buffer.from(`${h}.${c}`), createPublicKey(publicKey.export({ format: "pem", type: "spki" })), Buffer.from(s, "base64url")));
});

// ------------------------------------------------- Start/Callback (Frappe) --

/** Attrappe für Discovery, Token-Endpunkt und JWKS – nie echte Microsoft-Aufrufe. */
function msAttrappe({ idToken, tokenStatus = 200 } = {}) {
  const log = [];
  const fetchImpl = async (url, init = {}) => {
    const u = String(url);
    log.push({ url: u, init });
    if (u.endsWith("/.well-known/openid-configuration")) {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
        token_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
        jwks_uri: `https://login.microsoftonline.com/${TENANT}/discovery/v2.0/keys`,
        end_session_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/logout`,
      });
    }
    if (u.endsWith("/oauth2/v2.0/token")) {
      return tokenStatus === 200 ? Response.json({ id_token: typeof idToken === "function" ? idToken(init) : idToken, access_token: "at", refresh_token: "rt" }) : Response.json({ error: "invalid_grant", error_description: "geheim" }, { status: tokenStatus });
    }
    if (u.endsWith("/discovery/v2.0/keys")) return Response.json({ keys: [JWK] });
    return new Response("nicht gefunden", { status: 404 });
  };
  return { fetchImpl, log };
}

async function frappeStart(env = ENV, attrappe = msAttrappe()) {
  oidcCacheLeeren();
  const { url, cookie } = await starteAnmeldung({ modus: "frappe", env, production: true, next: "/crm", secret: SECRET, fetchImpl: attrappe.fetchImpl });
  const flow = flowCookieLesen(cookie, { secret: SECRET });
  return { url: new URL(url), cookie, flow };
}

test("Start: leitet zu Microsoft (Tenant aus Env), state/nonce/PKCE nur im Cookie", async () => {
  const { url, flow } = await frappeStart();
  assert.equal(url.origin, "https://login.microsoftonline.com");
  assert.ok(url.pathname.startsWith(`/${TENANT}/`));
  const p = url.searchParams;
  assert.equal(p.get("client_id"), CLIENT);
  assert.equal(p.get("state"), flow.state);
  assert.equal(p.get("nonce"), flow.nonce);
  assert.equal(p.get("code_challenge"), pkceChallenge(flow.verifier));
  assert.equal(p.get("prompt"), "select_account");
  assert.equal(p.get("redirect_uri"), ENV.BACKOFFICE_MS_REDIRECT_URI);
  assert.ok(!url.toString().includes(flow.verifier));
  assert.ok(!url.toString().includes("geheim"));
  assert.equal(flow.next, "/crm");
  // nicht eingerichtet
  assert.equal(await grund(starteAnmeldung({ modus: "frappe", env: {}, secret: SECRET })), "nicht_eingerichtet");
});

test("Callback (Frappe): Code-Tausch serverseitig, Token geprüft, sso_sitzung liefert die Sitzung", async () => {
  let nonce;
  const attrappe = msAttrappe({ idToken: () => token(claims({ nonce })) });
  const { cookie, flow } = await frappeStart(ENV, attrappe);
  nonce = flow.nonce;
  let ssoToken;
  const r = await beendeAnmeldung({
    query: { code: "code-1", state: flow.state },
    flowCookie: cookie,
    modus: "frappe",
    env: ENV,
    production: true,
    secret: SECRET,
    fetchImpl: attrappe.fetchImpl,
    ssoImpl: async ({ idToken }) => {
      ssoToken = idToken;
      return { user: "gf@platzhirsch.studio", name: "Max", kurzname: "Max", roles: ["PH Geschäftsführung"], standort: "Lochau", frappeSid: "frappe-sid" };
    },
  });
  assert.equal(r.user, "gf@platzhirsch.studio");
  assert.equal(r.frappeSid, "frappe-sid");
  assert.equal(r.next, "/crm");
  assert.equal(r.art, "microsoft");
  assert.ok(ssoToken.split(".").length === 3);
  const tausch = attrappe.log.find((l) => l.url.endsWith("/token"));
  const body = new URLSearchParams(tausch.init.body);
  assert.equal(tausch.init.method, "POST");
  assert.equal(body.get("code_verifier"), flow.verifier);
  assert.equal(body.get("client_secret"), "geheim-nur-test");
  assert.equal(body.get("grant_type"), "authorization_code");
  assert.ok(!tausch.url.includes("geheim"));
});

test("Callback-Fehlerfälle: abgebrochen, ohne/abgelaufenes Cookie, falscher state, Token-Fehler, falsche tid/nonce", async () => {
  const attrappe = msAttrappe({ idToken: token(claims({ nonce: "fremd" })) });
  const { cookie, flow } = await frappeStart(ENV, attrappe);
  const basis = { modus: "frappe", env: ENV, production: true, secret: SECRET, fetchImpl: attrappe.fetchImpl, ssoImpl: async () => assert.fail("sso darf nicht laufen") };
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { error: "access_denied", state: flow.state }, flowCookie: cookie })), "abgebrochen");
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: "c", state: flow.state } })), "abgelaufen");
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: "c", state: flow.state }, flowCookie: cookie, now: Date.now() + 11 * 60 * 1000 })), "abgelaufen");
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: "c", state: "falsch" }, flowCookie: cookie })), "state");
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { state: flow.state }, flowCookie: cookie })), "token");
  // nonce des Tokens passt nicht zum Cookie
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: "c", state: flow.state }, flowCookie: cookie })), "token");
  // Token-Endpunkt lehnt ab (invalid_grant), Beschreibung wird nicht weitergereicht
  const abgelehnt = msAttrappe({ tokenStatus: 400 });
  try {
    await beendeAnmeldung({ ...basis, fetchImpl: abgelehnt.fetchImpl, query: { code: "c", state: flow.state }, flowCookie: cookie });
    assert.fail("muss werfen");
  } catch (err) {
    assert.equal(err.msCode, "token");
    assert.ok(!String(err.message).includes("geheim"));
  }
  // anderer Mandant
  const fremdTenant = "99999999-2222-4333-8444-555555555555";
  const tidFalsch = msAttrappe({ idToken: token(claims({ nonce: flow.nonce, tid: fremdTenant })) });
  const e = await beendeAnmeldung({ ...basis, fetchImpl: tidFalsch.fetchImpl, query: { code: "c", state: flow.state }, flowCookie: cookie }).catch((x) => x);
  assert.equal(e.msCode, "token");
  assert.equal(e.detail.grund, "tid");
  // Demo-Cookie im Frappe-Modus wird nicht angenommen
  const demo = await starteAnmeldung({ modus: "mock", env: {}, production: false, secret: SECRET });
  const demoFlow = flowCookieLesen(demo.cookie, { secret: SECRET });
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: "c", state: demoFlow.state }, flowCookie: demo.cookie })), "state");
});

test("Frappe sso_sitzung: Antwort und Fehler invalid_token 401 / forbidden 403 / not_found 404", async () => {
  const antwort = (status, body) => async () => Response.json(body, { status });
  const ok = await frappeSsoSitzung({ idToken: "t", baseUrl: "https://frappe.test", fetchImpl: antwort(200, { message: { user: "a@x", name: "A B", roles: ["PH CRM Mitarbeiter"], standort: "Lochau", sid: "s1" } }) });
  assert.deepEqual(ok, { user: "a@x", name: "A B", kurzname: "A", roles: ["PH CRM Mitarbeiter"], standort: "Lochau", frappeSid: "s1" });
  const fall = async (status, code) => (await frappeSsoSitzung({ idToken: "t", baseUrl: "https://frappe.test", fetchImpl: antwort(status, { message: { code, message: "x" } }) }).catch((e) => e)).msCode;
  assert.equal(await fall(401, "invalid_token"), "token");
  assert.equal(await fall(403, "forbidden"), "gesperrt");
  assert.equal(await fall(404, "not_found"), "konto");
  assert.equal(await fall(500, "x"), "technik");
  let gesendet;
  await frappeSsoSitzung({ idToken: "tok", baseUrl: "https://frappe.test", fetchImpl: async (url, init) => ((gesendet = { url: String(url), init }), Response.json({ message: { user: "a", sid: "s" } })) });
  assert.equal(gesendet.url, "https://frappe.test/api/method/ph_microsoft.api.sso_sitzung");
  assert.deepEqual(JSON.parse(gesendet.init.body), { id_token: "tok" });
});

test("Abmelden: Microsoft-Logout-URL nur mit BACKOFFICE_MS_LOGOUT=1", async () => {
  const attrappe = msAttrappe();
  oidcCacheLeeren();
  assert.equal(await microsoftAbmeldeUrl({ modus: "frappe", env: ENV, fetchImpl: attrappe.fetchImpl }), null);
  const url = new URL(await microsoftAbmeldeUrl({ modus: "frappe", env: { ...ENV, BACKOFFICE_MS_LOGOUT: "1" }, fetchImpl: attrappe.fetchImpl }));
  assert.ok(url.pathname.endsWith("/oauth2/v2.0/logout"));
  assert.equal(url.searchParams.get("post_logout_redirect_uri"), "https://backoffice.example.test/login?abgemeldet=1");
  assert.equal(await microsoftAbmeldeUrl({ modus: "mock", env: { ...ENV, BACKOFFICE_MS_LOGOUT: "1" } }), null);
});

test("msKonfig: fehlende Werte nur als Env-Namen, Tenant muss GUID sein, Zusatz-Scopes", () => {
  const leer = msKonfig({});
  assert.equal(leer.konfiguriert, false);
  assert.ok(leer.fehlend.includes("BACKOFFICE_MS_TENANT_ID"));
  assert.equal(msKonfig({ ...ENV, BACKOFFICE_MS_TENANT_ID: "platzhirsch.onmicrosoft.com" }).konfiguriert, false);
  const k = msKonfig({ ...ENV, BACKOFFICE_MS_SCOPES: "User.Read" });
  assert.equal(k.konfiguriert, true);
  assert.deepEqual(k.scopes, ["openid", "profile", "email", "offline_access", "User.Read"]);
  // Zertifikat statt Secret
  const pem = privateKey.export({ format: "pem", type: "pkcs8" }).replace(/\n/g, "\\n");
  const z = msKonfig({ ...ENV, BACKOFFICE_MS_CLIENT_SECRET: "", BACKOFFICE_MS_CERT_KEY: pem, BACKOFFICE_MS_CERT_THUMBPRINT: "AB12" });
  assert.equal(z.konfiguriert, true);
  assert.ok(z.zertifikat);
});

// -------------------------------------------------------------- Mock-Flow --

async function demoDurchlauf(email, { secret = SECRET } = {}) {
  const { url, cookie } = await starteAnmeldung({ modus: "mock", env: {}, production: false, next: "", secret });
  assert.ok(url.startsWith("/auth/microsoft/demo?"));
  const p = new URL(url, "http://x").searchParams;
  assert.equal(p.get("client_id"), DEMO_CLIENT_ID);
  assert.equal(p.get("redirect_uri"), CALLBACK_PFAD);
  const code = demoCodeAusstellen({ email, nonce: p.get("nonce"), challenge: p.get("code_challenge"), method: p.get("code_challenge_method"), redirectUri: p.get("redirect_uri"), clientId: p.get("client_id") });
  return { code, state: p.get("state"), cookie };
}

test("Mock-Flow: Demo-Issuer, gleiche Zuordnung per E-Mail wie mockUsers, Code einmalig", async () => {
  const { code, state, cookie } = await demoDurchlauf("Crm-Leitung@demo.local");
  const basis = { modus: "mock", env: {}, production: false, secret: SECRET };
  const r = await beendeAnmeldung({ ...basis, query: { code, state }, flowCookie: cookie });
  assert.equal(r.user, "crm-leitung@demo.local");
  assert.deepEqual(r.roles, ["PH CRM Leitung", "PH CRM Mitarbeiter"]);
  assert.equal(r.frappeSid, null);
  assert.equal(r.art, "demo");
  // Code-Wiederverwendung
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code, state }, flowCookie: cookie })), "token");
  // unbekanntes Konto
  const u = await demoDurchlauf("niemand@demo.local");
  assert.equal(await grund(beendeAnmeldung({ ...basis, query: { code: u.code, state: u.state }, flowCookie: u.cookie })), "konto");
  // PKCE: Cookie eines anderen Durchlaufs (anderer verifier) passt nicht zum Code
  const a = await demoDurchlauf("gf@demo.local");
  const b = await demoDurchlauf("gf@demo.local");
  const kreuz = await beendeAnmeldung({ ...basis, query: { code: a.code, state: b.state }, flowCookie: b.cookie }).catch((e) => e);
  assert.equal(kreuz.msCode, "token");
  // Demo-Token mit falschem Aussteller wird von der Prüfung abgelehnt
  const iat = Math.floor(Date.now() / 1000);
  const falsch = demoTokenSignieren({ iss: "https://boese.example/v2.0", aud: DEMO_CLIENT_ID, tid: DEMO_TENANT, nonce: "n", iat, exp: iat + 60 });
  assert.equal(await grund(pruefeIdToken(falsch, { keys: demoJwks(), issuer: DEMO_ISSUER, audience: DEMO_CLIENT_ID, nonce: "n", tenants: [DEMO_TENANT] })), "iss");
  // ungültige Demo-Anfrage (ohne S256)
  assert.throws(() => demoCodeAusstellen({ email: "gf@demo.local", nonce: "n", challenge: "x", method: "plain", redirectUri: CALLBACK_PFAD, clientId: DEMO_CLIENT_ID }));
});

test("Mock-Flow in Produktion ohne BACKOFFICE_MOCK_PASSWORD gesperrt", async () => {
  assert.equal(microsoftVerfuegbar({ modus: "mock", env: {}, production: true }), false);
  assert.equal(await grund(starteAnmeldung({ modus: "mock", env: {}, production: true, secret: SECRET })), "nicht_eingerichtet");
  assert.equal(microsoftVerfuegbar({ modus: "mock", env: {}, production: false }), true);
  assert.equal(microsoftVerfuegbar({ modus: "frappe", env: ENV }), true);
  assert.equal(microsoftVerfuegbar({ modus: "frappe", env: {} }), false);
});

test("Startziel: gleiche Arbeitsplatz-Regel wie der Passwort-Login", () => {
  assert.equal(startziel({ roles: ["PH CRM Mitarbeiter"], next: "/crm/anfragen" }).ziel, "/crm/anfragen");
  assert.equal(startziel({ roles: ["PH CRM Mitarbeiter"], next: "//boese.example" }).ziel === "//boese.example", false);
  const kassa = startziel({ roles: ["PH Kassa Leitung", "PH Kassa Mitarbeiter"] });
  assert.ok(["/arbeitsplatz", "/kassa", "/"].includes(kassa.ziel));
});

// ------------------------------------------------------ Login-Arten-Schalter --

test("BACKOFFICE_LOGIN_ARTEN: Reihenfolge, Standard je Umgebung, unbekannte Werte ignoriert", () => {
  assert.deepEqual(loginArten({}, true), ["microsoft"]);
  assert.deepEqual(loginArten({}, false), ["microsoft", "passwort"]);
  assert.deepEqual(loginArten({ BACKOFFICE_LOGIN_ARTEN: "passwort, microsoft" }, true), ["passwort", "microsoft"]);
  assert.deepEqual(loginArten({ BACKOFFICE_LOGIN_ARTEN: "microsoft,password,microsoft" }, true), ["microsoft", "passwort"]);
  assert.deepEqual(loginArten({ BACKOFFICE_LOGIN_ARTEN: "google" }, true), ["microsoft"]);
  assert.deepEqual(notfallAdmins({ BACKOFFICE_NOTFALL_ADMINS: "Admin@demo.local; it@x.at,keine-mail" }), ["admin@demo.local", "it@x.at"]);
  assert.deepEqual(passwortZugelassen("x@y", { env: {}, production: false }), { ok: true, notfall: false });
  assert.deepEqual(passwortZugelassen("x@y", { env: {}, production: true }), { ok: false, notfall: false });
  assert.deepEqual(passwortZugelassen("ADMIN@demo.local", { env: { BACKOFFICE_NOTFALL_ADMINS: "admin@demo.local" }, production: true }), { ok: true, notfall: true });
});

test("Passwort-Login: abgeschaltet → nur Notfall-Admins mit Admin-Rolle", async () => {
  const env = { BACKOFFICE_LOGIN_ARTEN: "microsoft", BACKOFFICE_MOCK_PASSWORD: "pw", BACKOFFICE_NOTFALL_ADMINS: "admin@demo.local,gf@demo.local" };
  const fehler = async (args) => (await anmelden({ modus: "mock", production: true, env, ...args }).catch((e) => e)).code;
  assert.equal(await fehler({ email: "crm@demo.local", passwort: "pw" }), "forbidden");
  assert.equal(await fehler({ email: "gf@demo.local", passwort: "pw" }), "forbidden"); // gelistet, aber kein Admin
  assert.equal(await fehler({ email: "admin@demo.local", passwort: "falsch" }), "auth");
  const ok = await anmelden({ modus: "mock", production: true, env, email: "admin@demo.local", passwort: "pw" });
  assert.equal(ok.user, "admin@demo.local");
  // Passwort eingeschaltet: alle wie bisher
  const r = await anmelden({ modus: "mock", production: false, env: {}, email: "crm@demo.local", passwort: "demo" });
  assert.equal(r.user, "crm@demo.local");
});

test("OidcFehler ist ein Error mit grund", () => {
  const e = new OidcFehler("aud");
  assert.ok(e instanceof Error);
  assert.equal(e.grund, "aud");
});
