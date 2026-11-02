// tests/unit/r5-schweiz.test.mjs — R5-schweiz: Schweiz-Hub /de/einkaufen-aus-der-schweiz.
// Run: node --test tests/unit/r5-schweiz.test.mjs
// Kein Netz: EZB und Dateispeicher werden nicht angefasst (nur reine Module).
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

const { EXAMPLE, estimateChf, parseAmount, readForm, LABEL } = await import("../../src/lib/ch/estimate.js");
const { DEFAULT_CONFIG } = await import("../../src/components/Labs/Dreilaender/pricing.js");
const { rateInfoView } = await import("../../src/lib/ch/view.js");
const content = await import("../../src/lib/ch/content.js");
const { findClaims } = await import("../../src/lib/legal/claims.js");

const PAGE = "src/app/[locale]/einkaufen-aus-der-schweiz/page.js";
const ISLAND = "src/components/Schweiz/ChfRechner.js";
const fd = (o) => ({ get: (k) => o[k] ?? null });

test("Beispielrechnung Bericht 18, Tabelle 8.1 (25.000 € brutto, Kurs 0,9227, Fracht 450 €)", () => {
  const r = estimateChf({ grossEur: EXAMPLE.grossEur, freightEur: EXAMPLE.freightEur, rate: EXAMPLE.rate, config: DEFAULT_CONFIG });
  const [a, b] = r.wege;
  assert.equal(r.netEur, 20833.33);
  assert.equal(r.compare, 23067.5); // AT-Bruttopreis in CHF
  // (A) Selbstabholung: netto CHF 19.222,92 (Ratgeber-Korrektur der Rundung), MWST 1.557,06,
  // Transporter CHF 150–250 → ≈ CHF 20.929,97–21.029,97
  assert.equal(a.lines[0].min, 19222.92);
  assert.equal(a.lines[1].min, 1557.06);
  assert.deepEqual([a.lines[2].min, a.lines[2].max], [150, 250]);
  assert.deepEqual([a.total.min, a.total.max], [20929.97, 21029.97]);
  // (B) Lieferung DAP: Bemessung (Ware + Fracht) 19.638,13 → MWST 1.590,69,
  // Gebühr CHF 80–150 zzgl. 8,1 % → ≈ CHF 21.315,30–21.390,97
  assert.equal(b.lines[2].min, 1590.69);
  assert.deepEqual([b.lines[3].min, b.lines[3].max], [86.48, 162.15]);
  assert.deepEqual([b.total.min, b.total.max], [21315.3, 21390.97]);
  // Ersparnis-Grössenordnung laut Bericht 18: A ≈ 9 %, B ≈ 7,5 %
  assert.match(a.belowGross, /^8,8–9,3 %$/);
  assert.match(b.belowGross, /^7,3–7,6 %$/);
  // 1,081 / 1,20 ≈ 0,90 (rechnerisch fix)
  assert.ok(Math.abs(r.taxFactor - 0.9008) < 0.0001);
});

test("Ohne Frachtangabe keine Lieferkosten (kein erfundener Lieferpreis)", () => {
  const r = estimateChf({ grossEur: 25000, rate: 0.9227, config: DEFAULT_CONFIG });
  const b = r.wege[1];
  assert.equal(b.freightIncluded, false);
  assert.equal(b.lines.length, 4);
  // Sichtbar offen statt still weggelassen oder geschätzt.
  assert.deepEqual([b.lines[1].label, b.lines[1].text, b.lines[1].min], ["Lieferkosten", "nicht eingerechnet", 0]);
  assert.equal(b.lines[2].min, 1557.06); // MWST nur auf die Ware
  assert.ok(!b.lines.some((l) => /Ihrer Angabe/.test(l.label)));
});

test("Anzeige: Zuschläge als Schätzung markiert, Texte de-CH, keine verbotenen Wörter", () => {
  const r = estimateChf({ grossEur: 25000, freightEur: 450, rate: 0.9227, config: DEFAULT_CONFIG });
  const text = JSON.stringify(r);
  assert.match(text, /Eigener Transport, falls nötig \(Schätzung\)/);
  assert.match(text, /Verzollungsgebühr der Spedition inkl\. 8,1 % \(Schätzung\)/);
  assert.match(r.wege[0].total.text, /^CHF\s20.929\.97 – 21.029\.97$/);
  assert.doesNotMatch(text, /ß|steuerfrei|Festpreis|Ausfuhrlieferung|verzollt/i);
  assert.equal(LABEL, "Unverbindliche Kostenschätzung");
});

test("Eingaben: Schweizer und österreichische Schreibweisen, Fehler am Feld", () => {
  assert.equal(parseAmount("25’000"), 25000);
  assert.equal(parseAmount("25'000.50"), 25000.5);
  assert.equal(parseAmount("25.000,50"), 25000.5);
  assert.equal(parseAmount("25 000"), 25000);
  assert.ok(Number.isNaN(parseAmount("abc")));
  assert.equal(readForm(fd({ betrag: "25’000", fracht: "" })).ok, true);
  const bad = readForm(fd({ betrag: "", fracht: "x" }));
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.betrag && bad.errors.fracht);
  assert.equal(readForm(fd({ betrag: "3000000" })).ok, false);
  for (const msg of Object.values(bad.errors)) assert.doesNotMatch(msg, /ß/);
});

test("Kurs: Datum, Quelle und Kurs immer sichtbar; ohne Kurs keine Frankenbeträge", () => {
  const ok = rateInfoView({ rate: 0.9227, date: "2026-10-23", source: "ezb", fallback: false, stale: false, ageDays: 0 });
  assert.equal(ok.usable, true);
  assert.equal(ok.rateText, "0.9227");
  assert.equal(ok.dateText, "23.10.2026");
  assert.match(ok.sourceText, /EZB/);
  const none = rateInfoView({ rate: null, date: null, source: "keiner", fallback: true, stale: true });
  assert.equal(none.usable, false);
  assert.equal(none.level, "none");
  assert.doesNotMatch(none.text, /ß/);
});

// --- Inhalt: Belege, [prüfen], Claims ------------------------------------

function renderedTexts() {
  const { HERO, WEGE, EINBAU, ABLAUF, RECHNER, FAQ, BANNER, SHOWROOM, CLOSING, visible } = content;
  const out = [HERO.title, HERO.lead, HERO.eyebrow, BANNER.title, BANNER.text, WEGE.heading, WEGE.text, EINBAU.heading, ABLAUF.heading, RECHNER.heading, RECHNER.text, RECHNER.example, ...RECHNER.notes, FAQ.heading, SHOWROOM.heading, SHOWROOM.text, CLOSING.heading, CLOSING.text];
  for (const f of visible(HERO.facts)) out.push(f.label, f.value);
  for (const w of WEGE.items) {
    out.push(w.title, w.lead, w.fit, ...visible(w.points).map((p) => p.text));
    if (w.zoll) out.push(w.zoll.heading, w.zoll.note, ...visible(w.zoll.items).flatMap((z) => [z.name, z.hours]));
  }
  out.push(...visible(EINBAU.paragraphs).map((p) => p.text));
  for (const s of visible(ABLAUF.steps)) out.push(s.title, s.a, s.b);
  for (const q of visible(FAQ.items)) out.push(q.q, q.a);
  return out;
}

test("Jede gerenderte Aussage hat eine Quelle oder ist als eigene Aussage markiert", () => {
  const { HERO, WEGE, EINBAU, ABLAUF, FAQ, SOURCES, visible } = content;
  const all = [...HERO.facts, ...WEGE.items.flatMap((w) => [...w.points, ...(w.zoll?.items || [])]), ...EINBAU.paragraphs, ...ABLAUF.steps, ...FAQ.items];
  for (const item of visible(all)) {
    const label = item.text || item.q || item.title || item.label || item.name;
    assert.ok(item.own || item.src?.length, `ohne Quelle: ${label}`);
    for (const k of item.src || []) assert.ok(SOURCES[k], `unbekannte Quelle ${k}`);
  }
  // [prüfen]-Stellen existieren intern, werden aber herausgefiltert.
  const pruefen = all.filter((i) => i.pruefen);
  assert.ok(pruefen.length >= 4);
  for (const p of pruefen) assert.ok(!visible(all).includes(p));
  const texts = renderedTexts().join("\n");
  assert.doesNotMatch(texts, /\[prüfen|\[Quelle/);
  assert.doesNotMatch(texts, /Tisis/); // widersprüchliche Zeiten → nicht gerendert
});

test("Texte: de-CH (kein ß), keine verbotenen Versprechen, keine Händler-Behauptungen oder Superlative", () => {
  const texts = renderedTexts();
  const forbidden = /steuerfrei|tax.?free|festpreis|fixpreis|garantiert|wir montieren|montage inklusive|inkl\. montage|abgesichert|offizieller? händler|autorisiert|größte|grösste|nr\. ?1/i;
  for (const t of texts) {
    assert.doesNotMatch(t, /ß/, t);
    assert.doesNotMatch(t, forbidden, t);
    assert.deepEqual(findClaims(t), [], t);
  }
  // Seite und Insel selbst (feste Texte im JSX) ebenso.
  for (const f of [PAGE, ISLAND, "src/components/Schweiz/DraftBanner.js", "src/lib/ch/estimate.js"]) {
    const code = read(f).replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(code, /ß/, f);
    assert.doesNotMatch(code, forbidden, f);
  }
});

// --- Seite: noindex, DE-only, nicht verlinkt, nicht in Sitemap/llms --------

// Runde 3 P5 (seo P1-4): bewusst geändert – der Entwurf bleibt noindex und
// unverlinkt, bekommt aber einen eigenen Canonical (kein hreflang).
// Sprachen-Ausbau 01.11.2026 (bewusst geändert): EN/FR/IT aus content-intl.js, ebenfalls
// noindex; hreflang nur über seoAlternates() (entfällt, solange noindex), DE ohne languages.
test("Seite: noindex,follow, eigener Canonical, hreflang erst mit Freigabe, unbekannte Locales 404, Banner, Insel", () => {
  const src = read(PAGE);
  assert.match(src, /robots: \{ index: false, follow: true \}/);
  assert.match(src, /alternates: \{ canonical: CANONICAL \}/);
  assert.match(src, /const CANONICAL = "https:\/\/platzhirsch\.studio\/de\/einkaufen-aus-der-schweiz"/);
  assert.match(src, /alternates: seoAlternates\(\{ canonical: url, languages: LANGUAGES, robots \}\)/);
  assert.match(src, /if \(locale !== "de" && !t\) notFound\(\)/);
  assert.match(src, /setRequestLocale\(locale\)/);
  assert.match(src, /<DraftBanner/);
  assert.equal(content.BANNER.title, "Entwurf, Freigabe durch Steuerberater/Zollspediteur offen");
  assert.match(src, /<ChfRechner/);
});

test("Nicht in Sitemap, llms.txt oder Navigation verlinkt", () => {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(m?js|jsx|json)$/.test(e.name)) files.push(p);
    }
  };
  for (const d of ["src/app/sitemap.xml", "src/app/sitemap-static.xml", "src/app/llms.txt", "src/lib/seo", "src/components/Navbar", "src/components/Footer", "src/messages"]) {
    if (fs.existsSync(path.join(ROOT, d))) walk(d);
  }
  if (fs.existsSync(path.join(ROOT, "src/lib/navigation.js"))) files.push("src/lib/navigation.js");
  assert.ok(files.length > 5);
  // R6-release: Nur ein Pfad (mit "/") wäre ein Link. Die Liste der DE-only-
  // Segmente in navigation.js (R6-shell-perf, Sprachumschalter) nennt den
  // Slug ohne Schrägstrich und verlinkt nichts.
  // Runde 3 P5: src/lib/seo/footerLinks.js names the path in its DENY list
  // (FOOTER_NOINDEX_PATHS) – it keeps the hub out of the footer, it links nothing.
  for (const f of files.filter((x) => x !== "src/lib/seo/footerLinks.js")) assert.doesNotMatch(read(f), /\/einkaufen-aus-der-schweiz/, f);
  assert.match(read("src/lib/seo/footerLinks.js"), /FOOTER_NOINDEX_PATHS = Object\.freeze\(\[[^\]]*"\/einkaufen-aus-der-schweiz"/);
});

test("Insel: rechnet auf dem Server, kein Rechenkern/zod im Client, eigenes JS klein", () => {
  const island = read(ISLAND);
  assert.match(island, /^"use client";/);
  assert.match(island, /useActionState\(estimateAction/);
  assert.doesNotMatch(island.replace(/^\s*\/\/.*$/gm, ""), /calc|zod|Dreilaender|estimate\.js/);
  const actions = read("src/lib/ch/actions.js");
  assert.match(actions, /^"use server";/);
  assert.match(actions, /ecb\.server\.js/);
  // Grobe Obergrenze: ohne Kommentare und Leerraum < 4.500 Zeichen Quelltext
  // (minifiziert + gzip deutlich unter 3 KB; Messung im Prod-Lauf R5-release).
  const stripped = island.replace(/^\s*\/\/.*$/gm, "").replace(/\s+/g, " ");
  assert.ok(stripped.length < 4500, `Insel-Quelltext ${stripped.length} Zeichen`);
});

// --- QA-Fix (feedback.md P2/P3) -----------------------------------------

test("Fix P2-1: Weg A nennt die Annahme volle Erstattung und die offene Gebühr", () => {
  const r = estimateChf({ grossEur: EXAMPLE.grossEur, rate: EXAMPLE.rate, config: DEFAULT_CONFIG });
  const [a] = r.wege;
  assert.match(a.lines[0].label, /volle Erstattung angenommen/);
  const fee = a.lines.find((l) => /Gebühr für die Erstattung/.test(l.label));
  assert.ok(fee && fee.open && fee.text === "offen, nicht eingerechnet");
  assert.match(a.total.text, /^CHF\s20.929\.97 – 21.029\.97$/); // Summe unverändert
});

test("Fix P2-3/P3: neutrale Quelle, ein Apostroph, keine ESTV ohne Quelle, kein Sparsatz, EZB-Link neues Fenster", () => {
  const ok = rateInfoView({ rate: 0.9227, date: "2026-10-23", source: "ezb", fallback: false, stale: false, ageDays: 0 });
  assert.doesNotMatch(ok.sourceText, /heute/);
  const r = estimateChf({ grossEur: EXAMPLE.grossEur, rate: EXAMPLE.rate, config: DEFAULT_CONFIG });
  const all = [r.grossText, r.netText, r.compareText, ...r.wege.flatMap((w) => [w.total.text, ...w.lines.map((l) => l.text)])].join(" ");
  assert.doesNotMatch(all, /'/);
  assert.match(r.grossText, /25’000\.00/);
  assert.doesNotMatch(content.BANNER.text, /ESTV/);
  const island = read(ISLAND);
  assert.doesNotMatch(island, /belowGross/);
  assert.match(island, /href=\{copy\.sourceUrl\} target="_blank" rel="noopener noreferrer"/);
  assert.match(content.HERO.lead, /erstattet/);
});
