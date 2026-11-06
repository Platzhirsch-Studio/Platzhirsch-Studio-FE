// tests/unit/kundenkarte.test.mjs – Kundenkarte Stufe 1 (04.11.2026).
// Run: node --test tests/unit/kundenkarte.test.mjs
// Geprüft: Formular-Schema und Browser-Validierung, DOI-Token-Fluss im Mock
// (eigener Temp-Ordner, kein Netz), Texte in 4 Sprachen ohne verbotene Wörter
// (Nachlässe/€/%/Superlative/Händler), Routen in STATIC und Sitemap-Liste,
// Teilnahmebedingungen als Entwurf, Portal-Demo-Karte, Frappe-Adapter-Mapping.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { COPY, INTERESSEN_KEYS, KUNDENKARTE_LOCALES, STUFEN, VORTEILE, allTexts, kundenkarteCopy } from "../../src/lib/kundenkarte/copy.js";
import { applicationSchema, birthdayOf, emptyValues, toPayload, validate, validateField } from "../../src/lib/kundenkarte/schema.js";
import { confirmHashOf, confirmMatches, newConfirmSecret, newReference, parseConfirmToken } from "../../src/lib/kundenkarte/token.js";
import { createMockAdapter } from "../../src/lib/kundenkarte/adapters/mock.js";
import { createFrappeAdapter } from "../../src/lib/kundenkarte/adapters/frappe.js";
import { ADAPTER_METHODS, assertAdapter } from "../../src/lib/kundenkarte/adapters/interface.js";
import { PUBLIC_ERRORS, apply, confirm, confirmUrlOf, idempotencyKeyOf } from "../../src/lib/kundenkarte/service.js";
import { CONFIRM_TTL_MS, ENV_NAMES, kundenkarteMode } from "../../src/lib/kundenkarte/config.js";
import { MARKER, TERMS_SECTIONS, TERMS_STATUS, termsOpenCount } from "../../src/lib/kundenkarte/terms.js";
import { buildDemoCard } from "../../src/lib/kundenkarte/portalMock.js";
import { STATIC, templateOf } from "../../src/lib/einblicke/routes.js";
import { MULTILINGUAL_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { footerLinkAllowed } from "../../src/lib/seo/footerLinks.js";

const NOW = Date.parse("2026-11-04T10:00:00Z");
const quiet = { info() {}, warn() {}, error() {} };
const INPUT = { vorname: "Erika", nachname: "Muster", email: "Erika@Example.com", telefon: "", plz: "6911", ort: "Lochau", geburtstag: "--03-14", interessen: ["wohnen", "licht"], einwilligung_auswertung: true, einwilligung_newsletter: false, kenntnisnahme: true, sprache: "de" };

function tmp() {
  const dir = mkdtempSync(path.join(tmpdir(), "ph-kundenkarte-"));
  return { dir, clean: () => rmSync(dir, { recursive: true, force: true }) };
}
function memMailer() {
  const sent = [];
  return { sent, send: async (mail, meta) => (sent.push({ mail, meta }), { ok: true }) };
}

// --- Schema / Validierung -----------------------------------------------------
test("01 Schema: Pflicht Name + E-Mail + Kenntnisnahme; Einwilligungen getrennt und standardmäßig aus", () => {
  const ok = applicationSchema.parse({ vorname: " Erika ", nachname: "Muster", email: "Erika@Example.com ", kenntnisnahme: true });
  assert.equal(ok.vorname, "Erika");
  assert.equal(ok.email, "erika@example.com");
  assert.equal(ok.einwilligung_auswertung, false);
  assert.equal(ok.einwilligung_newsletter, false);
  assert.deepEqual(ok.interessen, []);
  assert.equal(ok.geburtstag, "");
  assert.equal(ok.sprache, "de");
  for (const bad of [
    { ...INPUT, vorname: "" },
    { ...INPUT, nachname: "   " },
    { ...INPUT, email: "keine-adresse" },
    { ...INPUT, kenntnisnahme: false },
    { ...INPUT, telefon: "abc" },
    { ...INPUT, geburtstag: "14.03." },
    { ...INPUT, geburtstag: "--02-30" },
    { ...INPUT, interessen: ["rabatte"] },
    { ...INPUT, sprache: "es" },
  ]) {
    assert.equal(applicationSchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
  const full = applicationSchema.parse({ ...INPUT, einwilligung_newsletter: "1", interessen: ["wohnen", "wohnen", "licht"], extra: "weg" });
  assert.equal(full.einwilligung_newsletter, true);
  assert.deepEqual(full.interessen, ["wohnen", "licht"]);
  assert.equal("extra" in full, false, "Allowlist: unbekannte Felder fallen weg");
});

test("02 Geburtstag: Tag+Monat genügen, Jahr optional, Unsinn wird erkannt", () => {
  const now = new Date("2026-11-04");
  assert.equal(birthdayOf({ tag: "", monat: "", jahr: "" }), "");
  assert.equal(birthdayOf({ tag: "7", monat: "3" }), "--03-07");
  assert.equal(birthdayOf({ tag: 29, monat: 2 }), "--02-29");
  assert.equal(birthdayOf({ tag: "7", monat: "3", jahr: "1980" }, now), "1980-03-07");
  assert.equal(birthdayOf({ tag: "29", monat: "2", jahr: "1981" }, now), null, "kein Schaltjahr");
  assert.equal(birthdayOf({ tag: "31", monat: "4" }), null);
  assert.equal(birthdayOf({ tag: "", monat: "4" }), null, "Monat ohne Tag");
  assert.equal(birthdayOf({ tag: "7", monat: "3", jahr: "2031" }, now), null, "Zukunft");
  assert.equal(birthdayOf({ tag: "7", monat: "3", jahr: "80" }, now), null);
});

test("03 Browser-Validierung spiegelt das Schema; Payload trägt ISO-Teildatum und beide Einwilligungen", () => {
  const v = emptyValues();
  const errs = validate(v);
  assert.deepEqual(Object.keys(errs).sort(), ["email", "kenntnisnahme", "nachname", "vorname"]);
  assert.equal(validateField("telefon", { ...v, telefon: "+43 5574 46255" }), null);
  assert.equal(validateField("telefon", { ...v, telefon: "x" }), "telefon");
  assert.equal(validateField("geburtstag", { ...v, tag: "5", monat: "" }), "geburtstag");
  assert.equal(validateField("jahr", { ...v, tag: "5", monat: "5", jahr: "1899" }), "jahr");
  const filled = { ...v, vorname: "Max", nachname: "Muster", email: "max@example.com", tag: "14", monat: "3", interessen: ["kueche"], einwilligung_newsletter: true, kenntnisnahme: true };
  assert.deepEqual(validate(filled), {});
  const p = toPayload(filled, "fr");
  assert.equal(p.geburtstag, "--03-14");
  assert.equal(p.einwilligung_auswertung, false);
  assert.equal(p.einwilligung_newsletter, true);
  assert.equal(p.sprache, "fr");
  assert.equal(applicationSchema.safeParse(p).success, true);
  assert.ok(!("website" in p) && !("_t" in p), "Honeypot/Zeitfalle ergänzt useFormGuard, nicht die Payload");
});

// --- Token ---------------------------------------------------------------------
test("04 Token: Antragsnummer KK-XXXXXX, Geheimnis nur als Hash gespeichert, Vergleich in konstanter Zeit", () => {
  const ref = newReference();
  assert.match(ref, /^KK-[2-9A-HJ-NP-Z]{6}$/);
  const secret = newConfirmSecret();
  assert.equal(secret.length, 43);
  const hash = confirmHashOf(secret);
  assert.equal(hash.length, 64);
  assert.ok(confirmMatches(secret, hash));
  assert.equal(confirmMatches(newConfirmSecret(), hash), false);
  assert.equal(confirmMatches(secret, "kurz"), false);
  assert.deepEqual(parseConfirmToken(`${ref}.${secret}`), { ref, secret });
  assert.equal(parseConfirmToken("PT-ABCDEF.x"), null);
  assert.equal(parseConfirmToken(`${ref}.${secret}x`), null);
  assert.equal(confirmUrlOf("https://platzhirsch.studio", "it", `${ref}.${secret}`), `https://platzhirsch.studio/it/kundenkarte/bestaetigen?token=${ref}.${secret}`);
});

// --- DOI-Fluss im Mock ------------------------------------------------------------
test("05 Mock: Antrag → Mail mit Link → Bestätigung → aktiv mit Kartennummer; zweiter Klick „schon bestätigt“", async () => {
  const { dir, clean } = tmp();
  try {
    const adapter = assertAdapter(createMockAdapter({ dir, now: () => NOW }));
    const mailer = memMailer();
    const r = await apply({ adapter, input: INPUT, origin: "http://localhost:3000", now: NOW, log: quiet, mailer });
    assert.equal(r.ok, true);
    assert.equal(r.pending, true);
    assert.match(r.application.ref, /^KK-/);
    assert.equal(r.application.status, "unbestaetigt");
    assert.ok(!("email" in r.application), "Antwort ohne E-Mail-Adresse");
    assert.equal(mailer.sent.length, 1);
    const mail = mailer.sent[0].mail;
    assert.equal(mail.to, "erika@example.com");
    assert.match(mail.subject, /Kundenkarte/);
    const url = mail.text.match(/http:\/\/localhost:3000\/de\/kundenkarte\/bestaetigen\?token=([^\s]+)/);
    assert.ok(url, "Bestätigungslink in der Mail");
    assert.equal(r.devConfirmUrl, `/de/kundenkarte/bestaetigen?token=${url[1]}`);
    assert.doesNotMatch(mail.text, /€|%|Rabatt/);

    // Im Speicher: nur Hash, kein Geheimnis; Status unbestätigt.
    const stored = JSON.parse(await readFile(path.join(dir, "antraege.json"), "utf8"));
    assert.equal(stored.length, 1);
    assert.equal(stored[0].confirmHash.length, 64);
    assert.ok(!JSON.stringify(stored).includes(url[1].split(".")[1]), "Geheimnis steht nicht im Speicher");
    assert.deepEqual(await adapter.status("ERIKA@example.com"), { found: true, status: "unbestaetigt" });

    const falsch = await confirm({ adapter, token: `${r.application.ref}.${newConfirmSecret()}`, log: quiet });
    assert.deepEqual(falsch, { ok: false, code: "invalid_token" });
    assert.equal(PUBLIC_ERRORS.invalid_token, 400);

    const c1 = await confirm({ adapter, token: decodeURIComponent(url[1]), log: quiet });
    assert.equal(c1.ok, true);
    assert.equal(c1.already, false);
    assert.equal(c1.application.status, "aktiv");
    const c2 = await confirm({ adapter, token: decodeURIComponent(url[1]), log: quiet });
    assert.equal(c2.ok, true);
    assert.equal(c2.already, true);
    assert.deepEqual(await adapter.status("erika@example.com"), { found: true, status: "aktiv" });
    const after = JSON.parse(await readFile(path.join(dir, "antraege.json"), "utf8"));
    assert.match(after[0].kartennummer, /^PH-2026-\d{6}$/);

    // Aktive Karte: neuer Antrag mit derselben Adresse → conflict 409.
    const again = await apply({ adapter, input: INPUT, origin: "http://localhost:3000", now: NOW + 1000, log: quiet, mailer });
    assert.deepEqual(again, { ok: false, code: "conflict" });
    assert.equal(PUBLIC_ERRORS.conflict, 409);
    assert.equal(mailer.sent.length, 1, "keine zweite Mail");
  } finally {
    clean();
  }
});

test("06 Mock: abgelaufener Link → expired; erneuter Antrag erneuert Link und Angaben; Idempotenz am selben Tag ohne zweite Mail", async () => {
  const { dir, clean } = tmp();
  try {
    let now = NOW;
    const adapter = createMockAdapter({ dir, now: () => now });
    const mailer = memMailer();
    const r1 = await apply({ adapter, input: INPUT, origin: "", now, log: quiet, mailer });
    const link1 = mailer.sent[0].mail.text.match(/token=([^\s]+)/)[1];
    // Doppelklick / Neuladen: gleicher Idempotenzschlüssel → keine zweite Mail, gleiche Nummer.
    const r2 = await apply({ adapter, input: INPUT, origin: "", now: now + 5000, log: quiet, mailer });
    assert.equal(r2.application.ref, r1.application.ref);
    assert.equal(mailer.sent.length, 1);
    assert.equal(r2.devConfirmUrl, undefined);
    assert.equal(idempotencyKeyOf("Erika@Example.com", now), idempotencyKeyOf("erika@example.com", now + 5000));

    now = NOW + CONFIRM_TTL_MS + 1000;
    const late = await confirm({ adapter, token: link1, log: quiet });
    assert.deepEqual(late, { ok: false, code: "expired" });
    assert.equal(PUBLIC_ERRORS.expired, 410);

    // Neuer Tag, neuer Antrag: Link und Vorname erneuert, Antragsnummer bleibt.
    const r3 = await apply({ adapter, input: { ...INPUT, vorname: "Erika-Maria" }, origin: "", now, log: quiet, mailer });
    assert.equal(r3.application.ref, r1.application.ref);
    assert.equal(r3.application.vorname, "Erika-Maria");
    assert.equal(mailer.sent.length, 2);
    const link3 = mailer.sent[1].mail.text.match(/token=([^\s]+)/)[1];
    assert.equal((await confirm({ adapter, token: link1, log: quiet })).ok, false, "alter Link ungültig");
    assert.equal((await confirm({ adapter, token: link3, log: quiet })).ok, true);
  } finally {
    clean();
  }
});

test("07 Mock-Mailer fehlt → unavailable 503 (nicht im Testbetrieb); Portal-Karte und Wallet", async () => {
  const { dir, clean } = tmp();
  try {
    const adapter = createMockAdapter({ dir, now: () => NOW });
    const noMail = { send: async () => ({ ok: false }) };
    const r = await apply({ adapter, input: INPUT, origin: "", now: NOW, log: quiet, mailer: noMail });
    assert.equal(r.ok, true, "Mock (test=true) bleibt erfolgreich, Link liegt im Postausgang");
    const prod = { ...adapter, test: false };
    const r2 = await apply({ adapter: prod, input: { ...INPUT, email: "zwei@example.com" }, origin: "", now: NOW, log: quiet, mailer: noMail });
    assert.deepEqual(r2, { ok: false, code: "unavailable" });
    assert.equal(PUBLIC_ERRORS.unavailable, 503);
    assert.equal(PUBLIC_ERRORS.rate_limited, 429);
    assert.equal(PUBLIC_ERRORS.invalid, 400);

    const card = await adapter.portalCard("CONT-1", "tok");
    assert.equal(card.kartennummer, "PH-2026-000042");
    assert.deepEqual(await adapter.walletPass("CONT-1", "tok", "apple"), { ok: false, code: "unavailable" });
    assert.equal(await adapter.portalCard("", ""), null);
  } finally {
    clean();
  }
});

test("08 Frappe-Adapter: Methodenpfade ph_kundenkarte.api.*, Felder laut Vertrag, Fehlercodes gemappt", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.includes("create_card_application")) return new Response(JSON.stringify({ message: { referenz: "KK-ABCDEF", status: "Neu", doi: true, doi_token: null, email_maskiert: "e***@example.com", bereits_vorhanden: false } }), { status: 200 });
    if (url.includes("confirm_card_application")) return new Response(JSON.stringify({ message: { referenz: "KK-ABCDEF", status: "aktiv", kartennummer: "KK-7K3QX9", bereits_bestaetigt: true } }), { status: 200 });
    if (url.includes("get_card_status")) return new Response(JSON.stringify({ message: { found: true, status: "aktiv" } }), { status: 200 });
    if (url.includes("portal_card")) return new Response(JSON.stringify({ message: { kartennummer: "PH-1", stufe: { name: "Platzhirsch", farbe: "paper", seit: "2026-01-01" }, naechste_stufe: null, vorteile: [], einloesungen: [], wallet: { apple: false, google: false } } }), { status: 200 });
    if (url.includes("portal_wallet_pass")) return new Response(JSON.stringify({ exc_type: "ValidationError" }), { status: 503 });
    return new Response("{}", { status: 404 });
  };
  const a = assertAdapter(createFrappeAdapter({ url: "https://backoffice.example.invalid", key: "k", secret: "s", methodBase: "ph_kundenkarte.api" }, { fetchImpl }));
  assert.deepEqual([...ADAPTER_METHODS], ["create", "confirm", "status", "portalCard", "walletPass"]);

  const secret = newConfirmSecret();
  const c = await a.create({ ...INPUT, email: "erika@example.com", confirmHash: confirmHashOf(secret), idem: "idem-1", einwilligung_text_version: "v1" });
  assert.equal(c.ok, true);
  assert.equal(c.application.ref, "KK-ABCDEF");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].url, "https://backoffice.example.invalid/api/method/ph_kundenkarte.api.create_card_application");
  assert.equal(calls[0].init.headers.Authorization, "token k:s");
  assert.deepEqual(Object.keys(body).sort(), ["confirm_hash", "einwilligung_auswertung", "einwilligung_newsletter", "einwilligung_textversion", "email", "geburtstag", "idempotency_key", "interessen", "nachname", "newsletter_textversion", "ort", "plz", "quelle", "sprache", "telefon", "vertragsdaten_akzeptiert", "vorname"]);
  assert.equal(body.vertragsdaten_akzeptiert, 1, "Backend-Pflichtfeld (ph_kundenkarte.api.create_card_application)");
  assert.equal(c.application.status, "unbestaetigt", "Backend „Neu“ → Website „unbestaetigt“");
  assert.equal(body.quelle, "website");
  assert.equal(body.idempotency_key, "idem-1");
  assert.equal(body.einwilligung_auswertung, 1);
  assert.equal(body.einwilligung_newsletter, 0);
  assert.ok(!("kenntnisnahme" in body));

  const k = await a.confirm("KK-ABCDEF", secret);
  assert.equal(k.ok, true);
  assert.equal(k.already, true);
  assert.equal(k.application.kartennummer, "KK-7K3QX9");
  const cb = JSON.parse(calls[1].init.body);
  assert.equal(cb.antrag, "KK-ABCDEF");
  assert.equal(cb.confirm_hash, confirmHashOf(secret), "nur der Hash geht ans Backoffice");
  assert.ok(!calls[1].init.body.includes(secret));

  assert.deepEqual(await a.status("erika@example.com"), { found: true, status: "aktiv" });
  assert.equal(calls[2].init.method, "GET");
  assert.match(calls[2].url, /get_card_status\?email=erika%40example\.com$/);
  assert.equal((await a.portalCard("CONT-1", "tok")).kartennummer, "PH-1");
  assert.match(calls[3].url, /portal_card\?kontakt=CONT-1&kunde_token=tok$/);
  assert.deepEqual(await a.walletPass("CONT-1", "tok", "google"), { ok: false, code: "unavailable" });

  // Fehlerbild: 409 → conflict, 429 → rate_limited, 400 → invalid, Netzfehler → unavailable
  for (const [status, code] of [[409, "conflict"], [429, "rate_limited"], [400, "invalid"], [500, "unavailable"]]) {
    const b = createFrappeAdapter({ url: "https://x.invalid", key: "k", secret: "s", methodBase: "ph_kundenkarte.api" }, { fetchImpl: async () => new Response("{}", { status }) });
    assert.deepEqual(await b.create({ ...INPUT, confirmHash: "h", idem: "i" }), { ok: false, code }, String(status));
  }
  const down = createFrappeAdapter({ url: "https://x.invalid", key: "k", secret: "s", methodBase: "ph_kundenkarte.api" }, { fetchImpl: async () => { throw new Error("ECONNREFUSED"); } });
  assert.deepEqual(await down.create({ ...INPUT, confirmHash: "h", idem: "i" }), { ok: false, code: "unavailable" });
});

test("09 Betriebsart: Dev ohne Schlüssel = mock, Produktion ohne Schlüssel = off, vollständig = frappe; Env-Namen dokumentiert", () => {
  assert.equal(kundenkarteMode({ NODE_ENV: "development" }), "mock");
  assert.equal(kundenkarteMode({ NODE_ENV: "production" }), "off");
  assert.equal(kundenkarteMode({ NODE_ENV: "production", KUNDENKARTE_MOCK: "1" }), "off", "Mock nie in Produktion");
  assert.equal(kundenkarteMode({ NODE_ENV: "development", KUNDENKARTE_PROVIDER: "none" }), "off");
  const full = { NODE_ENV: "production", KUNDENKARTE_PROVIDER: "frappe", FRAPPE_KUNDENKARTE_URL: "https://backoffice.example.invalid", FRAPPE_KUNDENKARTE_KEY: "k", FRAPPE_KUNDENKARTE_SECRET: "s", KUNDENKARTE_MAIL_API_KEY: "m", KUNDENKARTE_MAIL_FROM: "karte@example.com" };
  assert.equal(kundenkarteMode(full), "frappe");
  assert.equal(kundenkarteMode({ ...full, FRAPPE_KUNDENKARTE_URL: "http://unsicher" }), "off");
  assert.equal(kundenkarteMode({ ...full, KUNDENKARTE_MAIL_FROM: "" }), "off", "ohne Mailversand keine Frappe-Anbindung");
  for (const name of ["KUNDENKARTE_PROVIDER", "FRAPPE_KUNDENKARTE_URL", "FRAPPE_KUNDENKARTE_KEY", "FRAPPE_KUNDENKARTE_SECRET", "KUNDENKARTE_MAIL_API_KEY", "KUNDENKARTE_MAIL_FROM"]) assert.ok(ENV_NAMES.includes(name), name);
});

// --- Texte -------------------------------------------------------------------------
// Keine Nachlässe/Guthaben-Versprechen (Inhaber: kein Geldwert), kein €/%, keine
// Superlative, keine Händler-/Offiziell-Behauptung, keine KI-Nennung.
// Wortgrenzen unicode-sicher: JS-\b trennt vor „ä“ („Bestätigung“ ≠ „best“).
const word = (alts, flags = "iu") => new RegExp(`(?<!\\p{L})(?:${alts})(?!\\p{L})`, flags);
const VERBOTEN = [
  /rabatt|skonto|bonuspunkt|cashback|gutschrift|guthaben\s+von|discount|remise|ristourn|sconto/i,
  word("EUR|Euro|Prozent|percent|pour cent|per cento"),
  /€|%/,
  word("beste[rsn]?|einzigartig|exklusiv|unschlagbar|weltweit|führend|größte[rsn]?|perfekt|luxuriös"),
  word("best|unique|exclusive|unbeatable|leading|largest|perfect|luxurious|world-class"),
  word("meilleur[es]?|exclusi[fv]e?s?|imbattable|leader|parfait[es]?|luxueu[xs]e?s?"),
  word("migliore|unic[oa]|esclusiv[oa]|imbattibile|perfett[oa]|lussuos[oa]"),
  /h(ä|ae)ndler|autorisiert|offiziell|authori[sz]ed|official|revendeur|concessionnaire|rivenditore|distributore/i,
  word("KI|AI|Claude|Anthropic|ChatGPT", "u"),
  /kostenlos|gratis|free of charge|gratuit|gratuito/i,
];

test("10 Texte in 4 Sprachen: gleichwertig aufgebaut, ohne verbotene Wörter, Schwellen nie in Euro", () => {
  assert.deepEqual([...KUNDENKARTE_LOCALES], ["de", "en", "fr", "it"]);
  const keys = (o) => Object.keys(o).sort().join(",");
  for (const locale of KUNDENKARTE_LOCALES) {
    const c = kundenkarteCopy(locale);
    assert.equal(keys(c), keys(COPY.de), locale);
    assert.equal(keys(c.form), keys(COPY.de.form), `${locale} form`);
    assert.equal(keys(c.confirm), keys(COPY.de.confirm), `${locale} confirm`);
    assert.equal(c.faq.items.length, 8, `${locale} FAQ`);
    assert.equal(c.schritte.items.length, 3);
    assert.equal(c.form.monate.length, 12);
    for (const k of INTERESSEN_KEYS) assert.ok(c.form.interessen[k], `${locale} Interesse ${k}`);
    for (const v of VORTEILE) assert.ok(c.vorteile[v.key]?.titel && c.vorteile[v.key]?.text, `${locale} Vorteil ${v.key}`);
    for (const s of STUFEN) assert.ok(c.stufen.names[s.key] && c.stufen.tierNote[s.key], `${locale} Stufe ${s.key}`);
    for (const text of allTexts(locale)) {
      for (const re of VERBOTEN) assert.doesNotMatch(text, re, `${locale}: „${text}“`);
    }
    assert.ok(c.hero.cardHolder === "Max Muster" && c.hero.exampleBadge, `${locale}: Beispielkarte klar gekennzeichnet`);
    assert.doesNotMatch(c.stufen.intro, /\d/, `${locale}: keine Zahl in der Stufen-Erklärung`);
  }
  // Ehrliche FAQ: Kosten nein, Nachlässe nein, Kündigung jederzeit, Auswertung nur mit Einwilligung.
  const de = COPY.de.faq.items.map((i) => i.a);
  assert.match(de[0], /^Nein\./);
  assert.match(de[1], /^Nein\./);
  assert.match(de[3], /^Nur mit Ihrer Einwilligung/);
  assert.match(de[5], /^Ja, jederzeit/);
});

test("11 Stufen und Vorteile: drei Stufen neutral benannt, Grundstufe trägt Berater/Produktpass/Geburtstag, Privé alles", () => {
  assert.deepEqual(STUFEN.map((s) => s.name), ["Platzhirsch", "Platzhirsch Plus", "Platzhirsch Privé"]);
  assert.equal(VORTEILE.length, 7);
  const of = (k) => VORTEILE.filter((v) => v.stufen.includes(k)).map((v) => v.key);
  assert.deepEqual(of("platzhirsch"), ["berater", "produktpass", "geburtstag"]);
  assert.deepEqual(of("prive"), VORTEILE.map((v) => v.key));
  assert.ok(of("plus").length > of("platzhirsch").length && of("plus").length < of("prive").length);
  assert.ok(VORTEILE.every((v) => ["service", "zugang", "info", "geste"].includes(v.art)));
});

// --- Bedingungen -------------------------------------------------------------------
test("12 Teilnahmebedingungen: Entwurf mit offenen Prüfmarkern, kein Guthaben, Firmendaten aus site.js", async () => {
  assert.equal(TERMS_STATUS, "entwurf", "Freigabe nur durch Kanzlei und Inhaber");
  assert.ok(termsOpenCount() > 0);
  assert.equal(TERMS_SECTIONS.length, 8);
  const text = TERMS_SECTIONS.flatMap((s) => s.blocks).join(" ");
  assert.match(text, /kein Guthaben, keine Punkte und keine Nachlässe/);
  assert.match(text, /MW Immobilienverwaltungs GmbH/);
  assert.match(text, /Double-Opt-in/);
  assert.doesNotMatch(text.replace(/Art\. 6 Abs\. 1 lit\. [ab] DSGVO/g, ""), /€|\d+\s?%/);
  assert.ok(text.includes(MARKER));
});

// --- Routen / Sitemap / Footer -------------------------------------------------------
test("13 Routen: /kundenkarte, /bedingungen, /bestaetigen in STATIC; Sitemap-Liste nur /kundenkarte in 4 Sprachen; Footer darf verlinken", () => {
  for (const p of ["/kundenkarte", "/kundenkarte/bedingungen", "/kundenkarte/bestaetigen"]) {
    assert.ok(STATIC.includes(p), p);
    assert.equal(templateOf(`/fr${p}`), `/fr${p}`);
  }
  assert.equal(templateOf("/de/kundenkarte/irgendwas"), "/de/(404)");
  const page = MULTILINGUAL_PAGES.find((p) => p.path === "/kundenkarte");
  assert.ok(page, "MULTILINGUAL_PAGES");
  assert.deepEqual(page.locales, ["de", "en", "fr", "it"]);
  assert.match(page.lastModified, /^\d{4}-\d{2}-\d{2}$/);
  for (const line of [page.label, page.llms, page.en.label, page.en.llms]) for (const re of VERBOTEN) assert.doesNotMatch(line, re);
  assert.equal(MULTILINGUAL_PAGES.some((p) => p.path.startsWith("/kundenkarte/")), false, "Unterseiten bleiben noindex und draußen");
  assert.equal(footerLinkAllowed("/kundenkarte"), true);
  assert.equal(footerLinkAllowed("/de/kundenkarte"), true);
});

test("14 Messages: Footer.customerCard und Portal.nav.card in allen vier Sprachen", async () => {
  const fs = await import("node:fs");
  for (const locale of KUNDENKARTE_LOCALES) {
    const m = JSON.parse(fs.readFileSync(new URL(`../../src/messages/${locale}.json`, import.meta.url), "utf8"));
    assert.ok(m.Footer.customerCard, `${locale} Footer.customerCard`);
    assert.ok(m.Portal.nav.card, `${locale} Portal.nav.card`);
  }
});

// --- Portal ---------------------------------------------------------------------------
test("15 Portal-Demo-Karte entspricht dem Vertrag portal_card; Wallet aus; Texte ohne Euro", () => {
  const card = buildDemoCard();
  assert.deepEqual(Object.keys(card).sort(), ["einloesungen", "kartennummer", "naechste_stufe", "stufe", "vorteile", "wallet"]);
  assert.deepEqual(Object.keys(card.stufe).sort(), ["farbe", "name", "seit"]);
  assert.equal(card.stufe.name, "Platzhirsch Plus");
  assert.equal(card.naechste_stufe.name, "Platzhirsch Privé");
  assert.equal(card.vorteile.length, VORTEILE.length);
  for (const v of card.vorteile) assert.deepEqual(Object.keys(v).sort(), ["art", "beschreibung", "einloesbar_pro_jahr", "genutzt", "titel", "verfuegbar"]);
  assert.equal(card.vorteile.filter((v) => v.verfuegbar).length, 6);
  assert.deepEqual(card.wallet, { apple: false, google: false });
  assert.doesNotMatch(JSON.stringify(card), /€/);
  const top = buildDemoCard({ stufeKey: "prive" });
  assert.equal(top.naechste_stufe, null);
  assert.ok(top.vorteile.every((v) => v.verfuegbar));
});

test("16 Keine Reste: Mock-Verzeichnis räumt abgelaufene unbestätigte Anträge nach 7 Tagen auf", async () => {
  const { dir, clean } = tmp();
  try {
    let now = NOW;
    const adapter = createMockAdapter({ dir, now: () => now });
    await apply({ adapter, input: INPUT, origin: "", now, log: quiet, mailer: memMailer() });
    now = NOW + CONFIRM_TTL_MS + 8 * 24 * 60 * 60 * 1000;
    await apply({ adapter, input: { ...INPUT, email: "neu@example.com" }, origin: "", now, log: quiet, mailer: memMailer() });
    assert.deepEqual(await adapter.status("erika@example.com"), { found: false, status: null });
    assert.ok(readdirSync(dir).includes("antraege.json"));
  } finally {
    clean();
  }
});
