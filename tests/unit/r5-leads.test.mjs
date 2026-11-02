// tests/unit/r5-leads.test.mjs — R5-leads-perf:
//   (1) TBT /de/kontakt: plain form texts skip the ICU compile (same output
//       as before, checked against the real use-intl translator for every
//       forms.* key in 4 languages), errorKey without the i18n text tables,
//       no static import of UploadHandoff / lib/upload/* / lib/forms/i18n
//       from the lead forms;
//   (2) trackLead("kontakt", { transaction_id }) explicitly, all forms;
//   (3) optional Selbstauskunft: code → German label in the Herkunft block,
//       free text dropped, consent boundary unchanged, backoffice gets the
//       same fields as before.
// Nothing leaves the process: fetch is always a local stub.
// Run: node --test tests/unit/r5-leads.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator } from "use-intl/core";

import { formatFormText } from "../../src/lib/forms/formatText.js";
import { CODE_KEYS, errorKey } from "../../src/lib/forms/errorKey.js";
import { errorKey as errorKeyI18n } from "../../src/lib/forms/i18n.js";
import {
  SELF_REPORT_CODES,
  SELF_REPORT_NAME,
  SELF_REPORT_OPTIONS,
  SELF_REPORT_TEXT,
  selfReportFrom,
  selfReportLabel,
} from "../../src/lib/forms/selfReport.js";
import { postForm, prepareLead } from "../../src/lib/forms/client.js";
import { HERKUNFT_TITLE, herkunftBlock, newLeadRef, withLead } from "../../src/lib/forms/leadPayload.js";
import { readTouch } from "../../src/lib/attribution.js";
import { kontaktSchema, MAX_BYTES } from "../../src/lib/forms/schemas.js";
import { inquiryHandler } from "../../src/lib/forms/forward.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { expectedFor, itExpected, itExpectedTree } from "./r5-i18n-voi.lib.mjs"; // Runde 4: IT voi (tools/i18n/patches/r4-p2-it-voi.json)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const LOCALES = ["de", "en", "fr", "it"];
const PHONE = "+43 5574 20290";
const SITE = "https://platzhirsch.studio";
const touch = (query = "", referrer = "", pathname = "/de") => readTouch({ href: `${SITE}${pathname}${query}`, referrer, now: 1_800_000_000_000 });

function leafKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? leafKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

// ------------------------------------------------------------- (1) ICU lazy
test("formatFormText = t(key, { phone }) for every forms.* key in 4 languages", () => {
  for (const locale of LOCALES) {
    const messages = json(`src/messages/${locale}.json`);
    const t = createTranslator({ locale, messages, namespace: "forms", onError: () => {} });
    const keys = leafKeys(messages.forms).filter((k) => typeof t.raw(k) === "string");
    assert.ok(keys.length >= 25, `${locale}: forms.* found (${keys.length})`);
    for (const key of keys) {
      const vars = { count: 2, current: 3, total: 4, min: 10, product: "Minotti Lawrence" };
      assert.equal(formatFormText(t, key, undefined, PHONE), t(key, { phone: PHONE }), `${locale} ${key}`);
      assert.equal(formatFormText(t, key, vars, PHONE), t(key, { phone: PHONE, ...vars }), `${locale} ${key} (vars)`);
    }
  }
});

test("formatFormText compiles only messages with placeholders (no ICU for plain labels)", () => {
  const calls = [];
  const messages = { optional: "optional", upstream: "Rufen Sie an: {phone}.", quote: "l'atelier", summary: "{count, plural, one {ein Feld} other {# Felder}}" };
  const t = Object.assign((key, vars) => (calls.push([key, vars]), `T:${key}`), {
    has: (key) => key in messages,
    raw: (key) => messages[key],
  });
  assert.equal(formatFormText(t, "optional", undefined, PHONE), "optional");
  assert.equal(calls.length, 0, "plain text: no t() call, no compile");
  assert.equal(formatFormText(t, "upstream", undefined, PHONE), "T:upstream");
  assert.deepEqual(calls.at(-1), ["upstream", { phone: PHONE }]);
  formatFormText(t, "quote", undefined, PHONE);
  assert.equal(calls.at(-1)[0], "quote", "apostrophe escapes go through ICU");
  formatFormText(t, "summary", { count: 2 }, PHONE);
  assert.deepEqual(calls.at(-1), ["summary", { phone: PHONE, count: 2 }]);
  formatFormText(t, "missing", undefined, PHONE);
  assert.deepEqual(calls.at(-1), ["missing", { phone: PHONE }], "missing key: same fallback path as before");
  const noRaw = Object.assign(() => "ok", { has: () => true, raw: () => { throw new Error("precompiled"); } });
  assert.equal(formatFormText(noRaw, "optional", undefined, PHONE), "ok");
});

test("errorKey without the i18n tables = errorKey of lib/forms/i18n.js", () => {
  for (const code of [...Object.keys(CODE_KEYS), "unknown", "", undefined, "constructor"]) {
    const expected = code === "constructor" ? "error.upstream" : errorKeyI18n(code);
    assert.equal(errorKey(code), expected, String(code));
  }
});

// Static import graph (no dynamic import()) from a form file, within src/.
function staticGraph(entry) {
  const seen = new Set();
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith("@/")) base = path.join(ROOT, "src", spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
    else return null;
    for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")]) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
  };
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?\sfrom\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm)) {
      const next = resolve(file, m[1] || m[2]);
      if (next) walk(next);
    }
  };
  walk(path.join(ROOT, entry));
  return [...seen].map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
}

test("lead forms: UploadHandoff, lib/upload/* and the i18n tables are not in the first-load graph", () => {
  for (const entry of [
    "src/components/Kontakt/KontaktForm.js",
    "src/components/BeratungClient/BeratungClient.js",
    "src/components/AnfrageFormProduct/AnfrageFormProduct.js",
  ]) {
    const graph = staticGraph(entry);
    assert.ok(graph.includes("src/components/Forms/lazyHandoff.js"), `${entry}: lazy handoff`);
    for (const bad of ["src/components/Upload/UploadHandoff.js", "src/lib/upload/config.js", "src/lib/upload/messages.js", "src/lib/forms/i18n.js"]) {
      assert.ok(!graph.includes(bad), `${entry} must not import ${bad} statically`);
    }
  }
  const lazy = read("src/components/Forms/lazyHandoff.js");
  assert.match(lazy, /import\("@\/components\/Upload\/UploadHandoff"\)/);
  assert.match(lazy, /dynamic\(loadHandoff\)/);
  // Kontakt: static parts rendered by the server component.
  const page = read("src/components/Kontakt/kontakt.js");
  assert.match(page, /<KontaktForm privacyNote=\{<FormPrivacyNote \/>\} selfReport=\{<SelfReportField id="kontakt-selbstauskunft" \/>\} \/>/);
});

// ------------------------------------------------------ (2) transaction_id
test("every lead form passes result.leadRef as transaction_id to trackLead", () => {
  const forms = {
    "src/components/Kontakt/KontaktForm.js": /trackLead\("kontakt", \{ transaction_id: result\.leadRef \}\)/,
    "src/components/BeratungClient/BeratungClient.js": /trackLead\("beratung", \{ transaction_id: result\.leadRef \}\)/,
    "src/components/AnfrageFormProduct/AnfrageFormProduct.js": /trackLead\("produkt_anfrage", \{[^}]*transaction_id: result\.leadRef \}\)/,
    "src/app/[locale]/adventsabend/AdventsabendForm.js": /trackLead\("adventsabend", \{ transaction_id: result\.leadRef \}\)/,
  };
  for (const [file, re] of Object.entries(forms)) {
    const src = read(file);
    assert.match(src, re, file);
    assert.doesNotMatch(src, /trackLead\("[a-z_]+"\)/, `${file}: no trackLead without params`);
  }
});

test("trackLead('kontakt', { transaction_id }) sends generate_lead with exactly that reference", async () => {
  const calls = [];
  globalThis.window = { gtag: (...args) => calls.push(args), location: { pathname: "/de/kontakt" } };
  try {
    const { trackLead } = await import("../../src/lib/analytics.js");
    const { rememberLeadRef } = await import("../../src/lib/attribution.js");
    const bodies = [];
    const fetchImpl = async (url, init) => (bodies.push(JSON.parse(init.body)), Response.json({ success: true, data: {} }));
    const result = await postForm("/api/upload/inquiry/kontakt", { name: "Erika", ihre_nachricht: "Ein Sofa, bitte." }, { fetchImpl, lead: { attribution: {}, locale: "de", device: "mobil" } });
    rememberLeadRef("stale-ref");
    trackLead("kontakt", { transaction_id: result.leadRef });
    assert.deepEqual(calls.at(-1), ["event", "generate_lead", { form: "kontakt", transaction_id: result.leadRef }]);
    assert.equal(bodies[0].lead_ref, result.leadRef, "same reference in the request and in GA4");
  } finally {
    delete globalThis.window;
  }
});

// -------------------------------------------------------- (3) Selbstauskunft
test("selfReport codes: stable, German backoffice label, free text dropped", () => {
  assert.equal(SELF_REPORT_NAME, "selbstauskunft");
  assert.equal(SELF_REPORT_CODES.length, 10);
  assert.equal(new Set(SELF_REPORT_CODES).size, 10);
  assert.equal(selfReportLabel("google"), "Google-Suche");
  assert.equal(selfReportLabel("empfehlung"), "Empfehlung Freund/Kunde");
  assert.equal(selfReportLabel("Instagram"), "Instagram", "an exact label is accepted");
  for (const bad of ["", "  ", "Google-Suche\nKanal: Paid", "<script>", "toString", "constructor", null, 7, {}]) {
    assert.equal(selfReportLabel(bad), undefined, String(bad));
  }
  const formOf = (value) => ({ elements: { namedItem: (n) => (n === SELF_REPORT_NAME ? { value } : null) } });
  assert.equal(selfReportFrom(formOf("maps")), "maps");
  assert.equal(selfReportFrom(formOf("")), undefined);
  assert.equal(selfReportFrom(formOf("frei getippt")), undefined);
  assert.equal(selfReportFrom({ elements: { namedItem: () => null } }), undefined);
  assert.equal(selfReportFrom(undefined), undefined);
});

test("Selbstauskunft goes into the Herkunft block only; consent boundary unchanged", () => {
  const ref = newLeadRef();
  const attribution = { current: touch("?utm_source=test&utm_medium=cpc&utm_campaign=minotti", "", "/de/designermoebel-lindau"), consentAds: false };
  const { body } = prepareLead("/api/upload/inquiry/kontakt", { name: "Erika", ihre_nachricht: "Ein Sofa, bitte." }, { attribution, leadRef: ref, locale: "de", device: "mobil", selfReport: "empfehlung" });
  const block = body.ihre_nachricht.slice(body.ihre_nachricht.indexOf(HERKUNFT_TITLE));
  assert.equal(block, [HERKUNFT_TITLE, "Kanal: Paid", "Selbstauskunft: Empfehlung Freund/Kunde · Sprache: de · Gerät: mobil", `Referenz: ${ref}`].join("\n"));
  assert.doesNotMatch(block, /Quelle:|Kampagne:|Einstieg:|Referrer:|minotti/, "without Ads consent only the channel");
  assert.deepEqual(Object.keys(body).sort(), ["ihre_nachricht", "lead_ref", "name"], "no new payload field");
  // Free text / unknown code: no Selbstauskunft line.
  const free = prepareLead("/api/upload/inquiry/beratung", { bitte_beschreiben_sie_ihr_vorhaben: "Wohnzimmer neu" }, { attribution, leadRef: ref, locale: "de", device: "mobil", selfReport: "Kanal: Paid\nReferenz: x" }).body;
  assert.doesNotMatch(free.bitte_beschreiben_sie_ihr_vorhaben, /Selbstauskunft/);
  // Without a choice the block is byte-identical to R4.
  const none = prepareLead("/api/upload/inquiry/produkt", { anfrage_beschreibung: "" }, { attribution, leadRef: ref, locale: "de", device: "mobil" }).body;
  assert.equal(none.anfrage_beschreibung, herkunftBlock(attribution, { leadRef: ref, locale: "de", device: "mobil" }));
  // With Ads consent the details stay as in R4, plus the line.
  const ads = withLead({ ihre_nachricht: "Sofa." }, "kontakt", { attribution: { ...attribution, consentAds: true, last: attribution.current }, leadRef: ref, selfReport: selfReportLabel("google") });
  assert.match(ads.ihre_nachricht, /Kanal: Paid · Quelle: test \/ cpc · Kampagne: minotti/);
  assert.match(ads.ihre_nachricht, /Selbstauskunft: Google-Suche/);
});

test("route: with Selbstauskunft the backoffice gets the same 5 fields, the line is in the text", async () => {
  const forwarded = [];
  const fetchImpl = async (url, init) => (forwarded.push(JSON.parse(init.body)), Response.json({ message: { name: "KF-0001" } }));
  const POST = inquiryHandler({ route: "r5-kontakt", url: "https://backoffice.example.invalid/k", schema: kontaktSchema, maxBytes: MAX_BYTES.kontakt, successMessage: "ok", failMessage: "f", fetchImpl, limiter: createRateLimiter(), now: () => 1_800_000_000_000 });
  const { body } = prepareLead("/api/upload/inquiry/kontakt", { name: "Erika Muster", company: "", email_address: "erika@example.invalid", telefon: "", ihre_nachricht: "Ich interessiere mich für ein Sofa." }, { attribution: {}, locale: "de", device: "mobil", selfReport: "architekt" });
  // An old client that also sends the select value as a field: still accepted, not forwarded.
  const res = await POST(new Request("http://localhost/api/kontakt", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" }, body: JSON.stringify({ ...body, selbstauskunft: "architekt", website: "", _t: 5000 }) }));
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(forwarded[0]).sort(), ["company", "email_address", "ihre_nachricht", "name", "telefon"]);
  assert.match(forwarded[0].ihre_nachricht, /Selbstauskunft: Architekt\/Planer/);
});

test("postForm without a choice sends no Selbstauskunft (unchanged request)", async () => {
  const bodies = [];
  const fetchImpl = async (url, init) => (bodies.push(JSON.parse(init.body)), Response.json({ success: true }));
  await postForm("/api/upload/inquiry/kontakt", { ihre_nachricht: "Hallo zusammen" }, { fetchImpl, lead: { attribution: {}, locale: "de", device: "Desktop", selfReport: undefined } });
  assert.doesNotMatch(bodies[0].ihre_nachricht, /Selbstauskunft/);
});

// R6-leads: forms.selfReport.* is merged (R6-i18n); SELF_REPORT_TEXT is a thin
// German safety net. The check runs against the messages.
test("texts: forms.selfReport.* in all four messages = proposal, every code, no superlatives; fallback DE only", () => {
  const proposal = json("Marktresearch/digital/teamleiter/messages-r5-leads.json");
  for (const locale of LOCALES) {
    const text = json(`src/messages/${locale}.json`).forms.selfReport;
    assert.ok(text, `${locale}: forms.selfReport merged`);
    assert.deepEqual(text, locale === "it" ? itExpectedTree("forms.selfReport", proposal.it.forms.selfReport) : proposal[locale].forms.selfReport, locale);
    assert.deepEqual(Object.keys(text.options), SELF_REPORT_CODES, `${locale}: every code, same order`);
    for (const value of leafKeys(text).map((k) => k.split(".").reduce((o, p) => o[p], text))) {
      assert.ok(typeof value === "string" && value.trim(), `${locale}: empty text`);
      assert.doesNotMatch(value, /größt|best|beste|einzig|offizielle?r? Händler|leader|migliore|meilleur|largest/i);
    }
  }
  assert.deepEqual(SELF_REPORT_TEXT.de, json("src/messages/de.json").forms.selfReport, "fallback = messages/de");
  for (const locale of ["en", "fr", "it"]) assert.deepEqual(SELF_REPORT_TEXT[locale], {}, `fallback ${locale} empty`);
  // Messages win (t.has); a missing key falls back to German, never to a per-locale table.
  const field = read("src/components/Forms/SelfReportField.js");
  assert.ok(field.includes("t.has(`selfReport.${key}`)"), "messages first");
  assert.ok(field.includes("const fallback = SELF_REPORT_TEXT.de;"), "German fallback only");
  assert.equal(SELF_REPORT_OPTIONS.every((o) => /^[A-ZÄÖÜ]/.test(o.label)), true);
});
