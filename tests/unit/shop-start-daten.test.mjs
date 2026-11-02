// tests/unit/shop-start-daten.test.mjs — Accessoires-Shop: Daten, Texte und Suche (src/lib/shop/shopStart.js,
// startCopy.js, shopSuche.js). Nur echte Kategorien/Produkte, kein erfundenes
// „Neu“, Service-Aussagen nur laut SHOP_MODE/LAENDER, Texte ohne Händler-,
// Superlativ- und Länderversprechen, Suche mit Präfix/Plural/Akzent/Tippfehler/UND.
// Run: node --test tests/unit/shop-start-daten.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    let file;
    if (specifier.startsWith("@/")) file = path.join(ROOT, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !path.extname(specifier)) {
      file = path.join(path.dirname(fileURLToPath(context.parentURL)), specifier);
    } else return nextResolve(specifier, context);
    const cand = [file, `${file}.js`, path.join(file, "index.js")].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    return nextResolve(pathToFileURL(cand || `${file}.js`).href, context);
  },
});

const katalog = await import("../../src/lib/katalog/index.js");
const schema = await import("../../src/lib/katalog/schema.js");
const start = await import("../../src/lib/shop/shopStart.js");
const suche = await import("../../src/lib/shop/shopSuche.js");
const { SHOP_START_COPY, startCopy, laenderListe } = await import("../../src/lib/shop/startCopy.js");
const { LAENDER } = await import("../../src/lib/commerce/shipping/config.js");
const claims = await import("../../src/lib/legal/claims.js");
const { fitTitle, clampDescription } = await import("../../src/lib/seo/pageMetadata.js");

const WELT = "accessoires";
const pfade = new Set(katalog.katalogPfade().map((e) => e.path));


/** Alle Texte einer Sprache (Funktionen mit Beispielwerten aufgerufen). */
function alleTexte(obj) {
  const out = [];
  const walk = (v) => {
    if (typeof v === "string") out.push(v);
    else if (typeof v === "function") {
      let r;
      try {
        r = v(11, "Riedel");
      } catch {
        r = v("Riedel", 11);
      }
      out.push(String(r));
    }
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(obj);
  return out;
}

test("Abteilungen: nur Kategorien mit Produkten, jede Kategorie der Welt genau einmal, Ziele existieren", () => {
  const gruppen = start.abteilungen();
  const kats = gruppen.flatMap((g) => g.kategorien.map((k) => k.slug));
  assert.deepEqual([...kats].sort(), [...katalog.kategorienMitProdukten(WELT)].sort(), "Abdeckung");
  assert.equal(new Set(kats).size, kats.length, "keine Kategorie doppelt");
  for (const g of gruppen) {
    assert.ok(g.anzahl > 0, g.id);
    assert.ok(pfade.has(g.href), `${g.id}: ${g.href}`);
    for (const k of g.kategorien) {
      assert.ok(pfade.has(k.href), k.href);
      assert.equal(k.anzahl, katalog.produkteByKategorie(WELT, k.slug).length);
    }
    if (g.bildProdukt) assert.ok(g.kategorien.some((k) => k.slug === g.bildProdukt.kategorie), `${g.id}: Bild aus der Abteilung`);
  }
  // Auftrag: Duftkerzen & Raumduft, Gläser & Karaffen, Bücher, Keramik & Vasen, Akku-Leuchten, Parfum (sofern im Katalog)
  for (const id of ["duft", "glas", "buecher", "keramik", "leuchten", "parfum"]) assert.ok(gruppen.some((g) => g.id === id), id);
});

test("Abteilungen: Kategorie ohne Zuordnung wird eigene Abteilung (nichts verschwindet)", () => {
  assert.ok(start.ABTEILUNGEN.every((a) => a.kategorien.every((k) => schema.KATEGORIEN[k]?.includes("accessoires"))), "nur Accessoire-Kategorien");
  const label = start.abteilungLabel({ id: "neu-kat", eigen: true }, "de", (k) => `L:${k}`);
  assert.equal(label, "L:neu-kat");
});

test("Edits: nur echte Produkte, ≤ 4, je Edit passende Kategorie; kein „Neu“ ohne Inhaber-Liste", () => {
  const e = start.edits();
  const ids = e.map((x) => x.id);
  assert.ok(ids.includes("geschenke") && ids.includes("tisch"), ids.join(","));
  assert.equal(start.NEU_IM_SORTIMENT.length, 0);
  assert.ok(!ids.includes("neu"), "„Neu im Sortiment“ nie aus stand/Reihenfolge");
  for (const x of e) {
    assert.ok(x.produkte.length > 0 && x.produkte.length <= 4, x.id);
    for (const p of x.produkte) {
      assert.equal(p.welt, WELT);
      assert.ok(katalog.produktBySlug(p.slug), p.slug);
    }
    assert.ok(pfade.has(x.href), x.href);
  }
  const g = e.find((x) => x.id === "geschenke");
  assert.ok(g.produkte.every((p) => p.kategorie === "geschenkset"));
  assert.equal(g.anzahl, katalog.produkteByKategorie(WELT, "geschenkset").length);
  const t = e.find((x) => x.id === "tisch");
  assert.ok(t.produkte.every((p) => ["glas", "karaffe", "geschirr"].includes(p.kategorie)));
  assert.ok(new Set(t.produkte.map((p) => p.marke)).size > 1, "reihum: mehrere Marken");
  const a = e.find((x) => x.id === "auswahl");
  assert.deepEqual(a.produkte.map((p) => p.slug), katalog.AUSGEWAEHLT.accessoires.slice(0, 4));
});

test("reihum(): deterministisch, nur Produkte mit Bild", () => {
  assert.deepEqual(start.reihum(["glas", "karaffe"]).map((p) => p.slug), start.reihum(["glas", "karaffe"]).map((p) => p.slug));
  assert.ok(start.reihum(["glas"], 8).every((p) => p.bilder.length > 0));
  assert.deepEqual(start.reihum(["gibt-es-nicht"]), []);
});

test("Hero: Raumszene mit belegter Quelle, Herstellerbild unverändert (Pfad im Katalog)", () => {
  const h = start.heroLook();
  assert.ok(h, "Hero vorhanden");
  assert.match(h.bild.quelleUrl, /^https:\/\//);
  assert.match(h.bild.src, new RegExp(`^/Images/Wellness/produkte/${h.marke}/`));
  assert.ok(h.bild.width > 0 && h.bild.height > 0);
  assert.equal(h.markeName, katalog.markeBySlug(h.marke).name);
  // Fallback, wenn die gewählte Szene fehlt
  const f = start.heroLook(WELT, { marke: "riedel", look: "gibt-es-nicht" });
  assert.ok(f && f.bild.quelleUrl);
});

test("Serviceleiste: SHOP_MODE off → keine Versand-/Zahlungsaussage", () => {
  for (const locale of LOCALES) {
    const s = start.serviceLeiste("off", LAENDER, locale);
    assert.deepEqual(s.map((x) => x.id), ["showroom", "anfrage", "beratung"]);
    assert.ok(!s.some((x) => /versand|shipping|livraison|spedizione|zahl|pay|paiement|pagamento/i.test(x.text)), locale);
  }
});

test("Serviceleiste: test/live → Versandländer aus LAENDER, CH ehrlich als Abholung", () => {
  const s = start.serviceLeiste("live", LAENDER, "de");
  const versand = s.find((x) => x.id === "versand");
  const mit = Object.keys(LAENDER).filter((k) => LAENDER[k].versand);
  assert.equal(versand.text, `Versand nach ${laenderListe(mit, "de")}`);
  assert.doesNotMatch(versand.text, /Schweiz/);
  assert.ok(s.some((x) => x.id === "abholung" && /Lochau/.test(x.text)));
  if (!LAENDER.CH.versand) assert.ok(s.some((x) => x.id === "ohne-ch" && /Schweiz/.test(x.text)));
  assert.ok(!s.some((x) => /sicher|secure|garant|kostenlos|gratis|free/i.test(x.text)), "keine unbelegten Zusicherungen");
  // Ein späteres CH-Go (versand: true) erscheint automatisch:
  const ch = start.serviceLeiste("live", { AT: { versand: true }, DE: { versand: true }, CH: { versand: true } }, "de");
  assert.equal(ch.find((x) => x.id === "versand").text, "Versand nach Österreich, Deutschland und Schweiz");
  assert.ok(!ch.some((x) => x.id.startsWith("ohne-")));
});

test("Texte: vier Sprachen mit gleichen Schlüsseln, Abteilungs-Labels vollständig", () => {
  const keys = (o) => Object.keys(o).sort();
  for (const l of LOCALES) {
    assert.deepEqual(keys(SHOP_START_COPY[l]), keys(SHOP_START_COPY.de), l);
    for (const a of start.ABTEILUNGEN) assert.ok(SHOP_START_COPY[l].abteilung[a.id], `${l}: ${a.id}`);
  }
  assert.equal(startCopy("xx"), SHOP_START_COPY.de);
});

test("Texte: keine Händler-/Partnerwörter, Superlative, Länder- oder Heilversprechen", () => {
  for (const l of LOCALES) {
    for (const s of alleTexte(SHOP_START_COPY[l])) {
      assert.doesNotMatch(s, schema.DEALER_WORDS, `${l}: ${s}`);
      assert.doesNotMatch(s, schema.SUPERLATIVE_WORDS, `${l}: ${s}`);
      assert.doesNotMatch(s, schema.HEALTH_WORDS, `${l}: ${s}`);
      assert.equal(claims.hasCountryPromise(s), false, `${l}: ${s}`);
      assert.equal(claims.hasDealerClaim(s), false, `${l}: ${s}`);
    }
  }
});

test("SEO: Titel ≤ 60 (mit „| Platzhirsch“), Beschreibung ≤ 150 ohne Kürzung", () => {
  const n = katalog.markenMitProdukten(WELT).length;
  for (const l of LOCALES) {
    const c0 = startCopy(l);
    // fitTitle normalisiert den Haus-Suffix (ggf. „| Platzhirsch Home Living“), kürzt aber nie den Titel selbst.
    const title = `${c0.metaTitle} | Platzhirsch`;
    assert.ok(fitTitle(title).startsWith(`${c0.metaTitle} | Platzhirsch`), `${l}: Titel wird nicht gekürzt (${title.length})`);
    assert.ok(fitTitle(title).length <= 60);
    const d = c0.metaDescription(n);
    assert.ok(d.length <= 150, `${l}: ${d.length}`);
    assert.equal(clampDescription(d), d, `${l}: Beschreibung unverändert`);
    const st = `${c0.sucheMetaTitle} | Platzhirsch`;
    assert.ok(fitTitle(st).startsWith(st), `${l}: Suchtitel`);
  }
});

test("Suche: normalisiere/abstand", () => {
  assert.equal(suche.normalisiere("Kähler Lyngby Porcelæn – Øre ß"), "kahler lyngby porcelaen ore ss");
  assert.equal(suche.abstand("reidel", "riedel"), 1, "Dreher = 1");
  assert.equal(suche.abstand("kerze", "kerze"), 0);
  assert.ok(suche.abstand("vase", "riedel", 2) > 2);
  assert.equal(suche.praefixAbstand("asoul", "assouline"), 1);
  assert.equal(suche.suchAnfrage(" a "), "");
  assert.equal(suche.suchAnfrage(["  Riedel   Vinum ", "x"]), "Riedel Vinum");
  assert.equal(suche.suchAnfrage("x".repeat(200)).length, suche.SUCHE_MAX_ZEICHEN);
  assert.equal(suche.suchSeite("3"), 3);
  assert.equal(suche.suchSeite("-1"), 1);
  assert.equal(suche.suchSeite("abc"), 1);
});

test("Suche: Präfix, Marke, Plural, Akzente, Synonyme, UND", () => {
  const s = (q, locale = "de") => suche.sucheProdukte(q, { welt: WELT, locale });
  const riedel = katalog.produkteByMarke("riedel", WELT).length;
  assert.equal(s("rie").treffer.filter((p) => p.marke === "riedel").length, riedel, "Präfix trifft alle Riedel");
  assert.equal(s("riedel").treffer.length, s("Riedel").treffer.length);
  assert.ok(s("kerzen").treffer.some((p) => p.kategorie === "duftkerze"), "Plural");
  assert.equal(s("kähler").treffer.length, s("kahler").treffer.length, "Akzente");
  assert.ok(s("candle", "en").treffer.some((p) => p.kategorie === "duftkerze"), "Synonym EN");
  assert.ok(s("lampe").treffer.every((p) => p.kategorie === "tragbare-leuchte"), "Akku-Leuchten");
  const und = s("baobab totem").treffer;
  assert.ok(und.length > 0 && und.every((p) => p.marke === "baobab-collection" && /totem/i.test(p.name)), "UND");
  assert.equal(s("xyzzyq").treffer.length, 0);
  assert.deepEqual(s("Kerze von Baobab").treffer.map((p) => p.slug), s("Kerze Baobab").treffer.map((p) => p.slug), "Füllwörter fallen weg");
});

test("Suche: Tippfehler-Rückfall mit Korrekturhinweis, nur wenn nichts passt", () => {
  const s = (q) => suche.sucheProdukte(q, { welt: WELT, locale: "de" });
  const r = s("reidel");
  assert.equal(r.korrigiert, "riedel");
  assert.equal(r.treffer.length, s("riedel").treffer.length);
  assert.equal(s("asuline").korrigiert, "assouline");
  assert.equal(s("riedel").korrigiert, null, "korrektes Wort ohne Hinweis");
  assert.equal(s("xyz").korrigiert, null, "unter 4 Zeichen keine Tippfehler-Suche");
});

test("Suche: Ranking – Treffer im Namen vor Treffern nur im Synonym", () => {
  const r = suche.sucheProdukte("karaffe", { welt: WELT, locale: "de" }).treffer;
  assert.ok(r.length > 0);
  assert.equal(r[0].kategorie, "karaffe");
});

test("Suche: Marken- und Kategorie-Treffer", () => {
  const m = suche.sucheMarken("cire", start.shopMarken());
  assert.deepEqual(m.map((x) => x.slug), ["cire-trudon"]);
  const k = suche.sucheKategorien("vasen", [{ slug: "vase", label: "Vasen und Gefäße" }, { slug: "glas", label: "Glas" }]);
  assert.deepEqual(k.map((x) => x.slug), ["vase"]);
});

test("Suche: schnell genug für den Server (Index einmal je Sprache)", () => {
  suche._leereSuchCache();
  const t0 = performance.now();
  for (const q of ["kerze", "riedel vinum", "reidel", "vase", "gläser", "assouline paris", "akku", "geschenk", "trudon", "pinot"]) suche.sucheProdukte(q, { welt: WELT, locale: "de" });
  const ms = performance.now() - t0;
  assert.ok(ms < 1500, `${ms.toFixed(0)} ms für Index + 10 Suchen`);
});
