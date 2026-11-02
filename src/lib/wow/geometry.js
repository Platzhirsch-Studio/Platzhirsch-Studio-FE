// Small geometry helpers for the "Pause" drawing (server and tests, 0 KB
// client JS). Paths use only M, L, C and Z in absolute viewBox units.

// Points every `step` units along an M/L/C/Z path (sub-paths are not joined).
export function samples(d, step = 4) {
  const out = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const line = (x, y) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x - cx, y - cy) / step));
    for (let k = 1; k <= n; k++) out.push([cx + ((x - cx) * k) / n, cy + ((y - cy) * k) / n]);
    cx = x;
    cy = y;
  };
  for (const seg of d.match(/[MLCZ][^MLCZ]*/g) || []) {
    const n = (seg.slice(1).match(/-?\d+(\.\d+)?/g) || []).map(Number);
    if (seg[0] === "M") {
      cx = sx = n[0];
      cy = sy = n[1];
      out.push([cx, cy]);
    } else if (seg[0] === "L") for (let i = 0; i < n.length; i += 2) line(n[i], n[i + 1]);
    else if (seg[0] === "Z") line(sx, sy);
    else
      for (let i = 0; i < n.length; i += 6) {
        const [x0, y0] = [cx, cy];
        for (let k = 1; k <= 16; k++) {
          const u = k / 16;
          const [a, b, c, e] = [(1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3];
          line(a * x0 + b * n[i] + c * n[i + 2] + e * n[i + 4], a * y0 + b * n[i + 1] + c * n[i + 3] + e * n[i + 5]);
        }
      }
  }
  return out;
}

// Closed outline of a path as a coarse polygon (for the cardboard pieces, so
// model and line share one shape).
export function outline(d, step = 24) {
  return samples(d, step).map(([x, y]) => [Math.round(x), Math.round(y)]);
}

export const toPoints = (pts) => pts.map(([x, y]) => `${x},${y}`).join(" ");
