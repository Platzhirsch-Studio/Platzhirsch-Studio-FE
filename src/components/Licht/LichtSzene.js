"use client";
/* eslint-disable react-hooks/immutability -- three.js-Objekte (Kamera, Renderer, Szene, Uniforms,
   Materialien) werden absichtlich in Effekten verändert; das ist das R3F-Muster. */
// Bodensee-Licht (N4) – Vorführszene für /de/bodensee-licht: schematische Küche
// mit Fenster bzw. Becken auf der Terrasse, beleuchtet vom echten Sonnenstand.
// Wird nur clientseitig und nur bei WebGL geladen (LichtSeite → next/dynamic).
//
// Licht: <SonnenLicht> (useSonnenlicht.js) – dieselbe Komponente, die
// Küchenplaner, Ezarri-Pool und Portal-Planung einbauen. Himmel: physikalisches
// Himmelsmodell (Preetham, three.js Sky.js, MIT) mit derselben Sonnenrichtung;
// daraus per PMREM die Umgebungsbeleuchtung (kein Foto, keine KI). Solange kein
// eigenes Lochau-HDRI vorliegt (szene.js LOCHAU_HDRI), ist das ehrlicher als das
// CC0-Studio-HDR, dessen feste Studiolichter einer wandernden Sonne widersprächen.
// Materialien: CC0-Texturen von ambientCG (Küchenplaner), Mosaik im Browser erzeugt.
// R5 neuland P1-4 (Poster wirkte wie ein Rohbau: braune Wände, schwarze Flächen,
// Kegel-Leuchten): Kalkputz (im Browser erzeugte Körnung), helle Lackfronten,
// Eiche, Leinen an Hockern und Leuchtenschirmen, gebürsteter Stahl statt Schwarz,
// draußen Wiese, See und Bergkette statt einer grünen Fläche bis zum Horizont.
// Innen etwas offener belichtet (Wände werfen Licht zurück).
//
// Leistung: frameloop="demand" – es wird nur nach einer Änderung gerendert.
// Mobil: Schattenkarte 1024², DPR ≤ 1,5, keine Antialias-Supersampling.
import { Component, forwardRef, Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { lichtWerte } from "@/lib/licht/himmel";
import { fensterSonne } from "@/lib/licht/sonne";
import { richtungInSzene, TEXTUR_BASIS } from "@/lib/licht/szene";
import { sonneVon } from "@/lib/licht/zustand";
import { SonnenLicht } from "./useSonnenlicht";

// Raummaße (m): Fensterwand bei z = −2,5, Fenster 2,0 × 1,2 m, Brüstung 0,9 m
const RAUM = { b: 5.2, t: 5, h: 2.6, wand: 0.2 };
const FENSTER = { x: -0.4, b: 2.0, bruestung: 0.9, sturz: 2.1 };

// Innen kommt Himmelslicht nur durchs Fenster: Umgebung und Himmel gedämpft.
const BASIS_INNEN = { himmelMax: 0.85, himmelNacht: 0.03, hdriMax: 0.35, hdriNacht: 0.03 };
const BASIS_AUSSEN = { himmelMax: 0.7, hdriMax: 0.9 };

const KAMERAS = {
  kueche: {
    // R2 neuland P1-4: Blick etwas tiefer und enger – die helle Decke füllte oben ein leeres Band
    raum: { pos: [1.9, 1.5, 2.25], ziel: [-0.55, 0.62, -1.6], fov: 52 },
    // „In den Raum“: vom Fenster aus, damit man sieht, wo der Lichtfleck liegt
    fenster: { pos: [-2.1, 1.85, -2.0], ziel: [0.9, 0.2, 1.3], fov: 62 },
  },
  pool: {
    raum: { pos: [3.6, 3.1, 6.4], ziel: [0, -0.2, -0.6], fov: 50 },
    fenster: { pos: [0, 1.4, 4.6], ziel: [0, 0.2, -4], fov: 58 },
  },
};

const OHNE = {};

/** Fällt eine Textur aus (Netz, Zeitüberschreitung), bleibt die Szene mit Grundfarben stehen. */
class TexturGrenze extends Component {
  constructor(props) {
    super(props);
    this.state = { fehler: false };
  }
  static getDerivedStateFromError() {
    return { fehler: true };
  }
  render() {
    return this.state.fehler ? this.props.ersatz : this.props.children;
  }
}

function useCC0(key, wiederholung = 1) {
  const tex = useTexture({ map: `${TEXTUR_BASIS}/${key}/color.jpg`, normalMap: `${TEXTUR_BASIS}/${key}/normal.jpg`, roughnessMap: `${TEXTUR_BASIS}/${key}/roughness.jpg` });
  useLayoutEffect(() => {
    for (const [k, t] of Object.entries(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(wiederholung, wiederholung);
      t.anisotropy = 4;
      t.colorSpace = k === "map" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
    }
  }, [tex, wiederholung]);
  return tex;
}

/** Glasmosaik 2,5 cm im Browser erzeugt (kein Herstellermuster). */
let mosaikCache = null;
function mosaikTextur() {
  if (mosaikCache || typeof document === "undefined") return mosaikCache;
  const N = 512;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9dcd6";
  ctx.fillRect(0, 0, N, N);
  const farben = ["#2f7f86", "#3a8e93", "#2a6f7a", "#4b9ea0", "#5aa9a6", "#236770", "#7fbcb7"];
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = 16;
  const s = N / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = farben[Math.floor(rnd() * farben.length)];
      ctx.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  mosaikCache = t;
  return t;
}

/** Kalkputz: feine, unregelmäßige Körnung (Farbe ± 3 %, im Browser erzeugt). */
let putzCache = null;
function putzTextur() {
  if (putzCache || typeof document === "undefined") return putzCache;
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(N, N);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N * N; i++) {
    const v = 238 + Math.round((rnd() + rnd() + rnd() - 1.5) * 9);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v - 2;
    img.data[i * 4 + 2] = v - 6;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // weiche Wolken (Kellenschlag)
  for (let k = 0; k < 40; k++) {
    const g = ctx.createRadialGradient(rnd() * N, rnd() * N, 0, rnd() * N, rnd() * N, 20 + rnd() * 60);
    g.addColorStop(0, `rgba(255,252,246,${(0.05 + rnd() * 0.06).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,252,246,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, N, N);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  putzCache = t;
  return t;
}

/** Leinen: Leinwandbindung mit Flammengarn (im Browser erzeugt). */
let leinenCache = null;
function leinenTextur() {
  if (leinenCache || typeof document === "undefined") return leinenCache;
  const N = 128;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9d0c2";
  ctx.fillRect(0, 0, N, N);
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i += 2) {
    ctx.fillStyle = `rgba(120,105,85,${(0.08 + rnd() * 0.1).toFixed(3)})`;
    ctx.fillRect(0, i, N, 1);
    ctx.fillStyle = `rgba(255,250,240,${(0.06 + rnd() * 0.08).toFixed(3)})`;
    ctx.fillRect(i, 0, 1, N);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  leinenCache = t;
  return t;
}

/**
 * Seeblick: Uferwiese, See bis zum Horizont und eine dunstige Bergkette
 * (schematisch, kein Abbild eines bestimmten Panoramas). y0 = Höhe der Wiese.
 */
function Seeblick({ y0 = -0.12, ufer = -14 }) {
  const m = useMemo(
    () => ({
      wiese: new THREE.MeshStandardMaterial({ color: "#8a9670", roughness: 1 }),
      see: new THREE.MeshStandardMaterial({ color: "#8fb0bc", roughness: 0.22, metalness: 0.05 }),
      fern: new THREE.MeshBasicMaterial({ color: "#a9b7c4" }),
      nah: new THREE.MeshBasicMaterial({ color: "#97a8b6" }),
    }),
    [],
  );
  const berge = useMemo(() => {
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = [];
    for (let i = 0; i < 14; i++) out.push({ x: -1900 + i * 290 + rnd() * 120, z: -2300 - rnd() * 300, r: 260 + rnd() * 220, h: 160 + rnd() * 230, fern: true });
    for (let i = 0; i < 9; i++) out.push({ x: -1500 + i * 360 + rnd() * 160, z: -1700 - rnd() * 200, r: 230 + rnd() * 160, h: 90 + rnd() * 120, fern: false });
    return out;
  }, []);
  const tiefe = Math.abs(ufer) - 2.6;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y0, -2.6 - tiefe / 2]} material={m.wiese} receiveShadow>
        <planeGeometry args={[400, tiefe]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y0 - 1.2, ufer - 1500]} material={m.see}>
        <planeGeometry args={[6000, 3000]} />
      </mesh>
      {berge.map((b, i) => (
        <mesh key={i} position={[b.x, y0 - 1.2 + b.h / 2, b.z]} material={b.fern ? m.fern : m.nah}>
          <coneGeometry args={[b.r, b.h, 5, 1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Himmel (Preetham) als Hintergrund und als Umgebungslicht (PMREM). */
function Himmel({ richtung, hoehe }) {
  const { gl, scene, invalidate } = useThree();
  // Zwei Instanzen: eine sichtbar in der Szene, eine nur für die PMREM-Umgebung
  // (ein Object3D kann nur in einer Szene hängen).
  const [sky, skyEnv] = useMemo(() => {
    const a = new Sky();
    a.scale.setScalar(4000);
    const b = new Sky();
    b.scale.setScalar(4000);
    b.material = a.material;
    return [a, b];
  }, []);
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);
  const envScene = useMemo(() => {
    const sc = new THREE.Scene();
    sc.add(skyEnv);
    return sc;
  }, [skyEnv]);
  const ziel = useRef(null);

  useEffect(() => {
    const u = sky.material.uniforms;
    // Etwas Dunst über dem See: höhere Trübung als Alpenhimmel
    u.turbidity.value = 7;
    u.rayleigh.value = hoehe < 2 ? 2.4 : 1.6;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.82;
    u.sunPosition.value.set(richtung[0], richtung[1], richtung[2]);
    // Umgebung neu berechnen (einmal pro Änderung, im nächsten Frame gebündelt)
    const raf = requestAnimationFrame(() => {
      const neu = pmrem.fromScene(envScene, 0, 1, 5000);
      // R7-P4 (R2 neuland P1-4): PMREM hinterlässt einen eigenen Viewport – danach
      // wieder die volle Leinwand, sonst bleibt oben ein leeres Band.
      const v = gl.getSize(new THREE.Vector2());
      gl.setRenderTarget(null);
      gl.setViewport(0, 0, v.x, v.y);
      gl.setScissor(0, 0, v.x, v.y);
      ziel.current?.dispose();
      ziel.current = neu;
      scene.environment = neu.texture;
      invalidate();
    });
    invalidate();
    return () => cancelAnimationFrame(raf);
  }, [sky, richtung, hoehe, pmrem, envScene, scene, invalidate, gl]);

  useEffect(
    () => () => {
      ziel.current?.dispose();
      pmrem.dispose();
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [pmrem, sky],
  );
  return <primitive object={sky} />;
}

function Box({ args, position, material, schatten = true, empfaengt = true, rotation }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={schatten} receiveShadow={empfaengt} material={material}>
      <boxGeometry args={args} />
    </mesh>
  );
}

function KuecheMitTexturen(props) {
  const boden = useCC0("boden", 3);
  const marmor = useCC0("marmor", 1);
  const nuss = useCC0("holz", 1); // Eiche (Wood049) statt Nussbaum: heller, ruhiger
  const tex = useMemo(() => ({ boden, marmor, nuss }), [boden, marmor, nuss]);
  return <Kueche {...props} tex={tex} />;
}

function Kueche({ kunstlicht, tex = OHNE }) {
  const { boden = {}, marmor = {}, nuss = {} } = tex;
  const m = useMemo(() => {
    const putz = putzTextur();
    const leinen = leinenTextur();
    const wand = new THREE.MeshStandardMaterial({ map: putz, color: "#fbf8f2", roughness: 0.94 });
    return {
      wand,
      decke: new THREE.MeshStandardMaterial({ map: putz, color: "#ffffff", roughness: 0.96 }),
      boden: new THREE.MeshStandardMaterial({ ...boden, roughness: 0.62, color: "#fff6ea" }),
      stein: new THREE.MeshPhysicalMaterial({ ...marmor, roughness: 0.28, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
      front: new THREE.MeshStandardMaterial({ color: "#e4ded4", roughness: 0.5 }),
      lack: new THREE.MeshStandardMaterial({ color: "#ebe6de", roughness: 0.45 }),
      holz: new THREE.MeshStandardMaterial({ ...nuss, roughness: 0.6, color: nuss.map ? "#fff4e6" : "#b08a64" }),
      rahmen: new THREE.MeshStandardMaterial({ color: "#3a4047", roughness: 0.45, metalness: 0.35 }),
      stahl: new THREE.MeshStandardMaterial({ color: "#a7abaf", roughness: 0.32, metalness: 0.75 }),
      stoff: new THREE.MeshPhysicalMaterial({ map: leinen, color: "#efe8dc", roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color("#fff6e8"), sheenRoughness: 0.8 }),
      sockel: new THREE.MeshStandardMaterial({ color: "#6d645b", roughness: 0.8 }),
      keramik: new THREE.MeshStandardMaterial({ color: "#f7f5f1", roughness: 0.35 }),
      schirm: new THREE.MeshPhysicalMaterial({ map: leinen, color: "#f4efe6", roughness: 0.9, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color("#fff6e8"), emissive: "#ffd9a0", emissiveIntensity: 0 }),
      birne: new THREE.MeshStandardMaterial({ color: "#fff3df", emissive: "#ffcf8a", emissiveIntensity: 0 }),
    };
  }, [boden, marmor, nuss]);
  useEffect(() => {
    m.birne.emissiveIntensity = kunstlicht * 3;
    m.schirm.emissiveIntensity = kunstlicht * 0.35; // Leinen leuchtet abends warm durch
  }, [m, kunstlicht]);

  const { b, t, h, wand } = RAUM;
  const z0 = -t / 2; // Fensterwand (Innenseite)
  const fx0 = FENSTER.x - FENSTER.b / 2;
  const fx1 = FENSTER.x + FENSTER.b / 2;
  const links = fx0 + b / 2; // Breite Wandstück links vom Fenster
  const rechts = b / 2 - fx1;
  return (
    <group>
      {/* Boden, Decke */}
      <Box args={[b, 0.1, t]} position={[0, -0.05, 0]} material={m.boden} schatten={false} />
      <Box args={[b + 2 * wand, wand, t + 2 * wand]} position={[0, h + wand / 2, 0]} material={m.decke} />
      {/* Fensterwand mit Öffnung */}
      <Box args={[links, h, wand]} position={[-b / 2 + links / 2, h / 2, z0 - wand / 2]} material={m.wand} />
      <Box args={[rechts, h, wand]} position={[b / 2 - rechts / 2, h / 2, z0 - wand / 2]} material={m.wand} />
      <Box args={[FENSTER.b, FENSTER.bruestung, wand]} position={[FENSTER.x, FENSTER.bruestung / 2, z0 - wand / 2]} material={m.wand} />
      <Box args={[FENSTER.b, h - FENSTER.sturz, wand]} position={[FENSTER.x, (h + FENSTER.sturz) / 2, z0 - wand / 2]} material={m.wand} />
      {/* Fensterrahmen und Sprosse */}
      <Box args={[FENSTER.b, 0.05, 0.08]} position={[FENSTER.x, FENSTER.bruestung + 0.025, z0 - 0.1]} material={m.rahmen} />
      <Box args={[FENSTER.b, 0.05, 0.08]} position={[FENSTER.x, FENSTER.sturz - 0.025, z0 - 0.1]} material={m.rahmen} />
      <Box args={[0.05, FENSTER.sturz - FENSTER.bruestung, 0.08]} position={[fx0 + 0.025, (FENSTER.bruestung + FENSTER.sturz) / 2, z0 - 0.1]} material={m.rahmen} />
      <Box args={[0.05, FENSTER.sturz - FENSTER.bruestung, 0.08]} position={[fx1 - 0.025, (FENSTER.bruestung + FENSTER.sturz) / 2, z0 - 0.1]} material={m.rahmen} />
      <Box args={[0.04, FENSTER.sturz - FENSTER.bruestung, 0.06]} position={[FENSTER.x, (FENSTER.bruestung + FENSTER.sturz) / 2, z0 - 0.1]} material={m.rahmen} />
      {/* Seitenwände und Rückwand */}
      <Box args={[wand, h, t]} position={[-b / 2 - wand / 2, h / 2, 0]} material={m.wand} />
      <Box args={[wand, h, t]} position={[b / 2 + wand / 2, h / 2, 0]} material={m.wand} />
      <Box args={[b + 2 * wand, h, wand]} position={[0, h / 2, t / 2 + wand / 2]} material={m.wand} />
      {/* Küchenzeile an der linken Wand */}
      <Box args={[0.62, 0.1, 3.0]} position={[-b / 2 + 0.31, 0.05, -0.4]} material={m.sockel} />
      <Box args={[0.6, 0.78, 3.0]} position={[-b / 2 + 0.3, 0.49, -0.4]} material={m.holz} />
      <Box args={[0.64, 0.03, 3.02]} position={[-b / 2 + 0.32, 0.895, -0.4]} material={m.stein} />
      <Box args={[0.36, 0.9, 1.6]} position={[-b / 2 + 0.18, 1.95, 0.3]} material={m.lack} />
      {/* Insel */}
      <Box args={[2.2, 0.1, 0.9]} position={[0.35, 0.05, 0.1]} material={m.sockel} />
      <Box args={[2.2, 0.8, 0.9]} position={[0.35, 0.5, 0.1]} material={m.front} />
      <Box args={[2.4, 0.04, 1.05]} position={[0.35, 0.92, 0.1]} material={m.stein} />
      {/* Schale und Vase auf der Insel – für sichtbare Schatten */}
      <mesh position={[0.0, 1.0, 0.2]} castShadow receiveShadow material={m.keramik}>
        <cylinderGeometry args={[0.07, 0.09, 0.3, 32]} />
      </mesh>
      <mesh position={[0.7, 0.97, 0.05]} castShadow receiveShadow material={m.keramik} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Hocker */}
      {[-0.15, 0.85].map((x) => (
        <group key={x} position={[x, 0, 0.95]}>
          <mesh position={[0, 0.67, 0]} castShadow receiveShadow material={m.stoff}>
            <cylinderGeometry args={[0.19, 0.18, 0.07, 32]} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow material={m.stahl}>
            <cylinderGeometry args={[0.02, 0.025, 0.64, 12]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} castShadow receiveShadow material={m.stahl}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
          </mesh>
        </group>
      ))}
      {/* Pendelleuchten (Kunstlicht 2.700 K, wenn es dunkel ist) */}
      {[-0.2, 0.9].map((x) => (
        <group key={x} position={[x, 1.75, 0.1]}>
          <mesh position={[0, 0.42, 0]} material={m.rahmen}>
            <cylinderGeometry args={[0.004, 0.004, 0.85, 6]} />
          </mesh>
          <mesh material={m.schirm} castShadow>
            <cylinderGeometry args={[0.15, 0.17, 0.24, 40, 1, true]} />
          </mesh>
          <mesh position={[0, 0.12, 0]} material={m.schirm}>
            <cylinderGeometry args={[0.03, 0.15, 0.02, 40, 1, true]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={m.birne}>
            <sphereGeometry args={[0.05, 16, 8]} />
          </mesh>
          <pointLight position={[0, -0.12, 0]} color="#ffc98a" intensity={kunstlicht * 2.2} distance={4.5} decay={2} visible={kunstlicht > 0.01} />
        </group>
      ))}
      {/* Draußen: Uferwiese, See und Berge */}
      <Seeblick y0={-0.12} ufer={-16} />
    </group>
  );
}

function PoolMitTexturen(props) {
  const stein = useCC0("quarz", 5);
  const holz = useCC0("holz", 2);
  const tex = useMemo(() => ({ stein, holz }), [stein, holz]);
  return <Pool {...props} tex={tex} />;
}

function Pool({ kunstlicht, tex = OHNE }) {
  const { stein = {}, holz = {} } = tex;
  const mosaik = useMemo(() => {
    const t = mosaikTextur();
    if (t) t.repeat.set(4, 4);
    return t;
  }, []);
  const m = useMemo(
    () => ({
      terrasse: new THREE.MeshStandardMaterial({ ...stein, color: "#efe9df", roughness: 0.85 }),
      mosaik: new THREE.MeshStandardMaterial({ map: mosaik, roughness: 0.18, metalness: 0.05 }),
      wasser: new THREE.MeshPhysicalMaterial({ color: "#6fb5b8", roughness: 0.04, metalness: 0, transmission: 0, transparent: true, opacity: 0.42, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false }),
      mauer: new THREE.MeshStandardMaterial({ map: putzTextur(), color: "#f1ece3", roughness: 0.92 }),
      holz: new THREE.MeshStandardMaterial({ ...holz, roughness: 0.6, ...(holz.map ? { color: "#fff4e6" } : { color: "#a8835e" }) }),
      polster: new THREE.MeshPhysicalMaterial({ map: leinenTextur(), color: "#e9e3d8", roughness: 0.95, sheen: 0.5, sheenColor: new THREE.Color("#fff6e8") }),
      rand: new THREE.MeshStandardMaterial({ color: "#ece8e1", roughness: 0.6 }),
    }),
    [stein, holz, mosaik],
  );
  // Becken 6 × 3 m, 1,4 m tief, Oberkante 0
  const B = 6;
  const T = 3;
  const D = 1.4;
  const w = 0.25;
  return (
    <group>
      {/* Terrasse rund ums Becken (vier Platten) */}
      <Box args={[14, 0.2, 5]} position={[0, -0.1, -T / 2 - 2.5]} material={m.terrasse} schatten={false} />
      <Box args={[14, 0.2, 5]} position={[0, -0.1, T / 2 + 2.5]} material={m.terrasse} schatten={false} />
      <Box args={[4, 0.2, T]} position={[-B / 2 - 2, -0.1, 0]} material={m.terrasse} schatten={false} />
      <Box args={[4, 0.2, T]} position={[B / 2 + 2, -0.1, 0]} material={m.terrasse} schatten={false} />
      {/* Beckenrand */}
      <Box args={[B + 0.5, 0.05, 0.3]} position={[0, 0.025, -T / 2 - 0.15]} material={m.rand} />
      <Box args={[B + 0.5, 0.05, 0.3]} position={[0, 0.025, T / 2 + 0.15]} material={m.rand} />
      <Box args={[0.3, 0.05, T]} position={[-B / 2 - 0.15, 0.025, 0]} material={m.rand} />
      <Box args={[0.3, 0.05, T]} position={[B / 2 + 0.15, 0.025, 0]} material={m.rand} />
      {/* Beckenwände und Boden mit Mosaik */}
      <Box args={[B, 0.1, T]} position={[0, -D - 0.05, 0]} material={m.mosaik} schatten={false} />
      <Box args={[B, D, w]} position={[0, -D / 2, -T / 2 - w / 2]} material={m.mosaik} />
      <Box args={[B, D, w]} position={[0, -D / 2, T / 2 + w / 2]} material={m.mosaik} />
      <Box args={[w, D, T]} position={[-B / 2 - w / 2, -D / 2, 0]} material={m.mosaik} />
      <Box args={[w, D, T]} position={[B / 2 + w / 2, -D / 2, 0]} material={m.mosaik} />
      {/* Wasser */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} material={m.wasser} receiveShadow>
        <planeGeometry args={[B, T]} />
      </mesh>
      {/* Gartenmauer links und Pergola rechts – werfen Schatten */}
      <Box args={[0.3, 2.0, 7]} position={[-7, 1.0, -0.5]} material={m.mauer} />
      <group position={[5.6, 0, -2.6]}>
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} args={[0.12, 2.4, 0.12]} position={[x, 1.2, z]} material={m.holz} />
        ))}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((z) => (
          <Box key={z} args={[2.3, 0.08, 0.1]} position={[0, 2.44, z]} material={m.holz} />
        ))}
      </group>
      {/* Liege */}
      <Box args={[0.7, 0.28, 1.9]} position={[-4.2, 0.14, 2.6]} material={m.holz} />
      <Box args={[0.66, 0.09, 1.84]} position={[-4.2, 0.325, 2.6]} material={m.polster} />
      {/* Abendlicht am Becken */}
      <pointLight position={[-6.7, 1.6, -0.5]} color="#ffc98a" intensity={kunstlicht * 6} distance={10} decay={2} visible={kunstlicht > 0.01} />
      <pointLight position={[0, -1.2, 0]} color="#bfe6ff" intensity={kunstlicht * 4} distance={6} decay={2} visible={kunstlicht > 0.01} />
      <Seeblick y0={-0.21} ufer={-12} />
    </group>
  );
}

/**
 * Innenraum: Himmelslicht kommt durchs Fenster und wird von hellen Wänden
 * zurückgeworfen – im Raum wirkt es neutral-warm, nicht himmelblau. Dazu ein
 * Rückstrahl-Anteil der Sonne, wenn sie gerade hereinscheint (Näherung ohne GI).
 */
function Innenlicht({ licht, sonneImRaum }) {
  const himmel = useMemo(() => new THREE.Color(licht.himmel.oben).lerp(new THREE.Color("#efe5d6"), 0.8), [licht.himmel.oben]);
  const rueck = useMemo(() => new THREE.Color(licht.sonne.farbe), [licht.sonne.farbe]);
  return (
    <>
      <hemisphereLight color={himmel} groundColor="#d9cbb6" intensity={licht.himmel.intensitaet * 2.1} />
      <ambientLight color={rueck} intensity={licht.sonne.staerke * (sonneImRaum ? 0.55 : 0.2)} />
    </>
  );
}

function Kamera({ szene, blick }) {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    const k = KAMERAS[szene][blick] || KAMERAS[szene].raum;
    camera.position.set(...k.pos);
    camera.fov = k.fov;
    camera.near = 0.05;
    camera.far = 8000;
    camera.lookAt(...k.ziel);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, szene, blick, invalidate]);
  return null;
}

/** Belichtung: tagsüber ruhig, nachts etwas offener, damit Kunstlicht trägt. */
function Belichtung({ hoehe, innen }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    // Innen öffnet das Auge weiter als draußen (wie eine Kamera mit Belichtungsautomatik).
    const basis = innen ? 1.0 : 0.72;
    gl.toneMappingExposure = hoehe > 0 ? basis : basis + Math.min(0.45, -hoehe / 20);
    invalidate();
  }, [gl, hoehe, innen, invalidate]);
  return null;
}

const API = forwardRef(function API(_, ref) {
  const { gl, scene, camera } = useThree();
  useImperativeHandle(ref, () => ({
    /** Standbild der aktuellen Ansicht (JPEG-Data-URL) fürs Lichtblatt. */
    standbild(breite = 1200) {
      const vorher = gl.getPixelRatio();
      const w = gl.domElement.clientWidth || 800;
      gl.setPixelRatio(Math.min(2, breite / w));
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/jpeg", 0.86);
      gl.setPixelRatio(vorher);
      gl.render(scene, camera);
      return url;
    },
  }));
  return null;
});

// Fix-Runde 1 (F2): Am Desktop blieb oben ein leeres Band, bis einmal gescrollt
// wurde – die erste Messung der Leinwand fiel vor das endgültige Layout
// (Schriften, Hydration). Nach dem Start, nach dem Laden der Schriften und bei
// Größenänderungen neu messen (react-use-measure hört auf resize) und neu rendern.
// R7-P4 (R2 neuland P1-4): Das Band blieb trotzdem – die WebGL-Viewport-Höhe stammte
// aus der ersten Messung (mobil max-h-[44svh] ≈ 392 px), die Leinwand war danach 548 px
// hoch; WebGL zeichnet von unten, oben blieb ein leerer Streifen. Darum die Größe aus
// dem Rahmen direkt an R3F geben (setSize setzt Puffer, Viewport und Kamera-Aspekt).
// R3 neuland P1-5 (heller Streifen oben): sofort einmal messen und erst danach
// „bereit“ melden – bis dahin deckt die Ladefläche (bg-stone) die Leinwand ab, ein
// halb gezeichneter Puffer aus der ersten Messung ist so nie zu sehen.
function Nachmessen({ onBereit }) {
  const { gl, invalidate } = useThree();
  const setSize = useThree((s) => s.setSize);
  const bereitRef = useRef(onBereit);
  useEffect(() => {
    bereitRef.current = onBereit;
  }, [onBereit]);
  useEffect(() => {
    const neu = () => {
      const el = gl.domElement.parentElement;
      if (el && el.clientWidth && el.clientHeight) setSize(el.clientWidth, el.clientHeight);
      window.dispatchEvent(new Event("resize"));
      invalidate();
    };
    neu();
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => bereitRef.current?.());
    });
    const t = [120, 600, 1500].map((ms) => setTimeout(neu, ms));
    document.fonts?.ready?.then(neu).catch(() => {});
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(neu) : null;
    if (ro && gl.domElement.parentElement) ro.observe(gl.domElement.parentElement);
    return () => {
      cancelAnimationFrame(raf);
      t.forEach(clearTimeout);
      ro?.disconnect();
    };
  }, [gl, invalidate, setSize]);
  return null;
}

/**
 * Props: zustand, blick ("raum" | "fenster"), mobil, onFehler(), apiRef
 */
export default function LichtSzene({ zustand, blick = "raum", mobil = false, onFehler, apiRef, onBereit }) {
  const sonne = useMemo(() => sonneVon(zustand), [zustand]);
  const licht = useMemo(() => lichtWerte(sonne.hoehe), [sonne.hoehe]);
  const lichtInnen = useMemo(() => lichtWerte(sonne.hoehe, BASIS_INNEN), [sonne.hoehe]);
  const richtung = useMemo(() => richtungInSzene(sonne.azimut, sonne.hoehe, zustand.fenster), [sonne, zustand.fenster]);
  const szene = zustand.szene === "pool" ? "pool" : "kueche";
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={mobil ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !mobil, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      camera={{ fov: 55, near: 0.05, far: 8000, position: [2, 1.6, 2.4] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFehler?.();
        });
      }}
      aria-hidden="true"
      data-licht-canvas=""
    >
      <Nachmessen onBereit={onBereit} />
      <Kamera szene={szene} blick={blick} />
      <Belichtung hoehe={sonne.hoehe} innen={szene === "kueche"} />
      <Himmel richtung={richtung} hoehe={sonne.hoehe} />
      {szene === "kueche" ? <Innenlicht licht={lichtInnen} sonneImRaum={fensterSonne(sonne, { azimut: zustand.fenster }).scheint} /> : (
        // R5: Rückstrahlung von Terrasse und Wand, damit Schattenseiten nicht schwarz werden
        <hemisphereLight color="#e3ebf2" groundColor="#d6cab8" intensity={licht.himmel.intensitaet * 0.9} />
      )}
      <SonnenLicht zustand={zustand} himmel={szene !== "kueche"} basis={szene === "pool" ? BASIS_AUSSEN : BASIS_INNEN} ziel={szene === "pool" ? [0, 0, 0] : [0, 0.8, 0]} bereich={szene === "pool" ? 9 : 4.2} abstand={szene === "pool" ? 40 : 25} mobil={mobil} />
      <TexturGrenze key={szene} ersatz={szene === "pool" ? <Pool kunstlicht={licht.kunstlicht.intensitaet} /> : <Kueche kunstlicht={licht.kunstlicht.intensitaet} />}>
        <Suspense fallback={szene === "pool" ? <Pool kunstlicht={licht.kunstlicht.intensitaet} /> : <Kueche kunstlicht={licht.kunstlicht.intensitaet} />}>
          {szene === "pool" ? <PoolMitTexturen kunstlicht={licht.kunstlicht.intensitaet} /> : <KuecheMitTexturen kunstlicht={licht.kunstlicht.intensitaet} />}
        </Suspense>
      </TexturGrenze>
      <API ref={apiRef} />
    </Canvas>
  );
}
