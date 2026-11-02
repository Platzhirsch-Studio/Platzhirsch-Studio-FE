"use client";
// Phone carousel of the Navetta 42 reference (< 768 px), same pattern as the
// worlds carousel: Embla, one photo per slide, credit under every photo.
// Controls sit LEFT, the counter right – the concierge launcher (bottom
// right) must never cover a focused control (WCAG 2.2, 2.4.11).
// Images unchanged (NavettaFigure: object-contain in their own ratio).
// Tempo (30.10.2026): Embla loads as its own chunk (EmblaBinder) once the
// carousel is within 600 px of the screen – the chapter sits far below the
// first screen and is hidden from 768 px, so Embla never runs before the LCP
// (and never on desktop). Until then the slides stand as server markup, as
// they did before hydration.
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";
import NavettaFigure from "./NavettaFigure";

const EmblaBinder = dynamic(() => import("./EmblaBinder"), { ssr: false, loading: () => null });
const OPTIONS = { align: "start", containScroll: "trimSnaps" };

export default function NavettaCarousel({ images, credit, tone = "light" }) {
  const ctl = tone === "dark" ? "border-line-inverse text-text-inverse" : "border-line-control text-text";
  const t = yachtUi(useLocale());
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [api, setApi] = useState();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setNear(true);
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        setNear(true);
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!api) return;
    const on = () => setIndex(api.selectedScrollSnap());
    api.on("select", on);
    api.on("reInit", on);
    return () => {
      api.off("select", on);
      api.off("reInit", on);
    };
  }, [api]);
  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);
  return (
    <div role="region" aria-roledescription={t.carousel} aria-label={t.carouselLabel}>
      {near && <EmblaBinder viewport={ref} options={OPTIONS} onApi={setApi} />}
      <div ref={ref} className="-mx-gutter overflow-hidden">
        <ol className="flex touch-pan-y">
          {images.map((img, i) => (
            <li key={img.file} aria-roledescription={t.slide} aria-label={t.slideLabel(i + 1, images.length, img.title)} className="min-w-0 shrink-0 grow-0 basis-[88%] pl-gutter last:pr-gutter">
              <NavettaFigure img={img} credit={credit} tone={tone} sizes="88vw" priority={near} />{/* lazy bis 600 px vor dem Kapitel, dann eager (QM r1: Folgefotos der Snap-Reihe blieben beim Wischen leer) */}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button type="button" onClick={prev} disabled={index === 0} aria-label={t.prevPhoto} className={`inline-flex size-11 items-center justify-center border ${ctl} disabled:opacity-40`}>
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={next} disabled={index === images.length - 1} aria-label={t.nextPhoto} className={`inline-flex size-11 items-center justify-center border ${ctl} disabled:opacity-40`}>
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <p className={`text-small tabular ${tone === "dark" ? "text-text-inverse-soft" : "text-text-soft"}`} aria-live="polite">
          {index + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
