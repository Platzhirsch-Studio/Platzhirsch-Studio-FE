// tests/unit/winterlager.test.mjs — Service 3 „Winterlager und Pflege für
// Outdoor-Möbel“ (/[locale]/outdoor-winterservice) plus die Querschnitts-
// Nachbesserungen der Service-QA vom 29.10.2026 (GA-Maskierung geheimer
// Links, Rate-Limit-Schlüssel der Wunschliste, Tagebuch-Gates).
// Run: node --test tests/unit/winterlager.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");

// Next.js-Importe ("server-only", "@/…", ohne Endung) für Node (wie r4-recht.test.mjs).
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server" || specifier === "next/headers") return next(`${specifier}.js`, context);
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/"));
    if (fromSrc && !/\.[cm]?js$/.test(spec)) {
      const url = new URL(spec, context.parentURL);
      for (const ext of [".js", "/index.js"]) {
        const candidate = fileURLToPath(url) + ext;
        if (fs.existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(spec, context);
  },
});

const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
let CFG, COPY, FORM, VIEW, SCHEMA, GT, TB, BERATUNG, LEAD;
before(async () => {
  CFG = await imp("lib/service/winterlager/config.js");
  COPY = await imp("lib/service/winterlager/copy.js");
  FORM = await imp("lib/service/winterlager/form.js");
  VIEW = await imp("lib/service/winterlager/view.js");
  SCHEMA = await imp("lib/service/winterlager/schema.js");
  GT = await imp("components/Cookies/googleTag.js");
  TB = await imp("lib/portal/tagebuch/config.js");
  BERATUNG = (await imp("lib/forms/schemas.js")).beratungSchema;
  LEAD = await imp("lib/forms/leadPayload.js");
});

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("Konfiguration: nur Inhaber-Fakten gesetzt, offene Werte leer (nichts erfunden)", () => {
  const c = CFG.WINTERLAGER_CONFIG;
  assert.equal(c.eigenesLager, true);
  assert.equal(c.abholungDurchUns, true);
  assert.equal(c.radiusKm, null, "kein Radius in km ohne Freigabe");
  assert.equal(c.anmeldeschluss, "");
  for (const v of ["einmal", "abo"]) assert.deepEqual(c.preise[v], { de: "", en: "" }, `Preis ${v} leer`);
  assert.deepEqual(c.versicherung, { de: "", en: "" });
  assert.equal(c.abo.bedingungenPfad, "");
  assert.equal(c.indexieren, false);
});

test("Seite zeigt nur belegte Zeilen, Preise „auf Anfrage“", () => {
  const facts = VIEW.factRows("de").map((r) => r.key);
  assert.deepEqual(facts, ["abholung", "gebiet", "lager", "preis"]);
  assert.equal(VIEW.factRows("de").find((r) => r.key === "preis").value, "Auf Anfrage");
  assert.match(VIEW.factRows("de").find((r) => r.key === "gebiet").value, /auf Anfrage/);
  assert.deepEqual(VIEW.optionRows("abo", "de"), [{ key: "preis", label: "Preis", value: "Auf Anfrage" }]);
  assert.deepEqual(VIEW.optionRows("einmal", "en"), [{ key: "preis", label: "Price", value: "On request" }]);
  assert.equal(VIEW.termsPath(), null);
  // Mit gesetzten Werten erscheinen die Zeilen
  const filled = { ...CFG.WINTERLAGER_CONFIG, radiusKm: 40, anmeldeschluss: "2026-11-15", versicherung: { de: "Inhaltsversicherung", en: "" }, abo: { laufzeit: { de: "1 Saison", en: "" }, kuendigung: { de: "", en: "" }, bedingungenPfad: "/abo-bedingungen" } };
  assert.deepEqual(VIEW.factRows("de", filled).map((r) => r.key), ["abholung", "gebiet", "lager", "preis", "schluss"]);
  assert.match(VIEW.factRows("de", filled)[1].value, /40 km/);
  assert.deepEqual(VIEW.optionRows("abo", "de", filled).map((r) => r.key), ["preis", "laufzeit", "versicherung"]);
  assert.deepEqual(VIEW.optionRows("abo", "en", filled).map((r) => r.key), ["preis"], "EN fällt nicht auf DE zurück");
  assert.equal(VIEW.termsPath(filled), "/abo-bedingungen");
});

test("Ablauf: Reparatur und Aufbau nur mit Inhaber-Bestätigung, Zeiträume nur wenn gesetzt", () => {
  assert.equal(VIEW.visibleSteps("de").length, 7);
  const ohne = VIEW.visibleSteps("de", { ...CFG.WINTERLAGER_CONFIG, kleinreparaturAufAnfrage: false, aufbauAufWunsch: false });
  assert.deepEqual(ohne.map((s) => s.key), ["anmeldung", "abholung", "pflege", "lager", "rueckgabe"]);
  assert.ok(VIEW.visibleSteps("de").every((s) => s.extra.length === 0));
  const mit = VIEW.visibleSteps("de", { ...CFG.WINTERLAGER_CONFIG, abholzeitraum: { de: "Oktober bis November", en: "" }, anmeldeschluss: "2026-11-15" });
  assert.deepEqual(mit.find((s) => s.key === "abholung").extra, ["Abholzeitraum: Oktober bis November."]);
  assert.deepEqual(mit.find((s) => s.key === "anmeldung").extra, ["Anmeldung bis 15. November 2026."]);
});

test("Countdown nur mit Stichtag; Zustände", () => {
  assert.equal(VIEW.deadlineState("2026-10-29", "de"), null);
  const cfg = { ...CFG.WINTERLAGER_CONFIG, anmeldeschluss: "2026-11-15" };
  assert.equal(VIEW.deadlineState("2026-10-29", "de", cfg).text, "noch 17 Tage bis zum Anmeldeschluss am 15. November 2026");
  assert.equal(VIEW.deadlineState("2026-11-14", "de", cfg).kind, "oneDay");
  assert.equal(VIEW.deadlineState("2026-11-15", "en", cfg).text, "Today is the registration deadline (15 November 2026)");
  assert.equal(VIEW.deadlineState("2026-11-20", "de", cfg).kind, "over");
  assert.equal(CFG.parseDeadline("2026-02-30"), null);
  assert.match(VIEW.todayInLochau(new Date("2026-10-29T23:30:00Z")), /^2026-10-30$/, "Europe/Vienna");
});

const filledForm = () => ({
  ...FORM.initialValues(),
  variant: "abo",
  rows: [
    { id: "a", type: "stuhl", count: "6", material: "teak", note: "Gloster" },
    { id: "b", type: "", count: "1", material: "", note: "" },
  ],
  aufbau: true,
  street: "Landstraße 1",
  zip: "6911",
  city: "Lochau",
  vorname: "Eva",
  nachname: "Muster",
  email: "eva@example.org",
});

test("Formular: Pflichtfelder, leere Zusatzzeilen ignoriert, Fehler-IDs = Feld-IDs", () => {
  const leer = FORM.validate(FORM.initialValues(), "de");
  for (const id of ["wl-variant", "wl-row-0-type", "wl-zip", "wl-city", "wl-vorname", "wl-nachname", "wl-email"]) assert.ok(leer[id], id);
  assert.deepEqual(FORM.validate(filledForm(), "de"), {});
  const bad = FORM.validate({ ...filledForm(), rows: [{ id: "x", type: "stuhl", count: "0", material: "teak", note: "" }], telefon: "abc" }, "en");
  assert.match(bad["wl-row-0-count"], /between 1 and 99/);
  assert.ok(bad["wl-telefon"]);
  for (const id of Object.keys(leer)) assert.ok(FORM.fieldOrder(FORM.initialValues()).includes(id), `Reihenfolge kennt ${id}`);
});

test("Payload passt zum beratungSchema, Backoffice-Text deutsch und maschinenlesbar", () => {
  const p = FORM.buildPayload(filledForm());
  const r = BERATUNG.safeParse(p);
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.equal(p.bei_meiner_anfrage_geht_es_um, "Outdoor-Winterlager & Pflege");
  // Abnahme Service A1: Feld trägt den Zeitraum, der Abholort steht in „Adresse:“ der Beschreibung
  assert.equal(p.das_projekt_soll_verwirklicht_werden, "Zeitraum: Abholung Flexibel, Rückbringung Flexibel");
  assert.equal(FORM.buildPayload({ ...filledForm(), pickup: "oktober", back: "april" }).das_projekt_soll_verwirklicht_werden, "Zeitraum: Abholung Oktober, Rückbringung April");
  assert.doesNotMatch(p.das_projekt_soll_verwirklicht_werden, /Abholort|6911/);
  const parsed = FORM.parseDescription(p.bitte_beschreiben_sie_ihr_vorhaben);
  assert.equal(parsed.isWinterlager, true);
  assert.equal(parsed.fields.Variante, "Im Abo, jedes Jahr");
  assert.deepEqual(parsed.positions, [{ count: 6, text: "Stuhl · Teak · Gloster" }]);
  assert.equal(parsed.fields["Zusätzlich"], "Im Frühling wieder aufbauen");
  assert.ok(parsed.fields.Adresse.endsWith("6911 Lochau (AT)"), "Abholort in der Adresszeile");
  // Abnahme Service A1: Herkunftszeile ohne Doppelung („Kontext: Lead-Kontext: …“), Muster wie Pflege
  assert.equal(FORM.PAGE_CONTEXT, "Outdoor-Winterlager (winterlager)");
  const block = LEAD.herkunftBlock({}, { pageContext: FORM.PAGE_CONTEXT, leadRef: "PH-TEST" });
  assert.ok(block.split("\n").includes("Kontext: Outdoor-Winterlager (winterlager)"), block);
  assert.doesNotMatch(block, /Kontext: .*Kontext/);
});

test("Texte: DE/EN gleiche Schlüssel, keine Superlative, keine Preise, keine unbelegten Zusagen", () => {
  const keys = (o, pre = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${pre}${k}.`) : [`${pre}${k}`]));
  const { de, en } = COPY.COPY;
  assert.deepEqual(keys(en).sort(), keys(de).sort());
  const all = JSON.stringify(COPY.COPY);
  assert.ok(!all.includes("!"), "keine Ausrufezeichen");
  assert.ok(!/(größte|beste|einzig|exklusiv|Luxus|perfekt|largest|best |exclusive|perfect|unique)/i.test(all), "keine Superlative");
  assert.ok(!/€\s?\d|\d\s?€/.test(all), "keine Preise");
  for (const bad of ["getrennt nach Auftrag", "gekennzeichnet", "vorgemerkt", "kept separate", "labelled", "is reserved", "nicht daran denken", "think about it", "Paola Lenti"]) {
    assert.ok(!all.includes(bad), `unbelegt: ${bad}`);
  }
  for (const key of COPY.MATERIAL_KEYS) assert.match(COPY.SOURCES[key], /^https:\/\/www\.gloster\.com\//, `Quelle ${key}`);
});

test("Messages-Vorlage entspricht copy.js", () => {
  const json = JSON.parse(read("Marktresearch/digital/features/service-winterlager-messages.json"));
  const p = COPY.messagesProposal();
  for (const l of ["de", "en"]) assert.deepEqual(json[l].serviceWinterlager, p[l].serviceWinterlager, l);
});

test("Seite: DE/EN, noindex, hreflang, JSON-LD ohne Preis, kein Bild im Auftakt", () => {
  assert.deepEqual(SCHEMA.languages(), {
    de: "https://platzhirsch.studio/de/outdoor-winterservice",
    en: "https://platzhirsch.studio/en/outdoor-winterservice",
    "x-default": "https://platzhirsch.studio/de/outdoor-winterservice",
  });
  const ld = JSON.stringify(SCHEMA.winterlagerSchema("en"));
  assert.ok(!/offers|price|aggregateRating|review/i.test(ld));
  assert.match(ld, /"@type":"Service"/);
  assert.equal(SCHEMA.crumbs("en").length, 2, "EN ohne DE-only-Outdoor-Seite");
  const page = read("src/app/[locale]/outdoor-winterservice/page.js");
  assert.match(page, /WINTERLAGER_CONFIG\.indexieren \? \{ index: true/);
  const comp = read("src/components/Service/Winterlager/WinterlagerPage.js");
  assert.ok(!/<Image|next\/image|<img/.test(comp), "kein Foto ohne Freigabe");
});

test("GA: geheime Links werden maskiert (QA Technik P1-1)", () => {
  const m = GT.maskLocation;
  assert.equal(m("https://platzhirsch.studio/de/wunschliste/AbC_123-xyz?x=1#k"), "https://platzhirsch.studio/de/wunschliste/:id");
  assert.equal(m("https://platzhirsch.studio/en/upload/tok"), "https://platzhirsch.studio/en/upload/:id");
  assert.equal(m("https://platzhirsch.studio/de/ideenboard/s1"), "https://platzhirsch.studio/de/ideenboard/:id");
  assert.equal(m("https://platzhirsch.studio/de/zahlung/anzahlung/t"), "https://platzhirsch.studio/de/zahlung/anzahlung/:id");
  assert.equal(m("https://platzhirsch.studio/de/wunschliste/verwalten#geheim"), "https://platzhirsch.studio/de/wunschliste/verwalten");
  assert.equal(m("https://platzhirsch.studio/de/produkte?a=1#x"), "https://platzhirsch.studio/de/produkte?a=1");
  assert.equal(m(""), "");
  assert.equal(m("kein url"), "");
});

test("Wunschliste: Rate-Limit-Schlüssel je Besucher auch ohne vertrauenswürdigen Header (QA Technik P1-4)", async () => {
  delete process.env.UPLOAD_TRUSTED_IP_HEADER;
  const { visitorKey } = await imp("lib/wunschliste/http.js");
  const req = (h) => ({ headers: new Headers(h) });
  assert.equal(visitorKey(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" })), "fb:2.2.2.2", "letzter Eintrag (vom Proxy)");
  assert.notEqual(visitorKey(req({ "x-forwarded-for": "3.3.3.3" })), visitorKey(req({ "x-forwarded-for": "4.4.4.4" })));
  assert.equal(visitorKey(req({})), "fb:anon");
  process.env.UPLOAD_TRUSTED_IP_HEADER = "x-real-ip";
  assert.equal(visitorKey(req({ "x-real-ip": "5.5.5.5" })), "5.5.5.5");
  delete process.env.UPLOAD_TRUSTED_IP_HEADER;
});

test("Portal: Team-Login-Limit nicht über den ersten X-Forwarded-For-Eintrag umgehbar (QA Technik P2-2)", async () => {
  const { clientIp } = await imp("lib/portal/http.js");
  const req = (h) => ({ headers: new Headers(h) });
  assert.equal(clientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7" })), "7.7.7.7");
  assert.equal(clientIp(req({})), "local");
});

test("Tagebuch: Skizze/Modell nie als Referenz, Vorschau nie mit echtem Speicher, Gate ohne Speicher/DSE", () => {
  assert.ok(!TB.REFERENZ_PHASEN.includes("skizze") && !TB.REFERENZ_PHASEN.includes("modell"));
  assert.equal(TB.referenzTauglich({ phase: "skizze" }), false);
  assert.equal(TB.referenzTauglich({ phase: "nachher" }), true);
  assert.equal(TB.referenzFreigabeAktiv({ NODE_ENV: "production", TAGEBUCH_PREVIEW: "1", TAGEBUCH_ADAPTER: "frappe" }), false);
  assert.equal(TB.referenzFreigabeAktiv({ NODE_ENV: "production", TAGEBUCH_PREVIEW: "1", PORTAL_ADAPTER: "frappe" }), false);
  assert.equal(TB.referenzFreigabeAktiv({ NODE_ENV: "production", TAGEBUCH_PREVIEW: "1", TAGEBUCH_ADAPTER: "datei" }), true);
  assert.equal(TB.referenzFreigabeAktiv({ NODE_ENV: "production" }), false);
  assert.equal(TB.tagebuchVerfuegbar({ verbunden: false }, { NODE_ENV: "development" }), false);
  assert.equal(TB.tagebuchVerfuegbar({ verbunden: true }, { NODE_ENV: "development" }), true);
  assert.equal(TB.tagebuchVerfuegbar({ verbunden: true }, { NODE_ENV: "production" }), false, "Produktion erst mit DSE");
  assert.equal(TB.tagebuchVerfuegbar({ verbunden: true }, { NODE_ENV: "production" }, "freigegeben"), true);
  assert.ok(TB.EINWILLIGUNG.absaetze.some((a) => /Handzeichnungen und Modellfotos/.test(a)));
  const page = read("src/app/[locale]/portal/projekte/[id]/page.js");
  assert.match(page, /tagebuchVerfuegbar\(tagebuchAdapter\(\)\) &&/, "Link nur mit verbundenem Speicher");
});
