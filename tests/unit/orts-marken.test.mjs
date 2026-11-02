// Block „Bei uns als Händler“ auf den Stadtseiten (src/lib/content/ortsMarken.js,
// src/components/Landing/OrtsMarken.js) – Lokal-SEO 31.10.2026.
// Run: node --test tests/unit/orts-marken.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ORTS_MARKEN_MAX_LINKS, ORTS_MARKEN, ortsMarkenBlock, verifiedBrands } from "../../src/lib/content/ortsMarken.js";
import { ORTSSEITEN } from "../../src/lib/content/ortsseiten.js";
import { dealerStatementList, findClaims, isVerifiedDealerBrand } from "../../src/lib/legal/claims.js";
import { footerLinkAllowed } from "../../src/lib/seo/footerLinks.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const PAGES = ["bregenz", "dornbirn", "lindau", "st-gallen", "friedrichshafen"].map((s) => `/designermoebel-${s}`);
const RELEASED_RATGEBER = ["moebel-aus-oesterreich-in-die-schweiz", "was-kostet-ein-minotti-sofa", "was-kostet-eine-designerkueche"];

test("Händlerblock: genau die fünf Stadtseiten, jede rendert ihn page-level", () => {
  assert.deepEqual(Object.keys(ORTS_MARKEN).sort(), [...PAGES].sort());
  for (const p of PAGES) {
    const src = read(`src/app/[locale]${p}/page.js`);
    assert.match(src, /import OrtsMarken from "@\/components\/Landing\/OrtsMarken"/, p);
    assert.match(src, /<OrtsMarken path=\{PATH\} \/>/, p);
    assert.doesNotMatch(src, /Händler/, `${p}: kein handgeschriebenes Händlerwort in der Seite`);
  }
  // Gemeinsames Layout bleibt unverändert (auch Küchen-/Themenseiten nutzen es).
  assert.doesNotMatch(read("src/components/Landing/landingPage.js"), /OrtsMarken/);
  assert.equal(ortsMarkenBlock("/designermoebel-konstanz"), null);
  assert.equal(ortsMarkenBlock("/kuechen-vorarlberg"), null);
});

test("Händlerblock: nur belegte Marken, Wortlaut aus dem Claim-Register", () => {
  for (const p of PAGES) {
    const entry = ORTS_MARKEN[p];
    for (const b of entry.brands) assert.ok(isVerifiedDealerBrand(b), `${p}: ${b} nicht belegt`);
    const block = ortsMarkenBlock(p);
    assert.ok(block, p);
    assert.equal(block.statement, dealerStatementList(entry.brands, "de"), p);
    assert.match(block.heading, /^Bei uns als (Händler|Vertragshändler)$/, p);
    // Eigener Ortstext: kein Händlerwort, kein Claim, kein Superlativ, keine Preise.
    assert.doesNotMatch(entry.text, /händler|partner|offiziell|autorisiert/i, p);
    assert.deepEqual(findClaims(`${block.statement} ${entry.text}`, { locale: "de" }), [], p);
    assert.doesNotMatch(entry.text, /€|EUR|CHF|Franken|\bab \d/, p);
  }
  // Nicht belegte Marken fallen still heraus.
  assert.deepEqual(verifiedBrands(["poliform", "minotti", "minotti"]), ["minotti"]);
});

test("Händlerblock: Schwerpunkt je Ort", () => {
  const has = (p, b) => ORTS_MARKEN[p].brands.includes(b);
  for (const p of ["/designermoebel-bregenz", "/designermoebel-lindau"]) {
    assert.ok(has(p, "minotti") && has(p, "ezarri"), p);
    assert.match(ortsMarkenBlock(p).statement, /Minotti Studio by Platzhirsch Home Living/, p);
    assert.match(ORTS_MARKEN[p].text, /Outdoor/, p);
  }
  for (const b of ["gaggenau", "bora", "quooker"]) assert.ok(has("/designermoebel-dornbirn", b), b);
  const dornbirn = ORTS_MARKEN["/designermoebel-dornbirn"].links.map((l) => l.href);
  assert.ok(dornbirn.includes("/kuechengeraete") && dornbirn.includes("/kuechen-vorarlberg"));
  assert.ok(ORTS_MARKEN["/designermoebel-friedrichshafen"].links.some((l) => l.href === "/kuechen-vorarlberg"));
  // St. Gallen: Einkauf aus der Schweiz, keine V-ZUG-Aussage, Schweizer Schreibung.
  const sg = ortsMarkenBlock("/designermoebel-st-gallen");
  assert.ok(!ORTS_MARKEN["/designermoebel-st-gallen"].brands.includes("v-zug"));
  assert.doesNotMatch(`${sg.statement} ${sg.text}`, /V-ZUG|ß/);
  assert.match(sg.text, /MWST/);
});

test("Händlerblock: ≤ 3 Themenlinks, nur indexierbare Ziele, Ankertexte nicht doppelt", () => {
  const anchors = new Set();
  for (const p of PAGES) {
    const { links } = ORTS_MARKEN[p];
    assert.ok(links.length >= 1 && links.length <= ORTS_MARKEN_MAX_LINKS, p);
    assert.equal(new Set(links.map((l) => l.href)).size, links.length, `${p}: Ziel doppelt`);
    const ortAnchors = new Set((ORTSSEITEN[p]?.links || []).map((l) => l.label));
    for (const l of links) {
      assert.match(l.href, /^\/[a-z]/, `${p}: ${l.href}`);
      assert.notEqual(l.href, "/einkaufen-aus-der-schweiz", `${p}: Entwurf verlinkt`);
      const rg = l.href.match(/^\/ratgeber\/(.+)$/);
      if (rg) assert.ok(RELEASED_RATGEBER.includes(rg[1]), `${p}: Ratgeber-Entwurf ${l.href}`);
      else assert.ok(footerLinkAllowed(l.href), `${p}: ${l.href} nicht indexierbar`);
      assert.ok(!anchors.has(l.label), `Ankertext doppelt: ${l.label}`);
      assert.ok(!ortAnchors.has(l.label), `${p}: Ankertext wie im Ortstext: ${l.label}`);
      anchors.add(l.label);
    }
  }
});
