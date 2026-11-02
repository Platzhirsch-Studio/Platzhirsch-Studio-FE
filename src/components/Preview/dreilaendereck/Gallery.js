"use client";
// Produktgalerie: Embla 8 (MIT, ~7 kB) mit Thumbnail-Leiste – laut Bauplan 02
// die einzige JS-Bewegung auf der Produktseite. Das erste Bild wird mit
// preload gerendert (LCP), alle weiteren lazy. Tastatur: Pfeil-Buttons,
// Thumbnails als Buttons mit aria-current. Bei reduced motion springt Embla
// ohne Gleitanimation (duration 0).
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s from "./dl.module.css";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Gallery({ images, name }) {
  const [reduced] = useState(prefersReducedMotion);
  const [viewportRef, embla] = useEmblaCarousel({ loop: false, duration: reduced ? 0 : 24 });
  const [index, setIndex] = useState(0);
  const count = images.length;

  const onSelect = useCallback(() => {
    if (embla) setIndex(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  if (!count) return null;

  return (
    <div className={s.gallery} role="region" aria-roledescription="Bildergalerie" aria-label={`Bilder von ${name}`}>
      <div className={s.galleryViewport} ref={viewportRef}>
        <div className={s.galleryContainer}>
          {images.map((src, i) => (
            <div
              key={src}
              className={s.gallerySlide}
              role="group"
              aria-roledescription="Bild"
              aria-label={`${i + 1} von ${count}`}
              aria-hidden={i !== index ? "true" : undefined}
            >
              <Image
                src={src}
                alt={`${name}, Ansicht ${i + 1}`}
                fill
                sizes="(min-width: 1000px) 56vw, 100vw"
                preload={i === 0}
                loading={i === 0 ? undefined : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={s.galleryBar}>
        <span className={`${s.small} ${s.num}`} aria-live="polite">
          Bild {index + 1} / {count}
        </span>
        <div className={s.galleryBtns}>
          <button type="button" onClick={() => embla?.scrollPrev()} disabled={index === 0} aria-label="Vorheriges Bild">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} disabled={index === count - 1} aria-label="Nächstes Bild">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul className={s.thumbs} aria-label="Bild auswählen">
        {images.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-current={i === index ? "true" : undefined}
              aria-label={`Bild ${i + 1} anzeigen`}
            >
              <Image src={src} alt="" fill sizes="84px" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
