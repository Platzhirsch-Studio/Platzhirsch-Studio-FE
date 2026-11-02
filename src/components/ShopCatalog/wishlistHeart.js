"use client";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { toWishlistItem } from "@/lib/shop/wishlistItem";
import { withFallback } from "@/components/ShopCatalog/copy";

// Same id rule as CartContext's generateCartItemId (not exported there).
const cartItemId = (item) => `${item.id}-${item.name}-${item.category || "default"}`;

// Design-Jury P1-1: the heart pops ONCE after a click that saves – never on
// load (aria-pressed flips during hydration). The button carries
// data-just-saved for the 240 ms of the pop (globals.css [data-just-saved]).
export function markJustSaved(el) {
  if (!el || typeof el.setAttribute !== "function") return;
  el.setAttribute("data-just-saved", "");
  setTimeout(() => el.removeAttribute("data-just-saved"), 240);
}

export function useWishlistToggle(item) {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const saved = cartItems.some((c) => cartItemId(c) === cartItemId(item));
  const toggle = (e) => {
    if (!saved) markJustSaved(e?.currentTarget);
    return saved ? removeFromCart(cartItemId(item)) : addToCart(item);
  };
  return { saved, toggle };
}

// Whole-collection variant: "saved" once every product is on the Merkliste;
// toggling adds the missing ones, or removes all of them when all are saved.
export function useWishlistCollectionToggle(items) {
  const { cartItems, addManyToCart, removeManyFromCart } = useCart();
  const savedIds = new Set(cartItems.map(cartItemId));
  const saved = items.length > 0 && items.every((item) => savedIds.has(cartItemId(item)));
  const toggle = (e) => {
    if (!saved) markJustSaved(e?.currentTarget);
    return saved ? removeManyFromCart(items) : addManyToCart(items);
  };
  return { saved, toggle };
}

// Heart button overlaid on a product tile image (top-right). Must sit
// outside the tile's <Link> (a <button> inside an <a> is invalid HTML), so
// the tile needs `relative` and this goes next to the image link.
// Neuauftritt: square 44 px target on paper (no radius), ink heart; saved =
// filled ink (brass never on a light surface, Bibel §4). Also used by
// MarkenItems/collectionDetail and the home product strip – API unchanged.
// Name (QA P2-4, WCAG 2.5.3): "Merken: {Marke Name}" – the same verb as the
// visible "Merken" button – and the state via aria-pressed, so the name stays
// stable. `corner`: flush in the image corner (catalogue tile, P2-5).
export default function WishlistHeart({ product, className = "", corner = false }) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const tc = withFallback(t, locale, "shop");
  const { saved, toggle } = useWishlistToggle(toWishlistItem(product));
  const itemName = [product?.brand, product?.name].filter(Boolean).join(" ");
  const label = itemName ? tc("catalog.saveItem", { name: itemName }) : t("saveToWishlist");

  // QM wm-r4: a fixed 44 px square (target size) – in rem it doubled with
  // 200 % text size and covered a quarter of the tile photo.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? t("savedToWishlist") : t("saveToWishlist")}
      className={`absolute z-10 flex size-[44px] items-center justify-center bg-paper/90 text-ink transition-colors duration-(--duration-micro) hover:bg-paper ${corner ? "right-0 top-0" : "right-3 top-3"} ${className}`}
    >
      <Heart
        size={18}
        strokeWidth={1.5}
        aria-hidden="true"
        className={`ph-heart ${saved ? "fill-ink" : "fill-ink/0"}`}
      />
    </button>
  );
}
