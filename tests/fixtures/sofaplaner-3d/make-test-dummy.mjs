// TEST-DUMMY – KEIN Minotti-Modell. Erzeugt eine grobe Klötzchen-Attrappe in
// der Größe eines Endelements mit einer Armlehne (158 × 103 × 85 cm), nur für
// die Unit-Tests der 3D-Pipeline (tests/unit/sofaplaner-3d-pipeline.test.mjs).
// Darf nie nach public/ kopiert oder als Herstellermodell ausgegeben werden.
//
// Absichtlich "unbequem" gebaut, damit die Normalisierung etwas zu tun hat:
// Einheit Millimeter, um 90° gedreht (Breite entlang Z), Armlehne links (SX),
// Materialnamen wie in CAD-Exporten.
//
//   node tests/fixtures/sofaplaner-3d/make-test-dummy.mjs  → test-dummy-sofa.glb
import { Document, NodeIO } from "@gltf-transform/core";

export const DUMMY = { w: 158, d: 103, h: 85, side: "SX" };

function box(doc, buffer, name, mat, [x0, y0, z0], [x1, y1, z1]) {
  const P = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  const F = [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 4, 7, 3],
    [1, 2, 6, 5],
    [3, 7, 6, 2],
    [0, 1, 5, 4],
  ];
  const pos = [];
  const idx = [];
  for (const f of F) {
    const o = pos.length / 3;
    for (const v of f) pos.push(...P[v]);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(pos)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint16Array(idx)).setBuffer(buffer))
    .setMaterial(mat);
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim));
}

/** The dummy as a glTF Document (mm, turned 90° about Y). */
export function makeTestDummy() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const fabric = doc.createMaterial("TEST_DUMMY_Fabric_Seat");
  const metal = doc.createMaterial("TEST_DUMMY_Metal_Feet").setBaseColorFactor([0.1, 0.1, 0.1, 1]);
  const piping = doc.createMaterial("TEST_DUMMY_Piping");
  const W = DUMMY.w * 10,
    D = DUMMY.d * 10;
  const x0 = -W / 2,
    x1 = W / 2,
    zb = -D / 2,
    zf = D / 2;
  const root = doc.createNode("TEST_DUMMY_root").setRotation([0, Math.SQRT1_2, 0, Math.SQRT1_2]); // +90° about Y
  const parts = [
    box(doc, buffer, "feet", metal, [x0 + 30, 0, zb + 30], [x1 - 30, 50, zf - 30]),
    box(doc, buffer, "seat", fabric, [x0, 50, zb], [x1, 420, zf]),
    box(doc, buffer, "back", fabric, [x0, 420, zb], [x1, 850, zb + 200]),
    box(doc, buffer, "armrest_left", fabric, [x0, 420, zb + 200], [x0 + 200, 680, zf]),
    box(doc, buffer, "piping_front", piping, [x0 + 200, 415, zf - 10], [x1, 425, zf]),
  ];
  for (const p of parts) root.addChild(p);
  doc.createScene("TEST_DUMMY").addChild(root);
  return doc;
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const out = new URL("./test-dummy-sofa.glb", import.meta.url);
  await new NodeIO().write(out.pathname.replace(/^\/([A-Za-z]:)/, "$1"), makeTestDummy());
  console.log("geschrieben:", out.pathname);
}
