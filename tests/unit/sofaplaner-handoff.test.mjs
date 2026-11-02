// R5 ux P2-5: Sofaplaner → Beratung verliert den Plan nicht. Gleicher
// Mechanismus wie f2-kuechenplaner-handoff: ?produkt=…&planer=sofaplaner plus
// sessionStorage (HANDOFF_KEY); neu: Teilen-Link steckt in ?produkt=.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HANDOFF_KEY as KP_KEY } from "../../src/lib/kuechenplaner/handoff.js";
import { HANDOFF_KEY, PRODUKT_MAX, handoffHref, handoffName, handoffProdukt, handoffSummary, storeHandoff } from "../../src/lib/sofaplaner/handoff.js";
import { cleanText } from "../../src/lib/forms/beratungContext.js";
// Inhaber-Entscheidung Nr. 11: Produktname folgt der Datenquelle (Minotti-Zustimmung liegt vor → „Minotti-Sofa“).
import { SOURCE_COPY } from "../../src/lib/sofaplaner/consent.js";
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const URL_ = "https://platzhirsch.studio/de/sofaplaner?p=" + "a".repeat(20) + "." + "b".repeat(43);
const src = readFileSync(new URL("../../src/components/Labs/Sofaplaner/ResultPanel.js", import.meta.url), "utf8");

test("gleicher Speicher-Schlüssel wie der Küchenplaner", () => {
  assert.equal(HANDOFF_KEY, KP_KEY);
});

test("Übergabe-URL: /de/beratung, planer=sofaplaner, Plan-Link vollständig in produkt", () => {
  const u = new URL(handoffHref({ locale: "de", name: "Lounge", count: 4, shareUrl: URL_ }), "https://platzhirsch.studio");
  assert.equal(u.pathname, "/de/beratung");
  assert.equal(u.searchParams.get("planer"), "sofaplaner");
  const produkt = u.searchParams.get("produkt");
  assert.match(produkt, new RegExp(`^${esc(SOURCE_COPY.terminProdukt)}: Lounge, 4 Elemente · Plan: https://`));
  assert.ok(produkt.endsWith(URL_), "Link nie abgeschnitten");
  assert.ok(produkt.length <= PRODUKT_MAX);
  // Die Beratungsseite kürzt auf 200 – der Link überlebt cleanText unverändert.
  assert.equal(cleanText(produkt), produkt);
});

test("langer Name: Kopf wird gekürzt, Link bleibt", () => {
  const p = handoffProdukt({ name: "x".repeat(300), count: 12, shareUrl: URL_ });
  assert.ok(p.length <= PRODUKT_MAX);
  assert.ok(p.endsWith(URL_));
  assert.equal(handoffProdukt({}), SOURCE_COPY.terminProdukt);
});

test("Zusammenfassung in sessionStorage, gesperrter Speicher wirft nicht", () => {
  const mem = new Map();
  assert.equal(storeHandoff({ setItem: (k, v) => mem.set(k, v) }, { text: "Lounge\n4 Elemente", shareUrl: URL_ }), true);
  const v = JSON.parse(mem.get(HANDOFF_KEY));
  assert.equal(v.planer, "sofaplaner");
  assert.equal(v.url, URL_);
  assert.match(v.text, /Plan öffnen: https:/);
  assert.doesNotMatch(handoffSummary({ text: `Plan: ${URL_}`, shareUrl: URL_ }), /Plan öffnen/);
  assert.equal(storeHandoff({ setItem: () => { throw new Error("blocked"); } }, { text: "x" }), false);
});

test("ResultPanel nutzt die Übergabe (Teilen-Link automatisch, kein Copy-&-Paste-Auftrag)", () => {
  assert.match(src, /handoffHref\(handoffBase\)/);
  assert.match(src, /await makeShare\(\{ quiet: true \}\)/);
  assert.match(src, /storeHandoff\(/);
  assert.doesNotMatch(src, /Fügen Sie den Plantext oder Ihren Teilen-Link in die Anfrage ein/);
});

test("UX-Benchmark P1-4: Kurztext nennt das Modell, „Mein Sofa“ entfällt", () => {
  assert.equal(handoffName("Mein Sofa", "Connery"), "Connery");
  assert.equal(handoffName("", "Connery"), "Connery");
  assert.equal(handoffName("Wohnzimmer", "Connery"), "Connery · Wohnzimmer");
  assert.equal(handoffName("Connery", "Connery"), "Connery");
  assert.equal(handoffName("Wohnzimmer", ""), "Wohnzimmer");
  assert.match(handoffProdukt({ name: handoffName("Mein Sofa", "Connery"), count: 3 }), /: Connery, 3 Elemente$/);
  assert.match(src, /handoffName\(plan\?\.name, family\?\.name\)/);
});
