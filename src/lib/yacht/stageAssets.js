// src/lib/yacht/stageAssets.js
// Shared GPU resources of the Werfthalle (Stage3D.js only – lazy 3D chunk).
// Werfthalle 3D, Runde 3 (31.10.2026):
// - ONE geometry per part size (cache) instead of one drei <RoundedBox> per
//   part: drei extrudes a Shape with 8 bevel segments and creases the normals
//   on the main thread (≈ 96 k triangles and ≈ 300 ms for the motor yacht on
//   a desktop CPU, several times that on a phone – at every boat switch and
//   for every part re-mounted by a zone change). three's RoundedBoxGeometry
//   (2 segments) gives the same silhouette with 300 triangles per part and is
//   built in a fifth of the time; equal sizes (chairs, cushions, windows) are
//   built once.
// - Box-projected UVs in METRES on every part, so the plank texture of the
//   deck also lies on teak soles, tables and the jetty at true scale
//   (3.2 m planks, 12 cm wide) – before, those were flat colour.
// - ONE material per material id (≈ 18 per boat instead of ≈ 175): fewer
//   uniform uploads, and the evening switch changes three materials instead
//   of re-creating all of them.
// No designer pieces in 3D (Bibel §14) – this only changes how the abstract
// volumes are drawn.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { isRoundedPart, partRadius } from "./hull.js";
import { MATERIAL_TONES, TOKENS } from "./palette.js";

/** Cache key of a part's geometry (size + radius, mm precision). */
export function geometryKey(part) {
  const s = part.s.map((v) => v.toFixed(3)).join("x");
  return isRoundedPart(part) ? `r${s}@${partRadius(part).toFixed(3)}` : `b${s}`;
}

/**
 * Box projection: each vertex gets the two coordinates of the plane its
 * normal faces (top/bottom → x,z; sides → x,y or z,y) in metres, so a
 * repeating texture keeps its real size on every part.
 */
export function metreUvs(geometry) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, pos.getX(i), pos.getZ(i));
    else if (az >= ax) uv.setXY(i, pos.getX(i), pos.getY(i));
    else uv.setXY(i, pos.getZ(i), pos.getY(i));
  }
  geometry.setAttribute("uv", uv);
  uv.needsUpdate = true;
  return geometry;
}

/** @returns {{get(part): THREE.BufferGeometry, size: number, dispose(): void}} */
export function createGeometryCache() {
  const map = new Map();
  return {
    get(part) {
      const key = geometryKey(part);
      let g = map.get(key);
      if (!g) {
        const [x, y, z] = part.s;
        g = isRoundedPart(part) ? new RoundedBoxGeometry(x, y, z, 2, partRadius(part)) : new THREE.BoxGeometry(x, y, z);
        metreUvs(g);
        map.set(key, g);
      }
      return g;
    },
    get size() {
      return map.size;
    },
    dispose() {
      for (const g of map.values()) g.dispose();
      map.clear();
    },
  };
}

/** Colour of a part (concept palette for upholstery, material tone otherwise). */
export function partColor(mat, palette, finish) {
  if (mat.startsWith("soft")) return palette[Number(mat.slice(4))] || palette[0] || TOKENS.linen;
  if (mat === "gelcoat" && finish === "holz") return MATERIAL_TONES.holz;
  return MATERIAL_TONES[mat] || TOKENS.stone;
}

/** Material for one material id – same look as before, plus planks and brushed metal. */
export function makeMaterial(mat, { palette = [], finish, teak = null } = {}) {
  const color = partColor(mat, palette, finish);
  switch (mat) {
    case "glass":
      return new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0, depthWrite: false });
    case "window":
      return new THREE.MeshStandardMaterial({ color, emissive: MATERIAL_TONES.warm, emissiveIntensity: 0, roughness: 0.15, metalness: 0.1 });
    case "lamp":
      return new THREE.MeshStandardMaterial({ color, emissive: MATERIAL_TONES.warm, emissiveIntensity: 0.05, roughness: 0.4 });
    case "ceramic":
      return new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.1 });
    case "mirror":
      return new THREE.MeshStandardMaterial({ color, roughness: 0.06, metalness: 1 });
    case "tile":
      return new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
    case "metal":
      // brushed stainless: anisotropic highlight along the part (uses the metre UVs)
      return new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.9, anisotropy: 0.6 });
    case "gelcoat":
    case "hardtop":
    case "holz":
      return new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
    case "teak":
      // the deck's plank texture (white base × map = the teak tone of the canvas)
      return new THREE.MeshStandardMaterial({ color: teak ? TOKENS.paper : color, map: teak, roughness: 0.75 });
    case "wood":
      return new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
    case "sole":
      return new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
    default:
      if (mat.startsWith("soft") || mat === "bedding" || mat === "sail") {
        return new THREE.MeshPhysicalMaterial({ color, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.8, sheenColor: TOKENS.paper });
      }
      return new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  }
}

/** Evening ("Seelicht"): warm windows, glowing lamp shades. Mutates in place. */
export function applyEvening(materials, evening) {
  const win = materials.get("window");
  if (win) {
    win.color.set(evening ? MATERIAL_TONES.warm : MATERIAL_TONES.window);
    win.emissiveIntensity = evening ? 1.6 : 0;
  }
  const lamp = materials.get("lamp");
  if (lamp) lamp.emissiveIntensity = evening ? 2.4 : 0.05;
}

/**
 * One material per id, created on first use.
 * @returns {{get(mat: string): THREE.Material, map: Map, setEvening(on: boolean): void, dispose(): void}}
 */
export function createMaterialCache(opts) {
  const map = new Map();
  let evening = false;
  return {
    map,
    get(mat) {
      let m = map.get(mat);
      if (!m) {
        m = makeMaterial(mat, opts);
        map.set(mat, m);
        if (evening) applyEvening(map, true);
      }
      return m;
    },
    setEvening(on) {
      evening = on;
      applyEvening(map, on);
    },
    dispose() {
      for (const m of map.values()) m.dispose();
      map.clear();
    },
  };
}

/**
 * Parts of the current view with STABLE React keys: the key is the index in
 * model.parts plus the piece of the section cut, so a zone change re-mounts
 * only the parts the cut really changes (before: index after flatMap, which
 * shifted – up to 98 of 175 parts were rebuilt per zone change).
 */
export function keyedParts(model, cut, showSteg, sectionParts) {
  const out = [];
  model.parts.forEach((p, i) => {
    if (!showSteg && p.steg) return;
    sectionParts(p, cut).forEach((q, j) => out.push({ ...q, key: `${i}.${j}.${q.s[1].toFixed(3)}` }));
  });
  return out;
}
