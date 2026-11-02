"use client";
/* eslint-disable react-hooks/immutability -- three.js-Objekte (Kamera, Szene, Nebel, Uniforms)
   und der geteilte Regie-Speicher (store) werden bewusst pro Frame verändert: keine React-Renders beim Scrollen. */
// Kino-Lab „3D-Bühne“ – die WebGL-Szene (nur Client, per next/dynamic ssr:false
// erst nach dem ersten Paint geladen; three.js landet nie im Start-Bundle).
//
// Filmset: ein Möbel im Scheinwerfer auf dunklem Walnuss-Grund, Nebel, Staub
// im Lichtkegel. Der Scrollfortschritt (store.p, von Kino3D geschrieben) steuert
// Kamera (Kapitel mit Schnitten), Modellwechsel (Auflösen/Materialisieren über
// einen Shader-Zusatz), Material und Lichtstimmung „Morgen am See“ → „Abend“.
// Keine React-Renders pro Frame: alles läuft in useFrame über Refs.
//
// Modelle: CC0-Beispielmodelle von Poly Haven (public/labs/ar-viewer/README.md),
// die schon im 3D/AR-Viewer der Website stehen. Kein Herstellermodell.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, SpotLight, useGLTF } from "@react-three/drei";
import { outlineFromPixels } from "./outline";
import { CHAPTERS, PALETTE, chapterAt, clamp, ease, seg } from "./timeline";

const C = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, new THREE.Color(v)]));
const mix = (a, b, t) => a.clone().lerp(b, t);

// Stimmungen (nur Markenfarben, gemischt)
const MOOD = {
  morgen: {
    bg: mix(C.inkDeep, C.see, 0.15),
    key: mix(C.bone, C.paper, 0.5),
    keyI: 150,
    sky: C.see,
    ground: C.walnut,
    hemiI: 0.3,
    rim: mix(C.see, C.bone, 0.35),
    rimI: 1.6,
    keyPos: new THREE.Vector3(-2.2, 4.6, 2.4),
  },
  abend: {
    bg: mix(C.inkDeep, C.walnut, 0.38).multiplyScalar(0.8),
    key: mix(C.brass400, C.paper, 0.32),
    keyI: 120,
    sky: mix(C.inkDeep, C.walnut, 0.5),
    ground: C.walnut,
    hemiI: 0.1,
    rim: C.brass500,
    rimI: 2.2,
    keyPos: new THREE.Vector3(3.0, 2.6, 1.6),
  },
};

// ---------------------------------------------------------------------------
// Auflösen / Materialisieren: Shader-Zusatz für die Original-Materialien.
// Fragmente oberhalb einer (verrauschten) Schwelle über der Modellhöhe werden
// verworfen, an der Kante glimmt ein Messing-Saum – die „Linie wird Volumen“.
function patchDissolve(material, uniforms) {
  if (material.userData.kinoPatched) return material;
  material.userData.kinoPatched = true;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vKinoPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvKinoPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vKinoPos;
uniform float uDis;
uniform float uMinY;
uniform float uMaxY;
uniform vec3 uEdge;
float kinoHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kinoNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(kinoHash(i), kinoHash(i+vec3(1,0,0)), f.x), mix(kinoHash(i+vec3(0,1,0)), kinoHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(kinoHash(i+vec3(0,0,1)), kinoHash(i+vec3(1,0,1)), f.x), mix(kinoHash(i+vec3(0,1,1)), kinoHash(i+vec3(1,1,1)), f.x), f.y), f.z); }`
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
float kinoH = (vKinoPos.y - uMinY) / max(0.001, uMaxY - uMinY);
float kinoN = kinoNoise(vKinoPos * 14.0) * 0.16 + kinoNoise(vKinoPos * 41.0) * 0.06;
float kinoD = uDis * 1.3 - 0.08 - (kinoH + kinoN);
if (kinoD < 0.0) discard;`
      )
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
float kinoE = (1.0 - smoothstep(0.0, 0.035, kinoD)) * (1.0 - step(0.999, uDis));
gl_FragColor.rgb = mix(gl_FragColor.rgb, uEdge * 2.4, kinoE);`
      );
  };
  material.customProgramCacheKey = () => "kino-dissolve";
  material.needsUpdate = true;
  return material;
}

/** KHR_materials_variants: Materialien je Variante vorladen und gepatcht ablegen. */
async function loadVariants(gltf, uniforms) {
  const ext = gltf.userData?.gltfExtensions?.KHR_materials_variants;
  if (!ext) return {};
  const names = ext.variants.map((v) => v.name);
  const table = {};
  const jobs = [];
  gltf.scene.traverse((o) => {
    const meshExt = o.isMesh && o.userData?.gltfExtensions?.KHR_materials_variants;
    if (!meshExt) return;
    if (!o.userData.kinoOriginal) o.userData.kinoOriginal = o.material;
    for (const m of meshExt.mappings) {
      for (const vi of m.variants) {
        jobs.push(
          gltf.parser.getDependency("material", m.material).then((mat) => {
            const clone = mat.clone();
            clone.userData.kinoPatched = false;
            patchDissolve(clone, uniforms);
            (table[names[vi]] ||= []).push([o, clone]);
          })
        );
      }
    }
  });
  await Promise.all(jobs);
  return table;
}

function selectVariant(gltf, table, name) {
  gltf.scene.traverse((o) => {
    if (o.isMesh && o.userData.kinoOriginal) o.material = o.userData.kinoOriginal;
  });
  for (const [mesh, mat] of table[name] || []) mesh.material = mat;
}

function useKinoModel(url) {
  const gltf = useGLTF(url);
  // Uniforms hängen am (gecachten) glTF: ein Remount (Suspense, Strict Mode,
  // Größenwechsel) darf keine neuen Objekte erzeugen, sonst steuert JS andere
  // Uniforms als die, mit denen der Shader einmal kompiliert wurde.
  const uniforms = useMemo(
    () => (gltf.userData.kinoUniforms ||= { uDis: { value: 0 }, uMinY: { value: 0 }, uMaxY: { value: 1 }, uEdge: { value: C.brass400.clone() } }),
    [gltf]
  );
  const [variants, setVariants] = useState(null);
  useMemo(() => {
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.layers.enable(1); // Silhouetten-Pass
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach((m) => {
        patchDissolve(m, uniforms);
        if (m.envMapIntensity !== undefined) m.envMapIntensity = 0.9;
      });
    });
  }, [gltf, uniforms]);
  useEffect(() => {
    let alive = true;
    loadVariants(gltf, uniforms).then((t) => alive && setVariants(t));
    return () => {
      alive = false;
    };
  }, [gltf, uniforms]);
  return { gltf, uniforms, variants };
}

// Sichtbarkeit setzen, ohne Schatten von unsichtbaren Teilen
function applyDissolve(group, uniforms, v) {
  uniforms.uDis.value = v;
  if (!group) return;
  // Höhenbereich in Weltkoordinaten (Gruppe steht fest, dreht nur um die Hochachse)
  if (!group.userData.kinoBox) {
    group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(group, true);
    if (!box.isEmpty()) {
      uniforms.uMinY.value = box.min.y;
      uniforms.uMaxY.value = box.max.y;
      group.userData.kinoBox = true;
    }
  }
  group.visible = v > 0.002;
  const solid = v > 0.97;
  if (group.userData.kinoSolid !== solid) {
    group.userData.kinoSolid = solid;
    group.traverse((o) => {
      if (o.isMesh) o.castShadow = solid;
    });
  }
}

function Sofa({ store, url }) {
  const { gltf, uniforms, variants } = useKinoModel(url);
  const group = useRef(null);
  const variant = useRef("");
  const outlined = useRef(false);
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    store.sofaReady = true;
  }, [store]);

  useFrame(() => {
    const want = store.chapter >= 2 ? "cognac" : "taupe";
    if (variants && variant.current !== want) {
      variant.current = want;
      selectVariant(gltf, variants, want);
    }
    if (group.current) group.current.rotation.y = store.yaw + store.drift;
    applyDissolve(group.current, uniforms, store.vis.sofa);

    // Silhouette einmal nach dem ersten richtig gesetzten Kamerabild
    if (!outlined.current && store.cameraSettled && size.width > 0) {
      outlined.current = true;
      const mh = 220;
      const mw = Math.max(32, Math.round((mh * size.width) / size.height));
      const rt = new THREE.WebGLRenderTarget(mw, mh);
      const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const prev = { bg: scene.background, fog: scene.fog, mask: camera.layers.mask, vis: group.current.visible };
      group.current.visible = true;
      scene.background = new THREE.Color(0x000000);
      scene.fog = null;
      scene.overrideMaterial = white;
      camera.layers.set(1);
      gl.setRenderTarget(rt);
      gl.clear();
      gl.render(scene, camera);
      const buf = new Uint8Array(mw * mh * 4);
      gl.readRenderTargetPixels(rt, 0, 0, mw, mh, buf);
      gl.setRenderTarget(null);
      scene.overrideMaterial = null;
      scene.background = prev.bg;
      scene.fog = prev.fog;
      camera.layers.mask = prev.mask;
      group.current.visible = prev.vis;
      rt.dispose();
      white.dispose();
      const out = outlineFromPixels(buf, mw, mh, size.width, size.height);
      store.onOutline?.(out);
    }
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function Chair({ store, url }) {
  const { uniforms, gltf } = useKinoModel(url);
  const group = useRef(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = store.yaw + store.drift - 0.35;
    applyDissolve(group.current, uniforms, store.vis.chair);
  });
  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

const LAMP_POS = [-0.62, 0.92, -0.45];

function Lamp({ store, url, light }) {
  const { uniforms, gltf, variants } = useKinoModel(url);
  const group = useRef(null);
  const set = useRef(false);
  useFrame(() => {
    if (variants && !set.current) {
      set.current = true;
      selectVariant(gltf, variants, "messing");
    }
    applyDissolve(group.current, uniforms, store.vis.lamp);
    // Glaskugel leuchtet am Abend
    const glow = store.vis.lamp * store.mood;
    gltf.scene.traverse((o) => {
      if (o.isMesh && /glass|globe/i.test(o.material?.name || "") && o.material.emissive) {
        o.material.emissive.copy(C.brass400).lerp(C.paper, 0.45);
        o.material.emissiveIntensity = glow * 1.1;
      }
    });
    if (light.current) light.current.intensity = glow * 6;
  });
  return (
    <group ref={group} position={LAMP_POS}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Walnuss-Boden: prozedurale Maserung (nur Walnut/Ink-deep/Brass gemischt)
function useWalnutTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const g = c.getContext("2d");
    g.fillStyle = PALETTE.walnut;
    g.fillRect(0, 0, 1024, 1024);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // Dielen
    for (let row = 0; row < 8; row++) {
      const y0 = row * 128;
      g.fillStyle = `rgba(31,37,43,${0.05 + rnd() * 0.12})`;
      g.fillRect(0, y0, 1024, 128);
      for (let i = 0; i < 46; i++) {
        const y = y0 + rnd() * 128;
        g.strokeStyle = rnd() > 0.7 ? `rgba(154,122,42,${0.05 + rnd() * 0.07})` : `rgba(31,37,43,${0.12 + rnd() * 0.22})`;
        g.lineWidth = 0.6 + rnd() * 1.8;
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.006 + i) * (2 + rnd() * 5));
        g.stroke();
      }
      g.fillStyle = "rgba(31,37,43,0.55)";
      g.fillRect(0, y0, 1024, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function Floor() {
  const map = useWalnutTexture();
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial map={map} roughness={0.62} metalness={0} envMapIntensity={0.35} />
    </mesh>
  );
}

// Kamera, Licht, Stimmung, Sichtbarkeiten – ein Regisseur pro Frame
function Director({ store, mobile }) {
  const { camera, scene, size } = useThree();
  const key = useRef(null);
  const rim = useRef(null);
  const hemi = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const cur = useRef(null);
  const last = useRef(-1);
  const tmp = useMemo(() => ({ t: new THREE.Vector3(), p: new THREE.Vector3(), bg: new THREE.Color(), col: new THREE.Color() }), []);

  useEffect(() => {
    scene.add(target);
    scene.fog = new THREE.Fog(MOOD.morgen.bg.clone(), 4.6, 13);
    scene.background = MOOD.morgen.bg.clone();
    return () => scene.remove(target);
  }, [scene, target]);

  // Bildausschnitt: Desktop Möbel rechts der Titelkarten, mobil in der oberen Hälfte
  useEffect(() => {
    const W = size.width;
    const H = size.height;
    if (W >= 768) camera.setViewOffset(W, H, -W * 0.14, 0, W, H);
    else camera.setViewOffset(W, H, 0, H * 0.13, W, H);
    camera.updateProjectionMatrix();
    store.cameraSettled = false;
  }, [camera, size, store]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1);
    const now = state.clock.elapsedTime;
    // weicher Fortschritt
    store.sp += (store.p - store.sp) * Math.min(1, d * 5);
    const sp = store.sp;
    const { index, local } = chapterAt(sp);
    store.chapter = index;

    // Intro: Linie → Volumen
    let intro = 0;
    if (store.skipIntro) intro = 1;
    else if (store.matStart) intro = ease(clamp((performance.now() - store.matStart) / 1700));
    store.vis.sofa = intro * (1 - seg(sp, 0.445, 0.475));
    store.vis.chair = seg(sp, 0.485, 0.53);
    store.vis.lamp = seg(sp, 0.66, 0.72);
    store.mood = ease(seg(sp, 0.5, 0.76));

    // Modell drehen: Ziehen/Tastatur (federnd) + langsame Fahrt
    store.yaw += (store.yawTarget - store.yaw) * Math.min(1, d * 7);
    const moving = intro >= 1 && !store.paused;
    store.driftT += moving ? d : 0;
    store.drift = Math.sin(store.driftT * 0.16) * 0.22;

    // Kamera
    const ch = CHAPTERS[index];
    const a = ch.cam[0];
    const b = ch.cam[1];
    const k = ease(local);
    const az = a.az + (b.az - a.az) * k + (moving ? Math.sin(store.driftT * 0.11) * 0.05 : 0);
    const el = a.el + (b.el - a.el) * k;
    const aspect = size.width / Math.max(1, size.height);
    const fit = aspect < 1.2 ? 1 + (1.2 - aspect) * 1.1 : 1; // Hochformat: weiter weg, damit das Möbel ganz im Bild ist
    const dist = (a.d + (b.d - a.d) * k) * fit - (moving ? Math.sin(store.driftT * 0.07) * 0.08 : 0);
    tmp.t.set(a.t[0] + (b.t[0] - a.t[0]) * k, a.t[1] + (b.t[1] - a.t[1]) * k, a.t[2] + (b.t[2] - a.t[2]) * k);
    tmp.p.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(tmp.t);
    const cut = last.current !== index && (ch.cut || CHAPTERS[last.current]?.cut);
    if (!cur.current || cut) {
      cur.current = { p: tmp.p.clone(), t: tmp.t.clone() };
    } else {
      const f = Math.min(1, d * 3.2);
      cur.current.p.lerp(tmp.p, f);
      cur.current.t.lerp(tmp.t, f);
    }
    last.current = index;
    camera.position.copy(cur.current.p);
    camera.lookAt(cur.current.t);
    if (!store.cameraSettled && store.sofaReady && cur.current.p.distanceTo(tmp.p) < 0.002) store.cameraSettled = true;

    // Licht & Stimmung
    const m = store.mood;
    tmp.bg.copy(MOOD.morgen.bg).lerp(MOOD.abend.bg, m);
    scene.background.copy(tmp.bg);
    scene.fog.color.copy(tmp.bg);
    scene.fog.near = dist + 1.4;
    scene.fog.far = dist + 9.5;
    if (key.current) {
      key.current.color.copy(MOOD.morgen.key).lerp(MOOD.abend.key, m);
      // Scheinwerfer „geht an“ mit der Materialisierung
      const on = store.skipIntro ? 1 : 0.25 + 0.75 * (store.matStart ? intro : 0);
      key.current.intensity = (MOOD.morgen.keyI + (MOOD.abend.keyI - MOOD.morgen.keyI) * m) * on;
      key.current.position.copy(MOOD.morgen.keyPos).lerp(MOOD.abend.keyPos, m);
      target.position.set(0, 0.3, 0);
      key.current.target = target;
    }
    if (rim.current) {
      rim.current.color.copy(MOOD.morgen.rim).lerp(MOOD.abend.rim, m);
      rim.current.intensity = MOOD.morgen.rimI + (MOOD.abend.rimI - MOOD.morgen.rimI) * m;
    }
    if (hemi.current) {
      hemi.current.color.copy(MOOD.morgen.sky).lerp(MOOD.abend.sky, m);
      hemi.current.groundColor.copy(MOOD.morgen.ground);
      hemi.current.intensity = MOOD.morgen.hemiI + (MOOD.abend.hemiI - MOOD.morgen.hemiI) * m;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={[PALETTE.see, PALETTE.walnut, 0.55]} />
      <directionalLight ref={rim} position={[1.5, 2.4, -4]} intensity={1.6} />
      {mobile ? (
        <spotLight
          ref={key}
          position={MOOD.morgen.keyPos.toArray()}
          angle={0.36}
          penumbra={0.85}
          decay={2}
          distance={14}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-radius={5}
        />
      ) : (
        <SpotLight
          ref={key}
          position={MOOD.morgen.keyPos.toArray()}
          angle={0.36}
          penumbra={0.85}
          decay={2}
          distance={14}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-radius={6}
          volumetric
          attenuation={6.5}
          anglePower={4}
          opacity={0.3}
          radiusTop={0.05}
          radiusBottom={2.2}
        />
      )}
    </>
  );
}

function Later({ store, children }) {
  // Sessel und Leuchte erst laden, wenn das Intro steht (oder gescrollt wird)
  const [on, setOn] = useState(false);
  useFrame(() => {
    if (!on && (store.skipIntro || store.p > 0.12 || (store.matStart && performance.now() - store.matStart > 2200))) setOn(true);
  });
  return on ? children : null;
}

function Stage({ store, models, mobile }) {
  const lampLight = useRef(null);
  return (
    <>
      <Director store={store} mobile={mobile} />
      <Environment resolution={mobile ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={PALETTE.bone} position={[-3, 4, 3]} scale={[4, 2, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={1.2} color={PALETTE.see} position={[4, 2, -2]} scale={[3, 3, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Lightformer form="ring" intensity={1.4} color={PALETTE.brass400} position={[0, 5, -4]} scale={2} onUpdate={(o) => o.lookAt(0, 0, 0)} />
      </Environment>
      <Floor />
      <Suspense fallback={null}>
        <Sofa store={store} url={models[0].src} />
      </Suspense>
      <Later store={store}>
        <Suspense fallback={null}>
          <Chair store={store} url={models[1].src} />
        </Suspense>
        <Suspense fallback={null}>
          <pointLight ref={lampLight} position={[LAMP_POS[0], LAMP_POS[1] + 0.3, LAMP_POS[2]]} intensity={0} distance={5} decay={2} color={PALETTE.brass400} />
          <Lamp store={store} url={models[2].src} light={lampLight} />
        </Suspense>
      </Later>
      {!mobile && <Sparkles count={70} scale={[3.2, 2.4, 3.2]} position={[0, 1.3, 0]} size={1.6} speed={0.18} opacity={0.5} color={PALETTE.brass400} noise={0.6} />}
    </>
  );
}

export default function Scene({ store, models, mobile, active }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !mobile, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 30, near: 0.1, far: 40, position: [0, 1, 5] }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        store.onCreated?.();
      }}
    >
      <Stage store={store} models={models} mobile={mobile} />
    </Canvas>
  );
}
