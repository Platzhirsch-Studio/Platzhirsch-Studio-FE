// Kachelgrafik für Kollektionen ohne Herstellerbild (Custom Mix): ein Mosaikfeld aus
// den gemessenen Tönen einer echten Ezarri-Mischung (rechner/tones.json), keine
// Fotomontage. Deterministisch (fester Seed) → Server und Client gleich, kein CLS.
// Server-Komponente, rein dekorativ (aria-hidden): Name und Text stehen in der Karte.
import cx from "@/components/ui/cx";
import { mixRaster, mixToene } from "@/lib/ezarri/mixRaster";

const RATIOS = { "3/2": ["aspect-[3/2]", 33, 22], "1/1": ["aspect-square", 24, 24] };

/**
 * @param {{mix: {anteil:number, toene:[string, number][]}[], ratio?: "3/2"|"1/1", fuge?: string, className?: string}} props
 */
export default function MixKachel({ mix, ratio = "3/2", fuge = "#e9e6df", className }) {
  const [box, cols, rows] = RATIOS[ratio] ?? RATIOS["3/2"];
  const farben = mixRaster(mixToene(mix), cols * rows);
  return (
    <div className={cx("relative overflow-hidden bg-linen", box, className)} data-ez-mixkachel="">
      {farben.length > 0 && (
        <svg viewBox={`0 0 ${cols * 10} ${rows * 10}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
          <rect width={cols * 10} height={rows * 10} fill={fuge} />
          {farben.map((hex, i) => (
            <rect key={i} x={(i % cols) * 10 + 0.6} y={Math.floor(i / cols) * 10 + 0.6} width="8.8" height="8.8" fill={hex} />
          ))}
        </svg>
      )}
    </div>
  );
}
