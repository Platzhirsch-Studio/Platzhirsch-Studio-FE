// node --test tests/unit/r5-i18n.test.mjs
// R5-i18n: Übernahme messages-r4-*.json, Portal/Upload in 4 Sprachen,
// IT einheitlich „tu“, Rückbau der Doppelwahrheiten, AP7-Textreparatur.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { leaves } from "../../tools/i18n/lib.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
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

const R4 = ["messages-r4-leads.json", "messages-r4-portal.json", "messages-r4-produkt.json", "messages-r4-recht.json"];
const EXCLUDED = ["Cookies.intro", "Cookies.thirdCountryNotice"];

test("(1) messages-r4-*: jeder Schlüssel liegt in allen 4 Sprachen, Vorschläge als übernommen markiert", () => {
  const missing = [];
  for (const f of R4) {
    const p = json(`${TL}/${f}`);
    assert.match(p._uebernommen || "", /^R5-i18n/, f);
    for (const l of LOCALES) {
      assert.ok(p[l], `${f}: ${l} fehlt`);
      for (const [k] of leaves(p[l])) {
        if (EXCLUDED.some((e) => k === e || k.startsWith(`${e}.`))) continue;
        if (!flat[l].has(k)) missing.push(`${f} ${l}:${k}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("(1) Cookies.intro/thirdCountryNotice: nicht aus messages-r4-recht übernommen (Anwalt)", () => {
  const p = json(`${TL}/messages-r4-recht.json`);
  for (const l of LOCALES) {
    for (const k of EXCLUDED) {
      const proposed = get(p[l], k);
      if (proposed !== undefined) assert.notEqual(get(msgs[l], k), proposed, `${l}:${k}`);
    }
  }
});

test("(2) Portal/Labs-Schlüssel aus messages-r4-portal in allen 4 Sprachen, nicht leer, EN/FR/IT übersetzt", () => {
  const p = json(`${TL}/messages-r4-portal.json`);
  const keys = leaves(p.de).map(([k]) => k);
  assert.ok(keys.length >= 10);
  for (const k of keys) {
    for (const l of LOCALES) assert.ok(String(get(msgs[l], k) ?? "").trim(), `${l}:${k}`);
    for (const l of ["en", "fr", "it"]) assert.notEqual(get(msgs[l], k), get(msgs.de, k), `${l}:${k} ist noch Deutsch`);
  }
});

// Lei- und voi-Formen (Union der Prüfungen aus R3/R4 plus Funde aus R5).
const IT_FORMAL = new RegExp(
  "(?<![\\p{L}])(?:" +
    [
      "Lei", "La preghiamo", "La contatteremo", "La ricontattiamo", "La consigliamo", "Le mostriamo", "Le offriamo",
      "ci chiami", "ci scriva", "ci contatti", "Controlli", "Compili", "Scelga", "Indichi", "Inserisca", "Selezioni",
      "Descriva", "Riprovi", "Prenoti", "Chieda", "Si accomodi", "Preferisce", "Scriva",
      "il Suo", "la Sua", "i Suoi", "le Sue", "casa Sua", "il suo progetto", "la sua richiesta", "i suoi dati",
      "lo ritrova", "Con la consegna riceve", "Cosa riceve", "Che cosa cerca", "Cosa trova", "ci trova", "Cominci",
      "voi", "vostr[aeio]", "trovate", "scoprite", "visitate", "potete", "avete", "siete", "[\\p{L}]+(?:tevi|teci)",
    ].join("|") +
    ")(?![\\p{L}])",
  "u"
);

// Runde 4 (P2 Sprache, gesamtwerk P1-3 / recht P1-5): Erwartung bewusst umgedreht.
// IT steht jetzt einheitlich in voi (tools/i18n/patches/r4-p2-it-voi.json). Lei
// bleibt verboten (IT_LEI = IT_FORMAL ohne die voi-Formen), tu ebenso (IT_TU).
const IT_LEI = new RegExp(IT_FORMAL.source.replace(/\|voi\|vostr\[aeio\]\|trovate\|scoprite\|visitate\|potete\|avete\|siete\|\[\\p\{L\}\]\+\(\?:tevi\|teci\)/, ""), "u");
const IT_TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te|hai|puoi|vuoi)(?![\p{L}])/u;

test("(3) IT einheitlich voi (seit Runde 4): 0 Lei-/tu-Formen in it.json", () => {
  assert.ok(!IT_LEI.test("il vostro progetto") && IT_LEI.test("il Suo progetto"), "IT_LEI ohne voi-Teile");
  const hits = [...flat.it].filter(([k, v]) => typeof v === "string" && !EXCLUDED.some((e) => k.startsWith(e)) && (IT_LEI.test(v) || IT_TU.test(v))).map(([k, v]) => `${k}: ${v}`);
  assert.deepEqual(hits, []);
  assert.match(msgs.it.shop.atelier.planningText, /il vostro progetto: richiediamo per voi/);
  assert.equal(msgs.it.shop.atelier.planningCta, "Richiedete i dati di progettazione");
});

// Runde 4: die Fallback-Module dürfen weiter keine Lei-Form haben. Sie gehören
// anderen Paketen und stehen teils noch in tu (offen, an die Eigentümer gemeldet).
test("(3) IT ohne Lei-Formen in den verbliebenen Fallbacks", async () => {
  const { BRAND_CATEGORY_COPY } = await import("../../src/lib/marken/brandCategoryCopy.js");
  const { LEADS_TEXT } = await import("../../src/lib/forms/leadsCopy.js");
  const sources = {
    "brandCategoryCopy.js": BRAND_CATEGORY_COPY.it,
    "leadsCopy.js": LEADS_TEXT.it,
    "ReviewNotice.js": read("src/components/Legal/ReviewNotice.js").match(/it: \{[\s\S]*?\n  \}/)?.[0] ?? "",
    "ShopCatalog/copy.js": read("src/components/ShopCatalog/copy.js"),
    "messages-r4-portal.json (it)": json(`${TL}/messages-r4-portal.json`).it,
    "messages-r2-seo.json (it)": json(`${TL}/messages-r2-seo.json`).it,
  };
  for (const [name, src] of Object.entries(sources)) {
    const texts = typeof src === "string" ? [src] : leaves(src).map(([, v]) => String(v));
    for (const t of texts) assert.doesNotMatch(t, IT_LEI, name);
  }
});

test("(4) Doppelwahrheiten zurückgebaut: Dateien weg, Module ohne Texte", async () => {
  for (const f of ["src/components/Home/pendingCopy.js", "src/components/UberUns/inhalt/proposalR3.js"]) assert.equal(exists(f), false, f);
  assert.doesNotMatch(read("src/components/UberUns/inhalt/useInhalt.js"), /proposal|PROPOSAL_R3/i);

  const forms = await import("../../src/lib/forms/i18n.js");
  for (const l of LOCALES) {
    assert.deepEqual(forms.FORM_TEXT[l], {});
    assert.deepEqual(forms.FORM_TEXT_R3[l], {});
  }
  assert.equal(forms.formText, undefined);
  assert.equal(forms.formErrorText, undefined);
  assert.equal(forms.errorKey("rate_limited"), "error.rate_limited");
  assert.equal(forms.errorKey("__proto__"), "error.upstream");

  const { KONTAKT_COPY } = await import("../../src/components/Kontakt/copy.js");
  for (const l of LOCALES) assert.deepEqual(KONTAKT_COPY[l], {});

  const shop = read("src/components/ShopCatalog/copy.js");
  assert.doesNotMatch(shop, /export const (FALLBACK|R4_ATELIER)\b|createTranslator/);
  const { withFallback } = await import("../../src/components/ShopCatalog/copy.js");
  const t = Object.assign((k, v) => `T:${k}:${v?.n ?? ""}`, { has: (k) => k === "a" });
  const tc = withFallback(t, "it", "shop");
  assert.equal(tc("a", { n: 2 }), "T:a:2");
  assert.equal(tc.has("a"), true);
  assert.equal(tc.has("b"), false);

  // brandCategoryCopy.js: dünner Re-Export der Messages (eine Quelle).
  const bc = read("src/lib/marken/brandCategoryCopy.js");
  assert.match(bc, /import it from "\.\.\/\.\.\/messages\/it\.json" with \{ type: "json" \}/);
  const { BRAND_CATEGORY_COPY } = await import("../../src/lib/marken/brandCategoryCopy.js");
  for (const l of LOCALES) assert.deepEqual(BRAND_CATEGORY_COPY[l], msgs[l].brandCategory, l);
});

test("(4) kein Leser der gelöschten Exporte in src, tests, tools, scripts", () => {
  const dirs = ["src", "tests", "tools", "scripts"].map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d));
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(m?js|jsx|cjs)$/.test(e.name)) files.push(p);
    }
  };
  dirs.forEach(walk);
  const self = path.join(ROOT, "tests/unit/r5-i18n.test.mjs");
  const offenders = [];
  for (const f of files) {
    if (f === self) continue;
    const src = fs.readFileSync(f, "utf8");
    if (/from\s+["'][^"']*(pendingCopy|proposalR3)(\.js)?["']/.test(src)) offenders.push(`${path.relative(ROOT, f)}: import`);
    if (/\bimport\s*\{[^}]*\b(formText|formErrorText|interpolate|R4_ATELIER|FALLBACK)\b[^}]*\}\s*from\s*["'][^"']*(forms\/i18n|ShopCatalog\/copy)/.test(src)) offenders.push(path.relative(ROOT, f));
  }
  assert.deepEqual(offenders, []);
});

test("(5) AP7-Textreparatur: Präzision, kein Agenturton, Newsletter ohne Rabatte", () => {
  for (const l of LOCALES) {
    const all = JSON.stringify(msgs[l]);
    assert.doesNotMatch(all, /Präzession|précession|precessione|precession/i, l);
    assert.doesNotMatch(all, /Markenidentit|brand identit|identité de marque|identità di marca|Brücke zwischen Design und Strategie/i, l);
    assert.doesNotMatch(all, /einfache Schritte zum Interior Design|von einem Design zum anderen/i, l);
    for (const ns of [msgs[l].newsletter, msgs[l].inhalt?.newsletter]) {
      assert.doesNotMatch(JSON.stringify(ns ?? {}), /Rabatt|discount|remise|sconti|réduction|riduzion/i, `${l}: newsletter`);
    }
    assert.doesNotMatch(msgs[l].newsletter.howText, /verpassen|never miss|ne manquez|non perdere|!/i, `${l}: newsletter.howText`);
    assert.doesNotMatch(msgs[l].newsletter.howText, /(?<![\p{L}])(größt\p{L}*|beste[nrs]?|largest|meilleur\p{L}*|migliore)(?![\p{L}])/iu);
  }
  assert.equal(msgs.de.Slider.minotti, "Eleganz in architektonischer Präzision");
  assert.equal(get(msgs.de, "About.ourMissionDesc"), undefined, "About ist seit R4 entfernt");
});

test("(6) gleich viele Blätter je Sprache, gleiche Schlüsselmenge", () => {
  const keys = Object.fromEntries(LOCALES.map((l) => [l, [...flat[l].keys()].sort()]));
  for (const l of ["en", "fr", "it"]) {
    const onlyDe = keys.de.filter((k) => !flat[l].has(k));
    const onlyL = keys[l].filter((k) => !flat.de.has(k));
    assert.deepEqual({ onlyDe, onlyL }, { onlyDe: [], onlyL: [] }, l);
  }
});

// ------------------------------------------------- QM-Fix (feedback R5-i18n)

test("(7) Fix P2-2: Portal-Navigation und Upload aus messages-r5-portal in allen 4 Sprachen, EN/FR/IT übersetzt, IT voi (seit Runde 4)", () => {
  const proposal = json(`${TL}/messages-r5-portal.json`);
  const keys = leaves(proposal.de).map(([k]) => k);
  assert.ok(keys.some((k) => k.startsWith("Upload.")) && keys.some((k) => k.startsWith("Portal.nav.")));
  for (const k of keys) {
    for (const l of LOCALES) {
      const v = flat[l].get(k);
      assert.equal(typeof v, "string", `${l}.${k} fehlt`);
      assert.ok(v.trim(), `${l}.${k} leer`);
      if (l !== "de" && !/^(E-Mail|Portal|Labs)$/.test(v)) assert.notEqual(v, flat.de.get(k), `${l}.${k} = DE`);
    }
  }
  const upIt = JSON.stringify(msgs.it.Upload);
  assert.doesNotMatch(upIt, /\b(Lei|La preghiamo|Suo|Sua|Suoi|tuo|tua|tuoi)\b/);
  assert.match(upIt, /Mostrateci il vostro ambiente/);
  assert.equal(msgs.de.shop.atelier.noPhoto, json(`${TL}/messages-r5-produkt.json`).de.shop.atelier.noPhoto);
});

test("(7) Fix P2-1/P1: Altverträge auf tu und Release-Abhängigkeit", () => {
  const produkt = read("tests/unit/r4-produkt.test.mjs");
  assert.match(produkt, /Vi offriamo consulenza su questo pezzo/);
  assert.doesNotMatch(produkt, /assert\.match\(page, \/Le offriamo/);
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.doesNotMatch(page, /Le offriamo|il Suo spazio/);
  // react-share: TODO until R5-release uninstalls it, never a silent skip.
  assert.match(read("tests/unit/r3-inhalt.test.mjs"), /todo: reactShareInstalled \?/);
});

test("(7) Fix P2-3: Message-Werkzeuge schreiben atomar und nur ein Lauf gleichzeitig", () => {
  const lib = read("tools/i18n/lib.mjs");
  assert.match(lib, /fs\.renameSync\(tmp, file\)/);
  assert.match(lib, /flag: "wx"/);
  assert.equal(exists("src/messages/.write.lock"), false, "keine verwaiste Sperre");
  assert.deepEqual(fs.readdirSync(path.join(ROOT, "src/messages")).filter((f) => f.endsWith(".tmp")), []);
});
