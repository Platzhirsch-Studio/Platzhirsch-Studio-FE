// Sofaplaner – Silhouette von vorn (Release-Rat R2, neuland P1-5).
// Statt grauer Balken zeigt die Modellkarte ein Sofa in der Vorderansicht:
// Armlehnen, Rückenkissen, Sitzkissen und Sockel, maßstäblich aus Höhe und
// Tiefe des Typs (alle Karten im selben Maßstab, damit „niedrig“ und „hoch“
// vergleichbar bleiben). Eigene Zeichnung, kein Herstellerbild.
// R5-USP (gesamtwerk P2-1, bewusst geändert): keine Clipart-Wirkung mehr
// (flache braune Armlehnen, gefüllte Flächen). Jetzt im Linienstil der
// Piktogramme – 1 px Ink-Kontur – mit Stoffanmutung nur aus SVG: ein Stoffton
// für Korpus, Armlehnen und Kissen, je Kissen ein Licht oben und ein Schatten
// unten (halbtransparente Flächen, keine Verläufe mit IDs – mehrere
// Silhouetten auf einer Seite kollidieren so nie), Kederlinie als feine
// Steppnaht, Sockel eine Spur dunkler, weicher Kontaktschatten in zwei Lagen.
// Keine Herstellerdaten, keine Herstellerbilder, keine KI-Textur.
// Server- und clientfähig (keine Hooks).

const SEAT = 3; // Plätze in der Ansicht (Standard)
const INK = "var(--color-ink)";
const FABRIC = "var(--sp-thumb-cushion)";
const BODY = "var(--sp-thumb-fill)";
const LIGHT = "rgb(255 255 255 / 0.45)";
const SHADE = "rgb(48 40 34 / 0.12)";
const STITCH = "var(--sp-thumb-seam)";

/** One upholstered block: fabric, light on top, shade below, stitched piping, ink contour. */
function Pad({ x, y, w, h, r, piping = true }) {
  const inset = Math.min(2.2, w * 0.08);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={FABRIC} />
      <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h * 0.38} rx={Math.max(0, r - 0.5)} fill={LIGHT} />
      <rect x={x + 0.5} y={y + h * 0.68} width={w - 1} height={h * 0.32 - 0.5} rx={Math.max(0, r - 0.5)} fill={SHADE} />
      {piping && h > 6 && (
        <rect
          x={x + inset}
          y={y + inset}
          width={Math.max(0, w - 2 * inset)}
          height={Math.max(0, h - 2 * inset)}
          rx={Math.max(0, r - inset)}
          fill="none"
          stroke={STITCH}
          strokeWidth="0.6"
          strokeDasharray="1.4 1.6"
        />
      )}
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

/**
 * @param {{ height?: number|null, depth?: number|null, seat?: number|null, places?: number, title?: string, className?: string }} props
 *   height = Rückenhöhe, depth = Tiefe (steuert Sitzbreite und -kissen), seat = Sitzbreite je Platz
 */
export default function Silhouette({ height, depth, seat, places = SEAT, title, className }) {
  // QM r2: Plätze aus der Startform (silhouetteSeats), 1–4
  const N = Math.max(1, Math.min(4, Math.round(places) || SEAT));
  const H = Math.max(60, Math.min(95, height || 78));
  const D = Math.max(85, Math.min(130, depth || 105));
  const R = Math.max(80, Math.min(115, seat || Math.round(D * 0.9)));
  const A = 15; // Armlehne
  const W = N * R + 2 * A;
  const foot = 6;
  const seatTop = Math.round(H * 0.52) + (D > 115 ? -3 : 0);
  const armTop = Math.min(H - 6, seatTop + 20 + (H > 80 ? 6 : 0));
  const base = seatTop - 12; // Oberkante Sockel = Unterkante Sitzkissen
  const VW = 360,
    VH = 100;
  const k = VW / (Math.max(N, SEAT) * 115 + 2 * A + 10); // gemeinsamer Maßstab: breitester Typ füllt die Fläche
  const ox = (VW - W * k) / 2;
  const y = (cm) => VH - 4 - cm * k; // Boden 4 px über dem Rand
  const x = (cm) => ox + cm * k;
  const r = 5 * k;
  const backs = [];
  const seats = [];
  for (let i = 0; i < N; i++) {
    const cx = A + i * R + 1.2;
    backs.push(<Pad key={`b${i}`} x={x(cx)} y={y(H)} w={(R - 2.4) * k} h={(H - seatTop + 4) * k} r={r * 1.6} />);
    seats.push(<Pad key={`s${i}`} x={x(cx)} y={y(seatTop)} w={(R - 2.4) * k} h={12 * k} r={r} />);
  }
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className={className} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : "true"} focusable="false">
      {/* weicher Kontaktschatten: breit und hell, darunter schmal und dichter */}
      <ellipse cx={VW / 2} cy={VH - 4} rx={(W * k) / 2 + 10} ry="3.6" fill={INK} opacity="0.07" />
      <ellipse cx={VW / 2} cy={VH - 4} rx={(W * k) / 2 - 2} ry="1.6" fill={INK} opacity="0.14" />
      {/* Füße */}
      {[A * 0.5, W - A * 0.5].map((fx) => (
        <rect key={fx} x={x(fx) - 2} y={y(foot)} width="4" height={foot * k} rx="0.8" fill={INK} opacity="0.75" />
      ))}
      {/* Sockel / Korpus: Stoff eine Spur dunkler */}
      <rect x={x(0)} y={y(base)} width={W * k} height={(base - foot) * k} rx={r} fill={BODY} />
      <rect x={x(0)} y={y(base)} width={W * k} height={(base - foot) * k} rx={r} fill={SHADE} />
      <rect x={x(0)} y={y(base)} width={W * k} height={(base - foot) * k} rx={r} fill="none" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {backs}
      {seats}
      {/* Armlehnen im selben Stoff */}
      <Pad x={x(0)} y={y(armTop)} w={A * k} h={(armTop - foot) * k} r={r * 1.4} piping={false} />
      <Pad x={x(W - A)} y={y(armTop)} w={A * k} h={(armTop - foot) * k} r={r * 1.4} piping={false} />
    </svg>
  );
}
