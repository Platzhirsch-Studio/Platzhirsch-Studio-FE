// Kino-Lab „3D-Bühne“ – Umriss aus einer Silhouetten-Maske (rein, ohne three).
//
// Die Szene rendert das Möbel einmal weiß auf Schwarz in eine kleine
// Render-Target-Maske (Kamera = Startkamera). Hier wird daraus der äußere
// Umriss gewonnen (Moore-Nachbarschaft), vereinfacht (Ramer-Douglas-Peucker)
// und als geglätteter SVG-Pfad (Catmull-Rom → kubische Bézier) in
// Bildschirm-Pixeln zurückgegeben. So deckt sich die Bleistift-Linie exakt mit
// dem Modell, das sich danach „materialisiert“ – bei jedem Seitenverhältnis.

const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];

/** Äußerer Umriss der ersten Fläche (Zeilen von oben). mask: Uint8Array w*h, 1 = Möbel. */
export function traceOutline(mask, w, h) {
  let start = -1;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) {
      start = i;
      break;
    }
  }
  if (start < 0) return [];
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const sx = start % w;
  const sy = (start / w) | 0;
  const pts = [[sx, sy]];
  let x = sx;
  let y = sy;
  // Der Startpunkt ist der erste gesetzte Pixel: links von ihm ist leer.
  // Wir kamen also „von Westen“ – Suche im Uhrzeigersinn ab Nordwest.
  let dir = 7; // zuletzt gegangene Richtung (gedacht: nach Nordosten)
  const limit = w * h * 4;
  for (let n = 0; n < limit; n++) {
    let moved = false;
    // Suche beginnt links-hinter der letzten Richtung (Moore-Rückverfolgung)
    const from = (dir + 6) % 8;
    for (let k = 0; k < 8; k++) {
      const d = (from + k) % 8;
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (inside(nx, ny)) {
        x = nx;
        y = ny;
        dir = d;
        moved = true;
        break;
      }
    }
    if (!moved) break; // einzelner Pixel
    if (x === sx && y === sy) break;
    pts.push([x, y]);
  }
  return pts;
}

function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/** Ramer-Douglas-Peucker, iterativ. */
export function simplify(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpDist(pts[i], pts[a], pts[b]);
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > eps && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Geschlossener, geglätteter Pfad (Catmull-Rom, Spannung 0.5) als SVG-d. */
export function smoothPath(pts) {
  const n = pts.length;
  if (n < 3) return "";
  const f = (v) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/**
 * Maske (RGBA aus readRenderTargetPixels, Zeilen von UNTEN) → Umriss in
 * Bildschirm-Pixeln. Gibt { d, box } oder null zurück.
 */
export function outlineFromPixels(rgba, mw, mh, W, H) {
  const mask = new Uint8Array(mw * mh);
  for (let y = 0; y < mh; y++) {
    const src = (mh - 1 - y) * mw; // WebGL liest von unten
    for (let x = 0; x < mw; x++) mask[y * mw + x] = rgba[(src + x) * 4] > 127 ? 1 : 0;
  }
  const raw = traceOutline(mask, mw, mh);
  if (raw.length < 12) return null;
  const sx = W / mw;
  const sy = H / mh;
  const pts = simplify(raw, 0.9).map(([x, y]) => [x * sx, y * sy]);
  if (pts.length < 4) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { d: smoothPath(pts), box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
}
