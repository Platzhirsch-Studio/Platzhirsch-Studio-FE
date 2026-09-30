"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlistCollectionToggle } from "@/components/ShopCatalog/wishlistHeart";

const AUTO_ADVANCE_MS = 5000;

// Heart on the featured image: adds all of the collection's products to the
// Merkliste, or removes them again once they're all saved. `items` are
// Merkliste entries (toWishlistItem()).
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
      className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white sm:right-6 sm:top-6"
    >
      <Heart
        size={20}
        strokeWidth={1.75}
        className={`transition-colors duration-300 ${saved ? "fill-[#d1b250] text-[#d1b250]" : "text-[#30373e]"}`}
      />
    </button>
  );
};

// "More from this collection" — an editorial index instead of a row of
// uniform cards: one large featured image on the left crossfades between
// items, a numbered list on the right drives it (hover/click/focus jumps
// straight to that item), and it auto-advances on its own every 5s, pausing
// while the pointer is anywhere over the section. No carousel library here
// on purpose — every item is just always in the DOM (opacity-swapped), so
// there's no slidesToShow/breakpoint math, no scrollbar, nothing to sync.
const CollectionSlider = ({ title, items, locale }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!items || items.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [items, paused]);

  if (!items || items.length === 0) return null;

  const current = items[active] || items[0];

  return (
    <div className="w-full">
      {title && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="mb-8 text-xl font-light text-[#30373e]">{title}</h2>
        </div>
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative min-h-[420px] w-full overflow-hidden bg-gray-100 lg:min-h-[600px]">
          {items.map((item, i) => (
            <Image
              key={item.id || i}
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={`object-cover transition-opacity duration-700 ease-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
              priority={i === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {current.href ? (
            <Link href={current.href} locale={locale} className="absolute inset-0" aria-label={current.name} />
          ) : null}
          {/* Saves every product of the shown collection to the Merkliste */}
          {current.wishlistItems?.length > 0 && (
            <CollectionHeart key={current.id} name={current.name} items={current.wishlistItems} />
          )}
          <div className="pointer-events-none absolute bottom-0 left-0 p-6 sm:p-8">
            {current.tag && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#d1b250]">{current.tag}</p>
            )}
            <p className="mt-2 text-2xl font-light text-white sm:text-3xl">{current.name}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-[#30373e] px-6 py-6 sm:px-10 sm:py-10">
          <ul>
            {items.map((item, i) => (
              <li key={item.id || i} className="border-b border-white/10 last:border-b-0">
                <Link
                  href={item.href || "#"}
                  locale={locale}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  aria-current={i === active}
                  className="flex w-full items-center gap-4 py-4 text-left"
                >
                  <span
                    className={`text-xs font-semibold tabular-nums transition-colors ${
                      i === active ? "text-[#d1b250]" : "text-white/30"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex-1 transition-colors ${
                      i === active ? "text-base font-medium text-white" : "text-base text-white/45"
                    }`}
                  >
                    {item.name}
                  </span>
                  <ArrowUpRight
                    size={16}
                    className={`shrink-0 text-[#d1b250] transition-opacity ${i === active ? "opacity-100" : "opacity-0"}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CollectionSlider;
