// Kleine, abhängigkeitsfreie Bausteine für die AR-Viewer-Skripte:
//   writeGlb(meshes)   Kern-glTF 2.0 (GLB) mit eingebetteten PNG, unbeleuchtet (KHR_materials_unlit)
//   readGlb(buf)       Gegenstück für unsere eigenen GLBs (Quads/Meshes mit je einer Textur)
//   writeUsdz(meshes)  USDZ für AR Quick Look: USDA + PNG, unkomprimiertes ZIP mit 64-Byte-Ausrichtung
// Mesh: { name, pos:number[], nrm:number[], uv:number[] (glTF, v nach unten), idx:number[], png:Buffer, double?:bool }
// Alles in Metern, Y nach oben, Vorderseite +Z (wie model-viewer, Scene Viewer und Quick Look).

// ---------------------------------------------------------------------------
// GLB
// ---------------------------------------------------------------------------
export function writeGlb(meshes, { generator = "platzhirsch scripts/arviewer" } = {}) {
  const chunks = [];
  let offset = 0;
  const bufferViews = [];
  const accessors = [];
  const push = (buf, target) => {
    const pad = (4 - (buf.length % 4)) % 4;
    const view = { buffer: 0, byteOffset: offset, byteLength: buf.length };
    if (target) view.target = target;
    bufferViews.push(view);
    chunks.push(buf, Buffer.alloc(pad));
    offset += buf.length + pad;
    return bufferViews.length - 1;
  };
  const f32 = (a) => Buffer.from(new Float32Array(a).buffer);
  const u16 = (a) => Buffer.from(new Uint16Array(a).buffer);
  const minmax = (arr) => {
    const mn = [Infinity, Infinity, Infinity];
    const mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < arr.length; i += 3)
      for (let k = 0; k < 3; k++) {
        mn[k] = Math.min(mn[k], arr[i + k]);
        mx[k] = Math.max(mx[k], arr[i + k]);
      }
    return { min: mn, max: mx };
  };
  const json = {
    asset: { version: "2.0", generator },
    extensionsUsed: ["KHR_materials_unlit"],
    scene: 0,
    scenes: [{ nodes: meshes.map((_, i) => i) }],
    nodes: [],
    meshes: [],
    materials: [],
    textures: [],
    images: [],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: 0 }],
  };
  meshes.forEach((m, i) => {
    const n = m.pos.length / 3;
    const p = accessors.push({ bufferView: push(f32(m.pos), 34962), componentType: 5126, count: n, type: "VEC3", ...minmax(m.pos) }) - 1;
    const no = accessors.push({ bufferView: push(f32(m.nrm), 34962), componentType: 5126, count: n, type: "VEC3" }) - 1;
    const t = accessors.push({ bufferView: push(f32(m.uv), 34962), componentType: 5126, count: n, type: "VEC2" }) - 1;
    const ix = accessors.push({ bufferView: push(u16(m.idx), 34963), componentType: 5123, count: m.idx.length, type: "SCALAR" }) - 1;
    json.images.push({ bufferView: push(m.png), mimeType: "image/png" });
    json.textures.push({ source: i, sampler: 0 });
    json.materials.push({
      name: m.name,
      pbrMetallicRoughness: { baseColorTexture: { index: i }, metallicFactor: 0, roughnessFactor: 1 },
      alphaMode: "BLEND",
      doubleSided: m.double !== false,
      extensions: { KHR_materials_unlit: {} },
    });
    json.meshes.push({ name: m.name, primitives: [{ attributes: { POSITION: p, NORMAL: no, TEXCOORD_0: t }, indices: ix, material: i }] });
    json.nodes.push({ mesh: i, name: m.name });
  });
  json.buffers[0].byteLength = offset;
  const bin = Buffer.concat(chunks);
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const ch = (len, type) => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(len, 0);
    b.writeUInt32LE(type, 4);
    return b;
  };
  return Buffer.concat([header, ch(js.length, 0x4e4f534a), js, ch(bin.length, 0x004e4942), bin]);
}

/** Liest GLBs, wie writeGlb/buildGlb sie schreiben (float32-Attribute, uint16-Indizes, PNG-Texturen). */
export function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("kein GLB");
  const jsLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsLen).toString());
  const binStart = 20 + jsLen + 8;
  const view = (i) => {
    const v = json.bufferViews[i];
    return buf.subarray(binStart + (v.byteOffset || 0), binStart + (v.byteOffset || 0) + v.byteLength);
  };
  const acc = (i) => {
    const a = json.accessors[i];
    const b = view(a.bufferView);
    const n = a.count * { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type];
    const copy = Buffer.from(b.subarray(a.byteOffset || 0));
    if (a.componentType === 5126) return Array.from(new Float32Array(copy.buffer, copy.byteOffset, n));
    if (a.componentType === 5123) return Array.from(new Uint16Array(copy.buffer, copy.byteOffset, n));
    throw new Error(`Komponententyp ${a.componentType}`);
  };
  const nodes = json.scenes[json.scene || 0].nodes.map((i) => json.nodes[i]);
  return nodes.map((node) => {
    const mesh = json.meshes[node.mesh];
    const prim = mesh.primitives[0];
    const mat = json.materials[prim.material];
    const img = json.images[json.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source];
    return {
      name: node.name || mesh.name,
      pos: acc(prim.attributes.POSITION),
      nrm: acc(prim.attributes.NORMAL),
      uv: acc(prim.attributes.TEXCOORD_0),
      idx: acc(prim.indices),
      png: Buffer.from(view(img.bufferView)),
      double: mat.doubleSided !== false,
    };
  });
}

// ---------------------------------------------------------------------------
// USDZ
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * ZIP ohne Kompression, jede Datei auf 64 Byte ausgerichtet (USDZ-Vorgabe von Pixar/Apple).
 * @param {Array<[string, Buffer]>} files  erste Datei = Wurzel-Layer (.usda)
 */
export function zipStored(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    let extraLen = (64 - ((offset + 30 + nameBuf.length) % 64)) % 64;
    if (extraLen > 0 && extraLen < 4) extraLen += 64; // Extra-Feld braucht 4 Byte Kopf
    const extra = Buffer.alloc(extraLen);
    if (extraLen) {
      extra.writeUInt16LE(0x5050, 0); // privates Padding-Feld
      extra.writeUInt16LE(extraLen - 4, 2);
    }
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(10, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8); // stored
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0x21, 12); // 1980-01-01, reproduzierbar
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(extraLen, 28);
    parts.push(lh, nameBuf, extra, data);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(10, 4);
    cd.writeUInt16LE(10, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += 30 + nameBuf.length + extraLen + data.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cdBuf, end]);
}

const f = (n) => (Math.abs(n) < 1e-9 ? "0" : Number(n.toFixed(5)).toString());
const tuple = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(`(${arr.slice(i, i + size).map(f).join(", ")})`);
  return `[${out.join(", ")}]`;
};
const ident = (s, i) => `${String(s || "Mesh").replace(/[^A-Za-z0-9_]/g, "_").replace(/^([0-9])/, "_$1")}_${i}`;

/**
 * USDA-Text + Texturen. Licht: UsdPreviewSurface mit Grundfarbe aus der Textur und
 * zusätzlich halber Eigenleuchtkraft (wirkt wie „unlit“, ohne dunkle Seiten).
 */
export function usdaFor(meshes, { name = "Produkt" } = {}) {
  const mats = [];
  const prims = [];
  meshes.forEach((m, i) => {
    const id = ident(m.name, i);
    const st = [];
    for (let k = 0; k < m.uv.length; k += 2) st.push(m.uv[k], 1 - m.uv[k + 1]); // glTF v nach unten → USD v nach oben
    const counts = Array(m.idx.length / 3).fill(3);
    // QA R2 P1-2: usdchecker --arkit verlangt MaterialBindingAPI am gebundenen Prim und extent am Mesh.
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < m.pos.length; k += 3) {
      for (let a = 0; a < 3; a++) {
        lo[a] = Math.min(lo[a], m.pos[k + a]);
        hi[a] = Math.max(hi[a], m.pos[k + a]);
      }
    }
    prims.push(`
    def Mesh "${id}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        float3[] extent = [(${lo.map(f).join(", ")}), (${hi.map(f).join(", ")})]
        int[] faceVertexCounts = [${counts.join(", ")}]
        int[] faceVertexIndices = [${m.idx.join(", ")}]
        rel material:binding = </Root/Materials/M_${id}>
        normal3f[] normals = ${tuple(m.nrm, 3)} (
            interpolation = "vertex"
        )
        point3f[] points = ${tuple(m.pos, 3)}
        texCoord2f[] primvars:st = ${tuple(st, 2)} (
            interpolation = "vertex"
        )
        uniform bool doubleSided = ${m.double === false ? 0 : 1}
        uniform token subdivisionScheme = "none"
    }`);
    const base = `/Root/Materials/M_${id}`;
    mats.push(`
        def Material "M_${id}"
        {
            token outputs:surface.connect = <${base}/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor.connect = <${base}/Tex.outputs:rgb>
                color3f inputs:emissiveColor.connect = <${base}/Glow.outputs:rgb>
                float inputs:opacity.connect = <${base}/Tex.outputs:a>
                float inputs:opacityThreshold = 0
                float inputs:metallic = 0
                float inputs:roughness = 1
                int inputs:useSpecularWorkflow = 0
                token outputs:surface
            }

            def Shader "St"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                string inputs:varname = "st"
                float2 outputs:result
            }

            def Shader "Tex"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @textures/t${i}.png@
                float2 inputs:st.connect = <${base}/St.outputs:result>
                token inputs:sourceColorSpace = "sRGB"
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                float3 outputs:rgb
                float outputs:a
            }

            def Shader "Glow"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @textures/t${i}.png@
                float2 inputs:st.connect = <${base}/St.outputs:result>
                token inputs:sourceColorSpace = "sRGB"
                float4 inputs:scale = (0.5, 0.5, 0.5, 1)
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                float3 outputs:rgb
            }
        }`);
  });
  return `#usda 1.0
(
    customLayerData = {
        string creator = "platzhirsch scripts/arviewer"
    }
    defaultPrim = "Root"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Root" (
    assetInfo = {
        string name = "${String(name).replace(/[^\p{L}\p{N} .,&()'-]/gu, "").trim()}"
    }
    kind = "component"
)
{
    def Scope "Materials"
    {${mats.join("\n")}
    }
${prims.join("\n")}
}
`;
}

export function writeUsdz(meshes, opts = {}) {
  const usda = Buffer.from(usdaFor(meshes, opts), "utf8");
  return zipStored([["model.usda", usda], ...meshes.map((m, i) => [`textures/t${i}.png`, m.png])]);
}

/** Liest die Einträge eines unkomprimierten ZIP (für Tests). */
export function readZipStored(buf) {
  const out = [];
  let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const size = buf.readUInt32LE(p + 18);
    const nl = buf.readUInt16LE(p + 26);
    const el = buf.readUInt16LE(p + 28);
    const name = buf.subarray(p + 30, p + 30 + nl).toString();
    const start = p + 30 + nl + el;
    out.push({ name, start, data: buf.subarray(start, start + size), crc: buf.readUInt32LE(p + 14) });
    p = start + size;
  }
  return out;
}
