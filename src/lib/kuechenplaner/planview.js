// Küchenplaner – Ausschnitt (viewBox) des Grundrisses, ohne JSX: auch in Node testbar.
const S = 100; // m → cm

/**
 * viewBox des Grundrisses, auf den Inhalt zugeschnitten (Wände, Module, Insel).
 * Ohne Maßketten 6 % Rand (mind. 18 cm), mit Maßketten Platz für drei Ketten.
 * (Fix 1, P1-1: vorher fester Rand von 40 cm → kleiner Plan auf dem Handy.)
 */
// QM r5: k = Textfaktor (200 % Text → 2) – größere Maßzahlen brauchen mehr Rand für die Ketten.
export function planViewBox(kitchen, dims = false, k = 1) {
  const raw = boundsOf(kitchen, 0);
  const base = Math.max(18, Math.round(Math.max(raw.w, raw.h) * 0.06));
  if (!dims) return boundsOf(kitchen, base);
  // QM r5: Rand für die Maßketten nur an den Seiten, an denen Ketten stehen (außen an den
  // gezeichneten Wänden, wie PlanDims) – vorher 95 cm rundum, im Druck ~100 px leer unter dem Plan.
  const dimPad = Math.round(95 * Math.min(3, Math.max(1, k || 1)));
  const pad = { l: base, r: base, t: base, b: base };
  for (const w of kitchen.walls || []) {
    if (!w.rendered && w.id !== "a") continue;
    const ox = -w.n[0];
    const oz = -w.n[1];
    if (oz < -0.5) pad.t = dimPad;
    if (oz > 0.5) pad.b = dimPad;
    if (ox < -0.5) pad.l = dimPad;
    if (ox > 0.5) pad.r = dimPad;
  }
  return boundsOf(kitchen, pad);
}

/** pad: Zahl (rundum) oder { l, r, t, b } in cm. */
export function boundsOf(kitchen, pad) {
  const P = typeof pad === "number" ? { l: pad, r: pad, t: pad, b: pad } : pad;
  const xs = [];
  const zs = [];
  for (const w of kitchen.walls) {
    if (!w.rendered && w.id !== "d") continue;
    xs.push(w.p0[0], w.p1[0]);
    zs.push(w.p0[1], w.p1[1]);
  }
  for (const p of kitchen.parts) for (const [x, z] of p.quad || []) {
    xs.push(x);
    zs.push(z);
  }
  const minX = Math.min(...xs) * S - P.l;
  const minZ = Math.min(...zs) * S - P.t;
  return { minX, minZ, w: Math.max(...xs) * S + P.r - minX, h: Math.max(...zs) * S + P.b - minZ };
}


/** Ausschnitt bei Zoom z um den Mittelpunkt c (cm), im Rahmen des Gesamtplans. */
export function zoomBox(vb, z, c) {
  if (z <= 1) return vb;
  const w = vb.w / z;
  const h = vb.h / z;
  const minX = Math.max(vb.minX, Math.min(vb.minX + vb.w - w, c[0] - w / 2));
  const minZ = Math.max(vb.minZ, Math.min(vb.minZ + vb.h - h, c[1] - h / 2));
  return { minX, minZ, w, h };
}

/**
 * Zoom-Ziel ohne Auswahl (Fix 2, P2-2): der Modulmittelpunkt, dessen Ausschnitt
 * die meisten Module zeigt (bei L/U die Ecke), bei Gleichstand der nächste am
 * Schwerpunkt. Ergebnis in cm (SVG-Einheiten) oder null ohne Module.
 */
export function zoomFocus(mods, vb, z) {
  const cs = (mods || [])
    .filter((m) => m.kind !== "upper" && m.quad)
    .map((m) => [((m.quad[0][0] + m.quad[2][0]) / 2) * S, ((m.quad[0][1] + m.quad[2][1]) / 2) * S]);
  if (!cs.length) return null;
  const g = [cs.reduce((s, c) => s + c[0], 0) / cs.length, cs.reduce((s, c) => s + c[1], 0) / cs.length];
  let best = null;
  for (const c of cs) {
    const box = zoomBox(vb, z, c);
    const n = cs.filter(([x, y]) => x >= box.minX && x <= box.minX + box.w && y >= box.minZ && y <= box.minZ + box.h).length;
    const d = Math.hypot(c[0] - g[0], c[1] - g[1]);
    if (!best || n > best.n || (n === best.n && d < best.d)) best = { c, n, d };
  }
  return best.c;
}

/**
 * QM r5: Bereiche einer Wand mit Nischenrückwand, aber ohne eigenes Modul – an einer 90°-Ecke
 * steht dort die Nachbarzeile (Eckschrank + Arbeitsplatte). Ergebnis in cm entlang der Wand.
 */
export function elevationCornerZones(parts, run, minW = 20) {
  const splash = parts.filter((p) => /splash/.test(p.id));
  if (!splash.length || !run.length) return [];
  const su0 = Math.min(...splash.map((p) => p.local.u0 * S));
  const su1 = Math.max(...splash.map((p) => p.local.u1 * S));
  const r0 = Math.min(...run.map((m) => m.x0));
  const r1x = Math.max(...run.map((m) => m.x1));
  const out = [];
  if (r0 - su0 >= minW) out.push({ x0: su0, w: r0 - su0 });
  if (su1 - r1x >= minW) out.push({ x0: r1x, w: su1 - r1x });
  return out;
}
