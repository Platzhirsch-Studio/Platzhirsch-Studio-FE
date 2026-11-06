// tests/unit/bewertungen.test.mjs – /bewerten: Formular + Übersicht an ph_marketing
// (create_bewertung, get_bewertungen). Website-Anbindung Runde 2, Punkt 4.
// Alle Aufrufe gegen fetch-Attrappen, nichts geht an ein Backend.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ANLAESSE, EINWILLIGUNG_TEXTVERSION, bewertungSchema, validateBewertung } from "../../src/lib/bewertungen/schema.js";
import {
  EMPTY_LIST,
  PH_CREATE_METHOD,
  PH_LIST_METHOD,
  bewertungFormAvailable,
  cachedFetch,
  loadBewertungen,
  mapList,
  mapReview,
  phBewertungPayload,
  sendBewertung,
} from "../../src/lib/bewertungen/backend.js";
import { BEWERTUNG_COPY, formatAverage } from "../../src/lib/bewertungen/copy.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const PH = { BACKEND_PH_URL: "https://staging.example.test", BACKEND_PH_TOKEN: "k:s", BACKEND_PH_GRUPPEN: "bewertung" };
const SALT = "salz";

function recorder(body, status = 200) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: status < 400, status, json: async () => body };
  };
  return { calls, fetchImpl };
}

test("Validierung: Sterne 1–5 oder Text, Längen, E-Mail optional, Einwilligung freiwillig", () => {
  assert.equal(validateBewertung({}).ok, false);
  assert.equal(validateBewertung({}).errors.sterne, "required");
  for (const n of [1, 2, 3, 4, 5]) assert.equal(validateBewertung({ sterne: n }).ok, true, `${n} Sterne`);
  assert.equal(validateBewertung({ sterne: "3" }).data.sterne, 3);
  assert.equal(validateBewertung({ sterne: 6 }).errors.sterne, "choice");
  assert.equal(validateBewertung({ sterne: 2.5 }).errors.sterne, "choice");
  assert.equal(validateBewertung({ text: "Gute Lieferung" }).ok, true, "Text ohne Sterne genügt");
  assert.equal(validateBewertung({ sterne: 4, text: "x".repeat(4001) }).errors.text, "long");
  assert.equal(validateBewertung({ sterne: 4, name: "n".repeat(141) }).errors.name, "long");
  assert.equal(validateBewertung({ sterne: 4, email: "kein-at" }).errors.email, "email");
  assert.equal(validateBewertung({ sterne: 4, email: " A@B.TEST " }).data.email, "a@b.test");
  assert.equal(validateBewertung({ sterne: 4, anlass: "urlaub" }).errors.anlass, "choice");
  assert.equal(validateBewertung({ sterne: 4 }).data.einwilligung, false, "nicht vorausgewählt");
  assert.equal(validateBewertung({ sterne: 4, einwilligung: true }).data.einwilligung, true);
  assert.equal(validateBewertung({ sterne: 4, quelle: "google" }).data.quelle, "direkt", "Google nur über den Import im Backoffice");
  assert.deepEqual([...ANLAESSE], ["lieferung", "montage", "abholung", "beratung", "service", "sonstiges"]);
  const bad = bewertungSchema.safeParse({ sterne: 9 });
  assert.equal(bad.success, false);
  assert.deepEqual(bad.error.issues[0].path, ["sterne"]);
});

test("Kein Gating: 1 Stern und 5 Sterne ergeben dieselbe Payload-Form", () => {
  const a = phBewertungPayload(validateBewertung({ sterne: 1, text: "x" }).data);
  const b = phBewertungPayload(validateBewertung({ sterne: 5, text: "x" }).data);
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  assert.equal(a.sterne, 1);
  assert.equal(b.sterne, 5);
});

test("Payload: nur dokumentierte Felder, Textversion nur mit Einwilligung, Seite /de/bewerten", () => {
  const d = validateBewertung({ sterne: 4, text: "Danke", name: "Anna Muster", email: "a@b.test", anlass: "lieferung", einwilligung: true, idem: "id-1" }).data;
  const p = phBewertungPayload(d);
  assert.deepEqual(p, {
    sterne: 4,
    text: "Danke",
    name: "Anna Muster",
    email: "a@b.test",
    anlass: "lieferung",
    quelle: "direkt",
    einwilligung_veroeffentlichung: 1,
    textversion: EINWILLIGUNG_TEXTVERSION,
    seite: "/de/bewerten",
    idempotency_key: "id-1",
  });
  const ohne = phBewertungPayload(validateBewertung({ sterne: 2 }).data, { leadRef: "BEW-R-1" });
  assert.equal(ohne.einwilligung_veroeffentlichung, 0);
  assert.equal(ohne.textversion, undefined);
  assert.equal(ohne.idempotency_key, "BEW-R-1");
});

test("Formular nur mit Gruppe bewertung auf ph UND Zugang", () => {
  assert.equal(bewertungFormAvailable({}), false, "Standard alt");
  assert.equal(bewertungFormAvailable({ BACKEND_PH_GRUPPEN: "bewertung" }), false, "ph ohne Zugang");
  assert.equal(bewertungFormAvailable(PH), true);
  assert.equal(bewertungFormAvailable({ ...PH, BACKEND_GENERATION: "ph", BACKEND_ALT_GRUPPEN: "bewertung", BACKEND_PH_GRUPPEN: "" }), false);
});

test("sendBewertung ph: Pfad, POST-Body, Token, X-PH-Client aus Salz + IP; Antwort referenz", async () => {
  const r = recorder({ message: { referenz: "PH-BEW-0001", status: "Neu", email: "a***@b.test" } });
  const data = validateBewertung({ sterne: 5, text: "Gut", einwilligung: true }).data;
  const out = await sendBewertung(data, { env: { ...PH, BACKEND_PH_CLIENT_SALT: SALT }, fetchImpl: r.fetchImpl, visitorIp: "203.0.113.9" });
  assert.deepEqual(out, { ok: true, referenz: "PH-BEW-0001", status: "Neu", generation: "ph" });
  const { url, init } = r.calls[0];
  assert.equal(url, `https://staging.example.test/api/method/${PH_CREATE_METHOD}`);
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, "token k:s");
  assert.equal(init.headers["X-PH-Client"], createHash("sha256").update("203.0.113.9" + SALT).digest("hex"));
  const body = JSON.parse(init.body);
  assert.equal(body.sterne, 5);
  assert.equal(body.einwilligung_veroeffentlichung, 1);
  assert.equal(body.textversion, EINWILLIGUNG_TEXTVERSION);
  assert.ok(!("name" in body), "leere Felder werden nicht gesendet");

  const ohneSalz = recorder({ message: { referenz: "PH-BEW-0002" } });
  await sendBewertung(data, { env: PH, fetchImpl: ohneSalz.fetchImpl, visitorIp: "203.0.113.9" });
  assert.equal(ohneSalz.calls[0].init.headers["X-PH-Client"], undefined);
});

test("sendBewertung: alt → not_available ohne Aufruf, ph ohne Zugang → not_configured, Fehlercodes", async () => {
  const none = recorder({});
  const data = validateBewertung({ sterne: 3 }).data;
  assert.deepEqual(await sendBewertung(data, { env: {}, fetchImpl: none.fetchImpl }), { ok: false, code: "not_available", generation: "alt" });
  assert.deepEqual(await sendBewertung(data, { env: { BACKEND_PH_GRUPPEN: "bewertung" }, fetchImpl: none.fetchImpl }), { ok: false, code: "not_configured", generation: "ph" });
  assert.equal(none.calls.length, 0);
  const inv = recorder({ message: { code: "invalid", field: "email" } }, 400);
  assert.equal((await sendBewertung(data, { env: PH, fetchImpl: inv.fetchImpl })).code, "invalid");
  const rl = recorder({}, 429);
  assert.equal((await sendBewertung(data, { env: PH, fetchImpl: rl.fetchImpl })).code, "rate_limited");
  const down = recorder({}, 500);
  assert.equal((await sendBewertung(data, { env: PH, fetchImpl: down.fetchImpl })).code, "unavailable");
  const net = { fetchImpl: async () => { throw new TypeError("fetch failed"); } };
  assert.equal((await sendBewertung(data, { env: PH, ...net })).code, "unavailable");
});

test("loadBewertungen: alt leer ohne Aufruf; ph GET mit limit, ohne X-PH-Client, Mapping", async () => {
  const none = recorder({});
  const alt = await loadBewertungen({ env: { BACKEND_PH_CLIENT_SALT: SALT }, fetchImpl: none.fetchImpl });
  assert.deepEqual(alt, { ...EMPTY_LIST, generation: "alt" });
  assert.equal(none.calls.length, 0);

  const msg = {
    count: 2,
    average: 4.5,
    reviews: [
      { id: "PH-BEW-2", author: "Anna M.", rating: 5, text: "Pünktlich geliefert.", date: "2026-10-30", source: "direkt", occasion: "Lieferung", reply: null },
      { id: "g-1", author: "Ben", rating: 4, text: "", date: "2026-10-01", source: "google", occasion: null, reply: "Danke!" },
    ],
  };
  const r = recorder({ message: msg });
  const out = await loadBewertungen({ env: { ...PH, BACKEND_PH_CLIENT_SALT: SALT }, fetchImpl: r.fetchImpl, limit: 500 });
  const { url, init } = r.calls[0];
  assert.equal(url, `https://staging.example.test/api/method/${PH_LIST_METHOD}?limit=100`);
  assert.equal(init.method, "GET");
  assert.equal(init.headers["X-PH-Client"], undefined, "öffentliche Liste ohne Besucherbezug");
  assert.equal(out.generation, "ph");
  assert.equal(out.count, 2);
  assert.equal(out.average, 4.5);
  assert.equal(out.reviews.length, 2);
  assert.equal(out.reviews[1].source, "google");
  assert.equal(out.reviews[1].reply, "Danke!");

  const err = recorder({}, 503);
  const e = await loadBewertungen({ env: PH, fetchImpl: err.fetchImpl });
  assert.equal(e.count, 0);
  assert.equal(e.average, null);
  assert.equal(e.error, "unavailable");
});

test("Mapping: ungültige Einträge raus, kein Durchschnitt ohne Bewertungen", () => {
  assert.equal(mapReview(null), null);
  assert.equal(mapReview({ rating: 0, text: "" }), null);
  assert.equal(mapReview({ rating: 9, text: "ok" }).rating, null);
  assert.equal(mapReview({ rating: 3, date: "gestern" }).date, null);
  assert.deepEqual(mapList(null), EMPTY_LIST);
  assert.deepEqual(mapList({ count: 0, average: null, reviews: [] }), { count: 0, average: null, reviews: [] });
  assert.equal(mapList({ count: 3, average: 7, reviews: [{ rating: 5, text: "a" }] }).average, null);
  assert.equal(mapList({ count: "x", average: 4, reviews: [{ rating: 4 }] }).count, 1);
});

test("cachedFetch: kurzer Daten-Cache statt no-store", async () => {
  let seen;
  await cachedFetch(async (u, i) => ((seen = i), { ok: true }))("https://x.test", { method: "GET", cache: "no-store", headers: { a: 1 } });
  assert.equal(seen.cache, undefined);
  assert.deepEqual(seen.next, { revalidate: 300, tags: ["bewertungen"] });
  assert.deepEqual(seen.headers, { a: 1 });
});

test("Texte: vier Sprachen mit denselben Schlüsseln, ohne Superlative, Leerzustand ohne Zahlen", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const de = keys(BEWERTUNG_COPY.de);
  for (const l of ["en", "fr", "it"]) assert.deepEqual(keys(BEWERTUNG_COPY[l]), de, l);
  const all = JSON.stringify(BEWERTUNG_COPY);
  assert.doesNotMatch(all, /(?<![\p{L}])(beste[rns]?|führend\p{L}*|einzigartig\p{L}*|best|leading|unique|meilleur\p{L}*|migliore)(?![\p{L}])/iu);
  for (const l of ["de", "en", "fr", "it"]) {
    assert.doesNotMatch(BEWERTUNG_COPY[l].listEmpty, /\d/, `${l}: Leerzustand ohne Zahlen`);
    for (const a of ANLAESSE) assert.ok(BEWERTUNG_COPY[l].anlaesse[a], `${l}: ${a}`);
  }
  assert.match(BEWERTUNG_COPY.de.consentPublish, /widerrufen/);
  assert.equal(formatAverage(4.6, "de"), "4,6");
  assert.equal(formatAverage(4.6, "en"), "4.6");
  assert.equal(formatAverage(null, "de"), "");
});

test("Seite: Google-Link zuerst, Formular nur mit Zugang, Route mit guardForm/originCheck", () => {
  const page = read("src/app/[locale]/bewerten/page.js");
  assert.match(page, /<ReviewNotice variant="link"/);
  assert.ok(page.indexOf("Auf Google bewerten") < page.indexOf("<BewertungListe"), "Übersicht nach dem Google-Link");
  assert.ok(page.indexOf("<BewertungListe") < page.indexOf("<BewertungForm"), "Formular nach der Übersicht");
  assert.match(page, /\{formular && \(/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  const route = read("src/app/[locale]/bewerten/senden/route.js");
  for (const s of ["originCheck", "guardForm", "bewertungSchema", "no-store", "noindex"]) assert.ok(route.includes(s), s);
  const form = read("src/components/Bewerten/BewertungForm.js");
  assert.match(form, /<fieldset/);
  assert.match(form, /<legend/);
  assert.match(form, /type="checkbox"/);
  assert.doesNotMatch(form, /einwilligung: true/, "Einwilligung nicht vorausgewählt");
  const liste = read("src/components/Bewerten/BewertungListe.js");
  assert.match(liste, /data-bewertung-leer/);
});
