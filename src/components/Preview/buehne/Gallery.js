"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s from "./buehne.module.css";

// Product gallery: Embla main track + thumbnail strip. The first slide is in
// the SSR HTML (preloaded, LCP); Embla only adds swipe/drag after hydration.
// Keyboard: arrow keys on the focused gallery, buttons are real <button>s.
export default function Gallery({ images, name }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: images.length > 1, duration: 28 });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    // Respect reduced motion: jump instead of gliding.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) embla.reInit({ duration: 0 });
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const go = useCallback((i) => embla?.scrollTo(i), [embla]);
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  if (!images.length) return null;

  return (
    <div
      role="region"
      aria-roledescription="Karussell"
      aria-label={`Bilder ${name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      <div className={s.embla} ref={emblaRef}>
        <div className={s.emblaTrack}>
          {images.map((src, i) => (
            <div
              key={src}
              className={s.emblaSlide}
              role="group"
              aria-roledescription="Bild"
              aria-label={`${i + 1} von ${images.length}`}
              aria-hidden={i !== index ? "true" : undefined}
            >
              <Image
                src={src}
                alt={i === 0 ? `${name}, Hauptansicht` : `${name}, Ansicht ${i + 1}`}
                fill
                sizes="(min-width: 64rem) 58vw, 100vw"
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
                loading={i === 0 ? undefined : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <>
          <div className={s.galleryControls}>
            <button type="button" className={s.iconBtn} onClick={prev} aria-label="Vorheriges Bild">
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <p aria-live="polite">
              {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </p>
            <button type="button" className={s.iconBtn} onClick={next} aria-label="Nächstes Bild">
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className={s.thumbs}>
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={s.thumb}
                onClick={() => go(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                aria-current={i === index ? "true" : undefined}
              >
                <Image src={src} alt="" fill sizes="88px" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
