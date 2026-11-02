// tests/unit/marken-erweitert.test.mjs – Marken-Übersicht um Bad & Wellness
// und Küchengeräte erweitert (Inhaber-Entscheidungen Nr. 18–24, 31.10.2026).
// Run: node --test --test-reporter=tap tests/unit/marken-erweitert.test.mjs
//
// Prüft: beide Gruppen vollständig aus den Datenquellen, Link-Ziele (Agape →
// Markenseite der Sprache, Bad & Wellness → /bad-wellness, Küchengeräte →
// /kuechengeraete), ItemList ohne doppelte Marke und mit brandNodeId-@id,
// Händler-Satz nur über den Claim-Guard (nie Agape, kein Händler-Wort im
// Komponenten-Code), Messages in vier Sprachen, Herstellerbilder nicht pinbar.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");

const G = await import("../../src/lib/marken/indexGroups.js");
const { ALLE_MARKEN } = await import("../../src/lib/wellness/marken.js");
const { GERAETE_MARKEN } = await import("../../src/lib/kueche/geraete.js");
const { brandNodeId } = await import("../../src/lib/seo/brandSchema.js");
const { dealerStatementList, findClaims } = await import("../../src/lib/legal/claims.js");

const LOCALES = ["de", "en", "fr", "it"];
const msgs = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));

test("Bad & Wellness: alle Marken aus marken.js, A–Z, Agape auf ihre Markenseite der Sprache", () => {
  const de = G.wellnessEntries("de");
  assert.deepEqual(new Set(de.map((b) => b.id)), new Set(ALLE_MARKEN.map((m) => m.id)));
  assert.deepEqual(de.map((b) => b.name), [...de.map((b) => b.name)].sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" })));
  const agapeEn = G.wellnessEntries("en", { markenPath: "/about-us/brands" }).find((b) => b.id === "agape");
  assert.equal(agapeEn.href, "/about-us/brands/agape");
  assert.equal(agapeEn.dealer, false);
  for (const b of de.filter((x) => x.id !== "agape")) {
    assert.equal(b.href, G.BW_BRAND_PAGES_LIVE ? `/bad-wellness/marke/${b.id}` : `/bad-wellness#marke-${b.id}`, b.id);
  }
  assert.equal(G.wellnessHref({ id: "starpool" }, { live: true }), "/bad-wellness/marke/starpool");
});

test("Küchengeräte: sechs Marken aus geraete.js, Anker bzw. Markenroute, Bild optional", () => {
  const de = G.geraeteEntries("de");
  assert.deepEqual(new Set(de.map((b) => b.id)), new Set(GERAETE_MARKEN.map((m) => m.id)));
  for (const b of de) {
    assert.equal(b.href, G.GERAETE_BRAND_PAGES_LIVE ? `/kuechengeraete/marke/${b.id}` : `/kuechengeraete#geraet-${b.id}`, b.id);
    assert.equal(b.image, GERAETE_MARKEN.find((m) => m.id === b.id).image || null);
  }
  assert.equal(G.geraetHref({ id: "v-zug" }, { live: true }), "/kuechengeraete/marke/v-zug");
});

test("ItemList: jede Marke einmal, Brand-@id über brandNodeId, Positionen fortlaufend", () => {
  const backoffice = [
    { slug: "agape", name: "Agape", url: "https://platzhirsch.studio/de/ueber-uns/marken/agape" },
    { slug: "antoniolupi", name: "Antoniolupi", url: "https://platzhirsch.studio/de/ueber-uns/marken/antoniolupi" },
    { slug: "minotti", name: "Minotti", url: "https://platzhirsch.studio/de/ueber-uns/marken/minotti" },
  ];
  const items = G.itemListElements(backoffice, (p) => `https://platzhirsch.studio/de${p}`, "de");
  const ids = items.map((i) => i.item["@id"]);
  assert.equal(new Set(ids).size, ids.length, "keine doppelte Marke");
  assert.equal(items.length, 3 + ALLE_MARKEN.length - 2 + GERAETE_MARKEN.length);
  items.forEach((it, i) => {
    assert.equal(it.position, i + 1);
    assert.equal(it.item["@type"], "Brand");
    assert.match(it.url, /^https:\/\/platzhirsch\.studio\/de\//);
  });
  assert.ok(ids.includes(brandNodeId("aquavia-spa")));
  assert.ok(ids.includes(brandNodeId("v-zug")));
  assert.doesNotMatch(JSON.stringify(items), /"Offer"|"Product"|seller|price/i);
});

test("Händler-Satz nur über den Claim-Guard: nie Agape, Komponente ohne eigenes Händler-Wort", () => {
  const wellnessDealers = G.wellnessEntries("de").filter((b) => b.dealer).map((b) => b.id);
  assert.ok(!wellnessDealers.includes("agape"));
  for (const l of LOCALES) assert.doesNotMatch(dealerStatementList(wellnessDealers, l), /Agape/);
  const src = code("src/components/MarkenClient/Marken.js");
  assert.match(src, /dealerStatementList\(/);
  assert.doesNotMatch(src, /Händler|(?<![.\w])dealer\b(?!Line|Statement)|revendeur|rivenditor/i);
  assert.doesNotMatch(code("src/lib/marken/indexGroups.js"), /Händler|revendeur|rivenditor/);
});

test("Messages: neue markenIndex-Texte in vier Sprachen, ohne Claim und ohne Showroom-Aussage", () => {
  const keys = ["bwTitle", "bwText", "bwLink", "kgTitle", "kgText", "kgLink", "objektOnly", "imageCredit"];
  for (const l of LOCALES) {
    // Alt-Text für jedes Herstellerbild der Gruppen (Geräte: markenIndex.geraetAlt, Bad & Wellness: badWellness.alt).
    for (const b of G.geraeteEntries(l).filter((x) => x.image)) assert.ok(msgs[l].markenIndex.geraetAlt?.[b.key], `${l}:markenIndex.geraetAlt.${b.key}`);
    for (const b of G.wellnessEntries(l).filter((x) => x.image)) assert.ok(msgs[l].badWellness.alt?.[b.key], `${l}:badWellness.alt.${b.key}`);
    for (const k of keys) {
      const v = msgs[l].markenIndex[k];
      assert.equal(typeof v, "string", `${l}:markenIndex.${k}`);
      assert.ok(v.length > 0);
      assert.deepEqual(findClaims(v), [], `${l}:${k}`);
      assert.doesNotMatch(v, /Ausstellung|showroom|exposition|esposizione/i, `${l}:${k}`);
    }
    // Inhaber 31.10.2026: Naggura nur Hotel-Wellness – Hinweis nennt Hotels, kein Therapie-/Praxis-Wort.
    assert.match(msgs[l].markenIndex.objektOnly, /h[oô]tel/i, `${l}:objektOnly`);
    assert.doesNotMatch(msgs[l].markenIndex.objektOnly, /therap|terap|thérap|praxis|practice|cabinet|studi\b|physio|fisio/i, `${l}:objektOnly`);
    // Länder und Produktgruppen kommen aus den Namespaces der beiden Seiten.
    for (const m of ALLE_MARKEN) for (const g of m.groups) assert.ok(msgs[l].badWellness.gruppen[g], `${l}:badWellness.gruppen.${g}`);
    for (const m of GERAETE_MARKEN) for (const g of m.groups) assert.ok(msgs[l].kuechengeraete.gruppen[g], `${l}:kuechengeraete.gruppen.${g}`);
  }
});

test("Herstellerbilder: einheitlich bildfüllend (CSS-Beschnitt, QM wm-fix3) und nicht pinbar; Navigation unverändert", () => {
  const src = read("src/components/MarkenClient/Marken.js");
  assert.match(src, /object-cover/);
  // QM wm-r4 (bewusst geändert): nur der Freisteller Aquavia Spa steht ganz (contain) im Rahmen.
  assert.equal((src.match(/object-contain/g) || []).length, 1);
  assert.match(src, /const CUTOUT = { "aquavia-spa": "object-contain/);
  assert.match(src, /data-pin-nopin="true"/);
  assert.doesNotMatch(read("src/components/Navbar/navbar.js"), /indexGroups/);
});
