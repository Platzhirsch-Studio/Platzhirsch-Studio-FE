"use client";
// 3D preview – procedural volumes from the manufacturer measures (width, depth,
// overall height, seat height, armrest height). No manufacturer images or
// textures: covers are neutral material families with procedural surface maps
// (upholstery3d.js). Loaded only on demand via next/dynamic (ssr: false) from
// Planner.js, so three.js never lands in the initial bundle.
//
// Rendering (3D-Team 31.10.): image-based light, Khronos PBR Neutral tone
// mapping (the swatch colour stays the swatch colour), a soft shadow map that
// is rendered only when the layout changes, baked contact shadows, adaptive
// quality tiers, an eased camera and gliding modules / colour changes.
// Frameloop stays "demand": no GPU work while nothing moves.
//
// 3D v2 (31.10.): mid/high light the scene with a self-hosted CC0 interior
// HDRI (low and the loading phase keep the in-memory Lightformer studio); the
// covers get CC0 normal/roughness scans; seat cushions sag softly and carry a
// piping tube. Where the owner has converted Minotti's OFFICIAL 3D model of an
// element (tools/sofaplaner-3d/convert.mjs, manifest with written permission,
// lib/sofaplaner/modelle3d.js), that model replaces the schematic volume –
// loaded lazily (GLTFLoader + meshopt decoder from three/examples, no CDN),
// placed exactly like the schematic element, covered with the chosen
// material. Every other element stays schematic; the legend says which is which.
import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, NeutralToneMapping, SRGBColorSpace, Spherical, Vector2, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { topology } from "../../../lib/sofaplaner/geometry.js";
import { baseColor, tone } from "../../../lib/sofaplaner/materials.js";
import { MANIFEST_URL, findModel, indexManifest, lodFor } from "../../../lib/sofaplaner/modelle3d.js";
import { bounds } from "./model";
import { FLOOR_TILE, HDRI_URL, LOWER, TIERS, cushionGeometry, detectTier, floorTexture, loadScan, pipingGeometry, profileFor, surfaceNormalMap } from "./upholstery3d";
import { useT } from "./useT";
import s from "./sofaplaner.module.css";

const CM = 0.01;
const PLINTH = 4;
const CUSHION = 15;
const WALL_H = 0.6;
const WALL_T = 0.08;
const GHOST = 0.55;
const INK = "#30373e";
// *Model: the same covers without vertex colours, for the original 3D models
const MAT_KEYS = ["seat", "frame", "base", "seatGhost", "frameGhost", "baseGhost", "seatModel", "frameModel", "baseModel"];
const FABRIC_KEYS = ["seat", "frame", "seatGhost", "frameGhost", "seatModel", "frameModel"];

const median = (list) => {
  const v = list.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

/** Heights used in 3D. `estimated` = not published for this element (drawn translucent). */
export function heightsFor(el, fam) {
  const sh = el.sh ?? fam.sh ?? 42;
  const h = el.h ?? fam.h ?? sh + 38;
  const ah = el.ah ?? Math.min(h, sh + 20);
  return { sh, h, ah, estimated: el.h == null || el.sh == null };
}

function reducedMotion() {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

// --- Materials ---------------------------------------------------------------
function makeMaterials(materialKey, texSize) {
  const p = profileFor(materialKey);
  const normalMap = surfaceNormalMap(p.tex, texSize);
  normalMap.repeat.set(1 / p.tile, 1 / p.tile);
  const fabric = (opacity, vertexColors = true) =>
    new MeshPhysicalMaterial({
      roughness: p.rough,
      metalness: 0,
      sheen: p.sheen,
      sheenRoughness: p.sheenRough,
      clearcoat: p.clearcoat || 0,
      clearcoatRoughness: p.clearcoatRough || 0,
      normalMap,
      normalScale: new Vector2(p.normal, p.normal),
      vertexColors,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    });
  const base = (opacity) =>
    new MeshStandardMaterial({
      roughness: 0.42,
      metalness: 0.35,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    });
  return {
    profile: p,
    seat: fabric(1),
    frame: fabric(1),
    base: base(1),
    seatGhost: fabric(GHOST),
    frameGhost: fabric(GHOST),
    baseGhost: base(GHOST),
    seatModel: fabric(1, false),
    frameModel: fabric(1, false),
    baseModel: base(1),
  };
}

/** Swaps the procedural surface map for the CC0 scan once it has loaded. */
function applyScan(mats, scan) {
  const p = mats.profile;
  for (const k of FABRIC_KEYS) {
    const m = mats[k];
    m.normalMap = scan.normal;
    m.normalScale.set(p.scanNormal, p.scanNormal);
    m.roughnessMap = scan.rough;
    m.roughness = p.scanRough;
    m.needsUpdate = true;
  }
}
function ScanLoader({ mats, size }) {
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => {
    let on = true;
    loadScan(mats.profile, size).then((scan) => {
      if (!on || !scan) return;
      applyScan(mats, scan);
      invalidate();
    });
    return () => {
      on = false;
    };
  }, [mats, size, invalidate]);
  return null;
}

function paint(mats, goal, k) {
  const pairs = [
    [mats.seat, goal.seat],
    [mats.seatGhost, goal.seat],
    [mats.seatModel, goal.seat],
    [mats.frame, goal.frame],
    [mats.frameGhost, goal.frame],
    [mats.frameModel, goal.frame],
    [mats.base, goal.base],
    [mats.baseGhost, goal.base],
    [mats.baseModel, goal.base],
  ];
  for (const [m, c] of pairs) {
    if (k >= 1) m.color.copy(c);
    else m.color.lerp(c, k);
  }
  for (const m of FABRIC_KEYS.map((k) => mats[k])) {
    if (k >= 1) m.sheenColor.copy(goal.sheen);
    else m.sheenColor.lerp(goal.sheen, k);
  }
}

/** Eases the cover colour (and sheen tint) to the chosen swatch instead of jumping. */
function MaterialTween({ mats, hex, base }) {
  const invalidate = useThree((s) => s.invalidate);
  const goal = useMemo(() => {
    const seat = new Color(hex);
    return {
      seat,
      frame: seat.clone().multiplyScalar(0.9),
      sheen: seat.clone().lerp(new Color("#ffffff"), mats.profile.sheenLift),
      base: new Color(base),
    };
  }, [hex, base, mats]);
  const painted = useRef(null);
  useEffect(() => {
    // new material set (first mount, other family, other quality tier): no fade from white
    if (painted.current !== mats || reducedMotion()) paint(mats, goal, 1);
    painted.current = mats;
    invalidate();
  }, [goal, mats, invalidate]);
  useFrame((_, dt) => {
    const c = mats.seat.color;
    const d = Math.abs(c.r - goal.seat.r) + Math.abs(c.g - goal.seat.g) + Math.abs(c.b - goal.seat.b);
    if (d === 0 && mats.base.color.equals(goal.base)) return;
    paint(mats, goal, d < 0.002 ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 9));
    invalidate();
  });
  return null;
}

// --- Elements ------------------------------------------------------------------
/**
 * Upholstery parts of one element in local cm (rot 0: back at z−, seat facing z+).
 * Outer volume = manufacturer measures; the frame/cushion split is schematic.
 */
function partsFor(el, w, d, fam) {
  const topo = topology(el);
  const { sh, h, ah } = heightsFor(el, fam);
  const out = [];
  const add = (key, mat, size, pos, opt = {}) => out.push({ key, mat, size, pos, ...opt });
  add("plinth", "base", [w - 10, PLINTH, d - 10], [0, PLINTH / 2, 0], {
    r: 0.6,
    ao: 0,
  });

  if (el.kind === "tisch") {
    const leg = Math.min(w, d) * 0.3;
    add("top", "base", [w, 4, d], [0, h - 2, 0], { r: 1.2, ao: 0 });
    add("leg", "base", [leg, h - 4 - PLINTH, leg], [0, PLINTH + (h - 4 - PLINTH) / 2, 0], { r: 0.8, ao: 0 });
    return out;
  }
  if (el.role === "loose") {
    const top = el.h ?? sh;
    const body = Math.max(6, top - PLINTH - CUSHION * 0.6);
    add("body", "frame", [w, body, d], [0, PLINTH + body / 2, 0], { r: 3 });
    add("cushion", "seat", [w - 1, top - PLINTH - body, d - 1], [0, PLINTH + body + (top - PLINTH - body) / 2, 0], { r: 4, crown: 1.6, bulge: 0.6, piping: true });
    return out;
  }

  const B = Math.max(14, Math.min(26, d * 0.24)); // back zone (frame + cushion)
  const Bf = B * 0.42; // back frame
  const Bc = B - Bf; // back cushion
  const A = Math.max(10, Math.min(20, w * 0.13)); // arm width
  const baseTop = Math.max(PLINTH + 6, sh - CUSHION);
  const has = (s) => topo.backs.includes(s);
  const closed = (s) => topo.closed.includes(s);
  const mid = has("mid");

  add("base", "frame", [w, baseTop - PLINTH, d], [0, (PLINTH + baseTop) / 2, 0], { r: 2.5, ao: 0.3 });

  // seat cushions inside backs and arms, about 95 cm each
  const inset = (side) => (closed(side) ? A : has(side) ? B : 0);
  const sx0 = -w / 2 + inset("left");
  const sx1 = w / 2 - inset("right");
  const zones = mid
    ? [
        [-d / 2, -B / 2],
        [B / 2, d / 2],
      ]
    : [[-d / 2 + (has("top") ? B : 0), d / 2]];
  const n = Math.max(1, Math.round((sx1 - sx0) / 95));
  const cw = (sx1 - sx0) / n;
  const seatH = sh - baseTop;
  zones.forEach(([z0, z1], zi) => {
    for (let i = 0; i < n; i++) {
      add(`c${zi}-${i}`, "seat", [cw - 1, seatH, z1 - z0 - 1], [sx0 + cw * i + cw / 2, baseTop + seatH / 2, (z0 + z1) / 2], { r: 4.5, crown: 1.8, bulge: 0.7, sag: 0.9, piping: true });
    }
  });

  // back: frame up to the published overall height, loose back cushions in front
  const frameH = h - baseTop;
  const cushH = Math.max(12, h - 3 - (sh - 2));
  const cushY = sh - 2 + cushH / 2;
  const lean = -0.1; // rad – the cushion top leans back into the frame
  if (has("top")) {
    add("bt", "frame", [w, frameH, Bf], [0, baseTop + frameH / 2, -d / 2 + Bf / 2], { r: 3 });
    const bx0 = -w / 2 + (has("left") ? Bf : inset("left"));
    const bx1 = w / 2 - (has("right") ? Bf : inset("right"));
    const bn = Math.max(1, Math.round((bx1 - bx0) / 95));
    const bw = (bx1 - bx0) / bn;
    for (let i = 0; i < bn; i++) {
      add(`kt${i}`, "seat", [bw - 1, cushH, Bc], [bx0 + bw * i + bw / 2, cushY, -d / 2 + Bf + Bc / 2], { r: 4.5, crown: 2.2, bulge: 0.6, piping: true, rx: lean });
    }
  }
  for (const side of ["left", "right"]) {
    if (!has(side)) continue;
    const sgn = side === "left" ? -1 : 1;
    const z0 = -d / 2 + (has("top") ? B : 0);
    add(`b${side}`, "frame", [Bf, frameH, d - (has("top") ? Bf : 0)], [sgn * (w / 2 - Bf / 2), baseTop + frameH / 2, has("top") ? Bf / 2 : 0], { r: 3 });
    const len = d / 2 - z0;
    const kn = Math.max(1, Math.round(len / 95));
    const kl = len / kn;
    for (let i = 0; i < kn; i++) {
      add(`k${side}${i}`, "seat", [Bc, cushH, kl - 1], [sgn * (w / 2 - Bf - Bc / 2), cushY, z0 + kl * i + kl / 2], { r: 4.5, crown: 2.2, bulge: 0.6, piping: true, rz: -sgn * lean });
    }
  }
  if (mid) {
    add("bm", "frame", [w, frameH, Bf * 1.3], [0, baseTop + frameH / 2, 0], {
      r: 3,
    });
    const bw = (sx1 - sx0) / n;
    const bcm = Math.max(6, (B - Bf * 1.3) / 2);
    for (let i = 0; i < n; i++) {
      for (const sgn of [-1, 1]) {
        add(`km${i}${sgn}`, "seat", [bw - 1, cushH, bcm], [sx0 + bw * i + bw / 2, cushY, sgn * (Bf * 0.65 + bcm / 2)], { r: 3.5, crown: 1.6, bulge: 0.5, piping: true, rx: -sgn * lean });
      }
    }
  }
  const armH = ah - baseTop;
  const armZ0 = has("top") ? Bf : 0;
  for (const side of ["left", "right"]) {
    if (!closed(side) || armH <= 2) continue;
    const ax = side === "left" ? -w / 2 + A / 2 : w / 2 - A / 2;
    add(`a${side}`, "seat", [A, armH, d - armZ0], [ax, baseTop + armH / 2, armZ0 / 2], { r: 4.5, crown: 0.8, bulge: 0.4, piping: true });
  }
  return out;
}

// three.js objects are mutable by design – kept out of the components so the
// React Compiler rules do not mistake them for React state.
function dirtyShadows(gl) {
  gl.shadowMap.needsUpdate = true;
}
function noteMotion(motion, state) {
  motion.current.t = state.clock.elapsedTime;
  dirtyShadows(state.gl);
}

/** Glides an element to its place; elements added while the 3D view is open drop in softly. */
function useGlide(ref, x, z, rotY, ready, motion) {
  const goal = useRef({ x, z, rotY });
  const placed = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    goal.current = { x, z, rotY };
    const g = ref.current;
    if (!g) return;
    if (!placed.current || reducedMotion()) {
      const drop = !placed.current && ready.current && !reducedMotion();
      placed.current = true;
      g.position.set(x, drop ? 0.22 : 0, z);
      g.rotation.y = rotY;
      g.scale.setScalar(drop ? 0.95 : 1);
    }
    invalidate();
  }, [ref, x, z, rotY, ready, invalidate]);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = goal.current;
    const dr = ((t.rotY - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const off = Math.abs(g.position.x - t.x) + Math.abs(g.position.z - t.z) + Math.abs(g.position.y) + Math.abs(dr) + Math.abs(1 - g.scale.x);
    if (off < 1e-5) return;
    if (off < 0.002) {
      g.position.set(t.x, 0, t.z);
      g.rotation.y = t.rotY;
      g.scale.setScalar(1);
    } else {
      const k = 1 - Math.exp(-Math.min(dt, 0.05) * 11);
      g.position.x += (t.x - g.position.x) * k;
      g.position.z += (t.z - g.position.z) * k;
      g.position.y -= g.position.y * k;
      g.rotation.y += dr * k;
      g.scale.setScalar(g.scale.x + (1 - g.scale.x) * k);
    }
    noteMotion(motion, state);
    state.invalidate();
  });
}

// --- Original 3D models (Minotti, converted by the owner) ---------------------
let manifestPromise = null;
/** Manifest → index, fetched once per page (the file always exists, empty without models). */
function loadModelIndex() {
  manifestPromise ||= fetch(MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then(indexManifest);
  return manifestPromise;
}
function useModelIndex() {
  const [index, setIndex] = useState(null);
  useEffect(() => {
    let on = true;
    loadModelIndex().then((i) => on && setIndex(i));
    return () => {
      on = false;
    };
  }, []);
  return index;
}

let gltfLoader = null;
const modelCache = new Map();
/** GLB → scene (cached per URL for the page's lifetime; null when it cannot be loaded). */
function loadModel(url) {
  if (!modelCache.has(url)) {
    gltfLoader ||= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    modelCache.set(
      url,
      gltfLoader
        .loadAsync(url)
        .then((g) => g.scene)
        .catch(() => null)
    );
  }
  return modelCache.get(url);
}
function useModel(url) {
  const [state, setState] = useState({ url: null, scene: null });
  useEffect(() => {
    if (!url) return undefined;
    let on = true;
    loadModel(url).then((scene) => on && setState({ url, scene }));
    return () => {
      on = false;
    };
  }, [url]);
  return url && state.url === url ? state.scene : null;
}

const partClass = (o) => {
  const n = `${o.name || ""} ${o.material?.name || ""}`.toLowerCase();
  return n.includes("piping") ? "piping" : n.includes("base") ? "base" : "upholstery";
};
/** One placed copy of a model with the planner's cover materials (geometry stays shared). */
function instantiateModel(scene, mats, shadows) {
  const root = scene.clone(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    const cls = partClass(o);
    // a textured base (wood, metal finish from the source) keeps its own material
    if (cls === "base") o.material = o.material?.map ? o.material : mats.baseModel;
    else o.material = cls === "piping" ? mats.frameModel : mats.seatModel;
    o.castShadow = shadows;
    o.receiveShadow = shadows;
  });
  return root;
}
function ModelMeshes({ scene, mats, mirrored, shadows }) {
  const obj = useMemo(() => instantiateModel(scene, mats, shadows), [scene, mats, shadows]);
  // SX/DX from the other hand: mirrored on X (three.js flips the winding for negative scale)
  return (
    <group scale={[mirrored ? -1 : 1, 1, 1]}>
      <primitive object={obj} />
    </group>
  );
}

function ElementMesh({ item, el, fam, mats, room, shadows, arcN, piping, ready, motion, model }) {
  const ref = useRef(null);
  const x = (item.x - room.w / 2) * CM;
  const z = (item.y - room.d / 2) * CM;
  const rotY = (-item.rot * Math.PI) / 180;
  useGlide(ref, x, z, rotY, ready, motion);
  const real = useModel(model?.url);
  const { estimated } = heightsFor(el, fam);
  const parts = useMemo(
    () =>
      real
        ? []
        : partsFor(el, item.w, item.d, fam).map((p) => {
            const [w, h, d] = p.size.map((v) => Math.max(0.01, v * CM));
            const r = (p.r ?? 3) * CM;
            return {
              ...p,
              geo: cushionGeometry(w, h, d, {
                r,
                crown: (p.crown ?? 0) * CM,
                bulge: (p.bulge ?? 0) * CM,
                sag: (p.sag ?? 0) * CM,
                piping: !!p.piping,
                ao: p.ao ?? 0.22,
                arcN,
              }),
              pipe: piping && p.piping && !estimated ? pipingGeometry(w, h, d, r, { arcN }) : null,
            };
          }),
    [el, item.w, item.d, fam, arcN, piping, estimated, real]
  );
  return (
    <group ref={ref}>
      {real ? (
        <ModelMeshes scene={real} mats={mats} mirrored={model.mirrored} shadows={shadows} />
      ) : (
        parts.map((p) => (
          <group key={p.key} position={p.pos.map((v) => v * CM)} rotation={[p.rx || 0, 0, p.rz || 0]}>
            <mesh geometry={p.geo} material={mats[estimated ? `${p.mat}Ghost` : p.mat]} castShadow={shadows && !estimated} receiveShadow={shadows} dispose={null} />
            {p.pipe ? <mesh geometry={p.pipe} material={mats.frame} castShadow={false} receiveShadow={shadows} dispose={null} /> : null}
          </group>
        ))
      )}
    </group>
  );
}

// --- Room ------------------------------------------------------------------
function Room({ room, shadows }) {
  const W = room.w * CM,
    D = room.d * CM;
  const floor = useMemo(() => {
    const t = floorTexture(512).clone();
    t.repeat.set(W / FLOOR_TILE, D / FLOOR_TILE);
    t.needsUpdate = true;
    return t;
  }, [W, D]);
  useEffect(() => () => floor.dispose(), [floor]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={shadows}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.62} metalness={0} envMapIntensity={0.6} />
      </mesh>
      {/* cut-away walls (back + left) with a skirting board */}
      <mesh position={[0, WALL_H / 2, -D / 2 - WALL_T / 2]} receiveShadow={shadows}>
        <boxGeometry args={[W + WALL_T * 2, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#ebe5db" roughness={0.95} />
      </mesh>
      <mesh position={[-W / 2 - WALL_T / 2, WALL_H / 2, 0]} receiveShadow={shadows}>
        <boxGeometry args={[WALL_T, WALL_H, D]} />
        <meshStandardMaterial color="#ebe5db" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.03, -D / 2 + 0.006]}>
        <boxGeometry args={[W, 0.06, 0.012]} />
        <meshStandardMaterial color="#f6f2ec" roughness={0.6} />
      </mesh>
      <mesh position={[-W / 2 + 0.006, 0.03, 0]}>
        <boxGeometry args={[0.012, 0.06, D]} />
        <meshStandardMaterial color="#f6f2ec" roughness={0.6} />
      </mesh>
    </group>
  );
}

function OpeningMesh({ o, room }) {
  const len = o.width * CM;
  const W = room.w * CM,
    D = room.d * CM;
  const along = (o.offset + o.width / 2) * CM;
  let pos, rotY;
  if (o.wall === "top") [pos, rotY] = [[-W / 2 + along, 0, -D / 2], 0];
  else if (o.wall === "bottom") [pos, rotY] = [[-W / 2 + along, 0, D / 2], 0];
  else if (o.wall === "left") [pos, rotY] = [[-W / 2, 0, -D / 2 + along], Math.PI / 2];
  else [pos, rotY] = [[W / 2, 0, -D / 2 + along], Math.PI / 2];
  const isWindow = o.type === "window";
  const backWall = o.wall === "top" || o.wall === "left";
  const sill = (o.sill || 0) * CM;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[len, 0.08]} />
        <meshStandardMaterial color={isWindow ? "#a9bfcf" : "#b9a993"} roughness={1} />
      </mesh>
      {isWindow && backWall && sill < WALL_H && (
        <group position={[0, 0, -WALL_T / 2]}>
          <mesh position={[0, (sill + WALL_H + 0.25) / 2, 0]}>
            <boxGeometry args={[len, WALL_H + 0.25 - sill, 0.02]} />
            <meshPhysicalMaterial color="#dfeaf1" transparent opacity={0.35} roughness={0.05} metalness={0} depthWrite={false} />
          </mesh>
          <mesh position={[0, WALL_H + 0.25, 0]}>
            <boxGeometry args={[len + 0.04, 0.03, WALL_T + 0.01]} />
            <meshStandardMaterial color="#8b8f92" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Where the key light comes from: the widest window of the plan, else front right. */
function keyLight(openings, room) {
  const win = openings.filter((o) => o.type === "window").sort((a, b) => b.width - a.width)[0];
  const span = Math.max(room.w, room.d) * CM;
  if (!win) return [span * 0.45, span * 1.1, span * 0.7];
  const along = (win.offset + win.width / 2 - (win.wall === "left" || win.wall === "right" ? room.d : room.w) / 2) * CM;
  const out = span * 0.9;
  if (win.wall === "top") return [along, span, -out];
  if (win.wall === "bottom") return [along, span, out];
  if (win.wall === "left") return [-out, span, along];
  return [out, span, along];
}

/** Window/sun key light; its orthographic shadow camera covers the whole room. */
function KeyLight({ position, ext, far, shadows, mapSize }) {
  const ref = useRef(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const cam = ref.current?.shadow.camera;
    if (!cam) return;
    Object.assign(cam, {
      left: -ext,
      right: ext,
      top: ext,
      bottom: -ext,
      near: 0.1,
      far,
    });
    cam.updateProjectionMatrix();
    invalidate();
  }, [ext, far, invalidate]);
  return (
    <directionalLight
      ref={ref}
      position={position}
      intensity={1.25}
      color="#fff5e8"
      castShadow={shadows}
      shadow-mapSize={[mapSize, mapSize]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.025}
      shadow-radius={5}
    />
  );
}

/** In-memory studio for reflections (no HDRI download): soft ceiling, window strip, warm bounce. */
const Studio = memo(function Studio({ res, kx, kz }) {
  const len = Math.hypot(kx, kz) || 1;
  const ux = kx / len,
    uz = kz / len;
  return (
    <Environment resolution={res} frames={1} environmentIntensity={0.5}>
      <color attach="background" args={["#d9d2c8"]} />
      <Lightformer form="rect" intensity={2.2} color="#fff8ef" position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} />
      <Lightformer form="rect" intensity={3.2} color="#fffaf2" position={[ux * 5, 2.2, uz * 5]} scale={[4, 2.2, 1]} target={[0, 0.5, 0]} />
      <Lightformer form="rect" intensity={0.8} color="#ffe2c4" position={[-ux * 5, 1.2, -uz * 5]} scale={[6, 1.5, 1]} target={[0, 0.5, 0]} />
      <Lightformer form="ring" intensity={0.6} color="#f3ede4" position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 8, 1]} />
    </Environment>
  );
});

// --- Dimensions (Maßkette in 3D) ---------------------------------------------
// Labels are drawn into a small canvas texture and shown as a sprite with a
// constant on-screen size (no DOM overlay, no web font download).
function labelTexture(text) {
  const s = 2; // drawn at 2× for sharp text on retina screens
  const font = `500 ${11 * s}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const c = document.createElement("canvas");
  let ctx = c.getContext("2d");
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width + 14 * s);
  const h = 20 * s;
  c.width = w;
  c.height = h;
  ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(250,248,244,0.94)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, w, h, 3 * s);
  else ctx.rect(0, 0, w, h);
  ctx.fill();
  ctx.font = font;
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 7 * s, h / 2 + s * 0.5);
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, w: w / s, h: h / s };
}
function Label({ at, children }) {
  const height = useThree((s) => s.size.height);
  const fov = useThree((s) => s.camera.fov);
  const tex = useMemo(() => labelTexture(String(children)), [children]);
  useEffect(() => () => tex.texture.dispose(), [tex]);
  const k = (2 * Math.tan((fov * Math.PI) / 360)) / Math.max(1, height);
  return (
    <sprite position={at} scale={[tex.w * k, tex.h * k, 1]} renderOrder={10}>
      <spriteMaterial map={tex.texture} sizeAttenuation={false} depthTest={false} depthWrite={false} transparent toneMapped={false} />
    </sprite>
  );
}
function Bar({ from, to, t = 0.004 }) {
  const mid = from.map((v, i) => (v + to[i]) / 2);
  const size = from.map((v, i) => Math.max(t, Math.abs(to[i] - v)));
  return (
    <mesh position={mid} renderOrder={2}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={INK} transparent opacity={0.75} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
function Dims({ b, room, height, labels }) {
  const x0 = (b.x - room.w / 2) * CM,
    x1 = (b.x + b.w - room.w / 2) * CM,
    z0 = (b.y - room.d / 2) * CM,
    z1 = (b.y + b.h - room.d / 2) * CM;
  const off = 0.16,
    tk = 0.05,
    y = 0.006;
  const zl = z1 + off,
    xl = x1 + off;
  const hy = height ? height * CM : 0;
  return (
    <group>
      <Bar from={[x0, y, zl]} to={[x1, y, zl]} />
      <Bar from={[x0, y, zl - tk]} to={[x0, y, zl + tk]} />
      <Bar from={[x1, y, zl - tk]} to={[x1, y, zl + tk]} />
      <Label at={[(x0 + x1) / 2, y, zl]}>{labels.w}</Label>
      <Bar from={[xl, y, z0]} to={[xl, y, z1]} />
      <Bar from={[xl - tk, y, z0]} to={[xl + tk, y, z0]} />
      <Bar from={[xl - tk, y, z1]} to={[xl + tk, y, z1]} />
      <Label at={[xl, y, (z0 + z1) / 2]}>{labels.d}</Label>
      {height ? (
        <>
          <Bar from={[xl, 0, z0]} to={[xl, hy, z0]} />
          <Bar from={[xl - tk, hy, z0]} to={[xl + tk, hy, z0]} />
          <Label at={[xl, hy * 0.55, z0]}>{labels.h}</Label>
        </>
      ) : null}
    </group>
  );
}

// --- Camera ----------------------------------------------------------------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function CameraRig({ box, maxH }) {
  const get = useThree((st) => st.get);
  const size = useThree((st) => st.size);
  const hasControls = useThree((st) => !!st.controls);
  const anim = useRef(null);
  const last = useRef(null);
  useEffect(() => {
    const { camera, controls, invalidate } = get();
    const dir = [0.42, 0.62, 1];
    const len = Math.hypot(...dir);
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (size.width / size.height));
    const diag = Math.hypot(box.w, box.d);
    const elev = Math.atan2(dir[1], Math.hypot(dir[0], dir[2]));
    const rH = 0.5 * diag;
    const rV = 0.5 * (diag * Math.sin(elev) + maxH * CM * Math.cos(elev));
    const dist = Math.max(rH / Math.tan(hfov / 2), rV / Math.tan(vfov / 2)) * 1.18 + rH * 0.5 + 0.35;
    const target = new Vector3(box.cx, 0.3, box.cz);
    const goal = new Vector3(dir[0] / len, dir[1] / len, dir[2] / len).multiplyScalar(dist).add(target);
    camera.near = 0.05;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.maxDistance = dist * 2;
      controls.minDistance = Math.max(0.8, dist * 0.35);
    }
    const first = !last.current;
    const resizeOnly = !first && last.current.box === box && last.current.maxH === maxH;
    last.current = { box, maxH };
    if (reducedMotion() || resizeOnly) {
      anim.current = null;
      camera.position.copy(goal);
      if (controls) {
        controls.target.copy(target);
        controls.update();
      }
      camera.lookAt(target);
    } else {
      // cinematic entry: a slow swing in from higher and wider; later re-frames glide
      const fromT = first ? target.clone() : (controls?.target.clone() ?? target.clone());
      const from = new Spherical().setFromVector3(first ? goal.clone().sub(target) : camera.position.clone().sub(fromT));
      if (first) {
        from.radius *= 1.5;
        from.phi = Math.max(0.25, from.phi - 0.35);
        from.theta -= 0.55;
      }
      const to = new Spherical().setFromVector3(goal.clone().sub(target));
      anim.current = {
        t: 0,
        dur: first ? 1.6 : 0.7,
        from,
        to,
        fromT,
        toT: target,
      };
    }
    invalidate();
  }, [box, maxH, get, size.width, size.height, hasControls]);
  // the visitor takes over: the camera move stops at once
  useEffect(() => {
    const c = get().controls;
    if (!c) return;
    const stop = () => {
      anim.current = null;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [get, hasControls]);
  const sph = useMemo(() => new Spherical(), []);
  const tgt = useMemo(() => new Vector3(), []);
  useFrame((state, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t += Math.min(dt, 1 / 30);
    const k = ease(Math.min(1, a.t / a.dur));
    const dTheta = ((a.to.theta - a.from.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    sph.set(a.from.radius + (a.to.radius - a.from.radius) * k, a.from.phi + (a.to.phi - a.from.phi) * k, a.from.theta + dTheta * k);
    tgt.lerpVectors(a.fromT, a.toT, k);
    state.camera.position.setFromSpherical(sph).add(tgt);
    state.camera.lookAt(tgt);
    if (state.controls) state.controls.target.copy(tgt);
    if (k >= 1) anim.current = null;
    state.invalidate();
  });
  return null;
}

// --- Quality --------------------------------------------------------------------
/** Steps the quality tier down when interaction frames average above ~22 ms (below ~45 fps). */
function FrameBudget({ tier, onDown }) {
  const acc = useRef({ n: 0, sum: 0 });
  useFrame((_, dt) => {
    if (tier === "low" || dt > 0.25) return; // idle gaps in "demand" mode are not slow frames
    const a = acc.current;
    a.n += 1;
    a.sum += dt;
    if (a.n < 60) return;
    const avg = a.sum / a.n;
    a.n = 0;
    a.sum = 0;
    if (avg > 0.022) onDown();
  });
  return null;
}

/** Shadow map: rendered once per layout / quality change instead of every frame. */
function ShadowSync({ sig }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    dirtyShadows(gl);
    invalidate();
  }, [sig, gl, invalidate]);
  return null;
}

/** Contact shadow: baked once per layout, live only while elements glide. */
function Ground({ room, sig, motion, res }) {
  const [live, setLive] = useState(false);
  useFrame((state) => {
    const moving = state.clock.elapsedTime - motion.current.t < 0.08;
    if (moving !== live) setLive(moving);
    if (live) state.invalidate();
  });
  return (
    <ContactShadows
      key={`${sig}:${live ? "live" : res}`}
      frames={live ? Infinity : 1}
      position={[0, 0.003, 0]}
      scale={[room.w * CM, room.d * CM]}
      resolution={res}
      blur={3}
      opacity={0.6}
      far={0.9}
      color="#2e241a"
    />
  );
}

export default function Preview3D({ plan, lookup, baseText = "", interactive = true, onContextLost, onRenderer, onCanvas, dims = true }) {
  const T = useT();
  const { room } = plan;
  const materialKey = plan.look?.material;
  const t = tone(materialKey, plan.look?.tone);
  const base = baseColor(baseText);
  const [tierName, setTierName] = useState(detectTier);
  const q = TIERS[tierName];
  const modelIndex = useModelIndex();
  const lod = lodFor(tierName);
  const modelFor = (el) => (modelIndex && el ? findModel(modelIndex, plan.family, el, { lod }) : null);
  const coverage = plan.items.reduce(
    (acc, it) => {
      const el = lookup(it.code);
      if (!el) return acc;
      const m = modelFor(el);
      if (m) {
        acc.real += 1;
        if (m.mirrored) acc.mirrored += 1;
      } else acc.schematic += 1;
      return acc;
    },
    { real: 0, schematic: 0, mirrored: 0 }
  );
  const els = plan.items.map((i) => lookup(i.code)).filter(Boolean);
  const fam = useMemo(() => {
    const list = plan.items.map((i) => lookup(i.code)).filter(Boolean);
    return {
      sh: median(list.map((e) => e.sh)),
      h: median(list.map((e) => e.h)),
    };
  }, [plan.items, lookup]);
  // R3F disposes the renderer on unmount (forceContextLoss) – that is not a real loss
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const mats = useMemo(() => makeMaterials(materialKey, q.tex), [materialKey, q.tex]);
  useEffect(
    () => () => {
      for (const k of MAT_KEYS) mats[k].dispose();
    },
    [mats]
  );
  // elements present when the view opens stand in place (their effects run
  // before this one); elements added later drop in
  const ready = useRef(false);
  useEffect(() => {
    ready.current = true;
  }, []);
  const motion = useRef({ t: -1 });

  const maxH = Math.max(80, ...els.map((e) => e.h || 0));
  // height dimension only when every element's height is published
  const pubH = els.length > 0 && els.every((e) => e.h != null) ? Math.max(...els.map((e) => e.h)) : null;
  const span = Math.max(room.w, room.d) * CM;
  const b = bounds(plan.items);
  const bx = b ? (b.x + b.w / 2 - room.w / 2) * CM : 0;
  const bz = b ? (b.y + b.h / 2 - room.d / 2) * CM : 0;
  const bw = b ? b.w * CM : room.w * CM * 0.5;
  const bd = b ? b.h * CM : room.d * CM * 0.5;
  const box = useMemo(() => ({ cx: bx, cz: bz, w: bw, d: bd }), [bx, bz, bw, bd]);
  const sig = `${room.w}x${room.d}|${plan.items.map((i) => `${i.id}:${i.code}:${i.x},${i.y},${i.rot}`).join(";")}|${tierName}`;
  const [kx, ky, kz] = keyLight(plan.openings, room);
  const ext = Math.hypot(room.w, room.d) * CM * 0.6 + 0.5;
  const labels = b
    ? {
        w: `${T("B")} ${Math.round(b.w)} cm`,
        d: `${T("T")} ${Math.round(b.h)} cm`,
        h: pubH ? `H ${Math.round(pubH)} cm` : "",
      }
    : null;

  return (
    <>
      <Canvas
        // Grün 30.10.: the canvas exists before the renderer; a context lost in
        // between makes three.js throw before onCreated – the planner then asks
        // the canvas itself.
        ref={onCanvas}
        dpr={[1, q.dpr]}
        frameloop="demand"
        shadows={q.shadows ? "percentage" : false}
        camera={{ position: [span * 0.5, span * 0.7, span], fov: 32 }}
        gl={{
          antialias: true,
          powerPreference: "low-power",
          toneMapping: NeutralToneMapping,
          toneMappingExposure: 1,
        }}
        onCreated={({ gl }) => {
          // Endtest 29.10.: the planner asks the renderer on a render error whether
          // the context was lost (the error often arrives before "webglcontextlost").
          onRenderer?.(gl);
          gl.shadowMap.autoUpdate = false;
          gl.shadowMap.needsUpdate = true;
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              if (alive.current) onContextLost?.();
            },
            { once: true }
          );
        }}
      >
        <color attach="background" args={["#f2ede5"]} />
        {q.hdri ? (
          <Suspense fallback={<Studio res={q.env} kx={kx} kz={kz} />}>
            <Environment files={HDRI_URL} environmentIntensity={0.62} />
          </Suspense>
        ) : (
          <Studio res={q.env} kx={kx} kz={kz} />
        )}
        <ScanLoader mats={mats} size={q.scan} />
        <hemisphereLight args={["#fbf6ef", "#cdbfa9", 0.25]} />
        <KeyLight position={[kx, ky, kz]} ext={ext} far={span * 4 + 4} shadows={q.shadows} mapSize={q.shadowMap || 512} />
        <Room room={room} shadows={q.shadows} />
        {plan.openings.map((o) => (
          <OpeningMesh key={o.id} o={o} room={room} />
        ))}
        {plan.items.map((it) => {
          const el = lookup(it.code);
          return el ? (
            <ElementMesh key={it.id} item={it} el={el} fam={fam} mats={mats} room={room} shadows={q.shadows} arcN={q.arcN} piping={q.piping} ready={ready} motion={motion} model={modelFor(el)} />
          ) : null;
        })}
        <MaterialTween mats={mats} hex={t.hex} base={base} />
        <Ground room={room} sig={sig} motion={motion} res={q.contact} />
        {dims && b ? <Dims b={b} room={room} height={pubH} labels={labels} /> : null}
        <ShadowSync sig={sig} />
        <FrameBudget tier={tierName} onDown={() => setTierName((n) => LOWER[n])} />
        <OrbitControls makeDefault enabled={interactive} enablePan={false} enableDamping dampingFactor={0.09} rotateSpeed={0.7} zoomSpeed={0.8} minPolarAngle={0.12} maxPolarAngle={Math.PI / 2.15} />
        <CameraRig box={box} maxH={maxH} />
      </Canvas>
      {plan.items.length > 0 ? (
        <p className={s.legend3d} data-testid="sp-3d-legend">
          {coverage.real > 0 ? (
            <span className={s.legend3dReal}>
              {T("Originalmodell Minotti")} ({coverage.real}){coverage.mirrored ? ` · ${T("gespiegelt")} ${coverage.mirrored}` : ""}
            </span>
          ) : null}
          {coverage.schematic > 0 ? (
            <span className={s.legend3dSchematic}>
              {T("schematisch")}
              {coverage.real > 0 ? ` (${coverage.schematic})` : ""}
            </span>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
