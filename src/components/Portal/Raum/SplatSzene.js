// Gaussian-Splat-Szene auf three.js (WebGL2), ohne zusätzliches Paket.
// - Splats: instanzierte Quads, Kovarianz-Projektion (EWA) im Vertex-Shader,
//   Rückwärts-Sortierung in einem Web Worker (16-Bit-Zählsortierung).
// - Planung: weiche Volumen (Quader, halbtransparent, Kanten) in Welt-Metern.
// - Rendern nur bei Änderung (Kamera, Sortierung, Ebenen) – schont Akku.
// - Picking: Strahl gegen die Splat-Mitten (für Maßstab, Boden, Kommentare).
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { pickeStrahl } from "@/lib/raumzwilling/picken";

const TEX_W = 2048;

const VERT = /* glsl */ `
precision highp float;
precision highp int;
uniform highp sampler2D uCenter;
uniform highp sampler2D uCovA;
uniform highp sampler2D uCovB;
uniform lowp sampler2D uColor;
uniform int uTexW;
uniform vec2 uViewport;
uniform vec2 uFocal;
in float splatIndex;
out vec4 vColor;
out vec2 vPos;
void main() {
  int idx = int(splatIndex);
  ivec2 uv = ivec2(idx % uTexW, idx / uTexW);
  vec3 c = texelFetch(uCenter, uv, 0).xyz;
  vec4 cam = modelViewMatrix * vec4(c, 1.0);
  vec4 clip = projectionMatrix * cam;
  float lim = 1.25 * clip.w;
  if (cam.z > -0.03 || clip.x < -lim || clip.x > lim || clip.y < -lim || clip.y > lim) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    return;
  }
  vec4 a = texelFetch(uCovA, uv, 0);
  vec2 b = texelFetch(uCovB, uv, 0).xy;
  mat3 Vrk = mat3(a.x, a.y, a.z, a.y, a.w, b.x, a.z, b.x, b.y);
  float z = cam.z;
  mat3 J = mat3(
    uFocal.x / -z, 0.0, 0.0,
    0.0, uFocal.y / -z, 0.0,
    uFocal.x * cam.x / (z * z), uFocal.y * cam.y / (z * z), 0.0
  );
  mat3 T = J * mat3(modelViewMatrix);
  mat3 cov = T * Vrk * transpose(T);
  float d1 = cov[0][0] + 0.3;
  float d2 = cov[1][1] + 0.3;
  float od = cov[0][1];
  float mid = 0.5 * (d1 + d2);
  float rad = length(vec2(0.5 * (d1 - d2), od));
  float l1 = mid + rad;
  float l2 = max(mid - rad, 0.1);
  vec2 diag = normalize(vec2(od, l1 - d1) + vec2(1e-6, 0.0));
  vec2 major = min(sqrt(l1), 128.0) * diag;
  vec2 minor = min(sqrt(l2), 128.0) * vec2(diag.y, -diag.x);
  vColor = texelFetch(uColor, uv, 0);
  vPos = position.xy;
  vec2 ndc = clip.xy / clip.w;
  vec2 off = (position.x * major + position.y * minor) * 2.0 / uViewport;
  gl_Position = vec4(ndc + off, clip.z / clip.w, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity;
in vec4 vColor;
in vec2 vPos;
out vec4 outColor;
void main() {
  float A = dot(vPos, vPos);
  if (A > 6.25) discard;
  float B = exp(-0.5 * A) * vColor.a * uOpacity;
  if (B < 0.004) discard;
  outColor = vec4(vColor.rgb * B, B);
}`;

// Sortier-Worker (als Blob-URL; CSP erlaubt worker-src blob:).
const WORKER = `
let pos = null, n = 0, alt = null;
onmessage = (e) => {
  if (e.data.pos) { pos = e.data.pos; n = pos.length / 3; return; }
  if (!pos) return;
  const m = e.data.view;
  const tiefe = new Float32Array(n);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = m[2] * pos[3*i] + m[6] * pos[3*i+1] + m[10] * pos[3*i+2] + m[14];
    tiefe[i] = d;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const B = 65536;
  const s = (B - 1) / Math.max(1e-9, max - min);
  const zaehler = new Uint32Array(B);
  const fach = new Uint16Array(n);
  for (let i = 0; i < n; i++) { const k = ((tiefe[i] - min) * s) | 0; fach[i] = k; zaehler[k]++; }
  // three: Kamera blickt nach -z, kleine (negative) Tiefe = weit weg → zuerst zeichnen
  const start = new Uint32Array(B);
  for (let k = 1; k < B; k++) start[k] = start[k-1] + zaehler[k-1];
  const idx = new Float32Array(n);
  for (let i = 0; i < n; i++) idx[start[fach[i]]++] = i;
  postMessage({ idx }, [idx.buffer]);
};`;

function kovarianz(s) {
  const n = s.anzahl;
  const h = Math.ceil(n / TEX_W);
  const center = new Float32Array(TEX_W * h * 4);
  const covA = new Float32Array(TEX_W * h * 4);
  const covB = new Float32Array(TEX_W * h * 4);
  const color = new Uint8Array(TEX_W * h * 4);
  for (let i = 0; i < n; i++) {
    const [x, y, z, w] = [s.quats[i * 4], s.quats[i * 4 + 1], s.quats[i * 4 + 2], s.quats[i * 4 + 3]];
    const sx = s.skalen[i * 3];
    const sy = s.skalen[i * 3 + 1];
    const sz = s.skalen[i * 3 + 2];
    // Rotationsmatrix aus (x, y, z, w)
    const r00 = 1 - 2 * (y * y + z * z), r01 = 2 * (x * y - w * z), r02 = 2 * (x * z + w * y);
    const r10 = 2 * (x * y + w * z), r11 = 1 - 2 * (x * x + z * z), r12 = 2 * (y * z - w * x);
    const r20 = 2 * (x * z - w * y), r21 = 2 * (y * z + w * x), r22 = 1 - 2 * (x * x + y * y);
    const m00 = r00 * sx, m01 = r01 * sy, m02 = r02 * sz;
    const m10 = r10 * sx, m11 = r11 * sy, m12 = r12 * sz;
    const m20 = r20 * sx, m21 = r21 * sy, m22 = r22 * sz;
    const o = i * 4;
    center[o] = s.positionen[i * 3];
    center[o + 1] = s.positionen[i * 3 + 1];
    center[o + 2] = s.positionen[i * 3 + 2];
    covA[o] = m00 * m00 + m01 * m01 + m02 * m02;
    covA[o + 1] = m00 * m10 + m01 * m11 + m02 * m12;
    covA[o + 2] = m00 * m20 + m01 * m21 + m02 * m22;
    covA[o + 3] = m10 * m10 + m11 * m11 + m12 * m12;
    covB[o] = m10 * m20 + m11 * m21 + m12 * m22;
    covB[o + 1] = m20 * m20 + m21 * m21 + m22 * m22;
    color[o] = s.farben[o];
    color[o + 1] = s.farben[o + 1];
    color[o + 2] = s.farben[o + 2];
    color[o + 3] = s.farben[o + 3];
  }
  const tex = (data, type) => {
    const t = new THREE.DataTexture(data, TEX_W, h, THREE.RGBAFormat, type);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  };
  return {
    center: tex(center, THREE.FloatType),
    covA: tex(covA, THREE.FloatType),
    covB: tex(covB, THREE.FloatType),
    color: tex(color, THREE.UnsignedByteType),
  };
}

export function hatWebgl2() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const ok = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export class SplatSzene {
  constructor(container, { reduzierteBewegung = false, onChange } = {}) {
    this.container = container;
    this.reduziert = reduzierteBewegung;
    this.onChange = onChange || (() => {});
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(new THREE.Color("#ece8e1"), 1);
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.03, 200);
    this.camera.position.set(0, 1.55, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.reduziert;
    this.controls.dampingFactor = 0.12;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 0.05;
    this.controls.maxDistance = 30;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener("change", () => this.anfordern(true));

    this.welt = new THREE.Group(); // Modell → Welt (Maßstab, Boden, Wand)
    this.scene.add(this.welt);
    this.planung = new THREE.Group();
    this.scene.add(this.planung);
    this.markierungen = new THREE.Group();
    this.scene.add(this.markierungen);

    this.splats = null;
    this.daten = null;
    this.worker = null;
    this.workerFrei = true;
    this.sortNoetig = false;
    this.renderNoetig = true;
    this.laeuft = true;
    this.ro = new ResizeObserver(() => this.groesse());
    this.ro.observe(container);
    this.groesse();
    const loop = () => {
      if (!this.laeuft) return;
      this.raf = requestAnimationFrame(loop);
      if (this.controls.enableDamping) this.controls.update();
      if (this.sortNoetig && this.workerFrei && this.splats) this.sortiere();
      if (this.renderNoetig) {
        this.renderNoetig = false;
        this.zeichne();
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  groesse() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.anfordern(true);
  }

  anfordern(sort = false) {
    this.renderNoetig = true;
    if (sort) this.sortNoetig = true;
  }

  zeichne() {
    if (this.splats) {
      const size = new THREE.Vector2();
      this.renderer.getDrawingBufferSize(size);
      const u = this.splats.material.uniforms;
      u.uViewport.value.set(size.x, size.y);
      const p = this.camera.projectionMatrix.elements;
      u.uFocal.value.set((p[0] * size.x) / 2, (p[5] * size.y) / 2);
    }
    this.renderer.render(this.scene, this.camera);
    this.onChange();
  }

  setzeSplats(daten) {
    this.daten = daten;
    const tex = kovarianz(daten);
    const geo = new THREE.InstancedBufferGeometry();
    const q = 2.5;
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-q, -q, 0, q, -q, 0, q, q, 0, -q, q, 0]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const idx = new Float32Array(daten.anzahl);
    for (let i = 0; i < daten.anzahl; i++) idx[i] = i;
    this.indexAttr = new THREE.InstancedBufferAttribute(idx, 1);
    this.indexAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("splatIndex", this.indexAttr);
    geo.instanceCount = daten.anzahl;
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCenter: { value: tex.center },
        uCovA: { value: tex.covA },
        uCovB: { value: tex.covB },
        uColor: { value: tex.color },
        uTexW: { value: TEX_W },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uFocal: { value: new THREE.Vector2(1, 1) },
        uOpacity: { value: 1 },
      },
      transparent: true,
      // Achsen aus der Eigenzerlegung können die Wicklung des Quads umdrehen.
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    this.splats = new THREE.Mesh(geo, mat);
    this.splats.frustumCulled = false;
    this.splats.renderOrder = 0;
    this.welt.add(this.splats);
    this.texturen = tex;

    const url = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));
    this.worker = new Worker(url);
    URL.revokeObjectURL(url);
    this.worker.postMessage({ pos: Float32Array.from(daten.positionen) });
    this.worker.onmessage = (e) => {
      this.indexAttr.array.set(e.data.idx);
      this.indexAttr.needsUpdate = true;
      this.workerFrei = true;
      this.anfordern(false);
    };
    this.anfordern(true);
  }

  sortiere() {
    this.sortNoetig = false;
    this.workerFrei = false;
    this.camera.updateMatrixWorld();
    this.splats.updateMatrixWorld();
    const mv = new THREE.Matrix4().multiplyMatrices(this.camera.matrixWorldInverse, this.splats.matrixWorld);
    this.worker.postMessage({ view: Array.from(mv.elements) });
  }

  setzeTransform(t) {
    if (t) {
      this.welt.scale.setScalar(t.faktor);
      this.welt.quaternion.set(t.quat[0], t.quat[1], t.quat[2], t.quat[3]);
      this.welt.position.set(t.versatz[0], t.versatz[1], t.versatz[2]);
    } else {
      this.welt.scale.setScalar(1);
      this.welt.quaternion.identity();
      this.welt.position.set(0, 0, 0);
    }
    this.welt.updateMatrixWorld(true);
    this.anfordern(true);
  }

  sichtbarkeit({ raum = true, planung = true } = {}) {
    if (this.splats) this.splats.visible = raum;
    this.planung.visible = planung;
    this.anfordern(false);
  }

  /** Volumen (Welt-Meter) als weiche Quader. auswahl = id hervorheben. */
  setzeVolumen(volumen, auswahl) {
    for (const c of [...this.planung.children]) {
      this.planung.remove(c);
      c.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    }
    for (const v of volumen) {
      const g = new THREE.Group();
      const w = v.w / 100;
      const d = v.d / 100;
      const h = v.h / 100;
      const aktiv = v.id === auswahl;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ color: aktiv ? "#b08d57" : "#c9b48f", transparent: true, opacity: aktiv ? 0.42 : 0.3, depthWrite: false, depthTest: false })
      );
      box.position.y = h / 2;
      box.renderOrder = 2;
      const kanten = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
        new THREE.LineBasicMaterial({ color: aktiv ? "#1c1a17" : "#3b342b", transparent: true, opacity: 0.85, depthTest: false })
      );
      kanten.position.y = h / 2;
      kanten.renderOrder = 3;
      // Vorderkante (lokal +z) etwas dunkler: zeigt, wohin das Stück blickt.
      const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, Math.min(0.04, h * 0.2)), new THREE.MeshBasicMaterial({ color: "#3b342b", depthTest: false, transparent: true, opacity: 0.8 }));
      front.position.set(0, Math.min(h * 0.5, 0.45), d / 2 + 0.002);
      front.renderOrder = 3;
      g.add(box, kanten, front);
      g.position.set(v.x, v.y || 0, v.z);
      g.rotation.y = (v.rotY * Math.PI) / 180;
      g.userData.id = v.id;
      this.planung.add(g);
    }
    this.anfordern(false);
  }

  /** Markierungen für Picking (Maßstab-/Bodenpunkte), Welt-Koordinaten. */
  setzeMarkierungen(punkte) {
    for (const c of [...this.markierungen.children]) {
      this.markierungen.remove(c);
      c.geometry?.dispose();
      c.material?.dispose();
    }
    const geo = new THREE.SphereGeometry(1, 16, 12);
    punkte.forEach((p, i) => {
      const m = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: i % 2 ? "#8a5a2b" : "#1c1a17", depthTest: false }));
      m.scale.setScalar(p.groesse || 0.025);
      m.position.set(p.welt[0], p.welt[1], p.welt[2]);
      m.renderOrder = 4;
      this.markierungen.add(m);
    });
    if (punkte.length === 2) {
      const lg = new THREE.BufferGeometry().setFromPoints(punkte.map((p) => new THREE.Vector3(...p.welt)));
      const l = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: "#8a5a2b", depthTest: false }));
      l.renderOrder = 4;
      this.markierungen.add(l);
    }
    this.anfordern(false);
  }

  /** Kamera auf einen Standpunkt (Welt). Bei reduzierter Bewegung sofort. */
  geheZu(auge, ziel) {
    const a = new THREE.Vector3(...auge);
    const zv = new THREE.Vector3(...ziel);
    // Drehpunkt 1,2 m vor dem Auge: Ziehen = Umsehen, Mausrad = Gehen.
    const blick = zv.clone().sub(a).normalize();
    const dreh = a.clone().add(blick.multiplyScalar(1.2));
    if (this.reduziert) {
      this.camera.position.copy(a);
      this.controls.target.copy(dreh);
      this.controls.update();
      this.anfordern(true);
      return;
    }
    const startA = this.camera.position.clone();
    const startZ = this.controls.target.clone();
    const t0 = performance.now();
    const dauer = 650;
    const schritt = () => {
      const t = Math.min(1, (performance.now() - t0) / dauer);
      const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      this.camera.position.lerpVectors(startA, a, k);
      this.controls.target.lerpVectors(startZ, dreh, k);
      this.controls.update();
      this.anfordern(true);
      if (t < 1) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
  }

  /** Startansicht ohne Maßstab: von außen auf die Punktwolke. */
  uebersicht() {
    if (!this.daten) return;
    const box = new THREE.Box3();
    const p = this.daten.positionen;
    const v = new THREE.Vector3();
    const schritt = Math.max(1, Math.floor(this.daten.anzahl / 5000));
    this.welt.updateMatrixWorld(true);
    for (let i = 0; i < this.daten.anzahl; i += schritt) box.expandByPoint(v.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]).applyMatrix4(this.welt.matrixWorld));
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2;
    this.camera.position.copy(c).add(new THREE.Vector3(0, r * 0.4, r * 1.3));
    this.controls.target.copy(c);
    this.controls.update();
    this.anfordern(true);
  }

  /** Tastatur: links/rechts umsehen, hoch/runter gehen. */
  taste(key) {
    const t = this.controls.target;
    const cam = this.camera.position;
    const vor = t.clone().sub(cam);
    vor.y = 0;
    if (vor.lengthSq() < 1e-6) vor.set(0, 0, -1);
    vor.normalize();
    const drehe = (rad) => {
      const rel = t.clone().sub(cam).applyAxisAngle(new THREE.Vector3(0, 1, 0), rad);
      t.copy(cam).add(rel);
    };
    if (key === "ArrowLeft") drehe(0.12);
    else if (key === "ArrowRight") drehe(-0.12);
    else if (key === "ArrowUp" || key === "ArrowDown") {
      const s = (key === "ArrowUp" ? 1 : -1) * 0.25;
      cam.addScaledVector(vor, s);
      t.addScaledVector(vor, s);
    } else return false;
    this.controls.update();
    this.anfordern(true);
    return true;
  }

  /**
   * Punkt unter dem Bildschirmpunkt (clientX/Y). Liefert { modell, welt } oder null.
   * Deckkraft entlang des Sehstrahls summiert (lib/raumzwilling/picken.js).
   */
  picke(clientX, clientY) {
    if (!this.daten) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const inv = this.welt.matrixWorld.clone().invert();
    const o = ray.ray.origin.clone().applyMatrix4(inv);
    const d = ray.ray.direction.clone().transformDirection(inv).normalize();
    const treffer = pickeStrahl(this.daten, [o.x, o.y, o.z], [d.x, d.y, d.z]);
    if (!treffer) return null;
    const modell = treffer.punkt;
    const welt = new THREE.Vector3(...modell).applyMatrix4(this.welt.matrixWorld);
    return { modell, welt: [welt.x, welt.y, welt.z] };
  }


  /** Bildschirmposition eines Weltpunkts (für HTML-Beschriftungen). */
  projiziere(welt) {
    const v = new THREE.Vector3(...welt).project(this.camera);
    const sichtbar = v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, sichtbar };
  }

  zerstoere() {
    this.laeuft = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.worker?.terminate();
    this.controls.dispose();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    Object.values(this.texturen || {}).forEach((t) => t.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.renderer.domElement.remove();
  }
}
