// QM wohnen-marken Runde 4 (Handys, Tablets, Desktop, 200 % Text): Seiten-Container
// statt Viewport-Breakpoints, keine Einzelkacheln, Links einmal je Ziel, Typografie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spanEntry, spanTile } from "../../src/components/ShopCatalog/gridSpan.js";
import { linkKey, uniqueLinks } from "../../src/components/MarkenItems/copy.js";
import { keepRanges, keepRangesIn, softHyphens, SOFT_HYPHEN, WORD_JOINER } from "../../src/components/UberUns/softHyphens.js";
import { hasLongWord, titleParts } from "../../src/components/UberUns/titleParts.js";
import { PAGE_CONTAINER, ZOOM_SAFE_TEXT } from "../../src/components/UberUns/zoomSafe.js";

const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("Seiten-Container: Wrapper und PageHeader sind @container/page", () => {
  assert.equal(PAGE_CONTAINER, "@container/page");
  assert.ok(ZOOM_SAFE_TEXT.split(" ").includes(PAGE_CONTAINER));
  assert.match(code("src/components/UberUns/PageHeader.js"), /cx\(PAGE_CONTAINER, "bg-surface/);
});

test("Produktseite: zweispaltig erst ab 64 rem Container, Faktentabelle stapelt unter 20 rem", () => {
  const page = code("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /@5xl\/page:grid-cols-12 @5xl\/page:grid-rows-\[auto_1fr\]/);
  assert.doesNotMatch(page, /lg:grid-cols-12 lg:grid-rows/);
  assert.match(page, /<dl className="@container\/facts mt-10/);
  assert.match(page, /grid gap-1 border-b border-line py-4 @xs\/facts:grid-cols-\[7\.5rem_1fr\]/);
  assert.match(page, /<TrustBlock locale=\{locale\} variant="band" headingLevel=\{2\} className="\[&_li\]:block \[&_li>span:has\(img\)\]:hidden" \/>/);
});

test("Galerie/Lightbox/Herz: feste 44-px-Knöpfe, Zähler einzeilig, Lightbox-Datei vorgeladen", () => {
  const g = code("src/components/ShopCatalog/productGallery.js");
  assert.match(g, /inline-flex size-\[44px\] shrink-0/);
  assert.match(g, /tabular whitespace-nowrap text-small/);
  assert.match(g, /preloadLightboxImage\(images\[index\]\)/);
  assert.match(code("src/components/ShopCatalog/wishlistHeart.js"), /flex size-\[44px\] items-center/);
  const lb = code("src/components/ShopCatalog/productLightbox.js");
  assert.match(lb, /\[@media\(max-height:500px\)\]:\[&_button\]:bg-paper/);
  assert.match(lb, /from "@\/components\/ShopCatalog\/lightboxImage"/);
  const pre = code("src/components/ShopCatalog/lightboxImage.js");
  assert.match(pre, /export const LIGHTBOX_SIZES = "100vw";/);
  assert.match(pre, /export const LIGHTBOX_QUALITY = 90;/);
});

test("spanTile: ungerade Gruppen beginnen im Zwei-Spalten-Bereich mit einer breiten Kachel", () => {
  assert.equal(spanTile(3, 0), true);
  assert.equal(spanTile(3, 1), false);
  assert.equal(spanTile(1, 0), true);
  assert.equal(spanTile(4, 0), false);
  assert.equal(spanTile(5, 0), true);
  const grid = code("src/components/ShopCatalog/shopCategoryGrid.js");
  assert.match(grid, /@min-\[40rem\]\/page:grid-cols-2 @5xl\/page:grid-cols-3/);
  assert.match(grid, /@xs\/tile:flex-row/);
});

test("spanEntry: 3n+2 Einträge → das breiteste Bild über zwei Spalten, nie ein Freisteller", () => {
  const img = (w, h) => ({ width: w, height: h });
  const e = [
    { id: "a", image: img(1200, 800) },
    { id: "b", image: img(1600, 800) },
    { id: "c", image: img(1000, 1000) },
    { id: "d", image: img(1800, 900) },
    { id: "cut", image: img(3000, 1000) },
  ];
  assert.equal(spanEntry(e, { cut: "x" }), "b"); // 2.0 == 2.0 → first of the widest
  assert.equal(spanEntry(e), "cut");
  assert.equal(spanEntry(e.slice(0, 4)), null);
  assert.equal(spanEntry([...e, ...e.slice(0, 3)].slice(0, 8).map((x) => ({ ...x, image: img(1, 1) }))), null);
  assert.equal(spanEntry(null), null);
});

test("uniqueLinks: jedes Ziel einmal, Locale/Query/Hash egal", () => {
  assert.equal(linkKey("/de/sofaplaner?lang=fr#x"), "/sofaplaner");
  assert.equal(linkKey("/sofaplaner/"), "/sofaplaner");
  assert.equal(linkKey("/de"), "/");
  const out = uniqueLinks(
    [
      { href: "/de/ratgeber/a", label: "A" },
      { href: "/de/sofaplaner", label: "S" },
      { href: "/de/ratgeber/a", label: "A2" },
      { href: "", label: "leer" },
      { href: "/de/yacht-interior", label: "Y" },
    ],
    ["/sofaplaner"]
  );
  assert.deepEqual(out.map((l) => l.label), ["A", "Y"]);
});

test("Minotti: Stücke vor dem Leitfaden, Abschnitte 2+ und FAQ als Aufklapper, Links entdoppelt", () => {
  const m = code("src/components/MarkenItems/markenitems.js");
  assert.ok(m.indexOf('id="stuecke"') < m.indexOf("data-brand-guide"), "Katalog vor „Gut zu wissen“");
  assert.match(m, /guide\.sections\.slice\(1\)\.map/);
  assert.match(m, /<details key=\{it\.q\} className="ph-accordion/);
  assert.match(m, /uniqueLinks\(\[\.\.\.guideCategoryLinks, \.\.\.guide\.links\], planHrefs\)/);
  assert.match(m, /<PlanLinks links=\{planLinks\} \/>/);
  assert.match(m, /name=\{typoQuotes\(p\.name, locale\)\}/);
  assert.match(m, /sm:grid-cols-3 sm:gap-grid/);
  assert.match(m, /Math\.round\(heroImage\.width \* 0\.8\)/);
  assert.doesNotMatch(m, /xl:col-start-2/);
});

test("Marken-Index: Spalten über den Container, Freisteller Aquavia ganz, kein Silbentrennen", () => {
  const src = code("src/components/MarkenClient/Marken.js");
  assert.match(src, /const GRID_COLS = "grid-cols-1 @min-\[40rem\]\/page:grid-cols-2/);
  assert.match(src, /spanEntry\(entries, CUTOUT\)/);
  assert.match(src, /\{softHyphens\(title\)\}/);
  assert.equal(softHyphens("Küchengeräte"), `Küchen${SOFT_HYPHEN}geräte`);
});

test("Karriere: weiche Trennstellen in Text, Listen und Fakten; Link kopieren immer im HTML", () => {
  assert.equal(softHyphens("Kollektivvertragliches").replaceAll(SOFT_HYPHEN, "|"), "Kollektiv|vertragliches");
  assert.equal(softHyphens("Beschäftigungsausmaß").replaceAll(SOFT_HYPHEN, "|"), "Beschäftigungs|ausmaß");
  assert.equal(softHyphens("Vorstellungsvermögen").replaceAll(SOFT_HYPHEN, "|"), "Vorstellungs|vermögen");
  const job = code("src/components/Karriere/JobDetail.js");
  assert.match(job, /softHyphens\(paragraph\.trim\(\)\)/);
  assert.match(job, /softHyphens\(item\)/);
  const share = code("src/components/Karriere/ShareJob.js");
  assert.match(share, /useSyncExternalStore\(noop, canCopy, \(\) => true\)/);
  assert.match(share, /document\.execCommand\("copy"\)/);
});

test("Zeitspannen ohne Umbruch (Di–Fr), Titel mit Gedankenstrich in zwei Zeilen", () => {
  assert.equal(keepRanges("(Di–Fr 10:00–18:00)"), `(Di${WORD_JOINER}–${WORD_JOINER}Fr 10:00${WORD_JOINER}–${WORD_JOINER}18:00)`);
  assert.equal(keepRanges("Living – Studio"), "Living – Studio");
  assert.deepEqual(keepRangesIn({ a: "Di–Fr", n: 3 }), { a: `Di${WORD_JOINER}–${WORD_JOINER}Fr`, n: 3 });
  assert.deepEqual(titleParts("Platzhirsch Home Living – Einrichtungsstudio in Lochau"), ["Platzhirsch Home Living", "Einrichtungsstudio in Lochau"]);
  assert.equal(titleParts("Unser Team"), null);
  assert.equal(hasLongWord("Einrichtungsstudio in Lochau"), true);
  assert.equal(hasLongWord("Unser Team in Lochau"), false);
});

test("Über uns: eine Krume „Das Haus“, kleine Porträts, Galerie 3:2, Presse in Spalten", () => {
  for (const p of ["src/components/Presse/presse.js", "src/components/Partner/partner.js", "src/components/Karriere/karriere.js", "src/components/Karriere/JobDetail.js"]) {
    assert.match(code(p), /houseCrumb\(common\.locale \|\| "de"\)/, p);
    assert.doesNotMatch(code(p), /\{ label: common\.t\("about"\) \}/, p);
  }
  assert.match(code("src/components/UberUns/uberuns.js"), /houseCrumb\(common\.locale \|\| "de", \{ link: false \}\)/);
  assert.match(code("src/components/UberUns/PageHeader.js"), /caption \? "w-36 shrink-0 sm:w-44"/);
  assert.match(code("src/components/UberUns/uberuns.js"), /<div className="reveal w-40 shrink-0">/);
  const presse = code("src/components/Presse/pressearticle.js");
  assert.match(presse, /md:columns-2/);
  assert.match(presse, /break-inside-avoid/);
  assert.match(presse, /\[\/\\bTreca\\b\/g, "Tréca"\]/);
  assert.doesNotMatch(code("src/components/Partner/partner.js"), /partnerInitials\(partner\.name\)/);
  assert.match(code("src/components/Team/teammember.js"), /t\("harald\.profile"\)/);
});

test("Produkt-Hub: Raumfoto im Kopf ab 64 rem (nur breit, lazy)", () => {
  assert.match(code("src/app/[locale]/produkte/page.js"), /media=\{hubHeaderMedia\(sections\)\}/);
  assert.match(code("src/components/ShopCatalog/catalogHeader.js"), /hidden aspect-\[3\/2\] overflow-hidden bg-linen @5xl\/page:col-span-5 @5xl\/page:block/);
});
