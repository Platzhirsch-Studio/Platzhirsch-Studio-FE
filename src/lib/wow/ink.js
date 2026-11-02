// Ink of the "Pause" line – the drawing should read as a hand with a pen, not
// as a vector outline. Computed on the server from PAUSE_PATHS (0 KB client JS).
//  - every pen path is ONE continuous stroke (push r3, Wächter #7 / awwwards #2:
//    the ruler overshoot of r1/r2 split ruled paths into single segments, which
//    read as "Klammern" and orphan strokes at the corners – gone);
//  - pressure: a thin core (drawn by the pen), a "swell" on the middle part
//    and, on long strokes, a "belly" where the hand presses. Core 0.7 px →
//    swell 1.5 px → belly 2.6 px (push r3: the r2 steps 0.8/1.6/2.4 read as one
//    even width). The ranges vary per path (deterministic hash of the id, the
//    same on server and in tests), so the ink thins out at both ends.
// Construction lines (kind "guide") stay thin and even.
// Push r2 (luxus-cd #2): no dash of length 0 – with round caps it paints a dot.
// The swell is one dash "b, 1 − b" shifted by −a (dash()).

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
};
const r2 = (n) => Math.round(n * 100) / 100;

// Rendered strokes: { …path, rd, swell: [start, length] | null, belly: [start, length] | null }
export function inkStrokes(paths) {
  return paths.map((p) => {
    if (p.kind === "guide") return { ...p, rd: p.d, swell: null, belly: null };
    const h = hash(p.id);
    const h2 = hash(`${p.id}·`);
    const a = 0.06 + h * 0.12; // ink thins out over the first 6–18 %
    const e = 0.08 + h2 * 0.14; // … and the last 8–22 %
    const swell = [r2(a), r2(1 - a - e)];
    const belly = p.len > 380 ? [r2(0.22 + h2 * 0.18), r2(0.22 + h * 0.16)] : null;
    return { ...p, rd: p.d, swell, belly };
  });
}

// One dash of length b that starts at a (pathLength 1): dasharray + offset.
export const dash = ([a, b]) => ({ strokeDasharray: `${b} ${r2(1 - b)}`, strokeDashoffset: -a });
