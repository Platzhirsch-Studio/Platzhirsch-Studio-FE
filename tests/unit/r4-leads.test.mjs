// tests/unit/r4-leads.test.mjs — R4-leads (Masterplan AP3 Nr. 2, 4, 8):
// channel rule incl. "KI-Suche", consent boundary of ph_attr, Herkunft
// block + lead_ref, route allowlist (lead_ref not forwarded), trackLead
// transaction_id, web vitals only with consent, booking switch, texts.
// Nothing leaves the process: fetch is always a local stub.
// Run: node --test tests/unit/r4-leads.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATTR_KEY,
  ATTR_TTL_MS,
  CHANNELS,
  CONSENT_EVENT,
  captureAttribution,
  channelOf,
  getAttribution,
  hasSignal,
  mergeStored,
  readConsent,
  readTouch,
  referrerHost,
} from "../../src/lib/attribution.js";
import {
  HERKUNFT_TITLE,
  appendHerkunft,
  deviceOf,
  herkunftBlock,
  isLeadRef,
  leadKindOf,
  newLeadRef,
  stripHerkunft,
  withLead,
} from "../../src/lib/forms/leadPayload.js";
import { postForm, prepareLead } from "../../src/lib/forms/client.js";
import { beratungSchema, kontaktSchema, produktSchema, MAX_BYTES } from "../../src/lib/forms/schemas.js";
import { inquiryHandler } from "../../src/lib/forms/forward.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { bookingConfig } from "../../src/components/Booking/config.js";
import { LEADS_TEXT, leadsCopy, leadsText, selectionLabel } from "../../src/lib/forms/leadsCopy.js";
import { FORM_TEXT, FORM_TEXT_R3 } from "../../src/lib/forms/i18n.js";
import { expectedFor, itExpected, itExpectedTree } from "./r5-i18n-voi.lib.mjs"; // Runde 4: IT voi (tools/i18n/patches/r4-p2-it-voi.json)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const SITE = "https://platzhirsch.studio";
const touch = (query = "", referrer = "", pathname = "/de") => readTouch({ href: `${SITE}${pathname}${query}`, referrer, now: 1_800_000_000_000 });

// ---------------------------------------------------------------- channel rule
test("channel rule (11 F1) incl. KI-Suche", () => {
  const cases = [
    [touch("?gclid=abc"), CHANNELS.googleAds],
    [touch("?gbraid=x"), CHANNELS.googleAds],
    [touch("?wbraid=x&utm_source=newsletter"), CHANNELS.googleAds],
    [touch("?msclkid=m"), CHANNELS.microsoftAds],
    [touch("?utm_source=test&utm_medium=cpc"), CHANNELS.paid],
    [touch("?utm_source=meta&utm_medium=paid_social"), CHANNELS.paid],
    [touch("?utm_source=newsletter&utm_medium=email"), CHANNELS.newsletter],
    [touch("?utm_source=qr-showroom"), CHANNELS.qr],
    [touch("", "https://chatgpt.com/"), CHANNELS.ai],
    [touch("?utm_source=chatgpt.com"), CHANNELS.ai],
    [touch("", "https://www.perplexity.ai/search"), CHANNELS.ai],
    [touch("", "https://gemini.google.com/app"), CHANNELS.ai],
    [touch("", "https://copilot.microsoft.com/"), CHANNELS.ai],
    [touch("", "https://www.google.com/"), CHANNELS.organic],
    [touch("", "https://www.google.at/"), CHANNELS.organic],
    [touch("", "https://www.bing.com/"), CHANNELS.organic],
    [touch("", "https://duckduckgo.com/"), CHANNELS.organic],
    [touch("", "https://www.ecosia.org/"), CHANNELS.organic],
    [touch("", "https://l.instagram.com/"), CHANNELS.social],
    [touch("?fbclid=f"), CHANNELS.social],
    [touch("", "https://www.architektur-magazin.example/beitrag"), CHANNELS.referral],
    [touch("?utm_source=partner"), CHANNELS.referral],
    [touch(), CHANNELS.direct],
    [touch("", `${SITE}/de/produkte`), CHANNELS.direct],
    [null, CHANNELS.direct],
  ];
  for (const [t, expected] of cases) assert.equal(channelOf(t), expected, JSON.stringify(t));
  assert.equal(CHANNELS.ai, "KI-Suche");
});

test("readTouch: utm, click ids, landing path, own host is no referrer, values clipped", () => {
  const t = touch(`?utm_source=test&utm_medium=cpc&utm_campaign=${"x".repeat(400)}&gclid=G1&foo=bar`, "https://www.google.com/search?q=sofa", "/de/produkte/lamps/lamps-2097-18");
  assert.equal(t.landing, "/de/produkte/lamps/lamps-2097-18");
  assert.equal(t.referrer_host, "www.google.com");
  assert.equal(t.utm_source, "test");
  assert.equal(t.utm_medium, "cpc");
  assert.equal(t.utm_campaign.length, 150);
  assert.deepEqual(t.click, { gclid: "G1" });
  assert.equal("foo" in t, false);
  assert.equal(referrerHost(`${SITE}/de`, "www.platzhirsch.studio"), "");
  assert.equal(referrerHost("not a url", "x"), "");
  assert.equal(hasSignal(touch()), false);
  assert.equal(hasSignal(touch("?utm_source=a")), true);
});

// ------------------------------------------------------------ consent boundary
function fakeWindow({ href = `${SITE}/de/kontakt?utm_source=test&utm_medium=cpc&gclid=G1`, referrer = "https://www.google.com/", consent } = {}) {
  const store = new Map();
  const listeners = new Map();
  const win = {
    location: { href },
    document: { referrer, cookie: consent ? `other=1; cookieConsent=${encodeURIComponent(JSON.stringify(consent))}` : "other=1" },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    dispatch(name, detail) {
      listeners.get(name)?.({ detail });
    },
    store,
  };
  return win;
}

test("consent boundary: without Ads consent nothing is stored and no click id leaves memory", () => {
  const win = fakeWindow({ consent: { essential: true, googleAnalytics: true, googleAds: false } });
  captureAttribution(win);
  assert.equal(win.store.has(ATTR_KEY), false, "no ph_attr without Ads consent");
  const a = getAttribution(win);
  assert.equal(a.consentAds, false);
  assert.equal(a.current.utm_source, "test");
  assert.equal(a.current.click, undefined, "click ids are not handed out");
  assert.equal(a.first, null);
  // The channel is still known (presence of gclid is no id).
  const block = herkunftBlock(a, { leadRef: newLeadRef() });
  assert.match(block, /Kanal: Paid|Kanal: Google Ads/);
  assert.doesNotMatch(block, /G1|gclid/);
  // No consent at all (banner not answered): same.
  const none = fakeWindow();
  captureAttribution(none);
  assert.equal(none.store.size, 0);
});

test("consent boundary: with Ads consent ph_attr holds first/last touch + click ids, withdrawal removes it", () => {
  const win = fakeWindow({ consent: { essential: true, googleAds: true, marketing: true } });
  captureAttribution(win);
  const saved = JSON.parse(win.store.get(ATTR_KEY));
  assert.equal(saved.v, 1);
  assert.deepEqual(saved.first.click, { gclid: "G1" });
  assert.equal(saved.last.utm_medium, "cpc");
  assert.ok(saved.exp > Date.now() + ATTR_TTL_MS - 60_000);
  const a = getAttribution(win);
  assert.equal(a.consentAds, true);
  assert.match(herkunftBlock(a, {}), /Klick-ID: gclid=G1/);
  // Withdraw → removed at once.
  win.document.cookie = `cookieConsent=${encodeURIComponent(JSON.stringify({ essential: true, googleAds: false }))}`;
  win.dispatch(CONSENT_EVENT, { essential: true, googleAds: false });
  assert.equal(win.store.has(ATTR_KEY), false);
});

test("consent given later in the visit: the in-memory touch is stored then", () => {
  const win = fakeWindow();
  captureAttribution(win);
  assert.equal(win.store.size, 0);
  win.dispatch(CONSENT_EVENT, { googleAds: true });
  assert.equal(JSON.parse(win.store.get(ATTR_KEY)).first.utm_source, "test");
});

test("mergeStored: first stays, a direct visit does not overwrite last, 90 days rolling, expired → new", () => {
  const now = 1_800_000_000_000;
  const first = { ts: now - 1000, landing: "/de", referrer_host: "www.google.com" };
  const direct = { ts: now, landing: "/de/kontakt", referrer_host: "" };
  const paid = { ts: now, landing: "/de/x", referrer_host: "", utm_medium: "cpc", utm_source: "google" };
  const rec = mergeStored(null, first, now);
  assert.deepEqual([rec.first, rec.last], [first, first]);
  assert.equal(rec.exp, now + ATTR_TTL_MS);
  assert.equal(mergeStored(rec, direct, now).last, first);
  assert.equal(mergeStored(rec, paid, now).last, paid);
  assert.equal(mergeStored(rec, paid, now).first, first);
  assert.equal(mergeStored({ ...rec, exp: now - 1 }, paid, now).first, paid);
});

test("readConsent reads the cookies-next encoded JSON, tolerates junk", () => {
  assert.deepEqual(readConsent(`a=1; cookieConsent=${encodeURIComponent('{"googleAds":true}')}`), { googleAds: true });
  assert.equal(readConsent("cookieConsent=%7Bkaputt"), null);
  assert.equal(readConsent(""), null);
});

// ------------------------------------------------------- block, lead_ref, forms
test("Herkunft block: format, lead_ref, appended once to the existing free-text field", () => {
  const ref = newLeadRef();
  assert.ok(isLeadRef(ref));
  assert.equal(isLeadRef("nope"), false);
  const attribution = { current: touch("?utm_source=test&utm_medium=cpc&utm_campaign=minotti", "", "/de/designermoebel-lindau"), consentAds: false };
  const out = withLead({ name: "Erika", ihre_nachricht: "Ich interessiere mich für ein Sofa." }, "kontakt", { attribution, leadRef: ref, locale: "de", device: "mobil" });
  assert.equal(out.lead_ref, ref);
  assert.equal(out.name, "Erika");
  const lines = out.ihre_nachricht.split("\n");
  assert.equal(lines[0], "Ich interessiere mich für ein Sofa.");
  assert.equal(lines[2], HERKUNFT_TITLE);
  // Without Ads consent: only the channel (Rechtspaket 02 Z. 130 / C13).
  assert.match(out.ihre_nachricht, /\nKanal: Paid\n/);
  assert.doesNotMatch(out.ihre_nachricht, /Quelle:|Kampagne:|minotti|Einstieg:|Referrer:|utm_/);
  assert.match(out.ihre_nachricht, /Sprache: de · Gerät: mobil/);
  // With Ads consent: source, campaign and landing page.
  const consented = withLead({ ihre_nachricht: "Sofa bitte." }, "kontakt", { attribution: { ...attribution, consentAds: true, last: attribution.current, first: attribution.current }, leadRef: ref });
  assert.match(consented.ihre_nachricht, /Kanal: Paid · Quelle: test \/ cpc · Kampagne: minotti/);
  assert.match(consented.ihre_nachricht, /Einstieg: \/de\/designermoebel-lindau/);
  assert.match(out.ihre_nachricht, new RegExp(`Referenz: ${ref}`));
  // Not doubled on a second pass, own text recoverable.
  const again = withLead(out, "kontakt", { attribution, leadRef: ref });
  assert.equal(again.ihre_nachricht.split(HERKUNFT_TITLE).length, 2);
  assert.equal(stripHerkunft(again.ihre_nachricht), "Ich interessiere mich für ein Sofa.");
  // Empty optional field (Produktanfrage): the block alone.
  assert.ok(appendHerkunft("", "B") === "B");
  const p = withLead({ anfrage_beschreibung: "" }, "produkt", { leadRef: ref });
  assert.ok(p.anfrage_beschreibung.startsWith(HERKUNFT_TITLE));
  assert.match(p.anfrage_beschreibung, /Kanal: unbekannt/);
  // Beratung field, unknown kind untouched.
  assert.ok(withLead({ bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer" }, "beratung", { leadRef: ref }).bitte_beschreiben_sie_ihr_vorhaben.includes(HERKUNFT_TITLE));
  assert.deepEqual(withLead({ email: "a@b.at" }, "newsletter", {}), { email: "a@b.at" });
});

test("leadKindOf covers all four forms (Adventsabend posts to /api/kontakt), not the newsletter", () => {
  assert.equal(leadKindOf("/api/upload/inquiry/kontakt"), "kontakt");
  assert.equal(leadKindOf("/api/kontakt"), "kontakt");
  assert.equal(leadKindOf("/api/upload/inquiry/beratung"), "beratung");
  assert.equal(leadKindOf("/api/beratung_anfrage"), "beratung");
  assert.equal(leadKindOf("/api/upload/inquiry/produkt"), "produkt");
  assert.equal(leadKindOf("/api/anfrage_produkt"), "produkt");
  assert.equal(leadKindOf("/api/newsletter_subscribe"), null);
  assert.equal(deviceOf(390), "mobil");
  assert.equal(deviceOf(820), "Tablet");
  assert.equal(deviceOf(1440), "Desktop");
});

test("postForm with lead options sends block + lead_ref and returns leadRef; lead:false sends the payload as is", async () => {
  const bodies = [];
  const fetchImpl = async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return Response.json({ success: true, message: "ok", data: {} });
  };
  const res = await postForm("/api/upload/inquiry/beratung", { bitte_beschreiben_sie_ihr_vorhaben: "Neues Wohnzimmer", website: "", _t: 4000 }, { fetchImpl, lead: { attribution: { current: touch("", "https://chatgpt.com/") }, locale: "de", device: "Desktop" } });
  assert.equal(res.ok, true);
  assert.ok(isLeadRef(res.leadRef));
  assert.equal(bodies[0].lead_ref, res.leadRef);
  assert.match(bodies[0].bitte_beschreiben_sie_ihr_vorhaben, /Kanal: KI-Suche/);
  await postForm("/api/upload/inquiry/kontakt", { a: 1 }, { fetchImpl, lead: false });
  assert.deepEqual(bodies[1], { a: 1 });
  assert.deepEqual(prepareLead("/api/newsletter_subscribe", { email: "x" }, {}).body, { email: "x" });
});

test("postForm remembers lead_ref only for a lead that arrived (failed send leaves nothing for trackLead)", async () => {
  globalThis.window = {};
  try {
    const { lastLeadRef } = await import("../../src/lib/attribution.js");
    const lead = { attribution: { current: touch() }, locale: "de" };
    const failed = await postForm("/api/upload/inquiry/kontakt", { ihre_nachricht: "Hallo Welt, Sofa" }, { fetchImpl: async () => Response.json({ success: false }, { status: 502 }), lead });
    assert.equal(failed.ok, false);
    assert.ok(isLeadRef(failed.leadRef));
    assert.equal(lastLeadRef(), null, "failed send: no reference to inherit");
    const offline = await postForm("/api/upload/inquiry/kontakt", { ihre_nachricht: "Hallo Welt, Sofa" }, { fetchImpl: async () => { throw new TypeError("offline"); }, lead });
    assert.equal(offline.code, "network");
    assert.equal(lastLeadRef(), null);
    const ok = await postForm("/api/upload/inquiry/kontakt", { ihre_nachricht: "Hallo Welt, Sofa" }, { fetchImpl: async () => Response.json({ success: true, data: {} }), lead });
    assert.equal(lastLeadRef(), ok.leadRef);
  } finally {
    delete globalThis.window;
  }
});

// ------------------------------------------------------------ routes / schemas
const KONTAKT = { name: "Erika Muster", company: "", email_address: "erika@example.com", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." };

test("schemas: block + lead_ref accepted, minimum length counts the visitor's own text, bad lead_ref dropped", () => {
  const withBlock = withLead(KONTAKT, "kontakt", { leadRef: newLeadRef() });
  const parsed = kontaktSchema.parse(withBlock);
  assert.equal(parsed.ihre_nachricht, withBlock.ihre_nachricht);
  assert.equal(parsed.lead_ref, withBlock.lead_ref);
  assert.equal(kontaktSchema.safeParse(withLead({ ...KONTAKT, ihre_nachricht: "kurz" }, "kontakt", {})).success, false, "block must not satisfy the 10-char minimum");
  assert.equal(kontaktSchema.parse({ ...KONTAKT, lead_ref: "<script>" }).lead_ref, undefined);
  // Old callers (Küchenplaner, without lead_ref) still pass unchanged.
  assert.deepEqual(kontaktSchema.parse(KONTAKT), KONTAKT);
  // Full user text + block still fits.
  const long = withLead({ ...KONTAKT, ihre_nachricht: "x".repeat(8000) }, "kontakt", { attribution: { current: touch(`?utm_campaign=${"c".repeat(150)}&utm_term=${"t".repeat(150)}&utm_content=${"a".repeat(150)}`, "https://www.google.com/") } });
  assert.equal(kontaktSchema.safeParse(long).success, true);
  const beratung = withLead({ bei_meiner_anfrage_geht_es_um: "einen Neubau", das_projekt_soll_verwirklicht_werden: "in einer Wohnung", bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu einrichten", vorname: "E", nachname: "M", email: "e@example.com", telefon: "+43 664 1234567" }, "beratung", {});
  assert.equal(beratungSchema.safeParse(beratung).success, true);
  const produkt = withLead({ anfrage_type: "Privat", anfrage_vorname: "E", anfrage_nachname: "M", anfrage_email: "e@example.com", anfrage_phone: "+43 664", anfrage_country: "AT", anfrage_city: "Lochau", anfrage_address: "X 1", anfrage_beschreibung: "", produkte: [1] }, "produkt", {});
  assert.equal(produktSchema.safeParse(produkt).success, true);
});

test("route: the backoffice gets the same fields as before plus the text block, never lead_ref", async () => {
  const forwarded = [];
  const fetchImpl = async (url, init) => {
    forwarded.push({ url, body: JSON.parse(init.body) });
    return Response.json({ message: { name: "KF-0001" } });
  };
  const POST = inquiryHandler({ route: "r4-kontakt", url: "https://backoffice.example.invalid/k", schema: kontaktSchema, maxBytes: MAX_BYTES.kontakt, successMessage: "ok", failMessage: "f", fetchImpl, limiter: createRateLimiter(), now: () => 1_800_000_000_000 });
  const body = { ...withLead(KONTAKT, "kontakt", { leadRef: newLeadRef(), attribution: { current: touch("?utm_source=test&utm_medium=cpc") } }), website: "", _t: 5000 };
  const res = await POST(new Request("http://localhost/api/kontakt", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" }, body: JSON.stringify(body) }));
  assert.equal(res.status, 200);
  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0].url, "https://backoffice.example.invalid/k");
  assert.deepEqual(Object.keys(forwarded[0].body).sort(), ["company", "email_address", "ihre_nachricht", "name", "telefon"]);
  assert.match(forwarded[0].body.ihre_nachricht, /Herkunft \(automatisch\)[\s\S]*Kanal: Paid[\s\S]*Referenz: /);
  assert.ok(forwarded[0].body.ihre_nachricht.includes(body.lead_ref));
});

// --------------------------------------------------------- analytics in a window
test("trackLead carries transaction_id; web vitals only with statistics consent; add_to_wishlist", async () => {
  const calls = [];
  globalThis.window = { gtag: (...args) => calls.push(args), location: { pathname: "/de/kontakt" } };
  globalThis.document = { cookie: "" };
  try {
    const { trackLead, reportWebVitals, trackWishlist } = await import("../../src/lib/analytics.js");
    const { rememberLeadRef } = await import("../../src/lib/attribution.js");
    trackLead("beratung", { transaction_id: "ref-1" });
    assert.deepEqual(calls.at(-1), ["event", "generate_lead", { form: "beratung", transaction_id: "ref-1" }]);
    rememberLeadRef("ref-2");
    trackLead("kontakt");
    assert.equal(calls.at(-1)[2].transaction_id, "ref-2", "fallback: reference of the last sent form");
    trackLead("kuechenplaner");
    assert.equal(calls.at(-1)[2].transaction_id, undefined, "used only once");

    const metric = { name: "LCP", id: "v1", value: 1834.2, delta: 1834.2, rating: "good" };
    const before = calls.length;
    reportWebVitals(metric);
    assert.equal(calls.length, before, "no consent → nothing sent");
    globalThis.document.cookie = `cookieConsent=${encodeURIComponent(JSON.stringify({ googleAnalytics: true }))}`;
    reportWebVitals(metric);
    assert.equal(calls.at(-1)[1], "web_vitals");
    assert.equal(calls.at(-1)[2].metric_name, "LCP");
    reportWebVitals({ name: "CLS", id: "v2", value: 0.05, delta: 0.05, rating: "good" });
    assert.equal(calls.at(-1)[2].value, 50);

    trackWishlist({ id: 7, produkte_id: 7, name: "Lawrence", category: "Minotti" });
    assert.deepEqual(calls.at(-1), ["event", "add_to_wishlist", { items: [{ item_id: "7", item_name: "Lawrence", item_brand: "Minotti" }] }]);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("CartContext sends add_to_wishlist and mounts WebVitals (next/web-vitals, no npm package)", () => {
  const cart = read("src/context/CartContext.js");
  assert.match(cart, /trackWishlist\(item\)/);
  assert.match(cart, /trackWishlist\(added\)/);
  assert.match(cart, /<WebVitals \/>/);
  const vitals = read("src/context/WebVitals.js");
  assert.match(vitals, /from "next\/web-vitals"/);
  assert.match(vitals, /useReportWebVitals\(reportWebVitals\)/);
  const pkg = JSON.parse(read("package.json"));
  assert.equal({ ...pkg.dependencies, ...pkg.devDependencies }["web-vitals"], undefined);
  const instr = read("src/instrumentation-client.js");
  assert.match(instr, /captureAttribution\(window\)/);
});

// --------------------------------------------------------------------- booking
test("booking switch: default none, link needs an https URL, anything else is none", () => {
  assert.deepEqual(bookingConfig({}), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "none", BOOKING_URL: "https://x.example" }), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "calcom", BOOKING_URL: "https://cal.example" }), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "link", BOOKING_URL: "http://insecure.example" }), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "link", BOOKING_URL: "javascript:alert(1)" }), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "Link", BOOKING_URL: "https://calendar.app.google/abc" }), { provider: "link", url: "https://calendar.app.google/abc", host: "calendar.app.google" });
  const embed = read("src/components/Booking/BookingEmbed.js");
  assert.doesNotMatch(embed, /<iframe|<script|wa\.me|whatsapp\.com/i, "nothing third-party before the click, no WhatsApp");
  // "new window" note is tied to the link for screen readers (WCAG 3.2.5 / G201).
  assert.match(embed, /aria-describedby="termin-online-hinweis"/);
  assert.match(embed, /<p id="termin-online-hinweis"/);
  assert.match(read("src/lib/analytics.js"), /"book_appointment"/);
  assert.match(read("src/app/[locale]/beratung/page.js"), /<BookingEmbed locale=\{locale\} \/>/);
});

// ----------------------------------------------------------------------- texts
const keysOf = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keysOf(v, `${p}${k}.`) : [`${p}${k}`]));
const get = (o, key) => key.split(".").reduce((x, k) => (x && typeof x === "object" ? x[k] : undefined), o);

// R6-leads: the texts were merged into src/messages (R5-i18n), LEADS_TEXT is a
// thin German safety net. The check now runs against the messages.
test("R4 texts: merged into all four messages files, LEADS_TEXT = thin DE fallback, no superlatives/promises", () => {
  const proposal = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r4-leads.json"));
  const keys = keysOf(proposal.de).sort();
  for (const l of ["de", "en", "fr", "it"]) {
    const messages = JSON.parse(read(`src/messages/${l}.json`));
    assert.deepEqual(keysOf(proposal[l]).sort(), keys, `proposal ${l}: same keys`);
    for (const k of keys) {
      assert.equal(typeof get(messages, k), "string", `${l}: ${k} in messages`);
      assert.equal(get(messages, k), expectedFor(l, k, get(proposal[l], k)), `${l}: ${k} = proposal`);
      assert.doesNotMatch(get(messages, k), /größt|einzig|beste|offizielle[rn]? Händler|garantiert|abgesichert|!/i, `${l}: ${k}`);
    }
  }
  // Thin fallback: German only, equal to messages/de; other locales empty.
  const de = JSON.parse(read("src/messages/de.json"));
  assert.deepEqual(keysOf(LEADS_TEXT.de).sort(), keys);
  for (const k of keys) assert.equal(get(LEADS_TEXT.de, k), get(de, k), `fallback de: ${k}`);
  for (const l of ["en", "fr", "it"]) assert.deepEqual(LEADS_TEXT[l], {}, `fallback ${l} empty`);
  assert.equal(leadsText("de", "booking.note", { host: "calendar.app.google" }).includes("calendar.app.google"), true);
  assert.equal(leadsText("xx", "cart.selection.showroom"), de.cart.selection.showroom);
  assert.equal(leadsText("it", "booking.cta"), de.booking.cta, "missing key → DE, never a bare key");
  // Readers prefer the messages: a translator that has the key wins.
  const it = JSON.parse(read("src/messages/it.json"));
  const t = Object.assign((k) => get(it, k), { has: (k) => typeof get(it, k) === "string" });
  assert.equal(leadsCopy(t, "it", "cart.selection.showroom"), it.cart.selection.showroom);
});

test("selectionLabel for /beratung?produkt=: brand + name, de-duplicated, capped", () => {
  assert.equal(selectionLabel([{ category: "Minotti", name: "Lawrence" }, { category: "Minotti", name: "Lawrence" }, { name: "Tisch" }]), "Minotti Lawrence, Tisch");
  const many = Array.from({ length: 14 }, (_, i) => ({ category: "B", name: `N${i}` }));
  assert.match(selectionLabel(many), /, …$/);
  assert.ok(selectionLabel(Array.from({ length: 10 }, () => ({ name: "y".repeat(100) + Math.random() }))).length <= 400);
  assert.equal(selectionLabel(null), "");
});

test("i18n fallback removed: every forms.* key of the old tables exists in all four messages files", () => {
  const src = read("src/components/Forms/useFormText.js");
  assert.doesNotMatch(src, /formText\(|FORM_TEXT/, "useFormText reads the messages only");
  const keys = [...new Set([...keysOf(FORM_TEXT.de), ...keysOf(FORM_TEXT_R3.de)])];
  for (const l of ["de", "en", "fr", "it"]) {
    const messages = JSON.parse(read(`src/messages/${l}.json`));
    for (const k of keys) assert.equal(typeof get(messages.forms, k), "string", `${l}: forms.${k}`);
  }
});
