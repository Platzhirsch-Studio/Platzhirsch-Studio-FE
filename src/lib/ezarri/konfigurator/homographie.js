// Ezarri-Konfigurator – perspektivische Fotomontage (Runde 5, neuland P1-3).
// Reine Funktionen ohne DOM: Die Mosaikfläche (ein Rechteck W×H in Pixeln)
// wird per Homographie auf vier frei ziehbare Eckpunkte gelegt. Das Ergebnis
// geht als CSS `matrix3d(...)` an die Fläche (transform-origin 0 0), so dass
// der Browser die Perspektive auf der GPU zeichnet – das Foto bleibt dabei
// unverändert im Browser.
//
// Eckenreihenfolge überall: oben links, oben rechts, unten rechts, unten links.

export const ECKEN = [
  { key: "ol", label: "oben links" },
  { key: "or", label: "oben rechts" },
  { key: "ur", label: "unten rechts" },
  { key: "ul", label: "unten links" },
];

// Startlage in Prozent der Fotofläche: ein leichtes Trapez wie ein Beckenboden
// von schräg oben, damit sofort sichtbar ist, dass Perspektive möglich ist.
export const START_ECKEN = [
  { x: 22, y: 44 },
  { x: 78, y: 44 },
  { x: 94, y: 88 },
  { x: 6, y: 88 },
];

/**
 * Homographie vom Einheitsquadrat (0,0)(1,0)(1,1)(0,1) auf das Viereck q
 * (Heckbert 1989). Rückgabe 3×3 als Zeilen-Array [a,b,c,d,e,f,g,h,1]:
 *   x = (a·u + b·v + c) / (g·u + h·v + 1),  y = (d·u + e·v + f) / (g·u + h·v + 1)
 */
export function quadratAufViereck(q) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  let g = 0;
  let h = 0;
  if (Math.abs(dx3) > 1e-12 || Math.abs(dy3) > 1e-12) {
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) < 1e-12) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
  }
  return [
    p1.x - p0.x + g * p1.x,
    p3.x - p0.x + h * p3.x,
    p0.x,
    p1.y - p0.y + g * p1.y,
    p3.y - p0.y + h * p3.y,
    p0.y,
    g,
    h,
    1,
  ];
}

/** Homographie vom Rechteck 0..w × 0..h (Pixel) auf das Viereck q. */
export function rechteckAufViereck(w, h, q) {
  const m = quadratAufViereck(q);
  if (!m || !(w > 0) || !(h > 0)) return null;
  return [m[0] / w, m[1] / h, m[2], m[3] / w, m[4] / h, m[5], m[6] / w, m[7] / h, m[8]];
}

/** Punkt (x,y) mit der 3×3-Matrix m abbilden. */
export function abbilden(m, x, y) {
  const z = m[6] * x + m[7] * y + m[8];
  return { x: (m[0] * x + m[1] * y + m[2]) / z, y: (m[3] * x + m[4] * y + m[5]) / z };
}

/** 3×3-Homographie als CSS matrix3d (spaltenweise, z unverändert). */
export function alsMatrix3d(m) {
  const n = (v) => (Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(10)));
  const c = [m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, m[8]];
  return `matrix3d(${c.map(n).join(",")})`;
}

/**
 * Konvex und im Uhrzeigersinn (Bildschirmkoordinaten, y nach unten)?
 * Nur dann ist die Montage eindeutig; überkreuzte Ecken werden abgewiesen.
 */
export function istKonvex(q) {
  let vorzeichen = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const kreuz = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(kreuz) < 1e-9) return false;
    const s = Math.sign(kreuz);
    if (vorzeichen === 0) vorzeichen = s;
    else if (s !== vorzeichen) return false;
  }
  return vorzeichen > 0;
}

const klemmen = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;

/**
 * Ecke i auf (x,y) in Prozent setzen. Bleibt das Viereck nicht konvex, bleibt
 * die alte Lage (Rückgabe: dasselbe Array), sonst ein neues Array.
 */
export function eckeSetzen(ecken, i, x, y) {
  const neu = ecken.map((p, j) => (j === i ? { x: klemmen(x), y: klemmen(y) } : p));
  return istKonvex(neu) ? neu : ecken;
}

/** Ecken in Prozent → Pixel einer Fläche breite × hoehe. */
export function inPixel(ecken, breite, hoehe) {
  return ecken.map((p) => ({ x: (p.x / 100) * breite, y: (p.y / 100) * hoehe }));
}

/** CSS-Transform für die Mosaikfläche (w×h px) auf die Ecken (Prozent) im Foto (breite×hoehe px). */
export function flaechenTransform(ecken, w, h, breite, hoehe) {
  if (!(breite > 0) || !(hoehe > 0)) return "none";
  const m = rechteckAufViereck(w, h, inPixel(ecken, breite, hoehe));
  return m ? alsMatrix3d(m) : "none";
}

/**
 * Affine Abbildung, die das Quelldreieck s auf das Zieldreieck d legt, als
 * Canvas-Transform [a, b, c, d, e, f] (x' = a·u + c·v + e, y' = b·u + d·v + f).
 */
export function dreieckAffin(s, d) {
  const du1 = s[1].x - s[0].x;
  const dv1 = s[1].y - s[0].y;
  const du2 = s[2].x - s[0].x;
  const dv2 = s[2].y - s[0].y;
  const det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-12) return null;
  const dx1 = d[1].x - d[0].x;
  const dy1 = d[1].y - d[0].y;
  const dx2 = d[2].x - d[0].x;
  const dy2 = d[2].y - d[0].y;
  const a = (dx1 * dv2 - dx2 * dv1) / det;
  const c = (dx2 * du1 - dx1 * du2) / det;
  const b = (dy1 * dv2 - dy2 * dv1) / det;
  const dd = (dy2 * du1 - dy1 * du2) / det;
  return [a, b, c, dd, d[0].x - a * s[0].x - c * s[0].y, d[0].y - b * s[0].x - dd * s[0].y];
}

/**
 * Zerlegt das Quellrechteck w×h in n×n Zellen à zwei Dreiecke und bildet jede
 * Ecke per Homographie m ab. Rückgabe: [{ s: [p,p,p], d: [p,p,p] }, …].
 * Stückweise affin – bei n ≥ 12 ist der Fehler zur echten Perspektive kleiner
 * als ein Mosaikstein.
 */
export function dreiecksNetz(m, w, h, n = 14) {
  const pkt = [];
  for (let j = 0; j <= n; j++) {
    const zeile = [];
    for (let i = 0; i <= n; i++) {
      const s = { x: (i / n) * w, y: (j / n) * h };
      zeile.push({ s, d: abbilden(m, s.x, s.y) });
    }
    pkt.push(zeile);
  }
  const out = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = pkt[j][i];
      const b = pkt[j][i + 1];
      const c = pkt[j + 1][i + 1];
      const d = pkt[j + 1][i];
      out.push({ s: [a.s, b.s, c.s], d: [a.d, b.d, c.d] }, { s: [a.s, c.s, d.s], d: [a.d, c.d, d.d] });
    }
  }
  return out;
}

/**
 * Zeichnet die Quelle (Canvas/Bild w×h) perspektivisch auf die Ecken (Pixel)
 * in ctx. dpr skaliert auf Geräte-Pixel. Nähte werden durch minimales
 * Aufweiten der Clip-Dreiecke vermieden.
 */
export function perspektivischZeichnen(ctx, quelle, w, h, eckenPx, { dpr = 1, n = 14 } = {}) {
  const m = rechteckAufViereck(w, h, eckenPx);
  if (!m) return false;
  for (const t of dreiecksNetz(m, w, h, n)) {
    const af = dreieckAffin(t.s, t.d);
    if (!af) continue;
    const cx = (t.d[0].x + t.d[1].x + t.d[2].x) / 3;
    const cy = (t.d[0].y + t.d[1].y + t.d[2].y) / 3;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    t.d.forEach((p, k) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const l = Math.hypot(dx, dy) || 1;
      const x = p.x + (dx / l) * 0.6;
      const y = p.y + (dy / l) * 0.6;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(dpr * af[0], dpr * af[1], dpr * af[2], dpr * af[3], dpr * af[4], dpr * af[5]);
    ctx.drawImage(quelle, 0, 0);
    ctx.restore();
  }
  return true;
}
