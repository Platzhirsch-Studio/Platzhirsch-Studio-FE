// node --test tests/unit/f2-werkzeuge.test.mjs
// Fix-Runde 1, F2 „Werkzeuge & Planer“: keine internen Hinweise in Kundentexten,
// Sofaplaner-Abgrenzung in 4 Sprachen, Concierge nur mit Backend, SEO der Werkzeugseiten.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import de from "../../src/lib/sofaplaner/copy/de.js";
import en from "../../src/lib/sofaplaner/copy/en.js";
import fr from "../../src/lib/sofaplaner/copy/fr.js";
import it from "../../src/lib/sofaplaner/copy/it.js";
import { ESTIMATE } from "../../src/components/Labs/Dreilaender/pricing.js";
import { COUNTRIES } from "../../src/components/Labs/Dreilaender/rules.js";

const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
// Kommentare entfernen: geprüft wird nur, was im UI landen kann
const code = (p) => src(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

test("Sofaplaner: Hinweis „unabhängig, kein Angebot von Minotti“ in DE/EN/FR/IT", () => {
  for (const c of [de, en, fr, it]) {
    assert.match(c.unabhaengig, /Platzhirsch Home Living/);
    assert.match(c.unabhaengig, /Minotti/);
  }
  assert.match(src("src/app/[locale]/sofaplaner/page.js"), /sofaplanerCopy\(locale\)\.unabhaengig/);
});

test("Sofaplaner: kein interner Wert „Maße … %“, Termin ab Schritt 1 und in der festen Leiste", () => {
  for (const f of ["ModelPicker.js", "FamilyList.js"]) assert.doesNotMatch(code(`src/components/Labs/Sofaplaner/${f}`), /Maße \{?[^}]*completeness|Maße %/);
  assert.match(src("src/components/Labs/Sofaplaner/ModelPicker.js"), /TERMIN_HREF/);
  assert.match(src("src/components/Labs/Sofaplaner/Planner.js"), /href=\{TERMIN_HREF\}/);
  assert.match(src("src/lib/sofaplaner/copy/index.js"), /planer: "sofaplaner"/);
});

test("Dreiländer: neutrale Richtwert-Formulierung, kein Inhaberbezug in Kundentexten", () => {
  assert.equal(ESTIMATE, "Richtwert, verbindlich erst im Angebot");
  assert.doesNotMatch(JSON.stringify(COUNTRIES), /Inhaber/);
  for (const f of ["PriceCalculator.js", "calc.js", "rules.js"]) assert.doesNotMatch(code(`src/components/Labs/Dreilaender/${f}`), /Inhaber/, f);
});

test("Kein Fachjargon (Testphase, Testbetrieb, Labs-Test, Stufe 2a von 3) in öffentlichen Werkzeugtexten", () => {
  const files = [
    "src/components/Labs/Kuechenplaner/ResultPanel.js",
    "src/lib/arviewer/stage.js",
    "src/app/[locale]/3d-ansicht/page.js",
    "src/app/[locale]/3d-ansicht/[produkt]/page.js",
    "src/components/Labs/Hub/LabsHub.js",
    "src/app/[locale]/concierge/page.js",
  ];
  for (const f of files) assert.doesNotMatch(code(f), /Testphase|Labs-Test|Stufe \{?s\.nr\}? von 3|Stufe 2a|„Labs“/, f);
});

test("Concierge: Knopf nur mit Backend (Produktion), /concierge sonst noindex mit Kontakt/Termin", () => {
  const launcher = src("src/components/Concierge/Launcher.js");
  assert.match(launcher, /\/api\/labs\/status/);
  assert.match(launcher, /hiddenOn\(pathname\) \|\| !avail/);
  const page = src("src/app/[locale]/concierge/page.js");
  assert.match(page, /index: false, follow: true/);
  // R8 (recht P1, ux P1-6, bewusst geänderte Erwartung): CTA-Wort überall „Termin anfragen“.
  assert.match(page, /Termin anfragen/);
  assert.match(src("src/lib/concierge/config.js"), /export function isAvailable/);
});

test("Werkzeugseiten: og:image und WebPage/BreadcrumbList/WebApplication-JSON-LD", () => {
  const seo = src("src/components/Labs/werkzeugSeo.js");
  for (const t of ['"@type": "WebPage"', '"@type": "WebApplication"', "breadcrumbList(", "images: [image]"]) assert.ok(seo.includes(t), t);
  // kuechenplaner: seit 01.11.2026 viersprachig über src/lib/kuechenplaner/seo.js (tests/unit/kp-sprachen.test.mjs).
  // stil-finder: seit 01.11.2026 viersprachig über src/lib/stilfinder/seo.js (WebPage/BreadcrumbList/
  // WebApplication + og:image, geprüft in tests/unit/stilfinder-seo-copy.test.mjs) – QM-Endabnahme, bewusst geändert.
  for (const p of ["sofaplaner", "3d-ansicht", "dreilaender-rechner", "concierge", "bodensee-licht", "leistungen"]) {
    const s = src(`src/app/[locale]/${p}/page.js`);
    // R7-P4 (seo P2-3/P2-4, bewusst geändert): Planer nutzen werkzeugMetadata() (deOnlyMetadata + og:image)
    assert.match(s, /werkzeugOg\(|werkzeugMetadata\(/, p);
    assert.match(s, /<WerkzeugJsonLd id=/, p);
    readFileSync(new URL(`../../public/labs/og/${p}.jpg`, import.meta.url)); // Bild existiert
  }
});

test("Hub /leistungen: Title ≤ 65 Zeichen und passend zu Overline/H1", () => {
  const m = src("src/app/[locale]/leistungen/page.js").match(/title: "([^"]+)",\n/);
  const title = `${m[1]} | Platzhirsch`;
  assert.ok(title.length <= 65, title);
  assert.match(m[1], /^Planen & Erleben/);
  // landing-kern (01.11.2026, bewusst geändert): H1 aus dem Hub-Text der Sprache (HUB.de.title).
  assert.match(src("src/components/Labs/Hub/LabsHub.js"), /kernDisplay\(c\.title\)/);
  assert.match(src("src/lib/content/landingKern/leistungen.js"), /title: "Planen & Erleben",/);
});
