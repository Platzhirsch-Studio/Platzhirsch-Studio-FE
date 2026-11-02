"use client";
import { useEffect, useRef, useState } from "react";
import { analyzeJoins, snapDock, topology } from "../../../lib/sofaplaner/geometry.js";
import { KINDS } from "../../../lib/sofaplaner/normalize.js";
import { tone } from "../../../lib/sofaplaner/materials.js";
import { WALKWAY_MIN, bounds, clampToRoom, facing, footprint, isLightColor, luminance, shortName, snap } from "./model";
import { Glyph } from "./Glyph";
import s from "./sofaplaner.module.css";
import { useT } from "./useT";
import { useTextScale } from "../textScale";

const INK = "#30373e"; // label ink on light fabric (= --color-ink)
const HANDLES = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
const textW = (str, fs) => String(str).length * fs * 0.6;

export function tag(el) {
  if (!el) return "?";
  const one = KINDS[el.kind]?.one || "Element";
  if (el.role === "end") return `${one === "Endelement" ? "Ende" : one} ${el.side === "SX" ? "L" : "R"}`;
  return one === "Mittelelement" ? "Mitte" : one;
}

function Dim({ x1, y1, x2, y2, label, tone: t = "muted", fs, scale, ticks = false, hideLabel = false }) {
  const mx = (x1 + x2) / 2,
    my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const pw = textW(label, fs) + fs * 0.9;
  const ph = fs * 1.45;
  const vertical = x1 === x2;
  const fits = !hideLabel && len >= (vertical ? ph : pw) + 6 / scale;
  const tk = 8;
  return (
    <g className={s[`dim_${t}`]}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={ticks ? undefined : "5 4"} />
      {ticks && (
        <>
          <line x1={vertical ? x1 - tk : x1} y1={vertical ? y1 : y1 - tk} x2={vertical ? x1 + tk : x1} y2={vertical ? y1 : y1 + tk} />
          <line x1={vertical ? x2 - tk : x2} y1={vertical ? y2 : y2 - tk} x2={vertical ? x2 + tk : x2} y2={vertical ? y2 : y2 + tk} />
        </>
      )}
      {fits && (
        <>
          <rect x={mx - pw / 2} y={my - ph / 2} width={pw} height={ph} className={s.dimPill} />
          <text x={mx} y={my + fs * 0.36} textAnchor="middle" className={s.dimText} style={{ fontSize: fs }}>
            {label}
          </text>
        </>
      )}
    </g>
  );
}

function Opening({ o, room }) {
  const len = o.width;
  let x1, y1, x2, y2;
  if (o.wall === "top") [x1, y1, x2, y2] = [o.offset, 0, o.offset + len, 0];
  else if (o.wall === "bottom") [x1, y1, x2, y2] = [o.offset, room.d, o.offset + len, room.d];
  else if (o.wall === "left") [x1, y1, x2, y2] = [0, o.offset, 0, o.offset + len];
  else [x1, y1, x2, y2] = [room.w, o.offset, room.w, o.offset + len];
  if (o.type === "window") {
    return (
      <g aria-hidden="true">
        <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.windowGap} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.windowPane} />
      </g>
    );
  }
  const inward = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[o.wall];
  const ex = x1 + inward[0] * len,
    ey = y1 + inward[1] * len;
  const sweep = o.wall === "top" || o.wall === "right" ? 0 : 1;
  return (
    <g aria-hidden="true">
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.windowGap} />
      <line x1={x1} y1={y1} x2={ex} y2={ey} className={s.doorLeaf} />
      <path d={`M ${ex} ${ey} A ${len} ${len} 0 0 ${sweep} ${x2} ${y2}`} className={s.doorArc} />
    </g>
  );
}

function freeRay(sel, r, items, room, side) {
  const others = items.filter((i) => i.id !== sel.id).map(footprint);
  const cx = r.x + r.w / 2,
    cy = r.y + r.h / 2;
  const crossesY = (o) => o.y < cy - 0.5 && o.y + o.h > cy + 0.5;
  const crossesX = (o) => o.x < cx - 0.5 && o.x + o.w > cx + 0.5;
  if (side === "right") {
    const start = r.x + r.w;
    return [start, Math.min(room.w, ...others.filter((o) => crossesY(o) && o.x >= start - 0.5).map((o) => o.x))];
  }
  if (side === "left") {
    const start = r.x;
    return [Math.max(0, ...others.filter((o) => crossesY(o) && o.x + o.w <= start + 0.5).map((o) => o.x + o.w)), start];
  }
  if (side === "bottom") {
    const start = r.y + r.h;
    return [start, Math.min(room.d, ...others.filter((o) => crossesX(o) && o.y >= start - 0.5).map((o) => o.y))];
  }
  const start = r.y;
  return [Math.max(0, ...others.filter((o) => crossesX(o) && o.y + o.h <= start + 0.5).map((o) => o.y + o.h)), start];
}

/**
 * Kettenmaß (3D-Team 31.10.): joints of the seating modules along one axis,
 * framed by the overall extent. [] when there is nothing to chain (one module).
 * Loose pieces and tables do not split the chain.
 */
function chainEdges(items, lookup, all, axis) {
  const edges = [axis === "x" ? all.x : all.y, axis === "x" ? all.x + all.w : all.y + all.h];
  for (const it of items) {
    const el = lookup(it.code);
    if (!el || el.role === "loose" || el.role === "acc" || el.kind === "tisch") continue;
    const r = footprint(it);
    edges.push(axis === "x" ? r.x : r.y, axis === "x" ? r.x + r.w : r.y + r.h);
  }
  edges.sort((a, b) => a - b);
  const out = [];
  for (const e of edges) if (!out.length || e - out[out.length - 1] > 1) out.push(e);
  return out.length > 2 ? out : [];
}

export default function PlanSvg({ plan, lookup, selectedId, flagged, onSelect, onChange, onBeginChange, onDragEnd, onDragCancel, onDropCode, onKey, onHint, readOnly = false }) {
  const T = useT();
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [box, setBox] = useState(null);
  const [dragging, setDragging] = useState(null);
  const { room } = plan;
  // QM r5 (WCAG 1.4.4): Maße und Kürzel wachsen mit der Textgröße; im kleinen angehefteten
  // Handy-Plan höchstens 1,5×, sonst bliebe vom Raum nichts übrig.
  const textK = useTextScale();

  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // QM Restliste P3-4: the compact sticky plan on phones has a fixed box
      // (CSS sets --sp-fill: 1) – the drawing then fills it instead of
      // shrinking the room inside a letterboxed viewBox.
      const fill = getComputedStyle(el).getPropertyValue("--sp-fill").trim() === "1";
      setBox((b) => (b && Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 && b.fill === fill ? b : { w: width, h: height, fill }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const approx = (pad) => (box ? Math.min(box.w / (room.w + pad * 2), box.h / (room.d + pad * 2)) : 760 / (room.w + pad * 2));
  const fillBox = !!(box?.fill && box.w > 120 && box.h > 100);
  const k = fillBox ? Math.min(1.5, textK) : Math.min(2, textK);
  let roomFs, totalFs, PAD, scale, dimFs, viewBox;
  if (fillBox) {
    // margins in screen px (labels above, caption below, depth label left,
    // T dimension right); labels 11.5 px on screen
    const padT = 20 * k,
      padB = 26 * k,
      padX = 30 * k;
    scale = Math.max(0.02, Math.min((box.w - 2 * padX) / room.w, (box.h - padT - padB) / room.d));
    roomFs = (11.5 * k) / scale;
    totalFs = (11.5 * k) / scale;
    dimFs = (11 * k) / scale;
    PAD = padB / scale;
    const vbW = box.w / scale;
    const vbH = box.h / scale;
    const x0 = room.w / 2 - vbW / 2;
    const y0 = -padT / scale - (vbH - room.d - (padT + padB) / scale) / 2;
    viewBox = `${x0} ${y0} ${vbW} ${vbH}`;
  } else {
    const scale0 = approx(60 * k);
    roomFs = Math.max(15, (13 * k) / scale0);
    totalFs = Math.max(15, (13 * k) / scale0);
    PAD = Math.max(60, totalFs * 3.2);
    scale = approx(PAD);
    dimFs = Math.max(14, (12.5 * k) / scale);
    viewBox = `${-PAD} ${-PAD} ${room.w + PAD * 2} ${room.d + PAD * 2}`;
  }

  const toRoom = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  };

  const onPointerDown = (e, item) => {
    if (readOnly || (e.button !== undefined && e.button !== 0)) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer – dragging still works via the svg */
    }
    const p = toRoom(e.clientX, e.clientY);
    drag.current = { id: item.id, dx: p.x - item.x, dy: p.y - item.y, from: { x: item.x, y: item.y }, moved: false };
    onBeginChange?.();
    onSelect(item.id);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const p = toRoom(e.clientX, e.clientY);
    const it = plan.items.find((i) => i.id === d.id);
    if (!it) return;
    const raw = clampToRoom({ ...it, x: snap(p.x - d.dx, plan.grid), y: snap(p.y - d.dy, plan.grid) }, room);
    // magnet: snap to a free joining face within ~30 cm (or 24 px on screen)
    // 3D-Team 31.10.: a docking place behind a wall is no docking place –
    // updateItem would clamp it back into the room and push the element into
    // its neighbour (overlap). Then the element just follows the pointer.
    const found = snapDock(plan.items, lookup, it, { x: p.x - d.dx, y: p.y - d.dy }, Math.max(30, 24 / scale));
    const fr = found && footprint({ ...it, x: found.x, y: found.y });
    const dock = fr && fr.x >= -0.5 && fr.y >= -0.5 && fr.x + fr.w <= room.w + 0.5 && fr.y + fr.h <= room.d + 0.5 ? found : null;
    let next = raw;
    if (dock && !dock.blocked) next = { ...it, x: dock.x, y: dock.y };
    onHint?.(dock?.blocked ? dock.issue.text : null);
    setDragging(dock ? { target: dock.target, blocked: dock.blocked } : { target: null });
    if (next.x !== it.x || next.y !== it.y) {
      d.moved = true;
      onChange(d.id, { x: next.x, y: next.y });
    }
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    if (d?.moved) onDragEnd?.(d.id, d.from);
  };
  // The browser took over the gesture (scroll, system gesture, lost capture):
  // the element goes back to where it was, nothing half-moved stays behind.
  const cancelDrag = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    onHint?.(null);
    if (d?.moved) onDragCancel?.(d.id, d.from);
  };

  const sel = plan.items.find((i) => i.id === selectedId);
  const selRect = sel ? footprint(sel) : null;
  const all = bounds(plan.items);
  const { free } = analyzeJoins(plan.items, lookup);

  let dims = null;
  if (selRect && !readOnly) {
    const [fx, fy] = facing(sel.rot);
    const isFront = (side) => (side === "bottom" && fy === 1) || (side === "top" && fy === -1) || (side === "right" && fx === 1) || (side === "left" && fx === -1);
    const cx = selRect.x + selRect.w / 2,
      cy = selRect.y + selRect.h / 2;
    const seg = {};
    for (const side of ["left", "right", "top", "bottom"]) seg[side] = freeRay(sel, selRect, plan.items, room, side);
    const gap = (side) => seg[side][1] - seg[side][0];
    const loose = lookup(sel.code)?.role === "loose";
    const t = (side) => (!loose && isFront(side) && gap(side) < WALKWAY_MIN ? "warn" : "muted");
    const props = { fs: dimFs, scale };
    dims = (
      <g aria-hidden="true">
        {["left", "right"].map((side) =>
          gap(side) > 1 ? <Dim key={side} x1={seg[side][0]} y1={cy} x2={seg[side][1]} y2={cy} label={`${Math.round(gap(side))}`} tone={t(side)} {...props} /> : null
        )}
        {["top", "bottom"].map((side) =>
          gap(side) > 1 ? <Dim key={side} x1={cx} y1={seg[side][0]} x2={cx} y2={seg[side][1]} label={`${Math.round(gap(side))}`} tone={t(side)} {...props} /> : null
        )}
      </g>
    );
  }

  // compact plan with a selection: the gap dimensions of the selected element
  // need the room – the totals stay in the caption "Sofa gesamt B × T".
  const quietTotals = fillBox && !!dims;

  const col = tone(plan.look?.material, plan.look?.tone);
  const fill = col.hex;
  const dark = shade(col.hex, -38);
  const labelColor = isLightColor(col.hex) ? INK : "#faf8f4";
  const veryLight = luminance(col.hex) > 0.6;
  const showFaces = !readOnly && (dragging || sel);

  // Overall width: dimension line below the sofa. QM R3 P3-G: when it lies
  // outside the room (sofa on the bottom wall) its pill can run into the
  // caption "Sofa gesamt B × T cm", which names the same width – then only
  // the line with ticks is drawn and the caption carries the number.
  // Kettenmaß: the module chain sits in the first row, the overall dimension
  // one row further out – only where both rows fit before the caption/edge.
  const step = Math.max(26, dimFs * 1.6);
  const xChain = all && !quietTotals ? chainEdges(plan.items, lookup, all, "x") : [];
  const yChain = all && !quietTotals ? chainEdges(plan.items, lookup, all, "y") : [];
  const wChainOn = xChain.length > 0 && all.y + all.h + step * 2 <= room.d + PAD * 0.45;
  const dChainOn = yChain.length > 0 && all.x + all.w + step * 2 <= room.w + PAD * 0.45;
  const wDimY = all ? Math.min(room.d + PAD * 0.45, all.y + all.h + step * (wChainOn ? 2 : 1)) : 0;
  const dDimX = all ? Math.min(room.w + PAD * 0.45, all.x + all.w + step * (dChainOn ? 2 : 1)) : 0;
  const captionY = room.d + PAD * 0.78;
  const caption = all ? T("Sofa gesamt {w} × {d} cm", { w: Math.round(all.w), d: Math.round(all.h) }) : "";
  const capHalf = textW(caption, totalFs) / 2;
  const pillHalf = (textW(`B ${all ? Math.round(all.w) : 0}`, dimFs) + dimFs * 0.9) / 2;
  const wPillHitsCaption =
    !!all &&
    wDimY + dimFs * 0.725 + 4 / scale > captionY - totalFs * 0.8 &&
    Math.abs(all.x + all.w / 2 - room.w / 2) < capHalf + pillHalf;

  return (
    <svg
      ref={svgRef}
      className={`${s.svg} ${veryLight ? s.svgLightFabric : ""}`}
      viewBox={viewBox}
      role="group"
      aria-label={`${T("Grundriss")} ${room.w} × ${room.d} cm${all ? `, Sofa ${Math.round(all.w)} × ${Math.round(all.h)} cm` : ""}. ${T("Elemente mit Tab auswählen, Pfeiltasten verschieben, R dreht, Entf löscht.")}`}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      // QM R1 P1-1: Chrome ignores touch-action on SVG children, so the whole
      // drawing takes the touch while editing (page scrolls outside the plan).
      style={{ touchAction: readOnly ? "pan-x pan-y pinch-zoom" : "none" }}
      data-editable={readOnly ? undefined : ""}
      onPointerDown={() => !readOnly && onSelect(null)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/x-sofaelement")) e.preventDefault();
      }}
      onDrop={(e) => {
        const code = e.dataTransfer.getData("text/x-sofaelement");
        if (!code || !lookup(code)) return;
        e.preventDefault();
        onDropCode?.(code, toRoom(e.clientX, e.clientY));
      }}
    >
      <defs>
        <pattern id="sp-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" className={s.gridLine} />
        </pattern>
      </defs>
      <rect x="0" y="0" width={room.w} height={room.d} className={s.floor} />
      <rect x="0" y="0" width={room.w} height={room.d} fill="url(#sp-grid)" />
      <rect x="0" y="0" width={room.w} height={room.d} className={s.wall} />
      {plan.openings.map((o) => (
        <Opening key={o.id} o={o} room={room} />
      ))}
      <text x={room.w / 2} y={-roomFs * 0.75} textAnchor="middle" className={s.roomDim} style={{ fontSize: roomFs }}>
        {T("Raum")} {room.w} cm
      </text>
      <text x={-roomFs * 0.75} y={room.d / 2} textAnchor="middle" className={s.roomDim} style={{ fontSize: roomFs }} transform={`rotate(-90 ${-roomFs * 0.75} ${room.d / 2})`}>
        {room.d} cm
      </text>

      {plan.items.map((it) => {
        const el = lookup(it.code);
        const r = footprint(it);
        const selected = it.id === selectedId;
        const bad = flagged?.get(it.id);
        const topo = topology(el);
        const short = T.dyn(tag(el));
        const want = Math.max(16, (12 * k) / scale);
        const fit = (Math.min(r.w, r.h + 40) * 0.8) / (short.length * 0.62);
        // QM R3 P3-G: on a small (phone) plan a slim upright element gets its
        // label along the long side instead of shrinking it to 9–10 px.
        const fitUp = (Math.min(r.h, r.w + 40) * 0.8) / (short.length * 0.62);
        const upright = fit < want && fitUp > fit * 1.15 && r.h > r.w;
        const fs = Math.min(want, upright ? fitUp : fit);
        // below ~9 px on screen a label is not readable any more (small sticky
        // plan on phones): it is left out, the selection bar and the
        // accessible name carry the element name instead.
        const legible = !box || fs * scale >= 9;
        const lw = textW(short, fs) + fs * 0.8;
        const lh = fs * 1.4;
        const target = dragging?.target === it.id;
        const missing = el?.missing?.length ? `, ${T("Maß im Showroom bestätigen")}` : ""; // FR/IT/EN: übersetzt (vorher fest deutsch)
        return (
          <g
            key={it.id}
            data-id={it.id}
            className={`${s.module} ${selected ? s.moduleSel : ""} ${bad ? s[`flag_${bad}`] : ""} ${sel && !selected ? s.moduleDim : ""} ${target ? (dragging.blocked ? s.dockBlocked : s.dockTarget) : ""}`}
            transform={`translate(${it.x} ${it.y})`}
            tabIndex={readOnly ? -1 : 0}
            role={readOnly ? undefined : "button"}
            aria-pressed={readOnly ? undefined : selected}
            aria-label={readOnly ? undefined : `${T.dyn(shortName(el))}, ${T.cm(it.w)} × ${T.cm(it.d)} cm, ${T("gedreht")} ${it.rot}°${T.dyn(missing)}${bad === "error" ? `, ${T("Konflikt")}` : bad === "warn" ? `, ${T("bitte prüfen")}` : ""}`}
            onPointerDown={(e) => onPointerDown(e, it)}
            onFocus={() => !readOnly && onSelect(it.id)}
            onKeyDown={(e) => onKey?.(e, it)}
          >
            {selected && <rect x={-r.w / 2 - 6} y={-r.h / 2 - 6} width={r.w + 12} height={r.h + 12} className={s.selHalo} />}
            <g transform={`rotate(${it.rot})`}>
              <Glyph w={it.w} d={it.d} backs={topo.backs} closed={topo.closed} kind={el?.kind} shape={el?.shape} fill={fill} dark={dark} />
              {el?.missing?.some((k) => k === "w" || k === "d" || k === "h") ? <rect x={-it.w / 2 + 3} y={-it.d / 2 + 3} width={it.w - 6} height={it.d - 6} className={s.missingHatch} /> : null}
            </g>
            <rect x={-r.w / 2} y={-r.h / 2} width={r.w} height={r.h} className={s.moduleOutline} />
            {selected &&
              HANDLES.map(([sx, sy]) => {
                const hs = Math.max(9, 7 / scale);
                return <rect key={`${sx}${sy}`} x={(sx * r.w) / 2 - hs / 2} y={(sy * r.h) / 2 - hs / 2} width={hs} height={hs} className={s.selHandle} />;
              })}
            {legible && (
              <g className={s.moduleLabelWrap} transform={upright ? "rotate(-90)" : undefined}>
                <rect x={-lw / 2} y={-lh / 2} width={lw} height={lh} fill={fill} />
                <text y={fs * 0.36} textAnchor="middle" className={s.moduleLabel} style={{ fontSize: fs, fill: labelColor }}>
                  {short}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {showFaces &&
        free.map((f) => {
          const { p0, p1, n } = f.face;
          const off = 4;
          return (
            <line
              key={`${f.id}:${f.side}`}
              x1={p0[0] + n[0] * off}
              y1={p0[1] + n[1] * off}
              x2={p1[0] + n[0] * off}
              y2={p1[1] + n[1] * off}
              className={s.freeFace}
              aria-hidden="true"
            />
          );
        })}

      {dims}

      {all && (
        <g aria-hidden="true">
          <Dim x1={all.x} y1={wDimY} x2={all.x + all.w} y2={wDimY} label={`${T("B")} ${Math.round(all.w)}`} tone="total" fs={dimFs} scale={scale} ticks hideLabel={wPillHitsCaption || quietTotals} />
          <Dim x1={dDimX} y1={all.y} x2={dDimX} y2={all.y + all.h} label={`${T("T")} ${Math.round(all.h)}`} tone="total" fs={dimFs} scale={scale} ticks hideLabel={quietTotals} />
          {wChainOn &&
            xChain.slice(1).map((e, i) => (
              <Dim key={`cx${i}`} x1={xChain[i]} y1={all.y + all.h + step} x2={e} y2={all.y + all.h + step} label={`${Math.round(e - xChain[i])}`} fs={dimFs} scale={scale} ticks />
            ))}
          {dChainOn &&
            yChain.slice(1).map((e, i) => (
              <Dim key={`cy${i}`} x1={all.x + all.w + step} y1={yChain[i]} x2={all.x + all.w + step} y2={e} label={`${Math.round(e - yChain[i])}`} fs={dimFs} scale={scale} ticks />
            ))}
          <text x={room.w / 2} y={room.d + PAD * 0.78} textAnchor="middle" className={s.totalDim} style={{ fontSize: totalFs }}>
            {caption}
          </text>
        </g>
      )}
    </svg>
  );
}
