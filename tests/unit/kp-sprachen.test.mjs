// Küchenplaner auf Englisch, Französisch, Italienisch (01.11.2026):
// Parität der Wörterbücher, Abdeckung aller Oberflächentexte und aller Meldungen
// der Rechenmodule, Typografie, Claim-Regeln, Titel-/Description-Längen und das
// Budget des Client-Wörterbuchs. Reine Dateien und Rechenmodule, kein Server.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { KP_ROWS, kpClientCopy, kpServerT, kpUiDict } from "../../src/lib/kuechenplaner/copy/index.js";
import { createKpT, compileCopy, kpIdentity, localNumbers } from "../../src/lib/kuechenplaner/i18n.js";
import { kpPageCopy } from "../../src/lib/kuechenplaner/content.js";
import { MODULES, PRICE_TABLE, OPENINGS } from "../../src/components/Labs/Kuechenplaner/catalog.js";
import { defaultPlan, withAutoRuns, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { priceRange, summaryLines, wallLabel } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";
import { compareRows, moduleDiff, planMetrics } from "../../src/lib/kuechenplaner/compare.js";
import { validateFree } from "../../src/lib/kuechenplaner/room.js";
import { eckdatenLines } from "../../src/lib/kuechenplaner/eckdaten.js";
import { describeRequestError } from "../../src/components/Labs/Kuechenplaner/requestErrors.js";
import { handoffSummary, handoffProdukt } from "../../src/lib/kuechenplaner/handoff.js";
import { planMailHref } from "../../src/lib/kuechenplaner/planMail.js";
import { clampDescription, fitTitle, titleWithSuffix } from "../../src/lib/seo/pageMetadata.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["en", "fr", "it"];
const ALL_ROWS = [...KP_ROWS.ui, ...KP_ROWS.meldungen, ...KP_ROWS.druck, ...KP_ROWS.fotoansicht];
const phs = (s) => [...String(s).matchAll(/\{([A-Za-z]\w*)\}/g)].map((m) => m[1]).sort().join(",");

test("Wörterbücher: jede Zeile vierfach, deutsche Schlüssel eindeutig, gleiche Platzhalter", () => {
  const seen = new Set();
  for (const r of ALL_ROWS) {
    assert.equal(r.length, 4, `4 Spalten: ${r[0]}`);
    for (const s of r) assert.ok(typeof s === "string" && s.trim(), `leer: ${r[0]}`);
    assert.ok(!seen.has(r[0]), `doppelt: ${r[0]}`);
    seen.add(r[0]);
    for (let i = 1; i < 4; i++) assert.equal(phs(r[i]), phs(r[0]), `Platzhalter ${["", "EN", "FR", "IT"][i]}: ${r[0]}`);
  }
});

test("Seitentexte: gleiche Struktur in DE/EN/FR/IT", () => {
  const shape = (o) => (Array.isArray(o) ? `[${o.length}:${o.map(shape).join("|")}]` : o && typeof o === "object" ? `{${Object.keys(o).sort().map((k) => `${k}:${shape(o[k])}`).join(",")}}` : typeof o);
  const de = kpPageCopy("de");
  for (const l of LOCALES) {
    const c = kpPageCopy(l);
    assert.equal(shape({ ...c, guide: { ...c.guide, links: [] }, crumbs: {} }), shape({ ...de, guide: { ...de.guide, links: [] }, crumbs: {} }), l);
    assert.equal(c.guide.faq.length, 4);
    assert.equal(c.guide.steps.length, 5);
    // Ratgeber gibt es nur auf Deutsch (EN/FR/IT: 404 im Proxy) – nicht verlinken.
    assert.ok(!c.guide.links.some((x) => x.key === "ratgeber"), `${l}: kein Ratgeber-Link`);
  }
  assert.equal(kpPageCopy("es"), null);
});

test("SEO: Title ≤ 60, Description 120–149 (ganz, ohne Kürzung) in jeder Sprache", () => {
  for (const l of ["de", ...LOCALES]) {
    const m = kpPageCopy(l).meta;
    const title = l === "de" ? fitTitle(m.title) : titleWithSuffix(m.title);
    assert.ok(title.length <= 60, `${l} title ${title.length}: ${title}`);
    assert.ok(m.description.length >= 120 && m.description.length < 150, `${l} description ${m.description.length}`);
    const plain = (s) => s.replace(/[  ]/g, " ");
    assert.equal(plain(clampDescription(m.description)), plain(m.description), `${l}: Description bleibt ungekürzt`);
  }
  const seo = read("src/lib/kuechenplaner/seo.js");
  assert.match(seo, /canonical: url, languages: kpLanguages\(\)/);
  assert.match(seo, /en: pageUrl\("en"\), fr: pageUrl\("fr"\), it: pageUrl\("it"\), "x-default": de/);
});

// ---- Abdeckung der Oberfläche: alle wörtlichen tr("…")/t("…")-Schlüssel ----
const require = createRequire(import.meta.url);
const { parse } = require("@babel/parser");
function literalKeys(file) {
  const ast = parse(read(file), { sourceType: "module", plugins: ["jsx"] });
  const out = [];
  const lits = (n) => {
    if (!n) return;
    if (n.type === "StringLiteral") out.push(n.value);
    else if (n.type === "TemplateLiteral" && !n.expressions.length) out.push(n.quasis[0].value.cooked);
    else if (n.type === "ConditionalExpression") { lits(n.consequent); lits(n.alternate); }
    else if (n.type === "LogicalExpression") { lits(n.left); lits(n.right); }
  };
  const visit = (n) => {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "CallExpression" && n.callee.type === "Identifier" && (n.callee.name === "tr" || n.callee.name === "t") && n.arguments.length) lits(n.arguments[0]);
    for (const k of Object.keys(n)) {
      if (k === "loc") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object" && v.type) visit(v);
    }
  };
  visit(ast.program);
  return out;
}
const UI_FILES = ["BomTable", "CheckPanel", "Drawings", "Fotoansicht", "GeraeteWahl", "KuechenplanerApp", "KuechenplanerPoster", "PlanEditor", "ResultPanel", "VariantCompare", "Viewer"].map((f) => `src/components/Labs/Kuechenplaner/${f}.js`);

test("Oberfläche: jeder Text im Code steht in allen Wörterbüchern", () => {
  const keys = new Set(ALL_ROWS.map((r) => r[0]));
  const files = [...UI_FILES, "src/lib/kuechenplaner/handoff.js", "src/lib/kuechenplaner/planMail.js", "src/app/[locale]/kuechenplaner/druck/page.js"];
  const missing = [];
  for (const f of files) for (const k of literalKeys(f)) if (!keys.has(k)) missing.push(`${path.basename(f)}: ${k}`);
  assert.deepEqual(missing, []);
});

test("Katalog: alle Bezeichnungen übersetzt", () => {
  const cat = read("src/components/Labs/Kuechenplaner/catalog.js");
  const labels = new Set();
  for (const m of cat.matchAll(/(?:label|name|hint|tagline|note|group): "([^"]+)"/g)) labels.add(m[1]);
  for (const m of Object.values(MODULES)) for (const o of Object.values(m.opts || {})) for (const v of Object.values(o.values)) labels.add(v);
  labels.delete("[Preis vom Inhaber festzulegen]");
  for (const l of LOCALES) {
    const t = kpServerT(l);
    const miss = [...labels].filter((s) => t.strict(s) === null);
    assert.deepEqual(miss, [], l);
  }
});

// ---- Abdeckung der Meldungen: Beispielplanungen durchrechnen ----
function samplePlans() {
  const out = [];
  for (const s of ["zeile", "l", "u", "zweizeilig", "insel", "halbinsel", "frei"]) {
    const p = defaultPlan(s);
    out.push(p);
    out.push(switchRaster(p, 55));
    // eng, mit Öffnungen, Dachschräge, Abzügen und Insel-Gerät
    const ops = Object.entries(OPENINGS).map(([k, d], i) => ({ k, w: "a", x: 20 + i * 45, b: d.b, y: d.y, h: d.h, ...(k === "tuer" ? { s: "r" } : {}) }));
    out.push(withAutoRuns({ ...p, walls: { ...p.walls, a: 260, b: 200, c: 200 }, h: 240, room: { ...p.room, op: ops, slope: { w: "a", k: 90, d: 40 } }, ergo: { ...p.ergo, body: 205, plinth: 6, upGap: 70 }, island: { ...p.island, aisle: 90, over: 40, fn: "kochfeld", x: 150 }, led: true, pend: 3 }));
    out.push({ ...p, wallCabinets: false, ergo: { ...p.ergo, body: 140, plinth: 20, carcass: 78 }, island: { ...p.island, fn: "spuele", bar: true }, top: "holz", topT: 60 });
  }
  // Module mit Optionen und Geräten, die Sondermeldungen auslösen
  const u = defaultPlan("u");
  out.push({ ...u, runs: { ...u.runs, a: [{ t: "eckschrank", w: 90, o: "mk" }, { t: "kochfeld", w: 60, o: "an" }, { t: "kuehlschrank", w: 60 }, { t: "sidebyside", w: 91 }, { t: "weinkuehler", w: 60 }, { t: "unterschrank", w: 60, g: 30 }, { t: "hochschrank", w: 60, o: "hl" }], b: [{ t: "kochfeld", w: 60, o: "kgaw" }, { t: "geschirrspueler", w: 60 }], c: [{ t: "spuele", w: 90, o: "b2" }, { t: "kochfeld", w: 60, o: "ai" }] } });
  out.push({ ...u, up: { a: { m: "frei", r: [{ t: "haengeschrank", w: 60 }, { t: "wandbord", w: 60 }, { t: "luecke", w: 30 }] } } });
  return out;
}

function texts(plan) {
  const k = buildKitchen(plan);
  const c = runChecks(plan, k);
  const out = [...c.items.map((i) => i.text), ...k.warnings, ...summaryLines(plan)];
  for (const r of buildBom(plan, k).rows) out.push(r.label, r.detail, r.size, r.wall, r.note, r.unit);
  for (const w of ["a", "b", "c", "i"]) out.push(wallLabel(plan, w));
  const price = priceRange(plan, { ...PRICE_TABLE, placeholder: false }, k);
  out.push(price.label, ...price.items.map((i) => i.label));
  return { out: out.filter(Boolean), metrics: planMetrics(plan, k, c, price) };
}

test("Meldungen der Rechenmodule: in EN/FR/IT vollständig übersetzt", () => {
  const plans = samplePlans();
  const all = new Set();
  const metrics = [];
  for (const p of plans) {
    const { out, metrics: m } = texts(p);
    out.forEach((s) => all.add(s));
    metrics.push(m);
  }
  for (let i = 1; i < metrics.length; i++) {
    for (const r of compareRows(metrics[i - 1], metrics[i])) [r.label, r.group, r.a, r.b, r.delta].filter(Boolean).forEach((s) => all.add(s));
    const d = moduleDiff(metrics[i - 1], metrics[i]);
    [...d.onlyA, ...d.onlyB].forEach((s) => all.add(s));
  }
  validateFree([{ l: 40, a: 90 }, { l: 40, a: 90 }]).errors.forEach((e) => all.add(e));
  validateFree([{ l: 500, a: 45 }, { l: 500, a: 45 }, { l: 500, a: 45 }]).errors.forEach((e) => all.add(e));
  eckdatenLines({ projekt: "renovierung", zeitraum: "3-6", geraete: ["gaggenau", "bora"], unterlagen: true }).forEach((s) => all.add(s));
  for (const st of [429, 413, 400, 504, 500, 0]) all.add(describeRequestError({ status: st }).message);
  all.add(describeRequestError({ network: true }).message);
  assert.ok(all.size > 150, `genug Beispieltexte: ${all.size}`);
  for (const l of LOCALES) {
    const t = kpServerT(l);
    const miss = [...all].filter((s) => t.strict(s) === null);
    assert.deepEqual(miss, [], `${l}: ${miss.length} unübersetzt`);
  }
});

test("Übersetzer: Platzhalter, Zahlenformat, Fallback, Deutsch unverändert", () => {
  const en = kpServerT("en");
  const fr = kpServerT("fr");
  const it = kpServerT("it");
  assert.equal(en("Wand {w}", { w: "B" }), "Wall B");
  assert.equal(en("frei {n} cm", { n: 41.25 }), "41.25 cm free");
  assert.equal(fr("frei {n} cm", { n: 41.25 }), "41,25 cm libres");
  assert.equal(en("Unterschrank (Wand A, Pos. 2) steht vor der Tür."), "Base unit (wall A, pos. 2) stands in front of the door.".replace("wall A", "Wall A"));
  assert.equal(it("Insel: Module sind 12 cm zu lang."), "Isola: i moduli sono 12 cm troppo lunghi.");
  assert.equal(en("Text, den es nicht gibt"), "Text, den es nicht gibt");
  assert.equal(kpIdentity("Wand {w}", { w: "A" }), "Wand A");
  assert.equal(kpIdentity("frei {n} cm", { n: 41.25 }), "frei 41,25 cm");
  assert.equal(localNumbers("1.299,50 € · 91.5 cm · 30.000", "en"), "1,299.50 € · 91.5 cm · 30,000");
  assert.equal(localNumbers("91.5 cm", "it"), "91,5 cm");
  assert.equal(localNumbers("30.000 €", "fr"), "30 000 €");
  // {v…} bleibt wörtlich (Datum, Name)
  assert.equal(en("Planung {v}", { v: "01.11.2026" }), "Plan 01.11.2026");
});

test("Typografie: FR mit geschützten Leerzeichen, IT/FR «», keine deutschen Anführungszeichen", () => {
  const frDict = kpUiDict("fr");
  for (const v of Object.values(frDict)) {
    assert.doesNotMatch(v, / [:;?!](?=\s|$)/, `FR Leerzeichen: ${v}`);
    assert.doesNotMatch(v, /« |„|“/, `FR Anführungszeichen: ${v}`);
  }
  for (const r of ALL_ROWS) {
    assert.doesNotMatch(r[3], /„|“|"/, `IT Anführungszeichen: ${r[3]}`);
    assert.doesNotMatch(r[1], /„/, `EN Anführungszeichen: ${r[1]}`);
  }
  for (const l of LOCALES) {
    const json = JSON.stringify(kpPageCopy(l));
    assert.doesNotMatch(json, /„/, `${l}: keine deutschen Anführungszeichen`);
  }
  assert.doesNotMatch(JSON.stringify(kpPageCopy("fr")), / [:;?!](?=\s|")/);
});

test("Claims: keine Händler-, Superlativ- oder Preisversprechen in den Übersetzungen", () => {
  const all = [...ALL_ROWS.flatMap((r) => r.slice(1)), ...LOCALES.map((l) => JSON.stringify(kpPageCopy(l)))].join("\n");
  assert.doesNotMatch(all, /\b(dealer|authori[sz]ed|official|revendeur|concessionnaire|rivenditore|autorizzato|best|leading|meilleur|leader|migliore|il più|the finest)\b/i);
  // Händlersatz der Druckansicht nur über den Claim-Guard, in der Sprache der Seite
  const druck = read("src/app/[locale]/kuechenplaner/druck/page.js");
  assert.match(druck, /dealerStatementList\(\[\.\.\.new Set\(auswahl\.filter\(\(a\) => a\.g\)\.map\(\(a\) => a\.g\.m\)\)\], locale\)/);
  // Rechtshinweise vorhanden (kein Angebot, keine Herstellerplanung, Aufbewahrung 180 Tage)
  for (const l of LOCALES) {
    const t = kpServerT(l);
    for (const k of ["Unverbindlicher Rahmen inkl. MwSt., kein Angebot. Den verbindlichen Preis erhalten Sie nach Aufmaß und Beratung.", "„Italienische Premiumküche“ ist eine Gestaltungsrichtung, keine Planung eines Herstellers."]) assert.notEqual(t(k), k, `${l}: ${k}`);
    assert.match(t("Ich bin einverstanden, dass Platzhirsch Home Living meine Angaben, die Küchenkonfiguration und ein Bild der 3D-Ansicht zur Bearbeitung meiner Anfrage speichert und mich dazu kontaktiert. Konfiguration und Bild speichern wir höchstens 180 Tage. Widerruf jederzeit per E-Mail an info@platzhirsch.studio."), /180/);
  }
});

test("Client-Wörterbuch: nur eine Sprache, ohne Druckansicht, klein", () => {
  assert.equal(kpClientCopy("de"), null);
  for (const l of LOCALES) {
    const c = kpClientCopy(l);
    assert.equal(c.l, l);
    const json = JSON.stringify(c);
    assert.ok(json.length < 60_000, `${l}: ${json.length} Bytes`);
    assert.doesNotMatch(json, /Drucken \/ als PDF speichern|So geht es weiter/);
    // Hash-Schlüssel finden die Texte wieder
    assert.equal(createKpT(c)("Raumhöhe"), kpServerT(l)("Raumhöhe"));
  }
  // Seite übergibt nur kpClientCopy(locale); keine Messages-Datei angefasst
  const page = read("src/app/[locale]/kuechenplaner/page.js");
  assert.match(page, /<KpCopyProvider copy=\{kpClientCopy\(locale\)\}>/);
  assert.doesNotMatch(page, /if \(locale !== "de"\) notFound\(\)/);
  assert.doesNotMatch(read("src/app/[locale]/kuechenplaner/druck/page.js"), /if \(locale !== "de"\) notFound\(\)/);
  assert.equal(compileCopy({ "Wand {w}": "Wall {w}" }, "en").p["Wand {w}"], "Wall {w}");
});

test("Übergabe und Mail: Text in der Sprache, Anfrage ans Studio bleibt deutsch", () => {
  const t = kpServerT("fr");
  const lines = ["Grundform: L-Form · Raster 60 cm"];
  assert.match(handoffProdukt(lines, "", t), /^Planificateur de cuisine 3D: En L/);
  assert.match(handoffSummary({ lines, shareUrl: "https://platzhirsch.studio/fr/kuechenplaner?k=x", t }), /Ouvrir le projet/);
  assert.match(decodeURIComponent(planMailHref("https://platzhirsch.studio/fr/kuechenplaner?k=x", { t })), /Mon projet de cuisine/);
  assert.match(handoffSummary({ lines }), /^Küchenplanung aus dem 3D-Küchenplaner/);
  const rp = read("src/components/Labs/Kuechenplaner/ResultPanel.js");
  assert.match(rp, /\.\.\.linesDe,/);
});

test("Lektorat: IT-Knöpfe im Infinitiv wie auf der übrigen Site, Hinweistexte passen zum Knopf", () => {
  // Die IT-Seiten der Site beschriften Knöpfe im Infinitiv („Rimuovere“, „Mostrare“),
  // Fließtext in der „voi“-Form. Ausnahmen: Annulla/Ripeti (Standard), „Carica …“ = 3. Person.
  const tu = /^(\{short\}: )?(Aggiungi|aggiungi|Rimuovi|Riempi|Scegli|Chiudi|Mostra|Ruota|Sposta|Ingrandisci|Riduci|Salva|Ricarica|Vedi|Cambia|Richiedi|Inserisci|Apri|Elimina|Aggiorna|Scambia|Sostituisci|Memorizza|Confronta|Condividi|Copia|Scarica|Stampa|Torna|Suddividi)\b/;
  for (const rows of Object.values(KP_ROWS)) for (const r of rows) assert.ok(!tu.test(r[3]), `IT im Du-Imperativ: ${r[3]}`);
  const btn = kpUiDict;
  for (const l of ["en", "fr", "it"]) {
    const label = btn(l)["Planung anfragen"];
    assert.ok(kpPageCopy(l).notes.liveBefore.includes(label), `${l}: Hinweis nennt den Knopf „${label}“`);
  }
  // Vor dem Link folgt ein Leerzeichen: kein Apostroph am Ende (sonst „nell’ informativa“).
  assert.ok(!/’$/.test(kpUiDict("it")["Details in der"]));
  assert.ok(!/’$/.test(kpPageCopy("it").notes.liveBefore));
});
