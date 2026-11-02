#!/usr/bin/env node
// Packs the Poly Haven CC0 sample models (glTF + .bin + JPG textures) into a
// single self-contained .glb each, adds KHR_materials_variants (colour/fabric
// variants that <model-viewer> switches via `variant-name`) and prints surface
// points for the material hotspots.
//
// Usage (from the repo root, sources downloaded from polyhaven.com/models):
//   node src/components/Labs/ArViewer/tools/build-models.mjs <download-dir>
// <download-dir> holds one folder per asset id: sofa_02/, mid_century_lounge_chair/,
// modern_ceiling_lamp_01/ — each with the .gltf, .bin and textures/.
//
// Output: public/labs/ar-viewer/models/<id>.glb and public/labs/ar-viewer/posters/<id>.webp
//
// For real manufacturer data use gltf-transform instead (see
// Marktresearch/digital/features/ar-viewer.md) — this script only exists so the
// Labs demo has proper variants without extra npm packages. It uses `sharp`,
// which Next.js already ships for next/image.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC) {
  console.error("Usage: build-models.mjs <download-dir>");
  process.exit(1);
}
const OUT_MODELS = path.resolve("public/labs/ar-viewer/models");
const OUT_POSTERS = path.resolve("public/labs/ar-viewer/posters");
fs.mkdirSync(OUT_MODELS, { recursive: true });
fs.mkdirSync(OUT_POSTERS, { recursive: true });

// ---------------------------------------------------------------------------
// Model recipes
// ---------------------------------------------------------------------------
const RECIPES = [
  {
    id: "sofa_02",
    gltf: "sofa_02_1k.gltf",
    // Leather is a dark, low-saturation grey; the wooden frame is reddish.
    // Variants recolour only the low-saturation pixels of the base colour map.
    // QA round 1: a bright, saturated cognac (128,76,42) at 0.7 contrast made the
    // worn-leather texture look blotchy orange. Now: fewer, muted variants and the
    // leather's light/dark structure compressed to 35 % (contrast 0.35).
    variants: [
      { name: "anthrazit", original: true },
      { name: "cognac", tint: [96, 60, 38] },
      { name: "taupe", tint: [120, 108, 96] },
    ],
    recolor: { chromaLow: 18, chromaHigh: 34, contrast: 0.35, kMin: 0.65, kMax: 1.3 },
    hotspots: {
      sitz: { target: [0, 0.42, 0.12], hint: [0, 1, 0] },
      ruecken: { target: [0, 0.6, -0.3], hint: [0, 0.3, 1] },
      gestell: { target: [-0.84, 0.12, 0.28], hint: [0, 0, 1] },
    },
  },
  {
    id: "mid_century_lounge_chair",
    gltf: "mid_century_lounge_chair_1k.gltf",
    reencodeJpeg: 86, // source JPEGs are ~q100 → re-encode to save ~60 %
    variants: null, // one texture atlas for leather + wood: no clean mask → no variants
    hotspots: {
      leder: { target: [0, 0.48, 0.15], hint: [0, 1, 0] },
      schale: { target: [0.45, 0.62, 0.1], hint: [0, 1, 0] },
      fuss: { target: [0.3, 0.03, 0.3], hint: [0, 1, 0] },
    },
  },
  {
    id: "modern_ceiling_lamp_01",
    gltf: "modern_ceiling_lamp_01_2k.gltf",
    // The metal body has its own material → factor-only variants, no new textures.
    variants: [
      { name: "nickel", original: true },
      { name: "messing", material: "modern_ceiling_lamp_01", factor: [1.0, 0.78, 0.42, 1] },
      { name: "schwarz", material: "modern_ceiling_lamp_01", factor: [0.14, 0.14, 0.14, 1] },
    ],
    hotspots: {
      glas: { target: [0.2, 0.33, 0.05], hint: [1, 0, 0] },
      kappe: { target: [0.1, 0.52, 0.1], hint: [0, 1, 0] },
      baldachin: { target: [0, 1.17, 0], hint: [0, 1, 0] },
    },
  },
];

// ---------------------------------------------------------------------------
const pad4 = (n) => (n + 3) & ~3;
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

function readAccessor(gltf, bin, index) {
  const acc = gltf.accessors[index];
  const view = gltf.bufferViews[acc.bufferView];
  const comps = { VEC3: 3, VEC2: 2, SCALAR: 1, VEC4: 4 }[acc.type];
  const stride = view.byteStride || comps * 4;
  const base = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const out = [];
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * stride;
    const v = [];
    for (let c = 0; c < comps; c++) v.push(bin.readFloatLE(o + c * 4));
    out.push(v);
  }
  return out;
}

// Nearest vertex to `target` whose normal faces roughly along `hint`.
function surfacePoint(gltf, bin, target, hint) {
  let best = null;
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    const t = node.translation || [0, 0, 0];
    for (const prim of gltf.meshes[node.mesh].primitives) {
      const pos = readAccessor(gltf, bin, prim.attributes.POSITION);
      const nor = readAccessor(gltf, bin, prim.attributes.NORMAL);
      for (let i = 0; i < pos.length; i++) {
        const p = [pos[i][0] + t[0], pos[i][1] + t[1], pos[i][2] + t[2]];
        const n = nor[i];
        const hl = Math.hypot(...hint);
        const dot = (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2]) / hl;
        if (dot < 0.5) continue;
        const d = Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2]);
        if (!best || d < best.d) best = { d, p, n };
      }
    }
  }
  const r = (x) => Number(x.toFixed(4));
  return best ? { position: best.p.map(r), normal: best.n.map(r), distance: r(best.d) } : null;
}

// Recolour the low-chroma (grey/black leather) pixels of a base-colour map,
// keep the high-chroma ones (reddish wood). Chroma = max-min in 0..255.
async function recolor(jpgBuffer, tint, { chromaLow, chromaHigh, contrast = 0.7, kMin = 0.35, kMax = 1.6 }) {
  const { data, info } = await sharp(jpgBuffer).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  const weights = new Float32Array(info.width * info.height);
  const lums = [];
  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    const chroma = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
    const w = Math.min(1, Math.max(0, (chromaHigh - chroma) / (chromaHigh - chromaLow)));
    weights[p] = w;
    const L = lum(i);
    if (w > 0.9 && L > 4) lums.push(L); // ignore pure-black padding between UV islands
  }
  lums.sort((a, b) => a - b);
  const refL = lums.length ? lums[Math.floor(lums.length / 2)] : 128; // median
  const out = Buffer.from(data);
  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    const w = weights[p];
    if (!w) continue;
    // Keep the leather's light/dark structure, compressed so highlights don't blow out.
    const k = Math.min(kMax, Math.max(kMin, 1 + (lum(i) / refL - 1) * contrast));
    for (let c = 0; c < 3; c++) {
      const v = Math.min(255, tint[c] * k);
      out[i + c] = Math.round(data[i + c] * (1 - w) + v * w);
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: ch } })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function build(recipe) {
  const dir = path.join(SRC, recipe.id);
  const gltf = JSON.parse(fs.readFileSync(path.join(dir, recipe.gltf), "utf8"));
  const srcBin = fs.readFileSync(path.join(dir, gltf.buffers[0].uri));

  const chunks = [srcBin];
  let offset = pad4(srcBin.length);
  const addBlob = (buf) => {
    const padBefore = offset - chunks.reduce((s, c) => s + c.length, 0);
    if (padBefore > 0) chunks.push(Buffer.alloc(padBefore));
    const viewIndex = gltf.bufferViews.length;
    gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length });
    chunks.push(buf);
    offset = pad4(offset + buf.length);
    return viewIndex;
  };

  // Embed the original images.
  const imageBuffers = [];
  for (const im of gltf.images) {
    let buf = fs.readFileSync(path.join(dir, im.uri));
    if (recipe.reencodeJpeg && /\.jpe?g$/i.test(im.uri)) {
      buf = await sharp(buf).jpeg({ quality: recipe.reencodeJpeg, mozjpeg: true }).toBuffer();
    }
    imageBuffers.push(buf);
  }
  gltf.images = gltf.images.map((im, i) => {
    const ext = path.extname(im.uri).toLowerCase();
    return { name: im.name || path.basename(im.uri, ext), mimeType: MIME[ext], bufferView: addBlob(imageBuffers[i]) };
  });

  // Variants
  if (recipe.variants) {
    const variantDefs = recipe.variants.map((v) => ({ name: v.name }));
    const originalMaterials = [...gltf.materials]; // snapshot: copies are appended below
    const mappingsByMaterial = new Map(); // original material index → [{material, variants}]
    const addMapping = (origMat, mat, vIdx) => {
      const list = mappingsByMaterial.get(origMat) || [];
      const existing = list.find((m) => m.material === mat);
      if (existing) existing.variants.push(vIdx);
      else list.push({ material: mat, variants: [vIdx] });
      mappingsByMaterial.set(origMat, list);
    };

    for (const [vIdx, v] of recipe.variants.entries()) {
      if (v.original) {
        originalMaterials.forEach((_, mi) => addMapping(mi, mi, vIdx));
        continue;
      }
      originalMaterials.forEach((mat, mi) => {
        const targeted = v.material ? mat.name === v.material : true;
        if (!targeted) {
          addMapping(mi, mi, vIdx);
          return;
        }
        const copy = structuredClone(mat);
        copy.name = `${mat.name}_${v.name}`;
        if (v.factor) copy.pbrMetallicRoughness.baseColorFactor = v.factor;
        if (v.tint) {
          // New base-colour texture for this variant.
          const texIdx = mat.pbrMetallicRoughness.baseColorTexture.index;
          const imgIdx = gltf.textures[texIdx].source;
          copy.__pendingTint = { imgIdx, tint: v.tint, texIdx };
        }
        const newIndex = gltf.materials.length;
        gltf.materials.push(copy);
        addMapping(mi, newIndex, vIdx);
      });
    }

    // Resolve recolour jobs (async) after the loop.
    for (const mat of gltf.materials) {
      if (!mat.__pendingTint) continue;
      const { imgIdx, tint, texIdx } = mat.__pendingTint;
      delete mat.__pendingTint;
      const buf = await recolor(imageBuffers[imgIdx], tint, recipe.recolor);
      if (process.env.DEBUG_TEX_DIR) fs.writeFileSync(path.join(process.env.DEBUG_TEX_DIR, `${mat.name}.jpg`), buf);
      const newImg = gltf.images.length;
      gltf.images.push({ name: `${mat.name}_diff`, mimeType: "image/jpeg", bufferView: addBlob(buf) });
      const newTex = gltf.textures.length;
      gltf.textures.push({ ...gltf.textures[texIdx], source: newImg });
      mat.pbrMetallicRoughness.baseColorTexture = { ...mat.pbrMetallicRoughness.baseColorTexture, index: newTex };
    }

    for (const mesh of gltf.meshes) {
      for (const prim of mesh.primitives) {
        const mappings = (mappingsByMaterial.get(prim.material) || []).filter((m) => m.variants.length);
        if (mappings.length) {
          prim.extensions = { ...(prim.extensions || {}), KHR_materials_variants: { mappings } };
        }
      }
    }
    gltf.extensions = { ...(gltf.extensions || {}), KHR_materials_variants: { variants: variantDefs } };
    gltf.extensionsUsed = [...new Set([...(gltf.extensionsUsed || []), "KHR_materials_variants"])];
  }

  const binBody = Buffer.concat(chunks);
  const binPadded = Buffer.concat([binBody, Buffer.alloc(pad4(binBody.length) - binBody.length)]);
  gltf.buffers = [{ byteLength: binPadded.length }];
  gltf.asset = {
    ...gltf.asset,
    generator: "Platzhirsch Labs build-models.mjs",
    copyright: "CC0 1.0 – Poly Haven (polyhaven.com) – Beispielmodell",
  };

  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadded = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)]);
  const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonPadded.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(binPadded.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, jh, jsonPadded, bh, binPadded]);
  fs.writeFileSync(path.join(OUT_MODELS, `${recipe.id}.glb`), glb);

  // Poster (Poly Haven render) → WebP
  const thumb = path.join(dir, "thumb.png");
  if (fs.existsSync(thumb)) {
    await sharp(thumb)
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(OUT_POSTERS, `${recipe.id}.webp`));
  }

  const hotspots = {};
  for (const [k, h] of Object.entries(recipe.hotspots)) hotspots[k] = surfacePoint(gltf, srcBin, h.target, h.hint);
  console.log(JSON.stringify({ id: recipe.id, bytes: glb.length, hotspots }, null, 1));
}

for (const r of RECIPES) await build(r);
