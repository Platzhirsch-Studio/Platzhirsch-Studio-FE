// node --test tests/unit/r6-i18n.test.mjs
// R6-i18n: Übernahme messages-r5-leads/shell, keine fehlenden Vorschlagsschlüssel
// (r1–r9), check-facts --strict grün, Parität, Textreste.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { leaves } from "../../tools/i18n/lib.mjs";
import { coverage, proposalFiles, EXCLUDED, PROPOSAL_DIR } from "../../tools/i18n/proposals-coverage.mjs";
// Runde 4 (P2 Sprache, gesamtwerk P1-3 / recht P1-5): IT steht jetzt einheitlich in
// voi. Die Vorschlagsdateien bleiben als Verlauf in tu; der Abgleich läuft über
// den dokumentierten Patch tools/i18n/patches/r4-p2-it-voi.json.
import { expectedFor } from "./r5-i18n-voi.lib.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const msgs = Object.fromEntries(LOCALES.map((l) => [l, json(`src/messages/${l}.json`)]));
const flat = Object.fromEntries(LOCALES.map((l) => [l, new Map(leaves(msgs[l]))]));
const TL = "Marktresearch/digital/teamleiter";

test("(1) messages-r5-leads und -shell: jeder Schlüssel in 4 Sprachen mit dem Vorschlagswert", () => {
  for (const f of ["messages-r5-leads.json", "messages-r5-shell.json"]) {
    const p = json(`${TL}/${f}`);
    for (const l of LOCALES) {
      const ls = leaves(p[l]);
      assert.ok(ls.length > 0, `${f} ${l}`);
      for (const [k, v] of ls) assert.equal(flat[l].get(k), expectedFor(l, k, v), `${f} ${l}: ${k}`);
    }
  }
  assert.equal(flat.de.get("marken.breadcrumbHome"), "Startseite");
  assert.equal(flat.de.get("brandCategory.breadcrumbHome"), "Startseite");
  assert.equal(flat.de.get("landing.home"), "Startseite");
  for (const k of ["forms.selfReport.label", "forms.selfReport.options.sonstiges", "Navbar.searchRateLimited", "Navbar.searchError"]) {
    assert.notEqual(flat.en.get(k), flat.de.get(k), `EN übersetzt: ${k}`);
    assert.notEqual(flat.it.get(k), flat.de.get(k), `IT übersetzt: ${k}`);
  }
});

test("(1) Schlussprüfung: aus messages-r[1-9]-*.json fehlt kein Schlüssel (außer Anwalt-Texten)", () => {
  const files = proposalFiles(ROOT);
  assert.ok(files.length >= 16, `Vorschlagsdateien gefunden: ${files.length}`);
  const missing = [];
  for (const f of files) {
    const rows = coverage(json(`${PROPOSAL_DIR}/${f}`), msgs);
    for (const l of LOCALES) for (const k of rows[l].missing) missing.push(`${f} ${l}: ${k}`);
  }
  assert.deepEqual(missing, []);
  assert.deepEqual(EXCLUDED.map((e) => e.path), ["Cookies.intro", "Cookies.thirdCountryNotice"]);
});

// Runde 4: Erwartung bewusst umgedreht – IT ist jetzt voi (vorher tu, R6).
test("(1) IT voi-Form in den übernommenen Texten (seit Runde 4)", () => {
  const notVoi = /(?<![\p{L}])(?:Lei|Suo|Sua|Riprovi|Prema|Scelga|tu|tuo|tua|hai|Riprova|premi)(?![\p{L}])/u;
  for (const [k, v] of flat.it) {
    if (!/^(forms\.selfReport|Navbar\.search(RateLimited|Error))/.test(k)) continue;
    assert.doesNotMatch(v, notVoi, k);
  }
  assert.match(flat.it.get("forms.selfReport.label"), /avete/);
  assert.match(flat.it.get("Navbar.searchRateLimited"), /Riprovate\b/);
});

test("(1) Parität: gleiche Schlüsselmenge in 4 Sprachen, leer nur wie DE", () => {
  const de = [...flat.de.keys()].sort();
  for (const l of LOCALES) {
    assert.deepEqual([...flat[l].keys()].sort(), de, l);
    // Leer ist nur erlaubt, wo DE auch leer ist (z. B. partners.N.role).
    for (const [k, v] of flat[l]) if (typeof v === "string" && !v.trim()) assert.equal(String(flat.de.get(k)).trim(), "", `${l}: ${k} leer`);
  }
  for (const l of LOCALES) assert.equal(flat[l].has("Footer.productsTitle"), false, `${l}: verwaister Schlüssel gelöscht`);
});

test("(2) Home.trust1 ohne unbelegte Markenzahl, 4 Sprachen", () => {
  for (const l of LOCALES) assert.doesNotMatch(flat[l].get("Home.trust1"), /\d/, l);
  assert.equal(flat.de.get("Home.trust1"), "Internationale Designmarken");
});

test("(2) Belegte Angaben stehen mit Quelle in facts.core.json und facts.json ist aktuell", async () => {
  const core = json("tools/content/facts.core.json");
  const byId = Object.fromEntries(core.facts.map((f) => [f.id, f]));
  for (const id of ["vernissage-2026-09-uhrzeit", "presse-minotti-2022"]) {
    assert.ok(byId[id], id);
    assert.ok(byId[id].quelle.length > 20, `${id}: Quelle`);
  }
  assert.ok(byId["vernissage-2026-09-uhrzeit"].strictUnit, "17:00 belegt nur Uhrzeiten");
  const { buildFacts, readInputs } = await import("../../tools/content/build-facts.mjs");
  assert.deepEqual(json("tools/content/facts.json"), JSON.parse(JSON.stringify(buildFacts(readInputs(ROOT)))), "facts.json veraltet");
});

test("(2) check-facts --strict: 0 unbelegte Angaben in src/messages", async () => {
  const { messageUnits, runCheck } = await import("../../tools/content/check-facts.mjs");
  const factsDoc = json("tools/content/facts.json");
  const units = LOCALES.flatMap((l) => messageUnits(`src/messages/${l}.json`, read(`src/messages/${l}.json`)));
  const result = runCheck(units, factsDoc);
  const open = result.findings.filter((f) => f.file.startsWith("src/messages/") && f.status === "unbelegt").map((f) => `${f.file} ${f.key}=${f.figure}`);
  assert.deepEqual(open, []);
});

test("(3) keine „exklusiv“-Formen in den Messages", () => {
  for (const l of LOCALES) for (const [k, v] of flat[l]) if (typeof v === "string") assert.doesNotMatch(v, /exklusiv|exclusi|esclusiv/i, `${l}: ${k}`);
});

// R6-i18n Fix (QM-Feedback P2.1): Standard-Glob r[1-9], messages-r6-shell übernommen.
test("(fix) proposalFiles() findet ohne Glob auch r6-Dateien, messages-r6-shell ist übernommen", () => {
  const files = proposalFiles(ROOT);
  assert.ok(files.includes("messages-r6-shell.json"), files.join(","));
  assert.ok(files.includes("messages-r6-portal.json"), files.join(","));
  const p = json(`${TL}/messages-r6-shell.json`);
  for (const l of LOCALES) {
    for (const [k, v] of leaves(p[l])) assert.equal(flat[l].get(k), expectedFor(l, k, v), `r6-shell ${l}: ${k}`);
  }
  assert.match(flat.it.get("Shell.header.germanOnlyNote"), /\bvi portano\b/);
  assert.match(read("tools/i18n/proposals-coverage.mjs"), /\|\| "r\[1-9\]"/);
});

// R6-i18n Fix (P2.2/P2.3): Schlussprüfung am ausgelieferten HTML, offline an Beispielen geprüft.
test("(fix) rendered-text-check erkennt Markenzahl und Prüfwörter in Meta/JSON-LD, Freigaben nicht", async () => {
  const { partsOf, findings, allowedSpans } = await import("../../tools/i18n/rendered-text-check.mjs");
  const html =
    '<head><meta name="description" content="Mobili di design esclusivi &amp; interior design"/>' +
    '<script type="application/ld+json">{"a":"Insgesamt planen wir mit über 35 internationalen Designmarken"}</script></head>' +
    '<body><p>In tutto progettiamo con oltre 35 marchi di design internazionali</p><p>Meno movimento, testo più grande, contrasti più forti.</p><p>36 Marken von A bis Z</p></body>';
  const f = findings(partsOf(html), allowedSpans());
  assert.deepEqual(
    f.map((x) => `${x.where}:${x.kind}`).sort(),
    ["jsonld:markenzahl", "meta:prüfwort", "text:markenzahl"],
  );
});
