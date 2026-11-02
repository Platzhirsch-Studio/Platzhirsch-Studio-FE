// node --test tests/unit/yacht-mail.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): "Per E-Mail anfragen" on
// /yacht-interior opens the mail with the four questions that qualify a boat
// (type and length, berth or winter storage, existing boat or new build,
// time frame) – DE and EN, plain text, encoded into the mailto link.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { YACHT_UI } from "../../src/lib/yacht/ui.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("Mail-Vorlage: vier Fragen in DE und EN, keine Pflicht, keine Preise", () => {
  const de = YACHT_UI.de.mailBody;
  const en = YACHT_UI.en.mailBody;
  for (const re of [/Bootstyp und Länge:/, /Liegeplatz oder Winterlager:/, /Bestehendes Boot oder Neubau:/, /Zeitrahmen:/]) assert.match(de, re);
  for (const re of [/Boat type and length:/, /Berth or winter storage:/, /Existing boat or new build:/, /time frame:/]) assert.match(en, re);
  assert.doesNotMatch(en, /[äöüß]/);
  assert.doesNotMatch(de + en, /€|CHF|Pflicht|required/i);
  // a mailto URL stays short (Outlook/Gmail handle ~2000 characters)
  assert.ok(encodeURIComponent(de).length < 400 && encodeURIComponent(en).length < 400);
});

test("YachtPage hängt die Vorlage als body an den mailto-Link", () => {
  const page = read("src/components/Yacht/YachtPage.js");
  assert.match(page, /const mailHref = `mailto:\$\{EMAIL\}\?subject=\$\{encodeURIComponent\(cta\.mailSubject\)\}&body=\$\{encodeURIComponent\(t\.mailBody\)\}`;/);
});
