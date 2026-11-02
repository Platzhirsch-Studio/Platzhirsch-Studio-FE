// tests/unit/f3-beratung-context.test.mjs — Fix-Runde 1, Team F3:
// Beratungs-Wizard mit Themen und URL-Kontext (?thema=, ?planer=, ?stil=,
// ?produkt=), optionaler Wunschtermin, Message-Hygiene (keine eckigen
// Platzhalter, kein „Testbetrieb“/„vom Inhaber“, keine pauschale
// Liefer-Länderzusage, Meta-Längen).
// Run: node --test tests/unit/f3-beratung-context.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STEP1_KEYS,
  STEP2_KEYS,
  WISH_SLOTS,
  beratungContext,
  cleanText,
  optionLabel,
  prefillMessage,
  styleName,
  todayIso,
  weekdayOf,
  wishDateError,
  wishLine,
} from "../../src/lib/forms/beratungContext.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LOCALES = ["de", "en", "fr", "it"];
const MSG = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages", `${l}.json`), "utf8"))]));

test("Wizard-Optionen: Schlüssel und Message-Arrays stimmen in allen Sprachen überein", () => {
  for (const l of LOCALES) {
    const m = MSG[l].MultiStepForm;
    assert.equal(m.step1Options.length, STEP1_KEYS.length, `${l} step1Options`);
    assert.equal(m.step2Options.length, STEP2_KEYS.length, `${l} step2Options`);
    for (const k of WISH_SLOTS) assert.ok(m.wish.slots[k], `${l} wish.slots.${k}`);
    for (const k of ["kuechenplaner", "sofaplaner", "ezarri", "3d", "stilfinder", "yacht", "stil"]) assert.ok(m.context[k], `${l} context.${k}`);
    assert.match(m.context.stil, /\{stil\}/);
  }
  // Bestehende Positionen bleiben (Tests und Backoffice kennen sie).
  assert.equal(MSG.de.MultiStepForm.step1Options[0], "einen Neubau");
  assert.equal(MSG.de.MultiStepForm.step1Options[1], "eine Renovierung");
  assert.equal(MSG.de.MultiStepForm.step1Options.at(-1), "Anderes");
  assert.deepEqual(MSG.de.MultiStepForm.step2Options.slice(0, 3), ["in einem Einfamilienhaus", "in einer Wohnung", "in einer gewerblichen Immobilie"]);
  // Die sechs neuen Themen sind wählbar.
  const de = MSG.de.MultiStepForm;
  assert.equal(optionLabel(STEP1_KEYS, de.step1Options, "kueche"), "eine Küche");
  assert.equal(optionLabel(STEP1_KEYS, de.step1Options, "sofa"), "ein Sofa");
  assert.equal(optionLabel(STEP1_KEYS, de.step1Options, "ezarri"), "Ezarri-Glasmosaik");
  assert.match(optionLabel(STEP1_KEYS, de.step1Options, "outdoor"), /Outdoor/);
  assert.match(optionLabel(STEP2_KEYS, de.step2Options, "hotel"), /Hotel/);
  assert.match(optionLabel(STEP2_KEYS, de.step2Options, "yacht"), /Yacht/);
  assert.equal(optionLabel(STEP1_KEYS, de.step1Options, "unbekannt"), null);
});

test("?thema= belegt Thema bzw. Ort vor", () => {
  const p = (q) => beratungContext(new URLSearchParams(q));
  assert.equal(p("thema=kueche").step1, "kueche");
  assert.equal(p("thema=K%C3%BCche").step1, "kueche");
  assert.equal(p("thema=sofa").step1, "sofa");
  assert.equal(p("thema=mosaik").step1, "ezarri");
  assert.equal(p("thema=ezarri").step1, "ezarri");
  assert.equal(p("thema=outdoor").step1, "outdoor");
  assert.equal(p("thema=yacht").step2, "yacht");
  assert.equal(p("thema=boot").step2, "yacht");
  assert.equal(p("thema=objekt").step2, "hotel");
  assert.equal(p("thema=hotel").step2, "hotel");
  const both = p("thema=kueche,yacht");
  assert.equal(both.step1, "kueche");
  assert.equal(both.step2, "yacht");
  assert.deepEqual(p("thema=quatsch"), { step1: null, step2: null, lines: [], produkt: null });
  assert.deepEqual(beratungContext(null), { step1: null, step2: null, lines: [], produkt: null });
});

test("?planer= setzt Thema und Kontextzeile, ?stil= das Stil-Finder-Ergebnis", () => {
  const k = beratungContext(new URLSearchParams("planer=kuechenplaner"));
  assert.equal(k.step1, "kueche");
  assert.deepEqual(k.lines, [{ key: "kuechenplaner" }]);
  assert.deepEqual(beratungContext({ planer: "sofaplaner" }).lines, [{ key: "sofaplaner" }]);
  assert.deepEqual(beratungContext({ planer: "3d" }).lines, [{ key: "3d" }]);
  const y = beratungContext({ planer: "yacht" });
  assert.equal(y.step2, "yacht");
  assert.deepEqual(y.lines, [{ key: "yacht" }]);
  const s = beratungContext(new URLSearchParams("stil=italienische-ruhe"));
  assert.deepEqual(s.lines, [{ key: "stil", vars: { stil: "Italienische Ruhe" } }]);
  // Unsaubere Slugs werden ignoriert (kein Markup aus der URL).
  assert.deepEqual(beratungContext({ stil: "<script>" }).lines, []);
  assert.equal(styleName("pariser-salon"), "Pariser Salon");
  assert.equal(styleName("../x"), null);
});

test("Nachricht vorbelegen: Produkt, dann Kontextzeilen, dann Leerzeile", () => {
  const ctx = beratungContext(new URLSearchParams("produkt=Minotti%20Belt&planer=3d&stil=seeterrasse"));
  const de = MSG.de.MultiStepForm.context;
  const format = (key, vars) => de[key].replace("{stil}", vars?.stil ?? "");
  const msg = prefillMessage(ctx, { format, productLine: (p) => MSG.de.forms.productPrefix.replace("{product}", p) });
  assert.equal(msg, "Anfrage zu: Minotti Belt\nAnfrage aus der 3D-Ansicht\nStil-Finder-Ergebnis: Seeterrasse\n");
  assert.equal(prefillMessage(beratungContext({}), { format, productLine: (p) => p }), "");
  // Freitext aus der URL: ohne Steuerzeichen und spitze Klammern, gekürzt.
  assert.equal(cleanText("a<b>\u0007c"), "a b c");
  assert.equal(cleanText("x".repeat(300)).length, 200);
});

test("Wunschtermin: optional, nicht in der Vergangenheit, als eine Zeile im Text", () => {
  const today = todayIso(new Date("2026-10-28T10:00:00Z"));
  assert.equal(today, "2026-10-28");
  assert.equal(wishDateError("", today), null);
  assert.equal(wishDateError("2026-10-28", today), null);
  assert.equal(wishDateError("2026-10-27", today), "past");
  assert.equal(wishDateError("28.10.2026", today), "format");
  assert.equal(weekdayOf("2026-11-02"), 1); // Montag
  assert.equal(
    wishLine({ date: "2026-11-12", slot: "vormittags", label: "Wunschtermin (unverbindlich)", slotLabel: "vormittags", locale: "de" }),
    "Wunschtermin (unverbindlich): Donnerstag, 12. November 2026, vormittags"
  );
  assert.equal(wishLine({ date: "", slot: "egal", label: "x", slotLabel: "egal" }), "");
  assert.equal(wishLine({ date: "", slot: "nachmittags", label: "Preferred date (not binding)", slotLabel: "afternoon" }), "Preferred date (not binding): afternoon");
  // Kein Versprechen im Hinweis.
  for (const l of LOCALES) assert.doesNotMatch(MSG[l].MultiStepForm.wish.hint, /garantier|guarante|garanti|garantit/i);
});

function strings(o, p = "", out = []) {
  if (typeof o === "string") out.push([p, o]);
  else if (o && typeof o === "object") for (const k of Object.keys(o)) strings(o[k], p ? `${p}.${k}` : k, out);
  return out;
}

test("Messages: keine eckigen Platzhalter, kein „Testbetrieb“/„vom Inhaber“", () => {
  for (const l of LOCALES) {
    for (const [key, v] of strings(MSG[l])) {
      assert.doesNotMatch(v, /\[[^\]]*\]/, `${l}:${key} enthält eckige Klammern`);
      assert.doesNotMatch(v, /Testbetrieb|vom Inhaber|by the owner|par le propriétaire|dal titolare/i, `${l}:${key}`);
    }
  }
});

test("Messages: keine pauschale Liefer-/Montagezusage für ganz Österreich (Entscheidung Nr. 3)", () => {
  const bad = /(liefern|Lieferung|Lieferservice)[^.]*(ganz Österreich|österreichweit)|österreichweiter Lieferservice|deliver[^.]*throughout Austria|livr[^.]*toute l.Autriche|consegn[^.]*tutta l.Austria/i;
  for (const l of LOCALES) for (const [key, v] of strings(MSG[l])) assert.doesNotMatch(v, bad, `${l}:${key}`);
});

test("Messages: Meta-Titles ≤ 65, Descriptions ≤ 165 Zeichen", () => {
  for (const l of LOCALES) {
    for (const [key, v] of strings(MSG[l])) {
      const leaf = key.split(".").pop();
      if (!/(^|\.)(meta|seo)(\.|$)/i.test(key)) continue;
      if (/title/i.test(leaf)) assert.ok(v.length <= 65, `${l}:${key} ${v.length}`);
      if (/desc/i.test(leaf)) assert.ok(v.length <= 165, `${l}:${key} ${v.length}`);
    }
  }
});

test("Kern-USP auf Beratung, Kontakt und Team; keine unbestätigte Dauer/„kostenlos“", () => {
  for (const l of LOCALES) {
    const m = MSG[l];
    for (const v of [m.inhalt.beratung.usp, m.contact.usp, m.inhalt.team.notes["Harald Menghin"]]) assert.ok(v && v.length > 20, l);
    assert.match(m.inhalt.beratung.usp, /Harald Menghin/);
    assert.match(m.contact.usp, /Harald Menghin/);
    // Erfundene Rolle für Harald? Nicht in den freigegebenen Rollen (inhaber-offen A4).
    assert.equal(m.inhalt.team.roles["Harald Menghin"], undefined, l);
    for (const v of [m.inhalt.beratung.usp, m.inhalt.beratung.lead, m.contact.usp, m.Arbeitsweise.hero.ctaNote]) {
      assert.doesNotMatch(v, /\b60\b|kostenlos|free of charge|gratuit|gratuito/i, `${l}: ${v}`);
    }
    // Rat 9,5 A1 (Übernahme 30.10.2026): /arbeitsweise gibt es jetzt in allen vier
    // Sprachen – die Links führen in die eigene Sprache, ohne „(in German)“-Hinweis;
    // inhalt.team.notesLink ist entfallen (T4, Link steht im Harald-Kapitel).
    if (l !== "de") for (const v of [m.inhalt.beratung.uspLink, m.contact.uspLink]) assert.doesNotMatch(v, /German|allemand|tedesco/, `${l}: ${v}`);
    assert.equal(m.inhalt.team.notesLink, undefined, l);
  }
});

test("EN: Hero- und Abschluss-Knopf kurz (einzeilig am Handy)", () => {
  const en = MSG.en;
  for (const v of [en.HomePage.hero.cta, en.HomePage.cta.primary, en.inhalt.common.termin]) assert.ok(v.length <= 16, v);
});
