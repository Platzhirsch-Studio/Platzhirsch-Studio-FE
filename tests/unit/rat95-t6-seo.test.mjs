// Rat 9,5 · T6 (SEO, Katalog-Text & Sprache): Abnahmekriterien aus
// qa-screenshots/rat95/00-plan.md, Abschnitt 5 (T6).
//   node --test tests/unit/rat95-t6-seo.test.mjs
// Live-Teil (doppelte Titel, 404, Regionen) nur mit QA_BASE=http://localhost:3000.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { EXTRA_PAGES, visibleExtraPages } from "../../src/lib/seo/sitemap/extraPages.js";
import { decodeEntities, dropForeignBlocks, splitDescription, blockLanguage } from "../../src/components/ShopCatalog/descriptionBlocks.js";
import { headlineCategories } from "../../src/components/MarkenItems/headline.js";
import { itVoi, distinctProductNames, productTypeFromText, translateProductType, categorySeo, hubSeo, productTitle } from "../../src/lib/seo/shopSeoCopy.js";
import { sanitizeNewsText } from "../../src/lib/news/newsCopy.js";
import * as PM from "../../src/lib/seo/pageMetadata.js";
import { TITLE_MAX, DESC_MAX, fitMetaDescription, brandSafeTitle } from "../../src/lib/seo/brandMeta.js";
import { REGION_GROUPS, REGIONEN_META, neighbourRegions, visibleRegions } from "../../src/lib/seo/regionen.js";
import { passesDoorwayAudit } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { reviewerNode } from "../../src/lib/ratgeber/schema.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const require = createRequire(import.meta.url);
const SITE = "https://platzhirsch.studio";

// ------------------------------------------------------------ A1 Sitemap
test("A1: /arbeitsweise in allen vier Sprachen in sitemap-static (locales + EN-Zeile für llms)", () => {
  const aw = EXTRA_PAGES.find((p) => p.path === "/arbeitsweise");
  assert.deepEqual(aw.locales, ["de", "en", "fr", "it"]);
  assert.ok(aw.en?.label && aw.en?.llms);
  assert.ok(visibleExtraPages({ arbeitsweiseIndexable: true }).some((p) => p.path === "/arbeitsweise"));
  // getStaticEntries schreibt Seiten mit `locales` einmal je Sprache.
  assert.match(read("src/lib/seo/sitemapEntries.js"), /if \(page\.locales\) addLocalizedEntries\(entries, page\.path, page\.locales/);
});

// ------------------------------------------------------------ A2 Produkttexte
const COVER_OPEN = [
  "<p>So entstehen begehbare Kleiderschränke, in denen offene Bereiche und geschlossene Schränke nahtlos ineinander übergehen.</p>",
  "<h3>Materialien &amp; Ausführungen</h3><p>Tutti gli accessori vengono fissati ai montanti con un sistema ad incastro, senza viti a vista e la disposizione può essere modificata e variata nel tempo con estrema facilità</p>",
];

test("A2: CMS-Entities in Überschriften und Labels dekodiert (kein „&amp;“ im sichtbaren Text)", () => {
  assert.equal(decodeEntities("Materialien &amp; Ausführungen"), "Materialien & Ausführungen");
  assert.equal(decodeEntities("Materialien &amp;amp; Ausführungen"), "Materialien & Ausführungen");
  assert.equal(decodeEntities("Ø&nbsp;120&#8239;cm &#x2013; &quot;Torii&quot;"), "Ø 120 cm – \"Torii\"");
  const { spec } = splitDescription(["<h3>Materialien &amp; Ausführungen</h3><p><strong>Gestell &amp; Füße:</strong> Aluminium</p>"]);
  assert.equal(spec[0].title, "Materialien & Ausführungen");
  assert.equal(spec[0].items[0].label, "Gestell & Füße");
});

test("A2: italienischer Absatz auf der DE-Produktseite fällt weg, die deutsche Fallback-Beschreibung auf /en bleibt ganz", () => {
  assert.equal(blockLanguage(COVER_OPEN[1].replace(/<h3>.*<\/h3>/, "")), "it");
  const de = dropForeignBlocks(COVER_OPEN, "de");
  assert.ok(!de.join(" ").includes("Tutti gli"), de.join(" "));
  assert.ok(de.join(" ").includes("begehbare Kleiderschränke"));
  // Leere Gruppe ohne Inhalt verschwindet in splitDescription.
  assert.equal(splitDescription(de).spec.length, 0);
  // /en mit deutschem Fallback-Text: Deutsch ist erlaubt, nichts fällt weg.
  const germanOnly = ["<p>Das Sofa hat eine Struktur aus Holz und wird mit einer Polsterung aus Schaum und Daunen bezogen, die sich der Form anpasst.</p>"];
  assert.deepEqual(dropForeignBlocks(germanOnly, "en"), germanOnly);
  // Ganz englischer Text auf /de (Hersteller ohne Übersetzung): bleibt, nie eine leere Seite.
  const english = ["<p>The sofa is made with a frame of solid wood and it has a seat that is filled with down and foam for the comfort of the body.</p>"];
  assert.deepEqual(dropForeignBlocks(english, "de"), english);
  // Die Produktseite filtert vor Meta, JSON-LD und Ansicht.
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /dropForeignBlocks\(filterManufacturerParagraphs\(product\.descriptionParagraphs, \{ brand: product\.brand \}\), locale\)/);
});

// ------------------------------------------------------------ A8 Marken-H1
test("A8: Marken-H1 nach Produktanzahl (≥ 5 Stück, höchstens 3) – Tréca: Betten zuerst", () => {
  const treca = [
    { label: "Sessel & Hocker", count: 3 },
    { label: "Betten", count: 80 },
    { label: "Chaiselongues", count: 2 },
    { label: "Bettwäsche", count: 6 },
  ];
  assert.deepEqual(headlineCategories(treca).map((c) => c.label), ["Betten", "Bettwäsche"]);
  const many = Array.from({ length: 6 }, (_, i) => ({ label: `K${i}`, count: 10 + i }));
  assert.deepEqual(headlineCategories(many).map((c) => c.label), ["K5", "K4", "K3"]);
  // Keine Kategorie mit 5 Stück: die größten (höchstens 3).
  assert.deepEqual(headlineCategories([{ label: "A", count: 1 }, { label: "B", count: 3 }]).map((c) => c.label), ["B", "A"]);
  assert.match(read("src/components/MarkenItems/markenitems.js"), /categoryList\(headlineCategories\(chapters\.list\)/);
});

// ------------------------------------------------------------ A9 IT voi
const TU = /(?<![\p{L}'’])(?:tu|tuo|tua|tuoi|tue|ti|te|Tu|Tuo|Tua|Tuoi|Tue|Ti|Te)(?![\p{L}])/u;
const TU_VERB = /(?<![\p{L}])(?:puoi|vuoi|hai|devi|scopri|Scopri|lasciati|Lasciati|goditi|Goditi|Rendi|rendi|Richiedi|Scegli|scegli|sentirti)(?![\p{L}])/u;

test("A9: IT-News in der voi-Form – Sätze aus den Backoffice-Texten ohne tu-Formen", () => {
  const backoffice = [
    "Personalizzate la vostra cucina in modo personalizzato e scopri il piacere di cucinare più facilmente.",
    "Venite a trovarci, scopri i design più belli per le feste e scopri come PLATZHIRSCH aggiunge un tocco di qualità e magia natalizia alla tua casa.",
    "Scoprite Dylan nel nostro showroom e lasciati incantare dal suo carisma speciale.",
    "Luce che ti segue: questa è In Vitro Unplugged.",
    "POLIFORM CUCINE ti offre la libertà di progettare la vostra cucina.",
    "Ti presentiamo una selezione di pezzi SOLPURI nei tuoi spazi interni ed esterni.",
    "Una raffinata estensione del tuo living, un luogo in cui sentirti completamente a tuo agio.",
    "Goditi l’estate con le collezioni outdoor. Ora puoi acquistare questi prodotti.",
    "Rendi queste festività indimenticabili. Festeggia il Natale con stile.",
    "Che tu sogni un'eleganza minimalista o calde atmosfere.",
  ];
  for (const s of backoffice) {
    const out = sanitizeNewsText(s, "it");
    assert.ok(!TU.test(out) && !TU_VERB.test(out), `${s}\n→ ${out}`);
  }
  // 3. Person und Substantive bleiben.
  assert.equal(itVoi("La luce crea atmosfera. MINOTTI porta un design elegante."), "La luce crea atmosfera. MINOTTI porta un design elegante.");
  assert.equal(itVoi("Visita allo showroom."), "Visita allo showroom.");
  assert.equal(itVoi("Scopri il tuo divano.", "de"), "Scopri il tuo divano.", "nur IT");
  assert.equal(itVoi("della tua casa e dei tuoi ospiti"), "della vostra casa e dei vostri ospiti");
});

// ------------------------------------------------------------ A10 NAP
test("A10: „Landstraße 11“ in allen T6-Dateien, kein „Massen“; Vorschläge für EN/FR/IT-Messages", () => {
  const dirs = ["src/app/[locale]", "src/lib/seo", "src/components/News", "src/components/ShopCatalog", "src/components/MarkenItems"];
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|cjs|mjs)$/.test(e.name)) files.push(p);
    }
  };
  dirs.forEach(walk);
  for (const f of files) {
    const s = read(f);
    assert.doesNotMatch(s, /Landstrasse 11/, f);
    assert.doesNotMatch(s, /Fotos und Massen/, f);
  }
  const proposal = JSON.parse(read("Marktresearch/digital/features/rat95-t6-messages.json"));
  for (const l of ["en", "fr", "it"]) assert.equal(proposal[l].Vernissage.location, "Platzhirsch, Landstraße 11, Lochau", l);
  for (const l of ["fr", "it"]) assert.doesNotMatch(JSON.stringify(proposal[l]), /Style Finder/, l);
});

// ------------------------------------------------------------ A15 Schnipsel
test("A15: Description ≤ 150 als ganzer Satz (nie „…“), Titel ≤ 60 mit einem Suffix", () => {
  const long =
    "Für Feldkirch, Rankweil und Götzis: Showroom in Lochau, rund 35 km über die A14. Persönliche Beratung, Planung, Lieferung und Montage auf Wunsch, mit Termin und Aufmaß.";
  const oneSentence =
    "Platzhirsch Home Living in Lochau arbeitet mit Architekturbüros, Bauträgern, Hotelbetreibern und Projektentwicklern in Vorarlberg, am Bodensee und in der Schweiz zusammen";
  for (const text of [long, oneSentence, "kurz", "x ".repeat(200), "Satz eins. Satz zwei…"]) {
    const d = PM.clampDescription(text);
    assert.ok(d.length <= PM.META_DESCRIPTION_MAX, `${d.length}: ${d}`);
    assert.doesNotMatch(d, /…$/, d);
    assert.match(d, /[.!?»“"”)]$/, d);
  }
  assert.equal(PM.toMetaDescription(long), PM.clampDescription(long));
  for (const t of [
    "Von der Handzeichnung zum Rendering · Platzhirsch",
    "Yacht-Interieur Bodensee & Bootspolster | Platzhirsch Home Living",
    "Marchi di design | Esposizione a Lochau | Platzhirsch Home Living",
    "Über uns | Platzhirsch Home Living Lochau",
    "Tréca Paris, Minotti, Poliform – High-quality sleeping comfort",
  ]) {
    const r = PM.fitTitle(t);
    assert.ok(r.length <= PM.META_TITLE_MAX, `${r.length}: ${r}`);
    assert.doesNotMatch(r, /…|·/, r);
    assert.doesNotMatch(r, /Lochau$/, "kein Ort hinter dem Suffix");
  }
  assert.equal(PM.fitTitle("Von der Handzeichnung zum Rendering · Platzhirsch"), "Von der Handzeichnung zum Rendering | Platzhirsch");
  assert.equal(PM.titleWithSuffix("Regionen"), "Regionen | Platzhirsch Home Living");
  // Gemeinsame Builder wenden die Regeln an.
  const m = PM.deOnlyMetadata({ path: "/designermoebel-feldkirch", title: "Designermöbel für Feldkirch | Platzhirsch Home Living", description: long });
  assert.ok(m.description.length <= 150 && !m.description.endsWith("…"));
  const b = PM.buildPageMetadata({ locale: "de", pathByLocale: "/x", title: "Ein sehr langer Seitentitel über Designermöbel am Bodensee | Platzhirsch Home Living", description: long });
  assert.ok(b.title.length <= 60 && b.description.length <= 150, JSON.stringify([b.title, b.description]));
  // Marken, Produkte, Kategorien.
  assert.equal(TITLE_MAX, 60);
  assert.equal(DESC_MAX, 150);
  assert.ok(brandSafeTitle("Livintwist – Designmarke im Showroom am Bodensee | Platzhirsch", "Livintwist").length <= 60);
  for (const l of ["de", "en", "fr", "it"]) {
    const d = fitMetaDescription("x ".repeat(120), l, "Minotti");
    assert.ok(d.length <= 150 && !d.endsWith("…"), d);
    const h = hubSeo(l);
    assert.ok(h.title.length <= 60 && h.description.length <= 150, l);
    const c = categorySeo(l, { label: "Sofas & Couches", count: 312, brands: ["Minotti", "Poliform", "Paola Lenti"], key: "sofas-couches" });
    assert.ok(c.title.length <= 60 && c.description.length <= 150 && !c.description.endsWith("…"), `${l}: ${c.title} / ${c.description}`);
  }
});

test("A15: News-Übersicht mit Thema und Ort (H1 über inhalt.news.h1, Titel ≤ 60)", () => {
  const page = read("src/app/[locale]/news/page.js");
  for (const t of page.matchAll(/case "\w+": return "([^"]+\| Platzhirsch Home Living)";/g)) assert.ok(t[1].length <= 60, t[1]);
  assert.match(page, /clampDescription\(/);
  assert.match(read("src/app/[locale]/news/[title]/page.js"), /fitTitle\(withheld/);
  // Übernahme 30.10.2026: inhalt.news.h1 steht in src/messages, der Rückfall auf title ist entfernt.
  assert.match(read("src/components/News/news.js"), /title=\{t\("h1"\)\}/);
  const proposal = JSON.parse(read("Marktresearch/digital/features/rat95-t6-messages.json"));
  for (const l of ["de", "en", "fr", "it"]) assert.match(proposal[l].inhalt.news.h1, /Lochau/, l);
});

// ------------------------------------------------------------ A18
test("A18: kein unsichtbarer „nur auf Deutsch“-Text im Server-HTML deutscher Seiten", () => {
  const c = read("src/components/I18n/GermanOnlyNotice.js");
  // Server-Render und Hydratation: nur der leere Platzhalter, die Texte stehen als Daten im Skript.
  assert.match(c, /<div id="ph-gnotice-slot" suppressHydrationWarning dangerouslySetInnerHTML=\{\{ __html: "" \}\} \/>/);
  assert.doesNotMatch(c, /NOTICE_LANGS\.map\(\(l\) => \{\s*const n = globalNotice\(l\);\s*return \(\s*<div/);
  assert.match(c, /s\.innerHTML=m\[l\]/);
  // Produkt-Brotkrume: Telefon bewusst kompakt (R4 Fix P2-1, Knopf im ersten Bildschirm),
  // ab sm der volle Pfad ab „Startseite / Produkte“; JSON-LD immer voll.
  const product = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(product, /<Breadcrumbs items=\{crumbs\} className="max-sm:hidden" \/>/);
});

// ------------------------------------------------------------ B15 Regionen
test("B15: Regionen-Hub listet nur indexierbare Regionsseiten, Nachbarorte ohne die Seite selbst", () => {
  const all = REGION_GROUPS.flatMap((g) => g.regions.map((r) => r.path));
  for (const p of all) assert.ok(fs.existsSync(path.join(ROOT, "src/app/[locale]", p.slice(1), "page.js")), p);
  const visible = visibleRegions().map((r) => r.path);
  assert.ok(visible.every(passesDoorwayAudit));
  assert.ok(!visible.includes("/designermoebel-kempten") && !visible.includes("/designermoebel-ravensburg"));
  assert.ok(visible.length >= 10);
  for (const p of visible) {
    const n = neighbourRegions(p);
    assert.ok(n.length >= 2 && n.length <= 3 && !n.some((r) => r.path === p), p);
  }
  // Jede Regionsseite: Brotkrume über /regionen und Querverweise.
  for (const p of all) {
    const s = read(`src/app/[locale]${p}/page.js`);
    assert.match(s, /trail: \[\{ label: "Regionen", href: "\/regionen" \}\]/, p);
    assert.match(s, /<RegionLinks path=\{PATH\} \/>/, p);
  }
  assert.ok(EXTRA_PAGES.some((p) => p.path === "/regionen" && !p.locales), "Sitemap + nur Deutsch im Sprachwechsel");
  const { DE_ONLY_EXACT } = require("../../src/lib/seo/deOnlyRedirects.cjs");
  assert.ok(DE_ONLY_EXACT.includes("regionen"));
  assert.ok(PM.titleWithSuffix(REGIONEN_META.title).length <= 60);
  assert.ok(REGIONEN_META.description.length <= 150);
  assert.doesNotMatch(JSON.stringify(REGION_GROUPS), /€|Preis|garantiert|kostenlos|beste/i);
});

// ------------------------------------------------------------ B17 Produkttitel
test("B17: gleichnamige Produkte einer Marke bekommen eindeutige Titel und H1 (Torii)", () => {
  const brand = "Minotti";
  const t1 = productTypeFromText("Couchtisch Minotti Torii: Gestell aus Aluminium in Bronze, Platte aus Marmor.", { brand, name: "Torii" });
  const t2 = productTypeFromText("Designer-Sessel Minotti Torii: um 360° drehbar, Gänsedaunenkissen.", { brand, name: "Torii" });
  assert.equal(t1, "Couchtisch");
  assert.equal(t2, "Sessel");
  assert.equal(productTypeFromText("Minotti Torii ist ein Sessel.", { brand, name: "Torii" }), null, "nur wenn der Text den Typ vorn nennt");
  assert.equal(translateProductType("Couchtisch", "en"), "Coffee table");
  assert.equal(translateProductType("Unbekannt", "fr"), null);
  const twins = [
    { path: "sofas-torii-sofas", name: "Torii", type: t1, category: "Sofas & Couches" },
    { path: "sofas-torii-sofas-2", name: "Torii", type: t2, category: "Sofas & Couches" },
    { path: "sofas-torii-sofas-3", name: "Torii", type: null, category: "Sofas & Couches" },
    { path: "armchairs-torii", name: "Torii", type: null, category: "Sessel & Hocker" },
  ];
  const names = distinctProductNames(twins, "de");
  const titles = twins.map((t) => productTitle({ name: names.get(t.path), brand }));
  assert.equal(new Set(titles).size, titles.length, titles.join(" / "));
  assert.ok(titles.every((t) => t.length <= 60), titles.join(" / "));
  assert.equal(names.get("sofas-torii-sofas"), "Torii Couchtisch");
  // Kein Typ, gleiche Kategorie: neutrale Variantennummer statt erfundenem Typ.
  const same = distinctProductNames([{ path: "a", name: "X" }, { path: "b", name: "X" }], "en");
  assert.deepEqual([...same.values()], ["X – variant 1", "X – variant 2"]);
  assert.match(read("src/app/[locale]/produkte/[category]/[product]/page.js"), /productDisplayName\(detail, product, locale\)/);
});

// ------------------------------------------------------------ B14 / B20
test("B14: Ratgeber-Autor nur mit echtem reviewedBy, Harald mit der Person-ID der Profilseite", () => {
  assert.equal(reviewerNode(null, SITE), null);
  const h = reviewerNode("Harald Menghin", SITE);
  assert.equal(h["@id"], `${SITE}/#person-harald-menghin`);
  assert.equal(h.url, `${SITE}/de/ueber-uns/team/harald-menghin`);
  assert.match(read("src/lib/seo/structuredData.js"), /id: `\$\{SITE_URL\}\/#person-harald-menghin`/, "gleiche ID wie TEAM_PEOPLE");
  // Keine Freigabe mit offener [prüfen]-Stelle.
  for (const f of fs.readdirSync(path.join(ROOT, "src/content/ratgeber"))) {
    const s = read(`src/content/ratgeber/${f}`);
    if (/^freigegeben:\s*true/m.test(s)) assert.doesNotMatch(s, /\[prüfen/, f);
  }
});

test("B20: Teilen-Bilder unter /og/, alte /labs/og/-Adressen per 308", () => {
  const moves = require("../../src/lib/seo/labsMoves.cjs");
  const r = moves.labsAssetRedirects();
  assert.deepEqual(r, [{ source: "/labs/og/:file", destination: "/og/:file", permanent: true }]);
  // labsRedirects() bleibt nur mit Sprachpräfix (public/labs/* sonst unberührt).
  assert.ok(moves.labsRedirects().every((x) => x.source.startsWith("/:locale(de|en|fr|it)/labs")));
  for (const f of fs.readdirSync(path.join(ROOT, "public/labs/og"))) assert.ok(fs.existsSync(path.join(ROOT, "public/og", f)), f);
});

// ------------------------------------------------------------ Live (optional)
const BASE = process.env.QA_BASE || "";
const live = async (t) => {
  if (!BASE) return t.skip("QA_BASE nicht gesetzt");
  try {
    await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(20000) });
    return true;
  } catch {
    return t.skip(`${BASE} nicht erreichbar`);
  }
};

test("live: kein doppelter <title> je Sprache in sitemap-static, alle ≤ 60 ohne „…“", async (t) => {
  if ((await live(t)) !== true) return;
  const xml = await (await fetch(`${BASE}/sitemap-static.xml`)).text();
  const urls = [...xml.matchAll(/<loc>https:\/\/platzhirsch\.studio([^<]+)<\/loc>/g)].map((m) => m[1]);
  const seen = new Map();
  for (const u of urls) {
    const res = await fetch(`${BASE}${u}`, { signal: AbortSignal.timeout(120000) });
    if (res.status !== 200) continue;
    const html = await res.text();
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const lang = (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1] || "";
    const key = `${lang}|${title}`;
    assert.ok(!seen.has(key), `${u} und ${seen.get(key)}: ${title}`);
    seen.set(key, u);
  }
});

test("live: /de/regionen 200 mit Brotkrume, Regionsseite mit Elternschritt Regionen", async (t) => {
  if ((await live(t)) !== true) return;
  const hub = await fetch(`${BASE}/de/regionen`);
  assert.equal(hub.status, 200);
  const html = await hub.text();
  assert.match(html, /"@type":"BreadcrumbList"/);
  const city = await (await fetch(`${BASE}/de/designermoebel-bregenz`)).text();
  assert.match(city, /"name":"Regionen","item":"https:\/\/platzhirsch\.studio\/de\/regionen"/);
});
