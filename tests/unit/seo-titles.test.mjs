// tests/unit/seo-titles.test.mjs – AP-2 (SEO-Team A, 31.10.2026,
// qa-screenshots/seo-sistrix/03-umsetzungsplan.md): Titles, H1 und
// Descriptions der Kernseiten.
//   - Rohtitel inkl. Suffix ≤ 60 Zeichen, d. h. fitTitle()/cutTitle() kürzt nie
//     (die gekürzte Fassung steht sonst gekappt in der SERP);
//   - Description 120–150 Zeichen, damit clampDescription() keinen Satz abschneidet;
//   - kein Superlativ, kein Händlerwort außerhalb von VERIFIED_DEALER_BRANDS (findClaims);
//   - kein „Innenarchitekt“ als eigene Berufsbezeichnung, kein „kostenlos“ ohne Beleg;
//   - die Orts-Titel tragen den Suchbegriff „Möbel“ („möbel {ort}“, SISTRIX);
//   - der Startseiten-Titel bleibt Inhaber-Entscheidung Nr. 17 (nicht geändert).
// Die Seitendateien laden "@/…"-Module; deshalb werden Title/Description/H1 der
// Landingpages aus dem Quelltext gelesen, alles andere wird importiert.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { META_DESCRIPTION_MAX, META_TITLE_MAX, fitTitle, titleWithSuffix } from "../../src/lib/seo/pageMetadata.js";
import { findClaims } from "../../src/lib/legal/claims.js";
import { REGIONEN_META } from "../../src/lib/seo/regionen.js";
import { BW_TEXT } from "../../src/components/BadWellness/badWellnessCopy.js";
import { GERAETE_TEXT } from "../../src/components/Kuechengeraete/geraeteCopy.js";
import { arbeitsweiseCopy } from "../../src/lib/arbeitsweise/copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

/** title/description from landingMetadata({ … }) and the hero (banner/hero) title of a page file. */
function landing(slug) {
  const s = read(`src/app/[locale]/${slug}/page.js`);
  const meta = s.match(/landingMetadata\(\{[\s\S]*?title: "([^"]+)",[\s\S]*?description:\s*"([^"]+)"/);
  const h1 = s.match(/(?:banner|hero): \{[\s\S]*?title: "([^"]+)"/);
  assert.ok(meta, `${slug}: landingMetadata`);
  return { title: meta[1], description: meta[2], h1: h1?.[1] || "" };
}

const CITY_PAGES = ["bregenz", "dornbirn", "lindau", "st-gallen", "friedrichshafen", "konstanz", "feldkirch", "liechtenstein", "kempten", "ravensburg"];
const OTHER_REGION_PAGES = ["rheintal", "appenzell", "arlberg"];
const TOPIC_PAGES = ["interior-design-vorarlberg", "kuechen-vorarlberg", "wohnzimmer-einrichten-vorarlberg", "moebel-bodensee", "outdoor-gartenplanung"];

function assertSnippet(label, title, description, locale = "de") {
  assert.ok(title.length <= META_TITLE_MAX, `${label}: Title ${title.length} > ${META_TITLE_MAX}: ${title}`);
  assert.equal(fitTitle(title), title, `${label}: Title würde gekürzt`);
  assert.ok(description.length >= 120 && description.length <= META_DESCRIPTION_MAX, `${label}: Description ${description.length}`);
  for (const text of [title, description]) {
    assert.deepEqual(findClaims(text, { locale }), [], `${label}: Claim in „${text}“`);
    assert.doesNotMatch(text, /innenarchitekt|kostenlos|gratis|free of charge|gratuit/i, label);
  }
}

test("Orts- und Regionsseiten: Rohtitel mit Suffix ≤ 60, Description 120–150, ohne Claim", () => {
  for (const slug of [...CITY_PAGES, ...OTHER_REGION_PAGES]) {
    const { title, description } = landing(`designermoebel-${slug}`);
    assertSnippet(slug, titleWithSuffix(title, META_TITLE_MAX), description);
  }
});

test("Ortsseiten: Suchbegriff „Möbel & Designermöbel“ im Title, H1 „Designermöbel und Einrichtung für {Ort}“ (02-massnahmen Gruppe 2)", () => {
  // Bregenz (Lokal-SEO 31.10.2026): „Möbel & Einrichtung“ in Title und H1, die H1 nennt den Showroom-Ort.
  for (const slug of CITY_PAGES.filter((s) => s !== "bregenz")) assert.match(landing(`designermoebel-${slug}`).title, /^Möbel & Designermöbel /, slug);
  for (const slug of ["dornbirn", "lindau", "st-gallen", "friedrichshafen", "konstanz", "feldkirch", "liechtenstein"]) {
    assert.match(landing(`designermoebel-${slug}`).h1, /^Designermöbel und Einrichtung für /, slug);
  }
  const bregenz = landing("designermoebel-bregenz");
  assert.equal(bregenz.title, "Möbel & Einrichtung für Bregenz");
  assert.equal(titleWithSuffix(bregenz.title, META_TITLE_MAX), "Möbel & Einrichtung für Bregenz | Platzhirsch Home Living");
  assert.equal(bregenz.h1, "Möbel & Einrichtung für Bregenz – Showroom in Lochau");
});

test("Themenseiten und Regionen-Hub: Rohtitel ≤ 60, Description 120–150, Suchbegriff vorn", () => {
  for (const slug of TOPIC_PAGES) {
    const { title, description } = landing(slug);
    assertSnippet(slug, titleWithSuffix(title, META_TITLE_MAX), description);
  }
  assert.match(landing("kuechen-vorarlberg").title, /^Küchenstudio in Vorarlberg/);
  assert.match(landing("interior-design-vorarlberg").title, /^Interior Design Vorarlberg/);
  assert.match(landing("outdoor-gartenplanung").title, /^Gartenmöbel/);
  assertSnippet("regionen", titleWithSuffix(REGIONEN_META.title, META_TITLE_MAX), REGIONEN_META.description);
  assert.match(REGIONEN_META.title, /^Designermöbel Vorarlberg/);
  assert.match(REGIONEN_META.h1, /Designermöbel/);
});

test("Bad & Wellness, Küchengeräte, Arbeitsweise: vier Sprachen, Title ≤ 60 ungekürzt, H1 mit Suchbegriff", () => {
  for (const l of LOCALES) {
    // Description: die Seitenregel (≤ 150) prüfen bad-wellness/kuechengeraete.test.mjs.
    for (const [label, title] of [["bad-wellness", BW_TEXT[l].meta.title], ["kuechengeraete", GERAETE_TEXT[l].meta.title], ["arbeitsweise", fitTitle(arbeitsweiseCopy(l).META.title)]]) {
      assert.ok(title.length <= META_TITLE_MAX, `${label} ${l}: ${title.length}`);
      assert.equal(fitTitle(title), title, `${label} ${l}: würde gekürzt`);
      assert.deepEqual(findClaims(title, { locale: l }), [], `${label} ${l}`);
    }
    const aw = arbeitsweiseCopy(l).META.description;
    assert.ok(aw.length >= 120 && aw.length <= META_DESCRIPTION_MAX, `arbeitsweise ${l}: Description ${aw.length}`);
    assert.match(GERAETE_TEXT[l].meta.title, /Gaggenau.*Quooker/, l);
    assert.match(GERAETE_TEXT[l].title, /Gaggenau.*Quooker/, l);
    assert.match(BW_TEXT[l].title, /sauna/i, l);
  }
  assert.match(BW_TEXT.de.meta.title, /^Bad & Wellness in Vorarlberg/);
  assert.match(arbeitsweiseCopy("de").META.title, /^Einrichtungsplanung/);
});

test("Startseiten-Titel unverändert (Inhaber-Entscheidung Nr. 17)", () => {
  assert.ok(read("src/app/[locale]/page.js").includes("Platzhirsch Home Living – Interior Design & Designermöbel Lochau"), "Titel laut Entscheidung Nr. 17 fehlt");
});
