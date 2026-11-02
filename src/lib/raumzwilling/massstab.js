// src/lib/raumzwilling/massstab.js
// Maßstab und Ausrichtung eines Raum-Splats (rein, ohne Abhängigkeiten,
// Browser und Server). Ein Splat aus Kameraposen (COLMAP/Brush) hat eine
// beliebige Einheit und Lage. Das Team legt fest:
//   1. Maßstab: zwei Punkte + bekanntes Maß (z. B. Türlaibung 0,90 m)
//      ODER die vier Ecken eines A4-Blatts auf dem Boden.
//   2. Boden: drei Punkte auf dem Boden → Drehung, sodass der Boden y = 0
//      ist und „oben“ +y.
// Daraus entsteht eine Transformation  welt = R · (p · faktor) + versatz.
// Alle Maße, Volumen und Kommentare werden in Welt-Metern gespeichert.

import { A4 } from "./config.js";

export const MIN_STRECKE_M = 0.05;
export const MAX_STRECKE_M = 40;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a);
  return l > 0 ? mul(a, 1 / l) : [0, 0, 0];
};

export function istPunkt(p) {
  return Array.isArray(p) && p.length === 3 && p.every((v) => Number.isFinite(v) && Math.abs(v) < 1e6);
}

export function abstand(a, b) {
  if (!istPunkt(a) || !istPunkt(b)) throw new TypeError("Punkt erwartet [x, y, z]");
  return len(sub(a, b));
}

/** Relative Abweichung |gemessen − soll| / soll. */
export function abweichung(gemessen, soll) {
  if (!(soll > 0)) throw new RangeError("Sollmaß muss > 0 sein");
  return Math.abs(gemessen - soll) / soll;
}

/**
 * Maßstab aus zwei Punkten (Modell-Einheiten) und dem echten Maß in Metern.
 * @returns {{ faktor:number, quelle:"zwei-punkt", modellStrecke:number, meter:number }}
 */
export function zweiPunktMassstab(a, b, meter) {
  const m = Number(meter);
  if (!Number.isFinite(m) || m < MIN_STRECKE_M || m > MAX_STRECKE_M) {
    throw new RangeError(`Maß zwischen ${MIN_STRECKE_M} und ${MAX_STRECKE_M} m angeben`);
  }
  const d = abstand(a, b);
  if (d < 1e-6) throw new RangeError("Die beiden Punkte liegen aufeinander");
  return { faktor: m / d, quelle: "zwei-punkt", modellStrecke: d, meter: m };
}

/**
 * Maßstab aus den vier Ecken eines A4-Blatts (Reihenfolge rundherum).
 * Mittelt über alle vier Kanten; prüft, ob das Seitenverhältnis zu A4 passt
 * (√2 ± 12 %), sonst Fehler – lieber kein Maßstab als ein falscher.
 */
export function a4Massstab(ecken) {
  if (!Array.isArray(ecken) || ecken.length !== 4 || !ecken.every(istPunkt)) {
    throw new TypeError("Vier Ecken [x, y, z] erwartet");
  }
  const k = [0, 1, 2, 3].map((i) => abstand(ecken[i], ecken[(i + 1) % 4]));
  const paarA = (k[0] + k[2]) / 2;
  const paarB = (k[1] + k[3]) / 2;
  const lang = Math.max(paarA, paarB);
  const kurz = Math.min(paarA, paarB);
  if (kurz < 1e-6) throw new RangeError("Ecken liegen aufeinander");
  const verhaeltnis = lang / kurz;
  const soll = A4.hoehe / A4.breite;
  if (abweichung(verhaeltnis, soll) > 0.12) {
    throw new RangeError("Die Ecken passen nicht zu einem A4-Blatt. Bitte die vier Ecken der Reihe nach setzen.");
  }
  // Gegenüberliegende Kanten einzeln skalieren, dann mitteln (robuster bei Klickfehlern).
  const langeKanten = paarA >= paarB ? [k[0], k[2]] : [k[1], k[3]];
  const kurzeKanten = paarA >= paarB ? [k[1], k[3]] : [k[0], k[2]];
  const faktoren = [...langeKanten.map((x) => A4.hoehe / x), ...kurzeKanten.map((x) => A4.breite / x)];
  const faktor = faktoren.reduce((s, x) => s + x, 0) / faktoren.length;
  return { faktor, quelle: "a4", modellStrecke: lang, meter: A4.hoehe };
}

// ---------- Quaternionen (x, y, z, w) ----------

export function quatAusZweiVektoren(von, nach) {
  const a = norm(von);
  const b = norm(nach);
  const d = dot(a, b);
  if (d > 1 - 1e-9) return [0, 0, 0, 1];
  if (d < -1 + 1e-9) {
    // 180°: beliebige zu a senkrechte Achse.
    let achse = cross([1, 0, 0], a);
    if (len(achse) < 1e-6) achse = cross([0, 0, 1], a);
    achse = norm(achse);
    return [achse[0], achse[1], achse[2], 0];
  }
  const c = cross(a, b);
  const q = [c[0], c[1], c[2], 1 + d];
  const l = Math.hypot(...q);
  return q.map((v) => v / l);
}

export function quatMal(q, r) {
  const [ax, ay, az, aw] = q;
  const [bx, by, bz, bw] = r;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function quatAchseWinkel(achse, rad) {
  const a = norm(achse);
  const s = Math.sin(rad / 2);
  return [a[0] * s, a[1] * s, a[2] * s, Math.cos(rad / 2)];
}

export function drehe(q, v) {
  const [x, y, z, w] = q;
  const u = [x, y, z];
  const t = mul(cross(u, v), 2);
  return add(add(v, mul(t, w)), cross(u, t));
}

const konj = (q) => [-q[0], -q[1], -q[2], q[3]];

// ---------- Transformation ----------

export const IDENTITAET = Object.freeze({ faktor: 1, quat: [0, 0, 0, 1], versatz: [0, 0, 0] });

export function istTransform(t) {
  return (
    t &&
    Number.isFinite(t.faktor) &&
    t.faktor > 0 &&
    Array.isArray(t.quat) &&
    t.quat.length === 4 &&
    t.quat.every(Number.isFinite) &&
    Math.abs(Math.hypot(...t.quat) - 1) < 1e-3 &&
    istPunkt(t.versatz)
  );
}

/** Modell-Koordinate → Welt-Meter. */
export function anwenden(t, p) {
  return add(drehe(t.quat, mul(p, t.faktor)), t.versatz);
}

/** Welt-Meter → Modell-Koordinate. */
export function umkehren(t, w) {
  return mul(drehe(konj(t.quat), sub(w, t.versatz)), 1 / t.faktor);
}

/**
 * Boden aus drei Modell-Punkten. `oben` ist ein Modell-Punkt, der sicher über
 * dem Boden liegt (z. B. der Schwerpunkt aller Splats oder eine Kamera); er
 * bestimmt, welche Seite der Ebene „oben“ ist.
 * Liefert eine neue Transformation mit gleichem Faktor: Boden auf y = 0,
 * Mittelpunkt der drei Punkte auf x = z = 0.
 */
export function bodenAusDreiPunkten(p1, p2, p3, oben, faktor = 1) {
  if (![p1, p2, p3, oben].every(istPunkt)) throw new TypeError("Drei Bodenpunkte und ein Punkt darüber erwartet");
  let n = cross(sub(p2, p1), sub(p3, p1));
  if (len(n) < 1e-9) throw new RangeError("Die drei Bodenpunkte liegen auf einer Linie");
  n = norm(n);
  if (dot(n, sub(oben, p1)) < 0) n = mul(n, -1);
  const quat = quatAusZweiVektoren(n, [0, 1, 0]);
  const mitte = mul(add(add(p1, p2), p3), 1 / 3);
  const m = drehe(quat, mul(mitte, faktor));
  return { faktor, quat, versatz: [-m[0], -m[1], -m[2]] };
}

/** Dreht eine Transformation zusätzlich um die Hochachse (Wand parallel zu x legen). */
export function umHochachse(t, rad) {
  const r = quatAchseWinkel([0, 1, 0], rad);
  return { faktor: t.faktor, quat: quatMal(r, t.quat), versatz: drehe(r, t.versatz) };
}

/**
 * Zwei Modell-Punkte an einer Wand → Drehung um die Hochachse, sodass diese
 * Wand parallel zu x liegt und „hinten“ ist (z < Raummitte). So passt der
 * Grundriss als Rechteck und „vor der Fensterwand“ stimmt in Worten.
 */
export function wandAlsHinten(t, a, b) {
  const wa = anwenden(t, a);
  const wb = anwenden(t, b);
  const dx = wb[0] - wa[0];
  const dz = wb[2] - wa[2];
  if (Math.hypot(dx, dz) < 0.05) throw new RangeError("Die Wandpunkte liegen zu nah beieinander");
  let gedreht = umHochachse(t, Math.atan2(dz, dx));
  const mitteZ = (anwenden(gedreht, a)[2] + anwenden(gedreht, b)[2]) / 2;
  if (mitteZ > 0) gedreht = umHochachse(gedreht, Math.PI);
  return gedreht;
}

/** Verschiebt die Welt so, dass die Grundriss-Mitte bei x = z = 0 liegt. */
export function zentriere(t, g) {
  const cx = (g.x0 + g.x1) / 2;
  const cz = (g.z0 + g.z1) / 2;
  const r = (v) => Math.round(v * 100) / 100;
  return {
    transform: { faktor: t.faktor, quat: t.quat, versatz: [t.versatz[0] - cx, t.versatz[1], t.versatz[2] - cz] },
    grundriss: { ...g, x0: r(g.x0 - cx), x1: r(g.x1 - cx), z0: r(g.z0 - cz), z1: r(g.z1 - cz) },
  };
}

/** Nachträglich einen neuen Maßstab setzen, ohne Boden und Mitte zu verlieren. */
export function mitFaktor(t, faktor) {
  const s = faktor / t.faktor;
  return { faktor, quat: t.quat, versatz: mul(t.versatz, s) };
}

// ---------- Ausgabe ----------

const zahl = (v, stellen) => v.toFixed(stellen).replace(".", ",");
export const meterText = (m, stellen = 2) => `${zahl(m, stellen)} m`;
export const cmText = (cm) => `${Math.round(cm)} cm`;

/**
 * Prüfprotokoll eines Maßstabs gegen bekannte Kontrollstrecken (Akzeptanz:
 * ≤ 2 % auf 3 m). strecken: [{ a, b, soll }] in Modell-Koordinaten / Metern.
 */
export function pruefeMassstab(faktor, strecken, grenze = 0.02) {
  const zeilen = strecken.map(({ a, b, soll, name }) => {
    const ist = abstand(a, b) * faktor;
    const abw = abweichung(ist, soll);
    return { name: name || `${meterText(soll)}-Strecke`, soll, ist, abweichung: abw, ok: abw <= grenze };
  });
  return { ok: zeilen.every((z) => z.ok), grenze, zeilen };
}
