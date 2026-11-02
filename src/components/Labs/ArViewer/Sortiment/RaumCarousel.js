"use client";
// „Jetzt im Raum ansehen“ (QA R1 P2-1): horizontale Reihe mit Produkten der Stufen 1–2b
// direkt unter der Suche. Embla, wischbar; Pfeile ab md. Bilder lazy, die ersten eager.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StageBadge from "./StageBadge";
import CardImage from "./CardImage";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function RaumCarousel({ items, total, partial = false }) {
  const [ref, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [edge, setEdge] = useState({ prev: false, next: true });
  const update = useCallback(() => embla && setEdge({ prev: embla.canScrollPrev(), next: embla.canScrollNext() }), [embla]);
  useEffect(() => {
    if (!embla) return undefined;
    // Startzustand (zurück aus, weiter an) passt; Embla meldet Änderungen per Ereignis.
    embla.on("select", update).on("reInit", update).on("scroll", update);
    return () => embla.off("select", update).off("reInit", update).off("scroll", update);
  }, [embla, update]);

  if (!items.length) return null;
  return (
    <section aria-labelledby="arv-raum-titel" className="mt-6 md:mt-8" data-testid="arv-raum-reihe">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="arv-raum-titel" className="text-title text-text">
            Platzbedarf im eigenen Raum
          </h2>
          {/* R2 neuland P1-1: ehrlich – meist Grundfläche und Höhe als Quader, nicht die Form */}
          <p className="mt-0.5 text-small text-text-soft">
            {total != null
              ? `${partial ? "mind. " : ""}${total.toLocaleString("de-AT")} Stücke mit Grundfläche und Höhe in Originalgröße für Ihren Raum.`
              : "Stücke mit Grundfläche und Höhe in Originalgröße für Ihren Raum."}
          </p>
        </div>
        <div className="hidden gap-1 md:flex">
          <button type="button" onClick={() => embla?.scrollPrev()} disabled={!edge.prev} aria-label="Zurück" className={`grid h-11 w-11 place-items-center border border-line-strong disabled:opacity-40 ${FOCUS}`}>
            <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} disabled={!edge.next} aria-label="Weiter" className={`grid h-11 w-11 place-items-center border border-line-strong disabled:opacity-40 ${FOCUS}`}>
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="-mx-5 mt-4 overflow-hidden px-5 md:mx-0 md:px-0" ref={ref}>
        <ul className="flex touch-pan-y gap-3 md:gap-4">
          {items.map((p, i) => (
            <li key={p.id} className="group relative min-w-0 flex-[0_0_42%] sm:flex-[0_0_28%] lg:flex-[0_0_18%]">
              <div className="relative aspect-square overflow-hidden bg-surface-raised">
                <CardImage src={p.image} fallback={p.posterRaum} cutout={p.imageCutout} alt="" name={`${p.brand} ${p.name}`} sizes="(min-width: 1024px) 220px, 42vw" eager={i < 3} />
                <div className="absolute left-2 top-2">
                  <StageBadge stufe={p.stufe} />
                </div>
              </div>
              <p className="mt-2 text-overline uppercase text-text-soft">{p.brand}</p>
              <h3 className="text-small font-medium text-text">
                <Link href={`/de/3d-ansicht/${p.id}`} prefetch={false} className={`ph-stretched ${FOCUS}`}>
                  {p.name}
                </Link>
              </h3>
              {p.masse && (
                <p className="text-small tabular-nums text-text-soft">
                  {p.masse.w} × {p.masse.d} × {p.masse.h} cm
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
