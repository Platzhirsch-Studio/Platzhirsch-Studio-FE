// Side elevation ("Längsriss") of the selected boat as SVG – the poster of
// the Werfthalle before 3D loads, and the fallback without WebGL. Drawn from
// the same generator as the 3D model (src/lib/yacht/hull.js), so zones sit
// in the same place. Server-safe (no hooks). The zone markers are a mouse
// convenience; the accessible controls are the zone buttons below the stage.
import { buildModel, sideProfile } from "@/lib/yacht/hull";
import { MATERIAL_TONES, TOKENS } from "@/lib/yacht/palette";

const SIDE_MATS = new Set(["gelcoat", "holz", "lärche", "hardtop", "glass", "window", "metal", "sail", "cradle", "teak"]);
const FILL = {
  gelcoat: TOKENS.paper,
  holz: MATERIAL_TONES.holz,
  lärche: MATERIAL_TONES.lärche,
  hardtop: TOKENS.stone,
  glass: "none",
  window: TOKENS.ink,
  metal: TOKENS.stoneDeep,
  sail: TOKENS.bone,
  cradle: TOKENS.inkSoft,
  teak: MATERIAL_TONES.teak,
};

const pts = (list) => list.map(([x, y]) => `${x.toFixed(3)},${(-y).toFixed(3)}`).join(" ");

/**
 * @param {string} modelKey
 * @param {Array<{id, short}>} zones
 * @param {string|null} zone active zone
 * @param {(id) => void} [onSelect]
 * @param {boolean} [evening]
 * @param {boolean} [showSteg]
 * @param {string} [className]
 */
export default function PosterSvg({ modelKey, zones = [], zone = null, onSelect, evening = false, showSteg = false, className }) {
  const model = buildModel(modelKey);
  const { hull: h, parts, anchors, cutY, floorY } = model;
  const { sheer, keel } = sideProfile(h);
  const outline = [...sheer, ...keel.slice().reverse()];
  const side = parts.filter((p) => SIDE_MATS.has(p.mat) && (showSteg || !p.steg) && Math.abs(p.p[2]) < h.B);
  const top = Math.max(...parts.filter((p) => !p.steg || showSteg).map((p) => p.p[1] + p.s[1] / 2), h.F + h.S);
  const pad = h.L * 0.1;
  const x0 = -h.L / 2 - pad - 1.5;
  const w = h.L + pad * 2 + 2.5;
  const y0 = -(top + pad);
  const hgt = top - floorY + pad * 2;
  const fs = Math.max(0.3, h.L * 0.024);
  const ink = evening ? TOKENS.paper : TOKENS.ink;
  const soft = evening ? TOKENS.stoneDeep : TOKENS.inkSoft;
  const cut = zone ? cutY[zone] : null;
  return (
    <svg viewBox={`${x0} ${y0} ${w} ${hgt}`} preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true" focusable="false">
      {/* hall floor and waterline */}
      <line x1={x0} x2={x0 + w} y1={-floorY} y2={-floorY} stroke={soft} strokeWidth={fs * 0.06} />
      <line x1={x0} x2={x0 + w} y1={0} y2={0} stroke={TOKENS.see} strokeWidth={fs * 0.05} strokeDasharray={`${fs * 0.5} ${fs * 0.35}`} />
      {/* hull */}
      <polygon points={pts(outline)} fill={h.finish === "holz" ? MATERIAL_TONES.holz : evening ? TOKENS.ink : TOKENS.paper} stroke={ink} strokeWidth={fs * 0.07} strokeLinejoin="round" />
      <polyline points={pts(sheer.map(([x, y]) => [x, Math.min(0.07, y)]))} fill="none" stroke={MATERIAL_TONES.bootStripe} strokeWidth={fs * 0.12} />
      {side.map((p, i) => {
        const fill = FILL[p.mat] ?? TOKENS.stone;
        return (
          <rect
            key={i}
            x={p.p[0] - p.s[0] / 2}
            y={-(p.p[1] + p.s[1] / 2)}
            width={p.s[0]}
            height={p.s[1]}
            rx={Math.min(p.r ?? 0, p.s[1] / 2, p.s[0] / 2)}
            fill={p.mat === "window" && evening ? MATERIAL_TONES.warm : fill}
            stroke={p.mat === "window" || p.mat === "cradle" ? "none" : ink}
            strokeWidth={fs * 0.035}
            opacity={p.mat === "glass" ? 0.6 : 1}
          />
        );
      })}
      {cut != null && (
        <line x1={x0} x2={x0 + w} y1={-cut} y2={-cut} stroke={TOKENS.brass500} strokeWidth={fs * 0.06} strokeDasharray={`${fs * 0.25} ${fs * 0.2}`} />
      )}
      {/* zone markers */}
      {zones.map((z) => {
        const a = anchors[z.id];
        if (!a) return null;
        const on = zone === z.id;
        // labels under the deck alternate in height so neighbours never overlap
        const inner = zones.filter((q) => cutY[q.id] != null && anchors[q.id]);
        const stagger = cutY[z.id] != null ? (inner.findIndex((q) => q.id === z.id) % 2) * fs * 1.6 : 0; // QM r1: Salon/Kabine lagen fast übereinander
        return (
          <g
            key={z.id}
            data-yacht-marker={z.id}
            onClick={onSelect ? () => onSelect(on ? null : z.id) : undefined}
            style={onSelect ? { cursor: "pointer" } : undefined}
          >
            <circle cx={a[0]} cy={-a[1]} r={fs * 0.38} fill={on ? TOKENS.brass400 : TOKENS.see} stroke={evening ? TOKENS.inkDeep : TOKENS.paper} strokeWidth={fs * 0.08} />
            <text x={a[0]} y={cutY[z.id] != null ? -a[1] + fs * 1.5 + stagger : -a[1] - fs * 0.7} textAnchor="middle" fontSize={fs} fill={ink} stroke={evening ? TOKENS.inkDeep : TOKENS.paper} strokeWidth={fs * 0.18} paintOrder="stroke" strokeLinejoin="round" style={{ fontFamily: "var(--font-sans)" }}>
              {z.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
