// node --test tests/unit/messages-feinschliff.test.mjs
// Feinschliff Übersetzungen EN/FR/IT (28.10.2026): Schlüssel-Abgleich gegen
// de.json (tools/i18n/parity.mjs), alle Vorschlagsdateien übernommen
// (redesign/ + teamleiter/ + features/, fix2), Rechtstexte nur markiert, Erkennung deutscher Reste.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { failures, flatten, germanHints, icuSignature, isLegal, LEGAL, parity } from "../../tools/i18n/parity.mjs";
import { normalizeProposal } from "../../tools/i18n/lib.mjs";
import { allProposalFiles, coverage, EXCLUDED } from "../../tools/i18n/proposals-coverage.mjs";
import { germanHead, headTexts, scanTexts, staticPagePaths } from "../../tools/i18n/rendered-german-check.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const json = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const msgs = () => Object.fromEntries(LOCALES.map((l) => [l, json(`src/messages/${l}.json`)]));

test("Parität: EN/FR/IT haben genau die Schlüssel, Typen und ICU-Platzhalter von DE, keine deutschen Reste", () => {
  const r = parity(msgs());
  assert.ok(r.leaves > 1200, `Blätter: ${r.leaves}`);
  for (const [l, x] of Object.entries(r.locales)) {
    assert.deepEqual(x.missing, [], `${l} fehlend`);
    assert.deepEqual(x.extra, [], `${l} nur hier`);
    assert.deepEqual(x.type, [], `${l} Typ`);
    assert.deepEqual(x.icu, [], `${l} ICU`);
    assert.deepEqual(x.german.map((g) => g.key), [], `${l} deutsche Reste`);
  }
  assert.equal(failures(r), 0);
});

test("Parität erkennt fehlende Schlüssel, falsche Platzhalter und deutsche Reste", () => {
  const m = structuredClone(msgs());
  delete m.en.Labs.net.timeout;
  m.fr.forms.summary = "Veuillez vérifier {n, plural, one {un champ} other {# champs}} :";
  m.it.booking.title = "Termin online wählen";
  m.en.booking.text = "Please pick a slot und call us.";
  m.en.Cookies.bannerText = m.de.Cookies.bannerText; // Rechtstext: nur markiert, kein Fund
  const r = parity(m);
  assert.deepEqual(r.locales.en.missing, ["Labs.net.timeout"]);
  assert.match(r.locales.fr.icu.join(), /forms\.summary/);
  assert.ok(r.locales.it.german.some((g) => g.key === "booking.title"));
  assert.ok(r.locales.en.german.some((g) => g.key === "booking.text"));
  assert.ok(!r.locales.en.german.some((g) => g.key === "Cookies.bannerText"));
  assert.deepEqual(r.locales.en.legalSameAsDe, ["Cookies.bannerText"]);
  assert.ok(failures(r) >= 4);
});

test("ICU-Signatur unterscheidet Argumente, Plural und Select", () => {
  assert.equal(icuSignature("Hallo {name}"), "name");
  assert.equal(icuSignature("{count, plural, one {# Stück} other {# Stücke}}"), "count:plural");
  assert.equal(icuSignature("{hasBrands, select, yes {Von {brands}. } other {}}x"), "brands hasBrands:select");
  assert.throws(() => icuSignature("{count, plural, one {x}"));
});

test("Heuristik: Eigennamen und Lehnwörter sind kein deutscher Rest, typische deutsche Texte schon", () => {
  assert.deepEqual(germanHints("en", "x", "Showroom Lochau, Landstraße 11", "Showroom Lochau, Landstraße 11"), []);
  assert.deepEqual(germanHints("fr", "x", "Restaurant de montagne sur le Pfänder", "Bergrestaurant am Pfänder"), []);
  assert.deepEqual(germanHints("fr", "x", "Les avis des clients", "Bewertungen"), []);
  assert.deepEqual(germanHints("en", "x", "Designer", "Designer"), []);
  assert.ok(germanHints("en", "x", "Bitte wählen Sie ein Modell", "").length > 0);
  assert.ok(germanHints("it", "x", "Kalender öffnen", "Kalender öffnen").includes("gleich wie DE"));
});

test("Alle Vorschlagsdateien (redesign/ und teamleiter/) sind übernommen, 0 fehlende Schlüssel", () => {
  const files = allProposalFiles(ROOT);
  assert.ok(files.some((f) => f.startsWith("Marktresearch/digital/redesign/")), "redesign/ gefunden");
  assert.ok(files.some((f) => f.startsWith("Marktresearch/digital/teamleiter/")), "teamleiter/ gefunden");
  assert.ok(files.length >= 25, `Dateien: ${files.length}`);
  const m = msgs();
  const missing = [];
  for (const f of files) {
    const rows = coverage(json(f), m);
    for (const l of LOCALES) for (const k of rows[l].missing) missing.push(`${f} ${l}: ${k}`);
  }
  assert.deepEqual(missing, []);
});

test("Rechtstexte: markierte Pfade gibt es in DE, die Anwalt-Ausschlüsse sind markiert", () => {
  const de = flatten(msgs().de);
  for (const e of LEGAL) {
    assert.ok([...de.keys()].some((k) => k === e.path || k.startsWith(`${e.path}.`)), `${e.path} existiert`);
    assert.ok(e.grund && e.grund.length > 10, `${e.path}: Grund`);
  }
  for (const e of EXCLUDED) assert.ok(isLegal(e.path), `${e.path} markiert`);
  assert.ok(isLegal("Cookies.categories.essential.description"));
  assert.ok(!isLegal("Home.trust1"));
});

test("Seitenprüfung: deutscher Message-Text auf einer EN-Seite ist ein Fund, Eigennamen nicht", () => {
  const de = json("src/messages/de.json");
  const deTexts = new Set([de.booking.text]);
  const legal = new Set([json("src/messages/en.json").Cookies.bannerText]);
  const texts = [
    { where: "text", value: de.booking.text },
    { where: "text", value: "Platzhirsch Home Living, Landstraße 11, 6911 Lochau" },
    { where: "alt", value: "Sofa Andersen von Minotti" },
    { where: "text", value: "Choose an appointment online" },
  ];
  const r = scanTexts("en", texts, { deTexts, legal });
  assert.equal(r.own.length, 1);
  assert.equal(r.own[0].text, de.booking.text);
  assert.equal(r.cms.length, 1, "„von“ im Alt-Text kommt aus dem Backoffice/Code");
});

// ── fix2 (28.10.2026, QM-Feedback P1-1, P2-1, P3) ─────────────────────────
const UPLOAD = "Marktresearch/digital/features/upload-messages-vorschlag.json";

test("fix2: --all findet auch features/*messages*.json (Upload, Wow)", () => {
  const files = allProposalFiles(ROOT);
  assert.ok(files.includes(UPLOAD), "upload-messages-vorschlag.json im Glob");
  assert.ok(files.includes("Marktresearch/digital/features/wow-messages-vorschlag.json"), "wow-messages-vorschlag.json im Glob");
});

test("fix2: features/upload-messages-vorschlag.json: 0 fehlend, DE 1:1 übernommen", () => {
  const proposal = json(UPLOAD);
  const rows = coverage(proposal, msgs());
  for (const l of LOCALES) {
    assert.ok(rows[l].leaves >= 229, `${l} Blätter: ${rows[l].leaves}`);
    assert.deepEqual(rows[l].missing, [], `${l} fehlend`);
  }
  assert.equal(rows.de.same, rows.de.leaves, "DE-Werte gleich dem Vorschlag (Einwilligung: CONSENT_VERSION)");
  // Bestehende Upload-Schlüssel bleiben unangetastet.
  for (const k of ["page", "problem", "frame"]) assert.ok(msgs().de.Upload[k], `Upload.${k} vorhanden`);
});

test("fix2: DE-only-Vorschlag wird als DE gelesen, EN/FR/IT gegen dieselben Pfade geprüft", () => {
  const n = normalizeProposal({ _meta: { x: 1 }, Foo: { a: "x" } });
  assert.equal(n.deOnly, true);
  assert.deepEqual(n.byLocale, { de: { Foo: { a: "x" } } });
  assert.equal(normalizeProposal({ de: { Foo: {} }, en: { Foo: {} } }).deOnly, false);
  const rows = coverage({ _meta: {}, Foo: { a: "x" } }, { de: { Foo: { a: "x" } }, en: { Foo: { a: "y" } }, fr: {}, it: { Foo: { a: "z" } } });
  assert.deepEqual(rows.fr.missing, ["Foo.a"]);
  assert.equal(rows.en.present, 1);
  assert.equal(rows.en.same, 0, "EN zählt als Übersetzung, nicht als „gleich“");
});

test("fix2: Upload.consent ist als Rechtstext markiert (EN/FR/IT nur vorläufig, Kanzlei-Vorbehalt)", () => {
  const e = LEGAL.find((x) => x.path === "Upload.consent");
  assert.ok(e, "legal-keys.json: Upload.consent");
  assert.match(e.grund, /CONSENT_VERSION/);
  assert.match(e.grund, /Kanzlei-Vorbehalt/);
  for (const l of ["en", "fr", "it"]) assert.match(e.status[l], /vorläufig/);
  assert.ok(isLegal("Upload.consent.purpose") && isLegal("Upload.consent.retention"));
  assert.ok(!isLegal("Upload.client.consent.hint"), "UI-Hinweise sind kein Rechtstext");
});

test("fix2: ICU-Platzhalter und t.rich-Tags im Upload-Namespace wie in DE", () => {
  const m = msgs();
  const de = flatten(m.de);
  for (const l of ["en", "fr", "it"]) {
    const x = flatten(m[l]);
    for (const [k, v] of de) if (k.startsWith("Upload.") && typeof v === "string") assert.equal(icuSignature(x.get(k)), icuSignature(v), `${l}: ${k}`);
  }
  assert.match(m.en.Upload.client.linkProblem, /<phone>\{phone\}<\/phone>.*<mail>\{email\}<\/mail>/);
});

test("fix2 (P3): FR „aménagement intérieur“, Satzschreibung in EN/FR-Überschriften", () => {
  const m = msgs();
  // Erwartung bewusst geändert (R9-P5, seo P1-2 / recht P2): „architecture
  // d’intérieur“ ist eine geschützte Berufsbezeichnung → „aménagement intérieur“.
  assert.equal(m.fr.Slider.headline, "Mobilier design, cuisines & aménagement intérieur au Vorarlberg");
  assert.doesNotMatch(m.fr.HomePage.services.interior.link, /interior design/i);
  assert.equal(m.en.Slider.headline, "Designer furniture, kitchens & interior design in Vorarlberg");
  assert.equal(m.en.about.first_section.subtitle, "Platzhirsch Home Living – your design furniture studio in Vorarlberg, Austria");
  // Kein Title Case „Wort & Wort“ in FR/IT-Menü und Marken-Eyebrows
  for (const l of ["fr", "it"]) {
    for (const k of ["marken.philosophyEyebrow", "marken.craftEyebrow", "marken.service", "ProductsMenu.groups.0.title", "ProductsMenu.groups.1.title"]) {
      const v = flatten(m[l]).get(k);
      assert.doesNotMatch(v, /& \p{Lu}/u, `${l}: ${k} = ${v}`);
    }
  }
});

test("fix2 (P2-1): Seitenprüfung erkennt deutschen <title>/Description auf einer EN-404", () => {
  const html =
    '<title>Sofaplaner für Minotti-Modelle (Labs) | Platzhirsch Home Living</title>' +
    '<meta name="description" content="Platzhirsch Home Living – Einrichtungsstudio für Designermöbel in Lochau."/>' +
    '<meta property="og:title" content="Page not found"/>';
  assert.equal(headTexts(html).length, 3);
  assert.deepEqual(germanHead("en", html).map((h) => h.where), ["title", "description"]);
  assert.deepEqual(germanHead("en", "<title>Page not found | Platzhirsch Home Living</title>"), []);
  const pages = staticPagePaths(ROOT);
  // Integration 28.10.2026: /labs/sofaplaner ist jetzt /sofaplaner (Inhaber-Entscheidung Nr. 9).
  assert.ok(pages.includes("sofaplaner") && pages.includes("arbeitsweise"), "DE-only-Seiten werden geprobt");
  assert.ok(!pages.some((p) => p.includes("[")), "keine dynamischen Segmente");
});
