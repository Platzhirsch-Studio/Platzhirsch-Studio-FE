"use client";

import { useEffect, useRef, useState } from "react";
import { MONATE, UMSATZ_JETZT, UMSATZ_VORJAHR } from "./daten";

// Zwei Reihen, eine Achse: laufendes Jahr (Messing, durchgezogen; Nov. = Prognose
// gestrichelt) gegen Vorjahr (Grau 1,5 px, 3/3 gestrichelt). Keine Legende –
// Direktbeschriftung am Linienende. Achsentitel „Tsd. €“, Y-Beschriftung bündig
// mit dem Inhaltsrand. Fläche 8 % → 0, bis zur Prognose, ab Okt. halbe Deckkraft.
const H = 236, L = 32, R = 48, T = 28, B = 28;
const MAXY = 300;

export default function UmsatzChart() {
  const [hover, setHover] = useState(null);
  // viewBox = echte Breite → Schrift bleibt 11 px auf jedem Gerät
  const [W, setW] = useState(640);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = MONATE.length;
  const x = (i) => L + (i / (n - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / MAXY) * (H - T - B);
  const pfad = (arr, von = 0, bis = arr.length) =>
    arr.slice(von, bis).map((v, j) => `${j ? "L" : "M"}${x(von + j).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const ist = UMSATZ_JETZT.length - 1; // letzter Wert = Prognose
  const flaeche = (von, bis) => `${pfad(UMSATZ_JETZT, von, bis + 1)} L${x(bis).toFixed(1)} ${y(0)} L${x(von).toFixed(1)} ${y(0)} Z`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const fmt = (v) => `${v.toLocaleString("de-DE")} Tsd. €`;
  const delta = (i) => ((UMSATZ_JETZT[i] / UMSATZ_VORJAHR[i] - 1) * 100).toFixed(1).replace(".", ",");

  return (
    <div className="pz-chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Umsatz je Monat in Tausend Euro, laufendes Jahr gegen Vorjahr" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="pz-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--acc)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text className="ax" x={0} y={10}>Tsd. €</text>
        {[0, 100, 200, 300].map((v) => (
          <g key={v}>
            <line className={v === 0 ? "base" : "grid"} x1={L} x2={W - R + 8} y1={y(v)} y2={y(v)} />
            <text className="ax" x={0} y={y(v) + 4}>{v}</text>
          </g>
        ))}
        {MONATE.map((m, i) => (
          <text key={m} className="ax" x={x(i)} y={H - 8} textAnchor="middle" style={hover === i ? { fill: "var(--text)" } : undefined}>{m}</text>
        ))}
        <path d={flaeche(0, ist - 1)} fill="url(#pz-grad)" />
        <path d={flaeche(ist - 1, ist)} fill="url(#pz-grad)" opacity="0.5" />
        <path className="l-vj" d={pfad(UMSATZ_VORJAHR)} />
        <path className="l-jetzt l-draw" d={pfad(UMSATZ_JETZT, 0, ist)} />
        <path className="l-jetzt" d={`M${x(ist - 1)} ${y(UMSATZ_JETZT[ist - 1])} L${x(ist)} ${y(UMSATZ_JETZT[ist])}`} strokeDasharray="2 4" />
        <circle className="mk" cx={x(ist)} cy={y(UMSATZ_JETZT[ist])} r="4" stroke="var(--acc)" />
        <text className="lbl" x={x(ist) + 10} y={y(UMSATZ_JETZT[ist]) + 4}>2026</text>
        <text className="lbl-vj" x={x(ist) + 10} y={y(UMSATZ_VORJAHR[ist]) + 12}>2025</text>
        {hover !== null && (
          <g>
            <line className="cross" x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} />
            <circle className="mk" cx={x(hover)} cy={y(UMSATZ_VORJAHR[hover])} r="4" stroke="var(--g9)" />
            <circle className="mk" cx={x(hover)} cy={y(UMSATZ_JETZT[hover])} r="4" stroke="var(--acc)" />
          </g>
        )}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" />
      </svg>
      {hover !== null && (
        <div className="pz-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{MONATE[hover]} {hover === 0 ? "2025" : "2026"}{hover === ist ? " · Prognose" : ""}</div>
          <div className="pz-tip-row"><span className="pz-dot" style={{ background: "var(--acc)" }} />Laufend<b>{fmt(UMSATZ_JETZT[hover])}</b></div>
          <div className="pz-tip-row"><span className="pz-dot" style={{ background: "var(--g8)" }} />Vorjahr<b>{fmt(UMSATZ_VORJAHR[hover])}</b></div>
          <div className="pz-tip-row t3">Veränderung<b style={{ color: "var(--text)" }}>{Number(delta(hover).replace(",", ".")) >= 0 ? "+" : ""}{delta(hover)} %</b></div>
        </div>
      )}
      <table className="sr">
        <caption>Umsatz je Monat in Tausend Euro</caption>
        <thead><tr><th>Monat</th><th>Laufend</th><th>Vorjahr</th></tr></thead>
        <tbody>{MONATE.map((m, i) => <tr key={m}><td>{m}</td><td>{UMSATZ_JETZT[i]}</td><td>{UMSATZ_VORJAHR[i]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
