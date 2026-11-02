// Ezarri-Konfigurator – baut die three.js-Szene aus geometry.js (nur im Lazy-Chunk).
//
// Pool/Whirlpool: Boden (Schräge), Wände (Umfang, Welt-UV in Metern), Stufen und Bank
// als Prismen, Beckenkopf, Terrasse, Rinne bzw. Infinity-Kante, Wasserfläche.
// Bad: Duschnische (Boden + 3 Wände). Küche: Rückwand mit Arbeitsplatte und Schränken.
// Alle Mosaikflächen tragen das Attribut `mosaicUv` (Meter) für den Shader.
import * as THREE from "three";
import { bench, depthAt, outline, steps, waterLevel, edgeVisible, polygonArea } from "@/lib/ezarri/konfigurator/geometry";
import { createMosaicMaterial } from "@/lib/ezarri/konfigurator/shader/mosaic";
import { buildUmgebung } from "./umgebung";

const KIND = { boden: 0, wand: 1, stufe: 2, front: 3, trocken: 5 };

function addGeometry(positions, normals, uvs, indices) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("mosaicUv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}

/** Waagrechte (bzw. geneigte) Fläche aus einem Polygon; y(x) liefert die Höhe. */
function capGeometry(pts, yOf, { up = true } = {}) {
  const contour = pts.map(([x, z]) => new THREE.Vector2(x, z));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  // Neigung entlang x aus zwei Punkten
  const s = (yOf(1) - yOf(0)) / 1;
  const n = new THREE.Vector3(-s, 1, 0).normalize();
  if (!up) n.negate();
  pts.forEach(([x, z]) => {
    pos.push(x, yOf(x), z);
    nor.push(n.x, n.y, n.z);
    uv.push(x, z);
  });
  for (const [a, b, c] of tris) {
    // Wicklung so, dass die Vorderseite nach oben (bzw. unten) zeigt
    const ax = pts[a][0], az = pts[a][1];
    const bx = pts[b][0], bz = pts[b][1];
    const cx = pts[c][0], cz = pts[c][1];
    const cross = (bz - az) * (cx - ax) - (bx - ax) * (cz - az); // y-Komponente von (b-a)×(c-a)
    const faceUp = cross > 0;
    if (faceUp === up) idx.push(a, b, c);
    else idx.push(a, c, b);
  }
  return addGeometry(pos, nor, uv, idx);
}

/**
 * Senkrechte Bänder entlang von Kanten. `edges` = Liste [i] der Polygonkanten,
 * `inward` = Normalen zeigen ins Polygon (Beckenwände) statt hinaus (Prismen).
 */
function wallGeometry(pts, edges, yTopOf, yBotOf, { inward }) {
  const area = polygonArea(pts);
  const sgn = Math.sign(area) || 1;
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const edgeNormal = (i) => {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 1;
    // Inneres liegt links der Kante (bei positiver Fläche): (−dz, dx)
    let nx = (-dz / len) * sgn;
    let nz = (dx / len) * sgn;
    if (!inward) {
      nx = -nx;
      nz = -nz;
    }
    return [nx, nz];
  };
  const smoothAt = (i, own) => {
    // weiche Normalen an flachen Knicken (Rundungen), harte an Ecken
    const prev = (i - 1 + pts.length) % pts.length;
    if (!edges.includes(prev)) return own;
    const o = edgeNormal(prev);
    const dot = o[0] * own[0] + o[1] * own[1];
    if (dot < Math.cos((35 * Math.PI) / 180)) return own;
    const x = o[0] + own[0];
    const z = o[1] + own[1];
    const l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  };
  const smoothEnd = (i, own) => {
    const next = (i + 1) % pts.length;
    if (!edges.includes(next)) return own;
    const o = edgeNormal(next);
    const dot = o[0] * own[0] + o[1] * own[1];
    if (dot < Math.cos((35 * Math.PI) / 180)) return own;
    const x = o[0] + own[0];
    const z = o[1] + own[1];
    const l = Math.hypot(x, z) || 1;
    return [x / l, z / l];
  };
  let s = 0;
  for (const i of edges) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = edgeNormal(i);
    const na = smoothAt(i, n);
    const nb = smoothEnd(i, n);
    const base = pos.length / 3;
    const ya = yTopOf(a[0]);
    const yb = yTopOf(b[0]);
    const ba = yBotOf(a[0]);
    const bb = yBotOf(b[0]);
    pos.push(a[0], ya, a[1], a[0], ba, a[1], b[0], bb, b[1], b[0], yb, b[1]);
    nor.push(na[0], 0, na[1], na[0], 0, na[1], nb[0], 0, nb[1], nb[0], 0, nb[1]);
    uv.push(s, ya, s, ba, s + len, bb, s + len, yb);
    // Wicklung: Normale des Dreiecks (0,1,2) soll in Richtung n zeigen
    const e1 = [0, ba - ya, 0];
    const e2 = [b[0] - a[0], bb - ya, b[1] - a[1]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1];
    const cz = e1[0] * e2[1] - e1[1] * e2[0];
    if (cx * n[0] + cz * n[1] > 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    s += len;
  }
  return addGeometry(pos, nor, uv, idx);
}

/** Polygon nach außen versetzen (Gehrung, für Beckenkopf/Rinne). */
export function offsetOutline(pts, d) {
  const sgn = Math.sign(polygonArea(pts)) || 1;
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const n1 = norm2([(p[1] - a[1]) * sgn, -(p[0] - a[0]) * sgn]);
    const n2 = norm2([(b[1] - p[1]) * sgn, -(b[0] - p[0]) * sgn]);
    const m = norm2([n1[0] + n2[0], n1[1] + n2[1]]);
    const cos = Math.max(0.35, m[0] * n1[0] + m[1] * n1[1]);
    return [p[0] + (m[0] * d) / cos, p[1] + (m[1] * d) / cos];
  });
}
function norm2([x, z]) {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
}

/** Ring-/Lochfläche (Terrasse, Beckenkopf) als waagrechte Shape bei Höhe y. */
function ringGeometry(outerPts, holePts, y) {
  const shape = new THREE.Shape(outerPts.map(([x, z]) => new THREE.Vector2(x, -z)));
  if (holePts) shape.holes.push(new THREE.Path(holePts.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ShapeGeometry(shape, 8);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

let slabTex = null;
function slabTexture() {
  if (slabTex || typeof document === "undefined") return slabTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) {
      const v = 196 + Math.round(rnd() * 14);
      ctx.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
      ctx.fillRect(x * 128, y * 128, 128, 128);
      for (let i = 0; i < 380; i++) {
        const w = Math.round(rnd() * 30) - 15;
        ctx.fillStyle = `rgba(${120 + w},${115 + w},${105 + w},0.12)`;
        ctx.fillRect(x * 128 + rnd() * 128, y * 128 + rnd() * 128, 2, 2);
      }
    }
  ctx.fillStyle = "rgba(90,86,80,0.75)";
  ctx.fillRect(0, 0, 256, 2);
  ctx.fillRect(0, 128, 256, 2);
  ctx.fillRect(0, 0, 2, 256);
  ctx.fillRect(128, 0, 2, 256);
  slabTex = new THREE.CanvasTexture(c);
  slabTex.wrapS = slabTex.wrapT = THREE.RepeatWrapping;
  slabTex.colorSpace = THREE.SRGBColorSpace;
  slabTex.anisotropy = 4;
  return slabTex;
}

function planarUv(g, scale) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) * scale;
    uv[i * 2 + 1] = p.getZ(i) * scale;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * Szene aufbauen.
 * @returns {{group: THREE.Group, mosaicMeshes: THREE.Mesh[], water: THREE.Mesh|null, dispose: () => void,
 *            bounds: THREE.Box3, interior: boolean}}
 */
export function buildScene({ szene, becken }, shared, waterMat, { iridescence = true, sky = null } = {}) {
  const group = new THREE.Group();
  const mosaicMeshes = [];
  const disposables = [];
  const mosaic = (geo, opts) => {
    const mat = createMosaicMaterial(shared, { iridescence, ...opts });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.mosaic = true;
    mosaicMeshes.push(mesh);
    group.add(mesh);
    disposables.push(geo, mat);
    return mesh;
  };
  const plain = (geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    disposables.push(geo, mat);
    return mesh;
  };
  let water = null;
  let clip = null;

  if (szene === "pool" || szene === "whirlpool") {
    const pts = outline(becken, szene);
    const d = (x) => depthAt(becken, x, szene);
    const infinity = szene === "pool" && becken.rand === "infinity";
    const ueberlauf = szene === "pool" && becken.rand === "ueberlauf";
    // Boden und Wände
    mosaic(capGeometry(pts, (x) => -d(x)), { kind: KIND.boden });
    mosaic(
      wallGeometry(pts, pts.map((_, i) => i), () => 0, (x) => -d(x), { inward: true }),
      { kind: KIND.wand, topY: 0 },
    );
    // Stufen
    for (const st of steps(becken, szene)) {
      const vis = st.pts.map((_, i) => i).filter((i) => edgeVisible(st, i));
      let nose = [0, 0, 0, 0];
      if (st.art === "roemisch" || st.art === "eck") {
        const c = st.art === "eck" ? st.pts[0] : (() => {
          const w = st.wand[0];
          const a = st.pts[w];
          const b = st.pts[(w + 1) % st.pts.length];
          return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        })();
        const R = Math.max(...st.pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
        nose = [1, c[0], c[1], R];
      } else if (st.art === "voll") nose = [2, 0, 0, st.pts[1][0]];
      mosaic(capGeometry(st.pts, () => st.yTop), { kind: KIND.stufe, nose, topY: st.yTop });
      mosaic(wallGeometry(st.pts, vis, () => st.yTop, (x) => -d(x) - 0.01, { inward: false }), { kind: KIND.front, topY: st.yTop });
    }
    for (const bk of bench(becken, szene)) {
      const vis = bk.pts.map((_, i) => i).filter((i) => edgeVisible(bk, i));
      mosaic(capGeometry(bk.pts, () => bk.yTop), { kind: KIND.stufe, topY: bk.yTop });
      mosaic(wallGeometry(bk.pts, vis, () => bk.yTop, (x) => -d(x) - 0.01, { inward: false }), { kind: KIND.front, topY: bk.yTop });
    }
    // Beckenkopf, Rinne, Terrasse
    if (infinity) clip = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), becken.l / 2)];
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd8d1c5, roughness: 0.72, clippingPlanes: clip });
    const inner = ueberlauf ? offsetOutline(pts, 0.22) : pts;
    if (ueberlauf) {
      plain(ringGeometry(inner, pts, -0.012), new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.6 }));
    }
    const coping = offsetOutline(inner, 0.32);
    // Beckenkopf als 5 cm starke Platte mit gerundeter Kante (Fase 1,5 cm), Oberkante 3,5 cm über der Terrasse
    {
      const sh = new THREE.Shape(coping.map(([x, z]) => new THREE.Vector2(x, -z)));
      sh.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 8 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0.005, 0);
      g.computeVertexNormals();
      plain(g, stoneMat);
    }
    if (sky) {
      const u = buildUmgebung({ becken, szene, coping, deckClip: clip, offsetOutline, sky });
      group.add(u.group);
      disposables.push({ dispose: u.dispose });
    } else {
      const deckTex = slabTexture();
      const deckMat = new THREE.MeshStandardMaterial({ color: 0xb4ab9d, map: deckTex, roughness: 0.9, clippingPlanes: clip });
      const ext = Math.max(becken.l, becken.b) * 0.5 + 7;
      const outer = [[-becken.l / 2 - ext, -becken.b / 2 - ext], [becken.l / 2 + ext, -becken.b / 2 - ext], [becken.l / 2 + ext, becken.b / 2 + ext], [-becken.l / 2 - ext, becken.b / 2 + ext]];
      plain(planarUv(ringGeometry(outer, coping, 0), 1 / 1.2), deckMat);
    }
    if (infinity) {
      // Außenwand der Überlaufkante (trocken, Mosaik) und tieferes Gelände dahinter
      const hz = becken.b / 2;
      const x = becken.l / 2;
      const pos = [x, 0, -hz, x, -1.1, -hz, x, -1.1, hz, x, 0, hz];
      const g = addGeometry(pos, [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], [-hz, 0, -hz, -1.1, hz, -1.1, hz, 0], [0, 2, 1, 0, 3, 2]);
      mosaic(g, { kind: KIND.trocken });
      if (!sky) {
        const land = new THREE.PlaneGeometry(80, 80);
        land.rotateX(-Math.PI / 2);
        land.translate(x + 40, -1.1, 0);
        plain(land, new THREE.MeshStandardMaterial({ color: 0x6d7a5c, roughness: 1 }));
      }
    }
    // Wasser
    if (waterMat) {
      const wl = waterLevel(becken, szene);
      const wg = ringGeometry(pts, null, wl);
      water = new THREE.Mesh(wg, waterMat);
      water.renderOrder = 2;
      group.add(water);
      disposables.push(wg);
    }
    // Erde unter der Terrasse (gegen Durchblick bei Kamera unter Wasser)
    const box = new THREE.Box3(new THREE.Vector3(-becken.l / 2, -becken.tTief, -becken.b / 2), new THREE.Vector3(becken.l / 2, 0, becken.b / 2));
    return { group, mosaicMeshes, water, bounds: box, interior: false, dispose: () => disposables.forEach((x) => x.dispose()) };
  }

  if (szene === "bad") {
    const { l, b, tTief: H } = becken;
    const hx = l / 2;
    const hz = b / 2;
    mosaic(capGeometry([[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]], () => 0), { kind: KIND.trocken });
    // Rückwand (Normale +z), Seitenwände (nach innen)
    const wall = (pos, n, uv) => addGeometry(pos, [...n, ...n, ...n, ...n], uv, [0, 1, 2, 0, 2, 3]);
    mosaic(wall([-hx, 0, -hz, hx, 0, -hz, hx, H, -hz, -hx, H, -hz], [0, 0, 1], [-hx, 0, hx, 0, hx, H, -hx, H]), { kind: KIND.trocken });
    mosaic(wall([-hx, 0, hz, -hx, 0, -hz, -hx, H, -hz, -hx, H, hz], [1, 0, 0], [hz, 0, -hz, 0, -hz, H, hz, H]), { kind: KIND.trocken });
    mosaic(wall([hx, 0, -hz, hx, 0, hz, hx, H, hz, hx, H, -hz], [-1, 0, 0], [-hz, 0, hz, 0, hz, H, -hz, H]), { kind: KIND.trocken });
    // Raum davor
    const floor = new THREE.PlaneGeometry(12, 8);
    floor.rotateX(-Math.PI / 2);
    floor.translate(0, -0.002, hz + 4);
    plain(floor, new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 0.85 }));
    const back = new THREE.PlaneGeometry(12, 4);
    back.translate(0, 2, -hz - 0.01);
    plain(back, new THREE.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.95 }));
    // Brause und Ablaufrinne
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, metalness: 1, roughness: 0.18 });
    const arm = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 12);
    arm.rotateX(Math.PI / 2);
    arm.translate(0, Math.min(2.15, H - 0.1), -hz + 0.175);
    plain(arm, chrome);
    const head = new THREE.CylinderGeometry(0.11, 0.11, 0.012, 32);
    head.translate(0, Math.min(2.13, H - 0.12), -hz + 0.3);
    plain(head, chrome.clone());
    const drain = new THREE.BoxGeometry(Math.max(0.4, l - 0.3), 0.004, 0.05);
    drain.translate(0, 0.002, -hz + 0.12);
    plain(drain, chrome.clone());
    const box = new THREE.Box3(new THREE.Vector3(-hx, 0, -hz), new THREE.Vector3(hx, H, hz));
    return { group, mosaicMeshes, water: null, bounds: box, interior: true, dispose: () => disposables.forEach((x) => x.dispose()) };
  }

  // Küche: Rückwand zwischen Arbeitsplatte (0,92 m) und Oberschränken
  const { l, tTief: H } = becken;
  const hx = l / 2;
  const y0 = 0.92;
  const zW = -0.3;
  mosaic(
    addGeometry([-hx, y0, zW, hx, y0, zW, hx, y0 + H, zW, -hx, y0 + H, zW], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], [-hx, 0, hx, 0, hx, H, -hx, H], [0, 1, 2, 0, 2, 3]),
    { kind: KIND.trocken },
  );
  const paper = new THREE.MeshStandardMaterial({ color: 0x9c7e5e, roughness: 0.55 }); // Fronten Eiche geräuchert
  const top = new THREE.MeshStandardMaterial({ color: 0x3f4347, roughness: 0.35 }); // Steinplatte dunkel
  const base = new THREE.BoxGeometry(l, 0.88, 0.58);
  base.translate(0, 0.44, zW + 0.29);
  plain(base, paper);
  const plate = new THREE.BoxGeometry(l + 0.02, 0.04, 0.63);
  plate.translate(0, 0.9, zW + 0.315);
  plain(plate, top);
  const upper = new THREE.BoxGeometry(l, 0.72, 0.35);
  upper.translate(0, y0 + H + 0.36, zW + 0.175);
  plain(upper, paper.clone());
  const wall = new THREE.PlaneGeometry(l + 6, 4);
  wall.translate(0, 2, zW - 0.005);
  plain(wall, new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.95 }));
  const floor = new THREE.PlaneGeometry(l + 6, 6);
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, 0, 2.7);
  plain(floor, new THREE.MeshStandardMaterial({ color: 0xb9ab97, roughness: 0.8 }));
  // Licht unter dem Oberschrank (Lichtleiste)
  const strip = new THREE.BoxGeometry(l - 0.1, 0.01, 0.03);
  strip.translate(0, y0 + H - 0.006, zW + 0.3);
  plain(strip, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1d6, emissiveIntensity: 2 }));
  const box = new THREE.Box3(new THREE.Vector3(-hx, y0, zW), new THREE.Vector3(hx, y0 + H, zW + 0.6));
  return { group, mosaicMeshes, water: null, bounds: box, interior: true, dispose: () => disposables.forEach((x) => x.dispose()) };
}
