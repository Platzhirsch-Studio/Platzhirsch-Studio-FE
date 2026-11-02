// Bodensee-Licht (N4) – SVG-Sonnenbahn des Tages (auch Rückfall ohne WebGL).
// x = Uhrzeit 0–24 Uhr, y = Sonnenhöhe. Horizontlinie, Auf-/Untergang,
// Zeiten mit Sonne durchs Fenster (Messinglinie), aktueller Stand als Punkt.
// Serverfähig (keine Hooks), wird in der Seite und im Lichtblatt verwendet.
import { uhrzeit } from "@/lib/licht/sonne";

const W = 640;
const H = 220;
const PAD_X = 16;
const BASIS = 150; // y des Horizonts
const SKALA = 1.85; // px pro Grad (70° → 130 px)

// Auf 0,1 px gerundet: Server und Browser liefern sonst in der letzten
// Nachkommastelle verschiedene Werte (Hydration-Abweichung).
const r1 = (v) => Math.round(v * 10) / 10;
const x = (min) => r1(PAD_X + (min / 1440) * (W - 2 * PAD_X));
const y = (hoehe) => r1(BASIS - Math.max(-30, hoehe) * SKALA);

export default function SonnenBahn({ bahn, tag, aktuell, fensterZeiten, ortName, datumLabel, id = "sonnenbahn" }) {
  const ueber = bahn.map((p) => `${x(p.minuten).toFixed(1)},${y(Math.max(p.hoehe, 0)).toFixed(1)}`).join(" ");
  const linie = bahn.map((p, i) => `${i ? "L" : "M"}${x(p.minuten).toFixed(1)},${y(p.hoehe).toFixed(1)}`).join("");
  const label = [
    `Sonnenbahn am ${datumLabel} in ${ortName}:`,
    tag.aufgang != null ? `Aufgang ${uhrzeit(tag.aufgang)} Uhr,` : "",
    `höchster Stand ${Math.round(tag.hoeheMittag)}° um ${uhrzeit(tag.mittag)} Uhr,`,
    tag.untergang != null ? `Untergang ${uhrzeit(tag.untergang)} Uhr.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sonneOben = aktuell.hoehe > -0.833;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-titel`} className="block h-auto w-full" data-sonnenbahn="">
      <title id={`${id}-titel`}>{label}</title>
      {/* Fläche über dem Horizont */}
      <polygon points={`${x(0)},${BASIS} ${ueber} ${x(1440)},${BASIS}`} fill="var(--color-stone)" />
      {/* Stundenraster */}
      {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
        <g key={h}>
          <line x1={x(h * 60)} x2={x(h * 60)} y1={20} y2={BASIS + 6} stroke="var(--color-line)" strokeWidth="1" />
          <text x={x(h * 60)} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--color-ink-soft)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {h}
          </text>
        </g>
      ))}
      {/* Höhenmarken */}
      {[20, 40, 60].map((g) => (
        <g key={g}>
          <line x1={x(0)} x2={x(1440)} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeDasharray="2 4" />
          <text x={x(0) + 2} y={y(g) - 4} fontSize="12" fill="var(--color-ink-soft)">
            {g}°
          </text>
        </g>
      ))}
      {/* Horizont */}
      <line x1={x(0)} x2={x(1440)} y1={BASIS} y2={BASIS} stroke="var(--color-ink)" strokeWidth="1.5" />
      <text x={x(1440) - 2} y={BASIS - 6} textAnchor="end" fontSize="12" fill="var(--color-ink-soft)">
        Horizont
      </text>
      {/* Sonne durchs Fenster */}
      {fensterZeiten?.bereiche.map((b) => (
        <line key={b.von} x1={x(b.von)} x2={x(b.bis)} y1={BASIS + 10} y2={BASIS + 10} stroke="var(--color-brass-500)" strokeWidth="5" strokeLinecap="butt" data-fenster-sonne="" />
      ))}
      {/* Bahn */}
      <path d={linie} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      {/* Auf- und Untergang */}
      {[tag.aufgang, tag.untergang].map((m, i) =>
        m == null ? null : (
          <g key={i}>
            <circle cx={x(m)} cy={BASIS} r="4" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="1.5" />
            <text x={x(m) + (i ? 6 : -6)} y={BASIS + 26} textAnchor={i ? "start" : "end"} fontSize="13" fill="var(--color-ink)" style={{ fontVariantNumeric: "tabular-nums" }}>
              {i ? "↓" : "↑"} {uhrzeit(m)}
            </text>
          </g>
        ),
      )}
      {/* Aktueller Stand */}
      <line x1={x(aktuell.minuten)} x2={x(aktuell.minuten)} y1={20} y2={BASIS} stroke="var(--color-ink)" strokeOpacity="0.35" />
      <circle
        cx={x(aktuell.minuten)}
        cy={y(aktuell.hoehe)}
        r="9"
        fill={sonneOben ? "var(--color-brass-400)" : "var(--color-paper)"}
        stroke="var(--color-ink)"
        strokeWidth="2"
        data-sonne-punkt=""
      />
    </svg>
  );
}

/** Kleiner Kompass: Fensterrichtung (Halbkreis, aus dem Sonne kommen kann) und Sonne. */
export function Kompass({ fenster, sonne, groesse = 112 }) {
  const c = 50;
  const r = 36;
  const pt = (az, rr = r) => {
    const a = ((az - 90) * Math.PI) / 180;
    return [r1(c + rr * Math.cos(a)), r1(c + rr * Math.sin(a))];
  };
  const [ax, ay] = pt(fenster - 90);
  const [bx, by] = pt(fenster + 90);
  const [fx, fy] = pt(fenster, r + 2);
  const [sx, sy] = pt(sonne.azimut, Math.max(8, r * (1 - Math.max(0, sonne.hoehe) / 90)));
  const oben = sonne.hoehe > -0.833;
  return (
    <svg viewBox="0 0 100 100" width={groesse} height={groesse} aria-hidden="true" className="shrink-0">
      <path d={`M${ax},${ay} A${r},${r} 0 0 1 ${bx},${by} Z`} fill="var(--color-stone)" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-pebble)" />
      {["N", "O", "S", "W"].map((n, i) => {
        const [tx, ty] = pt(i * 90, r + 9);
        return (
          <text key={n} x={tx} y={ty + 3.5} textAnchor="middle" fontSize="10" fill="var(--color-ink-soft)">
            {n}
          </text>
        );
      })}
      <line x1={c} y1={c} x2={fx} y2={fy} stroke="var(--color-ink)" strokeWidth="2.5" />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="var(--color-ink)" strokeWidth="3" />
      {oben ? <line x1={c} y1={c} x2={sx} y2={sy} stroke="var(--color-brass-500)" strokeWidth="1" strokeDasharray="2 2" /> : null}
      <circle cx={sx} cy={sy} r="6" fill={oben ? "var(--color-brass-400)" : "var(--color-paper)"} stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}
