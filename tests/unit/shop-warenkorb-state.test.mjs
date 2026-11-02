// tests/unit/shop-warenkorb-state.test.mjs — Browser-Warenkorb (rein):
// Grenzen wie der Server, ehrliche Rückmeldung beim Hinzufügen, Entfernen mit
// „Rückgängig“, robuste Wiederherstellung aus localStorage.
// Run: node --test tests/unit/shop-warenkorb-state.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { addLine, changeVariant, countOf, removeLine, restoreLine, sanitizeLines, setLineQty } from "../../src/lib/shop/cartState.js";
import { CART_MAX_LINES, CART_MAX_QTY } from "../../src/lib/shop/cartLimits.js";

const A = { slug: "riedel-veritas", variante: "standard", menge: 2 };

test("sanitizeLines: kaputte/manipulierte Einträge fallen raus, Duplikate werden zusammengeführt", () => {
  const raw = [A, { slug: "riedel-veritas", variante: "standard", menge: 9 }, { slug: "X Y", menge: 1 }, { slug: "ok", menge: "abc" }, { slug: "ok-2", menge: 0 }, null, { slug: "ok-3", variante: "", menge: 1.9 }];
  assert.deepEqual(sanitizeLines(raw), [
    { slug: "riedel-veritas", variante: "standard", menge: CART_MAX_QTY },
    { slug: "ok-3", variante: "standard", menge: 1 },
  ]);
  assert.deepEqual(sanitizeLines("quatsch"), []);
  assert.equal(sanitizeLines(Array.from({ length: 40 }, (_, i) => ({ slug: `p-${i}`, menge: 1 }))).length, CART_MAX_LINES);
});

test("addLine meldet Höchstmenge und vollen Warenkorb statt still zu kappen", () => {
  let r = addLine([], "a", "standard", 3);
  assert.deepEqual(r.result, { ok: true, reason: null, added: 3, menge: 3 });
  r = addLine(r.list, "a", "standard", 9);
  assert.deepEqual(r.result, { ok: true, reason: "max_menge", added: 7, menge: 10 });
  r = addLine(r.list, "a", "standard", 1);
  assert.equal(r.result.ok, false);
  assert.equal(r.result.added, 0);
  const voll = Array.from({ length: CART_MAX_LINES }, (_, i) => ({ slug: `p-${i}`, variante: "standard", menge: 1 }));
  const v = addLine(voll, "neu", "standard", 1);
  assert.equal(v.result.reason, "voll");
  assert.equal(v.list, voll, "Liste unverändert");
});

test("setLineQty: 0 entfernt, NaN ändert nichts, Obergrenze 10", () => {
  const l = [A];
  assert.deepEqual(setLineQty(l, A.slug, A.variante, 0), []);
  assert.equal(setLineQty(l, A.slug, A.variante, Number.NaN), l);
  assert.equal(setLineQty(l, A.slug, A.variante, 99)[0].menge, CART_MAX_QTY);
});

test("Entfernen + Rückgängig setzt die Zeile an derselben Stelle wieder ein", () => {
  const l = [{ slug: "a", variante: "standard", menge: 1 }, A, { slug: "c", variante: "standard", menge: 1 }];
  const { list, removed } = removeLine(l, A.slug, A.variante);
  assert.deepEqual(removed, { entry: A, index: 1 });
  assert.deepEqual(restoreLine(list, removed), l);
  assert.equal(removeLine(l, "gibt-es-nicht", "standard").removed, null);
  // Inzwischen wieder hinzugefügt → Mengen zusammen, gekappt
  assert.equal(restoreLine([{ ...A, menge: 9 }], removed)[0].menge, CART_MAX_QTY);
});

test("changeVariant führt Mengen zusammen", () => {
  const l = [{ slug: "k", variante: "klein", menge: 2 }, { slug: "k", variante: "gross", menge: 3 }];
  assert.deepEqual(changeVariant(l, "k", "klein", "gross"), [{ slug: "k", variante: "gross", menge: 5 }]);
  assert.deepEqual(changeVariant([l[0]], "k", "klein", "gross"), [{ slug: "k", variante: "gross", menge: 2 }]);
});

test("countOf ist robust gegen Unsinn", () => {
  assert.equal(countOf([A, { menge: "x" }, null]), 2);
  assert.equal(countOf(undefined), 0);
});

test("cartStore: localStorage nur in try/catch, Tab-Sync über storage, keine Preise gespeichert", () => {
  const src = fs.readFileSync(new URL("../../src/components/Shop/cartStore.js", import.meta.url), "utf8");
  assert.match(src, /addEventListener\("storage"/);
  for (const call of src.matchAll(/localStorage\.(getItem|setItem)/g)) {
    const before = src.slice(Math.max(0, call.index - 120), call.index);
    assert.match(before, /try \{/, call[0]);
  }
  assert.match(src, /map\(\(\{ slug, variante, menge \}\)/);
  assert.doesNotMatch(src, /cent/i);
});
