// Reine Zoom-Rechnung für FotoZoom (Pinch-Zoom der Herstellerfotos, QA R2 P2-4). Getestet.
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
const MIN = ZOOM_MIN;
const MAX = ZOOM_MAX;

/** Verschiebung so begrenzen, dass das Bild die Fläche nie ganz verlässt (rein, getestet). */
export function clampPan(scale, x, y, w, h) {
  const mx = ((scale - 1) * w) / 2;
  const my = ((scale - 1) * h) / 2;
  return { x: Math.max(-mx, Math.min(mx, x)) || 0, y: Math.max(-my, Math.min(my, y)) || 0 };
}

/** Neue Ansicht nach Zoom um den Punkt (px, py) relativ zur Flächenmitte (rein, getestet). */
export function zoomAt(view, nextScale, px, py, w, h) {
  const s = Math.max(MIN, Math.min(MAX, nextScale));
  if (s === MIN) return { s: MIN, x: 0, y: 0 };
  const k = s / view.s;
  const p = clampPan(s, px - (px - view.x) * k, py - (py - view.y) * k, w, h);
  return { s, ...p };
}

