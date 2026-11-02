// node --test tests/unit/r4-i18n.test.mjs
// R4-i18n: Übernahme der messages-r2/r3-Vorschläge, IT-Anrede in den
// Copy-Dateien, Rückbau der Fallbacks, gelöschte verwaiste Schlüssel.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { leaves } from "../../tools/i18n/lib.mjs";
import { hasDynamicCall } from "../../tools/i18n/orphans-safe.mjs";
// Runde 4 (P2 Sprache): IT voi – historische tu-Vorschläge über den dokumentierten Patch.
import { expectedFor, itExpectedTree } from "./r5-i18n-voi.lib.mjs";
// R5-i18n: Home/pendingCopy.js is deleted, FORM_TEXT/FORM_TEXT_R3 and
// KONTAKT_COPY hold no text any more; the checks below use the proposals as
// key lists and the messages as the only source.

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const msgs = Object.fromEntries(LOCALES.map((l) => [l, json(`src/messages/${l}.json`)]));
const flat = Object.fromEntries(LOCALES.map((l) => [l, new Map(leaves(msgs[l]))]));
const get = (o, p) => p.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
const TL = "Marktresearch/digital/teamleiter";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const file = path.join(ROOT, "src", specifier.slice(2));
    return nextResolve(pathToFileURL(fs.existsSync(file) ? file : `${file}.js`).href, context);
  },
});
const { KONTAKT_COPY, contactCopy } = await import("../../src/components/Kontakt/copy.js");

const PROPOSALS = [
  "messages-r2-leads.json",
  "messages-r2-seo.json",
  "messages-r3-shell.json",
  "messages-r3-startseite.json",
  "messages-r3-inhalt.json",
  "messages-r3-landing.json",
  "messages-r3-marken.json",
  "messages-r3-produkt.json",
];
// Rechtstext: bleibt bis zur Freigabe durch den Anwalt beim Bestand.
const EXCLUDED = ["Cookies.intro", "Cookies.thirdCountryNotice"];

test("alle r2/r3-Vorschläge sind übernommen (jeder Schlüssel in allen 4 Sprachen)", () => {
  const missing = [];
  for (const f of PROPOSALS) {
    const p = json(`${TL}/${f}`);
    for (const l of LOCALES) {
      for (const [k] of leaves(p[l])) {
        if (EXCLUDED.some((e) => k === e || k.startsWith(`${e}.`))) continue;
        if (!flat[l].has(k)) missing.push(`${f} ${l}:${k}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

// r7-p1 (r2-recht-inhalt P1-4): the old dialog text contradicted the live
// privacy policy (Art. 49 "unsichere Drittländer" vs. DPF, Art. 45). The
// DPF/SCC texts of messages-r3-shell.json are now live in all four
// languages; expectation changed on purpose (law-firm review stays open,
// Marktresearch/recht/anwalt-vorschau.md section 6 shows the live text).
test("Consent-Rechtstexte aus messages-r3-shell.json sind übernommen (DPF statt Art. 49)", () => {
  const p = json(`${TL}/messages-r3-shell.json`);
  for (const l of LOCALES) {
    for (const k of EXCLUDED) {
      const proposed = get(p[l], k);
      if (proposed === undefined) continue;
      assert.equal(get(msgs[l], k), expectedFor(l, k, proposed), `${l}:${k} nicht übernommen`);
    }
    assert.doesNotMatch(JSON.stringify(msgs[l].Cookies), /Art\. 49|hübschere|prettier fonts|Web[- ]2\.0/, l);
  }
});

test("Vorschlagsdateien sind als übernommen markiert (außer startseite: Test erlaubt nur Sprach-Schlüssel)", () => {
  for (const f of PROPOSALS.filter((f) => f !== "messages-r3-startseite.json")) {
    assert.match(json(`${TL}/${f}`)._uebernommen || "", /^R[45]-i18n/, f);
  }
});

test("ContactSection.paragraphs[1] ist der Gastgeber-Text aus messages-r3-inhalt.json", () => {
  const p = json(`${TL}/messages-r3-inhalt.json`);
  for (const l of LOCALES) assert.deepEqual(msgs[l].ContactSection.paragraphs, l === "it" ? itExpectedTree("ContactSection.paragraphs", p.it.ContactSection.paragraphs) : p[l].ContactSection.paragraphs, l);
});

test("Home: getHomeT ohne Fallback, pendingCopy.js gelöscht, round-3-Schlüssel in den Messages", () => {
  const src = read("src/components/Home/copy.js");
  assert.doesNotMatch(src, /PENDING_COPY|t\.has\(/);
  assert.equal(fs.existsSync(path.join(ROOT, "src/components/Home/pendingCopy.js")), false);
  const p = json(`${TL}/messages-r3-startseite.json`);
  for (const l of LOCALES) {
    for (const [k, v] of leaves(p[l].HomePage)) assert.equal(get(msgs[l].HomePage, k), expectedFor(l, `HomePage.${k}`, v), `${l}:HomePage.${k}`);
  }
});

test("Kontakt: contactCopy ist ein reines t(), KONTAKT_COPY ohne Text, alle contact.*-Schlüssel in den Messages", () => {
  assert.doesNotMatch(read("src/components/Kontakt/copy.js"), /t\.has\(/);
  const t = (key) => `MSG:${key}`;
  assert.equal(contactCopy(t, "it", "callCta"), "MSG:callCta");
  const p = json(`${TL}/messages-r2-leads.json`);
  for (const l of LOCALES) {
    assert.deepEqual(KONTAKT_COPY[l], {}, `KONTAKT_COPY.${l}`);
    for (const k of Object.keys(p.de.contact)) assert.ok(String(msgs[l].contact[k] ?? "").trim(), `${l}:contact.${k}`);
  }
});

// IT-Anrede: weder Lei- noch voi-Form (QA R4 P2-1/P2-3).
const IT_FORMAL = /(?<![\p{L}])(?:Lei|Le mostriamo|La consigliamo|La preghiamo|il Suo|la Sua|le Sue|i Suoi|casa Sua|Chieda|Preferisce|voi|vostr[aeio]|trovate|scoprite|visitate|potete|avete|siete|[\p{L}]+(?:tevi|teci))(?![\p{L}])/u;

test("Marken- und Header-Texte: eine Quelle (keine Fallback-Tabellen COPY/SHELL_COPY, kein t.has)", () => {
  const marken = read("src/components/MarkenItems/copy.js");
  const shell = read("src/components/Navbar/shellCopy.js");
  for (const [name, src] of [["MarkenItems/copy.js", marken], ["Navbar/shellCopy.js", shell]]) {
    assert.doesNotMatch(src, /export const (?:COPY|SHELL_COPY)\b|t\.has\(|createTranslator/, name);
  }
});

test("jeder c()/tr()-Schlüssel von Shell und Markenseiten liegt in allen 4 Sprachen in den Messages", () => {
  const groups = [
    ["Shell", ["src/components/Navbar/navbar.js", "src/components/Navbar/shellLabels.js", "src/components/Reusable/BareShell.js", "src/components/Reusable/Footer.js"], /\bc\(\s*"([^"]+)"/g],
    ["markenIndex", ["src/components/MarkenClient/Marken.js"], /\btr(?:\.raw)?\(\s*"([^"]+)"/g],
    ["marken", ["src/app/[locale]/ueber-uns/marken/[title]/page.js", "src/components/MarkenItems/collectionDetail.js", "src/components/MarkenItems/markenitems.js"], /\btr(?:\.raw)?\(\s*"([^"]+)"/g],
    ["marken", ["src/components/MarkenItems/markenitems.js"], /\baltFor\([^,]+,\s*"([^"]+)"/g],
  ];
  const missing = [];
  let uses = 0;
  for (const [ns, files, re] of groups) {
    for (const file of files) {
      for (const [, key] of read(file).matchAll(re)) {
        uses++;
        for (const l of LOCALES) if (get(msgs[l], `${ns}.${key}`) === undefined) missing.push(`${l}:${ns}.${key} (${file})`);
      }
    }
  }
  assert.ok(uses > 100, `nur ${uses} Aufrufe gefunden`);
  assert.deepEqual(missing, []);
});

// Runde 4 (P2 Sprache, gesamtwerk P1-3 / recht P1-5): Erwartung bewusst umgedreht.
// IT steht jetzt einheitlich in voi (tools/i18n/patches/r4-p2-it-voi.json); Lei-
// und tu-Formen sind beide ausgeschlossen (IT_FORMAL ohne die voi-Teile = Lei).
const IT_LEI = /(?<![\p{L}])(?:Lei|Le mostriamo|La consigliamo|La preghiamo|il Suo|la Sua|le Sue|i Suoi|casa Sua|Chieda|Preferisce)(?![\p{L}])/u;
const IT_TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te|hai|puoi|vuoi)(?![\p{L}])/u;
test("IT: keine Lei- und keine tu-Form in it.json (seit Runde 4 voi)", () => {
  assert.ok(IT_FORMAL.test("vostro") && IT_TU.test("il tuo progetto"));
  const hits = [...flat.it].filter(([, v]) => typeof v === "string" && (IT_LEI.test(v) || IT_TU.test(v))).map(([k]) => k);
  assert.deepEqual(hits, []);
  assert.match(msgs.it.marken.introShowroom, /^Vi offriamo consulenza su \{brand\} a Lochau/);
  assert.match(msgs.it.Shell.nav.livingIntro, /Vi consigliamo nel nostro showroom a Lochau/);
});

test("Formulare: Laufzeit liest nur forms.* aus den Messages (FORM_TEXT nicht erreichbar)", () => {
  const hook = read("src/components/Forms/useFormText.js");
  assert.doesNotMatch(hook, /FORM_TEXT|formText\(|t\.has\(/);
  assert.match(hook, /useTranslations\("forms"\)/);
  for (const f of ["src/components/Kontakt/KontaktForm.js", "src/components/Forms/FormPrivacyNote.js", "src/app/[locale]/adventsabend/AdventsabendForm.js"]) {
    assert.doesNotMatch(read(f), /\bFORM_TEXT\b|\bformText\(|\bformErrorText\(/, f);
  }
});

test("brandCategory: alle Modul-Schlüssel liegen in den Messages, der Modul-Fallback ist nicht erreichbar", async () => {
  const { BRAND_CATEGORY_COPY } = await import("../../src/lib/marken/brandCategoryCopy.js");
  const used = new Set();
  for (const f of ["src/components/BrandCategory/BrandCategoryPage.js", "src/lib/marken/brandCategoryPage.js"]) {
    for (const [, k] of read(f).matchAll(/\btr\(\s*"([^"]+)"/g)) used.add(k);
  }
  assert.ok(used.size > 20);
  for (const l of LOCALES) {
    for (const k of new Set([...used, ...Object.keys(BRAND_CATEGORY_COPY[l])])) {
      assert.ok(typeof msgs[l].brandCategory?.[k] === "string", `${l}:brandCategory.${k}`);
    }
  }
});

test("forms.*: jeder Schlüssel der r2/r3-Vorschläge liegt in allen 4 Sprachen (lib/forms/i18n.js ohne Texte)", () => {
  const keysOf = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keysOf(v, `${p}${k}.`) : [`${p}${k}`]));
  const keys = new Set([...keysOf(json(`${TL}/messages-r2-leads.json`).de.forms), ...keysOf(json(`${TL}/messages-r3-inhalt.json`).de.forms)]);
  assert.ok(keys.size > 25, `nur ${keys.size} Schlüssel`);
  for (const k of keys) {
    for (const l of LOCALES) assert.equal(typeof get(msgs[l].forms, k), "string", `${l}:forms.${k}`);
  }
  assert.doesNotMatch(read("src/lib/forms/i18n.js"), /Bitte|Please|Veuillez|Controlla|Controlli/);
});

test("gelöschte Waisen bleiben gelöscht (JobsDetails + 43 Schlüssel)", () => {
  const backup = json("qa-screenshots/teamleiter/r4-i18n/geloescht-r4.json");
  for (const l of LOCALES) {
    for (const ns of backup.namespaces) assert.equal(msgs[l][ns], undefined, `${l}:${ns}`);
    for (const k of backup.keys) assert.equal(get(msgs[l], k), undefined, `${l}:${k}`);
  }
});

test("IT: Knöpfe im Imperativ (keine Infinitiv-CTAs für Anruf, Nachricht, Beratung)", () => {
  for (const k of ["contact.writeCta", "contact.callCta", "contact.consultCta", "HomePage.house.call", "landing.call", "shop.atelier.call"]) {
    assert.doesNotMatch(get(msgs.it, k), /^(?:Chiamare|Scrivere|Richiedere)\b/, k);
  }
});

test("orphans-safe: erkennt dynamische Übersetzungspfade", () => {
  assert.ok(hasDynamicCall("t(`rooms.${k}.title`)"));
  assert.ok(hasDynamicCall("t(brand.slug)"));
  assert.ok(!hasDynamicCall('t("hero.title")'));
});
