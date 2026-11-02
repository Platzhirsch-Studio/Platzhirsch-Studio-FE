// node --test tests/unit/f2-kuechenplaner-handoff.test.mjs
// Fix-Runde 1, F2, P0 „Küchenplaner-Sackgasse“: Ohne NEXT_PUBLIC_LABS_PLANER_SENDEN
// zeigt der Produktions-Build nie „Testphase/versendet keine Anfragen“, sondern
// übergibt an /<locale>/beratung?produkt=…&planer=kuechenplaner (wie der Sofaplaner).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HANDOFF_KEY, handoffHref, handoffProdukt, handoffSummary, storeHandoff } from "../../src/lib/kuechenplaner/handoff.js";
import { sendReleased } from "../../src/components/Labs/Kuechenplaner/release.js";

const LINES = ["Grundform: L-Küche · Raster 60 cm", "Raum: Wand A 360 cm, Wand B 240 cm, Raumhöhe 250 cm"];
const src = readFileSync(new URL("../../src/components/Labs/Kuechenplaner/ResultPanel.js", import.meta.url), "utf8");

test("Prod-Modus ohne Freigabe: kein Testphase-Text im Ergebnis, stattdessen Übergabe", () => {
  assert.equal(sendReleased(undefined), false);
  assert.doesNotMatch(src, /Testphase|versendet keine Anfragen/);
  // Die Übergabe hängt am Produktions-Schalter und ersetzt das Formular
  assert.match(src, /PROD_HANDOFF = process\.env\.NODE_ENV === "production" && !sendReleased\(\)/);
  assert.match(src, /\{handoff \? \(/);
  assert.match(src, /handoffHref\(/);
});

test("Übergabe-URL: /de/beratung mit produkt und planer=kuechenplaner", () => {
  const u = new URL(handoffHref({ locale: "de", lines: LINES }), "https://platzhirsch.studio");
  assert.equal(u.pathname, "/de/beratung");
  assert.equal(u.searchParams.get("planer"), "kuechenplaner");
  assert.equal(u.searchParams.get("produkt"), "3D-Küchenplaner: L-Küche");
  assert.equal(handoffProdukt([]), "3D-Küchenplaner");
  assert.ok(handoffProdukt(["Grundform: " + "x".repeat(400)]).length <= 160);
});

test("Zusammenfassung landet in sessionStorage, gesperrter Speicher wirft nicht", () => {
  const mem = new Map();
  const storage = { setItem: (k, v) => mem.set(k, v) };
  assert.equal(storeHandoff(storage, { lines: LINES, shareUrl: "https://platzhirsch.studio/de/kuechenplaner?k=abc" }), true);
  const v = JSON.parse(mem.get(HANDOFF_KEY));
  assert.equal(v.planer, "kuechenplaner");
  assert.match(v.text, /Raumhöhe 250 cm/);
  assert.match(v.text, /Planung öffnen: https:\/\/platzhirsch\.studio\/de\/kuechenplaner\?k=abc/);
  assert.equal(storeHandoff({ setItem: () => { throw new Error("blocked"); } }, { lines: LINES }), false);
  assert.doesNotMatch(handoffSummary({ lines: LINES }), /@|Telefon/);
});
