"use client";
// Küchenplaner – 3D-Ansicht (three.js über @react-three/fiber/drei).
// Wird nur clientseitig und erst auf Klick geladen (Viewer.js → next/dynamic).
//
// QA Runde 1/2: „Ich stehe in der Küche“ (Augenhöhe 1,60 m), Puppenhaus-Wände,
// feste Kamera für das Anfrage-Bild, Lightformer-Licht, gebackene Eck-Verschattung,
// Kontextverlust → Grundriss, Ladefortschritt.
// Pro-Ausbau: beliebige Wände mit Fenster-/Türausschnitten, Heizkörper und
// Anschlüssen, Dachschräge (Clipping-Ebene), PBR für Lack matt/glänzend, Furnier,
// Keramik, Lackglas, Fenix, Arbeitsplatten inkl. Granit und Edelstahl (im Browser
// erzeugte Texturen), Kantenprofil, Pendelleuchten, Licht „Tag/Abend“, Foto der
// aktuellen Ansicht. Mobil: kleinere Schattenkarte, kein Flächenlicht.
// Fix 1 (QA-Feedback 1): Startkamera aus der Bounding-Box aller Module eingepasst
// (35° von schräg vorn, Rand ≥ 12 %, Abstand nach Seitenverhältnis), „Einpassen“,
// Touch-Sperre bis zum Antippen (locked), Kollisionen als halbtransparente Fläche
// mit Kontur statt rotem Materialtausch, kräftigere Kontaktschatten.
// Fix 2 (QA-Feedback 2, P2-5): CC0-HDR (Poly Haven Studio Small 09, 256 × 128, 105 KB,
// lokal) als Umgebung, die Lightformer liegen darüber. Ab Desktop GTAO (three.js-
// Beispielpass, kein Zusatzpaket) mit Rückfall auf normales Rendern. Fugen- und
// Schattenfugen-Materialien mit polygonOffset gegen Z-Fighting, Kamera-near 5 cm.
// Abendlicht: kräftigere LED-Flächenlichter plus Lichtkegel (SpotLight) je Zeile.
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Edges, Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FRONT_COLORS, GRIP_COLORS, TEXTURE_BASE, WORKTOPS } from "./catalog";
import { AZIMUTH, azimuthLimits, standPose } from "./geometry";
import { TIERS, createFrameBudget, initialTier } from "./sceneQuality";

const TEX_KEYS = ["marmor", "keramik", "quarz", "holz", "front-nuss", "boden"];
const texUrls = (key) => ({
  map: `${TEXTURE_BASE}/${key}/color.jpg`,
  normalMap: `${TEXTURE_BASE}/${key}/normal.jpg`,
  roughnessMap: `${TEXTURE_BASE}/${key}/roughness.jpg`,
});

const MAX_SHOT = 1200; // px, Breite des Anfrage-Bildes

function usePBR(key) {
  const tex = useTexture(texUrls(key));
  useLayoutEffect(() => {
    for (const [k, t] of Object.entries(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.colorSpace = k === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
    }
  }, [tex]);
  return tex;
}

/** Granit (Sprenkel) und gebürsteter Edelstahl als Canvas-Textur – ohne Download. */
const procCache = {};
function procTexture(kind) {
  if (procCache[kind]) return procCache[kind];
  if (typeof document === "undefined") return null;
  const N = 512;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  let seed = kind === "granit" ? 7 : 13;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (kind === "granit") {
    ctx.fillStyle = "#4b4c4e";
    ctx.fillRect(0, 0, N, N);
    const cols = ["#2a2b2d", "#1b1c1d", "#6f7072", "#8e8b86", "#a7a39c", "#3a3b3d", "#c9c4ba"];
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
      const r = rnd() * 2.6 + 0.6;
      ctx.beginPath();
      ctx.ellipse(rnd() * N, rnd() * N, r, r * (0.5 + rnd()), rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#b9bcbf";
    ctx.fillRect(0, 0, N, N);
    for (let y = 0; y < N; y++) {
      const v = 170 + Math.floor(rnd() * 40);
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 4},0.55)`;
      ctx.fillRect(0, y, N, 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  procCache[kind] = t;
  return t;
}

/**
 * Box mit UVs in Weltmaß (1 Einheit = `scale` m), damit Texturen nicht verzerren.
 * `ou`/`ov` verschieben die UVs um die Lage des Teils in seiner Zeile (m): Furnier und
 * Stein laufen dann über alle Fronten bzw. Plattenstücke durch („Furnierbild“), statt
 * dass jede Front denselben Ausschnitt zeigt.
 */
const geoCache = new Map();
function boxGeometry(w, h, d, scale, ou = 0, ov = 0) {
  const key = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${scale}|${ou.toFixed(3)}|${ov.toFixed(3)}`;
  let g = geoCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Reihenfolge der Flächen: +x, -x, +y, -y, +z, -z (je 4 Vertices)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  // Versatz: entlang x auf Ober-/Unter-/Vorder-/Rückseite, in der Höhe auf allen stehenden Flächen
  const off = [[0, ov], [0, ov], [ou, 0], [ou, 0], [ou, ov], [ou, ov]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, (uv.getX(idx) * dims[f][0] + off[f][0]) / scale, (uv.getY(idx) * dims[f][1] + off[f][1]) / scale);
    }
  }
  uv.needsUpdate = true;
  cacheGeometry(key, g);
  return g;
}

/**
 * Cache voll → alle Einträge freigeben (dispose), nicht nur vergessen: sonst bleiben die
 * GPU-Puffer jeder je gezeigten Modulbreite liegen – beim langen Planen auf dem iPhone
 * bis zum Kontextverlust. Noch sichtbare Teile lädt three.js beim nächsten Bild neu hoch.
 */
function cacheGeometry(key, g) {
  if (geoCache.size > 900) {
    for (const old of geoCache.values()) old.dispose();
    geoCache.clear();
  }
  geoCache.set(key, g);
}

/** Abgerundete Box (Kantenprofil der Arbeitsplatte) mit Planar-UVs im Weltmaß. */
function roundedGeometry(w, h, d, r, seg, scale, ou = 0, ov = 0) {
  const key = `r|${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r}|${seg}|${scale}|${ou.toFixed(3)}|${ov.toFixed(3)}`;
  let g = geoCache.get(key);
  if (g) return g;
  g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, h / 2 - 0.0005));
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    const az = Math.abs(nor.getZ(i));
    // Oberseite: x/z, Stirnseiten: z/y, Front/Rückseite: x/y – jeweils ab der Teil-Ecke gemessen
    const [a, b] =
      ay >= ax && ay >= az
        ? [pos.getX(i) + w / 2 + ou, pos.getZ(i) + d / 2]
        : ax >= az
          ? [pos.getZ(i) + d / 2, pos.getY(i) + h / 2 + ov]
          : [pos.getX(i) + w / 2 + ou, pos.getY(i) + h / 2 + ov];
    uv.setXY(i, a / scale, b / scale);
  }
  uv.needsUpdate = true;
  cacheGeometry(key, g);
  return g;
}

/** Senkrechter Verlauf als Textur (unten → oben). */
function gradientTexture(stops) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 128, 0, 0);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Armatur: Bogen aus einer Röhre (lokal: y nach oben, +z zur Front).
const TAP_GEO = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(0, 0.325, 0.035),
    new THREE.Vector3(0, 0.34, 0.1),
    new THREE.Vector3(0, 0.31, 0.17),
    new THREE.Vector3(0, 0.235, 0.19),
  ]),
  48,
  0.011,
  12,
  false,
);
const TAP_BASE = new THREE.CylinderGeometry(0.024, 0.026, 0.02, 24);
const SHADE_GEO = new THREE.CylinderGeometry(0.07, 0.16, 0.22, 40, 1, true);
const BULB_GEO = new THREE.CircleGeometry(0.13, 32);
const CORD_GEO = new THREE.CylinderGeometry(0.003, 0.003, 1, 6);

function useMaterials(plan, mood) {
  const wtDef = WORKTOPS[plan.top];
  const topKey = wtDef.texture.startsWith("proc:") ? "quarz" : wtDef.texture;
  const top = usePBR(topKey);
  const nuss = usePBR("front-nuss");
  const eiche = usePBR("holz");
  const marmor = usePBR("marmor");
  const keramik = usePBR("keramik");
  const quarz = usePBR("quarz");
  const colorDef = FRONT_COLORS[plan.finish]?.[plan.color] || { hex: "#cccccc" };
  const grip = GRIP_COLORS[plan.gripColor || "alu"];

  return useMemo(() => {
    const evening = mood === "abend";
    let front;
    const texFor = (k) => ({ "front-nuss": nuss, holz: eiche, marmor, keramik, quarz })[k];
    if (plan.finish === "holz") {
      const t = texFor(colorDef.texture) || eiche;
      front = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 0.85, color: colorDef.hex, envMapIntensity: 0.8 });
    } else if (plan.finish === "keramik") {
      const t = texFor(colorDef.texture) || keramik;
      front = new THREE.MeshPhysicalMaterial({ map: t.map, normalMap: t.normalMap, roughness: 0.42, color: colorDef.hex, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.8 });
    } else if (plan.finish === "glas") {
      // Lackglas: deckend, glänzend. Gleiches Material für Hänge- und Unterschränke (P2-2).
      front = new THREE.MeshPhysicalMaterial({ color: colorDef.hex, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.55 });
    } else if (plan.finish === "glanz") {
      front = new THREE.MeshPhysicalMaterial({ color: colorDef.hex, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9 });
    } else if (plan.finish === "fenix") {
      front = new THREE.MeshStandardMaterial({ color: colorDef.hex, roughness: 0.93, metalness: 0, envMapIntensity: 0.45 });
    } else {
      front = new THREE.MeshStandardMaterial({ color: colorDef.hex, roughness: 0.62, envMapIntensity: 0.8 });
    }
    const carcassColor = plan.finish === "holz" ? (colorDef.texture === "front-nuss" ? "#4a3a2e" : "#c9b597") : plan.finish === "keramik" ? "#d9d4cc" : colorDef.hex;
    let worktop;
    if (wtDef.texture === "proc:granit") {
      const t = procTexture("granit");
      worktop = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.15 });
    } else if (wtDef.texture === "proc:edelstahl") {
      const t = procTexture("edelstahl");
      worktop = new THREE.MeshStandardMaterial({ map: t, metalness: 1, roughness: 0.3, color: "#d7d9db", envMapIntensity: 1.1 });
    } else {
      worktop = new THREE.MeshPhysicalMaterial({
        map: top.map,
        normalMap: top.normalMap,
        roughnessMap: top.roughnessMap,
        roughness: wtDef.roughness * 2,
        clearcoat: plan.top === "holz" ? 0 : 0.35,
        clearcoatRoughness: 0.2,
      });
    }
    return {
      front,
      glassFront: new THREE.MeshPhysicalMaterial({ color: "#c9d1d3", roughness: 0.08, transmission: 0, opacity: 0.55, transparent: true, clearcoat: 1, envMapIntensity: 1 }),
      carcass: new THREE.MeshStandardMaterial({ color: carcassColor, roughness: 0.8, envMapIntensity: 0.7 }),
      // Fix 2 (P2-5): Fugen liegen knapp hinter Fronten/Korpus → per polygonOffset nach hinten
      gapShade: new THREE.MeshStandardMaterial({ color: "#1b1a19", roughness: 1, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }),
      shadowGap: new THREE.MeshStandardMaterial({ color: "#161616", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      error: new THREE.MeshStandardMaterial({ color: "#c0392b", roughness: 0.6, emissive: "#3a0b06" }),
      worktop,
      worktopScale: wtDef.tile,
      plinth: new THREE.MeshStandardMaterial({ color: "#232324", roughness: 0.75 }),
      steel: new THREE.MeshStandardMaterial({ color: "#d4d6d8", metalness: 1, roughness: 0.25 }),
      steelApp: new THREE.MeshStandardMaterial({ color: "#c9ccce", metalness: 1, roughness: 0.32 }),
      steelDark: new THREE.MeshStandardMaterial({ color: "#3b3d40", metalness: 0.8, roughness: 0.4 }),
      grip: new THREE.MeshStandardMaterial({ color: grip.hex, metalness: grip.metal, roughness: grip.rough }),
      groove: new THREE.MeshStandardMaterial({ color: plan.gripColor === "schwarz" ? "#2a2b2c" : plan.gripColor === "messing" ? "#a88d58" : "#8a8c8e", metalness: 0.8, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      blackGlass: new THREE.MeshPhysicalMaterial({ color: "#101112", roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.4 }),
      // R7: Backofenscheibe getönt statt schwarz, mit deutlicher Spiegelung
      ovenGlass: new THREE.MeshPhysicalMaterial({ color: "#5a5f66", emissive: "#191b1e", roughness: 0.06, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.6 }),
      wineGlass: new THREE.MeshPhysicalMaterial({ color: "#2b3236", roughness: 0.05, transparent: true, opacity: 0.45, clearcoat: 1, envMapIntensity: 1.6 }),
      wood: new THREE.MeshStandardMaterial({ map: eiche.map, roughness: 0.7, color: "#d8c4a6" }),
      sinkBasin: new THREE.MeshStandardMaterial({ color: "#8d9093", metalness: 0.9, roughness: 0.35 }),
      sinkInner: new THREE.MeshStandardMaterial({ color: "#a3a6a9", metalness: 0.9, roughness: 0.3 }),
      splashGlass: new THREE.MeshPhysicalMaterial({ color: colorDef.texture ? "#d8d2c8" : colorDef.hex, roughness: 0.06, clearcoat: 1, envMapIntensity: 0.7 }),
      led: new THREE.MeshBasicMaterial({ color: evening ? "#ffe2a8" : "#fff1d2", toneMapped: false }),
      pendantShade: new THREE.MeshStandardMaterial({ color: "#2b2c2e", metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide }),
      pendantInner: new THREE.MeshStandardMaterial({ color: "#b89a5e", metalness: 1, roughness: 0.3, side: THREE.BackSide }),
      bulb: new THREE.MeshBasicMaterial({ color: evening ? "#ffd99a" : "#fff4e0", toneMapped: false }),
      frontScale: 1.2,
    };
  }, [plan.top, plan.finish, plan.gripColor, colorDef.hex, colorDef.texture, grip, top, nuss, eiche, marmor, keramik, quarz, wtDef, mood]);
}

/** Weicher Schattenstreifen in einer Raumecke (gebackene Ambient Occlusion, ohne Zusatzpaket). */
function AOStrip({ pos, normal, toward, length, depth, tex, opacity = 0.22 }) {
  const quat = useMemo(() => {
    const z = new THREE.Vector3(...normal);
    const y = new THREE.Vector3(...toward).negate();
    const x = new THREE.Vector3().crossVectors(y, z);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }, [normal, toward]);
  return (
    <mesh position={pos} quaternion={quat} renderOrder={1}>
      <planeGeometry args={[length, depth]} />
      <meshBasicMaterial color="#2a2118" alphaMap={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Clipping-Ebene der Dachschräge (alles über der Schräge wird abgeschnitten). */
function slopePlane(plan, walls) {
  const s = plan.room?.slope;
  if (!s?.w) return null;
  const w = walls.find((x) => x.id === s.w);
  if (!w) return null;
  const t = Math.tan((s.d * Math.PI) / 180);
  const N = new THREE.Vector3(t * w.n[0], -1, t * w.n[1]);
  const c = s.k / 100 - t * (w.n[0] * w.p0[0] + w.n[1] * w.p0[1]);
  const len = N.length();
  return new THREE.Plane(N.divideScalar(len), c / len);
}

/** Eine Wand: Scheiben um Fenster/Türen, Laibungen, Rahmen, Glas, Fensterbank; dazu Heizkörper und Anschlüsse. */
function Wall({ w, H, openings, mats, clip, refFn }) {
  const big = openings.filter((o) => o.k === "fenster" || o.k === "tuer").sort((a, b) => a.u0 - b.u0);
  const pieces = [];
  let u = 0;
  for (const o of big) {
    const a = Math.max(u, Math.min(w.len, o.u0));
    const b = Math.max(a, Math.min(w.len, o.u1));
    if (a - u > 0.005) pieces.push([u, a, 0, H]);
    if (o.y0 > 0.005) pieces.push([a, b, 0, o.y0]);
    if (o.y1 < H - 0.005) pieces.push([a, b, o.y1, H]);
    u = b;
  }
  if (w.len - u > 0.005) pieces.push([u, w.len, 0, H]);
  const at = (uu, v, y) => [w.p0[0] + w.u[0] * uu + w.n[0] * v, y, w.p0[1] + w.u[1] * uu + w.n[1] * v];
  const rot = [0, w.rot, 0];
  const S = 0.32;
  return (
    <group ref={refFn}>
      {pieces.map(([u0, u1, y0, y1], k) => (
        <group key={k}>
          <mesh position={at((u0 + u1) / 2, -0.05, (y0 + y1) / 2)} rotation={rot} geometry={boxGeometry(u1 - u0, y1 - y0, 0.1, 1)} material={clip ? mats.wallBodyClip : mats.wallBody} />
          <mesh receiveShadow position={at((u0 + u1) / 2, 0.0005, (y0 + y1) / 2)} rotation={rot} material={clip ? mats.wallFaceClip : mats.wallFace}>
            <planeGeometry args={[u1 - u0, y1 - y0]} />
          </mesh>
          {y0 < 0.01 && <mesh position={at((u0 + u1) / 2, 0.006, 0.03)} rotation={rot} geometry={boxGeometry(u1 - u0, 0.06, 0.012, 1)} material={mats.trim} castShadow />}
        </group>
      ))}
      {mats.ao && <AOStrip tex={mats.ao} pos={at(w.len / 2, S / 2, 0.003)} normal={[0, 1, 0]} toward={[-w.n[0], 0, -w.n[1]]} length={w.len} depth={S} />}
      {big.map((o, k) => {
        const uc = (o.u0 + o.u1) / 2;
        const bw = o.u1 - o.u0;
        const hh = o.y1 - o.y0;
        const fr = 0.05;
        if (o.k === "fenster") {
          return (
            <group key={`f${k}`}>
              {/* Laibung, Rahmen, Glas, Fensterbank */}
              <mesh position={at(uc, -0.05, o.y0 - 0.002)} rotation={rot} geometry={boxGeometry(bw, 0.004, 0.1, 1)} material={mats.cut} />
              <mesh position={at(uc, -0.05, o.y1 + 0.002)} rotation={rot} geometry={boxGeometry(bw, 0.004, 0.1, 1)} material={mats.cut} />
              <mesh position={at(o.u0 + fr / 2, -0.06, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(fr, hh, 0.07, 1)} material={mats.frame} />
              <mesh position={at(o.u1 - fr / 2, -0.06, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(fr, hh, 0.07, 1)} material={mats.frame} />
              <mesh position={at(uc, -0.06, o.y0 + fr / 2)} rotation={rot} geometry={boxGeometry(bw, fr, 0.07, 1)} material={mats.frame} />
              <mesh position={at(uc, -0.06, o.y1 - fr / 2)} rotation={rot} geometry={boxGeometry(bw, fr, 0.07, 1)} material={mats.frame} />
              {bw > 0.9 && <mesh position={at(uc, -0.06, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(0.06, hh, 0.07, 1)} material={mats.frame} />}
              <mesh position={at(uc, -0.06, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(bw - fr, hh - fr, 0.006, 1)} material={mats.glass} />
              <mesh position={at(uc, 0.03, o.y0 - 0.012)} rotation={rot} geometry={boxGeometry(bw + 0.06, 0.024, 0.16, 1)} material={mats.trim} castShadow />
            </group>
          );
        }
        return (
          <group key={`t${k}`}>
            <mesh position={at(uc, -0.05, o.y1 + 0.002)} rotation={rot} geometry={boxGeometry(bw, 0.004, 0.1, 1)} material={mats.cut} />
            <mesh position={at(o.u0 + 0.03, 0.005, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(0.06, hh, 0.02, 1)} material={mats.trim} />
            <mesh position={at(o.u1 - 0.03, 0.005, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(0.06, hh, 0.02, 1)} material={mats.trim} />
            <mesh position={at(uc, 0.005, o.y1 + 0.03)} rotation={rot} geometry={boxGeometry(bw + 0.12, 0.06, 0.02, 1)} material={mats.trim} />
            <mesh position={at(uc, -0.04, (o.y0 + o.y1) / 2)} rotation={rot} geometry={boxGeometry(bw - 0.02, hh - 0.01, 0.04, 1)} material={mats.door} castShadow />
            <mesh position={at(o.s === "l" ? o.u1 - 0.09 : o.u0 + 0.09, -0.005, 1.05)} rotation={rot} geometry={boxGeometry(0.13, 0.02, 0.04, 1)} material={mats.handle} />
          </group>
        );
      })}
      {openings
        .filter((o) => o.k !== "fenster" && o.k !== "tuer")
        .map((o, k) => {
          const uc = (o.u0 + o.u1) / 2;
          const yc = (o.y0 + o.y1) / 2;
          if (o.k === "heizung") {
            const ribs = Math.max(4, Math.round((o.u1 - o.u0) / 0.05));
            return (
              <group key={`h${k}`}>
                {Array.from({ length: ribs }, (_, r) => (
                  <mesh key={r} position={at(o.u0 + ((r + 0.5) * (o.u1 - o.u0)) / ribs, 0.05, yc)} rotation={rot} geometry={boxGeometry(((o.u1 - o.u0) / ribs) * 0.7, o.y1 - o.y0, 0.07, 1)} material={mats.radiator} castShadow />
                ))}
              </group>
            );
          }
          if (o.k === "abluft") return <mesh key={`v${k}`} position={at(uc, 0.01, yc)} rotation={rot} geometry={boxGeometry(0.17, 0.17, 0.02, 1)} material={mats.vent} />;
          if (o.k === "wasser")
            return (
              <group key={`w${k}`}>
                <mesh position={at(uc - 0.04, 0.02, yc)} rotation={rot} geometry={boxGeometry(0.025, 0.025, 0.04, 1)} material={mats.handle} />
                <mesh position={at(uc + 0.04, 0.02, yc)} rotation={rot} geometry={boxGeometry(0.025, 0.025, 0.04, 1)} material={mats.handle} />
              </group>
            );
          return <mesh key={`s${k}`} position={at(uc, 0.006, yc)} rotation={rot} geometry={boxGeometry(o.k === "steckdose" ? 0.16 : 0.09, 0.08, 0.012, 1)} material={o.k === "starkstrom" ? mats.cut : mats.socket} />;
        })}
    </group>
  );
}

function Room({ plan, kitchen, wallsRef, clip }) {
  const floor = usePBR("boden");
  const H = plan.h / 100;
  const walls = kitchen.walls.filter((w) => w.rendered);
  const mats = useMemo(() => {
    // Warmes Off-White, nach oben leicht heller (P2-2)
    const grad = gradientTexture([[0, "#e9e2d7"], [0.55, "#f2ede5"], [1, "#f7f4ef"]]);
    // Alpha-Verlauf: unten (Kante) dunkel → oben transparent. alphaMap liest den Grünkanal.
    const ao = gradientTexture([[0, "#ffffff"], [0.35, "#7a7a7a"], [1, "#000000"]]);
    if (ao) ao.colorSpace = THREE.NoColorSpace;
    const clipping = clip ? [clip] : [];
    return {
      wallBody: new THREE.MeshStandardMaterial({ color: "#e4ddd2", roughness: 0.95 }),
      wallFace: new THREE.MeshStandardMaterial({ color: "#ffffff", map: grad, roughness: 0.95 }),
      wallBodyClip: new THREE.MeshStandardMaterial({ color: "#e4ddd2", roughness: 0.95, clippingPlanes: clipping }),
      wallFaceClip: new THREE.MeshStandardMaterial({ color: "#ffffff", map: grad, roughness: 0.95, clippingPlanes: clipping, side: THREE.DoubleSide }),
      cut: new THREE.MeshStandardMaterial({ color: "#cfc6b8", roughness: 1 }),
      trim: new THREE.MeshStandardMaterial({ color: "#f4f1eb", roughness: 0.6 }),
      frame: new THREE.MeshStandardMaterial({ color: "#3a3c3f", roughness: 0.5, metalness: 0.3 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#dfeaf0", roughness: 0.02, transparent: true, opacity: 0.25, envMapIntensity: 1.5, emissive: "#9fb6c4", emissiveIntensity: 0.25 }),
      door: new THREE.MeshStandardMaterial({ color: "#efebe4", roughness: 0.55 }),
      handle: new THREE.MeshStandardMaterial({ color: "#c9cbcd", metalness: 1, roughness: 0.3 }),
      radiator: new THREE.MeshStandardMaterial({ color: "#f3f2ee", roughness: 0.45 }),
      vent: new THREE.MeshStandardMaterial({ color: "#d9d9d6", roughness: 0.6 }),
      socket: new THREE.MeshStandardMaterial({ color: "#f8f8f6", roughness: 0.4 }),
      ceiling: new THREE.MeshBasicMaterial({ color: "#ebe6de", side: THREE.DoubleSide }), // unbeleuchtet: sonst dunkler Balken
      ao,
    };
  }, [clip]);
  useEffect(() => () => Object.values(mats).forEach((m) => m?.dispose?.()), [mats]);
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: floor.map, normalMap: floor.normalMap, roughnessMap: floor.roughnessMap, color: "#e9e2d8" }),
    [floor],
  );

  const refs = useRef({});
  const ceil = useRef();
  const b = useMemo(() => {
    const xs = kitchen.walls.flatMap((w) => [w.p0[0], w.p1[0]]);
    const zs = kitchen.walls.flatMap((w) => [w.p0[1], w.p1[1]]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
  }, [kitchen.walls]);

  // Puppenhaus: Wand nur zeigen, wenn die Kamera auf der Raumseite steht.
  useEffect(() => {
    wallsRef.current = (cam) => {
      const p = cam.position;
      for (const w of walls) {
        const g = refs.current[w.id];
        if (g) g.visible = (p.x - w.p0[0]) * w.n[0] + (p.z - w.p0[1]) * w.n[1] > 0.02;
      }
      if (ceil.current) ceil.current.visible = p.y < H - 0.05 && p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ + 0.2;
    };
    return () => {
      wallsRef.current = null;
    };
  }, [wallsRef, walls, H, b]);
  useFrame(({ camera }) => wallsRef.current?.(camera));

  const pad = 0.6;
  const fw = b.maxX - b.minX + pad * 2;
  const fd = b.maxZ - b.minZ + pad;
  // Decke (bei Dachschräge eine schräge Fläche ab Kniestock)
  const slope = plan.room?.slope?.w ? kitchen.walls.find((w) => w.id === plan.room.slope.w) : null;
  const ceilShape = useMemo(() => {
    if (plan.shape !== "frei") return null;
    const s = new THREE.Shape();
    kitchen.walls.forEach((w, i) => (i ? s.lineTo(w.p0[0], -w.p0[1]) : s.moveTo(w.p0[0], -w.p0[1])));
    return s;
  }, [plan.shape, kitchen.walls]);

  return (
    <group>
      <mesh receiveShadow position={[(b.minX + b.maxX) / 2, -0.005, (b.minZ + b.maxZ) / 2 + pad / 2 - 0.05]} geometry={boxGeometry(fw, 0.01, fd, 1.5)} material={floorMat} />
      {walls.map((w) => (
        <Wall key={w.id} w={w} H={H} openings={kitchen.openings.filter((o) => o.w === w.id)} mats={mats} clip={clip} refFn={(el) => (refs.current[w.id] = el)} />
      ))}
      <group ref={ceil} visible={false}>
        {slope ? (
          <SlopeCeiling plan={plan} wall={slope} b={b} mat={mats.ceiling} />
        ) : ceilShape ? (
          <mesh position={[0, H, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ceiling}>
            <shapeGeometry args={[ceilShape]} />
          </mesh>
        ) : (
          <mesh position={[(b.minX + b.maxX) / 2, H, (b.minZ + b.maxZ) / 2]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceiling}>
            <planeGeometry args={[b.maxX - b.minX, b.maxZ - b.minZ]} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** Schräge Decke: vom Kniestock an der Wand bis zur vollen Raumhöhe, danach waagrecht. */
function SlopeCeiling({ plan, wall, b, mat }) {
  const geo = useMemo(() => {
    const t = Math.tan((plan.room.slope.d * Math.PI) / 180);
    const k = plan.room.slope.k / 100;
    const H = plan.h / 100;
    const run = Math.max(0.01, (H - k) / t);
    const L = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 2;
    const c = [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];
    const along = (s, dist, y) => {
      const bx = wall.p0[0] + wall.u[0] * s + wall.n[0] * dist;
      const bz = wall.p0[1] + wall.u[1] * s + wall.n[1] * dist;
      return [bx, y, bz];
    };
    void c;
    const p = [along(-L, 0, k), along(L, 0, k), along(L, run, H), along(-L, run, H), along(L, L, H), along(-L, L, H)];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p.flat(), 3));
    g.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4, 3, 4, 5]);
    g.computeVertexNormals();
    return g;
  }, [plan.room.slope.d, plan.room.slope.k, plan.h, wall, b]);
  return <mesh geometry={geo} material={mat} />;
}

function Pendant({ p, mats, light }) {
  const top = p.ceil ?? 2.6;
  const y = p.pos[1];
  const cordLen = Math.max(0.05, top - (y + 0.11));
  return (
    <group position={[p.pos[0], 0, p.pos[2]]}>
      <mesh geometry={CORD_GEO} material={mats.steelDark} position={[0, y + 0.11 + cordLen / 2, 0]} scale={[1, cordLen, 1]} />
      <mesh geometry={SHADE_GEO} material={mats.pendantShade} position={[0, y, 0]} castShadow />
      <mesh geometry={SHADE_GEO} material={mats.pendantInner} position={[0, y, 0]} scale={[0.985, 0.995, 0.985]} />
      <mesh geometry={BULB_GEO} material={mats.bulb} position={[0, y - 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {light && <pointLight position={[0, y - 0.15, 0]} intensity={1.6} distance={2.6} decay={2} color="#ffd9a0" />}
    </group>
  );
}

// Jede Wandzeile beginnt an einer anderen Stelle der Textur, damit Ecken nicht spiegeln
const ROW_UV = { a: 0, b: 3.7, c: 7.3, i: 11.1 };
/** UV-Versatz (m) für durchlaufendes Furnier-/Steinbild: Lage in der Zeile, bei Fronten auch die Höhe. */
function grainOffset(p) {
  if (!p.local || (p.mat !== "front" && p.mat !== "worktop")) return [0, 0];
  return [p.local.u0 + (ROW_UV[p.local.wall] ?? 0), p.mat === "front" ? p.local.y0 : 0];
}

const FRONT_EDGE_R = 0.0015; // m

const HIT_MAT = new THREE.MeshBasicMaterial({ color: "#c0392b", transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false });

function Kitchen({ plan, kitchen, mood, rich }) {
  const mats = useMaterials(plan, mood);
  useEffect(() => () => Object.values(mats).forEach((m) => m?.dispose?.()), [mats]);
  const evening = mood === "abend";
  return (
    <group>
      {kitchen.parts.map((p) => {
        if (p.geom === "tap") {
          return (
            <group key={p.id} position={[p.pos[0], p.pos[1] - p.size[1] / 2, p.pos[2]]} rotation={[0, p.rot, 0]}>
              <mesh geometry={TAP_BASE} material={mats.steel} position={[0, 0.01, 0]} castShadow />
              <mesh geometry={TAP_GEO} material={mats.steel} castShadow />
            </group>
          );
        }
        if (p.geom === "pendant") return <Pendant key={p.id} p={p} mats={mats} light={evening && rich} />;
        const scale = p.mat === "worktop" ? mats.worktopScale : p.mat === "front" ? mats.frontScale : 1;
        const isLight = p.mat === "led";
        const small = p.size[0] < 0.03 || p.size[1] < 0.02 || p.size[2] < 0.012;
        const [ou, ov] = grainOffset(p);
        // Fronten mit 1,5-mm-Kantenradius: die Kante fängt ein Glanzlicht – wie eine echte
        // lackierte oder furnierte Front statt einer scharfkantigen CG-Box.
        const bevel = p.mat === "front" && !small && p.geom !== "round" && p.size[2] > 0.012;
        const geo =
          p.geom === "round"
            ? roundedGeometry(p.size[0], p.size[1], p.size[2], p.r, p.seg || 3, scale, ou, ov)
            : bevel
              ? roundedGeometry(p.size[0], p.size[1], p.size[2], FRONT_EDGE_R, 2, scale, ou, ov)
              : boxGeometry(p.size[0], p.size[1], p.size[2], scale, ou, ov);
        const hit = p.mat === "error";
        return (
          <mesh
            key={p.id}
            position={p.pos}
            rotation={[0, p.rot, 0]}
            geometry={geo}
            material={hit ? mats.carcass : mats[p.mat] || mats.carcass}
            castShadow={!isLight && !small && p.mat !== "gapShade" && p.mat !== "glassFront"}
            receiveShadow={!isLight}
          >
            {hit && (
              // Kollision: halbtransparente Hülle mit Kontur, das Material bleibt sichtbar (P2-6)
              <mesh geometry={geo} scale={1.012} material={HIT_MAT} renderOrder={2}>
                <Edges threshold={20} color="#9b2c2c" />
              </mesh>
            )}
          </mesh>
        );
      })}
    </group>
  );
}

/** Flächenlicht unter den Hängeschränken (nur Desktop, Abendstimmung). */
function LedLights({ kitchen }) {
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);
  const strips = useMemo(() => {
    const byWall = new Map();
    for (const p of kitchen.parts) {
      if (!/-led$/.test(p.id) || !p.local) continue;
      const w = p.local.wall;
      const s = byWall.get(w) || { u0: Infinity, u1: -Infinity, y: p.local.y0, frame: kitchen.frames[w] };
      s.u0 = Math.min(s.u0, p.local.u0);
      s.u1 = Math.max(s.u1, p.local.u1);
      byWall.set(w, s);
    }
    return [...byWall.values()].filter((s) => s.frame).slice(0, 4);
  }, [kitchen]);
  return strips.map((s, i) => {
    const uc = (s.u0 + s.u1) / 2;
    const x = s.frame.origin[0] + s.frame.u[0] * uc + s.frame.v[0] * 0.07;
    const z = s.frame.origin[1] + s.frame.u[1] * uc + s.frame.v[1] * 0.07;
    // Fix 2 (P2-5): breiteres Flächenlicht und ein weicher Lichtkegel auf die Platte
    const tx = s.frame.origin[0] + s.frame.u[0] * uc + s.frame.v[0] * 0.3;
    const tz = s.frame.origin[1] + s.frame.u[1] * uc + s.frame.v[1] * 0.3;
    return (
      <group key={i}>
        <rectAreaLight position={[x, s.y - 0.01, z]} rotation={[-Math.PI / 2, 0, -s.frame.rot]} width={s.u1 - s.u0} height={0.08} intensity={34} color="#ffd9a0" />
        <SpotTo position={[x, s.y - 0.02, z]} target={[tx, s.y - 0.6, tz]} />
      </group>
    );
  });
}

function SpotTo({ position, target }) {
  const light = useRef(null);
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(...target);
    l.target.updateMatrixWorld();
  }, [target]);
  return <spotLight ref={light} position={position} angle={1.15} penumbra={1} intensity={5} distance={1.6} decay={2} color="#ffd29a" />;
}

/**
 * Hauptlicht schräg von vorne links (Fenster). Ziel ist die Raummitte (sonst zielt ein
 * directionalLight auf 0/0/0 = hintere linke Raumecke), die Schattenkamera umschließt
 * nur den Raum: doppelte Texeldichte gegenüber dem alten ±(Raum + 1,5 m)-Würfel, also
 * schärfere Fugen- und Griffschatten bei gleicher Schattenkarte. Bei neuen Raummaßen
 * wird die Schattenkamera neu berechnet (R3F macht das für shadow-camera-* nicht).
 */
function KeyLight({ room, evening, low }) {
  const light = useRef(null);
  const invalidate = useThree((st) => st.invalidate);
  const cx = (room.x0 || 0) + room.w / 2;
  const cz = (room.z0 || 0) + room.d / 2;
  const pos = [cx - room.w * 0.35 - 1.8, 3.8, cz + room.d / 2 + 2.2];
  const half = Math.hypot(room.w, room.d, room.h || 2.6) / 2 + 0.4;
  const dist = Math.hypot(pos[0] - cx, pos[1], pos[2] - cz);
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(cx, 0, cz);
    l.target.updateMatrixWorld();
    const c = l.shadow.camera;
    c.left = c.bottom = -half;
    c.right = c.top = half;
    c.near = Math.max(0.1, dist - half - 0.5);
    c.far = dist + half + 0.5;
    c.updateProjectionMatrix();
    l.shadow.needsUpdate = true;
    invalidate();
  }, [cx, cz, half, dist, invalidate]);
  return (
    <directionalLight
      ref={light}
      castShadow
      position={pos}
      intensity={evening ? 0.35 : 2.1}
      color={evening ? "#c9d4ff" : "#fff1dc"}
      shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
      shadow-bias={-0.0003}
      shadow-normalBias={0.015}
      shadow-radius={low ? 2.5 : 5}
    />
  );
}

/**
 * Ambient Occlusion ab Desktop (P2-5): GTAOPass aus three/examples, danach OutputPass
 * (Tonemapping, sRGB). Übernimmt das Rendern (useFrame-Priorität 1); ohne WebGL2 oder bei
 * einem Fehler rendert es normal weiter.
 */
function AOEffect() {
  const gl = useThree((st) => st.gl);
  const scene = useThree((st) => st.scene);
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  const dpr = useThree((st) => st.viewport.dpr);
  const invalidate = useThree((st) => st.invalidate);
  const composer = useMemo(() => {
    try {
      if (!gl.capabilities?.isWebGL2) return null;
      // Eigenes Render-Target mit MSAA: der Standardpuffer des EffectComposer hat keine
      // Samples – mit AO wären sonst alle Kanten (Fugen, Griffleisten, Plattenkante)
      // treppig, obwohl der Canvas `antialias` anfordert. Die Größe setzt setSize().
      const samples = Math.min(4, gl.capabilities.maxSamples || 4);
      const c = new EffectComposer(gl, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples }));
      c.addPass(new RenderPass(scene, camera));
      const ao = new GTAOPass(scene, camera, 512, 512);
      ao.output = GTAOPass.OUTPUT.Default;
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.4, thickness: 1, distanceFallOff: 1, scale: 1.1, samples: 12, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 });
      c.addPass(ao);
      c.addPass(new OutputPass());
      c.setAOBlend = (v) => {
        ao.blendIntensity = v;
      };
      return c;
    } catch {
      return null;
    }
  }, [gl, scene, camera]);
  useEffect(() => {
    if (!composer) return;
    // MSAA-Puffer (HalfFloat × 4 Samples) sind speicherhungrig → AO-Pfad mit höchstens 1,25×
    composer.setPixelRatio(Math.min(dpr, 1.25));
    composer.setSize(size.width, size.height);
    invalidate();
  }, [composer, size.width, size.height, dpr, invalidate]);
  useEffect(() => () => composer?.dispose(), [composer]);
  const broken = useRef(false);
  // AO nur bei ruhender Kamera: beim Drehen/Zoomen normal rendern (volle Bildrate auch
  // auf Laptops mit Onboard-Grafik), danach blendet die AO in ~5 Bildern weich ein.
  const last = useRef({ p: new THREE.Vector3(Infinity, 0, 0), q: new THREE.Quaternion(), fov: 0 });
  const settle = useRef(0);
  const fade = useRef(0);
  useEffect(() => () => clearTimeout(settle.current), []);
  useFrame(() => {
    const l = last.current;
    const moving = l.p.distanceToSquared(camera.position) > 1e-8 || 1 - Math.abs(l.q.dot(camera.quaternion)) > 1e-9 || l.fov !== camera.fov;
    l.p.copy(camera.position);
    l.q.copy(camera.quaternion);
    l.fov = camera.fov;
    if (moving) {
      fade.current = 0;
      clearTimeout(settle.current);
      settle.current = setTimeout(invalidate, 140);
    } else if (composer && !broken.current) {
      try {
        fade.current = Math.min(1, fade.current + 0.25);
        composer.setAOBlend(0.85 * fade.current);
        composer.render();
        if (fade.current < 1) invalidate();
        return;
      } catch {
        broken.current = true;
      }
    }
    gl.render(scene, camera);
  }, 1);
  return null;
}

/** Meldet "fertig", sobald Texturen geladen und die Küche montiert ist. */
function Ready({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

/**
 * Ladefortschritt der Texturen an den Viewer melden (P2-5). Direkt über den
 * DefaultLoadingManager statt drei/useProgress: dessen Store feuert schon während
 * des Renderns und erzeugt sonst eine React-Warnung.
 */
function useLoadProgress(onProgress) {
  useEffect(() => {
    const m = THREE.DefaultLoadingManager;
    const prev = m.onProgress;
    m.onProgress = (url, loaded, total) => {
      prev?.(url, loaded, total);
      if (total) onProgress?.(Math.round((loaded / total) * 100));
    };
    return () => {
      m.onProgress = prev;
    };
  }, [onProgress]);
}

/** Achsparallele Hülle aller Küchenteile (ohne Pendelleuchten), in m. */
export function kitchenBounds(kitchen, room) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of kitchen.parts) {
    if (p.geom === "pendant" || !p.size || !p.pos) continue;
    const c = Math.abs(Math.cos(p.rot || 0));
    const sn = Math.abs(Math.sin(p.rot || 0));
    const hx = (c * p.size[0] + sn * p.size[2]) / 2;
    const hz = (sn * p.size[0] + c * p.size[2]) / 2;
    const hy = p.size[1] / 2;
    const h = [hx, hy, hz];
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p.pos[i] - h[i]);
      max[i] = Math.max(max[i], p.pos[i] + h[i]);
    }
  }
  if (!Number.isFinite(min[0])) {
    const x0 = room.x0 || 0;
    const z0 = room.z0 || 0;
    return { min: [x0, 0, z0], max: [x0 + room.w, 0.9, z0 + room.d] };
  }
  min[1] = Math.min(min[1], 0);
  return { min, max };
}

/**
 * Kamera, die die ganze Küche zeigt (Fix 1, P1-3): Blick von schräg vorn,
 * Elevation ~35°, Abstand so, dass alle Ecken der Hülle mit ≥ 12 % Rand im Bild
 * liegen – horizontal und vertikal, abhängig vom Seitenverhältnis.
 */
export function fitPose(kitchen, room, plan, aspect, fov = 45, margin = 0.12) {
  const b = kitchenBounds(kitchen, room);
  const c = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  const corners = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) corners.push([x, y, z]);
  const tanV = Math.tan(((fov / 2) * Math.PI) / 180) * (1 - margin);
  const tanH = tanV * Math.max(0.3, aspect);
  const elev = (35 * Math.PI) / 180;
  const lim0 = azimuthLimits(plan);
  const want = plan.shape === "frei" ? 0.5 : 0.42; // leicht von rechts vorn auf die Ecke
  const solve = (az) => {
    const d = [Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev)];
    const f = d.map((v) => -v);
    const r = new THREE.Vector3(...f).cross(new THREE.Vector3(0, 1, 0)).normalize();
    const u = new THREE.Vector3().crossVectors(r, new THREE.Vector3(...f)).normalize();
    let D = 1.5;
    for (const p of corners) {
      const v = new THREE.Vector3(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
      const z = v.dot(new THREE.Vector3(...f));
      D = Math.max(D, Math.abs(v.dot(r)) / tanH - z, Math.abs(v.dot(u)) / tanV - z);
    }
    return { pos: [c[0] + d[0] * D, c[1] + d[1] * D, c[2] + d[2] * D], target: c, D };
  };
  let az = Math.max(lim0.min, Math.min(lim0.max, want));
  let pose = solve(az);
  if (plan.shape !== "frei") {
    // Seitenwände: Grenze hängt vom Abstand ab (wie die Drehgrenze im Orbit)
    const rh = Math.hypot(pose.pos[0] - c[0], pose.pos[2] - c[2]);
    const lim = azimuthLimits(plan, { tx: c[0] - (room.x0 || 0), w: room.w, rh });
    const az2 = Math.max(lim.min, Math.min(lim.max, az));
    if (az2 !== az) {
      az = az2;
      pose = solve(az);
    }
  }
  return { pos: pose.pos, target: pose.target, look: pose.target };
}

/**
 * Draufsicht mit langer Brennweite (28° statt 45°) und entsprechend mehr Abstand: fast
 * wie eine Planzeichnung – Hochschränke „kippen“ nicht nach außen, Fugen bleiben gerade.
 */
const TOP_FOV = 28;
const fovFor = (mode, plan, room) => (mode === "stand" ? standPose(plan, room).fov : mode === "top" ? TOP_FOV : 45);

function cameraPose(mode, room, plan) {
  const cx = (room.x0 || 0) + room.w / 2;
  const z0 = room.z0 || 0;
  if (mode === "top") {
    const H = (Math.max(room.w, room.d) * 1.35 + 1.5) * (Math.tan((45 * Math.PI) / 360) / Math.tan((TOP_FOV * Math.PI) / 360));
    return { pos: [cx, H, z0 + room.d / 2 + 0.001], target: [cx, 0, z0 + room.d / 2] };
  }
  if (mode === "stand") {
    // Augenhöhe, Blick leicht abwärts auf die Rückwand (Regeln in geometry.js → standPose, R5).
    const s = standPose(plan, room);
    return { pos: s.pos, target: s.target, lookAround: true };
  }
  const dist = Math.max(room.w, room.d) * 1.15 + 1.2;
  if (plan.shape === "frei") return { pos: [cx + room.w * 0.35, 3.2, z0 + room.d + dist * 0.55], target: [cx, 0.9, z0 + room.d / 2] };
  return { pos: [cx + room.w * 0.28, 2.5, z0 + Math.max(room.d, 2.5) + dist * 0.55], target: [cx, 0.95, z0 + Math.min(room.d / 2, 1.4)] };
}

/** Pose → Kameraposition und Orbit-Ziel (beim Umsehen liegt das Ziel 5 cm vor dem Auge). */
function resolvePose(pose, aspect, mode) {
  const k = mode === "stand" ? 1 : Math.min(2.2, Math.max(1, 1.25 / aspect));
  const pos = pose.pos.map((p, i) => pose.target[i] + (p - pose.target[i]) * k);
  if (!pose.lookAround) return { pos, target: pose.target, look: pose.target };
  const dir = new THREE.Vector3(...pose.target).sub(new THREE.Vector3(...pose.pos)).normalize();
  const target = new THREE.Vector3(...pose.pos).addScaledVector(dir, 0.05).toArray();
  return { pos: pose.pos, target, look: pose.target };
}

function toJpeg(src, max = MAX_SHOT, q = 0.86) {
  if (src.width > max) {
    const c = document.createElement("canvas");
    c.width = max;
    c.height = Math.round((src.height * max) / src.width);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q);
  }
  return src.toDataURL("image/jpeg", q);
}

/** Weiche Kamerafahrt: langsam an, langsam aus (wie ein Kamerakran, kein Ruck). */
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const MOVE_MS = 750;

function Controls({ mode, room, plan, kitchen, apiRef, wallsRef, reducedMotion, locked = false }) {
  const controls = useRef();
  const get = useThree((st) => st.get);
  const poseKey = `${mode}|${room.w}|${room.d}|${room.h}|${plan.shape}|${plan.island.aisle}|${room.x0}|${room.z0}`;
  const az = azimuthLimits(plan);
  const move = useRef(null);
  const placed = useRef(false);

  /**
   * Kamera zur Pose bringen. Beim ersten Bild und mit „Bewegung reduzieren“ sofort,
   * sonst als Fahrt über MOVE_MS: Position, Blickpunkt und Brennweite gleiten gemeinsam.
   * Während der Fahrt ruht OrbitControls (seine Grenzen gelten für das Ziel, nicht den Weg).
   */
  const goTo = (pose, fov) => {
    const { camera, invalidate } = get();
    const c = controls.current;
    const instant = reducedMotion || !placed.current;
    placed.current = true;
    if (instant) {
      move.current = null;
      camera.position.set(...pose.pos);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      c?.target.set(...pose.target);
      if (c) c.enabled = !locked;
      c?.update();
      invalidate();
      return;
    }
    const to = new THREE.Vector3(...pose.look);
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    const fromLook = camera.position.clone().addScaledVector(fwd, Math.max(0.5, camera.position.distanceTo(to)));
    move.current = { t0: performance.now(), p0: camera.position.clone(), p1: new THREE.Vector3(...pose.pos), l0: fromLook, l1: to, f0: camera.fov, f1: fov, target: pose.target };
    if (c) c.enabled = false;
    invalidate();
  };

  useFrame(({ camera, invalidate }) => {
    const m = move.current;
    if (!m) return;
    if (controls.current) controls.current.enabled = false; // falls `locked` während der Fahrt wechselt
    const k = Math.min(1, (performance.now() - m.t0) / MOVE_MS);
    const e = easeInOutCubic(k);
    camera.position.lerpVectors(m.p0, m.p1, e);
    camera.fov = m.f0 + (m.f1 - m.f0) * e;
    camera.updateProjectionMatrix();
    camera.lookAt(new THREE.Vector3().lerpVectors(m.l0, m.l1, e));
    if (k < 1) {
      invalidate();
      return;
    }
    move.current = null;
    const c = controls.current;
    if (c) {
      c.target.set(...m.target);
      c.enabled = !locked;
      c.update();
    }
    invalidate();
  });

  useEffect(() => {
    const { size } = get();
    const aspect = size.width / Math.max(1, size.height);
    const pose = mode === "orbit" ? fitPose(kitchen, room, plan, aspect) : resolvePose(cameraPose(mode, room, plan), aspect, mode);
    goTo(pose, fovFor(mode, plan, room));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseKey]);

  useEffect(() => {
    apiRef.current = {
      /** Bild für die Anfrage: immer aus der festen Rundum-Kamera, max. 1200 px breit (P2-1, P2-8). */
      capture() {
        const { gl, scene, camera, size } = get();
        const aspect = size.width / Math.max(1, size.height);
        const saved = { pos: camera.position.clone(), quat: camera.quaternion.clone(), fov: camera.fov };
        const hero = fitPose(kitchen, room, plan, aspect);
        camera.position.set(...hero.pos);
        camera.fov = 45;
        camera.updateProjectionMatrix();
        camera.lookAt(...hero.look);
        wallsRef.current?.(camera);
        gl.render(scene, camera);
        const url = toJpeg(gl.domElement);
        camera.position.copy(saved.pos);
        camera.quaternion.copy(saved.quat);
        camera.fov = saved.fov;
        camera.updateProjectionMatrix();
        wallsRef.current?.(camera);
        get().invalidate();
        return url;
      },
      /** Foto der aktuellen Ansicht (so, wie sie gerade gedreht ist), bis 2400 px breit. */
      photo() {
        const { gl, scene, camera } = get();
        wallsRef.current?.(camera);
        gl.render(scene, camera);
        return toJpeg(gl.domElement, 2400, 0.92);
      },
      /** „Einpassen“: zurück zur Gesamtansicht der aktuellen Kamera-Art. */
      fit() {
        const { size } = get();
        const aspect = size.width / Math.max(1, size.height);
        const pose = mode === "orbit" ? fitPose(kitchen, room, plan, aspect) : resolvePose(cameraPose(mode, room, plan), aspect, mode);
        goTo(pose, fovFor(mode, plan, room));
      },
      rotate(dir) {
        const c = controls.current;
        if (!c) return;
        const { minAzimuthAngle: min, maxAzimuthAngle: max } = c;
        c.setAzimuthalAngle(Math.max(min, Math.min(max, c.getAzimuthalAngle() + dir * 0.3)));
        get().invalidate();
      },
      zoom(dir) {
        const c = controls.current;
        if (!c || mode === "stand") return;
        if (dir > 0) c.dollyIn(1.2);
        else c.dollyOut(1.2);
        c.update();
        get().invalidate();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRef, wallsRef, get, mode, room, plan, kitchen, reducedMotion, locked]);

  // R4: Drehgrenze an Seitenwänden hängt vom aktuellen Abstand ab (Zoom, Verschieben)
  // → je Bild neu setzen; liegt die Kamera danach außerhalb, sofort einrasten.
  useFrame(({ invalidate }) => {
    const c = controls.current;
    if (!c || move.current || mode !== "orbit" || plan.shape === "frei") return;
    const o = c.object.position;
    const t = c.target;
    const lim = azimuthLimits(plan, { tx: t.x, w: room.w, rh: Math.hypot(o.x - t.x, o.z - t.z) });
    c.minAzimuthAngle = lim.min;
    c.maxAzimuthAngle = lim.max;
    const th = c.getAzimuthalAngle();
    if (th < lim.min - 1e-3 || th > lim.max + 1e-3) {
      c.update();
      invalidate();
    }
  });

  const stand = mode === "stand";
  const top = mode === "top";
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!locked}
      enableDamping={!reducedMotion}
      enableRotate={!top}
      enablePan={!stand}
      enableZoom={!stand}
      rotateSpeed={stand ? -0.35 : 0.7}
      minDistance={stand ? 0.05 : 1.2}
      maxDistance={stand ? 0.05 : top ? 60 : 18}
      minPolarAngle={top ? 0 : stand ? 0.9 : 0.15}
      maxPolarAngle={top ? 0 : stand ? 2.1 : Math.PI / 2 - 0.04}
      minAzimuthAngle={top ? -Infinity : stand ? (plan.shape === "frei" ? -Infinity : -AZIMUTH) : az.min}
      maxAzimuthAngle={top ? Infinity : stand ? (plan.shape === "frei" ? Infinity : AZIMUTH) : az.max}
      screenSpacePanning={top}
    />
  );
}

/** Mobil/kleine GPU: kleinere Schattenkarte, kein Flächenlicht, niedrigere Pixeldichte. */
const HDR_URL = "/labs/kuechenplaner/hdr/studio_small_09_256.hdr";

/**
 * Tonemapping: Khronos „PBR Neutral“ statt ACES. ACES verschiebt gesättigte Farbtöne und
 * hellt Mitteltöne an – ein Salbeigrün oder Taubenblau-Lack sähe am Bildschirm anders aus
 * als das Muster im Studio. Neutral hält Grundfarben bis ~80 % Helligkeit farbtreu und
 * staucht nur Spitzlichter. Zum Vergleich im Studio: ?tm=aces | agx | neutral.
 */
const TONE = {
  neutral: [THREE.NeutralToneMapping, 0.95],
  aces: [THREE.ACESFilmicToneMapping, 1.02],
  agx: [THREE.AgXToneMapping, 1.15],
};
function toneMapping() {
  let k = "neutral";
  try {
    const q = new URLSearchParams(window.location.search).get("tm");
    if (q && TONE[q]) k = q;
  } catch {
    /* ohne window: Standard */
  }
  return TONE[k];
}

/** Misst die Bildzeit beim Drehen und meldet „zu langsam“ (siehe sceneQuality.js). */
function FrameBudget({ onSlow }) {
  const push = useMemo(() => createFrameBudget(), []);
  useFrame(() => {
    if (push(performance.now())) onSlow();
  });
  return null;
}

/**
 * QM r5 (iPhone/WebKit: Ansicht nach dem Drehen leer): Regelt der Bildzeit-Wächter die Stufe
 * herunter, ändert sich die Pixeldichte – der Canvas wird neu dimensioniert und dabei geleert.
 * Mit frameloop="demand" zeichnete danach niemand neu. Hier: nach jedem Wechsel zwei Bilder anfordern.
 */
function RedrawOnResize({ tier }) {
  const dpr = useThree((st) => st.viewport.dpr);
  const w = useThree((st) => st.size.width);
  const h = useThree((st) => st.size.height);
  const invalidate = useThree((st) => st.invalidate);
  useEffect(() => {
    invalidate();
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [dpr, w, h, tier, invalidate]);
  return null;
}

function startTier() {
  if (typeof window === "undefined") return 2;
  return initialTier({
    coarse: window.matchMedia("(pointer: coarse)").matches,
    width: window.innerWidth,
    cores: navigator.hardwareConcurrency || 8,
    saveData: Boolean(navigator.connection?.saveData),
  });
}

function isLowPower() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}

export default function Scene3D({ plan, kitchen, mode, mood = "tag", apiRef, reducedMotion, onReady, onProgress, onContextLost, locked = false }) {
  const room = kitchen.room;
  const wallsRef = useRef(null);
  const low = useMemo(() => isLowPower(), []);
  // Qualitätsstufe: Pixeldichte, AO und Zusatzlichter regeln bei Ruckeln herunter
  const [tier, setTier] = useState(startTier);
  const q = TIERS[tier];
  const clip = useMemo(() => slopePlane(plan, kitchen.walls), [plan, kitchen.walls]);
  useLoadProgress(onProgress);
  useEffect(() => {
    TEX_KEYS.forEach((k) => useTexture.preload(Object.values(texUrls(k))));
  }, []);
  // Kontaktschatten neu backen, sobald sich ein Teil bewegt oder seine Größe ändert –
  // auch bei Korpus-/Sockelhöhe, Plattenstärke, Inselgang (fehlten im alten Schlüssel).
  // Farb- oder Materialwechsel backen nicht neu (Schatten bleibt gleich).
  const shadowKey = useMemo(() => {
    let h = 2166136261;
    for (const p of kitchen.parts) {
      const s = `${p.id}${p.pos?.map((v) => v.toFixed(3))}${p.size?.map((v) => v.toFixed(3))}`;
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    }
    return (h >>> 0).toString(36);
  }, [kitchen.parts]);
  const evening = mood === "abend";
  const cx = (room.x0 || 0) + room.w / 2;
  const cz = (room.z0 || 0) + room.d / 2;

  return (
    <Canvas
      // Auch mobil PCF statt BasicShadowMap: Basic zeichnet harte Treppenschatten (iPhone!)
      shadows="percentage"
      dpr={q.dpr}
      frameloop="demand"
      camera={{ fov: 45, near: 0.05, far: 60, position: [3, 2.5, 6] }}
      gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false, localClippingEnabled: true }}
      onCreated={({ gl }) => {
        const [tm, exposure] = toneMapping();
        gl.toneMapping = tm;
        gl.toneMappingExposure = exposure;
        gl.localClippingEnabled = true;
        // R2: Kontextverlust (Speicherdruck, GPU-Reset, Tab im Hintergrund) → der Viewer
        // baut die Szene ab und zeigt den Grundriss mit „3D erneut laden“.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
      style={{ touchAction: locked ? "pan-y pinch-zoom" : "none" }}
    >
      <color attach="background" args={[evening ? "#2a2724" : "#ebe6de"]} />
      <hemisphereLight args={["#fff6ea", "#a89a86", evening ? 0.12 : 0.45]} />
      {/* Hauptlicht schräg von vorne links (Fenster), Aufhellung von rechts ohne Schatten */}
      <KeyLight room={room} evening={evening} low={low} />
      <directionalLight position={[cx + room.w / 2 + 3, 2.2, cz + room.d / 2 + 1]} intensity={evening ? 0.12 : 0.45} color="#e9eef5" />
      <Suspense fallback={null}>
        {/* HDR (CC0) als Grundlicht, Lightformer für klare Glanzlichter auf Fronten und Platte */}
        <Environment files={HDR_URL} resolution={low ? 128 : 256} frames={1} environmentIntensity={evening ? 0.32 : 0.95}>
          <Lightformer form="rect" intensity={evening ? 0.5 : 2} position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="rect" intensity={evening ? 0.3 : 1.4} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#fff0dc" />
          <Lightformer form="rect" intensity={evening ? 0.2 : 0.7} position={[5, 2, 3]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer form="rect" intensity={evening ? 0.15 : 0.5} position={[0, 1.5, 6]} scale={[10, 2, 1]} color="#f4ece2" />
        </Environment>
        <Room plan={plan} kitchen={kitchen} wallsRef={wallsRef} clip={clip} />
        <Kitchen plan={plan} kitchen={kitchen} mood={mood} rich={q.pendantLights} />
        {evening && q.areaLights && plan.led && <LedLights kitchen={kitchen} />}
        <ContactShadows
          key={shadowKey}
          frames={1}
          position={[cx, 0.002, cz]}
          scale={[room.w + 1.5, room.d + 1.5]}
          opacity={0.78}
          blur={2.4}
          far={1.2}
          resolution={low ? 256 : 512}
          color="#2a2118"
        />
        <Ready onReady={onReady} />
      </Suspense>
      {/* AO nicht bei Dachschräge: die Clipping-Ebene gilt im AO-Durchgang nicht */}
      {q.ao && !plan.room?.slope?.w && <AOEffect />}
      {tier > 0 && <FrameBudget onSlow={() => setTier((t) => Math.max(0, t - 1))} />}
      <RedrawOnResize tier={tier} />
      <Controls mode={mode} room={room} plan={plan} kitchen={kitchen} apiRef={apiRef} wallsRef={wallsRef} reducedMotion={reducedMotion} locked={locked} />
    </Canvas>
  );
}
