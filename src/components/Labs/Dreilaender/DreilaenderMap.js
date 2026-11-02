"use client";
// Interaktive SVG-Karte (kein Kartendienst → keine Einwilligung, keine Drittanfragen).
// Bedienung: Klick/Tippen auf einen Ort; Tastatur: nur der gewählte Ort ist im
// Tab-Ablauf (Roving Tabindex), Pfeiltasten wechseln den Ort, Enter/Leertaste wählt.
//
// Ebenen (unten → oben): Land, See, Rhein, Grenzen, Länder, Routen, Lochau,
// Orte (Trefferflächen + Punkte), Beschriftungen. Die Beschriftungen liegen in
// einer eigenen Ebene über allen Routen und Punkten und tragen einen Halo in
// Bone (paint-order: stroke) – keine Linie läuft mehr durch einen Namen.
//
// Trefferfläche: der Radius wird aus der tatsächlichen Darstellungsgröße
// berechnet (ResizeObserver), damit jeder Punkt auf jedem Gerät ≥ 44 px
// Durchmesser hat (bei 375 px Breite ≈ 48 px); der Kreis wird auf die
// Voronoi-Zelle des Orts beschnitten (geo.js → hitCell), damit Nachbarn sich den
// Platz teilen statt sich zu überdecken. Bregenz und Rheintal liegen
// mobil zu dicht an Lochau, Dornbirn zu dicht an Lindau (R4): dort trägt eine Beschriftung mit Führungslinie den
// Namen, und ihr Rechteck ist die Trefferfläche.
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./dreilaender.module.css";
import { COUNTRY_LABELS, HOME_XY, INSET, PLACES, SHAPES, VIEW, hitCell, routePath } from "./geo";
import { MAP_DE, localCountries } from "./i18n";

const COMPACT = "(max-width: 639px)";
const TARGET_PX = 48; // Ziel-Durchmesser (≥ 44 px plus Reserve für Rundung)
const BASE_R = 22; // Mindestradius in Karteneinheiten (Desktop)
const CALLOUT_H = 92; // Höhe der Callout-Trefferfläche in Karteneinheiten (≥ 44 px bei Skala 0,5)
// Rand oben/unten, damit Trefferflächen randnaher Orte (Ravensburg, Chur) nicht abgeschnitten werden.
const PAD = 24;
// Rand rechts: Kempten liegt nah am Kartenrand, seine Trefferfläche braucht Platz nach rechts.
const PAD_R = 32;
const BOX_W = VIEW.w + PAD_R;
const BOX = `0 ${-PAD} ${BOX_W} ${VIEW.h + 2 * PAD}`;

// Label-Positionen relativ zum Punkt. Bei "t"/"tl" steht die Fahrzeit unter
// dem Namen, beide über dem Punkt (mobil ohne Fahrzeit → Name rückt nach unten).
function labelPos(lp) {
  if (lp === "l") return { dx: -14, dy: 5, anchor: "end" };
  if (lp === "t") return { dx: 0, dy: -30, anchor: "middle", top: true };
  if (lp === "tl") return { dx: 4, dy: -30, anchor: "end", top: true };
  if (lp === "b") return { dx: 0, dy: 26, anchor: "middle" };
  return { dx: 14, dy: 5, anchor: "start" };
}

// Rechteck der Callout-Trefferfläche um den mobilen Namen.
function calloutBox(c) {
  const w = c.anchor === "middle" ? 116 : 124;
  const x = c.anchor === "middle" ? c.x - w / 2 : c.anchor === "end" ? c.x - w + 16 : c.x - 16;
  return { x, y: c.y - CALLOUT_H + 34, w, h: CALLOUT_H };
}

// Kleine Orte und Callout-Orte zuletzt zeichnen: ihre Trefferfläche liegt dann
// über den vergrößerten Trefferflächen der Nachbarn.
const late = (p) => p.minor || p.callout;
const DRAW_ORDER = [...PLACES.filter((p) => !late(p)), ...PLACES.filter(late)];

export default function DreilaenderMap({ selectedId, country, onSelect, copy = null }) {
  // Sprache der Seite: Texte, Länder- und Ortsnamen aus `copy` (src/lib/dreilaender/copy-intl.js).
  const T = copy?.map ? { ...MAP_DE, ...copy.map } : MAP_DE;
  const COUNTRIES = localCountries(copy);
  const ORDER = copy?.places ? DRAW_ORDER.map((p) => ({ ...p, ...copy.places[p.id] })) : DRAW_ORDER;
  const fromLochau = copy?.ui?.fromLochau || "ab Lochau";
  const refs = useRef({});
  const svgRef = useRef(null);
  const [hitR, setHitR] = useState(BASE_R);
  const [compact, setCompact] = useState(false);
  // Trefferflächen als Voronoi-beschnittene Kreise. Mobil zählen Callout-Orte
  // nicht als Nachbarn (ihre Fläche ist das Callout).
  const cells = useMemo(() => {
    const neighbours = PLACES.filter((p) => !(compact && p.callout)).map((p) => p.xy);
    return Object.fromEntries(PLACES.map((p) => [p.id, hitCell(p.xy, neighbours, hitR)]));
  }, [hitR, compact]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const mq = window.matchMedia(COMPACT);
    const measure = () => {
      const width = svg.getBoundingClientRect().width;
      if (width > 0) setHitR(Math.max(BASE_R, Math.ceil((TARGET_PX / 2) * (BOX_W / width))));
      setCompact(mq.matches);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    mq.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
    };
  }, []);

  function onKey(e, id) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id, "key");
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next;
    if (step) {
      const idx = PLACES.findIndex((p) => p.id === id);
      next = PLACES[(idx + step + PLACES.length) % PLACES.length];
    } else if (e.key === "Home") next = PLACES[0];
    else if (e.key === "End") next = PLACES[PLACES.length - 1];
    if (!next) return;
    e.preventDefault();
    onSelect(next.id, "key");
    refs.current[next.id]?.focus();
  }

  // Desktop: Klick auf eine Beschriftung (Label-Ebene) wählt den Ort – nur
  // Zeiger, die Tastatur bedient die Orts-Buttons darunter. Mobil ist die
  // Ebene per CSS durchlässig (pointer-events: none), dort trifft der Tipp
  // direkt den Button.
  function onLabelClick(e) {
    const id = e.target.closest?.("[data-place]")?.getAttribute("data-place");
    if (id) onSelect(id, "pointer");
  }

  return (
    <svg
      ref={svgRef}
      viewBox={BOX}
      className={s.map}
      role="group"
      aria-labelledby="dl-map-title dl-map-desc"
    >
      <title id="dl-map-title">{T.title}</title>
      <desc id="dl-map-desc">{T.desc}</desc>
      <rect y={-PAD} width={BOX_W} height={VIEW.h + 2 * PAD} className={s.land} />
      {SHAPES.lakes.map((d, i) => (
        <path key={`l${i}`} d={d} className={s.lake} />
      ))}
      {SHAPES.rivers.map((d, i) => (
        <path key={`r${i}`} d={d} className={s.river} />
      ))}
      {SHAPES.borders.map((d, i) => (
        <path key={`b${i}`} d={d} className={s.border} />
      ))}
      <text
        x={SHAPES.lakeLabel[0]}
        y={SHAPES.lakeLabel[1]}
        className={s.lakeLabel}
        textAnchor="middle"
        fontWeight="500"
        aria-hidden="true"
      >
        {T.lake}
      </text>
      {COUNTRY_LABELS.map((c) => (
        <text
          key={c.code}
          x={c.xy[0]}
          y={c.xy[1]}
          textAnchor="middle"
          fontWeight="600"
          aria-hidden="true"
          className={`${s.country} ${country === c.code ? s.countryActive : ""}`}
        >
          {T.countries?.[c.code] || c.text}
        </text>
      ))}

      <g aria-hidden="true">
        {PLACES.map((p) => (
          <path
            key={p.id}
            d={routePath(p.xy)}
            pathLength="1"
            className={`${s.route} ${p.id === selectedId ? s.routeActive : p.country === country ? s.routeCountry : ""}`}
          />
        ))}
      </g>

      <g aria-hidden="true" className={s.homeGroup}>
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="14" className={s.pulse} />
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="14" className={`${s.pulse} ${s.pulse2}`} />
        <circle cx={HOME_XY[0]} cy={HOME_XY[1]} r="8.5" className={s.home} />
      </g>

      {ORDER.map((p) => {
        const [x, y] = p.xy;
        const active = p.id === selectedId;
        const callout = compact && p.callout ? p.callout : null;
        const box = callout ? calloutBox(callout) : null;
        return (
          <g
            key={p.id}
            ref={(el) => {
              refs.current[p.id] = el;
            }}
            role="button"
            tabIndex={active ? 0 : -1}
            aria-pressed={active}
            aria-label={`${p.name}, ${COUNTRIES[p.country].name}, ${p.label} ${fromLochau}`}
            data-place-button={p.id}
            className={`${s.place} ${active ? s.placeActive : ""} ${p.minor ? s.minor : ""}`}
            onClick={() => onSelect(p.id, "pointer")}
            onKeyDown={(e) => onKey(e, p.id)}
          >
            {box && <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="12" className={s.hit} />}
            {/* Dicht liegende Orte: mobil kein Trefferkreis am Punkt (er würde Nachbarn verdecken), die Fläche ist das Callout. */}
            {!box && <path d={cells[p.id]} className={s.hit} />}
            <circle cx={x} cy={y} r="13" className={s.focusRing} />
            <circle cx={x} cy={y} r="6" className={s.dot} />
          </g>
        );
      })}

      <Inset bregenzActive={selectedId === "bregenz"} caption={T.inset} />

      {/* Beschriftungs-Ebene: über allen Routen und Punkten. */}
      <g aria-hidden="true" className={s.labels} onClick={onLabelClick}>
        <text x={HOME_XY[0] + 12} y={HOME_XY[1] + 9} fontWeight="600" className={s.homeLabel}>
          Lochau
        </text>
        {ORDER.map((p) => {
          const [x, y] = p.xy;
          const { dx, dy, anchor, top } = labelPos(p.lp);
          const active = p.id === selectedId;
          const c = p.callout;
          return (
            <g key={p.id} data-place={p.id} className={`${s.labelGroup} ${active ? s.labelActive : ""} ${p.minor ? s.minor : ""}`}>
              <text
                x={x + dx}
                y={y + dy}
                textAnchor={anchor}
                fontWeight="600"
                className={`${s.label} ${top ? s.labelTop : ""} ${c ? s.desktopOnly : ""}`}
              >
                {p.short || p.name}
              </text>
              <text x={x + dx} y={y + dy + 17} textAnchor={anchor} fontWeight="600" className={`${s.time} ${c ? s.desktopOnly : ""}`}>
                {p.label}
              </text>
              {c && (
                <>
                  <line
                    x1={x}
                    y1={y}
                    x2={c.anchor === "middle" ? c.x + 20 : c.x - 6}
                    y2={c.anchor === "middle" ? c.y - 22 : c.y - 7}
                    className={`${s.leader} ${s.mobileOnly}`}
                  />
                  <text x={c.x} y={c.y} textAnchor={c.anchor} fontWeight="600" className={`${s.label} ${s.mobileOnly}`}>
                    {p.short || p.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// Lupe Lochau/Bregenz (R5, QM R4 P3-4): Auf der Karte liegen beide Punkte fast
// übereinander. Die Lupe im freien Feld rechts unten zeigt denselben Ausschnitt
// 5-fach vergrößert (Lagen aus geo.js → INSET, keine neuen Geodaten). Rein
// dekorativ: aria-hidden, für Zeiger durchlässig; bedient wird Bregenz weiter
// über Punkt bzw. mobil über das Callout, der Screenreader über die Orts-Buttons.
function Inset({ bregenzActive, caption = MAP_DE.inset }) {
  const { cx, cy, r, transform, home, bregenz } = INSET;
  return (
    <g aria-hidden="true" className={s.inset} data-inset="lochau-bregenz">
      <defs>
        <clipPath id="dl-inset-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} className={s.insetBg} />
      <g clipPath="url(#dl-inset-clip)">
        <g transform={transform}>
          {SHAPES.lakes.map((d, i) => (
            <path key={i} d={d} className={s.lake} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </g>
      <circle cx={cx} cy={cy} r={r} className={s.insetRim} />
      <circle cx={home[0]} cy={home[1]} r="7" className={s.home} />
      <circle cx={bregenz[0]} cy={bregenz[1]} r="6" className={`${s.dot} ${bregenzActive ? s.insetActive : ""}`} />
      <text x={home[0] - 13} y={home[1] + 6} textAnchor="end" fontWeight="600" className={s.homeLabel}>
        Lochau
      </text>
      <text x={bregenz[0] - 12} y={bregenz[1] + 6} textAnchor="end" fontWeight="600" className={s.label}>
        Bregenz
      </text>
      <text x={cx} y={cy + r + 20} textAnchor="middle" fontWeight="600" className={s.insetCaption}>
        {caption}
      </text>
    </g>
  );
}
