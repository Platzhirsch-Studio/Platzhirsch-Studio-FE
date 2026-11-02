"use client";
/* eslint-disable react-hooks/immutability, react-hooks/refs -- three.js-Objekte (Uniforms,
   Kamera, Controls, Materialien) sind absichtlich veränderlich und leben außerhalb
   des React-Zustands; gerendert wird per frameloop "demand" (wie Yacht/Stage3D.js). */
// Ezarri-Konfigurator – 3D-Bühne (React Three Fiber). Wird nur per next/dynamic
// (ssr: false) geladen; three/R3F liegen ausschließlich in diesem Chunk.
//
// - frameloop "demand": gezeichnet wird nur bei Änderung; „Wasser bewegt“ treibt
//   30 Bilder/s, nur solange die Bühne sichtbar und der Tab im Vordergrund ist
//   und keine reduzierte Bewegung gewünscht ist.
// - fester dpr (Touch 1,25, sonst 1,5): Lehre aus der Yacht-Abnahme (dpr-Wechsel
//   leerte die Bühne in WebKit).
// - Sonnenschatten (PCF) je Qualitätsstufe, Karte nur bei Änderung neu gerendert.
// - HDR-Bildaufbau (umgebung.js): Brechung im Wasser, Kaustik, Bloom, Tone-Mapping
//   Neutral; ohne Float-Puffer direkter Weg wie bisher.
// - Vorher/Nachher: zwei Durchgänge mit Scissor, Mosaik-Uniforms je Hälfte.
// - Kontextverlust → onLost (die Seite zeigt dann die 2D-Draufsicht).
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cumulative } from "@/lib/ezarri/konfigurator/mix";
import { waterLevel } from "@/lib/ezarri/konfigurator/geometry";
// Kameraführung (Einflug, Übergänge, Begrenzung) und Qualitätsstufen: ./kamera.js (rein, getestet)
import { ankommen, begrenzeKamera, begrenzeZiel, buehnenPresets, createWaechter, flugPfad, introStart, kameraRahmen, startStufe, STUFEN } from "./kamera";
import { WASSER_TON, laneCenters } from "@/lib/ezarri/konfigurator/preview2d";
import { applyMaterialSet, posterMaske, createMosaicUniforms, createSkyMaterial, LED_FARBE, TAGESZEIT } from "@/lib/ezarri/konfigurator/shader/mosaic";
// Umgebung (Terrasse, Rasen, Hecke, See, Berge) baut buildScene über ./umgebung.js;
// Wasser (Brechung), Kaustik, Bloom und Tone-Mapping-Ausgabe liegen ebenfalls dort.
import { buildScene } from "./buildScene";
import { createBildaufbau, createKaustikMaterial, createLedLampen, createWasserMaterial, veredleKopfstein } from "./umgebung";

/** Eingabe für applyMaterialSet aus Zustand + Katalog-Index. */
export function materialInput(state, index) {
  const ref = (e) => index.resolveRef(e.id, state.format, { ref: e.ref });
  let pattern = null;
  if (state.modus === "pattern" && state.pattern) {
    const p = (index.katalog?.patterns || []).find((x) => x.id === state.pattern.id);
    if (p?.maske) pattern = { w: p.w, h: p.h, maske: p.maske, refs: state.pattern.ids.map((id) => index.resolveRef(id, state.format)) };
  }
  const b = state.becken;
  return {
    mix: state.mix.map(ref),
    cum: cumulative(state.mix),
    kanaele: state.kanaele.map((k) => ({ ...k, ref: ref(k) })),
    pattern,
    fuge: index.fuge(state.fuge)?.hex || "#ededed",
    format: state.format,
    seed: state.seed,
    wasserton: WASSER_TON[state.wasserton] || WASSER_TON.klar,
    lanes: state.szene === "pool" ? laneCenters(b) : [],
    laneX: [-b.l / 2 + 0.6, b.l / 2 - 0.6],
  };
}

const isTouch = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
/** Safari bzw. jeder Browser auf iOS/iPadOS (alle WebKit). */
const isWebKit = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) || (/AppleWebKit/.test(ua) && !/Chrome\/|Chromium|Edg\//.test(ua));
};

/** WebGL läuft ohne Grafikkarte (CPU-Rasterung) – dort ist jedes Bild sehr teuer. */
function istSoftware(gl) {
  try {
    const ctx = gl.getContext();
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    const r = String(ctx.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : ctx.RENDERER) || "");
    return /swiftshader|llvmpipe|softpipe|basic render|software/i.test(r);
  } catch {
    return false;
  }
}

function useSky() {
  return useMemo(
    () => ({
      uSkyTop: { value: new THREE.Color() },
      uSkyHorizon: { value: new THREE.Color() },
      uSunDirS: { value: new THREE.Vector3(0, 1, 0) },
      uSunColorS: { value: new THREE.Color(1, 1, 1) },
    }),
    [],
  );
}

function Scene({ state, index, vorher, split, reducedMotion, touchLocked, onReady, apiRef, intro = "flug", stufe: stufeStart = 0, dprWechsel = false, onStufe }) {
  const { gl, scene, camera, invalidate, size, setDpr } = useThree();
  const anim = useRef(null);
  const pendingIntro = useRef(null);
  const shared = useMemo(() => createMosaicUniforms(), []);
  const shared2 = useRef(null);
  const sky = useSky();
  const waterMat = useMemo(() => createWasserMaterial(sky), [sky]);
  // Kaustik-Überlagerung (Ebene 2) teilt die Wasserzeit; HDR-Bildaufbau (null = alter Weg)
  const kaustikMat = useMemo(() => {
    const m = createKaustikMaterial();
    m.uniforms.uTime = waterMat.uniforms.uTime;
    return m;
  }, [waterMat]);
  const bildaufbau = useMemo(() => createBildaufbau(gl), [gl]);
  const lampen = useMemo(() => createLedLampen(), []);
  const kaustikRef = useRef(false);
  useEffect(
    () => () => {
      bildaufbau?.dispose();
      kaustikMat.dispose();
      lampen.dispose();
    },
    [bildaufbau, kaustikMat, lampen],
  );
  const skyMesh = useMemo(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), createSkyMaterial(sky));
    m.renderOrder = -1;
    m.frustumCulled = false;
    return m;
  }, [sky]);
  const lights = useMemo(() => {
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    const hemi = new THREE.HemisphereLight(0xbfd6f2, 0x9a8c78, 1);
    const leds = [0, 1, 2].map(() => new THREE.PointLight(0xffffff, 0, 9, 2));
    const room = new THREE.PointLight(0xfff3e0, 0, 12, 2);
    return { sun, hemi, leds, room };
  }, []);
  const controls = useMemo(() => {
    const c = new OrbitControls(camera, gl.domElement);
    // Dämpfung (Trägheit) – bei reduzierter Bewegung aus (Effekt unten)
    c.enableDamping = true;
    c.dampingFactor = 0.085;
    c.rotateSpeed = 0.7;
    c.minDistance = 0.25;
    c.maxDistance = 70;
    c.zoomSpeed = 0.8;
    c.zoomToCursor = true;
    c.panSpeed = 0.6;
    c.screenSpacePanning = true;
    return c;
  }, [camera, gl]);
  const rahmen = useMemo(() => kameraRahmen(state.becken, state.szene), [state.becken, state.szene]);
  const modusRef = useRef("ueber");
  // Qualitätsstufe (0 hoch … 2 niedrig): Start aus Geräte-Hinweisen, der Wächter stuft ab
  // Software-Rendering (SwiftShader, llvmpipe, Basic Render): „niedrig“ und stehendes Wasser
  const [software] = useState(() => istSoftware(gl));
  const [stufe, setStufe] = useState(() => (software ? STUFEN.length - 1 : Math.min(STUFEN.length - 1, Math.max(0, stufeStart))));
  const qual = STUFEN[stufe];
  const envRes = qual.envAufloesung;
  const waechter = useMemo(() => createWaechter({ fenster: 40, grenze: 22 }), []);
  // Notbremse: zusammenhängende Bilder > 250 ms (der Wächter wertet sie als Pause) zählen hier
  const zaeh = useRef(0);
  // Schonfrist des Wächters ab Bereitschaft bzw. Stufenwechsel (Shader-Kompilierung, Nachladen)
  const readyAt = useRef(0);
  const dprCap = useRef(gl.getPixelRatio());
  useEffect(() => {
    readyAt.current = performance.now();
    zaeh.current = 0;
    // Stufe für andere Bausteine (Schatten, Brechung, Nachbearbeitung) veröffentlichen
    scene.userData.ezkQualitaet = qual;
    scene.dispatchEvent({ type: "ezk-qualitaet", qualitaet: qual });
    gl.domElement.dataset.ezkStufe = qual.id;
    // Schattenkarte je Stufe: Licht-Effekt unten (qual.schatten); Brechung/Bloom: renderNow (qual)
    // dpr nur außerhalb von WebKit nachführen (Lehre Yacht: dpr-Wechsel leerte die Bühne);
    // Deckel = Start-dpr (Überabtastung wie bisher, unabhängig von devicePixelRatio)
    if (dprWechsel) {
      const ziel = Math.min(dprCap.current, qual.dpr);
      if (Math.abs(gl.getPixelRatio() - ziel) > 0.01) setDpr(ziel);
    }
    onStufe?.(qual.id);
    invalidate();
  }, [qual, scene, gl, dprWechsel, setDpr, onStufe, invalidate]);
  const built = useRef(null);
  const geoKey = `${state.szene}|${JSON.stringify(state.becken)}`;
  const iri = state.mix.some((e) => index.resolveRef(e.id, state.format, { ref: e.ref })?.fin?.[2] === "perlmutt");

  // Grundeinrichtung
  useEffect(() => {
    scene.add(skyMesh, lights.sun, lights.sun.target, lights.hemi, lights.room, ...lights.leds);
    const onChange = () => invalidate();
    // Nutzer greift ein → laufenden Flug abbrechen (keine Kamera-Kämpfe)
    const onStart = () => {
      anim.current = null;
      pendingIntro.current = null;
    };
    controls.addEventListener("change", onChange);
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("change", onChange);
      controls.removeEventListener("start", onStart);
      controls.dispose();
      scene.remove(skyMesh, lights.sun, lights.sun.target, lights.hemi, lights.room, ...lights.leds);
    };
  }, [scene, skyMesh, lights, controls, invalidate]);

  useEffect(() => {
    controls.enabled = !touchLocked;
  }, [controls, touchLocked]);

  useEffect(() => {
    controls.enableDamping = !reducedMotion;
  }, [controls, reducedMotion]);

  // Geometrie (nur bei Szene/Maß-Änderung neu)
  useEffect(() => {
    const b = buildScene({ szene: state.szene, becken: state.becken }, shared, waterMat, { iridescence: iri, sky });
    scene.add(b.group);
    built.current = b;
    invalidate();
    return () => {
      scene.remove(b.group);
      b.dispose();
      built.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoKey, shared, waterMat, scene, invalidate, iri, sky]);

  // Material (Mosaik, Fuge, Format, Kanäle, Pattern, Wasserton)
  useEffect(() => {
    applyMaterialSet(shared, materialInput(state, index));
    // nur tools/poster.mjs (Masken-Aufnahmen für die eingefärbte Vorschau)
    if (typeof window !== "undefined" && typeof window.__ezkPosterMaske === "number") posterMaske(shared, window.__ezkPosterMaske);
    invalidate();
  }, [state, index, shared, invalidate]);

  // Vorher-Satz
  useEffect(() => {
    if (!vorher) {
      shared2.current = null;
    } else {
      shared2.current = materialInput(vorher, index);
    }
    invalidate();
  }, [vorher, index, invalidate]);

  // Licht, Himmel, Wasser
  useEffect(() => {
    const interior = state.szene === "bad" || state.szene === "kueche";
    const t = TAGESZEIT[interior ? "mittag" : state.zeit] || TAGESZEIT.mittag;
    const dir = new THREE.Vector3(...t.sun).normalize();
    lights.sun.position.copy(dir).multiplyScalar(40);
    lights.sun.color.setRGB(...t.sunColor);
    lights.sun.intensity = interior ? 1.1 : t.sunI;
    lights.hemi.intensity = interior ? 1.1 : t.hemi * 1.4;
    // Himmelslicht nur leicht getönt (zu blaues Umgebungslicht verschob die Mosaikfarben)
    lights.hemi.color.setRGB(t.top[0] * 0.3 + 0.7, t.top[1] * 0.3 + 0.7, t.top[2] * 0.3 + 0.7);
    lights.room.intensity = interior ? 6 : 0;
    lights.room.position.set(0.4, 2.6, 1.2);
    sky.uSkyTop.value.setRGB(...t.top);
    sky.uSkyHorizon.value.setRGB(...t.hor);
    sky.uSunDirS.value.copy(dir);
    sky.uSunColorS.value.setRGB(...t.sunColor).multiplyScalar(state.zeit === "nacht" ? 0.15 : 1);
    shared.uSunDir.value.copy(dir);
    shared.uSunColor.value.setRGB(...t.sunColor).multiplyScalar(t.sunI / 3);
    shared.uNight.value = interior ? 0 : t.night;
    shared.uAmbientLum.value = interior ? 1 : Math.max(0.08, t.hemi);
    skyMesh.visible = !interior;
    scene.background = interior ? new THREE.Color(0xe9e4dc) : null;
    // leichter Dunst nach hinten (Tiefe), Farbe = Horizont
    scene.fog = interior ? null : new THREE.Fog(new THREE.Color(...t.hor).multiplyScalar(state.zeit === "nacht" ? 0.6 : 0.9), 45, 190);

    // Sonne mit weichem Schatten (PCF, Vogel-Scheibe). Kartengröße aus der Qualitätsstufe,
    // „niedrig“ ohne. Die Szene ist statisch: Karte nur bei Änderung neu (autoUpdate aus).
    const schatten = !interior && !!qual.schatten && gl.shadowMap.enabled;
    lights.sun.castShadow = schatten;
    if (schatten) {
      const sh = lights.sun.shadow;
      const ext = Math.max(state.becken.l, state.becken.b || state.becken.l) / 2 + 6.5;
      Object.assign(sh.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 10, far: 75 });
      sh.camera.updateProjectionMatrix();
      if (sh.mapSize.x !== qual.schatten) {
        sh.mapSize.set(qual.schatten, qual.schatten);
        sh.map?.dispose();
        sh.map = null;
      }
      sh.bias = -0.0003;
      sh.normalBias = 0.025;
      sh.radius = 3.5;
    }
    gl.shadowMap.autoUpdate = false;
    built.current?.group.traverse((o) => {
      if (!o.isMesh || !o.material?.isMeshStandardMaterial) return;
      o.castShadow = true;
      o.receiveShadow = true;
      // Beckenkopf: Naturstein statt einfarbig (nur der unveränderte Standard-Beckenkopf)
      if (!o.material.map && o.material.color.getHex() === 0xd8d1c5) veredleKopfstein(o.material);
    });
    gl.shadowMap.needsUpdate = true;

    // Umgebung für Spiegelungen. Außen: Würfel-Aufnahme der echten Umgebung (Himmel,
    // Wolken, Berge, See, Hecke, Terrasse) von der Beckenmitte aus – das Wasser spiegelt
    // sie (Fresnel), die Steine bekommen sie als Umgebungslicht (PMREM). Innen: Raum.
    const pmrem = new THREE.PMREMGenerator(gl);
    let envScene = null;
    let cubeRT = null;
    let rt;
    if (interior) {
      envScene = new RoomEnvironment();
      rt = pmrem.fromScene(envScene, 0.02);
      waterMat.uniforms.uEnvOn.value = 0;
    } else {
      cubeRT = new THREE.WebGLCubeRenderTarget(envRes, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      const cam = new THREE.CubeCamera(0.05, 900, cubeRT);
      cam.position.set(0, (waterLevel(state.becken, state.szene) ?? 0) + 0.25, 0);
      const water = built.current?.water;
      const vis = water?.visible;
      if (water) water.visible = false;
      scene.environment = null;
      cam.update(gl, scene);
      if (water) water.visible = vis;
      waterMat.uniforms.uEnv.value = cubeRT.texture;
      waterMat.uniforms.uEnvOn.value = 1;
      rt = pmrem.fromCubemap(cubeRT.texture);
    }
    scene.environment = rt.texture;
    // Himmels-Aufnahme ist stark blau: schwächer, dafür neutraleres Himmelslicht (Farbtreue)
    scene.environmentIntensity = interior ? 0.6 : state.zeit === "nacht" ? 0.2 : 0.42;
    pmrem.dispose();

    // LED
    const led = LED_FARBE[state.led];
    const wl = waterLevel(state.becken, state.szene) ?? 0;
    const b = state.becken;
    lights.leds.forEach((p, i) => {
      if (!led || interior) {
        p.intensity = 0;
        return;
      }
      p.color.setRGB(...led);
      const night = state.zeit === "nacht" ? 1 : state.zeit === "abend" ? 0.6 : 0.25;
      p.intensity = 7 * night;
      if (state.szene === "whirlpool") {
        const a = (i / 3) * Math.PI * 2;
        p.position.set(Math.cos(a) * (b.l / 2 - 0.08), wl - 0.45, Math.sin(a) * (b.l / 2 - 0.08));
      } else p.position.set(-b.l / 2 + (b.l * (i + 1)) / 4, wl - 0.5, -b.b / 2 + 0.08);
    });
    waterMat.uniforms.uSpec.value = state.zeit === "nacht" ? 0.04 : state.zeit === "abend" ? 0.6 : 1;
    waterMat.uniforms.uLed.value.setRGB(...(led || [0, 0, 0])).multiplyScalar(state.zeit === "nacht" ? 0.6 : 0.1);

    // Wasser
    const leer = state.wasser === "leer" || interior;
    shared.uWaterOn.value = leer ? 0 : 1;
    shared.uWaterY.value = wl;
    shared.uCaustic.value = state.wasser === "bewegt" ? 1 : state.wasser === "ruhig" ? 0.55 : 0;
    waterMat.uniforms.uWave.value = state.wasser === "bewegt" ? (state.szene === "whirlpool" ? 2.2 : 1) : 0.25;
    if (built.current?.water) built.current.water.visible = !leer;

    // Kaustik als Überlagerung (Ebene 2, HDR-Bildaufbau) statt im Mosaik-Shader
    // „niedrig“ (brechung 0) zeichnet direkt wie bisher; Kaustik dann im Mosaik-Shader
    const kaustikAn = !!bildaufbau && !!qual.brechung && !leer && qual.effekte?.kaustik !== false;
    kaustikRef.current = kaustikAn;
    const ku = kaustikMat.uniforms;
    ku.uAmt.value = (state.wasser === "bewegt" ? 1 : 0.6) * Math.min(1, t.sunI / 1.6);
    ku.uWaterY.value = wl;
    ku.uSunDir.value.copy(dir);
    ku.uSunE.value = t.sunI;
    ku.uAmbE.value = t.hemi + scene.environmentIntensity * 0.8;
    ku.uChroma.value = qual.effekte?.glanz === false ? 0 : 1;
    const overlays = [];
    if (kaustikAn) {
      shared.uCaustic.value = 0;
      for (const m of built.current?.mosaicMeshes || []) {
        const o = new THREE.Mesh(m.geometry, kaustikMat);
        o.layers.set(2);
        m.add(o);
        overlays.push(o);
      }
    }
    waterMat.uniforms.uGlanz.value = qual.effekte?.glanz === false ? 0.6 : 1;
    waterMat.uniforms.uChroma.value = qual.effekte?.glanz === false ? 0 : 1;
    waterMat.uniforms.uRefrOn.value = 0;

    // Scheinwerfer als leuchtende Linsen mit Lichthof (Bloom in Stufe „hoch“), Gartenlicht abends
    const lampenAn = !!led && !interior && !leer;
    if (lampenAn) {
      const whirl = state.szene === "whirlpool";
      const punkte = lights.leds.map((p, i) => {
        if (whirl) {
          const a = (i / 3) * Math.PI * 2;
          return { pos: [Math.cos(a) * (b.l / 2 - 0.006), p.position.y, Math.sin(a) * (b.l / 2 - 0.006)], normal: [-Math.cos(a), 0, -Math.sin(a)] };
        }
        return { pos: [p.position.x, p.position.y, -b.b / 2 + 0.006], normal: [0, 0, 1] };
      });
      lampen.setze({ farbe: led, staerke: state.zeit === "nacht" ? 1 : state.zeit === "abend" ? 0.7 : 0.35, punkte });
      scene.add(lampen.group);
    }
    const garten = built.current?.group.getObjectByName("ezk-gartenlicht");
    if (garten) garten.visible = !interior && (state.zeit === "nacht" || state.zeit === "abend");
    invalidate();
    return () => {
      for (const o of overlays) o.parent?.remove(o);
      scene.remove(lampen.group);
      rt.dispose();
      cubeRT?.dispose();
      envScene?.traverse?.((o) => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
    };
  }, [state.zeit, state.led, state.wasser, state.szene, state.becken, gl, scene, sky, lights, shared, waterMat, skyMesh, invalidate, geoKey, envRes, qual, kaustikMat, bildaufbau, lampen]);

  // Bildwinkel: waagrecht mindestens ca. 52°, damit schmale (mobile) Bühnen das Becken nicht anschneiden
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const v = (2 * Math.atan(Math.tan((26 * Math.PI) / 180) / aspect) * 180) / Math.PI;
    camera.fov = Math.min(60, Math.max(42, v));
    camera.updateProjectionMatrix();
    invalidate();
  }, [size.width, size.height, camera, invalidate]);

  // Kamera-Vorgabe
  const presets = useMemo(() => buehnenPresets(state.becken, state.szene), [state.becken, state.szene]);
  const lastCamKey = useRef("");
  const wlRef = useRef(null);
  wlRef.current = waterLevel(state.becken, state.szene);
  /** Flug zur Stellung p (bzw. Sprung bei reduzierter Bewegung). */
  const fliege = (p, { tempo = 1, dauer = 0, sprung = false } = {}) => {
    const modusNach = p.modus || "ueber";
    const modusVon = modusRef.current;
    controls.maxPolarAngle = modusNach === "unter" || state.kamera === "wasserlinie" ? Math.PI * 0.95 : Math.PI * 0.49;
    if (sprung || reducedMotion) {
      anim.current = null;
      modusRef.current = modusNach;
      camera.position.set(...p.pos);
      controls.target.set(...p.target);
      controls.update();
      invalidate();
      return;
    }
    const von = { pos: camera.position.toArray(), target: controls.target.toArray() };
    const pfad = flugPfad(von, p, { wl: wlRef.current, modusVon, modusNach, tempo, dauer });
    anim.current = { pfad, t0: performance.now(), modus: modusNach };
    // Begrenzung während des Flugs aus; Ziel-Modus gilt ab Landung
    modusRef.current = "flug";
    invalidate();
  };
  const fliegeRef = useRef(fliege);
  fliegeRef.current = fliege;
  useEffect(() => {
    const p = presets[state.kamera] || presets.uebersicht;
    const key = `${geoKey}|${state.kamera}`;
    const first = !lastCamKey.current;
    lastCamKey.current = key;
    if (first) {
      // Startbild = Vorgabe (deckt sich mit dem Poster); Einflug/Ankommen startet mit onReady
      fliegeRef.current(p, { sprung: true });
      if (!reducedMotion && intro === "flug") {
        const s = introStart(p, rahmen?.S ?? 8);
        fliegeRef.current({ ...s, modus: "ueber" }, { sprung: true });
        modusRef.current = "ueber";
        pendingIntro.current = { p, dauer: 2600 };
      } else if (!reducedMotion && intro === "ankommen" && p.modus === "ueber") {
        pendingIntro.current = { p: { ...ankommen(p), modus: p.modus }, dauer: 2400 };
      }
      return;
    }
    pendingIntro.current = null;
    fliegeRef.current(p);
  }, [presets, state.kamera, geoKey, reducedMotion, intro, rahmen]);

  // Wasserbewegung: im rAF-Takt (Stufe: 60 bzw. 30 Bilder/s), nur wenn sichtbar und Tab vorn
  const moving = !reducedMotion && !software && state.wasser === "bewegt" && state.szene !== "bad" && state.szene !== "kueche";
  const sichtbar = useRef(true);
  useEffect(() => {
    if (!moving) return undefined;
    const el = gl.domElement;
    const io = new IntersectionObserver(([e]) => {
      sichtbar.current = e.isIntersecting;
      if (e.isIntersecting) invalidate();
    });
    io.observe(el);
    const onVis = () => !document.hidden && invalidate();
    document.addEventListener("visibilitychange", onVis);
    invalidate();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      sichtbar.current = true;
    };
  }, [moving, gl, invalidate]);

  const ready = useRef(false);
  const frames = useRef(0);
  const splitRef = useRef(split);
  splitRef.current = split;
  const vorherRef = useRef(vorher);
  vorherRef.current = vorher;
  const stateRef = useRef(state);
  stateRef.current = state;

  const renderNow = () => {
    const w = size.width;
    const h = size.height;
    // Schattenkarte nach Stufenwechsel (Karte verworfen) einmal neu
    if (lights.sun.castShadow && !lights.sun.shadow.map) gl.shadowMap.needsUpdate = true;
    if (bildaufbau && qual.brechung) {
      // HDR-Bildaufbau: Tiefe → Opak (+ Kaustik) → Wasser mit Brechung → Bloom → Tone-Mapping
      const zwei = vorherRef.current && shared2.current;
      const sx = zwei ? Math.min(1, Math.max(0, splitRef.current ?? 0.5)) : 1;
      bildaufbau.render(scene, camera, {
        wasser: built.current?.water || null,
        wasserMat: waterMat,
        kaustik: kaustikRef.current,
        bloom: !!qual.effekte?.bloom,
        brechung: qual.brechung,
        haelften: zwei
          ? [
              { x: 0, w: sx, vor: () => applyMaterialSet(shared, shared2.current) },
              { x: sx, w: 1 - sx, vor: () => applyMaterialSet(shared, materialInput(stateRef.current, index)) },
            ]
          : null,
        onBloomBereit: () => {
          takt.current.dirty = true;
          invalidate();
        },
      });
      return;
    }
    // direkter Weg: Wasser zurück auf Ebene 0 (der Bildaufbau legt es auf Ebene 1), ohne Brechung
    const wasser = built.current?.water;
    if (wasser && !wasser.layers.isEnabled(0)) wasser.layers.set(0);
    waterMat.uniforms.uRefrOn.value = 0;
    if (vorherRef.current && shared2.current) {
      const sx = Math.round(w * (splitRef.current ?? 0.5));
      gl.setScissorTest(true);
      applyMaterialSet(shared, shared2.current);
      gl.setScissor(0, 0, sx, h);
      gl.render(scene, camera);
      applyMaterialSet(shared, materialInput(stateRef.current, index));
      gl.setScissor(sx, 0, w - sx, h);
      gl.render(scene, camera);
      gl.setScissorTest(false);
    } else {
      gl.render(scene, camera);
    }
  };
  const renderRef = useRef(renderNow);
  renderRef.current = renderNow;

  const tmpV = useMemo(() => new THREE.Vector3(), []);
  const takt = useRef({ letzt: 0, wasser: 0, eigen: false, dirty: false });
  const qualRef = useRef(stufe);
  qualRef.current = stufe;
  /** Kamera nach Bedienung/Dämpfung in den erlaubten Raum zurückholen. */
  const begrenze = () => {
    const m = modusRef.current;
    if (m === "flug" || !rahmen) return;
    const t = begrenzeZiel(controls.target.toArray(), rahmen);
    controls.target.set(...t);
    const p = begrenzeKamera(camera.position.toArray(), m, rahmen);
    tmpV.set(...p);
    if (tmpV.distanceToSquared(camera.position) > 1e-10) camera.position.copy(tmpV);
  };

  useFrame((_, delta) => {
    const now = performance.now();
    const tk = takt.current;
    let aktiv = false;
    // Jeder Frame kommt aus invalidate() (Änderung) – nur reine Wasser-Takt-Frames dürfen ausfallen
    let zeichnen = false;
    const fremd = !tk.eigen;
    tk.eigen = false;
    if (anim.current) {
      const a = anim.current;
      const t = Math.min(1, (now - a.t0) / a.pfad.dauer);
      const { pos, target } = a.pfad.at(t);
      camera.position.set(...pos);
      controls.target.set(...target);
      camera.lookAt(controls.target);
      if (t >= 1) {
        anim.current = null;
        modusRef.current = a.modus;
        controls.update();
      }
      aktiv = true;
      zeichnen = true;
    } else if (controls.enableDamping) {
      // Dämpfung: update() liefert true, solange die Trägheit noch wirkt
      if (controls.update()) {
        aktiv = true;
        zeichnen = true;
      }
    }
    if (!anim.current) begrenze();
    if (moving && sichtbar.current && !document.hidden) {
      aktiv = true;
      const fps = STUFEN[qualRef.current].wasserFps;
      if (now - tk.wasser >= 1000 / fps - 2) {
        const dt = Math.min((now - (tk.wasser || now - 16)) / 1000, 0.1);
        tk.wasser = now;
        shared.uTime.value += dt;
        waterMat.uniforms.uTime.value += dt;
        zeichnen = true;
      }
    }
    // Wächter: nur zusammenhängende Bilder (aktive Folge), Abstand zweier rAF-Aufrufe
    // erst nach der Einschwingphase (Shader-Kompilierung, Bloom-Nachladen, Ankommen-Flug)
    if (aktiv && tk.letzt && ready.current && !reducedMotion && now - readyAt.current > 3000) {
      const ms = now - tk.letzt;
      zaeh.current = ms > 250 && ms < 5000 && !document.hidden ? zaeh.current + 1 : 0;
      const notbremse = zaeh.current >= 3;
      if ((waechter.push(ms) || notbremse) && qualRef.current < STUFEN.length - 1) {
        zaeh.current = 0;
        waechter.reset();
        setStufe((s) => Math.min(STUFEN.length - 1, s + 1));
        if (typeof window !== "undefined") window.__ezarri?.log?.push({ t: Math.round(now), median: +waechter.median.toFixed(1), von: STUFEN[qualRef.current].id });
      }
    } else if (!aktiv) waechter.reset();
    tk.letzt = aktiv ? now : 0;
    void delta;
    // dirty: Bausteine (z. B. Bloom-Puffer bereit) erzwingen ein Bild auch im Wasser-Takt
    if (zeichnen || fremd || tk.dirty || !ready.current) {
      tk.dirty = false;
      renderNow();
    }
    if (aktiv) {
      tk.eigen = true;
      invalidate();
    }
    // Poster/2D erst ausblenden, wenn ein vollständiges Bild steht (QM R2 P3: im ersten Frame
    // fehlte am Desktop noch der Himmel): drei gezeichnete Frames, dann zwei rAF.
    if (!ready.current) {
      frames.current += 1;
      if (frames.current < 3) invalidate();
      else {
        ready.current = true;
        readyAt.current = performance.now();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            onReady?.();
            // Einflug bzw. Ankommen erst, wenn die Bühne sichtbar wird (Überblenden ~600 ms)
            const pi = pendingIntro.current;
            if (pi) {
              setTimeout(() => {
                if (pendingIntro.current !== pi) return;
                pendingIntro.current = null;
                fliegeRef.current(pi.p, { dauer: pi.dauer });
              }, intro === "ankommen" ? 650 : 120);
            }
          }),
        );
      }
    }
  }, 1);

  // Mess-Hook (nur Entwicklung bzw. ?ezkdebug): renderer.info, Stufe, Kamera – für Aufnahme-Skripte
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && !/[?&]ezkdebug\b/.test(window.location.search)) return undefined;
    window.__ezarri = {
      log: [],
      info: () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, programs: gl.info.programs?.length ?? 0, dpr: gl.getPixelRatio() }),
      get stufe() {
        return STUFEN[qualRef.current].id;
      },
      setStufe: (i) => setStufe(Math.min(STUFEN.length - 1, Math.max(0, i))),
      /** n Bilder synchron (readPixels erzwingt GPU-Ende) – ms je Bild inkl. GPU */
      bench: (n = 60) => {
        const ctx = gl.getContext();
        const px = new Uint8Array(4);
        renderRef.current();
        ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
        const t0 = performance.now();
        for (let i = 0; i < n; i++) {
          shared.uTime.value += 1 / 30;
          waterMat.uniforms.uTime.value += 1 / 30;
          renderRef.current();
          ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
        }
        return +((performance.now() - t0) / n).toFixed(3);
      },
      /** reine GPU-Zeit je Bild (EXT_disjoint_timer_query_webgl2), Median in ms; null ohne Erweiterung */
      benchGpu: async (n = 40) => {
        const ctx = gl.getContext();
        const ext = ctx.getExtension("EXT_disjoint_timer_query_webgl2");
        if (!ext) return null;
        const qs = [];
        for (let i = 0; i < n; i++) {
          const q = ctx.createQuery();
          ctx.beginQuery(ext.TIME_ELAPSED_EXT, q);
          shared.uTime.value += 1 / 30;
          waterMat.uniforms.uTime.value += 1 / 30;
          renderRef.current();
          ctx.endQuery(ext.TIME_ELAPSED_EXT);
          qs.push(q);
          await new Promise((r) => requestAnimationFrame(r));
        }
        const ms = [];
        for (const q of qs) {
          for (let k = 0; k < 120 && !ctx.getQueryParameter(q, ctx.QUERY_RESULT_AVAILABLE); k++) await new Promise((r) => requestAnimationFrame(r));
          if (!ctx.getParameter(ext.GPU_DISJOINT_EXT)) ms.push(ctx.getQueryParameter(q, ctx.QUERY_RESULT) / 1e6);
          ctx.deleteQuery(q);
        }
        ms.sort((a, b) => a - b);
        return ms.length ? +ms[ms.length >> 1].toFixed(3) : null;
      },
      kamera: () => ({ pos: camera.position.toArray(), target: controls.target.toArray(), modus: modusRef.current, fliegt: Boolean(anim.current) }),
    };
    return () => {
      delete window.__ezarri;
    };
  }, [gl, camera, controls, shared, waterMat]);

  /** Kurzer, weicher Schritt (Tastatur/Knöpfe) zur Stellung pos – im aktuellen Modus, begrenzt. */
  const schritt = (pos) => {
    const m = modusRef.current === "flug" ? anim.current?.modus || "ueber" : modusRef.current;
    const ziel = begrenzeKamera(pos, m, rahmen);
    const target = anim.current ? anim.current.pfad.at(1).target : controls.target.toArray();
    pendingIntro.current = null;
    if (reducedMotion) {
      camera.position.set(...ziel);
      controls.update();
      invalidate();
      return;
    }
    modusRef.current = m;
    fliegeRef.current({ pos: ziel, target, modus: m }, { tempo: 0.38 });
  };

  useImperativeHandle(apiRef, () => ({
    /** Kamera drehen (Bogenmaß) bzw. zoomen (Faktor < 1 näher) – mit kurzem, gedämpftem Übergang. */
    orbit(dAz, dPol) {
      const base = anim.current ? new THREE.Vector3(...anim.current.pfad.at(1).pos) : camera.position.clone();
      const tgt = anim.current ? new THREE.Vector3(...anim.current.pfad.at(1).target) : controls.target.clone();
      const off = base.sub(tgt);
      const sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += dAz;
      sph.phi = Math.min(controls.maxPolarAngle, Math.max(0.05, sph.phi + dPol));
      off.setFromSpherical(sph);
      schritt(tgt.add(off).toArray());
    },
    zoom(f) {
      const base = anim.current ? new THREE.Vector3(...anim.current.pfad.at(1).pos) : camera.position.clone();
      const tgt = anim.current ? new THREE.Vector3(...anim.current.pfad.at(1).target) : controls.target.clone();
      const off = base.sub(tgt);
      const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, off.length() * f));
      off.setLength(len);
      schritt(tgt.add(off).toArray());
    },
    /** Zurück zur gewählten Kamera-Vorgabe (weicher Flug). */
    zuruecksetzen() {
      pendingIntro.current = null;
      fliegeRef.current(presets[stateRef.current.kamera] || presets.uebersicht);
    },
    /** Aktuelle Qualitätsstufe ("hoch" | "mittel" | "niedrig"). */
    get stufe() {
      return STUFEN[qualRef.current].id;
    },
    /** Standbild der aktuellen Ansicht (JPEG-Data-URL), z. B. für das Druckblatt. */
    snapshot(maxW = 1200) {
      renderNow();
      const src = gl.domElement;
      const scale = Math.min(1, maxW / src.width);
      const c = document.createElement("canvas");
      c.width = Math.round(src.width * scale);
      c.height = Math.round(src.height * scale);
      c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.85);
    },
    /** Becken als GLB (für AR), Mosaik als Textur gebacken. */
    async exportGLB(bake, tileM = 1) {
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
      const b = built.current;
      if (!b) return null;
      const root = new THREE.Group();
      const tex = bake ? new THREE.CanvasTexture(bake()) : null;
      if (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      const mosaicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.25, metalness: 0 });
      for (const m of b.mosaicMeshes) {
        const g = m.geometry.clone();
        g.deleteAttribute("mosaicUv");
        // UV in Metern → eine Texturkachel = tileM Meter (ganze Steinzahl, nahtlos)
        const uv = g.getAttribute("uv");
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tileM, uv.getY(i) / tileM);
        root.add(new THREE.Mesh(g, mosaicMat));
      }
      if (b.water && stateRef.current.wasser !== "leer") {
        const wm = new THREE.MeshStandardMaterial({ color: 0x6fc3d0, transparent: true, opacity: 0.35, roughness: 0.05 });
        root.add(new THREE.Mesh(b.water.geometry.clone(), wm));
      }
      const exporter = new GLTFExporter();
      const glb = await exporter.parseAsync(root, { binary: true });
      return new Blob([glb], { type: "model/gltf-binary" });
    },
  }));

  return null;
}

/**
 * @param {{state:object, index:object, vorher?:object|null, split?:number, reducedMotion:boolean,
 *          touchLocked:boolean, onReady?:()=>void, onLost?:()=>void, apiRef:{current:any}}} props
 */
export default function Stage3D(props) {
  // Startstufe einmal je Bühne aus Geräte-Hinweisen; dpr = fester Deckel (Lehre Yacht/WebKit),
  // nur ohne WebKit darf der Wächter ihn später senken.
  const [geraet] = useState(() => {
    const touch = isTouch();
    const stufe = startStufe({ touch, speicher: navigator.deviceMemory ?? 8, kerne: navigator.hardwareConcurrency ?? 8, sparen: Boolean(navigator.connection?.saveData) });
    return { stufe, webkit: isWebKit(), dpr: Math.min(isTouch() ? 1.25 : 1.5, STUFEN[stufe].dpr) };
  });
  const dpr = geraet.dpr;
  return (
    <Canvas
      dpr={dpr}
      frameloop="demand"
      camera={{ fov: 42, near: 0.05, far: 800, position: [-8, 4, 6] }}
      gl={{ antialias: true, powerPreference: "high-performance", localClippingEnabled: true }}
      shadows="percentage"
      onCreated={({ gl }) => {
        // Khronos PBR Neutral: Grundfarben bis ~0,8 linear unverändert (Farbtreue zu
        // measured-colors.json), nur Glanzlichter werden weich komprimiert – ACES
        // verschob Türkis/Blau. Wirkt im HDR-Bildaufbau über die Ausgabe-Stufe.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.3;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.localClippingEnabled = true;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onLost?.();
        });
      }}
      style={{ touchAction: props.touchLocked ? "pan-y" : "none" }}
      aria-hidden="true"
    >
      <Scene {...props} stufe={geraet.stufe} dprWechsel={!geraet.webkit} />
    </Canvas>
  );
}
