// AP-3 (SEO-Umsetzung B, 31.10.2026): eigene Ortstexte der Stadtseiten
// (src/lib/content/ortsseiten.js) – Länge, Unikat, Wortregeln, Links.
// Run: node --test tests/unit/ap3-ortsseiten.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ORTSSEITEN, ortPlainText, ortText, wordCount } from "../../src/lib/content/ortsseiten.js";
import { jaccard, shingles } from "../../src/lib/ezarri/indexierung.js";
import { findClaims } from "../../src/lib/legal/claims.js";
import { passesDoorwayAudit } from "../../src/lib/seo/sitemap/doorwayAudit.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const entries = Object.entries(ORTSSEITEN);

// Seiten, die (noch) nicht verlinkt werden dürfen: Entwürfe mit noindex.
const DRAFT_LINKS = ["/einkaufen-aus-der-schweiz", "/outdoor-gartenplanung"];
const RELEASED_RATGEBER = ["moebel-aus-oesterreich-in-die-schweiz", "was-kostet-ein-minotti-sofa", "was-kostet-eine-designerkueche"];

test("AP-3: Reihenfolge Bregenz, Dornbirn, Lindau, St. Gallen, Konstanz – keine neue Ortsseite", () => {
  assert.deepEqual(
    entries.map(([p]) => p),
    ["/designermoebel-bregenz", "/designermoebel-dornbirn", "/designermoebel-lindau", "/designermoebel-st-gallen", "/designermoebel-konstanz"]
  );
  for (const [p] of entries) {
    assert.ok(fs.existsSync(path.join(ROOT, `src/app/[locale]${p}/page.js`)), `${p}: Seite existiert schon`);
    assert.ok(passesDoorwayAudit(p), `${p}: besteht den Doorway-Audit`);
  }
  assert.equal(ortText("/designermoebel-kempten"), null);
});

test("AP-3: je Ort ≥ 350 Wörter eigener Text, ≥ 3 eigene Fragen, Suchbegriffe im Text", () => {
  for (const [p, v] of entries) {
    const text = ortPlainText(v);
    assert.ok(wordCount(text) >= 350, `${p}: ${wordCount(text)} Wörter`);
    assert.ok(v.faq.length >= 3, p);
    assert.ok(v.blocks.length >= 3, p);
    assert.match(v.heading, /Möbel/, p);
    assert.equal(v.projekte.length, 0, `${p}: Projekte nur mit Freigabe (PROJEKTE ist leer)`);
    assert.ok(v.quellen.length >= 2, `${p}: Quellen dokumentiert`);
  }
});

test("AP-3: kein Ortstausch-Gerüst (Shingle-Jaccard < 0,2 zwischen zwei Orten, keine gleiche H3)", () => {
  const h3 = new Set();
  for (let i = 0; i < entries.length; i++) {
    for (const b of entries[i][1].blocks) {
      assert.ok(!h3.has(b.heading), `H3 doppelt: ${b.heading}`);
      h3.add(b.heading);
    }
    for (let j = i + 1; j < entries.length; j++) {
      const s = jaccard(shingles(ortPlainText(entries[i][1])), shingles(ortPlainText(entries[j][1])));
      assert.ok(s < 0.2, `${entries[i][0]} ↔ ${entries[j][0]}: ${s.toFixed(3)}`);
    }
  }
});

test("AP-3: Wortregeln – kein Superlativ, kein Händlerwort, keine Preise, Montage nur auf Wunsch/Anfrage", () => {
  for (const [p, v] of entries) {
    const text = ortPlainText(v);
    assert.deepEqual(findClaims(text, { locale: "de" }).map((f) => f.match), [], p);
    assert.doesNotMatch(text, /€|EUR|CHF|Franken|\bab \d/, p);
    assert.doesNotMatch(text, /Händler|Partner von|offiziell/i, p);
    assert.doesNotMatch(text, /eigene (Liefer|Montage)/i, p);
    assert.doesNotMatch(text, /Referenz|unsere Kunden sagen|Kundenstimme/i, p);
    // Wellness: keine Showroom-Aussage vor Sommer 2027 (Inhaber Nr. 19).
    assert.doesNotMatch(text, /(Sauna|Wellness|Whirlpool)[^.]*(Showroom|Ausstellung) (erleben|ansehen|sehen)/i, p);
  }
  // St. Gallen in Schweizer Schreibung.
  assert.doesNotMatch(ortPlainText(ORTSSEITEN["/designermoebel-st-gallen"]), /ß/);
});

test("AP-3: interne Links nur auf freigegebene Seiten", () => {
  for (const [p, v] of entries) {
    assert.ok(v.links.length >= 4, p);
    for (const l of v.links) {
      assert.match(l.href, /^\/[a-z]/, `${p}: ${l.href}`);
      assert.ok(!DRAFT_LINKS.includes(l.href), `${p}: Entwurf verlinkt ${l.href}`);
      const rg = l.href.match(/^\/ratgeber\/(.+)$/);
      if (rg) assert.ok(RELEASED_RATGEBER.includes(rg[1]), `${p}: Ratgeber-Entwurf verlinkt ${l.href}`);
    }
  }
});

test("AP-3: LandingPage rendert den Ortstext und stellt die Ortsfragen ins FAQPage-Schema", () => {
  const src = read("src/components/Landing/landingPage.js");
  assert.match(src, /import \{ ortText \} from "@\/lib\/content\/ortsseiten"/);
  assert.match(src, /<OrtSection data=\{ort\} \/>/);
  assert.match(src, /items: \[\.\.\.ort\.faq, \.\.\.pageContent\.faq\.items\]/);
});
