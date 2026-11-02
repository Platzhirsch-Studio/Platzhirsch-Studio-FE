// tests/unit/wellness-produkte.test.mjs
// Herstellerkatalog (Bad & Wellness / Küchengeräte, 31.10.2026): src/lib/katalog.
// Prüft für ALLE Marken-Dateien: Schema gültig, 4 Sprachen, keine Preise/
// Superlative/Heilversprechen, kein Händlerwort in den Daten, jedes Bild hat
// Quelle, existiert, hat die angegebene Größe (≤ 1600 px) und steht in
// docs/bildquellen/QUELLEN.md, Slugs eindeutig. Dazu Seiten-/SEO-Regeln (JSON-LD ohne offers, Sitemap, Einblicke,
// Messages, Client-Namespace).
// Aufruf: node --test tests/unit/wellness-produkte.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const require = createRequire(path.join(ROOT, "package.json"));

const schema = await import("../../src/lib/katalog/schema.js");
const katalog = await import("../../src/lib/katalog/index.js");
const welten = await import("../../src/lib/katalog/welten.js");
const { produktSchema, produktListeSchema } = await import("../../src/components/Katalog/katalogSchema.js");
const { preisOffer, formatEuro } = await import("../../src/components/Katalog/preis.js");
const { katalogPreiseAn } = await import("../../src/lib/katalog/config.js");
const { katalogSitemapPages } = await import("../../src/lib/seo/sitemap/extraPages.js");
const { templateOf } = await import("../../src/lib/einblicke/routes.js");
const { SERVER_ONLY_NAMESPACES } = await import("../../src/components/Reusable/clientMessages.js");

const MARKEN_DIR = "src/lib/katalog/marken";

test("jede Datei in src/lib/katalog/marken ist im Index eingetragen (und umgekehrt)", () => {
  const files = fs.readdirSync(path.join(ROOT, MARKEN_DIR)).filter((f) => f.endsWith(".js")).map((f) => f.replace(/\.js$/, "")).sort();
  assert.deepEqual(Object.keys(katalog.MARKEN_DATEIEN).sort(), files);
  // 8 Bad-&-Wellness-Marken + 6 Küchengeräte-Marken (Nr. 19–24) + Baobab Collection (Nr. 27)
  for (const s of ["agape", "dornbracht", "antoniolupi", "starpool", "soleum", "fabio-alemanno", "aquavia-spa", "naggura", "gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker", "baobab-collection", "riedel", "cire-trudon"]) assert.ok(files.includes(s), s);
});

test("Schema: alle Marken-Dateien gültig (4 Sprachen, Wortregeln, Bilder mit Quelle)", () => {
  const errors = Object.entries(katalog.MARKEN_DATEIEN).flatMap(([slug, mod]) => schema.validateMarkenDatei(slug, mod));
  assert.deepEqual(errors, []);
});

test("Agape ohne Händlersatz, alle anderen mit Schalter dealer: true; Welt passt zum Bereich", () => {
  assert.equal(katalog.markeBySlug("agape").dealer, false);
  // Nr. 34: Spiegelau/Nachtmann ohne Händlersatz, bis die Händleraussage bestätigt ist
  const OHNE_HAENDLERSATZ = ["agape", "spiegelau", "nachtmann"];
  for (const m of katalog.KATALOG_MARKEN.filter((x) => !OHNE_HAENDLERSATZ.includes(x.slug))) assert.equal(m.dealer, true, m.slug);
  // Bewusst geändert 31.10.2026 (K2, Welt je Produkt): Standard = Welt der Marke; abweichende Welt nur mit Feld welt im Produkt,
  // und der Bereich muss zur Welt passen.
  const roh = new Map(Object.values(katalog.MARKEN_DATEIEN).flatMap((m) => m.PRODUKTE.map((p) => [p.slug, p])));
  for (const p of katalog.ALLE_PRODUKTE) {
    const mw = katalog.markeBySlug(p.marke).welt;
    if (p.welt !== mw) assert.equal(roh.get(p.slug).welt, p.welt, `${p.slug}: andere Welt als die Marke nur mit Feld welt`);
    assert.ok(welten.WELTEN[p.welt].bereiche.includes(p.bereich), `${p.slug}: Bereich ${p.bereich} gehört nicht in die Welt ${p.welt}`);
  }
  for (const [w, list] of Object.entries(schema.WELT_BEREICHE)) assert.deepEqual([...list], [...welten.WELTEN[w].bereiche], `WELT_BEREICHE = WELTEN.bereiche (${w})`);
  // Dornbracht-Küchenarmaturen/-becken in der Küchengeräte-Welt (Markenseite /kuechengeraete/marke/dornbracht)
  const dk = katalog.produkteByMarke("dornbracht", "kuechengeraete");
  assert.equal(dk.length, 12);
  assert.ok(dk.every((p) => p.bereich === "kueche"));
  assert.ok(katalog.markenMitProdukten("kuechengeraete").some((m) => m.slug === "dornbracht"));
  assert.ok(katalog.katalogPfade().some((e) => e.path === "/kuechengeraete/marke/dornbracht"));
  assert.ok(katalog.produkteByMarke("dornbracht", "bad-wellness").every((p) => p.welt === "bad-wellness"));
  for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.marke === "naggura")) assert.equal(p.bereich, "objekt", "Naggura nur Objekt");
});

test("Slugs global eindeutig und mit Marken-Präfix", () => {
  const slugs = katalog.ALLE_PRODUKTE.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "doppelte Slugs");
  for (const p of katalog.ALLE_PRODUKTE) assert.ok(p.slug.startsWith(`${p.marke}-`), `${p.slug} sollte mit "${p.marke}-" beginnen`);
});

test("Händlerwort nirgends in den Daten (Texte, MARKE-Werte)", () => {
  for (const p of katalog.ALLE_PRODUKTE) for (const t of schema.produktTexte(p)) assert.doesNotMatch(t, schema.DEALER_WORDS, p.slug);
  for (const m of katalog.KATALOG_MARKEN) for (const v of Object.values(m)) if (typeof v === "string") assert.doesNotMatch(v, schema.DEALER_WORDS, m.slug);
});

test("Wortregeln greifen (Negativ-Beispiele)", () => {
  const base = katalog.produktBySlug("soleum-lagoon");
  const mit = (kurzDe) => schema.validateProdukt({ ...base, kurz: { ...base.kurz, de: kurzDe } }, { marke: "soleum" });
  assert.ok(mit("Jetzt nur 8.280 € statt UVP").some((e) => /Preis/.test(e)));
  assert.ok(mit("Die beste Liege der Welt").some((e) => /Superlativ/.test(e)));
  assert.ok(mit("Fördert die Durchblutung und lindert Rheuma").some((e) => /Heil/.test(e)));
  assert.ok(mit("Platzhirsch ist offizieller Händler").some((e) => /Händler/.test(e)));
  assert.ok(schema.validateProdukt({ ...base, preis: 1 }, { marke: "soleum" }).some((e) => /preis/.test(e)));
  assert.ok(schema.validateProdukt({ ...base, price: 1 }, { marke: "soleum" }).some((e) => /preis/.test(e)));
  // keine Fehlalarme bei französischen Maßwörtern
  assert.deepEqual(mit("Hauteur, largeur et profondeur sur mesure, siège rabattable"), []);
});

test("Bilder: Datei existiert, Größe stimmt, Quelle steht in QUELLEN.md", async () => {
  const sharp = require("sharp");
  const quellen = read("docs/bildquellen/QUELLEN.md");
  for (const p of katalog.ALLE_PRODUKTE) {
    for (const b of p.bilder) {
      const file = path.join(ROOT, "public", b.src);
      assert.ok(fs.existsSync(file), `${p.slug}: ${b.src} fehlt`);
      const meta = await sharp(file).metadata();
      assert.equal(meta.width, b.width, `${b.src} width`);
      assert.equal(meta.height, b.height, `${b.src} height`);
      assert.ok(Math.max(meta.width, meta.height) <= 1600, `${b.src} > 1600 px (tools/images/optimize-katalog.mjs)`);
      const name = b.src.replace("/Images/Wellness/", "");
      assert.ok(quellen.includes(name), `${name} nicht in QUELLEN.md`);
      assert.ok(quellen.includes(b.quelleUrl), `${b.quelleUrl} nicht in QUELLEN.md`);
    }
  }
});

test("Soleum: nur fertige Produkte (Inhaber 31.10.2026); keine erfundenen Werte", () => {
  const s = katalog.produkteByMarke("soleum");
  // Inhaber-Vorgabe 31.10.2026: nur fertige Produkte, keine Bausteine/Bausätze/Zubehör.
  const FERTIG = ["flying-carpet", "rose-red", "lagoon", "mythos", "snow-white", "lovt", "woodon", "solonda", "ellipse", "omega"].map((x) => `soleum-${x}`);
  assert.deepEqual(s.map((p) => p.slug).sort(), [...FERTIG].sort());
  // Nr. 25: Vollständigkeits-Check ohne offene Produkte
  const voll = read("qa-screenshots/wellness/produkte/vollstaendigkeit-soleum.md");
  assert.match(voll, /Offen \(FEHLT\): \*\*0\*\*/);
  assert.doesNotMatch(voll, /\| \*\*FEHLT\*\* \|/);
  for (const n of ["Flying Carpet", "ROSE RED", "LAGOON", "MYTHOS", "SNOW WHITE", "LOVT", "WOODON", "SOLONDA", "ELLIPSE"]) assert.ok(s.some((p) => p.name === n), n);
  assert.match(voll, /bewusst ausgelassen: Bausteine\/Zubehör laut Inhaber 31\.10\.2026/);
  for (const p of s) {
    assert.ok(p.bilder.length >= 1, `${p.slug} ohne Bild`);
    assert.ok(p.quellen.every((q) => /^https:\/\/www\.soleum\.(at|de)\//.test(q)), `${p.slug}: Quelle nicht soleum.at/.de`);
    assert.ok(p.bilder.every((b) => /^https:\/\/www\.soleum\.(at|de)\//.test(b.quelleUrl)));
  }
  // 30–45 °C / Plug & Play nur dort, wo die eigene Produktseite es nennt (soleum.de, Technische Daten).
  for (const p of s) {
    const de = schema.produktTexte(p).join(" ");
    if (/30–45 °C|Plug & Play/.test(de)) assert.ok(p.quellen.some((q) => q.startsWith("https://www.soleum.de/featured_item/")), `${p.slug}: Temperatur/Plug&Play ohne Beleg`);
  }
});

test("Welten und Pfade: gleiche deutsche Pfade, Bereich → Welt", () => {
  assert.equal(welten.weltOfBereich("kueche"), "kuechengeraete");
  assert.equal(welten.weltOfBereich("accessoires"), "accessoires");
  assert.equal(welten.WELTEN.accessoires.hub, "/accessoires"); // Shop-Startseite (Shop-Team 31.10.2026)
  for (const b of ["bad", "wellness", "objekt"]) assert.equal(welten.weltOfBereich(b), "bad-wellness");
  assert.equal(welten.produktPath("bad-wellness", "soleum-lagoon"), "/bad-wellness/produkte/soleum-lagoon");
  assert.equal(welten.markePath("kuechengeraete", "miele"), "/kuechengeraete/marke/miele");
  assert.equal(welten.beratungThema("objekt"), "wellness,objekt");
  // Marken ohne Produkte haben keine Seite
  const pfade = katalog.katalogPfade().map((e) => e.path);
  assert.ok(pfade.includes("/bad-wellness/marke/soleum"));
  for (const m of katalog.KATALOG_MARKEN.filter((x) => !katalog.hatProdukte(x.slug))) assert.ok(!pfade.some((p) => p.endsWith(`/marke/${m.slug}`)), m.slug);
  if (!katalog.produkteByWelt("kuechengeraete").length) assert.ok(!pfade.includes("/kuechengeraete/produkte"));
});

test("JSON-LD: Product nur mit name, brand, image, description, category – offers NUR mit anzeigbarem Preis (Nr. 26/27), nie rating/review", () => {
  const heute = "2026-10-31";
  for (const p of katalog.ALLE_PRODUKTE) {
    const offer = preisOffer(schema.preisAktiv(p, { heute }), "https://x");
    const ld = produktSchema(p, katalog.markeBySlug(p.marke), "de", "X", offer);
    if (offer) {
      assert.match(JSON.stringify(ld.offers), /"priceCurrency":"EUR"/);
      assert.doesNotMatch(JSON.stringify(ld), /aggregateRating|"review"/);
      continue;
    }
    assert.equal(ld["@type"], "Product");
    assert.ok(ld.name && ld.brand?.name && ld.description && ld.category);
    assert.doesNotMatch(JSON.stringify(ld), /aggregateRating|"review"|"offers"|"price"|priceCurrency/);
  }
  const list = produktListeSchema(katalog.produkteByMarke("soleum"), "en", { name: "x", path: "/bad-wellness/marke/soleum" });
  assert.doesNotMatch(JSON.stringify(list), /aggregateRating|"review"|"offers"|"price"/);
  assert.match(list.url, /^https:\/\/platzhirsch\.studio\/en\/bad-wellness\/marke\/soleum$/);
});

test("Preise (Nr. 26/27): nur Küche (UVP ab) bzw. nur Baobab (Verkaufspreis), mit Quelle und Stand, veraltet = ausgeblendet", () => {
  const kueche = { slug: "miele-x", marke: "miele", bereich: "kueche" };
  const baobab = { slug: "baobab-collection-x", marke: "baobab-collection", bereich: "accessoires" };
  const uvp = { art: "uvp-ab", uvpAb: 2490, stand: "2026-10-01", quelle: "https://www.miele.at/x" };
  const vk = { art: "verkaufspreis", betrag: 79, stand: "2026-10-01", quelle: "https://eu.baobabcollection.com/de-at/x" };
  assert.deepEqual(schema.validatePreis({ ...kueche, preis: uvp }), []);
  assert.deepEqual(schema.validatePreis({ ...baobab, preis: vk }), []);
  const { betrag: _b, ...ohneBetrag } = vk;
  assert.deepEqual(schema.validatePreis({ ...baobab, preis: { ...ohneBetrag, varianten: [{ name: "Max 16", betrag: 79 }, { name: "Max 24", betrag: 149 }] } }), []);
  assert.ok(schema.validatePreis({ slug: "soleum-x", marke: "soleum", bereich: "wellness", preis: uvp }).some((e) => /kueche/.test(e)), "UVP außerhalb der Küche");
  assert.ok(schema.validatePreis({ ...kueche, preis: vk }).some((e) => /baobab/.test(e)), "Verkaufspreis außerhalb Baobab");
  assert.ok(schema.validatePreis({ ...kueche, preis: { ...uvp, quelle: "" } }).some((e) => /quelle/.test(e)));
  assert.ok(schema.validatePreis({ ...kueche, preis: { ...uvp, stand: "" } }).some((e) => /stand/.test(e)));
  assert.ok(schema.validatePreis({ ...kueche, preis: { uvpAb: 1, stand: "2026-10-01", quelle: "https://x" } }).some((e) => /art/.test(e)));
  // Alter: UVP 6 Monate, Verkaufspreis 3 Monate
  assert.ok(schema.preisAktiv({ ...kueche, preis: uvp }, { heute: "2027-03-31" }));
  assert.equal(schema.preisAktiv({ ...kueche, preis: uvp }, { heute: "2027-04-02" }), null);
  assert.ok(schema.preisAktiv({ ...baobab, preis: vk }, { heute: "2026-12-31" }));
  assert.equal(schema.preisAktiv({ ...baobab, preis: vk }, { heute: "2027-01-02" }), null);
  assert.equal(schema.preisAktiv({ ...kueche, preis: uvp }, { heute: "2026-10-31", an: false }), null);
  assert.equal(katalogPreiseAn({}), true, "Standard an (Nr. 26)");
  assert.equal(katalogPreiseAn({ KATALOG_PREISE: "aus" }), false);
  assert.deepEqual(preisOffer(uvp, "u"), { "@type": "AggregateOffer", lowPrice: 2490, priceCurrency: "EUR", priceValidUntil: "2027-04-01", url: "u" });
  assert.match(formatEuro(2490, "de"), /€\s?2\.490/);
  // Prüfskript-Meldung: veraltete Preise in den Daten
  const heute = new Date().toISOString().slice(0, 10);
  const veraltet = katalog.ALLE_PRODUKTE.filter((p) => p.preis && schema.preisVeraltet(p.preis, heute)).map((p) => p.slug);
  if (veraltet.length) console.log(`# HINWEIS veraltete Preise (ausgeblendet): ${veraltet.join(", ")}`);
  for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.preis)) assert.deepEqual(schema.validatePreis(p), [], p.slug);
});

test("Nr. 28: Verkaufspreis auch für Riedel und Cire Trudon; Querverweise und verwandt nur auf vorhandene Ziele", () => {
  const vk = { art: "verkaufspreis", betrag: 39, stand: "2026-10-01", quelle: "https://www.riedel.com/de-at/x" };
  for (const marke of ["riedel", "cire-trudon", "baobab-collection"]) assert.deepEqual(schema.validatePreis({ slug: `${marke}-x`, marke, bereich: "accessoires", preis: vk }), [], marke);
  for (const m of ["riedel", "cire-trudon"]) assert.equal(katalog.markeBySlug(m).welt, "accessoires");
  assert.deepEqual(katalog.markeBySlug("riedel").querverweise.map((q) => `${q.welt}/${q.kategorie}`), ["kuechengeraete/weinklima"]);
  // Querverweis nur, wenn das Ziel Produkte hat
  for (const q of katalog.querverweiseVon("riedel")) assert.ok(q.anzahl > 0);
  const slugs = new Set(katalog.ALLE_PRODUKTE.map((p) => p.slug));
  for (const p of katalog.ALLE_PRODUKTE) for (const v of p.verwandt || []) assert.ok(slugs.has(v), `${p.slug}: verwandt "${v}" gibt es nicht`);
});

test("Nr. 32: Zalto, Assouline, Kähler, Lyngby Porcelæn, Flos, Tom Dixon – Accessoire-Welt mit Verkaufspreis", () => {
  const neu = ["zalto", "assouline", "kahler", "lyngby-porcelaen", "flos", "tom-dixon"];
  for (const marke of neu) {
    const m = katalog.markeBySlug(marke);
    assert.ok(m, marke);
    assert.equal(m.welt, "accessoires", marke);
    assert.equal(m.dealer, true, marke);
    const vk = { art: "verkaufspreis", varianten: [{ name: "A", betrag: 39, sku: "X1", versandGewichtG: 300, versandMasseCm: [10, 10, 20], zerbrechlich: true }], stand: "2026-10-31", quelle: "https://example.com/p" };
    assert.deepEqual(schema.validatePreis({ slug: `${marke}-x`, marke, bereich: "accessoires", preis: vk }), [], marke);
    for (const p of katalog.produkteByMarke(marke)) assert.equal(p.bereich, "accessoires", p.slug);
  }
  // Flos/Tom Dixon: nur tragbare Leuchten (übriges Sortiment kommt aus dem Backoffice)
  for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.marke === "flos" || x.marke === "tom-dixon")) assert.equal(p.kategorie, "tragbare-leuchte", p.slug);
  // Verkaufspreis bleibt für andere Marken gesperrt
  assert.ok(schema.validatePreis({ slug: "miele-x", marke: "miele", bereich: "kueche", preis: { art: "verkaufspreis", betrag: 1, stand: "2026-10-31", quelle: "https://x" } }).length > 0);
  for (const k of ["bildband", "vase", "geschirr", "tragbare-leuchte"]) assert.deepEqual(schema.KATEGORIEN[k], ["accessoires"], k);
});

test("Nr. 34: Spiegelau und Nachtmann (Riedel-Gruppe) – Accessoire-Welt, Verkaufspreis AT-Shop, ohne Händlersatz", () => {
  for (const marke of ["spiegelau", "nachtmann"]) {
    const m = katalog.markeBySlug(marke);
    assert.ok(m, marke);
    assert.equal(m.welt, "accessoires", marke);
    assert.equal(m.dealer, false, `${marke}: Händleraussage noch nicht bestätigt`);
    const list = katalog.produkteByMarke(marke);
    assert.ok(list.length > 0, marke);
    for (const p of list) {
      assert.equal(p.bereich, "accessoires", p.slug);
      assert.equal(p.preis?.art, "verkaufspreis", p.slug);
      assert.match(p.preis.quelle, /^https:\/\/www\.riedel\.com\/de-at\//, p.slug);
      for (const v of p.preis.varianten) {
        assert.equal(v.zerbrechlich, true, p.slug);
        assert.ok(v.sku, `${p.slug}: SKU`);
      }
    }
  }
  const slugs = new Set(katalog.ALLE_PRODUKTE.map((p) => p.slug));
  for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.marke === "spiegelau" || x.marke === "nachtmann")) for (const z of p.zubehoer || []) assert.ok(slugs.has(z.slug), `${p.slug}: Zubehör ${z.slug}`);
});

test("Paginierung und Gruppierung (Nr. 25): 48 je Seite, Folgeseiten nur wenn nötig", () => {
  const list = Array.from({ length: 101 }, (_, i) => ({ slug: `x-${i}`, kategorie: i % 2 ? "sauna" : "dampfbad" }));
  assert.equal(katalog.SEITE_GROESSE, 48);
  assert.equal(katalog.seitenAnzahl(list), 3);
  assert.equal(katalog.seiteVon(list, 3).length, 5);
  assert.equal(katalog.seitenAnzahl([]), 1);
  assert.deepEqual(katalog.nachKategorie(list).map((g) => g.kategorie), ["sauna", "dampfbad"]);
  assert.equal(welten.seitePath("/a", 1), "/a");
  assert.equal(welten.seitePath("/a", 2), "/a/seite/2");
  for (const e of katalog.katalogPfade().filter((x) => x.seite)) assert.ok(e.seite >= 2);
  assert.ok(katalog.katalogPfade().some((e) => e.path === "/bad-wellness/kategorie/waermeliege"));
});

test("Sitemap: Katalogseiten je Sprache, lastModified = Prüfdatum", () => {
  const pages = katalogSitemapPages();
  assert.deepEqual(pages.map((p) => p.path).sort(), katalog.katalogPfade().map((e) => e.path).sort());
  for (const p of pages) {
    assert.deepEqual(p.locales, ["de", "en", "fr", "it"]);
    assert.match(p.lastModified, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.match(read("src/lib/seo/sitemapEntries.js"), /katalogSitemapPages\(\)/);
});

test("Einblicke: Katalogrouten haben eine Vorlage (keine 404-Sammelroute)", () => {
  assert.equal(templateOf("/de/bad-wellness/produkte"), "/de/bad-wellness/produkte");
  assert.equal(templateOf("/en/bad-wellness/produkte/soleum-lagoon"), "/en/bad-wellness/produkte/[slug]");
  assert.equal(templateOf("/fr/bad-wellness/marke/soleum"), "/fr/bad-wellness/marke/[marke]");
  assert.equal(templateOf("/it/kuechengeraete/produkte/miele-x"), "/it/kuechengeraete/produkte/[slug]");
  assert.equal(templateOf("/de/kuechengeraete/marke/miele"), "/de/kuechengeraete/marke/[marke]");
  assert.equal(templateOf("/de/bad-wellness/kategorie/sauna/seite/2"), "/de/bad-wellness/kategorie/[kategorie]/seite/[seite]");
  assert.equal(templateOf("/en/accessoires/produkte/baobab-collection-x"), "/en/accessoires/produkte/[slug]");
  assert.equal(templateOf("/de/accessoires/produkte"), "/de/accessoires/produkte");
});

test("Messages: katalog.* in 4 Sprachen für alle Kategorien, Bereiche und Maße; Namespace server-only", () => {
  for (const l of ["de", "en", "fr", "it"]) {
    const k = JSON.parse(read(`src/messages/${l}.json`)).katalog;
    assert.ok(k, `${l}: katalog fehlt`);
    for (const c of Object.keys(schema.KATEGORIEN)) assert.ok(k.kategorie[schema.kategorieKey(c)], `${l}: kategorie.${c}`);
    for (const b of schema.BEREICHE) assert.ok(k.bereich[b], `${l}: bereich.${b}`);
    for (const m of schema.MASS_KEYS) assert.ok(k.mass[m], `${l}: mass.${m}`);
    for (const w of Object.values(welten.WELTEN)) assert.ok(k.welt[w.key]?.produkteTitle, `${l}: welt.${w.key}`);
    assert.doesNotMatch(JSON.stringify(k), schema.DEALER_WORDS);
  }
  assert.ok(SERVER_ONLY_NAMESPACES.includes("katalog"));
  for (const f of ["KatalogFilter.js", "MerkenButton.js"]) {
    const src = read(`src/components/Katalog/${f}`);
    assert.match(src, /^"use client";/);
    assert.doesNotMatch(src, /useTranslations|katalog\./, `${f} darf keine Messages lesen (Props)`);
  }
});

test("Seiten: statisch, dynamicParams = false, Händlersatz nur über Claim-Guard", () => {
  for (const w of ["bad-wellness", "kuechengeraete", "accessoires"]) {
    for (const f of [
      `src/app/[locale]/${w}/produkte/page.js`,
      `src/app/[locale]/${w}/produkte/[slug]/page.js`,
      `src/app/[locale]/${w}/marke/[marke]/page.js`,
      `src/app/[locale]/${w}/marke/[marke]/seite/[seite]/page.js`,
      `src/app/[locale]/${w}/kategorie/[kategorie]/page.js`,
      `src/app/[locale]/${w}/kategorie/[kategorie]/seite/[seite]/page.js`,
    ]) {
      const src = read(f);
      assert.match(src, /export const dynamicParams = false/, f);
      assert.match(src, /generateStaticParams/, f);
      assert.match(src, /generateMetadata/, f);
      assert.match(src, /export const revalidate = 86400/, f);
      assert.match(src, new RegExp(`const WELT = "${w}"`), f);
    }
  }
  for (const f of ["ProduktDetail.js", "KatalogListe.js"]) {
    const src = read(`src/components/Katalog/${f}`);
    assert.match(src, /dealerStatement\(marke\.name, locale\)/);
    assert.match(src, /marke\.dealer \?|marke\?\.dealer \?/);
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/marke\??\.dealer|dealerStatement|dealerLine|data-kat-dealer/g, "");
    assert.doesNotMatch(code, /händler|dealer|revendeur|rivenditore/i, f);
  }
  const detail = read("src/components/Katalog/ProduktDetail.js");
  assert.match(detail, /object-contain/);
  assert.match(detail, /data-pin-nopin="true"/);
  assert.match(detail, /produkt\.bildQuelle/);
  assert.match(detail, /schreibenHref/);
});

test("Preisbezeichnung (Nr. 34): uvp | herstellerpreis, Zusatz, Anzeige 4 Sprachen, Offer = angezeigter Betrag", async () => {
  const { preisTexte } = await import("../../src/components/Katalog/preis.js");
  const kueche = { slug: "quooker-x", marke: "quooker", bereich: "kueche" };
  const basis = { art: "uvp-ab", uvpAb: 1490, stand: "2026-10-31", quelle: "https://www.quooker.at/x" };
  const zusatz = { de: "Systempreis mit Reservoir PRO3", en: "System price with PRO3 tank", fr: "Prix du système avec réservoir PRO3", it: "Prezzo del sistema con serbatoio PRO3" };
  assert.deepEqual(schema.validatePreis({ ...kueche, preis: { ...basis, bezeichnung: "herstellerpreis", zusatz } }), []);
  assert.deepEqual(schema.validatePreis({ ...kueche, preis: { ...basis, bezeichnung: "uvp" } }), []);
  assert.ok(schema.validatePreis({ ...kueche, preis: { ...basis, bezeichnung: "listenpreis" } }).some((e) => /bezeichnung/.test(e)));
  assert.ok(schema.validatePreis({ ...kueche, preis: { ...basis, zusatz: { de: "nur deutsch" } } }).some((e) => /zusatz/.test(e)));
  assert.ok(schema.validatePreis({ ...kueche, preis: { ...basis, zusatz: { ...zusatz, de: "ab € 1.490" } } }).some((e) => /zusatz/.test(e)));
  assert.equal(schema.preisBezeichnung(basis), "uvp", "Standard uvp");
  // Anzeige über die echten Messages (Namespace katalog)
  for (const locale of schema.KATALOG_LOCALES) {
    const msg = JSON.parse(fs.readFileSync(path.join(ROOT, `src/messages/${locale}.json`), "utf8")).katalog;
    const t = (k, v = {}) => k.split(".").reduce((o, x) => o?.[x], msg).replace(/\{(\w+)\}/g, (_, n) => v[n]);
    for (const b of ["herstellerAb", "uvpAb", "herstellerKurz", "kurz"]) assert.ok(msg.preis[b], `${locale}: katalog.preis.${b}`);
    const h = preisTexte({ ...basis, bezeichnung: "herstellerpreis", zusatz }, t, locale);
    const u = preisTexte(basis, t, locale);
    assert.notEqual(h.zeilen[0], u.zeilen[0], `${locale}: Herstellerpreis ≠ UVP`);
    assert.equal(h.zusatz, zusatz[locale]);
    assert.equal(u.zusatz, null);
    assert.equal(h.paket, null, "Anfrage-Satz steht in der Preiszeile");
    assert.ok(h.zeilen[0].includes(formatEuro(1490, locale)), `${locale}: Betrag in der Zeile`);
  }
  const de = JSON.parse(fs.readFileSync(path.join(ROOT, "src/messages/de.json"), "utf8")).katalog.preis;
  assert.match(de.herstellerAb, /^Herstellerpreis ab \{preis\} inkl\. 20 % MwSt\. · Stand \{datum\} · Ihr Preis mit Lieferung, Einbau und Montage auf Anfrage$/);
  assert.match(de.uvpAb, /^UVP ab \{preis\} inkl\. 20 % MwSt\. · Stand \{datum\} · Ihr Preis mit Lieferung, Einbau und Montage auf Anfrage$/);
  assert.doesNotMatch(JSON.stringify(de), /zzgl\. Lieferung und Montage/);
  // JSON-LD: lowPrice = angezeigter Betrag, unabhängig von der Bezeichnung
  assert.equal(preisOffer({ ...basis, bezeichnung: "herstellerpreis", zusatz }, "u").lowPrice, 1490);
  // Daten: Shop-Preise ohne UVP (Nr. 34) bei Liebherr, Quooker, Miele, BORA; Quooker-Armaturen mit Systempreis-Zusatz
  for (const m of ["liebherr", "quooker", "miele", "bora"])
    for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.marke === m && x.preis)) assert.equal(p.preis.bezeichnung, "herstellerpreis", p.slug);
  for (const p of katalog.ALLE_PRODUKTE.filter((x) => x.marke === "quooker" && x.kategorie === "armatur-kochendwasser" && x.slug !== "quooker-cube" && x.preis)) assert.equal(p.preis.zusatz?.de, "Systempreis mit Reservoir PRO3", p.slug);
});

test("K16: Ausgewählte Produkte zentral, je Welt höchstens 4, je Marke eines, keine Markierung in den Markendateien", () => {
  for (const [w, slugs] of Object.entries(katalog.AUSGEWAEHLT)) {
    assert.ok(slugs.length <= 4, w);
    const list = katalog.ausgewaehlteProdukte(w);
    assert.equal(list.length, slugs.length, `${w}: alle Slugs vorhanden und in der Welt`);
    assert.equal(new Set(list.map((p) => p.marke)).size, list.length, `${w}: je Marke eines`);
  }
  for (const [slug, mod] of Object.entries(katalog.MARKEN_DATEIEN)) assert.ok(mod.PRODUKTE.every((p) => !("ausgewaehlt" in p)), `${slug}: ausgewaehlt nur zentral (index.js)`);
  assert.deepEqual(katalog.ausgewaehlteProdukte("kuechengeraete").map((p) => p.marke), ["gaggenau", "miele", "bora", "quooker"]);
  assert.deepEqual(katalog.ausgewaehlteProdukte("bad-wellness").map((p) => p.marke), ["starpool", "soleum", "dornbracht", "antoniolupi"]);
  assert.deepEqual(katalog.ausgewaehlteProdukte("accessoires").map((p) => p.marke), ["baobab-collection", "riedel", "cire-trudon", "zalto"]);
});

test("K2: neue Kategorien mit Texten; Waschtischplatten und Handtuchwärmer umgehängt; Leuchte auch Küche", () => {
  for (const k of ["waschtischplatte", "handtuchwaermer", "kuechenzubehoer"]) assert.ok(schema.KATEGORIEN[k], k);
  assert.ok(schema.KATEGORIEN.leuchte.includes("kueche"));
  for (const l of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${l}.json`)).katalog;
    for (const k of ["waschtischplatte", "handtuchwaermer", "kuechenzubehoer"]) assert.ok(m.kategorie[schema.kategorieKey(k)], `${l}: ${k}`);
  }
  for (const s of ["agape-memory-handtuchwaermer", "agape-sen-handtuchwaermer", "dornbracht-handtuchwaermer"]) assert.equal(katalog.produktBySlug(s).kategorie, "handtuchwaermer", s);
  for (const s of ["agape-ell-platte", "agape-petra-platte", "antoniolupi-flumood-platte", "antoniolupi-legno"]) assert.equal(katalog.produktBySlug(s).kategorie, "waschtischplatte", s);
});

test("K9/K18/K20: Naggura ohne MDR-Merkmal, Objekt = Hotel & Spa; Preise Assouline/Tom Dixon pausiert; Flos-Querverweis", () => {
  for (const p of katalog.produkteByMarke("naggura")) assert.ok(schema.produktTexte(p).every((t) => !/MDR|Medizinprodukt|medical device/i.test(t)), p.slug);
  assert.equal(JSON.parse(read("src/messages/de.json")).katalog.bereich.objekt, "Hotel & Spa");
  for (const m of ["assouline", "tom-dixon"]) {
    assert.ok(schema.PREISE_PAUSIERT[m], m);
    for (const p of katalog.produkteByMarke(m)) assert.equal(schema.preisAktiv(p, { heute: "2026-10-31" }), null, p.slug);
  }
  assert.ok(katalog.produkteByMarke("riedel").some((p) => schema.preisAktiv(p, { heute: "2026-10-31" })), "andere Marken weiter mit Preis");
  assert.equal(katalog.markeBySlug("flos").weitereSeite.href, "/ueber-uns/marken/flos");
});
