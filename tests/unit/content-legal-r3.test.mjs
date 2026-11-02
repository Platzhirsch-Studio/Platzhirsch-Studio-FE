// QM content-legal r3: H1-Obergrenze für 200 % Text, geschützte Leerzeichen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { longestWordCap } from "../../src/components/UberUns/titleParts.js";

test("H1-Obergrenze richtet sich nach dem längsten Wort", () => {
  assert.equal(longestWordCap("Impressum"), "13.33vw");
  assert.equal(longestWordCap("Anfahrt und Kontakt"), "17.14vw");
  assert.equal(longestWordCap("Einrichtungsberatung"), "9.6vw"); // Untergrenze wie hasLongWord
  assert.equal(longestWordCap("Ja"), "24vw");
  assert.equal(longestWordCap("Daten­schutz"), "17.14vw"); // Trennstelle: längstes Stück „schutz-“
  assert.equal(longestWordCap("Kontakt und Anfahrt"), "10.91vw"); // geschütztes Leerzeichen bindet
  assert.equal(longestWordCap(null), null);
  assert.equal(longestWordCap("  "), null);
});

import { LEAD_MAX, articleDate, leadLayout, splitKicker } from "../../src/components/NewsItem/leadImage.js";

test("News-Aufmacher: nie breiter als die Datei, eigenes Seitenverhältnis", () => {
  assert.deepEqual(leadLayout({ width: 224, height: 251 }), { width: 224, aspect: "224 / 251", known: true, direct: true });
  assert.deepEqual(leadLayout({ width: 1200, height: 800 }), { width: LEAD_MAX, aspect: "1200 / 800", known: true, direct: true });
  assert.deepEqual(leadLayout(null), { width: LEAD_MAX, aspect: "3 / 2", known: false, direct: false });
  // QM r3 handys: a 684 px file is sent as it is (no 3× srcset step), a big one through the optimizer.
  assert.equal(leadLayout({ width: 684, height: 768 }).direct, true);
  assert.equal(leadLayout({ width: 1920, height: 1080 }).direct, false);
  assert.equal(leadLayout({ width: 0, height: 10 }).known, false);
});

test("News-H1: kurze Marke vor dem Gedankenstrich wird erste Zeile", () => {
  assert.deepEqual(splitKicker("Flos – Ausdrucksstarke Leuchten-Designs"), ["Flos", "Ausdrucksstarke Leuchten-Designs"]);
  assert.deepEqual(splitKicker("ClassiCon – Möbeldesign von Klassiker bis Moderne"), ["ClassiCon", "Möbeldesign von Klassiker bis Moderne"]);
  assert.equal(splitKicker("Der Platzhirsch läutet die Gartensaison ein – mit vielen neuen Marken"), null);
  assert.equal(splitKicker("Ohne Strich"), null);
  assert.equal(splitKicker(null), null);
});

test("News-Datum nur bei echtem Datum", () => {
  assert.equal(articleDate("2025-09-04T10:00:00.000Z", "de"), "4. September 2025");
  assert.equal(articleDate(null, "de"), null);
  assert.equal(articleDate("kaputt", "de"), null);
});

import { sanitizeNewsText } from "../../src/lib/news/newsCopy.js";

test("News: Superlative aus dem Backoffice werden entschärft", () => {
  assert.equal(
    sanitizeNewsText("bis sich FLOS als innovativste und revolutionärste Beleuchtungsmarke positionierte.", "de"),
    "bis sich FLOS als Beleuchtungsmarke positionierte."
  );
  assert.equal(sanitizeNewsText("die innovativsten Leuchten", "de"), "die Leuchten");
});

import { domChoice } from "../../src/components/Forms/domChoice.js";

test("Wizard übernimmt eine vor der Hydration getippte Auswahl aus dem DOM", () => {
  const root = (els) => ({ querySelectorAll: (sel) => (sel.includes('name="art"') ? els : []) });
  assert.equal(domChoice("art", undefined, root([{ checked: false, value: "a" }, { checked: true, value: "b" }])), "b");
  assert.equal(domChoice("art", (v) => v === "a", root([{ checked: true, value: "b" }])), null);
  assert.equal(domChoice("art", undefined, root([{ checked: false, value: "a" }])), null);
  assert.equal(domChoice("thema", undefined, root([{ checked: true, value: "a" }])), null);
});

import { legalTypo } from "../../src/components/Impressum/legalTypo.js";

test("Rechtstexte und Ratgeber: geschützte Leerzeichen und Wortverbinder", () => {
  const N = " ";
  assert.equal(legalTypo("(Art. 6 Abs. 1 lit. b DSGVO)"), `(Art.${N}6 Abs.${N}1 lit.${N}b DSGVO)`);
  assert.equal(legalTypo("zusätzlich § 165 Abs. 3 TKG 2021"), `zusätzlich §${N}165 Abs.${N}3 TKG 2021`);
  assert.equal(legalTypo("rund 8,1 Prozent"), `rund 8,1${N}Prozent`);
  assert.equal(legalTypo("7.30 bis 18 Uhr"), `7.30 bis 18${N}Uhr`);
  assert.equal(legalTypo("(V-ZUG Planungshandbuch)"), "(V-⁠ZUG Planungshandbuch)");
  assert.equal(legalTypo("Die Möbel-Marke"), "Die Möbel-Marke");
  assert.equal(legalTypo("Arten"), "Arten");
});

import { activeTocId } from "../../src/lib/ratgeber/tocSpy.js";

test("Inhaltsverzeichnis: am Seitenende gewinnt die letzte sichtbare Überschrift", () => {
  const tops = [{ id: "a", top: -400 }, { id: "b", top: 300 }, { id: "c", top: 600 }];
  assert.equal(activeTocId(tops, 375), "b");
  assert.equal(activeTocId(tops, 250), "a");
  assert.equal(activeTocId(tops, 250, { atEnd: true, viewport: 834 }), "c");
  assert.equal(activeTocId(tops, 250, { atEnd: false, viewport: 834 }), "a");
});
