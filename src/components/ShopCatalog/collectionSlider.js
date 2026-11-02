"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import TileImage from "@/components/ShopCatalog/tileImage";
import { IMAGE_HOVER } from "@/components/ShopCatalog/motion";
import { useDelegatedNavigation } from "@/components/Reusable/LinkDelegate";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import { useWishlistCollectionToggle } from "@/components/ShopCatalog/wishlistHeart";
import { withFallback } from "@/components/ShopCatalog/copy";

// Heart on a collection card: saves all of the collection's products to the
// Merkliste, or removes them again once they're all saved.
const CollectionHeart = ({ name, items }) => {
  const t = useTranslations("shop");
  const { saved, toggle } = useWishlistCollectionToggle(items);
  const label = saved
    ? t("removeCollectionFromWishlistAria", { collection: name })
    : t("addCollectionToWishlistAria", { collection: name, count: items.length });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center bg-paper/90 text-ink transition-colors duration-(--duration-micro) hover:bg-paper"
    >
      <Heart aria-hidden="true" size={18} strokeWidth={1.5} className={`ph-heart ${saved ? "fill-ink" : "fill-ink/0"}`} />
    </button>
  );
};

const ICON_BTN =
  "ph-press inline-flex size-11 items-center justify-center border border-line-control text-text transition-colors duration-(--duration-micro) hover:bg-ink/5 disabled:opacity-40";

// The brand's collections on the product page: a quiet row of 3:2 cards (no
// autoplay – Bibel §8 / WCAG 2.2.2), name and count BELOW the picture,
// prev/next buttons. Replaces the auto-advancing dark index panel.
// R6-produkt-perf: native scroll-snap row instead of Embla (no engine that
// measures and wires every slide during hydration, same as the gallery in
// R5); the buttons scroll by one card, their disabled state follows the
// scroll position. Pictures are plain <img> (tileImage.js), the names plain
// <a> with one delegated listener for client navigation.
// Reduced motion: the buttons jump instead of gliding.
function prefersReducedMotion() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced"
  );
}

const CollectionSlider = ({ eyebrow, title, items }) => {
  const locale = useLocale();
  const tc = withFallback(useTranslations("shop"), locale, "shop");
  const delegate = useDelegatedNavigation();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const width = card ? card.getBoundingClientRect().width : el.clientWidth;
    el.scrollBy({ left: dir * width, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <Container>
      <section aria-labelledby="collections-title" className="border-t border-line py-section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {eyebrow && <Eyebrow className="mb-stack-s">{eyebrow}</Eyebrow>}
            <Heading id="collections-title" level={2} size="display-m">
              {title}
            </Heading>
          </div>
          {items.length > 1 && (
            <div className="flex gap-2">
              <button type="button" className={ICON_BTN} onClick={() => step(-1)} disabled={!canPrev} aria-label={tc("atelier.prevCollection")}>
                <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
              <button type="button" className={ICON_BTN} onClick={() => step(1)} disabled={!canNext} aria-label={tc("atelier.nextCollection")}>
                <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-10">
          <ul
            ref={trackRef}
            onScroll={update}
            {...delegate}
            className="scrollbar-hide -ml-grid flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {items.map((item, i) => (
              <li key={item.id || i} className="min-w-0 shrink-0 grow-0 basis-[85%] snap-start pl-grid sm:basis-1/2 lg:basis-1/3">
                <article className="group relative">
                  <div className="relative aspect-[3/2] overflow-hidden bg-linen">
                    <TileImage
                      src={item.image}
                      alt=""
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 85vw"
                      className={`object-cover ${IMAGE_HOVER}`}
                    />
                    {item.wishlistItems?.length > 0 && <CollectionHeart name={item.name} items={item.wishlistItems} />}
                  </div>
                  <h3 className="mt-4 text-title text-text">
                    {item.href ? (
                      <a
                        href={`/${locale}${item.href}`}
                        className="ph-stretched underline decoration-transparent underline-offset-4 group-hover:decoration-current"
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </h3>
                  {item.tag && <p className="tabular mt-1 text-small text-text-soft">{item.tag}</p>}
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Container>
  );
};

export default CollectionSlider;
