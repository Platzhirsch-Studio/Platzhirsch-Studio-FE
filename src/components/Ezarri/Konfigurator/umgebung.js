// Ezarri-Konfigurator – Umgebung für Pool und Whirlpool (QM Runde 1, P1-3): begrenzte
// Terrasse mit Kante, Rasen, Hecke, Bäume, See und Bergkette am Horizont. Alles
// prozedural (eigene Arbeit, 0 Byte Download): Texturen aus <canvas>, Berge und See
// als Shader, die dem Himmel (Tageszeit) folgen. Nur im Lazy-Chunk (three).
//
// Die Umgebung ist bewusst ruhig: Sie gibt Maßstab und Spiegelung, die Hauptrolle
// spielt das Mosaik. Keine Darstellung eines realen Ortes.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SKY_GLSL } from "@/lib/ezarri/konfigurator/shader/mosaic";

// ---------------------------------------------------------------------------
// Texturen (einmal je Sitzung)

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const TEX = {};
function canvasTex(key, size, draw, repeat = 1) {
  if (TEX[key] || typeof document === "undefined") return TEX[key] || null;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repeat, repeat);
  TEX[key] = t;
  return t;
}

/** Rasen: feine Halme in mehreren Grüntönen, nahtlos. */
function grasTex() {
  return canvasTex("gras", 256, (ctx, n) => {
    const r = rng(29);
    ctx.fillStyle = "#6f8a4f";
    ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 9000; i++) {
      const g = 95 + Math.round(r() * 60);
      ctx.fillStyle = `rgba(${Math.round(g * 0.62)},${g},${Math.round(g * 0.42)},${0.25 + r() * 0.35})`;
      const x = r() * n;
      const y = r() * n;
      ctx.fillRect(x, y, 1, 2 + r() * 3);
    }
    // weiche Flecken (gegen sichtbare Kachelung)
    for (let i = 0; i < 18; i++) {
      const x = r() * n;
      const y = r() * n;
      const rad = 20 + r() * 50;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const a = r() < 0.5 ? "rgba(40,60,25,0.16)" : "rgba(150,170,90,0.12)";
      gr.addColorStop(0, a);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
    }
  });
}

/** Blattwerk für Hecke und Bäume. */
function laubTex() {
  return canvasTex("laub", 256, (ctx, n) => {
    const r = rng(71);
    ctx.fillStyle = "#2c3f24";
    ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 2600; i++) {
      const g = 60 + Math.round(r() * 70);
      ctx.fillStyle = `rgba(${Math.round(g * 0.55)},${g},${Math.round(g * 0.4)},${0.35 + r() * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(r() * n, r() * n, 1.5 + r() * 3, 1 + r() * 2, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Nahtloses Wertrauschen auf einem periodischen Gitter (f Zellen je Kachel, f ≤ 32). */
function periodRauschen(seed) {
  const r = rng(seed);
  const G = 32;
  const gitter = Array.from({ length: G * G }, () => r());
  return (u, v, f) => {
    const gx = u * f;
    const gy = v * f;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = gx - x0;
    const ty = gy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = (i, j) => gitter[(((j % f) + f) % f) * G + (((i % f) + f) % f)];
    return (a(x0, y0) * (1 - sx) + a(x0 + 1, y0) * sx) * (1 - sy) + (a(x0, y0 + 1) * (1 - sx) + a(x0 + 1, y0 + 1) * sx) * sy;
  };
}

/**
 * Terrasse: Großformat 120 × 60 cm im Halbverband, heller warmgrauer Naturstein (Wolken,
 * Körnung, je Platte eigener Ton), 3-mm-Fugen. Eine Kachel = 2,4 m. Dazu eine Normal-Map
 * (Fugen vertieft, Kanten gefast, feine Oberfläche). Beides einmal je Sitzung.
 */
const PLATTE_KACHEL = 2.4;
function plattenSatz() {
  if (TEX.platten || typeof document === "undefined") return TEX.platten || null;
  const n = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches ? 512 : 1024;
  const sk = n / 1024;
  const r = rng(11);
  const rau = periodRauschen(5);
  const zeilen = 4;
  const zh = n / zeilen;
  const pw = n / 2;
  const ton = Array.from({ length: 16 }, () => [1 + (r() - 0.5) * 0.09, (r() - 0.5) * 0.03]);
  const hoehe = new Float32Array(n * n);
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++) {
    const zeile = Math.floor(y / zh);
    const versatz = zeile % 2 ? pw / 2 : 0;
    const dy = Math.min(y - zeile * zh, (zeile + 1) * zh - 1 - y);
    for (let x = 0; x < n; x++) {
      const xs = (x + versatz) % n;
      const spalte = Math.floor(xs / pw);
      const dx = Math.min(xs - spalte * pw, (spalte + 1) * pw - 1 - xs);
      const d = Math.min(dx, dy);
      const [hell, warm] = ton[(zeile * 2 + spalte) % 16];
      const u = x / n;
      const v = y / n;
      const wolke = rau(u, v, 6) * 0.5 + rau(u, v, 13) * 0.3 + rau(u, v, 29) * 0.2;
      const korn = (r() - 0.5) * 0.05 + (r() < 0.006 ? -0.1 : 0) + (r() < 0.004 ? 0.06 : 0);
      let val = (0.86 + (wolke - 0.5) * 0.1 + korn) * hell;
      let h = 0.25 * wolke + (r() - 0.5) * 0.08;
      if (d < 1.5 * sk) {
        val = 0.5; // Fuge
        h = -2.5;
      } else if (d < 4 * sk) {
        h -= (4 - d / sk) * 0.45; // Fase
        val *= 0.97;
      }
      hoehe[y * n + x] = h;
      const o = (y * n + x) * 4;
      img.data[o] = Math.min(255, 255 * val * (1 + warm));
      img.data[o + 1] = Math.min(255, 255 * val * 0.975);
      img.data[o + 2] = Math.min(255, 255 * val * (0.93 - warm));
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  // Normal-Map aus dem Höhenfeld (nahtlos)
  const nc = document.createElement("canvas");
  nc.width = nc.height = n;
  const nctx = nc.getContext("2d");
  const nimg = nctx.createImageData(n, n);
  const H = (x, y) => hoehe[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const gx = (H(x + 1, y) - H(x - 1, y)) * 0.5;
      const gy = (H(x, y + 1) - H(x, y - 1)) * 0.5;
      const l = Math.hypot(gx, gy, 1);
      const o = (y * n + x) * 4;
      nimg.data[o] = Math.round((-gx / l) * 127.5 + 127.5);
      nimg.data[o + 1] = Math.round((gy / l) * 127.5 + 127.5);
      nimg.data[o + 2] = Math.round((1 / l) * 127.5 + 127.5);
      nimg.data[o + 3] = 255;
    }
  nctx.putImageData(nimg, 0, 0);
  const normal = new THREE.CanvasTexture(nc);
  normal.colorSpace = THREE.NoColorSpace;
  for (const t of [map, normal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  TEX.platten = { map, normal };
  return TEX.platten;
}

// ---------------------------------------------------------------------------
// Flächen beleben (QM R2 P2-4): großflächiges Farbrauschen in Weltkoordinaten (gegen
// „einfarbige Fläche“ und sichtbare Kachelung), Abdunklung zum Boden hin (Kontakt-
// verdeckung bei Hecke und Bäumen) und Aufhellung zur Ferne (Luftperspektive).
// Rein im Shader, 0 Byte Download.
const VARIATION_GLSL = /* glsl */ `
float uvHash(vec2 p) { p = fract(p * vec2(0.1031, 0.103)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float uvNoise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 s = f * f * (3.0 - 2.0 * f);
  return mix(mix(uvHash(i), uvHash(i + vec2(1, 0)), s.x), mix(uvHash(i + vec2(0, 1)), uvHash(i + vec2(1, 1)), s.x), s.y); }
float uvFbm(vec2 p) { return uvNoise(p) * 0.5 + uvNoise(p * 2.1 + 3.7) * 0.3 + uvNoise(p * 4.3 - 1.3) * 0.2; }
`;
const fx = (v) => Number(v).toFixed(3);

/**
 * Material beleben. boden = [[yVon, yBis], faktor] dunkelt unten ab; ferne = Anteil Luftperspektive.
 */
function belebe(mat, { skala = 0.18, staerke = 0.3, warm = 0.12, boden = null, ferne = 0, ton = [0.78, 0.84, 0.76] } = {}) {
  const bodenGlsl = boden ? `diffuseColor.rgb *= mix(${fx(boden[1])}, 1.0, smoothstep(${fx(boden[0][0])}, ${fx(boden[0][1])}, vWpU.y));` : "";
  const ferneGlsl = ferne
    ? `diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${ton.map(fx).join(", ")}) * 0.55, smoothstep(14.0, 120.0, length(vWpU.xz - cameraPosition.xz)) * ${fx(ferne)});`
    : "";
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWpU;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWpU = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vWpU;\n${VARIATION_GLSL}`).replace(
      "#include <color_fragment>",
      `#include <color_fragment>
  {
    vec2 q = vWpU.xz + vec2(vWpU.y * 0.7, 0.0);
    float n1 = uvFbm(q * ${fx(skala)});
    float n2 = uvNoise(q * ${fx(skala * 6)});
    diffuseColor.rgb *= 1.0 + (n1 - 0.5) * ${fx(staerke * 2)} + (n2 - 0.5) * ${fx(staerke * 0.6)};
    // trockene, wärmere Stellen
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.08, 0.78), smoothstep(0.6, 0.85, uvFbm(q * ${fx(skala * 0.5)} + 9.0)) * ${fx(warm)});
    ${bodenGlsl}
    ${ferneGlsl}
  }`,
    );
  };
  const key = JSON.stringify([skala, staerke, warm, boden, ferne, ton]);
  mat.customProgramCacheKey = () => `ezk-belebt-${key}`;
  return mat;
}

// ---------------------------------------------------------------------------
// Geometrie-Hilfen

function shapeFrom(pts, flip = true) {
  return pts.map(([x, z]) => new THREE.Vector2(x, flip ? -z : z));
}

/** Rechteck mit runden Ecken als Punktliste [x, z]. */
function roundRect(x0, z0, x1, z1, rad, seg = 6) {
  const pts = [];
  const c = [
    [x1 - rad, z0 + rad, -Math.PI / 2],
    [x1 - rad, z1 - rad, 0],
    [x0 + rad, z1 - rad, Math.PI / 2],
    [x0 + rad, z0 + rad, Math.PI],
  ];
  for (const [cx, cz, a0] of c) for (let i = 0; i <= seg; i++) {
    const a = a0 + (i / seg) * (Math.PI / 2);
    pts.push([cx + Math.cos(a) * rad, cz + Math.sin(a) * rad]);
  }
  return pts;
}

/**
 * Weicher Kontaktschatten (Umgebungsverdeckung) als Band entlang eines Polygons:
 * innen dunkel, außen transparent. `pts` geschlossen, `d` Breite nach außen.
 */
function aoBand(pts, d, y, strength, offsetFn) {
  const outer = offsetFn(pts, d);
  const pos = [];
  const col = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    pos.push(pts[i][0], y, pts[i][1], outer[i][0], y, outer[i][1]);
    col.push(0, 0, 0, strength, 0, 0, 0, 0);
  }
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    const b = ((i + 1) % n) * 2;
    idx.push(a, a + 1, b + 1, a, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------------------
// Ferne: Bergkette und See (Shader, folgen dem Himmel, ohne Nebel)

function bergMaterial(sky, { dunst, schnee }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...sky, uDunst: { value: dunst }, uSchnee: { value: schnee } },
    vertexShader: /* glsl */ `
      attribute float hRel;
      varying float vH;
      varying vec3 vN;
      varying vec3 vDir;
      varying vec3 vWb;
      void main() {
        vH = hRel;
        vWb = (modelMatrix * vec4(position, 1.0)).xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vDir = normalize(w.xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform float uDunst;
      uniform float uSchnee;
      varying float vH;
      varying vec3 vN;
      varying vec3 vDir;
      varying vec3 vWb;
      void main() {
        // Struktur: Rinnen und Grate aus Rauschen über Bogenwinkel und Höhe (QM R2 P2-4.2)
        float ang = atan(vWb.z, vWb.x);
        float rin = skyFbm(vec2(ang * 38.0, vH * 3.0));
        float fein = skyFbm(vec2(ang * 140.0, vH * 9.0));
        float lit = clamp(dot(normalize(vN), normalize(uSunDirS)) * 0.6 + 0.45, 0.15, 1.0);
        lit *= 0.72 + 0.5 * rin;
        vec3 wald = vec3(0.05, 0.08, 0.06) * (0.8 + 0.4 * fein);
        vec3 fels = vec3(0.16, 0.17, 0.18) * (0.75 + 0.5 * fein);
        float grenze = 0.35 + (rin - 0.5) * 0.3;
        vec3 c = mix(wald, fels, smoothstep(grenze, grenze + 0.3, vH));
        float sg = 0.64 + (fein - 0.5) * 0.18 - (rin - 0.5) * 0.12;
        c = mix(c, vec3(0.92, 0.94, 0.98), smoothstep(sg, sg + 0.1, vH) * uSchnee);
        c *= (uSunColorS * 0.9 + vec3(0.12)) * lit;
        // Luftperspektive: zum Horizont hin Dunst
        vec3 hz = skyColor(vec3(vDir.x, 0.02, vDir.z));
        c = mix(c, hz, uDunst);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Bergkette als Band auf einem Kreisbogen; Höhenprofil aus Summen von Sinus (deterministisch). */
function bergkette({ radius, hoehe, von, bis, seed, y0 = -2 }) {
  const seg = 420;
  const pos = [];
  const hRel = [];
  const idx = [];
  const r = rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const a = von + (bis - von) * t;
    // Grate statt Wellen: 1 − |sin| als Kämme, dazu feine Zacken (QM R2 P2-4.2)
    const kamm = 1 - Math.abs(Math.sin(t * 9.3 + ph[0]));
    const prof =
      0.5 +
      0.22 * Math.sin(t * 5.1 + ph[1]) +
      0.2 * kamm * kamm +
      0.1 * (1 - Math.abs(Math.sin(t * 23.7 + ph[2]))) +
      0.05 * Math.sin(t * 61 + ph[3]) +
      0.025 * Math.sin(t * 157 + ph[0] * 2) +
      0.012 * Math.sin(t * 331 + ph[1] * 3);
    const rand = Math.min(1, Math.min(t, 1 - t) * 6); // Enden flach auslaufen
    const h = hoehe * Math.max(0.12, prof) * (0.35 + 0.65 * rand);
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    pos.push(x, y0, z, x, y0 + h, z);
    hRel.push(0, h / hoehe);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("hRel", new THREE.Float32BufferAttribute(hRel, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function seeMaterial(sky) {
  return new THREE.ShaderMaterial({
    uniforms: { ...sky },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vW;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float rip = sin(vW.x * 0.9 + vW.z * 0.4) * 0.5 + sin(vW.z * 1.7 - vW.x * 0.3) * 0.5;
        vec3 n = normalize(vec3(rip * 0.012, 1.0, rip * 0.008));
        float F = 0.02 + 0.98 * pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0);
        vec3 R = reflect(-V, n);
        vec3 tief = vec3(0.02, 0.07, 0.09) * (uSkyHorizon * 0.8 + 0.2);
        vec3 c = mix(tief, skyColor(R), clamp(F * 1.4, 0.0, 1.0));
        // Glanzstreifen (QM R2 P2-4.3): windstille Bahnen spiegeln den Himmel glatter und heller
        float streif = smoothstep(0.55, 0.8, skyFbm(vec2(vW.x * 0.012, vW.z * 0.0035) + vec2(2.0, 5.0)));
        vec3 Rg = reflect(-V, vec3(0.0, 1.0, 0.0));
        c = mix(c, skyColor(Rg) * 0.95, streif * 0.55 * clamp(F * 2.0 + 0.25, 0.0, 1.0));
        // Sonnenglitzern: feine Wellen, nur wo die Spiegelung zur Sonne zeigt
        vec3 ng = normalize(vec3((skyFbm(vW.xz * 0.9) - 0.5) * 0.35, 1.0, (skyFbm(vW.zx * 0.9 + 4.0) - 0.5) * 0.35));
        float glitz = pow(max(dot(reflect(-V, ng), normalize(uSunDirS)), 0.0), 60.0);
        c += uSunColorS * glitz * 0.9 * (1.0 - streif * 0.6);
        float far = smoothstep(60.0, 230.0, length(vW.xz - cameraPosition.xz));
        c = mix(c, skyColor(vec3(-V.x, 0.01, -V.z)), far * 0.55);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ---------------------------------------------------------------------------

/**
 * Umgebung bauen.
 * @param {{becken:object, szene:string, coping:number[][], deckClip:THREE.Plane[]|null, offsetOutline:Function, sky:object}} p
 * @returns {{group:THREE.Group, dispose:()=>void, deckTop:number}}
 */
export function buildUmgebung({ becken, szene, coping, deckClip, offsetOutline, sky }) {
  const group = new THREE.Group();
  const disposables = [];
  const add = (geo, mat, opts = {}) => {
    const m = new THREE.Mesh(geo, mat);
    Object.assign(m, opts);
    group.add(m);
    disposables.push(geo, mat);
    return m;
  };
  const { l } = becken;
  const b = szene === "whirlpool" ? becken.l : becken.b;
  const S = Math.max(l, b);
  const infinity = szene === "pool" && becken.rand === "infinity";
  const RASEN_Y = -0.1;

  // --- Terrasse: begrenzt, mit 10 cm Kante zum Rasen und Fase -----------------
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of coping) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  }
  const rand = szene === "whirlpool" ? 1.5 : 2.2;
  const deck = roundRect(x0 - rand - (szene === "pool" ? 0.8 : 0), z0 - rand, x1 + (infinity ? 0 : rand), z1 + rand, 0.35);
  const deckShape = new THREE.Shape(shapeFrom(deck));
  deckShape.holes.push(new THREE.Path(shapeFrom(coping)));
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, { depth: -RASEN_Y, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
  deckGeo.rotateX(-Math.PI / 2);
  deckGeo.translate(0, RASEN_Y - 0.012, 0);
  {
    // UV in Metern (eine Texturkachel = PLATTE_KACHEL)
    const p = deckGeo.attributes.position;
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      uv[i * 2] = p.getX(i) / PLATTE_KACHEL;
      uv[i * 2 + 1] = (p.getZ(i) + p.getY(i) * 0.3) / PLATTE_KACHEL;
    }
    deckGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    deckGeo.computeVertexNormals();
  }
  const platten = plattenSatz();
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece2,
    map: platten?.map || null,
    normalMap: platten?.normal || null,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.82,
    clippingPlanes: deckClip,
  });
  // großflächige Ton-Variation gegen sichtbare Kachelung
  add(deckGeo, belebe(deckMat, { skala: 0.07, staerke: 0.06, warm: 0.12 }));
  // Kontaktschatten: Beckenkopf auf die Terrasse, Terrassenkante auf den Rasen
  const aoKopf = aoBand(coping, 0.28, 0.0015, 0.3, offsetOutline);
  aoKopf.material.clippingPlanes = deckClip;
  group.add(aoKopf);
  disposables.push(aoKopf.geometry, aoKopf.material);
  const aoDeck = aoBand(deck, 0.45, RASEN_Y + 0.002, 0.35, offsetOutline);
  aoDeck.material.clippingPlanes = deckClip;
  group.add(aoDeck);
  disposables.push(aoDeck.geometry, aoDeck.material);

  // --- Rasen bis zum Ufer, Wiese dahinter ------------------------------------
  const ufer = x1 + S * 0.5 + 22;
  const rasenOpts = { skala: 0.11, staerke: 0.22, warm: 0.35, ferne: 0.55, ton: [0.72, 0.8, 0.66] };
  const rasenMat = belebe(new THREE.MeshStandardMaterial({ color: 0xe6efd8, map: grasTex(), roughness: 1, clippingPlanes: infinity ? deckClip : null }), rasenOpts);
  rasenMat.map.repeat.set(1 / 2.5, 1 / 2.5);
  // Rasenfläche mit Aussparung für die Terrasse (sonst schnitte sie durchs Becken)
  const rasenShape = new THREE.Shape(shapeFrom([[-260, -260], [ufer, -260], [ufer, 260], [-260, 260]]));
  rasenShape.holes.push(new THREE.Path(shapeFrom(deck)));
  const rasen = new THREE.ShapeGeometry(rasenShape, 6);
  rasen.rotateX(-Math.PI / 2);
  rasen.translate(0, RASEN_Y, 0);
  {
    const p = rasen.attributes.position;
    const uv = rasen.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
  }
  add(rasen, rasenMat);
  if (infinity) {
    // Gelände hinter der Überlaufkante 1,1 m tiefer, ebenfalls Rasen
    const kante = becken.l / 2;
    const tief = new THREE.PlaneGeometry(ufer - kante, 520);
    tief.rotateX(-Math.PI / 2);
    tief.translate(kante + (ufer - kante) / 2, -1.1, 0);
    const p = tief.attributes.position;
    const uv = tief.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
    const m2 = belebe(rasenMat.clone(), rasenOpts);
    m2.clippingPlanes = null;
    add(tief, m2);
  }

  // --- Hecke an der Rückseite, Säulenbäume ---------------------------------
  const laub = laubTex();
  const heckeMat = belebe(new THREE.MeshStandardMaterial({ color: 0xd2dcc0, map: laub, bumpMap: laub, bumpScale: 2.5, roughness: 0.95 }), { skala: 0.9, staerke: 0.28, warm: 0.15, boden: [[RASEN_Y, RASEN_Y + 0.7], 0.45] });
  const hz = z0 - rand - 1.4;
  const heckeL = Math.min(x1 - x0 + rand * 2 + 6, 40);
  // Hecke: gerundeter Block mit Laubbuckeln (Auslenkung entlang der Normalen, Nähte verschweißt)
  let hecke = new RoundedBoxGeometry(heckeL, 1.7, 0.9, 8, 0.35);
  {
    hecke.deleteAttribute("uv");
    const p = hecke.attributes.position;
    const nrm = hecke.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const k = 0.05 * Math.sin(x * 3.1 + z * 1.7 + 0.4) * Math.sin(y * 2.7 + x * 1.3) + 0.03 * Math.sin(x * 7.3 - y * 5.1 + z * 2.2) + 0.02 * Math.sin(y * 11.0 + x * 4.7);
      p.setXYZ(i, x + nrm.getX(i) * k, y + nrm.getY(i) * k * (y < -0.6 ? 0.2 : 1), z + nrm.getZ(i) * k);
    }
    hecke.deleteAttribute("normal");
    hecke = mergeVertices(hecke, 1e-4);
    hecke.computeVertexNormals();
    const q = hecke.attributes.position;
    const uvA = new Float32Array(q.count * 2);
    for (let i = 0; i < q.count; i++) {
      uvA[i * 2] = (q.getX(i) + q.getZ(i)) / 1.6;
      uvA[i * 2 + 1] = q.getY(i) / 1.6;
    }
    hecke.setAttribute("uv", new THREE.BufferAttribute(uvA, 2));
  }
  hecke.translate((x0 + x1) / 2 - 1, RASEN_Y + 0.85, hz);
  add(hecke, heckeMat);
  // Kontaktschatten unter der Hecke (QM R2 P2-4.4): breiter Halbschatten plus schmaler Kernschatten
  const heckeFuss = roundRect((x0 + x1) / 2 - 1 - heckeL / 2, hz - 0.45, (x0 + x1) / 2 - 1 + heckeL / 2, hz + 0.45, 0.3);
  const aoHecke = aoBand(heckeFuss, 1.1, RASEN_Y + 0.003, 0.5, offsetOutline);
  const aoHecke2 = aoBand(heckeFuss, 0.25, RASEN_Y + 0.004, 0.45, offsetOutline);
  group.add(aoHecke2);
  disposables.push(aoHecke2.geometry, aoHecke2.material);
  group.add(aoHecke);
  disposables.push(aoHecke.geometry, aoHecke.material);

  // Säulenbäume (Profil per Lathe), links hinten
  // Laubbüschel als radiale Auslenkung (QM R2 P2-4: kein glatter Zylinder mehr)
  const profil = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    profil.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.72 * (1 - t * 0.4) + 0.001, t * 6.5));
  }
  const baumGeo = new THREE.LatheGeometry(profil, 22);
  {
    const p = baumGeo.attributes.position;
    const uv = baumGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const y = p.getY(i);
      const a = Math.atan2(z, x);
      // ganzzahlige Frequenzen im Winkel: nahtlos an der Lathe-Naht
      const k = 1 + 0.16 * Math.sin(a * 5 + y * 2.3) * Math.sin(y * 3.1 + 1.3) + 0.09 * Math.sin(a * 9 - y * 4.7) + 0.05 * Math.sin(y * 11 + a * 3);
      p.setXYZ(i, x * k, y, z * k);
      uv.setXY(i, a * 0.8, y / 1.4);
    }
    baumGeo.computeVertexNormals();
  }
  const baumMat = belebe(new THREE.MeshStandardMaterial({ color: 0xb9c9a6, map: laub, bumpMap: laub, bumpScale: 2.5, roughness: 0.95 }), { skala: 1.4, staerke: 0.3, warm: 0.1, boden: [[RASEN_Y, RASEN_Y + 1.6], 0.55] });
  disposables.push(baumGeo, baumMat);
  const baeume = [
    [x0 - rand - 1.2, hz - 1.4, 1.0],
    [x0 - rand + 0.4, hz - 1.7, 0.85],
    [x0 - rand - 2.6, hz + 1.6, 1.1],
    [x1 + rand + 2.2, hz - 1.2, 0.95],
  ];
  for (const [x, z, s] of baeume) {
    const m = new THREE.Mesh(baumGeo, baumMat);
    m.position.set(x, RASEN_Y, z);
    m.scale.set(s, s, s);
    group.add(m);
  }

  // --- Möblierung (Maßstab, Wohnlichkeit): zwei Liegen, Pflanzkübel mit Buchskugeln ------
  if (szene === "pool") {
    const alu = new THREE.MeshStandardMaterial({ color: 0x3b3d40, metalness: 0.6, roughness: 0.38 });
    const stoff = new THREE.MeshStandardMaterial({ color: 0xe9e3d7, roughness: 0.96 });
    const beton = belebe(new THREE.MeshStandardMaterial({ color: 0x8d8880, roughness: 0.9 }), { skala: 2.5, staerke: 0.12, warm: 0.05 });
    disposables.push(alu, stoff, beton);
    const box = (w, h, d, mat, x, y, z, rx = 0) => {
      const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.35);
      const m = add(g, mat);
      m.position.set(x, y, z);
      m.rotation.x = rx;
      return m;
    };
    // Liegen auf dem Terrassenstreifen zwischen Becken und Hecke, Kopfteil zur Hecke
    const zl = z0 - rand / 2 - 0.02;
    const lx = [(x0 + x1) / 2 + 0.2, (x0 + x1) / 2 + 1.25];
    for (const x of lx) {
      box(0.68, 0.05, 1.9, alu, x, 0.27, zl);
      for (const [dx, dz] of [[-0.3, -0.85], [0.3, -0.85], [-0.3, 0.85], [0.3, 0.85]]) box(0.05, 0.27, 0.05, alu, x + dx, 0.135, zl + dz);
      box(0.64, 0.08, 1.28, stoff, x, 0.335, zl + 0.28);
      box(0.64, 0.08, 0.66, stoff, x, 0.5, zl - 0.6, -0.62);
    }
    // Kübel mit Buchskugel an den hinteren Ecken
    const kugel = new THREE.IcosahedronGeometry(0.42, 4);
    {
      const p = kugel.attributes.position;
      const uv = kugel.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const k = 1 + 0.07 * Math.sin(x * 17 + y * 5) * Math.sin(z * 13 - y * 7) + 0.04 * Math.sin(x * 31 - z * 23 + y * 11);
        p.setXYZ(i, x * k, y * k, z * k);
        uv.setXY(i, (Math.atan2(z, x) / Math.PI) * 1.2, y * 1.6);
      }
      kugel.computeVertexNormals();
    }
    const buchs = belebe(new THREE.MeshStandardMaterial({ color: 0xc4d3ae, map: laub, bumpMap: laub, bumpScale: 2, roughness: 0.95 }), { skala: 3, staerke: 0.2, warm: 0.08, boden: [[0.1, 0.9], 0.6] });
    disposables.push(kugel, buchs);
    const kuebel = [[x0 - 1.0, z0 - 1.15]];
    if (!infinity) kuebel.push([x1 + 1.1, z0 - 1.15]);
    for (const [x, z] of kuebel) {
      box(0.62, 0.62, 0.62, beton, x, 0.31, z);
      const m = new THREE.Mesh(kugel, buchs);
      m.position.set(x, 0.62 + 0.36, z);
      group.add(m);
    }
  }

  // --- Gartenlicht: Poller vor der Hecke, Lichtkegel auf Rasen und Hecke (abends/nachts) --
  {
    const poller = new THREE.MeshStandardMaterial({ color: 0x2f3134, metalness: 0.5, roughness: 0.45 });
    const pollerGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.55, 16);
    disposables.push(poller, pollerGeo);
    const licht = new THREE.Group();
    licht.name = "ezk-gartenlicht";
    licht.visible = false;
    group.add(licht);
    const warm = new THREE.Color(1.0, 0.72, 0.42);
    const kopf = new THREE.MeshBasicMaterial({ color: warm.clone().multiplyScalar(5) });
    const kopfGeo = new THREE.CylinderGeometry(0.047, 0.047, 0.05, 16);
    const fleckMat = new THREE.MeshBasicMaterial({ map: hofTex(), color: warm.clone().multiplyScalar(0.55), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const fleckGeo = new THREE.PlaneGeometry(2.6, 2.6);
    fleckGeo.rotateX(-Math.PI / 2);
    const wandGeo = new THREE.PlaneGeometry(1.6, 2.2);
    disposables.push(kopf, kopfGeo, fleckMat, fleckGeo, wandGeo);
    const anzahl = Math.max(3, Math.round(heckeL / 4.5));
    for (let i = 0; i < anzahl; i++) {
      const x = (x0 + x1) / 2 - 1 - heckeL / 2 + ((i + 0.5) / anzahl) * heckeL;
      const z = hz + 0.85;
      const m = new THREE.Mesh(pollerGeo, poller);
      m.position.set(x, RASEN_Y + 0.275, z);
      group.add(m);
      const k = new THREE.Mesh(kopfGeo, kopf);
      k.position.set(x, RASEN_Y + 0.53, z);
      const f = new THREE.Mesh(fleckGeo, fleckMat);
      f.position.set(x, RASEN_Y + 0.01, z - 0.1);
      f.renderOrder = 2;
      const w = new THREE.Mesh(wandGeo, fleckMat);
      w.position.set(x, RASEN_Y + 0.75, hz + 0.47);
      w.renderOrder = 2;
      licht.add(k, f, w);
    }
  }

  // --- See und Berge (in +x-Richtung, hinter der tiefen Seite) ---------------
  const seeGeo = new THREE.PlaneGeometry(260, 520);
  seeGeo.rotateX(-Math.PI / 2);
  seeGeo.translate(ufer + 130, -0.9, 0);
  add(seeGeo, seeMaterial(sky), { renderOrder: -0.5 });
  // Uferböschung zwischen Rasen (bzw. tieferem Gelände) und See
  {
    const yR = infinity ? -1.1 : RASEN_Y;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([ufer, yR, -260, ufer, yR, 260, ufer + 2.5, -1.0, 260, ufer + 2.5, -1.0, -260], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    add(g, new THREE.MeshStandardMaterial({ color: 0x55603f, roughness: 1, side: THREE.DoubleSide }));
  }

  // Uniforms des Himmels werden geteilt (Tageszeit wirkt sofort), daher je Kette ein eigenes Material
  // drei gestaffelte Schichten über dem See, nach hinten zunehmend blass (QM R2 P2-4.2)
  add(bergkette({ radius: 262, hoehe: 34, von: -1.3, bis: 1.3, seed: 5 }), bergMaterial(sky, { dunst: 0.62, schnee: 1 }), { renderOrder: -0.9 });
  add(bergkette({ radius: 222, hoehe: 19, von: -1.05, bis: 1.15, seed: 23 }), bergMaterial(sky, { dunst: 0.42, schnee: 0.35 }), { renderOrder: -0.85 });
  add(bergkette({ radius: 178, hoehe: 7.5, von: -0.85, bis: 0.75, seed: 31 }), bergMaterial(sky, { dunst: 0.2, schnee: 0 }), { renderOrder: -0.8 });
  add(bergkette({ radius: 200, hoehe: 11, von: 0.9, bis: 2.4, seed: 9 }), bergMaterial(sky, { dunst: 0.35, schnee: 0 }), { renderOrder: -0.7 });
  add(bergkette({ radius: 200, hoehe: 9, von: -2.4, bis: -0.8, seed: 13 }), bergMaterial(sky, { dunst: 0.35, schnee: 0 }), { renderOrder: -0.7 });
  add(bergkette({ radius: 210, hoehe: 8, von: 2.3, bis: 4.0, seed: 17 }), bergMaterial(sky, { dunst: 0.4, schnee: 0 }), { renderOrder: -0.7 });
  // Blick der Übersicht (zur flachen Seite, −x): zwei weitere, blassere Staffeln
  add(bergkette({ radius: 258, hoehe: 24, von: 2.0, bis: 4.3, seed: 41 }), bergMaterial(sky, { dunst: 0.6, schnee: 0.8 }), { renderOrder: -0.9 });
  add(bergkette({ radius: 232, hoehe: 14, von: 2.15, bis: 4.15, seed: 47 }), bergMaterial(sky, { dunst: 0.46, schnee: 0.2 }), { renderOrder: -0.85 });
  for (const m of group.children) if (m.material?.isShaderMaterial) m.frustumCulled = false;

  return {
    group,
    dispose: () => disposables.forEach((x) => x?.dispose?.()),
  };
}

// ===========================================================================
// Wasser, Kaustik, Bildaufbau (Grafik-Runde „massiv besser“)
//
// - Wellen: nahtlose Steigungs-Textur aus Sinuswellen mit ganzzahligen Wellenvektoren
//   (einmal je Sitzung, ~20 ms), drei Lagen in verschiedenen Richtungen und Maßstäben.
// - Kaustik: echte Lichtbündelung – Photonen durch ein periodisches Höhenfeld gebrochen
//   und auf den Boden gesammelt (CPU, einmal), im Shader zwei bewegte Lagen, entlang der
//   gebrochenen Sonnenrichtung auf Boden und Wände projiziert. Mittelwert 1: Die Kaustik
//   verteilt das direkte Sonnenlicht nur um, die mittlere Steinfarbe bleibt (Farbtreue).
// - Wasser: Brechung (Bildschirmraum, mit Tiefenprüfung), Fresnel-Spiegelung der
//   Umgebungs-Aufnahme, Sonnenglanz (GGX, HDR → leichter Bloom nur in Stufe „hoch“),
//   heller Saum an der Kontaktlinie, Snellsches Fenster und Totalreflexion von unten.
// - Bildaufbau: HDR-Puffer (MSAA) → Tiefe, Opak, Kaustik (multiplikativ), Kopie,
//   Wasser, Bloom, Ausgabe (Tone-Mapping Neutral, sRGB). Ohne Float-Puffer: alter Weg.

const TAU = Math.PI * 2;

/** Wellenvektoren (ganzzahlig → nahtlos auf der Kachel). */
function wellenSatz(seed, anzahl, kMin, kMax, windStreu, exp) {
  const r = rng(seed);
  const w = [];
  while (w.length < anzahl) {
    const a = (r() - 0.5) * windStreu;
    const k = kMin * Math.pow(kMax / kMin, r());
    const kx = Math.round(Math.cos(a) * k);
    const ky = Math.round(Math.sin(a) * k);
    if (kx === 0 && ky === 0) continue;
    const kl = Math.hypot(kx, ky);
    w.push({ kx, ky, amp: Math.pow(kl, -exp) * (0.55 + 0.9 * r()), ph: r() * TAU });
  }
  return w;
}

/** Gradient (∂h/∂x, ∂h/∂y) und Divergenz des Höhenfelds auf n×n (Texel-Einheiten). */
function gradientFeld(n, wellen) {
  const gx = new Float32Array(n * n);
  const gy = new Float32Array(n * n);
  const dv = new Float32Array(n * n);
  for (const { kx, ky, amp, ph } of wellen) {
    const fx2 = (TAU * kx) / n;
    const fy2 = (TAU * ky) / n;
    const ax = amp * fx2;
    const ay = amp * fy2;
    const ad = -amp * (fx2 * fx2 + fy2 * fy2);
    for (let y = 0; y < n; y++) {
      const by = fy2 * y + ph;
      let o = y * n;
      for (let x = 0; x < n; x++, o++) {
        const s = fx2 * x + by;
        const c = Math.cos(s);
        gx[o] += ax * c;
        gy[o] += ay * c;
        dv[o] += ad * Math.sin(s);
      }
    }
  }
  return { gx, gy, dv };
}

function dataTex(data, n, { mip = true, aniso = 4 } = {}) {
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.generateMipmaps = mip;
  t.anisotropy = aniso;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Wellen-Steigungen (rg = ∂h/∂x, ∂h/∂y, normiert auf ±1), nahtlos, 256². */
export function wellenTex() {
  if (TEX.wellen || typeof document === "undefined") return TEX.wellen || null;
  const n = 256;
  // Wind etwa entlang x, Spektrum ~ k^-1.6 (lange Wellen stärker), dazu feine Kräuselung
  const w = [...wellenSatz(101, 26, 2, 22, 2.2, 1.6), ...wellenSatz(131, 14, 18, 60, TAU, 1.3)];
  const { gx, gy } = gradientFeld(n, w);
  let m = 1e-6;
  for (let i = 0; i < gx.length; i++) m = Math.max(m, Math.abs(gx[i]), Math.abs(gy[i]));
  const d = new Uint8Array(n * n * 4);
  for (let i = 0; i < gx.length; i++) {
    d[i * 4] = Math.round((gx[i] / m) * 127.5 + 127.5);
    d[i * 4 + 1] = Math.round((gy[i] / m) * 127.5 + 127.5);
    d[i * 4 + 2] = 128;
    d[i * 4 + 3] = 255;
  }
  TEX.wellen = dataTex(d, n, { aniso: 8 });
  return TEX.wellen;
}

/**
 * Kaustik-Textur (Intensität / 5, Mittel 1 → Byte ≈ 51), nahtlos, 256². Photonen auf einem
 * 512²-Gitter werden um G·∇h versetzt und bilinear gesammelt; G so, dass die Bündelung
 * Brennlinien (Netz) bildet, aber nicht in Rauschen zerfällt.
 * @returns {{tex:THREE.DataTexture, norm:number}|null} norm = 1/E[√I]² für die Produkt-Mischung
 */
export function kaustikTex() {
  if (TEX.kaustik || typeof document === "undefined") return TEX.kaustik || null;
  const n = 256;
  const { gx, gy, dv } = gradientFeld(n, wellenSatz(57, 22, 3, 12, TAU, 1.7));
  let ss = 0;
  for (let i = 0; i < dv.length; i++) ss += dv[i] * dv[i];
  const G = 0.62 / Math.sqrt(ss / dv.length);
  const acc = new Float32Array(n * n);
  const M = n * 2;
  const at = (arr, x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i00 = (y0 & (n - 1)) * n + (x0 & (n - 1));
    const i10 = (y0 & (n - 1)) * n + ((x0 + 1) & (n - 1));
    const i01 = ((y0 + 1) & (n - 1)) * n + (x0 & (n - 1));
    const i11 = ((y0 + 1) & (n - 1)) * n + ((x0 + 1) & (n - 1));
    return (arr[i00] * (1 - fx) + arr[i10] * fx) * (1 - fy) + (arr[i01] * (1 - fx) + arr[i11] * fx) * fy;
  };
  for (let j = 0; j < M; j++)
    for (let i = 0; i < M; i++) {
      const x = (i + 0.5) / 2;
      const y = (j + 0.5) / 2;
      const px = x + G * at(gx, x, y) - 0.5;
      const py = y + G * at(gy, x, y) - 0.5;
      const x0 = Math.floor(px);
      const y0 = Math.floor(py);
      const fx = px - x0;
      const fy = py - y0;
      const xa = ((x0 % n) + n) % n;
      const ya = ((y0 % n) + n) % n;
      const xb = (xa + 1) % n;
      const yb = (ya + 1) % n;
      acc[ya * n + xa] += (1 - fx) * (1 - fy);
      acc[ya * n + xb] += fx * (1 - fy);
      acc[yb * n + xa] += (1 - fx) * fy;
      acc[yb * n + xb] += fx * fy;
    }
  // leicht weichzeichnen (1-2-1), Mittel auf 1
  const tmp = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) tmp[y * n + x] = acc[y * n + ((x + n - 1) % n)] + 2 * acc[y * n + x] + acc[y * n + ((x + 1) % n)];
  let sum = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const v = tmp[((y + n - 1) % n) * n + x] + 2 * tmp[y * n + x] + tmp[((y + 1) % n) * n + x];
      acc[y * n + x] = v;
      sum += v;
    }
  const mean = sum / (n * n);
  const d = new Uint8Array(n * n * 4);
  let sq = 0;
  for (let i = 0; i < n * n; i++) {
    const I = Math.min(5, acc[i] / mean);
    const b = Math.round((I / 5) * 255);
    sq += Math.sqrt(b / 51);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = b;
    d[i * 4 + 3] = 255;
  }
  const es = sq / (n * n);
  TEX.kaustik = { tex: dataTex(d, n, { aniso: 8 }), norm: 1 / (es * es) };
  return TEX.kaustik;
}

/**
 * Kaustik als zweiter Durchgang über den Mosaikflächen unter Wasser: multipliziert das
 * fertige (HDR-)Bild mit 1 + (I − 1)·k, k = Anteil des direkten Sonnenlichts. Mittel 1.
 */
export function createKaustikMaterial() {
  const k = kaustikTex();
  return new THREE.ShaderMaterial({
    uniforms: {
      uKTex: { value: k?.tex || null },
      uNorm: { value: k?.norm || 1 },
      uTime: { value: 0 },
      uWaterY: { value: -0.15 },
      uSunDir: { value: new THREE.Vector3(0.3, 1, 0.2).normalize() },
      uAmt: { value: 1 },
      uSunE: { value: 2.3 },
      uAmbE: { value: 1 },
      uChroma: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      varying vec3 vN;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uKTex;
      uniform float uNorm;
      uniform float uTime;
      uniform float uWaterY;
      uniform vec3 uSunDir;
      uniform float uAmt;
      uniform float uSunE;
      uniform float uAmbE;
      uniform float uChroma;
      varying vec3 vW;
      varying vec3 vN;
      float kl(vec2 p, float b) { return texture2D(uKTex, p, b).r * 5.0; }
      float kaustik(vec2 p, float b) {
        vec2 a = p * 0.78 + vec2(uTime * 0.034, uTime * 0.02);
        vec2 c = mat2(0.8, -0.6, 0.6, 0.8) * p * 0.97 + vec2(-uTime * 0.026, uTime * 0.031) + 0.37;
        return sqrt(kl(a, b) * kl(c, b)) * uNorm;
      }
      void main() {
        float depth = uWaterY - vW.y;
        if (depth < 0.003) discard;
        vec3 L = normalize(uSunDir);
        vec3 Lr = refract(-L, vec3(0.0, 1.0, 0.0), 0.7519);
        vec2 p = vW.xz + Lr.xz * depth / min(Lr.y, -0.05);
        float ndl = max(dot(normalize(vN), -Lr), 0.0);
        float direkt = ndl * uSunE / (ndl * uSunE + uAmbE + 1e-4);
        float k = uAmt * direkt * smoothstep(0.0, 0.25, depth) * mix(0.65, 1.0, abs(vN.y));
        if (k < 0.002) discard;
        float b = clamp(depth * 0.8 - 0.2, 0.0, 2.5);
        vec2 dc = Lr.xz * (0.002 + 0.0045 * depth) * uChroma;
        vec3 c = vec3(kaustik(p - dc, b), kaustik(p, b), kaustik(p + dc, b));
        gl_FragColor = vec4(max(vec3(1.0) + (c - 1.0) * k, vec3(0.0)), 1.0);
      }`,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor,
    blendDst: THREE.ZeroFactor,
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessEqualDepth,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -4,
    toneMapped: false,
  });
}

/**
 * Wasseroberfläche (ersetzt createWaterMaterial; gleiche Uniform-Namen für Stage3D).
 * uRefrOn = 1: deckend mit Brechung aus uRefr/uDepth (Bildaufbau unten), sonst
 * durchscheinend wie bisher (Rückfall ohne Float-Puffer).
 */
export function createWasserMaterial(skyUniforms) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...skyUniforms,
      uTime: { value: 0 },
      uWave: { value: 1 },
      uTint: { value: new THREE.Color(0.02, 0.12, 0.15) },
      uLed: { value: new THREE.Color(0, 0, 0) },
      uSpec: { value: 1 },
      uEnv: { value: null },
      uEnvOn: { value: 0 },
      uNTex: { value: wellenTex() },
      uRefr: { value: null },
      uDepth: { value: null },
      uRefrOn: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.05 },
      uFar: { value: 800 },
      uGlanz: { value: 1 },
      uChroma: { value: 1 },
      uProj: { value: new THREE.Matrix4() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      varying float vZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w;
        vZ = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      #include <packing>
      ${SKY_GLSL}
      uniform float uTime;
      uniform float uWave;
      uniform vec3 uTint;
      uniform vec3 uLed;
      uniform float uSpec;
      uniform samplerCube uEnv;
      uniform float uEnvOn;
      uniform sampler2D uNTex;
      uniform sampler2D uRefr;
      uniform sampler2D uDepth;
      uniform float uRefrOn;
      uniform vec2 uRes;
      uniform float uNear;
      uniform float uFar;
      uniform float uGlanz;
      uniform float uChroma;
      uniform mat4 uProj;
      varying vec3 vW;
      varying float vZ;
      vec2 rot(vec2 p, float a) { float c = cos(a); float s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
      vec2 nt(vec2 p) { return texture2D(uNTex, p).rg * 2.0 - 1.0; }
      vec2 steigung(vec2 p, float fern) {
        vec2 s = nt(p * 0.21 + uTime * vec2(0.016, 0.009));
        s += rot(nt(rot(p, 1.1) * 0.53 + uTime * vec2(-0.027, 0.021) + 0.37), -1.1) * 0.55;
        s += rot(nt(rot(p, 2.4) * 1.45 + uTime * vec2(0.045, -0.041) + 0.71), -2.4) * 0.32 * (1.0 - fern * 0.7);
        // lange Dünung
        s += vec2(0.9, 0.35) * cos(dot(p, vec2(0.9, 0.35)) * 1.6 + uTime * 1.25) * 0.22;
        s += vec2(-0.3, 0.8) * cos(dot(p, vec2(-0.3, 0.8)) * 2.1 + uTime * 1.05 + 1.3) * 0.16;
        return s;
      }
      float sceneZ(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(uDepth, uv).r, uNear, uFar); }
      vec3 umgebung(vec3 R) { return uEnvOn > 0.5 ? textureCube(uEnv, R).rgb : skyColor(R); }
      void main() {
        vec3 toCam = cameraPosition - vW;
        float dist = length(toCam);
        vec3 V = toCam / dist;
        float fern = smoothstep(5.0, 28.0, dist);
        float flach = smoothstep(0.02, 0.35, abs(V.y));
        float amp = 0.055 * uWave * mix(0.3, 1.0, flach) * mix(1.0, 0.5, fern);
        vec2 s = steigung(vW.xz, fern) * amp;
        vec3 n = normalize(vec3(-s.x, 1.0, -s.y));
        bool below = cameraPosition.y < vW.y;
        vec2 suv = gl_FragCoord.xy / uRes;
        vec3 L = normalize(uSunDirS);
        vec3 col;
        float alpha = 1.0;
        if (!below) {
          float cosT = clamp(dot(n, V), 0.0, 1.0);
          float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
          vec3 R = reflect(-V, n);
          R = normalize(vec3(R.x, max(R.y, 0.03), R.z));
          vec3 refl = umgebung(R);
          // nach unten auf die Himmelsfarbe am Horizont klammern: keine fast schwarzen Flecken
          vec3 hz = skyColor(normalize(vec3(R.x, 0.06, R.z)));
          float lr = dot(refl, vec3(0.2126, 0.7152, 0.0722));
          float lh = dot(hz, vec3(0.2126, 0.7152, 0.0722));
          refl = mix(refl, hz, (1.0 - smoothstep(lh * 0.35, lh * 0.7, lr)) * 0.85);
          // Sonnenglanz (GGX), Rauheit wächst mit der Entfernung (gegen Flimmern)
          vec3 H = normalize(L + V);
          float a = mix(0.045, 0.14, fern);
          float a2 = a * a;
          float nh = max(dot(n, H), 0.0);
          float dd = nh * nh * (a2 - 1.0) + 1.0;
          float D = a2 / (3.14159 * dd * dd);
          float Fs = 0.02 + 0.98 * pow(1.0 - max(dot(H, V), 0.0), 5.0);
          float spec = min(D * Fs * max(dot(n, L), 0.0) / max(4.0 * cosT, 0.15), 24.0) * uSpec * uGlanz;
          vec3 glanz = mix(uSunColorS, vec3(1.0), 0.35) * spec * 2.2;
          if (uRefrOn > 0.5) {
            float z0 = sceneZ(suv);
            float dicke = max(z0 - vZ, 0.0);
            vec3 nv = (viewMatrix * vec4(n.x, 0.0, n.z, 0.0)).xyz;
            vec2 off = nv.xy * 0.2 * clamp(dicke, 0.0, 1.0) / max(vZ * 0.25, 1.0);
            vec2 uv2 = suv + off;
            float z2 = sceneZ(uv2);
            if (z2 < vZ) uv2 = suv;
            else dicke = z2 - vZ;
            vec2 dc = off * 0.07 * uChroma;
            vec3 unter = vec3(texture2D(uRefr, uv2 - dc).r, texture2D(uRefr, uv2).g, texture2D(uRefr, uv2 + dc).b);
            // Kontaktlinie: dünne Wasserschicht vor Wand/Stufe → heller Meniskus-Saum
            float saum = (1.0 - smoothstep(0.003, 0.035, dicke)) * flach;
            unter = mix(unter, unter * 1.08 + refl * 0.22, saum * 0.7);
            // Unterwasser-Scheinwerfer: Streulicht im Wasserkörper
            unter += uLed * (0.25 + 0.75 * smoothstep(0.0, 1.2, dicke)) * 0.22;
            col = mix(unter, refl, F) + glanz;
          } else {
            col = refl + glanz;
            alpha = clamp(F * 1.25 + 0.05 + spec * 0.6, 0.0, 1.0);
            col = mix(col, uTint, 0.06);
          }
        } else {
          vec3 nb = -n;
          float cosI = clamp(dot(nb, V), 0.0, 1.0);
          vec3 T = refract(-V, nb, 1.333);
          vec3 tief = uTint * 2.0 + uLed * 0.25;
          vec3 durch = uRefrOn > 0.5 ? texture2D(uRefr, suv + nb.xz * 0.04).rgb : umgebung(T);
          if (dot(T, T) < 1e-5) {
            // Totalreflexion außerhalb des Snellschen Fensters: das Becken spiegelt sich
            // (Bildschirmraum-Spiegelung aus dem Opak-Bild, Rückfall Wasserton)
            col = tief * 0.9;
            if (uRefrOn > 0.5) {
              vec3 Rr = reflect(-V, nb);
              vec4 cp = uProj * viewMatrix * vec4(vW + Rr * clamp(dist * 0.6, 0.6, 4.0), 1.0);
              vec2 ruv = cp.xy / cp.w * 0.5 + 0.5;
              float drin = step(0.0, cp.w) * (1.0 - smoothstep(0.85, 1.0, max(abs(ruv.x * 2.0 - 1.0), abs(ruv.y * 2.0 - 1.0))));
              vec3 spiegel = texture2D(uRefr, clamp(ruv, 0.001, 0.999)).rgb;
              col = mix(col, spiegel * 0.85 + tief * 0.15, drin * 0.8);
            }
            alpha = uRefrOn > 0.5 ? 1.0 : 0.9;
          } else {
            float ct = abs(dot(T, nb));
            float F = 0.02 + 0.98 * pow(1.0 - ct, 5.0);
            float rand = smoothstep(0.0, 0.25, cosI - 0.66);
            col = mix(tief, durch, (1.0 - F) * mix(0.55, 1.0, rand));
            alpha = uRefrOn > 0.5 ? 1.0 : mix(0.35, 0.9, F);
          }
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Weicher radialer Lichthof (Sprite-Textur). */
function hofTex() {
  return canvasTex("hof", 128, (ctx, n) => {
    const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.55)");
    g.addColorStop(0.5, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, n, n);
  });
}

/**
 * Unterwasser-Scheinwerfer: Edelstahlring, leuchtende Linse (HDR) und Lichthof im Wasser.
 * setze({farbe:[r,g,b] linear, staerke, punkte:[{pos, normal}]}).
 */
export function createLedLampen() {
  const group = new THREE.Group();
  group.name = "ezk-led-lampen";
  const linseGeo = new THREE.CircleGeometry(0.07, 28);
  const ringGeo = new THREE.RingGeometry(0.07, 0.105, 28);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 0.9, roughness: 0.22 });
  const linseMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const hofMat = new THREE.SpriteMaterial({ map: hofTex(), color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const teile = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const linse = new THREE.Mesh(linseGeo, linseMat);
    linse.position.z = 0.002;
    ring.position.z = 0.001;
    const hof = new THREE.Sprite(hofMat);
    hof.position.z = 0.05;
    g.add(ring, linse, hof);
    group.add(g);
    return { g, hof };
  });
  const v = new THREE.Vector3();
  return {
    group,
    setze({ farbe, staerke = 1, punkte }) {
      linseMat.color.setRGB(...farbe).multiplyScalar(3 + 9 * staerke);
      hofMat.color.setRGB(...farbe).multiplyScalar(0.25 + 1.1 * staerke);
      teile.forEach((t, i) => {
        const p = punkte[i];
        t.g.visible = !!p;
        if (!p) return;
        t.g.position.set(...p.pos);
        t.g.lookAt(v.set(...p.pos).add(new THREE.Vector3(...p.normal)));
        const s = 0.35 + 0.55 * staerke;
        t.hof.scale.set(s, s, s);
      });
    },
    dispose() {
      linseGeo.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      linseMat.dispose();
      hofMat.dispose();
    },
  };
}

/** Naturstein ohne Fugen (Beckenkopf): feine Körnung, Adern, leichte Wolken; Albedo um 1. */
function steinTex() {
  return canvasTex("stein", 512, (ctx, n) => {
    const img = ctx.createImageData(n, n);
    const r = rng(83);
    // nahtloses Rauschen über ein periodisches Gitter
    const G = 16;
    const gitter = Array.from({ length: G * G }, () => r());
    const vn = (x, y, f) => {
      const gx = (x / n) * f;
      const gy = (y / n) * f;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = gx - x0;
      const ty = gy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = (i, j) => gitter[(((j % f) + f) % f) * G + (((i % f) + f) % f)];
      return (a(x0, y0) * (1 - sx) + a(x0 + 1, y0) * sx) * (1 - sy) + (a(x0, y0 + 1) * (1 - sx) + a(x0 + 1, y0 + 1) * sx) * sy;
    };
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const w = vn(x, y, 4) * 0.55 + vn(x, y, 8) * 0.3 + vn(x, y, 16) * 0.15;
        const ader = Math.pow(1 - Math.abs(Math.sin((x / n) * TAU * 2 + w * 7)), 18) * 0.015;
        const korn = (r() - 0.5) * 0.07 + (r() < 0.012 ? -0.12 : 0);
        const v = 0.93 + (w - 0.5) * 0.12 + korn - ader;
        const o = (y * n + x) * 4;
        img.data[o] = Math.max(0, Math.min(255, 255 * v * 1.0));
        img.data[o + 1] = Math.max(0, Math.min(255, 255 * v * 0.985));
        img.data[o + 2] = Math.max(0, Math.min(255, 255 * v * 0.955));
        img.data[o + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  });
}

/** Beckenkopf als heller, matt geschliffener Naturstein (Material aus buildScene wird ergänzt). */
export function veredleKopfstein(mat) {
  const t = steinTex();
  if (!t) return mat;
  const m = t.clone();
  m.repeat.set(1 / 1.1, 1 / 1.1);
  m.needsUpdate = true;
  mat.map = m;
  mat.roughness = 0.62;
  mat.color.set(0xe2dbcf);
  mat.needsUpdate = true;
  return mat;
}

/** Bloom-Pass nur bei Bedarf (Stufe „hoch“) nachladen. */
async function ladeBloom() {
  const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
  return UnrealBloomPass;
}

/**
 * Bildaufbau für Wasser mit Brechung, Kaustik, Bloom und Tone-Mapping in einem Durchlauf.
 * Liefert null ohne WebGL2-Float-Puffer (dann rendert Stage3D wie bisher direkt).
 * Ebenen: 0 Szene, 1 Wasser, 2 Kaustik-Überlagerung.
 */
export function createBildaufbau(gl) {
  const caps = gl.capabilities;
  const ext = gl.extensions;
  if (!caps.isWebGL2 || !(ext.has("EXT_color_buffer_float") || ext.has("EXT_color_buffer_half_float"))) return null;
  const samples = Math.min(4, caps.maxSamples || 0);
  const rtA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples, depthBuffer: true, stencilBuffer: false });
  const rtRefr = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const depthTex = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  depthTex.minFilter = depthTex.magFilter = THREE.NearestFilter;
  const rtDepth = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, depthTexture: depthTex, depthBuffer: true });
  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false });
  const copyMat = new THREE.MeshBasicMaterial({ depthTest: false, depthWrite: false, toneMapped: false });
  const copyQuad = new FullScreenQuad(copyMat);
  const output = new OutputPass();
  let bloom = null;
  let BloomPass = null;
  let bloomLaden = false;
  const v2 = new THREE.Vector2();
  const groesse = (rt, w, h) => {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
  };

  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {{wasser?:THREE.Mesh|null, wasserMat:THREE.ShaderMaterial, kaustik:boolean, bloom:boolean,
   *          brechung:number, haelften?:Array<{x:number,w:number,vor?:()=>void}>, onBloomBereit?:()=>void}} o
   */
  function render(scene, camera, o) {
    gl.getDrawingBufferSize(v2);
    const W = v2.x;
    const H = v2.y;
    groesse(rtA, W, H);
    const mitWasser = !!(o.wasser && o.wasser.visible);
    const maske = camera.layers.mask;
    const autoClear = gl.autoClear;
    if (o.wasser) o.wasser.layers.set(1);
    // 1) Tiefe (halbe Auflösung) für die Brechungsprüfung
    if (mitWasser) {
      groesse(rtDepth, W / 2, H / 2);
      camera.layers.set(0);
      scene.overrideMaterial = depthMat;
      gl.setRenderTarget(rtDepth);
      gl.clear();
      gl.render(scene, camera);
      scene.overrideMaterial = null;
    }
    // 2) Opak (+ Kaustik) in den HDR-Puffer, ggf. zwei Hälften (Vorher/Nachher)
    const teile = o.haelften?.length ? o.haelften : [{ x: 0, w: 1 }];
    for (const t of teile) {
      t.vor?.();
      const scissor = teile.length > 1;
      rtA.scissorTest = scissor;
      if (scissor) rtA.scissor.set(Math.round(t.x * W), 0, Math.round(t.w * W), H);
      camera.layers.set(0);
      gl.autoClear = true;
      gl.setRenderTarget(rtA);
      gl.render(scene, camera);
      if (o.kaustik && mitWasser) {
        camera.layers.set(2);
        gl.autoClear = false;
        gl.render(scene, camera);
      }
    }
    rtA.scissorTest = false;
    gl.setRenderTarget(rtA);
    // 3) Wasser mit Brechung
    if (mitWasser) {
      const s = Math.max(0.5, Math.min(1, o.brechung || 0.5));
      groesse(rtRefr, W * s, H * s);
      copyMat.map = rtA.texture;
      gl.setRenderTarget(rtRefr);
      copyQuad.render(gl);
      const u = o.wasserMat.uniforms;
      u.uRefr.value = rtRefr.texture;
      u.uDepth.value = depthTex;
      u.uRefrOn.value = 1;
      u.uRes.value.set(W, H);
      u.uNear.value = camera.near;
      u.uFar.value = camera.far;
      u.uProj.value.copy(camera.projectionMatrix);
      camera.layers.set(1);
      gl.autoClear = false;
      gl.setRenderTarget(rtA);
      gl.render(scene, camera);
    }
    gl.autoClear = autoClear;
    camera.layers.mask = maske;
    // 4) Bloom (nur Glanzlichter über der Schwelle), lädt bei Bedarf nach
    if (o.bloom) {
      if (!BloomPass && !bloomLaden) {
        bloomLaden = true;
        ladeBloom().then((P) => {
          BloomPass = P;
          o.onBloomBereit?.();
        });
      }
      if (BloomPass && !bloom) bloom = new BloomPass(new THREE.Vector2(W, H), 0.32, 0.55, 2.2);
      if (bloom) {
        if (bloom.resolution.x !== W || bloom.resolution.y !== H) bloom.setSize(W, H);
        bloom.render(gl, null, rtA, 0, false);
      }
    }
    // 5) Ausgabe: Tone-Mapping + sRGB auf den Bildschirm
    output.renderToScreen = true;
    output.render(gl, null, rtA);
    gl.setRenderTarget(null);
  }

  return {
    render,
    dispose() {
      rtA.dispose();
      rtRefr.dispose();
      rtDepth.dispose();
      depthTex.dispose();
      depthMat.dispose();
      copyMat.dispose();
      copyQuad.dispose();
      output.dispose();
      bloom?.dispose();
    },
  };
}
