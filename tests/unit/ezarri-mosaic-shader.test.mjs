// Mosaik-Shader (Glas-Realismus): Farbtreue der Fern-Mittelwerte, Palettenaufbau, Shader-Bausteine.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { applyMaterialSet, createMosaicUniforms, createMosaicMaterial, hexLin, paletteMean, posterMaske, PAL_COLS } from "../../src/lib/ezarri/konfigurator/shader/mosaic.js";

const near = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const SRC = fs.readFileSync(new URL("../../src/lib/ezarri/konfigurator/shader/mosaic.js", import.meta.url), "utf8");

test("hexLin: sRGB → linear (IEC 61966-2-1)", () => {
  near(hexLin("#ffffff")[0], 1);
  near(hexLin("#000000")[1], 0);
  near(hexLin("#808080")[2], 0.2158605, 1e-6);
});

test("paletteMean: flächengewichtet, letzter von 6 Einträgen nimmt den Rest", () => {
  const m = paletteMean([["#ff0000", 75], ["#0000ff", 25]]);
  near(m[0], 0.75);
  near(m[2], 0.25);
  // 7 Einträge: nur 6 im Shader, der sechste deckt den Rest (wie kumulierter Anteil 1.0001)
  const seven = Array.from({ length: 7 }, (_, i) => [i === 5 ? "#ffffff" : "#000000", 1]);
  near(paletteMean(seven)[0], 2 / 7);
});

test("applyMaterialSet: Spalte 6 = Mittelwert + Deckschicht, uAreaMean = Mischungsmittel", () => {
  const u = createMosaicUniforms();
  applyMaterialSet(u, {
    mix: [
      { pal: [["#ff0000", 1]], fin: [0.6, 0.3, "glanz"] },
      { pal: [["#0000ff", 1]], fin: [0.12, 0.05, "matt"] },
    ],
    cum: [0.6, 1],
    kanaele: [],
    pattern: null,
    fuge: "#ededed",
    format: "25",
    seed: 3,
  });
  const d = u.uPal.value.image.data;
  const o0 = (0 * PAL_COLS + 6) * 4;
  const o1 = (1 * PAL_COLS + 6) * 4;
  near(d[o0], 1);
  near(d[o0 + 3], 1); // Glas glänzend: volle Deckschicht
  near(d[o1 + 2], 1);
  assert.ok(d[o1 + 3] < 0.5, "matt: schwache Deckschicht");
  const a = u.uAreaMean.value;
  near(a.x, 0.6);
  near(a.z, 0.4);
  near(a.y, 0);
  // Poster-Maske überschreibt auch die Mittelwerte (sonst Fern-LOD in Farbe)
  posterMaske(u, 1);
  near(d[o0 + 1], 1);
  near(u.uAreaMean.value.y, 1);
});

test("Shader: Glas-Deckschicht, analytische Fugenfilterung, mittelwertfreie Steinstreuung", () => {
  const mat = createMosaicMaterial(createMosaicUniforms(), { kind: 1 });
  assert.equal(mat.clearcoat, 1);
  assert.match(mat.customProgramCacheKey(), /^ezarri-mosaic-v3-/);
  assert.match(SRC, /float groutBox\(float x, float a, float w\)/);
  assert.match(SRC, /clearcoatNormal = mCoatN/);
  assert.match(SRC, /material\.clearcoatRoughness = min\(max\(mCoatRough/);
  assert.match(SRC, /ch - dot\(ch, vec3\(0\.3333\)\)/, "Farbton-Streuung ohne Helligkeitsverschiebung");
  // keine Ableitungen in verzweigtem Code: Basis außerhalb, Fase nur über mSlope
  assert.doesNotMatch(SRC, /dFdx\(mHeight\)/);
});

test("groutBox (JS-Nachbau): flächentreu bei großem Fußabdruck, scharf bei kleinem", () => {
  const groutBox = (x, a, w) => {
    w = Math.max(w, 1e-4);
    const y0 = x + a * 0.5 - w * 0.5;
    const y1 = y0 + w;
    const b = Math.floor(y0);
    const p0 = Math.min(y0 - b, a);
    const p1 = (Math.floor(y1) - b) * a + Math.min(y1 - Math.floor(y1), a);
    return Math.min(1, Math.max(0, (p1 - p0) / w));
  };
  const a = (2 * 0.00055) / 0.0258;
  for (const x of [0.13, 7.77, 250.4]) near(groutBox(x, a, 9.0), a, 0.01);
  near(groutBox(0.5, a, 0.01), 0); // Steinmitte
  near(groutBox(3.0, a, 0.01), 1); // auf der Fuge
});
