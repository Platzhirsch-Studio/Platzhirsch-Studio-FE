// src/lib/ezarri/konfigurator/geometry.js – Becken und Szenen als Zahlen (Team B).
//
// Eine Quelle für 3D-Geometrie, 2D-Draufsicht und Mengen:
//   outline(becken, szene)      Grundriss als Polygon [[x, z], …] (Meter, Mitte = 0,0)
//   depthAt(becken, x)          Wassertiefe an der Stelle x (stufenlose Schräge flach → tief)
//   steps(becken)               Treppenstufen als Prismen {pts, wand:[Kantenindex], yTop}
//   bench(becken, szene)        Sitzbank(en) als Prismen
//   areas(becken, szene)        Vertrag §7.4 Nr. 2: {boden, waende:[…], treppe, bank,
//                               gesamt, kantenLfm:{corner, cove}} in m² bzw. lfm
//   waterLevel, cameraPresets, TREPPEN_JE_FORM
//
// Koordinaten: x entlang der Länge (flaches Ende bei x = −l/2), z quer, y nach oben,
// Beckenkopf (Oberkante) bei y = 0. Die 3D-Bühne baut aus genau diesen Polygonen.
//
// Flächenmodell (wie Ezarri-Rechner und Team C, rechner/flaechen.js):
//   Boden = Grundfläche (ohne Schräg-Zuschlag, Ezarri rechnet ebenso),
//   Wände = Σ Kantenlänge × mittlere Tiefe der Kante (Trapez, exakt bei linearer Tiefe).
//   Treppe/Bank sind Blöcke: ihre sichtbaren Tritt-, Sitz- und Setzflächen kommen dazu,
//   die verdeckte Boden- und Wandfläche geht ab.
// Prüfwert: 10 × 5 m, Tiefe 1/2 m, Rechteck ohne Treppe → 95 m² netto; mit 10 % Marge
// 104,5 m², auf volle Kartons zu 2 m² → 106 m² (Ezarri-Beispiel).
//
// Rein: keine Imports. Läuft in Server, Browser und node --test.

const TAU = Math.PI * 2;
const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;

/** Steigung einer Stufe (m) und Auftritt (m). */
export const STUFE = Object.freeze({ h: 0.25, a: 0.35 });
/** Sitzbank: Oberkante unter dem Beckenkopf, Tiefe. */
export const BANK = Object.freeze({ y: -0.5, tiefe: 0.45, laengeMax: 3 });
export const WHIRL_BANK = Object.freeze({ y: -0.45, tiefe: 0.42 });

/** Erlaubte Treppen je Form (erste = Standard, wenn die gewählte nicht passt). */
export const TREPPEN_JE_FORM = Object.freeze({
  rechteck: Object.freeze(["roemisch", "eck", "voll", "keine"]),
  l: Object.freeze(["roemisch", "eck", "voll", "keine"]),
  radius: Object.freeze(["roemisch", "voll", "keine"]),
  rund: Object.freeze(["roemisch", "keine"]),
});

// ---------------------------------------------------------------------------
// Polygone

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

export function polygonPerimeter(pts, closed = true) {
  let s = 0;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    s += Math.hypot(x2 - x1, z2 - z1);
  }
  return s;
}

/** Polygon gegen den Uhrzeigersinn (positive Fläche) ausrichten. */
function ccw(pts) {
  return polygonArea(pts) < 0 ? [...pts].reverse() : pts;
}

function arc(cx, cz, r, a0, a1, segs) {
  const out = [];
  for (let i = 0; i <= segs; i++) {
    const t = a0 + ((a1 - a0) * i) / segs;
    out.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
  }
  return out;
}

/** Eckenradius der Form „radius“. */
export function cornerRadius(becken) {
  return Math.min(1, becken.b / 4, becken.l / 4);
}

/** Ausschnitt der L-Form: das flache Ende ist nur halb so breit. */
export function lNotch(becken) {
  return { lx: r2(becken.l * 0.45), bz: r2(becken.b * 0.5) };
}

/**
 * Grundriss (Polygon, CCW in x/z). Pool: rechteck, radius, rund (runde Enden), l.
 * Whirlpool: kreis, quadrat. Bad/Küche: Rechteck der Bodenfläche bzw. Wand.
 */
export function outline(becken, szene = "pool") {
  const { l, b } = becken;
  const hx = l / 2;
  const hz = b / 2;
  if (szene === "whirlpool") {
    if (becken.form === "quadrat") return ccw(roundedRect(hx, hz, Math.min(0.3, hx / 3)));
    return ccw(arc(0, 0, hx, 0, TAU, 48).slice(0, 48));
  }
  if (szene === "bad" || szene === "kueche") {
    return ccw([[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]);
  }
  if (becken.form === "radius") return ccw(roundedRect(hx, hz, cornerRadius(becken)));
  if (becken.form === "rund") {
    const r = hz;
    const c = Math.max(0, hx - r);
    return ccw([...arc(c, 0, r, -Math.PI / 2, Math.PI / 2, 18), ...arc(-c, 0, r, Math.PI / 2, (3 * Math.PI) / 2, 18)]);
  }
  if (becken.form === "l") {
    const { lx, bz } = lNotch(becken);
    return ccw([[-hx, -hz], [hx, -hz], [hx, hz], [-hx + lx, hz], [-hx + lx, hz - bz], [-hx, hz - bz]]);
  }
  return ccw([[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]);
}

function roundedRect(hx, hz, r) {
  const s = 6;
  return [
    ...arc(hx - r, -hz + r, r, -Math.PI / 2, 0, s),
    ...arc(hx - r, hz - r, r, 0, Math.PI / 2, s),
    ...arc(-hx + r, hz - r, r, Math.PI / 2, Math.PI, s),
    ...arc(-hx + r, -hz + r, r, Math.PI, (3 * Math.PI) / 2, s),
  ];
}

/** Wassertiefe (positiv, m) an der Stelle x. Pool: linear von tFlach (x = −l/2) bis tTief (x = +l/2). */
export function depthAt(becken, x, szene = "pool") {
  if (szene === "whirlpool") return becken.tTief;
  if (szene !== "pool") return 0;
  const t = Math.min(1, Math.max(0, (x + becken.l / 2) / becken.l));
  return becken.tFlach + (becken.tTief - becken.tFlach) * t;
}

/** Wasserspiegel (y) relativ zum Beckenkopf. */
export function waterLevel(becken, szene = "pool") {
  if (szene === "whirlpool") return -0.1;
  if (szene !== "pool") return null;
  if (becken.rand === "ueberlauf") return -0.02;
  if (becken.rand === "infinity") return -0.01;
  return -0.15;
}

// ---------------------------------------------------------------------------
// Treppe und Bank

/** Gültige Treppe für die Form (sonst die erste erlaubte). */
export function treppeFuerForm(becken) {
  const allowed = TREPPEN_JE_FORM[becken.form] || TREPPEN_JE_FORM.rechteck;
  return allowed.includes(becken.treppe) ? becken.treppe : allowed[0];
}

/** Anzahl Stufen bis knapp über den Boden des flachen Endes. */
export function stufenZahl(becken) {
  return Math.min(8, Math.max(1, Math.floor((becken.tFlach - 0.1) / STUFE.h)));
}

/**
 * Stufen als Prismen, von oben (k = 1, kleinste Grundfläche an der Wand) nach unten.
 * Jede Stufe: {pts, wand: Indizes der Kanten an der Beckenwand (unsichtbar), yTop, k}.
 */
export function steps(becken, szene = "pool") {
  if (szene !== "pool") return [];
  const art = treppeFuerForm(becken);
  if (art === "keine") return [];
  const n = stufenZahl(becken);
  const { h, a } = STUFE;
  const hx = becken.l / 2;
  const hz = becken.b / 2;
  const out = [];
  if (art === "roemisch") {
    // Halbkreis an der flachen Stirnwand (rund: an der Längswand, in der flachen Hälfte)
    let c;
    let dir;
    let rMax;
    if (becken.form === "rund") {
      const cx = -Math.max(0, hx - hz) * 0.5;
      c = [cx, -hz];
      dir = [0, 1];
      rMax = Math.min(1.6, Math.max(0.8, hx - hz), hz * 0.9);
    } else if (becken.form === "l") {
      const { bz } = lNotch(becken);
      c = [-hx, -hz + (becken.b - bz) / 2];
      dir = [1, 0];
      rMax = Math.min(1.6, ((becken.b - bz) / 2) * 0.9);
    } else {
      const rc = becken.form === "radius" ? cornerRadius(becken) : 0;
      c = [-hx, 0];
      dir = [1, 0];
      rMax = Math.min(1.6, hz - rc - 0.05, becken.l * 0.3);
    }
    rMax = Math.max(0.6, rMax);
    const base = Math.atan2(dir[1], dir[0]);
    for (let k = 1; k <= n; k++) {
      const R = (rMax * k) / n;
      const pts = arc(c[0], c[1], R, base - Math.PI / 2, base + Math.PI / 2, 16);
      out.push({ k, yTop: -k * h, pts: ccw(pts), wand: [pts.length - 1], art });
    }
    return fixWallEdges(out);
  }
  if (art === "voll") {
    let z0 = -hz;
    let z1 = hz;
    if (becken.form === "radius") {
      const rc = cornerRadius(becken);
      z0 = -hz + rc;
      z1 = hz - rc;
    }
    if (becken.form === "l") {
      z1 = hz - lNotch(becken).bz;
    }
    for (let k = 1; k <= n; k++) {
      const d = Math.min(becken.l * 0.4, a * k);
      const pts = [[-hx, z0], [-hx + d, z0], [-hx + d, z1], [-hx, z1]];
      // Kanten: 0 unten (Wand nur bei voller Breite), 1 Setzstufe, 2 oben, 3 Stirnwand
      const voll = becken.form !== "radius";
      out.push({ k, yTop: -k * h, pts, wand: voll ? [0, 2, 3] : [3], art });
    }
    return out;
  }
  // eck: Viertelkreis in der Ecke flach/links
  const c = [-hx, -hz];
  const rMax = Math.min(1.8, becken.b * 0.45, becken.l * 0.3);
  for (let k = 1; k <= n; k++) {
    const R = Math.max(0.3, (rMax * k) / n);
    const pts = [c, ...arc(c[0], c[1], R, 0, Math.PI / 2, 10)];
    out.push({ k, yTop: -k * h, pts, wand: [0, pts.length - 1], art });
  }
  return out;
}

/** Nach ccw() kann sich die Reihenfolge umkehren: Wandkante = die gerade Sehne (längste Kante). */
function fixWallEdges(list) {
  return list.map((s) => {
    let best = 0;
    let bestLen = -1;
    for (let i = 0; i < s.pts.length; i++) {
      const p = s.pts[i];
      const q = s.pts[(i + 1) % s.pts.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len > bestLen) {
        bestLen = len;
        best = i;
      }
    }
    return { ...s, wand: [best] };
  });
}

/**
 * Sitzbank(en) als Prismen {pts, wand, stoss?, yTop}; `stoss` = Kanten zwischen zwei Blöcken (unsichtbar). Pool: an der Längswand z = −b/2 im Übergang flach → tief.
 * Whirlpool: umlaufend (Kreis in Segmenten, Quadrat als 4 Blöcke).
 */
export function bench(becken, szene = "pool") {
  if (!becken.bank) return [];
  const hz = becken.b / 2;
  const hx = becken.l / 2;
  if (szene === "pool") {
    const len = Math.min(BANK.laengeMax, becken.l * 0.35);
    let x0 = -hx + becken.l * 0.4;
    if (becken.form === "rund") x0 = Math.max(x0, -Math.max(0, hx - hz));
    if (becken.form === "radius") x0 = Math.max(x0, -hx + cornerRadius(becken));
    const x1 = Math.min(x0 + len, becken.form === "rund" ? Math.max(0, hx - hz) : hx - 0.3);
    if (x1 - x0 < 0.6) return [];
    return [{ yTop: BANK.y, pts: [[x0, -hz], [x1, -hz], [x1, -hz + BANK.tiefe], [x0, -hz + BANK.tiefe]], wand: [0] }];
  }
  if (szene === "whirlpool") {
    const t = WHIRL_BANK.tiefe;
    if (becken.form === "quadrat") {
      return [
        { yTop: WHIRL_BANK.y, pts: [[-hx, -hz], [hx, -hz], [hx, -hz + t], [-hx, -hz + t]], wand: [0, 1, 3] },
        { yTop: WHIRL_BANK.y, pts: [[-hx, hz - t], [hx, hz - t], [hx, hz], [-hx, hz]], wand: [1, 2, 3] },
        { yTop: WHIRL_BANK.y, pts: [[-hx, -hz + t], [-hx + t, -hz + t], [-hx + t, hz - t], [-hx, hz - t]], wand: [3], stoss: [0, 2] },
        { yTop: WHIRL_BANK.y, pts: [[hx - t, -hz + t], [hx, -hz + t], [hx, hz - t], [hx - t, hz - t]], wand: [1], stoss: [0, 2] },
      ];
    }
    const R = hx;
    const ri = Math.max(0.3, R - t);
    const segs = 16;
    const out = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (TAU * i) / segs;
      const a1 = (TAU * (i + 1)) / segs;
      const pts = [
        [ri * Math.cos(a0), ri * Math.sin(a0)],
        [R * Math.cos(a0), R * Math.sin(a0)],
        [R * Math.cos(a1), R * Math.sin(a1)],
        [ri * Math.cos(a1), ri * Math.sin(a1)],
      ];
      // sichtbar nur die innere Kante (3 → 0); 0 → 1 und 2 → 3 sind Stoßkanten, 1 → 2 Wand
      out.push({ yTop: WHIRL_BANK.y, pts, wand: [1], stoss: [0, 2] });
    }
    return out;
  }
  return [];
}

function edgeLen(pts, i) {
  const p = pts[i];
  const q = pts[(i + 1) % pts.length];
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
}

/** Kante sichtbar? Nicht an der Wand und nicht Stoßkante zum Nachbarblock. */
export function edgeVisible(prism, i) {
  return !prism.wand.includes(i) && !(prism.stoss || []).includes(i);
}

function visibleEdgeLength(prism) {
  let s = 0;
  for (let i = 0; i < prism.pts.length; i++) if (edgeVisible(prism, i)) s += edgeLen(prism.pts, i);
  return s;
}

function wallEdgeLength(prism) {
  return prism.wand.reduce((s, i) => s + edgeLen(prism.pts, i), 0);
}

function centroidX(pts) {
  return pts.reduce((s, p) => s + p[0], 0) / pts.length;
}

// ---------------------------------------------------------------------------
// Flächen (Vertrag §7.4 Nr. 2)

const WAND_LABEL = { laengs: "Längswände", flach: "Stirnwand flach", tief: "Stirnwand tief", rueck: "Rückwand", links: "Seitenwand links", rechts: "Seitenwand rechts", rueckwand: "Rückwand Küche", rund: "Wand" };

/**
 * Flächen in m² und Kanten in lfm, identisch mit der 3D-Geometrie.
 * @returns {{boden:number, waende:Array<{id:string,label:string,m2:number}>, treppe:number,
 *   bank:number, rinne:number, gesamt:number, kantenLfm:{corner:number, cove:number},
 *   wasserflaeche:number, volumenM3:number, umfang:number}}
 */
export function areas(becken, szene = "pool") {
  if (szene === "bad") {
    const H = becken.tTief;
    const waende = [
      { id: "rueck", label: WAND_LABEL.rueck, m2: r2(becken.l * H) },
      { id: "links", label: WAND_LABEL.links, m2: r2(becken.b * H) },
      { id: "rechts", label: WAND_LABEL.rechts, m2: r2(becken.b * H) },
    ];
    const boden = r2(becken.l * becken.b);
    const w = waende.reduce((s, x) => s + x.m2, 0);
    return {
      boden,
      waende,
      treppe: 0,
      bank: 0,
      rinne: 0,
      gesamt: r2(boden + w),
      kantenLfm: { corner: r1(2 * H), cove: r1(becken.l + 2 * becken.b + 2 * H) },
      wasserflaeche: 0,
      volumenM3: 0,
      umfang: r2(becken.l + 2 * becken.b),
    };
  }
  if (szene === "kueche") {
    const m2 = r2(becken.l * becken.tTief);
    return {
      boden: 0,
      waende: [{ id: "rueckwand", label: WAND_LABEL.rueckwand, m2 }],
      treppe: 0,
      bank: 0,
      rinne: 0,
      gesamt: m2,
      kantenLfm: { corner: 0, cove: 0 },
      wasserflaeche: 0,
      volumenM3: 0,
      umfang: r2(2 * (becken.l + becken.tTief)),
    };
  }

  const pts = outline(becken, szene);
  const grund = polygonArea(pts);
  const umfang = polygonPerimeter(pts);
  const d = (x) => depthAt(becken, x, szene);

  // Wände: je Kante Länge × mittlere Tiefe; Gruppe nach Richtung
  const groups = new Map();
  let innenEcken = 0;
  let eckTiefen = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const m2 = len * (d(p[0]) + d(q[0])) / 2;
    let id = "laengs";
    if (szene === "whirlpool" || becken.form === "rund") id = "rund";
    else if (Math.abs(q[0] - p[0]) < Math.abs(q[1] - p[1])) id = (p[0] + q[0]) / 2 < 0 ? "flach" : "tief";
    groups.set(id, (groups.get(id) || 0) + m2);
    // Ecken (Richtungswechsel > 45°) für Cove senkrecht
    const o = pts[(i + pts.length - 1) % pts.length];
    const a1 = Math.atan2(p[1] - o[1], p[0] - o[0]);
    const a2 = Math.atan2(q[1] - p[1], q[0] - p[0]);
    let turn = Math.abs(a2 - a1);
    if (turn > Math.PI) turn = TAU - turn;
    if (turn > Math.PI / 4) {
      innenEcken += 1;
      eckTiefen += d(p[0]);
    }
  }

  let boden = grund;
  let wandAbzug = 0;
  let treppe = 0;
  let bankM2 = 0;
  let cornerExtra = 0;
  let coveExtra = 0;

  // Treppe: sichtbare Tritte = größte Grundfläche; Setzstufen je Stufe; Abzug Boden + verdeckte Wand
  const st = steps(becken, szene);
  if (st.length) {
    const last = st[st.length - 1];
    const fuss = Math.abs(polygonArea(last.pts));
    const tFuss = d(centroidX(last.pts));
    treppe += fuss;
    boden -= fuss;
    let prevWall = 0;
    st.forEach((s, i) => {
      const unten = i < st.length - 1 ? STUFE.h : Math.max(0, tFuss - st.length * STUFE.h);
      treppe += visibleEdgeLength(s) * unten;
      cornerExtra += visibleEdgeLength(s);
      const wl = wallEdgeLength(s);
      wandAbzug += Math.max(0, wl - prevWall) * Math.max(0, d(-becken.l / 2) - s.k * STUFE.h);
      prevWall = Math.max(prevWall, wl);
    });
    coveExtra += visibleEdgeLength(last);
  }

  // Bank: Sitzfläche + Front; Abzug Boden + Wand
  for (const bk of bench(becken, szene)) {
    const fuss = Math.abs(polygonArea(bk.pts));
    const tB = d(centroidX(bk.pts));
    const front = Math.max(0, tB + bk.yTop);
    bankM2 += fuss + visibleEdgeLength(bk) * front;
    boden -= fuss;
    wandAbzug += wallEdgeLength(bk) * front;
    cornerExtra += visibleEdgeLength(bk);
    coveExtra += visibleEdgeLength(bk);
  }

  // Rinne: Überlauf = Umfang × 0,4 m Abwicklung, Infinity = Kante (Stirnwand tief) × 0,9 m (wie Team C)
  let rinne = 0;
  if (szene === "pool" && becken.rand === "ueberlauf") rinne = umfang * 0.4;
  if (szene === "pool" && becken.rand === "infinity") rinne = becken.b * 0.9;

  const waendeRoh = [...groups.entries()].map(([id, m2]) => ({ id, label: WAND_LABEL[id], m2 }));
  const wandSumme = waendeRoh.reduce((s, w) => s + w.m2, 0);
  // Abzug anteilig auf die Wandgruppen verteilen
  const faktor = wandSumme > 0 ? Math.max(0, wandSumme - wandAbzug) / wandSumme : 1;
  const waende = waendeRoh.map((w) => ({ ...w, m2: r2(w.m2 * faktor) }));
  const order = ["laengs", "flach", "tief", "rund"];
  waende.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const wl = waterLevel(becken, szene) ?? 0;
  const tMittel = (d(-becken.l / 2) + d(becken.l / 2)) / 2;
  const out = {
    boden: r2(Math.max(0, boden)),
    waende,
    treppe: r2(treppe),
    bank: r2(bankM2),
    rinne: r2(rinne),
    gesamt: 0,
    kantenLfm: { corner: r1(umfang + cornerExtra), cove: r1(umfang + coveExtra + eckTiefen) },
    wasserflaeche: r2(grund),
    volumenM3: r1(Math.max(0, grund * (tMittel + wl))),
    umfang: r2(umfang),
    innenEcken,
  };
  out.gesamt = r2(out.boden + waende.reduce((s, w) => s + w.m2, 0) + out.treppe + out.bank + out.rinne);
  return out;
}

// ---------------------------------------------------------------------------
// Kamera

/**
 * Kamerapunkte je Szene: {id: {pos:[x,y,z], target:[x,y,z]}}. Nur vorhandene IDs
 * werden in der Oberfläche angeboten.
 */
export function cameraPresets(becken, szene = "pool") {
  const { l, b } = becken;
  const S = Math.max(l, b);
  if (szene === "bad") {
    const H = becken.tTief;
    return {
      uebersicht: { pos: [l * 0.15, 1.55, b / 2 + Math.max(1.6, l * 0.9)], target: [0, H * 0.45, -b / 4] },
      nah: { pos: [l * 0.1, 1.2, -b / 2 + 0.9], target: [0, 1.0, -b / 2] },
      vogel: { pos: [0, H + 1.2, b / 2 + 0.6], target: [0, 0, -b / 6] },
    };
  }
  if (szene === "kueche") {
    const H = becken.tTief;
    return {
      uebersicht: { pos: [l * 0.25, 1.6, Math.max(1.8, l * 0.85)], target: [0, 0.92 + H / 2, -0.3] },
      nah: { pos: [l * 0.1, 0.92 + H / 2 + 0.1, 0.65], target: [0, 0.92 + H / 2, -0.3] },
    };
  }
  if (szene === "whirlpool") {
    return {
      uebersicht: { pos: [-S * 1.05, 1.45, S * 1.2], target: [S * 0.15, -0.35, -S * 0.1] },
      wasserlinie: { pos: [-S * 0.45, 0.02, S * 0.2], target: [S * 0.4, -0.15, -S * 0.1] },
      unterwasser: { pos: [-S * 0.2, -0.6, 0.05], target: [S * 0.5, -0.6, 0] },
      vogel: { pos: [0, S * 1.6 + 1, 0.01], target: [0, -0.5, 0] },
    };
  }
  const hx = l / 2;
  const hz = b / 2;
  return {
    // leicht erhöht vom flachen Ende über die Wasserlinie: Kaustik, Spiegelung und Horizont im Bild (QM P1-3)
    // QM R2 P2-4.6: tiefer und näher. Ohne Schattenwurf sind Stufen nur über ihre Setzstufen
    // (Front zur tiefen Seite, +x) lesbar, daher Blick von der tiefen Ecke zurück zur Treppe:
    // Becken ≈ 60 % der Bühne, Wasserlinie, Hecke, Säulenbäume und Bergkette im Hintergrund.
    // Infinity: weiterhin über die Überlaufkante zum See.
    uebersicht:
      becken.rand === "infinity"
        ? { pos: [-hx - S * 0.25, 1.15 + S * 0.05, hz + S * 0.24], target: [hx * 0.3, -0.7, -hz * 0.2] }
        : { pos: [hx + Math.min(1.5, S * 0.15), 1.2, hz * 0.55 + 0.9], target: [-hx * 0.5, -0.8, -hz * 0.15] },
    treppe: { pos: [-hx + Math.min(4, l * 0.45), 1.5, hz * 0.35], target: [-hx, -0.7, -hz * 0.1] },
    wasserlinie: { pos: [-hx + 0.6, 0.0, -hz + 0.5], target: [hx, -0.25, hz * 0.5] },
    unterwasser: { pos: [-hx + Math.min(2.5, l * 0.25), -Math.max(0.45, becken.tFlach * 0.55), hz * 0.2], target: [hx, -becken.tTief * 0.55, 0] },
    vogel: { pos: [0, S * 1.05 + 2, 0.01], target: [0, -1, 0] },
  };
}
