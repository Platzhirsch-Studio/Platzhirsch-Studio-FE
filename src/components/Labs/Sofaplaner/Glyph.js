// Schematic top view of one element (rot 0: back at the top, seat facing down).
// Outer size = manufacturer measure; backrest, armrest and cushion lines are
// schematic (Minotti publishes no cushion or armrest widths for most models).
import { footprint } from "../../../lib/sofaplaner/geometry.js";
import s from "./sofaplaner.module.css";

const SEATED = new Set(["ecke", "ende", "mitte", "chaise", "peninsula", "daybed", "sofa", "sessel"]);

// Fix-Runde 1 (F2): Vorschaukarten (Modellwahl, Palette, Vorlagen) zeichnen
// „weich“: Polster als einzelne Kissen mit Fuge, Rücken und Armlehnen dunkler,
// leichter Schatten – statt grauer Flächen mit Strichen. Rein schematisch aus den
// Herstellermaßen, kein Herstellerbild. Der Grundriss (PlanSvg) bleibt technisch.
function SoftGlyph({ w, d, backs, closed, kind, shape }) {
  const x0 = -w / 2,
    y0 = -d / 2;
  const B = Math.max(7, Math.min(22, d * 0.22));
  const A = Math.max(7, Math.min(20, w * 0.15));
  const frame = "var(--sp-thumb-fill)";
  const dark = "var(--sp-thumb-dark)";
  const cushion = "var(--sp-thumb-cushion)";
  const seam = "var(--sp-thumb-seam)";
  const sh = Math.max(2, Math.min(w, d) * 0.035);
  const round = shape === "curved" && Math.abs(w - d) < 2 && (kind === "insel" || kind === "hocker" || kind === "tisch");
  if (round) {
    return (
      <g>
        <circle cx={sh} cy={sh} r={w / 2} fill={dark} opacity="0.22" />
        <circle r={w / 2} fill={kind === "tisch" ? frame : cushion} stroke={seam} strokeWidth="1.2" />
        {kind === "insel" && <circle r={w / 2 - B * 0.8} fill="none" stroke={dark} strokeWidth={B * 0.5} opacity="0.5" />}
      </g>
    );
  }
  const r = kind === "hocker" || kind === "tisch" ? 6 : shape === "curved" ? Math.min(w, d) * 0.22 : 5;
  const parts = [<rect key="sh" x={x0 + sh} y={y0 + sh} width={w} height={d} rx={r} fill={dark} opacity="0.22" />];
  parts.push(<rect key="b" x={x0} y={y0} width={w} height={d} rx={r} fill={kind === "tisch" ? frame : frame} />);
  if (kind === "tisch") {
    parts.push(<rect key="t" x={x0 + 5} y={y0 + 5} width={w - 10} height={d - 10} rx={3} fill="none" stroke={dark} strokeWidth="1.6" opacity="0.7" />);
    return <g>{parts}</g>;
  }
  if (backs.includes("top")) parts.push(<rect key="bt" x={x0 + 1} y={y0 + 1} width={w - 2} height={B} rx={Math.min(5, r)} fill={dark} />);
  if (backs.includes("left")) parts.push(<rect key="bl" x={x0 + 1} y={y0 + 1} width={B} height={d - 2} rx="5" fill={dark} />);
  if (backs.includes("right")) parts.push(<rect key="br" x={-x0 - B - 1} y={y0 + 1} width={B} height={d - 2} rx="5" fill={dark} />);
  if (backs.includes("mid")) parts.push(<rect key="bm" x={x0 + 1} y={-B / 2} width={w - 2} height={B} rx="5" fill={dark} />);
  const top = backs.includes("top") ? B : 0;
  if (closed.includes("left")) parts.push(<rect key="al" x={x0 + 1} y={y0 + top * 0.5} width={A} height={d - top * 0.5 - 1} rx="5" fill={dark} opacity="0.85" />);
  if (closed.includes("right")) parts.push(<rect key="ar" x={-x0 - A - 1} y={y0 + top * 0.5} width={A} height={d - top * 0.5 - 1} rx="5" fill={dark} opacity="0.85" />);
  // Sitzkissen: Fläche zwischen Rücken und Armlehnen, in Kissen von ca. 95 cm geteilt
  const left = x0 + (closed.includes("left") ? A : backs.includes("left") ? B : 0) + 2;
  const right = -x0 - (closed.includes("right") ? A : backs.includes("right") ? B : 0) - 2;
  const yTop = y0 + top + 2;
  const yBot = -y0 - 2;
  if (backs.includes("mid")) {
    for (const [a, b] of [[yTop, -B / 2 - 2], [B / 2 + 2, yBot]]) {
      if (b - a > 4) parts.push(<rect key={`m${a}`} x={left} y={a} width={Math.max(1, right - left)} height={b - a} rx="6" fill={cushion} stroke={seam} strokeWidth="1.2" />);
    }
  } else if (right - left > 4 && yBot - yTop > 4) {
    const n = SEATED.has(kind) ? Math.max(1, Math.round((right - left) / 95)) : 1;
    const cw = (right - left) / n;
    for (let i = 0; i < n; i++) {
      parts.push(<rect key={`c${i}`} x={left + i * cw + (i ? 1.5 : 0)} y={yTop} width={cw - (i ? 1.5 : 0) - (i < n - 1 ? 1.5 : 0)} height={yBot - yTop} rx="6" fill={cushion} stroke={seam} strokeWidth="1.2" />);
    }
  }
  return <g>{parts}</g>;
}

export function Glyph({ w, d, backs = [], closed = [], kind = "sofa", shape = "rect", fill, dark, rounded, soft = false }) {
  if (soft) return <SoftGlyph w={w} d={d} backs={backs} closed={closed} kind={kind} shape={shape} />;
  const x0 = -w / 2,
    y0 = -d / 2;
  const B = Math.max(6, Math.min(20, d * 0.2));
  const A = Math.max(6, Math.min(18, w * 0.14));
  const round = shape === "curved" && Math.abs(w - d) < 2 && (kind === "insel" || kind === "hocker" || kind === "tisch");
  if (round) {
    return (
      <g>
        <circle r={w / 2} fill={fill} />
        {kind === "insel" && <circle r={w / 2 - B * 0.8} fill="none" stroke={dark} strokeWidth={B * 0.5} opacity="0.55" />}
      </g>
    );
  }
  const parts = [];
  const r = rounded ?? (kind === "hocker" || kind === "tisch" ? 6 : shape === "curved" ? Math.min(w, d) * 0.22 : 3);
  parts.push(<rect key="b" x={x0} y={y0} width={w} height={d} rx={r} fill={fill} />);
  if (kind === "tisch") parts.push(<rect key="t" x={x0 + 4} y={y0 + 4} width={w - 8} height={d - 8} rx={3} fill="none" stroke={dark} strokeWidth="2" />);
  if (backs.includes("top")) parts.push(<rect key="bt" x={x0} y={y0} width={w} height={B} rx={Math.min(3, r)} fill={dark} />);
  if (backs.includes("left")) parts.push(<rect key="bl" x={x0} y={y0} width={B} height={d} rx="3" fill={dark} />);
  if (backs.includes("right")) parts.push(<rect key="br" x={-x0 - B} y={y0} width={B} height={d} rx="3" fill={dark} />);
  if (backs.includes("mid")) parts.push(<rect key="bm" x={x0} y={-B / 2} width={w} height={B} rx="3" fill={dark} />);
  const top = backs.includes("top") ? B : 0;
  if (closed.includes("left")) parts.push(<rect key="al" x={x0} y={y0 + top * 0.4} width={A} height={d - top * 0.4} rx="3" fill={dark} opacity="0.8" />);
  if (closed.includes("right")) parts.push(<rect key="ar" x={-x0 - A} y={y0 + top * 0.4} width={A} height={d - top * 0.4} rx="3" fill={dark} opacity="0.8" />);
  if (SEATED.has(kind) && !backs.includes("mid")) {
    const left = x0 + (closed.includes("left") ? A : backs.includes("left") ? B : 0);
    const right = -x0 - (closed.includes("right") ? A : backs.includes("right") ? B : 0);
    const n = Math.max(1, Math.round((right - left) / 95));
    for (let i = 1; i < n; i++) {
      const x = left + ((right - left) / n) * i;
      parts.push(<line key={`s${i}`} x1={x} x2={x} y1={y0 + top} y2={-y0} stroke={dark} strokeWidth="1.5" opacity="0.6" />);
    }
    // seat direction marker
    parts.push(<path key="dir" d={`M -6 ${-y0 - 14} L 0 ${-y0 - 6} L 6 ${-y0 - 14}`} fill="none" stroke={dark} strokeWidth="2" />);
  }
  return <g>{parts}</g>;
}

/** Thumbnail of a whole composition (items with x/y centre, rot, w, d, backs, closed, kind). */
export function CompositionThumb({ items, className, label }) {
  if (!items?.length) return null;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const i of items) {
    const r = footprint(i);
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  const pad = Math.max(10, (x1 - x0) * 0.05);
  return (
    <svg
      viewBox={`${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`}
      className={className || s.thumb}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {items.map((i, k) => (
        <g key={k} transform={`translate(${i.x} ${i.y}) rotate(${i.rot})`}>
          <Glyph soft w={i.w} d={i.d} backs={i.backs} closed={i.closed} kind={i.kind} shape={i.shape} />
        </g>
      ))}
    </svg>
  );
}
