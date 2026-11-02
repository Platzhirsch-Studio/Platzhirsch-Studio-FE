// tests/unit/qm-zoom-shop.test.mjs
// QM Zoom 02.11. (WCAG 1.4.4/1.4.10, 200 % Textzoom) – Bereich Shop:
//   1. Desktop-Zoom: Shop-Kopfleiste ab lg in EINER Zeile, sobald die Leiste in rem schmal ist (≤ 44rem),
//      statt Titel-Zeile + Abteilungs-Zeile (Kopf belegte 41 % der Höhe).
//   2. iPhone-Zoom: der Edit-Link („Alle 83 Geschenksets ansehen“) darf nicht breiter als die Spalte werden.
// node --test tests/unit/qm-zoom-shop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("Shop-Kopfleiste: bei großem Bildschirm und vergrößerter Schrift eine Zeile (lg + @max-[44rem]/shopnav)", () => {
  const s = read("src/components/ShopStart/ShopSubHeader.js");
  // Äußerer Rahmen wird zur Zeile, der innere Titel-Rahmen löst sich auf (contents) – wie am Telefon quer.
  assert.match(s, /lg:@max-\[44rem\]\/shopnav:flex lg:@max-\[44rem\]\/shopnav:items-center/);
  assert.match(s, /\[@media\(max-height:500px\)\]:contents lg:@max-\[44rem\]\/shopnav:contents/);
  // Lupe ans Ende, Abteilungen in die Mitte mit min-w-0 (kein Seiten-Querscrollen).
  assert.match(s, /lg:@max-\[44rem\]\/shopnav:order-3/);
  assert.match(s, /lg:@max-\[44rem\]\/shopnav:order-2 lg:@max-\[44rem\]\/shopnav:min-w-0 lg:@max-\[44rem\]\/shopnav:flex-1/);
  // Die Schwelle ist dieselbe wie für die kompakte Kopfzeile (Suchfeld weg, Lupe da) – sonst zwei Zustände.
  assert.match(s, /@min-\[44rem\]\/shopnav:hidden/);
});

test("Shop-Startseite: Edit-Link bleibt innerhalb der Spalte (max-w-full, Umbruch im Text)", () => {
  const s = read("src/components/ShopStart/ShopStartseite.js");
  assert.match(s, /<LinkArrow href=\{e\.href\} className="max-w-full shrink-0 \[&>span\]:min-w-0 \[&>span\]:\[overflow-wrap:anywhere\]">/);
});
