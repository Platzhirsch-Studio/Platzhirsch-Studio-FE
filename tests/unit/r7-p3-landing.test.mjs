// tests/unit/r7-p3-landing.test.mjs – Runde 2, Fix-Team P3 (Arbeitsweise,
// Landing- und Stadtseiten). Run: node --test tests/unit/r7-p3-landing.test.mjs
// Prüft: /arbeitsweise index (seo P0-1), Liefergebiet ohne „ganz Österreich“
// (Entscheidung Nr. 3), USP-Abschnitt auf allen Landing-/Stadtseiten
// (gesamtwerk P1-4), Objekt- und Planer-Block ohne Referenzen (ux P1-2/P1-3),
// CTA mit Kontext und „Termin anfragen“ (ux P1-1/P1-5), BreadcrumbList (seo P2-5),
// Outdoor-Brotkrumen wie das Menü (gesamtwerk P2).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCAL_LANDING, PLANER, PROCESS_NOTE, PROCESS_STEPS, beratungHref } from "../../src/components/Landing/copy.js";
import { STEPS } from "../../src/lib/arbeitsweise/copy.js";
import { robotsForLaunch } from "../../src/lib/arbeitsweise/media.js";
import { STEP1_KEYS, beratungContext } from "../../src/lib/forms/beratungContext.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const APP = "src/app/[locale]";
const REGIONS = fs.readdirSync(path.join(ROOT, APP)).filter((d) => d.startsWith("designermoebel-"));
const LANDINGS = ["interior-design-vorarlberg", "kuechen-vorarlberg", "moebel-bodensee", "wohnzimmer-einrichten-vorarlberg", ...REGIONS];
const P3_FILES = [
  ...LANDINGS.map((d) => `${APP}/${d}/page.js`),
  `${APP}/einkaufen-aus-der-schweiz/page.js`,
  `${APP}/outdoor-gartenplanung/page.js`,
  `${APP}/ueber-uns/platzhirsch/page.js`,
  "src/components/Landing/parts.js",
  "src/components/Landing/landingPage.js",
  "src/components/Landing/copy.js",
  "src/components/Landing/Outdoor/OutdoorLanding.js",
  "src/components/UberUns/uberuns.js",
  "src/components/UberUns/uspCopy.js",
];

test("/arbeitsweise ist index, follow – unabhängig von den Bildslots (seo P0-1)", () => {
  assert.deepEqual(robotsForLaunch(), { index: true, follow: true });
});

test("Liefergebiet: kein „ganz Österreich“ in P3-Dateien (Entscheidung Nr. 3, gesamtwerk P1-3)", () => {
  for (const f of P3_FILES) assert.doesNotMatch(read(f), /ganz Österreich/, f);
});

test("USP-Kurzabschnitt: gleiche sieben Schrittnamen wie /arbeitsweise, Link auf /arbeitsweise", () => {
  assert.deepEqual(PROCESS_STEPS, STEPS.map((s) => s.name));
  assert.equal(PROCESS_NOTE.link.href, "/arbeitsweise");
  assert.match(PROCESS_NOTE.vorOrt, /^Wenn Ihr Projekt es braucht/);
  const tpl = read("src/components/Landing/landingPage.js");
  assert.match(tpl, /content\.process !== false && <ProcessNote/);
});

test("USP auf allen Landing-/Stadtseiten: eigener Satz je Seite, Interior zeigt die 7 Schritte voll", () => {
  const texts = new Set();
  for (const d of LANDINGS) {
    const src = read(`${APP}/${d}/page.js`);
    if (d === "interior-design-vorarlberg") {
      assert.match(src, /process: false/);
      for (const name of PROCESS_STEPS) assert.match(src, new RegExp(`title: "${name}"`), `${d}: ${name}`);
      continue;
    }
    const m = src.match(/processText:\s*"([^"]+)"/);
    assert.ok(m, `${d}: processText fehlt`);
    assert.match(m[1], /Harald Menghin/, d);
    assert.match(m[1], /von Hand/, d);
    assert.ok(!texts.has(m[1]), `${d}: Satz doppelt (Doorway)`);
    texts.add(m[1]);
  }
  // Schweiz-Hub und „Das Haus“
  assert.match(read(`${APP}/einkaufen-aus-der-schweiz/page.js`), /<ProcessNote swiss/);
  const about = read("src/components/UberUns/uberuns.js");
  assert.match(about, /ABOUT_USP/);
  assert.match(about, /href="\/arbeitsweise"/);
  assert.match(about, /hrefLang: "de"/, "EN/FR/IT: Link mit Sprachkennzeichnung");
});

test("Interior: USP-Kette laut Durchdringungsplan §2, #objekt und Planer-Block, keine Referenzen", () => {
  const src = read(`${APP}/interior-design-vorarlberg/page.js`);
  assert.match(src, /Harald Menghin zeichnet daraus ein Einrichtungskonzept von Hand und baut ein Raummodell/);
  assert.match(src, /"Konzept von Hand gezeichnet, dann in 3D geplant"/);
  assert.match(src, /objekt: \{/);
  assert.match(src, /Zimmerserie/);
  assert.match(src, /planer: \{\}/);
  const objekt = src.slice(src.indexOf("  objekt: {"), src.indexOf("  planer: {}"));
  assert.doesNotMatch(objekt, /Referenz|Kunde[n]? wie|Projekt in [A-ZÄÖÜ]\w+|Hotel [A-ZÄÖÜ]\w+ (in|am)|\d+ Zimmer/, "keine erfundenen Referenzen");
  assert.match(read("src/components/Landing/parts.js"), /id="objekt"/);
  assert.match(read(`${APP}/designermoebel-st-gallen/page.js`), /planer: \{/);
  const all = JSON.stringify(PLANER);
  assert.doesNotMatch(all, /BIM|CAD|Rabatt|Prozent|\d+\s?%/, "keine unbelegten Fachversprechen");
  assert.match(PLANER.contactNote, /auf Anfrage/);
});

test("CTA-Kontext (ux P1-1): ?thema=/&rolle=/&ort=, Werte kennt beratungContext", () => {
  assert.equal(beratungHref({ thema: "objekt", rolle: "architekt", ort: "st-gallen" }), "/beratung?thema=objekt&rolle=architekt&ort=st-gallen");
  assert.equal(beratungHref({}), "/beratung");
  for (const thema of ["kueche", "outdoor", "neubau", "objekt"]) {
    const ctx = beratungContext({ thema });
    assert.ok(ctx.step1 || ctx.step2, `${thema} wird im Formular vorbelegt`);
  }
  assert.ok(STEP1_KEYS.includes("kueche"));
  assert.match(read(`${APP}/kuechen-vorarlberg/page.js`), /thema: "kueche"/);
  // Runde 5 (P3, ux P2-6, bewusst geänderte Erwartung): Interior ohne „Neubau“-Vorwahl.
  assert.match(read(`${APP}/interior-design-vorarlberg/page.js`), /thema: "interior"/);
  assert.match(read("src/components/Landing/Outdoor/OutdoorLanding.js"), /beratungHref\(\{ thema: "outdoor" \}\)/);
  for (const d of REGIONS) assert.match(read(`${APP}/${d}/page.js`), new RegExp(`ort: "${d.replace("designermoebel-", "")}"`), d);
  const parts = read("src/components/Landing/parts.js");
  assert.doesNotMatch(parts, /<Button href=\{ROUTES\.beratung\.de\}/, "kein Termin-Knopf ohne Kontext");
});

test("„Termin anfragen“ statt „Termin wählen“ (ux P1-5) in den P3-Dateien", () => {
  assert.equal(LOCAL_LANDING.appointment, "Termin anfragen");
  for (const f of [...P3_FILES, "src/lib/arbeitsweise/copy.js"]) assert.doesNotMatch(read(f), /"Termin wählen"/, f);
});

test("BreadcrumbList als eigener Knoten über src/lib/seo/breadcrumbs.js (seo P2-5), Outdoor wie das Menü", () => {
  const parts = read("src/components/Landing/parts.js");
  assert.match(parts, /breadcrumbSchemaItems/);
  assert.match(parts, /menuTrail\(/, "gleiche Spur wie sichtbar");
  for (const f of ["src/components/Landing/landingPage.js", "src/components/Landing/Outdoor/OutdoorLanding.js"]) {
    const src = read(f);
    assert.match(src, /breadcrumbNode\(landingCrumbs\(/, f);
    assert.doesNotMatch(src, /name: "Home"/, f);
  }
  const outdoor = read(`${APP}/outdoor-gartenplanung/page.js`);
  assert.match(outdoor, /crumb: "Outdoor-Planung"/);
  assert.match(outdoor, /trail: \[\{ label: "Outdoor & Pool" \}\]/);
  assert.match(outdoor, /index: false/, "Outdoor bleibt noindex (Inhaber-offen Nr. 24)");
});
