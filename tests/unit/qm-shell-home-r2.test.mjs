// QM shell-home r2: display-only quote balancing for backoffice news titles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceQuotes } from "../../src/lib/news/displayTitle.js";

test("German opening mark with straight closing mark is balanced", () => {
  assert.equal(balanceQuotes('Vernissage „Birds Zyklus" von M. Fohn', "de"), "Vernissage „Birds Zyklus“ von M. Fohn");
});

test("straight pairs become the locale's marks", () => {
  assert.equal(balanceQuotes('Ausstellung "Linie"', "de"), "Ausstellung „Linie“");
  assert.equal(balanceQuotes('Exhibition "Line"', "en"), "Exhibition “Line”");
  assert.equal(balanceQuotes('Mostra "Linea"', "it"), "Mostra «Linea»");
  assert.equal(balanceQuotes('Expo "Ligne"', "fr"), "Expo « Ligne »");
});

test("text without straight quotes and odd leftovers stay unchanged", () => {
  assert.equal(balanceQuotes("Vernissage „Birds Zyklus“", "de"), "Vernissage „Birds Zyklus“");
  assert.equal(balanceQuotes('12" Bildschirm', "de"), '12" Bildschirm');
  assert.equal(balanceQuotes(undefined), undefined);
});
