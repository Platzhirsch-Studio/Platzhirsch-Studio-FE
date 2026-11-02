// Geodaten der Dreiländer-Karte (reine Daten, Server und Client).
// Koordinaten: echte Längen/Breiten, equirektangulär projiziert (cos 47,4°).
// See-, Rhein- und Grenzlinien sind bewusst grob – Orientierung, keine Landkarte.
// Fahrzeiten: Richtwerte aus Marktresearch/02-marktanalyse.md (Z. 94),
// Auto ab Lochau, ohne Verkehr und Grenzwartezeit.

export const VIEW = { w: 680, h: 560 };
const LON0 = 8.42;
const LAT0 = 47.86;
const KY = 520;
const KX = KY * Math.cos((47.4 * Math.PI) / 180);

export function project(lat, lon) {
  return [Math.round((lon - LON0) * KX * 10) / 10, Math.round((LAT0 - lat) * KY * 10) / 10];
}

const line = (pts, close = false) =>
  pts.map(([lat, lon], i) => `${i ? "L" : "M"}${project(lat, lon).join(" ")}`).join(" ") + (close ? " Z" : "");

export const LOCHAU = { id: "lochau", name: "Lochau", country: "AT", lat: 47.5303, lon: 9.7517 };

// minutes: [min, max] Richtwert; label = Anzeige wie im Bericht.
// minor: liegt dicht an Lochau. Mobil (< 640 px) steht der Name dann als
// Beschriftung mit Führungslinie an callout (Kartenkoordinaten), deren Fläche
// zugleich die ≥ 44 px große Trefferfläche ist.
export const PLACES = [
  { id: "lindau", name: "Lindau", country: "DE", lat: 47.546, lon: 9.684, minutes: [5, 5], label: "ca. 5 Min.", lp: "tl" },
  { id: "bregenz", name: "Bregenz", country: "AT", lat: 47.503, lon: 9.747, minutes: [5, 5], label: "ca. 5 Min.", lp: "l", minor: true, callout: { x: 556, y: 156, anchor: "start" } },
  // Dornbirn liegt mobil nur ≈ 34 px neben Lindau (R2: je ≈ 40 px Trefferfläche).
  // R4: mobil ebenfalls Callout nach rechts in die freie Fläche (unter Bregenz),
  // damit Lindau den vollen Kreis behält und beide ≥ 44 px erreichen.
  { id: "dornbirn", name: "Dornbirn", country: "AT", lat: 47.414, lon: 9.742, minutes: [20, 20], label: "ca. 20 Min.", lp: "r", callout: { x: 556, y: 252, anchor: "start" } },
  { id: "rheintal", name: "St. Galler Rheintal", short: "Rheintal", country: "CH", lat: 47.41, lon: 9.63, minutes: [30, 40], label: "ca. 30–40 Min.", lp: "b", minor: true, callout: { x: 285, y: 336, anchor: "middle" } },
  { id: "stgallen", name: "St. Gallen", country: "CH", lat: 47.424, lon: 9.377, minutes: [30, 40], label: "ca. 30–40 Min.", lp: "l" },
  { id: "vaduz", name: "Liechtenstein (Vaduz)", short: "Vaduz", country: "FL", lat: 47.141, lon: 9.521, minutes: [40, 40], label: "ca. 40 Min.", lp: "l" },
  { id: "friedrichshafen", name: "Friedrichshafen", country: "DE", lat: 47.654, lon: 9.479, minutes: [35, 45], label: "ca. 35–45 Min.", lp: "t" },
  { id: "ravensburg", name: "Ravensburg", country: "DE", lat: 47.782, lon: 9.612, minutes: [35, 45], label: "ca. 35–45 Min.", lp: "r" },
  { id: "kempten", name: "Kempten", country: "DE", lat: 47.726, lon: 10.315, minutes: [50, 50], label: "ca. 50 Min.", lp: "l" },
  { id: "konstanz", name: "Konstanz", country: "DE", lat: 47.66, lon: 9.175, minutes: [60, 60], label: "ca. 60 Min.", lp: "l" },
  { id: "lech", name: "Lech am Arlberg", short: "Lech", country: "AT", lat: 47.208, lon: 10.142, minutes: [75, 75], label: "ca. 75 Min.", lp: "l" },
  { id: "chur", name: "Chur", country: "CH", lat: 46.85, lon: 9.53, minutes: [75, 75], label: "ca. 75 Min.", lp: "r" },
  { id: "winterthur", name: "Winterthur", country: "CH", lat: 47.5, lon: 8.724, minutes: [75, 75], label: "ca. 75 Min.", lp: "t" },
  { id: "zuerich", name: "Zürich", country: "CH", lat: 47.377, lon: 8.541, minutes: [90, 90], label: "ca. 90 Min.", lp: "r" },
].map((p) => ({ ...p, xy: project(p.lat, p.lon) }));

export const HOME_XY = project(LOCHAU.lat, LOCHAU.lon);

// Bodensee: Obersee + Überlinger See, Untersee.
const OBERSEE = [
  [47.552, 9.69], [47.57, 9.63], [47.6, 9.545], [47.648, 9.475], [47.662, 9.385], [47.672, 9.32],
  [47.69, 9.268], [47.73, 9.21], [47.765, 9.16], [47.805, 9.04], [47.79, 9.03], [47.745, 9.09],
  [47.712, 9.135], [47.68, 9.17], [47.66, 9.18], [47.645, 9.2], [47.625, 9.25], [47.59, 9.33],
  [47.565, 9.38], [47.52, 9.43], [47.485, 9.49], [47.49, 9.56], [47.5, 9.62], [47.49, 9.68],
  [47.505, 9.73], [47.525, 9.75],
];
const UNTERSEE = [
  [47.668, 9.165], [47.7, 9.12], [47.725, 9.04], [47.73, 8.98], [47.705, 8.9], [47.672, 8.86],
  [47.66, 8.9], [47.668, 9.0], [47.665, 9.1],
];
const ZUERICHSEE = [
  [47.36, 8.545], [47.3, 8.6], [47.24, 8.72], [47.21, 8.82], [47.225, 8.83], [47.27, 8.7], [47.33, 8.6],
];
const RHEIN = [
  [47.5, 9.62], [47.45, 9.645], [47.4, 9.635], [47.35, 9.6], [47.3, 9.55], [47.25, 9.52], [47.2, 9.5],
  [47.13, 9.5], [47.06, 9.49], [46.95, 9.52], [46.85, 9.5],
];
const HOCHRHEIN = [[47.69, 8.86], [47.7, 8.75], [47.68, 8.62], [47.6, 8.48]];
// Grenzen schematisch: DE/AT (Allgäu), FL/AT, FL/CH folgt dem Rhein.
const BORDER_DE_AT = [
  [47.552, 9.75], [47.585, 9.8], [47.57, 9.88], [47.53, 9.95], [47.52, 10.03], [47.48, 10.08],
  [47.43, 10.1], [47.39, 10.18], [47.4, 10.26], [47.45, 10.33], [47.53, 10.45], [47.56, 10.6],
];
const BORDER_FL_AT = [[47.27, 9.6], [47.2, 9.58], [47.14, 9.63], [47.06, 9.6], [47.05, 9.53]];

export const SHAPES = {
  lakes: [line(OBERSEE, true), line(UNTERSEE, true), line(ZUERICHSEE, true)],
  rivers: [line(RHEIN), line(HOCHRHEIN)],
  borders: [line(BORDER_DE_AT), line(BORDER_FL_AT)],
  lakeLabel: project(47.6, 9.33),
};

export const COUNTRY_LABELS = [
  { code: "DE", text: "DEUTSCHLAND", xy: project(47.83, 9.95) },
  { code: "AT", text: "ÖSTERREICH", xy: project(47.3, 9.95) },
  { code: "CH", text: "SCHWEIZ", xy: project(47.13, 8.9) },
  { code: "FL", text: "FL", xy: project(47.18, 9.6) },
];

// Schematischer Bogen Lochau → Ort (für die animierte Route).
export function routePath([x, y]) {
  const [hx, hy] = HOME_XY;
  const dist = Math.hypot(x - hx, y - hy);
  const mx = (hx + x) / 2;
  const my = (hy + y) / 2 - Math.min(70, dist * 0.2);
  return `M${hx} ${hy} Q${mx} ${my} ${x} ${y}`;
}

// Trefferfläche eines Orts: Kreis mit Radius r, beschnitten auf seine
// Voronoi-Zelle (alle Punkte, die näher an diesem Ort liegen als an einem der
// Nachbarn). So teilen sich dicht liegende Orte den Platz gerecht, statt dass
// die Zeichenreihenfolge entscheidet. Rückgabe: SVG-Pfad (Polygon).
export function hitCell([px, py], neighbours, r, segments = 32) {
  let poly = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    poly.push([px + r * Math.cos(a), py + r * Math.sin(a)]);
  }
  for (const [ox, oy] of neighbours) {
    if (ox === px && oy === py) continue;
    if (Math.hypot(ox - px, oy - py) >= 2 * r) continue;
    // Halbebene: (q - m) · (o - p) <= 0, m = Mittelpunkt zwischen p und o.
    const nx = ox - px;
    const ny = oy - py;
    const mx = (px + ox) / 2;
    const my = (py + oy) / 2;
    const side = ([x, y]) => (x - mx) * nx + (y - my) * ny;
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const sa = side(a);
      const sb = side(b);
      if (sa <= 0) out.push(a);
      if ((sa <= 0) !== (sb <= 0)) {
        const t = sa / (sa - sb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    poly = out;
  }
  if (poly.length < 3) return "";
  return poly.map(([x, y], i) => `${i ? "L" : "M"}${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join(" ") + " Z";
}

// Lupe Lochau/Bregenz (R5-portal-labs, QM R4 P3-4): Bregenz liegt nur ≈ 14
// Karteneinheiten unter Lochau, die Punkte berühren sich. Statt Koordinaten zu
// verschieben, zeigt eine Lupe denselben Ausschnitt vergrößert. Alle Lagen
// kommen aus project() der echten Koordinaten (keine neuen Geodaten), die Lupe
// skaliert nur die Darstellung um den Mittelpunkt beider Orte.
const INSET_ZOOM = 5;
const BREGENZ_XY = PLACES.find((p) => p.id === "bregenz").xy;
const INSET_FOCUS = [(HOME_XY[0] + BREGENZ_XY[0]) / 2, (HOME_XY[1] + BREGENZ_XY[1]) / 2];
const INSET_C = [590, 462];
const insetXY = ([x, y]) => [
  Math.round((INSET_C[0] + (x - INSET_FOCUS[0]) * INSET_ZOOM) * 10) / 10,
  Math.round((INSET_C[1] + (y - INSET_FOCUS[1]) * INSET_ZOOM) * 10) / 10,
];
export const INSET = {
  cx: INSET_C[0],
  cy: INSET_C[1],
  r: 60,
  zoom: INSET_ZOOM,
  // SVG-Transform, das Kartenkoordinaten in die Lupe abbildet (für See/Ufer).
  transform: `translate(${INSET_C[0]} ${INSET_C[1]}) scale(${INSET_ZOOM}) translate(${-INSET_FOCUS[0]} ${-INSET_FOCUS[1]})`,
  home: insetXY(HOME_XY),
  bregenz: insetXY(BREGENZ_XY),
};
