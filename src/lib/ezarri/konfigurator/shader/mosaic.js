// src/lib/ezarri/konfigurator/shader/mosaic.js – prozeduraler Mosaik-Shader (Team B).
//
// MeshPhysicalMaterial + onBeforeCompile. Pro Fragment:
//   1. Steinraster aus Welt-UV (Meter) und Format (25/50 Quadrat, Hexa), Fuge 1,1 mm
//   2. Mosaik je Stein: Hash(Zelle) → Mischungs-Eintrag (kumulierte Anteile) bzw.
//      Pattern-Maske bzw. Kanal; zweiter Hash → Steinfarbe aus den gemessenen
//      Farben der Referenz (Flächenanteile); ±3 % Helligkeit je Stein
//   3. Material je Stein: Rauheit aus Glanz, Metall aus Reflexion (Spiegel/Gold),
//      Perlmutt als Iridescence, Nachleuchten (Fosfo) bei Nacht, Zeichnung (Aquarelle,
//      Gea, Zen, Terrazzo, Space) als Wolke der zweiten Farbe
//   4. Glas: Klarschicht (clearcoat) je Stein als Glasoberfläche, gerundete Fase und
//      Kissenwölbung als analytische Normalenstörung in UV, Kippung je Stein/Blatt
//      (Glitzern im Sonnenglanz), Funkeln in der Nahsicht, Mikro-Rauheit; Fuge vertieft
//      und matt. Fugen analytisch über den Pixel-Fußabdruck je Achse gefiltert
//      (anisotrop, kein Moiré, flächentreu); unter ~2 px je Stein Überblendung zum
//      Flächenmittel der gemessenen Farben (Spalte 6 / uAreaMean); Fase, Kippung und
//      Funkeln entfallen in der Ferne (LOD) und gehen als Rauheit in die Deckschicht ein
//   5. Kaustik: zwei animierte Worley-Netze (F2 − F1), projiziert entlang der
//      Sonnenrichtung bis zum Wasserspiegel, abgeschwächt mit der Tiefe
//   6. Wasser: Beer-Lambert auf dem Lichtweg (Wasserspiegel → Stein → Auge) plus
//      Streulicht im Wasserton – flach heller und türkiser, tief satter
//
// Paletten liegen in einer Float-DataTexture (8 Spalten × 10 Zeilen):
//   Zeilen 0–3 Mischung, 4–6 Kanäle, 7–9 Pattern-Kanäle;
//   Spalten 0–5 Farben (rgb linear, a = kumulierter Anteil), Spalte 6 Mittelwert
//   (rgb linear) + Glas-Deckschicht (a), Spalte 7 Material
//   (Rauheit, Metall, Perlmutt, Flags: +1 Zeichnung, +2 Fosfo).
// Nur im Lazy-Chunk der 3D-Bühne (importiert three).
import * as THREE from "three";

export const PAL_COLS = 8;
export const PAL_ROWS = 10;
export const SLOT = Object.freeze({ mix: 0, kanal: 4, pattern: 7 });
export const MAX_LANES = 6;

const srgbToLin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export function hexLin(hex) {
  const h = String(hex || "#888888").replace("#", "");
  const n = Number.parseInt(h.slice(0, 6), 16);
  return [srgbToLin((n >> 16) & 255), srgbToLin((n >> 8) & 255), srgbToLin(n & 255)];
}

/** Gemeinsame Uniforms aller Mosaik-Materialien (ein Objekt, von allen Materialien geteilt). */
export function createMosaicUniforms() {
  const pal = new Float32Array(PAL_COLS * PAL_ROWS * 4);
  const palTex = new THREE.DataTexture(pal, PAL_COLS, PAL_ROWS, THREE.RGBAFormat, THREE.FloatType);
  palTex.minFilter = palTex.magFilter = THREE.NearestFilter;
  palTex.needsUpdate = true;
  const maskTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  maskTex.minFilter = maskTex.magFilter = THREE.NearestFilter;
  maskTex.needsUpdate = true;
  return {
    uPal: { value: palTex },
    uMask: { value: maskTex },
    uMaskSize: { value: new THREE.Vector2(1, 1) },
    uPatternOn: { value: 0 },
    uPitch: { value: 0.0258 },
    uHexa: { value: 0 },
    uGroutHalf: { value: 0.00055 },
    uGrout: { value: new THREE.Color(0.85, 0.85, 0.85) },
    uSeed: { value: 7 },
    uMixCum: { value: new THREE.Vector4(1, 1, 1, 1) },
    uKanalLage: { value: new THREE.Vector3(-1, -1, -1) },
    uKanalBreite: { value: new THREE.Vector3(0.2, 0.2, 0.2) },
    uLanes: { value: new Array(MAX_LANES).fill(0) },
    uLaneN: { value: 0 },
    uLaneX: { value: new THREE.Vector2(-4, 4) },
    uWaterOn: { value: 1 },
    uWaterY: { value: -0.15 },
    uAbsorb: { value: new THREE.Vector3(0.45, 0.07, 0.035) },
    uScatter: { value: new THREE.Vector3(0.03, 0.16, 0.2) },
    uAmbientLum: { value: 1 },
    uTime: { value: 0 },
    uCaustic: { value: 1 },
    uSunDir: { value: new THREE.Vector3(0.3, 1, 0.2).normalize() },
    uSunColor: { value: new THREE.Color(1, 0.97, 0.9) },
    uNight: { value: 0 },
    uDetail: { value: 1 },
    // flächengewichteter Mittelwert der Mischung (linear) – Fern-LOD ohne Farbrauschen
    uAreaMean: { value: new THREE.Vector3(0.35, 0.45, 0.5) },
  };
}

/** Glas-Deckschicht je Finish: Stärke der Klarschicht (Glasoberfläche über dem Farbkörper). */
const COAT = Object.freeze({ glanz: 1, perlmutt: 1, leucht: 0.9, satin: 0.7, spiegel: 0.5, matt: 0.35 });

/**
 * Flächengewichteter Mittelwert einer Palette (linear), so wie der Shader die Steine
 * verteilt: höchstens 6 Einträge, der letzte nimmt den Rest auf. Exportiert für Tests.
 * @param {Array<[string, number]>} pal
 * @returns {[number, number, number]}
 */
export function paletteMean(pal) {
  const p = pal?.length ? pal : [["#9fb4b8", 100]];
  const total = p.reduce((s, e) => s + e[1], 0) || 1;
  const top = p.slice(0, 6);
  let acc = 0;
  const out = [0, 0, 0];
  top.forEach(([hex, w], i) => {
    const share = i === top.length - 1 ? 1 - acc : w / total;
    acc += w / total;
    const c = hexLin(hex);
    for (let k = 0; k < 3; k++) out[k] += c[k] * share;
  });
  return out;
}

/**
 * Paletten-Textur und Uniforms aus einem Materialsatz füllen.
 * @param {object} u  createMosaicUniforms()
 * @param {{mix:Array, cum:number[], kanaele:Array, pattern:object|null, fuge:string, format:string, seed:number,
 *          wasserton:object, lanes:number[], laneX:[number,number]}} m  (Stage3D baut ihn aus Zustand + Index)
 */
export function applyMaterialSet(u, m) {
  const tex = u.uPal.value;
  const data = tex.image.data;
  data.fill(0);
  const means = [];
  const writeSlot = (row, ref) => {
    const pal = ref?.pal?.length ? ref.pal : [["#9fb4b8", 100]];
    const total = pal.reduce((s, p) => s + p[1], 0) || 1;
    let acc = 0;
    pal.slice(0, 6).forEach(([hex, w], i) => {
      acc += w / total;
      const [r, g, b] = hexLin(hex);
      const o = (row * PAL_COLS + i) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = i === Math.min(5, pal.length - 1) ? 1.0001 : acc;
    });
    const [glanz = 0.5, reflexion = 0.25, art = "glanz"] = ref?.fin || [];
    // Spalte 6: Mittelwert (rgb, Fern-LOD) und Stärke der Glas-Deckschicht (a)
    const mean = paletteMean(pal);
    const om = (row * PAL_COLS + 6) * 4;
    data[om] = mean[0];
    data[om + 1] = mean[1];
    data[om + 2] = mean[2];
    data[om + 3] = COAT[art] ?? 1;
    means[row] = mean;
    const spiegel = art === "spiegel";
    const rough = Math.min(0.85, Math.max(0.04, 1 - glanz * 0.92));
    // Spiegel/Gold: Metallanteil 0,45 – sonst spiegelt der Stein fast nur die Umgebung
    // (Rasen → oliv) und die gemessene Farbe geht verloren; den Glanz liefert die Deckschicht.
    const metal = spiegel ? 0.45 : Math.min(0.15, reflexion * 0.15);
    const iri = art === "perlmutt" ? 1 : 0;
    const flags = (ref?.gez ? 1 : 0) + (art === "leucht" ? 2 : 0);
    const o = (row * PAL_COLS + 7) * 4;
    data[o] = rough;
    data[o + 1] = metal;
    data[o + 2] = iri;
    data[o + 3] = flags;
  };
  m.mix.slice(0, 4).forEach((ref, i) => writeSlot(SLOT.mix + i, ref));
  const cum = [...m.cum.slice(0, 4)];
  while (cum.length < 4) cum.push(1.0001);
  cum[Math.min(3, m.mix.length - 1)] = 1.0001;
  u.uMixCum.value.set(cum[0], cum[1], cum[2], cum[3]);
  // Mittelwert der Mischung: Zeile i deckt (cum[i] − cum[i−1]) der Steine ab
  const area = [0, 0, 0];
  let prev = 0;
  for (let i = 0; i < Math.min(4, m.mix.length); i++) {
    const share = Math.max(0, Math.min(1, cum[i]) - prev);
    prev = Math.min(1, cum[i]);
    for (let k = 0; k < 3; k++) area[k] += (means[SLOT.mix + i]?.[k] ?? 0) * share;
  }
  if (u.uAreaMean && m.mix.length) u.uAreaMean.value.set(area[0], area[1], area[2]);

  const lage = { bahnen: 0, wasserlinie: 1, stufen: 2 };
  const kl = [-1, -1, -1];
  const kb = [0.2, 0.2, 0.2];
  m.kanaele.slice(0, 3).forEach((k, i) => {
    writeSlot(SLOT.kanal + i, k.ref);
    kl[i] = lage[k.lage] ?? -1;
    kb[i] = (k.breite || 20) / 100;
  });
  u.uKanalLage.value.set(kl[0], kl[1], kl[2]);
  u.uKanalBreite.value.set(kb[0], kb[1], kb[2]);
  const lanes = (m.lanes || []).slice(0, MAX_LANES);
  u.uLaneN.value = lanes.length;
  u.uLanes.value = [...lanes, ...new Array(MAX_LANES - lanes.length).fill(0)];
  if (m.laneX) u.uLaneX.value.set(m.laneX[0], m.laneX[1]);

  if (m.pattern?.maske) {
    m.pattern.refs.slice(0, 3).forEach((ref, i) => writeSlot(SLOT.pattern + i, ref));
    const { w, h, maske } = m.pattern;
    const px = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      px[i * 4] = (Number(maske[i]) || 0) * 80;
      px[i * 4 + 3] = 255;
    }
    const old = u.uMask.value;
    const t = new THREE.DataTexture(px, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    u.uMask.value = t;
    old?.dispose?.();
    u.uMaskSize.value.set(w, h);
    u.uPatternOn.value = 1;
  } else {
    u.uPatternOn.value = 0;
  }
  tex.needsUpdate = true;

  const pitch = { 25: 0.0258, 50: 0.0518, hexa: 0.0345 }[m.format] || 0.0258;
  u.uPitch.value = pitch;
  u.uHexa.value = m.format === "hexa" ? 1 : 0;
  const g = hexLin(m.fuge || "#ededed");
  u.uGrout.value.setRGB(g[0], g[1], g[2]);
  u.uSeed.value = m.seed || 7;
  if (m.wasserton) {
    u.uAbsorb.value.set(...m.wasserton.absorb);
    u.uScatter.value.set(...m.wasserton.scatter);
  }
}

const COMMON = /* glsl */ `
uniform sampler2D uPal;
uniform sampler2D uMask;
uniform vec2 uMaskSize;
uniform float uPatternOn;
uniform float uPitch;
uniform float uHexa;
uniform float uGroutHalf;
uniform vec3 uGrout;
uniform float uSeed;
uniform vec4 uMixCum;
uniform vec3 uKanalLage;
uniform vec3 uKanalBreite;
uniform float uLanes[${MAX_LANES}];
uniform float uLaneN;
uniform vec2 uLaneX;
uniform float uWaterOn;
uniform float uWaterY;
uniform vec3 uAbsorb;
uniform vec3 uScatter;
uniform float uAmbientLum;
uniform float uTime;
uniform float uCaustic;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uNight;
uniform float uDetail;
uniform vec3 uAreaMean;
uniform float uKind;     // 0 Boden, 1 Wand, 2 Stufe oben, 3 Setzstufe/Bankfront, 4 Bank oben, 5 trocken (Bad/Küche/Außenwand)
uniform vec4 uNose;       // Stufenkante: x Art (0 keine, 1 Kreis, 2 Gerade x), yz Mitte, w Radius bzw. x der Kante
uniform float uTopY;      // Oberkante des Bauteils (Stufen, Wände)
varying vec2 vMosaicUv;
varying vec3 vWorldPosM;

float mhash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030) + uSeed * 0.0137);
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}
vec2 mhash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}
float vnoiseM(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 s = f * f * (3.0 - 2.0 * f);
  float a = mhash(i), b = mhash(i + vec2(1.0, 0.0)), c = mhash(i + vec2(0.0, 1.0)), d = mhash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

// Zelle: xy = Zell-ID, z = Abstand zur Steinkante (m), w = 0
vec4 mosaicCell(vec2 uv) {
  if (uHexa < 0.5) {
    vec2 g = uv / uPitch;
    vec2 id = floor(g);
    vec2 f = fract(g);
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * uPitch;
    return vec4(id, e, 0.0);
  }
  float size = uPitch / 1.7320508;
  vec2 p = uv / size;
  float q = 0.57735 * p.x - 0.33333 * p.y;
  float r = 0.66667 * p.y;
  vec3 c = vec3(q, -q - r, r);
  vec3 rc = floor(c + 0.5);
  vec3 d = abs(rc - c);
  if (d.x > d.y && d.x > d.z) rc.x = -rc.y - rc.z;
  else if (d.y > d.z) rc.y = -rc.x - rc.z;
  else rc.z = -rc.x - rc.y;
  vec2 cw = vec2(size * 1.7320508 * (rc.x + rc.z * 0.5), size * 1.5 * rc.z);
  vec2 lp = uv - cw;
  float n = max(abs(lp.x), max(abs(lp.x * 0.5 + lp.y * 0.8660254), abs(-lp.x * 0.5 + lp.y * 0.8660254)));
  return vec4(rc.x, rc.z, uPitch * 0.5 - n, 0.0);
}

// Hexa: Richtung (UV) zur nächsten Steinkante – für die Fase
vec2 hexEdgeDir(vec2 uv, vec2 id) {
  float size = uPitch / 1.7320508;
  vec2 cw = vec2(size * 1.7320508 * (id.x + id.y * 0.5), size * 1.5 * id.y);
  vec2 lp = uv - cw;
  vec3 pr = vec3(lp.x, lp.x * 0.5 + lp.y * 0.8660254, -lp.x * 0.5 + lp.y * 0.8660254);
  vec3 ap = abs(pr);
  if (ap.x >= ap.y && ap.x >= ap.z) return vec2(sign(pr.x), 0.0);
  if (ap.y >= ap.z) return sign(pr.y) * vec2(0.5, 0.8660254);
  return sign(pr.z) * vec2(-0.5, 0.8660254);
}

// Fugenanteil einer Achse, analytisch über die Pixelbreite w (in Steinen) gefiltert:
// Pulsfolge mit Anteil a je Periode, Kasten-Integral → kein Moiré, flächentreu in der Ferne
float groutBox(float x, float a, float w) {
  w = max(w, 1e-4);
  float y0 = x + a * 0.5 - w * 0.5;
  float y1 = y0 + w;
  float b = floor(y0);
  float p0 = min(y0 - b, a);
  float p1 = (floor(y1) - b) * a + min(fract(y1), a);
  return clamp((p1 - p0) / w, 0.0, 1.0);
}

vec4 palAt(float col, float row) { return texelFetch(uPal, ivec2(int(col), int(row)), 0); }

vec3 slotColor(float row, vec2 id, vec2 local, out vec4 mat) {
  mat = palAt(7.0, row);
  float r = mhash(id + vec2(17.0, 3.0));
  vec3 c = palAt(0.0, row).rgb;
  vec3 c2 = palAt(1.0, row).rgb;
  for (int i = 0; i < 6; i++) {
    vec4 p = palAt(float(i), row);
    if (r < p.a) { c = p.rgb; c2 = palAt(float(min(i + 1, 5)), row).rgb; if (palAt(float(min(i + 1, 5)), row).a <= 0.0) c2 = palAt(0.0, row).rgb; break; }
  }
  float flags = mat.w;
  if (mod(flags, 2.0) >= 1.0) {
    float n = vnoiseM(id * 3.0 + local * 2.6);
    c = mix(c, c2, clamp((n - 0.55) * 3.0, 0.0, 1.0));
  }
  // Streuung je Stein (Glasschmelze): Helligkeit ±3,5 %, Farbton je Kanal ±1,2 %,
  // leichter Verlauf im Stein ±2 % – alles mittelwertfrei, die Flächenfarbe bleibt.
  float j = 1.0 + (mhash(id + vec2(-5.0, 41.0)) - 0.5) * 0.07;
  vec3 ch = vec3(mhash(id + vec2(11.0, -7.0)), mhash(id + vec2(-23.0, 5.0)), mhash(id + vec2(3.0, 29.0))) - 0.5;
  vec3 tint = 1.0 + (ch - dot(ch, vec3(0.3333))) * 0.024;
  vec2 gd = mhash2(id + vec2(51.0, 13.0)) - 0.5;
  float grad = 1.0 + dot(local - 0.5, gd) * 0.08;
  return c * (j * grad) * tint;
}

// Worley F2 − F1 für das Kaustik-Netz
float causticLayer(vec2 p, float t) {
  vec2 i = floor(p); vec2 f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = mhash2(i + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return 1.0 - smoothstep(0.0, 0.16, f2 - f1);
}
float caustic(vec3 wp) {
  vec3 sd = normalize(uSunDir);
  vec2 p = wp.xz + sd.xz / max(sd.y, 0.25) * (uWaterY - wp.y);
  float a = causticLayer(p * 1.35, uTime * 0.9);
  float b = causticLayer(p * 1.9 + 7.3, -uTime * 0.7 + 1.7);
  return a * 0.65 + b * 0.45 + a * b * 0.6;
}
`;

/**
 * Mosaik-Material für ein Bauteil.
 * @param {object} shared createMosaicUniforms()
 * @param {{kind:number, nose?:number[], topY?:number, iridescence?:boolean}} opts
 */
export function createMosaicMaterial(shared, { kind = 0, nose = [0, 0, 0, 0], topY = 0, iridescence = true } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1, // Glas-Deckschicht; Stärke und Rauheit je Stein im Shader
    clearcoatRoughness: 0.05,
    iridescence: iridescence ? 1 : 0,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [180, 520],
    side: THREE.FrontSide,
  });
  const own = {
    uKind: { value: kind },
    uNose: { value: new THREE.Vector4(...nose) },
    uTopY: { value: topY },
  };
  mat.userData.own = own;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, own);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 mosaicUv;\nvarying vec2 vMosaicUv;\nvarying vec3 vWorldPosM;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvMosaicUv = mosaicUv;\nvWorldPosM = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${COMMON}`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
  vec4 cell = mosaicCell(vMosaicUv);
  vec2 sid = cell.xy;
  // Pixel-Fußabdruck je Achse (in Steinen) – anisotrop wie ein Mip-/Aniso-Filter
  vec2 gUv = vMosaicUv / uPitch;
  vec2 fwG = max(fwidth(gUv), vec2(1e-6));
  float spp = max(fwG.x, fwG.y);
  float pxPerStone = 1.0 / spp;
  float detail = smoothstep(2.5, 7.0, pxPerStone) * uDetail;
  // Fern-LOD: unter ~2 px je Stein zum Flächenmittel überblenden (kein Farbflimmern)
  float farMix = smoothstep(0.45, 1.1, spp);
  float groutA = 2.0 * uGroutHalf / uPitch;
  float groutMask;
  if (uHexa < 0.5) {
    float gx = groutBox(gUv.x, groutA, fwG.x);
    float gy = groutBox(gUv.y, groutA, fwG.y);
    groutMask = 1.0 - (1.0 - gx) * (1.0 - gy);
  } else {
    float aaw = max(fwidth(cell.z), 1e-5);
    groutMask = 1.0 - smoothstep(uGroutHalf - aaw, uGroutHalf + aaw, cell.z);
    groutMask = mix(2.0 * groutA, groutMask, smoothstep(1.5, 5.0, pxPerStone));
  }

  // Welches Mosaik? Kanal > Pattern > Mischung
  float row = 0.0;
  float r0 = mhash(sid);
  if (r0 >= uMixCum.x) row = 1.0;
  if (r0 >= uMixCum.y) row = 2.0;
  if (r0 >= uMixCum.z) row = 3.0;
  if (uPatternOn > 0.5) {
    vec2 m = mod(sid, uMaskSize);
    float ch = floor(texelFetch(uMask, ivec2(int(m.x), int(uMaskSize.y - 1.0 - m.y)), 0).r * 255.0 / 80.0 + 0.5);
    row = 7.0 + min(ch, 2.0);
  }
  for (int k = 0; k < 3; k++) {
    float lage = uKanalLage[k];
    float bw = uKanalBreite[k];
    bool hit = false;
    if (lage == 0.0 && uKind == 0.0) {
      for (int l = 0; l < ${MAX_LANES}; l++) {
        if (float(l) < uLaneN && abs(vWorldPosM.z - uLanes[l]) < bw * 0.5 && vWorldPosM.x > uLaneX.x && vWorldPosM.x < uLaneX.y) hit = true;
      }
    }
    if (lage == 1.0 && uKind == 1.0 && vWorldPosM.y > uWaterY - bw) hit = true;
    if (lage == 2.0) {
      if (uKind == 3.0 && vWorldPosM.y > uTopY - bw) hit = true;
      if (uKind == 2.0) {
        float dn = 9.0;
        if (uNose.x == 1.0) dn = uNose.w - length(vWorldPosM.xz - uNose.yz);
        if (uNose.x == 2.0) dn = uNose.w - vWorldPosM.x;
        if (dn < bw) hit = true;
      }
    }
    if (hit) row = 4.0 + float(k);
  }
  vec4 smat = palAt(7.0, row);
  vec4 sMean = palAt(6.0, row);
  // Fernfarbe: bei zufälliger Mischung das Flächenmittel aller Zeilen, sonst das der Zeile
  vec3 farCol = (row < 4.0 && uPatternOn < 0.5) ? uAreaMean : sMean.rgb;
  vec2 local = fract(gUv);
  vec3 stone = farCol;
  if (farMix < 0.999) {
    vec4 smatT;
    stone = mix(slotColor(row, sid, local, smatT), farCol, farMix);
  }
  float tileNear = 1.0 - farMix;
  float tileM = 1.0 - groutMask;
  // Fuge vertieft: im Schatten der Steinkanten etwas dunkler, matt – nur wo aufgelöst
  float groutRes = smoothstep(3.0, 10.0, pxPerStone) * uDetail;
  diffuseColor.rgb = mix(stone, uGrout * (1.0 - 0.12 * groutRes), groutMask);
  float isIri = smat.z;
  float mRough = mix(isIri > 0.5 ? min(smat.x, 0.22) : smat.x, 0.92, groutMask);
  float mMetal = mix(smat.y, 0.0, groutMask);
  float mIri = smat.z * tileM;
  float mIriT = mhash(sid + vec2(-31.0, 77.0));
  float mGlow = (mod(floor(smat.w / 2.0), 2.0) >= 1.0 ? 1.0 : 0.0) * tileM;
  // Glas-Deckschicht: scharfer Glanz der Glasoberfläche, darunter der Farbkörper
  // (dessen eigener Glanz wird gedämpft, sonst doppelter Glanz). Rauheit je Stein ±20 %
  // und Mikro-Rauheit (Wasserfilm, Kalk) als ruhiges Rauschen.
  float mCoat = sMean.a * tileM;
  float mBaseSpec = mix(isIri > 0.5 ? 1.8 : mix(1.0, 0.55, sMean.a), 1.0, groutMask);
  float micro = vnoiseM(vMosaicUv * 9.0 + uSeed);
  float mCoatRough = (0.03 + smat.x * smat.x * smat.x * 0.7) * (0.8 + 0.4 * mhash(sid + vec2(61.0, -17.0))) * (0.8 + 0.45 * micro);
  // Fase (Steinkante gerundet, 1,6 mm) und Kippung je Stein/Blatt als Normalenstörung in UV;
  // nur so weit, wie die Fase im Bild aufgelöst ist (Specular-AA: Rest wird Rauheit)
  vec2 mSlope = vec2(0.0);
  vec2 mGlint = vec2(0.0);
  float bevW = 0.0024;
  float fadeB = smoothstep(0.6, 2.2, bevW / (spp * uPitch)) * uDetail;
  if (fadeB > 0.0) {
    if (uHexa < 0.5) {
      vec2 eS = (0.5 - abs(local - 0.5)) * uPitch;
      vec2 tb = clamp((eS - uGroutHalf) / bevW, 0.0, 1.0);
      // gerundete Kante + leicht gewölbte Glasoberfläche (Kissen)
      mSlope = sign(local - 0.5) * (1.0 - tb) * (1.0 - tb) * 1.6 + (local - 0.5) * 0.1;
    } else {
      float tb = clamp((cell.z - uGroutHalf) / bevW, 0.0, 1.0);
      mSlope = hexEdgeDir(vMosaicUv, sid) * ((1.0 - tb) * (1.0 - tb) * 1.6 + (1.0 - cell.z / (uPitch * 0.5)) * 0.05);
    }
    mSlope *= fadeB * tileM;
  }
  mCoatRough += (1.0 - fadeB) * 0.06;
  float tiltOn = tileNear * uDetail * tileM;
  if (tiltOn > 0.0) {
    vec2 th = mhash2(sid * 1.37 + uSeed) - 0.5;
    vec2 sh = mhash2(floor(sid / 12.0) + vec2(91.7, 13.3)) - 0.5;
    mSlope += (th * 0.05 + sh * 0.022) * tiltOn;
    // Funkeln: winzige Facetten in der Glasoberfläche, nur in der Nahsicht
    float fadeG = smoothstep(26.0, 70.0, pxPerStone) * uDetail;
    if (fadeG > 0.0) {
      vec2 sc = gUv * 7.0;
      vec2 sci = floor(sc);
      if (mhash(sci + vec2(3.1, 8.7)) > 0.965) {
        float dg = 1.0 - smoothstep(0.05, 0.42, length(fract(sc) - 0.5));
        mGlint = (mhash2(sci + 5.3) - 0.5) * 0.25 * dg * fadeG * tiltOn;
      }
    }
  }
  // Wasserlinie (QM R2 P2-4.5): über dem Wasser bis unter den Beckenkopf feucht (dunkler,
  // glänzender), an der Linie selbst ein 1–2 Steine breiter dunklerer Rand.
  if (uKind == 1.0 && uWaterOn > 0.5) {
    float yy = vWorldPosM.y - uWaterY;
    float nass = smoothstep(-0.03, 0.0, yy) * (1.0 - smoothstep(uTopY - uWaterY - 0.012, uTopY - uWaterY, yy));
    float linie = 1.0 - smoothstep(0.012, uPitch * 1.6, abs(yy - 0.004));
    diffuseColor.rgb *= 1.0 - 0.16 * nass - 0.2 * linie;
    mRough = mix(mRough, 0.06, nass * 0.6);
  }
`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mRough;")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n  metalnessFactor = mMetal;")
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
  vec3 mCoatN = normal;
  {
    // UV→Sicht-Basis aus Ableitungen (glatte Größen, außerhalb jeder Verzweigung)
    vec3 sp = -vViewPosition;
    vec3 q0 = dFdx(sp); vec3 q1 = dFdy(sp);
    vec2 st0 = dFdx(vMosaicUv); vec2 st1 = dFdy(vMosaicUv);
    vec3 q1p = cross(q1, normal); vec3 q0p = cross(normal, q0);
    vec3 Tm = q1p * st0.x + q0p * st1.x;
    vec3 Bm = q1p * st0.y + q0p * st1.y;
    float dm = max(dot(Tm, Tm), dot(Bm, Bm));
    float sc = dm > 0.0 ? faceDirection * inversesqrt(dm) : 0.0;
    Tm *= sc; Bm *= sc;
    vec3 nb = normalize(normal + Tm * mSlope.x + Bm * mSlope.y);
    mCoatN = normalize(nb + Tm * mGlint.x + Bm * mGlint.y);
    normal = nb;
  }`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
  {
    bool unter = uWaterOn > 0.5 && vWorldPosM.y < uWaterY && uKind < 5.0;
    if (unter && uCaustic > 0.0) {
      float depth = uWaterY - vWorldPosM.y;
      float c = caustic(vWorldPosM) * uCaustic * exp(-depth * 0.55) * max(uSunDir.y, 0.0);
      totalEmissiveRadiance += diffuseColor.rgb * uSunColor * c * 0.55;
    }
    totalEmissiveRadiance += diffuseColor.rgb * vec3(0.35, 0.95, 0.75) * mGlow * uNight * 0.9;
  }`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        /* glsl */ `#include <lights_physical_fragment>
#ifdef USE_IRIDESCENCE
  material.iridescence *= mIri;
  material.iridescenceThickness = mix(240.0, 620.0, mIriT);
#endif
#ifdef USE_CLEARCOAT
  material.clearcoat = mCoat;
  material.clearcoatRoughness = min(max(mCoatRough, 0.0525) + geometryRoughness, 1.0);
#endif
  material.specularColor *= mBaseSpec;
  material.specularColorBlended = mix(material.specularColor, diffuseColor.rgb, metalnessFactor);
  material.specularF90 *= mix(mBaseSpec, 1.0, metalnessFactor);`,
      )
      .replace(
        "#include <clearcoat_normal_fragment_maps>",
        "#include <clearcoat_normal_fragment_maps>\n#ifdef USE_CLEARCOAT\n  clearcoatNormal = mCoatN;\n#endif",
      )
      .replace(
        "#include <opaque_fragment>",
        /* glsl */ `
  if (uWaterOn > 0.5 && vWorldPosM.y < uWaterY && uKind < 5.0) {
    float dDown = uWaterY - vWorldPosM.y;
    vec3 V = cameraPosition - vWorldPosM;
    float len = length(V);
    float view;
    if (cameraPosition.y < uWaterY) view = len;
    else view = min(dDown / max(V.y / len, 0.12), len);
    vec3 T = exp(-uAbsorb * (view + dDown));
    vec3 inscatter = uScatter * uAmbientLum * (1.0 - exp(-uAbsorb * view * 1.6));
    outgoingLight = outgoingLight * T + inscatter;
  }
#include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `ezarri-mosaic-v3-${iridescence ? 1 : 0}`;
  return mat;
}

/** Sichtbarer Himmel als Verlauf mit Sonne und ruhenden Haufenwolken (Hintergrund und Spiegelung). */
export const SKY_GLSL = /* glsl */ `
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunDirS;
uniform vec3 uSunColorS;
float skyH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float skyN(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(skyH(i), skyH(i + vec2(1.0, 0.0)), u.x), mix(skyH(i + vec2(0.0, 1.0)), skyH(i + vec2(1.0, 1.0)), u.x), u.y); }
float skyFbm(vec2 p) { float a = 0.5; float v = 0.0; for (int i = 0; i < 5; i++) { v += a * skyN(p); p = p * 2.03 + vec2(7.1, 3.7); a *= 0.5; } return v; }
vec3 skyColor(vec3 dir) {
  dir = normalize(dir);
  float h = clamp(dir.y, -0.2, 1.0);
  vec3 c = mix(uSkyHorizon, uSkyTop, pow(max(h, 0.0), 0.42));
  if (h < 0.0) c = mix(uSkyHorizon, uSkyHorizon * 0.55, -h * 5.0);
  float s = max(dot(dir, normalize(uSunDirS)), 0.0);
  // Wolken: auf eine Ebene projiziert, zum Horizont dünner
  if (h > 0.0) {
    vec2 p = dir.xz / (h + 0.18) * 1.6;
    float n = skyFbm(p + vec2(3.0, 1.0));
    float cover = smoothstep(0.6, 0.82, n) * smoothstep(0.03, 0.22, h);
    float light = 0.75 + 0.25 * smoothstep(0.5, 0.9, skyFbm(p * 1.7 + 2.0));
    vec3 cc = (uSkyHorizon * 0.45 + uSunColorS * 0.65 + vec3(0.05)) * light;
    c = mix(c, cc, cover * 0.85);
  }
  c += uSunColorS * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.18);
  return c;
}
`;

/** Wasseroberfläche: Fresnel-Spiegelung des Himmels, Sonnenglanz, zwei bewegte Normalen-Lagen. */
export function createWaterMaterial(skyUniforms) {
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
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform float uTime;
      uniform float uWave;
      uniform vec3 uTint;
      uniform vec3 uLed;
      uniform float uSpec;
      uniform samplerCube uEnv;
      uniform float uEnvOn;
      varying vec3 vW;
      float h2(vec2 p) { p = fract(p * vec2(0.1031, 0.103)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
      float vn(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 s = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), s.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), s.x), s.y); }
      float hgt(vec2 p) {
        return vn(p * 1.3 + vec2(uTime * 0.35, uTime * 0.21)) * 0.55 + vn(p * 3.1 - vec2(uTime * 0.27, -uTime * 0.33)) * 0.28 + vn(p * 7.0 + uTime * 0.5) * 0.11 + vn(p * 15.0 - uTime * 0.8) * 0.06;
      }
      void main() {
        float e = 0.04;
        float a = hgt(vW.xz);
        vec2 g = vec2(hgt(vW.xz + vec2(e, 0.0)) - a, hgt(vW.xz + vec2(0.0, e)) - a) / e;
        vec3 V = normalize(cameraPosition - vW);
        // Normalen-Stärke bei flachem Blick dämpfen (sonst kippt R unter den Horizont und
        // spiegelt Hecke/Unterseiten: dunkle Flecken, QM R2 P2-3)
        float flach = smoothstep(0.02, 0.35, abs(V.y));
        float amp = 0.1 * uWave * mix(0.25, 1.0, flach);
        vec3 n = normalize(vec3(-g.x * amp, 1.0, -g.y * amp));
        bool below = cameraPosition.y < vW.y;
        if (below) n = -n;
        float cosT = clamp(dot(n, V), 0.0, 1.0);
        float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
        vec3 R = reflect(-V, n);
        if (!below) R = normalize(vec3(R.x, max(R.y, 0.03), R.z));
        // Spiegelung der Umgebung (Würfel-Aufnahme), Rückfall Himmel
        vec3 refl = uEnvOn > 0.5 ? textureCube(uEnv, R).rgb : skyColor(R);
        if (!below) {
          // nach unten auf die Himmelsfarbe am Horizont klammern: keine fast schwarzen Flecken
          vec3 hz = skyColor(normalize(vec3(R.x, 0.06, R.z)));
          float lr = dot(refl, vec3(0.2126, 0.7152, 0.0722));
          float lh = dot(hz, vec3(0.2126, 0.7152, 0.0722));
          refl = mix(refl, hz, (1.0 - smoothstep(lh * 0.35, lh * 0.7, lr)) * 0.85);
        }
        vec3 col;
        float alpha;
        if (below) {
          col = mix(uTint * 2.0 + uLed * 0.2, refl * 0.4, F);
          alpha = mix(0.35, 0.9, F);
        } else {
          float spec = min(pow(max(dot(R, normalize(uSunDirS)), 0.0), 420.0) * 5.0 * uSpec, 2.5);
          // Glanz neutraler (Gelbstich nach Tone-Mapping, QM R2 P2-3)
          col = refl + mix(uSunColorS, vec3(1.0), 0.45) * spec;
          // Fresnel etwas betont (Bildwirkung wie auf Fotos, polarisationsfrei)
          alpha = clamp(F * 1.25 + 0.05 + spec * 0.6, 0.0, 1.0);
          col = mix(col, uTint, 0.06);
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Himmelskuppel (Hintergrund). */
export function createSkyMaterial(skyUniforms) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { ...skyUniforms },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vDir;
      void main() {
        gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Himmel und Sonne je Tageszeit (linear). */
export const TAGESZEIT = Object.freeze({
  morgen: { sun: [-0.7, 0.32, 0.55], sunColor: [1.0, 0.78, 0.55], sunI: 1.7, top: [0.22, 0.42, 0.72], hor: [0.95, 0.78, 0.62], hemi: 0.75, night: 0 },
  mittag: { sun: [0.35, 0.85, 0.4], sunColor: [1.0, 0.97, 0.92], sunI: 2.3, top: [0.07, 0.24, 0.66], hor: [0.5, 0.68, 0.92], hemi: 0.7, night: 0 },
  abend: { sun: [0.8, 0.16, -0.4], sunColor: [1.0, 0.55, 0.3], sunI: 1.3, top: [0.15, 0.2, 0.45], hor: [0.98, 0.58, 0.38], hemi: 0.4, night: 0.25 },
  nacht: { sun: [0.3, 0.5, -0.6], sunColor: [0.35, 0.42, 0.62], sunI: 0.15, top: [0.01, 0.016, 0.04], hor: [0.045, 0.055, 0.09], hemi: 0.22, night: 1 },
});

/** LED-Farben (linear) – 3 Unterwasser-Scheinwerfer. */
export const LED_FARBE = Object.freeze({
  aus: null,
  weiss: [1, 1, 1],
  warm: [1, 0.72, 0.42],
  blau: [0.15, 0.35, 1],
  tuerkis: [0.1, 0.85, 0.8],
});

/**
 * Nur für tools/poster.mjs: alle Mosaik- und Fugenfarben auf einen Grauwert setzen (0 oder 1).
 * Aus zwei Aufnahmen (schwarz/weiß) entsteht die Vorschau „Poster eingefärbt“ für Geräte
 * ohne 3D (QM R2 P2-1). Wirkt nur, wenn das Werkzeug window.__ezkPosterMaske setzt.
 */
export function posterMaske(u, v) {
  const data = u.uPal.value.image.data;
  for (let row = 0; row < PAL_ROWS; row++)
    for (let col = 0; col < 7; col++) {
      const o = (row * PAL_COLS + col) * 4;
      data[o] = data[o + 1] = data[o + 2] = v;
    }
  u.uPal.value.needsUpdate = true;
  u.uAreaMean?.value.set(v, v, v);
  u.uGrout.value.setRGB(v, v, v);
}
