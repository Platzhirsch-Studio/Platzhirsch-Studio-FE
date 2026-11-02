// node --test tests/unit/sofaplaner-3d-modelle.test.mjs
// Sofaplaner 3D v2 (31.10.2026): Pipeline für Minottis Original-3D-Modelle
// (tools/sofaplaner-3d/), Zuordnung Planelement → GLB (lib/sofaplaner/modelle3d.js)
// und die Absicherung, dass der Test-Dummy nie als Herstellermodell ausgeliefert wird.
// Der Dummy (tests/fixtures/sofaplaner-3d/) ist eine Klötzchen-Attrappe in mm,
// um 90° gedreht, Armlehne links – KEIN Minotti-Modell.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Document } from "@gltf-transform/core";
import { DUMMY, makeTestDummy } from "../fixtures/sofaplaner-3d/make-test-dummy.mjs";
import {
  LODS,
  TOLERANCE_CM,
  buildLod,
  classifyName,
  convertOne,
  createIO,
  detectUnit,
  loadFamilies,
  matchElement,
  matchFamily,
  modelFile,
  normalizeModel,
  sideHint,
  triangleCount,
} from "../../tools/sofaplaner-3d/lib.mjs";
import { downloadList } from "../../tools/sofaplaner-3d/download-liste.mjs";
import { LICENCE_NOTE, MODEL_BASE, findModel, indexManifest, lodFor, modelCoverage, otherSideCode, sourceCode } from "../../src/lib/sofaplaner/modelle3d.js";

const ROOT = new URL("../../", import.meta.url);
const rel = (p) => new URL(p, ROOT);
const families = loadFamilies(path.join(rel("src/lib/sofaplaner/minotti/").pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const as103 = families.get("andersen-slim-103");

test("Familie aus Ordnername, Element aus Minottis Modellnamen", () => {
  assert.equal(matchFamily("Andersen Slim 103", families), "andersen-slim-103");
  assert.equal(matchFamily("andersen-slim-103", families), "andersen-slim-103");
  assert.equal(matchFamily("ANDERSEN SLIM 103 QUILT", families), "andersen-slim-103-quilt");
  assert.equal(matchFamily("irgendwas", families), null);
  assert.equal(matchElement("SOFA CM 227", as103.fam).group.key, "AS103-SOFA-227");
  assert.equal(matchElement("ANDERSEN SLIM 103 ELEMENT WITH 1 ARMREST CM 186", as103.fam).group.key, "AS103-EL1ARM-186");
  assert.equal(matchElement("chaise_longue_DX_cm_227", as103.fam).group.key, "AS103-CHAISE-227");
  assert.equal(matchElement("BENCH CM 134X82", as103.fam).group.key, "ANDERSEN-BENCH-134X82");
  assert.equal(matchElement("SOFA CM 999", as103.fam), null, "falsche Breite → keine Zuordnung");
  assert.equal(sideHint("chaise longue SX cm 186"), "SX");
  assert.equal(sideHint("RIGHT ELEMENT WITH 1 ARMREST"), "DX");
  assert.equal(sideHint("SOFA CM 227"), null);
});

test("Materialklassen: Polster, Sockel/Füße, Keder", () => {
  assert.equal(classifyName("Fabric_Seat_01"), "upholstery");
  assert.equal(classifyName("LEATHER cushion"), "upholstery");
  assert.equal(classifyName("Metal_Feet"), "base");
  assert.equal(classifyName("Base brandy lacquer"), "base");
  assert.equal(classifyName("bordino / piping"), "piping");
  assert.equal(classifyName("Material.012"), null, "unbekannt → Geometrie entscheidet");
});

test("Einheit: mm/cm/m/inch werden an den JSON-Maßen erkannt", () => {
  const exp = { w: 158, d: 103, h: 85 };
  assert.equal(detectUnit([1580, 850, 1030], exp).unit, "mm");
  assert.equal(detectUnit([1.03, 0.85, 1.58], exp).unit, "m");
  assert.equal(detectUnit([158, 85, 103], exp).unit, "cm");
  assert.equal(detectUnit([62.2, 33.46, 40.55], exp).unit, "inch");
});

test("Test-Dummy: Einheit, Drehung, Ursprung, Hand und Maßprüfung", () => {
  const r = normalizeModel(makeTestDummy(), { w: DUMMY.w, d: DUMMY.d, h: DUMMY.h, kind: "ende" });
  assert.equal(r.unit, "mm");
  assert.equal(r.side, "SX", "Armlehne links = SX");
  assert.deepEqual(r.bbox, { w: 158, h: 85, d: 103 });
  assert.equal(r.ok, true);
  // Ursprung: Mitte der Grundfläche auf Bodenhöhe, Rücken bei −Z
  const meshes = Object.fromEntries(r.doc.getRoot().listMeshes().map((m) => [m.getName(), m]));
  assert.deepEqual(Object.keys(meshes).sort(), ["base", "piping", "upholstery"]);
  const P = meshes.upholstery.listPrimitives()[0].getAttribute("POSITION");
  const lo = P.getMin([]),
    hi = P.getMax([]);
  assert.ok(Math.abs(lo[0] + hi[0]) < 1e-3 && Math.abs(lo[2] + hi[2]) < 1e-3, "zentriert in X/Z");
  assert.ok(Math.abs(lo[1] - 0) < 1e-6 || lo[1] > 0, "steht auf dem Boden");
  // die höchsten Punkte (Rücken, 85 cm) liegen hinten (z < 0)
  const arr = P.getArray();
  let topZ = 0,
    n = 0;
  for (let i = 0; i < arr.length; i += 3)
    if (arr[i + 1] > 0.84) {
      topZ += arr[i + 2];
      n++;
    }
  assert.ok(n > 0 && topZ / n < 0, "Rücken bei −Z, Front +Z");
  // Box-UVs in Metern
  assert.ok(meshes.upholstery.listPrimitives()[0].getAttribute("TEXCOORD_0"));
});

test(`Maßabweichung > ${TOLERANCE_CM} cm wird markiert (ok: false)`, () => {
  const r = normalizeModel(makeTestDummy(), { w: 186, d: 103, h: 85, kind: "ende" });
  assert.equal(r.ok, false);
  assert.equal(r.deviation.w, -28);
});

test("LODs: dichte Geometrie wird auf desktop ≤120k / mobile ≤30k reduziert, meshopt-komprimiert", async () => {
  // dichtes Gitter (~200k Dreiecke) als Polster
  const doc = new Document();
  const buf = doc.createBuffer();
  const N = 317;
  const pos = new Float32Array((N + 1) * (N + 1) * 3);
  const nrm = new Float32Array(pos.length);
  const uv = new Float32Array((N + 1) * (N + 1) * 2);
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++) {
      const k = j * (N + 1) + i;
      pos.set([i / N, 0.4 + 0.02 * Math.sin(i * 0.3) * Math.cos(j * 0.2), j / N], k * 3);
      nrm.set([0, 1, 0], k * 3);
      uv.set([i / N, j / N], k * 2);
    }
  const idx = new Uint32Array(N * N * 6);
  let o = 0;
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      idx.set([a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2], o);
      o += 6;
    }
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buf))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buf))
    .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(uv).setBuffer(buf))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(idx).setBuffer(buf))
    .setMaterial(doc.createMaterial("upholstery"));
  doc.createScene().addChild(doc.createNode("upholstery").setMesh(doc.createMesh("upholstery").addPrimitive(prim)));
  assert.ok(triangleCount(doc) > LODS.desktop.max);
  const desk = await buildLod(doc, "desktop");
  const mob = await buildLod(doc, "mobile");
  assert.ok(desk.tris <= LODS.desktop.max && desk.tris >= 40_000, `desktop ${desk.tris}`);
  assert.ok(mob.tris <= LODS.mobile.max && mob.tris >= 5_000, `mobile ${mob.tris}`);
  const used = desk.doc
    .getRoot()
    .listExtensionsUsed()
    .map((e) => e.extensionName);
  assert.ok(used.includes("EXT_meshopt_compression"));
  assert.ok(mob.doc.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute("TEXCOORD_0"), "UVs bleiben für die Bezugstexturen");
});

test("convertOne: schreibt beide LODs + Manifest-Einträge mit Lizenzhinweis", async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sp3d-test-"));
  try {
    const io = createIO();
    const input = path.join(tmp, "in.glb");
    await writeFile(input, await io.writeBinary(makeTestDummy()));
    const group = matchElement("ELEMENT WITH 1 ARMREST CM 158", as103.fam).group;
    const entries = await convertOne({
      io,
      inputPath: input,
      family: "andersen-slim-103",
      fam: as103.fam,
      raw: as103.raw,
      group,
      side: null,
      outDir: tmp,
      source: "tests/fixtures/sofaplaner-3d/test-dummy-sofa.glb",
      writeFile: async (p, bytes) => {
        await mkdir(path.dirname(p), { recursive: true });
        await writeFile(p, bytes);
      },
    });
    assert.equal(entries.length, 2);
    for (const e of entries) {
      assert.equal(e.code, "AS103-EL1ARM-158-SX", "Hand aus der Geometrie → SX-Code");
      assert.equal(e.side, "SX");
      assert.equal(e.modelName, "ELEMENT WITH 1 ARMREST CM 158", "Name aus cad.modelle_3d");
      assert.equal(e.licence, LICENCE_NOTE);
      assert.equal(e.ok, true);
      assert.equal(e.file, modelFile("andersen-slim-103", "AS103-EL1ARM-158-SX", "SX", e.lod));
      assert.ok(existsSync(path.join(tmp, e.file)));
      const back = await io.read(path.join(tmp, e.file));
      assert.equal(back.getRoot().listMeshes().length, 3);
    }
    assert.deepEqual(entries.map((e) => e.lod).sort(), ["desktop", "mobile"]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// --- Zuordnung im Planer ---------------------------------------------------------
const els = new Map(as103.fam.elements.map((e) => [e.code, e]));
const entry = (o) => ({ family: "andersen-slim-103", lod: "desktop", ok: true, licence: LICENCE_NOTE, ...o });
const manifest = (models, freigabe = true) => ({ version: 1, freigabe, models });

test("Zuordnung: ohne schriftliche Freigabe oder mit Maßabweichung → schematisch", () => {
  const m = [entry({ code: "AS103-SOFA-227", side: null, file: "andersen-slim-103/AS103-SOFA-227.desktop.glb" })];
  assert.equal(findModel(indexManifest(manifest(m, false)), "andersen-slim-103", els.get("AS103-SOFA-227")), null);
  assert.equal(findModel(indexManifest(manifest([{ ...m[0], ok: false }])), "andersen-slim-103", els.get("AS103-SOFA-227")), null);
  const hit = findModel(indexManifest(manifest(m)), "andersen-slim-103", els.get("AS103-SOFA-227"));
  assert.equal(hit.url, `${MODEL_BASE}/andersen-slim-103/AS103-SOFA-227.desktop.glb`);
  assert.equal(hit.mirrored, false);
  assert.equal(findModel(indexManifest(manifest(m)), "andersen-slim-103", els.get("AS103-SOFA-186")), null, "anderes Element bleibt schematisch");
  assert.equal(findModel(indexManifest(manifest(m)), "andersen-slim-90", els.get("AS103-SOFA-227")), null, "andere Familie");
});

test("Zuordnung: SX/DX – fehlende Hand wird gespiegelt und markiert", () => {
  const idx = indexManifest(manifest([entry({ code: "AS103-EL1ARM-158-SX", side: "SX", file: "andersen-slim-103/AS103-EL1ARM-158-SX.desktop.glb" })]));
  const sx = findModel(idx, "andersen-slim-103", els.get("AS103-EL1ARM-158-SX"));
  const dx = findModel(idx, "andersen-slim-103", els.get("AS103-EL1ARM-158-DX"));
  assert.equal(sx.mirrored, false);
  assert.equal(dx.mirrored, true);
  assert.equal(dx.file, sx.file);
  // beide Hände vorhanden → keine Spiegelung
  const both = indexManifest(
    manifest([
      entry({ code: "AS103-EL1ARM-158-SX", side: "SX", file: "a.glb" }),
      entry({ code: "AS103-EL1ARM-158-DX", side: "DX", file: "b.glb" }),
    ])
  );
  assert.equal(findModel(both, "andersen-slim-103", els.get("AS103-EL1ARM-158-DX")).file, "b.glb");
  assert.equal(findModel(both, "andersen-slim-103", els.get("AS103-EL1ARM-158-DX")).mirrored, false);
});

test("Zuordnung: abgeleitete Hände (ein Code, Planer-Varianten -SX/-DX)", () => {
  const derived = { code: "X-END-SX", side: "SX", sideDerived: true };
  const derivedDx = { code: "X-END-DX", side: "DX", sideDerived: true };
  assert.equal(sourceCode(derived), "X-END");
  assert.equal(sourceCode({ code: "AS103-EL1ARM-158-SX", side: "SX" }), "AS103-EL1ARM-158-SX");
  assert.equal(otherSideCode("A-B-SX"), "A-B-DX");
  assert.equal(otherSideCode("A-B"), null);
  const idx = indexManifest(manifest([entry({ family: "fam", code: "X-END", side: "DX", file: "fam/X-END-DX.desktop.glb" })]));
  assert.equal(findModel(idx, "fam", derived).mirrored, true);
  assert.equal(findModel(idx, "fam", derivedDx).mirrored, false);
});

test("Zuordnung: LOD nach Qualitätsstufe, Legende zählt Original vs. schematisch", () => {
  assert.equal(lodFor("low"), "mobile");
  assert.equal(lodFor("mid"), "desktop");
  const idx = indexManifest(
    manifest([
      entry({ code: "AS103-SOFA-227", side: null, file: "d.glb", lod: "desktop" }),
      entry({ code: "AS103-SOFA-227", side: null, file: "m.glb", lod: "mobile" }),
    ])
  );
  assert.equal(findModel(idx, "andersen-slim-103", els.get("AS103-SOFA-227"), { lod: "mobile" }).file, "m.glb");
  assert.equal(findModel(idx, "andersen-slim-103", els.get("AS103-SOFA-227"), { lod: "desktop" }).file, "d.glb");
  const lookup = (c) => els.get(c);
  assert.deepEqual(modelCoverage(idx, "andersen-slim-103", [{ code: "AS103-SOFA-227" }, { code: "AS103-SOFA-186" }], lookup), { real: 1, schematic: 1 });
});

test("ausgeliefertes Manifest: ohne Freigabe, kein Test-Dummy in public/", () => {
  const dir = rel("public/labs/sofaplaner/modelle/");
  const m = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8"));
  assert.equal(typeof m.freigabe, "boolean");
  assert.ok(Array.isArray(m.models));
  assert.doesNotMatch(JSON.stringify(m), /test-dummy|TEST_DUMMY|fixtures/i);
  for (const e of m.models) assert.equal(e.licence, LICENCE_NOTE);
  const walk = (u) =>
    readdirSync(u, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(new URL(`${d.name}/`, u)) : [d.name]));
  for (const f of walk(dir)) assert.doesNotMatch(f, /dummy|fixture/i, f);
});

test("Bezugs-Scans und HDRI sind selbst gehostet und in QUELLEN.md belegt", () => {
  for (const k of ["stoff", "struktur", "samt", "leder", "nubuk", "outdoor"])
    for (const m of ["nor", "rough"]) for (const s of [512, 1024]) assert.ok(existsSync(rel(`public/labs/sofaplaner/tex/${k}-${m}-${s}.webp`)), `${k}-${m}-${s}`);
  assert.ok(existsSync(rel("public/labs/sofaplaner/hdri/interior.hdr")));
  const q = readFileSync(rel("docs/bildquellen/QUELLEN.md"), "utf8");
  for (const a of ["rough_linen", "terry_cloth", "velour_velvet", "leather_white", "scuba_suede", "hessian_380", "brown_photostudio_02"]) assert.ok(q.includes(a), a);
  const src = readFileSync(rel("src/components/Labs/Sofaplaner/Preview3D.js"), "utf8");
  assert.doesNotMatch(src, /https?:\/\//, "keine CDN-URLs");
  assert.match(src, /meshopt_decoder\.module\.js/);
});

test("Download-Liste deckt alle 90 Familien ab, Namen aus cad.modelle_3d wo vorhanden", () => {
  const list = downloadList(families);
  assert.equal(list.length, families.size);
  assert.ok(families.size >= 90);
  const a = list.find((f) => f.slug === "andersen-slim-103");
  assert.equal(a.source, "cad.modelle_3d");
  assert.ok(a.items.some((i) => i.name === "ELEMENT WITH 1 ARMREST CM 158" && i.codes[0] === "AS103-EL1ARM-158"));
  assert.ok(list.every((f) => f.items.length > 0), "jede Familie hat mindestens ein Modell");
  assert.ok(existsSync(rel("docs/sofaplaner-3d-downloadliste.md")));
});
