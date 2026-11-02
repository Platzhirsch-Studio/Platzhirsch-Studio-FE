// src/components/Ezarri/Rechner/PoolSkizze.js – Grundriss und Längsschnitt als SVG (Team C).
// Rein darstellend (keine Hooks): bekommt das Ergebnis von poolFlaechen().
// Farben nur über Token-Klassen (currentColor, fill-*/stroke-*), keine Hex-Werte.
import { useLocale } from "next-intl";
import { useToolCopy } from "@/components/Ezarri/Konfigurator/ToolCopy";
import { formatZahl } from "@/lib/ezarri/rechner/core";
import { RECHNER as RECHNER_DE } from "@/lib/ezarri/rechner/copy";
import { RECHNER as RECHNER_EN } from "@/lib/ezarri/rechner/copy.en";

const W = 320;
const H = 200;
const PAD = 34;

export default function PoolSkizze({ flaechen, className = "" }) {
  // Welle 2: Sprache aus next-intl (Hook, kein Zustand).
  const locale = useLocale();
  // FR/IT: Texte vom Server (ToolCopyProvider), sonst copy.js/copy.en.js
  const intl = useToolCopy();
  const RECHNER = intl?.RECHNER ?? (locale === "en" ? RECHNER_EN : RECHNER_DE);
  const ui = intl?.KONF?.UI;
  const fmt = (v) => `${formatZahl(v, 2, locale)} m`;
  const w = flaechen.werte;
  const form = w.form;
  // Grundriss-Maße (m)
  const L = form === "frei" ? Math.sqrt(w.flaecheFrei * 1.6) : w.l;
  const B = form === "frei" ? w.flaecheFrei / L : w.b;
  const scale = Math.min((W - 2 * PAD) / L, (H - 2 * PAD) / B);
  const pw = L * scale;
  const ph = B * scale;
  const x0 = (W - pw) / 2 + (w.treppe === "roemisch" ? 10 : 0);
  const y0 = (H - ph) / 2;
  const rinne = w.rinne !== "skimmer";

  let shape;
  if (form === "rechteck") shape = <rect x={x0} y={y0} width={pw} height={ph} />;
  else if (form === "l") {
    const ax = w.lAus * scale;
    const ay = w.bAus * scale;
    shape = <path d={`M${x0} ${y0} H${x0 + pw - ax} V${y0 + ay} H${x0 + pw} V${y0 + ph} H${x0} Z`} />;
  } else if (form === "rund") shape = <ellipse cx={x0 + pw / 2} cy={y0 + ph / 2} rx={pw / 2} ry={ph / 2} />;
  else {
    // Freie Form: weiche Kontur mit der Fläche als Größe (nur Symbol)
    const cx = x0 + pw / 2;
    const cy = y0 + ph / 2;
    shape = (
      <path
        d={`M${x0 + pw * 0.12} ${cy} C${x0} ${y0} ${cx - pw * 0.1} ${y0 - ph * 0.05} ${cx + pw * 0.05} ${y0 + ph * 0.12} S${x0 + pw} ${y0 - ph * 0.02} ${x0 + pw * 0.96} ${cy} S${cx + pw * 0.2} ${y0 + ph * 1.05} ${cx} ${y0 + ph * 0.9} S${x0 + pw * 0.05} ${y0 + ph * 1.05} ${x0 + pw * 0.12} ${cy} Z`}
      />
    );
  }

  // Treppe am flachen Ende (links)
  const stufen = [];
  if (w.treppe !== "keine" && form !== "frei") {
    const n = w.stufen;
    const a = w.auftritt * scale;
    const tb = Math.min(w.treppeBreite * scale, ph);
    if (w.treppe === "roemisch") {
      const r = tb / 2;
      for (let i = 0; i < n; i++) {
        const ri = Math.max(2, r - i * a);
        stufen.push(<path key={i} d={`M${x0} ${y0 + ph / 2 - ri} A${ri} ${ri} 0 0 0 ${x0} ${y0 + ph / 2 + ri}`} />);
      }
    } else {
      const yTop = w.treppe === "ecke" ? y0 : y0 + (ph - tb) / 2;
      const yy = w.treppe === "gerade" && Math.abs(w.treppeBreite - w.b) < 0.05 ? y0 : yTop;
      for (let i = 1; i <= n; i++) stufen.push(<rect key={i} x={x0} y={yy} width={Math.min(a * i, pw / 2)} height={tb} />);
    }
  }
  const bank = w.bankLaenge > 0 && form !== "frei" ? (
    <rect x={x0 + pw * 0.5 - (Math.min(w.bankLaenge, L * 0.6) * scale) / 2} y={y0} width={Math.min(w.bankLaenge, L * 0.6) * scale} height={Math.max(4, w.bankTiefe * scale)} />
  ) : null;

  // Längsschnitt
  const sx0 = 24;
  const sw = W - 48;
  const maxT = Math.max(w.tTief, 0.5);
  const sy = (t) => 22 + (t / maxT) * 70;

  return (
    <figure className={className}>
      <figcaption className="sr-only">
        {RECHNER.skizze.titel}: {RECHNER.skizze.grundriss} {ui ? ui.und : locale === "en" ? "and" : "und"} {RECHNER.skizze.schnitt}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full text-text" aria-hidden="true" focusable="false">
        {rinne && (
          <g className="fill-none stroke-current" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" transform={`translate(${x0 + pw / 2} ${y0 + ph / 2}) scale(${(pw + 12) / pw} ${(ph + 12) / ph}) translate(${-(x0 + pw / 2)} ${-(y0 + ph / 2)})`}>
            {shape}
          </g>
        )}
        <g className="fill-see/10 stroke-current" strokeWidth="1.5">{shape}</g>
        <g className="fill-surface stroke-current" strokeWidth="1">{stufen}</g>
        {bank && <g className="fill-surface stroke-current" strokeWidth="1">{bank}</g>}
        {form !== "frei" && (
          <g className="fill-current text-text-soft" fontSize="11" fontFamily="inherit">
            <text x={x0 + pw / 2} y={y0 - 10} textAnchor="middle">
              {fmt(w.l)}
            </text>
            <text x={x0 + pw + 8} y={y0 + ph / 2} dominantBaseline="middle">
              {fmt(w.b)}
            </text>
          </g>
        )}
        {form === "frei" && (
          <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" className="fill-current">
            {formatZahl(w.flaecheFrei, 2, locale)} m² · {ui ? ui.U : locale === "en" ? "P" : "U"} {fmt(w.umfangFrei)}
          </text>
        )}
      </svg>
      <svg viewBox={`0 0 ${W} 112`} className="mt-2 block h-auto w-full text-text" aria-hidden="true" focusable="false">
        <path d={`M${sx0} 22 V${sy(w.tFlach)} L${sx0 + sw * 0.35} ${sy(w.tFlach)} L${sx0 + sw * 0.7} ${sy(w.tTief)} L${sx0 + sw} ${sy(w.tTief)} V22`} className="fill-see/10 stroke-current" strokeWidth="1.5" />
        <line x1={sx0 - 6} x2={sx0 + sw + 6} y1="22" y2="22" className="stroke-current" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        <g className="fill-current text-text-soft" fontSize="11">
          <text x={sx0 + 6} y={sy(w.tFlach) - 6}>
            {RECHNER.skizze.flach} {fmt(w.tFlach)}
          </text>
          <text x={sx0 + sw - 6} y={sy(w.tTief) - 6} textAnchor="end">
            {RECHNER.skizze.tief} {fmt(w.tTief)}
          </text>
        </g>
      </svg>
    </figure>
  );
}
