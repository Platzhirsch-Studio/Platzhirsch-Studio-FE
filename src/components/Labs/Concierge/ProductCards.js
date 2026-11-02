"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s from "./concierge.module.css";

// Horizontal, scroll-snapping row of product cards inside an answer. The row
// scrolls on its own (touch swipe), the page never scrolls sideways. From
// 768 px, arrow buttons page through the row for mouse users.
export default function ProductCards({ items }) {
  const rowRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const start = el.scrollLeft < 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 12 : 180;
    const perView = Math.max(1, Math.floor(el.clientWidth / step) - 1);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step * perView, behavior: smooth ? "smooth" : "auto" });
  };

  if (!items?.length) return null;
  return (
    <div className={s.cardsWrap} data-start={edge.start} data-end={edge.end}>
      <ul ref={rowRef} className={s.cards} aria-label={`${items.length} Produkte aus dem Katalog`} onScroll={measure}>
        {items.map((p) => (
          <li key={p.id} className={s.card}>
            <Link href={p.href} className={s.cardLink}>
              <span className={s.cardImage}>
                {p.image ? (
                  <Image src={p.image} alt="" width={320} height={400} sizes="168px" quality={75} />
                ) : (
                  <span className={s.cardNoImage} aria-hidden="true">
                    Kein Bild
                  </span>
                )}
              </span>
              {p.brand && <span className={s.cardBrand}>{p.brand}</span>}
              <span className={s.cardName}>{p.name}</span>
              {p.category && <span className={s.cardCat}>{p.category}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {!(edge.start && edge.end) && (
        <>
          <button
            type="button"
            className={`${s.cardNav} ${s.cardPrev}`}
            onClick={() => page(-1)}
            disabled={edge.start}
            aria-label="Vorherige Produkte"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${s.cardNav} ${s.cardNext}`}
            onClick={() => page(1)}
            disabled={edge.end}
            aria-label="Weitere Produkte"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
