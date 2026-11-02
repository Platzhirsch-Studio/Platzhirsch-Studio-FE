// Prototyp „Die Linie wird Raum“ (/de/preview/unikat) – prozedurale Handlinien.
//
// Reine Funktionen ohne React und ohne "@/": erzeugen deterministische
// SVG-Pfade, die wie mit dem Bleistift gezogen wirken (leichter Bogen,
// Überstand an den Enden, gelegentlich ein zweiter, versetzter Zug). Alles
// läuft auf dem Server; im Browser kommt nur fertiges SVG an.
//
// WICHTIG (Auftrag 31.10.2026): Das ist eine ILLUSTRATION des Prinzips,
// keine Skizze von Harald Menghin und keine Nachahmung seiner Hand. Echte
// Striche kommen erst mit WOW_PHASE "B" (src/lib/wow/config.js) und seiner
// schriftlichen Zustimmung.

/** Kleiner, deterministischer Zufall (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * Ein Bleistiftzug von a nach b als Quadratic-Bézier mit leichtem Bogen und
 * Überstand. `cont` = ohne "M" (für fortlaufende Linien).
 */
export function strokeSegment([x1, y1], [x2, y2], rand, { bow = 0.012, over = 0.035, cont = false } = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const o1 = cont ? 0 : Math.min(14, len * over) * rand();
  const o2 = Math.min(14, len * over) * rand();
  const ax = x1 - ux * o1;
  const ay = y1 - uy * o1;
  const bx = x2 + ux * o2;
  const by = y2 + uy * o2;
  const b = (rand() * 2 - 1) * len * bow;
  const cx = (ax + bx) / 2 - uy * b;
  const cy = (ay + by) / 2 + ux * b;
  return `${cont ? "" : `M${r1(ax)} ${r1(ay)}`}Q${r1(cx)} ${r1(cy)} ${r1(bx)} ${r1(by)}`;
}

/** Fortlaufende Linie durch Punkte (ein Pfad, ein Zug). */
export function strokePolyline(points, seed, opts) {
  const rand = rng(seed);
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += strokeSegment(points[i - 1], points[i], rand, { ...opts, cont: true });
  return d;
}

/**
 * Liste von Strichen (Segmente) → [{ d, delay, weight }]. `delay` 0…1 ordnet
 * die Striche in der Zeichenreihenfolge (CSS: --d).
 */
export function sketchStrokes(segments, seed, { from = 0, to = 1, double = 0.35 } = {}) {
  const rand = rng(seed);
  const out = [];
  segments.forEach((seg, i) => {
    const delay = from + ((to - from) * i) / Math.max(1, segments.length - 1);
    const weight = seg.weight ?? 1;
    if (seg.poly) {
      out.push({ d: strokePolyline(seg.poly, Math.floor(rand() * 1e9), seg.opts), delay, weight });
      return;
    }
    out.push({ d: strokeSegment(seg.a, seg.b, rand, seg.opts), delay, weight });
    // zweiter, leicht versetzter Zug – wie beim Nachziehen einer Kante
    if (seg.double !== false && rand() < double) {
      const j = () => (rand() * 2 - 1) * 2.2;
      out.push({ d: strokeSegment([seg.a[0] + j(), seg.a[1] + j()], [seg.b[0] + j(), seg.b[1] + j()], rand, seg.opts), delay: Math.min(1, delay + 0.04), weight: weight * 0.55 });
    }
  });
  return out;
}

/** Rechteck als vier Segmente. */
export const rect = (x1, y1, x2, y2, extra = {}) => [
  { a: [x1, y1], b: [x2, y1], ...extra },
  { a: [x2, y1], b: [x2, y2], ...extra },
  { a: [x2, y2], b: [x1, y2], ...extra },
  { a: [x1, y2], b: [x1, y1], ...extra },
];

// ---------------------------------------------------------------------------
// Szene (viewBox 0 0 1600 900, Zentralperspektive, Fluchtpunkt VP)

export const VIEWBOX = "0 0 1600 900";
export const VP = [800, 430];
export const BACK = { x1: 520, y1: 250, x2: 1080, y2: 610 };

/** Die EINE Linie: kommt von links, wird zur Rückwand des Raums. */
export function mainLineDesktop() {
  const { x1, y1, x2, y2 } = BACK;
  const start = "M-40 700C90 668 170 728 262 698S430 610 520 610";
  return start + strokePolyline([[x1, y2], [x2, y2], [x2, y1], [x1, y1], [x1, y2 + 2]], 7, { bow: 0.006 }).replace(/^M[^Q]+/, "");
}

/** Mobil: dieselbe Linie, aber von oben (senkrecht) in den Raum. */
export function mainLineMobile() {
  const { x1, y1, x2, y2 } = BACK;
  const start = "M806 -20C786 60 828 130 802 190S796 236 800 250";
  return start + strokePolyline([[800, y1], [x1, y1], [x1, y2], [x2, y2], [x2, y1], [800, y1]], 11, { bow: 0.006 }).replace(/^M[^Q]+/, "");
}

/** Konstruktionslinien, Raumkanten, Fenster, Möbel – in Zeichenreihenfolge. */
export function roomSegments() {
  const { x1, y1, x2, y2 } = BACK;
  const toEdge = ([x, y], ty) => {
    const t = (ty - y) / (y - VP[1]);
    return [x + (x - VP[0]) * t, ty];
  };
  const fl = toEdge([x1, y2], 900);
  const fr = toEdge([x2, y2], 900);
  const cl = toEdge([x1, y1], 0);
  const cr = toEdge([x2, y1], 0);
  const construction = [
    { a: VP, b: fl, weight: 0.35, double: false },
    { a: VP, b: fr, weight: 0.35, double: false },
    { a: VP, b: cl, weight: 0.35, double: false },
    { a: VP, b: cr, weight: 0.35, double: false },
    { a: [VP[0] - 24, VP[1]], b: [VP[0] + 24, VP[1]], weight: 0.5, double: false },
  ];
  const edges = [
    { a: [x1, y2], b: fl },
    { a: [x2, y2], b: fr },
    { a: [x1, y1], b: cl },
    { a: [x2, y1], b: cr },
  ];
  // Fenster in der Rückwand (Blick auf den See)
  const win = [...rect(640, 300, 960, 540), { a: [800, 300], b: [800, 540], weight: 0.7 }, { a: [640, 380], b: [960, 380], weight: 0.7 }];
  // Horizont des Sees im Fenster
  const lake = [
    { a: [648, 470], b: [952, 466], weight: 0.45, double: false },
    { a: [660, 488], b: [740, 487], weight: 0.3, double: false },
    { a: [830, 500], b: [930, 498], weight: 0.3, double: false },
  ];
  // Sofa vor der Rückwand
  const sofa = [
    ...rect(540, 640, 880, 690),
    { a: [540, 640], b: [556, 586] },
    { a: [556, 586], b: [864, 586] },
    { a: [864, 586], b: [880, 640] },
    { a: [540, 660], b: [520, 660] },
    { a: [520, 660], b: [522, 700] },
    { a: [880, 660], b: [900, 660] },
    { a: [900, 660], b: [898, 700] },
    { a: [710, 640], b: [710, 690], weight: 0.5 },
  ];
  // Sessel rechts
  const chair = [
    ...rect(1000, 668, 1120, 712),
    { a: [1006, 668], b: [1014, 612] },
    { a: [1014, 612], b: [1106, 612] },
    { a: [1106, 612], b: [1114, 668] },
    { a: [1010, 712], b: [1006, 736], weight: 0.6 },
    { a: [1110, 712], b: [1114, 736], weight: 0.6 },
  ];
  // Couchtisch (Ellipse aus zwei Bögen) und Beine
  const table = [
    { poly: [[640, 752], [700, 738], [800, 734], [880, 742], [910, 752], [870, 764], [760, 768], [660, 762], [640, 752]], opts: { bow: 0.02 } },
    { a: [680, 762], b: [684, 800], weight: 0.6 },
    { a: [860, 760], b: [856, 798], weight: 0.6 },
  ];
  // Pendelleuchte
  const lamp = [
    { a: [690, 0], b: [690, 310], weight: 0.6, double: false },
    { poly: [[662, 336], [672, 310], [708, 310], [718, 336], [662, 336]] },
  ];
  // Licht durch das Fenster auf dem Boden (Schraffur)
  const light = [];
  for (let i = 0; i < 9; i++) {
    const x = 660 + i * 34;
    light.push({ a: [x, 724], b: [x + 70, 860], weight: 0.28, double: false });
  }
  // Grundriss als Einschub oben links (Wände, Tür, Fenster)
  const plan = [
    ...rect(80, 60, 330, 230, { weight: 0.9 }),
    { a: [160, 60], b: [250, 60], weight: 1.6, double: false },
    { a: [80, 180], b: [80, 222], weight: 0.2, double: false },
    { poly: [[80, 180], [104, 186], [118, 204], [122, 222]], opts: { bow: 0.02 }, weight: 0.5 },
    ...rect(140, 150, 270, 180, { weight: 0.6 }),
    ...rect(290, 160, 316, 186, { weight: 0.6 }),
  ];
  return { construction, edges, win, lake, sofa, chair, table, lamp, light, plan };
}

/** Alle Striche der Skizze, mit Zeichenreihenfolge (--d). */
export function sketchScene() {
  const g = roomSegments();
  return {
    construction: sketchStrokes(g.construction, 101, { from: 0, to: 0.1 }),
    edges: sketchStrokes(g.edges, 102, { from: 0.08, to: 0.22 }),
    win: sketchStrokes([...g.win, ...g.lake], 103, { from: 0.2, to: 0.42 }),
    furniture: sketchStrokes([...g.sofa, ...g.chair, ...g.table, ...g.lamp], 104, { from: 0.36, to: 0.8 }),
    light: sketchStrokes(g.light, 105, { from: 0.72, to: 0.86 }),
    plan: sketchStrokes(g.plan, 106, { from: 0.55, to: 0.95 }),
  };
}

// ---------------------------------------------------------------------------
// Kleine Piktogramme der Welten (gleicher Strich, viewBox 0 0 120 80)

export function worldGlyph(id) {
  const seed = { wohnen: 21, kueche: 22, bad: 23, accessoires: 24 }[id] || 25;
  const shapes = {
    wohnen: [...rect(14, 40, 106, 62), { a: [18, 40], b: [22, 22] }, { a: [22, 22], b: [98, 22] }, { a: [98, 22], b: [102, 40] }, { a: [20, 62], b: [18, 70] }, { a: [100, 62], b: [102, 70] }],
    kueche: [...rect(10, 34, 110, 64), { a: [10, 42], b: [110, 42], weight: 0.6 }, { a: [40, 10], b: [40, 26], weight: 0.6 }, { poly: [[30, 34], [32, 26], [48, 26], [50, 34]] }, { a: [78, 34], b: [78, 64], weight: 0.5 }],
    bad: [{ poly: [[12, 36], [108, 36], [100, 60], [86, 66], [34, 66], [20, 60], [12, 36]], opts: { bow: 0.015 } }, { a: [92, 36], b: [92, 14] }, { a: [92, 14], b: [80, 14] }, { a: [80, 14], b: [80, 20], weight: 0.6 }, { a: [30, 66], b: [28, 72] }, { a: [90, 66], b: [92, 72] }],
    accessoires: [...rect(44, 34, 76, 70), { poly: [[60, 34], [60, 26]] }, { poly: [[60, 24], [56, 16], [60, 8], [64, 16], [60, 24]], opts: { bow: 0.04 } }, { a: [30, 70], b: [92, 70], weight: 0.6 }],
  };
  return sketchStrokes(shapes[id] || shapes.wohnen, seed, { double: 0.5 });
}
