// tests/unit/website-service-seiten.test.mjs – Website-Seiten aus Bericht 60
// („Website-Seiten“): Newsletter bestätigen/abmelden, Adventsabend absagen,
// Reklamation, Bewerbung; Kampagnenfelder in Newsletter und Termin; Routen,
// Footer und Sitemap. Kein Netz: jeder fetch ist eine Attrappe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { GRUPPEN, resolveBackend } from "../../src/lib/backend/config.js";
import { tokenHash } from "../../src/lib/backend/newsletterAbmeldung.js";
import { PH_METHODS, STATUS, cancelEventRegistration, confirmNewsletter, publicCode, unsubscribeNewsletter } from "../../src/lib/backend/tokenAktionen.js";
import { ARTEN, reklamationSchema, validateReklamation } from "../../src/lib/service/reklamation/schema.js";
import { ALT_KONTAKT_URL, PH_SERVICE_METHOD, altKontaktPayload, phServicePayload, sendReklamation } from "../../src/lib/service/reklamation/send.js";
import { REKLAMATION_PATH, reklamationCopy } from "../../src/lib/service/reklamation/copy.js";
import { linkCopy } from "../../src/lib/service/linkAktionenCopy.js";
import {
  BEWERBUNG_LIMITS,
  PH_BEWERBUNG_METHOD,
  PH_UNTERLAGE_METHOD,
  anschreibenText,
  checkPdf,
  isPdfBytes,
  phBewerbungPayload,
  safePdfName,
  validateBewerbung,
} from "../../src/lib/karriere/bewerbung.js";
import { bewerbungOnline, sendBewerbung } from "../../src/lib/karriere/bewerbungSend.js";
import { bewerbungCopy } from "../../src/lib/karriere/bewerbungCopy.js";
import { UPLOAD_CONFIG } from "../../src/lib/upload/config.js";
import { templateOf } from "../../src/lib/einblicke/routes.js";
import { footerLinkAllowed } from "../../src/lib/seo/footerLinks.js";
import { EXTRA_PAGES, MULTILINGUAL_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";

const PH = { BACKEND_PH_URL: "https://ph.staging.test", BACKEND_PH_TOKEN: "key1:secret1" };
const AUTH = "token key1:secret1";
const TOKEN = "abcdefghijklmnop1234567890_-XYZ";
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

function fakeFetch(answer = () => ({ status: 200, body: { message: {} } })) {
  const calls = [];
  const fn = async (url, init = {}) => {
    let body = init.body;
    try {
      body = JSON.parse(body);
    } catch {
      // Text
    }
    calls.push({ url: String(url), headers: new Headers(init.headers || {}), body });
    const a = answer(String(url), body);
    if (a instanceof Error) throw a;
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}
const none = async () => {
  throw new Error("fetch darf nicht gerufen werden");
};
const method = (url) => url.split("/api/method/")[1];

// ── Gruppen ──────────────────────────────────────────────────────────────────

test("Gruppen service und bewerbung: schreibend, Standard alt, ohne Zugang nichts senden", () => {
  for (const g of ["service", "bewerbung"]) {
    assert.equal(GRUPPEN[g].ph, true);
    assert.equal(GRUPPEN[g].lesend, false);
    assert.equal(resolveBackend(g, {}).generation, "alt");
    assert.deepEqual(resolveBackend(g, { BACKEND_PH_GRUPPEN: g }).ph, null);
    assert.equal(resolveBackend(g, { ...PH, BACKEND_PH_GRUPPEN: g }).ph.url, PH.BACKEND_PH_URL);
  }
});

// ── Newsletter bestätigen / abmelden, Adventsabend absagen ───────────────────

test("confirmNewsletter ph: POST confirm_newsletter mit Token und Schlüssel", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "newsletter" };
  const f = fakeFetch(() => ({ body: { message: { status: "bestaetigt", sprache: "de" } } }));
  assert.deepEqual(await confirmNewsletter({ token: TOKEN, env, fetchImpl: f }), { ok: true, status: "bestaetigt", generation: "ph" });
  assert.equal(method(f.calls[0].url), PH_METHODS.confirm);
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.deepEqual(f.calls[0].body, { token: TOKEN });
  const again = fakeFetch(() => ({ body: { message: { status: "bereits_bestaetigt" } } }));
  assert.equal((await confirmNewsletter({ token: TOKEN, env, fetchImpl: again })).status, "bereits_bestaetigt");
});

test("confirmNewsletter: abgelaufen 410, ungültig 404, Format, alt, ohne Zugang", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "newsletter" };
  const expired = fakeFetch(() => ({ status: 410, body: { message: { code: "expired" } } }));
  assert.equal((await confirmNewsletter({ token: TOKEN, env, fetchImpl: expired })).code, "expired");
  const invalid = fakeFetch(() => ({ status: 404, body: { message: { code: "invalid_token" } } }));
  assert.equal((await confirmNewsletter({ token: TOKEN, env, fetchImpl: invalid })).code, "invalid_token");
  const down = fakeFetch(() => new Error("offline"));
  assert.equal((await confirmNewsletter({ token: TOKEN, env, fetchImpl: down })).code, "unavailable");
  assert.equal((await confirmNewsletter({ token: "kurz", env, fetchImpl: none })).code, "invalid_token");
  assert.deepEqual(await confirmNewsletter({ token: TOKEN, env: {}, fetchImpl: none }), { ok: false, code: "not_available", generation: "alt" });
  assert.equal((await confirmNewsletter({ token: TOKEN, env: { BACKEND_PH_GRUPPEN: "newsletter" }, fetchImpl: none })).code, "not_configured");
  assert.equal(STATUS.expired, 410);
  assert.equal(publicCode("not_found"), "invalid_token");
  assert.equal(publicCode("internal"), "unavailable");
});

test("unsubscribeNewsletter ph: Token bzw. E-Mail; mit E-Mail immer neutral", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "newsletter" };
  const f = fakeFetch(() => ({ body: { message: { status: "bereits_abgemeldet" } } }));
  assert.equal((await unsubscribeNewsletter({ token: TOKEN, env, fetchImpl: f })).status, "bereits_abgemeldet");
  assert.equal(method(f.calls[0].url), PH_METHODS.unsubscribe);
  assert.deepEqual(f.calls[0].body, { token: TOKEN });
  const g = fakeFetch(() => ({ body: { message: { status: "abgemeldet" } } }));
  const r = await unsubscribeNewsletter({ email: " Erika@Example.com ", env, fetchImpl: g });
  assert.deepEqual(r, { ok: true, status: "abgemeldet", generation: "ph" });
  assert.deepEqual(g.calls[0].body, { email: "erika@example.com" });
  assert.equal((await unsubscribeNewsletter({ email: "kein-mail", env, fetchImpl: none })).code, "invalid");
});

test("unsubscribeNewsletter alt: Postausgang (Token nur als Hash, Formular mit Adresse)", async () => {
  const box = [];
  const outbox = async (e) => box.push(e);
  const now = new Date("2026-11-04T10:00:00Z");
  assert.deepEqual(await unsubscribeNewsletter({ token: TOKEN, env: {}, fetchImpl: none, outbox, now }), { ok: true, status: "vorgemerkt", generation: "alt" });
  assert.deepEqual(box[0], { art: "newsletter-abmeldung-link", eingang: now.toISOString(), token_sha256: tokenHash(TOKEN) });
  assert.ok(!JSON.stringify(box[0]).includes(TOKEN));
  await unsubscribeNewsletter({ email: "erika@example.com", env: {}, outbox, now });
  assert.equal(box[1].email, "erika@example.com");
  const broken = async () => {
    throw new Error("voll");
  };
  assert.equal((await unsubscribeNewsletter({ token: TOKEN, env: {}, outbox: broken })).code, "unavailable");
  assert.equal((await unsubscribeNewsletter({ token: TOKEN, env: {} })).code, "unavailable");
});

test("cancelEventRegistration: ph cancel_event_registration, alt Postausgang", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "newsletter" };
  const f = fakeFetch(() => ({ body: { message: { status: "abgesagt", event: "EV-1" } } }));
  assert.deepEqual(await cancelEventRegistration({ token: TOKEN, env, fetchImpl: f }), { ok: true, status: "abgesagt", generation: "ph" });
  assert.equal(method(f.calls[0].url), PH_METHODS.cancelEvent);
  const gone = fakeFetch(() => ({ status: 404, body: { message: { code: "invalid_token" } } }));
  assert.equal((await cancelEventRegistration({ token: TOKEN, env, fetchImpl: gone })).code, "invalid_token");
  const box = [];
  const r = await cancelEventRegistration({ token: TOKEN, env: {}, fetchImpl: none, outbox: async (e) => box.push(e) });
  assert.equal(r.status, "vorgemerkt");
  assert.equal(box[0].art, "adventsabend-absage");
  assert.equal(box[0].token_sha256, tokenHash(TOKEN));
});

// ── Reklamation ──────────────────────────────────────────────────────────────

const REK = { vorname: "Erika", nachname: "Muster", email: "Erika@Example.com", telefon: "+43 660 1234567", bestellnummer: "PH-2026-0042", produkt: "Sofa, Stoff grau", art: "transportschaden", beschreibung: "Die Rückenlehne hat bei der Lieferung einen Riss bekommen.", einwilligung: true, sprache: "fr", idem: "idem-1" };

test("validateReklamation: Pflichtfelder, E-Mail, Telefon, Mindestlänge, Einwilligung, Art", () => {
  const ok = validateReklamation(REK);
  assert.equal(ok.ok, true);
  assert.equal(ok.data.email, "erika@example.com");
  assert.equal(ok.data.sprache, "fr");
  const bad = validateReklamation({ email: "x", telefon: "abc", beschreibung: "zu kurz", art: "unsinn" });
  assert.deepEqual(bad.errors, { vorname: "required", nachname: "required", email: "email", telefon: "phone", produkt: "required", art: "choice", beschreibung: "short", einwilligung: "required" });
  assert.equal(validateReklamation({ ...REK, bestellnummer: "" }).ok, true, "Bestellnummer optional");
  assert.equal(validateReklamation({ ...REK, beschreibung: "x".repeat(5001) }).errors.beschreibung, "long");
  assert.equal(validateReklamation({ ...REK, art: "" }).data.art, "mangel");
  assert.equal(validateReklamation({ ...REK, sprache: "es" }).data.sprache, "de");
  const p = reklamationSchema.safeParse({ ...REK, email: "" });
  assert.equal(p.success, false);
  assert.deepEqual(p.error.issues[0].path, ["email"]);
  assert.ok(ARTEN.includes("garantie"));
});

test("sendReklamation ph: create_service_case mit dokumentierten Feldern und idempotency_key", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "service" };
  const data = validateReklamation(REK).data;
  const f = fakeFetch(() => ({ body: { message: { referenz: "SF-2026-0007", status: "gemeldet" } } }));
  assert.deepEqual(await sendReklamation(data, { env, fetchImpl: f, leadRef: "REK-1" }), { ok: true, referenz: "SF-2026-0007", generation: "ph" });
  assert.equal(method(f.calls[0].url), PH_SERVICE_METHOD);
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.deepEqual(f.calls[0].body, phServicePayload(data, { leadRef: "REK-1" }));
  assert.equal(f.calls[0].body.produkt_name, "Sofa, Stoff grau");
  assert.equal(f.calls[0].body.idempotency_key, "idem-1");
  assert.equal(f.calls[0].body.lead_ref, "REK-1");
  const bad = fakeFetch(() => ({ status: 400, body: { message: { code: "invalid" } } }));
  assert.equal((await sendReklamation(data, { env, fetchImpl: bad })).code, "invalid");
  assert.equal((await sendReklamation(data, { env: { BACKEND_PH_GRUPPEN: "service" }, fetchImpl: none })).code, "not_configured");
});

test("sendReklamation alt: bestehender Anfrageweg create_contact mit „Art: Reklamation“", async () => {
  const data = validateReklamation(REK).data;
  const f = fakeFetch(() => ({ body: { message: { name: "KON-77" } } }));
  assert.deepEqual(await sendReklamation(data, { env: {}, fetchImpl: f, leadRef: "REK-2" }), { ok: true, referenz: "KON-77", generation: "alt" });
  assert.equal(f.calls[0].url, ALT_KONTAKT_URL);
  assert.equal(f.calls[0].headers.get("authorization"), null, "alt ohne Token");
  const p = f.calls[0].body;
  assert.deepEqual(Object.keys(p).sort(), ["company", "email_address", "ihre_nachricht", "lead_ref", "name", "telefon"]);
  assert.match(p.ihre_nachricht, /^Art: Reklamation\n/);
  assert.match(p.ihre_nachricht, /Bestell-\/Projektnummer: PH-2026-0042/);
  assert.match(p.ihre_nachricht, /Fall: Transportschaden/);
  assert.match(p.ihre_nachricht, /Kontext: Reklamation \(Website \/fr\/service\/reklamation\)/);
  assert.deepEqual(altKontaktPayload({ ...data, bestellnummer: "" }).ihre_nachricht.includes("Bestell"), false);
  // formulare schon auf ph → ph_crm.api.create_contact (gleicher Anfrageweg)
  const g = fakeFetch(() => ({ body: { message: { referenz: "ANF-9", status: "Neu" } } }));
  const r = await sendReklamation(data, { env: { ...PH, BACKEND_PH_GRUPPEN: "formulare" }, fetchImpl: g });
  assert.deepEqual(r, { ok: true, referenz: "ANF-9", generation: "alt" });
  assert.equal(method(g.calls[0].url), "ph_crm.api.create_contact");
  const down = fakeFetch(() => ({ status: 502, body: {} }));
  assert.equal((await sendReklamation(data, { env: {}, fetchImpl: down })).code, "unavailable");
});

// ── Bewerbung ────────────────────────────────────────────────────────────────

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
const BEW = { vorname: "Max", nachname: "Muster", email: "max@example.com", telefon: "", starttermin: "2027-01-15", gehalt: "3.200 brutto", nachricht: "Ich habe fünf Jahre in der Küchenplanung gearbeitet.", einwilligung: "1", sprache: "it", stelle: "kuechenplaner-in", titel: "Küchenplaner:in", idem: "idem-b" };
const TODAY = new Date("2026-11-04T08:00:00Z");

test("validateBewerbung: Pflichtfelder, PDF-Pflicht, Größe wie Upload-Lib, Datum, Einwilligung", () => {
  const cv = { name: "Lebenslauf.pdf", size: 1000, type: "application/pdf" };
  assert.equal(validateBewerbung(BEW, { lebenslauf: cv }, { today: TODAY }).ok, true);
  assert.equal(BEWERBUNG_LIMITS.maxFileBytes, UPLOAD_CONFIG.chunkSize);
  const bad = validateBewerbung({ email: "x", telefon: "x", starttermin: "2026-02-30" }, {}, { today: TODAY });
  assert.deepEqual(bad.errors, { vorname: "required", nachname: "required", email: "email", telefon: "phone", starttermin: "date", lebenslauf: "required", einwilligung: "required" });
  assert.equal(validateBewerbung({ ...BEW, starttermin: "2026-11-03" }, { lebenslauf: cv }, { today: TODAY }).errors.starttermin, "past");
  assert.equal(validateBewerbung({ ...BEW, starttermin: "" }, { lebenslauf: cv }, { today: TODAY }).ok, true, "Starttermin optional");
  assert.equal(checkPdf({ name: "cv.docx", size: 10, type: "application/msword" }), "type");
  assert.equal(checkPdf({ name: "cv.pdf", size: UPLOAD_CONFIG.chunkSize + 1, type: "application/pdf" }), "size");
  assert.equal(checkPdf(null), null);
  assert.equal(validateBewerbung(BEW, { lebenslauf: cv, anschreiben: { name: "a.png", size: 5, type: "image/png" } }, { today: TODAY }).errors.anschreiben, "type");
  assert.equal(isPdfBytes(PDF), true);
  assert.equal(isPdfBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), false);
  assert.equal(safePdfName("Lebenslauf Müller (2026).PDF", "lebenslauf"), "Lebenslauf_Mu_ller_2026.pdf");
  assert.equal(safePdfName("", "anschreiben"), "anschreiben.pdf");
});

test("phBewerbungPayload: create_bewerbung-Felder, Gehaltsvorstellung im Anschreiben", () => {
  const d = validateBewerbung(BEW, { lebenslauf: { name: "cv.pdf", size: 9, type: "application/pdf" } }, { today: TODAY }).data;
  const p = phBewerbungPayload(d, { leadRef: "BEW-1" });
  assert.equal(p.stelle, "kuechenplaner-in");
  assert.equal(p.verfuegbar_ab, "2027-01-15");
  assert.equal(p.einwilligung_datenschutz, 1);
  assert.equal(p.sprache, "it");
  assert.equal(p.idempotency_key, "idem-b");
  assert.match(p.anschreiben, /Gehaltsvorstellung: 3\.200 brutto/);
  assert.doesNotMatch(p.anschreiben, /Stelle:/);
  const ohne = phBewerbungPayload(d, { mitStelle: false });
  assert.equal(ohne.stelle, undefined);
  assert.match(ohne.anschreiben, /^Stelle: Küchenplaner:in/);
  assert.equal(ohne.idempotency_key, "idem-b-o");
  assert.equal(anschreibenText({ nachricht: "", gehalt: "" }), "");
});

test("sendBewerbung ph: create_bewerbung, dann attach_unterlage je PDF (base64); Stelle unbekannt → ohne Stelle", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "bewerbung" };
  assert.equal(bewerbungOnline(env), true);
  assert.equal(bewerbungOnline({}), false);
  assert.equal(bewerbungOnline({ BACKEND_PH_GRUPPEN: "bewerbung" }), false, "ohne Zugang kein Formular");
  const d = validateBewerbung(BEW, { lebenslauf: { name: "cv.pdf", size: 9, type: "application/pdf" } }, { today: TODAY }).data;
  let first = true;
  const f = fakeFetch((url, body) => {
    if (method(url) === PH_BEWERBUNG_METHOD && first && body.stelle) {
      first = false;
      return { status: 404, body: { message: { code: "not_found" } } };
    }
    if (method(url) === PH_BEWERBUNG_METHOD) return { body: { message: { referenz: "BEW-2026-0001", status: "Eingegangen" } } };
    return { body: { message: { ok: true, referenz: "BEW-2026-0001", anzahl: 1 } } };
  });
  const r = await sendBewerbung(d, { lebenslauf: { name: "Mein CV.pdf", bytes: PDF }, anschreiben: { name: "brief.pdf", bytes: PDF } }, { env, fetchImpl: f });
  assert.deepEqual(r, { ok: true, referenz: "BEW-2026-0001", unterlagen: 2, fehlend: 0, generation: "ph" });
  assert.deepEqual(f.calls.map((c) => method(c.url)), [PH_BEWERBUNG_METHOD, PH_BEWERBUNG_METHOD, PH_UNTERLAGE_METHOD, PH_UNTERLAGE_METHOD]);
  assert.equal(f.calls[1].body.stelle, undefined);
  const attach = f.calls[2].body;
  assert.deepEqual(attach, { referenz: "BEW-2026-0001", dateiname: "Mein_CV.pdf", inhalt_base64: Buffer.from(PDF).toString("base64"), art: "Lebenslauf" });
  assert.equal(f.calls[3].body.art, "Anschreiben");
  assert.equal(f.calls[2].headers.get("authorization"), AUTH);
});

test("sendBewerbung: Unterlage scheitert → fehlend; alt → not_available; ohne Zugang → not_configured", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "bewerbung" };
  const d = validateBewerbung(BEW, { lebenslauf: { name: "cv.pdf", size: 9, type: "application/pdf" } }, { today: TODAY }).data;
  const f = fakeFetch((url) => (method(url) === PH_UNTERLAGE_METHOD ? { status: 400, body: { message: { code: "invalid" } } } : { body: { message: { referenz: "BEW-3" } } }));
  const r = await sendBewerbung(d, { lebenslauf: { name: "cv.pdf", bytes: PDF } }, { env, fetchImpl: f });
  assert.equal(r.ok, true);
  assert.equal(r.fehlend, 1);
  assert.deepEqual(await sendBewerbung(d, {}, { env: {}, fetchImpl: none }), { ok: false, code: "not_available", generation: "alt" });
  assert.equal((await sendBewerbung(d, {}, { env: { BACKEND_PH_GRUPPEN: "bewerbung" }, fetchImpl: none })).code, "not_configured");
  const bad = fakeFetch(() => ({ status: 400, body: { message: { code: "invalid" } } }));
  assert.equal((await sendBewerbung(d, {}, { env, fetchImpl: bad })).code, "invalid");
});

// ── Texte, Routen, Footer, Sitemap, Kampagnenfelder ──────────────────────────

function keyPaths(o, prefix = "") {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();
}

test("Texte: vier Sprachen mit denselben Schlüsseln, Löschfrist sechs Monate (GlBG)", () => {
  for (const l of ["en", "fr", "it"]) {
    const linkDe = keyPaths({ confirm: linkCopy("de").confirm, unsubscribe: linkCopy("de").unsubscribe, common: linkCopy("de").common });
    assert.deepEqual(keyPaths({ confirm: linkCopy(l).confirm, unsubscribe: linkCopy(l).unsubscribe, common: linkCopy(l).common }), linkDe, l);
    const rekDe = keyPaths(reklamationCopy("de")).filter((k) => k !== "medien.textUpload");
    assert.deepEqual(keyPaths(reklamationCopy(l)), rekDe, l);
    assert.deepEqual(keyPaths(bewerbungCopy(l)), keyPaths(bewerbungCopy("de")), l);
    assert.match(bewerbungCopy(l).privacy, /GlBG/);
  }
  assert.match(bewerbungCopy("de").privacy, /sechs Monate/);
  const alle = JSON.stringify([linkCopy("de"), reklamationCopy("de"), bewerbungCopy("de")]);
  assert.doesNotMatch(alle, /\b(beste[nrs]?|einzigartig|perfekt|garantiert)\b/i, "keine Superlative");
  assert.doesNotMatch(alle, /\bdu\b|\bdein/i, "Sie-Form");
});

test("Routen: neue Seiten in einblicke STATIC, Footer und Sitemap nur für die indexierbare Reklamation", () => {
  for (const p of ["/newsletter/bestaetigen", "/newsletter/abmelden", "/adventsabend/absagen", "/service/reklamation"]) {
    for (const l of ["de", "en"]) assert.equal(templateOf(`/${l}${p}`), `/${l}${p}`, p);
  }
  assert.equal(REKLAMATION_PATH, "/service/reklamation");
  assert.equal(footerLinkAllowed("/service/reklamation"), true);
  const rek = MULTILINGUAL_PAGES.find((p) => p.path === "/service/reklamation");
  assert.deepEqual(rek.locales, ["de", "en", "fr", "it"]);
  for (const p of ["/newsletter/bestaetigen", "/newsletter/abmelden", "/adventsabend/absagen"]) assert.ok(![...EXTRA_PAGES, ...MULTILINGUAL_PAGES].some((e) => e.path === p), p);
  for (const p of ["src/app/[locale]/newsletter/bestaetigen/page.js", "src/app/[locale]/newsletter/abmelden/page.js", "src/app/[locale]/adventsabend/absagen/page.js"]) {
    const s = read(p);
    assert.match(s, /index: false/, p);
    assert.match(s, /referrer: "no-referrer"/, p);
  }
  assert.match(read("src/components/Reusable/Footer.js"), /href: "\/service\/reklamation"/);
  assert.match(read("src/components/Service/Pflege/PflegePage.js"), /REKLAMATION_PATH/);
});

test("Kampagnenfelder: Newsletter und Termin senden über withAttributionFields", () => {
  assert.match(read("src/components/Newsletter/newsletter.js"), /withAttributionFields\("\/api\/newsletter_subscribe", \{ email: value, website \}\)/);
  assert.match(read("src/components/Termin/BookingWizard.js"), /withAttributionFields\("\/api\/termin\/book", payload\)/);
});

test("Token-Seiten schicken das Token erst nach einem Klick (kein POST beim Laden)", () => {
  const s = read("src/components/Service/LinkAktion.js");
  assert.match(s, /onClick=\{\(\) => send\(\{ token \}\)\}/);
  assert.doesNotMatch(s, /useEffect\([^)]*send\(/);
});
