// tests/unit/r5-content-facts.test.mjs — R5-content: Faktencheck
// (tools/content/check-facts.mjs, lib.mjs, build-facts.mjs).
// Run from the repo root: node --test tests/unit/r5-content-facts.test.mjs
// No network. Reads the real facts.json and texts only to prove the tool runs
// on them; every assertion about matching uses local fixtures.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyIgnore,
  checkUnit,
  compileFacts,
  compileIgnore,
  extractTokens,
  hasInlineCitation,
  scanJsonStrings,
  stripNonFacts,
} from "../../tools/content/lib.mjs";
import { buildFacts, faktenOf, productKeyFromUrl, readInputs } from "../../tools/content/build-facts.mjs";
import { gateFailures, messageUnits, productUnits, ratgeberUnits, runCheck, toMarkdown } from "../../tools/content/check-facts.mjs";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const keys = (text, locale = "de") => extractTokens(stripNonFacts(text), locale).map((t) => t.keys[0]);

test("tokenizer: numbers, units, ranges, dates, times, phone, codes", () => {
  assert.deepEqual(keys("Di–Fr: 10–18 Uhr · Sa: 10–14 Uhr"), ["t:10:00", "t:18:00", "t:10:00", "t:14:00"]);
  assert.deepEqual(keys("rund 2,40 Metern und 63,8 Kilogramm"), ["len:2400", "wt:63800"]);
  assert.deepEqual(keys("40 bis 60 Prozent, 8,1 %"), ["p:40", "p:60", "p:8.1"]);
  assert.deepEqual(keys("Freitag, 04.09.2026, 17:00 Uhr"), ["d:2026-09-04", "t:17:00"]);
  assert.deepEqual(keys("am 4. September 2026"), ["d:2026-09-04"]);
  assert.deepEqual(keys("+43 5574 46255"), ["ph:43557446255"]);
  assert.deepEqual(keys("CHF 150 und 10.000 €"), ["chf:150", "eur:10000"]);
  assert.deepEqual(keys("Tue–Fri 10 am–6 pm", "en"), ["t:10:00", "t:18:00"]);
  assert.deepEqual(keys("1,200.50 EUR", "en"), ["eur:1200.5"]);
  assert.deepEqual(keys("10 h – 18 h, 17h00", "fr"), ["t:10:00", "t:18:00", "t:17:00"]);
  assert.deepEqual(keys("25 000 €", "fr"), ["eur:25000"]);
  assert.deepEqual(keys("Fassung E27, Lack IP20"), ["c:e27", "c:ip20"]);
  assert.deepEqual(keys("Aluminium 40×20 mm"), ["len:40", "len:20"]);
});

test("cleaning: ICU syntax, placeholders, URLs and paths carry no facts", () => {
  assert.deepEqual(keys("{count, plural, =0 {Keine Stücke} one {# Stück} other {# Stücke}}"), []);
  assert.deepEqual(keys("mindestens {min} Zeichen"), []);
  assert.deepEqual(keys("Siehe https://example.com/2024/12 und /produkte/sofas/a-123"), []);
  assert.deepEqual(keys("[Quelle](https://x.org/a/2026)"), []);
  const ignore = compileIgnore([{ pattern: "(?<![\\p{N}])404(?![\\p{N}])" }]);
  assert.equal(applyIgnore("Fehler 404", ignore).trim(), "Fehler");
});

const FACTS = compileFacts([
  { id: "hausnummer", values: ["11"], kontext: ["landstra(ß|ss)e"], quelle: "test" },
  { id: "zeiten", values: ["10:00", "18:00"], strictUnit: true, quelle: "test" },
  { id: "ust", values: ["20 %"], kontext: ["ust|mwst"], quelle: "test" },
  { id: "arco-masse", values: ["Höhe 2400 mm, Gewicht 63,8 kg"], scope: { product: "lamps/lamps-arco" }, quelle: "test" },
  { id: "twiggy", values: ["Small 64×90, H 66"], scope: { product: "armchairs/twiggy" }, quelle: "test" },
]);
const unit = (text, extra = {}) => ({ text, file: "x.json", line: 1, key: "", locale: "de", ...extra });
const status = (text, extra) => checkUnit(unit(text, extra), FACTS, []).map((r) => `${r.raw}=${r.status}`);

test("matching: kontext, strict units, product scope, unit conversion", () => {
  assert.deepEqual(status("Landstraße 11, Lochau"), ["11=belegt"]);
  assert.deepEqual(status("Über 11 Marken"), ["11=unbelegt"], "11 without Landstraße context");
  assert.deepEqual(status("10:00–18:00"), ["10:00=belegt", "18:00=belegt"]);
  assert.deepEqual(status("10 Gründe"), ["10=unbelegt"], "strictUnit: time does not back bare 10");
  assert.deepEqual(status("inkl. 20 % USt"), ["20 %=belegt"]);
  assert.deepEqual(status("20 % Rabatt"), ["20 %=unbelegt"], "no USt context: a discount is not the VAT rate");
  assert.deepEqual(status("2,40 m hoch, 63,8 Kilogramm", { product: "lamps/lamps-arco" }), ["2,40 m=belegt", "63,8 Kilogramm=belegt"]);
  assert.deepEqual(status("2,40 m hoch", { product: "lamps/other" }), ["2,40 m=unbelegt"], "facts of another product do not apply");
  assert.deepEqual(status("2,40 m hoch", { product: "other-category/lamps-arco" }), ["2,40 m=belegt"], "matched by product slug");
  assert.deepEqual(status("Sitzhöhe 66 cm", { product: "armchairs/twiggy" }), ["66 cm=belegt"], "unitless source figure backs 66 cm");
  assert.deepEqual(status("Message key", { key: "HomePage.house.times.sat" }), []);
});

test("statuses: inline citation (Ratgeber) and hidden review passages", () => {
  assert.ok(hasInlineCitation("40 bis 60 Prozent Luftfeuchte (Nordkurier, 13.09.2026)"));
  assert.ok(hasInlineCitation("Laut DGM sind 30 cm Abstand ideal."));
  assert.ok(!hasInlineCitation("Rechnen Sie mit 30 cm Abstand."));
  assert.deepEqual(status("Laut DGM 30 cm Abstand", { inlineAllowed: true }), ["30 cm=inline"]);
  assert.deepEqual(status("Laut DGM 30 cm Abstand"), ["30 cm=unbelegt"], "inline counts only where allowed");
  assert.deepEqual(status("Etwa 30 cm [prüfen]", { hidden: true }), ["30 cm=ausgeblendet"]);
});

test("scanJsonStrings: key paths and 1-based lines, same values as JSON.parse", () => {
  const src = '{\n  "a": {\n    "b": "Landstraße 11",\n    "c": ["x", "y 2"]\n  },\n  "n": 3\n}\n';
  assert.deepEqual(scanJsonStrings(src), [
    { path: ["a", "b"], value: "Landstraße 11", line: 3 },
    { path: ["a", "c", "0"], value: "x", line: 4 },
    { path: ["a", "c", "1"], value: "y 2", line: 4 },
  ]);
  const de = read("src/messages/de.json");
  const parsed = JSON.parse(de);
  const scanned = scanJsonStrings(de);
  const get = (p) => p.reduce((o, k) => o[k], parsed);
  assert.ok(scanned.length > 500);
  for (const s of scanned.slice(0, 300)) assert.equal(get(s.path), s.value);
});

test("unit builders: messages, Ratgeber (frontmatter, markers, internal part), product copy", () => {
  const m = messageUnits("src/messages/en.json", '{\n  "x": "10 am"\n}');
  assert.deepEqual(m, [{ file: "src/messages/en.json", line: 2, key: "x", text: "10 am", locale: "en" }]);

  const md = [
    "---", "datum: 2026-10-26", "---", "", "# Titel 2026", "",
    "Ein Satz mit 30 cm.", "Ein Satz mit 40 cm [prüfen].", "<!-- 50 cm -->", "", "## Redaktion", "Intern 60 cm.",
  ].join("\n");
  const r = ratgeberUnits("a.md", md);
  assert.deepEqual(
    r.map((u) => [u.line, u.text, u.hidden]),
    [[5, "Titel 2026", false], [7, "Ein Satz mit 30 cm.", false], [8, "Ein Satz mit 40 cm [prüfen].", true], [11, "Redaktion", true], [12, "Intern 60 cm.", true]]
  );

  const pc = JSON.stringify({ locale: "de", entries: [{ key: "c/p", approved: false, meta: { title: "T 1", description: "D 2" }, h1: "H", paragraphs: ["P 3"], facts: [{ value: "9" }], faq: [{ question: "Q 4", answer: "A 5" }], keywords: ["k 6"] }] }, null, 2);
  const p = productUnits("pc.json", pc);
  assert.deepEqual(p.map((u) => u.key), ["c/p meta.title", "c/p meta.description", "c/p h1", "c/p paragraphs.0", "c/p faq.0.question", "c/p faq.0.answer"]);
  assert.ok(p.every((u) => u.product === "c/p" && u.approved === false));
});

test("build-facts: every row has a Quelle, product rows are scoped, [prüfen] notes are dropped", () => {
  assert.equal(productKeyFromUrl("http://localhost:3000/de/produkte/lamps/lamps-arco"), "lamps/lamps-arco");
  assert.deepEqual(faktenOf({ fakten: { jahr: { wert: "2004", quelle: "q" } } }), [{ feld: "jahr", wert: "2004", quelle: "q" }]);
  const built = buildFacts({
    core: { stand: "x", facts: [{ id: "a", values: ["1"], quelle: "q" }], ignore: [] },
    research: [{
      file: "R.json",
      rows: [{
        produkt_name: "P", katalog_url: "/de/produkte/c/p",
        fakten: [
          { feld: "Jahr", wert: "Auf der Herstellerseite nicht angegeben [prüfen]", quelle: "u" },
          { feld: "Maße", wert: "Höhe 64 cm; 55/93 [prüfen: Zuordnung]", quelle: "u" },
          { feld: "Designer", wert: "Ohne Zahl", quelle: "u" },
        ],
      }],
    }],
  });
  assert.deepEqual(built.facts.map((f) => f.id), ["a", "produkt:c/p:masse"]);
  assert.equal(built.facts[1].values[0], "Höhe 64 cm; 55/93");
  assert.ok(built.facts[1].vorbehalt);

  // The committed facts.json is the build output of the current inputs.
  const current = JSON.parse(read("tools/content/facts.json"));
  assert.deepEqual(current, JSON.parse(JSON.stringify(buildFacts(readInputs(ROOT)))), "facts.json veraltet: node tools/content/build-facts.mjs");
  for (const f of current.facts) assert.ok(typeof f.quelle === "string" && f.quelle.length > 3, `Quelle fehlt: ${f.id}`);
  for (const f of current.facts) assert.ok(f.beleg && (f.beleg.startsWith("Marktresearch/") || f.beleg === "tools/content/facts.core.json"), f.id);
  const ids = current.facts.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "fact ids are unique");
});

// R6-release: R6-i18n closed the gaps (Home.trust1 without number, presse and
// Vernissage backed or neutralised) – the messages now have 0 unbelegte figures,
// which is exactly what the check:facts gate enforces.
test("runCheck on the real texts: report only, messages fully backed (R6)", () => {
  const factsDoc = JSON.parse(read("tools/content/facts.json"));
  const before = fs.statSync(path.join(ROOT, "src/messages/de.json")).mtimeMs;
  const units = ["de", "en", "fr", "it"].flatMap((l) => messageUnits(`src/messages/${l}.json`, read(`src/messages/${l}.json`)));
  const result = runCheck(units, factsDoc);
  const de = result.findings.filter((f) => f.file === "src/messages/de.json" && f.status === "unbelegt").map((f) => `${f.key}=${f.figure}`);
  assert.deepEqual(de, [], "unbelegte Angaben in de.json");
  assert.deepEqual(gateFailures(result, true), [], "check:facts gate");
  // The NAP and opening hours are backed.
  assert.ok(!result.findings.some((f) => f.key.startsWith("Footer.") && f.status === "unbelegt"));
  assert.equal(fs.statSync(path.join(ROOT, "src/messages/de.json")).mtimeMs, before, "check-facts never writes texts");
  const md = toMarkdown(result, { facts: factsDoc.facts.length, date: "2026-10-26" });
  assert.match(md, /^# Faktencheck/);
});

test("--strict gate: messages by default, all on request, typo throws", () => {
  const result = {
    findings: [
      { file: "src/messages/de.json", status: "unbelegt", figure: "35" },
      { file: "src/messages/en.json", status: "belegt", figure: "11" },
      { file: "src/content/ratgeber/a.md", status: "unbelegt", figure: "30" },
      { file: "src/content/productCopy/de.json", status: "unbelegt", figure: "75" },
    ],
  };
  assert.deepEqual(gateFailures(result, true).map((r) => r.figure), ["35"]);
  assert.deepEqual(gateFailures(result, "messages").map((r) => r.figure), ["35"]);
  assert.deepEqual(gateFailures(result, "all").map((r) => r.figure), ["35", "30", "75"]);
  assert.deepEqual(gateFailures({ findings: [result.findings[1]] }, true), []);
  assert.throws(() => gateFailures(result, "mesages"), /--strict=mesages/);
});

test("--strict exits non-zero exactly when the gate has failures", () => {
  const run = spawnSync(process.execPath, ["tools/content/check-facts.mjs", "--only=messages", "--strict"], { cwd: ROOT, encoding: "utf8" });
  const expected = run.stdout.match(/Faktencheck: (\d+) unbelegt/);
  assert.ok(expected, run.stdout + run.stderr);
  assert.equal(run.status, Number(expected[1]) > 0 ? 1 : 0, run.stderr);
  if (run.status === 1) assert.match(run.stderr, /Faktencheck-Gate FEHLGESCHLAGEN/);
  else assert.match(run.stdout, /Faktencheck-Gate bestanden/);
});

// Runde 4 (P2 Sprache, Auftrag 5): MultiStepForm.context.values.* sind die
// Warenwert-Bereiche des Dreiländer-Rechners – Auswahlwerte, die die Wahl des
// Besuchers in die Anfrage schreiben, keine Preise oder Angebote. Statt einer
// erfundenen Faktenzeile „5.000 €“ zählen sie als Status „auswahl“; nur kurze
// Bezeichnungen ohne Satz, ein Satz unter demselben Schlüssel bleibt prüfpflichtig.
test("auswahl: Warenwert-Bereiche als Auswahlwerte, Sätze unter dem Schlüssel bleiben Funde", () => {
  const doc = { facts: [], ignore: [] };
  const src = JSON.stringify({ MultiStepForm: { context: { values: { "bis-5000": "bis 5.000 €", "x": "Wir liefern ab 5.000 € frei Haus. Fragen Sie an." } }, other: "bis 5.000 €" } }, null, 2);
  const units = messageUnits("src/messages/de.json", src);
  const r = runCheck(units, doc);
  const by = Object.fromEntries(r.findings.map((f) => [f.key, f.status]));
  assert.equal(by["MultiStepForm.context.values.bis-5000"], "auswahl");
  assert.equal(by["MultiStepForm.context.values.x"], "unbelegt", "ein Satz ist kein Auswahlwert");
  assert.equal(by["MultiStepForm.other"], "unbelegt", "nur die Auswahlschlüssel");
  assert.equal(r.summary.auswahl, 1);
  assert.deepEqual(gateFailures(r, true).map((f) => f.key).sort(), ["MultiStepForm.context.values.x", "MultiStepForm.other"]);
});
