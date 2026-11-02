// lead-mobil-i18n fix-05: Teilen-Link-Fehler.
// - Übergabe („Termin mit diesem Plan“, quiet): ein abgelehnter Link (Produktion
//   ohne Freigabe: 503) zeigte kurz vor dem Seitenwechsel eine Fehlermeldung.
// - /en/sofaplaner zeigte die deutsche Fehlermeldung der Route.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";

const src = readFileSync(new URL("../../src/components/Labs/Sofaplaner/ResultPanel.js", import.meta.url), "utf8");
const body = src.slice(src.indexOf("const makeShare = "), src.indexOf("const createShare = "));

test("quiet: Fehler setzt den Zustand zurück, keine Meldung", () => {
  const c = body.slice(body.indexOf("} catch (e) {"));
  assert.match(c, /if \(quiet\) \{\s*setShare\(\{ state: "idle"/);
  assert.ok(c.indexOf("if (quiet)") < c.indexOf('state: "error"'));
});

// Sprachen-Welle FR/IT (01.11.2026): T.foreign = EN, FR und IT (nicht Deutsch).
test("EN/FR/IT: keine deutsche Servermeldung", () => {
  assert.match(body, /throw new Error\(T\.foreign \? T\("Link konnte nicht erstellt werden\."\) : data\.error/);
  assert.ok(UI_EN["Link konnte nicht erstellt werden."]);
});
