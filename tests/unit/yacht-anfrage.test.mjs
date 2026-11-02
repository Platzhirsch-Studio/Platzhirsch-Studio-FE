// node --test tests/unit/yacht-anfrage.test.mjs
// Yacht team (anfrage-mobil-code, 31.10.2026): the inquiry path from
// /yacht-interior. Both forms (/termin, /beratung) ask in their hint for what the
// studio needs to qualify a boat (type and length, berth or winter storage,
// existing boat or new build, time frame); /termin explains how a visit on
// board is booked (Terminart "Bei Ihnen vor Ort") and keeps the topic as a
// line in "Ihr Anliegen" – the vor-Ort type itself carries no `thema`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPIC_HINTS, anliegenHint, boardNote, topicHints } from "../../src/lib/forms/topicHints.js";
import { TERMIN_COPY } from "../../src/lib/booking/copy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

test("Yacht-Hinweis: Bootstyp/Länge, Liegeplatz, Refit oder Neubau, Zeitrahmen – in allen vier Sprachen", () => {
  const must = {
    de: [/Bootstyp/, /Länge/, /Liegeplatz|Winterlager/, /Neubau/, /Zeitrahmen/],
    en: [/boat type/, /length/, /berth|winter storage/, /new build/, /time frame/],
    fr: [/type/, /longueur/, /port|hivernage/, /construction neuve/, /délai/],
    it: [/tipo/, /lunghezza/, /ormeggio|rimessaggio/, /nuova costruzione/, /tempi/],
  };
  for (const l of LOCALES) {
    const h = anliegenHint("yacht", l);
    for (const re of must[l]) assert.match(h, re, `${l}: ${h}`);
    // honest copy rules of the page: no prices, no superlatives, no exclamation
    assert.doesNotMatch(h, /€|CHF|!|\b(best|beste|meilleur|migliore)\b/i, l);
  }
  // with the field length like the calendar's own hint (copy.daten.anliegenHint)
  assert.match(anliegenHint("yacht", "de", 1000), /Höchstens 1000 Zeichen\.$/);
  assert.match(anliegenHint("yacht", "en", 1000), /Up to 1000 characters\.$/);
  // IT in the voi form like it.json (no tu-form)
  assert.doesNotMatch(Object.values(TOPIC_HINTS.yacht.it).join(" "), /\b(scegli|indica|tuo|tua)\b/);
});

test("Nur Yacht hat eigene Hinweise; unbekannte Sprache fällt auf Deutsch zurück", () => {
  assert.equal(anliegenHint("kueche", "de"), null);
  assert.equal(anliegenHint(null, "de"), null);
  assert.equal(boardNote("hotel", "de", "Bei Ihnen vor Ort"), null);
  assert.equal(topicHints("yacht", "es"), TOPIC_HINTS.yacht.de);
});

test("Besichtigung an Bord nennt die echte Kartenbezeichnung von „Bei Ihnen vor Ort“ in jeder Sprache", () => {
  for (const l of LOCALES) {
    const title = TERMIN_COPY[l].arten.vor_ort.title;
    const n = boardNote("yacht", l, title);
    assert.ok(n.includes(title), `${l}: ${n}`);
    assert.doesNotMatch(n, /\{vorOrt\}/);
  }
  assert.equal(boardNote("yacht", "de", ""), null, "ohne Kartentitel kein halber Satz");
});

test("Eingebunden: /termin (Hinweis, Bord-Notiz, Themenzeile) und /beratung (Hinweis unter der Nachricht)", () => {
  const page = read("src/app/[locale]/termin/page.js");
  assert.match(page, /import \{ anliegenHint, boardNote \} from "@\/lib\/forms\/topicHints"/);
  assert.match(page, /anliegenHint: anliegenHint\(thema, locale, 1000\)/);
  assert.match(page, /topicNote: boardNote\(thema, locale, c\.arten\?\.vor_ort\?\.title\)/);
  // topic line first in "Ihr Anliegen", from the same message as /beratung
  assert.match(page, /const topicLine = thema === "yacht" && tCtx\.has\("themaYacht"\) \? tCtx\("themaYacht"\) : "";/);
  assert.match(page, /const contextLines = \[topicLine, produkt,/);
  const wizard = read("src/components/Termin/BookingWizard.js");
  assert.match(wizard, /hint=\{initial\.anliegenHint \|\| c\.daten\.anliegenHint\}/);
  assert.match(wizard, /\{initial\.topicNote && \(/);
  assert.match(wizard, /data-termin-topic-note=""/);
  const beratung = read("src/components/BeratungClient/BeratungClient.js");
  assert.match(beratung, /hint: anliegenHint\(optionKey\(STEP1_KEYS, t\.raw\("step1Options"\), values\.step1\), locale\) \|\| t\("describeHint"\)/);
  // the message line the termin page uses exists in every language
  for (const l of LOCALES) {
    const m = JSON.parse(read(`src/messages/${l}.json`));
    assert.ok(m.MultiStepForm.context.themaYacht, `${l}: MultiStepForm.context.themaYacht`);
  }
});
