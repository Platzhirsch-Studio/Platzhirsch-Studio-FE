import { test } from "node:test";
import assert from "node:assert/strict";
import { mitFesterEinheit } from "../../src/lib/ezarri/einheit.js";

test("Zahl und Einheit werden mit geschütztem Leerzeichen verbunden", () => {
  assert.equal(mitFesterEinheit("25 mm"), "25 mm");
  assert.equal(mitFesterEinheit("13 Stk."), "13 Stk.");
  assert.equal(mitFesterEinheit("16 Referenzen · 25 mm · Hexa"), "16 Referenzen · 25 mm · Hexa");
  assert.equal(mitFesterEinheit("106 m² · 53 Kartons"), "106 m² · 53 Kartons");
});

test("Text ohne Zahl+Einheit bleibt unverändert", () => {
  assert.equal(mitFesterEinheit("Hexa"), "Hexa");
  assert.equal(mitFesterEinheit("Überlauf­rinne"), "Überlauf­rinne");
  assert.equal(mitFesterEinheit("2 mosaics"), "2 mosaics");
  assert.equal(mitFesterEinheit(null), "");
});
