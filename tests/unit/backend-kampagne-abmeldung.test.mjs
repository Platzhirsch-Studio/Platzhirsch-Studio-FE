// tests/unit/backend-kampagne-abmeldung.test.mjs – Kampagnenfelder (utm_* /
// klick_id, nur mit Ads-Einwilligung) an das ph-Backend und One-Click-Abmeldung
// nach RFC 8058 (ph_marketing.api.unsubscribe_one_click bzw. Postausgang alt).
// Kein Netz: jeder fetch ist eine Attrappe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ATTRIBUTION_KEYS, attributionFields, fieldsFromHerkunft, klickIdOf, pickAttribution } from "../../src/lib/forms/attributionFields.js";
import { herkunftBlock } from "../../src/lib/forms/leadPayload.js";
import { ATTRIBUTION_URLS, withAttributionFields } from "../../src/lib/forms/client.js";
import { newsletterSchema } from "../../src/lib/forms/schemas.js";
import { newsletterHandler } from "../../src/lib/forms/newsletter.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { applicationSchema } from "../../src/lib/kundenkarte/schema.js";
import { bookSchema } from "../../src/lib/booking/schema.js";
import { forwardInquiry, newsletterPhTarget } from "../../src/lib/backend/forms.js";
import { createFrappeAdapter as createBookingAdapter } from "../../src/lib/booking/adapters/frappe.js";
import { createFrappeAdapter as createKundenkarteAdapter } from "../../src/lib/kundenkarte/adapters/frappe.js";
import { ONE_CLICK_BODY, abmeldeSeite, isOneClickBody, tokenHash, unsubscribeOneClick } from "../../src/lib/backend/newsletterAbmeldung.js";

const PH = { BACKEND_PH_URL: "https://ph.staging.test", BACKEND_PH_TOKEN: "key1:secret1" };
const AUTH = "token key1:secret1";
const ALT_KONTAKT = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";
const KONTAKT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };

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
    const a = answer(String(url));
    if (a instanceof Error) throw a;
    return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}
const msg = (message) => ({ status: 200, body: { message } });
const phErr = (code, status) => ({ status, body: { message: { code } } });

const TOUCH = { ts: 1, landing: "/de/designermoebel-lindau", referrer_host: "www.google.com", utm_source: "google", utm_medium: "cpc", utm_campaign: "minotti-lindau", utm_term: "sofa", utm_content: "anz-1", click: { gclid: "G1", fbclid: "F1" } };
const MIT = { current: TOUCH, first: TOUCH, last: TOUCH, consentAds: true };
const OHNE = { current: { ...TOUCH, click: undefined }, first: null, last: null, consentAds: false };
const FELDER = { utm_source: "google", utm_medium: "cpc", utm_campaign: "minotti-lindau", utm_term: "sofa", utm_content: "anz-1", klick_id: "gclid=G1 · fbclid=F1" };
const NOW = 1_800_000_000_000;
let ip = 0;
const nlReq = (body) =>
  new Request("http://localhost/api/newsletter_subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.0.0.1, 198.18.1.${++ip}` },
    body: JSON.stringify({ ...body, _t: NOW - 20000 }),
  });

test("attributionFields: mit Ads-Einwilligung utm_* + klick_id, ohne Einwilligung nichts", () => {
  assert.deepEqual(ATTRIBUTION_KEYS, ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "klick_id"]);
  assert.deepEqual(attributionFields(MIT), FELDER);
  assert.deepEqual(attributionFields(OHNE), {});
  assert.deepEqual(attributionFields({ ...OHNE, consentAds: "ja" }), {}, "nur echtes true zählt");
  assert.deepEqual(attributionFields(null), {});
  assert.equal(klickIdOf({ msclkid: "M", gclid: "G" }), "gclid=G · msclkid=M");
  assert.deepEqual(pickAttribution({ utm_source: " a\tb ", fremd: "x", utm_medium: "", utm_term: 5 }), { utm_source: "a b" });
});

test("fieldsFromHerkunft: Herkunftsblock mit Einwilligung → Felder, ohne Einwilligung (nur Kanal) → {}", () => {
  assert.deepEqual(fieldsFromHerkunft(`Text\n\n${herkunftBlock(MIT, { leadRef: "r", locale: "de" })}`), FELDER);
  assert.deepEqual(fieldsFromHerkunft(`Text\n\n${herkunftBlock(OHNE, { leadRef: "r", locale: "de" })}`), {});
  assert.deepEqual(fieldsFromHerkunft("ohne Block"), {});
  assert.deepEqual(fieldsFromHerkunft(undefined), {});
  const zwei = herkunftBlock({ ...MIT, first: { ...TOUCH, ts: 0, landing: "/de", utm_campaign: "alt" } }, {});
  assert.equal(fieldsFromHerkunft(zwei).utm_campaign, "minotti-lindau", "Erster Kontakt ist nicht der Hauptkontakt");
});

test("forwardInquiry: ph bekommt utm_* / klick_id als Felder, alt exakt den bisherigen Payload", async () => {
  const text = `Ich möchte ein Sofa.\n\n${herkunftBlock(MIT, { leadRef: "r" })}`;
  const payload = { ...KONTAKT, ihre_nachricht: text };
  const env = { ...PH, BACKEND_PH_GRUPPEN: "formulare" };
  const ph = fakeFetch(() => msg({ referenz: "PH-ANF-9" }));
  await forwardInquiry("kontakt", payload, { altUrl: ALT_KONTAKT, fetchImpl: ph, env });
  for (const [k, v] of Object.entries(FELDER)) assert.equal(ph.calls[0].body[k], v, k);
  assert.equal(ph.calls[0].body.ihre_nachricht, text, "Freitext unverändert");
  const alt = fakeFetch(() => msg({ name: "KF" }));
  await forwardInquiry("kontakt", payload, { altUrl: ALT_KONTAKT, fetchImpl: alt, env: {} });
  assert.deepEqual(alt.calls[0].body, payload);
  // Gutschein-Anfrage: Block in der Anmerkung → ihre_nachricht; ohne Einwilligung keine Felder.
  const g = fakeFetch(() => msg({ referenz: "PH-ANF-10" }));
  await forwardInquiry("gutschein", { ihre_nachricht: `[Gutschein-Anfrage]\n\n${herkunftBlock(OHNE, {})}` }, { altUrl: ALT_KONTAKT, fetchImpl: g, env });
  assert.equal(g.calls[0].body.utm_source, undefined);
  assert.equal(g.calls[0].body.art, "Gutschein");
  // Produktanfrage: Block in anfrage_beschreibung.
  const p = fakeFetch(() => msg({ referenz: "PH-ANF-11" }));
  await forwardInquiry("produkt", { anfrage_beschreibung: herkunftBlock(MIT, {}) }, { altUrl: ALT_KONTAKT, fetchImpl: p, env });
  assert.equal(p.calls[0].body.utm_campaign, "minotti-lindau");
  // explizite Felder (attribution) haben Vorrang, Fremdes fällt weg.
  const e = fakeFetch(() => msg({ referenz: "X" }));
  await forwardInquiry("beratung", { bitte_beschreiben_sie_ihr_vorhaben: "x" }, { altUrl: ALT_KONTAKT, fetchImpl: e, env, attribution: { utm_source: "newsletter", boese: "x" } });
  assert.equal(e.calls[0].body.utm_source, "newsletter");
  assert.equal(e.calls[0].body.boese, undefined);
});

test("Browser: Kundenkarte, Newsletter, Termin senden utm_* nur mit Einwilligung; Schemas lassen die Felder durch", () => {
  assert.deepEqual([...ATTRIBUTION_URLS].sort(), ["/api/kundenkarte/apply", "/api/newsletter_subscribe", "/api/termin/book"]);
  assert.deepEqual(withAttributionFields("/api/kundenkarte/apply", { a: 1 }, MIT), { a: 1, ...FELDER });
  assert.deepEqual(withAttributionFields("/api/kundenkarte/apply", { a: 1 }, OHNE), { a: 1 });
  assert.deepEqual(withAttributionFields("/api/kontakt", { a: 1 }, MIT), { a: 1 }, "Anfragen: Block statt Felder");
  assert.deepEqual(withAttributionFields("/api/termin/book?x=1", { a: 1 }, null), { a: 1 }, "ohne window/Attribution unverändert");
  assert.deepEqual(newsletterSchema.parse({ email: "e@x.at", ...FELDER, fremd: 1 }), { email: "e@x.at", ...FELDER });
  assert.deepEqual(newsletterSchema.parse({ email: "e@x.at" }), { email: "e@x.at" }, "ohne Felder wie bisher");
  assert.equal(newsletterSchema.safeParse({ email: "e@x.at", utm_source: "x".repeat(151) }).success, false);
  assert.equal(applicationSchema.parse({ vorname: "E", nachname: "M", email: "e@x.at", kenntnisnahme: true, utm_campaign: "k1" }).utm_campaign, "k1");
  assert.equal("utm_campaign" in applicationSchema.parse({ vorname: "E", nachname: "M", email: "e@x.at", kenntnisnahme: true }), false);
  const book = bookSchema.parse({ art: "studio", start: "2026-11-10T09:00:00+01:00", vorname: "E", nachname: "M", email: "e@x.at", klick_id: "gclid=G" });
  assert.equal(book.klick_id, "gclid=G");
});

test("Newsletter ph: extraFields gibt utm_* weiter; alt schickt weiter nur { email }", async () => {
  const t = newsletterPhTarget({ ...PH, BACKEND_PH_GRUPPEN: "newsletter" });
  const f = fakeFetch(() => msg({ success: true, doi: true }));
  const POST = newsletterHandler({ url: t.url, headers: t.headers, fetchImpl: f, limiter: createRateLimiter(), now: () => NOW, extraFields: (d) => pickAttribution(d) });
  assert.deepEqual(await (await POST(nlReq({ email: "e@x.at", ...FELDER }))).json(), { success: true });
  assert.deepEqual(f.calls[0].body, { email: "e@x.at", ...FELDER });
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  const alt = fakeFetch(() => msg({}));
  const OLD = newsletterHandler({ url: "https://alt.test/nl", fetchImpl: alt, limiter: createRateLimiter(), now: () => NOW });
  await OLD(nlReq({ email: "e@x.at", ...FELDER }));
  assert.deepEqual(alt.calls[0].body, { email: "e@x.at" });
  const src = readFileSync(new URL("../../src/app/api/newsletter_subscribe/route.js", import.meta.url), "utf8");
  assert.match(src, /extraFields: \(data\) => pickAttribution\(data\)/);
});

test("Termin und Kundenkarte: utm_* an ph_crm / ph_kundenkarte, nicht an platzhirsch_studio.termin", async () => {
  const input = { art: "beratung", modus: "studio", start: "2026-11-10T09:00:00+01:00", vorname: "E", nachname: "M", email: "e@x.at", locale: "de", verifyHash: "h", idem: "idem-123", ...FELDER };
  const ok = () => msg({ referenz: "T", status: "Unbestaetigt", link_version: 1 });
  const ph = fakeFetch(ok);
  await createBookingAdapter({ url: "https://ph.test", key: "k", secret: "s", methodBase: "ph_crm.api" }, { fetchImpl: ph }).create(input);
  assert.equal(ph.calls[0].body.utm_campaign, "minotti-lindau");
  assert.equal(ph.calls[0].body.klick_id, FELDER.klick_id);
  const alt = fakeFetch(ok);
  await createBookingAdapter({ url: "https://b.test", key: "k", secret: "s", methodBase: "platzhirsch_studio.termin.api" }, { fetchImpl: alt }).create(input);
  assert.equal(alt.calls[0].body.utm_campaign, undefined);
  const kk = fakeFetch(() => msg({ referenz: "KK-1", status: "Neu" }));
  await createKundenkarteAdapter({ url: "https://ph.test", key: "k", secret: "s", methodBase: "ph_kundenkarte.api" }, { fetchImpl: kk }).create({ vorname: "E", nachname: "M", email: "e@x.at", confirmHash: "c", idem: "i", utm_source: "google" });
  assert.equal(kk.calls[0].body.utm_source, "google");
  const kk2 = fakeFetch(() => msg({ referenz: "KK-2", status: "Neu" }));
  await createKundenkarteAdapter({ url: "https://ph.test", key: "k", secret: "s", methodBase: "ph_kundenkarte.api" }, { fetchImpl: kk2 }).create({ vorname: "E", nachname: "M", email: "e@x.at", confirmHash: "c", idem: "i" });
  assert.equal(Object.keys(kk2.calls[0].body).some((k) => k.startsWith("utm_") || k === "klick_id"), false);
});

// ── One-Click-Abmeldung (RFC 8058) ───────────────────────────────────────────

const TOKEN = "abcdefghijklmnopqrstuvwx_-0123456789";

test("One-Click: Body-Prüfung nach RFC 8058", () => {
  assert.equal(isOneClickBody(ONE_CLICK_BODY), true);
  assert.equal(isOneClickBody("x=1&List-Unsubscribe=One-Click"), true);
  assert.equal(isOneClickBody("List-Unsubscribe%3DOne-Click"), true);
  assert.equal(isOneClickBody("List-Unsubscribe=Yes"), false);
  assert.equal(isOneClickBody(""), false);
});

test("One-Click ph: ph_marketing.api.unsubscribe_one_click mit token + body, Fehler-Mapping", async () => {
  const env = { ...PH, BACKEND_PH_GRUPPEN: "newsletter" };
  const f = fakeFetch(() => msg({ status: "abgemeldet" }));
  assert.deepEqual(await unsubscribeOneClick({ token: TOKEN, env, fetchImpl: f }), { ok: true, status: "abgemeldet", generation: "ph" });
  assert.equal(f.calls[0].url, "https://ph.staging.test/api/method/ph_marketing.api.unsubscribe_one_click");
  assert.equal(f.calls[0].headers.get("authorization"), AUTH);
  assert.deepEqual(f.calls[0].body, { token: TOKEN, body: ONE_CLICK_BODY });
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env, fetchImpl: fakeFetch(() => msg({ status: "bereits_abgemeldet" })) })).status, "bereits_abgemeldet");
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env, fetchImpl: fakeFetch(() => phErr("invalid_token", 404)) })).code, "invalid_token");
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env, fetchImpl: fakeFetch(() => phErr("invalid", 400)) })).code, "invalid");
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env, fetchImpl: fakeFetch(() => phErr("unavailable", 503)) })).code, "unavailable");
  const none = fakeFetch();
  assert.equal((await unsubscribeOneClick({ token: "kurz", env, fetchImpl: none })).code, "invalid_token");
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env: { BACKEND_PH_GRUPPEN: "newsletter" }, fetchImpl: none })).code, "not_configured");
  assert.equal(none.calls.length, 0);
});

test("One-Click alt: Postausgang mit Token-Hash (bisheriger Weg: Austragen durch das Team)", async () => {
  const entries = [];
  const r = await unsubscribeOneClick({ token: TOKEN, env: {}, outbox: async (e) => entries.push(e), now: new Date("2026-11-04T10:00:00Z") });
  assert.deepEqual(r, { ok: true, status: "vorgemerkt", generation: "alt" });
  assert.deepEqual(entries, [{ art: "newsletter-abmeldung-one-click", eingang: "2026-11-04T10:00:00.000Z", token_sha256: tokenHash(TOKEN) }]);
  assert.equal(JSON.stringify(entries).includes(TOKEN), false, "Klartext-Token nie abgelegt");
  const voll = async () => {
    throw new Error("voll");
  };
  assert.equal((await unsubscribeOneClick({ token: TOKEN, env: {}, outbox: voll })).code, "unavailable");
});

test("One-Click-Route: GET meldet nie ab, noindex, POST nur mit One-Click-Body", () => {
  const src = readFileSync(new URL("../../src/app/api/newsletter/abmelden-1klick/route.js", import.meta.url), "utf8");
  const get = src.slice(src.indexOf("export async function GET"), src.indexOf("export async function POST"));
  assert.doesNotMatch(get, /unsubscribeOneClick/);
  assert.match(src, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(src, /if \(!isOneClickBody\(body\)\) return answer\("invalid", 400/);
  const page = abmeldeSeite({ titel: "T", text: "x", token: TOKEN, action: "/api/newsletter/abmelden-1klick" });
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(page, /<form method="post" action="\/api\/newsletter\/abmelden-1klick\?token=abcdefghijklmnopqrstuvwx_-0123456789">/);
  assert.match(page, /name="List-Unsubscribe" value="One-Click"/);
  assert.doesNotMatch(page, /<script/);
  assert.doesNotMatch(abmeldeSeite({ titel: "<b>", text: "\"x\"" }), /<b>|"x"/, "escaped");
});
