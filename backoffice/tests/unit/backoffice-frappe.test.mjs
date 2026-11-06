// Frappe-Fehlerabbildung (_server_messages, exc_type, HTTP-Status), Frappe-Client
// mit fetchImpl-Attrappe, Frappe-Login (sid, 2FA), Cent-/Datumsformate, CSV, Listen-Parameter.
//   node --test tests/unit/backoffice-frappe.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { BackofficeError, alsBackofficeError, codeAusExcType, fehlerAusFrappe, ohneHtml, serverMessages } from "../../src/lib/backoffice/frappe/errors.js";
import { FrappeClient } from "../../src/lib/backoffice/frappe/client.js";
import { frappeLogin } from "../../src/lib/backoffice/frappe/auth.js";
import { cent, centAlsEingabe, datum, datumZeit, doctypeSlug, euroZuCent, relativ } from "../../src/lib/backoffice/format.js";
import { alsCsv } from "../../src/lib/backoffice/csv.js";
import { listenAbfrage, mitParametern } from "../../src/lib/backoffice/listen.js";
import { validiere } from "../../src/lib/backoffice/validierung.js";

const BASE = "https://frappe.test";

function antwort(status, body, headers = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

test("_server_messages: JSON-in-JSON, HTML entfernt, mehrere Nachrichten", () => {
  const raw = JSON.stringify([JSON.stringify({ message: "<b>Pflichtfeld</b> fehlt: E-Mail", indicator: "red" }), JSON.stringify({ message: "Zweite&nbsp;Meldung" })]);
  assert.deepEqual(serverMessages(raw), ["Pflichtfeld fehlt: E-Mail", "Zweite Meldung"]);
  assert.deepEqual(serverMessages(undefined), []);
  assert.deepEqual(serverMessages("kein json"), ["kein json"]);
  assert.equal(ohneHtml("<p>a<br>b &amp; c</p>"), "a b & c");
});

test("Fehlerabbildung: exc_type und HTTP-Status → Code", () => {
  assert.equal(codeAusExcType("ValidationError", 417), "invalid");
  assert.equal(codeAusExcType("PermissionError", 403), "forbidden");
  assert.equal(codeAusExcType("DoesNotExistError", 404), "not_found");
  assert.equal(codeAusExcType("TimestampMismatchError", 409), "conflict");
  assert.equal(codeAusExcType(undefined, 429), "rate_limited");
  assert.equal(codeAusExcType(undefined, 502), "unavailable");
  const e = fehlerAusFrappe(417, { exc_type: "MandatoryError", _server_messages: JSON.stringify([JSON.stringify({ message: "Fehlt: <b>Nachname</b>" })]) });
  assert.ok(e instanceof BackofficeError);
  assert.equal(e.code, "invalid");
  assert.equal(e.message, "Fehlt: Nachname");
  assert.equal(e.excType, "MandatoryError");
  assert.equal(JSON.parse(JSON.stringify(e)).code, "invalid");
  const t = alsBackofficeError(Object.assign(new Error("x"), { name: "TimeoutError" }));
  assert.equal(t.code, "unavailable");
  const h = alsBackofficeError(Object.assign(new Error("x"), { name: "BackofficeError", status: 403 }));
  assert.equal(h.code, "forbidden");
});

test("FrappeClient: getList/getDoc/workflow mit Benutzer-sid, Service-Token nur für Systemaufgaben", async () => {
  const aufrufe = [];
  const fetchImpl = async (url, init) => {
    aufrufe.push({ url: String(url), init });
    if (String(url).includes("frappe.client.get_list")) return antwort(200, { message: [{ name: "PH-ANF-2026-00001" }] });
    if (String(url).includes("/api/resource/PH%20Anfrage/PH-ANF-2026-00001")) return antwort(200, { data: { name: "PH-ANF-2026-00001", status: "Neu" } });
    if (String(url).includes("apply_workflow")) return antwort(200, { message: { name: "PH-ANF-2026-00001", status: "Qualifiziert" } });
    if (String(url).includes("frappe.client.insert")) return antwort(417, { exc_type: "ValidationError", _server_messages: JSON.stringify([JSON.stringify({ message: "Ungültig" })]) });
    return antwort(404, { exc_type: "DoesNotExistError" });
  };
  const c = new FrappeClient({ user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"], frappeSid: "SID123" }, { baseUrl: BASE, token: "key:secret", fetchImpl });
  const liste = await c.getList("PH Anfrage", { fields: ["name"], filters: { status: "Neu" }, limit: 5 });
  assert.equal(liste[0].name, "PH-ANF-2026-00001");
  assert.equal(aufrufe[0].init.headers.Cookie, "sid=SID123");
  assert.equal(aufrufe[0].init.headers.Authorization, undefined, "Benutzeraktion nie mit Service-Token");
  const body = JSON.parse(aufrufe[0].init.body);
  assert.equal(body.doctype, "PH Anfrage");
  assert.equal(body.limit_page_length, 5);
  const doc = await c.getDoc("PH Anfrage", "PH-ANF-2026-00001");
  assert.equal(doc.status, "Neu");
  const w = await c.workflowAction("PH Anfrage", "PH-ANF-2026-00001", "Qualifizieren");
  assert.equal(w.status, "Qualifiziert");
  await assert.rejects(c.insert("PH Anfrage", {}), (e) => e.code === "invalid" && e.message === "Ungültig");
  await assert.rejects(c.getDoc("PH Anfrage", "fehlt"), (e) => e.code === "not_found");
  const s = new FrappeClient({ user: "backoffice@platzhirsch.studio", roles: [] }, { baseUrl: BASE, token: "key:secret", fetchImpl, service: true });
  await s.getList("PH Anfrage");
  assert.equal(aufrufe.at(-1).init.headers.Authorization, "token key:secret");
  assert.throws(() => new FrappeClient({}, { baseUrl: "" }), (e) => e.code === "unavailable");
});

test("Frappe-Login: sid aus Set-Cookie, Rollen aus User, 2FA-Zwischenschritt, falsche Daten → auth", async () => {
  const fetchImpl = async (url, init) => {
    const u = String(url);
    if (u.endsWith("/api/method/login")) {
      const b = JSON.parse(init.body);
      if (b.usr === "2fa@demo.local") return antwort(200, { verification: { method: "OTP App", prompt: "Code eingeben" }, tmp_id: "tmp-1" });
      if (b.pwd !== "richtig") return antwort(401, { exc_type: "AuthenticationError", _server_messages: JSON.stringify([JSON.stringify({ message: "Ungültiger Login" })]) });
      return antwort(200, { message: "Logged In", full_name: "Max" }, { "set-cookie": "sid=ABC123; Path=/; HttpOnly" });
    }
    if (u.includes("get_logged_user")) return antwort(200, { message: "max@demo.local" });
    if (u.includes("/api/resource/User/")) return antwort(200, { data: { name: "max@demo.local", full_name: "Max Muster", enabled: 1, roles: [{ role: "PH CRM Leitung" }, { role: "PH CRM Mitarbeiter" }] } });
    return antwort(404, {});
  };
  const ok = await frappeLogin({ email: "max@demo.local", passwort: "richtig", baseUrl: BASE, fetchImpl });
  assert.equal(ok.ok, true);
  assert.equal(ok.sid, "ABC123");
  assert.deepEqual(ok.roles, ["PH CRM Leitung", "PH CRM Mitarbeiter"]);
  assert.equal(ok.name, "Max Muster");
  const zwei = await frappeLogin({ email: "2fa@demo.local", passwort: "richtig", baseUrl: BASE, fetchImpl });
  assert.equal(zwei.verification, true);
  assert.equal(zwei.tmpId, "tmp-1");
  await assert.rejects(frappeLogin({ email: "max@demo.local", passwort: "falsch", baseUrl: BASE, fetchImpl }), (e) => e.code === "auth" && e.message === "Ungültiger Login");
});

test("Formate: Cent ↔ Euro, Datum, relativ, Slug", () => {
  assert.equal(cent(123450), "1.234,50 €".replace(" ", " "));
  assert.equal(cent(null), "–");
  assert.equal(centAlsEingabe(123450), "1234,50");
  assert.equal(euroZuCent("1.234,50"), 123450);
  assert.equal(euroZuCent("1234.5"), 123450);
  assert.equal(euroZuCent("12"), 1200);
  assert.equal(euroZuCent("12,345"), NaN);
  assert.equal(euroZuCent(""), null);
  assert.equal(datum("2026-11-04"), "04.11.2026");
  assert.equal(datumZeit("2026-11-04 09:30:00"), "04.11.2026, 09:30");
  assert.equal(relativ("2026-11-04 09:30:00", new Date("2026-11-04T09:35:00")), "vor 5 Min.");
  assert.equal(relativ("2026-11-03 09:30:00", new Date("2026-11-04T09:35:00")), "gestern");
  assert.equal(doctypeSlug("PH Newsletter Ausgabe"), "ph-newsletter-ausgabe");
  assert.equal(doctypeSlug("PH Geschäftsführung"), "ph-geschaeftsfuehrung");
});

test("CSV: Semikolon, BOM, Anführungszeichen, Cent als Euro", () => {
  const csv = alsCsv([{ fieldname: "name", label: "Nr." }, { fieldname: "titel", label: "Titel" }, { fieldname: "betrag_cent", label: "Betrag", cent: true }], [{ name: "A-1", titel: 'Sofa "Modul"; groß', betrag_cent: 123450 }]);
  assert.ok(csv.startsWith("﻿Nr.;Titel;Betrag\r\n"));
  assert.ok(csv.includes('A-1;"Sofa ""Modul""; groß";1234,50'));
});

test("Listen-Parameter → Frappe-Filter", () => {
  const meta = { sort_field: "eingang", sort_order: "DESC", title_field: "titel", search_fields: ["nachname", "email"], fields: [{ fieldname: "eingang", fieldtype: "Datetime" }, { fieldname: "status", fieldtype: "Select" }] };
  const a = listenAbfrage({ seite: "2", status: "Neu,Qualifiziert", von: "2026-11-01", bis: "2026-11-04", q: "muster", f_art: "Beratung", sort: "status", r: "asc" }, meta);
  assert.equal(a.start, 25);
  assert.equal(a.orderBy, "status asc");
  assert.deepEqual(a.filters, [["status", "in", ["Neu", "Qualifiziert"]], ["eingang", "between", ["2026-11-01", "2026-11-04"]], ["art", "=", "Beratung"]]);
  assert.deepEqual(a.orFilters, [["name", "like", "%muster%"], ["titel", "like", "%muster%"], ["nachname", "like", "%muster%"], ["email", "like", "%muster%"]]);
  assert.equal(listenAbfrage({}, meta).orderBy, "eingang desc");
  assert.equal(mitParametern("/d/ph-anfrage", { status: "Neu", seite: "3" }, { seite: null, sort: "name" }), "/d/ph-anfrage?status=Neu&sort=name");
});

test("Validierung aus Meta: Pflicht, Select, E-Mail, Cent", () => {
  const meta = {
    name: "T",
    fields: [
      { fieldname: "nachname", fieldtype: "Data", reqd: 1 },
      { fieldname: "email", fieldtype: "Data", options: "Email" },
      { fieldname: "art", fieldtype: "Select", auswahl: ["A", "B"] },
      { fieldname: "betrag_cent", fieldtype: "Int", cent: true },
      { fieldname: "status", fieldtype: "Select", auswahl: ["X"] },
    ],
  };
  const schlecht = validiere(meta, { nachname: "", email: "kein", art: "C", betrag_cent: "1,2,3" });
  assert.equal(schlecht.ok, false);
  assert.deepEqual(Object.keys(schlecht.fehler).sort(), ["art", "betrag_cent", "email", "nachname"]);
  const gut = validiere(meta, { nachname: "Muster", email: "m@beispiel.invalid", art: "A", betrag_cent: "1.234,50", status: "X" });
  assert.equal(gut.ok, true);
  assert.equal(gut.werte.betrag_cent, 123450);
  assert.equal("status" in gut.werte, false, "status wird nie aus dem Formular übernommen");
});
