// tests/unit/r8-leads-context.test.mjs — Fix-Runde 3, Team P3 (leads, Kontext,
// Navigation): Wizard-Kontext für alle ?thema=-Werte, stimmige Bestätigung,
// Kopf von /beratung, Kontext aus Werkzeugen/Produktseiten/Dreiländer-Rechner,
// gemeinsamer Origin-Helfer, Menü ohne noindex-Seiten.
// Run: node --test tests/unit/r8-leads-context.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STEP1_KEYS,
  STEP2_KEYS,
  TOPIC_PLACE,
  VALUE_BANDS,
  beratungContext,
  contextForPath,
  headerTopic,
  optionKey,
  optionLabel,
  topicSummary,
  valueBand,
  withContext,
} from "../../src/lib/forms/beratungContext.js";
import { isSameOriginRequest } from "../../src/lib/forms/origin.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LOCALES = ["de", "en", "fr", "it"];
const MSG = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages", `${l}.json`), "utf8"))]));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Every ?thema= value the pages link with → expected step 1 / step 2 / header.
const THEMEN = {
  neubau: ["neubau", null, null],
  renovierung: ["renovierung", null, null],
  kueche: ["kueche", null, "kueche"],
  kuechen: ["kueche", null, "kueche"],
  sofa: ["sofa", null, "sofa"],
  ezarri: ["ezarri", null, "ezarri"],
  mosaik: ["ezarri", null, "ezarri"],
  glasmosaik: ["ezarri", null, "ezarri"],
  outdoor: ["outdoor", null, "outdoor"],
  garten: ["outdoor", null, "outdoor"],
  terrasse: ["outdoor", null, "outdoor"],
  yacht: ["yacht", "yacht", "yacht"],
  boot: ["yacht", "yacht", "yacht"],
  hotel: ["objekt", "hotel", "objekt"],
  objekt: ["objekt", "hotel", "objekt"],
  gastronomie: ["objekt", "hotel", "objekt"],
  architekt: ["architektur", null, "architekt"],
  architektin: ["architektur", null, "architekt"],
};

test("Schritt 1: neue Optionen Yacht, Objekt/Hotel, Architektur in allen Sprachen, alte Positionen bleiben", () => {
  assert.deepEqual(STEP1_KEYS.slice(-4), ["yacht", "objekt", "architektur", "anderes"]);
  for (const l of LOCALES) {
    const f = MSG[l].MultiStepForm;
    assert.equal(f.step1Options.length, STEP1_KEYS.length, l);
    assert.equal(new Set(f.step1Options).size, f.step1Options.length, `${l}: Labels eindeutig`);
    for (const k of ["yacht", "objekt", "architektur"]) assert.ok(optionLabel(STEP1_KEYS, f.step1Options, k), `${l} ${k}`);
  }
  const de = MSG.de.MultiStepForm.step1Options;
  assert.equal(de[0], "einen Neubau");
  assert.equal(de.at(-1), "Anderes");
  assert.match(optionLabel(STEP1_KEYS, de, "yacht"), /Yacht-Interieur/);
  assert.match(optionLabel(STEP1_KEYS, de, "objekt"), /Objekt oder Hotel/);
  assert.match(optionLabel(STEP1_KEYS, de, "architektur"), /Architektur- oder Planungsbüro/);
  // Neutral: keine Referenzen, Namen oder Superlative in den neuen Labels.
  for (const l of LOCALES) for (const v of MSG[l].MultiStepForm.step1Options) assert.doesNotMatch(v, /Referenz|reference|Minotti|Custom Line|best|beste|migliore|meilleur/i, `${l}: ${v}`);
});

test("?thema=: jeder Wert belegt Schritt 1 (und ggf. Schritt 2) vor und passt zum Seitenkopf", () => {
  for (const [thema, [s1, s2, head]] of Object.entries(THEMEN)) {
    const ctx = beratungContext(new URLSearchParams({ thema }));
    assert.equal(ctx.step1, s1, `${thema} step1`);
    assert.equal(ctx.step2, s2, `${thema} step2`);
    assert.equal(headerTopic(ctx), head, `${thema} header`);
    assert.ok(STEP1_KEYS.includes(ctx.step1), thema);
    if (ctx.step2) assert.ok(STEP2_KEYS.includes(ctx.step2), thema);
    // Every context line has its text in all four languages.
    for (const line of ctx.lines) for (const l of LOCALES) assert.ok(MSG[l].MultiStepForm.context[line.key], `${l}: context.${line.key}`);
  }
  // ?rolle=architekt → Architektur. Runde 5 (P3, ux P1-3, bewusst geänderte
  // Erwartung): die Rolle gewinnt auch gegen ?thema=objekt, Schritt 2 bleibt offen
  // (vorher: „Objekt oder Hotel“ + „Hotel/Gastronomie“ – falsch klassifiziert).
  assert.equal(beratungContext({ rolle: "architekt" }).step1, "architektur");
  assert.equal(beratungContext({ thema: "objekt", rolle: "architekt" }).step1, "architektur");
  assert.equal(beratungContext({ thema: "objekt", rolle: "architekt" }).step2, null);
  assert.equal(headerTopic(beratungContext({})), null);
});

test("Bestätigung: Thema und Ort stimmig, nie „einen Neubau · Ort: Yacht“", () => {
  for (const l of LOCALES) {
    const f = MSG[l].MultiStepForm;
    const label1 = (k) => optionLabel(STEP1_KEYS, f.step1Options, k);
    const label2 = (k) => optionLabel(STEP2_KEYS, f.step2Options, k);
    for (const thema of Object.keys(THEMEN)) {
      const ctx = beratungContext({ thema });
      const s = topicSummary({ topic: label1(ctx.step1), place: label2(ctx.step2), topicKey: ctx.step1, placeKey: ctx.step2 });
      assert.ok(s, `${l} ${thema}`);
      if (ctx.step1 !== "neubau") assert.doesNotMatch(s, new RegExp(label1("neubau")), `${l} ${thema}: ${s}`);
      // A place the topic implies is not repeated.
      if (TOPIC_PLACE[ctx.step1]) assert.equal(s, label1(ctx.step1), `${l} ${thema}`);
    }
    assert.equal(optionKey(STEP1_KEYS, f.step1Options, label1("yacht")), "yacht");
    assert.equal(optionKey(STEP2_KEYS, f.step2Options, label2("hotel")), "hotel");
  }
  assert.equal(topicSummary({ topic: "eine Küche", place: "in einer Wohnung", topicKey: "kueche", placeKey: "wohnung" }), "eine Küche in einer Wohnung");
  assert.equal(topicSummary({ topic: "Anderes", place: "in einer Wohnung" }), "Anderes · in einer Wohnung");
  assert.equal(topicSummary({ topic: "ein Yacht-Interieur", place: "in einer Wohnung", topicKey: "yacht", placeKey: "wohnung" }), "ein Yacht-Interieur in einer Wohnung");
  // The client uses the one-line summary, no separate "Ort" row any more.
  const src = read("src/components/BeratungClient/BeratungClient.js");
  assert.match(src, /topicSummary\(/);
  assert.doesNotMatch(src, /confirmation\.place/);
});

test("/beratung: Kopf (Titel, Lead, Bildtext) je Kontext in allen Sprachen; KI-Bild gekennzeichnet", () => {
  for (const l of LOCALES) {
    const c = MSG[l].inhalt.beratung.context;
    for (const k of ["yacht", "objekt", "architekt", "kueche", "sofa", "ezarri", "outdoor"]) {
      assert.ok(c[k]?.title && c[k].title.length <= 60, `${l} ${k}.title`);
      assert.ok(c[k]?.lead, `${l} ${k}.lead`);
    }
    for (const k of ["kueche", "sofa", "ezarri", "outdoor", "yacht"]) assert.ok(c.alt[k], `${l} alt.${k}`);
    assert.ok(c.imageSource, l);
  }
  const head = read("src/components/Beratung/advice.js");
  assert.match(head, /yacht: \{ src: "\/labs\/yacht\/[^"]+", ai: true \}/);
  assert.match(head, /picture\?\.ai && <KiLabel/);
  // No Minotti / Custom-Line yacht photos (no written permission yet).
  assert.doesNotMatch(head, /navetta|minotti|custom-line/i);
  const page = read("src/app/[locale]/beratung/page.js");
  assert.match(page, /topic=\{headerTopic\(context\)\}/);
  // Rat 9,5 (bewusst erweitert): Ideenboard-Zähler (B2) und Vertrauensblock (B6) als weitere Props.
  assert.match(page, /<BeratungForm context=\{context\}[^>]*\/>/);
});

test("Kontext erhalten: Werkzeuge, Produktseiten, Yacht-Schluss-CTA, Dreiländer-Rechner, Band vor dem Footer", () => {
  const href = (p) => withContext("/beratung", contextForPath(p));
  assert.equal(href("/sofaplaner"), "/beratung?thema=sofa&planer=sofaplaner");
  assert.equal(href("/3d-ansicht"), "/beratung?planer=3d");
  assert.equal(href("/stil-finder"), "/beratung?planer=stil-finder");
  assert.equal(href("/bodensee-licht"), "/beratung?planer=bodensee-licht");
  // Product pages: the slug is an id; the header reads the name from the H1.
  assert.deepEqual(contextForPath("/produkte/lamps/lamps-2097-18"), { produktSeite: true });
  assert.equal(href("/produkte/lamps/lamps-2097-18"), "/beratung");
  assert.equal(withContext("/beratung", { ...contextForPath("/produkte/a/b"), produkt: "Flos Arco" }), "/beratung?produkt=Flos+Arco");
  assert.match(read("src/components/Navbar/HeaderCta.js"), /produktSeite/);
  // The planner lines resolve in the wizard.
  assert.deepEqual(beratungContext({ planer: "bodensee-licht" }).lines, [{ key: "bodenseeLicht" }]);
  // Dreiländer-Rechner: country + value band only, no amount, nothing personal.
  assert.equal(valueBand(25000), "15000-50000");
  assert.equal(valueBand(4999), "bis-5000");
  assert.equal(valueBand(50000), "ab-50000");
  assert.equal(valueBand(-1), null);
  const url = withContext("/beratung", { planer: "dreilaender", land: "CH", wert: valueBand(25000) });
  assert.equal(url, "/beratung?planer=dreilaender&land=CH&wert=15000-50000");
  const ctx = beratungContext(new URLSearchParams(url.split("?")[1]));
  assert.deepEqual(ctx.lines, [{ key: "dreilaenderResult", vars: { land: "CH", wert: "15000-50000" } }]);
  assert.deepEqual(beratungContext({ land: "XX", wert: "123" }).lines, []);
  for (const l of LOCALES) {
    const c = MSG[l].MultiStepForm.context;
    for (const code of ["CH", "FL", "DE", "AT"]) assert.ok(c.lands[code], `${l} lands.${code}`);
    for (const b of VALUE_BANDS) assert.ok(c.values[b], `${l} values.${b}`);
    assert.match(c.dreilaenderResult, /\{land\}.*\{wert\}/s);
  }
  const calc = read("src/components/Labs/Dreilaender/PriceCalculator.js");
  assert.match(calc, /withContext\("\/beratung", \{ planer: "dreilaender", land: country, wert: result \? valueBand\(amount\) : null \}\)/);
  assert.doesNotMatch(calc, /uppercase tracking-wide text-ink transition-colors hover:bg-\[#bfa047\]/, "keine eigenen Gold-Knöpfe");
  for (const f of ["src/components/Labs/Dreilaender/DreilaenderClient.js", "src/app/[locale]/dreilaender-rechner/page.js"]) {
    assert.doesNotMatch(read(f), /rounded-\[3px\] bg-gold/, f);
  }
  // Yacht: closing CTA with ?thema=yacht, one CTA wording.
  // Rat 9,5 B1 (bewusst geändert): Ziel und Wort kommen aus dem zentralen Terminhelfer
  // (landingTermin → terminHref/terminLabel), das Thema yacht läuft weiter mit.
  const yacht = read("src/components/Yacht/YachtPage.js");
  assert.match(yacht, /const termin = landingTermin\(\{ thema: "yacht" \}, locale\)/);
  assert.match(yacht, /appointmentHref=\{termin\.href\}/);
  assert.match(read("src/app/[locale]/yacht-interior/page.js"), /primaryLabel: "Termin anfragen"/);
  // Interface for the footer band (P5): same context as header and bar.
  assert.match(read("src/components/Navbar/HeaderCta.js"), /export function TerminLink\(\{ href, children, \.\.\.buttonProps \}\)/);
});

test("Origin: ein gemeinsamer Helfer für die Routen, 403 bleibt", () => {
  const req = (h) => ({ headers: new Headers(h), url: "http://localhost:3000/api/x" });
  const env = {};
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }), { env }), true);
  // Behind a proxy that rewrites Host: X-Forwarded-Host counts (technik P2 Nr. 11).
  assert.equal(isSameOriginRequest(req({ host: "127.0.0.1:3000", "x-forwarded-host": "platzhirsch.studio", origin: "https://platzhirsch.studio" }), { env }), true);
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000", origin: "https://evil.example" }), { env }), false);
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000", "sec-fetch-site": "cross-site" }), { env }), false);
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000" }), { env }), true);
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000" }), { env, requireOrigin: true }), false);
  assert.equal(isSameOriginRequest(req({ host: "localhost:3000", "sec-fetch-site": "same-origin" }), { env, requireOrigin: true }), true);
  const routes = [
    "src/app/api/agent/confirm/route.js",
    "src/app/api/labs/concierge/route.js",
    "src/app/api/labs/concierge/consent/route.js",
    "src/app/api/labs/kuechenplaner/plan/route.js",
    "src/app/api/labs/stilfinder/moodboard/route.js",
    "src/app/api/upload/session/route.js",
    "src/app/api/ezarri/anfrage/handler.js",
  ];
  for (const r of routes) {
    const src = read(r);
    assert.match(src, /isSameOriginRequest/, r);
    assert.doesNotMatch(src, /function sameOrigin\(/, `${r}: keine eigene Kopie`);
    assert.match(src, /403/, `${r}: 403 bleibt`);
  }
});

// R4 ux P1-3 (bewusst geändert, Inhaber-Entscheidung Nr. 9 „alle Features fest
// im Menü“): Outdoor-Gartenplanung und Handy-Upload sind wieder Menüpunkte (über
// ihre Feature-Schalter); nur der Showroom-Rundgang ohne Aufnahme bleibt draußen.
test("Menü: kein Showroom-Rundgang, Outdoor und Upload über ihre Schalter", async () => {
  const src = read("src/components/Navbar/shellNav.js");
  assert.doesNotMatch(src, /href: "\/outdoor-gartenplanung"/, "nicht hart verdrahtet, sondern featLink");
  assert.match(src, /featLink\("outdoor"/);
  assert.doesNotMatch(src, /featLink\("showroom"/);
  assert.match(src, /featLink\("upload"\)/);
});
