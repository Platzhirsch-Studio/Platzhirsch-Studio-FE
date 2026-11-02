"use client";
/* eslint-disable react-hooks/immutability -- three.js objects (camera, meshes,
   DOM hotspot nodes) are mutable by design; all mutations happen in effects
   or the frame step, never during render. */
// SplatViewer – die 3D-Ansicht des Rundgangs /[locale]/showroom (N1).
//
// Nur über next/dynamic (ssr: false) aus ShowroomStage.js geladen, erst nach
// dem Klick auf „Rundgang starten“: three.js und Spark
// landen nie im ersten Bundle (Akzeptanz 1, Viewer-JS ≤ 350 KB gzip).
//
// Renderer: Spark 0.1.10 (@sparkjsdev/spark, MIT, World Labs). Bewusst nicht
// Spark 2.x: dort steckt ein 1,7-MB-WASM-Modul als Base64 im Bundle
// (924 KB gzip allein für Spark) – das sprengt das Budget. 0.1.10 liest SOG
// (PlayCanvas, auch v2 mit Codebook), 158 KB gzip. LOD löst der Rundgang über
// zwei SOG-Stufen je Zone (lo → hi, tools/splat/pack.mjs).
//
// - Zeichnen nur auf Anforderung (eigene Mini-Engine, siehe useEngine): bei Kamerafahrt, Blickdrehung,
//   Laden und ein kurzes Nachlaufen, damit die Sortierung im Worker fertig wird.
// - Kamerafahrt 1400 ms (Bibel §8: Atmosphäre 600–2400 ms). Reduced motion:
//   Schnitt (sofort an der nächsten Station).
// - Hotspots sind DOM-Knöpfe in ShowroomStage; hier wird nur ihre Lage auf
//   dem Bildschirm berechnet und direkt als transform gesetzt (kein React-
//   Render pro Frame). Canvas ist aria-hidden.
// - Daten nur vom eigenen Server (public/showroom/…), kein CDN.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const TWEEN_MS = 1400;
const SETTLE_FRAMES = 8; // kurzer Nachlauf nach Bewegung; fertige Sortierung zeichnet zusätzlich neu (s. u.)
const LOOK = { yaw: 0.6, pitch: 0.28 }; // max. Blickdrehung in rad (±34°/±16°)

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ≈ --ease-quiet-inout

/** Datei mit Fortschritt laden (für die Prozentanzeige); Spark bekommt die Bytes. */
async function fetchBytes(url, onProgress, signal) {
  const res = await fetch(url, { signal, credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const out = new Uint8Array(total);
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (got + value.length > out.length) {
      // content-length war komprimiert: auf dynamisches Sammeln umschalten
      const rest = [out.subarray(0, got), value];
      let r;
      while (!(r = await reader.read()).done) rest.push(r.value);
      const all = new Uint8Array(rest.reduce((s, a) => s + a.length, 0));
      let o = 0;
      for (const a of rest) {
        all.set(a, o);
        o += a.length;
      }
      return all;
    }
    out.set(value, got);
    got += value.length;
    onProgress?.(Math.min(0.99, got / total));
  }
  return got === out.length ? out : out.subarray(0, got);
}

/** Splat einer Zone/Stimmung/Stufe laden → SplatMesh (initialisiert). */
async function loadSplat(entry, drehung, onProgress, signal) {
  const bytes = await fetchBytes(entry.url, onProgress, signal);
  const mesh = new SplatMesh({ fileBytes: bytes, fileName: entry.url.split("/").pop() });
  const [w, x, y, z] = drehung || [1, 0, 0, 0];
  mesh.quaternion.set(x, y, z, w);
  await mesh.initialized;
  return mesh;
}

function cameraFor(station) {
  const k = station?.kamera;
  if (!k) return null;
  return { pos: new THREE.Vector3(...k.pos), ziel: new THREE.Vector3(...k.ziel), fov: k.fov || 60 };
}

function Scene({ ctx, tour, stationIndex, stimmung, reducedMotion, strong, hotspotEls, apiRef, onReady, onProgress, onError, onFps, onArrive }) {
  const { gl, scene, camera, invalidate, size } = ctx;
  const spark = useRef(null);
  const meshes = useRef(new Map()); // key → mesh
  const shown = useRef(null); // key der sichtbaren Szene
  const settle = useRef(SETTLE_FRAMES);
  const look = useRef({ yaw: 0, pitch: 0 });
  const tween = useRef(null); // { from, to, start, frames }
  const current = useRef(null); // { pos, ziel, fov }
  const readyOnce = useRef(false);
  const tmp = useRef({ v: new THREE.Vector3(), dir: new THREE.Vector3(), fwd: new THREE.Vector3() });

  const station = tour.stations[stationIndex];

  // Spark-Renderer einmal anlegen.
  useEffect(() => {
    const s = new SparkRenderer({ renderer: gl });
    // Sortierung läuft asynchron im Worker: ist sie fertig, genau einmal neu zeichnen
    // (statt dauernd zu rendern – frameloop "demand", schwache Geräte).
    const view = s.defaultView;
    if (view?.sortUpdate) {
      const sortUpdate = view.sortUpdate.bind(view);
      view.sortUpdate = async (...a) => {
        const r = await sortUpdate(...a);
        invalidate();
        return r;
      };
    }
    scene.add(s);
    spark.current = s;
    scene.background = new THREE.Color("#1f252b");
    const meshMap = meshes.current;
    return () => {
      scene.remove(s);
      for (const m of meshMap.values()) {
        scene.remove(m);
        m.dispose?.();
      }
      meshMap.clear();
      s.dispose?.();
    };
  }, [gl, scene, invalidate]);

  // Zone/Stimmung laden (erst lo, auf starken Geräten danach hi).
  const zoneId = station?.nurFoto ? null : station?.zone;
  useEffect(() => {
    if (!zoneId) return undefined;
    const zone = tour.zonen[zoneId];
    const mood = zone?.stimmungen[stimmung] || zone?.stimmungen.tag;
    if (!mood) return undefined;
    const ctrl = new AbortController();
    let cancelled = false;
    const order = strong ? ["lo", "hi"] : ["lo"];
    const show = (key, mesh) => {
      for (const [k, m] of meshes.current) m.visible = k === key;
      if (!meshes.current.has(key)) {
        meshes.current.set(key, mesh);
        scene.add(mesh);
      }
      mesh.visible = true;
      shown.current = key;
      // Ältere Stufen derselben Zone/Stimmung freigeben (Speicher mobil).
      for (const [k, m] of [...meshes.current]) {
        if (k !== key && k.startsWith(`${zoneId}:${stimmung}:`)) {
          scene.remove(m);
          m.dispose?.();
          meshes.current.delete(k);
        }
      }
      settle.current = SETTLE_FRAMES;
      invalidate();
    };
    (async () => {
      for (const lodId of order) {
        const entry = mood.lod.find((l) => l.id === lodId) || (lodId === "lo" ? mood.lod[0] : null);
        if (!entry) continue;
        const key = `${zoneId}:${stimmung}:${entry.id}`;
        if (meshes.current.has(key)) {
          show(key, meshes.current.get(key));
          continue;
        }
        try {
          const first = !readyOnce.current;
          const mesh = await loadSplat(entry, zone.drehung, first ? onProgress : null, ctrl.signal);
          if (cancelled) {
            mesh.dispose?.();
            return;
          }
          show(key, mesh);
          if (!readyOnce.current) {
            readyOnce.current = true;
            // Zwei Frames abwarten, damit die erste Sortierung steht.
            requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
          }
        } catch (e) {
          if (cancelled || e?.name === "AbortError") return;
          if (!readyOnce.current) onError?.(e);
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [zoneId, stimmung, strong, tour, scene, invalidate, onProgress, onReady, onError]);

  // Stationswechsel: Fahrt oder Schnitt.
  useEffect(() => {
    const to = cameraFor(station);
    if (!to) return;
    look.current = { yaw: 0, pitch: 0 };
    if (!current.current || reducedMotion) {
      current.current = to;
      tween.current = null;
      settle.current = SETTLE_FRAMES;
      onArrive?.();
    } else {
      tween.current = { from: { ...current.current, pos: current.current.pos.clone(), ziel: current.current.ziel.clone() }, to, start: performance.now(), frames: 0 };
    }
    invalidate();
  }, [station, reducedMotion, invalidate, onArrive]);

  // Imperative Schnittstelle für ShowroomStage (Blick drehen) und das Aufnahme-Werkzeug.
  useEffect(() => {
    if (!apiRef) return undefined;
    apiRef.current = {
      look(dyaw, dpitch) {
        const l = look.current;
        l.yaw = Math.max(-LOOK.yaw, Math.min(LOOK.yaw, l.yaw + dyaw));
        l.pitch = Math.max(-LOOK.pitch, Math.min(LOOK.pitch, l.pitch + dpitch));
        settle.current = SETTLE_FRAMES;
        invalidate();
      },
      /** Kamera frei setzen (tools/splat/media.mjs): pos/ziel als [x,y,z]. */
      setCamera(pos, ziel, fov) {
        tween.current = null;
        current.current = { pos: new THREE.Vector3(...pos), ziel: new THREE.Vector3(...ziel), fov: fov || current.current?.fov || 60 };
        look.current = { yaw: 0, pitch: 0 };
        settle.current = SETTLE_FRAMES;
        invalidate();
      },
      invalidate() {
        settle.current = SETTLE_FRAMES;
        invalidate();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, invalidate]);

  // Bild-Schritt: läuft vor jedem Zeichnen (Engine unten), hält die Schleife bei Bedarf am Leben.
  const frame = () => {
    const c = current.current;
    if (!c) return;
    let animating = false;
    let pos = c.pos, ziel = c.ziel, fov = c.fov;
    const tw = tween.current;
    if (tw) {
      const t = Math.min(1, (performance.now() - tw.start) / TWEEN_MS);
      const e = easeInOut(t);
      pos = tw.from.pos.clone().lerp(tw.to.pos, e);
      ziel = tw.from.ziel.clone().lerp(tw.to.ziel, e);
      fov = tw.from.fov + (tw.to.fov - tw.from.fov) * e;
      tw.frames++;
      animating = t < 1;
      if (!animating) {
        const secs = (performance.now() - tw.start) / 1000;
        onFps?.(Math.round(tw.frames / secs));
        current.current = tw.to;
        tween.current = null;
        settle.current = SETTLE_FRAMES;
        onArrive?.();
      }
    }
    // Blickrichtung mit Drehung (Gier um Welt-Y, Nicken um die Seitenachse).
    const { dir, fwd, v } = tmp.current;
    dir.copy(ziel).sub(pos);
    const dist = dir.length() || 1;
    dir.normalize();
    const l = look.current;
    if (!animating && (l.yaw || l.pitch)) {
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), l.yaw);
      const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      dir.applyAxisAngle(side, l.pitch);
    }
    camera.position.copy(pos);
    camera.lookAt(fwd.copy(pos).addScaledVector(dir, dist));
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // Hotspots der aktuellen Station projizieren (nur im Stillstand sichtbar).
    const els = hotspotEls.current;
    if (els) {
      const w = size.width, h = size.height;
      for (const hs of station?.hotspots || []) {
        const el = els.get(hs.id);
        if (!el) continue;
        v.set(hs.pos[0], hs.pos[1], hs.pos[2]);
        const toP = v.clone().sub(camera.position);
        const inFront = toP.dot(dir) > 0.1;
        v.project(camera);
        const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h;
        const onScreen = inFront && x > 16 && x < w - 16 && y > 16 && y < h - 16;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.dataset.sichtbar = onScreen && !animating ? "1" : "0";
      }
    }

    if (animating) invalidate();
    else if (settle.current > 0) {
      settle.current--;
      invalidate();
    }
  };
  useEffect(() => {
    ctx.frame.current = frame;
    settle.current = SETTLE_FRAMES;
  });

  return null;
}

/**
 * Kleine Render-Engine statt @react-three/fiber: R3F kostet 61 KB gzip und
 * hätte das Viewer-Budget (≤ 350 KB gzip inkl. three.js) gesprengt
 * (Messung platzhirsch-prodtest 28.10.2026: 377 KB mit, ≈ 316 KB ohne).
 * Gleiches Muster wie frameloop "demand": invalidate() plant genau ein Bild.
 */
function useEngine(hostRef, { strong, capture, first }) {
  const [ctx, setCtx] = useState(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const gl = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: Boolean(capture) });
    gl.setPixelRatio(strong ? Math.min(window.devicePixelRatio || 1, 1.75) : 1);
    gl.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
    host.appendChild(gl.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(first.fov, 1, 0.05, 200);
    camera.position.copy(first.pos);
    const size = { width: 1, height: 1 };
    const frame = { current: null };
    let raf = 0;
    const draw = () => {
      raf = 0;
      frame.current?.();
      gl.render(scene, camera);
    };
    const invalidate = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const resize = () => {
      size.width = host.clientWidth || 1;
      size.height = host.clientHeight || 1;
      gl.setSize(size.width, size.height, false);
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
      invalidate();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    setCtx({ gl, scene, camera, invalidate, size, frame });
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      frame.current = null;
      gl.dispose();
      gl.forceContextLoss?.();
      gl.domElement.remove();
    };
    // Einmal je Viewer: strong/capture ändern sich während eines Rundgangs nicht.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ctx;
}

/**
 * @param {object} props
 * @param {object} props.tour            buildTour()-Ergebnis
 * @param {number} props.stationIndex
 * @param {"tag"|"abend"} props.stimmung
 * @param {boolean} props.reducedMotion
 * @param {boolean} props.strong         starke Geräte: hi-Stufe nachladen, dpr bis 1,75
 * @param {React.MutableRefObject<Map<string, HTMLElement>>} props.hotspotEls
 * @param {React.MutableRefObject<object>} props.apiRef
 */
export default function SplatViewer(props) {
  const { strong, tour, stationIndex, capture } = props;
  const hostRef = useRef(null);
  const [first] = useState(() => cameraFor(tour.stations[stationIndex]) || { pos: new THREE.Vector3(0, 1.6, 3), fov: 60 });
  const ctx = useEngine(hostRef, { strong, capture, first });
  return (
    <div ref={hostRef} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
      {ctx && <Scene ctx={ctx} {...props} />}
    </div>
  );
}
