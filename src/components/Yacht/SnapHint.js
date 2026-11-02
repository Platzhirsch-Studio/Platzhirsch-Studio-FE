// Sichtbarer Wisch-Hinweis unter einer mobilen Scroll-Snap-Reihe (QM r1 ezarri-yacht:
// angeschnittene Spalten ohne Hinweis wirkten wie ein Layoutfehler). Nur unter dem
// Breakpoint, in dem die Reihe scrollt; aria-hidden, weil die Reihe selbst benannt ist.
// QM r2: bei 200 % Text (Container < 20 rem) stapeln die Reihen – dann kein Hinweis.
// Bewegungsfrei (kein Animieren des Pfeils). Server-Komponente.
import { ArrowRight } from "@/components/ui/icons";

const HIDE = { sm: "sm:hidden", md: "md:hidden" };

export default function SnapHint({ label, bp = "sm", className = "" }) {
  return (
    <div className={`@container/sh ${HIDE[bp] ?? HIDE.sm}`}>
      <p aria-hidden="true" className={`mt-3 flex items-center gap-2 text-small text-text-soft @max-xs/sh:hidden ${className}`} data-yacht-snap-hint="">
        <span>{label}</span>
        <ArrowRight className="size-4 shrink-0" strokeWidth={1.5} />
      </p>
    </div>
  );
}
