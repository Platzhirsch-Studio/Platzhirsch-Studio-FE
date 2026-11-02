// Küchenplaner – Zeichnungen als SVG: Grundriss (mit Maßketten, Öffnungen,
// Türaufschlag, Arbeitsdreieck) und Ansicht je Wand (Fronten, Höhenkette).
// Ohne Hooks und ohne "use client": läuft im Planer, im Editor und in der
// Druckansicht (Server). Alle Werte kommen aus buildKitchen(plan).
import { MODULES, OPENINGS, fmtCm } from "./catalog.js";
import { ceilingAt } from "../../../lib/kuechenplaner/room.js";
import { elevationCornerZones, planViewBox } from "../../../lib/kuechenplaner/planview.js";
// Sprachen (01.11.2026): t = Übersetzer (Planer: useKpT, Druckansicht: Server); ohne t deutsch.
import { kpIdentity } from "../../../lib/kuechenplaner/i18n.js";

const S = 100; // m → cm (SVG-Einheit = 1 cm)
const INK = "#30373e";
const SOFT = "#5c636a";
const ACCENT = "#7a5f17";
const ERR = "#9b2c2c";
const FONT = "inherit";

const pts = (q) => q.map(([x, z]) => `${(x * S).toFixed(1)},${(z * S).toFixed(1)}`).join(" ");
const r1 = (n) => Math.round(n * 10) / 10;

export { planViewBox };

/** Maßkette entlang einer Linie p0→p1 (cm), versetzt um `off` (Richtung n). */
function Chain({ p0, u, n, off, stops, keyPrefix, size = 15, color = ACCENT }) {
  // stops: Positionen (cm) entlang u, ab p0
  const at = (s, o) => [p0[0] + u[0] * s + n[0] * o, p0[1] + u[1] * s + n[1] * o];
  let ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  const flip = ang > 90 || ang < -90;
  if (flip) ang += 180;
  const els = [];
  const a = at(stops[0], off);
  const b = at(stops[stops.length - 1], off);
  els.push(<line key={`${keyPrefix}-l`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth="1" />);
  stops.forEach((s, i) => {
    const t0 = at(s, off - 6);
    const t1 = at(s, off + 6);
    const d0 = at(s - 3, off - 3);
    const d1 = at(s + 3, off + 3);
    els.push(<line key={`${keyPrefix}-t${i}`} x1={t0[0]} y1={t0[1]} x2={t1[0]} y2={t1[1]} stroke={color} strokeWidth="0.8" />);
    els.push(<line key={`${keyPrefix}-d${i}`} x1={d0[0]} y1={d0[1]} x2={d1[0]} y2={d1[1]} stroke={color} strokeWidth="1.4" />);
    if (i > 0) {
      const len = s - stops[i - 1];
      if (len < 0.5) return;
      const m = at((s + stops[i - 1]) / 2, off + Math.max(9, size * 0.6)); // wie bisher 9, wächst mit der Schrift
      const small = len < size * 2.2;
      els.push(
        <text
          key={`${keyPrefix}-x${i}`}
          x={m[0]}
          y={m[1]}
          fontSize={small ? size * 0.72 : size}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontFamily={FONT}
          transform={`rotate(${ang} ${m[0]} ${m[1]})`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {fmtCm(r1(len))}
        </text>,
      );
    }
  });
  return <g>{els}</g>;
}

function DoorSwing({ o, frame }) {
  const W = (u, v) => [(frame.origin[0] + frame.u[0] * u + frame.v[0] * v) * S, (frame.origin[1] + frame.u[1] * u + frame.v[1] * v) * S];
  const hingeU = o.s === "l" ? o.u0 : o.u1;
  const freeU = o.s === "l" ? o.u1 : o.u0;
  const r = o.u1 - o.u0;
  const h = W(hingeU, 0);
  const leafEnd = W(hingeU, r);
  const free = W(freeU, 0);
  return (
    <g stroke={SOFT} fill="none" strokeWidth="1.2">
      <line x1={h[0]} y1={h[1]} x2={leafEnd[0]} y2={leafEnd[1]} />
      <path d={`M ${leafEnd[0]} ${leafEnd[1]} A ${r * S} ${r * S} 0 0 ${o.s === "l" ? (frame.rs > 0 ? 1 : 0) : frame.rs > 0 ? 0 : 1} ${free[0]} ${free[1]}`} strokeDasharray="4 4" />
    </g>
  );
}

/**
 * Grundriss. Props: plan, kitchen, dims (Maßketten), checks (Fehler rot),
 * triangle (Arbeitsdreieck), selected (Modul-ID), onModuleDown(e, mod), editable.
 */
export function PlanSvg({ plan, kitchen, dims = false, checks = null, triangle = true, selected = null, onModuleDown, onIslandDown, svgRef, className = "", title, children, viewBox = null, unitPerPx = 0, textScale = 1, touchAction, onBackgroundDown, labels = true, t = kpIdentity }) {
  // labels=false (Fix 3, P3-3): Miniaturen ohne Modul- und Anschluss-Kürzel – dort wären sie ~6 px klein.
  const vb = viewBox || planViewBox(kitchen, dims);
  // Mindestschrift 11 px auf dem Bildschirm (Fix 1, P1-1): unitPerPx = SVG-Einheiten je CSS-Pixel
  // QM r5: Mindestgröße wächst mit der Textgröße (textScale, WCAG 1.4.4)
  const fs = (base) => (unitPerPx > 0 ? Math.max(base, 11 * textScale * unitPerPx) : base);
  // Beschriftung mit Kontur in Papierfarbe: Linien dahinter wirken nicht wie durchgestrichen (P2-4)
  const halo = { paintOrder: "stroke", stroke: "#faf8f4", strokeWidth: fs(15) * 0.28, strokeLinejoin: "round" };
  const mods = kitchen.mods;
  // QM r4 (Handy quer): kleine Pläne – ein Kürzel, das breiter als sein Modul wäre, entfällt
  // (vorher „SPGSUSUSUS“ ineinander). Die Legende und das Antippen nennen das Modul weiter.
  const labelW = (text, f) => String(text).length * f * 0.68 + f * 0.5;
  const shownLabels = kitchen.labels.filter((l) => !(l.w > 0) || labelW(l.text, fs(15)) <= l.w * 0.95);
  const err = checks?.errorIds || new Set();
  const warn = checks?.warnIds || new Set();
  const floorPoly = kitchen.walls.filter((w) => w.id !== "d" || plan.shape !== "frei").map((w) => `${w.p0[0] * S},${w.p0[1] * S}`);
  const roomPoly = plan.shape === "frei" ? kitchen.walls.map((w) => `${w.p0[0] * S},${w.p0[1] * S}`).join(" ") : (() => {
    const W = kitchen.room.w * S;
    const D = kitchen.room.d * S;
    return `0,0 ${W},0 ${W},${D} 0,${D}`;
  })();
  void floorPoly;
  const tops = kitchen.parts.filter((p) => /-top\d/.test(p.id) || /-k\d+-top$/.test(p.id) || p.id === "i-barTop");
  const tri = triangle && checks?.metrics?.triangle;
  const label = title || t("Grundriss: {n1} Module, Raum {n2} × {n3} cm", { n1: mods.filter((m) => m.kind !== "upper").length, n2: Math.round(kitchen.room.w * 100), n3: Math.round(kitchen.room.d * 100) });

  return (
    <svg ref={svgRef} viewBox={`${vb.minX} ${vb.minZ} ${vb.w} ${vb.h}`} className={className} role="img" aria-label={label} style={{ touchAction: touchAction ?? (onModuleDown ? "pan-y pinch-zoom" : undefined) }}>
      {onBackgroundDown && <rect x={vb.minX} y={vb.minZ} width={vb.w} height={vb.h} fill="transparent" onPointerDown={onBackgroundDown} data-plan-bg="" />}
      <polygon points={roomPoly} fill="#faf8f4" pointerEvents={onBackgroundDown ? "none" : undefined} />
      {/* Wände */}
      <g stroke={INK} strokeWidth="7" strokeLinecap="square">
        {kitchen.walls.filter((w) => w.rendered).map((w) => {
          const o = 3.5;
          return <line key={w.id} x1={(w.p0[0] - w.n[0] * o / S) * S} y1={(w.p0[1] - w.n[1] * o / S) * S} x2={(w.p1[0] - w.n[0] * o / S) * S} y2={(w.p1[1] - w.n[1] * o / S) * S} />;
        })}
      </g>
      {plan.shape !== "frei" && (
        <line x1={0} y1={kitchen.room.d * S} x2={kitchen.room.w * S} y2={kitchen.room.d * S} stroke={SOFT} strokeWidth="1" strokeDasharray="6 6" />
      )}
      {/* Öffnungen und Anschlüsse */}
      {kitchen.openings.map((o) => {
        const f = kitchen.frames[o.w];
        if (!f) return null;
        const a = [o.p0[0] * S, o.p0[1] * S];
        const b = [o.p1[0] * S, o.p1[1] * S];
        const n = o.wall.n;
        const big = o.k === "fenster" || o.k === "tuer" || o.k === "heizung";
        if (o.k === "heizung") {
          const q = [o.p0, o.p1, [o.p1[0] + n[0] * 0.1, o.p1[1] + n[1] * 0.1], [o.p0[0] + n[0] * 0.1, o.p0[1] + n[1] * 0.1]];
          return <polygon key={`op${o.idx}`} points={pts(q)} fill="#e9e2d7" stroke={SOFT} strokeWidth="1"><title>{t("Heizkörper {n} cm", { n: o.b })}</title></polygon>;
        }
        if (big) {
          return (
            <g key={`op${o.idx}`}>
              <line x1={a[0] - n[0] * 3.5} y1={a[1] - n[1] * 3.5} x2={b[0] - n[0] * 3.5} y2={b[1] - n[1] * 3.5} stroke="#faf8f4" strokeWidth="9" />
              {o.k === "fenster" && (
                <>
                  <line x1={a[0] - n[0] * 1} y1={a[1] - n[1] * 1} x2={b[0] - n[0] * 1} y2={b[1] - n[1] * 1} stroke={INK} strokeWidth="1" />
                  <line x1={a[0] - n[0] * 6} y1={a[1] - n[1] * 6} x2={b[0] - n[0] * 6} y2={b[1] - n[1] * 6} stroke={INK} strokeWidth="1" />
                </>
              )}
              {o.k === "tuer" && <DoorSwing o={o} frame={f} />}
              <title>{t("{name} {n} cm", { name: t(OPENINGS[o.k].label), n: o.b })}</title>
            </g>
          );
        }
        const c = [(a[0] + b[0]) / 2 + n[0] * 8, (a[1] + b[1]) / 2 + n[1] * 8];
        return (
          <g key={`op${o.idx}`}>
            <circle cx={c[0]} cy={c[1]} r="7" fill="#fff" stroke={o.k === "wasser" ? "#4f6b68" : o.k === "abluft" ? SOFT : ACCENT} strokeWidth="1.6" />
            {labels && <text x={c[0]} y={c[1] + 0.5} fontSize={fs(7)} textAnchor="middle" dominantBaseline="middle" fill={INK} fontFamily={FONT}>{OPENINGS[o.k].short}</text>}
            <title>{t("{name} bei {n1} cm, Höhe {n2} cm", { name: t(OPENINGS[o.k].label), n1: o.x, n2: o.y })}</title>
          </g>
        );
      })}
      {/* Arbeitsplatten */}
      {tops.map((p) => <polygon key={p.id} points={pts(p.quad)} fill="#e4ddd1" stroke="#b5a993" strokeWidth="0.8" />)}
      {/* Module (unten/hoch), Hängeschränke gestrichelt */}
      {mods.map((m) => {
        const tall = m.kind === "tall";
        const upper = m.kind === "upper";
        const isErr = err.has(m.id) || m.over;
        const isWarn = warn.has(m.id);
        const sel = selected === m.id;
        // Nur die Module blockieren das Scrollen, die Fläche dazwischen nicht (Fix 1, P1-2)
        const handlers = onModuleDown && !upper && !m.auto ? { "data-drag": "", onPointerDown: (e) => onModuleDown(e, m), style: { cursor: "grab", touchAction: "none" } } : {};
        return (
          <polygon
            key={m.id}
            data-mod={m.id}
            points={pts(m.quad)}
            pointerEvents={upper ? "none" : undefined}
            fill={upper ? "none" : isErr ? "#f3c9c3" : sel ? "#efe3c4" : tall ? "#cfc6b8" : "rgba(255,255,255,0.35)"}
            stroke={isErr ? ERR : sel ? ACCENT : upper ? SOFT : INK}
            strokeWidth={sel ? 2.6 : upper ? 0.9 : 1.2}
            strokeDasharray={upper ? "5 4" : isWarn && !isErr ? "2 2" : undefined}
            {...handlers}
          >
            <title>{`${t("{name} {n} cm", { name: t(MODULES[m.t]?.label), n: m.w })}${isErr ? ` – ${t("Kollision")}` : ""}`}</title>
          </polygon>
        );
      })}
      {/* Fix 2 (P3-3): Zu schmale Module (z. B. 30-cm-Passstück in der Gesamtansicht) bekommen
          eine unsichtbare Trefferfläche von mindestens 24 × 24 px (WCAG 2.5.8). Sie liegt über
          den Nachbarn, damit das kleine Modul greifbar bleibt. */}
      {onModuleDown && unitPerPx > 0 && mods.map((m) => {
        if (m.kind === "upper" || m.auto || !m.quad || m.quad.length !== 4) return null;
        const q = m.quad.map(([x, z]) => [x * S, z * S]);
        const min = 24 * unitPerPx;
        const e1 = [q[1][0] - q[0][0], q[1][1] - q[0][1]];
        const e2 = [q[3][0] - q[0][0], q[3][1] - q[0][1]];
        const l1 = Math.hypot(e1[0], e1[1]);
        const l2 = Math.hypot(e2[0], e2[1]);
        if (!l1 || !l2 || (l1 >= min && l2 >= min)) return null;
        const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
        const h1 = Math.max(l1, min) / 2;
        const h2 = Math.max(l2, min) / 2;
        const u1 = [e1[0] / l1, e1[1] / l1];
        const u2 = [e2[0] / l2, e2[1] / l2];
        const corner = (a, b) => `${(c[0] + a * h1 * u1[0] + b * h2 * u2[0]).toFixed(1)},${(c[1] + a * h1 * u1[1] + b * h2 * u2[1]).toFixed(1)}`;
        return (
          <polygon
            key={`hit-${m.id}`}
            data-hit={m.id}
            data-drag=""
            points={[corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].join(" ")}
            fill="transparent"
            onPointerDown={(e) => onModuleDown(e, m)}
            style={{ cursor: "grab", touchAction: "none" }}
          >
            <title>{t("{name} {n} cm", { name: t(MODULES[m.t]?.label), n: m.w })}</title>
          </polygon>
        );
      })}
      {kitchen.island && onIslandDown && (
        <polygon
          points={pts([
            [kitchen.island.x0, kitchen.island.z0 - 0.04],
            [kitchen.island.x0 + kitchen.island.len, kitchen.island.z0 - 0.04],
            [kitchen.island.x0 + kitchen.island.len, kitchen.island.z0],
            [kitchen.island.x0, kitchen.island.z0],
          ])}
          fill={ACCENT}
          opacity="0.55"
          onPointerDown={onIslandDown}
          data-island-handle=""
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <title>{t("Insel verschieben")}</title>
        </polygon>
      )}
      {/* Fix 2 (P3-2): Label-Hintergrund in der Modulfarbe unterbricht die gestrichelte
          Hängeschrank-Kontur, die sonst senkrecht durch „KF“/„US“ läuft. */}
      {labels && shownLabels.map((l) => {
        const m = mods.find((x) => x.id === l.id);
        if (!m) return null;
        const f = fs(15);
        const w = labelW(l.text, f);
        const h = f * 1.15;
        const bg = err.has(m.id) || m.over ? "#f3c9c3" : selected === m.id ? "#efe3c4" : m.kind === "tall" ? "#cfc6b8" : m.t === "spuele" ? "#fbfaf8" : "#eee9e1";
        return <rect key={`lb-${l.id}`} x={l.x * S - w / 2} y={l.z * S - h / 2} width={w} height={h} rx={f * 0.2} fill={bg} pointerEvents="none" />;
      })}
      {labels && shownLabels.map((l) => (
        <text key={l.id} x={l.x * S} y={l.z * S + fs(15) * 0.32} textAnchor="middle" fontSize={fs(15)} fill={INK} fontFamily={FONT} pointerEvents="none" style={halo}>
          {l.text}
        </text>
      ))}
      {tri && (
        <g pointerEvents="none">
          <polygon points={pts(tri.pts)} fill="rgba(122,95,23,0.08)" stroke={ACCENT} strokeWidth="1.4" strokeDasharray="7 5" />
          {tri.pts.map(([x, z], i) => <circle key={i} cx={x * S} cy={z * S} r="4" fill={ACCENT} />)}
        </g>
      )}
      {dims && <PlanDims plan={plan} kitchen={kitchen} k={textScale} />}
      {children}
    </svg>
  );
}

/** Maßketten außen an jeder Wand: Module, Öffnungen, Gesamtlänge; Insel innen. */
function PlanDims({ plan, kitchen, k = 1 }) {
  const out = [];
  for (const w of kitchen.walls) {
    if (!w.rendered && !(w.id === "a")) continue;
    const p0 = [w.p0[0] * S, w.p0[1] * S];
    const n = [-w.n[0], -w.n[1]];
    const len = w.len * S;
    let off = 18 * k;
    const run = (kitchen.runs[w.id] || []).filter((m) => m.x1 > m.x0);
    if (run.length) {
      const stops = [...new Set([0, ...run.flatMap((m) => [m.x0, m.x1]), len].map((x) => r1(x)))].sort((a, b) => a - b);
      out.push(<Chain key={`${w.id}-m`} keyPrefix={`${w.id}-m`} p0={p0} u={w.u} n={n} off={off} stops={stops} size={15 * k} />);
      off += 24 * k;
    }
    const ops = kitchen.openings.filter((o) => o.w === w.id && (o.k === "fenster" || o.k === "tuer" || o.k === "heizung"));
    if (ops.length) {
      const stops = [...new Set([0, ...ops.flatMap((o) => [o.x, o.x + o.b]), len].map((x) => r1(x)))].sort((a, b) => a - b);
      out.push(<Chain key={`${w.id}-o`} keyPrefix={`${w.id}-o`} p0={p0} u={w.u} n={n} off={off} stops={stops} color={SOFT} size={15 * k} />);
      off += 24 * k;
    }
    out.push(<Chain key={`${w.id}-t`} keyPrefix={`${w.id}-t`} p0={p0} u={w.u} n={n} off={off} stops={[0, r1(len)]} size={17 * k} color={INK} />);
  }
  if (kitchen.island) {
    const { x0, len, z0 } = kitchen.island;
    const back = z0 + Math.min(0.6, (plan.island.depth - plan.island.over) / 100) + plan.island.over / 100;
    out.push(<Chain key="i-l" keyPrefix="i-l" p0={[x0 * S, back * S]} u={[1, 0]} n={[0, 1]} off={16 * k} stops={[0, r1(len * S)]} size={15 * k} />);
    // Gang zwischen Zeile und Insel
    const gx = (x0 + len + 0.12) * S;
    out.push(<Chain key="i-g" keyPrefix="i-g" p0={[gx, 60]} u={[0, 1]} n={[1, 0]} off={0} stops={[0, r1(z0 * S - 60)]} color={SOFT} size={13 * k} />);
  }
  return <g pointerEvents="none">{out}</g>;
}

// ---- Wandansicht ---------------------------------------------------------

const FILL = {
  front: "#f2eee7",
  glassFront: "#dfe6e8",
  carcass: "#e6e0d6",
  worktop: "#c9bfae",
  plinth: "#3d3f42",
  steel: "#c8cacc",
  steelApp: "#c8cacc",
  steelDark: "#6d7073",
  blackGlass: "#2a2c2e",
  ovenGlass: "#4d5258",
  wineGlass: "#3c4347",
  led: "#f6e7b9",
  grip: "#8a8c8e",
  groove: "#9a9c9e",
  shadowGap: "#2b2b2b",
  gapShade: "#2b2b2b",
  sinkBasin: "#b9bcbf",
  sinkInner: "#a5a8ab",
  splashGlass: "#d8d2c8",
  error: "#f3c9c3",
  wood: "#b08b62",
};

const EV_PAD_L = 150; // P3-3: Platz für Höhenlabels (11 px) links neben der Höhenkette
const EV_PAD_R = 30;

/** Breite der Wandansicht in SVG-Einheiten (cm) – QM r5: gleicher Maßstab für Ansichten nebeneinander. */
export function elevationViewWidth(plan, kitchen, wall) {
  const w = kitchen.walls.find((x) => x.id === wall);
  const len = wall === "i" ? plan.island?.len || 0 : w ? w.len * S : 0;
  return len + EV_PAD_L + EV_PAD_R;
}

/** Ansicht einer Wand (von innen): Fronten, Geräte, Öffnungen, Maß- und Höhenketten. */
export function WallElevation({ plan, kitchen, wall, className = "", t = kpIdentity }) {
  const w = kitchen.walls.find((x) => x.id === wall);
  const isIsland = wall === "i";
  if (!w && !isIsland) return null;
  const len = isIsland ? plan.island.len : w.len * S;
  const H = plan.h;
  const d = kitchen.dims;
  const padL = EV_PAD_L;
  const padB = 70;
  const mirror = !isIsland && (kitchen.frames[wall]?.rs ?? 1) < 0; // so, wie man im Raum davorsteht
  const mx = (x0, wd = 0) => (mirror ? len - x0 - wd : x0);
  const parts = kitchen.parts
    .filter((p) => p.local?.wall === wall && !p.geom && p.mat !== "gapShade")
    .filter((p) => p.local.v1 > 0.2 || /-(wc|wcf|wcf2|bord|hood|hoodCanopy|hoodChimney|splash)/.test(p.id))
    .sort((p, q) => p.local.v1 - q.local.v1);
  const y = (v) => H - v; // cm, oben = 0
  const run = (kitchen.runs[wall] || []).filter((m) => m.x1 > m.x0);
  const ops = (kitchen.openings || []).filter((o) => o.w === wall);
  // Decke (mit Dachschräge) entlang der Wand
  let ceil = null;
  if (!isIsland && plan.room?.slope?.w) {
    const samples = 24;
    const line = [];
    for (let k = 0; k <= samples; k++) {
      const u = (w.len * k) / samples;
      const x = w.p0[0] + w.u[0] * u + w.n[0] * 0.01;
      const z = w.p0[1] + w.u[1] * u + w.n[1] * 0.01;
      line.push(`${mirror ? len - u * S : u * S},${y(ceilingAt(plan, x, z) * S)}`);
    }
    ceil = line.join(" ");
  }
  const heights = [
    ["Sockel", d.plinth * S],
    ["Arbeitshöhe", d.topY * S],
    ...(kitchen.mods.some((m) => m.wall === wall && m.kind === "upper") ? [["Hängeschrank", d.upBottom * S]] : []),
    ...(kitchen.mods.some((m) => m.wall === wall && (m.kind === "tall" || m.kind === "upper")) ? [["Oberkante", d.tallTop * S]] : []),
    ["Raum", H],
  ];
  const hs = [0, ...heights.map(([, v]) => r1(v))];
  const name = isIsland ? t(plan.shape === "halbinsel" ? "Halbinsel (Frontseite)" : "Insel (Frontseite)") : t("Wand {w}", { w: wall.toUpperCase() });
  return (
    <svg viewBox={`${-padL} -20 ${len + padL + EV_PAD_R} ${H + padB + 20}`} className={className} role="img" aria-label={t("Ansicht {name}: {n1} Module, Länge {n2} cm, Arbeitshöhe {n3} cm", { name, n1: run.length, n2: Math.round(len), n3: r1(d.topY * S) })}>
      <rect x={0} y={0} width={len} height={H} fill="#faf8f4" stroke={INK} strokeWidth="1.5" />
      {ceil && <polygon points={`0,0 ${len},0 ${ceil.split(" ").sort((a, b) => parseFloat(b) - parseFloat(a)).join(" ")}`} fill="#e6e1d8" stroke={SOFT} strokeWidth="1" />}
      {ops.map((o) => {
        const big = o.k === "fenster" || o.k === "tuer" || o.k === "heizung";
        if (big)
          return (
            <g key={`o${o.idx}`}>
              <rect x={mx(o.x, o.b)} y={y(o.y + o.h)} width={o.b} height={o.h} fill={o.k === "fenster" ? "#e3ebee" : o.k === "tuer" ? "#efe9df" : "#ece8e1"} stroke={SOFT} strokeWidth="1" strokeDasharray={o.k === "heizung" ? "3 3" : undefined} />
              <text x={mx(o.x, o.b) + o.b / 2} y={y(o.y + o.h / 2)} fontSize="12" textAnchor="middle" fill={SOFT} fontFamily={FONT}>{t(OPENINGS[o.k].label)}</text>
            </g>
          );
        return (
          <g key={`o${o.idx}`}>
            <circle cx={mx(o.x, o.b) + o.b / 2} cy={y(o.y + o.h / 2)} r="6" fill="#fff" stroke={ACCENT} strokeWidth="1.5" />
            <text x={mx(o.x, o.b) + o.b / 2} y={y(o.y + o.h / 2) - 10} fontSize="10" textAnchor="middle" fill={ACCENT} fontFamily={FONT}>{OPENINGS[o.k].short}</text>
          </g>
        );
      })}
      {parts.map((p) => {
        const wdt = (p.local.u1 - p.local.u0) * S;
        const u0 = mx(p.local.u0 * S, wdt);
        return <rect key={p.id} x={u0} y={y(p.local.y1 * S)} width={Math.max(0.3, wdt)} height={Math.max(0.3, (p.local.y1 - p.local.y0) * S)} fill={FILL[p.mat] || "#ddd"} stroke={p.mat === "error" ? ERR : "#8a8174"} strokeWidth={p.mat === "front" || p.mat === "error" ? 0.7 : 0.3} />;
      })}
      {/* QM r5: Eckbereich der Nachbarzeile (Eckschrank von der Seite, Platte) statt leerer Fläche unter der Rückwand */}
      {elevationCornerZones(parts, run).map((z) => {
        const x0 = mx(z.x0, z.w);
        const top = d.topY * S;
        const tt = d.topT * S;
        return (
          <g key={`corner${z.x0}`} data-kp-corner="">
            <rect x={x0} y={y(top - tt)} width={z.w} height={top - tt - d.plinth * S} fill={FILL.carcass} stroke={SOFT} strokeWidth="0.8" strokeDasharray="4 3" />
            <rect x={x0} y={y(top)} width={z.w} height={tt} fill={FILL.worktop} stroke="#8a8174" strokeWidth="0.3" />
            <rect x={x0 + 4} y={y(d.plinth * S)} width={Math.max(0, z.w - 4)} height={d.plinth * S} fill={FILL.plinth} opacity="0.55" />
            <text x={x0 + z.w / 2} y={y((top + d.plinth * S) / 2)} fontSize="11" textAnchor="middle" dominantBaseline="middle" fill={SOFT} fontFamily={FONT} transform={z.w < 75 ? `rotate(-90 ${x0 + z.w / 2} ${y((top + d.plinth * S) / 2)})` : undefined}>{t("Eckbereich")}</text>
          </g>
        );
      })}
      {run.map((m) => {
        const x0 = mx(m.x0, m.w);
        return (
          // QM r4: Halo in Frontfarbe – das Kürzel (z. B. „EK“ mittig auf zweitürigem Eckschrank) saß sonst auf der Fronttrennlinie
          <text key={`l${m.i}`} x={x0 + m.w / 2} y={y(d.plinth * S) - 8} fontSize="11" textAnchor="middle" fill={INK} fontFamily={FONT} stroke={FILL.front || "#f3efe8"} strokeWidth="4" strokeLinejoin="round" paintOrder="stroke">
            {MODULES[m.t].short}
          </text>
        );
      })}
      {/* Breitenkette unten, Gesamtlänge darunter */}
      {run.length > 0 && (
        <Chain keyPrefix="eb" p0={[0, H]} u={[1, 0]} n={[0, 1]} off={22} stops={[...new Set([0, ...run.flatMap((m) => [mx(m.x0, m.w), mx(m.x0, m.w) + m.w]), len].map(r1))].sort((a, b) => a - b)} size={12} />
      )}
      <Chain keyPrefix="et" p0={[0, H]} u={[1, 0]} n={[0, 1]} off={48} stops={[0, r1(len)]} size={13} color={INK} />
      {/* Höhenkette links */}
      <Chain keyPrefix="eh" p0={[0, H]} u={[0, -1]} n={[-1, 0]} off={26} stops={hs} size={11} />
      {heights.map(([lab, v]) => (
        <text key={lab} x={-padL + 2} y={y(v) + 5} fontSize="14" fill={SOFT} fontFamily={FONT}>{t(lab)}</text>
      ))}
    </svg>
  );
}

/** Liste der Ansichten (Wände mit Modulen oder Öffnungen, dazu die Insel). */
export function elevationWalls(plan, kitchen) {
  const ids = kitchen.walls.filter((w) => w.rendered && ((kitchen.runs[w.id] || []).length || kitchen.openings.some((o) => o.w === w.id))).map((w) => w.id);
  if (kitchen.island) ids.push("i");
  return ids;
}
