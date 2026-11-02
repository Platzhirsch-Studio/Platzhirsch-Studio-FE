// Ezarri-Konfigurator – Kameraführung und Qualitätsstufen der 3D-Bühne (rein, ohne three).
// Läuft in Browser und node --test; Stage.js (eager) und Stage3D.js (lazy) teilen es.
//
// - buehnenPresets: Kamerapunkte aus geometry.cameraPresets, für die Bühne verfeinert
//   (Wasserlinie knapp ÜBER dem Spiegel statt auf Beckenkopf-Höhe, Pool-Nahsicht).
// - begrenzeKamera: hält die Kamera über bzw. unter Wasser und aus Wänden/Boden heraus.
// - flugPfad: weiche Übergänge (Kugelbahn um das Ziel; Tauchgang über einen Wegpunkt).
// - Qualitätsstufen + Frame-Time-Wächter (Median > 22 ms über 40 Bilder → eine Stufe runter).
import { cameraPresets, depthAt, outline, waterLevel } from "@/lib/ezarri/konfigurator/geometry";

/** Reihenfolge der Kamerapunkte in der Leiste (nur vorhandene werden gezeigt). */
export const PRESET_REIHENFOLGE = Object.freeze(["uebersicht", "wasserlinie", "unterwasser", "vogel", "treppe", "nah"]);

/** Abstand der Wasserlinien-Kamera über dem Spiegel (m). */
export const WASSERLINIE_HOEHE = 0.08;
/** Mindestabstände (m) für die Begrenzung. */
export const ABSTAND = Object.freeze({ ueberWasser: 0.045, unterWasser: 0.07, wand: 0.12, boden: 0.12, gelaende: 0.1 });

/**
 * Kamerapunkte der Bühne: { id: { pos, target, modus: "ueber"|"unter"|"innen" } } in Leisten-Reihenfolge.
 */
export function buehnenPresets(becken, szene = "pool") {
  const roh = cameraPresets(becken, szene);
  const wl = waterLevel(becken, szene);
  const p = { ...roh };
  if (wl != null && p.wasserlinie) {
    // QM: „Wasserlinie“ lag auf y = 0 (Beckenkopf) – beim Zoomen halb unter Wasser. Jetzt knapp darüber.
    // Blickziel etwas tiefer: mehr Wasserfläche/Spiegelung, Horizont im oberen Drittel
    const t = p.wasserlinie.target;
    p.wasserlinie = { ...p.wasserlinie, pos: [p.wasserlinie.pos[0], wl + WASSERLINIE_HOEHE, p.wasserlinie.pos[2]], target: [t[0], Math.min(t[1], wl - 0.55), t[2]] };
  }
  if (szene === "pool" && p.unterwasser) {
    // Tauchblick: aus der tiefen Hälfte zurück zur Treppe – Stufen-Silhouette, Wasserspiegel von unten
    const hx = becken.l / 2;
    const hz = becken.b / 2;
    const x = hx * 0.3;
    const y = Math.max(-depthAt(becken, x, szene) + 0.45, wl - 0.6);
    p.unterwasser = { pos: [x, y, -hz * 0.4], target: [-hx, y - 0.12, hz * 0.15] };
  }
  if (szene === "pool" && !p.nah) {
    // Nahsicht: Längswand an der Wasserlinie, ca. 1,2 m Abstand – Steine, Fuge, Kaustik.
    const hz = becken.b / 2;
    const x = Math.min(1.2, becken.l * 0.12);
    p.nah = { pos: [x - 0.5, wl + 0.32, -hz + 1.15], target: [x + 0.25, wl - 0.3, -hz] };
  }
  const out = {};
  const ids = [...PRESET_REIHENFOLGE, ...Object.keys(p).filter((id) => !PRESET_REIHENFOLGE.includes(id))];
  for (const id of ids) {
    if (!p[id]) continue;
    out[id] = { pos: [...p[id].pos], target: [...p[id].target], modus: wl == null ? "innen" : p[id].pos[1] < wl ? "unter" : "ueber" };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Begrenzung

function inPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Nächster Punkt auf dem Polygonrand: { d, x, z }. */
function naechsterRand(x, z, poly) {
  let best = { d: Infinity, x, z };
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i];
    const [bx, bz] = poly[(i + 1) % poly.length];
    const dx = bx - ax;
    const dz = bz - az;
    const L = dx * dx + dz * dz || 1;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / L));
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { d, x: px, z: pz };
  }
  return best;
}

/** Vorberechnete Begrenzungsdaten der Szene. */
export function kameraRahmen(becken, szene = "pool") {
  const wl = waterLevel(becken, szene);
  if (wl == null) return null;
  const poly = outline(becken, szene);
  let cx = 0;
  let cz = 0;
  for (const [x, z] of poly) {
    cx += x / poly.length;
    cz += z / poly.length;
  }
  return { wl, poly, cx, cz, becken, szene, S: Math.max(becken.l, becken.b) };
}

/**
 * Kamera begrenzen. modus "ueber": nie unter den Wasserspiegel, außerhalb des Beckens über dem
 * Gelände, an der Wand nicht in die Wand. modus "unter": im Becken, unter dem Spiegel, über dem Boden.
 * @returns {[number, number, number]}
 */
export function begrenzeKamera(pos, modus, rahmen) {
  let [x, y, z] = pos;
  if (!rahmen || modus === "innen") return [x, y, z];
  const { wl, poly, cx, cz, becken, szene } = rahmen;
  const drin = inPolygon(x, z, poly);
  const rand = naechsterRand(x, z, poly);
  if (modus === "unter") {
    if (!drin || rand.d < ABSTAND.wand) {
      // auf den Rand projizieren und um den Wandabstand nach innen (Richtung Schwerpunkt) schieben
      const nx = cx - rand.x;
      const nz = cz - rand.z;
      const n = Math.hypot(nx, nz) || 1;
      x = rand.x + (nx / n) * ABSTAND.wand;
      z = rand.z + (nz / n) * ABSTAND.wand;
    }
    // Boden liegt bei y = −Tiefe (Beckenkopf y = 0); Stufen/Bank decken die Begrenzung nicht ab
    const boden = Math.min(-depthAt(becken, x, szene) + ABSTAND.boden, wl - ABSTAND.unterWasser);
    y = Math.min(wl - ABSTAND.unterWasser, Math.max(boden, y));
    return [x, y, z];
  }
  if (drin) {
    y = Math.max(y, wl + ABSTAND.ueberWasser);
    // zwischen Spiegel und Beckenkopf nicht in die Wand
    if (y < 0.03 && rand.d < ABSTAND.wand) {
      const nx = cx - rand.x;
      const nz = cz - rand.z;
      const n = Math.hypot(nx, nz) || 1;
      x = rand.x + (nx / n) * ABSTAND.wand;
      z = rand.z + (nz / n) * ABSTAND.wand;
    }
  } else {
    // außerhalb: über Terrasse/Rasen; nahe am Rand zusätzlich über dem Beckenkopf
    y = Math.max(y, rand.d < 0.45 ? 0.16 : ABSTAND.gelaende);
  }
  return [x, Math.min(y, rahmen.S * 3 + 6), z];
}

/** Ziel (Orbit-Mittelpunkt) in einem sinnvollen Kasten halten (kein Wegschieben ins Leere). */
export function begrenzeZiel(t, rahmen) {
  if (!rahmen) return t;
  const { S, becken } = rahmen;
  const lim = S * 0.9 + 1;
  return [Math.min(lim, Math.max(-lim, t[0])), Math.min(1.5, Math.max(-(becken.tTief || 2) - 0.2, t[1])), Math.min(lim, Math.max(-lim, t[2]))];
}

// ---------------------------------------------------------------------------
// Flüge

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutQuint = (t) => 1 - (1 - t) ** 5;
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function sph(v) {
  const r = Math.hypot(...v) || 1e-6;
  return { r, theta: Math.atan2(v[0], v[2]), phi: Math.acos(Math.min(1, Math.max(-1, v[1] / r))) };
}
function vec({ r, theta, phi }) {
  return [r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.cos(theta)];
}

/**
 * Flugpfad zwischen zwei Kamerastellungen. Gleicher Modus: Kugelbahn um das (gleitende) Ziel,
 * Azimut auf kürzestem Weg, Radius logarithmisch – kein gerader Schnitt durch Beckenkopf oder Wand.
 * Moduswechsel (Tauchen/Auftauchen): weiche Bahn über einen Wegpunkt knapp über dem Wasser im Becken.
 * @returns {{dauer:number, at:(t:number)=>{pos:number[], target:number[]}}}
 */
export function flugPfad(von, nach, { wl = null, modusVon = "ueber", modusNach = "ueber", tempo = 1, dauer: fest = 0 } = {}) {
  const dist = Math.hypot(...sub(nach.pos, von.pos)) + Math.hypot(...sub(nach.target, von.target)) * 0.5;
  const dauer = fest || Math.round(Math.min(2000, Math.max(850, 700 + dist * 110)) * tempo);
  if (wl != null && modusVon !== modusNach) {
    const innen = modusNach === "unter" ? nach.pos : von.pos;
    const W = [innen[0], wl + 0.4, innen[2]];
    // quadratische Bézier-Kurve, die bei t = 0,5 durch W läuft: C = 2W − (A+B)/2
    const ctrl = [0, 1, 2].map((i) => 2 * W[i] - (von.pos[i] + nach.pos[i]) / 2);
    return {
      dauer: fest || Math.round(dauer * 1.15),
      at(t) {
        const e = easeInOutCubic(t);
        const u = 1 - e;
        const pos = [0, 1, 2].map((i) => u * u * von.pos[i] + 2 * u * e * ctrl[i] + e * e * nach.pos[i]);
        return { pos, target: lerp(von.target, nach.target, easeInOutSine(t)) };
      },
    };
  }
  const a = sph(sub(von.pos, von.target));
  const b = sph(sub(nach.pos, nach.target));
  let dTheta = b.theta - a.theta;
  while (dTheta > Math.PI) dTheta -= Math.PI * 2;
  while (dTheta < -Math.PI) dTheta += Math.PI * 2;
  return {
    dauer,
    at(t) {
      const e = easeInOutCubic(t);
      const target = lerp(von.target, nach.target, e);
      const s = { r: Math.exp(Math.log(a.r) + (Math.log(b.r) - Math.log(a.r)) * e), theta: a.theta + dTheta * e, phi: a.phi + (b.phi - a.phi) * e };
      return { pos: add(target, vec(s)), target };
    },
  };
}

/** Startpunkt des Einflugs: höher, weiter und um ~40° gedreht über der Zielstellung. */
export function introStart(preset, S = 8) {
  const s = sph(sub(preset.pos, preset.target));
  const r = Math.max(s.r * 1.9, S * 1.2);
  const phi = Math.max(0.35, s.phi * 0.62);
  return { pos: add(preset.target, vec({ r, theta: s.theta - 0.7, phi })), target: [...preset.target] };
}

/** „Ankommen“ nach dem Poster-Überblenden: kleine Drehung (+6°) und 5 % näher. */
export function ankommen(preset) {
  const s = sph(sub(preset.pos, preset.target));
  return { pos: add(preset.target, vec({ r: s.r * 0.95, theta: s.theta + 0.1, phi: s.phi })), target: [...preset.target] };
}

// ---------------------------------------------------------------------------
// Qualitätsstufen

/**
 * Stufen von hoch (0) nach niedrig. dpr ist eine Obergrenze (Canvas-dpr bleibt nach Lehre
 * Yacht/WebKit fest; Wechsel nur außerhalb von WebKit). schatten = Shadow-Map-Kante (0 = aus),
 * brechung = Auflösungsfaktor eines Brechungs-Puffers (0 = aus), wasserFps = Takt der Wasserbewegung.
 */
export const STUFEN = Object.freeze([
  Object.freeze({ id: "hoch", dpr: 1.5, wasserFps: 60, envAufloesung: 256, schatten: 2048, brechung: 1, effekte: Object.freeze({ bloom: true, kaustik: true, glanz: true }) }),
  Object.freeze({ id: "mittel", dpr: 1.25, wasserFps: 30, envAufloesung: 256, schatten: 1024, brechung: 0.5, effekte: Object.freeze({ bloom: false, kaustik: true, glanz: true }) }),
  Object.freeze({ id: "niedrig", dpr: 1, wasserFps: 30, envAufloesung: 128, schatten: 0, brechung: 0, effekte: Object.freeze({ bloom: false, kaustik: true, glanz: false }) }),
]);

/** Startstufe aus Geräte-Hinweisen (vor dem ersten Bild). */
export function startStufe({ touch = false, speicher = 8, kerne = 8, sparen = false } = {}) {
  if (sparen || speicher <= 2 || kerne <= 2) return 2;
  if (touch) return speicher <= 3 || kerne <= 4 ? 2 : 1;
  if (speicher <= 4 || kerne <= 4) return 1;
  return 0;
}

/**
 * Frame-Time-Wächter: zählt nur zusammenhängende Bilder (Abstand < 250 ms). Liefert true,
 * sobald der Median der letzten `fenster` Bildzeiten über `grenze` ms liegt; danach erst
 * wieder nach einem vollen neuen Fenster.
 */
export function createWaechter({ fenster = 40, grenze = 22 } = {}) {
  let werte = [];
  let median = 0;
  return {
    push(ms) {
      if (!(ms > 0) || ms > 250) return false;
      werte.push(ms);
      if (werte.length < fenster) return false;
      if (werte.length > fenster) werte.shift();
      const s = [...werte].sort((a, b) => a - b);
      median = (s[(fenster - 1) >> 1] + s[fenster >> 1]) / 2;
      if (median > grenze) {
        werte = [];
        return true;
      }
      return false;
    },
    reset() {
      werte = [];
    },
    get anzahl() {
      return werte.length;
    },
    /** zuletzt berechneter Median (ms) */
    get median() {
      return median;
    },
  };
}
