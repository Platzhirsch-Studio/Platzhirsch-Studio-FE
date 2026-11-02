"use client";
/* eslint-disable react-hooks/immutability -- three.js objects (scene,
   controls, DOM overlay) are mutable by design; all mutations happen in
   effects or useFrame, never during render. */
// Werfthalle – the interactive 3D boat of /de/yacht-interior.
// Loaded ONLY via next/dynamic (ssr: false) from Werfthalle.js once the stage
// is visible (desktop) or after a click (mobile), so three.js and
// @react-three/* never land in the initial bundle (Design-Bibel §13).
// - One procedural generator for all six hulls (src/lib/yacht/hull.js).
// - Furniture = abstract blocks in the concept colours, no designer pieces
//   rebuilt in 3D (Bibel §14, EuGH Mio/konektra).
// - frameloop "demand": a frame is drawn only on camera moves, the section
//   cut and the light switch – no idle GPU work, smooth on phones.
// - Section cut WITHOUT clipping planes (QA round 2, P2.5): parts above the
//   cut are hidden, crossing parts are shortened and volumes opened to
//   four walls (sectionParts in hull.js),
//   the deck is hidden below the sheer and the hull is split into a far and
//   a near half – the near half is hidden for cabins below deck. Plain
//   geometry + visibility works in every renderer (iOS/WebKit included).
// - No CDN/HDRI: local RoomEnvironment for the clearcoat reflections.
// - Canvas is aria-hidden; all actions exist as DOM buttons (Werfthalle.js).
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl, ContactShadows } from "@react-three/drei";
import { buildDeck, buildHull, buildModel, cameraFor, deckVisible, sectionParts } from "@/lib/yacht/hull";
import { HALL, MATERIAL_TONES, TOKENS } from "@/lib/yacht/palette";
import { createGeometryCache, createMaterialCache, keyedParts } from "@/lib/yacht/stageAssets";
import { isTouch } from "@/lib/yacht/device";

const DEG = Math.PI / 180;
const FOV = 32;

function useTeakTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = MATERIAL_TONES.teak;
    g.fillRect(0, 0, 256, 256);
    // 8 planks per tile, dark caulking, faint grain
    for (let i = 0; i < 8; i++) {
      const y = i * 32;
      g.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
      g.fillRect(0, y, 256, 32);
      g.fillStyle = "rgba(31,37,43,0.85)";
      g.fillRect(0, y, 256, 2);
      g.fillRect(((i * 97) % 256) | 0, y, 2, 32);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 3.2, 1 / 0.96); // 3.2 m plank length, 12 cm planks
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * Hull with vertex colours: antifouling, boot stripe, topside. Two meshes:
 * the far half (z <= 0) and the near half (z > 0, camera side). For a cabin
 * below deck the near half is hidden – the cutaway, without clipping planes.
 */
function Hull({ hull, open, finish }) {
  const [far, near] = useMemo(() => {
    const { positions, indices, uvs } = buildHull(hull);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    const top = new THREE.Color(MATERIAL_TONES[finish] || MATERIAL_TONES.gelcoat);
    const bottom = new THREE.Color(MATERIAL_TONES.antifouling);
    const stripe = new THREE.Color(MATERIAL_TONES.bootStripe);
    const colors = [];
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const c = y < 0 ? bottom : y < 0.07 ? stripe : top;
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    // split the triangles by the side of their centroid (normals stay smooth)
    const farIdx = [];
    const nearIdx = [];
    for (let i = 0; i < indices.length; i += 3) {
      const zc = (positions[indices[i] * 3 + 2] + positions[indices[i + 1] * 3 + 2] + positions[indices[i + 2] * 3 + 2]) / 3;
      (zc > 1e-4 ? nearIdx : farIdx).push(indices[i], indices[i + 1], indices[i + 2]);
    }
    const a = g.clone();
    a.setIndex(farIdx);
    const b = g.clone();
    b.setIndex(nearIdx);
    g.dispose();
    return [a, b];
  }, [hull, finish]);
  useEffect(
    () => () => {
      far.dispose();
      near.dispose();
    },
    [far, near]
  );
  return (
    <>
      <mesh geometry={far}>
        <meshPhysicalMaterial vertexColors side={THREE.DoubleSide} roughness={0.3} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh geometry={near} visible={!open}>
        <meshPhysicalMaterial vertexColors side={THREE.DoubleSide} roughness={0.3} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
    </>
  );
}

function Deck({ hull, teak, visible }) {
  const geometry = useMemo(() => {
    const { positions, indices, uvs } = buildDeck(hull);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [hull]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const wood = hull.finish === "holz";
  return (
    <mesh geometry={geometry} visible={visible}>
      <meshStandardMaterial
        map={wood ? null : teak}
        color={wood ? MATERIAL_TONES.holz : TOKENS.paper}
        roughness={wood ? 0.3 : 0.75}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Shared geometries (one per part size) and materials (one per material id)
 * for the model on stage – see src/lib/yacht/stageAssets.js. Disposed when
 * the boat, the palette or the stage goes.
 */
function useStageAssets(modelKey, palette, finish, teak, evening, invalidate) {
  const geometries = useMemo(() => createGeometryCache(), [modelKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geometries.dispose(), [geometries]);
  const materials = useMemo(() => createMaterialCache({ palette, finish, teak }), [palette, finish, teak]);
  useEffect(() => () => materials.dispose(), [materials]);
  // evening switch: three materials change in place (no new shaders)
  useEffect(() => {
    materials.setEvening(evening);
    invalidate();
  }, [materials, evening, invalidate]);
  return { geometries, materials };
}

// dispose={null}: geometry and material are shared – R3F must not dispose
// them when one part unmounts (the caches do that).
function Part({ part, geometries, materials }) {
  return <mesh dispose={null} geometry={geometries.get(part)} material={materials.get(part.mat)} position={part.p} rotation={part.rot || undefined} />;
}

/** Model appears (scale-in, about 400 ms) and stops drawing; a cut change redraws once. */
function Animator({ cut, groupRef, reduced, modelKey }) {
  const invalidate = useThree((s) => s.invalidate);
  const start = useRef(0);
  useEffect(() => {
    start.current = performance.now();
    invalidate();
  }, [modelKey, invalidate]);
  useEffect(() => {
    invalidate();
  }, [cut, invalidate]);
  useFrame(() => {
    let busy = false;
    const g = groupRef.current;
    if (g) {
      const k = reduced ? 1 : Math.min(1, (performance.now() - start.current) / 400);
      const e = 1 - Math.pow(1 - k, 3);
      g.scale.setScalar(0.97 + 0.03 * e);
      if (k < 1) busy = true;
    }
    if (busy) invalidate();
  });
  return null;
}

/**
 * Moves the DOM hotspot buttons (outside the canvas) onto the zone anchors,
 * with collision avoidance: labels are placed in priority order (active
 * zone first, then the zone list); a label whose box would overlap an
 * already placed one shrinks to its dot. With an active zone only its label
 * shows text; in the overview below 768 px at most three labels do. No layout reads per frame (label width
 * is estimated from its text).
 */
function Projector({ model, zones, zone, hotRefs }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  // QM r4 (200 % Text: „Kabine“ lag über „Salon“): die geschätzte Labelgröße wächst mit der
  // Schriftgröße der Seite – einmal je Bühnengröße gelesen, nicht pro Frame.
  const scale = useRef(1);
  const { size: stageSize } = useThree();
  useEffect(() => {
    const px = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    scale.current = px > 0 ? px / 16 : 1;
  }, [stageSize.width, stageSize.height]);
  useFrame(({ camera, size }) => {
    const narrow = size.width < 768;
    const k = scale.current;
    const items = [];
    for (const z of zones) {
      const el = hotRefs.current[z.id];
      const a = model.anchors[z.id];
      if (!el || !a) continue;
      v.set(a[0], a[1], a[2]).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const inside = v.z < 1 && x > 8 && x < size.width - 8 && y > 8 && y < size.height - 8;
      items.push({ id: z.id, el, x, y, inside, w: (z.short.length * 7.6 + 36) * k });
    }
    items.sort((p, q) => Number(q.id === zone) - Number(p.id === zone));
    const placed = [];
    const hits = (r) => placed.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]);
    for (const it of items) {
      // with an active zone only its label shows text; in the overview the
      // labels that fit (collision check below), max. 3 on phones
      let compact = Boolean(zone) && it.id !== zone;
      if (!zone && narrow && placed.filter((r) => r[2] - r[0] > 40).length >= 3) compact = true;
      const full = [it.x - it.w / 2 - 4, it.y - 20 * k, it.x + it.w / 2 + 4, it.y + 20 * k];
      if (!compact && it.inside && hits(full)) compact = true;
      const dot = [it.x - 12 * k, it.y - 12 * k, it.x + 12 * k, it.y + 12 * k];
      // QM r2: ein Punkt, der auf einem schon platzierten Label läge („Cabin“ überdeckt), entfällt –
      // die Zonenliste unter der Bühne bleibt der zugängliche Weg.
      const zeigen = it.inside && !(compact && hits(dot));
      if (zeigen) placed.push(compact ? dot : full);
      const flag = compact ? "on" : "";
      if (it.el.dataset.compact !== flag) it.el.dataset.compact = flag;
      it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      it.el.style.visibility = zeigen ? "visible" : "hidden";
    }
  });
  return null;
}

function Scene({ modelKey, zones, zone, palette, evening, reduced, apiRef, onReady, coarse, hotRefs }) {
  const model = useMemo(() => buildModel(modelKey), [modelKey]);
  const controls = useRef(null);
  const group = useRef(null);
  const teak = useTeakTexture();
  const { size, invalidate, gl } = useThree();
  const showSteg = zones.some((z) => z.id === "bootshaus");
  const cam = cameraFor(model, zone, size.width / Math.max(1, size.height), FOV);
  const hall = evening ? HALL.abend : HALL.tag;
  const L = model.hull.L;

  // camera move on zone/model change (900–1200 ms; instant with reduced motion)
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.smoothTime = reduced ? 0 : 0.42;
    c.setLookAt(...cam.position, ...cam.target, !reduced);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey, zone, reduced, size.width, size.height]);

  // touch: one finger scrolls the page, two fingers rotate/zoom (no scroll trap)
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (coarse) {
      c.touches.one = CameraControlsImpl.ACTION.NONE;
      c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE;
      c.touches.three = CameraControlsImpl.ACTION.NONE;
      gl.domElement.style.touchAction = "pan-y";
    }
    c.mouseButtons.wheel = CameraControlsImpl.ACTION.DOLLY;
  }, [coarse, gl]);

  useEffect(() => {
    apiRef.current = {
      rotate: (dx, dy) => {
        controls.current?.rotate(dx, dy, !reduced);
        invalidate();
      },
      zoom: (f) => {
        controls.current?.dolly(f * L * 0.08, !reduced);
        invalidate();
      },
    };
  }, [apiRef, reduced, invalidate, L]);

  // Ready = programs compiled AND a frame drawn (before: on mount, so the
  // poster faded to an empty stage while the physical/sheen shaders were
  // still compiling – up to a second on phones). Once only; the callback
  // from Werfthalle is a new function per render.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const getState = useThree((st) => st.get);
  useEffect(() => {
    const { scene: root, camera } = getState();
    let alive = true;
    let fired = false;
    const fire = () => {
      if (!alive || fired) return;
      fired = true;
      onReadyRef.current?.();
    };
    // a frame is drawn on the next animation frame after invalidate()
    const drawn = () => {
      if (!alive) return;
      invalidate();
      requestAnimationFrame(() => requestAnimationFrame(fire));
    };
    const compile = gl.compileAsync ? gl.compileAsync(root, camera) : Promise.resolve();
    compile.then(drawn, drawn);
    const guard = setTimeout(fire, 4000); // never keep the poster forever
    return () => {
      alive = false;
      clearTimeout(guard);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A resize clears the drawing buffer; with frameloop "demand" nothing
  // redrew it. Redraw on every buffer change, once now and once after layout.
  const viewportDpr = useThree((st) => st.viewport.dpr);
  useEffect(() => {
    invalidate();
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [viewportDpr, size.width, size.height, invalidate]);

  const scene = useThree((st) => st.scene);
  useEffect(() => {
    gl.setClearColor(hall.bg);
    // evening: the local environment light is dimmed, the warm lamps carry the scene
    scene.environmentIntensity = evening ? 0.18 : 1;
    invalidate();
  }, [gl, hall.bg, invalidate, scene, evening]);

  // section cut as geometry: hide/shorten parts above the cut (no clipping planes)
  const parts = useMemo(() => keyedParts(model, cam.cut, showSteg, sectionParts), [model, showSteg, cam.cut]);
  const { geometries, materials } = useStageAssets(modelKey, palette, model.hull.finish, teak, evening, invalidate);

  return (
    <>
      <fog attach="fog" args={[hall.fog, L * 1.6, L * 4.2]} />
      <hemisphereLight args={[evening ? TOKENS.ink : TOKENS.paper, evening ? TOKENS.inkDeep : TOKENS.stoneDeep, evening ? 0.35 : 1.1]} />
      <directionalLight position={[-L * 0.6, L * 0.9, L * 0.5]} intensity={evening ? 0.25 : 1.6} color={evening ? TOKENS.stoneDeep : TOKENS.paper} />
      <directionalLight position={[L * 0.5, L * 0.4, -L * 0.6]} intensity={evening ? 0.1 : 0.45} />
      {/* evening: warm 2,700 K point lights IN the battery lamps (max. 8) */}
      {evening &&
        model.lamps
          .filter((l) => showSteg || l[2] > -(model.hull.B / 2 + 1))
          .slice(0, 8)
          .map((l, i) => <pointLight key={i} position={l} color={MATERIAL_TONES.warm} intensity={1.6 + L * 0.05} distance={Math.max(6, L * 0.5)} decay={1.6} />)}
      {evening && <pointLight position={[0, model.hull.F + 6, L * 0.4]} color={MATERIAL_TONES.warm} intensity={0.5 * L} distance={0} decay={1.2} />}
      <Environment />
      <group ref={group}>
        <Hull hull={model.hull} open={cam.side != null} finish={model.hull.finish} />
        <Deck hull={model.hull} teak={teak} visible={deckVisible(model, cam.cut)} />
        {parts.map((part) => (
          <Part key={part.key} part={part} geometries={geometries} materials={materials} />
        ))}
      </group>
      {/* hall floor + survey grid (Werfthalle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, model.floorY, 0]}>
        <planeGeometry args={[L * 8, L * 8]} />
        <meshStandardMaterial color={hall.floor} roughness={0.95} />
      </mesh>
      <gridHelper args={[L * 4, Math.round(L * 2), hall.grid, hall.grid]} position={[0, model.floorY + 0.005, 0]} />
      {/* soft contact shadow of boat and cradles on the hall floor – baked:
          frames={1} draws it once per render of Scene (boat, zone cut,
          light, resize all re-render it; drei resets its counter per
          render), not on every orbit frame. Before: an extra depth pass of
          the whole boat plus two blur passes on every camera frame. */}
      <ContactShadows frames={1} position={[0, model.floorY + 0.012, 0]} scale={[L * 1.5, L * 0.7]} resolution={512} blur={2.4} far={model.hull.F + 8 - model.floorY} opacity={evening ? 0.7 : 0.45} color={TOKENS.inkDeep} />
      <Projector model={model} zones={zones} zone={zone} hotRefs={hotRefs} />
      <Animator cut={cam.cut} groupRef={group} reduced={reduced} modelKey={modelKey} />
      <CameraControls
        ref={controls}
        makeDefault
        minPolarAngle={20 * DEG}
        maxPolarAngle={80 * DEG}
        minDistance={1.5}
        maxDistance={L * 2.6 + 4}
        dollyToCursor={false}
      />
    </>
  );
}

/**
 * @param {string} modelKey runabout|daycruiser|segelyacht|motoryacht|hausboot|superyacht
 * @param {Array<{id, short}>} zones zones of the selected concept
 * @param {string|null} zone active zone (null = overview)
 * @param {(id: string|null) => void} onSelect
 * @param {string[]} palette concept colours (hex) for the abstract furniture
 * @param {boolean} evening Seelicht switch
 * @param {boolean} reduced reduced motion / "Ruhige Ansicht"
 * @param {{current: object}} apiRef keyboard API (rotate, zoom)
 * @param {() => void} onReady first frame drawn
 * @param {() => void} onError WebGL context lost
 */
export default function Stage3D({ modelKey, zones, zone, onSelect, palette, evening, reduced, apiRef, onReady, onError }) {
  // fixed pixel ratio, chosen once: a DPR change while the stage is open
  // resized the drawing buffer and left WebKit with an empty canvas after a
  // zone change (QA round 2, P2.5). Phones 1.25, others 1.5 – no PerformanceMonitor.
  const [dpr] = useState(() => (isTouch() ? 1.25 : 1.5));
  const [coarse] = useState(isTouch);
  const hotRefs = useRef({});
  return (
    <div className="relative size-full">
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, dpr]}
      camera={{ fov: FOV, near: 0.1, far: 800, position: [-20, 10, 20] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onError?.();
        });
      }}
      style={{ touchAction: coarse ? "pan-y" : "none" }}
    >
      <Scene
        modelKey={modelKey}
        zones={zones}
        zone={zone}
        palette={palette}
        evening={evening}
        reduced={reduced}
        apiRef={apiRef}
        onReady={onReady}
        coarse={coarse}
        hotRefs={hotRefs}
      />
    </Canvas>
    {/* Hotspots: a mouse/touch convenience on the model. Hidden from AT and
        out of the tab order – the zone buttons below the stage are the
        accessible controls (same actions). */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {zones.map((z) => {
        const on = zone === z.id;
        return (
          <button
            key={z.id}
            ref={(el) => (hotRefs.current[z.id] = el)}
            type="button"
            tabIndex={-1}
            data-yacht-hotspot={z.id}
            onClick={() => onSelect(on ? null : z.id)}
            title={z.short}
            style={{ position: "absolute", left: 0, top: 0, visibility: "hidden" }}
            className={[
              // QM r2: kompakt = runder Punkt mit Ring (las sich als leeres Kästchen); Name als Tooltip
              "pointer-events-auto flex min-h-8 items-center gap-2 whitespace-nowrap px-3 text-small shadow-sm transition-colors duration-(--duration-micro) data-[compact=on]:size-6 data-[compact=on]:min-h-0 data-[compact=on]:justify-center data-[compact=on]:rounded-full data-[compact=on]:p-0 data-[compact=on]:ring-1 data-[compact=on]:ring-ink/30 [&[data-compact=on]_[data-label]]:hidden",
              on ? "bg-ink text-paper" : zone ? "bg-paper/70 text-ink hover:bg-paper" : "bg-paper/90 text-ink hover:bg-paper",
            ].join(" ")}
          >
            <span aria-hidden="true" className={on ? "size-2 bg-brass-400 in-data-[compact=on]:rounded-full" : "size-2 bg-see in-data-[compact=on]:rounded-full"} />
            <span data-label="">{z.short}</span>
          </button>
        );
      })}
    </div>
    </div>
  );
}
