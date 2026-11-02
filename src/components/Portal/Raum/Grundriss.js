// Grundriss als SVG: Raum-Rechteck, Wandnamen, Volumen (gedreht), Kommentar-
// Punkte. Dient als Übersicht neben der 3D-Ansicht und als Fallback, wenn der
// Splat unbrauchbar ist („nur Fotos“). Mit Titel/Beschreibung für Screenreader.
import { grundflaeche, STANDARD_WAENDE } from "@/lib/raumzwilling/platzierung";
import { meterText } from "@/lib/raumzwilling/massstab";
import { useId } from "react";

export default function Grundriss({ grundriss: g, volumen = [], kommentare = [], auswahl, titel = "Grundriss" }) {
  const uid = useId().replace(/:/g, "");
  if (!g) return null;
  const rand = 0.45;
  const breite = g.x1 - g.x0;
  const tiefe = g.z1 - g.z0;
  const vb = `${g.x0 - rand} ${g.z0 - rand} ${breite + 2 * rand} ${tiefe + 2 * rand}`;
  const w = { ...STANDARD_WAENDE, ...(g.waende || {}) };
  const kurz = (s) => s.replace(/(hinteren|vorderen|linken|rechten) Wand/, (m) => m.replace(/en Wand$/, "e Wand").replace(/^./, (c) => c.toUpperCase()));
  const pins = kommentare.filter((k) => k.punkt);
  return (
    <figure className="m-0">
      <svg viewBox={vb} className="h-auto w-full max-w-xl" role="img" aria-labelledby={`${uid}t ${uid}d`}>
        <title id={`${uid}t`}>{titel}</title>
        <desc id={`${uid}d`}>
          Raum {meterText(breite)} breit und {meterText(tiefe)} tief{g.hoehe ? `, ${meterText(g.hoehe)} hoch` : ""}. {volumen.length} geplante Stücke. Maße aus Video, Aufmaß vor Bestellung.
        </desc>
        <rect x={g.x0} y={g.z0} width={breite} height={tiefe} fill="#faf8f4" stroke="#30373e" strokeWidth="0.04" />
        {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].filter((m) => m < breite).map((m) => (
          <line key={`x${m}`} x1={g.x0 + m} x2={g.x0 + m} y1={g.z0} y2={g.z1} stroke="#30373e" strokeOpacity="0.06" strokeWidth="0.01" />
        ))}
        {volumen.map((v) => (
          <polygon
            key={v.id}
            points={grundflaeche(v).map(([x, z]) => `${x},${z}`).join(" ")}
            fill={v.id === auswahl ? "#9a7a2a" : "#d8d2c8"}
            fillOpacity={v.id === auswahl ? 0.55 : 0.85}
            stroke="#30373e"
            strokeWidth="0.02"
          />
        ))}
        {volumen.map((v) => (
          <text key={`t${v.id}`} x={v.x} y={v.z} fontSize="0.13" textAnchor="middle" dominantBaseline="middle" fill="#1f252b">
            {v.name.length > 18 ? `${v.name.slice(0, 17)}…` : v.name}
          </text>
        ))}
        {pins.map((k, i) => (
          <g key={k.id}>
            <circle cx={k.punkt[0]} cy={k.punkt[2]} r="0.11" fill={k.rolle === "team" ? "#3f3129" : "#30373e"} />
            <text x={k.punkt[0]} y={k.punkt[2]} fontSize="0.12" textAnchor="middle" dominantBaseline="central" fill="#fff">
              {i + 1}
            </text>
          </g>
        ))}
        <text x={(g.x0 + g.x1) / 2} y={g.z0 - 0.15} fontSize="0.15" textAnchor="middle" fill="#5c636a">
          {kurz(w.hinten)} · {meterText(breite)}
        </text>
        <text x={(g.x0 + g.x1) / 2} y={g.z1 + 0.28} fontSize="0.15" textAnchor="middle" fill="#5c636a">
          {kurz(w.vorne)}
        </text>
        <text x={g.x0 - 0.15} y={(g.z0 + g.z1) / 2} fontSize="0.15" textAnchor="middle" fill="#5c636a" transform={`rotate(-90 ${g.x0 - 0.15} ${(g.z0 + g.z1) / 2})`}>
          {kurz(w.links)} · {meterText(tiefe)}
        </text>
        <text x={g.x1 + 0.22} y={(g.z0 + g.z1) / 2} fontSize="0.15" textAnchor="middle" fill="#5c636a" transform={`rotate(90 ${g.x1 + 0.22} ${(g.z0 + g.z1) / 2})`}>
          {kurz(w.rechts)}
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-ink/70">Raster 50 cm · Maße aus Video, Aufmaß vor Bestellung</figcaption>
    </figure>
  );
}
