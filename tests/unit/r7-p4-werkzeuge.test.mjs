// R7-P4 (Release-Rat R2): Werkzeug-SEO, Ezarri-Links, USP-Abschnitte, Wortlaut.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
// stil-finder: seit 01.11.2026 viersprachig über src/lib/stilfinder/seo.js (tests/unit/stilfinder-intl.test.mjs).
// kuechenplaner: seit 01.11.2026 viersprachig über src/lib/kuechenplaner/seo.js (tests/unit/kp-sprachen.test.mjs).
const TOOLS = ["3d-ansicht", "sofaplaner", "bodensee-licht", "dreilaender-rechner"];

test("seo P2-3/P2-4: alle Werkzeugseiten über werkzeugMetadata (deOnlyMetadata), Title ≤ 65, Description ≤ 165", () => {
  assert.match(read("src/components/Labs/werkzeugSeo.js"), /export function werkzeugMetadata[\s\S]*deOnlyMetadata\(/);
  for (const t of TOOLS) {
    const s = read(`src/app/[locale]/${t}/page.js`);
    assert.match(s, /werkzeugMetadata\("/, t);
    for (const [, v] of s.matchAll(/\btitle: "([^"]+)"/g)) assert.ok(v.length <= 65, `${t}: ${v}`);
    for (const [, v] of s.matchAll(/\bdescription:\s*"([^"]+)"/g)) assert.ok(v.length <= 165, `${t}: ${v.length}`);
  }
  const licht = read("src/app/[locale]/bodensee-licht/page.js");
  const d = licht.match(/const DESCRIPTION = "([^"]+)"/)[1];
  assert.ok(d.length <= 165, d.length);
});

test("3D-Hub: ehrliche H1, kein doppelter Raum-Filter, AR-Foto-Text nur bei AR-Foto", () => {
  const page = read("src/app/[locale]/3d-ansicht/page.js");
  assert.match(page, /Raumbedarf in Originalgröße prüfen/);
  assert.doesNotMatch(page, /Ihr Möbel im Raum, bevor es geliefert wird/);
  assert.match(read("src/components/Labs/ArViewer/Sortiment/SortimentFilters.js"), /RAUM_STUFEN\.filter\(\(x\) => \(counts\.stufe\[x\] \|\| 0\) > 0\)\.length < 2/);
  assert.doesNotMatch(read("src/components/Labs/ArViewer/Sortiment/RaumCarousel.js"), /ein Tap startet die Kamera/);
  assert.match(read("src/components/Labs/ArViewer/Sortiment/RoomTips.js"), /byStufe/);
  assert.match(read("src/app/[locale]/3d-ansicht/[produkt]/page.js"), /<RoomTips headingLevel=\{2\} stufe=\{p\.stufe\} \/>/);
});

test("Bodensee-Licht: Links ohne doppelte Sprache", () => {
  assert.doesNotMatch(read("src/app/[locale]/bodensee-licht/page.js"), /LinkArrow href="\/de\//);
});

test("Ezarri: Kollektions-CTAs ohne 404-Ziele, USP auf Konfigurator und Einsatz-Welten, Hub ohne zweite HandBridge", () => {
  const k = read("src/app/[locale]/ezarri/kollektionen/[kollektion]/page.js");
  assert.doesNotMatch(k, /custom-mix\/(motive|pixel)/);
  assert.ok(!existsSync(join(root, "src/app/[locale]/ezarri/custom-mix/motive")));
  assert.match(read("src/app/[locale]/ezarri/konfigurator/page.js"), /<HandBridge /);
  assert.match(read("src/components/Ezarri/Welt/EinsatzWelt.js"), /<HandBridge /);
  const hub = read("src/app/[locale]/ezarri/page.js");
  assert.doesNotMatch(hub, /<HandBridge/);
  assert.match(hub, /dealerTitleWord\(\)/);
  assert.match(hub, /href="\/beratung\?thema=ezarri"/);
  assert.match(read("src/components/Ezarri/Welt/parts.js"), /EZ_MENU_GROUP[\s\S]*Outdoor & Pool/);
  assert.doesNotMatch(read("src/components/Ezarri/Welt/meta.js"), /:\s*"\/Images\/Home\/aboutHome\.jpg"/);
  // mobile LCP-Fassung kleiner als m853
  const b = "public/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1";
  const size = (f) => readFileSync(join(root, f)).length;
  assert.ok(size(`${b}-q720.avif`) < size(`${b}-m853.avif`));
});

test("USP-Abschnitt auf 3D-Ansicht und Dreiländer-Rechner", () => {
  for (const p of ["3d-ansicht", "dreilaender-rechner"]) assert.match(read(`src/app/[locale]/${p}/page.js`), /<HandBridge /, p);
});

test("Wortlaut: „Termin anfragen“ statt „Termin wählen“", () => {
  for (const f of ["src/lib/ezarri/copy.js", "src/lib/stilfinder/mail.js", "src/lib/stilfinder/document.js"]) {
    assert.doesNotMatch(read(f), /Termin wählen/, f);
  }
});

test("Küchenplaner: Hydration erst bei Sichtbarkeit/Aktivität (Gate mit React.lazy)", () => {
  const g = read("src/components/Labs/Kuechenplaner/KuechenplanerGate.js");
  assert.match(g, /lazy\(\(\) => gate\.then\(loadApp\)\)/);
  assert.match(g, /IntersectionObserver/);
  assert.match(read("src/app/[locale]/kuechenplaner/page.js"), /from "@\/components\/Labs\/Kuechenplaner\/KuechenplanerGate"/);
});

test("Stil-Finder: erstes Bild nicht der Startseiten-Hero", () => {
  assert.doesNotMatch(read("src/components/Labs/Stilfinder/StilfinderQuiz.js"), /import iCollage1 from "[^"]*aboutHome\.jpg"/);
});
