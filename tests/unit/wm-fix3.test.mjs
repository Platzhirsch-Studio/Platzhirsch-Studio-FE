// QM wm-fix3 (Bereich wohnen-marken, Runde 3): Katalog-Hub, Marken-Index,
// Lightbox, Presse, Abstände und Umbrüche bei 200 % Textgröße.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCategoryImage, categoryImageBoxClass } from "../../src/lib/shop/categoryImages.js";
import { typoQuotes } from "../../src/lib/shop/format.js";
import { softHyphens, SOFT_HYPHEN } from "../../src/components/UberUns/softHyphens.js";

const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const HUB_SLUGS = [
  "sofas-couches", "chaise-longues-daybeds", "armchairs-stools", "dining-chairs", "bar-stools", "desk-chairs",
  "dining-tables", "coffee-tables", "side-tables", "beds", "night-tables", "wardrobes", "bedwear",
  "sideboards-chests", "shelves", "tv-low-units", "display-cabinets", "small-furniture", "garden-tables",
  "garden-chairs", "lounge-furniture-daybeds", "sun-loungers", "parasols", "heaters", "kitchen",
  "kitchen-accessories", "lamps", "rugs", "decor", "mirrors", "candles",
];
// Verschiedene Dateien, dasselbe Foto (per Bildvergleich ermittelt).
const SAME_PHOTO = [
  ["/Images/Footer/detailed-room.jpg", "/Images/Wohnen/bannerImage4.jpg"],
  ["/Images/Footer/grey.jpg", "/Images/Wohnen/bannerImage10.jpg", "/Images/Home/grey-and-brown-combo-style-room.jpg"],
  ["/Images/Home/bannerImage-4.jpg", "/Images/Home/Rimadesio-Modulor-1.jpg", "/Images/Home/slider/rimadesio-wandsystem-wohnraum.webp"],
  ["/Images/Home/aboutHome.jpg", "/Images/UberUns/livingroom-view.jpg"],
];

test("Katalog-Hub: jedes Kachelbild nur einmal, auch über Dateikopien hinweg", () => {
  const used = HUB_SLUGS.map((s) => getCategoryImage(s));
  assert.equal(new Set(used).size, used.length, "Pfad doppelt");
  for (const group of SAME_PHOTO) {
    assert.ok(group.filter((p) => used.includes(p)).length <= 1, `dasselbe Foto zweimal: ${group.join(" / ")}`);
  }
  // Bilder mit eingebranntem weißem Keil kommen nicht mehr vor.
  assert.ok(!used.includes("/Images/Footer/grey.jpg") && !used.includes("/Images/Wohnen/bannerImage10.jpg"));
});

test("Kleiderschränke: weißer Rand rechts per CSS-Box abgeschnitten, andere Bilder normal", () => {
  assert.match(categoryImageBoxClass(getCategoryImage("wardrobes")), /left-0 w-\[110%\]/);
  assert.equal(categoryImageBoxClass(getCategoryImage("beds")), "absolute inset-0");
  assert.match(code("src/components/ShopCatalog/shopCategoryGrid.js"), /categoryImageBoxClass\(cat\.image\)/);
});

test("Katalog-Hub zählt wie die Kategorieseite (dedupliziert) und zeigt Ein-Kategorie-Gruppen ohne Doppelzahl", () => {
  const src = code("src/lib/shop/hubSections.js");
  assert.match(src, /buildShopProducts\(await fetchProdukteByKategorie\(cms\?\.name \|\| categoryKey\)\)\.length/);
  assert.match(src, /i \+= 4/, "höchstens 4 Backoffice-Abrufe gleichzeitig");
  assert.match(src, /g\.items\.length > 1 \?/);
  assert.match(code("src/components/ShopCatalog/shopCategoryGrid.js"), /section\.countLabel && /);
  // Kategorieseite nutzt dieselbe Quelle
  assert.match(code("src/app/[locale]/produkte/[category]/page.js"), /buildShopProducts\(await fetchProdukteByKategorie\(cms\?\.name \|\| categoryKey\)\)/);
});

test("typoQuotes: gerade Anführungszeichen je Sprache typografisch, Name sonst unverändert", () => {
  assert.equal(typoQuotes('Reeves "Lounge sofa"', "de"), "Reeves „Lounge sofa“");
  assert.equal(typoQuotes('Reeves "Lounge sofa"', "en"), "Reeves “Lounge sofa”");
  assert.equal(typoQuotes('Reeves "Lounge sofa"', "fr"), "Reeves « Lounge sofa »");
  assert.equal(typoQuotes('Reeves "Lounge sofa"', "it"), "Reeves «Lounge sofa»");
  assert.equal(typoQuotes('Zoll 12" offen', "de"), 'Zoll 12" offen');
  assert.equal(typoQuotes("Andersen", "de"), "Andersen");
});

test("Alle-Modelle-Aufklapper ohne Browser-Marker", () => {
  const src = code("src/app/[locale]/produkte/[category]/page.js");
  assert.match(src, /<summary className="[^"]*list-none[^"]*\[&::-webkit-details-marker\]:hidden/);
  assert.match(src, /typoQuotes\(p\.brand/);
});

test("softHyphens: weiche Trennstellen an Kompositionsfugen", () => {
  assert.equal(softHyphens("SM Immobilienverwaltung GmbH"), `SM Immobilien${SOFT_HYPHEN}verwaltung GmbH`);
  assert.equal(softHyphens("Designmarken am Bodensee"), `Design${SOFT_HYPHEN}marken am Bodensee`);
  assert.equal(softHyphens("Designermöbel"), `Designer${SOFT_HYPHEN}möbel`);
  assert.equal(softHyphens("Design"), "Design");
  assert.equal(softHyphens("Immobilien"), "Immobilien");
  assert.equal(softHyphens(null), null);
  assert.equal(softHyphens("Für Immobilienprojekte").replaceAll(SOFT_HYPHEN, ""), "Für Immobilienprojekte");
});

test("Marken-Index: Gruppenbilder bildfüllend, Fakten und Namen umbrechbar", () => {
  const m = code("src/components/MarkenClient/Marken.js");
  assert.match(m, /object-cover \$\{FOCUS\[id\] \|\| "object-center"\}/);
  assert.match(m, /softHyphens\(H1\[locale\] \|\| H1\.de\)/);
  assert.match(code("src/components/Partner/partner.js"), /softHyphens\(partner\.name\)/);
  assert.match(code("src/components/MarkenItems/markenitems.js"), /min-w-0 break-words hyphens-auto border-b border-line py-5/);
});

test("Abstand Überschrift → Text: stack-m bzw. 16 px statt 8 px", () => {
  for (const p of ["src/components/Karriere/karriereposition.js", "src/components/Presse/presse.js", "src/components/Presse/pressearticle.js"]) {
    assert.doesNotMatch(code(p), /<\/Heading>\s*<p className="mt-stack-s/, p);
  }
  const job = code("src/components/Karriere/JobDetail.js");
  assert.doesNotMatch(job, /<\/Heading>\s*<(div|dl|p) className="mt-stack-s/);
  assert.match(job, /<p className="mt-stack-m text-small text-text" data-testid="job-contact-person">/);
  // wm-fix4: 24 px (mt-6) unter dem kleinen Titel.
  assert.match(code("src/components/Karriere/ShareJob.js"), /<div className="mt-6 flex flex-wrap gap-3">/);
  const brand = code("src/components/MarkenItems/markenitems.js");
  assert.doesNotMatch(brand, /<div className="mt-4 flex flex-col gap-4 text-body text-text-soft md:mt-5">/);
});

test("Lightbox: Bildangleichung wie die Galerie, kein blasser deaktivierter Pfeil", () => {
  const lb = code("src/components/ShopCatalog/productLightbox.js");
  assert.equal(lb.match(/mix-blend-multiply/g)?.length, 2); // Bühne + Zoom-Ebene
  assert.match(lb, /disabled:invisible/);
});

test("Presse: nach Magazin gruppiert, Einträge ohne lesbare Quelle mit einem Satz statt Leerzeile", () => {
  const src = code("src/components/Presse/pressearticle.js");
  assert.match(src, /export function groupPressArticles/);
  for (const l of ["de", "en", "fr", "it"]) assert.match(src, new RegExp(`${l}: \{ title: "[^"]+", note: "[^"]+" \}`));
});

test("Minotti: Studio-Satz nicht ein drittes Mal in den FAQ, FAQ-Titel breiter", () => {
  const g = code("src/lib/content/brandGuides.js");
  assert.doesNotMatch(g, /a: "\{studio\}/);
  assert.match(code("src/components/MarkenItems/markenitems.js"), /id="brand-faq" level=\{2\} className="text-balance @5xl\/page:col-span-5 xl:@5xl\/page:col-span-4"/);
});
