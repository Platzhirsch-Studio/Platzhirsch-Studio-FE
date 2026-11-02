// src/lib/raumzwilling/testraum.js
// Synthetischer Testraum mit bekannten Maßen, aus einem Rechenmodell (keine
// Aufnahme, keine KI, keine Kundendaten). Er dient drei Zwecken:
//   1. Demo im Mock-Portal, solange es keine echte Aufnahme gibt
//      (sichtbar gekennzeichnet als „Synthetischer Testraum“).
//   2. Unit-Test des Maßstabs: Wahrheit bekannt → Abweichung messbar.
//   3. Prüfstand für Viewer, SOG-Packer und Standbild-Renderer.
// Wie ein echter Splat aus COLMAP/Brush liegt er in beliebiger Einheit und
// Lage (Faktor, Drehung, Versatz unten). Das Team-Werkzeug muss Maßstab und
// Boden erst setzen – genau wie bei einer echten Aufnahme.

import { drehe, quatAchseWinkel, quatMal } from "./massstab.js";

// Wahrheit in Metern (Boden y = 0, Mitte des Raums bei x = z = 0).
export const TESTRAUM = Object.freeze({
  breite: 4.2,
  tiefe: 3.6,
  hoehe: 2.6,
  tuer: { breite: 0.9, hoehe: 2.05, z: 0.55 }, // linke Wand, Mitte bei z
  fenster: { breite: 1.6, hoehe: 1.4, bruestung: 0.85, x: 0.2 }, // hintere Wand
});

// So „liegt“ der Splat nach der Rekonstruktion: Einheit 1/0,37 m, schief, verschoben.
export const ROH_LAGE = Object.freeze({
  faktor: 0.37,
  quat: quatMal(quatAchseWinkel([0, 1, 0], 0.61), quatAchseWinkel([1, 0, 0.3], 0.23)),
  versatz: [1.7, -0.4, 2.3],
});

const x0 = -TESTRAUM.breite / 2;
const x1 = TESTRAUM.breite / 2;
const z0 = -TESTRAUM.tiefe / 2;
const z1 = TESTRAUM.tiefe / 2;

/** Welt-Meter → Roh-Koordinate des „rekonstruierten“ Splats. */
export function zuRoh(p) {
  const r = drehe(ROH_LAGE.quat, p);
  return [r[0] * ROH_LAGE.faktor + ROH_LAGE.versatz[0], r[1] * ROH_LAGE.faktor + ROH_LAGE.versatz[1], r[2] * ROH_LAGE.faktor + ROH_LAGE.versatz[2]];
}

/** Bekannte Punkte in Welt-Metern (für Kalibrierung und Prüfung). */
export function testraumMarken() {
  const t = TESTRAUM.tuer;
  const f = TESTRAUM.fenster;
  return {
    tuerLinks: [x0, 0, t.z - t.breite / 2],
    tuerRechts: [x0, 0, t.z + t.breite / 2],
    eckeHintenLinks: [x0, 0, z0],
    eckeHintenRechts: [x1, 0, z0],
    eckeVorneRechts: [x1, 0, z1],
    fensterLinksUnten: [f.x - f.breite / 2, f.bruestung, z0],
    fensterRechtsUnten: [f.x + f.breite / 2, f.bruestung, z0],
    // Kontrollstrecke 3,00 m entlang der vorderen Wand (Sockelleiste)
    dreiMeterA: [x0 + 0.6, 0, z1],
    dreiMeterB: [x0 + 3.6, 0, z1],
    // dieselben Strecken auf Augenhöhe (dort, wohin ein Rundgang filmt)
    tuerLinksHoch: [x0, 1.2, t.z - t.breite / 2],
    tuerRechtsHoch: [x0, 1.2, t.z + t.breite / 2],
    wandLinksHoch: [x0, 1.2, z0],
    wandRechtsHoch: [x1, 1.2, z0],
    dreiMeterHochA: [x0 + 0.6, 1.2, z1],
    dreiMeterHochB: [x0 + 3.6, 1.2, z1],
    // ein Punkt sicher über dem Boden
    oben: [0, 1.3, 0],
  };
}

function zufall(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const logit = (p) => Math.log(p / (1 - p));
const dcAus = (c) => (c - 0.5) / 0.28209479177387814;

/**
 * Erzeugt die Splats. abstand = Rasterweite in Metern (Standard 2,5 cm ≈ 100 000 Splats).
 * @returns {{anzahl, positionen, skalenLog, rotationen, farbeDc, deckkraftLogit}}
 */
export function erzeugeTestraum({ abstand = 0.025, seed = 7, struktur = 0.012, licht = 1 } = {}) {
  const rnd = zufall(seed);
  const pos = [];
  const skal = [];
  const farbe = [];
  const deck = [];
  const R = TESTRAUM;
  const dick = abstand * 0.12;
  const flach = abstand * 0.62;

  const helligkeit = licht;
  const punkt = (p, s, c, alpha = 0.96) => {
    pos.push(p);
    skal.push(s);
    farbe.push(c.map((v) => Math.max(0, Math.min(1, v * helligkeit))));
    deck.push(alpha);
  };
  const rauschen = (stark) => (rnd() - 0.5) * stark;

  // Boden: Eichendielen 18 cm breit, entlang x, jede Diele etwas anders.
  for (let x = x0 + abstand / 2; x < x1; x += abstand) {
    for (let z = z0 + abstand / 2; z < z1; z += abstand) {
      const diele = Math.floor((z - z0) / 0.18);
      const ton = 0.92 + ((diele * 37) % 11) / 60;
      const fuge = (z - z0) % 0.18 < 0.014 ? 0.6 : 1;
      const maserung = 0.95 + 0.05 * Math.sin(x * 5.3 + diele * 3.1) + 0.02 * Math.sin(x * 31 + diele);
      const k = ton * fuge * maserung;
      // Teppich in der Raummitte
      const teppich = Math.abs(x - 0.15) < 1.0 && Math.abs(z - 0.25) < 0.7;
      const c = teppich ? [0.44 + rauschen(0.03), 0.47 + rauschen(0.03), 0.41 + rauschen(0.03)] : [0.58 * k, 0.42 * k, 0.28 * k];
      punkt([x + rauschen(abstand * 0.3), teppich ? 0.012 : 0, z + rauschen(abstand * 0.3)], [flach, dick, flach], c);
    }
  }

  // Wände
  const wand = { c: [0.9, 0.88, 0.84] };
  const sockel = [0.82, 0.8, 0.77];
  const imFenster = (x, y) => Math.abs(x - R.fenster.x) < R.fenster.breite / 2 && y > R.fenster.bruestung && y < R.fenster.bruestung + R.fenster.hoehe;
  const imFensterRahmen = (x, y) =>
    Math.abs(x - R.fenster.x) < R.fenster.breite / 2 + 0.05 && y > R.fenster.bruestung - 0.05 && y < R.fenster.bruestung + R.fenster.hoehe + 0.05 && !imFenster(x, y);
  const imHeizkoerper = (x, y) => Math.abs(x - R.fenster.x) < 0.6 && y > 0.15 && y < 0.75;
  const inTuer = (z, y) => Math.abs(z - R.tuer.z) < R.tuer.breite / 2 && y < R.tuer.hoehe;
  const inTuerRahmen = (z, y) => Math.abs(z - R.tuer.z) < R.tuer.breite / 2 + 0.06 && y < R.tuer.hoehe + 0.06 && !inTuer(z, y);

  const wandFarbe = (y, licht) => {
    if (y < 0.06) return sockel;
    const v = licht + rauschen(struktur);
    return [wand.c[0] * v, wand.c[1] * v, wand.c[2] * v];
  };

  for (let y = abstand / 2; y < R.hoehe; y += abstand) {
    for (let x = x0 + abstand / 2; x < x1; x += abstand) {
      // hintere Wand (Fensterwand), z = z0
      let c;
      if (imFenster(x, y)) {
        const t = (y - R.fenster.bruestung) / R.fenster.hoehe;
        const sprosse = Math.abs(x - R.fenster.x) < 0.02 ? 0.35 : 1;
        c = sprosse < 1 ? [0.33, 0.33, 0.33] : [0.78 + 0.12 * t, 0.86 + 0.08 * t, 0.94 + 0.04 * t];
      } else if (imFensterRahmen(x, y)) c = [0.3, 0.3, 0.31];
      else c = wandFarbe(y, 0.97);
      punkt([x, y, z0], [flach, flach, dick], c);
      // vordere Wand, z = z1 (Bild als dunkle Fläche)
      const bild = Math.abs(x + 0.4) < 0.45 && Math.abs(y - 1.55) < 0.32;
      punkt([x, y, z1], [flach, flach, dick], bild ? [0.22 + 0.1 * Math.sin(x * 9), 0.26, 0.3 + 0.05 * Math.cos(y * 7)] : wandFarbe(y, 0.88));
      // Heizkörper vor der Fensterwand
      if (imHeizkoerper(x, y) && Math.round((x - x0) / abstand) % 2 === 0) {
        punkt([x, y, z0 + 0.1], [flach * 0.6, flach, dick], [0.95, 0.95, 0.94]);
      }
    }
    for (let z = z0 + abstand / 2; z < z1; z += abstand) {
      // linke Wand mit Tür, x = x0
      let c;
      if (inTuer(z, y)) c = [0.72 + rauschen(0.01), 0.68, 0.62];
      else if (inTuerRahmen(z, y)) c = [0.95, 0.94, 0.92];
      else c = wandFarbe(y, 0.92);
      punkt([x0, y, z], [dick, flach, flach], c);
      // Türgriff
      if (Math.abs(z - (R.tuer.z + R.tuer.breite / 2 - 0.08)) < 0.05 && Math.abs(y - 1.05) < 0.015) {
        punkt([x0 + 0.04, y, z], [dick * 2, flach * 0.5, flach * 0.8], [0.62, 0.6, 0.55]);
      }
      // rechte Wand, x = x1
      punkt([x1, y, z], [dick, flach, flach], wandFarbe(y, 0.85));
    }
  }

  // Decke (gröber)
  const da = abstand * 1.6;
  for (let x = x0 + da / 2; x < x1; x += da) {
    for (let z = z0 + da / 2; z < z1; z += da) {
      const leuchte = Math.hypot(x - 0.15, z - 0.25) < 0.18;
      punkt([x, R.hoehe, z], [da * 0.62, dick, da * 0.62], leuchte ? [1, 0.97, 0.9] : [0.93, 0.93, 0.92]);
    }
  }

  const n = pos.length;
  const positionen = new Float32Array(n * 3);
  const skalenLog = new Float32Array(n * 3);
  const rotationen = new Float32Array(n * 4);
  const farbeDc = new Float32Array(n * 3);
  const deckkraftLogit = new Float32Array(n);
  const q = ROH_LAGE.quat; // (x, y, z, w)
  for (let i = 0; i < n; i++) {
    const r = zuRoh(pos[i]);
    positionen.set(r, i * 3);
    for (let k = 0; k < 3; k++) {
      skalenLog[i * 3 + k] = Math.log(skal[i][k] * ROH_LAGE.faktor);
      farbeDc[i * 3 + k] = dcAus(farbe[i][k]);
    }
    rotationen.set([q[3], q[0], q[1], q[2]], i * 4); // (w, x, y, z)
    deckkraftLogit[i] = logit(deck[i]);
  }
  return { anzahl: n, positionen, skalenLog, rotationen, farbeDc, deckkraftLogit };
}
