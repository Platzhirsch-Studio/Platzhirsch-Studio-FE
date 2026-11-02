// QM r4 Ezarri/Yacht: volle letzte Rasterzeilen (Zweier-, Dreier-, Viererraster), Füllkachel,
// geschützte Bindestriche in Musternamen, Overline-Trenner und Bootslängen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BAND_NACH, breitImZweier, freieZellen, fuellKlasse, spurKlasse, spurenDreier, weicheRaster } from "../../src/lib/ezarri/raster.js";
import { festerCode, mitFesterEinheit } from "../../src/lib/ezarri/einheit.js";
import { bindSeparators, lengthParts } from "../../src/lib/yacht/typography.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("Zweierraster: bei ungerader Anzahl läuft nur die letzte Kachel über beide Spalten", () => {
  for (const n of [3, 5, 7, 11]) {
    let zellen = 0;
    for (let i = 0; i < n; i++) zellen += breitImZweier(i, n) ? 2 : 1;
    assert.equal(zellen % 2, 0, `n=${n}: letzte Zeile nicht voll`);
    assert.equal(breitImZweier(n - 1, n), true);
  }
  for (const n of [2, 4, 6, 12]) for (let i = 0; i < n; i++) assert.equal(breitImZweier(i, n), false);
});

test("spurKlasse: sm-Spanne für die letzte ungerade Kachel, lg wie spurKlasseDreier", () => {
  assert.equal(spurKlasse(10, 11), "sm:col-span-2 lg:col-span-3");
  assert.equal(spurKlasse(0, 11), "lg:col-span-2");
  assert.equal(spurKlasse(1, 2), "lg:col-span-3");
});

test("Einsatz-Kacheln (5): zwei Spalten 2+2+1 breit, drei je Zeile 3+2 → 2+2+2 | 3+3, Seitenverhältnis passend", () => {
  const n = 5;
  const r = Array.from({ length: n }, (_, i) => weicheRaster(i, n));
  assert.match(r[4].li, /@\[18rem\]\/weiche:col-span-2/);
  assert.match(r[4].box, /@\[18rem\]\/weiche:aspect-\[2\/1\]/);
  // 6 Spuren: Summe je Zeile 6
  const spuren = r.map((x) => (x.li.includes("@lg/weiche:col-span-3") ? 3 : 2));
  assert.deepEqual(spuren, [2, 2, 2, 3, 3]);
  assert.equal(spuren.reduce((a, b) => a + b, 0) % 6, 0);
  for (const x of r) assert.match(x.li, /@5xl\/weiche:col-span-1/);
  assert.equal(r[3].box.includes("@lg/weiche:aspect-[3/2]"), true);
  assert.equal(r[0].box.includes("@lg/weiche:aspect-square"), true);
  assert.equal(spurenDreier(3, 5), 3);
});

test("Füllkachel: füllt die letzte Zeile bei 2, 3 und 4 Spalten genau, sonst ausgeblendet", () => {
  for (const n of [1, 2, 3, 9, 12, 13, 23, 31, 32, 63]) {
    const k = fuellKlasse(n);
    assert.ok(k.startsWith("hidden "), "einspaltig nie sichtbar");
    for (const [s, q] of [[2, "18rem"], [3, "34rem"], [4, "62rem"]]) {
      const frei = freieZellen(n, s);
      if (frei === 0) assert.ok(k.includes(`@[${q}]/mos:hidden`), `n=${n}, ${s} Spalten: ausgeblendet`);
      else {
        assert.ok(k.includes(`@[${q}]/mos:col-span-${frei}`), `n=${n}, ${s} Spalten: Spanne ${frei}`);
        assert.equal((n + frei) % s, 0);
      }
    }
  }
  assert.equal(BAND_NACH % 12, 0, "Band nach einem Vielfachen von 12 → volle Zeilen bei 1–4 Spalten");
});

test("Musternamen: geschützter Bindestrich zwischen Ziffer und Buchstabe", () => {
  assert.equal(festerCode("2545-A Hexa"), "2545‑A Hexa");
  assert.equal(festerCode("Blue Lagoon 25"), "Blue Lagoon 25");
  assert.equal(festerCode("Fading-out"), "Fading-out");
  assert.equal(festerCode(null), "");
  assert.equal(mitFesterEinheit("25 mm"), "25 mm");
});

test("Yacht-Overline: Trenner hängt am Wort davor, Länge ohne Umbruch und mit kleiner Einheit", () => {
  assert.equal(bindSeparators("Boote · Yachten · Bootshäuser"), "Boote · Yachten · Bootshäuser");
  assert.equal(bindSeparators("Boats · Yachts"), "Boats · Yachts");
  assert.deepEqual(lengthParts("8–10 m"), { num: "8–10", unit: "m" });
  assert.deepEqual(lengthParts("20–30 m"), { num: "20–30", unit: "m" });
  assert.equal(lengthParts("Bodensee"), null);
  const laenge = read("src/components/Yacht/Laenge.js");
  assert.match(laenge, /normal-case/);
  assert.match(laenge, /whitespace-nowrap/);
});

test("KI-Label: Kürzel nur ohne Dopplung, weicher Trennstrich im deutschen Label, nie breiter als das Bild", () => {
  const ki = read("src/components/Yacht/KiLabel.js");
  assert.match(ki, /text\.includes\(t\.ki\)/);
  assert.match(ki, /max-w-\[calc\(100%-1rem\)\]/);
  assert.match(read("src/lib/yacht/ui.js"), /kiLabel: "KI-generierte Konzept\\u00ADvisualisierung"/);
});

test("Zoomfest: Überschriften der Yacht- und Ezarri-Seite auf die Spaltenbreite gedeckelt", () => {
  const y = read("src/components/Yacht/yacht.module.css");
  assert.match(y, /\.fitHead h2 \{\s*font-size: min\(var\(--text-display-m\), 11cqi\)/);
  assert.match(y, /hyphens: none/);
  const e = read("src/components/Ezarri/Welt/ezarri.module.css");
  assert.match(e, /\.fitHead h2 \{\s*font-size: min\(var\(--text-display-m\), 9cqi\)/);
  assert.match(read("src/components/Ezarri/Welt/parts.js"), /styles\.fitHead/);
  // Schluss fluchtet mit der Seitenkante (kein schmaler Textcontainer mehr)
  assert.doesNotMatch(read("src/components/Ezarri/Welt/parts.js"), /contained="text"/);
});

test("Konfigurator: Verlauf (Rückgängig, Wiederholen, Vergleich) steht in der Leiste unten rechts", () => {
  const s = read("src/components/Ezarri/Konfigurator/Stage.js");
  const unten = s.indexOf("data-ezk-leiste-unten");
  const verlauf = s.indexOf("data-ezk-verlauf");
  assert.ok(unten > 0 && verlauf > unten, "Verlauf in der unteren Leiste");
  assert.match(s, /pointer-events-auto ml-auto flex gap-px" data-ezk-verlauf/);
  assert.match(s, /\[&_\.text-ui\]:whitespace-nowrap/);
});
