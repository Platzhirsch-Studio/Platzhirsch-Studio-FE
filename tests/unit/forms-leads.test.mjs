// tests/unit/forms-leads.test.mjs — R2-leads: form contract in the frontends.
// Run: node --test tests/unit
// No network: fetch is always a mock. Never point these at the real backoffice.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { createTranslator } from "next-intl";
import { FORM_LOCALES, FORM_TEXT, errorKey } from "../../src/lib/forms/i18n.js";
import { codeFromStatus, elapsedSince, postForm, readFormResponse, withGuardFields } from "../../src/lib/forms/client.js";
import { guardForm } from "../../src/lib/forms/guard.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { beratungSchema, kontaktSchema, produktSchema } from "../../src/lib/forms/schemas.js";
// Runde 4 (P2 Sprache): IT ist jetzt voi; Vorschläge in tu werden über den dokumentierten Patch abgeglichen.
import { expectedFor } from "./r5-i18n-voi.lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Kontakt/copy.js reads the opening hours from "@/lib/site" since R3-shell
// (one source). Resolve the "@/" alias like Next does, then load it.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const file = path.join(ROOT, "src", specifier.slice(2));
    return nextResolve(pathToFileURL(fs.existsSync(file) ? file : `${file}.js`).href, context);
  },
});
const { KONTAKT_COPY, contactCopy } = await import("../../src/components/Kontakt/copy.js");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const NOW = 1_800_000_000_000;

function keysOf(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

// R5-i18n: the module tables (FORM_TEXT, KONTAKT_COPY) are gone; the single
// source is src/messages/*.json (forms.*, contact.*). The key lists come from
// the Runde-2/3 proposals (the contract of what the forms read); the texts are
// checked in the messages through next-intl itself.
const MESSAGES = Object.fromEntries(FORM_LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const R2 = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r2-leads.json"));
const R3 = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r3-inhalt.json"));
const FORM_KEYS = [...new Set([...keysOf(R2.de.forms), ...keysOf(R3.de.forms)])].sort();
const CONTACT_KEYS = Object.keys(R2.de.contact).sort();
const formsT = (l) => createTranslator({ locale: l, messages: MESSAGES[l], namespace: "forms" });
const formErrorText = (code, l, vars) => formsT(l)(errorKey(code), vars);

test("form texts: every locale has every key in the messages, none empty", () => {
  for (const l of FORM_LOCALES) {
    const t = formsT(l);
    for (const k of FORM_KEYS) {
      assert.equal(typeof t.raw(k), "string", `${l}: forms.${k}`);
      assert.ok(t.raw(k).trim().length > 0 || k === "privacyAfter", `${l}: forms.${k} empty`);
    }
    const contact = MESSAGES[l].contact;
    for (const k of CONTACT_KEYS) assert.ok(typeof contact[k] === "string" && contact[k].trim(), `${l}: contact.${k}`);
  }
});

test("module copies are gone: FORM_TEXT/KONTAKT_COPY hold no text, contactCopy is t()", () => {
  for (const l of FORM_LOCALES) {
    assert.deepEqual(FORM_TEXT[l], {}, `FORM_TEXT.${l}`);
    assert.deepEqual(KONTAKT_COPY[l], {}, `KONTAKT_COPY.${l}`);
  }
  const src = read("src/lib/forms/i18n.js");
  assert.doesNotMatch(src, /export function (formText|formErrorText|interpolate)\b/);
  assert.equal(contactCopy((k) => `T:${k}`, "de", "pageTitle"), "T:pageTitle");
});

test("every contract code has a translated text (never the API's English `error`)", () => {
  const apiEnglish = ["Invalid form data", "Payload too large", "Too many requests. Please try again later.", "Failed to submit contact form"];
  const codes = ["invalid", "invalid_email", "too_large", "rate_limited", "already_subscribed", "upstream", "failed", "timeout", "internal", "network", "unknown_new_code", "__proto__"];
  for (const l of FORM_LOCALES) {
    for (const code of codes) {
      const text = formErrorText(code, l, { phone: "+43 5574 46255" });
      assert.ok(text && !text.startsWith("error.") && !text.startsWith("forms."), `${l}/${code}`);
      assert.ok(!apiEnglish.includes(text), `${l}/${code} is not the API text`);
      assert.ok(!text.includes("{phone}"), `${l}/${code} phone filled`);
    }
  }
  assert.equal(errorKey("failed"), "error.upstream");
  assert.equal(errorKey("invalid_email"), "error.invalid");
  assert.match(formErrorText("rate_limited", "de"), /einigen Minuten/);
  assert.match(formErrorText("timeout", "it", { phone: "X" }), /X/);
});

test("texts: no superlatives, no exclamation marks, no promises, no dealer claims", () => {
  const all = FORM_LOCALES.flatMap((l) => [...FORM_KEYS.map((k) => formsT(l).raw(k)), ...CONTACT_KEYS.map((k) => MESSAGES[l].contact[k])]);
  for (const text of all) {
    assert.ok(!text.includes("!"), text);
    assert.doesNotMatch(text, /(^|[^\p{L}])(größte|beste|exklusiv|Luxus|offiziell|autorisiert|Händler|largest|best|official|exclusive)([^\p{L}]|$)|innerhalb von \d|within \d/iu, text);
  }
});

test("ICU in the messages: names and plurals format through next-intl", () => {
  assert.equal(formsT("de")("summary", { count: 1 }), "Bitte prüfen Sie ein Feld:");
  assert.equal(formsT("de")("summary", { count: 3 }), "Bitte prüfen Sie 3 Felder:");
  assert.equal(formsT("fr")("summary", { count: 2 }), "Veuillez vérifier 2 champs :");
  assert.equal(formsT("it")("summary", { count: 2 }), "Controllate 2 campi:"); // Runde 4: voi-Form
  assert.equal(formsT("de")("step", { current: 2, total: 4 }), "Schritt 2 von 4");
});

test("messages-r2-leads.json: merged, every proposal key is in the messages", () => {
  for (const l of FORM_LOCALES) {
    for (const k of keysOf(R2[l].forms)) assert.equal(typeof formsT(l).raw(k), "string", `forms.${k} merged in ${l}`);
    for (const k of Object.keys(R2[l].contact)) assert.ok(String(MESSAGES[l].contact[k] ?? "").trim(), `contact.${k} merged in ${l}`);
  }
});

// R6-leads: the R4 (cart.selection.*, booking.*) and R5 (forms.selfReport.*)
// proposals are merged too; the forms read them through next-intl.
test("messages-r4-leads / r5-leads: merged, readable through next-intl in every locale", () => {
  const R4 = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r4-leads.json"));
  const R5 = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r5-leads.json"));
  for (const l of FORM_LOCALES) {
    const t = createTranslator({ locale: l, messages: MESSAGES[l] });
    for (const k of [...keysOf(R4[l]), ...keysOf(R5[l])]) {
      const want = k.split(".").reduce((o, p) => o[p], { ...R4[l], ...R5[l] });
      assert.equal(t.raw(k), expectedFor(l, k, want), `${l}: ${k}`);
    }
    assert.equal(t("booking.note", { host: "calendar.app.google" }).includes("calendar.app.google"), true, `${l}: booking.note ICU`);
  }
});

test("_t is the duration since render, website is passed through", () => {
  assert.equal(elapsedSince(1000, 6400.4), 5400);
  assert.equal(elapsedSince(null, 5000), undefined);
  assert.equal(elapsedSince(5000, 5000), undefined, "0 ms → not sent");
  const body = withGuardFields({ name: "Erika" }, { website: "", renderedAt: 100, now: 4100 });
  assert.deepEqual(body, { name: "Erika", website: "", _t: 4000 });
  assert.deepEqual(withGuardFields({ a: 1 }, { website: 42 }), { a: 1, website: "" });
  assert.ok(body._t < 1e11, "duration, not an epoch timestamp");
});

test("server guard: frontend payloads pass after 3 s, bots get the fake success", async () => {
  const request = (body) =>
    new Request("http://localhost/api/kontakt", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.9" }, body: JSON.stringify(body) });
  const kontakt = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };
  const limiter = createRateLimiter();

  const ok = await guardForm(request(withGuardFields(kontakt, { renderedAt: 0, now: 5000 })), kontaktSchema, { route: "t-kontakt", limiter, now: NOW });
  assert.equal(ok.ok, true);
  assert.equal("website" in ok.data || "_t" in ok.data, false, "contract fields are not forwarded");

  const fast = await guardForm(request(withGuardFields(kontakt, { renderedAt: 0, now: 1200 })), kontaktSchema, { route: "t-kontakt", limiter, now: NOW });
  assert.equal(fast.ok, false);
  assert.equal(fast.response.status, 200, "time trap → fake success");

  const bot = await guardForm(request(withGuardFields(kontakt, { website: "https://spam.example", renderedAt: 0, now: 9000 })), kontaktSchema, { route: "t-kontakt", limiter, now: NOW });
  assert.equal(bot.ok, false);
  assert.equal(bot.response.status, 200, "honeypot → fake success");

  // Beratung and Produkt payloads as the new frontends build them.
  const beratung = withGuardFields(
    { bei_meiner_anfrage_geht_es_um: "einen Neubau", das_projekt_soll_verwirklicht_werden: "in einer Wohnung", bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten.", vorname: "Erika", nachname: "Muster", email: "erika@example.com", telefon: "+43 664 1234567" },
    { renderedAt: 0, now: 30000 }
  );
  assert.equal(beratungSchema.safeParse(beratung).success, true);
  const produkt = withGuardFields(
    { anfrage_type: "Person", anfrage_vorname: "Erika", anfrage_nachname: "Muster", anfrage_email: "erika@example.com", anfrage_phone: "066412345", anfrage_country: "Österreich", anfrage_city: "Lochau", anfrage_address: "Hauptstraße 1", anfrage_beschreibung: "", produkte: [12, "ab-3", null] },
    { renderedAt: 0, now: 30000 }
  );
  assert.equal(produktSchema.safeParse(produkt).success, true);
});

test("readFormResponse: success, code, field, status fallback", async () => {
  const ok = await readFormResponse(Response.json({ success: true, message: "x", data: { message: { name: "A-1" } } }));
  assert.equal(ok.ok, true);
  assert.equal(ok.data.data.message.name, "A-1", "UploadHandoff still gets the full answer");

  const bad = await readFormResponse(Response.json({ success: false, code: "invalid", error: "Invalid email format", field: "email_address" }, { status: 400 }));
  assert.deepEqual([bad.ok, bad.code, bad.field, bad.status], [false, "invalid", "email_address", 400]);

  const limited = await readFormResponse(Response.json({ success: false, code: "rate_limited", error: "Zu viele …" }, { status: 429 }));
  assert.equal(limited.code, "rate_limited");

  // No JSON / unknown code → from the status.
  assert.equal((await readFormResponse(new Response("<html>", { status: 502 }))).code, "upstream");
  assert.equal((await readFormResponse(new Response("", { status: 413 }))).code, "too_large");
  assert.equal((await readFormResponse(Response.json({ success: false, code: "weird" }, { status: 504 }))).code, "timeout");
  // 200 without success:true is not a success.
  assert.equal((await readFormResponse(Response.json({ ok: true }))).ok, false);
  assert.equal(codeFromStatus(400), "invalid");
  assert.equal(codeFromStatus(500), "upstream");
});

test("postForm: sends JSON once, network errors → code network", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return Response.json({ success: true, message: "ok", data: {} });
  };
  const res = await postForm("/api/upload/inquiry/kontakt", { a: 1, website: "", _t: 4000 }, { fetchImpl });
  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].init.body), { a: 1, website: "", _t: 4000 });

  const offline = await postForm("/x", {}, { fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  assert.deepEqual([offline.ok, offline.code], [false, "network"]);
});

test("all four lead forms use the contract pieces", () => {
  const forms = {
    "src/components/Kontakt/KontaktForm.js": "/api/upload/inquiry/kontakt",
    "src/components/BeratungClient/BeratungClient.js": "/api/upload/inquiry/beratung",
    "src/components/AnfrageFormProduct/AnfrageFormProduct.js": "/api/upload/inquiry/produkt",
    "src/app/[locale]/adventsabend/AdventsabendForm.js": "/api/kontakt",
  };
  for (const [file, url] of Object.entries(forms)) {
    const src = read(file);
    assert.ok(src.includes(url), `${file} posts to ${url}`);
    for (const piece of ["<Honeypot", "useFormGuard()", "<FormPrivacyNote", "<FormAlert", "postForm(", "errorText(", "focusField("]) {
      assert.ok(src.includes(piece), `${file} uses ${piece}`);
    }
    assert.ok(!/Date\.now\(\)/.test(src), `${file}: no clock timestamp for _t`);
    assert.ok(!/\.error\s*\|\||result\.error|data\.error/.test(src), `${file}: never shows the API's error text`);
  }
  const hp = read("src/components/Forms/Honeypot.js");
  for (const attr of ['aria-hidden="true"', "tabIndex={-1}", 'autoComplete="off"', 'name="website"']) assert.ok(hp.includes(attr), `honeypot ${attr}`);
  assert.ok(!/className="([^"]*\s)?(hidden|invisible)[\s"]|style=\{\{[^}]*display/.test(hp), "honeypot not display:none");
  // The UploadHandoff interface is used as before (R2-upload owns it).
  // R5-leads-perf loads it lazily after the send (Forms/lazyHandoff.js: handoffAfterSend).
  for (const file of Object.keys(forms).slice(0, 3)) assert.match(read(file), /(handoffFrom|handoffAfterSend)\("(kontakt|beratung|produkt)", \{ email(: [^,]+)?, result: result\.data(, locale)? \}\)/);
});

test("contact page: address from lib/site.js, no hard-coded house number", () => {
  for (const file of ["src/components/Kontakt/kontakt.js", "src/components/Kontakt/KontaktForm.js", "src/app/[locale]/kontakt/page.js"]) {
    assert.doesNotMatch(read(file), /Landstra(ß|ss)e\s*\d/, file);
  }
  assert.match(read("src/components/Kontakt/kontakt.js"), /ADDRESS\.street/);
});
