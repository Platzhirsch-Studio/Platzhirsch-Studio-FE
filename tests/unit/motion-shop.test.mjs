// tests/unit/motion-shop.test.mjs — Motion-Feinschliff Shop (01.11.2026):
// ruhigeBewegung() (System + Ruhige Ansicht), Shop-Motion nur über Tokens,
// nur transform/opacity, nie Bewegung beim Laden des Preises / LCP-Bildes.
// Run: node --test tests/unit/motion-shop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ruhigeBewegung } from "../../src/components/Shop/ruhigeBewegung.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const fakeWin = ({ attr = null, reduce = false, throws = false } = {}) => ({
  document: { documentElement: { getAttribute: (n) => (n === "data-motion" ? attr : null) } },
  matchMedia: (q) => {
    if (throws) throw new Error("no matchMedia");
    return { matches: reduce && q === "(prefers-reduced-motion: reduce)" };
  },
});

test("ruhigeBewegung: System-Einstellung, Ruhige Ansicht (reduced/calm), Server", () => {
  assert.equal(ruhigeBewegung(fakeWin()), false);
  assert.equal(ruhigeBewegung(fakeWin({ reduce: true })), true);
  assert.equal(ruhigeBewegung(fakeWin({ attr: "reduced" })), true);
  assert.equal(ruhigeBewegung(fakeWin({ attr: "calm" })), true);
  assert.equal(ruhigeBewegung(fakeWin({ attr: "full" })), false);
  assert.equal(ruhigeBewegung(fakeWin({ throws: true })), false, "ohne matchMedia: Bewegung erlaubt, CSS regelt den Rest");
  assert.equal(ruhigeBewegung(null), true, "Server/ohne window = ruhig");
  assert.equal(ruhigeBewegung({}), false);
});

test("Mini-Warenkorb: Ausgang per Transition, Aushängen erst danach, ruhig sofort", () => {
  const src = read("src/components/Shop/MiniCart.js");
  assert.match(src, /transition-discrete/);
  assert.match(src, /not-open:translate-x-full/);
  assert.match(src, /starting:open:backdrop:opacity-0/);
  assert.match(src, /motion-reduce:transition-none motion-reduce:backdrop:transition-none/);
  assert.match(src, /if \(ruhigeBewegung\(\)\) onClose\(\);\s*else t = window\.setTimeout\(onClose, AUSGANG_MS\)/);
  assert.match(src, /window\.clearTimeout\(t\)/, "Timer beim Aushängen/Neu-Öffnen aufräumen");
  assert.match(src, /className="ph-arrive flex gap-4 border-y/, "Artikelzeile setzt sich nach dem Skelett");
});

test("Filter-Dialog (Telefon) gleitet herein/hinaus, ruhig sofort", () => {
  const src = read("src/components/Katalog/ShopGrid.js");
  assert.match(src, /className=\{DIALOG_MOTION\}/);
  assert.match(src, /starting:open:translate-x-full/);
  assert.match(src, /motion-reduce:transition-none/);
  assert.match(src, /group-open:rotate-180 motion-reduce:transition-none/, "Chevron dreht nur mit Bewegung");
  assert.match(src, /transform: `scaleX\(/, "Fortschritt per transform statt width");
  assert.doesNotMatch(src, /style=\{\{ width:/);
});

test("Kaufbox: Preis bewegt sich nur nach echtem Wechsel, Haken zeichnet sich, Stepper mit Druck", () => {
  const src = read("src/components/Katalog/KaufBox.js");
  assert.match(src, /key=\{wechsel\} className=\{`text-title text-text tabular\$\{wechsel \? " ph-arrive" : ""\}`\}/);
  assert.match(src, /useState\(0\)/);
  assert.match(src, /if \(best !== aktuell\.current\) setWechsel/);
  assert.match(src, /className="ph-tick size-4"/);
  // Haken-Pfad: (3,5·√2) + √(7,5² + 8²) ≈ 15,9 ≤ stroke-dasharray 16 aus globals.css
  const len = 3.5 * Math.SQRT2 + Math.hypot(7.5, 8);
  assert.ok(len <= 16, `Hakenlänge ${len.toFixed(2)}`);
  assert.match(src, /<path d="M6\.5 12\.5l3\.5 3\.5 7\.5-8" \/>/);
  assert.match(src, /const STEPPER =\s*"ph-press [^"]*duration-\(--duration-micro\)/);
});

// Optik-QA r1: gestaffelte Ranges ließen eine angeschnittene Reihe im Ruhezustand treppenförmig stehen.
// Startseite/Produktseite: eine Bewegung je Reihe (gleiche Range); Liste und Suche: Raster steht still.
test("Kachel-Raster: Reveal ohne Treppe (Liste/Suche still), Bild-Zoom nur motion-safe im festen Rahmen", () => {
  for (const f of ["src/components/ShopStart/ShopStartseite.js", "src/components/Katalog/ShopProduktDetail.js"]) {
    // Optik-QA r3: Spalten per Container-Query (RASTER_4) → Template-Literal statt String.
    assert.ok(read(f).includes("const GRID = `reveal-group [&>*]:[--reveal-start:0%] [&>*]:[--reveal-end:40%] grid ${RASTER_4}"), f);
  }
  assert.match(read("src/app/[locale]/accessoires/suche/page.js"), /const GRID = "grid/);
  assert.match(read("src/components/Katalog/ShopGrid.js"), /className=\{`mt-6 grid/);
  const kachel = read("src/components/Katalog/ShopKachel.js");
  assert.match(kachel, /relative aspect-\[4\/5\] overflow-hidden/, "fester Rahmen");
  assert.match(kachel, /motion-safe:group-hover:scale-\[1\.03\] motion-safe:group-focus-within:scale-\[1\.03\]/);
  assert.doesNotMatch(kachel, /(?<!motion-safe:)group-hover:scale/);
});

test("Shop-Motion nur über Tokens: keine festen ms-Dauern / eigenen Kurven", () => {
  const files = [
    "src/components/Katalog/ShopKachel.js",
    "src/components/Katalog/ShopGrid.js",
    "src/components/Katalog/KaufBox.js",
    "src/components/Katalog/ZuletztAngesehen.js",
    "src/components/Shop/MiniCart.js",
    "src/components/Shop/ShopCart.js",
    "src/components/Shop/AddToCart.js",
    "src/components/ShopStart/ShopStartseite.js",
  ];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /duration-\d|duration-\[\d|ease-\[|ease-in-out|ease-linear|delay-\d/, `${f}: nur --duration-*/ease-quiet…`);
    assert.doesNotMatch(src, /transition-(all|\[[^\]]*(width|height|top|left|margin|padding)[^\]]*\])/, `${f}: nur transform/opacity/Farbe`);
  }
});

test("Hero-/LCP-Bild und H1 bleiben ohne Einblendung", () => {
  const start = read("src/components/ShopStart/ShopStartseite.js");
  const hero = start.slice(start.indexOf("data-shop-hero"), start.indexOf("</figure>"));
  assert.doesNotMatch(hero, /reveal|ph-arrive|opacity-0|starting:/);
  assert.doesNotMatch(read("src/components/Katalog/ShopProduktDetail.js").match(/<Heading id="kat-produkt-title"[^>]*>/)[0], /reveal|ph-arrive/);
});
