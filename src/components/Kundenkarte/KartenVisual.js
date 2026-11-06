// Karten-Visual der Kundenkarte – rein per CSS/SVG, kein Bild (Inhaber: keine
// KI-Bilder). Scheckkarten-Format 85,6 : 54 (aspect-[856/540]), Wortmarke in
// Bodoni, Stufe, Name „Max Muster“ als deutlich erkennbares Beispiel,
// QR-Platzhalter als deterministisches SVG-Muster (kein echter Code).
// Server-Komponente; Farben aus globals.css (paper/walnut/night + brass).
import { STUFEN } from "@/lib/kundenkarte/copy";

const SURFACE = {
  paper: { card: "bg-paper text-ink border border-line-strong", soft: "text-text-soft", rule: "bg-line-strong", qr: "#30373e", accent: "text-text-accent" },
  walnut: { card: "bg-walnut text-paper", soft: "text-text-inverse-soft", rule: "bg-line-inverse", qr: "#faf8f4", accent: "text-accent-on-dark" },
  night: { card: "bg-night text-paper", soft: "text-text-inverse-soft", rule: "bg-line-inverse", qr: "#faf8f4", accent: "text-accent-on-dark" },
};

// 21×21-Raster wie ein kleiner QR-Code: drei Suchmuster + Pseudozufall aus einer
// festen Zahlenfolge, damit Server und Client dasselbe zeichnen.
function qrCells(seed = 7) {
  const n = 21;
  const cells = [];
  let x = seed;
  const rnd = () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inFinder = (r, c) => {
    const rr = r < 7 ? r : r - (n - 7);
    const cc = c < 7 ? c : c - (n - 7);
    const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
    const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
    return edge || core;
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const on = finder(r, c) ? inFinder(r, c) : rnd() < 0.42;
      if (on) cells.push([r, c]);
    }
  }
  return cells;
}

function QrPlaceholder({ color }) {
  const cells = qrCells();
  return (
    <svg viewBox="0 0 21 21" aria-hidden="true" focusable="false" className="size-full" shapeRendering="crispEdges">
      {cells.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill={color} />
      ))}
    </svg>
  );
}

/**
 * @param {{stufe?: "platzhirsch"|"plus"|"prive", name?: string, nummer?: string, seit?: string,
 *          labels: {exampleBadge?: string, cardSince: string, cardNumberLabel: string}, example?: boolean, className?: string}} props
 */
export default function KartenVisual({ stufe = "plus", name = "Max Muster", nummer = "PH-2026-000001", seit = "2026", labels, example = true, className = "" }) {
  const tier = STUFEN.find((s) => s.key === stufe) || STUFEN[0];
  const s = SURFACE[tier.farbe] || SURFACE.paper;
  return (
    <div className={`relative [container-type:inline-size] ${className}`} data-kundenkarte-visual={tier.key}>
      <div className={`relative aspect-[856/540] w-full overflow-hidden rounded-[4.5%/7%] shadow-[0_24px_60px_-28px_rgb(31_37_43/0.45)] ${s.card}`}>
        {/* feine Fläche: diagonale Linie als Prägung */}
        <div aria-hidden="true" className={`absolute -right-[18%] top-[22%] h-px w-[70%] rotate-[-28deg] ${s.rule}`} />
        <div className="flex h-full flex-col justify-between p-[6%]">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-[clamp(1.1rem,5.2cqw,1.9rem)] leading-none tracking-tight">Platzhirsch</p>
            <p className={`text-[clamp(0.55rem,2.4cqw,0.8rem)] uppercase tracking-[0.18em] ${s.accent}`}>{tier.name}</p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-[clamp(0.5rem,2.1cqw,0.7rem)] uppercase tracking-[0.16em] ${s.soft}`}>{labels.cardNumberLabel}</p>
              <p className="mt-1 font-mono text-[clamp(0.7rem,3cqw,1rem)] tabular-nums">{nummer}</p>
              <p className="mt-3 truncate font-display text-[clamp(1rem,4.6cqw,1.6rem)] leading-tight">{name}</p>
              <p className={`text-[clamp(0.55rem,2.2cqw,0.75rem)] ${s.soft}`}>
                {labels.cardSince} {seit}
              </p>
            </div>
            <div className="w-[19%] shrink-0 bg-paper p-[1.2%]">
              <QrPlaceholder color="#1f252b" />
            </div>
          </div>
        </div>
      </div>
      {example && labels.exampleBadge && (
        <span className="absolute -top-3 left-5 bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper">{labels.exampleBadge}</span>
      )}
    </div>
  );
}
