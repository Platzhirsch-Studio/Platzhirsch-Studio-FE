// Sofaplaner 3D – procedural upholstery: cushion geometry, fabric/leather
// surface maps and the floor. The cushion volumes are computed from the
// published module measures; the covers are NEUTRAL material families
// (lib/sofaplaner/materials.js), never manufacturer images.
//
// 3D v2 (31.10.): the surface relief of each family comes from a real CC0
// scan (Poly Haven, normal + roughness map, self-hosted under
// /labs/sofaplaner/tex/, sources in docs/bildquellen/QUELLEN.md). The scans
// carry no colour – the swatch colour stays the swatch colour. Until a scan
// has loaded (or if it fails) the procedural map below stands in.
// Pure three.js, no React – Preview3D imports it.
import {
  BoxGeometry,
  CatmullRomCurve3,
  DataTexture,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  UnsignedByteType,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// --- Render profile per material family ------------------------------------
// tex = procedural surface map, tile = size of one map tile in metres, normal =
// strength, sheenLift = how much lighter the sheen colour is than the base
// colour. scan = CC0 scan (file stem under /labs/sofaplaner/tex/), scanTile =
// real size of the scan in metres (Poly Haven "dimensions"), scanNormal = its
// strength, scanRough = factor on its roughness map.
export const PROFILES = {
  stoff: {
    tex: "weave",
    tile: 0.06,
    normal: 0.45,
    rough: 0.9,
    sheen: 0.45,
    sheenRough: 0.55,
    sheenLift: 0.18,
    scan: "stoff",
    scanTile: 0.271,
    scanNormal: 0.9,
    scanRough: 1,
  },
  struktur: {
    tex: "boucle",
    tile: 0.12,
    normal: 1.1,
    rough: 1,
    sheen: 0.6,
    sheenRough: 0.85,
    sheenLift: 0.12,
    scan: "struktur",
    scanTile: 0.365,
    scanNormal: 1.6,
    scanRough: 1,
  },
  samt: {
    tex: "velvet",
    tile: 0.2,
    normal: 0.3,
    rough: 0.68,
    sheen: 1,
    sheenRough: 0.3,
    sheenLift: 0.38,
    scan: "samt",
    scanTile: 0.279,
    scanNormal: 0.55,
    scanRough: 0.85,
  },
  leder: {
    tex: "leather",
    tile: 0.08,
    normal: 0.5,
    rough: 0.4,
    sheen: 0,
    sheenRough: 0.5,
    sheenLift: 0,
    clearcoat: 0.3,
    clearcoatRough: 0.45,
    scan: "leder",
    scanTile: 0.3,
    scanNormal: 0.8,
    scanRough: 0.75,
  },
  nubuk: {
    tex: "nubuck",
    tile: 0.1,
    normal: 0.3,
    rough: 0.82,
    sheen: 0.5,
    sheenRough: 0.45,
    sheenLift: 0.2,
    scan: "nubuk",
    scanTile: 0.282,
    scanNormal: 0.6,
    scanRough: 1,
  },
  outdoor: {
    tex: "basket",
    tile: 0.07,
    normal: 0.75,
    rough: 0.88,
    sheen: 0.2,
    sheenRough: 0.7,
    sheenLift: 0.1,
    scan: "outdoor",
    scanTile: 0.274,
    scanNormal: 1.1,
    scanRough: 1,
  },
};

// --- CC0 scans (normal + roughness) ------------------------------------------
export const TEX_BASE = "/labs/sofaplaner/tex";
export const HDRI_URL = "/labs/sofaplaner/hdri/interior.hdr";
const scanCache = new Map();

/**
 * Normal and roughness map of a profile's scan, loaded once per size.
 * Resolves to { normal, rough } (linear colour space, repeat wrapping) or null
 * when a file cannot be loaded – the caller keeps the procedural map then.
 * @param {object} p profile  @param {512|1024} size
 */
export function loadScan(p, size) {
  if (!p?.scan || typeof window === "undefined") return Promise.resolve(null);
  const key = `${p.scan}:${size}`;
  if (!scanCache.has(key)) {
    const loader = new TextureLoader();
    const one = (map) =>
      loader.loadAsync(`${TEX_BASE}/${p.scan}-${map}-${size}.webp`).then((t) => {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.colorSpace = NoColorSpace;
        t.anisotropy = 8;
        t.repeat.set(1 / p.scanTile, 1 / p.scanTile);
        return t;
      });
    scanCache.set(
      key,
      Promise.all([one("nor"), one("rough")])
        .then(([normal, rough]) => ({ normal, rough }))
        .catch(() => null)
    );
  }
  return scanCache.get(key);
}
export const profileFor = (key) => PROFILES[key] || PROFILES.stoff;

// --- tiny deterministic noise toolkit (tileable) ---------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);

/** Tileable value noise, `px` × `py` lattice cells across the tile, values 0..1. */
function valueNoise(size, px, py, rnd) {
  const g = new Float32Array(px * py);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * py;
    const iy = Math.floor(fy);
    const ty = smooth(fy - iy);
    const y0 = iy % py,
      y1 = (iy + 1) % py;
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * px;
      const ix = Math.floor(fx);
      const tx = smooth(fx - ix);
      const x0 = ix % px,
        x1 = (ix + 1) % px;
      const a = g[y0 * px + x0] + (g[y0 * px + x1] - g[y0 * px + x0]) * tx;
      const b = g[y1 * px + x0] + (g[y1 * px + x1] - g[y1 * px + x0]) * tx;
      out[y * size + x] = a + (b - a) * ty;
    }
  }
  return out;
}

function fbm(size, base, octaves, rnd, stretch = 1) {
  const out = new Float32Array(size * size);
  let amp = 1,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    const p = base * 2 ** o;
    const n = valueNoise(size, p, Math.max(1, Math.round(p / stretch)), rnd);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Tileable Worley noise: distance to the nearest (f1) and second nearest (f2) feature point, in cell units. */
function worley(size, cells, rnd) {
  const pts = new Float32Array(cells * cells * 2);
  for (let i = 0; i < cells * cells; i++) {
    pts[i * 2] = rnd();
    pts[i * 2 + 1] = rnd();
  }
  const f1 = new Float32Array(size * size);
  const f2 = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * cells;
    const cy = Math.floor(gy);
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells;
      const cx = Math.floor(gx);
      let d1 = 9,
        d2 = 9;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = cx + ox,
            ny = cy + oy;
          const k = (((ny % cells) + cells) % cells) * cells + (((nx % cells) + cells) % cells);
          const dx = nx + pts[k * 2] - gx;
          const dy = ny + pts[k * 2 + 1] - gy;
          const d = Math.hypot(dx, dy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) d2 = d;
        }
      }
      f1[y * size + x] = d1;
      f2[y * size + x] = d2;
    }
  }
  return { f1, f2 };
}

function heightField(kind, size) {
  const rnd = rng(0x5eed + kind.length * 977);
  const h = new Float32Array(size * size);
  if (kind === "weave" || kind === "basket") {
    // plain weave (stoff) or 2/2 basket weave (outdoor) + slub irregularity
    const threads = kind === "weave" ? 48 : 24;
    const group = kind === "weave" ? 1 : 2;
    const slub = fbm(size, 4, 3, rnd);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tx = (x / size) * threads,
          ty = (y / size) * threads;
        const over = (Math.floor(tx / group) + Math.floor(ty / group)) & 1;
        const warp = Math.sin(Math.PI * (tx % 1));
        const weft = Math.sin(Math.PI * (ty % 1));
        h[y * size + x] = (over ? warp * (0.6 + 0.4 * weft) : weft * (0.6 + 0.4 * warp)) * 0.8 + slub[y * size + x] * 0.35;
      }
    }
  } else if (kind === "boucle") {
    // irregular loops: soft Worley bumps on two scales + fbm
    const a = worley(size, 22, rnd);
    const b = worley(size, 41, rnd);
    const n = fbm(size, 6, 3, rnd);
    for (let i = 0; i < h.length; i++) h[i] = Math.max(0, 1 - a.f1[i] * 1.25) * 0.65 + Math.max(0, 1 - b.f1[i] * 1.3) * 0.35 + n[i] * 0.3;
  } else if (kind === "leather") {
    // pebble grain: cell walls of a fine Worley pattern, broad soft wrinkles
    const c = worley(size, 56, rnd);
    const w = fbm(size, 3, 4, rnd);
    for (let i = 0; i < h.length; i++) {
      const edge = Math.min(1, (c.f2[i] - c.f1[i]) / 0.18);
      h[i] = edge * 0.7 + w[i] * 0.5;
    }
  } else if (kind === "velvet") {
    // crushed pile: very soft, broad
    const n = fbm(size, 5, 4, rnd, 1.6);
    h.set(n);
  } else {
    // nubuck: fine sanded noise
    const n = fbm(size, 24, 3, rnd);
    h.set(n);
  }
  return h;
}

const texCache = new Map();

/** Tangent-space normal map for a material family (cached per kind + size). */
export function surfaceNormalMap(kind, size = 256) {
  const key = `${kind}:${size}`;
  if (texCache.has(key)) return texCache.get(key);
  const h = heightField(kind, size);
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  const k = size / 64; // keep the slope comparable across tiers
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * k;
      const dy = (at(x, y + 1) - at(x, y - 1)) * k;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

/** Light oak plank floor (colour map, sRGB). One tile = FLOOR_TILE metres. */
export const FLOOR_TILE = 2.4;
export function floorTexture(size = 512) {
  const key = `floor:${size}`;
  if (texCache.has(key)) return texCache.get(key);
  const rnd = rng(0xf100);
  const planks = 12; // 20 cm boards
  const grain = fbm(size, 24, 3, rnd, 10); // long grain along the boards
  const fine = fbm(size, 64, 2, rnd, 16);
  const offs = Array.from({ length: planks }, () => rnd());
  const tint = Array.from({ length: planks * 2 }, () => (rnd() - 0.5) * 0.06);
  const data = new Uint8Array(size * size * 4);
  const pw = size / planks;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / pw);
      const v = (y / size + offs[col]) % 1;
      const seg = v < 0.5 ? 0 : 1;
      const jointX = x % pw < 1;
      const jointY = Math.abs(v - 0.5) * size < 0.8 || v * size < 0.8;
      const g = grain[y * size + x] * 0.7 + fine[y * size + x] * 0.3;
      let l = 1 + tint[col * 2 + seg] + (g - 0.5) * 0.16;
      if (jointX || jointY) l *= 0.82;
      const i = (y * size + x) * 4;
      data[i] = Math.min(255, Math.round(216 * l));
      data[i + 1] = Math.min(255, Math.round(202 * l));
      data[i + 2] = Math.min(255, Math.round(181 * l));
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

// --- Cushion geometry -------------------------------------------------------
// A subdivided box whose edges are rounded with radius r (SDF-style projection
// onto an inner box), a crowned top, slightly stuffed sides, a piping line
// along the top edge and baked "ambient occlusion" towards the bottom in the
// vertex colours. UVs are in metres (box projection), so the surface map has
// the same real-world scale on every cushion.

const geoCache = new Map();
const GEO_CACHE_MAX = 160;

function axisCoords(L, r, arcN, midN) {
  // vertex positions along one axis: dense in the two rounded bands, even in the middle
  const out = [];
  const n = 2 * arcN + midN;
  for (let i = 0; i <= n; i++) {
    if (i <= arcN) out.push(-L / 2 + (r * i) / arcN);
    else if (i >= n - arcN) out.push(L / 2 - (r * (n - i)) / arcN);
    else out.push(-L / 2 + r + ((L - 2 * r) * (i - arcN)) / midN);
  }
  return out;
}

const prof = (t) => {
  const a = Math.min(1, Math.abs(t));
  return Math.max(0, 1 - 0.35 * a * a - 0.65 * a ** 4);
};

/**
 * @param {number} w width (m)  @param {number} h height (m)  @param {number} d depth (m)
 * @param {{r?:number, crown?:number, bulge?:number, sag?:number, piping?:boolean, ao?:number, arcN?:number}} o
 *   sag = soft dip of the top towards the front (seat cushions that have been sat on)
 */
export function cushionGeometry(w, h, d, o = {}) {
  const r = Math.max(0.004, Math.min(o.r ?? 0.04, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const crown = o.crown ?? 0;
  const bulge = o.bulge ?? 0;
  const sag = o.sag ?? 0;
  const piping = o.piping ?? false;
  const ao = o.ao ?? 0.22;
  const arcN = o.arcN ?? 3;
  const key = [w, h, d, r, crown, bulge, sag, piping, ao, arcN].map((v) => (typeof v === "number" ? v.toFixed(4) : v)).join("|");
  const hit = geoCache.get(key);
  if (hit) return hit;

  const mid = (L) => Math.max(1, Math.min(12, Math.round((L - 2 * r) / 0.07)));
  const nx = 2 * arcN + mid(w),
    ny = 2 * arcN + Math.max(1, Math.min(4, Math.round((h - 2 * r) / 0.06))),
    nz = 2 * arcN + mid(d);
  const cx = axisCoords(w, r, arcN, nx - 2 * arcN);
  const cy = axisCoords(h, r, arcN, ny - 2 * arcN);
  const cz = axisCoords(d, r, arcN, nz - 2 * arcN);
  const box = new BoxGeometry(1, 1, 1, nx, ny, nz);
  box.deleteAttribute("normal");
  box.deleteAttribute("uv");
  const pos = box.attributes.position;
  const map = (u, n, coords) => coords[Math.round((u + 0.5) * n)];
  const hx = w / 2 - r,
    hy = h / 2 - r,
    hz = d / 2 - r;
  for (let i = 0; i < pos.count; i++) {
    let x = map(pos.getX(i), nx, cx),
      y = map(pos.getY(i), ny, cy),
      z = map(pos.getZ(i), nz, cz);
    const ix = Math.max(-hx, Math.min(hx, x)),
      iy = Math.max(-hy, Math.min(hy, y)),
      iz = Math.max(-hz, Math.min(hz, z));
    let dx = x - ix,
      dy = y - iy,
      dz = z - iz;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len;
    dy /= len;
    dz /= len;
    x = ix + dx * r;
    y = iy + dy * r;
    z = iz + dz * r;
    const gx = prof(x / (w / 2)),
      gz = prof(z / (d / 2)),
      gy = prof(y / (h / 2));
    if (crown && dy > 0) y += crown * dy * gx * gz;
    // sag: soft dips where people sit, strongest a little in front of the middle
    if (sag && dy > 0) {
      const fz = Math.exp(-(((z / (d / 2) - 0.2) / 0.55) ** 2));
      const fx = 0.75 + 0.25 * Math.cos((x / (w / 2)) * Math.PI * Math.max(1, Math.round(w / 0.55)));
      y -= sag * dy * gx * fz * fx;
    }
    if (bulge) {
      x += bulge * dx * Math.abs(dx) * gy * gz;
      z += bulge * dz * Math.abs(dz) * gy * gx;
    }
    pos.setXYZ(i, x, y, z);
  }
  const geo = mergeVertices(box, 1e-5);
  box.dispose();
  geo.clearGroups();
  geo.computeVertexNormals();
  const p = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const col = new Float32Array(p.count * 3);
  const yTop = h / 2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const ax = Math.abs(nrm.getX(i)),
      ay = Math.abs(nrm.getY(i)),
      az = Math.abs(nrm.getZ(i));
    if (ay >= ax && ay >= az) [uv[i * 2], uv[i * 2 + 1]] = [x, z];
    else if (ax >= az) [uv[i * 2], uv[i * 2 + 1]] = [z, y];
    else [uv[i * 2], uv[i * 2 + 1]] = [x, y];
    // baked occlusion: darker towards the bottom, a soft line along the top edge (piping)
    const t = Math.min(1, Math.max(0, (y + h / 2) / Math.min(h * 0.7, 0.09)));
    let c = 1 - ao * (1 - smooth(t));
    if (piping) {
      const ny = nrm.getY(i);
      const edge = Math.exp(-(((ny - 0.7) / 0.12) ** 2)) * (y > yTop - r * 1.2 ? 1 : 0);
      c *= 1 - 0.16 * edge;
    }
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c;
  }
  geo.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new Float32BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  if (geoCache.size >= GEO_CACHE_MAX) {
    const first = geoCache.keys().next().value;
    geoCache.get(first).dispose();
    geoCache.delete(first);
  }
  geoCache.set(key, geo);
  return geo;
}

/**
 * Piping (Keder): a thin tube along the seam where the top meets the sides of
 * a cushion with rounded edges of radius r. It lies on the surface, so the
 * silhouette does not change. Cached like the cushions.
 */
export function pipingGeometry(w, h, d, r, o = {}) {
  const rr = Math.max(0.004, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const tube = o.tube ?? 0.0032;
  const seg = o.arcN ?? 3;
  const key = ["pipe", w, h, d, rr, tube, seg].map((v) => (typeof v === "number" ? v.toFixed(4) : v)).join("|");
  const hit = geoCache.get(key);
  if (hit) return hit;
  // seam at 45° on the rounding arc
  const off = rr * (1 - Math.SQRT1_2);
  const y = h / 2 - off;
  const hx = w / 2 - off,
    hz = d / 2 - off;
  const cr = Math.min(rr * 0.9, hx, hz); // corner radius of the seam line
  const pts = [];
  const n = Math.max(2, seg * 2);
  const corner = (cx, cz, a0) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      pts.push(new Vector3(cx + Math.cos(a) * cr, y, cz + Math.sin(a) * cr));
    }
  };
  corner(hx - cr, hz - cr, 0);
  corner(-hx + cr, hz - cr, Math.PI / 2);
  corner(-hx + cr, -hz + cr, Math.PI);
  corner(hx - cr, -hz + cr, (3 * Math.PI) / 2);
  const curve = new CatmullRomCurve3(pts, true, "centripetal");
  const perim = 2 * (2 * hx + 2 * hz);
  const geo = new TubeGeometry(curve, Math.min(400, Math.max(48, Math.round(perim / 0.02))), tube, Math.max(4, seg + 3), true);
  // UVs in metres along the seam (same scale as the cover), light vertex colour (seam shadow)
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * perim, uv.getY(i) * tube * Math.PI * 2);
  geo.setAttribute("color", new Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(0.92), 3));
  if (geoCache.size >= GEO_CACHE_MAX) {
    const first = geoCache.keys().next().value;
    geoCache.get(first).dispose();
    geoCache.delete(first);
  }
  geoCache.set(key, geo);
  return geo;
}

// --- Quality tiers ------------------------------------------------------------
export const TIERS = {
  // scan = size of the CC0 cover scan, hdri = interior HDRI instead of the in-memory studio, piping = seam tubes
  low: {
    name: "low",
    dpr: 1.5,
    shadows: false,
    shadowMap: 0,
    env: 64,
    tex: 128,
    contact: 256,
    arcN: 2,
    scan: 512,
    hdri: false,
    piping: false,
  },
  mid: {
    name: "mid",
    dpr: 1.75,
    shadows: true,
    shadowMap: 1024,
    env: 128,
    tex: 256,
    contact: 512,
    arcN: 3,
    scan: 1024,
    hdri: true,
    piping: true,
  },
  high: {
    name: "high",
    dpr: 2,
    shadows: true,
    shadowMap: 2048,
    env: 256,
    tex: 256,
    contact: 1024,
    arcN: 4,
    scan: 1024,
    hdri: true,
    piping: true,
  },
};
export const LOWER = { high: "mid", mid: "low", low: "low" };

/** First guess from the device; the frame-time monitor in Preview3D steps down if needed. */
export function detectTier() {
  if (typeof window === "undefined") return "mid";
  try {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const mem = navigator.deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;
    const small = Math.min(window.screen?.width || 1024, window.screen?.height || 768) < 520;
    if ((coarse && small) || mem <= 2 || cores <= 2) return "low";
    if (coarse || mem <= 4 || cores <= 4) return "mid";
    return "high";
  } catch {
    return "mid";
  }
}
