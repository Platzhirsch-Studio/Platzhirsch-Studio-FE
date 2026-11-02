// tests/unit/shop-liste-pdp.test.mjs — Shop-Liste + Produktseite der Accessoire-Welt
// (Inhaber 31.10.2026: „echtes Webshop-Gefühl“): Filter/Sortierung/URL,
// Facetten, Reihenfolge, Preise nur wo anzeigbar (pausiert → keiner),
// Badges nur aus Daten, Grundpreis nur in Volumen-Kategorien, „Passt dazu“,
// „Zuletzt angesehen“ (Eingabeprüfung). Run: node --test tests/unit/shop-liste-pdp.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  FACETTEN,
  SEITE,
  angesehenLesen,
  angesehenMerken,
  auswahlAusQuery,
  bildKurz,
  bildSrc,
  euroAusCent,
  facetten,
  filtern,
  grundpreisVariante,
  hatAuswahl,
  kachelPreis,
  leereAuswahl,
  mischen,
  preisStufe,
  queryAus,
  sortieren,
} from "../../src/lib/katalog/shopListe.js";
import { eintraegeFuer, eintragVon, facettenLabels, facettenVon, kachelBilder, passtDazu, variantenAnzeige } from "../../src/lib/katalog/shopIndex.js";
import { SHOP_LISTE_COPY } from "../../src/lib/katalog/shopListeCopy.js";
import { produkteByWelt, produktBySlug, produkteByKategorie } from "../../src/lib/katalog/index.js";
import { PREISE_PAUSIERT, preisAktiv } from "../../src/lib/katalog/schema.js";
import { grundpreis } from "../../src/lib/shop/catalog.js";

const HEUTE = "2026-10-31";
const e = (o) => ({ s: "x", n: "X", m: "riedel", k: "glas", i: ["/Images/a.webp", 1, 1], j: null, p: null, x: null, v: 0, o: null, a: 0, ...o });

test("preisStufe: Grenzen exklusiv, ohne Preis null", () => {
  assert.equal(preisStufe(4999), "bis-50");
  assert.equal(preisStufe(5000), "50-100");
  assert.equal(preisStufe(25000), "ab-250");
  assert.equal(preisStufe(null), null);
  assert.equal(preisStufe(0), null);
});

test("URL: auswahlAusQuery ↔ queryAus, nur Slugs, fremde Parameter bleiben", () => {
  const { sel, sort } = auswahlAusQuery("?marke=riedel,zalto,<script>&preis=50-100&sort=preis-auf&utm_source=x");
  assert.deepEqual(sel.marke, ["riedel", "zalto"]);
  assert.deepEqual(sel.preis, ["50-100"]);
  assert.equal(sort, "preis-auf");
  assert.equal(queryAus(sel, sort, "?utm_source=x&seite=3"), "?utm_source=x&marke=riedel,zalto&preis=50-100&sort=preis-auf");
  assert.equal(queryAus(leereAuswahl(), "empfohlen"), "");
  assert.equal(auswahlAusQuery("?sort=hack").sort, "empfohlen");
  assert.deepEqual(auswahlAusQuery("?marke=riedel,foo", { marke: ["riedel"] }).sel.marke, ["riedel"]);
  assert.equal(hatAuswahl(leereAuswahl()), false);
});

test("filtern: ODER in der Facette, UND zwischen Facetten; Facetten disjunktiv gezählt", () => {
  const list = [e({ s: "a", m: "riedel", k: "glas", p: 3000 }), e({ s: "b", m: "zalto", k: "glas", p: 6000 }), e({ s: "c", m: "riedel", k: "karaffe", p: 12000 }), e({ s: "d", m: "kahler", k: "vase", f: { material: "steingut" } })];
  const sel = { ...leereAuswahl(), marke: ["riedel", "zalto"], kategorie: ["glas"] };
  assert.deepEqual(filtern(list, sel).map((x) => x.s), ["a", "b"]);
  const f = facetten(list, sel);
  // Marken-Zählung gilt bei gewählter Kategorie glas (ohne die eigene Facette)
  assert.deepEqual(f.marke.find((o) => o.value === "riedel"), { value: "riedel", count: 1 });
  // Kategorie-Zählung gilt bei gewählten Marken riedel/zalto
  assert.deepEqual(f.kategorie.map((o) => [o.value, o.count]).sort(), [["glas", 2], ["karaffe", 1]]);
  assert.deepEqual(f.preis.map((o) => o.value), ["bis-50", "50-100"]);
  assert.deepEqual(f.material, []);
  assert.deepEqual(Object.keys(f), [...FACETTEN]);
});

test("sortieren: Preis auf/ab mit preislosen am Ende, Name per Collator, Standard nach r", () => {
  const list = [e({ s: "a", n: "b", p: 500, r: 2 }), e({ s: "b", n: "A", p: null, r: 0 }), e({ s: "c", n: "c", p: 100, r: 1 })];
  assert.deepEqual(sortieren(list, "preis-auf").map((x) => x.s), ["c", "a", "b"]);
  assert.deepEqual(sortieren(list, "preis-ab").map((x) => x.s), ["a", "c", "b"]);
  assert.deepEqual(sortieren(list, "name").map((x) => x.s), ["b", "a", "c"]);
  assert.deepEqual(sortieren(list).map((x) => x.s), ["b", "c", "a"]);
});

test("mischen: Auswahl zuerst, reihum je Marke, ohne Bild zuletzt, deterministisch", () => {
  const list = [e({ s: "r1", m: "r" }), e({ s: "r2", m: "r" }), e({ s: "z1", m: "z" }), e({ s: "n", m: "z", i: null }), e({ s: "k1", m: "k", a: 1 })];
  const out = mischen(list);
  assert.deepEqual(out.map((x) => x.s), ["k1", "r1", "z1", "r2", "n"]);
  assert.deepEqual(out.map((x) => x.r), [0, 1, 2, 3, 4]);
  assert.deepEqual(mischen(list), out);
});

test("Preiszeile: „ab“ nur bei Spanne, Format wie Katalog (de-AT)", () => {
  const c = SHOP_LISTE_COPY.de;
  assert.equal(kachelPreis(e({ p: 4990, x: 4990 }), "de", c).replace(/\s/g, " "), "€ 49,90");
  assert.equal(kachelPreis(e({ p: 11900, x: 65800 }), "de", c).replace(/\s/g, " "), "ab € 119");
  assert.equal(kachelPreis(e({ p: null }), "de", c), null);
  assert.match(euroAusCent(210000, "en"), /€2,100/);
});

test("Grundpreis: gleiche Rechnung wie lib/shop/catalog.js grundpreis()", () => {
  assert.deepEqual(grundpreisVariante(21000, { inhaltMl: 100 }), grundpreis(21000, { menge: 100, einheit: "ml" }));
  assert.deepEqual(grundpreisVariante(6800, { inhaltMl: 500 }), { cent: 13600, je: "1 l" });
  assert.deepEqual(grundpreisVariante(11900, { inhaltG: 500 }), grundpreis(11900, { menge: 500, einheit: "g" }));
  assert.equal(grundpreisVariante(1000, {}), null);
});

test("Katalog: Einträge aus echten Daten – Preise nur wo anzeigbar, pausierte Marken ohne Preis", () => {
  const list = produkteByWelt("accessoires");
  const items = list.map((p) => eintragVon(p, { heute: HEUTE, mode: "test", an: true }));
  for (const [i, it] of items.entries()) {
    const p = list[i];
    if (Object.hasOwn(PREISE_PAUSIERT, p.marke)) assert.equal(it.p, null, `${p.slug}: pausierter Preis sichtbar`);
    if (!preisAktiv(p, { heute: HEUTE })) assert.equal(it.p, null, `${p.slug}: Preis ohne preisAktiv`);
    if (it.p != null) assert.ok(it.x >= it.p);
    if (it.o === 1) assert.ok(it.p != null, `${p.slug}: online ohne Preis`);
    assert.ok(!("neu" in it) && !("rating" in it) && !("lager" in it));
  }
  assert.ok(items.some((x) => x.o === 1), "kein bestellbarer Artikel im Testmodus");
  // Shop aus → kein Badge (weder online noch Anfrage)
  assert.ok(list.slice(0, 50).every((p) => eintragVon(p, { heute: HEUTE, mode: "off" }).o === null));
  // Größe des Index (gemessen 31.10.2026: ≈ 0,34 MB roh, ≈ 40 KB gzip) – Schranke 400 KB roh
  const size = JSON.stringify(items).length;
  assert.ok(size < 400_000, `Index zu groß: ${size}`);
});

test("Bildpfade: kurz ↔ lang verlustfrei", () => {
  const p = { slug: "riedel-x", marke: "riedel" };
  for (const src of ["/Images/Wellness/produkte/riedel/riedel-x-2.webp", "/Images/Wellness/produkte/riedel/anders.webp", "/Images/Andere/y.webp"]) assert.equal(bildSrc({ s: p.slug, m: p.marke }, bildKurz(src, p)), src);
  assert.equal(bildKurz("/Images/Wellness/produkte/riedel/riedel-x-2.webp", p), "~-2.webp");
});

test("Katalog: Kachelbilder unverändert aus den Daten, Hover-Bild ≠ Kachelbild", () => {
  for (const p of produkteByWelt("accessoires").slice(0, 300)) {
    const { i, j } = kachelBilder(p);
    if (!p.bilder.length) assert.equal(i, null);
    else assert.ok(p.bilder.some((b) => b.src === bildSrc({ s: p.slug, m: p.marke }, i[0]) && b.width === i[1] && b.height === i[2]));
    if (j) assert.ok(p.bilder.some((b) => b.src === bildSrc({ s: p.slug, m: p.marke }, j[0])) && j[0] !== i[0]);
  }
});

test("Facetten aus Merkmalen: Baobab Duftfamilie, Kähler Material, 4 Sprachen", () => {
  const p = produktBySlug("baobab-collection-scented-candle-sand-siloli");
  const f = facettenVon(p);
  assert.equal(f.duft.slug, "holzig");
  assert.equal(f.duft.label.en, "Woody");
  const labels = facettenLabels(produkteByWelt("accessoires"));
  assert.ok(Object.keys(labels.duft).length >= 3);
  assert.ok(Object.keys(labels.material).length >= 2);
  for (const l of Object.values(labels.duft)) assert.deepEqual(Object.keys(l), ["de", "en", "fr", "it"]);
});

test("Server- und Client-Reihenfolge gleich (Kategorie glas)", () => {
  const welt = produkteByWelt("accessoires").map((p) => eintragVon(p, { heute: HEUTE, mode: "test" }));
  const server = eintraegeFuer(produkteByKategorie("accessoires", "glas"), { heute: HEUTE, mode: "test" });
  const client = mischen(welt.filter((x) => x.k === "glas"));
  assert.deepEqual(client.slice(0, SEITE).map((x) => x.s), server.slice(0, SEITE).map((x) => x.s));
  // erste Seite zeigt mehrere Marken
  assert.ok(new Set(server.slice(0, 12).map((x) => x.m)).size >= 3);
});

test("Kaufbox-Varianten: Preis je Variante, Grundpreis nur in Volumen-Kategorien", () => {
  const parfum = produktBySlug("cire-trudon-aphelie-parfum");
  const v = variantenAnzeige(parfum, preisAktiv(parfum, { heute: HEUTE }), "de");
  assert.equal(v.length, 2);
  assert.match(v[0].grundpreis, /2\.100.*\/ 1 l/u);
  const kerze = produktBySlug("baobab-collection-scented-candle-sand-siloli");
  const k = variantenAnzeige(kerze, preisAktiv(kerze, { heute: HEUTE }), "de");
  assert.ok(k.length >= 4 && k.every((x) => x.grundpreis === null), "Kerzen sind Stückware");
  const glas = produktBySlug("riedel-vinum-cabernet-sauvignon-merlot");
  assert.ok(variantenAnzeige(glas, preisAktiv(glas, { heute: HEUTE }), "de").every((x) => x.grundpreis === null));
  assert.deepEqual(variantenAnzeige(glas, null, "de"), []);
});

test("Passt dazu: ohne sich selbst, nur gleiche Welt, mit Bild, höchstens n", () => {
  const p = produktBySlug("riedel-vinum-cabernet-sauvignon-merlot");
  const list = passtDazu(p, 4);
  assert.ok(list.length > 0 && list.length <= 4);
  assert.ok(list.every((x) => x.p.slug !== p.slug && x.p.welt === "accessoires" && x.p.bilder.length));
  assert.equal(new Set(list.map((x) => x.p.slug)).size, list.length);
});

test("Zuletzt angesehen: nur geprüfte Felder, interne Pfade, ohne Doppelte, max 12", () => {
  assert.deepEqual(angesehenLesen("kaputt"), []);
  assert.deepEqual(angesehenLesen(JSON.stringify([{ s: "a", n: "A", h: "https://evil.example/x" }])), []);
  assert.deepEqual(angesehenLesen(JSON.stringify([{ s: "a", n: "A", h: "/accessoires/produkte/a", i: "javascript:alert(1)" }])), []);
  let list = [];
  for (let n = 0; n < 15; n++) list = angesehenMerken(list, { s: `p${n}`, n: `P${n}`, b: "Riedel", h: `/accessoires/produkte/p${n}`, i: `/Images/Wellness/produkte/riedel/p${n}.webp` });
  list = angesehenMerken(list, { s: "p10", n: "P10", b: null, h: "/accessoires/produkte/p10", i: null });
  assert.equal(list.length, 12);
  assert.equal(list[0].s, "p10");
  assert.equal(list.filter((x) => x.s === "p10").length, 1);
});

test("Texte: vier Sprachen mit gleichen Schlüsseln, keine Knappheits-/Bewertungswörter", () => {
  const keys = Object.keys(SHOP_LISTE_COPY.de).sort();
  for (const l of ["en", "fr", "it"]) assert.deepEqual(Object.keys(SHOP_LISTE_COPY[l]).sort(), keys);
  const all = JSON.stringify(SHOP_LISTE_COPY);
  assert.doesNotMatch(all, /nur noch|bestseller|beliebt|sterne|bewertung|händler|partner/i);
});

test("Insel bleibt klein: shopListe.js ohne Importe (lädt nie die Katalogdaten)", () => {
  const src = fs.readFileSync(new URL("../../src/lib/katalog/shopListe.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /^\s*import\s/m);
});
