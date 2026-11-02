// Product copy (src/lib/productCopy, src/content/productCopy/de.json).
// Run: node --test tests/unit/productCopy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getProductCopy,
  getProductCopyDraft,
  listProductCopyKeys,
  buildFaqJsonLd,
  metadataOverride,
  resolveProductCopy,
} from "../../src/lib/productCopy/index.js";
import { createProductCopyStore } from "../../src/lib/productCopy/core.js";
import { approvalFingerprint, carryApprovals, signApproval } from "../../src/lib/productCopy/approvals.js";

const SIGN = { by: "Test", at: "2026-10-26" };
// R3: an approval needs a matching text hash; this signs a fixture entry.
const signed = (entry) => signApproval(entry, { fields: "all", ...SIGN });
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  rejectReason,
  sanitizeFact,
  sanitizeFaq,
  sanitizeParagraph,
  truncateAtWord,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
} from "../../src/lib/productCopy/sanitize.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const DATA_URL = new URL("../../src/content/productCopy/de.json", import.meta.url);
const raw = fs.readFileSync(DATA_URL, "utf8");
const data = JSON.parse(raw);
const entries = data.entries;

// Every published string of one entry, with a label for error messages.
function textsOf(e) {
  return [
    ["meta.title", e.meta?.title],
    ["meta.description", e.meta?.description],
    ["h1", e.h1],
    ...e.paragraphs.map((p, i) => [`absatz ${i + 1}`, p]),
    ...e.facts.flatMap((f) => [[`fakt ${f.label}`, f.value], [`fakt ${f.label} label`, f.label]]),
    ...e.faq.flatMap((f, i) => [[`faq ${i + 1} frage`, f.question], [`faq ${i + 1} antwort`, f.answer]]),
    ...e.keywords.map((k) => ["keyword", k]),
  ].filter(([, v]) => typeof v === "string" && v);
}

test("01 Daten: 62 Einträge, Grundform", () => {
  assert.equal(data.locale, "de");
  assert.ok(Array.isArray(entries));
  assert.equal(entries.length, 62);
  for (const e of entries) {
    assert.equal(e.key, `${e.categorySlug}/${e.productSlug}`);
    assert.match(e.key, /^[a-z0-9-]+\/[a-z0-9-]+$/);
    assert.equal(e.catalog.path, `/produkte/${e.key}`);
    assert.equal(typeof e.approved, "boolean");
    assert.match(e.source.researchedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.paragraphs.length >= 1, `${e.key} ohne Text`);
  }
});

test("02 alle Schlüssel eindeutig (auch im Rohtext)", () => {
  const keys = entries.map((e) => e.key);
  assert.equal(new Set(keys).size, keys.length);
  const rawKeys = [...raw.matchAll(/"key": "([^"]+\/[^"]+)"/g)].map((m) => m[1]);
  assert.equal(rawKeys.length, keys.length);
  assert.equal(new Set(rawKeys).size, rawKeys.length);
  assert.equal(new Set(entries.map((e) => e.productSlug)).size, keys.length);
});

test("03 kein '[prüfen]', 'nicht angegeben', 'unklar' in den Daten", () => {
  assert.doesNotMatch(raw, /\[\s*prüfen|prüfen\]|nicht angegeben|unklar/i);
});

test("04 kein 'Händler' außer ClassiCon, keine Offiziell-/Autorisiert-Formel", () => {
  for (const e of entries) {
    for (const [where, text] of textsOf(e)) {
      if (/h(?:ä|ae)ndler/i.test(text)) {
        assert.equal(e.brand, "ClassiCon", `${e.key} ${where}: ${text}`);
      }
      assert.doesNotMatch(text, /offiziell|autorisiert|vertragspartner|flagship/i, `${e.key} ${where}`);
    }
  }
  // zweites Netz: Claim-Guard aus R1-legal
  for (const e of entries) {
    const brandSlug = e.brand ? e.brand.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : undefined;
    for (const [where, text] of textsOf(e)) {
      const hits = findClaims(text, { brandSlug, brands: e.brand ? [e.brand] : [] });
      assert.deepEqual(hits, [], `${e.key} ${where}: ${JSON.stringify(hits)}`);
    }
  }
});

test("05 keine Superlative, Preise, Lieferzeiten, Bilddaten-Angaben", () => {
  for (const e of entries) {
    for (const [where, text] of textsOf(e)) {
      assert.equal(rejectReason(text), null, `${e.key} ${where}: ${text}`);
    }
  }
});

test("06 jede quelle-URL ist https", () => {
  for (const e of entries) {
    assert.match(e.manufacturerUrl, /^https:\/\/\S+$/, e.key);
    for (const f of e.facts) assert.match(f.source, /^https:\/\/\S+$/, `${e.key} ${f.label}`);
  }
  assert.doesNotMatch(raw, /"(?:source|manufacturerUrl)": "http:/);
});

test("07 Metadaten-Längen", () => {
  for (const e of entries) {
    if (e.meta.title) assert.ok(e.meta.title.length <= META_TITLE_MAX, `${e.key} title ${e.meta.title.length}`);
    if (e.meta.description) {
      assert.ok(e.meta.description.length <= META_DESCRIPTION_MAX, `${e.key} description ${e.meta.description.length}`);
    }
  }
});

test("08 Auslieferung: nichts mit gültigem Hash freigegeben -> getProductCopy liefert null", () => {
  assert.ok(entries.every((e) => e.approved === false && !e.approvals));
  for (const e of entries) {
    assert.equal(getProductCopy(e.categorySlug, e.productSlug, "de"), null);
    assert.ok(getProductCopyDraft(e.categorySlug, e.productSlug));
  }
  assert.equal(getProductCopyDraft().length, 62);
  assert.equal(listProductCopyKeys().length, 62);
});

test("09 Store: nur 'de' und nur mit gültiger Text-Hash-Freigabe", () => {
  const store = createProductCopyStore({
    entries: [
      signed({ key: "sofas-couches/a", categorySlug: "sofas-couches", productSlug: "a", faq: [], meta: { title: "A" } }),
      { key: "beds/b", categorySlug: "beds", productSlug: "b", approved: false },
      { key: "beds/c", categorySlug: "beds", productSlug: "c", approved: "true" },
      { key: "beds/d", categorySlug: "beds", productSlug: "d", approved: true, meta: { title: "D" } },
    ],
  });
  assert.equal(store.get("beds", "d", "de"), null, "approved:true ohne Hash zählt nicht");
  assert.equal(store.get("sofas-couches", "a", "de").key, "sofas-couches/a");
  for (const loc of ["en", "fr", "it", undefined]) assert.equal(store.get("sofas-couches", "a", loc), null);
  assert.equal(store.get("beds", "b", "de"), null);
  assert.equal(store.get("beds", "c", "de"), null, "nur boolean true zählt");
  assert.equal(store.get("beds", "x", "de"), null);
  // geänderte Kategorie im Backoffice: Fallback über den eindeutigen Produkt-Slug
  assert.equal(store.get("lounge", "a", "de").key, "sofas-couches/a");
  assert.equal(store.draft("beds", "b").key, "beds/b");
  assert.ok(Object.isFrozen(store.draft("beds", "b")));
  assert.throws(() => createProductCopyStore({ entries: [{ key: "x/y" }, { key: "x/y" }] }), /doppelt/);
});

test("10 FAQPage-JSON-LD und Metadaten-Override", () => {
  const entry = { key: "x/p", categorySlug: "x", productSlug: "p", meta: { title: "T", description: "D" }, faq: [{ question: "Q?", answer: "A." }] };
  const copy = createProductCopyStore({ entries: [signed(entry)] }).get("x", "p", "de");
  assert.deepEqual(buildFaqJsonLd(copy, "https://x.test/p", { faqVisible: true }), {
    "@type": "FAQPage",
    "@id": "https://x.test/p#faq",
    mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } }],
  });
  assert.equal(buildFaqJsonLd({ approved: true, faq: [] }, "u", { faqVisible: true }), null);
  // Rohdaten (auch mit approved:true) sind keine veröffentlichte Sicht
  assert.equal(buildFaqJsonLd({ ...entry, approved: true }, "u", { faqVisible: true }), null);
  assert.deepEqual(metadataOverride({ ...entry, approved: true }), {});
  // Pflicht: ohne sichtbare FAQ kein FAQPage-Markup
  assert.equal(buildFaqJsonLd(copy, "https://x.test/p"), null);
  assert.equal(buildFaqJsonLd(copy, "https://x.test/p", { faqVisible: "yes" }), null);
  assert.equal(buildFaqJsonLd({ ...copy, approved: false }, "u", { faqVisible: true }), null);
  assert.deepEqual(metadataOverride(copy), { title: "T", description: "D" });
  assert.deepEqual(metadataOverride({ ...copy, approved: false }), {});
  assert.deepEqual(metadataOverride(null), {});
});

test("11 Filterregeln", () => {
  assert.equal(sanitizeParagraph("Ein Satz. Ob es in der Ausstellung steht [prüfen], sagen wir gern.").text, "");
  assert.equal(
    sanitizeParagraph("Der Tisch ist schön. Gegen Aufpreis gibt es mehr. Er ist rund.").text,
    "Der Tisch ist schön. Er ist rund.",
  );
  assert.equal(sanitizeParagraph("Wir sind der größte Händler. Der Sessel ist z. B. aus Leder.").text, "Der Sessel ist z. B. aus Leder.");
  assert.equal(sanitizeParagraph("Laut Bilddaten 119 cm tief. Vier Beine.").text, "Vier Beine.");
  assert.deepEqual(sanitizeFact({ wert: "A; B gegen Aufpreis", quelle: "https://x.test" }), {
    value: "A",
    source: "https://x.test",
    trimmed: true,
  });
  assert.equal(sanitizeFact({ wert: "A", quelle: "http://x.test" }).dropped, "source");
  assert.equal(sanitizeFact({ wert: "A", quelle: "https://x.test ; Katalogtext" }).dropped, "source");
  assert.equal(sanitizeFact({ wert: "A", quelle: "https://x.test", hinweis: "mit Datenblatt abgleichen [prüfen]" }).dropped, "marker");
  assert.equal(sanitizeFact({ wert: null, quelle: "https://x.test" }).dropped, "empty");
  assert.equal(sanitizeFaq({ frage: "Was kostet X?", antwort: "Das hängt ab." }).dropped, "price");
  assert.equal(rejectReason("Stoffe in fünf Preisgruppen"), null);
  assert.equal(rejectReason("im Zeitraum von 1960"), null);
  assert.equal(rejectReason("Luxusbett Vorarlberg"), "superlative");
  assert.equal(rejectReason("Lieferzeit 8 Wochen"), "delivery");
  const t = truncateAtWord("Wort ".repeat(30), 60);
  assert.ok(t.length <= 60 && !t.endsWith(" "));
});

test("12 build.mjs behält Freigaben bei unverändertem Text, widerruft bei Änderung", () => {
  const base = { categorySlug: "lamps", catalog: { path: "/produkte/lamps/a" }, meta: { title: "T" }, h1: "H", paragraphs: ["P"], facts: [], faq: [], keywords: [] };
  const prev = [
    { ...base, key: "lamps/a", productSlug: "a", approved: true, approvedBy: "Inhaber", approvedAt: "2026-10-27" },
    { ...base, key: "lamps/b", productSlug: "b", approved: true },
    { ...base, key: "lamps/c", productSlug: "c", approved: false },
    { ...base, key: "lamps/gone", productSlug: "gone", approved: true },
  ];
  const next = [
    { ...base, key: "lamps/a", productSlug: "a", approved: false },
    { ...base, key: "lamps/b", productSlug: "b", approved: false, paragraphs: ["P geändert"] },
    { ...base, key: "lamps/c", productSlug: "c", approved: false },
    { ...base, key: "lamps/new", productSlug: "new", approved: false },
  ];
  const r = carryApprovals(prev, next);
  assert.deepEqual(r.kept, ["lamps/a"]);
  assert.deepEqual(r.revoked, ["lamps/b"]);
  assert.deepEqual(r.orphaned, ["lamps/gone"]);
  const by = Object.fromEntries(r.entries.map((e) => [e.key, e]));
  assert.equal(by["lamps/a"].approved, true);
  assert.equal(by["lamps/a"].approvedBy, "Inhaber");
  assert.equal(by["lamps/a"].approvedAt, "2026-10-27");
  assert.equal(by["lamps/b"].approved, false);
  assert.equal(by["lamps/c"].approved, false);
  assert.equal(by["lamps/new"].approved, false);
  assert.equal(carryApprovals([], next).kept.length, 0);
  // Freigabe-Metadaten zählen nicht zum Text
  assert.equal(approvalFingerprint(prev[0]), approvalFingerprint(next[0]));
  // build.mjs nutzt die Übernahme wirklich
  const build = fs.readFileSync(new URL("../../src/lib/productCopy/build.mjs", import.meta.url), "utf8");
  assert.match(build, /carryApprovals\(previousEntries, entries\)/);
  assert.match(build, /entries: approvals\.entries/);
  assert.doesNotMatch(build, /approved: true/);
});

test("13 Slug-Fallback: Canonical = Live-URL (308-Ziel), nie catalog.path", () => {
  const sq = signed({ key: "coffee-tables/tables-superquadra-tables", categorySlug: "coffee-tables", productSlug: "tables-superquadra-tables", catalog: { path: "/produkte/coffee-tables/tables-superquadra-tables" }, faq: [], paragraphs: ["Text."] });
  const store = createProductCopyStore({ entries: [sq] });
  const exact = store.resolve("coffee-tables", "tables-superquadra-tables", "de");
  assert.equal(exact.matchedBy, "key");
  assert.equal(exact.canonicalPath, "/produkte/coffee-tables/tables-superquadra-tables");
  assert.equal(exact.staleCatalogPath, false);
  // Backoffice korrigiert die Kategorie: coffee-tables/... 308 -> dining-tables/...
  const moved = store.resolve("dining-tables", "tables-superquadra-tables", "de");
  assert.equal(moved.copy.key, sq.key);
  assert.equal(moved.matchedBy, "productSlug");
  assert.equal(moved.canonicalPath, "/produkte/dining-tables/tables-superquadra-tables");
  assert.equal(moved.staleCatalogPath, true);
  assert.equal(store.resolve("dining-tables", "tables-superquadra-tables", "en"), null);
  assert.deepEqual(Object.keys(metadataOverride(sq)).filter((k) => k === "alternates"), []);
  // ausgelieferte Daten: ohne Freigabe nichts
  assert.equal(resolveProductCopy("dining-tables", "tables-superquadra-tables", "de"), null);
});

test("14 Server-only: App-Code importiert nur @/lib/productCopy/server, nie in Client-Komponenten", () => {
  const root = fileURLToPath(new URL("../../src/", import.meta.url));
  const facade = fs.readFileSync(path.join(root, "lib/productCopy/server.js"), "utf8");
  assert.match(facade, /^import "server-only";$/m);
  // R6-release: Reine Module ohne Import und ohne Textdaten (Freigabe-Logik,
  // Startliste) darf Server-Code direkt nutzen (Freigabe-Cockpit, R6-uebergabe).
  // Client-Komponenten bleiben für jedes productCopy-Modul gesperrt.
  const PURE = /(?:^@\/lib|\/lib)\/productCopy\/(?:approvals|startList)(?:\.js)?$/;
  for (const m of ["approvals.js", "startList.js"]) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, "lib/productCopy", m), "utf8"), /^\s*import\s|require\(/m, m);
  }
  const offenders = [];
  const walk = (dir) => {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) { if (d.name !== "node_modules") walk(full); continue; }
      if (!/\.(m?js|jsx|tsx?)$/.test(d.name)) continue;
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (rel.startsWith("lib/productCopy/")) continue;
      const code = fs.readFileSync(full, "utf8");
      const imports = [...code.matchAll(/(?:from|import)\s*\(?\s*["']([^"']*productCopy[^"']*)["']/g)].map((m) => m[1]);
      if (!imports.length) continue;
      const isClient = /^\s*["']use client["']/m.test(code);
      for (const spec of imports) {
        if (isClient) offenders.push(`${rel}: Client-Komponente importiert ${spec}`);
        else if (spec !== "@/lib/productCopy/server" && !PURE.test(spec)) offenders.push(`${rel}: ${spec} statt @/lib/productCopy/server`);
      }
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
});
