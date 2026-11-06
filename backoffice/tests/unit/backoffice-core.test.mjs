// ph_core-Backoffice-Schnittstellen: Frappe-Wrapper (frappe/core.js) gegen fetch-Attrappe
// (Pfade, Parameter, Auth, Fehlerabbildung), Mock-Parität (mock/core.js, gleiche Schlüssel),
// PIN-Hash wie ph_core/utils/geraete.py, Fehlversuchssperre, Geräteprüfung (auth/geraet.js),
// PIN-Anmeldung (auth/login.js), Suche (suche.js) und Aktivität (dashboard.js).
//   node --test tests/unit/backoffice-core.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTWORT_SCHLUESSEL, CORE_METHODEN, phCore } from "../../src/lib/backoffice/frappe/core.js";
import * as frappeCore from "../../src/lib/backoffice/frappe/core.js";
import * as mockCore from "../../src/lib/backoffice/mock/core.js";
import { FrappeClient, phCoreFehler } from "../../src/lib/backoffice/frappe/client.js";
import { MockClient, mockDatenbank } from "../../src/lib/backoffice/mock/client.js";
import { geraetAusCookie, geraetEntfernen, geraetPruefen, geraetSpeichern, geraetLebenszeichen } from "../../src/lib/backoffice/auth/geraet.js";
import { sessionStore } from "../../src/lib/backoffice/auth/store.js";
import { anmeldenMitPin, bedienerListe } from "../../src/lib/backoffice/auth/login.js";
import { kernSuche, suche, trefferZuEintrag } from "../../src/lib/backoffice/suche.js";
import { aktivitaet } from "../../src/lib/backoffice/dashboard.js";

const BASE = "https://frappe.test";
const SVC = "svc-key:svc-secret";
const ADMIN = { user: "admin@demo.local", roles: ["PH Backoffice-Admin", "System Manager"] };
const GF = { user: "gf@demo.local", roles: ["PH Geschäftsführung"] };

function antwort(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** fetch-Attrappe: zeichnet Aufrufe auf, antwortet mit `antworten(url, init)` oder {message: ok}. */
function attrappe(antworten) {
  const aufrufe = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const body = init.body ? JSON.parse(init.body) : null;
    const eintrag = { pfad: u.pathname, query: Object.fromEntries(u.searchParams), method: init.method || "GET", headers: init.headers || {}, body };
    aufrufe.push(eintrag);
    return antworten ? antworten(eintrag) : antwort(200, { message: { ok: true } });
  };
  return { aufrufe, ctx: (session) => ({ session, fetchImpl, baseUrl: BASE, token: SVC }) };
}

// ------------------------------------------------------------ Frappe-Wrapper --

test("Frappe: Geräteprüfung/PIN/Bediener laufen mit Service-Token, nie mit der Benutzer-sid", async () => {
  const f = attrappe(() => antwort(200, { message: [] }));
  const s = { user: "kassa@x", roles: [], frappeSid: "SID-1" };
  await frappeCore.verifyDevice({ token: "T".repeat(43) }, f.ctx(s));
  await frappeCore.touchDevice({ token: "T".repeat(43) }, f.ctx(s));
  await frappeCore.verifyPin({ email: "a@b", pin: 4102, geraetToken: "T".repeat(43) }, f.ctx(s));
  await frappeCore.listOperators({ geraetToken: "T".repeat(43), alleStandorte: true }, f.ctx(s));
  const [v, t, p, o] = f.aufrufe;
  assert.equal(v.pfad, `/api/method/${CORE_METHODEN.verifyDevice}`);
  assert.equal(v.method, "POST");
  assert.deepEqual(v.body, { token: "T".repeat(43) });
  assert.equal(t.pfad, "/api/method/ph_core.api.geraete.touch_device");
  assert.equal(p.pfad, "/api/method/ph_core.api.bediener.verify_pin");
  assert.deepEqual(p.body, { email: "a@b", pin: "4102", geraet_token: "T".repeat(43) });
  assert.equal(o.pfad, "/api/method/ph_core.api.bediener.list_operators");
  assert.deepEqual(o.body, { geraet_token: "T".repeat(43), alle_standorte: 1 });
  for (const a of f.aufrufe) {
    assert.equal(a.headers.Authorization, `token ${SVC}`);
    assert.equal(a.headers.Cookie, undefined);
  }
});

test("Frappe: Registrieren, Liste, PIN setzen, Suche, Aktivität mit der Benutzer-sid; Parameter wie ph_core", async () => {
  const f = attrappe((a) => antwort(200, { message: a.method === "GET" ? [{ x: 1 }] : { ok: true, token: "neu" } }));
  const s = { user: "admin@x", roles: [], frappeSid: "SID-2" };
  await frappeCore.registerDevice({ geraetename: "Kassa 1", typ: "Kassa", standort: "Lochau", kasse: "", drucker: undefined }, f.ctx(s));
  const liste = await frappeCore.listDevices({ nurAktive: true, arbeitsplatz: ["kassa", "packtisch"] }, f.ctx(s));
  await frappeCore.setPin({ pin: "4711", user: "x@y", standort: "" }, f.ctx(s));
  await frappeCore.globalSearch({ q: "PH-ANF", limit: 12, doctypes: ["PH Anfrage", "PH Kontakt"] }, f.ctx(s));
  await frappeCore.recentActivity({ limit: 30, bereiche: ["crm"] }, f.ctx(s));
  const [r, l, p, g, a] = f.aufrufe;
  assert.equal(r.pfad, "/api/method/ph_core.api.geraete.register_device");
  assert.deepEqual(r.body, { geraetename: "Kassa 1", typ: "Kassa", standort: "Lochau" }, "leere Felder weggelassen");
  assert.equal(l.method, "GET");
  assert.equal(l.pfad, "/api/method/ph_core.api.geraete.list_devices");
  assert.deepEqual(l.query, { nur_aktive: "1", arbeitsplatz: "kassa,packtisch" });
  assert.deepEqual(liste, [{ x: 1 }]);
  assert.deepEqual(p.body, { pin: "4711", user: "x@y", standort: "" }, "standort '' leert das Feld bewusst");
  assert.equal(g.pfad, "/api/method/ph_core.api.suche.global_search");
  assert.deepEqual(g.query, { q: "PH-ANF", limit: "12", doctypes: "PH Anfrage,PH Kontakt" });
  assert.equal(a.pfad, "/api/method/ph_core.api.aktivitaet.recent_activity");
  assert.deepEqual(a.query, { limit: "30", bereiche: "crm" });
  for (const x of f.aufrufe) assert.equal(x.headers.Cookie, "sid=SID-2");
});

test("Frappe: ph_api-Fehler 1:1 → BackofficeError (invalid_pin/verbleibend, rate_limited/sekunden, gesperrt, invalid_token, field)", async () => {
  const faelle = [
    [401, { code: "invalid_pin", message: "PIN stimmt nicht.", verbleibend: 3 }, { code: "auth", phCode: "invalid_pin", status: 401, verbleibend: 3 }],
    [429, { code: "rate_limited", message: "PIN vorübergehend gesperrt.", sekunden: 840 }, { code: "rate_limited", phCode: "rate_limited", status: 429, sekunden: 840 }],
    [403, { code: "forbidden", message: "Gerät ist gesperrt.", gesperrt: true, geraet: "PH-GER-0001" }, { code: "forbidden", phCode: "forbidden", status: 403, gesperrt: true, geraet: "PH-GER-0001" }],
    [404, { code: "invalid_token", message: "Gerät unbekannt oder Token ungültig." }, { code: "not_found", phCode: "invalid_token", status: 404 }],
    [404, { code: "not_found", message: "Benutzer unbekannt." }, { code: "not_found", phCode: "not_found", status: 404 }],
    [400, { code: "invalid", message: "PIN muss aus 4 bis 6 Ziffern bestehen.", field: "pin" }, { code: "invalid", phCode: "invalid", status: 400, field: "pin" }],
  ];
  for (const [status, body, erwartet] of faelle) {
    const f = attrappe(() => antwort(status, { message: body }));
    await assert.rejects(frappeCore.verifyPin({ email: "a@b", pin: "1234", geraetToken: "T".repeat(43) }, f.ctx(null)), (err) => {
      assert.equal(err.name, "BackofficeError");
      for (const [k, v] of Object.entries(erwartet)) assert.equal(err[k], v, `${body.code}.${k}`);
      assert.equal(err.message, body.message);
      assert.equal(err.detail.phCode, body.code);
      if (body.verbleibend !== undefined) assert.equal(err.detail.verbleibend, body.verbleibend);
      return true;
    });
  }
  // Klassischer Frappe-Fehler (exc_type) bleibt bei der bisherigen Abbildung.
  const f = new FrappeClient({ user: "x", roles: [], frappeSid: "s" }, { baseUrl: BASE, fetchImpl: async () => antwort(403, { exc_type: "PermissionError", _server_messages: JSON.stringify([JSON.stringify({ message: "Nicht erlaubt" })]) }) });
  await assert.rejects(f.getDoc("PH Anfrage", "X"), (err) => err.code === "forbidden" && err.message === "Nicht erlaubt" && err.phCode === undefined);
});

// ---------------------------------------------------------------- Mock-Parität --

function schluessel(o) {
  return Object.keys(o).sort();
}

test("Mock-Parität: gleiche Antwortschlüssel wie ph_core für alle neun Funktionen; phCore(modus) wählt", async () => {
  mockCore.mockCoreReset();
  mockDatenbank({ reset: true });
  assert.equal(phCore("mock"), mockCore);
  assert.equal(phCore("frappe").verifyPin, frappeCore.verifyPin);
  for (const fn of Object.keys(CORE_METHODEN)) assert.equal(typeof mockCore[fn], "function", fn);

  const neu = await mockCore.registerDevice({ geraetename: "Kassa 1", typ: "Kassa", standort: "Lochau" }, { session: ADMIN });
  assert.deepEqual(schluessel(neu), [...ANTWORT_SCHLUESSEL.geraet, "token"].sort());
  assert.match(neu.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(neu.arbeitsplatz, "kassa");
  assert.match(neu.geraet, /^PH-GER-\d{4}$/);
  const v = await mockCore.verifyDevice({ token: neu.token });
  assert.deepEqual(schluessel(v), [...ANTWORT_SCHLUESSEL.geraet].sort());
  assert.match(v.zuletzt_gesehen, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.deepEqual(schluessel(await mockCore.touchDevice({ token: neu.token })), [...ANTWORT_SCHLUESSEL.touch].sort());
  const liste = await mockCore.listDevices({}, { session: ADMIN });
  assert.deepEqual(schluessel(liste[0]), [...ANTWORT_SCHLUESSEL.geraetListe].sort());
  assert.ok(!JSON.stringify(liste).includes("token_hash") && !JSON.stringify(liste).includes(neu.token), "nie Hash oder Token in der Liste");
  assert.deepEqual(schluessel(await mockCore.setPin({ pin: "4826" }, { session: { user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"] } })), [...ANTWORT_SCHLUESSEL.setPin].sort());
  assert.deepEqual(schluessel(await mockCore.verifyPin({ email: "kassa@demo.local", pin: "4826", geraetToken: neu.token })), [...ANTWORT_SCHLUESSEL.verifyPin].sort());
  const ops = await mockCore.listOperators({ geraetToken: neu.token });
  assert.deepEqual(schluessel(ops[0]), [...ANTWORT_SCHLUESSEL.bediener].sort());
  const treffer = await mockCore.globalSearch({ q: "PH-ANF-2026-00001" }, { session: GF });
  assert.deepEqual(schluessel(treffer[0]), [...ANTWORT_SCHLUESSEL.suche].sort());
  const akt = await mockCore.recentActivity({ limit: 5 }, { session: GF });
  assert.equal(akt.length, 5);
  assert.deepEqual(schluessel(akt[0]), [...ANTWORT_SCHLUESSEL.aktivitaet].sort());
});

test("Mock: Rechte und Fehler wie ph_core (Guest 403, Registrieren nur Admin/Leitung, Typprüfung, list_devices-Leserecht)", async () => {
  mockCore.mockCoreReset();
  await assert.rejects(mockCore.registerDevice({ geraetename: "X", typ: "Kassa" }, {}), (e) => e.phCode === "forbidden");
  await assert.rejects(mockCore.registerDevice({ geraetename: "X", typ: "Kassa" }, { session: { user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"] } }), (e) => e.phCode === "forbidden" && e.status === 403);
  await assert.rejects(mockCore.registerDevice({ geraetename: "X", typ: "Toaster" }, { session: ADMIN }), (e) => e.phCode === "invalid" && e.field === "typ");
  await assert.rejects(mockCore.registerDevice({ typ: "Kassa" }, { session: ADMIN }), (e) => e.phCode === "invalid" && e.field === "geraetename");
  const leitung = await mockCore.registerDevice({ geraetename: "Packtisch", typ: "Packtisch", arbeitsplatz: "unsinn" }, { session: { user: "kassa-leitung@demo.local", roles: ["PH Kassa Leitung"] } });
  assert.equal(leitung.arbeitsplatz, "packtisch");
  await assert.rejects(mockCore.listDevices({}, { session: { user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] } }), (e) => e.phCode === "forbidden");
  await assert.rejects(mockCore.verifyDevice({ token: "" }), (e) => e.phCode === "invalid" && e.field === "token");
  await assert.rejects(mockCore.verifyDevice({ token: "x".repeat(43) }), (e) => e.phCode === "invalid_token" && e.code === "not_found");
  await assert.rejects(mockCore.setPin({ pin: "1234" }, { session: ADMIN }), (e) => e.phCode === "invalid" && e.field === "pin" && /Zahlenfolge/.test(e.message));
  await assert.rejects(mockCore.setPin({ pin: "5555", user: "kassa@demo.local" }, { session: { user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] } }), (e) => e.phCode === "forbidden");
  await assert.rejects(mockCore.setPin({ pin: "4826", user: "niemand@demo.local" }, { session: ADMIN }), (e) => e.phCode === "not_found");
  assert.deepEqual(await mockCore.globalSearch({ q: "a" }, { session: GF }), []);
  await assert.rejects(mockCore.globalSearch({}, { session: GF }), (e) => e.phCode === "invalid" && e.field === "q");
});

// ------------------------------------------------------------ PIN und Sperre --

test("PIN-Hash: PBKDF2-HMAC-SHA256 bitgleich zu ph_core/utils/geraete.py; Token-Hash wie token_hash()", async () => {
  const salz = "00112233445566778899aabbccddeeff";
  assert.equal(await mockCore.pinHash("4102", salz), "pbkdf2_sha256$200000$00112233445566778899aabbccddeeff$4c8338b64b2e96f24a9846e4118d1a34cc1467bca7222c9e77bd874e99f8a278");
  const py1000 = "pbkdf2_sha256$1000$00112233445566778899aabbccddeeff$47f7c32a0f43d1725099a8b7265a7c498a734aad7a6562246edbeae538cc28a8";
  assert.equal(await mockCore.pinHash("4102", salz, 1000), py1000);
  assert.equal(await mockCore.pinPasst("4102", py1000), true);
  assert.equal(await mockCore.pinPasst("4103", py1000), false);
  assert.equal(await mockCore.pinPasst("4102", "md5$1$aa$bb"), false);
  assert.equal(await mockCore.pinPasst("4102", "pbkdf2_sha256$10$aa$bb"), false, "zu wenige Iterationen");
  assert.equal(mockCore.tokenHash("  Bearer abcdefghijklmnopqrstuvwxyz_-0123456789AB "), "1dad3ac14740640543cb070b0a6e69669a6ab5c704e78aed80d6efa2a409260f");
  assert.equal(mockCore.tokenHash("kurz"), "");
  assert.equal(mockCore.pinPruefen("1111"), "PIN darf nicht aus lauter gleichen Ziffern bestehen.");
  assert.equal(mockCore.pinPruefen("9876"), "PIN darf keine einfache Zahlenfolge sein.");
  assert.equal(mockCore.pinPruefen("12a4"), "PIN muss aus 4 bis 6 Ziffern bestehen.");
  assert.equal(mockCore.pinPruefen("4102"), null);
});

test("PIN-Sperre: 5 Fehlversuche je Benutzer+Gerät → 15 min rate_limited mit sekunden; danach wieder frei", async () => {
  mockCore.mockCoreReset();
  let t = Date.parse("2026-11-04T10:00:00Z");
  const ctx = { jetzt: () => t };
  const g = await mockCore.registerDevice({ geraetename: "Kassa 1", typ: "Kassa", standort: "Lochau" }, { session: ADMIN, ...ctx });
  const g2 = await mockCore.registerDevice({ geraetename: "Kassa 2", typ: "Kassa", standort: "Lochau" }, { session: ADMIN, ...ctx });
  const versuch = (pin, token = g.token) => mockCore.verifyPin({ email: "kassa-leitung@demo.local", pin, geraetToken: token }, ctx);
  for (let i = 1; i <= 5; i++) {
    await assert.rejects(versuch("9999"), (e) => e.phCode === "invalid_pin" && e.code === "auth" && e.status === 401 && e.verbleibend === 5 - i);
  }
  await assert.rejects(versuch("4102"), (e) => e.phCode === "rate_limited" && e.status === 429 && e.sekunden === 900, "auch die richtige PIN ist gesperrt");
  await assert.rejects(versuch("12"), (e) => e.phCode === "rate_limited", "Sperre vor Formatprüfung wie ph_core");
  assert.equal((await versuch("4102", g2.token)).user, "kassa-leitung@demo.local", "anderes Gerät ist nicht gesperrt");
  t += 14 * 60_000;
  await assert.rejects(versuch("4102"), (e) => e.phCode === "rate_limited" && e.sekunden === 60);
  t += 61_000;
  const ok = await versuch("4102");
  assert.equal(ok.user, "kassa-leitung@demo.local");
  assert.equal(ok.arbeitsplatz, "kassa");
  // Erfolg setzt den Zähler zurück
  await assert.rejects(versuch("9999"), (e) => e.verbleibend === 4);
  // Formatfehler zählt nicht
  await assert.rejects(versuch("12"), (e) => e.phCode === "invalid" && e.field === "pin");
  await assert.rejects(versuch("9999"), (e) => e.verbleibend === 3);
});

test("Gerät gesperrt → verify/touch/verifyPin/listOperators: forbidden mit gesperrt + geraet", async () => {
  mockCore.mockCoreReset();
  const g = await mockCore.registerDevice({ geraetename: "Kassa 1", typ: "Kassa" }, { session: ADMIN });
  assert.equal(mockCore.mockGeraetSperren(g.geraet, "verloren"), true);
  for (const fn of [() => mockCore.verifyDevice({ token: g.token }), () => mockCore.touchDevice({ token: g.token }), () => mockCore.verifyPin({ email: "kassa@demo.local", pin: "4101", geraetToken: g.token }), () => mockCore.listOperators({ geraetToken: g.token })]) {
    await assert.rejects(fn(), (e) => e.phCode === "forbidden" && e.gesperrt === true && e.geraet === g.geraet);
  }
  const zeile = (await mockCore.listDevices({}, { session: ADMIN }))[0];
  assert.equal(zeile.aktiv, 0);
  assert.equal(zeile.gesperrt_grund, "verloren");
});

test("listOperators: nur Bediener-Rollen (Kassa/Logistik/Montage/Techniker) oder Admin am Gerätestandort", async () => {
  mockCore.mockCoreReset();
  const g = await mockCore.registerDevice({ geraetename: "Kassa", typ: "Kassa", standort: "Lochau" }, { session: ADMIN });
  const ops = (await mockCore.listOperators({ geraetToken: g.token })).map((o) => o.user);
  for (const u of ["kassa@demo.local", "kassa-leitung@demo.local", "logistik@demo.local", "montage@demo.local", "techniker@demo.local", "admin@demo.local"]) assert.ok(ops.includes(u), u);
  for (const u of ["gf@demo.local", "crm@demo.local", "buchhaltung@demo.local"]) assert.ok(!ops.includes(u), u);
  await mockCore.setPin({ pin: "4826", user: "kassa@demo.local", standort: "Bregenz" }, { session: ADMIN });
  assert.ok(!(await mockCore.listOperators({ geraetToken: g.token })).some((o) => o.user === "kassa@demo.local"), "anderer Standort");
  assert.ok((await mockCore.listOperators({ geraetToken: g.token, alleStandorte: true })).some((o) => o.user === "kassa@demo.local"));
});

// -------------------------------------------------------------- Geräteprüfung --

test("auth/geraet (Mock): registrieren → Cookie-Token, Store kennt nur den Hash; prüfen, entfernen, Lebenszeichen", async () => {
  mockCore.mockCoreReset();
  const token = await geraetSpeichern({ name: "iPad Packtisch", standort: "Lochau", typ: "packtisch", registriertVon: ADMIN.user }, { session: ADMIN, modus: "mock" });
  const roh = JSON.stringify(await sessionStore().geraeteListe()) + JSON.stringify([...sessionStore().geraete.keys()]);
  assert.ok(!roh.includes(token), "kein Klartext-Token im Server-Store");
  assert.ok(sessionStore().geraete.has(mockCore.tokenHash(token)));
  const g = await geraetAusCookie(token, { modus: "mock", frisch: true });
  assert.equal(g.name, "iPad Packtisch");
  assert.equal(g.typ, "Packtisch");
  assert.equal(g.arbeitsplatz, "packtisch");
  assert.equal(g.registriertVon, ADMIN.user);
  assert.equal((await geraetLebenszeichen(token, { modus: "mock" })).ok, true);
  assert.equal(await geraetAusCookie("x".repeat(43), { modus: "mock" }), null);
  assert.equal(await geraetAusCookie(undefined, { modus: "mock" }), null);
  await assert.rejects(geraetSpeichern({ name: "X", standort: "L", typ: "toaster" }, { session: ADMIN, modus: "mock" }), (e) => e.code === "invalid");
  await geraetEntfernen(token);
  assert.equal(await sessionStore().geraetLesen(mockCore.tokenHash(token)), null);
});

test("auth/geraet (Frappe): verify_device 60 s gecacht, gesperrt → null, Frappe weg → letzter Stand", async () => {
  const token = "A".repeat(43);
  let modus = "ok";
  const f = attrappe((a) => {
    if (modus === "gesperrt") return antwort(403, { message: { code: "forbidden", message: "Gerät ist gesperrt.", gesperrt: true, geraet: "PH-GER-0007" } });
    if (modus === "weg") return antwort(502, { message: "Bad Gateway" });
    if (modus === "unbekannt") return antwort(404, { message: { code: "invalid_token", message: "Gerät unbekannt oder Token ungültig." } });
    return antwort(200, { message: { geraet: "PH-GER-0007", geraetename: "Kassa 7", typ: "Kassa", arbeitsplatz: "kassa", standort: "Lochau", kasse: null, drucker: null, drucker_typ: null, aktiv: 1, gesperrt_grund: null, zuletzt_gesehen: "2026-11-04T10:00:00" } });
  });
  const opts = (extra = {}) => ({ modus: "frappe", ctx: f.ctx(null), ...extra });
  await geraetEntfernen(token);
  const t0 = Date.now();
  const r1 = await geraetPruefen(token, opts({ jetzt: t0 }));
  assert.equal(r1.status, "ok");
  assert.equal(r1.geraet.name, "Kassa 7");
  assert.equal(f.aufrufe.length, 1);
  assert.equal(f.aufrufe[0].pfad, "/api/method/ph_core.api.geraete.verify_device");
  assert.equal(f.aufrufe[0].headers.Authorization, `token ${SVC}`);
  await geraetPruefen(token, opts({ jetzt: t0 + 30_000 }));
  assert.equal(f.aufrufe.length, 1, "innerhalb 60 s aus dem Cache");
  modus = "weg";
  const r2 = await geraetPruefen(token, opts({ jetzt: t0 + 120_000 }));
  assert.equal(r2.status, "ok", "Frappe nicht erreichbar → letzter bekannter Stand");
  modus = "gesperrt";
  const r3 = await geraetPruefen(token, opts({ frisch: true }));
  assert.equal(r3.status, "gesperrt");
  assert.equal(await geraetAusCookie(token, opts({ frisch: true })), null);
  modus = "weg";
  assert.equal((await geraetPruefen(token, opts())).status, "fehler", "nach Sperre kein Cache mehr");
  modus = "unbekannt";
  assert.equal((await geraetPruefen(token, opts())).status, "unbekannt");
});

// --------------------------------------------------------------- PIN-Anmeldung --

test("anmeldenMitPin/bedienerListe: mit Gerät über verifyPin/listOperators, Texte mit Restversuchen; Frappe ohne Gerät verweigert", async () => {
  mockCore.mockCoreReset();
  const g = await mockCore.registerDevice({ geraetename: "Kassa", typ: "Kassa", standort: "Lochau" }, { session: ADMIN });
  const r = await anmeldenMitPin({ email: "Kassa-Leitung@demo.local", pin: "4102", geraetToken: g.token, modus: "mock" });
  assert.equal(r.ok, true);
  assert.equal(r.user, "kassa-leitung@demo.local");
  assert.equal(r.kurzname, "Julia");
  assert.equal(r.geraet, g.geraet);
  assert.equal(r.frappeSid, null);
  await assert.rejects(anmeldenMitPin({ email: "kassa-leitung@demo.local", pin: "9999", geraetToken: g.token, modus: "mock" }), (e) => e.code === "auth" && /Noch 4 Versuche/.test(e.message) && e.detail.verbleibend === 4);
  // Mock ohne Gerät: Demo-Rückfall (Wechsel aus laufender Sitzung)
  assert.equal((await anmeldenMitPin({ email: "kassa@demo.local", pin: "4101", geraetToken: null, modus: "mock" })).user, "kassa@demo.local");
  await assert.rejects(anmeldenMitPin({ email: "kassa@demo.local", pin: "4101", geraetToken: null, modus: "frappe" }), (e) => e.code === "forbidden");
  const ops = await bedienerListe({ geraetToken: g.token, modus: "mock" });
  assert.ok(ops.some((o) => o.email === "kassa-leitung@demo.local" && o.name && o.roles.length && o.kurzname));
  assert.ok(!ops.some((o) => o.email === "gf@demo.local"));
  const demo = await bedienerListe({ geraetToken: null, modus: "mock" });
  assert.ok(demo.some((o) => o.email === "gf@demo.local"), "ohne Gerät: alle Demo-Benutzer des Standorts");
  assert.deepEqual(await bedienerListe({ geraetToken: null, modus: "frappe" }), []);
  // Frappe: verify_pin über die Attrappe, rate_limited-Text in Minuten
  const f = attrappe(() => antwort(429, { message: { code: "rate_limited", message: "PIN vorübergehend gesperrt.", sekunden: 600 } }));
  await assert.rejects(anmeldenMitPin({ email: "a@b", pin: "4826", geraetToken: g.token, modus: "frappe", ctx: f.ctx(null) }), (e) => e.code === "rate_limited" && /10 Minuten/.test(e.message) && e.sekunden === 600);
  assert.equal(f.aufrufe[0].pfad, "/api/method/ph_core.api.bediener.verify_pin");
});

// ------------------------------------------------------------ Suche/Aktivität --

test("Suche: Palette nutzt globalSearch (Mock) mit kodiertem href; Frappe-Fehler → null für den getList-Rückfall", async () => {
  mockDatenbank({ reset: true });
  const c = new MockClient(GF);
  const r = await suche(c, GF, "PH-ANF-2026-00001");
  const ds = r.gruppen.find((x) => x.titel === "Datensätze");
  assert.ok(ds.eintraege.some((e) => e.href === "/d/ph-anfrage/PH-ANF-2026-00001"));
  assert.deepEqual(trefferZuEintrag({ doctype: "PH Kontakt", name: "A/B 1", titel: "", status: "Aktiv", bereich: "crm" }), { titel: "A/B 1", hinweis: "Kontakt · A/B 1 · Aktiv", href: "/d/ph-kontakt/A%2FB%201", doctype: "PH Kontakt", bereich: "crm" });
  // Rechte: Shop sieht keine CRM-Treffer
  const shop = { user: "shop@demo.local", roles: ["PH Shop Mitarbeiter"] };
  assert.ok(!(await mockCore.globalSearch({ q: "PH-ANF-2026-00001" }, { session: shop })).some((t) => t.doctype === "PH Anfrage"));
  const fc = new FrappeClient({ user: "x", roles: [], frappeSid: "s" }, { baseUrl: BASE, fetchImpl: async () => antwort(404, { exc_type: "DoesNotExistError" }) });
  assert.equal(await kernSuche(fc, { user: "x", roles: [] }, "abc"), null);
});

test("Aktivität: Mock-Protokoll schreibt insert/save/workflowAction fort; Zusammenfassung nur Feld-Labels; Zentrale dedupliziert", async () => {
  mockDatenbank({ reset: true });
  const c = new MockClient(ADMIN);
  const [kontakt] = await c.getList("PH Kontakt", { fields: ["*"], limit: 1 });
  const meta = c.meta("PH Kontakt");
  const feld = meta.fields.find((f) => f.fieldtype === "Data" && !f.read_only && f.fieldname !== meta.title_field && !f.reqd && f.label);
  await c.save("PH Kontakt", { name: kontakt.name, [feld.fieldname]: "Geheimwert-123" });
  let akt = await mockCore.recentActivity({ limit: 3 }, { client: c });
  assert.equal(akt[0].doctype, "PH Kontakt");
  assert.equal(akt[0].name, kontakt.name);
  assert.equal(akt[0].art, "Geaendert");
  assert.equal(akt[0].zusammenfassung, `Geändert: ${feld.label}`);
  assert.equal(akt[0].benutzer, ADMIN.user);
  assert.equal(akt[0].benutzer_name, "Erika Beispiel (Admin)");
  assert.equal(akt[0].href_hinweis, `/d/ph-kontakt/${kontakt.name}`);
  assert.equal(akt[0].bereich, "crm");
  assert.ok(!JSON.stringify(akt).includes("Geheimwert-123"), "keine Feldwerte");

  const neu = await c.insert("PH Aufgabe", { titel: "Testaufgabe Protokoll", status: "Offen", faellig: "2026-11-30" });
  akt = await mockCore.recentActivity({ limit: 1, bereiche: ["zentrale"] }, { client: c });
  assert.equal(akt[0].name, neu.name);
  assert.equal(akt[0].art, "Angelegt");

  const [anfrage] = await c.getList("PH Anfrage", { fields: ["name"], filters: [["status", "=", "Neu"]], limit: 1 });
  const uebergaenge = await c.getTransitions("PH Anfrage", anfrage.name);
  if (uebergaenge.length) {
    await c.workflowAction("PH Anfrage", anfrage.name, uebergaenge[0].action);
    akt = await mockCore.recentActivity({ limit: 2, bereiche: "crm" }, { client: c });
    assert.ok(akt.some((e) => e.art === "Workflow" && e.name === anfrage.name && e.zusammenfassung.startsWith("Workflow: ")));
  }

  const zeilen = await aktivitaet(c, ADMIN, 8);
  assert.equal(zeilen.length, 8);
  const keys = zeilen.map((z) => `${z.doctype}-${z.name}`);
  assert.equal(new Set(keys).size, keys.length, "eindeutige Listenschlüssel");
  for (const k of ["doctype", "name", "titel", "modified", "von", "slug", "art", "zusammenfassung", "vonName", "href"]) assert.ok(k in zeilen[0], k);

  // Rechte: Shop-Mitarbeiter sieht keine CRM-Ereignisse
  const shop = { user: "shop@demo.local", roles: ["PH Shop Mitarbeiter"] };
  assert.ok(!(await mockCore.recentActivity({ limit: 100 }, { session: shop })).some((e) => e.bereich === "crm"));
});

test("phCoreFehler: unbekannter Code → unavailable, Zusatzfelder serialisierbar", () => {
  const e = phCoreFehler("irgendwas", "x", { sekunden: 3, fremd: "nein" }, 418);
  assert.equal(e.code, "unavailable");
  assert.equal(e.phCode, "irgendwas");
  assert.deepEqual(e.detail, { phCode: "irgendwas", sekunden: 3 });
  assert.equal(JSON.parse(JSON.stringify(e)).status, 418);
});
