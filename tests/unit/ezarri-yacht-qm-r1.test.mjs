// QM r1 (ezarri-yacht): Regeln hinter den Nachbesserungen nach der Geräteprüfung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { sollteAusweichen, ZOOM_SCHRIFT_PX } from "../../src/components/Ezarri/Welt/useConciergeAvoid.js";
import { shelfLayout } from "../../src/lib/yacht/layout.js";
import concepts from "../../src/lib/yacht/concepts.json" with { type: "json" };

const ROOT = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(m?js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

test("Concierge weicht nur bei Handy quer oder vergrößerter Schrift aus", () => {
  assert.equal(sollteAusweichen({ querKurz: false, rootPx: 16 }), false);
  assert.equal(sollteAusweichen({ querKurz: true, rootPx: 16 }), true);
  assert.equal(sollteAusweichen({ querKurz: false, rootPx: ZOOM_SCHRIFT_PX }), true);
  assert.equal(sollteAusweichen({ querKurz: false, rootPx: 32 }), true);
  assert.equal(sollteAusweichen(), false);
});

test("keine unescapten Pfad-Regex-Literale wie /^/ezarri/ im Bereich (Compile-Fehler → HTTP 500)", () => {
  const dirs = ["src/lib/ezarri", "src/lib/yacht", "src/components/Ezarri", "src/components/Yacht", "src/app/[locale]/ezarri", "src/app/[locale]/yacht-interior"];
  const bad = [];
  for (const d of dirs) {
    for (const f of walk(new URL(d, ROOT).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
      const src = readFileSync(f, "utf8");
      // Regex-Literal, das mit /^/ und einem Buchstaben beginnt (Schrägstrich nicht maskiert)
      if (/(^|[=(,:!&|?{}\s])\/\^\/[a-z]/m.test(src)) bad.push(f);
    }
  }
  assert.deepEqual(bad, []);
});

test("Einsatz-Kacheln: Meta-Teile als eigene Zeilen, keine führenden Trennpunkte, zwei Zeilen reserviert", () => {
  const src = read("src/components/Ezarri/Welt/Sections.js");
  const tile = src.slice(src.indexOf("export function WeltTile"), src.indexOf("export function WasserStreifen"));
  assert.match(tile, /min-h-\[2lh\]/);
  assert.doesNotMatch(tile, /"· "/);
  assert.doesNotMatch(tile, /whitespace-nowrap/);
});

test("Wasserwirkung: Mosaiknamen umbrechen statt mit Auslassungspunkten, Raster per Subgrid ausgerichtet", () => {
  const src = read("src/components/Ezarri/Welt/Sections.js");
  const strip = src.slice(src.indexOf("export function WasserStreifen"));
  assert.doesNotMatch(strip, /\btruncate\b/);
  assert.match(strip, /sm:grid-rows-subgrid/);
  assert.match(strip, /sm:row-span-6/);
});

test("Kollektions-Überschrift: Zahl hängt mit geschütztem Leerzeichen am Bezugswort (alle Sprachen)", async () => {
  for (const f of ["copy.js", "copy.en.js", "copy.fr.js", "copy.it.js"]) {
    const src = read(`src/lib/ezarri/${f}`);
    const line = src.split("\n").find((l) => l.includes("title: (st) =>") && l.includes("sonderanfertigungen"));
    assert.ok(line, f);
    assert.match(line, /\$\{st\.kollektionen\}\\u00a0/, f);
    assert.match(line, /\$\{st\.sonderanfertigungen\}\\u00a0/, f);
  }
});

test("Rechner und Konfigurator: Spalten über Container-Queries (200 % Text → einspaltig)", () => {
  const r = read("src/components/Ezarri/Rechner/RechnerApp.js");
  assert.match(r, /@container\/rr/);
  assert.match(r, /@5xl\/rr:grid-cols-/);
  assert.doesNotMatch(r, /\blg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,27rem\)\]/);
  const k = read("src/components/Ezarri/Konfigurator/Konfigurator.js");
  assert.match(k, /@container\/ezk/);
  assert.match(k, /@5xl\/ezk:grid-cols-12/);
  assert.match(k, /orientation:landscape/);
});

test("Fotoansicht: kein object-contain (Balken) und keine Bildunterschrift vor dem ersten Bild", () => {
  const src = read("src/components/Ezarri/Konfigurator/FotoAnsicht.js");
  assert.doesNotMatch(src, /lg:object-contain/);
  assert.match(src, /\{erstesBild && \(\s*<figcaption/);
});

test("Markenraster: jede Marke der Yacht-Seite hat in den Konzepten mindestens ein Produktbild", () => {
  const page = read("src/app/[locale]/yacht-interior/page.js");
  const slugs = [...page.matchAll(/\{ name: "([^"]+)", slug: "[^"]+"(?:, featured: \[[^\]]*\])?, text:/g)].map((m) => m[1]);
  assert.ok(slugs.includes("Sifas"));
  const withImage = new Set(concepts.konzepte.flatMap((k) => k.produkte.filter((p) => p.bild).map((p) => p.marke)));
  for (const brand of slugs) assert.ok(withImage.has(brand), `${brand} ohne Produktbild`);
  // das Raster sucht in allen Konzepten (auch dem ausgeblendeten Superyacht-Konzept)
  assert.match(page, /brandConcepts=\{allViews\}/);
  assert.match(read("src/components/Yacht/YachtPage.js"), /concepts=\{brandConcepts \?\? concepts\}/);
});

test("Hero-Foto: Breite nicht mehr aus der Bildunterschrift abgeleitet, keine rem-Kopplung an die Höhe", () => {
  const hero = read("src/components/Yacht/YachtHero.js");
  assert.doesNotMatch(hero, /lg:w-auto lg:max-w-\[calc\(\(100svh_-_26rem\)/);
  assert.match(hero, /data-concierge-avoid=""/);
  const css = read("src/components/Yacht/heroCinema.module.css");
  assert.match(css, /width: calc\(100% \+ var\(--hero-bleed\)\)/);
  assert.match(css, /\.heroBleed figcaption \{\s*padding-right: var\(--hero-bleed\);/);
});

test("Wisch-Hinweis in allen Sprachen vorhanden", async () => {
  const { yachtUi } = await import("../../src/lib/yacht/ui.js");
  for (const l of ["de", "en", "fr", "it"]) assert.ok(yachtUi(l).swipeHint?.length > 5, l);
});

test("shelfLayout bleibt unverändert (Sifas-Bild ändert nur den Inhalt)", () => {
  assert.deepEqual(shelfLayout(6), { xl: 3, lastSpanXl: 1, lastSpanMd: 1 });
});
