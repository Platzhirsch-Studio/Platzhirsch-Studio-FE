// node --test tests/unit/yacht-werft-rolle.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): boatyards and marine
// upholsterers get their own way in from /yacht-interior:
//   /beratung?thema=yacht&rolle=werft → step 1 "Yacht-Interieur", step 2 "Boot",
//   message lines "Es geht um ein Boot …" + "Ich schreibe für eine Werft …",
//   Herkunft "Fachweg: Werft/Bootssattler · Seite: Yacht-Interieur".
// The architect role stays exactly as before.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beratungContext, herkunftContext } from "../../src/lib/forms/beratungContext.js";
import { schreibenHref } from "../../src/lib/forms/terminLink.js";
import { YACHT_UI } from "../../src/lib/yacht/ui.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("?rolle=werft|bootssattler: Thema Yacht, Ort Boot, eigene Zeile, eigener Fachweg", () => {
  for (const rolle of ["werft", "Werft", "bootssattler", "sattler", "bootswerft"]) {
    const ctx = beratungContext({ thema: "yacht", rolle });
    assert.equal(ctx.step1, "yacht", rolle);
    assert.equal(ctx.step2, "yacht", rolle);
    assert.deepEqual(ctx.lines.map((l) => l.key), ["themaYacht", "rolleBootsbau"], rolle);
    assert.equal(herkunftContext(ctx), "Fachweg: Werft/Bootssattler · Seite: Yacht-Interieur", rolle);
  }
  // without ?thema the role alone still files the request under yacht
  const alone = beratungContext({ rolle: "werft" });
  assert.equal(alone.step1, "yacht");
  assert.deepEqual(alone.lines, [{ key: "rolleBootsbau" }]);
});

test("Architekten-Rolle unverändert (Rolle gewinnt über ?thema=, Schritt 2 bleibt offen)", () => {
  const a = beratungContext({ thema: "objekt", rolle: "architekt" });
  assert.equal(a.step1, "architektur");
  assert.equal(a.step2, null);
  assert.equal(herkunftContext(beratungContext({ rolle: "architekt" })), "Fachweg: Architektur/Planung");
  assert.deepEqual(beratungContext({ thema: "quatsch", rolle: "hacker" }).lines, []);
});

test("Zeile rolleBootsbau in allen vier Sprachen, ohne Händler- oder Partner-Aussage", () => {
  for (const l of ["de", "en", "fr", "it"]) {
    const s = JSON.parse(read(`src/messages/${l}.json`)).MultiStepForm.context.rolleBootsbau;
    assert.ok(s && s.length < 90, `${l}: ${s}`);
    assert.doesNotMatch(s, /partner|händler|dealer|revendeur|rivenditore|!/i, l);
  }
});

// Integration 31.10.2026: the form entry sits in the one Fachleute section (#fachleute,
// TradePaths) instead of a second Werft/Sattler block in „Wer macht was“.
test("Yacht-Seite: Formular-Einstieg für Werft und Bootssattler im Abschnitt „Für Fachleute“, DE und EN", () => {
  assert.equal(schreibenHref("de", { context: { thema: "yacht", rolle: "werft" } }), "/beratung?thema=yacht&rolle=werft");
  assert.equal(schreibenHref("en", { context: { thema: "yacht", rolle: "werft" } }), "/consultation?thema=yacht&rolle=werft");
  assert.match(YACHT_UI.de.tradeText, /Werft oder Bootssattler/);
  assert.match(YACHT_UI.en.tradeText, /boatyard or a marine upholsterer/);
  assert.doesNotMatch(YACHT_UI.en.tradeText + YACHT_UI.en.tradeLink, /[äöüß]/);
  const page = read("src/components/Yacht/YachtPage.js");
  assert.match(page, /tradeHref=\{schreibenHref\(locale, \{ context: \{ thema: "yacht", rolle: "werft" \} \}\)\}/);
  assert.match(page, /<TradePaths data=\{content\.trade\} t=\{t\} tradeHref=/);
  assert.match(page, /data-yacht-trade-form=""/);
  // exactly one Werft/Sattler section on the page
  assert.equal(page.match(/id="fachleute"/g).length, 1);
  // the line is visible on phones too (no max-sm:hidden on it)
  assert.doesNotMatch(page.match(/<p[^>]*data-yacht-trade-form=""[^>]*>/)[0], /max-sm:hidden|hidden/);
});
