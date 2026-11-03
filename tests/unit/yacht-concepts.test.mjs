// tests/unit/yacht-concepts.test.mjs
// /de/yacht-interior (Signature "Die Werfthalle"): data rules of the six
// example concepts, AI labels, wording, and the procedural boat generator.
// Docs: Marktresearch/digital/features/yacht.md
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildConcepts, islandConcepts, renderView, KI_LABEL, RENDER_LABEL, OPEN_ZONES, OPEN_ZONE_EXCEPTIONS, placeProduct } from "../../src/lib/yacht/model.js";
import { HULLS, MODEL_KEYS, buildHull, buildModel, cameraFor, triangleEstimate } from "../../src/lib/yacht/hull.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const data = JSON.parse(read("src/lib/yacht/concepts.json"));
const renders = JSON.parse(read("src/lib/yacht/renders.json"));
const concepts = buildConcepts(data, renders);

test("six concepts, one per 3D model, every model known to the generator", () => {
  assert.equal(concepts.length, 6);
  assert.deepEqual(new Set(concepts.map((c) => c.model)), new Set(MODEL_KEYS));
  for (const key of Object.keys(data.modelle)) assert.ok(HULLS[key], key);
});

test("no open boat zone shows an indoor or catalogue-only product (exception: In Vitro Unplugged)", () => {
  for (const c of concepts) {
    if (c.model === "hausboot") continue; // houseboat terrace = terrace
    for (const z of c.zones.filter((z) => OPEN_ZONES.includes(z.id))) {
      for (const p of z.products) {
        const ok = p.eignung === "aussen-marine-hersteller" || OPEN_ZONE_EXCEPTIONS[p.id];
        assert.ok(ok, `${c.id}/${z.id}: ${p.brand} ${p.name} (${p.eignung})`);
      }
    }
  }
  assert.deepEqual(placeProduct({ zone: "deck", eignung: "innen-lose", id: "x" }, "daycruiser").zone, null);
  assert.equal(placeProduct({ zone: "flybridge", eignung: "aussen-katalog", id: "x" }, "superyacht").zone, "bootshaus");
});

test("indoor products never on the jetty, every product zone exists in the view", () => {
  for (const c of concepts) {
    const ids = new Set(c.zones.map((z) => z.id));
    for (const p of c.products) {
      assert.ok(ids.has(p.zone), `${c.id}: ${p.name} in ${p.zone}`);
      if (p.zone === "bootshaus") assert.notEqual(p.eignung, "innen-lose", p.name);
    }
  }
});

test("every product has a catalogue link and an image; no Baobab (open flame)", () => {
  for (const k of data.konzepte) {
    for (const p of k.produkte) {
      assert.match(p.href, /^\/de\/produkte\/[a-z0-9-]+\/[a-z0-9-]+$/, p.name);
      assert.match(p.bild, /^\/cmx\//, p.name);
      assert.notEqual(p.marke, "Baobab");
    }
  }
  for (const c of concepts) for (const p of c.products) assert.ok(!p.path.startsWith("/de/"), "locale-free path for next-intl links");
});

test("only Blender renderings are shown (03.11.2026: no AI images), captioned and present as AVIF + WebP in two sizes", () => {
  const all = concepts.flatMap((c) => c.images);
  const shown = renders.renders.filter((r) => r.kiGeneriert === false);
  assert.equal(all.length, shown.length);
  assert.ok(shown.length > 0);
  const byId = Object.fromEntries(renders.renders.map((r) => [r.id, r]));
  for (const r of renders.renders.filter((x) => x.kiGeneriert === true)) assert.ok(!all.some((img) => img.id === r.id), `${r.id}: AI image must not be shown`);
  for (const img of all) {
    // 03.11.2026 (Inhaber): only renderings, every one with the caption – no AI label on the page
    assert.equal(byId[img.id].kiGeneriert, false, img.id);
    assert.equal(img.label, RENDER_LABEL, img.id);
    assert.equal(img.kiGenerated, false, img.id);
    for (const fmt of ["avif", "webp"]) for (const w of [1200, 2400]) assert.ok(readFileSync(path.join(ROOT, "public", img[fmt][w])).length > 1000, img[fmt][w]);
  }
  assert.match(read("src/components/Yacht/ConceptImage.js"), /<KiLabel/);
  assert.equal(KI_LABEL, "KI-generierte Konzeptvisualisierung");
  assert.equal(RENDER_LABEL, "Visualisierung (Rendering)");
});

test("Renderings (02.11.2026) only where the boat type fits; runabout, sailing yacht and boathouse have only AI entries (not shown since 03.11.2026)", () => {
  const byId = Object.fromEntries(renders.renders.map((r) => [r.id, r]));
  const rendered = ["motoryacht-riviera-flybridge", "motoryacht-riviera-salon", "motoryacht-riviera-kabine", "daycruiser-seelicht-cockpit", "daycruiser-seelicht-kabine", "daycruiser-seelicht-salon", "superyacht-sonnendeck-nacht"];
  for (const id of rendered) {
    const r = byId[id];
    assert.equal(r.kiGeneriert, false, id);
    assert.equal(r.art, "rendering", id);
    assert.equal(r.bildunterschrift, "Visualisierung (Rendering)", id);
    assert.doesNotMatch(JSON.stringify([r.alt, r.kennzeichnung, r.titel]), /Foto|KI-generiert/i, id);
    const bytes = readFileSync(path.join(ROOT, "public", r.datei.webp[1200]));
    assert.ok(bytes.includes(Buffer.from("digitalCreation")), `${id}: XMP digitalCreation`);
    assert.ok(!bytes.includes(Buffer.from("trainedAlgorithmicMedia")), `${id}: no AI source type`);
  }
  for (const r of renders.renders.filter((x) => !rendered.includes(x.id))) assert.equal(r.kiGeneriert, true, r.id);
  for (const id of ["runabout-mahagoni-deck", "runabout-mahagoni-steg", "segelyacht-nordwind-salon", "segelyacht-nordwind-deck", "bootshaus-ufer-terrasse", "bootshaus-ufer-wohnraum"]) assert.equal(byId[id].kiGeneriert, true, id);
  // the badge shows the caption without the AI abbreviation
  const label = read("src/components/Yacht/KiLabel.js");
  assert.match(label, /ki === false/);
  assert.match(label, /t\.renderLabel/);
  for (const f of ["src/components/Yacht/ConceptImage.js", "src/components/Yacht/Werfthalle.js"]) assert.match(read(f), /<KiLabel ki=\{[^}]*kiGenerated !== false\}/, f);
});

test("public texts: no claims, no internal notes, no forbidden wording, no prices", () => {
  const pub = concepts.flatMap((c) => [
    c.title, c.motto, c.mood, ...c.palette.map((p) => p.rolle), ...c.materials.flatMap((m) => [m.name, m.einsatz, m.hinweis || ""]),
    ...c.zones.map((z) => z.text), ...c.products.flatMap((p) => [p.role, p.note || ""]), ...c.sattler, ...c.werft, ...c.gartenbau,
  ]);
  const text = pub.join("\n");
  assert.deepEqual(findClaims(text), []);
  for (const bad of [/Bauleitung/, /salzwasserfest/i, /marine-zertifiziert/i, /schwer entflammbar/i, /Token/, /Bericht \d/, /Minotti-Bilder/, /T€|€/, /Saisonservice/, /\bPartner/]) {
    assert.doesNotMatch(text, bad, String(bad));
  }
  const page = read("src/app/[locale]/yacht-interior/page.js").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.deepEqual(findClaims(page), []);
  assert.doesNotMatch(page, /Gloster/, "Gloster has 0 products in the catalogue");
  assert.match(page, /Schirme auf Anfrage/, "Tuuci: only Bleau furniture in the catalogue");
});

test("FAQ keeps the 7 questions and adds 3D + AI-image answers", () => {
  const page = read("src/app/[locale]/yacht-interior/page.js");
  // texte-seo-ki 31.10.2026: 9 → 13 (Stoff/Schaum, Werften & Sattler, Kosten, Minotti an Bord).
  assert.equal((page.match(/\bq: "/g) || []).length, 13);
  assert.match(page, /Welcher Stoff und welcher Schaum eignen sich für Bootspolster\?/);
  assert.match(page, /Pauschalpreise nennen wir deshalb nicht/);
  assert.match(page, /Ist das 3D-Boot auf dieser Seite mein Boot\?/);
  assert.match(page, /Sind die Bilder der Beispielkonzepte echte Projekte\?/);
});

test("3D stays out of the initial bundle: Stage3D only via next/dynamic ssr:false", () => {
  const island = read("src/components/Yacht/Werfthalle.js");
  assert.match(island, /dynamic\(\(\) => import\("\.\/Stage3D"\), \{ ssr: false/);
  // R7-P4: das Seitenlayout liegt jetzt in src/components/Yacht/YachtPage.js
  for (const f of ["src/components/Yacht/YachtPage.js", "src/components/Yacht/Werfthalle.js", "src/components/Yacht/ConceptGallery.js"]) {
    assert.doesNotMatch(read(f), /from "three"|@react-three/, f);
  }
  assert.doesNotMatch(read("src/components/Yacht/Stage3D.js"), /<Environment preset|useGLTF|\.hdr/, "no CDN/HDRI");
});

test("generator: finite geometry, budget, zones match the concept data", () => {
  for (const key of MODEL_KEYS) {
    const hull = buildHull(HULLS[key]);
    assert.ok(hull.positions.every(Number.isFinite), key);
    assert.ok(Math.max(...hull.indices) < hull.positions.length / 3, key);
    const model = buildModel(key);
    assert.ok(triangleEstimate(model) < 120000, `${key} triangles`);
    for (const z of data.modelle[key].zonen) assert.ok(model.anchors[z], `${key} anchor ${z}`);
    for (const z of ["salon", "kabine", "bad"]) if (model.anchors[z] && data.modelle[key].zonen.includes(z)) assert.ok(model.cutY[z] != null, `${key} cut ${z}`);
    for (const z of [null, ...data.modelle[key].zonen]) {
      const cam = cameraFor(model, z, 0.8);
      assert.ok([...cam.position, ...cam.target].every(Number.isFinite), `${key} ${z}`);
    }
  }
});

test("island payload is slim (no materials/mood twice)", () => {
  const island = islandConcepts(concepts);
  assert.ok(JSON.stringify(island).length < 40000, String(JSON.stringify(island).length));
  assert.ok(!("materials" in island[0]));
});

test("QA round 1: zone cameras look obliquely (35–50°) and furniture are silhouettes", () => {
  for (const key of MODEL_KEYS) {
    const model = buildModel(key);
    for (const z of Object.keys(model.anchors)) {
      const cam = cameraFor(model, z, 0.8);
      if (z === "bootshaus" && !data.modelle[key].zonen.includes(z)) continue;
      const [dx, dy, dz] = cam.position.map((v, i) => v - cam.target[i]);
      const el = (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI;
      if (cam.cut != null) assert.ok(el >= 35 && el <= 50, `${key}/${z} elevation ${el.toFixed(1)}°`);
      assert.ok(model.rooms[z], `${key} room ${z}`);
    }
    // beds have headboard + pillows, sofas have arms: more than one part per piece
    assert.ok(model.parts.filter((p) => p.mat === "bedding").length >= (data.modelle[key].zonen.includes("kabine") ? 3 : 0), key);
  }
});

test("QA round 1: re-rendered images replace the honest-but-unfinished captions, C2PA + LQIP present", () => {
  const byId = Object.fromEntries(concepts.flatMap((c) => c.images).map((img) => [img.id, img]));
  // 02.11.2026: the Riviera flybridge is now a Blender rendering (v3, see the rendering test)
  assert.match(byId["motoryacht-riviera-flybridge"].avif[1200], /-v3-1200\.avif$/);
  // 03.11.2026: the runabout AI image is no longer shown (not in `concepts`); its file entry in
  // renders.json keeps the C2PA/IPTC marks – checked on the raw entry via renderView.
  const raw = Object.fromEntries(renders.renders.map((r) => [r.id, renderView(r)]));
  for (const id of ["runabout-mahagoni-deck"]) {
    assert.equal(byId[id], undefined, `${id}: AI image not shown`);
    assert.equal(raw[id].note, null, id);
    assert.match(raw[id].avif[1200], /-v2-1200\.avif$/);
    const bytes = readFileSync(path.join(ROOT, "public", raw[id].webp[1200]));
    assert.ok(bytes.includes(Buffer.from("c2pa")), `${id}: C2PA manifest embedded`);
    assert.ok(bytes.includes(Buffer.from("trainedAlgorithmicMedia")), `${id}: IPTC source type`);
  }
  for (const img of Object.values(byId)) assert.match(img.lqip || "", /^data:image\/webp;base64,/, img.id);
});

test("QA round 1: product tiles – Minotti never cropped, every product has a fit", () => {
  for (const c of concepts) {
    for (const p of c.products) {
      assert.ok(["contain", "cover"].includes(p.imageFit), p.name);
      if (p.brand === "Minotti") assert.equal(p.imageFit, "contain", p.name);
    }
  }
});
