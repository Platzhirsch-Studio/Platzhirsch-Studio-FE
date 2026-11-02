// tests/unit/schweiz-service-sprachen.test.mjs – Sprachen-Ausbau 01.11.2026, Gruppe
// „schweiz-service“: /einkaufen-aus-der-schweiz, /dreilaender-rechner (EN/FR/IT),
// /architekten und /pflege-service (FR/IT neu).
// Prüft: Struktur-Gleichheit je Sprache, Quellen/gesperrte Stellen aus DE,
// Claim-Guard (keine Händler-Aussage als fester Text), Typografie FR/IT,
// Title ≤ 60 / Description 120–150, hreflang reziprok, Steuer-Hinweis in jeder
// Sprache, keine Texte in src/messages (Client-Budget).
// Run: node --test tests/unit/schweiz-service-sprachen.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Next-artige Auflösung: "@/…" und Importe ohne Endung (calc.js → "./rules").
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const file = path.join(ROOT, "src", specifier.slice(2));
      return nextResolve(pathToFileURL(fs.existsSync(file) ? file : `${file}.js`).href, context);
    }
    if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL?.startsWith("file:")) {
      const file = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (fs.existsSync(`${file}.js`)) return nextResolve(pathToFileURL(`${file}.js`).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const ch = await import("../../src/lib/ch/content.js");
const { chCopy, mergeText, CH_INTL_LOCALES } = await import("../../src/lib/ch/content-intl.js");
const { estimateChf, readForm, EST_DE } = await import("../../src/lib/ch/estimate.js");
const { rateInfoView } = await import("../../src/lib/ch/view.js");
const { DEFAULT_CONFIG } = await import("../../src/components/Labs/Dreilaender/pricing.js");
const { calculate, CALC_TEXT_DE, CALC_SOURCE_KEYS } = await import("../../src/components/Labs/Dreilaender/calc.js");
const { rateNotice } = await import("../../src/components/Labs/Dreilaender/rate.js");
const { COUNTRIES } = await import("../../src/components/Labs/Dreilaender/rules.js");
const { PLACES } = await import("../../src/components/Labs/Dreilaender/geo.js");
const { UI_DE, CALC_UI_DE, MAP_DE, localCountries, localPlaces } = await import("../../src/components/Labs/Dreilaender/i18n.js");
const { dreilaenderCopy, INTL_LOCALES } = await import("../../src/lib/dreilaender/copy-intl.js");
const { architektenCopy } = await import("../../src/lib/architekten/copy.js");
const { ARCH_QUICK_TEXT } = await import("../../src/components/Architekten/quickLead.js");
const { pflegeCopyAll, materialCopyAll } = await import("../../src/lib/service/pflege/copy-intl.js");
const { pflegeCopy } = await import("../../src/lib/service/pflege/copy.js");
const { MATERIALS } = await import("../../src/lib/service/pflege/materials.js");
const { findClaims, dealerStatement } = await import("../../src/lib/legal/claims.js");

const NEW = ["en", "fr", "it"];
const FRIT = ["fr", "it"];
const NNBSP = " ";
const NBSP = " ";

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k])]));
  return typeof value;
}
const withSuffix = (t) => (t.length + 27 <= 60 ? t.length + 27 : t.length + 14);

// Typische deutsche Wörter, die in einer EN/FR/IT-Fassung nicht stehen dürfen
// (Eigennamen wie Lustenau/Au, QuickZoll, „Meine Stücke & Pflege“ ausgenommen).
const GERMAN = /\b(und|oder|nicht|Sie|Ihre?n?|werden|bei|für|Lieferung|Möbel|Bitte|Steuer|Rechnung|Ausfuhr|Einfuhr|Gebühr|Spedition|Richtwert|Termin|Anfrage)\b/;

function assertFrenchTypography(all, label) {
  for (const s of all) {
    assert.doesNotMatch(s, / [;!?]/, `${label}: normales Leerzeichen vor ; ! ? – ${s}`);
    assert.doesNotMatch(s, / :(\s|$)/, `${label}: normales Leerzeichen vor : – ${s}`);
    assert.doesNotMatch(s, /« | »/, `${label}: « » ohne geschütztes Leerzeichen – ${s}`);
  }
  assert.ok(all.some((s) => s.includes(`${NBSP}:`) || s.includes(`${NNBSP}?`)), `${label}: FR-Typografie angewendet`);
}

// ---------------------------------------------------------------------------
// Schweiz-Hub

test("Schweiz-Hub: EN/FR/IT mit deutscher Struktur, Quellen und gesperrten Stellen", () => {
  assert.deepEqual([...CH_INTL_LOCALES], NEW);
  assert.equal(chCopy("de"), null);
  for (const l of NEW) {
    const c = chCopy(l);
    for (const key of ["BANNER", "HERO", "WEGE", "EINBAU", "ABLAUF", "RECHNER", "FAQ", "SHOWROOM", "CLOSING", "SOURCES"]) {
      assert.deepEqual(shape(c[key]), shape(ch[key]), `${l} ${key}`);
    }
    // Quellen und Sperren stammen unverändert aus DE.
    assert.deepEqual(c.WEGE.items.map((w) => w.points.map((p) => [p.src, p.pruefen])), ch.WEGE.items.map((w) => w.points.map((p) => [p.src, p.pruefen])), l);
    assert.deepEqual(c.FAQ.items.map((i) => i.src || i.pruefen), ch.FAQ.items.map((i) => i.src || i.pruefen), l);
    for (const [k, s] of Object.entries(c.SOURCES)) assert.equal(s.url, ch.SOURCES[k].url, `${l} ${k}`);
    // Sichtbare Texte sind übersetzt (keine deutsche Zeile übrig).
    const visibleTexts = [
      c.BANNER, c.HERO.title, c.HERO.lead, ...ch.visible(c.HERO.facts), c.WEGE.heading, c.WEGE.text,
      ...c.WEGE.items.flatMap((w) => [w.title, w.lead, w.fit, ...ch.visible(w.points).map((p) => p.text), ...(w.zoll ? [w.zoll.heading, w.zoll.note, ...ch.visible(w.zoll.items).map((z) => z.hours)] : [])]),
      ...ch.visible(c.EINBAU.paragraphs).map((p) => p.text), ...ch.visible(c.ABLAUF.steps), c.RECHNER, ...ch.visible(c.FAQ.items),
      c.SHOWROOM, c.CLOSING, ...Object.values(c.SOURCES).map((s) => s.label), c.UI, c.RECHNER_COPY, c.EST, c.META, c.PROCESS,
    ];
    for (const s of strings(visibleTexts)) {
      if (/^https?:/.test(s) || s.startsWith("/")) continue;
      assert.doesNotMatch(s, GERMAN, `${l}: deutsch? ${s}`);
    }
  }
});

test("Schweiz-Hub: Hinweis keine Steuer-/Zoll-/Rechtsberatung und Entwurf in jeder Sprache", () => {
  const re = { en: /not tax, customs or legal advice/, fr: /ne constitue pas un conseil fiscal, douanier ou juridique/, it: /non costituisce consulenza fiscale, doganale o legale/ };
  for (const l of NEW) {
    const c = chCopy(l);
    assert.match(c.BANNER.text, re[l], l);
    assert.match(c.BANNER.title, /Draft|Projet|Bozza/, l);
    // Steuerkern wörtlich: 8,1 % / 20 % / 75 € / sechs Monate / CHF 150 überall vorhanden.
    const all = strings(c).join(" ");
    for (const n of ["8,1", "20", "75", "150", "U34"]) assert.ok(all.includes(n) || all.includes(n.replace(",", ".")), `${l}: ${n}`);
  }
});

test("Schweiz-Hub: Claim-Guard, keine Händler-Aussage, keine Superlative oder Sparversprechen", () => {
  for (const l of NEW) {
    const all = strings(chCopy(l));
    const hits = all.flatMap((t) => findClaims(t, { locale: l }));
    assert.deepEqual(hits, [], `${l}: ${JSON.stringify(hits)}`);
    for (const t of all) {
      assert.doesNotMatch(t, /\b(dealer|revendeur|rivenditore|authori[sz]ed|officiel|ufficiale|best|meilleur|migliore|leading|leader)\b/i, `${l}: ${t}`);
      assert.doesNotMatch(t, /\b(save|économis|risparmi)/i, `${l}: kein Sparversprechen – ${t}`);
    }
  }
});

test("Schweiz-Hub: FR-Typografie, IT-Anführungszeichen «» ohne Leerzeichen", () => {
  const fr = strings(chCopy("fr")).filter((s) => !/^https?:/.test(s));
  assertFrenchTypography(fr, "ch fr");
  // Lektorat 01.11.2026: auch vor % und € geschützt (vorher 20 normale Leerzeichen).
  for (const s of fr) assert.doesNotMatch(s, /\d (%|€)/, `ch fr: ${s}`);
  for (const s of strings(chCopy("it"))) assert.doesNotMatch(s, /« | »|„|“/, `ch it: ${s}`);
});

// Lektorat 01.11.2026: Begriffe wie in src/messages (Navigation/Shop) und Auslassungspunkte ohne Leerzeichen.
test("Lektorat: Merkliste/Termin-Begriffe wie auf der übrigen Seite, „…“ ohne Leerzeichen davor", () => {
  const msg = (l) => JSON.parse(read(`src/messages/${l}.json`));
  const all = (l) => strings([chCopy(l), dreilaenderCopy(l), architektenCopy(l), pflegeCopyAll(l), materialCopyAll(l)]);
  for (const l of FRIT) for (const s of all(l)) assert.doesNotMatch(s, / …/, `${l}: ${s}`);
  for (const s of strings([chCopy("en"), dreilaenderCopy("en")])) assert.doesNotMatch(s, / …|Request an appointment/, `en: ${s}`);
  assert.match(JSON.stringify(msg("fr")), /Liste de souhaits/);
  assert.match(architektenCopy("fr").MUSTER.merkliste, /liste de souhaits/);
  assert.match(architektenCopy("it").MUSTER.merkliste, /lista dei desideri/);
  for (const s of all("fr")) assert.doesNotMatch(s, /liste d’envies|bureaux d’études/, s);
});

test("Schweiz-Hub: SEO-Texte Title ≤ 60, Description 120–150", () => {
  for (const l of NEW) {
    const { title, description } = chCopy(l).META;
    assert.ok(`${title} | Platzhirsch Home Living`.length <= 60, `${l}: ${title}`);
    assert.ok(description.length >= 120 && description.length <= 150, `${l}: ${description.length}`);
  }
});

test("Schweiz-Hub: Rechnung mit EN/FR/IT-Beschriftungen, gleiche Zahlen, Fehler in der Sprache", () => {
  const base = estimateChf({ grossEur: 25000, rate: 0.9227, config: DEFAULT_CONFIG });
  for (const l of NEW) {
    const t = chCopy(l);
    assert.deepEqual(shape(t.EST), shape(EST_DE), l);
    const r = estimateChf({ grossEur: 25000, rate: 0.9227, config: DEFAULT_CONFIG, text: t.EST });
    assert.deepEqual(r.wege.map((w) => w.total), base.wege.map((w) => w.total), l);
    assert.equal(r.wege[0].title, t.EST.wayA);
    for (const line of r.wege.flatMap((w) => w.lines)) assert.doesNotMatch(`${line.label} ${line.text}`, GERMAN, `${l}: ${line.label}`);
    const bad = readForm({ get: (k) => (k === "betrag" ? "" : null) }, t.EST);
    assert.equal(bad.errors.betrag, t.EST.errors.betragEmpty);
    const view = rateInfoView({ rate: 0.93, date: "2026-10-30", source: "ezb", fallback: false, stale: false, ageDays: 0 }, t.VIEW);
    assert.equal(view.sourceText, t.VIEW.sources.ezb);
    assert.doesNotMatch(rateInfoView({ rate: null }, t.VIEW).text, GERMAN, l);
  }
});

test("Schweiz-Hub: Server Function liest die Sprache aus dem Formular, Insel schickt sie mit", () => {
  assert.match(read("src/lib/ch/actions.js"), /chCopy\(String\(formData\?\.get\?\.\("lang"\)/);
  assert.match(read("src/components/Schweiz/ChfRechner.js"), /<input type="hidden" name="lang" value=\{copy\.lang\} \/>/);
  const page = read("src/app/[locale]/einkaufen-aus-der-schweiz/page.js");
  assert.match(page, /lang=\{HTML_LANG\[locale\] \|\| "de-CH"\}/);
  assert.match(page, /if \(locale !== "de" && !t\) notFound\(\)/);
});

test("mergeText: Arrays nach Index, null behält den deutschen Eintrag", () => {
  assert.deepEqual(mergeText([{ a: "x", src: ["s"] }, { a: "y", pruefen: "p" }], [{ a: "X" }, null]), [{ a: "X", src: ["s"] }, { a: "y", pruefen: "p" }]);
});

// ---------------------------------------------------------------------------
// Dreiländer-Rechner

test("Dreiländer: EN/FR/IT vollständig, gleiche Schlüssel wie die deutschen Texte", () => {
  assert.deepEqual([...INTL_LOCALES], NEW);
  assert.equal(dreilaenderCopy("de"), null);
  for (const l of NEW) {
    const c = dreilaenderCopy(l);
    assert.deepEqual(Object.keys(c.client.ui).sort(), Object.keys(UI_DE).sort(), `${l} ui`);
    assert.deepEqual(Object.keys(c.client.calcUi).sort(), Object.keys(CALC_UI_DE).sort(), `${l} calcUi`);
    assert.deepEqual(Object.keys(c.client.map).sort(), Object.keys(MAP_DE).sort(), `${l} map`);
    assert.deepEqual(shape({ ...c.client.calc, sources: {} }), shape({ ...CALC_TEXT_DE }), `${l} calc`);
    assert.deepEqual(Object.keys(c.client.calc.sources).sort(), [...CALC_SOURCE_KEYS].sort(), `${l} Quellenzeilen`);
    for (const code of Object.keys(COUNTRIES)) {
      for (const k of ["steuer", "lieferung", "montage"]) assert.equal(c.client.countries[code][k].length, COUNTRIES[code][k].length, `${l} ${code} ${k}`);
    }
    assert.deepEqual(Object.keys(c.client.places).sort(), PLACES.map((p) => p.id).sort(), l);
    // Kunden sehen keine deutschen Texte.
    for (const s of strings({ ...c, client: { ...c.client, calc: { ...c.client.calc, sources: Object.values(c.client.calc.sources) } } })) {
      assert.doesNotMatch(s, GERMAN, `${l}: ${s}`);
    }
  }
});

test("Dreiländer: Rechnung in der Sprache – gleiche Beträge, keine deutschen Zeilen, Hinweis keine Steuerberatung", () => {
  const input = { grossAt: 25000, rate: 0.9227, includeDelivery: true };
  for (const country of ["CH", "FL", "DE", "AT"]) {
    const de = calculate({ ...input, country }, DEFAULT_CONFIG);
    for (const l of NEW) {
      const r = calculate({ ...input, country }, DEFAULT_CONFIG, dreilaenderCopy(l).client.calc);
      assert.deepEqual(r.options.map((o) => o.total), de.options.map((o) => o.total), `${l} ${country}`);
      const txt = strings(r.options.map((o) => ({ ...o, lines: (o.lines || []).map((x) => ({ label: x.label, source: x.source })) })));
      for (const s of txt) assert.doesNotMatch(s, GERMAN, `${l} ${country}: ${s}`);
    }
  }
  const re = { en: /not tax or legal advice/, fr: /ne constitue pas un conseil fiscal ou juridique/, it: /nessuna consulenza fiscale o legale/ };
  for (const l of NEW) assert.match(dreilaenderCopy(l).page.disclaimer, re[l], l);
});

test("Dreiländer: Kursnotiz in der Sprache für alle Stufen", () => {
  const fmt = { date: (d) => d, rate: (r) => String(r) };
  const cases = [{ rate: null }, { rate: 0.93, date: "2026-10-30", fallback: false, stale: false, ageDays: 0 }, { rate: 0.93, date: "2026-10-20", fallback: true, stale: true, ageDays: 10 }, { rate: 0.93, date: "2026-10-29", fallback: true, stale: false, ageDays: 1 }];
  for (const l of NEW) {
    const levels = cases.map((c) => rateNotice(c, fmt, dreilaenderCopy(l).client.rate));
    assert.deepEqual(levels.map((n) => n.level), cases.map((c) => rateNotice(c, fmt).level), l);
    for (const n of levels) assert.doesNotMatch(`${n.label} ${n.text}`, GERMAN, `${l}: ${n.text}`);
    assert.doesNotMatch(levels[2].text, /\{/, l);
  }
});

test("Dreiländer: lokalisierte Länder/Orte behalten Rechenwerte und Koordinaten", () => {
  for (const l of NEW) {
    const client = dreilaenderCopy(l).client;
    const cs = localCountries(client);
    for (const code of Object.keys(COUNTRIES)) assert.equal(cs[code].vat, COUNTRIES[code].vat, `${l} ${code}`);
    const ps = localPlaces(client);
    assert.deepEqual(ps.map((p) => [p.id, p.xy, p.country]), PLACES.map((p) => [p.id, p.xy, p.country]), l);
  }
  assert.equal(localPlaces(null).find((p) => p.id === "lindau").labelLong, "ca. 5 Minuten");
});

test("Dreiländer: SEO je Sprache – Title ≤ 60, Description 120–150, hreflang reziprok", () => {
  for (const l of NEW) {
    const { title, description } = dreilaenderCopy(l).meta;
    assert.ok(withSuffix(title) <= 60, `${l}: ${title}`);
    assert.ok(description.length >= 120 && description.length <= 150, `${l}: ${description.length}`);
  }
  const seo = read("src/lib/dreilaender/seo.js");
  assert.match(seo, /en: pageUrl\("en"\), fr: pageUrl\("fr"\), it: pageUrl\("it"\), "x-default": de/);
  const page = read("src/app/[locale]/dreilaender-rechner/page.js");
  assert.match(page, /if \(locale === "de"\) return \{ \.\.\.DE_META, alternates: \{ canonical: DE_META\.alternates\?\.canonical, languages: dreilaenderLanguages\(\) \} \}/);
  assert.match(page, /if \(locale !== "de" && !copy\) notFound\(\)/);
});

test("Dreiländer: FR-Typografie (auch % und €), IT ohne deutsche Anführungszeichen", () => {
  const fr = strings(dreilaenderCopy("fr")).filter((s) => !/^https?:/.test(s));
  assertFrenchTypography(fr, "dl fr");
  for (const s of fr) assert.doesNotMatch(s, /\d (%|€)/, `dl fr: ${s}`);
  for (const s of strings(dreilaenderCopy("it"))) assert.doesNotMatch(s, /„|“|« | »/, `dl it: ${s}`);
});

// ---------------------------------------------------------------------------
// Architekten und Pflege-Service

test("Architekten: FR/IT mit gleicher Struktur wie EN, QUICK wie die Kurz-Anfrage", () => {
  const en = architektenCopy("en");
  for (const l of FRIT) {
    const { QUICK, ...rest } = architektenCopy(l);
    assert.deepEqual(shape(rest), shape(en), l);
    assert.deepEqual(shape(QUICK), shape(ARCH_QUICK_TEXT.en), l);
    for (const s of strings(architektenCopy(l))) assert.doesNotMatch(s, GERMAN, `${l}: ${s}`);
  }
  assert.match(read("src/components/Architekten/ArchitektenForm.js"), /const T = copy\.QUICK \|\| archQuickText\(locale\)/);
});

test("Architekten: Claim-Guard und Händler-Satz nur aus dem Register", () => {
  for (const l of FRIT) {
    const all = strings(architektenCopy(l));
    assert.deepEqual(all.flatMap((t) => findClaims(t, { locale: l })), [], l);
    for (const t of all) assert.doesNotMatch(t, /revendeur|rivenditore|officiel|ufficiale|meilleur|migliore/i, t);
    assert.equal(architektenCopy(l).ANGEBOT.items.find((i) => i.id === "muster").dealerBrand, "ezarri");
  }
  assert.equal(dealerStatement("ezarri", "fr"), "Platzhirsch Home Living est revendeur Ezarri.");
  assert.equal(dealerStatement("ezarri", "it"), "Platzhirsch Home Living è rivenditore Ezarri.");
});

test("Architekten/Pflege: FR-Typografie, SEO-Längen, hreflang mit allen vier Sprachen", () => {
  assertFrenchTypography(strings(architektenCopy("fr")), "arch fr");
  assertFrenchTypography(strings([pflegeCopyAll("fr"), materialCopyAll("fr")]), "pflege fr");
  for (const l of FRIT) {
    const a = architektenCopy(l).META;
    assert.ok(a.title.length <= 60, `arch ${l}: ${a.title}`);
    assert.ok(a.description.length >= 120 && a.description.length <= 150, `arch ${l}: ${a.description.length}`);
    const p = pflegeCopyAll(l).META;
    assert.ok(withSuffix(p.title) <= 60, `pflege ${l}: ${p.title}`);
    assert.ok(p.description.length >= 120 && p.description.length <= 150, `pflege ${l}: ${p.description.length}`);
  }
  assert.match(read("src/lib/architekten/seo.js"), /en: pageUrl\("en"\), fr: pageUrl\("fr"\), it: pageUrl\("it"\), "x-default": de/);
  assert.match(read("src/lib/service/pflege/schema.js"), /fr: pageUrl\("fr"\), it: pageUrl\("it"\), "x-default": pageUrl\("de"\)/);
});

test("Pflege: FR/IT wie EN gebaut, Materialien vollständig, keine Preise/Garantie-Zusagen, Backoffice deutsch", () => {
  const en = pflegeCopy("en");
  for (const l of FRIT) {
    const c = pflegeCopyAll(l);
    assert.equal(c.locale, l);
    assert.deepEqual(shape(c), shape(en), l);
    assert.deepEqual(shape(materialCopyAll(l)), shape(MATERIALS.en), l);
    assert.deepEqual(c.FORM.backoffice, en.FORM.backoffice);
    const all = strings({ ...c, FORM: { ...c.FORM, backoffice: null } }).concat(strings(materialCopyAll(l)));
    for (const s of all) {
      assert.doesNotMatch(s, GERMAN, `${l}: ${s}`);
      assert.doesNotMatch(s, /!/, `${l}: kein Ausrufezeichen – ${s}`);
      assert.doesNotMatch(s, /\d\s?€|€\s?\d|CHF\s?\d/, `${l}: kein Preis – ${s}`);
      assert.doesNotMatch(s, /garanti(e|t) (est|reste) maintenue|garanzia resta valida\.|garantiert|garantit|garantisce/i, `${l}: keine Garantie-Zusage – ${s}`);
    }
  }
  // Client bekommt FORM als Prop – FR/IT nicht im Client-Bundle.
  assert.match(read("src/components/Service/Pflege/PflegePage.js"), /<PflegeAnfrage locale=\{locale\} copy=\{c\.FORM\} \/>/);
  assert.doesNotMatch(read("src/components/Service/Pflege/PflegeAnfrage.js"), /from "[^"]*copy-intl"/);
});

test("Client-Budget: keine neuen Texte in src/messages, FR/IT-Module nur serverseitig", () => {
  for (const f of ["src/lib/ch/content-intl.js", "src/lib/dreilaender/copy-intl.js", "src/lib/service/pflege/copy-intl.js", "src/lib/architekten/copy-intl.js"]) assert.doesNotMatch(read(f), /^"use client"/, f);
  for (const f of ["src/components/Labs/Dreilaender/DreilaenderClient.js", "src/components/Labs/Dreilaender/PriceCalculator.js", "src/components/Labs/Dreilaender/DreilaenderMap.js", "src/components/Schweiz/ChfRechner.js", "src/components/Service/Pflege/PflegeAnfrage.js"]) {
    assert.doesNotMatch(read(f), /from "[^"]*(copy-intl|content-intl)"/, `${f} importiert keine Sprachmodule`);
  }
});
