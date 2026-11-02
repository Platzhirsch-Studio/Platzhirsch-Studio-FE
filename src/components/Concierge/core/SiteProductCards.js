"use client";

// Product cards inside an answer (sitewide): image, brand, name, category, and
// two direct actions of the visitor – "Öffnen" (link) and "Merken" (selection,
// toggles). These are the visitor's own clicks, not model proposals.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toWishlistItem } from "@/lib/shop/wishlistItem";
import { fill } from "./texts";
import s from "../panel.module.css";

// Card href "/fr/produits/<category>/<slug>" → Merkliste entry (German form).
function itemOf(p) {
  const [category, slug] = String(p.href || "").split("/").slice(-2);
  return toWishlistItem({
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryKey: category,
    url_slug: slug,
    image: p.image,
    href: `/produkte/${category}/${slug}`,
  });
}

export default function SiteProductCards({ items, t }) {
  const rowRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const { cartItems, addManyToCart, removeManyFromCart } = useCart();

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const start = el.scrollLeft < 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 12 : 180;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: smooth ? "smooth" : "auto" });
  };

  if (!items?.length) return null;
  return (
    <div className={s.cardsWrap} data-start={edge.start} data-end={edge.end}>
      <ul ref={rowRef} className={s.cards} aria-label={fill(t.products, { n: items.length })} onScroll={measure}>
        {items.map((p) => {
          const saved = cartItems.some((c) => c.id === p.id);
          return (
            <li key={p.id} className={s.card}>
              <Link href={p.href} className={s.cardLink}>
                <span className={s.cardImage}>
                  {p.image ? (
                    <Image src={p.image} alt="" width={320} height={400} sizes="160px" quality={75} />
                  ) : (
                    <span className={s.cardNoImage}>{t.noImage}</span>
                  )}
                </span>
                {p.brand && <span className={s.cardBrand}>{p.brand}</span>}
                <span className={s.cardName}>{p.name}</span>
                {p.category && <span className={s.cardCat}>{p.category}</span>}
              </Link>
              <div className={s.cardActions}>
                <Link href={p.href} className={s.cardBtn} aria-label={`${t.open}: ${p.brand ? `${p.brand} ` : ""}${p.name}`}>
                  {t.open}
                </Link>
                <button
                  type="button"
                  className={s.cardBtn}
                  aria-pressed={saved}
                  aria-label={`${t.save}: ${p.brand ? `${p.brand} ` : ""}${p.name}`}
                  onClick={() => (saved ? removeManyFromCart([itemOf(p)]) : addManyToCart([itemOf(p)]))}
                >
                  {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                  {saved ? t.isSaved : t.save}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {!(edge.start && edge.end) && (
        <>
          <button type="button" className={`${s.cardNav} ${s.cardPrev}`} onClick={() => page(-1)} disabled={edge.start} aria-label={t.prev}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" className={`${s.cardNav} ${s.cardNext}`} onClick={() => page(1)} disabled={edge.end} aria-label={t.next}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
