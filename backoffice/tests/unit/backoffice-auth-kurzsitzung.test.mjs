// Kurzsitzung/Freigabe (G-25) und Vorlieben je Benutzer (P0-8) im Mock.
//   node --test tests/unit/backoffice-auth-kurzsitzung.test.mjs
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MemorySessionStore, setSessionStore, sessionStore } from "../../src/lib/backoffice/auth/store.js";
import { resetRateLimit } from "../../src/lib/backoffice/auth/rateLimit.js";
import {
  KURZSITZUNG_TTL_MAX,
  KURZSITZUNG_ZWECKE,
  freigabeArt,
  freigeben,
  kurzsitzungEinloesen,
  kurzsitzungVerwerfen,
  mitKurzsitzung,
  personAlsSitzung,
  sitzungMitPasswort,
  sitzungMitPin,
} from "../../src/lib/backoffice/auth/kurzsitzung.js";
import {
  VORLIEBEN_STANDARD,
  benutzerHash,
  normalisiereVorlieben,
  patchUngueltig,
  vorliebenAusCookies,
  vorliebenCookieWerte,
  vorliebenHtmlAttribute,
  vorliebenLesen,
  vorliebenSkript,
  vorliebenSpeichern,
} from "../../src/lib/backoffice/auth/vorlieben.js";
import { AUTH_TEXTE, ZWECK_TITEL } from "../../src/lib/backoffice/auth/texte.js";

const KASSA = { user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"], sid: "sitzung-kassa" };
const MOCK = { modus: "mock", geraetToken: null };

beforeEach(() => {
  setSessionStore(new MemorySessionStore());
  resetRateLimit();
});

test("PIN der Leitung → Kurzsitzung, genau einmal einlösbar, Token nur als Hash im Store", async () => {
  const k = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  assert.match(k.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(k.art, "pin");
  assert.equal(k.user, "kassa-leitung@demo.local");
  assert.ok(k.ablauf - Date.now() <= 60_000 && k.ablauf - Date.now() > 55_000, "Standard 60 s");
  const schluessel = await sessionStore().schluesselListe("k:");
  assert.equal(schluessel.length, 1);
  assert.ok(!schluessel[0].includes(k.token), "kein Klartext-Token im Store");
  const person = await kurzsitzungEinloesen(k.token, { zweck: "kassa.freigabe", sitzung: KASSA });
  assert.equal(person.user, "kassa-leitung@demo.local");
  assert.deepEqual(person.roles, ["PH Kassa Leitung", "PH Kassa Mitarbeiter"]);
  await assert.rejects(() => kurzsitzungEinloesen(k.token, { zweck: "kassa.freigabe", sitzung: KASSA }), (e) => e.code === "auth" && e.message === AUTH_TEXTE.abgelaufen);
});

test("Recht und Vier-Augen: Mitarbeiterin kann nicht freigeben, Leitung nicht sich selbst", async () => {
  await assert.rejects(
    () => sitzungMitPin({ benutzer: "kassa@demo.local", pin: "4101", zweck: "kassa.freigabe", sitzung: { user: "kassa-leitung@demo.local", sid: "x" }, ...MOCK }),
    (e) => e.code === "forbidden" && e.message.includes(ZWECK_TITEL["kassa.freigabe"])
  );
  await assert.rejects(
    () => sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: { user: "kassa-leitung@demo.local", sid: "x" }, ...MOCK }),
    (e) => e.code === "forbidden" && e.message === AUTH_TEXTE.selbstFreigabe
  );
  // Admin darf überall freigeben
  const k = await sitzungMitPin({ benutzer: "admin@demo.local", pin: "2222", zweck: "logistik.leitungsfreigabe", sitzung: KASSA, ...MOCK });
  assert.equal(k.user, "admin@demo.local");
  // Stempeln für eine andere Person: jede Person mit PIN bestätigt sich selbst
  const s = await sitzungMitPin({ benutzer: "kassa@demo.local", pin: "4101", zweck: "personal.stempeln-fuer", sitzung: { user: "personal@demo.local", sid: "p" }, ...MOCK });
  assert.equal(s.user, "kassa@demo.local");
});

test("Eingaben: unbekannter Zweck, fehlende/falsche PIN, Fehlversuche gesperrt", async () => {
  await assert.rejects(() => sitzungMitPin({ benutzer: "a", pin: "1111", zweck: "kassa.irgendwas", ...MOCK }), (e) => e.code === "invalid" && e.message === AUTH_TEXTE.zweckUnbekannt);
  await assert.rejects(() => sitzungMitPin({ benutzer: "", pin: "1111", zweck: "kassa.freigabe", ...MOCK }), (e) => e.detail.field === "benutzer");
  await assert.rejects(() => sitzungMitPin({ benutzer: "gf@demo.local", pin: "", zweck: "kassa.freigabe", ...MOCK }), (e) => e.detail.field === "pin");
  await assert.rejects(() => sitzungMitPin({ benutzer: "gf@demo.local", pin: "12a", zweck: "kassa.freigabe", ...MOCK }), (e) => e.message === AUTH_TEXTE.pinFormat);
  const versuch = () => sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "9999", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  let gesperrt = null;
  for (let i = 0; i < 60 && !gesperrt; i++) {
    try {
      await versuch();
    } catch (e) {
      if (e.code === "rate_limited") gesperrt = e;
      else assert.equal(e.code, "auth");
    }
  }
  assert.ok(gesperrt, "nach dem Limit gesperrt");
  assert.match(gesperrt.message, /Fehlversuche/);
  // Auch die richtige PIN wird während der Sperre nicht geprüft.
  await assert.rejects(() => sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK }), (e) => e.code === "rate_limited");
});

test("Bindung: anderer Zweck oder anderer Arbeitsplatz verbraucht und verweigert", async () => {
  const a = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  await assert.rejects(() => kurzsitzungEinloesen(a.token, { zweck: "logistik.leitungsfreigabe", sitzung: KASSA }), (e) => e.message === AUTH_TEXTE.falscherZweck);
  await assert.rejects(() => kurzsitzungEinloesen(a.token, { zweck: "kassa.freigabe", sitzung: KASSA }), (e) => e.code === "auth", "auch nach Fehlversuch verbraucht");
  const b = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  await assert.rejects(() => kurzsitzungEinloesen(b.token, { zweck: "kassa.freigabe", sitzung: { ...KASSA, sid: "andere" } }), (e) => e.message === AUTH_TEXTE.fremdeSitzung);
  await assert.rejects(() => kurzsitzungEinloesen("kein-token", { zweck: "kassa.freigabe" }), (e) => e.code === "auth");
  const c = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  await kurzsitzungVerwerfen(c.token);
  assert.deepEqual(await sessionStore().schluesselListe("k:"), []);
});

test("Frist: Standard 60 s, höchstens 300 s, abgelaufene Kurzsitzung verweigert", async () => {
  const lang = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ttl: 9999, ...MOCK });
  assert.ok(lang.ablauf - Date.now() <= KURZSITZUNG_TTL_MAX * 1000);
  const k = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  // Einträge künstlich altern lassen
  const alle = await sessionStore().schluesselListe("k:");
  assert.equal(alle.length, 2);
  for (const s of alle) {
    const e = await sessionStore().wertLesen(s);
    await sessionStore().wertSetzen(s, { ...e, ablauf: Date.now() - 1 }, { ttlSekunden: 60 });
  }
  await assert.rejects(() => kurzsitzungEinloesen(k.token, { zweck: "kassa.freigabe", sitzung: KASSA }), (e) => e.code === "auth");
});

test("freigeben(): ein Schritt, Aktion läuft mit der Person, Protokoll ohne Geheimnisse", async () => {
  let gesehen = null;
  const r = await freigeben({ zweck: "kassa.freigabe", benutzer: "kassa-leitung@demo.local", pin: "4102", sitzung: KASSA, ...MOCK }, async (person) => {
    gesehen = personAlsSitzung(person);
    return { storniert: "BON-1" };
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.ergebnis, { storniert: "BON-1" });
  assert.equal(gesehen.user, "kassa-leitung@demo.local");
  assert.equal(gesehen.sid, null);
  assert.deepEqual(gesehen.kurzsitzung, { zweck: "kassa.freigabe", art: "pin" });
  assert.equal(r.freigabe.user, "kassa-leitung@demo.local");
  assert.equal(r.freigabe.text, "Freigegeben von Julia");
  assert.ok(!JSON.stringify(r.freigabe).includes("4102"));
  assert.deepEqual(await sessionStore().schluesselListe("k:"), [], "nach der Aktion beendet");
  // Fehler in der Aktion: Kurzsitzung trotzdem beendet
  const k = await sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", sitzung: KASSA, ...MOCK });
  await assert.rejects(() => mitKurzsitzung(k.token, { zweck: "kassa.freigabe", sitzung: KASSA, modus: "mock" }, async () => { throw new Error("Aktion scheitert"); }), /Aktion scheitert/);
  assert.deepEqual(await sessionStore().schluesselListe("k:"), []);
});

test("Prüfweg: Mock PIN; Frappe ohne P9 Passwort für Leitungsfreigaben, PIN fürs Stempeln", async () => {
  for (const z of Object.keys(KURZSITZUNG_ZWECKE)) assert.equal(freigabeArt(z, { modus: "mock" }), "pin");
  assert.equal(freigabeArt("kassa.freigabe", { modus: "frappe" }), "passwort");
  assert.equal(freigabeArt("personal.stempeln-fuer", { modus: "frappe" }), "pin");
  assert.equal(freigabeArt("kassa.freigabe", { modus: "frappe", pinSitzung: true }), "pin");
  await assert.rejects(() => sitzungMitPin({ benutzer: "kassa-leitung@demo.local", pin: "4102", zweck: "kassa.freigabe", modus: "frappe", geraetToken: null }), (e) => e.code === "forbidden" && e.detail.art === "passwort");
});

test("Passwort-Rückfall (Mock): richtig → Kurzsitzung, falsch → auth, abgeschaltet → klarer Hinweis", async () => {
  const env = { BACKOFFICE_MOCK_PASSWORD: "test-passwort" };
  const k = await sitzungMitPasswort({ benutzer: "kassa-leitung@demo.local", passwort: "test-passwort", zweck: "kassa.freigabe", sitzung: KASSA, modus: "mock", env, production: false });
  assert.equal(k.art, "passwort");
  await assert.rejects(() => sitzungMitPasswort({ benutzer: "kassa-leitung@demo.local", passwort: "falsch", zweck: "kassa.freigabe", sitzung: KASSA, modus: "mock", env, production: false }), (e) => e.code === "auth");
  await assert.rejects(() => sitzungMitPasswort({ benutzer: "kassa-leitung@demo.local", passwort: "", zweck: "kassa.freigabe", modus: "mock", env, production: false }), (e) => e.detail.field === "passwort");
  await assert.rejects(
    () => sitzungMitPasswort({ benutzer: "kassa-leitung@demo.local", passwort: "test-passwort", zweck: "kassa.freigabe", sitzung: KASSA, modus: "mock", env: { ...env, BACKOFFICE_LOGIN_ARTEN: "microsoft" }, production: false }),
    (e) => e.code === "forbidden" && e.message === AUTH_TEXTE.passwortAus
  );
});

// ------------------------------------------------------------------ Vorlieben --

test("Vorlieben: Standard, Bereinigung, Speichern je Benutzer unter Hash", async () => {
  assert.deepEqual(normalisiereVorlieben(null), VORLIEBEN_STANDARD);
  assert.deepEqual(normalisiereVorlieben({ theme: "neon", dichte: "kompakt", einzeltasten: "aus", fremd: 1 }), { theme: "system", dichte: "kompakt", einzeltasten: false });
  assert.equal(patchUngueltig({ theme: "dunkel" }), false);
  assert.equal(patchUngueltig({ theme: "neon" }), true);
  assert.equal(patchUngueltig({}), true);
  assert.equal(patchUngueltig({ theme: "hell", x: 1 }), true);
  assert.equal(await vorliebenLesen("crm@demo.local"), null);
  const v = await vorliebenSpeichern("crm@demo.local", { theme: "dunkel" });
  assert.deepEqual(v, { theme: "dunkel", dichte: "auto", einzeltasten: true });
  await vorliebenSpeichern("CRM@demo.local", { einzeltasten: false });
  assert.deepEqual(await vorliebenLesen("crm@demo.local"), { theme: "dunkel", dichte: "auto", einzeltasten: false });
  assert.equal(await vorliebenLesen("gf@demo.local"), null, "je Benutzer getrennt");
  const keys = await sessionStore().schluesselListe("v:");
  assert.deepEqual(keys, [`v:${benutzerHash("crm@demo.local")}`]);
  assert.ok(!keys[0].includes("crm"), "keine E-Mail im Schlüssel");
  // Erstes Speichern übernimmt die Cookie-Werte als Basis
  const b = await vorliebenSpeichern("shop@demo.local", { theme: "hell" }, { basis: { dichte: "komfortabel" } });
  assert.deepEqual(b, { theme: "hell", dichte: "komfortabel", einzeltasten: true });
});

test("Vorlieben: Cookies, <html>-Attribute und Inline-Skript passen zu globals.css, Segment.js, useKuerzel.js", () => {
  const v = { theme: "dunkel", dichte: "kompakt", einzeltasten: false };
  assert.deepEqual(vorliebenHtmlAttribute(v), { "data-theme": "dark", "data-dichte": "kompakt" });
  assert.deepEqual(vorliebenHtmlAttribute({ theme: "hell" }), { "data-theme": "light" });
  assert.deepEqual(vorliebenHtmlAttribute({}), {});
  const c = vorliebenCookieWerte(v);
  assert.deepEqual(c, { ph_bo_theme: "dunkel", ph_bo_dichte: "kompakt", ph_bo_einzeltasten: "aus" });
  assert.deepEqual(vorliebenAusCookies((n) => c[n]), v);
  const js = vorliebenSkript(v);
  assert.match(js, /setAttribute\("data-theme","dark"\)/);
  assert.match(js, /setItem\("ph_bo_dichte","kompakt"\)/);
  assert.match(js, /setItem\("ph-bo:einzeltasten","aus"\)/);
  const std = vorliebenSkript({});
  assert.match(std, /removeAttribute\("data-theme"\)/);
  assert.match(std, /removeItem\("ph-bo:einzeltasten"\)/);
  // Skript führt im Browser-Ersatz ohne Fehler aus
  const attr = {};
  const lager = {};
  const document = { documentElement: { setAttribute: (k, w) => (attr[k] = w), removeAttribute: (k) => delete attr[k] } };
  const localStorage = { setItem: (k, w) => (lager[k] = w), removeItem: (k) => delete lager[k] };
  new Function("document", "localStorage", js)(document, localStorage);
  assert.deepEqual(attr, { "data-theme": "dark", "data-dichte": "kompakt" });
  assert.deepEqual(lager, { ph_bo_theme: "dunkel", ph_bo_dichte: "kompakt", "ph-bo:einzeltasten": "aus" });
});
