// tools/raumzwilling/pruefe-massstab.mjs – Akzeptanz „Maßabweichung ≤ 2 % auf 3 m“
// am echten Durchlauf der Kette (Testvideo → COLMAP → Brush → SOG).
//
//   node tools/raumzwilling/pruefe-massstab.mjs <PROJEKT> --arbeit <rohdaten-ordner> --kamera <kamera.json>
//
// 1. Wahre Kamerapositionen (testvideo.mjs, Welt-Meter) gegen die von COLMAP
//    rekonstruierten Kamerazentren: Ähnlichkeitstransformation (Umeyama) →
//    Restfehler zeigt, wie maßhaltig die Rekonstruktion ist.
// 2. Team-Klick simulieren: Strahl aus der Raummitte auf bekannte Punkte
//    (Türlaibung 0,90 m bzw. Wand 4,20 m), getroffen wird der vorderste Splat –
//    genau wie ein Klick im Werkzeug. Damit Maßstab setzen und die 3,00-m-Strecke messen.
// Ergebnis: Bericht in <rohdaten>/massstab.json und auf der Konsole.
import fs from "node:fs";
import path from "node:path";
import { BIN, PROG_ENV, parseArgs, raumDir, run } from "./lib.mjs";
import { leseSogBuendel } from "../../src/lib/raumzwilling/assets-node.mjs";
import { testraumMarken } from "../../src/lib/raumzwilling/testraum.js";
import { abweichung, abstand, zweiPunktMassstab } from "../../src/lib/raumzwilling/massstab.js";
import { pickeStrahl } from "../../src/lib/raumzwilling/picken.js";

const args = parseArgs();
const projekt = args._[0];
const arbeit = path.resolve(args.arbeit);
const kamera = JSON.parse(fs.readFileSync(path.resolve(args.kamera), "utf8"));

// COLMAP-Modell als Text
const sparse = path.join(arbeit, "colmap", "sparse");
const modell = fs.readdirSync(sparse).filter((d) => fs.existsSync(path.join(sparse, d, "images.bin"))).sort((a, b) => fs.statSync(path.join(sparse, b, "images.bin")).size - fs.statSync(path.join(sparse, a, "images.bin")).size)[0];
const txt = path.join(arbeit, "colmap", "txt");
fs.mkdirSync(txt, { recursive: true });
await run(BIN.colmap, ["model_converter", "--input_path", path.join(sparse, modell), "--output_path", txt, "--output_type", "TXT"], { quiet: true, env: PROG_ENV });
const zeilen = fs.readFileSync(path.join(txt, "images.txt"), "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
const paare = [];
for (let i = 0; i < zeilen.length; i += 2) {
  const t = zeilen[i].trim().split(/\s+/);
  if (t.length < 10) continue;
  const [qw, qx, qy, qz, tx, ty, tz] = t.slice(1, 8).map(Number);
  const name = t[9];
  const nr = Number(name.match(/(\d+)/)[1]) - 1; // f_00001.jpg → Bild 0
  // R aus q (Welt→Kamera), Zentrum C = −Rᵀ t
  const R = [
    [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
    [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
    [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)],
  ];
  const C = [0, 1, 2].map((k) => -(R[0][k] * tx + R[1][k] * ty + R[2][k] * tz));
  const wahr = kamera.kamera[nr]?.auge;
  if (wahr) paare.push({ modell: C, welt: wahr });
}

// Umeyama: welt ≈ s·R·modell + t
function umeyama(src, dst) {
  const n = src.length;
  const mean = (a) => [0, 1, 2].map((k) => a.reduce((s, p) => s + p[k], 0) / n);
  const ms = mean(src);
  const md = mean(dst);
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  let varS = 0;
  for (let i = 0; i < n; i++) {
    const a = src[i].map((v, k) => v - ms[k]);
    const b = dst[i].map((v, k) => v - md[k]);
    varS += a[0] ** 2 + a[1] ** 2 + a[2] ** 2;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S[r][c] += (b[r] * a[c]) / n;
  }
  varS /= n;
  // Polarzerlegung per Iteration (R = nächstgelegene Rotation zu S)
  let Rm = S.map((r) => [...r]);
  for (let it = 0; it < 60; it++) {
    const det = Rm[0][0] * (Rm[1][1] * Rm[2][2] - Rm[1][2] * Rm[2][1]) - Rm[0][1] * (Rm[1][0] * Rm[2][2] - Rm[1][2] * Rm[2][0]) + Rm[0][2] * (Rm[1][0] * Rm[2][1] - Rm[1][1] * Rm[2][0]);
    const inv = [
      [(Rm[1][1] * Rm[2][2] - Rm[1][2] * Rm[2][1]) / det, (Rm[0][2] * Rm[2][1] - Rm[0][1] * Rm[2][2]) / det, (Rm[0][1] * Rm[1][2] - Rm[0][2] * Rm[1][1]) / det],
      [(Rm[1][2] * Rm[2][0] - Rm[1][0] * Rm[2][2]) / det, (Rm[0][0] * Rm[2][2] - Rm[0][2] * Rm[2][0]) / det, (Rm[0][2] * Rm[1][0] - Rm[0][0] * Rm[1][2]) / det],
      [(Rm[1][0] * Rm[2][1] - Rm[1][1] * Rm[2][0]) / det, (Rm[0][1] * Rm[2][0] - Rm[0][0] * Rm[2][1]) / det, (Rm[0][0] * Rm[1][1] - Rm[0][1] * Rm[1][0]) / det],
    ];
    Rm = Rm.map((r, i) => r.map((v, j) => 0.5 * (v + inv[j][i])));
  }
  // Skala: s = Spur(Rᵀ S) / varS
  let spur = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) spur += Rm[r][c] * S[r][c];
  const s = spur / varS;
  const t = [0, 1, 2].map((k) => md[k] - s * (Rm[k][0] * ms[0] + Rm[k][1] * ms[1] + Rm[k][2] * ms[2]));
  const anwenden = (p) => [0, 1, 2].map((k) => s * (Rm[k][0] * p[0] + Rm[k][1] * p[1] + Rm[k][2] * p[2]) + t[k]);
  const zurueck = (w) => {
    const d = w.map((v, k) => (v - t[k]) / s);
    return [0, 1, 2].map((k) => Rm[0][k] * d[0] + Rm[1][k] * d[1] + Rm[2][k] * d[2]);
  };
  return { s, anwenden, zurueck };
}

const fit = umeyama(paare.map((p) => p.modell), paare.map((p) => p.welt));
const rest = paare.map((p) => abstand(fit.anwenden(p.modell), p.welt));
const rms = Math.sqrt(rest.reduce((a, v) => a + v * v, 0) / rest.length);

// Splat laden, „Klick“ = nächster Splat-Punkt (Deckkraft > 15 %) zum wahren Punkt
const splat = await leseSogBuendel(path.join(raumDir(projekt), "splat"));
// Wie im Werkzeug (SplatSzene.picke → pickeStrahl): Strahl von einem
// Standpunkt in der Raummitte (Augenhöhe) zum Zielpunkt, Deckkraft summiert.
function klick(welt) {
  const auge = fit.zurueck([0, 1.5, 0]);
  const ziel = fit.zurueck(welt);
  const len = Math.hypot(ziel[0] - auge[0], ziel[1] - auge[1], ziel[2] - auge[2]);
  const d = [(ziel[0] - auge[0]) / len, (ziel[1] - auge[1]) / len, (ziel[2] - auge[2]) / len];
  const p = pickeStrahl(splat, auge, d, { deckung: Number(args.deckung || 0.5) });
  if (!p) throw new Error(`Kein Treffer für ${welt.join(", ")} – Splat zu lückenhaft`);
  return { punkt: p.punkt, fehlerM: abstand(p.punkt, ziel) * fit.s };
}

const M = testraumMarken();
const ergebnisse = [];
for (const [name, a, b, meter, c, d] of [
  ["Türlaibung 0,90 m (Augenhöhe)", "tuerLinksHoch", "tuerRechtsHoch", 0.9, "dreiMeterHochA", "dreiMeterHochB"],
  ["Fensterwand 4,20 m (Augenhöhe)", "wandLinksHoch", "wandRechtsHoch", 4.2, "dreiMeterHochA", "dreiMeterHochB"],
  ["Türlaibung 0,90 m (Boden)", "tuerLinks", "tuerRechts", 0.9, "dreiMeterA", "dreiMeterB"],
]) {
  const ka = klick(M[a]);
  const kb = klick(M[b]);
  const ms = zweiPunktMassstab(ka.punkt, kb.punkt, meter);
  const k3a = klick(M[c]);
  const k3b = klick(M[d]);
  const ist = abstand(k3a.punkt, k3b.punkt) * ms.faktor;
  ergebnisse.push({ referenz: name, strecke: "3,00 m", klickfehlerCm: [ka, kb, k3a, k3b].map((k) => Math.round(k.fehlerM * 1000) / 10), gemessen3m: Math.round(ist * 1000) / 1000, abweichungProzent: Math.round(abweichung(ist, 3) * 10000) / 100 });
}
// Diagnose: liegen die Splats auf den Raumflächen? (Abstand zur nächsten Fläche, Welt-Meter)
const T = kamera.testraum;
const naeheCm = [];
for (let i = 0; i < splat.anzahl; i += 7) {
  const w = fit.anwenden([splat.positionen[i * 3], splat.positionen[i * 3 + 1], splat.positionen[i * 3 + 2]]);
  const d = Math.min(Math.abs(Math.abs(w[0]) - T.breite / 2), Math.abs(Math.abs(w[2]) - T.tiefe / 2), Math.abs(w[1]), Math.abs(w[1] - T.hoehe));
  naeheCm.push(d * 100);
}
naeheCm.sort((a, b) => a - b);
const flaeche = { medianCm: Math.round(naeheCm[naeheCm.length >> 1] * 10) / 10, anteilUnter5cm: Math.round((naeheCm.filter((v) => v < 5).length / naeheCm.length) * 100) };

const bericht = {
  splatsAufFlaechen: flaeche,
  projekt,
  kamerasVerglichen: paare.length,
  kameraRestfehlerCm: Math.round(rms * 1000) / 10,
  colmapMassstab: fit.s,
  splats: splat.anzahl,
  ergebnisse,
  grenzeProzent: 2,
  // Akzeptanz: Referenz und Strecke dort, wo das Video hinsieht (Augenhöhe);
  // Bodenecken zeigt der Bericht zusätzlich (dort fehlen oft Splats).
  ok: ergebnisse.filter((e) => e.referenz.includes("Augenhöhe")).every((e) => e.abweichungProzent <= 2),
};
fs.writeFileSync(path.join(arbeit, "massstab.json"), JSON.stringify(bericht, null, 2));
console.log(JSON.stringify(bericht, null, 2));
